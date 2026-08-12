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
import { parseVariant, regionsFor, simulationExperiment, traitsFor, VARIANT_DESCRIPTIONS } from './experiment-variants';

const variant = parseVariant();
const experimentRegions = regionsFor(variant);

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

type DamageBand = 'SAFE' | 'DAMAGED' | 'PARTIAL' | 'FAILED';

interface SearchGolem {
  body: BodyType;
  core: CoreType;
  rune: RuneType;
  durability: number;
  starter: boolean;
}

interface SearchState {
  inventory: {
    body: Record<BodyType, number>;
    core: Record<CoreType, number>;
    rune: Record<RuneType, number>;
  };
  golems: SearchGolem[];
  path: string[];
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
    traits: traitsFor(variant, body, core, rune),
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
    const report = runExpeditionSimulation(region, golem, () => 0, simulationExperiment(variant, region));
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

function damageBand(result: BuildAudit): DamageBand {
  if (!result.survives) return 'FAILED';
  if (result.damage < 25) return 'SAFE';
  if (result.damage < 55) return 'DAMAGED';
  return 'PARTIAL';
}

function cloneSearchState(state: SearchState): SearchState {
  return {
    inventory: {
      body: { ...state.inventory.body },
      core: { ...state.inventory.core },
      rune: { ...state.inventory.rune },
    },
    golems: state.golems.map((golem) => ({ ...golem })),
    path: [...state.path],
  };
}

function searchKey(state: SearchState): string {
  const inventory = [
    ...Object.values(state.inventory.body),
    ...Object.values(state.inventory.core),
    ...Object.values(state.inventory.rune),
  ].join(',');
  const golems = [...state.golems]
    .sort((a, b) => `${a.starter}-${a.body}-${a.core}-${a.rune}-${a.durability}`.localeCompare(`${b.starter}-${b.body}-${b.core}-${b.rune}-${b.durability}`))
    .map((golem) => `${golem.starter ? 1 : 0}:${golem.body}:${golem.core}:${golem.rune}:${golem.durability}`)
    .join('|');
  return `${inventory}#${golems}`;
}

function isSoftlocked(state: SearchState): boolean {
  if (state.golems.some((golem) => !golem.starter)) return false;
  if (state.golems.some((golem) => golem.durability > 0)) return false;
  if (state.golems.some((golem) => state.inventory.body[golem.body] > 0)) return false;
  for (const body of Object.keys(BODIES) as BodyType[]) {
    for (const core of Object.keys(CORES) as CoreType[]) {
      for (const rune of Object.keys(RUNES) as RuneType[]) {
        if (state.inventory.body[body] > 0 && state.inventory.core[core] > 0 && state.inventory.rune[rune] > 0) return false;
      }
    }
  }
  return true;
}

function expandSearchState(state: SearchState): SearchState[] {
  const next: SearchState[] = [];
  state.golems.forEach((golem, index) => {
    if (golem.durability < 100 && state.inventory.body[golem.body] > 0) {
      const candidate = cloneSearchState(state);
      candidate.inventory.body[golem.body] -= 1;
      candidate.golems[index].durability = Math.min(100, candidate.golems[index].durability + 25);
      candidate.path.push(`repair ${index}:${golem.body}`);
      next.push(candidate);
    }
    if (golem.durability > 0) {
      const full = createGolem(golem.body, golem.core, golem.rune);
      full.durability = golem.durability;
      for (const region of experimentRegions) {
        if (region.accessTrait && !full.traits.includes(region.accessTrait)) continue;
        const report = runExpeditionSimulation(region, full, () => 0, simulationExperiment(variant, region));
        const candidate = cloneSearchState(state);
        candidate.golems[index].durability = Math.max(0, golem.durability - report.totalDamage);
        candidate.path.push(`expedition ${index}:${region.id} damage=${report.totalDamage} discard=all`);
        next.push(candidate);
      }
    }
    if (!golem.starter) {
      const candidate = cloneSearchState(state);
      candidate.inventory.body[golem.body] += 1;
      candidate.inventory.core[golem.core] += 1;
      candidate.golems.splice(index, 1);
      candidate.path.push(`disassemble ${index}:${golem.body}/${golem.core}/${golem.rune}`);
      next.push(candidate);
    }
  });
  if (state.golems.length < 3) {
    for (const body of Object.keys(BODIES) as BodyType[]) {
      for (const core of Object.keys(CORES) as CoreType[]) {
        for (const rune of Object.keys(RUNES) as RuneType[]) {
          if (state.inventory.body[body] <= 0 || state.inventory.core[core] <= 0 || state.inventory.rune[rune] <= 0) continue;
          const candidate = cloneSearchState(state);
          candidate.inventory.body[body] -= 1;
          candidate.inventory.core[core] -= 1;
          candidate.inventory.rune[rune] -= 1;
          candidate.golems.push({ body, core, rune, durability: 100, starter: false });
          candidate.path.push(`build ${body}/${core}/${rune}`);
          next.push(candidate);
        }
      }
    }
  }
  return next;
}

function softlockScore(state: SearchState): number {
  const durability = state.golems.reduce((sum, golem) => sum + golem.durability, 0);
  const repairStock = state.golems.reduce((sum, golem) => sum + state.inventory.body[golem.body], 0);
  return durability + repairStock * 30 + state.golems.filter((golem) => !golem.starter).length * 120;
}

function boundedSoftlockSearch(maxDepth = 60, beamWidth = 4000) {
  const initial: SearchState = {
    inventory: {
      body: { ...DEFAULT_INVENTORY.body },
      core: { ...DEFAULT_INVENTORY.core },
      rune: { ...DEFAULT_INVENTORY.rune },
    },
    golems: [{ body: 'stone', core: 'wind', rune: 'defense', durability: 100, starter: true }],
    path: [],
  };
  let frontier = [initial];
  const visited = new Set([searchKey(initial)]);
  for (let depth = 0; depth <= maxDepth; depth += 1) {
    const found = frontier.find(isSoftlocked);
    if (found) return { status: 'REACHABLE_SOFTLOCK', depth, visitedStates: visited.size, witness: found.path };
    const candidates: SearchState[] = [];
    for (const state of frontier) {
      for (const candidate of expandSearchState(state)) {
        const serialized = searchKey(candidate);
        if (visited.has(serialized)) continue;
        visited.add(serialized);
        candidates.push(candidate);
      }
    }
    candidates.sort((a, b) => softlockScore(a) - softlockScore(b));
    frontier = candidates.slice(0, beamWidth);
    if (frontier.length === 0) break;
  }
  return { status: 'NOT_FOUND_WITHIN_BOUND', depth: maxDepth, visitedStates: visited.size, witness: [] as string[] };
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
    for (const region of experimentRegions) {
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

const regionAudits = new Map(experimentRegions.map((region) => [region.id, auditRegion(region)]));
const progression = progressionClosure(regionAudits);
const feasiblePartUsage = new Set<PartKey>();
for (const results of regionAudits.values()) {
  for (const result of results.filter((candidate) => candidate.survives)) {
    feasiblePartUsage.add(key('body', result.body));
    feasiblePartUsage.add(key('core', result.core));
    feasiblePartUsage.add(key('rune', result.rune));
  }
}

const regions = experimentRegions.map((region) => {
  const results = regionAudits.get(region.id) ?? [];
  const feasible = results.filter((result) => result.survives);
  const bands: Record<DamageBand, number> = { SAFE: 0, DAMAGED: 0, PARTIAL: 0, FAILED: 0 };
  results.forEach((result) => { bands[damageBand(result)] += 1; });
  return {
    id: region.id,
    name: region.name,
    totalBuilds: results.length,
    accessBuilds: results.filter((result) => result.access).length,
    feasibleBuilds: feasible.length,
    damageBands: bands,
    classification: feasible.length === 0 ? 'BROKEN' : feasible.length === 1 ? 'FIXED_SOLUTION' : bands.SAFE >= results.length * 0.8 ? 'TRIVIAL' : 'CHOICE_EXISTS',
    feasible,
  };
});

const unreachableRegions = experimentRegions.filter((region) => !progression.reachableRegions.has(region.id)).map((region) => region.id);
const unobtainableParts = allPartKeys().filter((part) => !progression.parts.has(part));
const deadPartCandidates = allPartKeys().filter((part) => !feasiblePartUsage.has(part));
const softlockSearch = boundedSoftlockSearch();

const output = {
  version: '2.0.0',
  variant,
  variantDescription: VARIANT_DESCRIPTIONS[variant],
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
  softlockSearch,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(output, null, 2));
} else {
  console.log(`GOLEM BUILDER v2.0.0 RULE AUDIT — ${variant} — ${allBuilds.length} legal builds`);
  for (const region of regions) {
    console.log(`${region.name}: feasible ${region.feasibleBuilds}/${region.totalBuilds}, access ${region.accessBuilds}/${region.totalBuilds} [${region.classification}]`);
    console.log(`  SAFE ${region.damageBands.SAFE} / DAMAGED ${region.damageBands.DAMAGED} / PARTIAL ${region.damageBands.PARTIAL} / FAILED ${region.damageBands.FAILED}`);
    if (region.feasibleBuilds > 0 && region.feasibleBuilds <= 5) {
      for (const build of region.feasible) console.log(`  ${build.key}: damage ${build.damage}, traits ${build.traits.join(',') || '-'}`);
    }
  }
  console.log(`\nProgression reachable: ${[...progression.reachableRegions].join(', ') || 'none'}`);
  console.log(`Progression blocked: ${unreachableRegions.join(', ') || 'none'}`);
  console.log(`Unobtainable parts: ${unobtainableParts.join(', ') || 'none'}`);
  console.log(`Dead part candidates: ${deadPartCandidates.join(', ') || 'none'}`);
  console.log(`Softlock search: ${softlockSearch.status}, depth ${softlockSearch.depth}, visited ${softlockSearch.visitedStates}`);
  if (softlockSearch.witness.length > 0) console.log(`Softlock witness: ${softlockSearch.witness.join(' -> ')}`);
}

if (regions.some((region) => region.classification === 'BROKEN') || unreachableRegions.length > 0 || softlockSearch.status === 'REACHABLE_SOFTLOCK') {
  process.exitCode = 2;
}
