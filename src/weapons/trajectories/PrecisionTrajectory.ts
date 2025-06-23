/**
 * 精密射撃弾道パターン
 *
 * ベーシックレーザー用の軽微な追尾効果を実装
 * - 発射後0.5秒は直線移動
 * - その後軽微な追尾効果を発動
 */

import { Bullet } from '../../entities/Bullet';
import { TrajectoryType } from '../types/TrajectoryTypes';

import { BaseTrajectory } from './BaseTrajectory';

/**
 * 精密射撃弾道クラス
 */
export class PrecisionTrajectory extends BaseTrajectory {
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
    const straightDuration =
      this.config.parameters.straightPhaseDuration ?? 200; // 0.2秒に短縮

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
   * 最寄りの敵を探す（追尾効果デモ用）
   * 実際のゲームでは敵管理システムから取得
   */
  private findNearestEnemy(position: {
    x: number;
    y: number;
  }): { x: number; y: number } | null {
    // TODO: 実際の敵管理システムと連携
    // デモ用：追尾効果が明確に見える敵位置を提供

    // 追尾効果をテストするため、常に敵を生成
    // 弾丸の斜め前方に固定的な敵を配置（追尾効果が最も見えやすい）
    const enemyDistance = 120; // 固定距離
    const horizontalOffset = position.x < 400 ? 80 : -80; // 画面中央を基準に左右に配置

    return {
      x: position.x + horizontalOffset,
      y: position.y - enemyDistance,
    };
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
