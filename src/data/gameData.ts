import {
  BodyMaterial,
  CoreMaterial,
  RuneMaterial,
  MaterialCount,
  BodyType,
  CoreType,
  RuneType,
  GolemStats,
  TraitType,
  ExpeditionRegion,
  ExpeditionReport,
  ExpeditionLogEvent,
  Golem,
  MaterialCategory,
} from '../types';

export interface TraitInfo {
  id: TraitType;
  name: string;
  icon: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  description: string;
  synergyRecipe: string; // どのように作れるかのヒント
}

export const TRAITS: Record<TraitType, TraitInfo> = {
  flight: {
    id: 'flight',
    name: '飛行',
    icon: '🪶',
    badgeBg: 'bg-indigo-950/60',
    badgeBorder: 'border-indigo-600/60',
    textColor: 'text-indigo-400',
    description: '空力を受けて空中を飛行・滑空。天空の浮遊遺跡へ到達可能にする。',
    synergyRecipe: '【木パーツ】＋【風の核】または【速度ルーン】',
  },
  water_action: {
    id: 'water_action',
    name: '水中行動',
    icon: '🌊',
    badgeBg: 'bg-cyan-950/60',
    badgeBorder: 'border-cyan-600/60',
    textColor: 'text-cyan-400',
    description: '高水圧下の水中でも自在に作動。水没海洞の探査を可能にする。',
    synergyRecipe: '【粘土パーツ】＋【水の核】または【地の核】',
  },
  poison_proof: {
    id: 'poison_proof',
    name: '毒耐性',
    icon: '☣️',
    badgeBg: 'bg-emerald-950/60',
    badgeBorder: 'border-emerald-600/60',
    textColor: 'text-emerald-400',
    description: '腐食性のある瘴気・毒霧に抗う。毒霧湿原の走破を可能にする。',
    synergyRecipe: '【鉄パーツ】＋【防御ルーン】または【地の核】',
  },
  heat_proof: {
    id: 'heat_proof',
    name: '耐熱',
    icon: '🔥',
    badgeBg: 'bg-rose-950/60',
    badgeBorder: 'border-rose-600/60',
    textColor: 'text-rose-400',
    description: '熱気や溶岩蒸気を無効化。火山深部での被ダメージを大幅カット。',
    synergyRecipe: '【石パーツ】＋【火の核】または【再生ルーン】',
  },
  night_vision: {
    id: 'night_vision',
    name: '暗視',
    icon: '👁️',
    badgeBg: 'bg-amber-950/60',
    badgeBorder: 'border-amber-600/60',
    textColor: 'text-amber-400',
    description: '暗闇でも周囲の障害物や敵を正確に感知。暗黒廃坑での事故を防ぐ。',
    synergyRecipe: '【木パーツ】＋【火の核】または【地の核】＋【積載ルーン】',
  },
  mana_sense: {
    id: 'mana_sense',
    name: '魔力感知',
    icon: '🔮',
    badgeBg: 'bg-purple-950/60',
    badgeBorder: 'border-purple-600/60',
    textColor: 'text-purple-400',
    description: '微細な魔力波長を察知し、稀少な魔導核やレアパーツの発見率を跳ね上げる。',
    synergyRecipe: '【水の核】＋【攻撃ルーン】',
  },
};

export const BODIES: Record<BodyType, BodyMaterial> = {
  stone: {
    id: 'stone',
    name: '石',
    nameEn: 'Stone Body',
    description: '重厚で頑丈な岩石構造。防御・装甲が高く火熱に耐える基本素体。',
    stats: { power: 4, armor: 8, mobility: 2, work: 5 },
    color: '#78716c',
    texturePattern: 'rock',
  },
  wood: {
    id: 'wood',
    name: '木',
    nameEn: 'Wood Body',
    description: '風を孕む軽量な霊木パーツ。高機動力を誇り風や速度との相性が抜群。',
    stats: { power: 2, armor: 3, mobility: 8, work: 5 },
    color: '#a16207',
    texturePattern: 'wood',
  },
  iron: {
    id: 'iron',
    name: '鉄',
    nameEn: 'Iron Body',
    description: '高密度の金属フレーム。凄まじい撃退力と重装甲を持ち、防腐耐性に優れる。',
    stats: { power: 7, armor: 7, mobility: 2, work: 4 },
    color: '#64748b',
    texturePattern: 'metal',
  },
  clay: {
    id: 'clay',
    name: '粘土',
    nameEn: 'Clay Body',
    description: '伸縮自在な泥状構造体。耐水性に優れ、水中や高圧地帯で真価を発揮。',
    stats: { power: 3, armor: 4, mobility: 5, work: 6 },
    color: '#c2410c',
    texturePattern: 'clay',
  },
};

