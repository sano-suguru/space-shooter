/**
 * エンチャントシステム - 基本クラス
 *
 * 武器にエンチャント効果を生成・適用するシステムです。
 */

import { IRandomProvider } from '../../providers/IRandomProvider';
import {
  EnchantmentType,
  Enchantment,
  EnchantmentCategory,
  BASIC_ENCHANTMENTS,
  ENCHANTMENT_COUNT_PROBABILITY,
} from '../types/EnchantmentTypes';
import { WeaponRarity } from '../types/WeaponTypes';

/**
 * エンチャント生成設定
 */
export interface EnchantmentGenerationConfig {
  weaponRarity: WeaponRarity;
  forceEnchantmentCount?: number;
  allowedCategories?: EnchantmentCategory[];
  excludeTypes?: EnchantmentType[];
}

/**
 * エンチャント生成結果
 */
export interface EnchantmentGenerationResult {
  enchantments: Enchantment[];
  totalRarity: number;
  generationLog: string[];
}

/**
 * エンチャントシステムクラス
 */
export class EnchantmentSystem {
  constructor(private randomProvider: IRandomProvider) {}

  /**
   * 武器レアリティに基づいてエンチャントを生成
   */
  generateEnchantments(
    config: EnchantmentGenerationConfig
  ): EnchantmentGenerationResult {
    const log: string[] = [];
    log.push(`🔮 エンチャント生成開始 - レアリティ: ${config.weaponRarity}`);

    // エンチャント数を決定
    const enchantmentCount = this.determineEnchantmentCount(
      config.weaponRarity,
      config.forceEnchantmentCount
    );
    log.push(`📊 決定されたエンチャント数: ${enchantmentCount}`);

    if (enchantmentCount === 0) {
      log.push(`❌ エンチャントなしで生成完了`);
      console.log('🔮 エンチャント生成結果:', log.join(' | '));
      return {
        enchantments: [],
        totalRarity: 0,
        generationLog: log,
      };
    }

    // エンチャントを生成
    const enchantments = this.generateRandomEnchantments(
      enchantmentCount,
      config,
      log
    );

    // 総レアリティを計算
    const totalRarity = enchantments.reduce(
      (sum, enchantment) => sum + this.getEnchantmentRarity(enchantment.type),
      0
    );

    log.push(`✅ 生成完了 - 総レアリティ: ${totalRarity.toFixed(3)}`);
    console.log('🔮 エンチャント生成結果:', log.join(' | '));

    return {
      enchantments,
      totalRarity,
      generationLog: log,
    };
  }

  /**
   * エンチャント数を決定
   */
  private determineEnchantmentCount(
    weaponRarity: WeaponRarity,
    forceCount?: number
  ): number {
    if (forceCount !== undefined) {
      const forcedCount = Math.max(0, Math.min(5, forceCount));
      console.log(`🎯 強制エンチャント数: ${forcedCount}`);
      return forcedCount;
    }

    // レアリティによる最大エンチャント数
    const maxEnchantments = this.getMaxEnchantmentsByRarity(weaponRarity);
    console.log(
      `🎲 武器レアリティ ${weaponRarity} の最大エンチャント数: ${maxEnchantments}`
    );

    // 確率テーブルから選択
    const roll = this.randomProvider.random();
    let cumulativeProbability = 0;
    console.log(`🎰 ランダムロール: ${roll.toFixed(3)}`);

    for (const [countStr, probability] of Object.entries(
      ENCHANTMENT_COUNT_PROBABILITY
    )) {
      const count = parseInt(countStr);
      if (count > maxEnchantments) {
        console.log(
          `⏭️ エンチャント数 ${count} は最大値 ${maxEnchantments} を超えるためスキップ`
        );
        continue;
      }

      cumulativeProbability += probability;
      console.log(
        `🎯 エンチャント数 ${count}: 確率 ${probability} (累積: ${cumulativeProbability.toFixed(3)})`
      );

      if (roll <= cumulativeProbability) {
        console.log(`✅ 選択されたエンチャント数: ${count}`);
        return count;
      }
    }

    console.log(`⚠️ フォールバック: エンチャント数 0`);
    return 0;
  }

  /**
   * レアリティによる最大エンチャント数を取得
   */
  private getMaxEnchantmentsByRarity(rarity: WeaponRarity): number {
    switch (rarity) {
      case WeaponRarity.COMMON:
        return 1;
      case WeaponRarity.UNCOMMON:
        return 2;
      case WeaponRarity.RARE:
        return 3;
      case WeaponRarity.EPIC:
        return 4;
      case WeaponRarity.LEGENDARY:
        return 5;
      default:
        return 1;
    }
  }

