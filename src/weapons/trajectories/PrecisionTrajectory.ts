/**
 * 精密射撃弾道パターン
 *
 * ベーシックレーザー用の軽微な追尾効果を実装
 * - 発射後0.05秒は直線移動
 * - その後軽微な追尾効果を発動
 * - 実際の敵管理システムと連携して追尾
 */

import { Bullet } from '../../entities/Bullet';
import { Enemy } from '../../entities/Enemy';
import { TrajectoryType } from '../types/TrajectoryTypes';

import { BaseTrajectory } from './BaseTrajectory';

/**
 * 敵管理システムへのアクセスインターフェース
 */
export interface IEnemyProvider {
  getEnemies(): Enemy[];
}

/**
 * 精密射撃弾道クラス
 */
export class PrecisionTrajectory extends BaseTrajectory {
  private enemyProvider?: IEnemyProvider;

  /**
   * 敵プロバイダーを設定
   */
  public setEnemyProvider(provider: IEnemyProvider): void {
    this.enemyProvider = provider;
  }

  /**
   * 弾道タイプを取得
   */
  public getType(): TrajectoryType {
    return TrajectoryType.PRECISION;
  }

  /**
   * 弾丸の軌道を更新
   */
  public update(bullet: Bullet, deltaTime: number): void {
    this.initializeTrajectory(bullet);

    const elapsedTime = this.getElapsedTime();
    const straightDuration = this.config.parameters.straightPhaseDuration ?? 50; // 0.05秒に大幅短縮

    if (elapsedTime < straightDuration) {
      // 直線移動フェーズ
      this.state.phase = 'straight';
      this.updateStraightMovement(bullet, deltaTime);
    } else {
      // 追尾フェーズ
      this.state.phase = 'tracking';
      this.updateTrackingMovement(bullet, deltaTime);
    }

    // 画面外チェック
    if (this.isOffScreen(bullet)) {
      this.state.isCompleted = true;
    }
  }

  /**
   * 追尾移動を更新
   */
  private updateTrackingMovement(bullet: Bullet, deltaTime: number): void {
    const position = bullet.getPosition();
    const baseSpeed = this.config.parameters.speed * deltaTime;

    // 最寄りの敵を探す（改良版）
    const nearestEnemy = this.findNearestEnemy(position);

    if (nearestEnemy) {
      const distance = this.calculateDistance(position, nearestEnemy);
      const trackingRange = this.config.parameters.trackingRange ?? 400;

      if (distance < trackingRange) {
        // 敵への方向ベクトルを計算
        const directionX = nearestEnemy.x - position.x;
        const directionY = nearestEnemy.y - position.y;
        const magnitude = Math.sqrt(
          directionX * directionX + directionY * directionY
        );

        if (magnitude > 0) {
          // 追尾強度を大幅に強化（速度の50%まで）
          const trackingStrength = baseSpeed * 0.5;

          // 正規化された方向ベクトル
          const normalizedX = directionX / magnitude;
          const normalizedY = directionY / magnitude;

          // 距離に応じた追尾強度調整
          const distanceFactor = Math.max(0.4, 1 - distance / trackingRange);
          const adjustedStrength = trackingStrength * distanceFactor;

          // 追尾ベクトルを計算
          const trackingX = normalizedX * adjustedStrength;
          const trackingY = normalizedY * adjustedStrength;

          // 基本上向き移動と追尾を合成
          const finalX = position.x + trackingX;
          const finalY = position.y - baseSpeed + trackingY;

          bullet.x = finalX;
          bullet.y = finalY;

          this.state.targetPosition = nearestEnemy;
          this.state.isTracking = true;
          return;
        }
      }
    }

    // 追尾対象がない場合は直線移動
    this.updateStraightMovement(bullet, deltaTime);
    this.state.targetPosition = undefined;
    this.state.isTracking = false;
  }

  /**
   * 最寄りの敵を探す（実際の敵管理システムから取得）
   */
  private findNearestEnemy(position: {
    x: number;
    y: number;
  }): { x: number; y: number } | null {
    // 敵プロバイダーが設定されていない場合はフォールバック
    if (!this.enemyProvider) {
      return this.getFallbackEnemyPosition(position);
    }

    const enemies = this.enemyProvider.getEnemies();
    if (!enemies || enemies.length === 0) {
      return null;
    }

    let nearestEnemy: Enemy | null = null;
    let nearestDistance = Infinity;

    // 全ての敵から最も近い敵を探す
    for (const enemy of enemies) {
      const enemyPos = enemy.getPosition();
      const distance = this.calculateDistance(position, enemyPos);

      // 追尾範囲内で最も近い敵を選択
      const trackingRange = this.config.parameters.trackingRange ?? 400;
      if (distance < trackingRange && distance < nearestDistance) {
        nearestEnemy = enemy;
        nearestDistance = distance;
      }
    }

    if (nearestEnemy) {
      return nearestEnemy.getPosition();
    }

    return null;
  }

  /**
   * 敵プロバイダーが利用できない場合のフォールバック
   */
  private getFallbackEnemyPosition(position: {
    x: number;
    y: number;
  }): { x: number; y: number } | null {
    // デバッグ用：固定的な敵位置を提供（開発時のみ）
    if (typeof window !== 'undefined' && this.isDebugMode()) {
      const enemyDistance = 120;
      const horizontalOffset = position.x < 400 ? 80 : -80;
      return {
        x: position.x + horizontalOffset,
        y: position.y - enemyDistance,
      };
    }
    return null;
  }

  /**
   * デバッグモードかどうかを判定
   */
  private isDebugMode(): boolean {
    const windowWithDebug = window as Window & { DEBUG_MODE?: boolean };
    return Boolean(windowWithDebug.DEBUG_MODE);
  }

  /**
   * 追尾状態を取得
   */
  public isTracking(): boolean {
    return this.state.isTracking ?? false;
  }

  /**
   * 現在のターゲット位置を取得
   */
  public getTargetPosition(): { x: number; y: number } | undefined {
    return this.state.targetPosition;
  }
}