export const CORES: Record<CoreType, CoreMaterial> = {
  fire: {
    id: 'fire',
    name: '火の核',
    nameEn: 'Fire Core',
    description: '灼熱の魔導熱源。破壊力（POWER）を引き上げる。',
    statModifier: { power: 4 },
    element: '火',
    glowColor: '#ef4444',
  },
  wind: {
    id: 'wind',
    name: '風の核',
    nameEn: 'Wind Core',
    description: '風圧流を生む高回転核。移動力（MOBILITY）を急上昇させる。',
    statModifier: { mobility: 5 },
    element: '風',
    glowColor: '#10b981',
  },
  water: {
    id: 'water',
    name: '水の核',
    nameEn: 'Water Core',
    description: '流動する水流回路。衝撃吸収（ARMOR）に優れる。',
    statModifier: { armor: 3, work: 2 },
    element: '水',
    glowColor: '#06b6d4',
  },
  earth: {
    id: 'earth',
    name: '地の核',
    nameEn: 'Earth Core',
    description: '大地の霊気を宿す重厚な核。作業採掘能力（WORK）を高める。',
    statModifier: { work: 4, armor: 2 },
    element: '地',
    glowColor: '#eab308',
  },
};

export const RUNES: Record<RuneType, RuneMaterial> = {
  attack: {
    id: 'attack',
    name: '攻撃ルーン',
    nameEn: 'Rune of Offense',
    description: '破砕の刻印。力強さを高める。',
    statModifier: { power: 3 },
    traitName: '破砕の刻印',
    traitEffect: 'POWER +3',
    symbolColor: '#f97316',
  },
  defense: {
    id: 'defense',
    name: '防御ルーン',
    nameEn: 'Rune of Defense',
    description: '堅牢なる防護壁。装甲を強化する。',
    statModifier: { armor: 3 },
    traitName: '金剛障壁',
    traitEffect: 'ARMOR +3',
    symbolColor: '#3b82f6',
  },
  speed: {
    id: 'speed',
    name: '速度ルーン',
    nameEn: 'Rune of Speed',
    description: '疾駆する刻印。走行・飛行力を増強する。',
    statModifier: { mobility: 3 },
    traitName: '神速脚',
    traitEffect: 'MOBILITY +3',
    symbolColor: '#8b5cf6',
  },
  regen: {
    id: 'regen',
    name: '再生ルーン',
    nameEn: 'Rune of Capacity',
    description: '継続作業を支える刻印。積載作業量を増やす。',
    statModifier: { work: 3, armor: 1 },
    traitName: '作業補強',
    traitEffect: 'WORK +3 / ARMOR +1',
    symbolColor: '#22c55e',
  },
};

/**
 * Calculate total stats from Body + Core + Rune
 */
export function calculateGolemStats(
  bodyType: BodyType,
  coreType: CoreType,
  runeType: RuneType
): GolemStats {
  const b = BODIES[bodyType].stats;
  const c = CORES[coreType].statModifier;
  const r = RUNES[runeType].statModifier;

  return {
    power: b.power + (c.power || 0) + (r.power || 0),
    armor: b.armor + (c.armor || 0) + (r.armor || 0),
    mobility: b.mobility + (c.mobility || 0) + (r.mobility || 0),
    work: b.work + (c.work || 0) + (r.work || 0),
  };
}

/**
 * Synergistic Trait Manifestation Engine!
 * Traits appear through specific combinations of Body, Core, and Rune.
 */
