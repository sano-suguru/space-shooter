import { Game } from "../game/Game";
import { Vector2D } from "../types";
import { GAME_CONSTANTS } from "../constants/GameConstants";
import { BossBullet } from "./BossBullet";
import { GameObject } from "./GameObject";

export class Boss extends GameObject {
    private health: number;
    private moveDirection: number = 1;
    private lastFireTime: number = 0;
    private game: Game;

    constructor(game: Game) {
        super(
            GAME_CONSTANTS.CANVAS.WIDTH / 2 - GAME_CONSTANTS.BOSS.WIDTH / 2,
            -GAME_CONSTANTS.BOSS.HEIGHT,
            GAME_CONSTANTS.BOSS.WIDTH,
            GAME_CONSTANTS.BOSS.HEIGHT
        );
        this.health = game.getCurrentBossHealth();
        this.game = game;
    }

    public update(deltaTime: number): void {
        if (this.y < 50) {
            this.y += GAME_CONSTANTS.BOSS.INITIAL_SPEED * deltaTime;
        } else {
            const nextX = this.x + this.moveDirection * GAME_CONSTANTS.BOSS.MOVEMENT_SPEED * deltaTime;

            if (nextX <= 0) {
                this.x = 0;
                this.moveDirection = 1;
            } else if (nextX + this.width >= GAME_CONSTANTS.CANVAS.WIDTH) {
                this.x = GAME_CONSTANTS.CANVAS.WIDTH - this.width;
                this.moveDirection = -1;
            } else {
                this.x = nextX;
            }
        }

        const currentTime = Date.now();
        if (currentTime - this.lastFireTime > GAME_CONSTANTS.BOSS.FIRE_RATE) {
            this.shoot();
            this.lastFireTime = currentTime;
        }
    }

    private shoot(): void {
        const angleSpread = Math.PI / 8; // 角度の広がりを調整（小さくすると狭くなる）
        for (let i = -1; i <= 1; i++) {
            const angle = i * angleSpread;
            const speedX = Math.sin(angle) * GAME_CONSTANTS.BOSS.BULLET_SPEED;
            const speedY = Math.cos(angle) * GAME_CONSTANTS.BOSS.BULLET_SPEED;
            this.game.addBossBullet(new BossBullet(
                this.x + this.width / 2,
                this.y + this.height,
                speedX,
                speedY
            ));
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        // 本体の描画
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // 目の描画
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.3, this.y + this.height * 0.3, this.width * 0.1, 0, Math.PI * 2);
        ctx.arc(this.x + this.width * 0.7, this.y + this.height * 0.3, this.width * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.3, this.y + this.height * 0.3, this.width * 0.05, 0, Math.PI * 2);
        ctx.arc(this.x + this.width * 0.7, this.y + this.height * 0.3, this.width * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // 体力バーの描画
        const healthPercentage = this.health / GAME_CONSTANTS.BOSS.INITIAL_HEALTH;
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x, this.y - 20, this.width * healthPercentage, 10);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(this.x, this.y - 20, this.width, 10);
    }

    public takeDamage(): boolean {
        this.health--;
        return this.health <= 0;
    }

    public getPosition(): Vector2D {
        return { x: this.x, y: this.y };
    }
}
