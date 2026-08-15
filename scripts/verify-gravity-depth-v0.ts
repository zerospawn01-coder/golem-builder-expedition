import { EXPEDITION_REGIONS, calculateGolemStats } from '../src/data/gameData';
import {
  ALL_BUILD_PARTS,
  applyPrototypeMaterial,
  createGravityUnit,
  evaluateGravityDepth,
  getGravityRewardDisplayName,
  isPrototypeMaterialAvailable,
  PROTOTYPE_MATERIALS,
  snapshotUnit,
} from '../src/experiments/gravity-depth-v0/engine';
import { advanceGravityRun, disassembleGravityUnit, recoverGravityCargo, startGravityRun } from '../src/experiments/gravity-depth-v0/model';
import { createInitialGravityState, GRAVITY_STATE_KEY, loadGravityState, saveGravityState } from '../src/experiments/gravity-depth-v0/state';
import type { FrameMass, GravityBlueprint, GravityDepth, GravityRoute, PrototypeMaterialId } from '../src/experiments/gravity-depth-v0/types';

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
const scenarios: Array<{ depth: GravityDepth; route?: GravityRoute }> = [
  { depth: 1 },
  { depth: 2 },
  { depth: 3, route: 'POWER' },
  { depth: 3, route: 'WORK' },
  { depth: 4 },
];
assert(!candidates.some((unit) => unit.stats.power === maxPower && scenarios.every(({ depth, route }) => {
  const damage = evaluateGravityDepth(depth, snapshotUnit(unit), route).totalDamage;
  const minimum = Math.min(...candidates.map((candidate) => evaluateGravityDepth(depth, snapshotUnit(candidate), route).totalDamage));
  return damage === minimum;
})), 'a max-POWER build is optimal across every depth and route');

for (const unit of candidates) for (const route of ['POWER', 'WORK'] as GravityRoute[]) {
  let progression = createInitialGravityState();
  progression.units = [unit];
  progression.activeUnitId = unit.id;
  progression = startGravityRun(progression, 100);
  const depth1Actual = progression.run?.depthResults.at(-1);
  assert(JSON.stringify(depth1Actual) === JSON.stringify(evaluateGravityDepth(1, snapshotUnit(unit))), `${unit.id}: DEPTH 1 prediction/model mismatch`);
  if (progression.run?.phase === 'DESTROYED') continue;
  const depth2Prediction = evaluateGravityDepth(2, snapshotUnit(unit, progression.run.durability));
  progression = advanceGravityRun(progression, 2);
  assert(JSON.stringify(progression.run?.depthResults.at(-1)) === JSON.stringify(depth2Prediction), `${unit.id}: DEPTH 2 prediction/model mismatch`);
  if (progression.run?.phase === 'DESTROYED') continue;
  const depth3Prediction = evaluateGravityDepth(3, snapshotUnit(unit, progression.run.durability), route);
  progression = advanceGravityRun(progression, 3, route);
  assert(JSON.stringify(progression.run?.depthResults.at(-1)) === JSON.stringify(depth3Prediction), `${unit.id}/${route}: DEPTH 3 prediction/model mismatch`);
  if (progression.run?.phase === 'DESTROYED') continue;
  const depth4Prediction = evaluateGravityDepth(4, snapshotUnit(unit, progression.run.durability));
  progression = advanceGravityRun(progression, 4);
  assert(JSON.stringify(progression.run?.depthResults.at(-1)) === JSON.stringify(depth4Prediction), `${unit.id}/${route}: DEPTH 4 prediction/model mismatch`);
}

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
const inProgressSnapshot = JSON.stringify(returnState);
assert(JSON.stringify(recoverGravityCargo(returnState)) === inProgressSnapshot, 'IN_PROGRESS run recovered cargo');
const routeChoiceState = advanceGravityRun(returnState, 2);
assert(routeChoiceState.run?.phase === 'ROUTE_CHOICE', 'return guard test did not reach ROUTE_CHOICE');
assert(JSON.stringify(recoverGravityCargo(routeChoiceState)) === JSON.stringify(routeChoiceState), 'ROUTE_CHOICE run recovered cargo');
returnState = { ...returnState, run: { ...returnState.run, phase: 'RETURNING' }, selectedCargoIds: returnState.run.unsecuredCargo.map((item) => item.id) };
const stoneBefore = returnState.inventory.body.stone;
returnState = recoverGravityCargo(returnState);
assert(returnState.run?.phase === 'COMPLETE', 'successful RETURN did not complete');
assert(returnState.inventory.body.stone > stoneBefore, 'successful RETURN did not recover selected cargo');
assert(JSON.stringify(recoverGravityCargo(returnState)) === JSON.stringify(returnState), 'COMPLETE run recovered cargo twice');

let destroyedRecovery = createInitialGravityState();
destroyedRecovery.units = [createGravityUnit('destroyed-recovery', 'iron', 'earth', 'defense')];
destroyedRecovery.units[0].durability = 1;
destroyedRecovery.activeUnitId = destroyedRecovery.units[0].id;
destroyedRecovery = startGravityRun(destroyedRecovery, 3);
assert(destroyedRecovery.run?.phase === 'DESTROYED', 'destroyed recovery guard did not reach DESTROYED');
assert(JSON.stringify(recoverGravityCargo(destroyedRecovery)) === JSON.stringify(destroyedRecovery), 'DESTROYED run recovered cargo');

