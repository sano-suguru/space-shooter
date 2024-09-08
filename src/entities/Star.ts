import { GAME_CONSTANTS } from "../constants/GameConstants";

export class Star {
    private x: number;
    private y: number;
    private size: number;
    private speed: number;
    private twinkleSpeed: number;
    private twinkleOffset: number;

    constructor() {
        this.x = Math.random() * GAME_CONSTANTS.CANVAS.WIDTH;
        this.y = Math.random() * GAME_CONSTANTS.CANVAS.HEIGHT;
        this.size = Math.random() * 2 + 1;
        this.speed = Math.random() * 10 + 5;
        this.twinkleSpeed = Math.random() * 0.05 + 0.01;
        this.twinkleOffset = Math.random() * Math.PI * 2;
    }

    public update(deltaTime: number): void {
        this.y += this.speed * deltaTime;
        if (this.y > GAME_CONSTANTS.CANVAS.HEIGHT) {
            this.y = 0;
            this.x = Math.random() * GAME_CONSTANTS.CANVAS.WIDTH;
        }
        this.twinkleOffset += this.twinkleSpeed;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        const twinkle = Math.sin(this.twinkleOffset) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + twinkle * 0.5})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * (0.8 + twinkle * 0.2), 0, Math.PI * 2);
        ctx.fill();
    }
}