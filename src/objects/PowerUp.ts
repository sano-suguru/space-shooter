import { PowerUpType } from "../types";
import { GAME_CONSTANTS } from "../utils/Constants";
import { GameObject } from "./GameObject";

export class PowerUp extends GameObject {
    private type: PowerUpType;
    private color: string;
    private rotation: number = 0;
    private rotationSpeed: number;

    constructor(x: number, y: number) {
        super(x, y, GAME_CONSTANTS.POWERUP.WIDTH, GAME_CONSTANTS.POWERUP.HEIGHT);
        this.type = this.getRandomPowerUpType();
        this.color = GAME_CONSTANTS.POWERUP.TYPES[this.type].color;
        this.rotationSpeed = Math.random() * 0.1 + 0.05;
    }

    private getRandomPowerUpType(): PowerUpType {
        const types = Object.keys(GAME_CONSTANTS.POWERUP.TYPES) as PowerUpType[];
        return types[Math.floor(Math.random() * types.length)];
    }

    public update(deltaTime: number): void {
        this.y += GAME_CONSTANTS.POWERUP.SPEED * deltaTime;
        this.rotation += this.rotationSpeed * deltaTime;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        // 外側の円
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();

        // 内側の色付き円
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // パワーアップタイプを示すシンボル
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let symbol: string;
        switch (this.type) {
            case 'RAPID_FIRE':
                symbol = 'R';
                break;
            case 'TRIPLE_SHOT':
                symbol = 'T';
                break;
            case 'SHIELD':
                symbol = 'S';
                break;
        }
        ctx.fillText(symbol, 0, 0);

        ctx.restore();
    }

    public isOnScreen(): boolean {
        return this.y < GAME_CONSTANTS.CANVAS.HEIGHT;
    }

    public getType(): PowerUpType {
        return this.type;
    }
}