  /**
   * ランダムエンチャントを生成
   */
  private generateRandomEnchantments(
    count: number,
    config: EnchantmentGenerationConfig,
    log: string[]
  ): Enchantment[] {
    const enchantments: Enchantment[] = [];
    const usedTypes = new Set<EnchantmentType>();

    // 利用可能なエンチャントタイプを取得
    const availableTypes = this.getAvailableEnchantmentTypes(config);

    for (let i = 0; i < count && availableTypes.length > 0; i++) {
      // 未使用のタイプから選択
      const unusedTypes = availableTypes.filter(type => !usedTypes.has(type));

      if (unusedTypes.length === 0) {
        log.push(`警告: 利用可能なエンチャントタイプが不足`);
        break;
      }

      // レアリティ重み付きでタイプを選択
      const selectedType = this.selectWeightedEnchantmentType(unusedTypes);
      usedTypes.add(selectedType);

      // ティアを決定
      const tier = this.determineEnchantmentTier(
        selectedType,
        config.weaponRarity
      );

      // エンチャントを作成
      const enchantment = this.createEnchantment(selectedType, tier);
      enchantments.push(enchantment);

      log.push(
        `エンチャント${i + 1}: ${enchantment.description} (Tier ${tier})`
      );
    }

    return enchantments;
  }

  /**
   * 利用可能なエンチャントタイプを取得
   */
  private getAvailableEnchantmentTypes(
    config: EnchantmentGenerationConfig
  ): EnchantmentType[] {
    let types = Object.values(EnchantmentType);

    // カテゴリフィルタ
    if (config.allowedCategories) {
      types = types.filter(type => {
        const enchantmentConfig = BASIC_ENCHANTMENTS[type];
        return config.allowedCategories!.includes(enchantmentConfig.category);
      });
    }

    // 除外タイプフィルタ
    if (config.excludeTypes) {
      types = types.filter(type => !config.excludeTypes!.includes(type));
    }

    return types;
  }

  /**
   * 重み付きでエンチャントタイプを選択
   */
  private selectWeightedEnchantmentType(
    types: EnchantmentType[]
  ): EnchantmentType {
    // レアリティの逆数を重みとして使用（レアなものほど出にくい）
    const weights = types.map(type => {
      const rarity = this.getEnchantmentRarity(type);
      return 1 / (rarity + 0.01); // 0除算防止
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const roll = this.randomProvider.random() * totalWeight;

    let cumulativeWeight = 0;
    for (let i = 0; i < types.length; i++) {
      cumulativeWeight += weights[i];
      if (roll <= cumulativeWeight) {
        return types[i];
      }
    }

    return types[types.length - 1];
  }

  /**
   * エンチャントのレアリティを取得
   */
  private getEnchantmentRarity(type: EnchantmentType): number {
    return BASIC_ENCHANTMENTS[type]?.rarity || 0.1;
  }

  /**
   * エンチャントティアを決定
   */
  private determineEnchantmentTier(
    type: EnchantmentType,
    weaponRarity: WeaponRarity
  ): number {
    const maxTier = this.getMaxTierByRarity(weaponRarity);
    const enchantmentConfig = BASIC_ENCHANTMENTS[type];

    if (!enchantmentConfig) {
      return 1;
    }

    // 武器レアリティに基づいてティア範囲を決定
    const availableTiers = Math.min(maxTier, enchantmentConfig.tiers.length);

    // 高いティアほど出にくくする
    const weights = [];
    for (let tier = 1; tier <= availableTiers; tier++) {
      weights.push(Math.pow(0.6, tier - 1)); // 指数的に減少
    }

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const roll = this.randomProvider.random() * totalWeight;

    let cumulativeWeight = 0;
    for (let tier = 1; tier <= availableTiers; tier++) {
      cumulativeWeight += weights[tier - 1];
      if (roll <= cumulativeWeight) {
        return tier;
      }
    }

    return 1;
  }

  /**
   * レアリティによる最大ティアを取得
   */
  private getMaxTierByRarity(rarity: WeaponRarity): number {
    switch (rarity) {
      case WeaponRarity.COMMON:
        return 2;
      case WeaponRarity.UNCOMMON:
        return 3;
      case WeaponRarity.RARE:
        return 4;
      case WeaponRarity.EPIC:
        return 5;
      case WeaponRarity.LEGENDARY:
        return 5;
      default:
        return 2;
    }
  }

  /**
   * エンチャントオブジェクトを作成
   */
  private createEnchantment(type: EnchantmentType, tier: number): Enchantment {
    const config = BASIC_ENCHANTMENTS[type];
    if (!config) {
      throw new Error(`Unknown enchantment type: ${type}`);
    }

    const value = config.tiers[tier - 1] || config.tiers[0];

    return {
      type,
      tier,
      value,
      description: this.generateEnchantmentDescription(
        config.name,
        value,
        tier
      ),
      category: config.category,
    };
  }

  /**
   * エンチャント説明文を生成
   */
  private generateEnchantmentDescription(
    name: string,
    value: number,
    tier: number
  ): string {
    const tierText = tier > 1 ? ` Lv.${tier}` : '';
    return `${name}${tierText} (+${value})`;
  }

  /**
   * エンチャント効果をリセット
   */
  reset(): void {
    // 必要に応じてキャッシュやプールをクリア
  }
}
