import { GAME_CONSTANTS } from "../constants/GameConstants";
import { IRandomProvider } from "../providers";

export class Star {
    private x: number;
    private y: number;
    private size: number;
    private speed: number;
    private twinkleSpeed: number;
    private twinkleOffset: number;
    private randomProvider: IRandomProvider;

    constructor(randomProvider: IRandomProvider) {
        this.randomProvider = randomProvider;
        this.x = this.randomProvider.random() * GAME_CONSTANTS.CANVAS.WIDTH;
        this.y = this.randomProvider.random() * GAME_CONSTANTS.CANVAS.HEIGHT;
        this.size = this.randomProvider.random() * 2 + 1;
        this.speed = this.randomProvider.random() * 10 + 5;
        this.twinkleSpeed = this.randomProvider.random() * 0.05 + 0.01;
        this.twinkleOffset = this.randomProvider.random() * Math.PI * 2;
    }

    public update(deltaTime: number): void {
        this.y += this.speed * deltaTime;
        if (this.y > GAME_CONSTANTS.CANVAS.HEIGHT) {
            this.y = 0;
            this.x = this.randomProvider.random() * GAME_CONSTANTS.CANVAS.WIDTH;
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
