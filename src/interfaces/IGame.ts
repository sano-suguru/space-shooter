import { BossBullet } from '../entities/BossBullet';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import type { EquippedWeapon } from '../weapons/types/WeaponTypes';

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

  /**
   * ビジュアル効果の有効/無効を切り替え
   */
  toggleEnhancedVisuals(): void;

  /**
   * ビジュアル効果の状態を取得
   */
  isEnhancedVisualsEnabled(): boolean;

  /**
   * 背景最適化の切り替え
   */
  toggleBackgroundOptimization(): void;

  /**
   * 武器切り替え
   */
  switchWeapon(slot: number): void;

  /**
   * 装備中の武器一覧を取得
   */
  getEquippedWeapons(): EquippedWeapon[];

  /**
   * ゲームループを一時停止
   */
  pauseGameLoop(): void;

  /**
   * ゲームループを再開
   */
  resumeGameLoop(): void;

  /**
   * 全パフォーマンス統計を取得
   */
  getAllPerformanceStats(): {
    background: Record<string, unknown>;
    pools: Record<string, unknown>;
    performance: Record<string, unknown>;
    lod: Record<string, unknown>;
  };
}
