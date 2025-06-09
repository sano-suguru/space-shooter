import { GAME_CONSTANTS } from "../constants/GameConstants";
import { IRandomProvider } from "../providers";

interface MeteorParticle {
    x: number;
    y: number;
    size: number;
    speed: number;
    alpha: number;
    color: string;
    trail: Array<{ x: number; y: number; alpha: number }>;
    trailLength: number;
}

export class MeteorShower {
    private meteors: MeteorParticle[];
    private randomProvider: IRandomProvider;
    private isActive: boolean;
    private spawnTimer: number;
    private spawnInterval: number;
    private showerDuration: number;
    private showerTimer: number;
    private direction: { x: number; y: number };
    private intensity: number;

    constructor(randomProvider: IRandomProvider) {
        this.randomProvider = randomProvider;
        this.meteors = [];
        this.isActive = false;
        this.spawnTimer = 0;
        this.spawnInterval = this.randomProvider.random() * 8000 + 3000; // 3-11秒間隔（短縮）
        this.showerDuration = 0;
        this.showerTimer = 0;
        this.direction = { x: 0, y: 0 };
        this.intensity = 0;
        
        // 初期流星群をすぐに開始
        this.startShower();
    }

    private startShower(): void {
        this.isActive = true;
        this.showerDuration = this.randomProvider.random() * 8000 + 5000; // 5-13秒間持続
        this.showerTimer = 0;
        this.meteors = [];
        
        // ランダムな流星群の方向を設定
        const angle = this.randomProvider.random() * Math.PI * 2;
        this.direction = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };
        
        // 強度を設定（流星の数に影響）
        this.intensity = this.randomProvider.random() * 0.8 + 0.2;
    }

    private createMeteor(): MeteorParticle {
        // 方向に基づいて開始位置を計算
        const spawnDistance = 200;
        const perpendicular = { x: -this.direction.y, y: this.direction.x };
        
        // 群れの中心位置をランダムに決定
        const centerX = this.randomProvider.random() * GAME_CONSTANTS.CANVAS.WIDTH;
        const centerY = this.randomProvider.random() * GAME_CONSTANTS.CANVAS.HEIGHT;
        
        // 垂直方向に散らばりを持たせる
        const spread = (this.randomProvider.random() - 0.5) * 400;
        
        const startX = centerX - this.direction.x * spawnDistance + perpendicular.x * spread;
        const startY = centerY - this.direction.y * spawnDistance + perpendicular.y * spread;

        const speed = this.randomProvider.random() * 0.8 + 0.4;
        const size = this.randomProvider.random() * 3 + 1;
        
        // 美しい暖色系の色彩
        const colors = [
            '#FFD700', // ゴールド
            '#FFA500', // オレンジ
            '#FF6347', // トマト
            '#FF69B4', // ホットピンク
            '#FFFFFF', // 白
            '#87CEEB', // スカイブルー
            '#98FB98'  // ペールグリーン
        ];
        
        return {
            x: startX,
            y: startY,
            size,
            speed,
            alpha: this.randomProvider.random() * 0.8 + 0.2,
            color: colors[Math.floor(this.randomProvider.random() * colors.length)],
            trail: [],
            trailLength: Math.floor(this.randomProvider.random() * 15 + 8)
        };
    }

    public update(deltaTime: number): void {
        if (!this.isActive) {
            this.spawnTimer += deltaTime;
            if (this.spawnTimer >= this.spawnInterval) {
                this.startShower();
                this.spawnTimer = 0;
                this.spawnInterval = this.randomProvider.random() * 15000 + 8000; // 8-23秒間隔（短縮）
            }
            return;
        }

        this.showerTimer += deltaTime;
        
        // 流星群の持続時間中は新しい流星を生成
        if (this.showerTimer < this.showerDuration) {
            // 強度に基づいて流星の生成頻度を調整
            if (this.randomProvider.random() < this.intensity * 0.003) {
                this.meteors.push(this.createMeteor());
            }
        }

        // 既存の流星を更新
        this.meteors.forEach(meteor => {
            // 位置更新
            meteor.x += this.direction.x * meteor.speed * deltaTime;
            meteor.y += this.direction.y * meteor.speed * deltaTime;

            // 軌跡を記録
            meteor.trail.unshift({ x: meteor.x, y: meteor.y, alpha: meteor.alpha });

            // 軌跡の長さを制限し、透明度を調整
            if (meteor.trail.length > meteor.trailLength) {
                meteor.trail = meteor.trail.slice(0, meteor.trailLength);
            }

            meteor.trail.forEach((point, index) => {
                point.alpha = meteor.alpha * (meteor.trailLength - index) / meteor.trailLength;
            });

            // 徐々にフェードアウト
            if (this.showerTimer > this.showerDuration * 0.7) {
                meteor.alpha -= 0.01;
            }
        });

        // 画面外に出たり、透明度が0になった流星を削除
        this.meteors = this.meteors.filter(meteor => {
            return meteor.alpha > 0 &&
                   meteor.x >= -50 && meteor.x <= GAME_CONSTANTS.CANVAS.WIDTH + 50 &&
                   meteor.y >= -50 && meteor.y <= GAME_CONSTANTS.CANVAS.HEIGHT + 50;
        });

        // 流星群終了
        if (this.showerTimer > this.showerDuration && this.meteors.length === 0) {
            this.isActive = false;
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        if (!this.isActive || this.meteors.length === 0) return;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        this.meteors.forEach(meteor => {
            // 軌跡を描画
            if (meteor.trail.length > 1) {
                for (let i = 0; i < meteor.trail.length - 1; i++) {
                    const point = meteor.trail[i];
                    const nextPoint = meteor.trail[i + 1];
                    
                    const gradient = ctx.createLinearGradient(
                        point.x, point.y, nextPoint.x, nextPoint.y
                    );
                    
                    // 色をRGBAに変換
                    const rgb = this.hexToRgb(meteor.color);
                    gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${point.alpha})`);
                    gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${point.alpha * 0.3})`);
                    
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = meteor.size * point.alpha;
                    ctx.lineCap = 'round';
                    
                    ctx.beginPath();
                    ctx.moveTo(point.x, point.y);
                    ctx.lineTo(nextPoint.x, nextPoint.y);
                    ctx.stroke();
                }
            }

            // 本体のグロー効果
            const rgb = this.hexToRgb(meteor.color);
            const glowSize = meteor.size * 4;
            const glowGradient = ctx.createRadialGradient(
                meteor.x, meteor.y, 0,
                meteor.x, meteor.y, glowSize
            );
            glowGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${meteor.alpha})`);
            glowGradient.addColorStop(0.7, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${meteor.alpha * 0.5})`);
            glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(meteor.x, meteor.y, glowSize, 0, Math.PI * 2);
            ctx.fill();

            // 本体の核
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = `rgba(255, 255, 255, ${meteor.alpha})`;
            ctx.beginPath();
            ctx.arc(meteor.x, meteor.y, meteor.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'screen';
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
        return this.isActive && this.meteors.length > 0;
    }

    public getMeteorCount(): number {
        return this.meteors.length;
    }
}
