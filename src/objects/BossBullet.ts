import { GAME_CONSTANTS } from "../utils/Constants";
import { GameObject } from "./GameObject";

export class BossBullet extends GameObject {
    private speedX: number;
    private speedY: number;

    constructor(x: number, y: number, speedX: number, speedY: number) {
        super(x, y, GAME_CONSTANTS.BULLET.WIDTH, GAME_CONSTANTS.BULLET.HEIGHT);
        this.speedX = speedX;
        this.speedY = speedY;
    }

    public update(deltaTime: number): void {
        this.x += this.speedX * deltaTime;
        this.y += this.speedY * deltaTime;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    public isOnScreen(): boolean {
        return this.y < GAME_CONSTANTS.CANVAS.HEIGHT && this.y > 0 &&
            this.x < GAME_CONSTANTS.CANVAS.WIDTH && this.x > 0;
    }
}
