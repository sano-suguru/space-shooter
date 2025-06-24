import { GameConfig, createGameConfig } from '../config/GameConfigFactory';
import { IGameEngine } from '../interfaces/IGameEngine';
import { EnemyType, MovementPattern, Vector2D } from '../types';

import { GameObject } from './GameObject';

export class Enemy extends GameObject {
  private health: number;
  private speed: number;
  private movementPattern: MovementPattern;
  private enemyType: EnemyType;
  private animationPhase: number = 0;
  private config: GameConfig;

  // エンチャント効果用の状態管理
  private frozen: boolean = false;
  private freezeEndTime: number = 0;
  private originalSpeed: number = 0;
  private criticalEffectTime: number = 0;

  constructor(
    x: number = 0,
    y: number = 0,
    enemyType: EnemyType = 'SMALL',
    game?: IGameEngine,
    config?: GameConfig
  ) {
    // 後方互換性のため、configが未指定の場合はデフォルト設定を使用
    const gameConfig = config ?? createGameConfig();

    const enemyTypeConfig = gameConfig.enemy.types[enemyType];
    if (!enemyTypeConfig) {
      throw new Error(`Invalid enemy type: ${enemyType}`);
    }

    super(x, y, enemyTypeConfig.width, enemyTypeConfig.height);

    this.config = gameConfig;
    this.enemyType = enemyType;
    this.health = enemyTypeConfig.health;
    const speedMultiplier = game ? 1 + game.getDifficultyFactor() : 1;
    this.speed = enemyTypeConfig.speed * speedMultiplier;
    this.originalSpeed = this.speed;
    // GameConstants.tsにmovementPatternがないため、enemyTypeから推定
    this.movementPattern = this.getMovementPatternFromType(enemyType);
  }

  public update(deltaTime: number): void {
    this.animationPhase += deltaTime * 2;

    // 凍結状態チェック
    if (this.frozen && Date.now() > this.freezeEndTime) {
      this.unfreeze();
    }

    // 凍結中は移動しない
    if (!this.frozen) {
      switch (this.movementPattern) {
        case 'straight':
          this.y += this.speed * deltaTime;
          break;
        case 'zigzag':
          this.y += this.speed * deltaTime;
          this.x += Math.sin(this.y * 0.01) * 50 * deltaTime;
          break;
        case 'sine':
          this.y += this.speed * deltaTime;
          this.x += Math.sin(this.animationPhase) * 30 * deltaTime;
          break;
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    const enemyTypeConfig = this.config.enemy.types[this.enemyType];

    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

    // エネミータイプに応じた描画（アウトライン付き）
    switch (this.enemyType) {
      case 'SMALL':
        this.drawWithOutline(ctx, () => {
          this.drawBasicEnemy(ctx, enemyTypeConfig.color);
        });
        break;
      case 'MEDIUM':
        this.drawWithOutline(ctx, () => {
          this.drawFastEnemy(ctx, enemyTypeConfig.color);
        });
        break;
      case 'LARGE':
        this.drawWithOutline(ctx, () => {
          this.drawHeavyEnemy(ctx, enemyTypeConfig.color);
        });
        break;
    }

    ctx.restore();

    // エンチャント効果の描画
    this.drawEnchantmentEffects(ctx);
  }

  private drawBasicEnemy(ctx: CanvasRenderingContext2D, color: string): void {
    const pulse = Math.sin(this.animationPhase * 2) * 0.1 + 0.9;
    const size = (Math.min(this.width, this.height) / 2) * pulse;

    // グラデーション
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.3, color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');

    ctx.fillStyle = gradient;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    // 六角形
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private drawFastEnemy(ctx: CanvasRenderingContext2D, color: string): void {
    const streak = Math.sin(this.animationPhase * 4) * 0.2 + 0.8;
    const size = Math.min(this.width, this.height) / 2;

    // スピード感のあるストリーク
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;

    // 三角形（尖った形状）
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size * 0.6, size * 0.8);
    ctx.lineTo(size * 0.6, size * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // トレイル効果
    ctx.globalAlpha = streak * 0.5;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, -size + i * 8);
      ctx.lineTo(-size * 0.4, size * 0.6 + i * 8);
      ctx.lineTo(size * 0.4, size * 0.6 + i * 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawHeavyEnemy(ctx: CanvasRenderingContext2D, color: string): void {
    const armor = Math.sin(this.animationPhase) * 0.05 + 0.95;
    const size = (Math.min(this.width, this.height) / 2) * armor;

    // 重装甲の質感
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');

    ctx.fillStyle = gradient;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3;

    // 八角形（重厚感）
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 装甲パネル
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x = Math.cos(angle) * size * 0.6;
      const y = Math.sin(angle) * size * 0.6;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * 敵の視認性を向上させるためのアウトライン描画
   */
  private drawWithOutline(
    ctx: CanvasRenderingContext2D,
    drawFunction: () => void
  ): void {
    // 1. 影効果（背景との分離）
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    drawFunction();
    ctx.restore();

    // 2. 白いアウトライン（視認性向上）
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    drawFunction();
    ctx.stroke();
    ctx.restore();

    // 3. メイン描画
    drawFunction();
  }

  public takeDamage(damage: number = 1, isCritical: boolean = false): boolean {
    this.health -= damage;

    if (isCritical) {
      this.showCriticalEffect();
    }

    return this.health <= 0;
  }

  public isOnScreen(): boolean {
    return this.y < this.config.canvas.height + 50;
  }

  public getScore(): number {
    return this.config.enemy.types[this.enemyType].score;
  }

  public getPosition(): Vector2D {
    return { x: this.x, y: this.y };
  }

  public getEnemyType(): EnemyType {
    return this.enemyType;
  }

  private getMovementPatternFromType(enemyType: EnemyType): MovementPattern {
    switch (enemyType) {
      case 'SMALL':
        return 'zigzag'; // 小さい敵は素早くジグザグ移動
      case 'MEDIUM':
        return 'sine'; // 中型敵はサイン波移動
      case 'LARGE':
        return 'straight'; // 大型敵は直進
      default:
        return 'straight';
    }
  }

  /**
   * 凍結効果を適用する
   * @param duration 凍結時間（秒）
   */
  public freeze(duration: number): void {
    this.frozen = true;
    this.freezeEndTime = Date.now() + duration * 1000;
    this.speed = 0;
  }

  /**
   * 凍結状態を解除する
   */
  private unfreeze(): void {
    this.frozen = false;
    this.speed = this.originalSpeed;
  }

  /**
   * 凍結状態かどうかを取得
   */
  public isFrozen(): boolean {
    return this.frozen;
  }

  /**
   * クリティカル効果を表示する
   */
  private showCriticalEffect(): void {
    this.criticalEffectTime = Date.now();
  }

  /**
   * エンチャント効果の描画
   */
  private drawEnchantmentEffects(ctx: CanvasRenderingContext2D): void {
    // クリティカル効果の描画
    if (
      this.criticalEffectTime > 0 &&
      Date.now() - this.criticalEffectTime < 500
    ) {
      ctx.save();
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.strokeRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
      ctx.restore();
    }

    // 凍結効果の描画
    if (this.frozen) {
      ctx.save();
      ctx.fillStyle = 'rgba(173, 216, 230, 0.6)';
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // 氷の結晶エフェクト
      ctx.strokeStyle = '#87CEEB';
      ctx.lineWidth = 2;
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      const size = Math.min(this.width, this.height) / 4;

      // 雪の結晶パターン
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(angle) * size,
          centerY + Math.sin(angle) * size
        );
        ctx.stroke();
      }

      ctx.restore();
    }
  }
}
