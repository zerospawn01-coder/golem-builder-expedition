import {
  BODIES,
  CORES,
  DEFAULT_INVENTORY,
  EXPEDITION_REGIONS,
  RUNES,
  calculateGolemStats,
  generateGolemName,
  getGolemTraits,
  runExpeditionSimulation,
} from '../src/data/gameData';
import type { BodyType, CoreType, ExpeditionRegion, Golem, MaterialCategory, RuneType, TraitType } from '../src/types';

type PartKey = `${MaterialCategory}:${string}`;

interface BuildAudit {
  key: string;
  body: BodyType;
  core: CoreType;
  rune: RuneType;
  traits: TraitType[];
  stats: ReturnType<typeof calculateGolemStats>;
  damage: number;
  access: boolean;
  survives: boolean;
  status: string;
}

function key(category: MaterialCategory, id: string): PartKey {
  return `${category}:${id}`;
}

function createGolem(body: BodyType, core: CoreType, rune: RuneType): Golem {
  return {
    id: `${body}-${core}-${rune}`,
    name: generateGolemName(body, core, rune),
    body,
    core,
    rune,
    stats: calculateGolemStats(body, core, rune),
    traits: getGolemTraits(body, core, rune),
    createdAt: 0,
    expeditionsCount: 0,
    durability: 100,
  };
}

const allBuilds = (Object.keys(BODIES) as BodyType[]).flatMap((body) =>
  (Object.keys(CORES) as CoreType[]).flatMap((core) =>
    (Object.keys(RUNES) as RuneType[]).map((rune) => createGolem(body, core, rune)),
  ),
);

function auditRegion(region: ExpeditionRegion): BuildAudit[] {
  return allBuilds.map((golem) => {
    const access = !region.accessTrait || golem.traits.includes(region.accessTrait);
    const report = runExpeditionSimulation(region, golem, () => 0);
    return {
      key: golem.id,
      body: golem.body,
      core: golem.core,
      rune: golem.rune,
      traits: golem.traits,
      stats: golem.stats,
      damage: report.totalDamage,
      access,
      survives: access && report.status !== 'FAILED',
      status: report.status,
    };
  });
}

function initialParts(): Set<PartKey> {
  const available = new Set<PartKey>();
  for (const [id, count] of Object.entries(DEFAULT_INVENTORY.body)) if (count > 0) available.add(key('body', id));
  for (const [id, count] of Object.entries(DEFAULT_INVENTORY.core)) if (count > 0) available.add(key('core', id));
  for (const [id, count] of Object.entries(DEFAULT_INVENTORY.rune)) if (count > 0) available.add(key('rune', id));
  return available;
}

function buildIsCraftable(build: Golem, parts: Set<PartKey>): boolean {
  return parts.has(key('body', build.body))
    && parts.has(key('core', build.core))
    && parts.has(key('rune', build.rune));
}

function progressionClosure(regionAudits: Map<string, BuildAudit[]>) {
  const parts = initialParts();
  const reachableRegions = new Set<string>();
  const steps: Array<{ iteration: number; regions: string[]; newParts: PartKey[] }> = [];
  let changed = true;
  let iteration = 0;
  while (changed) {
    changed = false;
    iteration += 1;
    const newRegions: string[] = [];
    const newParts: PartKey[] = [];
    for (const region of EXPEDITION_REGIONS) {
      if (reachableRegions.has(region.id)) continue;
      const feasible = (regionAudits.get(region.id) ?? []).some((result) => {
        const build = allBuilds.find((candidate) => candidate.id === result.key);
        return result.survives && !!build && buildIsCraftable(build, parts);
      });
      if (!feasible) continue;
      reachableRegions.add(region.id);
      newRegions.push(region.id);
      changed = true;
      for (const loot of region.possibleLoot) {
        const part = key(loot.category, loot.id);
        if (!parts.has(part)) {
          parts.add(part);
          newParts.push(part);
        }
      }
    }
    if (newRegions.length > 0 || newParts.length > 0) steps.push({ iteration, regions: newRegions, newParts });
  }
  return { parts, reachableRegions, steps };
}