export function getGolemTraits(
  body: BodyType,
  core: CoreType,
  rune: RuneType
): TraitType[] {
  const traits: TraitType[] = [];

  // 1. FLIGHT (飛行): Wood + Wind OR Wood + Speed
  if ((body === 'wood' && core === 'wind') || (body === 'wood' && rune === 'speed')) {
    traits.push('flight');
  }

  // 2. WATER ACTION (水中行動): Clay + Water OR Clay + Earth
  if ((body === 'clay' && core === 'water') || (body === 'clay' && core === 'earth')) {
    traits.push('water_action');
  }

  // 3. POISON PROOF (毒耐性): Iron + Defense OR Iron + Earth
  if ((body === 'iron' && rune === 'defense') || (body === 'iron' && core === 'earth')) {
    traits.push('poison_proof');
  }

  // 4. HEAT PROOF (耐熱): Stone + Fire OR Stone + Regen
  if ((body === 'stone' && core === 'fire') || (body === 'stone' && rune === 'regen')) {
    traits.push('heat_proof');
  }

  // 5. NIGHT VISION (暗視): Earth + Regen OR Wood + Fire
  if ((body === 'wood' && core === 'fire') || (core === 'earth' && rune === 'regen')) {
    traits.push('night_vision');
  }

  // 6. MANA SENSE (魔力感知): Fire + Attack OR Wind + Attack
  if (core === 'water' && rune === 'attack') {
    traits.push('mana_sense');
  }

  return traits;
}

/**
 * Automatic Name Generator for Golem combinations
 */
export function generateGolemName(
  body: BodyType,
  core: CoreType,
  rune: RuneType
): string {
  const specialNames: Record<string, string> = {
    'stone-fire-attack': '火炎石像ゴーレム',
    'iron-earth-defense': '城塞ゴーレム',
    'wood-wind-speed': '疾風飛空木偶',
    'clay-water-regen': '潜水泥人形',
    'iron-fire-attack': '灼熱鋼鉄兵',
    'stone-earth-defense': '金剛巌石像',
    'wood-fire-attack': '爆炎機巧木偶',
    'clay-earth-defense': '大地の泥巨人',
  };

  const key = `${body}-${core}-${rune}`;
  if (specialNames[key]) {
    return specialNames[key];
  }

  const corePrefixes: Record<CoreType, string> = {
    fire: '火炎の',
    water: '流水の',
    wind: '疾風の',
    earth: '金剛の',
  };

  const bodyNouns: Record<BodyType, string> = {
    stone: '石像',
    iron: '鋼鉄兵',
    wood: '木偶',
    clay: '泥人形',
  };

  const runeTitles: Record<RuneType, string> = {
    attack: ' [破砕]',
    defense: ' [金剛]',
    speed: ' [飛空]',
    regen: ' [積載]',
  };

  return `${corePrefixes[core]}${bodyNouns[body]}${runeTitles[rune]}`;
}

