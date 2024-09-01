import { GAME_CONSTANTS } from "../utils/Constants";

export class Aurora {
    private curves: { offset: number; amplitude: number; speed: number }[];

    constructor() {
        this.curves = Array(3).fill(null).map(() => ({
            offset: Math.random() * Math.PI * 2,
            amplitude: Math.random() * 50 + 25,
            speed: (Math.random() + 0.5) * 0.001
        }));
    }

    public update(deltaTime: number): void {
        this.curves.forEach(curve => {
            curve.offset += curve.speed * deltaTime;
        });
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        const auroraGradient = ctx.createLinearGradient(0, 0, GAME_CONSTANTS.CANVAS.WIDTH, 0);
        auroraGradient.addColorStop(0, 'rgba(0, 255, 0, 0)');
        auroraGradient.addColorStop(0.5, 'rgba(0, 255, 0, 0.1)');
        auroraGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');

        ctx.fillStyle = auroraGradient;

        this.curves.forEach(curve => {
            const y = Math.sin(curve.offset) * curve.amplitude + GAME_CONSTANTS.CANVAS.HEIGHT / 2;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.quadraticCurveTo(
                GAME_CONSTANTS.CANVAS.WIDTH / 2, y + Math.sin(curve.offset + Math.PI) * curve.amplitude,
                GAME_CONSTANTS.CANVAS.WIDTH, y
            );
            ctx.lineTo(GAME_CONSTANTS.CANVAS.WIDTH, y + 20);
            ctx.quadraticCurveTo(
                GAME_CONSTANTS.CANVAS.WIDTH / 2, y + 20 + Math.sin(curve.offset + Math.PI) * curve.amplitude,
                0, y + 20
            );
            ctx.closePath();
            ctx.fill();
        });
    }
}
