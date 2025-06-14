import { PowerUpType } from '../types';

/**
 * Playerクラスのインターフェース
 * PowerUpとの循環依存を回避するために必要なメソッドのみを定義
 */
export interface IPlayer {
  // GameObject基本プロパティ（衝突判定に必要）
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  
  /**
   * GameObject互換メソッド（CollisionSystem用）
   */
  update(deltaTime: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
  
  /**
   * 発射レートを設定する
   */
  setFireRate(rate: number): void;
  
  /**
   * 弾丸タイプを設定する
   */
  setBulletType(type: 'single' | 'triple'): void;
  
  /**
   * シールドを有効化する
   */
  activateShield(): void;
  
  /**
   * PowerUpを有効化する
   */
  activatePowerup(type: PowerUpType): void;
  
  /**
   * 体力を取得する
   */
  getHealth(): number;
  
  /**
   * 最大体力を取得する
   */
  getMaxHealth(): number;
  
  /**
   * ダメージを受ける
   */
  takeDamage(amount: number): void;
  
  /**
   * 位置を取得する
   */
  getPosition(): { x: number; y: number };
  
  /**
   * 境界ボックスを取得する（衝突判定用）
   */
  getX(): number;
  getY(): number;
  getWidth(): number;
  getHeight(): number;
}