function allPartKeys(): PartKey[] {
  return [
    ...(Object.keys(BODIES) as BodyType[]).map((id) => key('body', id)),
    ...(Object.keys(CORES) as CoreType[]).map((id) => key('core', id)),
    ...(Object.keys(RUNES) as RuneType[]).map((id) => key('rune', id)),
  ];
}

const regionAudits = new Map(EXPEDITION_REGIONS.map((region) => [region.id, auditRegion(region)]));
const progression = progressionClosure(regionAudits);
const feasiblePartUsage = new Set<PartKey>();
for (const results of regionAudits.values()) {
  for (const result of results.filter((candidate) => candidate.survives)) {
    feasiblePartUsage.add(key('body', result.body));
    feasiblePartUsage.add(key('core', result.core));
    feasiblePartUsage.add(key('rune', result.rune));
  }
}

const regions = EXPEDITION_REGIONS.map((region) => {
  const results = regionAudits.get(region.id) ?? [];
  const feasible = results.filter((result) => result.survives);
  return {
    id: region.id,
    name: region.name,
    totalBuilds: results.length,
    accessBuilds: results.filter((result) => result.access).length,
    feasibleBuilds: feasible.length,
    classification: feasible.length === 0 ? 'BROKEN' : feasible.length === 1 ? 'FIXED_SOLUTION' : feasible.length >= results.length * 0.8 ? 'TRIVIAL' : 'CHOICE_EXISTS',
    feasible,
  };
});

const unreachableRegions = EXPEDITION_REGIONS.filter((region) => !progression.reachableRegions.has(region.id)).map((region) => region.id);
const unobtainableParts = allPartKeys().filter((part) => !progression.parts.has(part));
const deadPartCandidates = allPartKeys().filter((part) => !feasiblePartUsage.has(part));
const recoveryRisks = [{
  id: 'all_golems_disabled_without_matching_body_material',
  possible: true,
  reason: '修理には対象BODY素材が必要。全機体が派遣不能かつ対応BODY在庫0の状態では、素材獲得行動を開始できない。',
  classification: 'POTENTIAL_SOFTLOCK',
}];

const output = {
  version: '2.0.0',
  buildSpace: allBuilds.length,
  regions,
  progression: {
    steps: progression.steps,
    reachableRegions: [...progression.reachableRegions],
    unreachableRegions,
    obtainableParts: [...progression.parts].sort(),
    unobtainableParts,
    hasProgressionDeadlock: unreachableRegions.length > 0,
  },
  deadPartCandidates,
  recoveryRisks,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(output, null, 2));
} else {
  console.log(`GOLEM BUILDER v2.0.0 RULE AUDIT — ${allBuilds.length} legal builds`);
  for (const region of regions) {
    console.log(`${region.name}: feasible ${region.feasibleBuilds}/${region.totalBuilds}, access ${region.accessBuilds}/${region.totalBuilds} [${region.classification}]`);
    if (region.feasibleBuilds > 0 && region.feasibleBuilds <= 5) {
      for (const build of region.feasible) console.log(`  ${build.key}: damage ${build.damage}, traits ${build.traits.join(',') || '-'}`);
    }
  }
  console.log(`\nProgression reachable: ${[...progression.reachableRegions].join(', ') || 'none'}`);
  console.log(`Progression blocked: ${unreachableRegions.join(', ') || 'none'}`);
  console.log(`Unobtainable parts: ${unobtainableParts.join(', ') || 'none'}`);
  console.log(`Dead part candidates: ${deadPartCandidates.join(', ') || 'none'}`);
  for (const risk of recoveryRisks) console.log(`Recovery risk: ${risk.classification} — ${risk.reason}`);
}

if (regions.some((region) => region.classification === 'BROKEN') || unreachableRegions.length > 0) {
  process.exitCode = 2;
}
