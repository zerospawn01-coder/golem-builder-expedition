import { strict as assert } from 'node:assert';
import { fabricateGolem, evaluateFabrication, type CanonicalFabricationState } from '../src/domain/fabrication';
import type { MaterialCount } from '../src/types';

const inventory = (body = 2, core = 2, rune = 2): MaterialCount => ({
  body: { stone: body, iron: 0, wood: 0, clay: 0 },
  core: { fire: core, water: 0, wind: 0, earth: 0 },
  rune: { attack: rune, defense: 0, speed: 0, regen: 0 },
});
const request = { body: 'stone', core: 'fire', rune: 'attack' } as const;
const state = (overrides: Partial<CanonicalFabricationState> = {}): CanonicalFabricationState => ({
  inventory: inventory(), actionsLeft: 2, units: [], maxUnits: 3, ...overrides,
});

const successBefore = state();
const preview = evaluateFabrication(successBefore, request);
const success = fabricateGolem(successBefore, request, 123);
assert.equal(success.ok, true);
if (!success.ok) throw new Error('expected success');
assert.equal(success.state.inventory.body.stone, 1);
assert.equal(success.state.inventory.core.fire, 1);
assert.equal(success.state.inventory.rune.attack, 1);
assert.equal(success.state.actionsLeft, 1);
assert.equal(success.state.units.length, 1);
assert.deepEqual(preview.stockChanges.map(({ after }) => after), [
  success.state.inventory.body.stone,
  success.state.inventory.core.fire,
  success.state.inventory.rune.attack,
]);

for (const blocked of [
  state({ inventory: inventory(0, 2, 2) }),
  state({ actionsLeft: 0 }),
  state({ units: Array(3).fill(success.golem) }),
]) {
  const snapshot = JSON.stringify(blocked);
  const result = fabricateGolem(blocked, request, 456);
  assert.equal(result.ok, false);
  assert.equal(result.state, blocked);
  assert.equal(JSON.stringify(blocked), snapshot);
}

console.log('Canonical fabrication transaction: PASS (5 cases)');
