import { PlayerProfile } from '../types/PlayerProfile';
import { UpgradeConfig, UpgradeCategoryInfo } from '../types/Upgrade';

/**
 * 全アップグレード設定データ
 */
export const UPGRADE_CONFIGS: UpgradeConfig[] = [
  // ===== 武器系アップグレード =====
  {
    id: 'rapid_fire',
    name: '速射改良',
    description:
      '射撃速度を向上させる。より速く弾丸を発射できるようになります。',
    category: 'weapon',
    maxLevel: 10,
    baseCost: 100,
    costMultiplier: 1.5,
    unlockCondition: () => true, // 初期から利用可能
    effect: level => ({ fireRateMultiplier: 1 + level * 0.15 }),
    icon: '🔫',
  },
  {
    id: 'power_shot',
    name: '威力強化',
    description:
      '弾丸の威力を向上させる。敵により多くのダメージを与えられます。',
    category: 'weapon',
    maxLevel: 10,
    baseCost: 150,
    costMultiplier: 1.6,
    unlockCondition: profile => profile.level >= 3,
    effect: level => ({ bulletDamageMultiplier: 1 + level * 0.2 }),
    icon: '💥',
  },
  {
    id: 'multi_shot',
    name: '多重射撃',
    description: '同時発射数を増加させる。一度により多くの弾丸を撃てます。',
    category: 'weapon',
    maxLevel: 5,
    baseCost: 500,
    costMultiplier: 2.0,
    unlockCondition: profile => profile.stats.enemiesDestroyed >= 100,
    effect: level => ({ bulletCountMultiplier: 1 + level * 0.5 }),
    icon: '🎯',
  },
  {
    id: 'bullet_speed',
    name: '弾速向上',
    description: '弾丸の速度を向上させる。より遠距離の敵も素早く撃破できます。',
    category: 'weapon',
    maxLevel: 8,
    baseCost: 200,
    costMultiplier: 1.4,
    unlockCondition: profile => profile.level >= 5,
    effect: level => ({ bulletSpeedMultiplier: 1 + level * 0.1 }),
    icon: '⚡',
  },

  // ===== 防御系アップグレード =====
  {
    id: 'reinforced_hull',
    name: '装甲強化',
    description: '船体の耐久力を向上させる。より多くのダメージに耐えられます。',
    category: 'defense',
    maxLevel: 8,
    baseCost: 200,
    costMultiplier: 1.7,
    unlockCondition: profile => profile.level >= 2,
    effect: level => ({ healthMultiplier: 1 + level * 0.25 }),
    icon: '🛡️',
  },
  {
    id: 'shield_boost',
    name: 'シールド強化',
    description: 'パワーアップシールドの持続時間を延長します。',
    category: 'defense',
    maxLevel: 6,
    baseCost: 300,
    costMultiplier: 1.8,
    unlockCondition: profile => profile.stats.powerupsCollected >= 20,
    effect: level => ({ shieldDurationMultiplier: 1 + level * 0.3 }),
    icon: '🔰',
  },
  {
    id: 'damage_reduction',
    name: 'ダメージ軽減',
    description: '受けるダメージを軽減します。生存力が大幅に向上します。',
    category: 'defense',
    maxLevel: 10,
    baseCost: 800,
    costMultiplier: 2.2,
    unlockCondition: profile => profile.stats.bossesDefeated >= 3,
    effect: level => ({ damageReductionPercent: level * 0.05 }), // 最大50%軽減
    icon: '🛡️',
  },

  // ===== ユーティリティ系アップグレード =====
  {
    id: 'coin_magnet',
    name: 'コインマグネット',
    description:
      'パワーアップの磁力範囲を拡大し、より遠くからでも吸収できます。',
    category: 'utility',
    maxLevel: 6,
    baseCost: 250,
    costMultiplier: 1.6,
    unlockCondition: profile => profile.level >= 4,
    effect: level => ({ magnetRangeBonus: level * 20 }), // ピクセル単位で範囲拡大
    icon: '🧲',
  },
  {
    id: 'experience_boost',
    name: '経験値ブースト',
    description: '獲得経験値を増加させます。レベルアップが早くなります。',
    category: 'utility',
    maxLevel: 8,
    baseCost: 400,
    costMultiplier: 1.9,
    unlockCondition: profile => profile.level >= 6,
    effect: level => ({ experienceBonusMultiplier: 1 + level * 0.2 }),
    icon: '📈',
  },
  {
    id: 'lucky_shot',
    name: 'ラッキーショット',
    description: '稀にパワーアップが追加でドロップするチャンスが発生します。',
    category: 'utility',
    maxLevel: 5,
    baseCost: 600,
    costMultiplier: 2.5,
    unlockCondition: profile => profile.stats.maxWaveReached >= 8,
    effect: level => ({ luckyDropChanceBonus: level * 0.05 }), // 最大25%のボーナス確率
    icon: '🍀',
  },
  {
    id: 'move_speed',
    name: '機動性向上',
    description: '移動速度を向上させます。敵の攻撃を回避しやすくなります。',
    category: 'utility',
    maxLevel: 7,
    baseCost: 300,
    costMultiplier: 1.5,
    unlockCondition: profile => profile.level >= 3,
    effect: level => ({ moveSpeedMultiplier: 1 + level * 0.1 }),
    icon: '💨',
  },
  {
    id: 'coin_bonus',
    name: 'コインブースト',
    description:
      '獲得コインを増加させます。アップグレード購入が効率的になります。',
    category: 'utility',
    maxLevel: 8,
    baseCost: 500,
    costMultiplier: 2.0,
    unlockCondition: profile => profile.totalScore >= 5000,
    effect: level => ({ coinBonusMultiplier: 1 + level * 0.15 }),
    icon: '💰',
  },
];

