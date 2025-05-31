import { Game } from "../core/Game";
import { EnemyType, MovementPattern, Vector2D } from "../types";
import { GAME_CONSTANTS } from "../constants/GameConstants";
import { GameObject } from "./GameObject";

export class Enemy extends GameObject {
    private type: EnemyType;
    private speed: number;
    private health: number;
    private score: number;
    private color: string;
    private movementPattern: MovementPattern;
    private movementTimer: number = 0;
    private game: Game;
    private animationPhase: number = 0;

    // 洗練されたデザイン要素
    private geometricSegments: Array<{ angle: number; radius: number; rotation: number; glow: number }> = [];
    private energyCore: { pulse: number; intensity: number } = { pulse: 0, intensity: 0 };
    private thrusterParticles: Array<{ x: number; y: number; life: number; speed: number }> = [];
    private shieldRings: Array<{ radius: number; rotation: number; opacity: number }> = [];
    private damageFlicker: number = 0;

    constructor(type: EnemyType, x: number, y: number, game: Game) {
        const enemyData = GAME_CONSTANTS.ENEMY.TYPES[type];
        super(x, y, enemyData.width, enemyData.height);
        this.type = type;
        this.speed = enemyData.speed;
        this.health = enemyData.health;
        this.score = enemyData.score;
        this.color = enemyData.color;
        this.movementPattern = this.getMovementPatternForType();
        this.game = game;

        this.initializeGeometricStructure();
    }

    private initializeGeometricStructure(): void {
        const complexity = this.type === 'SMALL' ? 1 : this.type === 'MEDIUM' ? 2 : 3;

        // 幾何学的セグメント - プレイヤーのような洗練された形状
        const segmentCount = 3 + complexity * 2;
        for (let i = 0; i < segmentCount; i++) {
            this.geometricSegments.push({
                angle: (i / segmentCount) * Math.PI * 2,
                radius: (this.width / 3) + Math.random() * (this.width / 6),
                rotation: Math.random() * Math.PI * 2,
                glow: Math.random() * Math.PI * 2
            });
        }

        // シールドリング
        const ringCount = complexity;
        for (let i = 0; i < ringCount; i++) {
            this.shieldRings.push({
                radius: (this.width / 2) + (i * 8),
                rotation: Math.random() * Math.PI * 2,
                opacity: Math.random() * Math.PI * 2
            });
        }
    }

    private getMovementPatternForType(): MovementPattern {
        switch (this.type) {
            case 'SMALL':
                return Math.random() > 0.5 ? 'zigzag' : 'sine';
            case 'MEDIUM':
                return Math.random() > 0.3 ? 'sine' : 'straight';
            case 'LARGE':
                return 'straight';
            default:
                return 'straight';
        }
    }

    public update(deltaTime: number): void {
        const speedMultiplier = 1 + this.game.getDifficultyFactor();
        this.y += this.speed * speedMultiplier * deltaTime;

        this.movementTimer += 2.5 * deltaTime;
        switch (this.movementPattern) {
            case 'zigzag':
                this.x += Math.sin(this.movementTimer * 2.5) * 1.8;
                break;
            case 'sine':
                this.x += Math.sin(this.movementTimer * 1.2) * 1.2;
                break;
        }

        if (this.x < 0 || this.x + this.width > GAME_CONSTANTS.CANVAS.WIDTH) {
            this.movementPattern = 'straight';
        }

        // 洗練されたアニメーション
        this.animationPhase += deltaTime * 2.0;
        this.damageFlicker = Math.max(0, this.damageFlicker - deltaTime * 3);

        // エネルギーコアの脈動
        this.energyCore.pulse += deltaTime * 3.0;
        this.energyCore.intensity += deltaTime * 2.5;

        // 幾何学的セグメントの回転
        this.geometricSegments.forEach((segment, index) => {
            segment.rotation += deltaTime * (0.8 + index * 0.2);
            segment.glow += deltaTime * (2.5 + index * 0.3);
        });

        // シールドリングの回転
        this.shieldRings.forEach((ring, index) => {
            ring.rotation += deltaTime * (0.5 + index * 0.3);
            ring.opacity += deltaTime * (1.8 + index * 0.4);
        });

        // スラスターパーティクルの生成
        this.generateThrusterParticles();
        this.updateThrusterParticles(deltaTime);
    }

    private generateThrusterParticles(): void {
        if (Math.random() > 0.7) {
            this.thrusterParticles.push({
                x: (Math.random() - 0.5) * this.width * 0.4,
                y: this.height / 2,
                life: 1.0,
                speed: 30 + Math.random() * 20
            });
        }
    }

