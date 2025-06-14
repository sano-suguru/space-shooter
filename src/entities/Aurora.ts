import {
  PooledParticle,
  globalParticlePoolManager,
} from '../utils/ParticlePoolManager';
import { GameConfig, createGameConfig } from '../config/GameConfigFactory';

type AuroraType =
  | 'borealis'
  | 'australis'
  | 'cosmic'
  | 'plasma'
  | 'solar-storm';

interface AuroraCurtain {
  x: number;
  y: number;
  width: number;
  height: number;
  baseOffset: number;
  waveAmplitude: number;
  waveFrequency: number;
  speed: number;
  intensity: number;
  colorIndex: number;
  opacity: number;
  shimmerPhase: number;
  shimmerSpeed: number;
}

interface AuroraParticle extends PooledParticle {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  glowIntensity: number;
}

class AuroraParticleImpl implements AuroraParticle {
  public x: number = 0;
  public y: number = 0;
  public active: boolean = false;
  public vx: number = 0;
  public vy: number = 0;
  public life: number = 0;
  public maxLife: number = 0;
  public size: number = 0;
  public color: string = '';
  public alpha: number = 0;
  public glowIntensity: number = 0;

  public reset(): void {
    this.x = 0;
    this.y = 0;
    this.active = false;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 0;
    this.size = 0;
    this.color = '';
    this.alpha = 0;
    this.glowIntensity = 0;
  }

  public update(deltaTime: number): void {
    if (!this.active) return;

    this.x += this.vx * deltaTime * 0.1;
    this.y -= this.vy * deltaTime * 0.1;
    this.life -= deltaTime;

    // ライフサイクル管理
    if (this.life <= 0) {
      this.active = false;
    } else {
      // アルファ値の調整
      const lifeRatio = this.life / this.maxLife;
      this.alpha = lifeRatio * this.glowIntensity;
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active || this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);

    // パーティクルのグロー効果
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 4);
    glowGradient.addColorStop(0, this.color);
    glowGradient.addColorStop(
      0.5,
      `${this.color.replace(/[\d.]+(?=\))/, '0.3')}`
    );
    glowGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 4, 0, Math.PI * 2);
    ctx.fill();

    // パーティクル本体
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

interface AuroraRay {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  intensity: number;
  thickness: number;
}

export class Aurora {
  private auroraType: AuroraType;
  private curtains: AuroraCurtain[];
  private particles: AuroraParticle[];
  private rays: AuroraRay[];
  private colorPalettes!: { [key in AuroraType]: string[] };
  private currentColors: string[];
  private intensityPhase: number;
  private intensitySpeed: number;
  private globalIntensity: number;
  private colorShiftPhase: number;
  private colorShiftSpeed: number;
  private stormMode: boolean;
  private stormIntensity: number;
  private particleCount: number;
  private poolName: string;
  private config: GameConfig;

  constructor(config?: GameConfig) {
    // 設定注入対応（後方互換性を保持）
    this.config = config || createGameConfig();

    this.auroraType = this.generateAuroraType();
    this.setupColorPalettes();
    this.currentColors = [...this.colorPalettes[this.auroraType]];
    this.intensityPhase = Math.random() * Math.PI * 2;
    this.intensitySpeed = Math.random() * 0.001 + 0.0005;
    this.globalIntensity = Math.random() * 0.6 + 0.4;
    this.colorShiftPhase = Math.random() * Math.PI * 2;
    this.colorShiftSpeed = Math.random() * 0.0003 + 0.0001;
    this.stormMode = Math.random() < 0.3; // 30%の確率で嵐モード
    this.stormIntensity = this.stormMode ? Math.random() * 0.5 + 0.5 : 0;
    this.particleCount = this.stormMode ? 150 : 80;
    this.poolName = `aurora-${Date.now()}-${Math.random()}`;

    this.curtains = this.generateCurtains();
    this.particles = [];
    this.rays = this.generateRays();

    this.initializeParticlePool();
    this.generateParticles();
  }

