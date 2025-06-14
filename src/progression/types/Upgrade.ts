/**
 * アップグレード効果インターフェース
 * プレイヤーの能力値に対する倍率や追加効果を定義
 */
export interface UpgradeEffect {
  // 武器系効果
  fireRateMultiplier?: number; // 射撃速度倍率
  bulletDamageMultiplier?: number; // 弾丸威力倍率
  bulletCountMultiplier?: number; // 弾丸数倍率
  bulletSpeedMultiplier?: number; // 弾丸速度倍率

  // 防御系効果
  healthMultiplier?: number; // 体力倍率
  shieldDurationMultiplier?: number; // シールド持続時間倍率
  damageReductionPercent?: number; // ダメージ軽減率（0-1）

  // 移動系効果
  moveSpeedMultiplier?: number; // 移動速度倍率

  // ユーティリティ系効果
  magnetRangeBonus?: number; // パワーアップ磁力範囲ボーナス
  experienceBonusMultiplier?: number; // 経験値獲得倍率
  coinBonusMultiplier?: number; // コイン獲得倍率
  luckyDropChanceBonus?: number; // レアドロップ確率ボーナス
}

/**
 * アップグレード設定インターフェース
 * 各アップグレードの基本情報と効果を定義
 */
export interface UpgradeConfig {
  id: string; // 一意識別子
  name: string; // 表示名
  description: string; // 説明文
  category: 'weapon' | 'defense' | 'utility'; // カテゴリ
  maxLevel: number; // 最大レベル
  baseCost: number; // 基本コスト
  costMultiplier: number; // レベルアップ時のコスト倍率
  unlockCondition: (
    profile: import('./PlayerProfile').PlayerProfile
  ) => boolean; // 解除条件
  effect: (level: number) => UpgradeEffect; // レベルに応じた効果
  icon?: string; // アイコン（オプション）
}

/**
 * プレイヤーが装備中のアップグレード情報
 */
export interface EquippedUpgrade {
  upgradeId: string;
  level: number;
  effect: UpgradeEffect;
}

/**
 * アップグレード購入結果
 */
export interface UpgradePurchaseResult {
  success: boolean;
  reason?:
    | 'insufficient_funds'
    | 'max_level_reached'
    | 'not_unlocked'
    | 'unknown_upgrade';
  newLevel?: number;
  costPaid?: number;
  remainingCoins?: number;
}

/**
 * アップグレードカテゴリ別の表示情報
 */
export interface UpgradeCategoryInfo {
  id: 'weapon' | 'defense' | 'utility';
  name: string;
  description: string;
  icon: string;
}
