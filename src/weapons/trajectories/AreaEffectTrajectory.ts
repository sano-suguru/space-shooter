/**
 * 範囲攻撃弾道パターン
 *
 * プラズマキャノン用の着弾時爆発効果を実装
 * - 直線移動で進行
 * - 着弾時または2秒経過時に小規模爆発
 */

import { Bullet } from '../../entities/Bullet';
import { TrajectoryType } from '../types/TrajectoryTypes';

import { BaseTrajectory } from './BaseTrajectory';

/**
 * 範囲攻撃弾道クラス
 */
export class AreaEffectTrajectory extends BaseTrajectory {
  private hasExploded: boolean = false;

  /**
   * 弾道タイプを取得
   */
  public getType(): TrajectoryType {
    return TrajectoryType.AREA_EFFECT;
  }

  /**
   * 弾道をリセット
   */
  public reset(): void {
    super.reset();
    this.hasExploded = false;
  }

  /**
   * 弾丸の軌道を更新
   */
  public update(bullet: Bullet, deltaTime: number): void {
    this.initializeTrajectory(bullet);

    const elapsedTime = this.getElapsedTime();
    const explosionDelay = this.config.parameters.explosionDelay ?? 2000;

    // 直線移動
    this.state.phase = 'moving';
    this.updateStraightMovement(bullet, deltaTime);

    // 爆発条件チェック
    if (
      !this.hasExploded &&
      (elapsedTime >= explosionDelay || this.shouldExplodeOnContact(bullet))
    ) {
      this.triggerExplosion(bullet);
    }

    // 画面外チェック
    if (this.isOffScreen(bullet)) {
      this.state.isCompleted = true;
    }
  }

  /**
   * 接触による爆発判定
   */
  private shouldExplodeOnContact(_bullet: Bullet): boolean {
    // TODO: 実際の衝突検出システムと連携
    // 現在は簡易実装として、一定確率で爆発
    return Math.random() < 0.01;
  }

  /**
   * 爆発を発動
   */
  private triggerExplosion(bullet: Bullet): void {
    if (this.hasExploded) return;

    this.hasExploded = true;
    this.state.phase = 'exploding';

    const position = bullet.getPosition();
    const explosionRadius = this.config.parameters.explosionRadius ?? 25;
    const explosionDamage = this.config.parameters.explosionDamage ?? 0.5;

    // 爆発エフェクトを作成
    this.createExplosionEffect(position, explosionRadius);

    // 範囲内の敵にダメージを与える
    this.dealAreaDamage(position, explosionRadius, explosionDamage);

    // 弾丸を非アクティブ化
    bullet.deactivate();
    this.state.isCompleted = true;
  }

  /**
   * 爆発エフェクトを作成
   */
  private createExplosionEffect(
    position: { x: number; y: number },
    radius: number
  ): void {
    // TODO: 実際の爆発エフェクトシステムと連携
    console.log(
      `爆発エフェクト: 位置(${position.x}, ${position.y}), 半径${radius}`
    );
  }

  /**
   * 範囲ダメージを処理
   */
  private dealAreaDamage(
    position: { x: number; y: number },
    radius: number,
    damage: number
  ): void {
    // TODO: 実際の敵管理システムと連携
    console.log(
      `範囲ダメージ: 位置(${position.x}, ${position.y}), 半径${radius}, ダメージ${damage}`
    );
  }
}
