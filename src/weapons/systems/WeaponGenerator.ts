/**
 * 武器生成システム - エンチャント済み武器生成
 *
 * ベース武器にエンチャントを適用してエンチャント済み武器を生成するシステムです。
 */

import { IRandomProvider } from '../../providers/IRandomProvider';
import {
  EnchantedWeapon,
  EnhancedWeaponStats,
  WeaponGenerationResult,
  WeaponGenerationLog,
} from '../types/EnchantedWeapon';
import { Enchantment, EnchantmentType } from '../types/EnchantmentTypes';
import { WeaponConfig, WeaponRarity } from '../types/WeaponTypes';

import { EnchantmentSystem } from './EnchantmentSystem';
import { SynergyDetector } from './SynergyDetector';

/**
 * 武器生成設定
 */
export interface WeaponGenerationConfig {
  baseWeapon: WeaponConfig;
  forceEnchantmentCount?: number;
  guaranteedEnchantments?: string[];
  excludeEnchantments?: string[];
}

/**
 * 武器生成システムクラス
 */
export class WeaponGenerator {
  private enchantmentSystem: EnchantmentSystem;
  private synergyDetector: SynergyDetector;

  constructor(private randomProvider: IRandomProvider) {
    this.enchantmentSystem = new EnchantmentSystem(randomProvider);
    this.synergyDetector = new SynergyDetector();
  }

  /**
   * エンチャント済み武器を生成
   */
  generateEnchantedWeapon(
    config: WeaponGenerationConfig
  ): WeaponGenerationResult {
    const startTime = Date.now();
    const log: WeaponGenerationLog = {
      baseWeapon: config.baseWeapon.name,
      enchantmentRolls: [],
      comboDetected: [],
      finalMultiplier: 1.0,
      generationTime: 0,
    };

    // エンチャントを生成
    const enchantmentResult = this.enchantmentSystem.generateEnchantments({
      weaponRarity: config.baseWeapon.rarity,
      forceEnchantmentCount: config.forceEnchantmentCount,
    });

    // 組み合わせ効果を検出
    const synergyResult = this.synergyDetector.detectSynergies(
      enchantmentResult.enchantments
    );

    // 強化された武器統計を計算
    const enhancedStats = this.calculateEnhancedStats(
      config.baseWeapon,
      enchantmentResult.enchantments,
      synergyResult.totalMultiplier
    );

    // エンチャント済み武器を作成
    const enchantedWeapon: EnchantedWeapon = {
      ...config.baseWeapon,
      baseWeaponId: config.baseWeapon.id,
      enchantments: enchantmentResult.enchantments,
      comboEffects: synergyResult.comboEffects,
      totalStats: enhancedStats,
      displayName: this.generateDisplayName(
        config.baseWeapon,
        enchantmentResult.enchantments,
        synergyResult.hasLegendaryCombo
      ),
      uniqueId: this.generateUniqueId(),
      generatedAt: Date.now(),
    };

    // ログを完成
    log.comboDetected = synergyResult.comboEffects.map(combo => combo.name);
    log.finalMultiplier = synergyResult.totalMultiplier;
    log.generationTime = Date.now() - startTime;

    return {
      weapon: enchantedWeapon,
      generationLog: log,
    };
  }

