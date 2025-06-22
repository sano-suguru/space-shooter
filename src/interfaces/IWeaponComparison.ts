import { EnchantedWeapon } from '../weapons/types/EnchantedWeapon';

/**
 * 武器比較データの型定義
 */
export interface WeaponComparisonData {
  currentWeapon: EnchantedWeapon | null;
  newWeapon: EnchantedWeapon;
  comparisonStats: WeaponComparisonStats;
}

/**
 * 武器比較統計の型定義
 */
export interface WeaponComparisonStats {
  damageComparison: ComparisonValue;
  fireRateComparison: ComparisonValue;
  enchantmentComparison: EnchantmentComparison;
  overallRating: ComparisonValue;
}

/**
 * 比較値の型定義
 */
export interface ComparisonValue {
  current: number;
  new: number;
  difference: number;
  percentChange: number;
  isBetter: boolean;
}

/**
 * エンチャント比較の型定義
 */
export interface EnchantmentComparison {
  currentCount: number;
  newCount: number;
  uniqueEnchantments: string[];
  rarityComparison: ComparisonValue;
}

/**
 * 武器比較システムのインターフェース
 */
export interface IWeaponComparisonSystem {
  /**
   * 武器比較データを生成
   */
  generateComparisonData(
    currentWeapon: EnchantedWeapon | null,
    newWeapon: EnchantedWeapon
  ): WeaponComparisonData;

  /**
   * 武器比較UIを表示
   */
  showComparisonUI(comparisonData: WeaponComparisonData): void;

  /**
   * 武器比較UIを非表示
   */
  hideComparisonUI(): void;

  /**
   * プレイヤーの選択を処理
   */
  handlePlayerChoice(equipNew: boolean): void;
}
