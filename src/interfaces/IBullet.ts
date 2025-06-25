/**
 * 弾丸統一インターフェース
 *
 * 全ての弾丸クラスが実装すべき統一インターフェースを定義します。
 * このインターフェースにより、弾丸システムの型安全性と拡張性が向上します。
 */
export interface IBullet {
  // ========================================
  // 基本機能
  // ========================================

  /**
   * 弾丸がアクティブ状態かどうかを確認
   * @returns アクティブ状態の場合true
   */
  isActive(): boolean;

  /**
   * 弾丸を非アクティブ化
   */
  deactivate(): void;

  /**
   * 弾丸の現在位置を取得
   * @returns 弾丸の座標
   */
  getPosition(): { x: number; y: number };

  /**
   * 弾丸の一意識別子を取得
   * @returns 弾丸のユニークID
   */
  getId(): string;

  /**
   * 弾丸の所有者を取得
   * @returns 弾丸の所有者（プレイヤー、敵、ボス）
   */
  getOwner(): 'player' | 'enemy' | 'boss';

  // ========================================
  // エンチャント効果（統一）
  // ========================================

  /**
   * 貫通効果があるかどうかを確認
   * @returns 貫通効果の有無
   */
  isPiercing(): boolean;

  /**
   * 貫通回数を取得
   * @returns 貫通可能回数
   */
  getPiercingCount(): number;

  /**
   * 爆発効果があるかどうかを確認
   * @returns 爆発効果の有無
   */
  isExplosive(): boolean;

  /**
   * 爆発半径を取得
   * @returns 爆発の影響範囲
   */
  getExplosionRadius(): number;

  /**
   * ホーミング効果があるかどうかを確認
   * @returns ホーミング効果の有無
   */
  isHoming(): boolean;

  /**
   * ホーミング持続時間を取得
   * @returns ホーミング効果の持続時間（ミリ秒）
   */
  getHomingDuration(): number;

  /**
   * チェインライトニング効果があるかどうかを確認
   * @returns チェインライトニング効果の有無
   */
  hasChainLightning(): boolean;

  /**
   * チェイン回数を取得
   * @returns 連鎖可能回数
   */
  getChainCount(): number;

  /**
   * 分裂効果があるかどうかを確認
   * @returns 分裂効果の有無
   */
  canSplit(): boolean;

  /**
   * 分裂数を取得
   * @returns 分裂時の弾丸数
   */
  getSplitCount(): number;

  /**
   * リコシェット効果があるかどうかを確認
   * @returns リコシェット効果の有無
   */
  canRicochet(): boolean;

  /**
   * リコシェット回数を取得
   * @returns 跳弾可能回数
   */
  getRicochetCount(): number;

  /**
   * クリティカル確率を取得
   * @returns クリティカルヒット確率（0.0-1.0）
   */
  getCriticalChance(): number;

  /**
   * 凍結効果があるかどうかを確認
   * @returns 凍結効果の有無
   */
  hasFreezeEffect(): boolean;

  /**
   * 凍結持続時間を取得
   * @returns 凍結効果の持続時間（ミリ秒）
   */
  getFreezeDuration(): number;

  // ========================================
  // ライフサイクル
  // ========================================

  /**
   * 弾丸の状態を更新
   * @param deltaTime 前フレームからの経過時間
   */
  update(deltaTime: number): void;

  /**
   * 弾丸を描画
   * @param ctx 描画コンテキスト
   */
  draw(ctx: CanvasRenderingContext2D): void;

  /**
   * 弾丸をリセット（オブジェクトプール用）
   */
  reset(): void;
}
