import type { ExpeditionRegion, Golem, GolemStats } from '../types';

export type BreakthroughRoute = 'POWER' | 'ARMOR' | 'MOBILITY' | 'WORK';

export const ROUTE_LABELS: Record<BreakthroughRoute, { name: string; action: string; result: string }> = {
  POWER: { name: '正面破砕', action: '守護像を破壊', result: 'POWERで守護像を正面から破砕した' },
  ARMOR: { name: '装甲強行', action: '攻撃を受けて突破', result: 'ARMORで攻撃を受け止め強行突破した' },
  MOBILITY: { name: '高速回避', action: '守護像を回避', result: 'MOBILITYで守護像を回避した' },
  WORK: { name: '経路開削', action: '封印側道を開削', result: 'WORKで封印側道を開削し正面戦闘を避けた' },
};

export interface CMultiAxisEvaluation {
  route: BreakthroughRoute;
  routeDamage: number;
  routeDamages: Record<BreakthroughRoute, number>;
  environmentDamage: number;
  navigationDamage: number;
  totalDamage: number;
  status: 'SAFE' | 'DAMAGED' | 'PARTIAL' | 'FAILED';
}

export function evaluateCMultiAxis(stats: GolemStats, hasHeatProof: boolean, region: ExpeditionRegion): CMultiAxisEvaluation {
  const routeDamages: Record<BreakthroughRoute, number> = {
    POWER: Math.max(5, (region.recommendedStats.power - stats.power) * 12 + 12),
    ARMOR: Math.max(5, (region.recommendedStats.armor - stats.armor) * 10 + 10),
    MOBILITY: Math.max(5, (region.recommendedStats.mobility - stats.mobility) * 9 + 8),
    WORK: Math.max(5, (region.recommendedStats.work - stats.work) * 8 + 10),
  };
  const route = (Object.entries(routeDamages) as Array<[BreakthroughRoute, number]>).sort((a, b) => a[1] - b[1])[0][0];
  const routeDamage = routeDamages[route];
  const mobilityDeficit = Math.max(0, region.recommendedStats.mobility - stats.mobility);
  const workDeficit = Math.max(0, region.recommendedStats.work - stats.work);
  const navigationDamage = Math.min(mobilityDeficit * 9, workDeficit * 6);
  const environmentDamage = hasHeatProof ? 0 : 42;
  const totalDamage = environmentDamage + navigationDamage + routeDamage;
  const status = totalDamage >= 100 ? 'FAILED' : totalDamage >= 55 ? 'PARTIAL' : totalDamage >= 25 ? 'DAMAGED' : 'SAFE';
  return { route, routeDamage, routeDamages, environmentDamage, navigationDamage, totalDamage, status };
}

export function cMultiAxisExperiment(region: ExpeditionRegion) {
  if (region.id !== 'region_ruins') return undefined;
  return {
    resistPenalty: 42,
    mobilityDamage: (golem: Golem, target: ExpeditionRegion) => evaluateCMultiAxis(golem.stats, golem.traits.includes('heat_proof'), target).navigationDamage,
    encounterDamage: (golem: Golem, target: ExpeditionRegion) => evaluateCMultiAxis(golem.stats, golem.traits.includes('heat_proof'), target).routeDamage,
  };
}
