import type { MaterialCount } from '../../types';
import { createGravityUnit } from './engine';
import type { GravityExperimentState, GravityExperimentInventory } from './types';

export const GRAVITY_SAVE_PREFIX = 'golem_builder_gravity_depth_v0';
export const GRAVITY_STATE_KEY = `${GRAVITY_SAVE_PREFIX}_state`;

export function createInitialGravityState(): GravityExperimentState {
  const base: MaterialCount = {
    body: { stone: 2, iron: 2, wood: 2, clay: 2 },
    core: { fire: 2, water: 2, wind: 2, earth: 2 },
    rune: { attack: 2, defense: 2, speed: 2, regen: 2 },
  };
  const inventory: GravityExperimentInventory = {
    ...base,
    prototype: { low_mass_composite: 0, dense_ferrous_material: 0, gravity_shift_crystal: 0 },
  };
  const starter = createGravityUnit('gravity-starter', 'stone', 'wind', 'defense', undefined, true);
  return {
    day: 1,
    actionsLeft: 3,
    inventory,
    units: [starter],
    activeUnitId: starter.id,
    run: null,
    selectedCargoIds: [],
    knownMaterials: [],
    comparisonUnitIds: [],
    comparisonCandidates: [],
    blueprints: [],
    nextHypothesis: '',
    playtestRecords: [],
  };
}

export function loadGravityState(storage: Pick<Storage, 'getItem'>): GravityExperimentState {
  try {
    const saved = storage.getItem(GRAVITY_STATE_KEY);
    if (!saved) return createInitialGravityState();
    const parsed = JSON.parse(saved) as Partial<GravityExperimentState>;
    return { ...createInitialGravityState(), ...parsed, comparisonCandidates: parsed.comparisonCandidates ?? [], blueprints: parsed.blueprints ?? [], playtestRecords: parsed.playtestRecords ?? [] };
  } catch {
    return createInitialGravityState();
  }
}

export function saveGravityState(storage: Pick<Storage, 'setItem'>, state: GravityExperimentState) {
  storage.setItem(GRAVITY_STATE_KEY, JSON.stringify(state));
}
