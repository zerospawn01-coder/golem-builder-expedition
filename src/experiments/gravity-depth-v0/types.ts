import type { BodyType, CoreType, GolemStats, RuneType } from '../../types';

export type GravityDepth = 1 | 2 | 3 | 4;
export type FrameMass = 'LIGHT' | 'MEDIUM' | 'HEAVY';
export type GravityRoute = 'POWER' | 'WORK';
export type PrototypeMaterialId = 'low_mass_composite' | 'dense_ferrous_material' | 'gravity_shift_crystal';

export interface GravityUnitSnapshot {
  golemId: string;
  stats: GolemStats;
  durability: number;
  frameMass: FrameMass;
  gravityControl: boolean;
}

export interface GravityDamageSource {
  id: string;
  label: string;
  amount: number;
}

export interface GravityCargoItem {
  id: string;
  name: string;
  count: number;
  weight: number;
  prototypeMaterialId?: PrototypeMaterialId;
  baseBodyId?: BodyType;
}

export interface GravityRewardPreview extends GravityCargoItem {}

export interface GravityDepthEvaluation {
  depth: GravityDepth;
  route?: GravityRoute;
  damageSources: GravityDamageSource[];
  totalDamage: number;
  durabilityBefore: number;
  durabilityAfter: number;
  status: 'ACCEPTABLE' | 'WARNING' | 'CRITICAL';
  destroyed: boolean;
  rewardPreview: GravityRewardPreview[];
}

export interface GravityRunState {
  runId: string;
  golemId: string;
  currentDepth: GravityDepth;
  durability: number;
  unsecuredCargo: GravityCargoItem[];
  depthResults: GravityDepthEvaluation[];
  chosenRoute?: GravityRoute;
  phase: 'IN_PROGRESS' | 'ROUTE_CHOICE' | 'RETURNING' | 'DESTROYED' | 'COMPLETE';
}

export interface GravityExperimentUnit {
  id: string;
  name: string;
  body: BodyType;
  core: CoreType;
  rune: RuneType;
  stats: GolemStats;
  durability: number;
  frameMass: FrameMass;
  gravityControl: boolean;
  prototypeMaterial?: PrototypeMaterialId;
  isStarter?: boolean;
}

export interface GravityExperimentInventory {
  body: Record<BodyType, number>;
  core: Record<CoreType, number>;
  rune: Record<RuneType, number>;
  prototype: Record<PrototypeMaterialId, number>;
}

export interface GravityExperimentState {
  day: number;
  actionsLeft: number;
  inventory: GravityExperimentInventory;
  units: GravityExperimentUnit[];
  activeUnitId: string;
  run: GravityRunState | null;
  selectedCargoIds: string[];
  knownMaterials: PrototypeMaterialId[];
  comparisonUnitIds: string[];
  comparisonCandidates: GravityExperimentUnit[];
  nextHypothesis: string;
  playtestRecords: Array<{
    depth: GravityDepth;
    choice: 'RETURN' | 'CONTINUE' | GravityRoute;
    reason: string;
    recordedAt: number;
  }>;
}
