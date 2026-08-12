import {
  BODIES,
  DEFAULT_INVENTORY,
  EXPEDITION_REGIONS,
  calculateGolemStats,
  generateGolemName,
  getGolemTraits,
  runExpeditionSimulation,
} from '../src/data/gameData';
import type {
  BodyType,
  CoreType,
  Golem,
  MaterialCategory,
  MaterialCount,
  RuneType,
} from '../src/types';

const ACTIONS_PER_DAY = 3;
const MAX_GOLEMS = 3;

type ActionName = 'build' | 'repair' | 'expedition' | 'disassemble';
type PartKey = `${MaterialCategory}:${string}`;

interface MaterialFlow {
  found: number;
  recovered: number;
  discarded: number;
}

interface RunMetrics {
  runId: number;
  seed: number;
  ruinsReachedDay: number | null;
  stoppedDay: number;
  stopReason: 'ruins_reached' | 'day_limit' | 'no_legal_action';
  actions: Record<ActionName, number>;
  golemUsage: Record<string, number>;
  partSelections: Record<PartKey, number>;
  materialFlow: Record<PartKey, MaterialFlow>;
  damagedDecisions: { repairs: number; disassembles: number };
  finalGolems: Array<{
    body: BodyType;
    core: CoreType;
    rune: RuneType;
    durability: number;
    expeditions: number;
  }>;
}

