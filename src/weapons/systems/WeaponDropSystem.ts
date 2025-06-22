/**
 * 武器ドロップシステム
 *
 * 敵撃破時に武器をランダムドロップするシステムです。
 */

import { DroppedWeapon } from '../../entities/DroppedWeapon';
import { IRandomProvider } from '../../providers/IRandomProvider';
import { ALL_WEAPON_CONFIGS } from '../data/weaponConfigs';
import { EnchantedWeapon } from '../types/EnchantedWeapon';
import { WeaponRarity, WEAPON_RARITY_CONFIG } from '../types/WeaponTypes';

import { WeaponGenerator } from './WeaponGenerator';

/**
 * ドロップ設定
 */
export interface DropConfig {
  baseDropRate: number;
  rarityMultipliers: Record<WeaponRarity, number>;
  levelMultiplier: number;
  bossMultiplier: number;
  comboMultiplier: number;
}

/**
 * ドロップ結果
 */
export interface DropResult {
  success: boolean;
  droppedWeapon?: DroppedWeapon;
  enchantedWeapon?: EnchantedWeapon;
  dropReason: string;
  actualDropRate: number;
}

/**
 * 敵情報
 */
export interface EnemyInfo {
  type: 'normal' | 'elite' | 'boss';
  level: number;
  position: { x: number; y: number };
  killStreak?: number;
}

/**
 * 武器ドロップシステムクラス
 */
export class WeaponDropSystem {
  private weaponGenerator: WeaponGenerator;
  private dropConfig: DropConfig;
  private totalDrops: number = 0;
  private successfulDrops: number = 0;
  private dropHistory: DropResult[] = [];

  constructor(private randomProvider: IRandomProvider) {
    this.weaponGenerator = new WeaponGenerator(randomProvider);
    this.dropConfig = this.createDefaultDropConfig();
  }

  /**
   * デフォルトドロップ設定を作成
   */
  private createDefaultDropConfig(): DropConfig {
    return {
      baseDropRate: 0.15, // 15%の基本ドロップ率
      rarityMultipliers: {
        [WeaponRarity.COMMON]: 1.0,
        [WeaponRarity.UNCOMMON]: 0.6,
        [WeaponRarity.RARE]: 0.3,
        [WeaponRarity.EPIC]: 0.1,
        [WeaponRarity.LEGENDARY]: 0.02,
      },
      levelMultiplier: 0.01, // レベル毎に1%増加
      bossMultiplier: 3.0, // ボスは3倍
      comboMultiplier: 1.5, // コンボ時は1.5倍
    };
  }

  /**
   * 敵撃破時の武器ドロップ判定
   */
  public attemptDrop(enemyInfo: EnemyInfo): DropResult {
    this.totalDrops++;

    // ドロップ率を計算
    const dropRate = this.calculateDropRate(enemyInfo);
    const roll = this.randomProvider.random();

    const result: DropResult = {
      success: false,
      dropReason: `ドロップ判定: ${(dropRate * 100).toFixed(1)}% (ロール: ${(roll * 100).toFixed(1)}%)`,
      actualDropRate: dropRate,
    };

    // ドロップ判定
    if (roll <= dropRate) {
      const weaponResult = this.generateDroppedWeapon(enemyInfo);
      if (weaponResult) {
        result.success = true;
        result.droppedWeapon = weaponResult.droppedWeapon;
        result.enchantedWeapon = weaponResult.enchantedWeapon;
        result.dropReason += ` → 成功！${weaponResult.enchantedWeapon.displayName}をドロップ`;
        this.successfulDrops++;
      }
    } else {
      result.dropReason += ' → 失敗';
    }

    // 履歴に追加
    this.dropHistory.push(result);
    if (this.dropHistory.length > 100) {
      this.dropHistory.shift();
    }

    return result;
  }

  /**
   * ドロップ率を計算
   */
  private calculateDropRate(enemyInfo: EnemyInfo): number {
    let dropRate = this.dropConfig.baseDropRate;

    // 敵タイプによる倍率
    switch (enemyInfo.type) {
      case 'elite':
        dropRate *= 2.0;
        break;
      case 'boss':
        dropRate *= this.dropConfig.bossMultiplier;
        break;
    }

    // レベルによる倍率
    dropRate += enemyInfo.level * this.dropConfig.levelMultiplier;

    // キルストリークによる倍率
    if (enemyInfo.killStreak && enemyInfo.killStreak > 5) {
      dropRate *= this.dropConfig.comboMultiplier;
    }

    // 最大値制限
    return Math.min(dropRate, 0.8); // 最大80%
  }

  /**
   * ドロップされた武器を生成
   */
  private generateDroppedWeapon(enemyInfo: EnemyInfo): {
    droppedWeapon: DroppedWeapon;
    enchantedWeapon: EnchantedWeapon;
  } | null {
    // 武器レアリティを決定
    const rarity = this.selectWeaponRarity(enemyInfo);

    // レアリティに応じた武器を選択
    const availableWeapons = ALL_WEAPON_CONFIGS.filter(
      w => w.rarity === rarity
    );
    if (availableWeapons.length === 0) {
      return null;
    }

    // 武器を生成
    const weaponResult = this.weaponGenerator.generateRandomWeapon(
      availableWeapons,
      rarity
    );
    if (!weaponResult) {
      return null;
    }

    // ドロップされた武器エンティティを作成
    const droppedWeapon = new DroppedWeapon(
      weaponResult.weapon,
      enemyInfo.position.x,
      enemyInfo.position.y
    );

    return {
      droppedWeapon,
      enchantedWeapon: weaponResult.weapon,
    };
  }

