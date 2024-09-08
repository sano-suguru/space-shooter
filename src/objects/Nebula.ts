import { GAME_CONSTANTS } from "../constants/GameConstants";

export class Nebula {
    private x: number;
    private y: number;
    private width: number;
    private height: number;
    private color: string;
    private particles: Array<{ x: number; y: number; radius: number; alpha: number }>;

    constructor() {
        this.x = Math.random() * GAME_CONSTANTS.CANVAS.WIDTH;
        this.y = Math.random() * GAME_CONSTANTS.CANVAS.HEIGHT;
        this.width = Math.random() * 200 + 100;
        this.height = Math.random() * 200 + 100;
        this.color = `hsla(${Math.random() * 360}, 70%, 50%, 0.2)`;
        this.particles = this.generateParticles();
    }

    private generateParticles(): Array<{ x: number; y: number; radius: number; alpha: number }> {
        return Array(50).fill(null).map(() => ({
            x: (Math.random() - 0.5) * this.width,
            y: (Math.random() - 0.5) * this.height,
            radius: Math.random() * 3 + 1,
            alpha: Math.random() * 0.5 + 0.2
        }));
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw nebula base
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw particles
        ctx.fillStyle = this.color.replace('0.2', '1');
        this.particles.forEach(particle => {
            ctx.globalAlpha = particle.alpha;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }
}