  /**
   * 強化された武器統計を計算
   */
  private calculateEnhancedStats(
    baseWeapon: WeaponConfig,
    enchantments: Enchantment[],
    totalMultiplier: number
  ): EnhancedWeaponStats {
    // 基本性能から開始
    let finalDamage = baseWeapon.damage;
    let finalFireRate = baseWeapon.fireRate;
    let finalBulletSpeed = baseWeapon.bulletSpeed;
    let finalBulletCount = baseWeapon.bulletCount;
    let finalSpreadAngle = baseWeapon.spreadAngle;

    // エンチャント効果
    let piercingCount = 0;
    let criticalChance = 0;
    let explosionRadius = 0;
    let homingDuration = 0;
    let chainCount = 0;
    let freezeDuration = 0;
    let lifeStealRate = 0;
    let splitCount = 0;
    let ricochetCount = 0;

    // 各エンチャントを適用
    for (const enchantment of enchantments) {
      switch (enchantment.type) {
        case EnchantmentType.DAMAGE_BOOST:
          finalDamage *= 1 + enchantment.value / 100;
          break;
        case EnchantmentType.FIRE_RATE_BOOST:
          finalFireRate *= 1 - enchantment.value / 100;
          break;
        case EnchantmentType.BULLET_COUNT:
          finalBulletCount += enchantment.value;
          break;
        case EnchantmentType.PIERCING:
          piercingCount = Math.max(piercingCount, enchantment.value);
          break;
        case EnchantmentType.CRITICAL_HIT:
          criticalChance = Math.max(criticalChance, enchantment.value);
          break;
        case EnchantmentType.EXPLOSIVE_ROUNDS:
          explosionRadius = Math.max(explosionRadius, enchantment.value);
          break;
        case EnchantmentType.HOMING_BULLETS:
          homingDuration = Math.max(homingDuration, enchantment.value);
          break;
        case EnchantmentType.CHAIN_LIGHTNING:
          chainCount = Math.max(chainCount, enchantment.value);
          break;
        case EnchantmentType.FREEZE_EFFECT:
          freezeDuration = Math.max(freezeDuration, enchantment.value);
          break;
        case EnchantmentType.LIFE_STEAL:
          lifeStealRate += enchantment.value;
          break;
        case EnchantmentType.MULTI_SPLIT:
          splitCount = Math.max(splitCount, enchantment.value);
          break;
        case EnchantmentType.RICOCHET:
          ricochetCount = Math.max(ricochetCount, enchantment.value);
          break;
      }
    }

    // 組み合わせ効果の倍率を適用
    finalDamage *= totalMultiplier;

    return {
      finalDamage: Math.round(finalDamage * 100) / 100,
      finalFireRate: Math.round(finalFireRate),
      finalBulletSpeed: finalBulletSpeed,
      finalBulletCount: finalBulletCount,
      finalSpreadAngle,
      piercingCount,
      criticalChance,
      explosionRadius,
      homingDuration,
      chainCount,
      freezeDuration,
      lifeStealRate,
      splitCount,
      ricochetCount,
      totalMultiplier,
      comboCount: enchantments.length,
      hasLegendaryCombo: totalMultiplier >= 4.0,
    };
  }

  /**
   * 表示名を生成
   */
  private generateDisplayName(
    baseWeapon: WeaponConfig,
    enchantments: Enchantment[],
    hasLegendaryCombo: boolean
  ): string {
    const baseName = baseWeapon.name;
    const enchantmentCount = enchantments.length;

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
   * ユニークIDを生成
   */
  private generateUniqueId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `weapon_${timestamp}_${randomPart}`;
  }

  /**
   * 武器レアリティに基づいてランダム武器を生成
   */
  generateRandomWeapon(
    availableWeapons: WeaponConfig[],
    targetRarity?: WeaponRarity
  ): WeaponGenerationResult | null {
    if (availableWeapons.length === 0) {
      return null;
    }

    // レアリティフィルタ
    let candidateWeapons = availableWeapons;
    if (targetRarity) {
      candidateWeapons = availableWeapons.filter(
        w => w.rarity === targetRarity
      );
      if (candidateWeapons.length === 0) {
        candidateWeapons = availableWeapons;
      }
    }

    // ランダム選択
    const randomIndex = Math.floor(
      this.randomProvider.random() * candidateWeapons.length
    );
    const selectedWeapon = candidateWeapons[randomIndex];

    return this.generateEnchantedWeapon({
      baseWeapon: selectedWeapon,
    });
  }

  /**
   * 複数の武器を一括生成
   */
  generateMultipleWeapons(
    configs: WeaponGenerationConfig[],
    count: number
  ): WeaponGenerationResult[] {
    const results: WeaponGenerationResult[] = [];

    for (let i = 0; i < count && i < configs.length; i++) {
      const result = this.generateEnchantedWeapon(configs[i]);
      results.push(result);
    }

    return results;
  }

  /**
   * 武器生成統計を取得
   */
  getGenerationStats(): {
    totalGenerated: number;
    averageEnchantments: number;
    legendaryRate: number;
  } {
    // 実装は後で追加（統計追跡が必要）
    return {
      totalGenerated: 0,
      averageEnchantments: 0,
      legendaryRate: 0,
    };
  }

  /**
   * システムリセット
   */
  reset(): void {
    this.enchantmentSystem.reset();
  }
}
