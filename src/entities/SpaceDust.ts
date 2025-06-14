import { IRandomProvider } from '../providers';
import {
  PooledParticle,
  globalParticlePoolManager,
} from '../utils/ParticlePoolManager';
import { GameConfig, createGameConfig } from '../config/GameConfigFactory';

interface DustParticle extends PooledParticle {
  baseX: number;
  baseY: number;
  size: number;
  alpha: number;
  color: string;
  twinklePhase: number;
  twinkleSpeed: number;
  driftSpeed: { x: number; y: number };
  sparkleIntensity: number;
  sparklePhase: number;
}

class DustParticleImpl implements DustParticle {
  public x: number = 0;
  public y: number = 0;
  public active: boolean = false;
  public baseX: number = 0;
  public baseY: number = 0;
  public size: number = 0;
  public alpha: number = 0;
  public color: string = '';
  public twinklePhase: number = 0;
  public twinkleSpeed: number = 0;
  public driftSpeed: { x: number; y: number } = { x: 0, y: 0 };
  public sparkleIntensity: number = 0;
  public sparklePhase: number = 0;

  public reset(): void {
    this.x = 0;
    this.y = 0;
    this.active = false;
    this.baseX = 0;
    this.baseY = 0;
    this.size = 0;
    this.alpha = 0;
    this.color = '';
    this.twinklePhase = 0;
    this.twinkleSpeed = 0;
    this.driftSpeed = { x: 0, y: 0 };
    this.sparkleIntensity = 0;
    this.sparklePhase = 0;
  }

  public update(deltaTime: number): void {
    if (!this.active) return;

    // きらめき効果
    this.twinklePhase += this.twinkleSpeed;
    this.sparklePhase += 0.03;

    // 個別の漂流
    this.baseX += this.driftSpeed.x * deltaTime;
    this.baseY += this.driftSpeed.y * deltaTime;

    // 微細な揺らぎ
    const sway = Math.sin(this.twinklePhase) * 2;
    this.x = this.baseX + sway;
    this.y = this.baseY + Math.cos(this.twinklePhase * 0.7) * 1.5;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active || this.alpha <= 0) return;

    // きらめき効果の強度を計算
    const twinkle = Math.sin(this.twinklePhase) * 0.5 + 0.5;
    const sparkle = Math.sin(this.sparklePhase) * 0.3 + 0.7;
    const finalAlpha = this.alpha * twinkle * sparkle;

    if (finalAlpha <= 0) return;

    // 色をRGBAに変換
    const rgb = this.hexToRgb(this.color);

    // グロー効果
    const glowSize = this.size * (2 + twinkle * 2);
    const glowGradient = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      glowSize
    );
    glowGradient.addColorStop(
      0,
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${finalAlpha * 0.8})`
    );
    glowGradient.addColorStop(
      0.6,
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${finalAlpha * 0.4})`
    );
    glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // 核となる光点
    ctx.fillStyle = `rgba(255, 255, 255, ${finalAlpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 特に明るいパーティクルには十字の光を追加
    if (twinkle > 0.8 && sparkle > 0.9) {
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${finalAlpha * 0.6})`;
      ctx.lineWidth = 0.5;
      ctx.lineCap = 'round';

      const crossSize = this.size * 3;
      ctx.beginPath();
      ctx.moveTo(this.x - crossSize, this.y);
      ctx.lineTo(this.x + crossSize, this.y);
      ctx.moveTo(this.x, this.y - crossSize);
      ctx.lineTo(this.x, this.y + crossSize);
      ctx.stroke();
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 255, g: 255, b: 255 };
  }
}

export class SpaceDust {
  private particles: DustParticle[];
  private randomProvider: IRandomProvider;
  private cloudCenter: { x: number; y: number };
  private cloudRadius: number;
  private globalDrift: { x: number; y: number };
  private particleCount: number;
  private isActive: boolean;
  private spawnTimer: number;
  private spawnInterval: number;
  private cloudLifetime: number;
  private cloudAge: number;
  private poolName: string;
  private config: GameConfig;

  constructor(randomProvider: IRandomProvider, config?: GameConfig) {
    this.randomProvider = randomProvider;
    // 設定注入対応（後方互換性を保持）
    this.config = config || createGameConfig();

    this.particles = [];
    this.cloudCenter = { x: 0, y: 0 };
    this.cloudRadius = 0;
    this.globalDrift = { x: 0, y: 0 };
    this.particleCount = 0;
    this.isActive = false;
    this.spawnTimer = 0;
    this.spawnInterval = this.randomProvider.random() * 10000 + 5000; // 5-15秒間隔（短縮）
    this.cloudLifetime = 0;
    this.cloudAge = 0;
    this.poolName = `spacedust-${Date.now()}-${Math.random()}`;

    // 初期雲をすぐに開始
    this.initializeCloud();
  }

  private initializeParticlePool(): void {
    // パーティクルプールを登録
    globalParticlePoolManager.registerPool(
      this.poolName,
      () => new DustParticleImpl(),
      {
        initialSize: this.particleCount,
        maxSize: this.particleCount * 2,
        particleType: 'spacedust',
      }
    );
  }

  private initializeCloud(): void {
    this.isActive = true;
    this.cloudAge = 0;
    this.cloudLifetime = this.randomProvider.random() * 30000 + 20000; // 20-50秒間持続

    // 雲の中心位置をランダムに設定
    this.cloudCenter = {
      x: this.randomProvider.random() * this.config.canvas.width,
      y: this.randomProvider.random() * this.config.canvas.height,
    };

    // 雲の半径とパーティクル数を設定
    this.cloudRadius = this.randomProvider.random() * 150 + 100;
    this.particleCount = Math.floor(this.randomProvider.random() * 80 + 40);

    // 全体的な漂流方向を設定
    this.globalDrift = {
      x: (this.randomProvider.random() - 0.5) * 0.02,
      y: (this.randomProvider.random() - 0.5) * 0.02,
    };

    // パーティクルプールを初期化
    this.initializeParticlePool();

    // パーティクルを生成
    this.particles = [];
    this.createDustParticles();
  }