  private initializeParticlePool(): void {
    // パーティクルプールを登録
    globalParticlePoolManager.registerPool(
      this.poolName,
      () => new AuroraParticleImpl(),
      {
        initialSize: this.particleCount,
        maxSize: this.particleCount * 2,
        particleType: 'aurora',
      }
    );
  }

  private generateAuroraType(): AuroraType {
    const types: AuroraType[] = [
      'borealis',
      'australis',
      'cosmic',
      'plasma',
      'solar-storm',
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  private setupColorPalettes(): void {
    this.colorPalettes = {
      borealis: [
        'rgba(0, 255, 146, 0.8)', // 明るい緑
        'rgba(0, 191, 255, 0.7)', // シアン
        'rgba(148, 0, 211, 0.6)', // 紫
        'rgba(255, 20, 147, 0.5)', // ピンク
        'rgba(255, 165, 0, 0.4)', // オレンジ
      ],
      australis: [
        'rgba(255, 0, 127, 0.8)', // マゼンタ
        'rgba(138, 43, 226, 0.7)', // 青紫
        'rgba(0, 255, 255, 0.6)', // アクア
        'rgba(50, 205, 50, 0.5)', // ライムグリーン
        'rgba(255, 215, 0, 0.4)', // ゴールド
      ],
      cosmic: [
        'rgba(75, 0, 130, 0.8)', // インディゴ
        'rgba(138, 43, 226, 0.7)', // バイオレット
        'rgba(255, 0, 255, 0.6)', // マゼンタ
        'rgba(0, 255, 255, 0.5)', // シアン
        'rgba(255, 255, 255, 0.4)', // ホワイト
      ],
      plasma: [
        'rgba(255, 69, 0, 0.8)', // レッドオレンジ
        'rgba(255, 140, 0, 0.7)', // ダークオレンジ
        'rgba(255, 215, 0, 0.6)', // ゴールド
        'rgba(255, 255, 0, 0.5)', // イエロー
        'rgba(255, 255, 255, 0.4)', // ホワイト
      ],
      'solar-storm': [
        'rgba(255, 0, 0, 0.9)', // 赤
        'rgba(255, 69, 0, 0.8)', // オレンジレッド
        'rgba(255, 165, 0, 0.7)', // オレンジ
        'rgba(255, 255, 0, 0.6)', // イエロー
        'rgba(255, 255, 255, 0.5)', // ホワイト
      ],
    };
  }

  private generateCurtains(): AuroraCurtain[] {
    const curtainCount = Math.floor(Math.random() * 6) + 4;
    const curtains: AuroraCurtain[] = [];

    for (let i = 0; i < curtainCount; i++) {
      curtains.push({
        x:
          (i / curtainCount) * this.config.canvas.width +
          Math.random() * 100 -
          50,
        y: Math.random() * this.config.canvas.height * 0.3 + 50,
        width: Math.random() * 150 + 100,
        height: Math.random() * 300 + 200,
        baseOffset: Math.random() * Math.PI * 2,
        waveAmplitude: Math.random() * 60 + 30,
        waveFrequency: Math.random() * 0.02 + 0.01,
        speed: (Math.random() + 0.3) * 0.0008,
        intensity: Math.random() * 0.8 + 0.2,
        colorIndex: i % this.currentColors.length,
        opacity: Math.random() * 0.4 + 0.3,
        shimmerPhase: Math.random() * Math.PI * 2,
        shimmerSpeed: Math.random() * 0.005 + 0.002,
      });
    }

    return curtains;
  }

  private generateParticles(): void {
    // プールからパーティクルを取得して初期化
    for (let i = 0; i < this.particleCount; i++) {
      const particle = globalParticlePoolManager.getParticle<AuroraParticle>(
        this.poolName
      );
      if (particle) {
        particle.x = Math.random() * this.config.canvas.width;
        particle.y = Math.random() * this.config.canvas.height * 0.6;
        particle.vx = (Math.random() - 0.5) * 2;
        particle.vy = Math.random() * 3 + 1;
        particle.life = Math.random() * 180 + 120;
        particle.maxLife = particle.life;
        particle.size = Math.random() * 3 + 1;
        particle.color =
          this.currentColors[
            Math.floor(Math.random() * this.currentColors.length)
          ];
        particle.alpha = Math.random() * 0.8 + 0.2;
        particle.glowIntensity = Math.random() * 0.6 + 0.4;
        particle.active = true;

        this.particles.push(particle);
      }
    }
  }

  private generateRays(): AuroraRay[] {
    if (!this.stormMode) return [];

    const rayCount = Math.floor(Math.random() * 8) + 5;
    const rays: AuroraRay[] = [];

    for (let i = 0; i < rayCount; i++) {
      rays.push({
        startX: Math.random() * this.config.canvas.width,
        startY: Math.random() * 100,
        endX: Math.random() * this.config.canvas.width,
        endY: Math.random() * this.config.canvas.height * 0.7 + 100,
        color:
          this.currentColors[
            Math.floor(Math.random() * this.currentColors.length)
          ],
        intensity: Math.random() * 0.6 + 0.4,
        thickness: Math.random() * 4 + 2,
      });
    }

    return rays;
  }

  public update(deltaTime: number): void {
    this.intensityPhase += this.intensitySpeed * deltaTime;
    this.colorShiftPhase += this.colorShiftSpeed * deltaTime;

    // グローバル強度の更新
    this.globalIntensity = 0.6 + Math.sin(this.intensityPhase) * 0.3;

    // カーテンの更新
    this.curtains.forEach((curtain, _index) => {
      curtain.baseOffset += curtain.speed * deltaTime;
      curtain.shimmerPhase += curtain.shimmerSpeed * deltaTime;
    });

    // パーティクルの更新
    this.updateParticles(deltaTime);

    // 嵐モードの場合、雷の更新
    if (this.stormMode) {
      this.updateRays(deltaTime);
    }

    // 色彩シフト（宇宙系オーロラ）
    if (this.auroraType === 'cosmic') {
      this.updateColorShift();
    }
  }

  private updateParticles(deltaTime: number): void {
    this.particles.forEach((particle, _index) => {
      if (particle.active) {
        particle.update(deltaTime);

        // ライフサイクル管理 - パーティクルが非アクティブになった場合の再生成
        if (!particle.active) {
          // 新しいパーティクルを生成
          particle.x = Math.random() * this.config.canvas.width;
          particle.y = this.config.canvas.height * 0.8 + Math.random() * 100;
          particle.vx = (Math.random() - 0.5) * 2;
          particle.vy = Math.random() * 3 + 1;
          particle.life = particle.maxLife;
          particle.color =
            this.currentColors[
              Math.floor(Math.random() * this.currentColors.length)
            ];
          particle.active = true;
        }

        // グローバル強度の適用
        particle.alpha =
          (particle.life / particle.maxLife) * this.globalIntensity;
      }
    });
  }

  private updateRays(_deltaTime: number): void {
    // 雷の強度変化
    this.rays.forEach(ray => {
      ray.intensity = Math.random() * 0.8 + 0.2;
      if (Math.random() < 0.1) {
        // 10%の確率で位置を変更
        ray.startX = Math.random() * this.config.canvas.width;
        ray.endX = Math.random() * this.config.canvas.width;
      }
    });
  }

  private updateColorShift(): void {
    // 宇宙系オーロラの色彩シフト
    const shiftIntensity = Math.sin(this.colorShiftPhase) * 0.5 + 0.5;
    this.currentColors = this.colorPalettes[this.auroraType].map(color => {
      if (color.startsWith('rgba(')) {
        return color.replace(
          /[\d.]+(?=\))/,
          (shiftIntensity * 0.8 + 0.2).toString()
        );
      }
      return color;
    });
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // 雷の描画（嵐モード）
    if (this.stormMode) {
      this.drawRays(ctx);
    }

    // カーテンの描画
    this.drawCurtains(ctx);

    // パーティクルの描画
    this.drawParticles(ctx);

    ctx.restore();
  }

  private drawCurtains(ctx: CanvasRenderingContext2D): void {
    this.curtains.forEach(curtain => {
      ctx.save();

      // シマー効果
      const shimmer = 1 + Math.sin(curtain.shimmerPhase) * 0.3;
      const intensity = curtain.intensity * this.globalIntensity * shimmer;

      ctx.globalAlpha = curtain.opacity * intensity;

      // 複雑なグラデーション作成
      const gradient = this.createCurtainGradient(ctx, curtain);
      ctx.fillStyle = gradient;

      // カーテンの形状描画
      this.drawCurtainShape(ctx, curtain);

      ctx.restore();
    });
  }

  private createCurtainGradient(
    ctx: CanvasRenderingContext2D,
    curtain: AuroraCurtain
  ): CanvasGradient {
    const gradient = ctx.createLinearGradient(
      curtain.x - curtain.width / 2,
      curtain.y,
      curtain.x + curtain.width / 2,
      curtain.y + curtain.height
    );

    const baseColor = this.currentColors[curtain.colorIndex];
    const secondaryColor =
      this.currentColors[(curtain.colorIndex + 1) % this.currentColors.length];

    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.1, baseColor);
    gradient.addColorStop(0.3, secondaryColor);
    gradient.addColorStop(0.7, baseColor);
    gradient.addColorStop(0.9, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    return gradient;
  }

  private drawCurtainShape(
    ctx: CanvasRenderingContext2D,
    curtain: AuroraCurtain
  ): void {
    ctx.beginPath();

    const segments = 50;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = curtain.x + (t - 0.5) * curtain.width;

      // 複雑な波形計算
      const wave1 =
        Math.sin(curtain.baseOffset + t * Math.PI * 4) * curtain.waveAmplitude;
      const wave2 =
        Math.sin(curtain.baseOffset * 1.3 + t * Math.PI * 6) *
        curtain.waveAmplitude *
        0.5;
      const wave3 =
        Math.sin(curtain.baseOffset * 0.7 + t * Math.PI * 8) *
        curtain.waveAmplitude *
        0.3;

      const y = curtain.y + wave1 + wave2 + wave3;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    // カーテンの下部を描画
    for (let i = segments; i >= 0; i--) {
      const t = i / segments;
      const x = curtain.x + (t - 0.5) * curtain.width;
      const y =
        curtain.y +
        curtain.height +
        Math.sin(curtain.baseOffset * 0.5 + t * Math.PI * 3) * 20;
      ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach(particle => {
      if (particle.active) {
        particle.draw(ctx);
      }
    });
  }

  private drawRays(ctx: CanvasRenderingContext2D): void {
    this.rays.forEach(ray => {
      ctx.save();
      ctx.globalAlpha = ray.intensity * this.stormIntensity;
      ctx.strokeStyle = ray.color;
      ctx.lineWidth = ray.thickness;
      ctx.lineCap = 'round';

      // グロー効果
      ctx.shadowBlur = 15;
      ctx.shadowColor = ray.color;

      // ジグザグの雷描画
      ctx.beginPath();
      ctx.moveTo(ray.startX, ray.startY);

      const segments = 8;
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const x =
          ray.startX + (ray.endX - ray.startX) * t + (Math.random() - 0.5) * 40;
        const y = ray.startY + (ray.endY - ray.startY) * t;
        ctx.lineTo(x, y);
      }

      ctx.stroke();
      ctx.restore();
    });
  }

  /**
   * パーティクルプールのリソースをクリーンアップ
   */
  public dispose(): void {
    // アクティブなパーティクルをプールに返却
    this.particles.forEach(particle => {
      if (particle.active) {
        globalParticlePoolManager.releaseParticle(this.poolName, particle);
      }
    });

    // パーティクル配列をクリア
    this.particles = [];

    // プールをクリア
    globalParticlePoolManager.clearPool(this.poolName);
  }

  /**
   * パーティクル数を取得（デバッグ用）
   */
  public getParticleCount(): number {
    return this.particles.filter(p => p.active).length;
  }

  /**
   * プール統計情報を取得（デバッグ用）
   */
  public getPoolStats() {
    return globalParticlePoolManager.getPoolStats(this.poolName);
  }
}