  /**
   * 武器レアリティを選択
   */
  private selectWeaponRarity(enemyInfo: EnemyInfo): WeaponRarity {
    // 敵タイプとレベルに基づいてレアリティ重みを調整
    const baseWeights = { ...WEAPON_RARITY_CONFIG };

    // 敵タイプによる調整
    let rarityBonus = 1.0;
    switch (enemyInfo.type) {
      case 'elite':
        rarityBonus = 1.5;
        break;
      case 'boss':
        rarityBonus = 2.0;
        break;
    }

    // レベルによる調整
    const levelBonus = 1 + enemyInfo.level * 0.1;
    const totalBonus = rarityBonus * levelBonus;

    // 重み付き選択
    const rarities = Object.keys(baseWeights) as WeaponRarity[];
    const weights = rarities.map(rarity => {
      const baseWeight = baseWeights[rarity].dropRate;
      const multiplier = this.dropConfig.rarityMultipliers[rarity];

      // 高レアリティほどボーナスの恩恵を受けやすくする
      const rarityIndex = rarities.indexOf(rarity);
      const rarityMultiplier = Math.pow(totalBonus, rarityIndex * 0.3);

      return baseWeight * multiplier * rarityMultiplier;
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const roll = this.randomProvider.random() * totalWeight;

    let cumulativeWeight = 0;
    for (let i = 0; i < rarities.length; i++) {
      cumulativeWeight += weights[i];
      if (roll <= cumulativeWeight) {
        return rarities[i];
      }
    }

    return WeaponRarity.COMMON;
  }

  /**
   * 強制ドロップ（デバッグ・テスト用）
   */
  public forceDrop(
    position: { x: number; y: number },
    rarity?: WeaponRarity,
    enchantmentCount?: number
  ): DropResult {
    const enemyInfo: EnemyInfo = {
      type: 'boss',
      level: 10,
      position,
    };

    const targetRarity = rarity ?? this.selectWeaponRarity(enemyInfo);
    const availableWeapons = ALL_WEAPON_CONFIGS.filter(
      w => w.rarity === targetRarity
    );

    if (availableWeapons.length === 0) {
      return {
        success: false,
        dropReason: `指定されたレアリティ ${targetRarity} の武器が見つかりません`,
        actualDropRate: 1.0,
      };
    }

    const selectedWeapon =
      availableWeapons[
        Math.floor(this.randomProvider.random() * availableWeapons.length)
      ];

    const weaponResult = this.weaponGenerator.generateEnchantedWeapon({
      baseWeapon: selectedWeapon,
      forceEnchantmentCount: enchantmentCount,
    });

    const droppedWeapon = new DroppedWeapon(
      weaponResult.weapon,
      position.x,
      position.y
    );

    this.successfulDrops++;

    return {
      success: true,
      droppedWeapon,
      enchantedWeapon: weaponResult.weapon,
      dropReason: `強制ドロップ: ${weaponResult.weapon.displayName}`,
      actualDropRate: 1.0,
    };
  }

  /**
   * ドロップ設定を更新
   */
  public updateDropConfig(config: Partial<DropConfig>): void {
    this.dropConfig = { ...this.dropConfig, ...config };
  }

  /**
   * ドロップ統計を取得
   */
  public getDropStats(): {
    totalDrops: number;
    successfulDrops: number;
    dropRate: number;
    rarityDistribution: Record<WeaponRarity, number>;
    recentDrops: DropResult[];
  } {
    // レアリティ分布を計算
    const rarityDistribution: Record<WeaponRarity, number> = {
      [WeaponRarity.COMMON]: 0,
      [WeaponRarity.UNCOMMON]: 0,
      [WeaponRarity.RARE]: 0,
      [WeaponRarity.EPIC]: 0,
      [WeaponRarity.LEGENDARY]: 0,
    };

    this.dropHistory
      .filter(drop => drop.success && drop.enchantedWeapon)
      .forEach(drop => {
        rarityDistribution[drop.enchantedWeapon!.rarity]++;
      });

    return {
      totalDrops: this.totalDrops,
      successfulDrops: this.successfulDrops,
      dropRate:
        this.totalDrops > 0 ? this.successfulDrops / this.totalDrops : 0,
      rarityDistribution,
      recentDrops: this.dropHistory.slice(-10),
    };
  }

  /**
   * ラッキードロップ（特別なイベント）
   */
  public triggerLuckyDrop(position: { x: number; y: number }): DropResult {
    // ラッキードロップは必ずレア以上
    const luckyRarities = [
      WeaponRarity.RARE,
      WeaponRarity.EPIC,
      WeaponRarity.LEGENDARY,
    ];

    const selectedRarity =
      luckyRarities[
        Math.floor(this.randomProvider.random() * luckyRarities.length)
      ];

    return this.forceDrop(position, selectedRarity, 3); // 3つのエンチャント保証
  }

  /**
   * システムリセット
   */
  public reset(): void {
    this.totalDrops = 0;
    this.successfulDrops = 0;
    this.dropHistory = [];
    this.weaponGenerator.reset();
  }

  /**
   * 武器生成器を取得
   */
  public getWeaponGenerator(): WeaponGenerator {
    return this.weaponGenerator;
  }
}
