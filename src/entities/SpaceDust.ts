import { GAME_CONSTANTS } from "../constants/GameConstants";
import { IRandomProvider } from "../providers";

interface DustParticle {
    x: number;
    y: number;
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

    constructor(randomProvider: IRandomProvider) {
        this.randomProvider = randomProvider;
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
        
        // 初期雲をすぐに開始
        this.initializeCloud();
    }

    private initializeCloud(): void {
        this.isActive = true;
        this.cloudAge = 0;
        this.cloudLifetime = this.randomProvider.random() * 30000 + 20000; // 20-50秒間持続
        
        // 雲の中心位置をランダムに設定
        this.cloudCenter = {
            x: this.randomProvider.random() * GAME_CONSTANTS.CANVAS.WIDTH,
            y: this.randomProvider.random() * GAME_CONSTANTS.CANVAS.HEIGHT
        };
        
        // 雲の半径とパーティクル数を設定
        this.cloudRadius = this.randomProvider.random() * 150 + 100;
        this.particleCount = Math.floor(this.randomProvider.random() * 80 + 40);
        
        // 全体的な漂流方向を設定
        this.globalDrift = {
            x: (this.randomProvider.random() - 0.5) * 0.02,
            y: (this.randomProvider.random() - 0.5) * 0.02
        };
        
        // パーティクルを生成
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(this.createDustParticle());
        }
    }

    private createDustParticle(): DustParticle {
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
            '#F8F8FF'  // ゴーストホワイト
        ];
        
        return {
            x: baseX,
            y: baseY,
            baseX,
            baseY,
            size: this.randomProvider.random() * 2 + 0.5,
            alpha: this.randomProvider.random() * 0.8 + 0.2,
            color: colors[Math.floor(this.randomProvider.random() * colors.length)],
            twinklePhase: this.randomProvider.random() * Math.PI * 2,
            twinkleSpeed: this.randomProvider.random() * 0.02 + 0.01,
            driftSpeed: {
                x: (this.randomProvider.random() - 0.5) * 0.01,
                y: (this.randomProvider.random() - 0.5) * 0.01
            },
            sparkleIntensity: this.randomProvider.random() * 0.5 + 0.3,
            sparklePhase: this.randomProvider.random() * Math.PI * 2
        };
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
            this.cloudCenter.x = GAME_CONSTANTS.CANVAS.WIDTH + this.cloudRadius;
        } else if (this.cloudCenter.x > GAME_CONSTANTS.CANVAS.WIDTH + this.cloudRadius) {
            this.cloudCenter.x = -this.cloudRadius;
        }
        
        if (this.cloudCenter.y < -this.cloudRadius) {
            this.cloudCenter.y = GAME_CONSTANTS.CANVAS.HEIGHT + this.cloudRadius;
        } else if (this.cloudCenter.y > GAME_CONSTANTS.CANVAS.HEIGHT + this.cloudRadius) {
            this.cloudCenter.y = -this.cloudRadius;
        }

        // パーティクルを更新
        this.particles.forEach(particle => {
            // きらめき効果
            particle.twinklePhase += particle.twinkleSpeed;
            particle.sparklePhase += 0.03;
            
            // 個別の漂流
            particle.baseX += particle.driftSpeed.x * deltaTime;
            particle.baseY += particle.driftSpeed.y * deltaTime;
            
            // 微細な揺らぎ
            const sway = Math.sin(particle.twinklePhase) * 2;
            particle.x = particle.baseX + sway;
            particle.y = particle.baseY + Math.cos(particle.twinklePhase * 0.7) * 1.5;
            
            // 雲の中心からの距離に基づいて透明度を調整
            const distanceFromCenter = Math.sqrt(
                Math.pow(particle.x - this.cloudCenter.x, 2) + 
                Math.pow(particle.y - this.cloudCenter.y, 2)
            );
            const centerInfluence = Math.max(0, 1 - distanceFromCenter / this.cloudRadius);
            
            // ライフタイムに基づくフェード効果
            let lifetimeAlpha = 1;
            if (this.cloudAge > this.cloudLifetime * 0.8) {
                lifetimeAlpha = 1 - (this.cloudAge - this.cloudLifetime * 0.8) / (this.cloudLifetime * 0.2);
            }
            
            particle.alpha = Math.min(
                particle.sparkleIntensity * centerInfluence * lifetimeAlpha,
                1
            );
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
            if (particle.alpha <= 0) return;
            
            // きらめき効果の強度を計算
            const twinkle = Math.sin(particle.twinklePhase) * 0.5 + 0.5;
            const sparkle = Math.sin(particle.sparklePhase) * 0.3 + 0.7;
            const finalAlpha = particle.alpha * twinkle * sparkle;
            
            if (finalAlpha <= 0) return;

            // 色をRGBAに変換
            const rgb = this.hexToRgb(particle.color);
            
            // グロー効果
            const glowSize = particle.size * (2 + twinkle * 2);
            const glowGradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, glowSize
            );
            glowGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${finalAlpha * 0.8})`);
            glowGradient.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${finalAlpha * 0.4})`);
            glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
            ctx.fill();

            // 核となる光点
            ctx.fillStyle = `rgba(255, 255, 255, ${finalAlpha})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            // 特に明るいパーティクルには十字の光を追加
            if (twinkle > 0.8 && sparkle > 0.9) {
                ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${finalAlpha * 0.6})`;
                ctx.lineWidth = 0.5;
                ctx.lineCap = 'round';
                
                const crossSize = particle.size * 3;
                ctx.beginPath();
                ctx.moveTo(particle.x - crossSize, particle.y);
                ctx.lineTo(particle.x + crossSize, particle.y);
                ctx.moveTo(particle.x, particle.y - crossSize);
                ctx.lineTo(particle.x, particle.y + crossSize);
                ctx.stroke();
            }
        });

        ctx.restore();
    }

    private hexToRgb(hex: string): { r: number; g: number; b: number } {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
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
}
