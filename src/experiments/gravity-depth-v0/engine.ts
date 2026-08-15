import { calculateGolemStats } from '../../data/gameData';
import type { BodyType, CoreType, GolemStats, RuneType } from '../../types';
import type {
  FrameMass,
  GravityCargoItem,
  GravityDepth,
  GravityDepthEvaluation,
  GravityExperimentUnit,
  GravityRoute,
  GravityUnitSnapshot,
  PrototypeMaterialId,
} from './types';

export const PROTOTYPE_MATERIALS: Record<PrototypeMaterialId, {
  name: string;
  stats: Partial<GolemStats>;
  mass: FrameMass;
  gravityControl: boolean;
}> = {
  low_mass_composite: { name: 'LOW-MASS COMPOSITE / 低質量複合材', stats: { mobility: 3, armor: -3 }, mass: 'LIGHT', gravityControl: false },
  dense_ferrous_material: { name: 'DENSE FERROUS MATERIAL / 高密度鉄材', stats: { armor: 4, power: 1, mobility: -3, work: -1 }, mass: 'HEAVY', gravityControl: false },
  gravity_shift_crystal: { name: 'GRAVITY-SHIFT CRYSTAL / 重力偏移結晶', stats: {}, mass: 'MEDIUM', gravityControl: true },
};

export const BASE_FRAME_MASS: Record<BodyType, FrameMass> = {
  wood: 'LIGHT',
  clay: 'MEDIUM',
  stone: 'HEAVY',
  iron: 'HEAVY',
};

export function isPrototypeMaterialAvailable(
  material: PrototypeMaterialId,
  knownMaterials: readonly PrototypeMaterialId[],
  inventory: Readonly<Record<PrototypeMaterialId, number>>,
): boolean {
  return knownMaterials.includes(material) && inventory[material] > 0;
}

export function getGravityRewardDisplayName(
  item: Pick<GravityCargoItem, 'name' | 'prototypeMaterialId'>,
  knownMaterials: readonly PrototypeMaterialId[],
): string {
  return item.prototypeMaterialId && !knownMaterials.includes(item.prototypeMaterialId)
    ? 'UNCLASSIFIED MATERIAL'
    : item.name;
}

export function applyPrototypeMaterial(stats: GolemStats, material?: PrototypeMaterialId): GolemStats {
  const modifier = material ? PROTOTYPE_MATERIALS[material].stats : {};
  return {
    power: Math.max(0, stats.power + (modifier.power ?? 0)),
    armor: Math.max(0, stats.armor + (modifier.armor ?? 0)),
    mobility: Math.max(0, stats.mobility + (modifier.mobility ?? 0)),
    work: Math.max(0, stats.work + (modifier.work ?? 0)),
  };
}

export function createGravityUnit(
  id: string,
  body: BodyType,
  core: CoreType,
  rune: RuneType,
  material?: PrototypeMaterialId,
  isStarter = false,
): GravityExperimentUnit {
  const baseStats = calculateGolemStats(body, core, rune);
  return {
    id,
    name: `UNIT ${id.toUpperCase()}`,
    body,
    core,
    rune,
    stats: applyPrototypeMaterial(baseStats, material),
    durability: 100,
    frameMass: material ? PROTOTYPE_MATERIALS[material].mass : BASE_FRAME_MASS[body],
    gravityControl: material ? PROTOTYPE_MATERIALS[material].gravityControl : false,
    prototypeMaterial: material,
    isStarter,
  };
}

function finishEvaluation(
  depth: GravityDepth,
  unit: GravityUnitSnapshot,
  damageSources: GravityDepthEvaluation['damageSources'],
  rewardPreview: GravityDepthEvaluation['rewardPreview'],
  route?: GravityRoute,
): GravityDepthEvaluation {
  const totalDamage = damageSources.reduce((sum, source) => sum + source.amount, 0);
  const durabilityAfter = Math.max(0, unit.durability - totalDamage);
  const destroyed = durabilityAfter <= 0;
  const status = destroyed ? 'CRITICAL' : durabilityAfter <= 60 ? 'WARNING' : 'ACCEPTABLE';
  return { depth, route, damageSources, totalDamage, durabilityBefore: unit.durability, durabilityAfter, status, destroyed, rewardPreview };
}

