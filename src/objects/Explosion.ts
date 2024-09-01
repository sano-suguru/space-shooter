import { Vector2D } from "../types";
import { GAME_CONSTANTS } from "../utils/Constants";

export class Explosion {
    private x: number;
    private y: number;
    private particles: Array<{
        x: number;
        y: number;
        radius: number;
        speed: number;
        angle: number;
        color: string;
    }>;
    private duration: number;
    private currentFrame: number;
    private maxRadius: number;

    constructor({ x, y }: Vector2D, size: number = 1) {
        this.maxRadius = 30 * size;
        this.x = x;
        this.y = y;
        this.particles = [];
        this.duration = GAME_CONSTANTS.EXPLOSION.DURATION
        this.currentFrame = 0;

        const particleCount = Math.floor(50 * size);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.maxRadius;
            this.particles.push({
                x: this.x + Math.cos(angle) * radius * Math.random(),
                y: this.y + Math.sin(angle) * radius * Math.random(),
                radius: Math.random() * 4 + 1,
                speed: Math.random() * 100 + 25,
                angle: angle,
                color: this.getExplosionColor()
            });
        }
    }

    private getExplosionColor(): string {
        const hue = Math.random() * 60 + 10;
        const saturation = 100;
        const lightness = 50 + Math.random() * 30; // より明るい色も含める
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    public update(deltaTime: number): void {
        this.currentFrame++;
        const progress = this.currentFrame / this.duration;

        this.particles.forEach(particle => {
            const speedFactor = progress < 0.2 ? 1 : 1 - (progress - 0.2) / 0.8;
            particle.x += Math.cos(particle.angle) * particle.speed * deltaTime * speedFactor;
            particle.y += Math.sin(particle.angle) * particle.speed * deltaTime * speedFactor;
            particle.radius *= 0.98;
            particle.speed *= 0.98
        });
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        const progress = this.currentFrame / this.duration;
        this.particles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = Math.max(0, 1 - progress ** 1.5);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius * 1.2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    public isFinished(): boolean {
        return this.currentFrame >= this.duration;
    }
}
