import { GameConfig, createGameConfig } from '../config/GameConfigFactory';

import { GameObject } from './GameObject';

export class BossBullet extends GameObject {
  private speedX: number;
  private speedY: number;
  private config: GameConfig;
  private uniqueId: string = '';

  // 視覚エフェクト用
  private trail: Array<{ x: number; y: number; alpha: number }> = [];
  private maxTrailLength: number = 8;
  private animationTime: number = 0;
  private glowIntensity: number = 1.0;
  private pulseSpeed: number = 0.008;

  constructor(
    x: number,
    y: number,
    speedX: number,
    speedY: number,
    config?: GameConfig
  ) {
    // 設定注入対応（後方互換性を保持）
    const gameConfig = config ?? createGameConfig();
    super(x, y, gameConfig.bullet.width, gameConfig.bullet.height);

    this.config = gameConfig;
    this.speedX = speedX;
    this.speedY = speedY;
  }

  public update(deltaTime: number): void {
    this.x += this.speedX * deltaTime;
    this.y += this.speedY * deltaTime;

    // アニメーション時間更新
    this.animationTime += deltaTime;

    // グロー強度の更新（脈動効果）
    this.glowIntensity =
      0.7 + Math.sin(this.animationTime * this.pulseSpeed) * 0.3;

    // 軌跡の更新
    this.updateTrail();
  }

  /**
   * 軌跡を更新
   */
  private updateTrail(): void {
    // 新しい軌跡点を追加
    this.trail.push({
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
      alpha: 1.0,
    });

    // 軌跡の長さを制限
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    // 軌跡の透明度を更新
    this.trail.forEach((point, index) => {
      point.alpha = ((index + 1) / this.trail.length) * 0.8;
    });
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 軌跡を描画
    this.drawTrail(ctx);

    // 弾丸本体を描画
    this.drawEnergyBullet(ctx);

    ctx.restore();
  }

  /**
   * 軌跡を描画
   */
  private drawTrail(ctx: CanvasRenderingContext2D): void {
    if (this.trail.length < 2) return;

    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    for (let i = 1; i < this.trail.length; i++) {
      const current = this.trail[i];
      const previous = this.trail[i - 1];

      ctx.globalAlpha = current.alpha * 0.6;
      ctx.beginPath();
      ctx.moveTo(previous.x, previous.y);
      ctx.lineTo(current.x, current.y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
  }

  /**
   * エネルギー弾丸を描画
   */
  private drawEnergyBullet(ctx: CanvasRenderingContext2D): void {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const radius = Math.max(this.width, this.height) / 2;

    // 外側のエネルギーオーラ
    const auraGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius * 4
    );
    auraGradient.addColorStop(0, '#ff00ff');
    auraGradient.addColorStop(0.3, 'rgba(255, 0, 255, 0.6)');
    auraGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = auraGradient;
    ctx.globalAlpha = this.glowIntensity * 0.7;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 4, 0, Math.PI * 2);
    ctx.fill();

    // 中間層のグロー
    const midGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius * 2
    );
    midGradient.addColorStop(0, '#ffffff');
    midGradient.addColorStop(0.5, '#ff00ff');
    midGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = midGradient;
    ctx.globalAlpha = this.glowIntensity;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // 中心核
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // エネルギーの輝き（十字形）
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = this.glowIntensity;

