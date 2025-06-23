/**
 * 弾幕攻撃弾道パターン
 *
 * 速射砲用の3発同時発射効果を実装
 * - 中央、左15度、右15度の3発同時発射
 * - 各弾丸は独立した軌道を持つ
 */

import { Bullet } from '../../entities/Bullet';
import { TrajectoryConfig, TrajectoryType } from '../types/TrajectoryTypes';

import { BaseTrajectory } from './BaseTrajectory';

/**
 * 弾幕攻撃弾道クラス
 */
export class BarrageTrajectory extends BaseTrajectory {
  private bulletIndex: number = 0; // 0: 中央, 1: 左, 2: 右
  private spreadDirection: number = 0; // 拡散方向

  constructor(config: TrajectoryConfig, bulletIndex: number = 0) {
    super(config);
    this.bulletIndex = bulletIndex;
    this.calculateSpreadDirection();
  }

  /**
   * 弾道タイプを取得
   */
  public getType(): TrajectoryType {
    return TrajectoryType.BARRAGE;
  }

  /**
   * 弾道をリセット
   */
  public reset(): void {
    super.reset();
    this.calculateSpreadDirection();
  }

  /**
   * 弾丸の軌道を更新
   */
  public update(bullet: Bullet, deltaTime: number): void {
    this.initializeTrajectory(bullet);

    this.state.phase = 'spreading';

    // 拡散移動を更新
    this.updateSpreadMovement(bullet, deltaTime);

    // 画面外チェック
    if (this.isOffScreen(bullet)) {
      this.state.isCompleted = true;
    }
  }

  /**
   * 拡散方向を計算
   */
  private calculateSpreadDirection(): void {
    const spreadAngle = this.config.parameters.spreadAngle ?? Math.PI / 12; // 15度

    switch (this.bulletIndex) {
      case 0: // 中央
        this.spreadDirection = 0;
        break;
      case 1: // 左
        this.spreadDirection = -spreadAngle;
        break;
      case 2: // 右
        this.spreadDirection = spreadAngle;
        break;
      default:
        this.spreadDirection = 0;
    }
  }

  /**
   * 拡散移動を更新
   */
  private updateSpreadMovement(bullet: Bullet, deltaTime: number): void {
    const position = bullet.getPosition();
    const speed = this.config.parameters.speed;

    // 拡散方向を考慮した移動
    const velocityX = Math.sin(this.spreadDirection) * speed * deltaTime;
    const velocityY = -Math.cos(this.spreadDirection) * speed * deltaTime;

    bullet.x = position.x + velocityX;
    bullet.y = position.y + velocityY;
  }

  /**
   * 弾丸インデックスを設定
   */
  public setBulletIndex(index: number): void {
    this.bulletIndex = index;
    this.calculateSpreadDirection();
  }

  /**
   * 弾丸インデックスを取得
   */
  public getBulletIndex(): number {
    return this.bulletIndex;
  }
}
