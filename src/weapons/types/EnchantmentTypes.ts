/**
 * エンチャントシステム - タイプ定義
 *
 * 武器エンチャントで使用される基本的なタイプ定義を提供します。
 */

/**
 * エンチャントタイプ列挙
 */
export enum EnchantmentType {
  // 基本性能強化
  DAMAGE_BOOST = 'damage_boost', // 攻撃力+N
  FIRE_RATE_BOOST = 'fire_rate_boost', // 連続発射数+N
  BULLET_COUNT = 'bullet_count', // 同時発射数+N
  PIERCING = 'piercing', // 貫通+N
  CRITICAL_HIT = 'critical_hit', // クリティカルヒット率+N%

  // 特殊効果
  EXPLOSIVE_ROUNDS = 'explosive_rounds', // 爆発弾
  HOMING_BULLETS = 'homing_bullets', // 追尾弾
  CHAIN_LIGHTNING = 'chain_lightning', // 連鎖攻撃
  FREEZE_EFFECT = 'freeze_effect', // 凍結効果
  LIFE_STEAL = 'life_steal', // ライフスティール

  // 組み合わせ爆発用
  MULTI_SPLIT = 'multi_split', // 多段分裂
  RICOCHET = 'ricochet', // 反射弾
  ORBITAL_STRIKE = 'orbital_strike', // 軌道爆撃
  TIME_DILATION = 'time_dilation', // 時間減速
}

/**
 * エンチャント効果カテゴリ
 */
export enum EnchantmentCategory {
  BASIC = 'basic', // 基本強化
  SPECIAL = 'special', // 特殊効果
  COMBO = 'combo', // 組み合わせ専用
}

/**
 * エンチャント情報
 */
export interface Enchantment {
  type: EnchantmentType;
  tier: number; // 1-5のティア
  value: number; // 効果値
  description: string;
  category: EnchantmentCategory;
}

/**
 * 組み合わせ効果
 */
export interface ComboEffect {
  name: string;
  description: string;
  multiplier: number;
  visualEffect?: string;
  requirements: EnchantmentType[];
  tier: 'dual' | 'triple' | 'legendary';
}

/**
 * エンチャント設定
 */
export interface EnchantmentConfig {
  type: EnchantmentType;
  name: string;
  description: string;
  category: EnchantmentCategory;
  tiers: number[]; // 各ティアの効果値
  stackable: boolean; // 重複可能か
  rarity: number; // 出現確率 (0-1)
}

/**
 * 基本エンチャント設定
 */
