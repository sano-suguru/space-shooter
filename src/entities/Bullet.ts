import { GAME_CONSTANTS } from "../constants/GameConstants";
import { GameObject } from "./GameObject";

export class Bullet extends GameObject {
    private active: boolean = true;
    private speed: number = GAME_CONSTANTS.BULLET.SPEED;
    private color: string = '#ff0000';

    constructor(x: number = 0, y: number = 0) {
        super(x, y, GAME_CONSTANTS.BULLET.WIDTH, GAME_CONSTANTS.BULLET.HEIGHT);
    }

    /**
     * 弾丸を初期化（オブジェクトプール用）
     */
    public initialize(x: number, y: number, speed?: number, color?: string): void {
        this.x = x;
        this.y = y;
        this.active = true;
        this.speed = speed ?? GAME_CONSTANTS.BULLET.SPEED;
        this.color = color ?? '#ff0000';
    }

    /**
     * 弾丸をリセット（オブジェクトプール用）
     */
    public reset(): void {
        this.x = 0;
        this.y = 0;
        this.active = false;
        this.speed = GAME_CONSTANTS.BULLET.SPEED;
        this.color = '#ff0000';
    }

    public update(deltaTime: number): void {
        if (!this.active) return;
        this.y -= this.speed * deltaTime;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        if (!this.active) return;
        
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // エフェクト追加：弾丸の光る効果
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }

    public isOnScreen(): boolean {
        return this.active && this.y + this.height > 0;
    }

    public isActive(): boolean {
        return this.active;
    }

    public deactivate(): void {
        this.active = false;
    }

    /**
     * 弾丸の種類を設定
     */
    public setType(speed: number, color: string): void {
        this.speed = speed;
        this.color = color;
    }
}
