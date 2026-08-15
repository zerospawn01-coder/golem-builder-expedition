import type { BodyType, CoreType, Golem, MaterialCount, RuneType } from '../types';
import { calculateGolemStats, generateGolemName, getGolemTraits } from '../data/gameData';

export const FABRICATION_ACTION_COST = 1;

export interface CanonicalFabricationState {
  inventory: MaterialCount;
  actionsLeft: number;
  units: Golem[];
  maxUnits: number;
}

export interface FabricationRequest {
  body: BodyType;
  core: CoreType;
  rune: RuneType;
}

export type FabricationBlockerCode =
  | 'NO_FREE_UNIT_SLOT'
  | 'NO_ACTION'
  | 'MISSING_FRAME'
  | 'MISSING_REACTOR'
  | 'MISSING_SIGIL';

export interface FabricationEvaluation {
  canFabricate: boolean;
  actionCost: 1;
  slots: { used: number; max: number; after: number };
  stockChanges: Array<{
    category: 'FRAME' | 'REACTOR' | 'CONTROL_SIGIL';
    id: string;
    before: number;
    required: 1;
    after: number;
  }>;
  blocker?: { code: FabricationBlockerCode; message: string };
}

export type FabricationResult =
  | { ok: true; state: CanonicalFabricationState; golem: Golem; evaluation: FabricationEvaluation }
  | { ok: false; state: CanonicalFabricationState; reason: FabricationBlockerCode; evaluation: FabricationEvaluation };

export function evaluateFabrication(state: CanonicalFabricationState, request: FabricationRequest): FabricationEvaluation {
  const body = state.inventory.body[request.body] ?? 0;
  const core = state.inventory.core[request.core] ?? 0;
  const rune = state.inventory.rune[request.rune] ?? 0;
  const used = state.units.length;
  const stockChanges: FabricationEvaluation['stockChanges'] = [
    { category: 'FRAME', id: request.body, before: body, required: 1, after: Math.max(0, body - 1) },
    { category: 'REACTOR', id: request.core, before: core, required: 1, after: Math.max(0, core - 1) },
    { category: 'CONTROL_SIGIL', id: request.rune, before: rune, required: 1, after: Math.max(0, rune - 1) },
  ];

  const blocker = used >= state.maxUnits
    ? { code: 'NO_FREE_UNIT_SLOT' as const, message: `NO FREE UNIT SLOT — ${used} / ${state.maxUnits} units occupied` }
    : state.actionsLeft < FABRICATION_ACTION_COST
      ? { code: 'NO_ACTION' as const, message: 'NO ACTION REMAINING' }
      : body < 1
        ? { code: 'MISSING_FRAME' as const, message: 'FRAME MATERIAL MISSING' }
        : core < 1
          ? { code: 'MISSING_REACTOR' as const, message: 'REACTOR MATERIAL MISSING' }
          : rune < 1
            ? { code: 'MISSING_SIGIL' as const, message: 'CONTROL SIGIL MISSING' }
            : undefined;

  return {
    canFabricate: !blocker,
    actionCost: FABRICATION_ACTION_COST,
    slots: { used, max: state.maxUnits, after: blocker ? used : used + 1 },
    stockChanges,
    blocker,
  };
}

export function fabricateGolem(
  state: CanonicalFabricationState,
  request: FabricationRequest,
  now = Date.now(),
): FabricationResult {
  const evaluation = evaluateFabrication(state, request);
  if (!evaluation.canFabricate) {
    return { ok: false, state, reason: evaluation.blocker!.code, evaluation };
  }

  const golem: Golem = {
    id: `golem_${now}`,
    name: generateGolemName(request.body, request.core, request.rune),
    body: request.body,
    core: request.core,
    rune: request.rune,
    stats: calculateGolemStats(request.body, request.core, request.rune),
    traits: getGolemTraits(request.body, request.core, request.rune),
    createdAt: now,
    expeditionsCount: 0,
    durability: 100,
  };

  return {
    ok: true,
    golem,
    evaluation,
    state: {
      ...state,
      actionsLeft: state.actionsLeft - FABRICATION_ACTION_COST,
      inventory: {
        body: { ...state.inventory.body, [request.body]: state.inventory.body[request.body] - 1 },
        core: { ...state.inventory.core, [request.core]: state.inventory.core[request.core] - 1 },
        rune: { ...state.inventory.rune, [request.rune]: state.inventory.rune[request.rune] - 1 },
      },
      units: [golem, ...state.units],
    },
  };
}