export const BASIC_ENCHANTMENTS: Record<EnchantmentType, EnchantmentConfig> = {
  [EnchantmentType.DAMAGE_BOOST]: {
    type: EnchantmentType.DAMAGE_BOOST,
    name: '攻撃力強化',
    description: '武器の攻撃力を増加させる',
    category: EnchantmentCategory.BASIC,
    tiers: [10, 25, 50, 100, 200], // +10%, +25%, +50%, +100%, +200%
    stackable: true,
    rarity: 0.3,
  },
  [EnchantmentType.FIRE_RATE_BOOST]: {
    type: EnchantmentType.FIRE_RATE_BOOST,
    name: '連射速度',
    description: '武器の発射間隔を短縮する',
    category: EnchantmentCategory.BASIC,
    tiers: [15, 30, 50, 75, 100], // -15%, -30%, -50%, -75%, -100%
    stackable: true,
    rarity: 0.25,
  },
  [EnchantmentType.BULLET_COUNT]: {
    type: EnchantmentType.BULLET_COUNT,
    name: '同時発射数',
    description: '一度に発射する弾丸数を増加させる',
    category: EnchantmentCategory.BASIC,
    tiers: [1, 2, 3, 5, 8], // +1, +2, +3, +5, +8発
    stackable: true,
    rarity: 0.2,
  },
  [EnchantmentType.PIERCING]: {
    type: EnchantmentType.PIERCING,
    name: '貫通',
    description: '弾丸が複数の敵を貫通する',
    category: EnchantmentCategory.BASIC,
    tiers: [1, 2, 4, 7, 12], // 1, 2, 4, 7, 12体貫通
    stackable: false,
    rarity: 0.15,
  },
  [EnchantmentType.CRITICAL_HIT]: {
    type: EnchantmentType.CRITICAL_HIT,
    name: 'クリティカル',
    description: 'クリティカルヒットの確率を増加させる',
    category: EnchantmentCategory.BASIC,
    tiers: [10, 20, 35, 55, 80], // 10%, 20%, 35%, 55%, 80%
    stackable: false,
    rarity: 0.18,
  },
  [EnchantmentType.EXPLOSIVE_ROUNDS]: {
    type: EnchantmentType.EXPLOSIVE_ROUNDS,
    name: '爆発',
    description: '着弾時に範囲爆発を起こす',
    category: EnchantmentCategory.SPECIAL,
    tiers: [30, 50, 80, 120, 180], // 爆発半径
    stackable: false,
    rarity: 0.12,
  },
  [EnchantmentType.HOMING_BULLETS]: {
    type: EnchantmentType.HOMING_BULLETS,
    name: '追尾',
    description: '最も近い敵を自動追尾する',
    category: EnchantmentCategory.SPECIAL,
    tiers: [2, 4, 6, 10, 15], // 追尾時間(秒)
    stackable: false,
    rarity: 0.1,
  },
  [EnchantmentType.CHAIN_LIGHTNING]: {
    type: EnchantmentType.CHAIN_LIGHTNING,
    name: '連鎖',
    description: '近くの敵に連鎖ダメージを与える',
    category: EnchantmentCategory.SPECIAL,
    tiers: [2, 4, 6, 10, 15], // 連鎖回数
    stackable: false,
    rarity: 0.08,
  },
  [EnchantmentType.FREEZE_EFFECT]: {
    type: EnchantmentType.FREEZE_EFFECT,
    name: '凍結',
    description: '敵を一定時間凍結させる',
    category: EnchantmentCategory.SPECIAL,
    tiers: [1, 2, 3, 5, 8], // 凍結時間(秒)
    stackable: false,
    rarity: 0.1,
  },
  [EnchantmentType.LIFE_STEAL]: {
    type: EnchantmentType.LIFE_STEAL,
    name: 'ライフスティール',
    description: 'ダメージの一部をHPとして回復する',
    category: EnchantmentCategory.SPECIAL,
    tiers: [5, 10, 15, 25, 40], // 回復率%
    stackable: true,
    rarity: 0.08,
  },
  [EnchantmentType.MULTI_SPLIT]: {
    type: EnchantmentType.MULTI_SPLIT,
    name: '分裂',
    description: '一定時間後に複数弾に分裂する',
    category: EnchantmentCategory.COMBO,
    tiers: [2, 3, 5, 8, 12], // 分裂数
    stackable: false,
    rarity: 0.06,
  },
  [EnchantmentType.RICOCHET]: {
    type: EnchantmentType.RICOCHET,
    name: '反射',
    description: '壁や敵で反射する',
    category: EnchantmentCategory.COMBO,
    tiers: [1, 2, 4, 7, 12], // 反射回数
    stackable: false,
    rarity: 0.05,
  },
  [EnchantmentType.ORBITAL_STRIKE]: {
    type: EnchantmentType.ORBITAL_STRIKE,
    name: '軌道爆撃',
    description: '着弾地点に追加の軌道爆撃を行う',
    category: EnchantmentCategory.COMBO,
    tiers: [1, 2, 3, 5, 8], // 爆撃回数
    stackable: false,
    rarity: 0.03,
  },
  [EnchantmentType.TIME_DILATION]: {
    type: EnchantmentType.TIME_DILATION,
    name: '時間減速',
    description: '着弾時に周囲の時間を減速させる',
    category: EnchantmentCategory.COMBO,
    tiers: [0.5, 0.3, 0.2, 0.1, 0.05], // 時間倍率
    stackable: false,
    rarity: 0.02,
  },
};

/**
 * 組み合わせ効果設定
 */
