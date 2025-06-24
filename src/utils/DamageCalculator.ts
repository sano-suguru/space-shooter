/**
 * ダメージ計算システム
 *
 * クリティカルヒット判定とダメージ計算を行います。
 */

import { IRandomProvider } from '../providers/IRandomProvider';
import { RealRandomProvider } from '../providers/RealRandomProvider';

export interface DamageResult {
  damage: number;
  isCritical: boolean;
}

export class DamageCalculator {
  private static randomProvider: IRandomProvider = new RealRandomProvider();

  /**
   * ランダムプロバイダーを設定（テスト用）
   */
  static setRandomProvider(provider: IRandomProvider): void {
    this.randomProvider = provider;
  }

  /**
   * ダメージを計算する
   * @param baseDamage ベースダメージ
   * @param criticalChance クリティカル確率（0-100）
   * @param criticalMultiplier クリティカル倍率（デフォルト: 2.0）
   * @returns ダメージ計算結果
   */
  static calculateDamage(
    baseDamage: number,
    criticalChance: number,
    criticalMultiplier: number = 2.0
  ): DamageResult {
    const isCritical = this.randomProvider.random() < criticalChance / 100;
    const damage = isCritical ? baseDamage * criticalMultiplier : baseDamage;

    return { damage, isCritical };
  }

  /**
   * 複数回のダメージ計算を行う（連鎖攻撃用）
   * @param baseDamage ベースダメージ
   * @param criticalChance クリティカル確率
   * @param count 計算回数
   * @param damageReduction 回数毎のダメージ減衰率（デフォルト: 0.8）
   * @returns ダメージ計算結果の配列
   */
  static calculateChainDamage(
    baseDamage: number,
    criticalChance: number,
    count: number,
    damageReduction: number = 0.8
  ): DamageResult[] {
    const results: DamageResult[] = [];
    let currentDamage = baseDamage;

    for (let i = 0; i < count; i++) {
      const result = this.calculateDamage(currentDamage, criticalChance);
      results.push(result);
      currentDamage *= damageReduction; // 連鎖毎にダメージ減衰
    }

    return results;
  }

  /**
   * 貫通ダメージを計算する
   * @param baseDamage ベースダメージ
   * @param criticalChance クリティカル確率
   * @param piercingCount 貫通回数
   * @param damageReduction 貫通毎のダメージ減衰率（デフォルト: 0.9）
   * @returns ダメージ計算結果の配列
   */
  static calculatePiercingDamage(
    baseDamage: number,
    criticalChance: number,
    piercingCount: number,
    damageReduction: number = 0.9
  ): DamageResult[] {
    const results: DamageResult[] = [];
    let currentDamage = baseDamage;

    for (let i = 0; i < piercingCount; i++) {
      const result = this.calculateDamage(currentDamage, criticalChance);
      results.push(result);
      currentDamage *= damageReduction; // 貫通毎にダメージ減衰
    }

    return results;
  }

  /**
   * ランダムプロバイダーを取得（テスト用）
   */
  static getRandomProvider(): IRandomProvider {
    return this.randomProvider;
  }
}
