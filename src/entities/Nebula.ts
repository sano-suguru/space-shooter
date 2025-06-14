import {
  PooledParticle,
  globalParticlePoolManager,
} from '../utils/ParticlePoolManager';
import { GameConfig, createGameConfig } from '../config/GameConfigFactory';

type NebulaType =
  | 'emission'
  | 'reflection'
  | 'dark'
  | 'supernova-remnant'
  | 'planetary'
  | 'spiral';

interface NebulaLayer {
  width: number;
  height: number;
  color: string;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

interface NebulaParticle extends PooledParticle {
  radius: number;
  color: string;
  glowIntensity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  baseX: number;
  baseY: number;
  alpha: number;
}

class NebulaParticleImpl implements NebulaParticle {
  public x: number = 0;
  public y: number = 0;
  public active: boolean = false;
  public radius: number = 0;
  public color: string = '';
  public glowIntensity: number = 0;
  public twinkleSpeed: number = 0;
  public twinklePhase: number = 0;
  public baseX: number = 0;
  public baseY: number = 0;
  public alpha: number = 0;

  public reset(): void {
    this.x = 0;
    this.y = 0;
    this.active = false;
    this.radius = 0;
    this.color = '';
    this.glowIntensity = 0;
    this.twinkleSpeed = 0;
    this.twinklePhase = 0;
    this.baseX = 0;
    this.baseY = 0;
    this.alpha = 0;
  }

  public update(deltaTime: number): void {
    if (!this.active) return;
    this.twinklePhase += this.twinkleSpeed * deltaTime;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();

    // トゥインクル効果
    const twinkle = 1 + Math.sin(this.twinklePhase) * 0.3;
    const alpha = this.alpha * twinkle;

    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);

    // パーティクルのグロー効果
    const glowGradient = ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      this.radius * 3
    );
    glowGradient.addColorStop(0, this.color);
    glowGradient.addColorStop(0.5, this.addAlphaToColor(this.color, 0.5));
    glowGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 3, 0, Math.PI * 2);
    ctx.fill();

    // パーティクル本体
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private addAlphaToColor(color: string, alpha: number): string {
    // HSL色をHSLA色に変換
    if (color.startsWith('hsl(')) {
      return color.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
    }
    // RGBA色の場合、アルファ値を更新
    if (color.startsWith('rgba(')) {
      return color.replace(/[\d.]+(?=\))/, alpha.toString());
    }
    // RGB色をRGBA色に変換
    if (color.startsWith('rgb(')) {
      return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    }
    // その他の場合はそのまま返す
    return color;
  }
}

interface EnergyFilament {
  points: Array<{ x: number; y: number }>;
  color: string;
  opacity: number;
  thickness: number;
  energy: number;
}

export class Nebula {
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private nebulaType: NebulaType;
  private primaryColor!: string;
  private secondaryColor!: string;
  private layers: NebulaLayer[];
  private particles: NebulaParticle[];
  private filaments: EnergyFilament[];
  private coreIntensity: number;
  private pulsationPhase: number;
  private pulsationSpeed: number;
  private swirlingSpeed: number;
  private energyLevel: number;
  private particleCount: number;
  private poolName: string;
  private config: GameConfig;

  constructor(config?: GameConfig) {
    // 設定注入対応（後方互換性を保持）
    this.config = config || createGameConfig();

    this.x = Math.random() * this.config.canvas.width;
    this.y = Math.random() * this.config.canvas.height;
    this.width = Math.random() * 300 + 150;
    this.height = Math.random() * 300 + 150;
    this.nebulaType = this.generateNebulaType();
    this.generateNebulaColors();
    this.coreIntensity = Math.random() * 0.6 + 0.4;
    this.pulsationPhase = Math.random() * Math.PI * 2;
    this.pulsationSpeed = Math.random() * 0.002 + 0.001;
    this.swirlingSpeed = Math.random() * 0.001 + 0.0005;
    this.energyLevel = Math.random() * 0.8 + 0.2;
    this.particleCount = Math.floor(Math.random() * 200) + 100;
    this.poolName = `nebula-${Date.now()}-${Math.random()}`;

    this.layers = this.generateLayers();
    this.particles = [];
    this.filaments = this.generateFilaments();

    this.initializeParticlePool();
    this.generateParticles();
  }

