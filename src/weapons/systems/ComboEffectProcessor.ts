/**
 * 組み合わせ効果処理システム - ComboEffectProcessor
 *
 * エンチャントの組み合わせ効果を実際に弾丸に適用するシステムです。
 */

import { Bullet } from '../../entities/Bullet';
import { Vector2D } from '../../types';
import { EnchantedWeapon } from '../types/EnchantedWeapon';
import { ComboEffect } from '../types/EnchantmentTypes';

/**
 * 組み合わせ効果適用結果
 */
export interface ComboEffectResult {
  modifiedBullets: Bullet[];
  additionalEffects: EffectInstance[];
  visualEffects: VisualEffect[];
}

/**
 * 効果インスタンス
 */
export interface EffectInstance {
  type: string;
  duration: number;
  intensity: number;
  target?: Vector2D;
  parameters: Record<string, unknown>;
}

/**
 * 視覚効果
 */
export interface VisualEffect {
  type: string;
  position: Vector2D;
  duration: number;
  color: string;
  size: number;
  animation: string;
}

/**
 * 組み合わせ効果処理クラス
 */
export class ComboEffectProcessor {
  /**
   * 武器の組み合わせ効果を弾丸に適用
   */
  applyComboEffects(
    weapon: EnchantedWeapon,
    bullets: Bullet[],
    firePosition: Vector2D,
    fireDirection: Vector2D
  ): ComboEffectResult {
    const result: ComboEffectResult = {
      modifiedBullets: [...bullets],
      additionalEffects: [],
      visualEffects: [],
    };

    // 各組み合わせ効果を適用
    for (const comboEffect of weapon.comboEffects) {
      this.processComboEffect(
        comboEffect,
        weapon,
        result,
        firePosition,
        fireDirection
      );
    }

    return result;
  }

  /**
   * 個別の組み合わせ効果を処理
   */
  private processComboEffect(
    comboEffect: ComboEffect,
    weapon: EnchantedWeapon,
    result: ComboEffectResult,
    firePosition: Vector2D,
    fireDirection: Vector2D
  ): void {
    switch (comboEffect.name) {
      case '貫通爆発弾':
        this.applyPiercingExplosion(comboEffect, weapon, result);
        break;
      case '追尾分裂弾':
        this.applyHomingSplit(comboEffect, weapon, result);
        break;
      case '凍結連鎖':
        this.applyFreezeChain(comboEffect, weapon, result);
        break;
      case 'クリティカル反射':
        this.applyCriticalRicochet(comboEffect, weapon, result);
        break;
      case 'バーストファイア':
        this.applyBurstFire(
          comboEffect,
          weapon,
          result,
          firePosition,
          fireDirection
        );
        break;
      case 'クラスター爆弾':
        this.applyClusterBomb(comboEffect, weapon, result);
        break;
      case '貫通連鎖爆発':
        this.applyPiercingChainExplosion(comboEffect, weapon, result);
        break;
      case '追尾クラスター':
        this.applyHomingCluster(comboEffect, weapon, result);
        break;
      case 'クリティカル連鎖反射':
        this.applyCriticalChainRicochet(comboEffect, weapon, result);
        break;
      case '究極破壊弾':
        this.applyUltimateDestroyer(comboEffect, weapon, result);
        break;
      case 'カオスストーム':
        this.applyChaosStorm(comboEffect, weapon, result);
        break;
    }
  }

  /**
   * 貫通爆発弾効果
   */
  private applyPiercingExplosion(
    comboEffect: ComboEffect,
    weapon: EnchantedWeapon,
    result: ComboEffectResult
  ): void {
    result.modifiedBullets.forEach(bullet => {
      // 貫通効果を強化
      bullet.setPiercing(weapon.totalStats.piercingCount);

      // 爆発効果を追加
      bullet.setExplosive(true);
      bullet.setExplosionRadius(
        weapon.totalStats.explosionRadius * comboEffect.multiplier
      );

      // 視覚効果
      result.visualEffects.push({
        type: 'piercing_explosion_trail',
        position: { x: bullet.getX(), y: bullet.getY() },
        duration: 1000,
        color: '#FF6B35',
        size: 20,
        animation: 'fire_trail',
      });
    });
  }

