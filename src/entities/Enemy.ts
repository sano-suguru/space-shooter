import { IGameEngine } from "../interfaces/IGameEngine";
import { EnemyType, MovementPattern, Vector2D } from "../types";
import { GAME_CONSTANTS } from "../constants/GameConstants";
import { GameObject } from "./GameObject";

export class Enemy extends GameObject {
    private health: number;
    private speed: number;
    private movementPattern: MovementPattern;
    private enemyType: EnemyType;
    private animationPhase: number = 0;

    constructor(x: number, y: number, enemyType: EnemyType, game: IGameEngine) {
        const config = GAME_CONSTANTS.ENEMY.TYPES[enemyType];
        super(x, y, config.width, config.height);
        
        this.enemyType = enemyType;
        this.health = config.health;
        const speedMultiplier = 1 + game.getDifficultyFactor();
        this.speed = config.speed * speedMultiplier;
        // GameConstants.tsにmovementPatternがないため、enemyTypeから推定
        this.movementPattern = this.getMovementPatternFromType(enemyType);
    }

    public update(deltaTime: number): void {
        this.animationPhase += deltaTime * 2;
        
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

    public draw(ctx: CanvasRenderingContext2D): void {
        const config = GAME_CONSTANTS.ENEMY.TYPES[this.enemyType];
        
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // エネミータイプに応じた描画
        switch (this.enemyType) {
            case 'SMALL':
                this.drawBasicEnemy(ctx, config.color);
                break;
            case 'MEDIUM':
                this.drawFastEnemy(ctx, config.color);
                break;
            case 'LARGE':
                this.drawHeavyEnemy(ctx, config.color);
                break;
        }
        
        ctx.restore();
    }

    private drawBasicEnemy(ctx: CanvasRenderingContext2D, color: string): void {
        const pulse = Math.sin(this.animationPhase * 2) * 0.1 + 0.9;
        const size = Math.min(this.width, this.height) / 2 * pulse;
        
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
        const size = Math.min(this.width, this.height) / 2 * armor;
        
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

    public takeDamage(): boolean {
        this.health--;
        return this.health <= 0;
    }

    public isOnScreen(): boolean {
        return this.y < GAME_CONSTANTS.CANVAS.HEIGHT + 50;
    }

    public getScore(): number {
        return GAME_CONSTANTS.ENEMY.TYPES[this.enemyType].score;
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
}