export const EXPEDITION_REGIONS: ExpeditionRegion[] = [
  {
    id: 'region_quarry',
    name: '風化した採石場',
    dangerStars: 1,
    recommendedStats: { power: 4, armor: 3, mobility: 2, work: 5 },
    hazards: ['崩れかけた岩壁', '採掘用魔導機の暴走'],
    description: '工房近郊の古い採石場。POWERで岩盤を砕き、WORKで基礎素材を持ち帰る最初の試験地。',
    icon: '🪨',
    bgGradient: 'from-stone-900/70 to-[#121417]',
    possibleLoot: [
      { category: 'body', id: 'stone', name: '石材', rarity: 'common', amountMin: 2, amountMax: 4 },
      { category: 'body', id: 'clay', name: '魔力粘土', rarity: 'uncommon', amountMin: 1, amountMax: 2 },
      { category: 'core', id: 'earth', name: '地の核', rarity: 'uncommon', amountMin: 1, amountMax: 1 },
      { category: 'rune', id: 'defense', name: '防御ルーン', rarity: 'rare', amountMin: 1, amountMax: 1 },
    ],
    keyNotice: '進入特性なし：POWERとWORKの配分が回収効率を左右する',
  },
  {
    id: 'region_forest',
    name: 'ざわめく深緑林',
    dangerStars: 1,
    recommendedStats: { power: 3, armor: 3, mobility: 6, work: 4 },
    hazards: ['密生する霊樹の根', '縄張りを守る牙獣'],
    description: '足場の悪い樹海。軽量で素早い機体ほど奥へ進み、風系素材や霊木を回収できる。',
    icon: '🌲',
    bgGradient: 'from-emerald-950/60 to-[#121417]',
    possibleLoot: [
      { category: 'body', id: 'wood', name: '霊木', rarity: 'common', amountMin: 2, amountMax: 4 },
      { category: 'core', id: 'wind', name: '風の核', rarity: 'uncommon', amountMin: 1, amountMax: 2 },
      { category: 'rune', id: 'speed', name: '速度ルーン', rarity: 'uncommon', amountMin: 1, amountMax: 1 },
      { category: 'rune', id: 'regen', name: '積載ルーン', rarity: 'rare', amountMin: 1, amountMax: 1 },
    ],
    keyNotice: '進入特性なし：MOBILITY重視の設計で損傷を抑えられる',
  },
  {
    id: 'region_mine',
    name: '灯なき廃坑',
    dangerStars: 2,
    accessTrait: 'night_vision',
    accessTraitName: '暗視',
    resistTrait: 'night_vision',
    resistTraitName: '暗視',
    recommendedStats: { power: 7, armor: 6, mobility: 4, work: 6 },
    hazards: ['洞窟トロール', '連鎖落石', '崩落した昇降路'],
    description: '光の届かない旧鉱山。【暗視】を発現した専用機だけが進入でき、鉄鉱脈を追跡できる。',
    icon: '⛏️',
    bgGradient: 'from-slate-950/80 to-[#121417]',
    possibleLoot: [
      { category: 'body', id: 'iron', name: '黒鉄鉱', rarity: 'common', amountMin: 2, amountMax: 4 },
      { category: 'core', id: 'fire', name: '火の核', rarity: 'uncommon', amountMin: 1, amountMax: 1 },
      { category: 'rune', id: 'attack', name: '破砕ルーン', rarity: 'uncommon', amountMin: 1, amountMax: 1 },
      { category: 'core', id: 'water', name: '地底水晶核', rarity: 'rare', amountMin: 1, amountMax: 1 },
    ],
    keyNotice: '出撃必須［暗視］：木＋火、または地の核＋積載ルーンで発現',
  },
  {
    id: 'region_ruins',
    name: '封印された古代遺跡',
    dangerStars: 3,
    accessTrait: 'mana_sense',
    accessTraitName: '魔力感知',
    resistTrait: 'heat_proof',
    resistTraitName: '耐熱',
    recommendedStats: { power: 8, armor: 8, mobility: 7, work: 8 },
    hazards: ['古代守護像', '魔力嵐', '灼熱する封印回廊'],
    description: '魔力波長を読める機体だけが入口を発見できる最終地域。耐熱を捨てて積載を取るか、安全を取るかが問われる。',
    icon: '🏛️',
    bgGradient: 'from-violet-950/70 to-[#121417]',
    possibleLoot: [
      { category: 'body', id: 'iron', name: '古代合金', rarity: 'uncommon', amountMin: 1, amountMax: 3 },
      { category: 'core', id: 'water', name: '蒼古代核', rarity: 'rare', amountMin: 1, amountMax: 1 },
      { category: 'rune', id: 'defense', name: '守護ルーン', rarity: 'rare', amountMin: 1, amountMax: 1 },
      { category: 'rune', id: 'regen', name: '積載ルーン', rarity: 'rare', amountMin: 1, amountMax: 1 },
    ],
    keyNotice: '出撃必須［魔力感知］／推奨［耐熱］：探索精度と生還率の両立が課題',
  },
];

/**
 * INITIAL SLIM INVENTORY
 * Forces player to progress from Forest -> Mine/Swamp -> Volcano/Abyss -> Sky!
 */
export const DEFAULT_INVENTORY: MaterialCount = {
  body: {
    stone: 3,
    wood: 2,
    clay: 0,
    iron: 0,
  },
  core: {
    fire: 1,
    wind: 1,
    water: 0,
    earth: 0,
  },
  rune: {
    attack: 1,
    speed: 1,
    defense: 0,
    regen: 0,
  },
};

