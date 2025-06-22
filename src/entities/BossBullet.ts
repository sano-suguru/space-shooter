import { GameConfig, createGameConfig } from '../config/GameConfigFactory';

import { GameObject } from './GameObject';

export class BossBullet extends GameObject {
  private speedX: number;
  private speedY: number;
  private config: GameConfig;
  private uniqueId: string = '';

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

  /**
   * 弾丸の一意IDを取得
   */
  public getId(): string {
    if (!this.uniqueId) {
      this.uniqueId = `boss_bullet_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
    return this.uniqueId;
  }

  /**
   * IDをリセット（サブクラス用）
   */
  protected resetId(): void {
    this.uniqueId = '';
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
}
