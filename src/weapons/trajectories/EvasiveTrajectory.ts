/**
 * 回避困難弾道パターン
 *
 * エネルギービーム用のサイン波軌道を実装
 * - サイン波による左右振動軌道
 * - 振幅が徐々に拡大
 */

import { Bullet } from '../../entities/Bullet';
import { TrajectoryType } from '../types/TrajectoryTypes';

import { BaseTrajectory } from './BaseTrajectory';

/**
 * 回避困難弾道クラス
 */
export class EvasiveTrajectory extends BaseTrajectory {
  /**
   * 弾道タイプを取得
   */
  public getType(): TrajectoryType {
    return TrajectoryType.EVASIVE;
  }

  /**
   * 弾丸の軌道を更新
   */
  public update(bullet: Bullet, deltaTime: number): void {
    this.initializeTrajectory(bullet);

    this.state.phase = 'wave_motion';

    // サイン波軌道を更新
    this.updateWaveMovement(bullet, deltaTime);

    // 画面外チェック
    if (this.isOffScreen(bullet)) {
      this.state.isCompleted = true;
    }
  }

  /**
   * サイン波移動を更新
   */
  private updateWaveMovement(bullet: Bullet, deltaTime: number): void {
    const position = bullet.getPosition();
    const elapsedTime = this.getElapsedTime();

    const wavePeriod = this.config.parameters.wavePeriod ?? 800;
    const maxAmplitude = this.config.parameters.maxAmplitude ?? 40;
    const amplitudeGrowthRate =
      this.config.parameters.amplitudeGrowthRate ?? 0.05;
    const speed = this.config.parameters.speed;

    // 時間に基づく振幅の成長
    const currentAmplitude = Math.min(
      maxAmplitude,
      maxAmplitude * ((elapsedTime * amplitudeGrowthRate) / 1000)
    );
    this.state.currentAmplitude = currentAmplitude;

    // サイン波による横方向の変位
    const wavePhase = (elapsedTime / wavePeriod) * 2 * Math.PI;
    const horizontalOffset = Math.sin(wavePhase) * currentAmplitude;

    // 基準位置からの横方向オフセットを計算
    const baseX = this.state.initialPosition.x;
    const newX = baseX + horizontalOffset;

    // 縦方向は一定速度で移動
    const newY = position.y - speed * deltaTime;

    bullet.x = newX;
    bullet.y = newY;
  }

  /**
   * 現在の振幅を取得
   */
  public getCurrentAmplitude(): number {
    return this.state.currentAmplitude ?? 0;
  }

  /**
   * 波の位相を取得
   */
  public getWavePhase(): number {
    const elapsedTime = this.getElapsedTime();
    const wavePeriod = this.config.parameters.wavePeriod ?? 800;
    return (elapsedTime / wavePeriod) * 2 * Math.PI;
  }
}
