import { GAME_CONSTANTS } from "../constants/GameConstants";

export class Aurora {
    private curves: { offset: number; amplitude: number; speed: number }[];
    private colors: string[];

    constructor() {
        this.curves = Array(5).fill(null).map(() => ({
            offset: Math.random() * Math.PI * 2,
            amplitude: Math.random() * 40 + 20,
            speed: (Math.random() + 0.5) * 0.0005
        }));
        this.colors = [
            'rgba(0, 255, 100, 0.1)',
            'rgba(0, 200, 255, 0.1)',
            'rgba(100, 0, 255, 0.1)',
            'rgba(255, 100, 200, 0.1)',
            'rgba(255, 200, 0, 0.1)'
        ];
    }

    public update(deltaTime: number): void {
        this.curves.forEach(curve => {
            curve.offset += curve.speed * deltaTime;
        });
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        this.curves.forEach((curve, index) => {
            const gradient = ctx.createLinearGradient(0, 0, GAME_CONSTANTS.CANVAS.WIDTH, 0);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(0.5, this.colors[index]);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = gradient;

            const y = Math.sin(curve.offset) * curve.amplitude + GAME_CONSTANTS.CANVAS.HEIGHT / 3;
            ctx.beginPath();
            ctx.moveTo(0, y);

            for (let x = 0; x <= GAME_CONSTANTS.CANVAS.WIDTH; x += 5) {
                const relativeX = x / GAME_CONSTANTS.CANVAS.WIDTH;
                const yOffset = Math.sin(curve.offset + relativeX * Math.PI * 4) * curve.amplitude;
                ctx.lineTo(x, y + yOffset);
            }

            ctx.lineTo(GAME_CONSTANTS.CANVAS.WIDTH, GAME_CONSTANTS.CANVAS.HEIGHT);
            ctx.lineTo(0, GAME_CONSTANTS.CANVAS.HEIGHT);
            ctx.closePath();
            ctx.fill();
        });

        ctx.restore();
    }
}