interface SimulationState {
  day: number;
  actionsLeft: number;
  inventory: MaterialCount;
  golems: Golem[];
  metrics: RunMetrics;
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function cloneInventory(): MaterialCount {
  return {
    body: { ...DEFAULT_INVENTORY.body },
    core: { ...DEFAULT_INVENTORY.core },
    rune: { ...DEFAULT_INVENTORY.rune },
  };
}

function partKey(category: MaterialCategory, id: string): PartKey {
  return `${category}:${id}`;
}

function increment(record: Record<string, number>, key: string, amount = 1): void {
  record[key] = (record[key] ?? 0) + amount;
}

function recordMaterial(
  metrics: RunMetrics,
  category: MaterialCategory,
  id: string,
  field: keyof MaterialFlow,
  amount: number,
): void {
  const key = partKey(category, id);
  metrics.materialFlow[key] ??= { found: 0, recovered: 0, discarded: 0 };
  metrics.materialFlow[key][field] += amount;
}

function createGolem(
  id: string,
  body: BodyType,
  core: CoreType,
  rune: RuneType,
  isStarter = false,
): Golem {
  return {
    id,
    name: generateGolemName(body, core, rune),
    body,
    core,
    rune,
    stats: calculateGolemStats(body, core, rune),
    traits: getGolemTraits(body, core, rune),
    createdAt: 0,
    expeditionsCount: 0,
    durability: 100,
    isStarter,
  };
}

function hasMaterials(state: SimulationState, body: BodyType, core: CoreType, rune: RuneType): boolean {
  return state.inventory.body[body] > 0
    && state.inventory.core[core] > 0
    && state.inventory.rune[rune] > 0;
}

function build(state: SimulationState, body: BodyType, core: CoreType, rune: RuneType): boolean {
  if (state.actionsLeft <= 0 || state.golems.length >= MAX_GOLEMS || !hasMaterials(state, body, core, rune)) {
    return false;
  }
  state.inventory.body[body] -= 1;
  state.inventory.core[core] -= 1;
  state.inventory.rune[rune] -= 1;
  const golem = createGolem(`run-${state.metrics.runId}-golem-${state.golems.length + 1}`, body, core, rune);
  state.golems.push(golem);
  state.actionsLeft -= 1;
  state.metrics.actions.build += 1;
  increment(state.metrics.partSelections, partKey('body', body));
  increment(state.metrics.partSelections, partKey('core', core));
  increment(state.metrics.partSelections, partKey('rune', rune));
  return true;
}

function repair(state: SimulationState, golem: Golem): boolean {
  if (state.actionsLeft <= 0 || golem.durability >= 100 || state.inventory.body[golem.body] <= 0) return false;
  state.inventory.body[golem.body] -= 1;
  golem.durability = Math.min(100, golem.durability + 25);
  state.actionsLeft -= 1;
  state.metrics.actions.repair += 1;
  if (golem.durability <= 75) state.metrics.damagedDecisions.repairs += 1;
  return true;
}

function lootPriority(category: MaterialCategory, id: string): number {
  const progression: Record<string, number> = {
    'core:water': 100,
    'rune:attack': 95,
    'body:wood': 75,
    'core:fire': 70,
    'body:iron': 55,
  };
  return progression[partKey(category, id)] ?? (category === 'rune' ? 45 : category === 'core' ? 35 : 20);
}

function chooseCargo<T extends { category: MaterialCategory; id: string; count: number; weight: number }>(
  loots: T[],
  capacity: number,
): Set<number> {
  let bestValue = -1;
  let bestWeight = -1;
  let best = new Set<number>();
  for (let mask = 0; mask < (1 << loots.length); mask += 1) {
    let weight = 0;
    let value = 0;
    const selected = new Set<number>();
    for (let index = 0; index < loots.length; index += 1) {
      if ((mask & (1 << index)) === 0) continue;
      weight += loots[index].weight;
      value += lootPriority(loots[index].category, loots[index].id) * loots[index].count;
      selected.add(index);
    }
    if (weight <= capacity && (value > bestValue || (value === bestValue && weight > bestWeight))) {
      bestValue = value;
      bestWeight = weight;
      best = selected;
    }
  }
  return best;
}

function addLoot(state: SimulationState, category: MaterialCategory, id: string, count: number): void {
  if (category === 'body') state.inventory.body[id as BodyType] += count;
  if (category === 'core') state.inventory.core[id as CoreType] += count;
  if (category === 'rune') state.inventory.rune[id as RuneType] += count;
}

function expedition(state: SimulationState, golem: Golem, regionId: string, random: () => number): boolean {
  if (state.actionsLeft <= 0 || golem.durability <= 0) return false;
  const region = EXPEDITION_REGIONS.find((candidate) => candidate.id === regionId);
  if (!region || (region.accessTrait && !golem.traits.includes(region.accessTrait))) return false;
  const report = runExpeditionSimulation(region, golem, random);
  state.actionsLeft -= 1;
  state.metrics.actions.expedition += 1;
  golem.expeditionsCount += 1;
  golem.durability = Math.max(0, golem.durability - report.totalDamage);
  increment(state.metrics.golemUsage, `${golem.body}/${golem.core}/${golem.rune}`);

  for (const loot of report.loots) recordMaterial(state.metrics, loot.category, loot.id, 'found', loot.count);
  const selected = chooseCargo(report.loots, golem.stats.work * 2);
  report.loots.forEach((loot, index) => {
    if (selected.has(index)) {
      addLoot(state, loot.category, loot.id, loot.count);
      recordMaterial(state.metrics, loot.category, loot.id, 'recovered', loot.count);
    } else {
      recordMaterial(state.metrics, loot.category, loot.id, 'discarded', loot.count);
    }
  });

  if (regionId === 'region_ruins' && report.status !== 'FAILED') {
    state.metrics.ruinsReachedDay = state.day;
  }
  return true;
}

function chooseBuild(state: SimulationState): [BodyType, CoreType, RuneType] | null {
  const hasNightVision = state.golems.some((golem) => golem.traits.includes('night_vision'));
  if (!hasNightVision && hasMaterials(state, 'wood', 'fire', 'attack')) return ['wood', 'fire', 'attack'];

  const hasManaSense = state.golems.some((golem) => golem.traits.includes('mana_sense'));
  if (!hasManaSense && state.inventory.core.water > 0 && state.inventory.rune.attack > 0) {
    const bodies = (Object.keys(BODIES) as BodyType[])
      .filter((body) => state.inventory.body[body] > 0)
      .sort((a, b) => calculateGolemStats(b, 'water', 'attack').mobility - calculateGolemStats(a, 'water', 'attack').mobility);
    if (bodies[0]) return [bodies[0], 'water', 'attack'];
  }
  return null;
}

function chooseExpedition(state: SimulationState): { golem: Golem; regionId: string } | null {
  const manaGolem = state.golems.find((golem) => golem.traits.includes('mana_sense'));
  if (manaGolem) return { golem: manaGolem, regionId: 'region_ruins' };

  const nightGolem = state.golems.find((golem) => golem.traits.includes('night_vision'));
  if (nightGolem) return { golem: nightGolem, regionId: 'region_mine' };

  const starter = state.golems.find((golem) => golem.durability > 0);
  return starter ? { golem: starter, regionId: 'region_quarry' } : null;
}

function simulateRun(runId: number, seed: number, maxDays: number): RunMetrics {
  const random = mulberry32(seed);
  const metrics: RunMetrics = {
    runId,
    seed,
    ruinsReachedDay: null,
    stoppedDay: 1,
    stopReason: 'day_limit',
    actions: { build: 0, repair: 0, expedition: 0, disassemble: 0 },
    golemUsage: {},
    partSelections: {},
    materialFlow: {},
    damagedDecisions: { repairs: 0, disassembles: 0 },
    finalGolems: [],
  };
  const state: SimulationState = {
    day: 1,
    actionsLeft: ACTIONS_PER_DAY,
    inventory: cloneInventory(),
    golems: [createGolem('golem_starter', 'stone', 'wind', 'defense', true)],
    metrics,
  };

  while (state.day <= maxDays && metrics.ruinsReachedDay === null) {
    if (state.actionsLeft === 0) {
      state.day += 1;
      state.actionsLeft = ACTIONS_PER_DAY;
      continue;
    }

    const buildChoice = chooseBuild(state);
    if (buildChoice && build(state, ...buildChoice)) continue;

    const target = chooseExpedition(state);
    if (!target) {
      metrics.stopReason = 'no_legal_action';
      break;
    }
    if (target.golem.durability < 40 && repair(state, target.golem)) continue;
    if (!expedition(state, target.golem, target.regionId, random)) {
      metrics.stopReason = 'no_legal_action';
      break;
    }
  }

  if (metrics.ruinsReachedDay !== null) metrics.stopReason = 'ruins_reached';
  metrics.stoppedDay = Math.min(state.day, maxDays);
  metrics.finalGolems = state.golems.map((golem) => ({
    body: golem.body,
    core: golem.core,
    rune: golem.rune,
    durability: golem.durability,
    expeditions: golem.expeditionsCount,
  }));
  return metrics;
}

function parseNumberFlag(name: string, fallback: number): number {
  const prefix = `--${name}=`;
  const raw = process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function percentage(value: number, total: number): string {
  return total === 0 ? '0.0%' : `${((value / total) * 100).toFixed(1)}%`;
}

function aggregate(runs: RunMetrics[]) {
  const reached = runs.filter((run) => run.ruinsReachedDay !== null);
  const actionTotals = runs.reduce((totals, run) => {
    (Object.keys(totals) as ActionName[]).forEach((key) => { totals[key] += run.actions[key]; });
    return totals;
  }, { build: 0, repair: 0, expedition: 0, disassemble: 0 });
  const totalActions = actionTotals.build + actionTotals.repair + actionTotals.expedition;
  const partTotals: Record<string, number> = {};
  const usageTotals: Record<string, number> = {};
  const flowTotals: Record<string, MaterialFlow> = {};
  for (const run of runs) {
    for (const [key, value] of Object.entries(run.partSelections)) increment(partTotals, key, value);
    for (const [key, value] of Object.entries(run.golemUsage)) increment(usageTotals, key, value);
    for (const [key, value] of Object.entries(run.materialFlow)) {
      flowTotals[key] ??= { found: 0, recovered: 0, discarded: 0 };
      flowTotals[key].found += value.found;
      flowTotals[key].recovered += value.recovered;
      flowTotals[key].discarded += value.discarded;
    }
  }
  return { reached, actionTotals, totalActions, partTotals, usageTotals, flowTotals };
}

function printReport(runs: RunMetrics[]): void {
  const summary = aggregate(runs);
  console.log(`GOLEM BUILDER v2.0.0 LOGIC PLAYTEST — ${runs.length} runs`);
  console.log(`Ancient Ruins reached: ${summary.reached.length}/${runs.length} (${percentage(summary.reached.length, runs.length)})`);
  if (summary.reached.length > 0) {
    const days = summary.reached.map((run) => run.ruinsReachedDay as number);
    console.log(`Reach day: min ${Math.min(...days)} / avg ${(days.reduce((a, b) => a + b, 0) / days.length).toFixed(2)} / max ${Math.max(...days)}`);
  }
  console.log(`Actions: build ${summary.actionTotals.build} (${percentage(summary.actionTotals.build, summary.totalActions)}), repair ${summary.actionTotals.repair} (${percentage(summary.actionTotals.repair, summary.totalActions)}), expedition ${summary.actionTotals.expedition} (${percentage(summary.actionTotals.expedition, summary.totalActions)})`);
  console.log('\nPart selections:');
  Object.entries(summary.partTotals).sort((a, b) => b[1] - a[1]).forEach(([key, value]) => console.log(`  ${key}: ${value}`));
  console.log('\nGolem usage:');
  Object.entries(summary.usageTotals).sort((a, b) => b[1] - a[1]).forEach(([key, value]) => console.log(`  ${key}: ${value}`));
  console.log('\nMaterial flow (found / recovered / discarded):');
  Object.entries(summary.flowTotals).sort((a, b) => b[1].found - a[1].found).forEach(([key, value]) => console.log(`  ${key}: ${value.found} / ${value.recovered} / ${value.discarded}`));
}

const runsCount = parseNumberFlag('runs', 30);
const baseSeed = parseNumberFlag('seed', 20260812);
const maxDays = parseNumberFlag('max-days', 30);
const runs = Array.from({ length: runsCount }, (_, index) => simulateRun(index + 1, baseSeed + index, maxDays));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ config: { runs: runsCount, baseSeed, maxDays }, runs }, null, 2));
} else {
  printReport(runs);
}
