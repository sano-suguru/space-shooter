import { GameConfig } from '../../config/GameConfigFactory';
import { BossBullet } from '../BossBullet';

/**
 * 反射弾クラス - 画面端で反射する弾丸
 */
export class ReflectingBullet extends BossBullet {
  private maxReflections: number;
  private reflectionCount: number = 0;
  private velocityX: number;
  private velocityY: number;

  constructor(
    x: number,
    y: number,
    speedX: number,
    speedY: number,
    config?: GameConfig,
    maxReflections: number = 3
  ) {
    super(x, y, speedX, speedY, config);
    this.maxReflections = maxReflections;
    this.velocityX = speedX;
    this.velocityY = speedY;
  }

  /**
   * 反射回数を取得
   */
  public getReflectionCount(): number {
    return this.reflectionCount;
  }

  /**
   * 最大反射回数を取得
   */
  public getMaxReflections(): number {
    return this.maxReflections;
  }

  /**
   * まだ反射可能かどうかを確認
   */
  public canReflect(): boolean {
    return this.reflectionCount < this.maxReflections;
  }

  public update(deltaTime: number): void {
    // 位置を更新
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;

    // 画面境界での反射をチェック
    this.checkBoundaryReflection();
  }

  /**
   * 画面境界での反射をチェック
   */
  private checkBoundaryReflection(): void {
    if (!this.canReflect()) {
      return;
    }

    const config = this.getConfig();
    let reflected = false;

    // 左右の境界での反射
    if (this.x <= 0 || this.x + this.width >= config.canvas.width) {
      this.velocityX = -this.velocityX;
      this.reflectionCount++;
      reflected = true;

      // 境界内に位置を調整
      if (this.x <= 0) {
        this.x = 0;
      } else {
        this.x = config.canvas.width - this.width;
      }
    }

    // 上下の境界での反射
    if (this.y <= 0 || this.y + this.height >= config.canvas.height) {
      this.velocityY = -this.velocityY;
      if (!reflected) {
        this.reflectionCount++;
      }

      // 境界内に位置を調整
      if (this.y <= 0) {
        this.y = 0;
      } else {
        this.y = config.canvas.height - this.height;
      }
    }
  }

  /**
   * 画面内にいるかどうかをチェック（反射弾用）
   */
  public isOnScreen(): boolean {
    if (!this.canReflect()) {
      // 反射回数上限に達した場合は通常の画面外判定
      return super.isOnScreen();
    }
    // 反射可能な場合は常に画面内として扱う
    return true;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    // 反射弾は緑みがかった色で描画
    ctx.fillStyle = '#44ff44';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // 反射回数に応じて光るエフェクトを強化
    const glowIntensity = Math.min(
      1,
      this.reflectionCount / this.maxReflections
    );
    if (glowIntensity > 0) {
      ctx.shadowColor = '#44ff44';
      ctx.shadowBlur = 5 + glowIntensity * 10;
      ctx.fillStyle = `rgba(170, 255, 170, ${0.5 + glowIntensity * 0.5})`;
      ctx.fillRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);
      ctx.shadowBlur = 0;
    }

    // 反射軌跡の描画
    this.drawReflectionTrail(ctx);
  }

  /**
   * 反射軌跡を描画
   */
  private drawReflectionTrail(ctx: CanvasRenderingContext2D): void {
    if (this.reflectionCount === 0) return;

    const trailLength = 20;
    const trailAlpha = Math.min(
      0.8,
      this.reflectionCount / this.maxReflections
    );

    ctx.strokeStyle = `rgba(68, 255, 68, ${trailAlpha})`;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // 軌跡の開始点を計算
    const trailStartX =
      this.x +
      this.width / 2 -
      (this.velocityX / Math.abs(this.velocityX || 1)) * trailLength;
    const trailStartY =
      this.y +
      this.height / 2 -
      (this.velocityY / Math.abs(this.velocityY || 1)) * trailLength;

    ctx.beginPath();
    ctx.moveTo(trailStartX, trailStartY);
    ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
    ctx.stroke();
  }

  /**
   * 現在の速度を取得
   */
  public getCurrentSpeed(): { x: number; y: number } {
    return { x: this.velocityX, y: this.velocityY };
  }

  /**
   * 速度を設定
   */
  public setSpeed(speedX: number, speedY: number): void {
    this.velocityX = speedX;
    this.velocityY = speedY;
  }

  /**
   * オブジェクトプール用のリセット
   */
  public reset(): void {
    this.reflectionCount = 0;
    // 親クラスのIDをリセット
    this.resetId();
  }

  /**
   * 初期化（オブジェクトプール用）
   */
  public initialize(
    x: number,
    y: number,
    speedX: number,
    speedY: number,
    maxReflections?: number
  ): void {
    this.x = x;
    this.y = y;
    this.velocityX = speedX;
    this.velocityY = speedY;
    this.reflectionCount = 0;

    if (maxReflections !== undefined) {
      this.maxReflections = maxReflections;
    }
  }

  /**
   * 手動で反射を実行（特殊用途）
   */
  public forceReflection(reflectX: boolean, reflectY: boolean): void {
    if (!this.canReflect()) return;

    if (reflectX) {
      this.velocityX = -this.velocityX;
    }
    if (reflectY) {
      this.velocityY = -this.velocityY;
    }

    if (reflectX || reflectY) {
      this.reflectionCount++;
    }
  }
}
