/**
 * シナジー検出システム - 組み合わせ効果検出
 *
 * エンチャントの組み合わせを検出し、特殊効果を生成するシステムです。
 */

import {
  EnchantmentType,
  Enchantment,
  ComboEffect,
  EnchantmentCategory,
  COMBO_EFFECTS,
  BALANCE_SYSTEM,
} from '../types/EnchantmentTypes';

/**
 * シナジー検出結果
 */
export interface SynergyDetectionResult {
  comboEffects: ComboEffect[];
  totalMultiplier: number;
  detectionLog: string[];
  hasLegendaryCombo: boolean;
}

/**
 * シナジー検出システムクラス
 */
export class SynergyDetector {
  /**
   * エンチャントの組み合わせ効果を検出
   */
  detectSynergies(enchantments: Enchantment[]): SynergyDetectionResult {
    const log: string[] = [];
    const detectedCombos: ComboEffect[] = [];

    log.push(`シナジー検出開始 - エンチャント数: ${enchantments.length}`);

    if (enchantments.length < 2) {
      log.push('エンチャント数が不足 - 組み合わせ効果なし');
      return {
        comboEffects: [],
        totalMultiplier: 1.0,
        detectionLog: log,
        hasLegendaryCombo: false,
      };
    }

    const enchantmentTypes = enchantments.map(e => e.type);

    // 各組み合わせ効果をチェック
    for (const comboEffect of COMBO_EFFECTS) {
      if (
        this.hasRequiredEnchantments(enchantmentTypes, comboEffect.requirements)
      ) {
        detectedCombos.push(comboEffect);
        log.push(
          `組み合わせ効果発見: ${comboEffect.name} (${comboEffect.tier})`
        );
      }
    }

    // 総合倍率を計算
    const totalMultiplier = this.calculateTotalMultiplier(
      detectedCombos,
      enchantments.length,
      log
    );

    const hasLegendaryCombo = detectedCombos.some(
      combo => combo.tier === 'legendary'
    );

    log.push(
      `検出完了 - 組み合わせ数: ${detectedCombos.length}, 総合倍率: ${totalMultiplier.toFixed(2)}x`
    );

    return {
      comboEffects: detectedCombos,
      totalMultiplier,
      detectionLog: log,
      hasLegendaryCombo,
    };
  }

  /**
   * 必要なエンチャントが揃っているかチェック
   */
  private hasRequiredEnchantments(
    availableTypes: EnchantmentType[],
    requiredTypes: EnchantmentType[]
  ): boolean {
    return requiredTypes.every(required => availableTypes.includes(required));
  }

  /**
   * 総合倍率を計算
   */
  private calculateTotalMultiplier(
    comboEffects: ComboEffect[],
    enchantmentCount: number,
    log: string[]
  ): number {
    if (comboEffects.length === 0) {
      return 1.0;
    }

    // 基本倍率（各組み合わせ効果の乗算）
    let baseMult = 1.0;
    for (const combo of comboEffects) {
      baseMult *= combo.multiplier;
      log.push(`  ${combo.name}: ${combo.multiplier}x`);
    }

    // エンチャント数による調整
    const countMultiplier =
      BALANCE_SYSTEM.comboCountMultiplier[
        Math.min(
          enchantmentCount,
          5
        ) as keyof typeof BALANCE_SYSTEM.comboCountMultiplier
      ] || 0.4;

    log.push(`  エンチャント数調整: ${countMultiplier}x`);

    // 最終倍率
    const finalMultiplier = baseMult * countMultiplier;

    // 最小値・最大値の制限
    return Math.max(1.0, Math.min(10.0, finalMultiplier));
  }

  /**
   * 特定の組み合わせが存在するかチェック
   */
  hasCombo(enchantments: Enchantment[], comboName: string): boolean {
    const result = this.detectSynergies(enchantments);
    return result.comboEffects.some(combo => combo.name === comboName);
  }

  /**
   * レジェンダリー組み合わせが存在するかチェック
   */
  hasLegendaryCombo(enchantments: Enchantment[]): boolean {
    const result = this.detectSynergies(enchantments);
    return result.hasLegendaryCombo;
  }

  /**
   * 組み合わせ効果の詳細説明を生成
   */
  generateComboDescription(comboEffects: ComboEffect[]): string {
    if (comboEffects.length === 0) {
      return '';
    }

    let description = '【組み合わせ効果】\n';

    // ティア別にソート
    const sortedCombos = [...comboEffects].sort((a, b) => {
      const tierOrder = { dual: 1, triple: 2, legendary: 3 };
      return tierOrder[a.tier] - tierOrder[b.tier];
    });

    for (const combo of sortedCombos) {
      const tierIcon = this.getTierIcon(combo.tier);
      description += `${tierIcon} ${combo.name}: ${combo.description}\n`;
      description += `   効果倍率: ${combo.multiplier}x\n`;
    }

    return description.trim();
  }

  /**
   * ティアアイコンを取得
   */
  private getTierIcon(tier: ComboEffect['tier']): string {
    switch (tier) {
      case 'dual':
        return '★';
      case 'triple':
        return '★★';
      case 'legendary':
        return '★★★';
      default:
        return '•';
    }
  }

  /**
   * 組み合わせ効果の推奨度を計算
   */
  calculateComboScore(comboEffects: ComboEffect[]): number {
    let score = 0;

    for (const combo of comboEffects) {
      switch (combo.tier) {
        case 'dual':
          score += 10;
          break;
        case 'triple':
          score += 25;
          break;
        case 'legendary':
          score += 50;
          break;
      }

      // 倍率ボーナス
      score += (combo.multiplier - 1) * 20;
    }

    return score;
  }

  /**
   * 次に狙うべきエンチャントを提案
   */
  suggestNextEnchantment(
    currentEnchantments: Enchantment[]
  ): EnchantmentType[] {
    const currentTypes = currentEnchantments.map(e => e.type);
    const suggestions: EnchantmentType[] = [];

    // 現在のエンチャントで作れる組み合わせを探す
    for (const comboEffect of COMBO_EFFECTS) {
      const missingTypes = comboEffect.requirements.filter(
        required => !currentTypes.includes(required)
      );

      // 1つだけ足りない場合は提案
      if (missingTypes.length === 1) {
        suggestions.push(missingTypes[0]);
      }
    }

    // 重複を除去してレアリティ順にソート
    return [...new Set(suggestions)];
  }

  /**
   * 組み合わせ効果のプレビューを生成
   */
  previewComboWithNewEnchantment(
    currentEnchantments: Enchantment[],
    newEnchantmentType: EnchantmentType
  ): ComboEffect[] {
    // 仮のエンチャントを作成
    const tempEnchantment: Enchantment = {
      type: newEnchantmentType,
      tier: 1,
      value: 1,
      description: 'Preview',
      category: EnchantmentCategory.BASIC,
    };

    const previewEnchantments = [...currentEnchantments, tempEnchantment];
    const result = this.detectSynergies(previewEnchantments);

    return result.comboEffects;
  }
}
