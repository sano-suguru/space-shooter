/**
 * 弾道システム - 基底抽象クラス
 *
 * 全ての弾道パターンの基底となる抽象クラス
 */

import { Bullet } from '../../entities/Bullet';
import {
  IBulletTrajectory,
  TrajectoryConfig,
  TrajectoryDebugInfo,
  TrajectoryState,
  TrajectoryType,
  Vector2D,
} from '../types/TrajectoryTypes';

/**
 * 弾道パターンの基底抽象クラス
 */
export abstract class BaseTrajectory implements IBulletTrajectory {
  protected config: TrajectoryConfig;
  protected state: TrajectoryState;

  constructor(config: TrajectoryConfig) {
    this.config = config;
    this.state = {
      startTime: 0,
      isCompleted: false,
      phase: 'initial',
      initialPosition: { x: 0, y: 0 },
      initialVelocity: { x: 0, y: 0 },
    };
  }

  /**
   * 弾丸の軌道を更新（抽象メソッド）
   */
  public abstract update(bullet: Bullet, deltaTime: number): void;

  /**
   * 弾道タイプを取得（抽象メソッド）
   */
  public abstract getType(): TrajectoryType;

  /**
   * 弾道が完了したかどうか
   */
  public isComplete(): boolean {
    return this.state.isCompleted;
  }

  /**
   * 弾道をリセット
   */
  public reset(): void {
    this.state = {
      startTime: 0,
      isCompleted: false,
      phase: 'initial',
      initialPosition: { x: 0, y: 0 },
      initialVelocity: { x: 0, y: 0 },
    };
  }

  /**
   * デバッグ情報を取得
   */
  public getDebugInfo(): TrajectoryDebugInfo {
    return {
      type: this.getType(),
      elapsedTime: this.getElapsedTime(),
      phase: this.state.phase,
      targetPosition: this.state.targetPosition,
      currentAmplitude: this.state.currentAmplitude,
    };
  }

  /**
   * 経過時間を取得
   */
  protected getElapsedTime(): number {
    return Date.now() - this.state.startTime;
  }

  /**
   * 弾道を初期化
   */
  protected initializeTrajectory(bullet: Bullet): void {
    if (this.state.startTime === 0) {
      this.state.startTime = Date.now();
      const position = bullet.getPosition();
      this.state.initialPosition = { x: position.x, y: position.y };
      this.state.initialVelocity = { x: 0, y: -this.config.parameters.speed };
    }
  }

  /**
   * 弾丸を基本的な直線移動で更新
   */
  protected updateStraightMovement(bullet: Bullet, deltaTime: number): void {
    const position = bullet.getPosition();
    bullet.x = position.x;
    bullet.y = position.y - this.config.parameters.speed * deltaTime;
  }

  /**
   * 2点間の距離を計算
   */
  protected calculateDistance(pos1: Vector2D, pos2: Vector2D): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 2点間の角度を計算
   */
  protected calculateAngle(from: Vector2D, to: Vector2D): number {
    return Math.atan2(to.y - from.y, to.x - from.x);
  }

  /**
   * 弾丸が画面外に出たかチェック
   */
  protected isOffScreen(bullet: Bullet): boolean {
    const position = bullet.getPosition();
    return (
      position.y < -50 ||
      position.y > 800 ||
      position.x < -50 ||
      position.x > 850
    );
  }
}
