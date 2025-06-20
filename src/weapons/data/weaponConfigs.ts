/**
 * 武器システム - 武器設定データ
 *
 * 全武器の設定データを定義します。
 */

import { PlayerProfile } from '../../progression/types/PlayerProfile';
import {
  WeaponConfig,
  WeaponRarity,
  WeaponType,
  WEAPON_RARITY_CONFIG,
} from '../types/WeaponTypes';

/**
 * 基本武器設定
 */
export const BASIC_WEAPONS: WeaponConfig[] = [
  {
    id: 'basic_laser',
    name: 'ベーシックレーザー',
    description: '標準的なエネルギー武器。バランスの取れた性能で初心者に最適。',
    type: WeaponType.BASIC_LASER,
    rarity: WeaponRarity.COMMON,
    damage: 1,
    fireRate: 200,
    bulletSpeed: 600,
    bulletCount: 1,
    unlockCondition: () => true, // 初期から利用可能
    cost: 0,
    maxLevel: 10,
    icon: '🔫',
    color: WEAPON_RARITY_CONFIG[WeaponRarity.COMMON].color,
  },
  {
    id: 'plasma_cannon',
    name: 'プラズマキャノン',
    description: '高威力のプラズマ弾を発射。威力は高いが発射間隔が長い。',
    type: WeaponType.PLASMA_CANNON,
    rarity: WeaponRarity.UNCOMMON,
    damage: 2,
    fireRate: 300,
    bulletSpeed: 500,
    bulletCount: 1,
    unlockCondition: (profile: PlayerProfile) => profile.level >= 3,
    cost: 500,
    maxLevel: 8,
    icon: '⚡',
    color: WEAPON_RARITY_CONFIG[WeaponRarity.UNCOMMON].color,
  },
  {
    id: 'rapid_fire',
    name: '速射砲',
    description: '高速連射が可能な武器。威力は低いが圧倒的な弾幕を形成。',
    type: WeaponType.RAPID_FIRE,
    rarity: WeaponRarity.UNCOMMON,
    damage: 1,
    fireRate: 100,
    bulletSpeed: 650,
    bulletCount: 1,
    unlockCondition: (profile: PlayerProfile) => profile.level >= 2,
    cost: 300,
    maxLevel: 12,
    icon: '🔥',
    color: WEAPON_RARITY_CONFIG[WeaponRarity.UNCOMMON].color,
  },
  {
    id: 'energy_beam',
    name: 'エネルギービーム',
    description: '連続的なエネルギービームを発射。持続ダメージを与える。',
    type: WeaponType.ENERGY_BEAM,
    rarity: WeaponRarity.RARE,
    damage: 1,
    fireRate: 150,
    bulletSpeed: 700,
    bulletCount: 1,
    unlockCondition: (profile: PlayerProfile) => profile.level >= 5,
    cost: 800,
    maxLevel: 10,
    icon: '💫',
    color: WEAPON_RARITY_CONFIG[WeaponRarity.RARE].color,
  },
];

/**
 * 特殊武器設定
 */
export const SPECIAL_WEAPONS: WeaponConfig[] = [
  {
    id: 'explosive_rounds',
    name: '爆発弾砲',
    description: '着弾時に爆発する弾丸を発射。範囲ダメージを与える。',
    type: WeaponType.EXPLOSIVE_ROUNDS,
    rarity: WeaponRarity.RARE,
    damage: 2,
    fireRate: 400,
    bulletSpeed: 450,
    bulletCount: 1,
    specialEffect: {
      type: 'explosive',
      parameters: {
        explosionRadius: 30,
        explosionDamage: 1,
      },
    },
    unlockCondition: (profile: PlayerProfile) =>
      profile.stats.enemiesDestroyed >= 100,
    cost: 1500,
    maxLevel: 8,
    icon: '💥',
    color: WEAPON_RARITY_CONFIG[WeaponRarity.RARE].color,
  },
  {
    id: 'homing_missiles',
    name: '追尾ミサイル',
    description: '敵を自動追尾するミサイル。確実に命中する。',
    type: WeaponType.HOMING_MISSILES,
    rarity: WeaponRarity.EPIC,
    damage: 2,
    fireRate: 600,
    bulletSpeed: 400,
    bulletCount: 1,
    specialEffect: {
      type: 'homing',
      parameters: {
        homingDuration: 3000,
        homingTurnSpeed: 0.002,
      },
    },
    unlockCondition: (profile: PlayerProfile) =>
      profile.stats.bossesDefeated >= 3,
    cost: 2000,
    maxLevel: 6,
    icon: '🚀',
    color: WEAPON_RARITY_CONFIG[WeaponRarity.EPIC].color,
  },
  {
    id: 'split_shot',
    name: '分裂弾砲',
    description: '一定時間後に複数の弾丸に分裂する特殊弾を発射。',
    type: WeaponType.SPLIT_SHOT,
    rarity: WeaponRarity.EPIC,
    damage: 1,
    fireRate: 350,
    bulletSpeed: 500,
    bulletCount: 1,
    specialEffect: {
      type: 'split',
      parameters: {
        splitCount: 3,
        splitAngleSpread: Math.PI / 3,
        splitDelay: 2000,
      },
    },
    unlockCondition: (profile: PlayerProfile) =>
      profile.stats.maxWaveReached >= 10,
    cost: 2500,
    maxLevel: 6,
    icon: '🎆',
    color: WEAPON_RARITY_CONFIG[WeaponRarity.EPIC].color,
  },
  {
    id: 'missile_launcher',
    name: 'ミサイルランチャー',
    description: '大型ミサイルを発射する重火器。高威力だが発射間隔が長い。',
    type: WeaponType.MISSILE_LAUNCHER,
    rarity: WeaponRarity.RARE,
    damage: 3,
    fireRate: 500,
    bulletSpeed: 400,
    bulletCount: 1,
    unlockCondition: (profile: PlayerProfile) => profile.level >= 7,
    cost: 1200,
    maxLevel: 8,
    icon: '🎯',
    color: WEAPON_RARITY_CONFIG[WeaponRarity.RARE].color,
  },
];

