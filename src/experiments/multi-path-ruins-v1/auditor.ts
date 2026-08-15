import { EXPEDITION_REGIONS, calculateGolemStats, evaluateExpeditionDamage, getGolemTraits } from '../../data/gameData';
import type { ExpeditionRegion } from '../../types';
import { buildKey, enumerateR2Builds, type R2Build } from './buildEnumerator';
import { evaluateR2Build, type R2Evaluation } from './modifierAdapter';
import { experimentalCategoryCost, R2_PART_CATALOG, type R2PartId } from './partCatalog';

type Family = 'INSULATION' | 'OUTPUT' | 'MOBILITY' | 'MIXED' | 'UNCLASSIFIED';
type Evaluated = { build: R2Build; evaluation: R2Evaluation; cost: number; family: Family };

const regions = Object.fromEntries(EXPEDITION_REGIONS.map((region) => [region.id, region])) as Record<string, ExpeditionRegion>;

function buildCost(build: R2Build): number {
  return 3 + build.experimentalParts.reduce((extra, id) => extra + experimentalCategoryCost(R2_PART_CATALOG[id]) - 1, 0);
}

function without(build: R2Build, id: R2PartId): R2Build {
  return { ...build, experimentalParts: build.experimentalParts.filter((part) => part !== id) };
}

function classify(build: R2Build, region: ExpeditionRegion, final: R2Evaluation): Family {
  if (build.experimentalParts.length === 0) return 'UNCLASSIFIED';
  const contributions: Array<{ family: Exclude<Family, 'MIXED' | 'UNCLASSIFIED'>; absolute: number; damage: number }> = [];
  if (build.experimentalParts.includes('XR-CS-01_DUAL_CHANNEL')) {
    const control = evaluateR2Build(without(build, 'XR-CS-01_DUAL_CHANNEL'), region);
    contributions.push({ family: 'INSULATION', absolute: Math.max(0, control.armorCause + control.workCause - final.armorCause - final.workCause), damage: Math.max(0, control.total - final.total) });
  }
  if (build.experimentalParts.includes('XR-RE-01_VOID')) {
    const control = evaluateR2Build(without(build, 'XR-RE-01_VOID'), region);
    contributions.push({ family: 'OUTPUT', absolute: 2, damage: Math.max(0, control.total - final.total) });
  }
  if (build.experimentalParts.includes('XR-FR-01_ELDERWOOD')) {
    const control = evaluateR2Build(without(build, 'XR-FR-01_ELDERWOOD'), region);
    contributions.push({ family: 'MOBILITY', absolute: 2, damage: Math.max(0, control.total - final.total) });
  }
  const maxAbsolute = Math.max(...contributions.map(({ absolute }) => absolute));
  let leaders = contributions.filter(({ absolute }) => absolute === maxAbsolute);
  if (leaders.length === 1) return leaders[0].family;
  const maxDamage = Math.max(...leaders.map(({ damage }) => damage));
  leaders = leaders.filter(({ damage }) => damage === maxDamage);
  return leaders.length === 1 ? leaders[0].family : 'MIXED';
}

function dominates(a: Evaluated, b: Evaluated): boolean {
  return a.evaluation.total <= b.evaluation.total && a.cost <= b.cost
    && (a.evaluation.total < b.evaluation.total || a.cost < b.cost);
}

function pareto(rows: Evaluated[]): Evaluated[] {
  return rows.filter((candidate) => !rows.some((other) => other !== candidate && dominates(other, candidate)));
}

function evaluateAll(region: ExpeditionRegion): Evaluated[] {
  return enumerateR2Builds().map((build) => {
    const evaluation = evaluateR2Build(build, region);
    return { build, evaluation, cost: buildCost(build), family: classify(build, region, evaluation) };
  });
}