export const COMBO_EFFECTS: ComboEffect[] = [
  // 2つの組み合わせ効果
  {
    name: '貫通爆発弾',
    description: '敵を貫通しながら各敵で爆発',
    multiplier: 2.0,
    requirements: [EnchantmentType.PIERCING, EnchantmentType.EXPLOSIVE_ROUNDS],
    tier: 'dual',
    visualEffect: 'piercing_explosion',
  },
  {
    name: '追尾分裂弾',
    description: '敵に向かって分裂弾が追尾',
    multiplier: 2.2,
    requirements: [EnchantmentType.HOMING_BULLETS, EnchantmentType.MULTI_SPLIT],
    tier: 'dual',
    visualEffect: 'homing_split',
  },
  {
    name: '凍結連鎖',
    description: '連鎖した敵全てを凍結',
    multiplier: 1.8,
    requirements: [
      EnchantmentType.CHAIN_LIGHTNING,
      EnchantmentType.FREEZE_EFFECT,
    ],
    tier: 'dual',
    visualEffect: 'freeze_chain',
  },
  {
    name: 'クリティカル反射',
    description: '反射するたびにクリティカル率上昇',
    multiplier: 1.7,
    requirements: [EnchantmentType.CRITICAL_HIT, EnchantmentType.RICOCHET],
    tier: 'dual',
    visualEffect: 'critical_ricochet',
  },
  {
    name: 'バーストファイア',
    description: '高威力連射モード',
    multiplier: 1.5,
    requirements: [
      EnchantmentType.DAMAGE_BOOST,
      EnchantmentType.FIRE_RATE_BOOST,
    ],
    tier: 'dual',
    visualEffect: 'burst_fire',
  },
  {
    name: 'クラスター爆弾',
    description: '分裂後に全弾が爆発',
    multiplier: 2.5,
    requirements: [
      EnchantmentType.MULTI_SPLIT,
      EnchantmentType.EXPLOSIVE_ROUNDS,
    ],
    tier: 'dual',
    visualEffect: 'cluster_bomb',
  },

  // 3つの組み合わせ効果（超レア）
  {
    name: '貫通連鎖爆発',
    description: '敵を貫通し、各敵で爆発、爆発が連鎖する',
    multiplier: 3.0,
    requirements: [
      EnchantmentType.PIERCING,
      EnchantmentType.EXPLOSIVE_ROUNDS,
      EnchantmentType.CHAIN_LIGHTNING,
    ],
    tier: 'triple',
    visualEffect: 'piercing_chain_explosion',
  },
  {
    name: '追尾クラスター',
    description: '敵を追尾後分裂し、全弾が爆発',
    multiplier: 2.8,
    requirements: [
      EnchantmentType.HOMING_BULLETS,
      EnchantmentType.MULTI_SPLIT,
      EnchantmentType.EXPLOSIVE_ROUNDS,
    ],
    tier: 'triple',
    visualEffect: 'homing_cluster',
  },
  {
    name: 'クリティカル連鎖反射',
    description: '反射とクリティカルが相互強化',
    multiplier: 2.5,
    requirements: [
      EnchantmentType.CRITICAL_HIT,
      EnchantmentType.RICOCHET,
      EnchantmentType.CHAIN_LIGHTNING,
    ],
    tier: 'triple',
    visualEffect: 'critical_chain_ricochet',
  },

  // レジェンダリー組み合わせ（4つ以上）
  {
    name: '究極破壊弾',
    description: '貫通→爆発→連鎖→クリティカル確定',
    multiplier: 5.0,
    requirements: [
      EnchantmentType.PIERCING,
      EnchantmentType.EXPLOSIVE_ROUNDS,
      EnchantmentType.CHAIN_LIGHTNING,
      EnchantmentType.CRITICAL_HIT,
    ],
    tier: 'legendary',
    visualEffect: 'ultimate_destroyer',
  },
  {
    name: 'カオスストーム',
    description: '予測不可能な弾道で大混乱',
    multiplier: 4.5,
    requirements: [
      EnchantmentType.HOMING_BULLETS,
      EnchantmentType.MULTI_SPLIT,
      EnchantmentType.RICOCHET,
      EnchantmentType.EXPLOSIVE_ROUNDS,
    ],
    tier: 'legendary',
    visualEffect: 'chaos_storm',
  },
];

/**
 * エンチャント数確率テーブル（改善版）
 */
export const ENCHANTMENT_COUNT_PROBABILITY = {
  0: 0.1, // 10% - エンチャントなし（大幅削減）
  1: 0.3, // 30% - 1個（削減）
  2: 0.35, // 35% - 2個（大幅増加）
  3: 0.2, // 20% - 3個（大幅増加）
  4: 0.05, // 5% - 4個（増加）
} as const;

/**
 * バランス調整設定
 */
export const BALANCE_SYSTEM = {
  // 組み合わせ数による調整
  comboCountMultiplier: {
    2: 1.0, // 2つ組み合わせ：等倍
    3: 0.8, // 3つ組み合わせ：0.8倍（強すぎ防止）
    4: 0.6, // 4つ組み合わせ：0.6倍
    5: 0.4, // 5つ組み合わせ：0.4倍
  },

  // レアリティによる調整
  rarityMultiplier: {
    common: 1.0,
    uncommon: 1.2,
    rare: 1.5,
    epic: 2.0,
    legendary: 3.0,
  },
} as const;