const hiddenMaterialState = createInitialGravityState();
assert(!isPrototypeMaterialAvailable('low_mass_composite', hiddenMaterialState.knownMaterials, hiddenMaterialState.inventory.prototype), 'unknown prototype material became available');
assert(!isPrototypeMaterialAvailable('low_mass_composite', [], { ...hiddenMaterialState.inventory.prototype, low_mass_composite: 1 }), 'unrecognized prototype inventory became available');
assert(!isPrototypeMaterialAvailable('low_mass_composite', ['low_mass_composite'], hiddenMaterialState.inventory.prototype), 'known but unowned prototype material became available');
assert(isPrototypeMaterialAvailable('low_mass_composite', ['low_mass_composite'], { ...hiddenMaterialState.inventory.prototype, low_mass_composite: 1 }), 'known and owned prototype material remained unavailable');
const lowMassReward = evaluateGravityDepth(2, snapshotUnit(hiddenMaterialState.units[0])).rewardPreview[0];
assert(getGravityRewardDisplayName(lowMassReward, hiddenMaterialState.knownMaterials) === 'UNCLASSIFIED MATERIAL', 'unknown reward name leaked');
assert(getGravityRewardDisplayName(lowMassReward, ['low_mass_composite']) === PROTOTYPE_MATERIALS.low_mass_composite.name, 'known reward name remained hidden');
const basicReward = evaluateGravityDepth(1, snapshotUnit(hiddenMaterialState.units[0])).rewardPreview[0];
assert(basicReward.baseBodyId === 'stone' && basicReward.name.includes('STONE'), 'DEPTH 1 reward display does not match recovered BODY inventory');

let disassemblyState = createInitialGravityState();
const prototypeUnit = createGravityUnit('prototype-disassembly', 'wood', 'water', 'speed', 'low_mass_composite');
disassemblyState = { ...disassemblyState, units: [disassemblyState.units[0], prototypeUnit] };
const bodyBeforeDisassembly = disassemblyState.inventory.body.wood;
const coreBeforeDisassembly = disassemblyState.inventory.core.water;
const prototypeBeforeDisassembly = disassemblyState.inventory.prototype.low_mass_composite;
disassemblyState = disassembleGravityUnit(disassemblyState, prototypeUnit);
assert(disassemblyState.inventory.body.wood === bodyBeforeDisassembly + 1, 'disassembly did not return BODY material');
assert(disassemblyState.inventory.core.water === coreBeforeDisassembly + 1, 'disassembly did not return CORE material');
assert(disassemblyState.inventory.prototype.low_mass_composite === prototypeBeforeDisassembly, 'disassembly returned prototype material');

assert(EXPEDITION_REGIONS.length === 4, 'canonical region list changed');
assert(JSON.stringify(calculateGolemStats('stone', 'fire', 'attack')) === JSON.stringify({ power: 11, armor: 8, mobility: 2, work: 5 }), 'canonical build result changed');

const memory = new Map<string, string>([['golem_builder_expedition_save_v2', 'canonical-sentinel']]);
const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) };
saveGravityState(storage, createInitialGravityState());
assert(memory.get('golem_builder_expedition_save_v2') === 'canonical-sentinel', 'experiment changed canonical save');
assert(memory.has(GRAVITY_STATE_KEY), 'experiment did not use isolated save key');
const experimentBeforeCanonicalWrite = memory.get(GRAVITY_STATE_KEY);
memory.set('golem_builder_expedition_save_v2', 'canonical-updated');
assert(memory.get(GRAVITY_STATE_KEY) === experimentBeforeCanonicalWrite, 'canonical save changed experiment save');
assert(JSON.stringify(loadGravityState(storage)) === experimentBeforeCanonicalWrite, 'canonical write changed loaded experiment state');

const blueprint: GravityBlueprint = {
  id: 'blueprint-light-work',
  name: 'BLUEPRINT 01',
  body: 'clay',
  core: 'earth',
  rune: 'regen',
  prototypeMaterial: 'low_mass_composite',
  savedAt: 1,
};
const blueprintState = { ...createInitialGravityState(), blueprints: [blueprint] };
saveGravityState(storage, blueprintState);
const loadedBlueprint = loadGravityState(storage).blueprints[0];
assert(JSON.stringify(loadedBlueprint) === JSON.stringify(blueprint), 'blueprint part IDs did not survive save/load');
assert(!('stats' in loadedBlueprint) && !('durability' in loadedBlueprint) && !('isStarter' in loadedBlueprint), 'blueprint stored completed-unit state');
assert(loadGravityState({ getItem: () => JSON.stringify({ day: 2 }) }).blueprints.length === 0, 'pre-U0 save migration did not initialize blueprints');

console.log(`GRAVITY_DEPTH_V0 verification: PASS (${evaluated} build/depth cases)`);
