/**
 * 弾道パターンファクトリー
 *
 * 弾道パターンの生成とオブジェクトプール管理を行う
 */

import {
  IBulletTrajectory,
  TrajectoryConfig,
  TrajectoryType,
} from '../types/TrajectoryTypes';

import { AreaEffectTrajectory } from './AreaEffectTrajectory';
import { BarrageTrajectory } from './BarrageTrajectory';
import { EvasiveTrajectory } from './EvasiveTrajectory';
import { PrecisionTrajectory } from './PrecisionTrajectory';

/**
 * 弾道パターンファクトリークラス
 */
export class TrajectoryFactory {
  private static trajectoryPools: Map<TrajectoryType, IBulletTrajectory[]> =
    new Map();
  private static maxPoolSize: number = 20;

  /**
   * 弾道パターンを作成
   */
  public static createTrajectory(
    config: TrajectoryConfig,
    bulletIndex?: number
  ): IBulletTrajectory {
    // プールから取得を試行
    const pooled = this.getFromPool(config.type);
    if (pooled) {
      pooled.reset();
      return pooled;
    }

    // 新しいインスタンスを作成
    return this.createNewTrajectory(config, bulletIndex);
  }

  /**
   * 新しい弾道パターンインスタンスを作成
   */
  private static createNewTrajectory(
    config: TrajectoryConfig,
    bulletIndex?: number
  ): IBulletTrajectory {
    switch (config.type) {
      case TrajectoryType.PRECISION:
        return new PrecisionTrajectory(config);

      case TrajectoryType.AREA_EFFECT:
        return new AreaEffectTrajectory(config);

      case TrajectoryType.BARRAGE:
        return new BarrageTrajectory(config, bulletIndex ?? 0);

      case TrajectoryType.EVASIVE:
        return new EvasiveTrajectory(config);

      case TrajectoryType.STRAIGHT:
      default:
        // 直線軌道は既存のBulletクラスで処理するため、nullを返す
        throw new Error(`未対応の弾道タイプ: ${config.type}`);
    }
  }

  /**
   * プールから弾道パターンを取得
   */
  private static getFromPool(type: TrajectoryType): IBulletTrajectory | null {
    const pool = this.trajectoryPools.get(type);
    if (pool && pool.length > 0) {
      return pool.pop() ?? null;
    }
    return null;
  }

  /**
   * 弾道パターンをプールに返却
   */
  public static returnToPool(trajectory: IBulletTrajectory): void {
    const type = trajectory.getType();

    if (!this.trajectoryPools.has(type)) {
      this.trajectoryPools.set(type, []);
    }

    const pool = this.trajectoryPools.get(type)!;
    if (pool.length < this.maxPoolSize) {
      trajectory.reset();
      pool.push(trajectory);
    }
  }

  /**
   * プール統計を取得
   */
  public static getPoolStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const [type, pool] of this.trajectoryPools) {
      stats[type] = pool.length;
    }

    return stats;
  }

  /**
   * プールをクリーンアップ
   */
  public static cleanup(): void {
    this.trajectoryPools.clear();
  }

  /**
   * プールサイズを設定
   */
  public static setMaxPoolSize(size: number): void {
    this.maxPoolSize = Math.max(1, size);
  }
}
