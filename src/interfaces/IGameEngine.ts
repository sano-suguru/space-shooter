import { BossBullet } from '../entities/BossBullet';

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
}
