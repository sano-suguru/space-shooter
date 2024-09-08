import { Game } from "../game/Game";
import { EnemyType, MovementPattern, Vector2D } from "../types";
import { GAME_CONSTANTS } from "../constants/GameConstants";
import { GameObject } from "./GameObject";

export class Enemy extends GameObject {
    private type: EnemyType;
    private speed: number;
    private health: number;
    private score: number;
    private color: string;
    private movementPattern: MovementPattern;
    private movementTimer: number = 0;
    private game: Game;
    private animationPhase: number = 0;
    private subEntities: { x: number, y: number, radius: number }[] = [];

    constructor(type: EnemyType, x: number, y: number, game: Game) {
        const enemyData = GAME_CONSTANTS.ENEMY.TYPES[type];
        super(x, y, enemyData.width, enemyData.height);
        this.type = type;
        this.speed = enemyData.speed;
        this.health = enemyData.health;
        this.score = enemyData.score;
        this.color = enemyData.color;
        this.movementPattern = this.getMovementPatternForType();
        this.game = game;

        // タイプに応じたサブエンティティの初期化
        if (type === 'MEDIUM') {
            const count = 3 + Math.floor(Math.random() * 3); // 3〜5個
            for (let i = 0; i < count; i++) {
                this.subEntities.push({
                    x: (Math.random() - 0.5) * this.width * 0.8,
                    y: (Math.random() - 0.5) * this.height * 0.8,
                    radius: this.width * (0.1 + Math.random() * 0.1)
                });
            }
        }
    }

    private getMovementPatternForType(): MovementPattern {
        switch (this.type) {
            case 'SMALL':
                return 'zigzag';
            case 'MEDIUM':
                return 'sine';
            case 'LARGE':
                return 'straight';
            default:
                return 'straight';
        }
    }

    public update(deltaTime: number): void {
        const speedMultiplier = 1 + this.game.getDifficultyFactor();
        this.y += this.speed * speedMultiplier * deltaTime;

        this.movementTimer += 3 * deltaTime;
        switch (this.movementPattern) {
            case 'zigzag':
                this.x += Math.sin(this.movementTimer * 2) * 2;
                break;
            case 'sine':
                this.x += Math.sin(this.movementTimer) * 1.5;
                break;
        }

        if (this.x < 0 || this.x + this.width > GAME_CONSTANTS.CANVAS.WIDTH) {
            this.movementPattern = 'straight';
        }

        this.animationPhase += deltaTime * 2;

        // MEDIUMタイプの場合、サブエンティティをアニメーション
        if (this.type === 'MEDIUM') {
            this.subEntities.forEach(entity => {
                entity.x += Math.sin(this.animationPhase + entity.y) * 0.5;
                entity.y += Math.cos(this.animationPhase + entity.x) * 0.5;
            });
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        switch (this.type) {
            case 'SMALL':
                this.drawSmallUMA(ctx);
                break;
            case 'MEDIUM':
                this.drawMediumUMA(ctx);
                break;
            case 'LARGE':
                this.drawLargeUMA(ctx);
                break;
        }

        ctx.restore();
    }

    private drawSmallUMA(ctx: CanvasRenderingContext2D): void {
        const radius = this.width / 2;

        // 本体（アメーバ状）
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const r = radius * (0.8 + Math.sin(this.animationPhase + i) * 0.2);
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();

        // 核
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // 偽足
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + this.animationPhase;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * radius * 0.8, Math.sin(angle) * radius * 0.8);
            ctx.lineTo(Math.cos(angle) * radius * 1.2, Math.sin(angle) * radius * 1.2);
            ctx.stroke();
        }
    }

    private drawMediumUMA(ctx: CanvasRenderingContext2D): void {
        const radius = this.width / 2;

        // 本体（クラゲ状）
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // 触手
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const length = radius * (1 + Math.sin(this.animationPhase + i) * 0.2);
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
            ctx.stroke();
        }

        // サブエンティティ（発光体）
        this.subEntities.forEach(entity => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    private drawLargeUMA(ctx: CanvasRenderingContext2D): void {
        const radius = this.width / 2;

        // 本体（結晶状）
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const r = radius * (1 + Math.cos(this.animationPhase + i) * 0.1);
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();

        // エネルギー放出
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const length = radius * (1.2 + Math.sin(this.animationPhase + i) * 0.3);
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
            ctx.stroke();
        }

        // 中心のコア
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // コアの周りの軌道
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, radius * (0.5 + i * 0.2), 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    public takeDamage(): boolean {
        this.health--;
        return this.health <= 0;
    }

    public getScore(): number {
        return this.score;
    }

    public isOnScreen(): boolean {
        return this.y < GAME_CONSTANTS.CANVAS.HEIGHT;
    }

    public getPosition(): Vector2D {
        return { x: this.x, y: this.y };
    }

    public getType(): EnemyType {
        return this.type;
    }
}