/**
 * Predicts expedition outcome for UI simulation display in Workshop
 */
export function predictExpeditionOutcome(
  region: ExpeditionRegion,
  stats: GolemStats,
  traits: TraitType[]
) {
  const hasAccessKey = !region.accessTrait || traits.includes(region.accessTrait);
  const hasResistKey = !region.resistTrait || traits.includes(region.resistTrait);

  const powerDiff = stats.power - region.recommendedStats.power;
  const armorDiff = stats.armor - region.recommendedStats.armor;
  const mobilityDiff = stats.mobility - region.recommendedStats.mobility;
  const workDiff = stats.work - region.recommendedStats.work;

  // Base environmental damage estimation
  let baseDamage = 12 + region.dangerStars * 12;

  if (!hasResistKey) {
    baseDamage += region.dangerStars * 20;
  }

  if (mobilityDiff < 0) {
    baseDamage += Math.abs(mobilityDiff) * 9;
  }

  if (powerDiff < 0) {
    baseDamage += Math.abs(powerDiff) * 10;
  } else {
    baseDamage -= Math.min(15, powerDiff * 3);
  }

  if (armorDiff < 0) {
    baseDamage += Math.abs(armorDiff) * 8;
  } else {
    baseDamage -= Math.min(15, armorDiff * 3);
  }

  const minEstimatedDamage = Math.max(5, Math.floor(baseDamage * 0.85));
  const maxEstimatedDamage = Math.min(100, Math.floor(baseDamage * 1.15));

  let statusPrediction: 'SAFE' | 'PARTIAL' | 'DANGER' | 'BLOCKED' = 'SAFE';

  if (!hasAccessKey) {
    statusPrediction = 'BLOCKED';
  } else if (maxEstimatedDamage >= 100) {
    statusPrediction = 'DANGER';
  } else if (maxEstimatedDamage >= 50) {
    statusPrediction = 'PARTIAL';
  } else {
    statusPrediction = 'SAFE';
  }

  return {
    hasAccessKey,
    hasResistKey,
    minEstimatedDamage,
    maxEstimatedDamage,
    statusPrediction,
    statAnalysis: {
      power: { current: stats.power, required: region.recommendedStats.power, ok: powerDiff >= 0 },
      armor: { current: stats.armor, required: region.recommendedStats.armor, ok: armorDiff >= 0 },
      mobility: { current: stats.mobility, required: region.recommendedStats.mobility, ok: mobilityDiff >= 0 },
      work: { current: stats.work, required: region.recommendedStats.work, ok: workDiff >= 0 },
    },
  };
}

/**
 * Simulates an expedition with authentic survival, durability limit checks, and deduplicated loot drops
 */
