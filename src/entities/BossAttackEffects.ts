/**
 * ボス攻撃エフェクトシステム
 * 派手な攻撃演出を提供しつつ、避けやすさを維持
 */

import { GameConfig } from '../config/GameConfigFactory';
import { Vector2D } from '../types';

export interface AttackWarning {
  x: number;
  y: number;
  width: number;
  height: number;
  duration: number;
  elapsed: number;
  type: 'line' | 'circle' | 'cone' | 'cross';
  intensity: number;
  color: string;
  pulseSpeed: number;
}

export interface ScreenShake {
  intensity: number;
  duration: number;
  elapsed: number;
  frequency: number;
}

export interface BossAttackParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  type: 'spark' | 'energy' | 'trail' | 'explosion' | 'charge';
  rotation: number;
  rotationSpeed: number;
}

export interface ChargingEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  duration: number;
  elapsed: number;
  intensity: number;
  color: string;
  particleCount: number;
  particles: BossAttackParticle[];
}

/**
 * ボス攻撃エフェクト管理クラス
 */
export class BossAttackEffects {
  private warnings: AttackWarning[] = [];
  private screenShake: ScreenShake | null = null;
  private particles: BossAttackParticle[] = [];
  private chargingEffects: ChargingEffect[] = [];
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  /**
   * 攻撃予告を追加
   */
  public addAttackWarning(
    x: number,
    y: number,
    width: number,
    height: number,
    type: 'line' | 'circle' | 'cone' | 'cross' = 'line',
    duration: number = 1500,
    color: string = '#ff4444'
  ): void {
    this.warnings.push({
      x,
      y,
      width,
      height,
      duration,
      elapsed: 0,
      type,
      intensity: 1.0,
      color,
      pulseSpeed: 0.008,
    });
  }

  /**
   * チャージエフェクトを追加
   */
  public addChargingEffect(
    x: number,
    y: number,
    maxRadius: number = 50,
    duration: number = 2000,
    color: string = '#00ffff'
  ): void {
    const effect: ChargingEffect = {
      x,
      y,
      radius: 0,
      maxRadius,
      duration,
      elapsed: 0,
      intensity: 0,
      color,
      particleCount: 20,
      particles: [],
    };

    // チャージパーティクルを生成
    for (let i = 0; i < effect.particleCount; i++) {
      const angle = (i / effect.particleCount) * Math.PI * 2;
      const distance = maxRadius * 2;
      effect.particles.push({
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        vx: -Math.cos(angle) * 100,
        vy: -Math.sin(angle) * 100,
        life: 0,
        maxLife: duration,
        size: 3 + Math.random() * 2,
        color,
        alpha: 1.0,
        type: 'charge',
        rotation: angle,
        rotationSpeed: 0.05,
      });
    }

    this.chargingEffects.push(effect);
  }

  /**
   * 画面揺れを追加
   */
  public addScreenShake(
    intensity: number = 5,
    duration: number = 300,
    frequency: number = 0.1
  ): void {
    // 既存の揺れより強い場合のみ更新
    if (!this.screenShake || this.screenShake.intensity < intensity) {
      this.screenShake = {
        intensity,
        duration,
        elapsed: 0,
        frequency,
      };
    }
  }