  private initializeParticlePool(): void {
    // パーティクルプールを登録
    globalParticlePoolManager.registerPool(
      this.poolName,
      () => new NebulaParticleImpl(),
      {
        initialSize: this.particleCount,
        maxSize: this.particleCount * 2,
        particleType: 'nebula',
      }
    );
  }

  private generateNebulaType(): NebulaType {
    const types: NebulaType[] = [
      'emission',
      'reflection',
      'dark',
      'supernova-remnant',
      'planetary',
      'spiral',
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  private generateNebulaColors(): void {
    switch (this.nebulaType) {
      case 'emission':
        this.primaryColor = `hsl(${Math.random() * 30 + 340}, 90%, 60%)`; // 赤系
        this.secondaryColor = `hsl(${Math.random() * 60 + 280}, 70%, 70%)`; // 紫系
        break;
      case 'reflection':
        this.primaryColor = `hsl(${Math.random() * 60 + 200}, 80%, 70%)`; // 青系
        this.secondaryColor = `hsl(${Math.random() * 40 + 180}, 60%, 80%)`; // 青白系
        break;
      case 'dark':
        this.primaryColor = `hsl(${Math.random() * 60 + 20}, 30%, 20%)`; // 暗い茶色
        this.secondaryColor = `hsl(${Math.random() * 40 + 0}, 40%, 30%)`; // 暗い赤茶
        break;
      case 'supernova-remnant':
        this.primaryColor = `hsl(${Math.random() * 60 + 0}, 100%, 60%)`; // 赤オレンジ
        this.secondaryColor = `hsl(${Math.random() * 60 + 40}, 90%, 70%)`; // 黄色
        break;
      case 'planetary':
        this.primaryColor = `hsl(${Math.random() * 60 + 160}, 90%, 60%)`; // 青緑
        this.secondaryColor = `hsl(${Math.random() * 60 + 200}, 80%, 80%)`; // 明るい青
        break;
      case 'spiral':
        this.primaryColor = `hsl(${Math.random() * 60 + 270}, 70%, 60%)`; // 紫系
        this.secondaryColor = `hsl(${Math.random() * 60 + 300}, 80%, 70%)`; // ピンク系
        break;
    }
  }

  private generateLayers(): NebulaLayer[] {
    const layerCount = Math.floor(Math.random() * 4) + 3;
    const layers: NebulaLayer[] = [];

    for (let i = 0; i < layerCount; i++) {
      const scale = 1 - i * 0.15;
      layers.push({
        width: this.width * scale,
        height: this.height * scale,
        color: i % 2 === 0 ? this.primaryColor : this.secondaryColor,
        opacity: (0.6 - i * 0.1) * this.coreIntensity,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * this.swirlingSpeed,
      });
    }

    return layers;
  }

  private generateParticles(): void {
    // プールからパーティクルを取得して初期化
    for (let i = 0; i < this.particleCount; i++) {
      const particle = globalParticlePoolManager.getParticle<NebulaParticle>(
        this.poolName
      );
      if (particle) {
        // より自然な分布を作成（ガウシアン分布に近い）
        const distance =
          this.generateGaussianRandom() *
          Math.min(this.width, this.height) *
          0.4;
        const angle = Math.random() * Math.PI * 2;

        particle.baseX = Math.cos(angle) * distance;
        particle.baseY = Math.sin(angle) * distance;
        particle.x = particle.baseX;
        particle.y = particle.baseY;
        particle.radius = Math.random() * 4 + 0.5;
        particle.alpha = Math.random() * 0.8 + 0.2;
        particle.color =
          Math.random() < 0.7 ? this.primaryColor : this.secondaryColor;
        particle.glowIntensity = Math.random() * 0.5 + 0.3;
        particle.twinkleSpeed = Math.random() * 0.005 + 0.002;
        particle.twinklePhase = Math.random() * Math.PI * 2;
        particle.active = true;

        this.particles.push(particle);
      }
    }
  }

  private generateFilaments(): EnergyFilament[] {
    if (this.nebulaType === 'dark') return []; // 暗黒星雲にはフィラメントなし

    const filamentCount = Math.floor(Math.random() * 8) + 3;
    const filaments: EnergyFilament[] = [];

    for (let i = 0; i < filamentCount; i++) {
      const points: Array<{ x: number; y: number }> = [];
      const segments = Math.floor(Math.random() * 8) + 5;

      // 螺旋状または波状のフィラメント生成
      const baseAngle = (i / filamentCount) * Math.PI * 2;
      const amplitude = Math.random() * 50 + 20;

      for (let j = 0; j < segments; j++) {
        const t = j / (segments - 1);
        const radius =
          (Math.random() * 0.3 + 0.2) * Math.min(this.width, this.height);
        const spiralAngle = baseAngle + t * Math.PI * 4;
        const waveOffset = Math.sin(t * Math.PI * 6) * amplitude;

        points.push({
          x: Math.cos(spiralAngle) * radius + waveOffset,
          y:
            Math.sin(spiralAngle) * radius +
            Math.cos(t * Math.PI * 4) * amplitude * 0.5,
        });
      }

      filaments.push({
        points,
        color:
          this.nebulaType === 'supernova-remnant'
            ? this.secondaryColor
            : this.primaryColor,
        opacity: Math.random() * 0.4 + 0.3,
        thickness: Math.random() * 3 + 1,
        energy: Math.random() * 0.8 + 0.2,
      });
    }

    return filaments;
  }

  private generateGaussianRandom(): number {
    // Box-Muller変換による正規分布乱数生成
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  public update(deltaTime: number): void {
    this.pulsationPhase += this.pulsationSpeed * deltaTime;

    // レイヤーの回転更新
    this.layers.forEach(layer => {
      layer.rotation += layer.rotationSpeed * deltaTime;
    });

    // パーティクルの更新（プール対応）
    this.particles.forEach(particle => {
      if (particle.active) {
        particle.update(deltaTime);
      }
    });
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);

    // パルセーション効果
    const pulsation = 1 + Math.sin(this.pulsationPhase) * 0.1;
    ctx.scale(pulsation, pulsation);

    // エネルギーフィラメントの描画
    this.drawFilaments(ctx);

    // 星雲レイヤーの描画
    this.drawNebulaLayers(ctx);

    // パーティクルの描画
    this.drawParticles(ctx);

    // 中心部のコアエフェクト
    this.drawCore(ctx);

    ctx.restore();
  }

  private drawNebulaLayers(ctx: CanvasRenderingContext2D): void {
    this.layers.forEach((layer, _index) => {
      ctx.save();
      ctx.rotate(layer.rotation);
      ctx.globalAlpha = layer.opacity;

      // 複雑なグラデーションパターン
      const gradient = this.createComplexGradient(ctx, layer);
      ctx.fillStyle = gradient;

      // 星雲タイプに応じた形状描画
      this.drawNebulaShape(ctx, layer);

      ctx.restore();
    });
  }

  private createComplexGradient(
    ctx: CanvasRenderingContext2D,
    layer: NebulaLayer
  ): CanvasGradient {
    let gradient: CanvasGradient;

    switch (this.nebulaType) {
      case 'spiral':
        // 螺旋状グラデーション
        gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, layer.width / 2);
        gradient.addColorStop(0, layer.color);
        gradient.addColorStop(0.3, this.addAlphaToColor(layer.color, 0.5));
        gradient.addColorStop(0.7, this.addAlphaToColor(layer.color, 0.25));
        gradient.addColorStop(1, 'transparent');
        break;
      case 'planetary':
        // 同心円状グラデーション
        gradient = ctx.createRadialGradient(
          0,
          0,
          layer.width * 0.1,
          0,
          0,
          layer.width / 2
        );
        gradient.addColorStop(0, layer.color);
        gradient.addColorStop(0.5, this.addAlphaToColor(layer.color, 0.5));
        gradient.addColorStop(0.8, this.addAlphaToColor(layer.color, 0.25));
        gradient.addColorStop(1, 'transparent');
        break;
      default:
        // 標準的な放射グラデーション
        gradient = ctx.createRadialGradient(
          -layer.width * 0.2,
          -layer.height * 0.2,
          0,
          0,
          0,
          Math.max(layer.width, layer.height) / 2
        );
        gradient.addColorStop(0, this.addAlphaToColor(layer.color, 0.75));
        gradient.addColorStop(0.6, this.addAlphaToColor(layer.color, 0.375));
        gradient.addColorStop(1, 'transparent');
        break;
    }

    return gradient;
  }

  private addAlphaToColor(color: string, alpha: number): string {
    // HSL色をHSLA色に変換
    if (color.startsWith('hsl(')) {
      return color.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
    }
    // RGBA色の場合、アルファ値を更新
    if (color.startsWith('rgba(')) {
      return color.replace(/[\d.]+(?=\))/, alpha.toString());
    }
    // RGB色をRGBA色に変換
    if (color.startsWith('rgb(')) {
      return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    }
    // その他の場合はそのまま返す
    return color;
  }