  private createDustParticles(): void {
    // プールからパーティクルを取得して初期化
    for (let i = 0; i < this.particleCount; i++) {
      const particle = globalParticlePoolManager.getParticle<DustParticle>(
        this.poolName
      );
      if (particle) {
        this.initializeDustParticle(particle);
        this.particles.push(particle);
      }
    }
  }

  private initializeDustParticle(particle: DustParticle): void {
    // 雲の中心からランダムな距離と角度でパーティクルを配置
    const angle = this.randomProvider.random() * Math.PI * 2;
    const distance = Math.sqrt(this.randomProvider.random()) * this.cloudRadius;

    const baseX = this.cloudCenter.x + Math.cos(angle) * distance;
    const baseY = this.cloudCenter.y + Math.sin(angle) * distance;

    // 美しい宇宙的な色彩
    const colors = [
      '#E0E6FF', // 淡い青
      '#FFE4E1', // 淡いピンク
      '#F0E68C', // 淡い黄色
      '#E6E6FA', // ラベンダー
      '#F5FFFA', // ミントクリーム
      '#FFF8DC', // コーンシルク
      '#E0FFFF', // ライトシアン
      '#FFEFD5', // パパイアホイップ
      '#F8F8FF', // ゴーストホワイト
    ];

    particle.x = baseX;
    particle.y = baseY;
    particle.baseX = baseX;
    particle.baseY = baseY;
    particle.size = this.randomProvider.random() * 2 + 0.5;
    particle.alpha = this.randomProvider.random() * 0.8 + 0.2;
    particle.color =
      colors[Math.floor(this.randomProvider.random() * colors.length)];
    particle.twinklePhase = this.randomProvider.random() * Math.PI * 2;
    particle.twinkleSpeed = this.randomProvider.random() * 0.02 + 0.01;
    particle.driftSpeed = {
      x: (this.randomProvider.random() - 0.5) * 0.01,
      y: (this.randomProvider.random() - 0.5) * 0.01,
    };
    particle.sparkleIntensity = this.randomProvider.random() * 0.5 + 0.3;
    particle.sparklePhase = this.randomProvider.random() * Math.PI * 2;
    particle.active = true;
  }

  public update(deltaTime: number): void {
    if (!this.isActive) {
      this.spawnTimer += deltaTime;
      if (this.spawnTimer >= this.spawnInterval) {
        this.initializeCloud();
        this.spawnTimer = 0;
        this.spawnInterval = this.randomProvider.random() * 20000 + 10000; // 10-30秒間隔（短縮）
      }
      return;
    }

    this.cloudAge += deltaTime;

    // 雲の中心を徐々に移動
    this.cloudCenter.x += this.globalDrift.x * deltaTime;
    this.cloudCenter.y += this.globalDrift.y * deltaTime;

    // 画面外に出た場合は反対側に再配置
    if (this.cloudCenter.x < -this.cloudRadius) {
      this.cloudCenter.x = this.config.canvas.width + this.cloudRadius;
    } else if (
      this.cloudCenter.x >
      this.config.canvas.width + this.cloudRadius
    ) {
      this.cloudCenter.x = -this.cloudRadius;
    }

    if (this.cloudCenter.y < -this.cloudRadius) {
      this.cloudCenter.y = this.config.canvas.height + this.cloudRadius;
    } else if (
      this.cloudCenter.y >
      this.config.canvas.height + this.cloudRadius
    ) {
      this.cloudCenter.y = -this.cloudRadius;
    }

    // パーティクルを更新
    this.particles.forEach(particle => {
      if (particle.active) {
        particle.update(deltaTime);

        // 雲の中心からの距離に基づいて透明度を調整
        const distanceFromCenter = Math.sqrt(
          Math.pow(particle.x - this.cloudCenter.x, 2) +
            Math.pow(particle.y - this.cloudCenter.y, 2)
        );
        const centerInfluence = Math.max(
          0,
          1 - distanceFromCenter / this.cloudRadius
        );

        // ライフタイムに基づくフェード効果
        let lifetimeAlpha = 1;
        if (this.cloudAge > this.cloudLifetime * 0.8) {
          lifetimeAlpha =
            1 -
            (this.cloudAge - this.cloudLifetime * 0.8) /
              (this.cloudLifetime * 0.2);
        }

        particle.alpha = Math.min(
          particle.sparkleIntensity * centerInfluence * lifetimeAlpha,
          1
        );
      }
    });

    // 雲の寿命が尽きたら非アクティブに
    if (this.cloudAge > this.cloudLifetime) {
      this.isActive = false;
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isActive || this.particles.length === 0) return;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    this.particles.forEach(particle => {
      if (particle.active) {
        particle.draw(ctx);
      }
    });

    ctx.restore();
  }

  public isVisible(): boolean {
    return this.isActive;
  }

  public getParticleCount(): number {
    return this.particles.length;
  }

  public getCloudCenter(): { x: number; y: number } {
    return { ...this.cloudCenter };
  }

  public getCloudRadius(): number {
    return this.cloudRadius;
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

    // 状態をリセット
    this.isActive = false;
  }

  /**
   * プール統計情報を取得（デバッグ用）
   */
  public getPoolStats() {
    return globalParticlePoolManager.getPoolStats(this.poolName);
  }
}