    const sparkLength = radius * 2;
    // 縦の輝き
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - sparkLength);
    ctx.lineTo(centerX, centerY + sparkLength);
    ctx.stroke();

    // 横の輝き
    ctx.beginPath();
    ctx.moveTo(centerX - sparkLength, centerY);
    ctx.lineTo(centerX + sparkLength, centerY);
    ctx.stroke();
  }

  public isOnScreen(): boolean {
    return (
      this.y < this.config.canvas.height &&
      this.y > 0 &&
      this.x < this.config.canvas.width &&
      this.x > 0
    );
  }

  /**
   * 設定を取得（テスト用）
   */
  public getConfig(): GameConfig {
    return this.config;
  }

  /**
   * 弾丸の一意IDを取得
   */
  public getId(): string {
    if (!this.uniqueId) {
      this.uniqueId = `boss_bullet_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // デバッグログ: ID生成
      console.log('🆔 BossBullet ID生成:', {
        newId: this.uniqueId,
        position: { x: this.x, y: this.y },
        className: this.constructor.name,
      });
    }
    return this.uniqueId;
  }

  /**
   * IDをリセット（サブクラス用）
   */
  protected resetId(): void {
    const oldId = this.uniqueId;
    this.uniqueId = '';

    // デバッグログ: IDリセット
    console.log('🔄 BossBullet IDリセット:', {
      oldId: oldId || '(空)',
      newId: '(空)',
      position: { x: this.x, y: this.y },
      className: this.constructor.name,
    });
  }

  /**
   * 弾丸の位置を取得
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /**
   * 弾丸がアクティブかどうかを確認
   */
  public isActive(): boolean {
    return this.isOnScreen();
  }

  /**
   * 弾丸を非アクティブ化
   */
  public deactivate(): void {
    // BossBulletでは画面外に移動させることで非アクティブ化
    this.x = -1000;
    this.y = -1000;
  }

  // ========================================
  // エンチャント効果関連メソッド（デフォルト実装）
  // ========================================

  /**
   * 貫通効果があるかどうかを確認
   * @returns 貫通効果の有無（BossBulletはデフォルトでfalse）
   */
  public isPiercing(): boolean {
    return false;
  }

  /**
   * 貫通回数を取得
   * @returns 貫通回数（BossBulletはデフォルトで0）
   */
  public getPiercingCount(): number {
    return 0;
  }

  /**
   * 爆発効果があるかどうかを確認
   * @returns 爆発効果の有無（BossBulletはデフォルトでfalse）
   */
  public isExplosive(): boolean {
    return false;
  }

  /**
   * 爆発半径を取得
   * @returns 爆発半径（BossBulletはデフォルトで0）
   */
  public getExplosionRadius(): number {
    return 0;
  }

  /**
   * ホーミング効果があるかどうかを確認
   * @returns ホーミング効果の有無（BossBulletはデフォルトでfalse）
   */
  public isHoming(): boolean {
    return false;
  }

  /**
   * ホーミング持続時間を取得
   * @returns ホーミング持続時間（BossBulletはデフォルトで0）
   */
  public getHomingDuration(): number {
    return 0;
  }

  /**
   * チェインライトニング効果があるかどうかを確認
   * @returns チェインライトニング効果の有無（BossBulletはデフォルトでfalse）
   */
  public hasChainLightning(): boolean {
    return false;
  }

  /**
   * チェイン回数を取得
   * @returns チェイン回数（BossBulletはデフォルトで0）
   */
  public getChainCount(): number {
    return 0;
  }

  /**
   * 分裂効果があるかどうかを確認
   * @returns 分裂効果の有無（BossBulletはデフォルトでfalse）
   */
  public canSplit(): boolean {
    return false;
  }

  /**
   * 分裂数を取得
   * @returns 分裂数（BossBulletはデフォルトで0）
   */
  public getSplitCount(): number {
    return 0;
  }

  /**
   * リコシェット効果があるかどうかを確認
   * @returns リコシェット効果の有無（BossBulletはデフォルトでfalse）
   */
  public canRicochet(): boolean {
    return false;
  }

  /**
   * リコシェット回数を取得
   * @returns リコシェット回数（BossBulletはデフォルトで0）
   */
  public getRicochetCount(): number {
    return 0;
  }

  /**
   * クリティカル確率を取得
   * @returns クリティカル確率（BossBulletはデフォルトで0）
   */
  public getCriticalChance(): number {
    return 0;
  }

  /**
   * 凍結効果があるかどうかを確認
   * @returns 凍結効果の有無（BossBulletはデフォルトでfalse）
   */
  public hasFreezeEffect(): boolean {
    return false;
  }

  /**
   * 凍結持続時間を取得
   * @returns 凍結持続時間（BossBulletはデフォルトで0）
   */
  public getFreezeDuration(): number {
    return 0;
  }

  /**
   * 弾丸の所有者を取得
   * @returns 弾丸の所有者（BossBulletは常に'boss'）
   */
  public getOwner(): 'player' | 'enemy' | 'boss' {
    return 'boss';
  }

  /**
   * 弾丸をリセット（オブジェクトプール用）
   */
  public reset(): void {
    this.x = -1000;
    this.y = -1000;
    this.trail = [];
    this.animationTime = 0;
    this.glowIntensity = 1.0;
    this.resetId();
  }
}
