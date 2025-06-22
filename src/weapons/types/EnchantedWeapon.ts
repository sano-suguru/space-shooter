/**
 * エンチャント済み武器 - データ構造定義
 *
 * エンチャント効果が付与された武器のデータ構造を定義します。
 */

import { Enchantment, ComboEffect } from './EnchantmentTypes';
import { WeaponConfig } from './WeaponTypes';

/**
 * エンチャント済み武器インターフェース
 */
export interface EnchantedWeapon extends WeaponConfig {
  baseWeaponId: string;
  enchantments: Enchantment[];
  comboEffects: ComboEffect[];
  totalStats: EnhancedWeaponStats;
  displayName: string;
  uniqueId: string;
  generatedAt: number; // タイムスタンプ
}

/**
 * 強化された武器統計
 */
export interface EnhancedWeaponStats {
  // 基本性能（エンチャント適用後）
  finalDamage: number;
  finalFireRate: number;
  finalBulletSpeed: number;
  finalBulletCount: number;
  finalSpreadAngle?: number;

  // エンチャント効果
  piercingCount: number;
  criticalChance: number;
  explosionRadius: number;
  homingDuration: number;
  chainCount: number;
  freezeDuration: number;
  lifeStealRate: number;
  splitCount: number;
  ricochetCount: number;

  // 組み合わせ効果
  totalMultiplier: number;
  comboCount: number;
  hasLegendaryCombo: boolean;
}

/**
 * 武器生成結果
 */
export interface WeaponGenerationResult {
  weapon: EnchantedWeapon;
  generationLog: WeaponGenerationLog;
}

/**
 * 武器生成ログ
 */
export interface WeaponGenerationLog {
  baseWeapon: string;
  enchantmentRolls: EnchantmentRoll[];
  comboDetected: string[];
  finalMultiplier: number;
  generationTime: number;
}

/**
 * エンチャント抽選結果
 */
export interface EnchantmentRoll {
  type: string;
  tier: number;
  value: number;
  rollChance: number;
  success: boolean;
}

/**
 * ドロップされた武器エンティティ用データ
 */
export interface DroppedWeaponData {
  enchantedWeapon: EnchantedWeapon;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  rotation: number;
  glowIntensity: number;
  pickupRadius: number;
  lifeTime: number;
  maxLifeTime: number;
}

/**
 * 武器比較結果
 */
export interface WeaponComparisonResult {
  betterWeapon: EnchantedWeapon;
  improvements: WeaponImprovement[];
  overallScore: number;
  recommendation: 'upgrade' | 'keep_current' | 'situational';
}

/**
 * 武器改善点
 */
export interface WeaponImprovement {
  stat: keyof EnhancedWeaponStats;
  currentValue: number;
  newValue: number;
  improvement: number;
  improvementType: 'absolute' | 'percentage';
}

/**
 * エンチャント済み武器のユーティリティ関数
 */
export class EnchantedWeaponUtils {
  /**
   * 武器の総合スコアを計算
   */
  static calculateOverallScore(weapon: EnchantedWeapon): number {
    const stats = weapon.totalStats;

    // 基本性能スコア
    const damageScore = stats.finalDamage * 10;
    const fireRateScore = (1000 / stats.finalFireRate) * 5;
    const bulletCountScore = stats.finalBulletCount * 15;

    // 特殊効果スコア
    const piercingScore = stats.piercingCount * 20;
    const criticalScore = stats.criticalChance * 2;
    const explosionScore = stats.explosionRadius * 1.5;
    const comboScore = stats.totalMultiplier * 50;

    const baseScore =
      damageScore +
      fireRateScore +
      bulletCountScore +
      piercingScore +
      criticalScore +
      explosionScore;

    return baseScore * stats.totalMultiplier + comboScore;
  }

  /**
   * 武器の表示名を生成
   */
  static generateDisplayName(weapon: EnchantedWeapon): string {
    const baseName = weapon.name;
    const enchantmentCount = weapon.enchantments.length;
    const hasLegendaryCombo = weapon.totalStats.hasLegendaryCombo;

    if (hasLegendaryCombo) {
      return `★★★ ${baseName} ★★★`;
    }

    if (enchantmentCount >= 3) {
      return `★★ ${baseName} ★★`;
    }

    if (enchantmentCount >= 2) {
      return `★ ${baseName} ★`;
    }

    if (enchantmentCount >= 1) {
      return `+ ${baseName} +`;
    }

    return baseName;
  }

  /**
   * 武器の詳細説明を生成
   */
  static generateDescription(weapon: EnchantedWeapon): string {
    let description = weapon.description;

    if (weapon.enchantments.length > 0) {
      description += '\n\n【エンチャント効果】';
      weapon.enchantments.forEach(enchantment => {
        description += `\n• ${enchantment.description}`;
      });
    }

    if (weapon.comboEffects.length > 0) {
      description += '\n\n【組み合わせ効果】';
      weapon.comboEffects.forEach(combo => {
        description += `\n★ ${combo.name}: ${combo.description}`;
      });
    }

    return description;
  }

  /**
   * 武器を比較
   */
  static compareWeapons(
    current: EnchantedWeapon,
    candidate: EnchantedWeapon
  ): WeaponComparisonResult {
    const currentScore = this.calculateOverallScore(current);
    const candidateScore = this.calculateOverallScore(candidate);

    const improvements: WeaponImprovement[] = [];
    const currentStats = current.totalStats;
    const candidateStats = candidate.totalStats;

    // 各ステータスの比較
    const statComparisons: Array<keyof EnhancedWeaponStats> = [
      'finalDamage',
      'finalFireRate',
      'finalBulletCount',
      'piercingCount',
      'criticalChance',
      'totalMultiplier',
    ];

    statComparisons.forEach(stat => {
      const currentValue = currentStats[stat] as number;
      const newValue = candidateStats[stat] as number;

      if (newValue > currentValue) {
        improvements.push({
          stat,
          currentValue,
          newValue,
          improvement: newValue - currentValue,
          improvementType: 'absolute',
        });
      }
    });

    let recommendation: 'upgrade' | 'keep_current' | 'situational';
    if (candidateScore > currentScore * 1.2) {
      recommendation = 'upgrade';
    } else if (candidateScore < currentScore * 0.8) {
      recommendation = 'keep_current';
    } else {
      recommendation = 'situational';
    }

    return {
      betterWeapon: candidateScore > currentScore ? candidate : current,
      improvements,
      overallScore: candidateScore,
      recommendation,
    };
  }
}
