import { GameObject } from './GameObject';
import { GameConfig, createGameConfig } from '../config/GameConfigFactory';

export class BossBullet extends GameObject {
  private speedX: number;
  private speedY: number;
  private config: GameConfig;

  constructor(
    x: number,
    y: number,
    speedX: number,
    speedY: number,
    config?: GameConfig
  ) {
    // 設定注入対応（後方互換性を保持）
    const gameConfig = config || createGameConfig();
    super(x, y, gameConfig.bullet.width, gameConfig.bullet.height);

    this.config = gameConfig;
    this.speedX = speedX;
    this.speedY = speedY;
  }

  public update(deltaTime: number): void {
    this.x += this.speedX * deltaTime;
    this.y += this.speedY * deltaTime;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(this.x, this.y, this.width, this.height);
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
}