  /**
   * 追尾分裂弾効果
   */
  private applyHomingSplit(
    comboEffect: ComboEffect,
    weapon: EnchantedWeapon,
    result: ComboEffectResult
  ): void {
    result.modifiedBullets.forEach(bullet => {
      // 追尾効果
      bullet.setHoming(true);
      bullet.setHomingDuration(weapon.totalStats.homingDuration * 1000);

      // 分裂効果（遅延実行）
      const splitEffect: EffectInstance = {
        type: 'delayed_split',
        duration: 2000,
        intensity: weapon.totalStats.splitCount * comboEffect.multiplier,
        parameters: {
          bulletId: bullet.getId(),
          homingEnabled: true,
        },
      };
      result.additionalEffects.push(splitEffect);

      // 視覚効果
      result.visualEffects.push({
        type: 'homing_split_trail',
        position: { x: bullet.getX(), y: bullet.getY() },
        duration: 3000,
        color: '#4ECDC4',
        size: 15,
        animation: 'spiral_trail',
      });
    });
  }

  /**
   * 凍結連鎖効果
   */
  private applyFreezeChain(
    comboEffect: ComboEffect,
    weapon: EnchantedWeapon,
    result: ComboEffectResult
  ): void {
    result.modifiedBullets.forEach(bullet => {
      // 連鎖効果
      bullet.setChainLightning(true);
      bullet.setChainCount(weapon.totalStats.chainCount);

      // 凍結効果を連鎖に追加
      const freezeChainEffect: EffectInstance = {
        type: 'freeze_chain',
        duration: weapon.totalStats.freezeDuration * 1000,
        intensity: comboEffect.multiplier,
        parameters: {
          chainCount: weapon.totalStats.chainCount,
          freezeDuration: weapon.totalStats.freezeDuration,
        },
      };
      result.additionalEffects.push(freezeChainEffect);

      // 視覚効果
      result.visualEffects.push({
        type: 'freeze_chain_effect',
        position: { x: bullet.getX(), y: bullet.getY() },
        duration: 2000,
        color: '#87CEEB',
        size: 25,
        animation: 'ice_lightning',
      });
    });
  }

  /**
   * クリティカル反射効果
   */
  private applyCriticalRicochet(
    comboEffect: ComboEffect,
    weapon: EnchantedWeapon,
    result: ComboEffectResult
  ): void {
    result.modifiedBullets.forEach(bullet => {
      // 反射効果
      bullet.setRicochet(true);
      bullet.setRicochetCount(weapon.totalStats.ricochetCount);

      // クリティカル率を反射毎に上昇
      const criticalRicochetEffect: EffectInstance = {
        type: 'critical_ricochet',
        duration: 10000,
        intensity: comboEffect.multiplier,
        parameters: {
          baseCriticalChance: weapon.totalStats.criticalChance,
          criticalIncrease: 20, // 反射毎に+20%
          ricochetCount: weapon.totalStats.ricochetCount,
        },
      };
      result.additionalEffects.push(criticalRicochetEffect);

      // 視覚効果
      result.visualEffects.push({
        type: 'critical_ricochet_aura',
        position: { x: bullet.getX(), y: bullet.getY() },
        duration: 5000,
        color: '#FFD700',
        size: 18,
        animation: 'golden_spark',
      });
    });
  }