  /**
   * 攻撃エフェクトパーティクルを追加
   */
  public addAttackParticles(
    x: number,
    y: number,
    count: number = 10,
    type: 'spark' | 'energy' | 'trail' | 'explosion' = 'spark',
    color: string = '#ffaa00'
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;

      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 1000 + Math.random() * 1000,
        size: 2 + Math.random() * 3,
        color,
        alpha: 1.0,
        type,
        rotation: angle,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
      });
    }
  }

  /**
   * エフェクトを更新
   */
  public update(deltaTime: number): void {
    this.updateWarnings(deltaTime);
    this.updateScreenShake(deltaTime);
    this.updateParticles(deltaTime);
    this.updateChargingEffects(deltaTime);
  }

  /**
   * 攻撃予告を更新
   */
  private updateWarnings(deltaTime: number): void {
    this.warnings = this.warnings.filter(warning => {
      warning.elapsed += deltaTime;

      // 強度の計算（点滅効果）
      const progress = warning.elapsed / warning.duration;
      const pulseValue = Math.sin(warning.elapsed * warning.pulseSpeed);
      warning.intensity =
        Math.max(0.3, 0.7 + pulseValue * 0.3) * (1 - progress * 0.5);

      return warning.elapsed < warning.duration;
    });
  }

  /**
   * 画面揺れを更新
   */
  private updateScreenShake(deltaTime: number): void {
    if (this.screenShake) {
      this.screenShake.elapsed += deltaTime;

      if (this.screenShake.elapsed >= this.screenShake.duration) {
        this.screenShake = null;
      }
    }
  }

  /**
   * パーティクルを更新
   */
  private updateParticles(deltaTime: number): void {
    this.particles = this.particles.filter(particle => {
      particle.life += deltaTime;
      particle.x += particle.vx * deltaTime * 0.001;
      particle.y += particle.vy * deltaTime * 0.001;
      particle.rotation += particle.rotationSpeed;

      // 重力効果（爆発パーティクルのみ）
      if (particle.type === 'explosion') {
        particle.vy += 50 * deltaTime * 0.001;
      }

      // 摩擦効果
      particle.vx *= 0.995;
      particle.vy *= 0.995;

      // アルファ値の更新
      const lifeRatio = particle.life / particle.maxLife;
      particle.alpha = Math.max(0, 1 - lifeRatio);

      return particle.life < particle.maxLife;
    });
  }

  /**
   * チャージエフェクトを更新
   */
  private updateChargingEffects(deltaTime: number): void {
    this.chargingEffects = this.chargingEffects.filter(effect => {
      effect.elapsed += deltaTime;
      const progress = effect.elapsed / effect.duration;

      // 半径の拡大
      effect.radius = effect.maxRadius * Math.min(1, progress * 2);

      // 強度の計算
      effect.intensity =
        Math.sin(progress * Math.PI) *
        (1 + Math.sin(effect.elapsed * 0.01) * 0.3);

      // パーティクルの更新
      effect.particles = effect.particles.filter(particle => {
        particle.life += deltaTime;
        particle.x += particle.vx * deltaTime * 0.001;
        particle.y += particle.vy * deltaTime * 0.001;
        particle.rotation += particle.rotationSpeed;

        const lifeRatio = particle.life / particle.maxLife;
        particle.alpha = Math.max(0, 1 - lifeRatio);

        return particle.life < particle.maxLife;
      });

      return effect.elapsed < effect.duration;
    });
  }

  /**
   * エフェクトを描画
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 画面揺れの適用
    if (this.screenShake) {
      const shakeX = (Math.random() - 0.5) * this.screenShake.intensity * 2;
      const shakeY = (Math.random() - 0.5) * this.screenShake.intensity * 2;
      ctx.translate(shakeX, shakeY);
    }

    this.drawChargingEffects(ctx);
    this.drawWarnings(ctx);
    this.drawParticles(ctx);

    ctx.restore();
  }

  /**
   * 攻撃予告を描画
   */
  private drawWarnings(ctx: CanvasRenderingContext2D): void {
    this.warnings.forEach(warning => {
      ctx.save();
      ctx.globalAlpha = warning.intensity;

      switch (warning.type) {
        case 'line':
          this.drawLineWarning(ctx, warning);
          break;
        case 'circle':
          this.drawCircleWarning(ctx, warning);
          break;
        case 'cone':
          this.drawConeWarning(ctx, warning);
          break;
        case 'cross':
          this.drawCrossWarning(ctx, warning);
          break;
      }

      ctx.restore();
    });
  }

  /**
   * 線形予告を描画
   */
  private drawLineWarning(
    ctx: CanvasRenderingContext2D,
    warning: AttackWarning
  ): void {
    // 背景の半透明エリア
    ctx.fillStyle = warning.color.replace(')', ', 0.15)').replace('rgb', 'rgba');
    ctx.fillRect(warning.x, warning.y, warning.width, warning.height);

    // 外側の太い警告線
    ctx.strokeStyle = warning.color;
    ctx.lineWidth = 8;
    ctx.setLineDash([15, 8]);
    ctx.beginPath();
    ctx.rect(warning.x - 2, warning.y - 2, warning.width + 4, warning.height + 4);
    ctx.stroke();

    // 中間の光る線
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.rect(warning.x, warning.y, warning.width, warning.height);
    ctx.stroke();

    // 内側の明るい線
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 3]);
    ctx.beginPath();
    ctx.rect(
      warning.x + 2,
      warning.y + 2,
      warning.width - 4,
      warning.height - 4
    );
    ctx.stroke();

    // 危険マークを追加
    this.drawDangerMarks(ctx, warning);

    ctx.setLineDash([]);
  }

  /**
   * 危険マークを描画
   */
  private drawDangerMarks(ctx: CanvasRenderingContext2D, warning: AttackWarning): void {
    const markCount = Math.floor(warning.width / 60); // 60ピクセルごとに1つ
    const markSize = 20;
    
    for (let i = 0; i < markCount; i++) {
      const x = warning.x + (i + 0.5) * (warning.width / markCount);
      const y = warning.y - markSize - 5;
      
      // 三角形の危険マーク
      ctx.fillStyle = '#ff0000';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - markSize / 2, y + markSize);
      ctx.lineTo(x + markSize / 2, y + markSize);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // 感嘆符
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('!', x, y + markSize - 3);
    }
  }

  /**
   * 円形予告を描画
   */
  private drawCircleWarning(
    ctx: CanvasRenderingContext2D,
    warning: AttackWarning
  ): void {
    const centerX = warning.x + warning.width / 2;
    const centerY = warning.y + warning.height / 2;
    const radius = Math.max(warning.width, warning.height) / 2;

    // 外側の警告円
    ctx.strokeStyle = warning.color;
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 内側の光る円
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  /**
   * 扇形予告を描画
   */
  private drawConeWarning(
    ctx: CanvasRenderingContext2D,
    warning: AttackWarning
  ): void {
    const centerX = warning.x;
    const centerY = warning.y;
    const radius = warning.width;
    const angle = warning.height; // 角度として使用

    ctx.strokeStyle = warning.color;
    ctx.fillStyle = warning.color.replace(')', ', 0.2)').replace('rgb', 'rgba');
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, -angle / 2, angle / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  /**
   * 十字予告を描画
   */
  private drawCrossWarning(
    ctx: CanvasRenderingContext2D,
    warning: AttackWarning
  ): void {
    const centerX = warning.x + warning.width / 2;
    const centerY = warning.y + warning.height / 2;
    const size = Math.min(warning.width, warning.height) / 2;

    ctx.strokeStyle = warning.color;
    ctx.lineWidth = 4;
    ctx.setLineDash([6, 3]);

    // 縦線
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - size);
    ctx.lineTo(centerX, centerY + size);
    ctx.stroke();

    // 横線
    ctx.beginPath();
    ctx.moveTo(centerX - size, centerY);
    ctx.lineTo(centerX + size, centerY);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  /**
   * チャージエフェクトを描画
   */
  private drawChargingEffects(ctx: CanvasRenderingContext2D): void {
    this.chargingEffects.forEach(effect => {
      ctx.save();
      ctx.globalAlpha = effect.intensity;

      // 外側のエネルギーリング
      const gradient = ctx.createRadialGradient(
        effect.x,
        effect.y,
        0,
        effect.x,
        effect.y,
        effect.radius
      );
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.7, effect.color);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.fill();

      // 内側の光る核
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(
        effect.x,
        effect.y,
        Math.max(2, effect.radius * 0.1),
        0,
        Math.PI * 2
      );
      ctx.fill();

      // チャージパーティクルを描画
      effect.particles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);

        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      ctx.restore();
    });
  }

  /**
   * パーティクルを描画
   */
  private drawParticles(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);

      switch (particle.type) {
        case 'spark':
          this.drawSparkParticle(ctx, particle);
          break;
        case 'energy':
          this.drawEnergyParticle(ctx, particle);
          break;
        case 'trail':
          this.drawTrailParticle(ctx, particle);
          break;
        case 'explosion':
          this.drawExplosionParticle(ctx, particle);
          break;
        case 'charge':
          this.drawChargeParticle(ctx, particle);
          break;
      }

      ctx.restore();
    });
  }

  /**
   * 火花パーティクルを描画
   */
  private drawSparkParticle(
    ctx: CanvasRenderingContext2D,
    particle: BossAttackParticle
  ): void {
    ctx.strokeStyle = particle.color;
    ctx.lineWidth = particle.size * 0.5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-particle.size, 0);
    ctx.lineTo(particle.size, 0);
    ctx.stroke();
  }

  /**
   * エネルギーパーティクルを描画
   */
  private drawEnergyParticle(
    ctx: CanvasRenderingContext2D,
    particle: BossAttackParticle
  ): void {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, particle.color);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 軌跡パーティクルを描画
   */
  private drawTrailParticle(
    ctx: CanvasRenderingContext2D,
    particle: BossAttackParticle
  ): void {
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, particle.size, particle.size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 爆発パーティクルを描画
   */
  private drawExplosionParticle(
    ctx: CanvasRenderingContext2D,
    particle: BossAttackParticle
  ): void {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
    gradient.addColorStop(0, particle.color);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * チャージパーティクルを描画
   */
  private drawChargeParticle(
    ctx: CanvasRenderingContext2D,
    particle: BossAttackParticle
  ): void {
    // 光る点
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, particle.size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // 外側のオーラ
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
    gradient.addColorStop(0, particle.color);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 現在の画面揺れオフセットを取得
   */
  public getScreenShakeOffset(): Vector2D {
    if (!this.screenShake) {
      return { x: 0, y: 0 };
    }

    const intensity =
      this.screenShake.intensity *
      (1 - this.screenShake.elapsed / this.screenShake.duration);

    return {
      x: (Math.random() - 0.5) * intensity * 2,
      y: (Math.random() - 0.5) * intensity * 2,
    };
  }

  /**
   * エフェクトをクリア
   */
  public clear(): void {
    this.warnings = [];
    this.particles = [];
    this.chargingEffects = [];
    this.screenShake = null;
  }

  /**
   * 統計情報を取得
   */
  public getStats(): {
    warnings: number;
    particles: number;
    chargingEffects: number;
    hasScreenShake: boolean;
  } {
    return {
      warnings: this.warnings.length,
      particles: this.particles.length,
      chargingEffects: this.chargingEffects.length,
      hasScreenShake: this.screenShake !== null,
    };
  }
}