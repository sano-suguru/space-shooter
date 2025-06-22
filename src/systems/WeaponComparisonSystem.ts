import {
  WeaponComparisonData,
  WeaponComparisonStats,
  ComparisonValue,
  EnchantmentComparison,
} from '../interfaces/IWeaponComparison';
import {
  EnchantedWeapon,
  EnchantedWeaponUtils,
} from '../weapons/types/EnchantedWeapon';
import {
  Enchantment,
  BASIC_ENCHANTMENTS,
} from '../weapons/types/EnchantmentTypes';

/**
 * 武器比較システム
 * 現在の武器と新しい武器の詳細比較データを生成
 */
export class WeaponComparisonSystem {
  /**
   * 武器比較データを生成
   */
  public generateComparisonData(
    currentWeapon: EnchantedWeapon | null,
    newWeapon: EnchantedWeapon
  ): WeaponComparisonData {
    const comparisonStats = this.calculateComparisonStats(
      currentWeapon,
      newWeapon
    );

    return {
      currentWeapon,
      newWeapon,
      comparisonStats,
    };
  }

  /**
   * 武器比較統計を計算
   */
  private calculateComparisonStats(
    currentWeapon: EnchantedWeapon | null,
    newWeapon: EnchantedWeapon
  ): WeaponComparisonStats {
    // 現在の武器がない場合のデフォルト値
    const currentDamage = currentWeapon?.totalStats.finalDamage ?? 0;
    const currentFireRate = currentWeapon?.totalStats.finalFireRate ?? 0;
    const currentEnchantments = currentWeapon?.enchantments ?? [];
    const currentRarity = this.getRarityValue(
      currentWeapon?.rarity ?? 'common'
    );

    // 新しい武器の値
    const newDamage = newWeapon.totalStats.finalDamage;
    const newFireRate = newWeapon.totalStats.finalFireRate;
    const newEnchantments = newWeapon.enchantments;
    const newRarity = this.getRarityValue(newWeapon.rarity);

    return {
      damageComparison: this.calculateComparisonValue(currentDamage, newDamage),
      fireRateComparison: this.calculateComparisonValue(
        currentFireRate,
        newFireRate
      ),
      enchantmentComparison: this.calculateEnchantmentComparison(
        currentEnchantments,
        newEnchantments,
        currentRarity,
        newRarity
      ),
      overallRating: this.calculateOverallRating(
        currentWeapon,
        newWeapon,
        currentDamage,
        newDamage,
        currentFireRate,
        newFireRate,
        currentRarity,
        newRarity
      ),
    };
  }

  /**
   * 比較値を計算
   */
  private calculateComparisonValue(
    current: number,
    newValue: number
  ): ComparisonValue {
    const difference = newValue - current;
    const percentChange = current > 0 ? (difference / current) * 100 : 100;
    const isBetter = newValue > current;

    return {
      current,
      new: newValue,
      difference,
      percentChange,
      isBetter,
    };
  }

  /**
   * エンチャント比較を計算
   */
  private calculateEnchantmentComparison(
    currentEnchantments: Enchantment[],
    newEnchantments: Enchantment[],
    currentRarity: number,
    newRarity: number
  ): EnchantmentComparison {
    const currentCount = currentEnchantments.length;
    const newCount = newEnchantments.length;

    // ユニークなエンチャント名を取得
    const allEnchantments = new Set([
      ...currentEnchantments.map(e => e.type),
      ...newEnchantments.map(e => e.type),
    ]);

    return {
      currentCount,
      newCount,
      uniqueEnchantments: Array.from(allEnchantments),
      rarityComparison: this.calculateComparisonValue(currentRarity, newRarity),
    };
  }

  /**
   * 総合評価を計算
   */
  private calculateOverallRating(
    currentWeapon: EnchantedWeapon | null,
    newWeapon: EnchantedWeapon,
    _currentDamage: number,
    _newDamage: number,
    _currentFireRate: number,
    _newFireRate: number,
    _currentRarity: number,
    _newRarity: number
  ): ComparisonValue {
    // 現在の武器がない場合は新しい武器が確実に良い
    if (!currentWeapon) {
      return {
        current: 0,
        new: 100,
        difference: 100,
        percentChange: 100,
        isBetter: true,
      };
    }

    // 既存のユーティリティを使用してスコア計算
    const currentScore =
      EnchantedWeaponUtils.calculateOverallScore(currentWeapon);
    const newScore = EnchantedWeaponUtils.calculateOverallScore(newWeapon);

    return this.calculateComparisonValue(currentScore, newScore);
  }

  /**
   * レアリティの数値を取得
   */
  private getRarityValue(rarity: string): number {
    const rarityValues: Record<string, number> = {
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
      legendary: 5,
    };
    return rarityValues[rarity] ?? 1;
  }

  /**
   * レアリティの色を取得
   */
  public getRarityColor(rarity: string): string {
    const rarityColors: Record<string, string> = {
      common: '#ffffff',
      uncommon: '#1eff00',
      rare: '#0070dd',
      epic: '#a335ee',
      legendary: '#ff8000',
    };
    return rarityColors[rarity] ?? '#ffffff';
  }

  /**
   * エンチャント効果の説明を取得
   */
  public getEnchantmentDescription(enchantment: Enchantment): string {
    // BASIC_ENCHANTMENTSから日本語名を取得
    const enchantmentConfig = BASIC_ENCHANTMENTS[enchantment.type];

    if (enchantmentConfig) {
      // 既存のdescriptionプロパティを使用（ティア情報付き）
      return enchantment.description;
    }

    // フォールバック: 設定が見つからない場合
    return `${enchantment.type}: +${enchantment.value}`;
  }
}
