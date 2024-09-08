import { GAME_CONSTANTS } from "../constants/GameConstants";

export class Planet {
    private x: number;
    private y: number;
    private radius: number;
    private baseColor: string;
    private craters: Array<{ x: number; y: number; radius: number }>;
    private rotation: number;
    private rotationSpeed: number;

    constructor() {
        this.x = Math.random() * GAME_CONSTANTS.CANVAS.WIDTH;
        this.y = Math.random() * GAME_CONSTANTS.CANVAS.HEIGHT;
        this.radius = Math.random() * 30 + 20;
        this.baseColor = `hsl(${Math.random() * 360}, 50%, 50%)`;
        this.craters = this.generateCraters();
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.01;
    }

    private generateCraters(): Array<{ x: number; y: number; radius: number }> {
        const craterCount = Math.floor(Math.random() * 5) + 3;
        return Array(craterCount).fill(null).map(() => ({
            x: (Math.random() - 0.5) * this.radius * 1.5,
            y: (Math.random() - 0.5) * this.radius * 1.5,
            radius: Math.random() * (this.radius * 0.3) + (this.radius * 0.1)
        }));
    }

    public update(deltaTime: number): void {
        this.rotation += this.rotationSpeed * deltaTime;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw planet base
        ctx.fillStyle = this.baseColor;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw craters
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.craters.forEach(crater => {
            ctx.beginPath();
            ctx.arc(crater.x, crater.y, crater.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }
}