    private updateThrusterParticles(deltaTime: number): void {
        for (let i = this.thrusterParticles.length - 1; i >= 0; i--) {
            const particle = this.thrusterParticles[i];
            particle.y += particle.speed * deltaTime;
            particle.life -= deltaTime * 2;

            if (particle.life <= 0) {
                this.thrusterParticles.splice(i, 1);
            }
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // 洗練された描画順序
        this.drawShieldRings(ctx);
        this.drawMainBody(ctx);
        this.drawGeometricSegments(ctx);
        this.drawEnergyCore(ctx);
        this.drawThrusterParticles(ctx);

        ctx.restore();
    }

    private drawMainBody(ctx: CanvasRenderingContext2D): void {
        const baseRadius = Math.min(this.width, this.height) / 2.2;

        // プレイヤーのような洗練されたグラデーション
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 1.3);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.6, this.adjustColorBrightness(this.color, -0.4));
        gradient.addColorStop(1, this.adjustColorBrightness(this.color, -0.7));

        ctx.fillStyle = gradient;
        ctx.strokeStyle = this.adjustColorBrightness(this.color, 0.3);
        ctx.lineWidth = 2;

        // プレイヤーのような幾何学的形状
        let vertices: number;
        switch (this.type) {
            case 'SMALL':
                vertices = 6; // 六角形
                break;
            case 'MEDIUM':
                vertices = 8; // 八角形
                break;
            case 'LARGE':
                vertices = 12; // 十二角形
                break;
            default:
                vertices = 6;
        }

        ctx.beginPath();
        for (let i = 0; i < vertices; i++) {
            const angle = (i / vertices) * Math.PI * 2;
            const wave = Math.sin(this.animationPhase + angle * 2) * (baseRadius * 0.08);
            const radius = baseRadius + wave;

            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // ダメージ時のエフェクト
        if (this.damageFlicker > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.damageFlicker * 0.7})`;
            ctx.fill();
        }
    }

    private drawShieldRings(ctx: CanvasRenderingContext2D): void {
        this.shieldRings.forEach((ring) => {
            const opacity = Math.sin(ring.opacity) * 0.3 + 0.4;

            ctx.strokeStyle = `${this.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = 1.5;

            ctx.beginPath();
            ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
            ctx.stroke();
        });
    }

    private drawGeometricSegments(ctx: CanvasRenderingContext2D): void {
        this.geometricSegments.forEach((segment) => {
            ctx.save();

            const x = Math.cos(segment.angle) * segment.radius * 0.7;
            const y = Math.sin(segment.angle) * segment.radius * 0.7;

            ctx.translate(x, y);
            ctx.rotate(segment.rotation);

            const glowIntensity = Math.sin(segment.glow) * 0.5 + 0.5;
            const alpha = glowIntensity * 0.8;

            // プレイヤーのような幾何学的詳細
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.strokeStyle = `${this.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = 1;

            // 小さな幾何学的形状
            const size = this.width * 0.15;
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.lineTo(-size * 0.6, size * 0.3);
            ctx.lineTo(size * 0.6, size * 0.3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.restore();
        });
    }

    private drawEnergyCore(ctx: CanvasRenderingContext2D): void {
        const coreSize = (this.width * 0.2) + Math.sin(this.energyCore.pulse) * 2;
        const intensity = Math.sin(this.energyCore.intensity) * 0.4 + 0.6;

        // プレイヤーのエンジンのようなグラデーション
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize * 2);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.4, `${this.color}CC`);
        gradient.addColorStop(1, `${this.color}00`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, coreSize * 2, 0, Math.PI * 2);
        ctx.fill();

        // 中心の明るいコア
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
        ctx.fill();

        // LARGEタイプには放射状エフェクト
        if (this.type === 'LARGE') {
            ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.6})`;
            ctx.lineWidth = 2;

            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + this.energyCore.pulse * 0.3;
                const length = coreSize + Math.sin(this.energyCore.pulse + i) * 6;

                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * coreSize, Math.sin(angle) * coreSize);
                ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
                ctx.stroke();
            }
        }
    }

    private drawThrusterParticles(ctx: CanvasRenderingContext2D): void {
        this.thrusterParticles.forEach(particle => {
            const alpha = particle.life;
            const size = 3 * particle.life;

            ctx.fillStyle = `${this.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    private adjustColorBrightness(hex: string, percent: number): string {
        const num = parseInt(hex.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent * 100);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    public takeDamage(): boolean {
        this.health--;
        this.damageFlicker = 1;
        return this.health <= 0;
    }

    public getScore(): number {
        return this.score;
    }

    public isOnScreen(): boolean {
        return this.y < GAME_CONSTANTS.CANVAS.HEIGHT;
    }

    public getPosition(): Vector2D {
        return { x: this.x, y: this.y };
    }

    public getType(): EnemyType {
        return this.type;
    }
}
