import { GameConfig } from '../../config/GameConfigFactory';
import { BossBullet } from '../BossBullet';
import { Player } from '../Player';

/**
 * 追尾弾クラス - プレイヤーを追尾する弾丸
 */
export class HomingBullet extends BossBullet {
  private target?: Player;
  private homingDuration: number;
  private homingStartTime: number;
  private turnSpeed: number;
  private originalSpeedX: number;
  private originalSpeedY: number;

  constructor(
    x: number,
    y: number,
    speedX: number,
    speedY: number,
    config?: GameConfig,
    homingDuration: number = 3000,
    turnSpeed: number = 0.002
  ) {
    super(x, y, speedX, speedY, config);
    this.homingDuration = homingDuration;
    this.homingStartTime = Date.now();
    this.turnSpeed = turnSpeed;
    this.originalSpeedX = speedX;
    this.originalSpeedY = speedY;
  }

  /**
   * 追尾対象を設定
   */
  public setTarget(target: Player): void {
    this.target = target;
  }

  /**
   * 追尾対象を取得
   */
  public getTarget(): Player | undefined {
    return this.target;
  }

  /**
   * 追尾が有効かどうかを確認
   */
  public isHomingActive(): boolean {
    const elapsed = Date.now() - this.homingStartTime;
    return elapsed < this.homingDuration && this.target !== undefined;
  }

  public update(deltaTime: number): void {
    if (this.isHomingActive() && this.target) {
      this.updateHomingMovement(deltaTime);
    }

    // 基本的な移動更新
    super.update(deltaTime);
  }

  /**
   * 追尾移動の更新
   */
  private updateHomingMovement(deltaTime: number): void {
    if (!this.target) return;

    const targetPos = this.target.getPosition();
    const bulletCenterX = this.x + this.width / 2;
    const bulletCenterY = this.y + this.height / 2;
    const targetCenterX = targetPos.x + this.target.getWidth() / 2;
    const targetCenterY = targetPos.y + this.target.getHeight() / 2;

    // プレイヤーへの方向ベクトルを計算
    const dx = targetCenterX - bulletCenterX;
    const dy = targetCenterY - bulletCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      // 正規化された方向ベクトル
      const normalizedDx = dx / distance;
      const normalizedDy = dy / distance;

      // 現在の速度を取得（BossBulletから）
      const currentSpeed = Math.sqrt(
        this.originalSpeedX * this.originalSpeedX +
          this.originalSpeedY * this.originalSpeedY
      );

      // 目標方向への速度ベクトル
      const targetSpeedX = normalizedDx * currentSpeed;
      const targetSpeedY = normalizedDy * currentSpeed;

      // スムーズな方向転換（線形補間）
      const lerpFactor = this.turnSpeed * deltaTime;
      this.originalSpeedX = this.lerp(
        this.originalSpeedX,
        targetSpeedX,
        lerpFactor
      );
      this.originalSpeedY = this.lerp(
        this.originalSpeedY,
        targetSpeedY,
        lerpFactor
      );
    }
  }

  /**
   * 線形補間
   */
  private lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * Math.min(1, factor);
  }

  /**
   * 現在の速度を取得（オーバーライド）
   */
  protected getCurrentSpeedX(): number {
    return this.originalSpeedX;
  }

  protected getCurrentSpeedY(): number {
    return this.originalSpeedY;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    // 追尾弾は青みがかった色で描画
    ctx.fillStyle = '#4444ff';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // 追尾中は軌跡エフェクトを描画
    if (this.isHomingActive()) {
      ctx.shadowColor = '#4444ff';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#aaaaff';
      ctx.fillRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);
      ctx.shadowBlur = 0;

      // 追尾軌跡の描画
      this.drawHomingTrail(ctx);
    }
  }

  /**
   * 追尾軌跡を描画
   */
  private drawHomingTrail(ctx: CanvasRenderingContext2D): void {
    if (!this.target) return;

    const targetPos = this.target.getPosition();
    const bulletCenterX = this.x + this.width / 2;
    const bulletCenterY = this.y + this.height / 2;
    const targetCenterX = targetPos.x + this.target.getWidth() / 2;
    const targetCenterY = targetPos.y + this.target.getHeight() / 2;

    ctx.strokeStyle = 'rgba(68, 68, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(bulletCenterX, bulletCenterY);
    ctx.lineTo(targetCenterX, targetCenterY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * オブジェクトプール用のリセット
   */
  public reset(): void {
    this.target = undefined;
    this.homingStartTime = Date.now();
  }

  /**
   * 初期化（オブジェクトプール用）
   */
  public initialize(
    x: number,
    y: number,
    speedX: number,
    speedY: number,
    target?: Player,
    homingDuration?: number,
    turnSpeed?: number
  ): void {
    this.x = x;
    this.y = y;
    this.originalSpeedX = speedX;
    this.originalSpeedY = speedY;
    this.target = target;
    this.homingStartTime = Date.now();

    if (homingDuration !== undefined) {
      this.homingDuration = homingDuration;
    }
    if (turnSpeed !== undefined) {
      this.turnSpeed = turnSpeed;
    }
  }

  /**
   * 追尾時間の残り時間を取得
   */
  public getRemainingHomingTime(): number {
    const elapsed = Date.now() - this.homingStartTime;
    return Math.max(0, this.homingDuration - elapsed);
  }
}