export function runExpeditionSimulation(
  region: ExpeditionRegion,
  golem: Golem,
  random: () => number = Math.random,
  experiment?: {
    resistPenalty?: number;
    mobilityDamage?: (golem: Golem, region: ExpeditionRegion) => number;
    encounterDamage?: (golem: Golem, region: ExpeditionRegion) => number;
  }
): ExpeditionReport {
  const logs: ExpeditionLogEvent[] = [];
  let totalDamage = 0;
  const currentDurability = golem.durability;

  // Check mandatory ACCESS trait
  if (region.accessTrait && !golem.traits.includes(region.accessTrait)) {
    return {
      regionId: region.id,
      regionName: region.name,
      golemName: golem.name,
      logs: [{
        step: 1,
        type: 'entry',
        title: `🚫 進入不可: 出撃失敗`,
        message: `出撃必須キー【${TRAITS[region.accessTrait].name}】を満たしていないため、目的地へ進入できません。`,
      }],
      totalDamage: 0,
      loots: [],
      status: 'FAILED',
    };
  }

  // Helper check if destroyed mid-expedition against current golem durability
  const isDestroyed = (dmgAcc: number) => dmgAcc >= currentDurability;

  // 1. Entry & Resist Trait Check
  const hasResist = !region.resistTrait || golem.traits.includes(region.resistTrait);
  if (hasResist) {
    logs.push({
      step: 1,
      type: 'entry',
      title: `🧭 地域突入: ${region.name}`,
      message: region.resistTrait
        ? `環境耐性【${TRAITS[region.resistTrait].name}】を発現中！ハザードダメージを大きく無効化して侵入しました。`
        : `出撃条件クリア。順調に調査エリアへ入りました。`,
    });
  } else {
    const traitName = region.resistTrait ? TRAITS[region.resistTrait].name : '推奨耐性';
    const penaltyDamage = experiment?.resistPenalty ?? region.dangerStars * 22;
    totalDamage += penaltyDamage;
    logs.push({
      step: 1,
      type: 'entry',
      title: `⚠️ 推奨耐性欠如: ${region.name}`,
      message: `【${traitName}】未所持のため過酷な環境ダメージを受ける！ (機体損傷 +${penaltyDamage}%)`,
      damageTaken: penaltyDamage,
    });
  }

  // Mid-expedition durability destruction check
  if (isDestroyed(totalDamage)) {
    logs.push({
      step: 2,
      type: 'result',
      title: `🚨 突入直後に機体大破（遠征失敗）`,
      message: `残耐久度（${currentDurability}%）を超える環境ダメージ（${totalDamage}%）を受け機体が破砕！緊急全損撤退。（獲得素材 0）`,
      isSuccess: false,
    });
    return {
      regionId: region.id,
      regionName: region.name,
      golemName: golem.name,
      logs,
      totalDamage,
      loots: [],
      status: 'FAILED',
    };
  }

  // 2. Mobility & Navigation Check
  const mobilityDiff = golem.stats.mobility - region.recommendedStats.mobility;
  if (mobilityDiff < 0) {
    const mobPenalty = experiment?.mobilityDamage?.(golem, region) ?? Math.abs(mobilityDiff) * 9;
    totalDamage += mobPenalty;
    logs.push({
      step: 2,
      type: 'hazard',
      title: `🏃 走破力（MOBILITY）不足`,
      message: `険路や移動障害の回避に失敗！走行・滑空力不足により滑落衝撃（損傷 +${mobPenalty}%）。`,
      damageTaken: mobPenalty,
    });
  } else {
    logs.push({
      step: 2,
      type: 'hazard',
      title: `⚡ スムーズな走破`,
      message: `十分な機動力（MOBILITY ${golem.stats.mobility}）で危険エリアやトラップを軽やかに回避！`,
    });
  }

  // Mid-expedition durability destruction check
  if (isDestroyed(totalDamage)) {
    logs.push({
      step: 3,
      type: 'result',
      title: `🚨 移動途中で機体大破（遠征失敗）`,
      message: `移動中の損傷蓄積（計${totalDamage}%）が出撃時耐久（${currentDurability}%）を超過！機体破砕により素材獲得失敗。（獲得素材 0）`,
      isSuccess: false,
    });
    return {
      regionId: region.id,
      regionName: region.name,
      golemName: golem.name,
      logs,
      totalDamage,
      loots: [],
      status: 'FAILED',
    };
  }

  // 3. Combat & Encounter (POWER / ARMOR)
  const powerDiff = golem.stats.power - region.recommendedStats.power;
  const armorBonus = Math.max(0, golem.stats.armor - region.recommendedStats.armor);
  const baseEncounterDamage = Math.max(12, (region.dangerStars * 20) - armorBonus * 2);

  const experimentalEncounterDamage = experiment?.encounterDamage?.(golem, region);
  if (experimentalEncounterDamage !== undefined) {
    const damage = experimentalEncounterDamage;
    totalDamage += damage;
    logs.push({
      step: 3,
      type: 'encounter',
      title: `🧪 実験variant遭遇判定`,
      message: `複数攻略軸のうち最適な突破方法を採用。（損傷 +${damage}%）`,
      damageTaken: damage,
    });
  } else if (powerDiff >= 0) {
    const damage = Math.max(5, Math.floor(baseEncounterDamage * 0.35));
    totalDamage += damage;
    logs.push({
      step: 3,
      type: 'encounter',
      title: `⚔️ 遭遇戦・障害破砕`,
      message: `【${region.hazards[0] || '敵対生物'}】と遭遇！圧倒的POWER (${golem.stats.power}) で即座に破砕。（損傷 +${damage}%）`,
      damageTaken: damage,
    });
  } else {
    const damage = Math.floor(baseEncounterDamage * 1.5 + Math.abs(powerDiff) * 6);
    totalDamage += damage;
    logs.push({
      step: 3,
      type: 'encounter',
      title: `💥 遭遇戦苦戦・ダメージ大打撃`,
      message: `【${region.hazards[0] || '現地生物'}】に攻撃力不足で大苦戦！装甲（ARMOR ${golem.stats.armor}）で耐えるも大損害。（損傷 +${damage}%）`,
      damageTaken: damage,
    });
  }

  // 4. Survival Check against Current Durability
  if (isDestroyed(totalDamage)) {
    logs.push({
      step: 4,
      type: 'result',
      title: `🚨 遭遇戦で機体大破（遠征失敗）`,
      message: `累積受傷（${totalDamage}%）が出撃前耐久度（${currentDurability}%）をオーバー！全損大破のため素材を持ち帰れず撤退。（獲得素材 0）`,
      isSuccess: false,
    });

    return {
      regionId: region.id,
      regionName: region.name,
      golemName: golem.name,
      logs,
      totalDamage,
      loots: [],
      status: 'FAILED',
    };
  }

  // 5. Mining & Deduplicated Loot Generation
  const lootSlotCount = Math.min(3, 1 + Math.floor(golem.stats.work / 5));
  const workQuantityBonus = 1 + Math.floor(golem.stats.work / 6);
  const hasManaSense = golem.traits.includes('mana_sense');

  const selectedLoots: Array<{ category: MaterialCategory; id: string; name: string; count: number; weight: number }> = [];

  // Deduplication: remove picked loot from candidate pool
  const pool = [...region.possibleLoot];
  for (let s = 0; s < lootSlotCount; s++) {
    if (pool.length === 0) break;
    const randomIndex = Math.floor(random() * pool.length);
    const item = pool[randomIndex];

    let dropChance = 0.8; // common
    if (item.rarity === 'uncommon') dropChance = 0.55;
    if (item.rarity === 'rare') dropChance = 0.3;

    if (hasManaSense) dropChance += 0.2;

    if (random() < dropChance) {
      const baseCount = Math.floor(item.amountMin + random() * (item.amountMax - item.amountMin + 1));
      const finalCount = Math.max(1, baseCount + (workQuantityBonus - 1));

      selectedLoots.push({
        category: item.category,
        id: item.id,
        name: item.name,
        count: finalCount,
        weight: (item.category === 'body' ? 3 : item.category === 'core' ? 2 : 1) * finalCount,
      });

      // Deduplicate: splice away selected item from pool so same item is not chosen in multiple slots
      pool.splice(randomIndex, 1);
    }
  }

  // Partial reward penalty if damaged badly (60% or higher)
  let finalStatus: 'SUCCESS' | 'PARTIAL' = 'SUCCESS';
  if (totalDamage >= 55) {
    finalStatus = 'PARTIAL';
    selectedLoots.forEach((l) => {
      l.count = Math.max(1, Math.floor(l.count * 0.5));
      const unitWeight = l.category === 'body' ? 3 : l.category === 'core' ? 2 : 1;
      l.weight = unitWeight * l.count;
    });
  }

  logs.push({
    step: 4,
    type: 'mining',
    title: `⛏️ 素材採掘・回収結果`,
    message: `作業能力（WORK ${golem.stats.work}）を活用し ${selectedLoots.length} 種類の異なる資源を獲得！${
      finalStatus === 'PARTIAL' ? ' (※中破により回収量50%減)' : ''
    }`,
    lootFound: selectedLoots.map((l) => ({ name: l.name, count: l.count })),
  });

  logs.push({
    step: 5,
    type: 'result',
    title: `🏁 遠征調査完了`,
    message: `帰還成功。総受傷度: ${totalDamage}%。持ち帰った資源を保管庫へ収納しました。`,
    isSuccess: true,
  });

  return {
    regionId: region.id,
    regionName: region.name,
    golemName: golem.name,
    logs,
    totalDamage,
    loots: selectedLoots,
    status: finalStatus,
  };
}