/**
 * レジェンダリー武器設定
 */
export const LEGENDARY_WEAPONS: WeaponConfig[] = [
  {
    id: 'omega_destroyer',
    name: 'オメガデストロイヤー',
    description: '伝説の破壊兵器。爆発・追尾・分裂の全ての効果を持つ究極武器。',
    type: WeaponType.ENERGY_BEAM,
    rarity: WeaponRarity.LEGENDARY,
    damage: 3,
    fireRate: 250,
    bulletSpeed: 600,
    bulletCount: 2,
    spreadAngle: Math.PI / 6,
    specialEffect: {
      type: 'explosive',
      parameters: {
        explosionRadius: 40,
        explosionDamage: 2,
      },
    },
    unlockCondition: (profile: PlayerProfile) =>
      profile.stats.bossesDefeated >= 10 && profile.totalScore >= 50000,
    cost: 10000,
    maxLevel: 5,
    icon: '⭐',
    color: WEAPON_RARITY_CONFIG[WeaponRarity.LEGENDARY].color,
  },
  {
    id: 'quantum_rifle',
    name: 'クォンタムライフル',
    description: '量子効果により敵を貫通し、連鎖ダメージを与える。',
    type: WeaponType.ENERGY_BEAM,
    rarity: WeaponRarity.LEGENDARY,
    damage: 2,
    fireRate: 200,
    bulletSpeed: 800,
    bulletCount: 1,
    specialEffect: {
      type: 'chain',
      parameters: {
        chainCount: 3,
        chainRange: 100,
        chainDamageReduction: 0.5,
      },
    },
    unlockCondition: (profile: PlayerProfile) =>
      profile.stats.maxWaveReached >= 20 && profile.level >= 15,
    cost: 15000,
    maxLevel: 5,
    icon: '🌟',
    color: WEAPON_RARITY_CONFIG[WeaponRarity.LEGENDARY].color,
  },
];

/**
 * 全武器設定
 */
export const ALL_WEAPON_CONFIGS: WeaponConfig[] = [
  ...BASIC_WEAPONS,
  ...SPECIAL_WEAPONS,
  ...LEGENDARY_WEAPONS,
];

/**
 * 武器カテゴリ設定
 */
export const WEAPON_CATEGORIES = [
  {
    id: 'basic',
    name: '基本武器',
    description: 'バランスの取れた基本的な武器',
    icon: '🔫',
    weapons: BASIC_WEAPONS,
  },
  {
    id: 'special',
    name: '特殊武器',
    description: '特殊効果を持つ高性能武器',
    icon: '💥',
    weapons: SPECIAL_WEAPONS,
  },
  {
    id: 'legendary',
    name: 'レジェンダリー',
    description: '伝説級の究極武器',
    icon: '⭐',
    weapons: LEGENDARY_WEAPONS,
  },
];

/**
 * 武器ID別設定取得
 */
export function getWeaponConfig(weaponId: string): WeaponConfig | undefined {
  return ALL_WEAPON_CONFIGS.find(config => config.id === weaponId);
}

/**
 * レアリティ別武器取得
 */
export function getWeaponsByRarity(rarity: WeaponRarity): WeaponConfig[] {
  return ALL_WEAPON_CONFIGS.filter(config => config.rarity === rarity);
}

/**
 * タイプ別武器取得
 */
export function getWeaponsByType(type: WeaponType): WeaponConfig[] {
  return ALL_WEAPON_CONFIGS.filter(config => config.type === type);
}

/**
 * 解除可能武器取得
 */
export function getUnlockedWeapons(profile: PlayerProfile): WeaponConfig[] {
  return ALL_WEAPON_CONFIGS.filter(config => config.unlockCondition(profile));
}

/**
 * 購入可能武器取得
 */
export function getAffordableWeapons(
  profile: PlayerProfile,
  coins: number
): WeaponConfig[] {
  return getUnlockedWeapons(profile).filter(config => config.cost <= coins);
}

/**
 * 武器検索
 */
export function searchWeapons(query: string): WeaponConfig[] {
  const lowerQuery = query.toLowerCase();
  return ALL_WEAPON_CONFIGS.filter(
    config =>
      config.name.toLowerCase().includes(lowerQuery) ||
      config.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * おすすめ武器取得（プレイヤーレベルに基づく）
 */
export function getRecommendedWeapons(profile: PlayerProfile): WeaponConfig[] {
  const unlocked = getUnlockedWeapons(profile);
  const playerLevel = profile.level;

  // プレイヤーレベルに応じておすすめ武器を選択
  if (playerLevel < 5) {
    return unlocked.filter(w => w.rarity === WeaponRarity.COMMON);
  } else if (playerLevel < 10) {
    return unlocked.filter(w =>
      [WeaponRarity.COMMON, WeaponRarity.UNCOMMON].includes(w.rarity)
    );
  } else if (playerLevel < 15) {
    return unlocked.filter(w =>
      [WeaponRarity.UNCOMMON, WeaponRarity.RARE].includes(w.rarity)
    );
  } else {
    return unlocked.filter(w =>
      [WeaponRarity.RARE, WeaponRarity.EPIC, WeaponRarity.LEGENDARY].includes(
        w.rarity
      )
    );
  }
}
