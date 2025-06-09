import { GAME_CONSTANTS } from "../constants/GameConstants";
import { IRandomProvider } from "../providers";

export class Comet {
    private x!: number;
    private y!: number;
    private velocity!: { x: number; y: number };
    private size!: number;
    private tailLength!: number;
    private tailPositions: Array<{ x: number; y: number; alpha: number }>;
    private color!: string;
    private glowIntensity!: number;
    private glowPhase!: number;
    private randomProvider: IRandomProvider;
    private isActive: boolean;
    private spawnTimer: number;
    private spawnInterval!: number;

    constructor(randomProvider: IRandomProvider) {
        this.randomProvider = randomProvider;
        this.spawnInterval = this.randomProvider.random() * 20000 + 10000; // 10-30秒間隔
        this.spawnTimer = 0;
        this.isActive = false;
        this.tailPositions = [];
        this.initializeComet();
    }

    private initializeComet(): void {
        // 画面外からランダムな方向で出現
        const side = Math.floor(this.randomProvider.random() * 4);
        const speed = this.randomProvider.random() * 0.3 + 0.1;
        
        switch (side) {
            case 0: // 上から
                this.x = this.randomProvider.random() * GAME_CONSTANTS.CANVAS.WIDTH;
                this.y = -50;
                this.velocity = { 
                    x: (this.randomProvider.random() - 0.5) * speed, 
                    y: speed 
                };
                break;
            case 1: // 右から
                this.x = GAME_CONSTANTS.CANVAS.WIDTH + 50;
                this.y = this.randomProvider.random() * GAME_CONSTANTS.CANVAS.HEIGHT;
                this.velocity = { 
                    x: -speed, 
                    y: (this.randomProvider.random() - 0.5) * speed 
                };
                break;
            case 2: // 下から
                this.x = this.randomProvider.random() * GAME_CONSTANTS.CANVAS.WIDTH;
                this.y = GAME_CONSTANTS.CANVAS.HEIGHT + 50;
                this.velocity = { 
                    x: (this.randomProvider.random() - 0.5) * speed, 
                    y: -speed 
                };
                break;
            case 3: // 左から
                this.x = -50;
                this.y = this.randomProvider.random() * GAME_CONSTANTS.CANVAS.HEIGHT;
                this.velocity = { 
                    x: speed, 
                    y: (this.randomProvider.random() - 0.5) * speed 
                };
                break;
        }

        this.size = this.randomProvider.random() * 8 + 4;
        this.tailLength = Math.floor(this.randomProvider.random() * 30 + 20);
        this.tailPositions = [];
        
        // 美しい色のバリエーション
        const colors = [
            '#00FFFF', // シアン
            '#FF69B4', // ホットピンク
            '#FFD700', // ゴールド
            '#98FB98', // ペールグリーン
            '#DDA0DD', // プラム
            '#87CEEB', // スカイブルー
            '#FFA500'  // オレンジ
        ];
        this.color = colors[Math.floor(this.randomProvider.random() * colors.length)];
        
        this.glowIntensity = 0;
        this.glowPhase = this.randomProvider.random() * Math.PI * 2;
    }

    public update(deltaTime: number): void {
        if (!this.isActive) {
            this.spawnTimer += deltaTime;
            if (this.spawnTimer >= this.spawnInterval) {
                this.isActive = true;
                this.spawnTimer = 0;
                this.spawnInterval = this.randomProvider.random() * 30000 + 15000; // 次回スポーン間隔
            }
            return;
        }

        // 位置更新
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;

        // 尻尾の位置を記録
        this.tailPositions.unshift({ 
            x: this.x, 
            y: this.y, 
            alpha: 1.0 
        });

        // 尻尾の長さを制限し、透明度を調整
        if (this.tailPositions.length > this.tailLength) {
            this.tailPositions = this.tailPositions.slice(0, this.tailLength);
        }

        this.tailPositions.forEach((pos, index) => {
            pos.alpha = (this.tailLength - index) / this.tailLength;
        });

        // グロー効果の更新
        this.glowPhase += 0.05;
        this.glowIntensity = Math.sin(this.glowPhase) * 0.5 + 0.7;

        // 画面外に出たら非アクティブに
        if (this.x < -100 || this.x > GAME_CONSTANTS.CANVAS.WIDTH + 100 ||
            this.y < -100 || this.y > GAME_CONSTANTS.CANVAS.HEIGHT + 100) {
            this.isActive = false;
            this.initializeComet();
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        if (!this.isActive) return;

        ctx.save();
        
        // 尻尾を描画
        if (this.tailPositions.length > 1) {
            ctx.globalCompositeOperation = 'screen';
            
            for (let i = 0; i < this.tailPositions.length - 1; i++) {
                const pos = this.tailPositions[i];
                const nextPos = this.tailPositions[i + 1];
                const width = (this.size * 2) * pos.alpha;
                
                // グラデーション作成
                const gradient = ctx.createLinearGradient(
                    pos.x, pos.y, nextPos.x, nextPos.y
                );
                gradient.addColorStop(0, this.color.replace('#', 'rgba(') + `, ${pos.alpha * 0.8})`);
                gradient.addColorStop(1, this.color.replace('#', 'rgba(') + `, ${pos.alpha * 0.3})`);
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = width;
                ctx.lineCap = 'round';
                
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(nextPos.x, nextPos.y);
                ctx.stroke();
            }
        }

        // 本体のグロー効果
        ctx.globalCompositeOperation = 'screen';
        const glowSize = this.size * this.glowIntensity * 3;
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, glowSize
        );
        glowGradient.addColorStop(0, this.color.replace('#', 'rgba(') + ', 0.8)');
        glowGradient.addColorStop(0.7, this.color.replace('#', 'rgba(') + ', 0.3)');
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // 本体の核
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    public isVisible(): boolean {
        return this.isActive;
    }
}
