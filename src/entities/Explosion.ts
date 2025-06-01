import { Vector2D } from "../types";
import { GAME_CONSTANTS } from "../constants/GameConstants";

interface Particle {
    x: number;
    y: number;
    radius: number;
    speed: number;
    angle: number;
    color: string;
    initialRadius: number;
    initialSpeed: number;
}

export class Explosion {
    private x: number = 0;
    private y: number = 0;
    private particles: Particle[] = [];
    private duration: number = GAME_CONSTANTS.EXPLOSION.DURATION;
    private currentFrame: number = 0;
    private maxRadius: number = 30;
    private active: boolean = false;
    private size: number = 1;

    constructor() {
        // デフォルトコンストラクタ（オブジェクトプール用）
    }

    /**
     * 爆発エフェクトを初期化（オブジェクトプール用）
     */
    public initialize({ x, y }: Vector2D, size: number = 1): void {
        this.x = x;
        this.y = y;
        this.size = size;
        this.maxRadius = 30 * size;
        this.duration = GAME_CONSTANTS.EXPLOSION.DURATION;
        this.currentFrame = 0;
        this.active = true;
        this.generateParticles();
    }

    /**
     * 爆発エフェクトをリセット（オブジェクトプール用）
     */
    public reset(): void {
        this.x = 0;
        this.y = 0;
        this.particles = [];
        this.currentFrame = 0;
        this.maxRadius = 30;
        this.active = false;
        this.size = 1;
    }

    /**
     * パーティクルを生成
     */
    private generateParticles(): void {
        this.particles = [];
        const particleCount = Math.floor(50 * this.size);

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.maxRadius;
            const initialRadius = Math.random() * 4 + 1;
            const initialSpeed = Math.random() * 100 + 25;

            this.particles.push({
                x: this.x + Math.cos(angle) * radius * Math.random(),
                y: this.y + Math.sin(angle) * radius * Math.random(),
                radius: initialRadius,
                speed: initialSpeed,
                angle: angle,
                color: this.getExplosionColor(),
                initialRadius: initialRadius,
                initialSpeed: initialSpeed
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
        return !this.active || this.currentFrame >= this.duration;
    }

    /**
     * 爆発の位置を取得
     */
    public getPosition(): { x: number; y: number } {
        return { x: this.x, y: this.y };
    }
}
