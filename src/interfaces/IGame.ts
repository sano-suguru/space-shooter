import { BossBullet } from '../entities/BossBullet';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';

/**
 * Gameクラスのインターフェース
 * 循環依存を回避するために必要なメソッドのみを定義
 */
export interface IGame {
  /**
   * 弾丸を作成する
   */
  createBullet(
    x: number,
    y: number,
    speed?: number,
    color?: string,
    owner?: 'player' | 'enemy' | 'boss'
  ): Bullet | null;

  /**
   * ボス弾を追加する
   */
  addBossBullet(bullet: BossBullet): void;

  /**
   * 敵を追加する
   */
  addEnemy(enemy: Enemy): void;

  /**
   * メッセージを表示する
   */
  showMessage(
    text: string,
    duration?: number,
    priority?: 'critical' | 'important' | 'info' | 'minimal'
  ): void;

  /**
   * 難易度係数を取得する
   */
  getDifficultyFactor(): number;

  /**
   * 現在のボス体力を取得する
   */
  getCurrentBossHealth(): number;
}
