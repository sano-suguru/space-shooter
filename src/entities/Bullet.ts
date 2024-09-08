import { GAME_CONSTANTS } from "../constants/GameConstants";
import { GameObject } from "./GameObject";

export class Bullet extends GameObject {
    constructor(x: number, y: number) {
        super(x, y, GAME_CONSTANTS.BULLET.WIDTH, GAME_CONSTANTS.BULLET.HEIGHT);
    }

    public update(deltaTime: number): void {
        this.y -= GAME_CONSTANTS.BULLET.SPEED * deltaTime;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    public isOnScreen(): boolean {
        return this.y + this.height > 0;
    }
}