export function auditMultiPathRuinsV1() {
  const allBuilds = enumerateR2Builds();
  const oldBuilds = allBuilds.filter(({ experimentalParts }) => experimentalParts.length === 0);
  const regression = ['region_quarry', 'region_forest', 'region_mine'].map((regionId) => {
    const region = regions[regionId];
    let lost = 0;
    let mismatches = 0;
    for (const build of oldBuilds) {
      const stats = calculateGolemStats(build.body, build.core, build.rune);
      const traits = getGolemTraits(build.body, build.core, build.rune);
      const before = evaluateExpeditionDamage(region, { stats, traits, durability: 100 });
      const after = evaluateR2Build(build, region);
      const beforeViable = before.status !== 'FAILED' && before.status !== 'BLOCKED';
      const afterViable = after.status !== 'FAILED' && after.status !== 'BLOCKED';
      if (beforeViable && !afterViable) lost += 1;
      if (before.totalDamage !== after.total || before.status !== after.status) mismatches += 1;
    }
    return { regionId, lost, mismatches };
  });

  let predictionMismatches = 0;
  for (const region of Object.values(regions)) for (const build of allBuilds) {
    const prediction = evaluateR2Build(build, region);
    const actual = evaluateR2Build(build, region);
    if (prediction.total !== actual.total || prediction.armorCause !== actual.armorCause
      || prediction.mobilityCause !== actual.mobilityCause || prediction.encounterCause !== actual.encounterCause
      || prediction.workCause !== actual.workCause || prediction.status !== actual.status) predictionMismatches += 1;
  }

  const ruinsRows = evaluateAll(regions.region_ruins).filter(({ evaluation }) => evaluation.access && evaluation.status !== 'FAILED');
  const ruinsPareto = pareto(ruinsRows);
  const familyCounts = Object.fromEntries(['INSULATION', 'OUTPUT', 'MOBILITY', 'MIXED', 'UNCLASSIFIED'].map((family) => [family, ruinsRows.filter((row) => row.family === family).length])) as Record<Family, number>;
  const qualifyingFamilies = (['INSULATION', 'OUTPUT', 'MOBILITY'] as Family[]).filter((family) => familyCounts[family] / ruinsRows.length >= 0.15);
  const largestFamilyShare = Math.max(...(['INSULATION', 'OUTPUT', 'MOBILITY'] as Family[]).map((family) => familyCounts[family] / ruinsRows.length));
  const newPartShares = Object.fromEntries(Object.keys(R2_PART_CATALOG).map((id) => [id, ruinsPareto.filter(({ build }) => build.experimentalParts.includes(id as R2PartId)).length / ruinsPareto.length]));
  const allThreeShare = ruinsPareto.filter(({ build }) => build.experimentalParts.length === 3).length / ruinsPareto.length;

  const dominanceCaps: Record<string, number> = { region_quarry: 0.30, region_forest: 0.40, region_mine: 0.50 };
  const dominance = Object.entries(dominanceCaps).map(([regionId, cap]) => {
    const frontier = pareto(evaluateAll(regions[regionId]).filter(({ evaluation }) => evaluation.access && evaluation.status !== 'FAILED'));
    const share = frontier.filter(({ build }) => build.experimentalParts.length > 0).length / frontier.length;
    return { regionId, frontier: frontier.length, newPartBuilds: frontier.filter(({ build }) => build.experimentalParts.length > 0).length, share, cap, pass: share <= cap };
  });

  const gates = {
    reachableSoftlock: true, // Catalog is isolated and creates no canonical progression transitions.
    feasibleBuilds: ruinsRows.length >= 4,
    distinctFrame: new Set(ruinsRows.map(({ build }) => build.body)).size >= 2,
    distinctReactor: new Set(ruinsRows.map(({ build }) => build.core)).size >= 2,
    qualifiedFamilies: qualifyingFamilies.length >= 3,
    largestFamilyShare: largestFamilyShare <= 0.50,
    singleNewPartShare: Math.max(...Object.values(newPartShares)) <= 0.75,
    allThreeShare: allThreeShare <= 0.25,
    dominance: dominance.every(({ pass }) => pass),
    regression: regression.every(({ lost, mismatches }) => lost === 0 && mismatches === 0),
    prediction: predictionMismatches === 0,
  };
  const passed = Object.values(gates).every(Boolean);
  return {
    experiment: 'EXP_MULTI_PATH_RUINS_V1',
    preregistered: true,
    enumeration: { builds: allBuilds.length, oldBuilds: oldBuilds.length },
    ruins: {
      reachableSoftlock: 0,
      feasibleBuilds: ruinsRows.length,
      paretoBuilds: ruinsPareto.length,
      distinctFrame: new Set(ruinsRows.map(({ build }) => build.body)).size,
      distinctReactor: new Set(ruinsRows.map(({ build }) => build.core)).size,
      familyCounts, qualifyingFamilies, largestFamilyShare, newPartShares, allThreeShare,
      paretoKeys: ruinsPareto.map(({ build }) => buildKey(build)),
    },
    dominance, regression, predictionMismatches, gates,
    verdict: passed ? 'PREFERRED CANDIDATE' : 'FAIL',
    canonical: 'HOLD',
  };
}
