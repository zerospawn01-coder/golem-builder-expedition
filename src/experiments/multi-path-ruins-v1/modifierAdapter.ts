import { calculateGolemStats, evaluateExpeditionDamage, getGolemTraits } from '../../data/gameData';
import { evaluateCMultiAxis, type BreakthroughRoute } from '../../data/cMultiAxis';
import type { ExpeditionRegion, GolemStats } from '../../types';
import type { R2Build } from './buildEnumerator';
import { R2_PART_CATALOG } from './partCatalog';

export interface R2CauseBreakdown {
  environmentCause: number;
  armorCause: number;
  mobilityCause: number;
  workCause: number;
  encounterCause: number;
}

export interface R2Evaluation extends R2CauseBreakdown {
  access: boolean;
  total: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'BLOCKED';
  route?: BreakthroughRoute;
  stats: GolemStats;
}

export function applyR2StatModifiers(build: R2Build): GolemStats {
  const base = calculateGolemStats(build.body, build.core, build.rune);
  return build.experimentalParts.reduce((stats, id) => {
    const modifier = R2_PART_CATALOG[id].stats;
    return {
      power: Math.max(0, stats.power + (modifier.power ?? 0)),
      armor: Math.max(0, stats.armor + (modifier.armor ?? 0)),
      mobility: Math.max(0, stats.mobility + (modifier.mobility ?? 0)),
      work: Math.max(0, stats.work + (modifier.work ?? 0)),
    };
  }, base);
}

function finish(causes: R2CauseBreakdown, access: boolean, stats: GolemStats, route?: BreakthroughRoute): R2Evaluation {
  if (!access) return { ...causes, access, stats, route, total: 0, status: 'BLOCKED' };
  const total = Object.values(causes).reduce((sum, value) => sum + value, 0);
  return { ...causes, access, stats, route, total, status: total >= 100 ? 'FAILED' : total >= 55 ? 'PARTIAL' : 'SUCCESS' };
}

// Both prediction and resolution call this exact pure evaluator.
export function evaluateR2Build(build: R2Build, region: ExpeditionRegion): R2Evaluation {
  const stats = applyR2StatModifiers(build);
  const traits = getGolemTraits(build.body, build.core, build.rune);
  const access = !region.accessTrait || traits.includes(region.accessTrait);
  if (region.id !== 'region_ruins') {
    const raw = evaluateExpeditionDamage(region, { stats, traits, durability: 100 });
    return finish({
      environmentCause: raw.resistDamage,
      armorCause: 0,
      mobilityCause: raw.mobilityDamage,
      workCause: 0,
      encounterCause: raw.encounterDamage,
    }, access, stats);
  }

  const raw = evaluateCMultiAxis(stats, traits.includes('heat_proof'), region, 100);
  let armorCause = raw.route === 'ARMOR' ? raw.routeDamage : 0;
  let workCause = raw.route === 'WORK' ? raw.routeDamage : 0;
  if (build.experimentalParts.includes('XR-CS-01_DUAL_CHANNEL')) {
    armorCause -= Math.floor(armorCause * 0.25);
    workCause -= Math.floor(workCause * 0.25);
  }
  return finish({
    environmentCause: raw.environmentDamage,
    armorCause,
    mobilityCause: raw.navigationDamage + (raw.route === 'MOBILITY' ? raw.routeDamage : 0),
    workCause,
    encounterCause: raw.route === 'POWER' ? raw.routeDamage : 0,
  }, access, stats, raw.route);
}
