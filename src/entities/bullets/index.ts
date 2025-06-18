/**
 * 拡張弾丸システム - エクスポートインデックス
 *
 * 新ボス用の4つの特殊弾丸タイプを提供します：
 * - ExplosiveBullet: 着弾時に爆発エフェクトを生成
 * - HomingBullet: プレイヤーを追尾する弾丸
 * - ReflectingBullet: 画面端で反射する弾丸
 * - SplitBullet: 一定時間後に複数に分裂する弾丸
 */

import { ExplosiveBullet } from './ExplosiveBullet';
import { HomingBullet } from './HomingBullet';
import { ReflectingBullet } from './ReflectingBullet';
import { SplitBullet } from './SplitBullet';

export { ExplosiveBullet, HomingBullet, ReflectingBullet, SplitBullet };

// 弾丸タイプの列挙
export enum AdvancedBulletType {
  EXPLOSIVE = 'explosive',
  HOMING = 'homing',
  REFLECTING = 'reflecting',
  SPLIT = 'split',
}

// 弾丸設定のインターフェース
export interface BulletConfig {
  type: AdvancedBulletType;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  specialParams?: {
    // 爆発弾用
    explosionRadius?: number;
    explosionDamage?: number;
    // 追尾弾用
    homingDuration?: number;
    turnSpeed?: number;
    // 反射弾用
    maxReflections?: number;
    // 分身弾用
    splitDelay?: number;
    splitCount?: number;
    splitAngleSpread?: number;
  };
}

// 弾丸ファクトリー関数
export function createAdvancedBullet(
  config: BulletConfig,
  gameConfig?: import('../../config/GameConfigFactory').GameConfig
): ExplosiveBullet | HomingBullet | ReflectingBullet | SplitBullet {
  const { type, x, y, speedX, speedY, specialParams = {} } = config;

  switch (type) {
    case AdvancedBulletType.EXPLOSIVE:
      return new ExplosiveBullet(
        x,
        y,
        speedX,
        speedY,
        gameConfig,
        specialParams.explosionRadius,
        specialParams.explosionDamage
      );

    case AdvancedBulletType.HOMING:
      return new HomingBullet(
        x,
        y,
        speedX,
        speedY,
        gameConfig,
        specialParams.homingDuration,
        specialParams.turnSpeed
      );

    case AdvancedBulletType.REFLECTING:
      return new ReflectingBullet(
        x,
        y,
        speedX,
        speedY,
        gameConfig,
        specialParams.maxReflections
      );

    case AdvancedBulletType.SPLIT:
      return new SplitBullet(
        x,
        y,
        speedX,
        speedY,
        gameConfig,
        specialParams.splitDelay,
        specialParams.splitCount,
        specialParams.splitAngleSpread
      );

    default:
      throw new Error(`Unknown bullet type: ${type as string}`);
  }
}

// 弾丸タイプのユーティリティ関数
export const BulletTypeUtils = {
  /**
   * 弾丸タイプが爆発弾かどうかを判定
   */
  isExplosive: (bullet: unknown): bullet is ExplosiveBullet => {
    return bullet instanceof ExplosiveBullet;
  },

  /**
   * 弾丸タイプが追尾弾かどうかを判定
   */
  isHoming: (bullet: unknown): bullet is HomingBullet => {
    return bullet instanceof HomingBullet;
  },

  /**
   * 弾丸タイプが反射弾かどうかを判定
   */
  isReflecting: (bullet: unknown): bullet is ReflectingBullet => {
    return bullet instanceof ReflectingBullet;
  },

  /**
   * 弾丸タイプが分身弾かどうかを判定
   */
  isSplit: (bullet: unknown): bullet is SplitBullet => {
    return bullet instanceof SplitBullet;
  },
};
