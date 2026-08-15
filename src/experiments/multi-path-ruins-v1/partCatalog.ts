import type { GolemStats } from '../../types';

export type R2PartId = 'XR-FR-01_ELDERWOOD' | 'XR-RE-01_VOID' | 'XR-CS-01_DUAL_CHANNEL';
export type R2Category = 'FRAME' | 'REACTOR' | 'CONTROL_SIGIL';

export interface R2Part {
  id: R2PartId;
  category: R2Category;
  stats: Partial<GolemStats>;
  costMultiplier: number;
  causeModifier?: { armor: 0.25; work: 0.25 };
}

export const R2_PART_CATALOG: Readonly<Record<R2PartId, R2Part>> = {
  'XR-FR-01_ELDERWOOD': { id: 'XR-FR-01_ELDERWOOD', category: 'FRAME', stats: { power: -1, armor: -1, mobility: 2 }, costMultiplier: 1.25 },
  'XR-RE-01_VOID': { id: 'XR-RE-01_VOID', category: 'REACTOR', stats: { power: 2, armor: -1, mobility: -1, work: 1 }, costMultiplier: 1.5 },
  'XR-CS-01_DUAL_CHANNEL': { id: 'XR-CS-01_DUAL_CHANNEL', category: 'CONTROL_SIGIL', stats: {}, costMultiplier: 1.25, causeModifier: { armor: 0.25, work: 0.25 } },
};

// Canonical fabrication consumes one item per category. V1 replaces that category cost.
export function experimentalCategoryCost(part: R2Part): number {
  return Math.ceil(1 * part.costMultiplier);
}
