export type MaterialCategory = 'body' | 'core' | 'rune';

export type BodyType = 'stone' | 'iron' | 'wood' | 'clay';
export type CoreType = 'fire' | 'water' | 'wind' | 'earth';
export type RuneType = 'attack' | 'defense' | 'speed' | 'regen';

export type TraitType =
  | 'heat_proof'    // 耐熱: 火山・溶岩地帯
  | 'poison_proof'  // 毒耐性: 毒霧湿原
  | 'water_action'  // 水中行動: 水没洞窟
  | 'flight'        // 飛行: 浮遊遺跡
  | 'night_vision'  // 暗視: 暗黒廃坑
  | 'mana_sense';   // 魔力感知: 古代遺跡レア捜索

export interface BaseStats {
  power: number;     // 破壊・撃退力
  armor: number;     // 装甲・耐久力
  mobility: number;  // 機動力・走破力
  work: number;      // 作業・回収・積載量
}

export interface BodyMaterial {
  id: BodyType;
  name: string;
  nameEn: string;
  description: string;
  stats: BaseStats;
  color: string;
  texturePattern: string;
}

export interface CoreMaterial {
  id: CoreType;
  name: string;
  nameEn: string;
  description: string;
  statModifier: Partial<BaseStats>;
  element: string;
  glowColor: string;
}

export interface RuneMaterial {
  id: RuneType;
  name: string;
  nameEn: string;
  description: string;
  statModifier: Partial<BaseStats>;
  traitName: string;
  traitEffect: string;
  symbolColor: string;
}

export interface MaterialCount {
  body: Record<BodyType, number>;
  core: Record<CoreType, number>;
  rune: Record<RuneType, number>;
}

export interface GolemStats {
  power: number;
  armor: number;
  mobility: number;
  work: number;
}

export interface Golem {
  id: string;
  name: string;
  body: BodyType;
  core: CoreType;
  rune: RuneType;
  stats: GolemStats;
  traits: TraitType[];
  createdAt: number;
  expeditionsCount: number;
  durability: number; // 0 - 100% (100 = 完全修復状態)
  isStarter?: boolean; // 初期スターターゴーレム判定（解体不可）
}

export interface PredictionOutcome {
  hasAccessKey: boolean;
  hasResistKey: boolean;
  minEstimatedDamage: number;
  maxEstimatedDamage: number;
  statusPrediction: 'SAFE' | 'PARTIAL' | 'DANGER' | 'BLOCKED';
  statAnalysis: {
    power: { current: number; required: number; ok: boolean };
    armor: { current: number; required: number; ok: boolean };
    mobility: { current: number; required: number; ok: boolean };
    work: { current: number; required: number; ok: boolean };
  };
}

export type LootRarity = 'common' | 'uncommon' | 'rare';

export interface LootItem {
  category: MaterialCategory;
  id: string;
  name: string;
  rarity: LootRarity;
  amountMin: number;
  amountMax: number;
}

export interface ExpeditionRegion {
  id: string;
  name: string;
  dangerStars: number; // 1 to 4
  accessTrait?: TraitType; // 出撃必須キー (これがないと出撃不能)
  accessTraitName?: string;
  resistTrait?: TraitType; // 推奨耐性キー (これがないと大損害)
  resistTraitName?: string;
  recommendedStats: {
    power: number;
    armor: number;
    mobility: number;
    work: number;
  };
  hazards: string[];
  description: string;
  icon: string;
  bgGradient: string;
  possibleLoot: LootItem[];
  keyNotice: string;
}

export interface ExpeditionLogEvent {
  step: number;
  type: 'entry' | 'hazard' | 'encounter' | 'mining' | 'result';
  title: string;
  message: string;
  damageTaken?: number;
  lootFound?: Array<{ name: string; count: number }>;
  isSuccess?: boolean;
}

export interface ExpeditionReport {
  regionId: string;
  regionName: string;
  golemName: string;
  logs: ExpeditionLogEvent[];
  totalDamage: number;
  loots: Array<{ category: MaterialCategory; id: string; name: string; count: number; weight: number }>;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED'; // 100%ダメージ超えはFAILED
}
