import { EXPEDITION_REGIONS, calculateGolemStats } from '../src/data/gameData';
import {
  ALL_BUILD_PARTS,
  applyPrototypeMaterial,
  createGravityUnit,
  evaluateGravityDepth,
  PROTOTYPE_MATERIALS,
  snapshotUnit,
} from '../src/experiments/gravity-depth-v0/engine';
import { advanceGravityRun, recoverGravityCargo, startGravityRun } from '../src/experiments/gravity-depth-v0/model';
import { createInitialGravityState, GRAVITY_STATE_KEY, saveGravityState } from '../src/experiments/gravity-depth-v0/state';
import type { FrameMass, GravityDepth, GravityRoute, PrototypeMaterialId } from '../src/experiments/gravity-depth-v0/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const materials: Array<PrototypeMaterialId | undefined> = [undefined, ...Object.keys(PROTOTYPE_MATERIALS) as PrototypeMaterialId[]];
let evaluated = 0;
const candidates = [];
for (const body of ALL_BUILD_PARTS.bodies) for (const core of ALL_BUILD_PARTS.cores) for (const rune of ALL_BUILD_PARTS.runes) for (const material of materials) {
  const unit = createGravityUnit(`${body}-${core}-${rune}-${material ?? 'none'}`, body, core, rune, material);
  candidates.push(unit);
  for (const depth of [1, 2, 4] as GravityDepth[]) {
    const first = evaluateGravityDepth(depth, snapshotUnit(unit));
    const second = evaluateGravityDepth(depth, snapshotUnit(unit));
    assert(JSON.stringify(first) === JSON.stringify(second), `${unit.id}/D${depth}: evaluation is not deterministic`);
    assert(first.totalDamage === first.damageSources.reduce((sum, source) => sum + source.amount, 0), `${unit.id}/D${depth}: source sum mismatch`);
    evaluated += 1;
  }
  for (const route of ['POWER', 'WORK'] as GravityRoute[]) {
    const first = evaluateGravityDepth(3, snapshotUnit(unit), route);
    const second = evaluateGravityDepth(3, snapshotUnit(unit), route);
    assert(JSON.stringify(first) === JSON.stringify(second), `${unit.id}/D3/${route}: evaluation is not deterministic`);
    evaluated += 1;
  }
}
assert(evaluated === 1280, `expected 1280 build/depth evaluations, got ${evaluated}`);

const fixedStats = { power: 5, armor: 5, mobility: 5, work: 5 };
const massDamage = (mass: FrameMass) => evaluateGravityDepth(2, { golemId: mass, stats: fixedStats, durability: 100, frameMass: mass, gravityControl: false }).totalDamage;
assert(massDamage('LIGHT') < massDamage('MEDIUM') && massDamage('MEDIUM') < massDamage('HEAVY'), 'DEPTH 2 mass order must be LIGHT < MEDIUM < HEAVY');

const baseStats = calculateGolemStats('stone', 'wind', 'defense');
const crystalStats = applyPrototypeMaterial(baseStats, 'gravity_shift_crystal');
assert(JSON.stringify(baseStats) === JSON.stringify(crystalStats), 'gravity_control material changed normal stats');
const withoutControl = { golemId: 'no-control', stats: baseStats, durability: 100, frameMass: 'MEDIUM' as const, gravityControl: false };
const withControl = { ...withoutControl, golemId: 'control', gravityControl: true };
assert(evaluateGravityDepth(2, withControl).totalDamage < evaluateGravityDepth(2, withoutControl).totalDamage, 'gravity_control must reduce DEPTH 2 damage');
assert(evaluateGravityDepth(4, withControl).damageSources[0].amount < evaluateGravityDepth(4, withoutControl).damageSources[0].amount, 'gravity_control must reduce DEPTH 4 gravity damage');
assert(evaluateGravityDepth(1, withControl).totalDamage === evaluateGravityDepth(1, withoutControl).totalDamage, 'gravity_control affected DEPTH 1');
assert(evaluateGravityDepth(3, withControl, 'POWER').totalDamage === evaluateGravityDepth(3, withoutControl, 'POWER').totalDamage, 'gravity_control affected DEPTH 3');

assert(candidates.some((unit) => evaluateGravityDepth(3, snapshotUnit(unit), 'POWER').totalDamage < evaluateGravityDepth(3, snapshotUnit(unit), 'WORK').totalDamage), 'no POWER-favored build exists');
assert(candidates.some((unit) => evaluateGravityDepth(3, snapshotUnit(unit), 'WORK').totalDamage < evaluateGravityDepth(3, snapshotUnit(unit), 'POWER').totalDamage), 'no WORK-favored build exists');
const maxPower = Math.max(...candidates.map((unit) => unit.stats.power));
const bestDepth2 = Math.min(...candidates.map((unit) => evaluateGravityDepth(2, snapshotUnit(unit)).totalDamage));
assert(candidates.some((unit) => unit.stats.power < maxPower && evaluateGravityDepth(2, snapshotUnit(unit)).totalDamage === bestDepth2), 'max POWER is the sole DEPTH 2 optimum');

let state = createInitialGravityState();
state.units = [createGravityUnit('fragile', 'iron', 'earth', 'defense')];
state.units[0].durability = 10;
state.activeUnitId = 'fragile';
state = startGravityRun(state, 1);
assert(state.actionsLeft === 2, 'deployment must consume exactly 1 ACTION');
const actionsAfterDeploy = state.actionsLeft;
state = advanceGravityRun(state, 2);
assert(state.actionsLeft === actionsAfterDeploy, 'CONTINUE consumed an ACTION');
assert(state.run?.phase === 'DESTROYED' && state.run.unsecuredCargo.length === 0, 'destroyed run retained unsecured cargo');

let returnState = startGravityRun(createInitialGravityState(), 2);
assert(returnState.run, 'return test did not start');
returnState = { ...returnState, run: { ...returnState.run, phase: 'RETURNING' }, selectedCargoIds: returnState.run.unsecuredCargo.map((item) => item.id) };
const stoneBefore = returnState.inventory.body.stone;
returnState = recoverGravityCargo(returnState);
assert(returnState.run?.phase === 'COMPLETE', 'successful RETURN did not complete');
assert(returnState.inventory.body.stone > stoneBefore, 'successful RETURN did not recover selected cargo');

assert(EXPEDITION_REGIONS.length === 4, 'canonical region list changed');
assert(JSON.stringify(calculateGolemStats('stone', 'fire', 'attack')) === JSON.stringify({ power: 11, armor: 8, mobility: 2, work: 5 }), 'canonical build result changed');

const memory = new Map<string, string>([['golem_builder_expedition_save_v2', 'canonical-sentinel']]);
const storage = { setItem: (key: string, value: string) => memory.set(key, value) };
saveGravityState(storage, createInitialGravityState());
assert(memory.get('golem_builder_expedition_save_v2') === 'canonical-sentinel', 'experiment changed canonical save');
assert(memory.has(GRAVITY_STATE_KEY), 'experiment did not use isolated save key');

console.log(`GRAVITY_DEPTH_V0 verification: PASS (${evaluated} build/depth cases)`);
