/**
 * 武器システム - タイプ定義
 *
 * 武器選択システムで使用される基本的なタイプ定義を提供します。
 */

import { PlayerProfile } from '../../progression/types/PlayerProfile';

/**
 * 武器の基本タイプ列挙
 */
export enum WeaponType {
  BASIC_LASER = 'basic_laser',
  PLASMA_CANNON = 'plasma_cannon',
  MISSILE_LAUNCHER = 'missile_launcher',
  ENERGY_BEAM = 'energy_beam',
  EXPLOSIVE_ROUNDS = 'explosive_rounds',
  HOMING_MISSILES = 'homing_missiles',
  SPLIT_SHOT = 'split_shot',
  RAPID_FIRE = 'rapid_fire',
}

/**
 * 武器レアリティ
 */
export enum WeaponRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

/**
 * 武器特殊効果タイプ
 */
export type WeaponSpecialEffectType =
  | 'explosive'
  | 'homing'
  | 'split'
  | 'piercing'
  | 'freeze'
  | 'chain'
  | 'bounce';

/**
 * 武器特殊効果設定
 */
export interface WeaponSpecialEffect {
  type: WeaponSpecialEffectType;
  parameters: {
    // 爆発効果用
    explosionRadius?: number;
    explosionDamage?: number;

    // 追尾効果用
    homingDuration?: number;
    homingTurnSpeed?: number;

    // 分裂効果用
    splitCount?: number;
    splitAngleSpread?: number;
    splitDelay?: number;

    // 貫通効果用
    pierceCount?: number;
    pierceDamageReduction?: number;

    // 凍結効果用
    freezeDuration?: number;
    freezeChance?: number;

    // 連鎖効果用
    chainCount?: number;
    chainRange?: number;
    chainDamageReduction?: number;

    // 反射効果用
    bounceCount?: number;
    bounceSpeedMultiplier?: number;
  };
}

/**
 * 武器設定インターフェース
 */
export interface WeaponConfig {
  id: string;
  name: string;
  description: string;
  type: WeaponType;
  rarity: WeaponRarity;

  // 基本性能
  damage: number;
  fireRate: number;
  bulletSpeed: number;
  bulletCount: number;
  spreadAngle?: number;

  // 特殊効果
  specialEffect?: WeaponSpecialEffect;

  // 解除・購入条件
  unlockCondition: (profile: PlayerProfile) => boolean;
  cost: number;
  maxLevel: number;

  // UI表示用
  icon: string;
  color: string;
}

/**
 * 装備中武器インターフェース
 */
export interface EquippedWeapon {
  weaponId: string;
  config: WeaponConfig;
  level: number;
  lastFireTime: number;
  slot: number;
  experience: number;
}

/**
 * 武器アップグレード効果
 */
export interface WeaponUpgradeEffect {
  damageMultiplier?: number;
  fireRateMultiplier?: number;
  bulletSpeedMultiplier?: number;
  bulletCountBonus?: number;
  specialEffectBonus?: Partial<WeaponSpecialEffect['parameters']>;
}

/**
 * 武器購入結果
 */
export interface WeaponPurchaseResult {
  success: boolean;
  reason?:
    | 'insufficient_funds'
    | 'already_owned'
    | 'not_unlocked'
    | 'inventory_full';
  weaponId?: string;
  costPaid?: number;
  remainingCoins?: number;
}

/**
 * 武器装備結果
 */
export interface WeaponEquipResult {
  success: boolean;
  reason?:
    | 'weapon_not_owned'
    | 'slot_occupied'
    | 'already_equipped'
    | 'invalid_slot';
  weaponId?: string;
  slot?: number;
  replacedWeapon?: string;
}

/**
 * 武器統計情報
 */
export interface WeaponStats {
  totalShots: number;
  totalHits: number;
  totalDamage: number;
  enemiesKilled: number;
  accuracy: number;
  favoriteWeapon?: string;
}

/**
 * 武器カテゴリ情報（UI用）
 */
export interface WeaponCategoryInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  weapons: WeaponConfig[];
}

/**
 * 武器レアリティ設定
 */
export const WEAPON_RARITY_CONFIG = {
  [WeaponRarity.COMMON]: {
    color: '#ffffff',
    glowColor: '#cccccc',
    name: '一般',
    dropRate: 0.6,
  },
  [WeaponRarity.UNCOMMON]: {
    color: '#00ff00',
    glowColor: '#00cc00',
    name: '珍しい',
    dropRate: 0.25,
  },
  [WeaponRarity.RARE]: {
    color: '#0080ff',
    glowColor: '#0066cc',
    name: 'レア',
    dropRate: 0.1,
  },
  [WeaponRarity.EPIC]: {
    color: '#8000ff',
    glowColor: '#6600cc',
    name: 'エピック',
    dropRate: 0.04,
  },
  [WeaponRarity.LEGENDARY]: {
    color: '#ff8000',
    glowColor: '#cc6600',
    name: 'レジェンダリー',
    dropRate: 0.01,
  },
} as const;

/**
 * 武器タイプ別設定
 */
export const WEAPON_TYPE_CONFIG = {
  [WeaponType.BASIC_LASER]: {
    category: 'energy',
    baseFireRate: 200,
    baseDamage: 1,
    description: '基本的なエネルギー武器',
  },
  [WeaponType.PLASMA_CANNON]: {
    category: 'energy',
    baseFireRate: 300,
    baseDamage: 2,
    description: '高威力プラズマ砲',
  },
  [WeaponType.MISSILE_LAUNCHER]: {
    category: 'projectile',
    baseFireRate: 500,
    baseDamage: 3,
    description: '爆発性ミサイル',
  },
  [WeaponType.ENERGY_BEAM]: {
    category: 'energy',
    baseFireRate: 150,
    baseDamage: 1,
    description: '連続エネルギービーム',
  },
  [WeaponType.EXPLOSIVE_ROUNDS]: {
    category: 'projectile',
    baseFireRate: 400,
    baseDamage: 2,
    description: '爆発弾薬',
  },
  [WeaponType.HOMING_MISSILES]: {
    category: 'projectile',
    baseFireRate: 600,
    baseDamage: 2,
    description: '追尾ミサイル',
  },
  [WeaponType.SPLIT_SHOT]: {
    category: 'energy',
    baseFireRate: 350,
    baseDamage: 1,
    description: '分裂弾',
  },
  [WeaponType.RAPID_FIRE]: {
    category: 'energy',
    baseFireRate: 100,
    baseDamage: 1,
    description: '高速連射',
  },
} as const;