export function evaluateGravityDepth(
  depth: GravityDepth,
  unit: GravityUnitSnapshot,
  route?: GravityRoute,
): GravityDepthEvaluation {
  if (depth === 1) {
    const mobilityDeficit = Math.max(0, 4 - unit.stats.mobility);
    return finishEvaluation(1, unit, [
      { id: 'mobility_deficit', label: 'MOBILITY DEFICIT', amount: Math.min(12, mobilityDeficit * 4) },
    ], [{ id: 'basic_frame_material', name: 'STONE SCRAP / 石質スクラップ', count: 2, weight: 1, baseBodyId: 'stone' }]);
  }

  if (depth === 2) {
    const massDamage = unit.frameMass === 'HEAVY' ? 18 : unit.frameMass === 'MEDIUM' ? 8 : 0;
    const mobilityDamage = Math.max(0, 8 - unit.stats.mobility) * 3;
    const rawGravity = 6 + massDamage + mobilityDamage;
    const gravityDamage = unit.gravityControl ? Math.floor(rawGravity * 0.5) : rawGravity;
    return finishEvaluation(2, unit, [
      { id: 'gravity_base', label: 'GRAVITY FIELD', amount: unit.gravityControl ? Math.floor(6 * 0.5) : 6 },
      { id: 'mass_load', label: 'MASS LOAD', amount: unit.gravityControl ? Math.floor(massDamage * 0.5) : massDamage },
      { id: 'mobility_deficit', label: 'MOBILITY DEFICIT', amount: gravityDamage - (unit.gravityControl ? Math.floor(6 * 0.5) : 6) - (unit.gravityControl ? Math.floor(massDamage * 0.5) : massDamage) },
    ], [{ id: 'low_mass_composite', name: PROTOTYPE_MATERIALS.low_mass_composite.name, count: 1, weight: 2, prototypeMaterialId: 'low_mass_composite' }]);
  }

  if (depth === 3) {
    if (!route) throw new Error('DEPTH 3 requires a POWER or WORK route');
    if (route === 'POWER') {
      return finishEvaluation(3, unit, [
        { id: 'forced_breach', label: 'FORCED BREACH', amount: 8 },
        { id: 'power_deficit', label: 'POWER DEFICIT', amount: Math.max(0, 10 - unit.stats.power) * 4 },
      ], [{ id: 'dense_ferrous_material', name: PROTOTYPE_MATERIALS.dense_ferrous_material.name, count: 1, weight: 2, prototypeMaterialId: 'dense_ferrous_material' }], route);
    }
    return finishEvaluation(3, unit, [
      { id: 'service_shaft', label: 'SERVICE SHAFT', amount: 4 },
      { id: 'work_deficit', label: 'WORK DEFICIT', amount: Math.max(0, 9 - unit.stats.work) * 3 },
      { id: 'mobility_deficit', label: 'MOBILITY DEFICIT', amount: Math.max(0, 6 - unit.stats.mobility) * 2 },
    ], [{ id: 'low_mass_composite', name: PROTOTYPE_MATERIALS.low_mass_composite.name, count: 1, weight: 2, prototypeMaterialId: 'low_mass_composite' }], route);
  }

  const rawGravity = 18 + Math.max(0, 10 - unit.stats.mobility) * 4;
  const gravityDamage = unit.gravityControl ? Math.floor(rawGravity * 0.4) : rawGravity;
  return finishEvaluation(4, unit, [
    { id: 'gravity_well', label: 'GRAVITY WELL', amount: gravityDamage },
    { id: 'structural_deficit', label: 'STRUCTURAL DEFICIT', amount: Math.max(0, 8 - unit.stats.armor) * 3 },
  ], [{ id: 'gravity_shift_crystal', name: PROTOTYPE_MATERIALS.gravity_shift_crystal.name, count: 1, weight: 2, prototypeMaterialId: 'gravity_shift_crystal' }]);
}

export function snapshotUnit(unit: GravityExperimentUnit, durability = unit.durability): GravityUnitSnapshot {
  return { golemId: unit.id, stats: unit.stats, durability, frameMass: unit.frameMass, gravityControl: unit.gravityControl };
}

export const ALL_BUILD_PARTS = {
  bodies: ['stone', 'iron', 'wood', 'clay'] as BodyType[],
  cores: ['fire', 'water', 'wind', 'earth'] as CoreType[],
  runes: ['attack', 'defense', 'speed', 'regen'] as RuneType[],
};
