import { evaluateGravityDepth, snapshotUnit } from './engine';
import type { GravityDepth, GravityExperimentState, GravityExperimentUnit, GravityRoute, PrototypeMaterialId } from './types';

export function disassembleGravityUnit(state: GravityExperimentState, unit: GravityExperimentUnit): GravityExperimentState {
  if (unit.isStarter || !state.units.some((candidate) => candidate.id === unit.id)) return state;
  const inventory = structuredClone(state.inventory);
  inventory.body[unit.body] += 1;
  inventory.core[unit.core] += 1;
  const units = state.units.filter((candidate) => candidate.id !== unit.id);
  return { ...state, inventory, units, activeUnitId: units[0]?.id ?? '' };
}

export function startGravityRun(state: GravityExperimentState, now = Date.now()): GravityExperimentState {
  const unit = state.units.find((candidate) => candidate.id === state.activeUnitId);
  if (!unit || state.actionsLeft <= 0 || state.run || unit.durability <= 0) return state;
  const evaluation = evaluateGravityDepth(1, snapshotUnit(unit));
  return {
    ...state,
    actionsLeft: state.actionsLeft - 1,
    run: {
      runId: `gravity-${now}`,
      golemId: unit.id,
      currentDepth: 1,
      durability: evaluation.durabilityAfter,
      unsecuredCargo: evaluation.destroyed ? [] : evaluation.rewardPreview.map((item) => ({ ...item, id: `1-${item.id}` })),
      depthResults: [evaluation],
      phase: evaluation.destroyed ? 'DESTROYED' : 'IN_PROGRESS',
    },
  };
}

export function advanceGravityRun(state: GravityExperimentState, depth: GravityDepth, route?: GravityRoute): GravityExperimentState {
  const unit = state.units.find((candidate) => candidate.id === state.run?.golemId);
  if (!unit || !state.run) return state;
  const evaluation = evaluateGravityDepth(depth, snapshotUnit(unit, state.run.durability), route);
  return {
    ...state,
    selectedCargoIds: evaluation.destroyed ? [] : state.selectedCargoIds,
    run: {
      ...state.run,
      currentDepth: depth,
      durability: evaluation.durabilityAfter,
      unsecuredCargo: evaluation.destroyed ? [] : [
        ...state.run.unsecuredCargo,
        ...evaluation.rewardPreview.map((item) => ({ ...item, id: `${depth}-${item.id}` })),
      ],
      depthResults: [...state.run.depthResults, evaluation],
      chosenRoute: route ?? state.run.chosenRoute,
      phase: evaluation.destroyed ? 'DESTROYED' : depth === 2 ? 'ROUTE_CHOICE' : depth === 4 ? 'RETURNING' : 'IN_PROGRESS',
    },
  };
}

export function recoverGravityCargo(state: GravityExperimentState): GravityExperimentState {
  if (!state.run || state.run.phase !== 'RETURNING') return state;
  const unit = state.units.find((candidate) => candidate.id === state.run?.golemId);
  if (!unit) return state;
  const selected = state.run.unsecuredCargo.filter((item) => state.selectedCargoIds.includes(item.id));
  const selectedWeight = selected.reduce((sum, item) => sum + item.weight * item.count, 0);
  if (selectedWeight > unit.stats.work * 2) return state;
  const inventory = structuredClone(state.inventory);
  const known = new Set(state.knownMaterials);
  selected.forEach((item) => {
    if (item.prototypeMaterialId) {
      inventory.prototype[item.prototypeMaterialId] += item.count;
      known.add(item.prototypeMaterialId as PrototypeMaterialId);
    }
    if (item.baseBodyId) inventory.body[item.baseBodyId] += item.count;
  });
  return {
    ...state,
    inventory,
    knownMaterials: [...known],
    units: state.units.map((candidate) => candidate.id === unit.id ? { ...candidate, durability: state.run!.durability } : candidate),
    run: { ...state.run, phase: 'COMPLETE' },
    selectedCargoIds: [],
  };
}
