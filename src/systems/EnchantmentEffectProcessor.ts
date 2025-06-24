/**
 * エンチャント効果統合処理システム
 *
 * 弾丸のエンチャント効果を統合的に処理します。
 */

import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';
import { GameObjectManager } from '../managers/GameObjectManager';
import { DamageCalculator } from '../utils/DamageCalculator';

import {
  ChainLightningProcessor,
  ChainLightningConfig,
} from './ChainLightningProcessor';

export class EnchantmentEffectProcessor {
  private chainProcessor: ChainLightningProcessor;

  constructor(
    private gameObjectManager: GameObjectManager,
    private eventEmitter: EventEmitter<EventMap>
  ) {
    this.chainProcessor = new ChainLightningProcessor(
      gameObjectManager,
      eventEmitter
    );
  }

  /**
   * 弾丸のエンチャント効果を処理する
   * @param bullet 弾丸
   * @param hitEnemy 衝突した敵
   */
  processEffects(bullet: Bullet, hitEnemy: Enemy): void {
    // クリティカル判定とダメージ計算
    const damageResult = DamageCalculator.calculateDamage(
      1, // ベースダメージ
      bullet.getCriticalChance()
    );

    const shouldDestroy = hitEnemy.takeDamage(
      damageResult.damage,
      damageResult.isCritical
    );

    // 凍結効果処理（敵が生きている間に適用）
    if (bullet.hasFreezeEffect()) {
      hitEnemy.freeze(bullet.getFreezeDuration());
    }

    // 連鎖効果処理（敵が撃破された場合のみ）
    if (shouldDestroy && bullet.hasChainLightning()) {
      const chainConfig: ChainLightningConfig = {
        chainCount: bullet.getChainCount(),
        chainRange: 100, // デフォルト範囲
        baseDamage: damageResult.damage * 0.8, // 連鎖ダメージは80%
        criticalChance: bullet.getCriticalChance(),
        damageReduction: 0.8, // 連鎖毎に20%減衰
      };

      this.chainProcessor.processChainLightning(
        hitEnemy.getPosition(),
        chainConfig
      );
    }

    // 爆発効果処理（敵が破壊された場合）
    if (shouldDestroy && bullet.isExplosive()) {
      const enemyPosition = hitEnemy.getPosition();
      this.processExplosionEffect(
        enemyPosition,
        bullet.getExplosionRadius(),
        damageResult.damage * 0.7, // 爆発ダメージは70%
        bullet.getCriticalChance()
      );
    }

    if (shouldDestroy) {
      this.eventEmitter.emit('enemyDestroyed', hitEnemy);
      this.gameObjectManager.removeEnemy(hitEnemy);
    }
  }

  /**
   * 弾丸のエンチャント効果を処理する（敵削除を遅延）
   * @param bullet 弾丸
   * @param hitEnemy 衝突した敵
   * @returns 敵が破壊されるかどうか
   */
  processEffectsWithDelayedRemoval(bullet: Bullet, hitEnemy: Enemy): boolean {
    // クリティカル判定とダメージ計算
    const damageResult = DamageCalculator.calculateDamage(
      1, // ベースダメージ
      bullet.getCriticalChance()
    );

    const shouldDestroy = hitEnemy.takeDamage(
      damageResult.damage,
      damageResult.isCritical
    );

    // 凍結効果処理（敵が生きている間に適用）
    if (bullet.hasFreezeEffect()) {
      hitEnemy.freeze(bullet.getFreezeDuration());
    }

    // 連鎖効果処理（敵が撃破された場合のみ）
    if (shouldDestroy && bullet.hasChainLightning()) {
      const chainConfig: ChainLightningConfig = {
        chainCount: bullet.getChainCount(),
        chainRange: 100, // デフォルト範囲
        baseDamage: damageResult.damage * 0.8, // 連鎖ダメージは80%
        criticalChance: bullet.getCriticalChance(),
        damageReduction: 0.8, // 連鎖毎に20%減衰
      };

      this.chainProcessor.processChainLightning(
        hitEnemy.getPosition(),
        chainConfig
      );
    }

    // 爆発効果処理（敵が破壊された場合）
    if (shouldDestroy && bullet.isExplosive()) {
      const enemyPosition = hitEnemy.getPosition();
      this.processExplosionEffect(
        enemyPosition,
        bullet.getExplosionRadius(),
        damageResult.damage * 0.7, // 爆発ダメージは70%
        bullet.getCriticalChance()
      );
    }

    // 敵削除は呼び出し元で行う
    return shouldDestroy;
  }

  /**
   * 爆発効果を処理する
   * @param position 爆発位置
   * @param radius 爆発半径
   * @param damage 爆発ダメージ
   * @param criticalChance クリティカル確率
   */
  processExplosionEffect(
    position: { x: number; y: number },
    radius: number,
    damage: number,
    criticalChance: number = 0
  ): void {
    const enemies = this.gameObjectManager.getEnemies();
    const affectedEnemies = enemies.filter(enemy => {
      const enemyPos = enemy.getPosition();
      const distance = Math.sqrt(
        Math.pow(enemyPos.x - position.x, 2) +
          Math.pow(enemyPos.y - position.y, 2)
      );
      return distance <= radius;
    });

    for (const enemy of affectedEnemies) {
      const damageResult = DamageCalculator.calculateDamage(
        damage,
        criticalChance
      );

      const shouldDestroy = enemy.takeDamage(
        damageResult.damage,
        damageResult.isCritical
      );

      if (shouldDestroy) {
        this.eventEmitter.emit('enemyDestroyed', enemy);
        this.gameObjectManager.removeEnemy(enemy);
      }
    }
  }

  /**
   * 分裂効果を処理する
   * @param bullet 分裂する弾丸
   * @param splitCount 分裂数
   * @param angleSpread 分裂角度範囲
   * @returns 分裂弾丸の情報配列
   */
  processSplitEffect(
    bullet: Bullet,
    splitCount: number,
    angleSpread: number = Math.PI / 3
  ): Array<{
    x: number;
    y: number;
    speedX: number;
    speedY: number;
  }> {
    const position = bullet.getPosition();
    const speed = bullet.getSpeed();
    const currentAngle = Math.atan2(-speed, 0); // 上向きを基準

    const childBullets: Array<{
      x: number;
      y: number;
      speedX: number;
      speedY: number;
    }> = [];

    const angleStep = angleSpread / (splitCount - 1);
    const startAngle = currentAngle - angleSpread / 2;

    for (let i = 0; i < splitCount; i++) {
      const angle = startAngle + angleStep * i;
      const speedX = Math.cos(angle) * speed;
      const speedY = Math.sin(angle) * speed;

      childBullets.push({
        x: position.x + bullet.getWidth() / 2,
        y: position.y + bullet.getHeight() / 2,
        speedX,
        speedY,
      });
    }

    return childBullets;
  }
}