/**
 * アップグレードカテゴリ情報
 */
export const UPGRADE_CATEGORIES: UpgradeCategoryInfo[] = [
  {
    id: 'weapon',
    name: '武器',
    description: '攻撃力と射撃能力を強化',
    icon: '⚔️',
  },
  {
    id: 'defense',
    name: '防御',
    description: '生存力と耐久性を向上',
    icon: '🛡️',
  },
  {
    id: 'utility',
    name: '特殊',
    description: '特殊効果と効率性を向上',
    icon: '⚙️',
  },
];

/**
 * アップグレードIDでアップグレード設定を取得
 */
export function getUpgradeConfig(upgradeId: string): UpgradeConfig | undefined {
  return UPGRADE_CONFIGS.find(config => config.id === upgradeId);
}

/**
 * カテゴリ別にアップグレード設定を取得
 */
export function getUpgradesByCategory(
  category: 'weapon' | 'defense' | 'utility'
): UpgradeConfig[] {
  return UPGRADE_CONFIGS.filter(config => config.category === category);
}

/**
 * プレイヤープロフィールに基づいて利用可能なアップグレードを取得
 */
export function getAvailableUpgrades(profile: PlayerProfile): UpgradeConfig[] {
  return UPGRADE_CONFIGS.filter(config => config.unlockCondition(profile));
}

/**
 * アップグレードの現在レベルでのコストを計算
 */
export function calculateUpgradeCost(
  config: UpgradeConfig,
  currentLevel: number
): number {
  if (currentLevel >= config.maxLevel) {
    return 0; // 最大レベル到達済み
  }
  return Math.floor(
    config.baseCost * Math.pow(config.costMultiplier, currentLevel)
  );
}

/**
 * アップグレードが解除されているかチェック
 */
export function isUpgradeUnlocked(
  upgradeId: string,
  profile: PlayerProfile
): boolean {
  const config = getUpgradeConfig(upgradeId);
  return config ? config.unlockCondition(profile) : false;
}