  /**
   * バーストファイア効果
   */
  private applyBurstFire(
    comboEffect: ComboEffect,
    weapon: EnchantedWeapon,
    result: ComboEffectResult,
    firePosition: Vector2D,
    fireDirection: Vector2D
  ): void {
    // 追加弾丸を生成（バースト効果）
    const burstCount = Math.floor(comboEffect.multiplier * 2);

    for (let i = 0; i < burstCount; i++) {
      const angle = (i - burstCount / 2) * 0.1;
      const _burstDirection = {
        x:
          fireDirection.x * Math.cos(angle) - fireDirection.y * Math.sin(angle),
        y:
          fireDirection.x * Math.sin(angle) + fireDirection.y * Math.cos(angle),
      };

      // 新しい弾丸を作成（実際の実装では適切なファクトリーを使用）
      // const burstBullet = this.createBullet(firePosition, burstDirection, weapon);
      // result.modifiedBullets.push(burstBullet);
    }

    // 視覚効果
    result.visualEffects.push({
      type: 'burst_fire_muzzle',
      position: firePosition,
      duration: 500,
      color: '#FF4500',
      size: 30,
      animation: 'muzzle_flash',
    });
  }

  /**
   * クラスター爆弾効果
   */
  private applyClusterBomb(
    comboEffect: ComboEffect,
    weapon: EnchantedWeapon,
    result: ComboEffectResult
  ): void {
    result.modifiedBullets.forEach(bullet => {
      // 分裂効果
      bullet.setSplit(true);
      bullet.setSplitCount(weapon.totalStats.splitCount);

      // 分裂後の各弾丸に爆発効果
      const clusterEffect: EffectInstance = {
        type: 'cluster_explosion',
        duration: 3000,
        intensity: comboEffect.multiplier,
        parameters: {
          splitCount: weapon.totalStats.splitCount,
          explosionRadius: weapon.totalStats.explosionRadius,
          explosionDamage: weapon.totalStats.finalDamage * 0.7,
        },
      };
      result.additionalEffects.push(clusterEffect);

      // 視覚効果
      result.visualEffects.push({
        type: 'cluster_bomb_trail',
        position: { x: bullet.getX(), y: bullet.getY() },
        duration: 2500,
        color: '#FF1493',
        size: 22,
        animation: 'cluster_sparkle',
      });
    });
  }

  /**
   * 貫通連鎖爆発効果（トリプルコンボ）
   */
  private applyPiercingChainExplosion(
    comboEffect: ComboEffect,
    weapon: EnchantedWeapon,
    result: ComboEffectResult
  ): void {
    result.modifiedBullets.forEach(bullet => {
      // 全ての効果を組み合わせ
      bullet.setPiercing(weapon.totalStats.piercingCount);
      bullet.setExplosive(true);
      bullet.setExplosionRadius(weapon.totalStats.explosionRadius * 1.5);
      bullet.setChainLightning(true);
      bullet.setChainCount(weapon.totalStats.chainCount);

      // 特殊効果：爆発が連鎖する
      const tripleEffect: EffectInstance = {
        type: 'piercing_chain_explosion',
        duration: 5000,
        intensity: comboEffect.multiplier,
        parameters: {
          piercingCount: weapon.totalStats.piercingCount,
          chainCount: weapon.totalStats.chainCount,
          explosionRadius: weapon.totalStats.explosionRadius * 1.5,
          chainExplosions: true,
        },
      };
      result.additionalEffects.push(tripleEffect);

      // 視覚効果
      result.visualEffects.push({
        type: 'triple_combo_aura',
        position: { x: bullet.getX(), y: bullet.getY() },
        duration: 4000,
        color: '#8A2BE2',
        size: 35,
        animation: 'triple_aura',
      });
    });
  }

  /**
   * 追尾クラスター効果（トリプルコンボ）
   */
  private applyHomingCluster(
    comboEffect: ComboEffect,
    weapon: EnchantedWeapon,
    result: ComboEffectResult
  ): void {
    result.modifiedBullets.forEach(bullet => {
      bullet.setHoming(true);
      bullet.setHomingDuration(weapon.totalStats.homingDuration * 1500);
      bullet.setSplit(true);
      bullet.setSplitCount(weapon.totalStats.splitCount);
      bullet.setExplosive(true);
      bullet.setExplosionRadius(weapon.totalStats.explosionRadius);

      // 分裂後も追尾効果を維持
      const homingClusterEffect: EffectInstance = {
        type: 'homing_cluster',
        duration: 6000,
        intensity: comboEffect.multiplier,
        parameters: {
          splitCount: weapon.totalStats.splitCount,
          homingDuration: weapon.totalStats.homingDuration * 1500,
          explosionRadius: weapon.totalStats.explosionRadius,
          maintainHoming: true,
        },
      };
      result.additionalEffects.push(homingClusterEffect);
    });
  }

