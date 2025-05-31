import { BossBullet } from '../entities/BossBullet';
import { Bullet } from '../entities/Bullet';

/**
 * ゲームエンジンのインターフェース
 * 循環依存を解消するため、GameクラスとEntityクラス間の結合を抽象化
 */
export interface IGameEngine {
  /**
   * ボス弾を追加する
   */
  addBossBullet(bullet: BossBullet): void;

  /**
   * 現在の難易度係数を取得
   * ウェーブ数に基づいて敵の強度を調整するための係数
   */
  getDifficultyFactor(): number;

  /**
   * プレイヤー弾を作成する
   * オブジェクトプールを使用した弾丸の効率的な管理
   */
  createBullet(x: number, y: number, speed?: number, color?: string): Bullet | null;
}
