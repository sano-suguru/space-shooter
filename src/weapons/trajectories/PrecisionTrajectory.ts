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
      this.config.parameters.straightPhaseDuration ?? 500;

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
    const trackingStrength = this.config.parameters.trackingStrength ?? 0.002;
    const trackingRange = this.config.parameters.trackingRange ?? Math.PI / 6;

    // 最寄りの敵を探す（簡易実装）
    const nearestEnemy = this.findNearestEnemy(position);

    if (nearestEnemy) {
      const angle = this.calculateAngle(position, nearestEnemy);
      const distance = this.calculateDistance(position, nearestEnemy);

      // 追尾範囲内かチェック
      const currentDirection = -Math.PI / 2; // 上向き
      const angleDiff = Math.abs(angle - currentDirection);

      if (angleDiff <= trackingRange && distance < 150) {
        // 軽微な追尾調整
        const adjustmentX = Math.cos(angle) * trackingStrength * deltaTime;
        const adjustmentY = Math.sin(angle) * trackingStrength * deltaTime;

        bullet.x = position.x + adjustmentX;
        bullet.y =
          position.y + adjustmentY - this.config.parameters.speed * deltaTime;

        this.state.targetPosition = nearestEnemy;
        return;
      }
    }

    // 追尾対象がない場合は直線移動
    this.updateStraightMovement(bullet, deltaTime);
    this.state.targetPosition = undefined;
  }

  /**
   * 最寄りの敵を探す（簡易実装）
   * 実際のゲームでは敵管理システムから取得
   */
  private findNearestEnemy(position: {
    x: number;
    y: number;
  }): { x: number; y: number } | null {
    // TODO: 実際の敵管理システムと連携
    // 現在は仮の実装として、画面上部にランダムな敵位置を生成
    if (Math.random() < 0.3) {
      return {
        x: position.x + (Math.random() - 0.5) * 200,
        y: position.y - 100,
      };
    }
    return null;
  }
}
