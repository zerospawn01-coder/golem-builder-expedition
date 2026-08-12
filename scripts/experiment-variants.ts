import { EXPEDITION_REGIONS, getGolemTraits } from '../src/data/gameData';
import type { ExpeditionRegion, Golem, TraitType } from '../src/types';

export type VariantName = 'BASELINE' | 'A_NUMERIC' | 'B_RECIPE' | 'C_MULTI_AXIS';

export const VARIANTS: VariantName[] = ['BASELINE', 'A_NUMERIC', 'B_RECIPE', 'C_MULTI_AXIS'];

export function parseVariant(): VariantName {
  const raw = process.argv.find((argument) => argument.startsWith('--variant='))?.split('=')[1] ?? 'BASELINE';
  if (!VARIANTS.includes(raw as VariantName)) throw new Error(`Unknown variant: ${raw}`);
  return raw as VariantName;
}

export function traitsFor(variant: VariantName, body: Golem['body'], core: Golem['core'], rune: Golem['rune']): TraitType[] {
  const traits = getGolemTraits(body, core, rune);
  if (variant === 'B_RECIPE' && core === 'water' && rune === 'regen' && !traits.includes('mana_sense')) {
    return [...traits, 'mana_sense'];
  }
  return traits;
}

export function regionsFor(variant: VariantName): ExpeditionRegion[] {
  return EXPEDITION_REGIONS.map((region) => {
    if (variant !== 'A_NUMERIC' || region.id !== 'region_ruins') return region;
    return {
      ...region,
      recommendedStats: { ...region.recommendedStats, power: 5, mobility: 7 },
    };
  });
}

export function simulationExperiment(variant: VariantName, region: ExpeditionRegion) {
  if (region.id !== 'region_ruins') return undefined;
  if (variant === 'A_NUMERIC') return { resistPenalty: 36 };
  if (variant === 'C_MULTI_AXIS') {
    return {
      resistPenalty: 42,
      mobilityDamage: (golem: Golem, target: ExpeditionRegion) => {
        const deficit = Math.max(0, target.recommendedStats.mobility - golem.stats.mobility);
        return Math.min(deficit * 9, Math.max(0, target.recommendedStats.work - golem.stats.work) * 6);
      },
      encounterDamage: (golem: Golem, target: ExpeditionRegion) => {
        const powerRoute = Math.max(5, (target.recommendedStats.power - golem.stats.power) * 12 + 12);
        const armorRoute = Math.max(5, (target.recommendedStats.armor - golem.stats.armor) * 10 + 10);
        const mobilityRoute = Math.max(5, (target.recommendedStats.mobility - golem.stats.mobility) * 9 + 8);
        const workRoute = Math.max(5, (target.recommendedStats.work - golem.stats.work) * 8 + 10);
        return Math.min(powerRoute, armorRoute, mobilityRoute, workRoute);
      },
    };
  }
  return undefined;
}

export const VARIANT_DESCRIPTIONS: Record<VariantName, string> = {
  BASELINE: 'v2.0.0 rules; no changes',
  A_NUMERIC: 'Ancient Ruins only: POWER 5, MOBILITY 7, missing heat penalty 36',
  B_RECIPE: 'Mana Sense also manifests from Water Core + Capacity Rune',
  C_MULTI_AXIS: 'Ancient Ruins: best of POWER/ARMOR/MOBILITY/WORK routes; missing heat penalty 42',
};