  private drawNebulaShape(
    ctx: CanvasRenderingContext2D,
    layer: NebulaLayer
  ): void {
    switch (this.nebulaType) {
      case 'spiral':
        this.drawSpiralShape(ctx, layer);
        break;
      case 'supernova-remnant':
        this.drawExplosionShape(ctx, layer);
        break;
      default:
        // 標準的な楕円形
        ctx.beginPath();
        ctx.ellipse(0, 0, layer.width / 2, layer.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }

  private drawSpiralShape(
    ctx: CanvasRenderingContext2D,
    layer: NebulaLayer
  ): void {
    ctx.beginPath();
    const arms = 3;
    const turns = 2;

    for (let arm = 0; arm < arms; arm++) {
      const armOffset = (arm / arms) * Math.PI * 2;
      ctx.moveTo(0, 0);

      for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        const angle = armOffset + t * turns * Math.PI * 2;
        const radius = (t * layer.width) / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        ctx.lineTo(x, y);
      }
    }

    ctx.fill();
  }

  private drawExplosionShape(
    ctx: CanvasRenderingContext2D,
    layer: NebulaLayer
  ): void {
    ctx.beginPath();
    const spikes = 12;

    for (let i = 0; i <= spikes; i++) {
      const angle = (i / spikes) * Math.PI * 2;
      const radiusVariation = 0.7 + Math.random() * 0.6;
      const radius = (layer.width / 2) * radiusVariation;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.fill();
  }

  private drawFilaments(ctx: CanvasRenderingContext2D): void {
    this.filaments.forEach(filament => {
      ctx.save();
      ctx.globalAlpha = filament.opacity * this.energyLevel;
      ctx.strokeStyle = filament.color;
      ctx.lineWidth = filament.thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // グロー効果
      ctx.shadowBlur = 10;
      ctx.shadowColor = filament.color;

      ctx.beginPath();
      filament.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();

      ctx.restore();
    });
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);

    this.particles.forEach(particle => {
      if (particle.active) {
        particle.draw(ctx);
      }
    });

    ctx.restore();
  }

  private drawCore(ctx: CanvasRenderingContext2D): void {
    if (this.nebulaType === 'dark') return; // 暗黒星雲にはコアなし

    ctx.save();
    ctx.globalAlpha = this.coreIntensity * 0.8;

    // 中心部の強い光
    const coreGradient = ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      Math.min(this.width, this.height) * 0.1
    );
    coreGradient.addColorStop(0, this.addAlphaToColor(this.primaryColor, 1.0));
    coreGradient.addColorStop(
      0.5,
      this.addAlphaToColor(this.primaryColor, 0.5)
    );
    coreGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(this.width, this.height) * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
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
