import { IBullet } from '../interfaces/IBullet';

import { GameObject } from './GameObject';

/**
 * 弾丸基底クラス
 *
 * 全ての弾丸クラスの共通機能を実装する抽象クラスです。
 * IBulletインターフェースを実装し、エンチャント効果のデフォルト実装を提供します。
 */
export abstract class BaseBullet extends GameObject implements IBullet {
  protected active: boolean = true;
  protected uniqueId: string = '';
  protected owner: 'player' | 'enemy' | 'boss' = 'player';

  // ========================================
  // エンチャント効果のデフォルト実装
  // ========================================

  /**
   * 貫通効果があるかどうかを確認
   * @returns 貫通効果の有無（デフォルト: false）
   */
  public isPiercing(): boolean {
    return false;
  }

  /**
   * 貫通回数を取得
   * @returns 貫通可能回数（デフォルト: 0）
   */
  public getPiercingCount(): number {
    return 0;
  }

  /**
   * 爆発効果があるかどうかを確認
   * @returns 爆発効果の有無（デフォルト: false）
   */
  public isExplosive(): boolean {
    return false;
  }

  /**
   * 爆発半径を取得
   * @returns 爆発の影響範囲（デフォルト: 0）
   */
  public getExplosionRadius(): number {
    return 0;
  }

  /**
   * ホーミング効果があるかどうかを確認
   * @returns ホーミング効果の有無（デフォルト: false）
   */
  public isHoming(): boolean {
    return false;
  }

  /**
   * ホーミング持続時間を取得
   * @returns ホーミング効果の持続時間（デフォルト: 0）
   */
  public getHomingDuration(): number {
    return 0;
  }

  /**
   * チェインライトニング効果があるかどうかを確認
   * @returns チェインライトニング効果の有無（デフォルト: false）
   */
  public hasChainLightning(): boolean {
    return false;
  }

  /**
   * チェイン回数を取得
   * @returns 連鎖可能回数（デフォルト: 0）
   */
  public getChainCount(): number {
    return 0;
  }

  /**
   * 分裂効果があるかどうかを確認
   * @returns 分裂効果の有無（デフォルト: false）
   */
  public canSplit(): boolean {
    return false;
  }

  /**
   * 分裂数を取得
   * @returns 分裂時の弾丸数（デフォルト: 0）
   */
  public getSplitCount(): number {
    return 0;
  }

  /**
   * リコシェット効果があるかどうかを確認
   * @returns リコシェット効果の有無（デフォルト: false）
   */
  public canRicochet(): boolean {
    return false;
  }

  /**
   * リコシェット回数を取得
   * @returns 跳弾可能回数（デフォルト: 0）
   */
  public getRicochetCount(): number {
    return 0;
  }

  /**
   * クリティカル確率を取得
   * @returns クリティカルヒット確率（デフォルト: 0.0）
   */
  public getCriticalChance(): number {
    return 0.0;
  }

  /**
   * 凍結効果があるかどうかを確認
   * @returns 凍結効果の有無（デフォルト: false）
   */
  public hasFreezeEffect(): boolean {
    return false;
  }

  /**
   * 凍結持続時間を取得
   * @returns 凍結効果の持続時間（デフォルト: 0）
   */
  public getFreezeDuration(): number {
    return 0;
  }

  // ========================================
  // 基本機能の実装
  // ========================================

  /**
   * 弾丸がアクティブ状態かどうかを確認
   * @returns アクティブ状態の場合true
   */
  public isActive(): boolean {
    return this.active;
  }

  /**
   * 弾丸を非アクティブ化
   */
  public deactivate(): void {
    this.active = false;
  }

  /**
   * 弾丸の現在位置を取得
   * @returns 弾丸の座標
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /**
   * 弾丸の一意識別子を取得
   * @returns 弾丸のユニークID
   */
  public getId(): string {
    if (!this.uniqueId) {
      this.uniqueId = `bullet_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
    return this.uniqueId;
  }

  /**
   * 弾丸の所有者を取得
   * @returns 弾丸の所有者（プレイヤー、敵、ボス）
   */
  public getOwner(): 'player' | 'enemy' | 'boss' {
    return this.owner;
  }

  /**
   * 弾丸の所有者を設定
   * @param owner 弾丸の所有者
   */
  public setOwner(owner: 'player' | 'enemy' | 'boss'): void {
    this.owner = owner;
  }

  /**
   * 弾丸をリセット（オブジェクトプール用）
   */
  public reset(): void {
    this.active = false;
    this.uniqueId = '';
    this.x = 0;
    this.y = 0;
    this.owner = 'player';
  }

  // ========================================
  // 抽象メソッド
  // ========================================

  /**
   * 弾丸の状態を更新
   * @param deltaTime 前フレームからの経過時間
   */
  public abstract update(deltaTime: number): void;

  /**
   * 弾丸を描画
   * @param ctx 描画コンテキスト
   */
  public abstract draw(ctx: CanvasRenderingContext2D): void;
}