  /**
   * クリティカル連鎖反射効果（トリプルコンボ）
   */
  private applyCriticalChainRicochet(
    comboEffect: ComboEffect,
    weapon: EnchantedWeapon,
    result: ComboEffectResult
  ): void {
    result.modifiedBullets.forEach(bullet => {
      bullet.setRicochet(true);
      bullet.setRicochetCount(weapon.totalStats.ricochetCount);
      bullet.setChainLightning(true);
      bullet.setChainCount(weapon.totalStats.chainCount);

      // 反射と連鎖でクリティカル率が相互強化
      const criticalChainRicochetEffect: EffectInstance = {
        type: 'critical_chain_ricochet',
        duration: 8000,
        intensity: comboEffect.multiplier,
        parameters: {
          baseCriticalChance: weapon.totalStats.criticalChance,
          ricochetBonus: 25,
          chainBonus: 15,
          maxCriticalChance: 95,
        },
      };
      result.additionalEffects.push(criticalChainRicochetEffect);
    });
  }

  /**
   * 究極破壊弾効果（レジェンダリー）
   */
  private applyUltimateDestroyer(
    comboEffect: ComboEffect,
    weapon: EnchantedWeapon,
    result: ComboEffectResult
  ): void {
    result.modifiedBullets.forEach(bullet => {
      // 全ての効果を最大レベルで適用
      bullet.setPiercing(weapon.totalStats.piercingCount * 2);
      bullet.setExplosive(true);
      bullet.setExplosionRadius(weapon.totalStats.explosionRadius * 2);
      bullet.setChainLightning(true);
      bullet.setChainCount(weapon.totalStats.chainCount * 2);
      bullet.setCriticalChance(100); // クリティカル確定

      // レジェンダリー効果
      const ultimateEffect: EffectInstance = {
        type: 'ultimate_destroyer',
        duration: 10000,
        intensity: comboEffect.multiplier,
        parameters: {
          allEffectsMaximized: true,
          guaranteedCritical: true,
          doubledEffects: true,
        },
      };
      result.additionalEffects.push(ultimateEffect);

      // 特別な視覚効果
      result.visualEffects.push({
        type: 'legendary_aura',
        position: { x: bullet.getX(), y: bullet.getY() },
        duration: 8000,
        color: '#FFD700',
        size: 50,
        animation: 'rainbow_explosion',
      });
    });
  }

  /**
   * カオスストーム効果（レジェンダリー）
   */
  private applyChaosStorm(
    comboEffect: ComboEffect,
    weapon: EnchantedWeapon,
    result: ComboEffectResult
  ): void {
    result.modifiedBullets.forEach(bullet => {
      // ランダムに全効果を適用
      bullet.setHoming(Math.random() > 0.3);
      bullet.setSplit(Math.random() > 0.4);
      bullet.setRicochet(Math.random() > 0.5);
      bullet.setExplosive(Math.random() > 0.2);

      // カオス効果
      const chaosEffect: EffectInstance = {
        type: 'chaos_storm',
        duration: 12000,
        intensity: comboEffect.multiplier,
        parameters: {
          randomEffects: true,
          unpredictableBehavior: true,
          maxChaos: true,
        },
      };
      result.additionalEffects.push(chaosEffect);

      // カオス視覚効果
      result.visualEffects.push({
        type: 'chaos_aura',
        position: { x: bullet.getX(), y: bullet.getY() },
        duration: 10000,
        color: '#FF00FF',
        size: 40,
        animation: 'chaos_swirl',
      });
    });
  }
}
