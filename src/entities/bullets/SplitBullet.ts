import { GameConfig } from '../../config/GameConfigFactory';
import { BossBullet } from '../BossBullet';

/**
 * 分身弾クラス - 一定時間後に複数に分裂する弾丸
 */
export class SplitBullet extends BossBullet {
  private splitDelay: number;
  private creationTime: number;
  private hasSplit: boolean = false;
  private splitCount: number;
  private splitAngleSpread: number;
  private originalSpeedX: number;
  private originalSpeedY: number;

  constructor(
    x: number,
    y: number,
    speedX: number,
    speedY: number,
    config?: GameConfig,
    splitDelay: number = 2000,
    splitCount: number = 3,
    splitAngleSpread: number = Math.PI / 3
  ) {
    super(x, y, speedX, speedY, config);
    this.splitDelay = splitDelay;
    this.creationTime = Date.now();
    this.splitCount = splitCount;
    this.splitAngleSpread = splitAngleSpread;
    this.originalSpeedX = speedX;
    this.originalSpeedY = speedY;
  }

  /**
   * 分裂時間に達したかどうかを確認
   */
  public shouldSplit(): boolean {
    const elapsed = Date.now() - this.creationTime;
    return !this.hasSplit && elapsed >= this.splitDelay;
  }

  /**
   * 分裂済みかどうかを確認
   */
  public hasSplitAlready(): boolean {
    return this.hasSplit;
  }

  /**
   * 分裂を実行し、子弾丸の情報を返す
   */
  public split(): Array<{
    x: number;
    y: number;
    speedX: number;
    speedY: number;
  }> {
    if (this.hasSplit) {
      return [];
    }

    this.hasSplit = true;
    const childBullets: Array<{
      x: number;
      y: number;
      speedX: number;
      speedY: number;
    }> = [];

    // 現在の速度から角度を計算
    const currentAngle = Math.atan2(this.originalSpeedY, this.originalSpeedX);
    const currentSpeed = Math.sqrt(
      this.originalSpeedX * this.originalSpeedX +
        this.originalSpeedY * this.originalSpeedY
    );

    // 分裂角度を計算
    const angleStep = this.splitAngleSpread / (this.splitCount - 1);
    const startAngle = currentAngle - this.splitAngleSpread / 2;

    for (let i = 0; i < this.splitCount; i++) {
      const angle = startAngle + angleStep * i;
      const speedX = Math.cos(angle) * currentSpeed;
      const speedY = Math.sin(angle) * currentSpeed;

      childBullets.push({
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        speedX,
        speedY,
      });
    }

    return childBullets;
  }

  /**
   * 分裂までの残り時間を取得
   */
  public getTimeUntilSplit(): number {
    const elapsed = Date.now() - this.creationTime;
    return Math.max(0, this.splitDelay - elapsed);
  }

  /**
   * 分裂設定を取得
   */
  public getSplitSettings(): {
    splitCount: number;
    splitAngleSpread: number;
    splitDelay: number;
  } {
    return {
      splitCount: this.splitCount,
      splitAngleSpread: this.splitAngleSpread,
      splitDelay: this.splitDelay,
    };
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    // 分身弾は紫みがかった色で描画
    ctx.fillStyle = '#ff44ff';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // 分裂が近づくにつれて点滅エフェクト
    const timeUntilSplit = this.getTimeUntilSplit();
    if (timeUntilSplit < 1000 && !this.hasSplit) {
      const blinkRate = Math.max(0.1, timeUntilSplit / 1000);
      const blinkPhase = (Date.now() % (blinkRate * 1000)) / (blinkRate * 1000);

      if (blinkPhase < 0.5) {
        ctx.shadowColor = '#ff44ff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ffaaff';
        ctx.fillRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);
        ctx.shadowBlur = 0;
      }
    }

    // 分裂予告エフェクト
    if (timeUntilSplit < 500 && !this.hasSplit) {
      this.drawSplitPreview(ctx);
    }
  }

  /**
   * 分裂予告エフェクトを描画
   */
  private drawSplitPreview(ctx: CanvasRenderingContext2D): void {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const currentAngle = Math.atan2(this.originalSpeedY, this.originalSpeedX);
    const previewLength = 30;

    ctx.strokeStyle = 'rgba(255, 68, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    const angleStep = this.splitAngleSpread / (this.splitCount - 1);
    const startAngle = currentAngle - this.splitAngleSpread / 2;

    for (let i = 0; i < this.splitCount; i++) {
      const angle = startAngle + angleStep * i;
      const endX = centerX + Math.cos(angle) * previewLength;
      const endY = centerY + Math.sin(angle) * previewLength;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  /**
   * オブジェクトプール用のリセット
   */
  public reset(): void {
    this.hasSplit = false;
    this.creationTime = Date.now();
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
    splitDelay?: number,
    splitCount?: number,
    splitAngleSpread?: number
  ): void {
    this.x = x;
    this.y = y;
    this.originalSpeedX = speedX;
    this.originalSpeedY = speedY;
    this.hasSplit = false;
    this.creationTime = Date.now();

    if (splitDelay !== undefined) {
      this.splitDelay = splitDelay;
    }
    if (splitCount !== undefined) {
      this.splitCount = splitCount;
    }
    if (splitAngleSpread !== undefined) {
      this.splitAngleSpread = splitAngleSpread;
    }
  }

  /**
   * 手動で分裂を実行（特殊用途）
   */
  public forceSplit(): Array<{
    x: number;
    y: number;
    speedX: number;
    speedY: number;
  }> {
    return this.split();
  }

  /**
   * 分裂設定を更新
   */
  public updateSplitSettings(
    splitCount?: number,
    splitAngleSpread?: number,
    splitDelay?: number
  ): void {
    if (splitCount !== undefined) {
      this.splitCount = splitCount;
    }
    if (splitAngleSpread !== undefined) {
      this.splitAngleSpread = splitAngleSpread;
    }
    if (splitDelay !== undefined) {
      this.splitDelay = splitDelay;
      this.creationTime = Date.now(); // 遅延時間を更新した場合は作成時間もリセット
    }
  }
}
