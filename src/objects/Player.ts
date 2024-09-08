import { PowerUpType, Vector2D } from "../types";
import { GAME_CONSTANTS } from "../constants/GameConstants";
import { EventEmitter, EventMap } from "../utils/EventEmitter";
import { Bullet } from "./Bullet";
import { GameObject } from "./GameObject";

export class Player extends GameObject {
    private velocity: Vector2D = { x: 0, y: 0 };
    private health: number;
    private fireRate: number;
    private bulletType: 'single' | 'triple' = 'single';
    private shieldActive = false;
    private activePowerups: { type: PowerUpType; startTime: number }[] = [];
    private keys: { [key: string]: boolean } = {};
    private engineAnimationPhase = 0;
    private invincible = false;
    private lastHitTime = 0;
    private lastFireTime = 0;
    private thrusterParticles: Array<{ x: number; y: number; speed: number; life: number }> = [];


    constructor(
        private eventEmitter: EventEmitter<EventMap>,
    ) {
        super(
            GAME_CONSTANTS.CANVAS.WIDTH / 2 - GAME_CONSTANTS.PLAYER.WIDTH / 2,
            GAME_CONSTANTS.CANVAS.HEIGHT - GAME_CONSTANTS.PLAYER.HEIGHT - 10,
            GAME_CONSTANTS.PLAYER.WIDTH,
            GAME_CONSTANTS.PLAYER.HEIGHT
        );
        this.health = GAME_CONSTANTS.PLAYER.MAX_HEALTH;
        this.fireRate = GAME_CONSTANTS.PLAYER.FIRE_RATE;
    }

    public setKeyState(key: string, isPressed: boolean): void {
        this.keys[key] = isPressed;
    }

    public update(deltaTime: number): void {
        this.updateMovement();
        this.updateShooting();
        this.updateInvincibility();
        this.updateEngineAnimation(deltaTime);
        this.updateThrusterParticles(deltaTime);
    }

    private updateMovement(): void {
        const { CANVAS } = GAME_CONSTANTS;

        this.updateVelocity();

        this.x += this.velocity.x;
        this.clampPosition(0, CANVAS.WIDTH - this.width);

        this.generateThrusterParticles();
    }

    private updateVelocity(): void {
        const { ACCELERATION, MAX_SPEED } = GAME_CONSTANTS.PLAYER;

        if (this.keys['ArrowLeft']) {
            this.velocity.x = Math.max(this.velocity.x - ACCELERATION, -MAX_SPEED);
        } else if (this.keys['ArrowRight']) {
            this.velocity.x = Math.min(this.velocity.x + ACCELERATION, MAX_SPEED);
        } else {
            this.applyDeceleration();
        }
    }

    private applyDeceleration(): void {
        const { DECELERATION } = GAME_CONSTANTS.PLAYER;

        if (this.velocity.x > 0) {
            this.velocity.x = Math.max(0, this.velocity.x - DECELERATION);
        } else if (this.velocity.x < 0) {
            this.velocity.x = Math.min(0, this.velocity.x + DECELERATION);
        }
    }

    private clampPosition(min: number, max: number): void {
        if (this.x < min) {
            this.x = min;
            this.velocity.x = 0;
        } else if (this.x > max) {
            this.x = max;
            this.velocity.x = 0;
        }
    }

    private updateShooting(): void {
        if (this.keys[' ']) this.shoot();
    }

    private shoot(): void {
        const currentTime = Date.now();
        if (currentTime - this.lastFireTime >= this.fireRate) {
            if (this.bulletType === 'single') {
                this.eventEmitter.emit('playerShot', new Bullet(this.x + this.width / 2 - GAME_CONSTANTS.BULLET.WIDTH / 2, this.y))
            } else if (this.bulletType === 'triple') {
                this.eventEmitter.emit('playerShot', new Bullet(this.x + this.width / 2 - GAME_CONSTANTS.BULLET.WIDTH / 2, this.y));
                this.eventEmitter.emit('playerShot', new Bullet(this.x + this.width / 2 - GAME_CONSTANTS.BULLET.WIDTH / 2 - 20, this.y + 10));
                this.eventEmitter.emit('playerShot', new Bullet(this.x + this.width / 2 - GAME_CONSTANTS.BULLET.WIDTH / 2 + 20, this.y + 10));
            }
            this.lastFireTime = currentTime;
        }
    }

    private updateInvincibility(): void {
        if (this.invincible && Date.now() - this.lastHitTime > GAME_CONSTANTS.PLAYER.INVINCIBILITY_TIME) {
            this.invincible = false;
        }
    }

    private updateEngineAnimation(deltaTime: number): void {
        this.engineAnimationPhase += 10 * deltaTime;
        if (this.engineAnimationPhase > Math.PI * 2) {
            this.engineAnimationPhase = 0;
        }
    }

    private generateThrusterParticles(): void {
        const particleCount = 3;
        for (let i = 0; i < particleCount; i++) {
            this.thrusterParticles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height,
                speed: Math.random() * 50 + 50,
                life: 1
            });
        }
    }

    private updateThrusterParticles(deltaTime: number): void {
        for (let i = this.thrusterParticles.length - 1; i >= 0; i--) {
            const particle = this.thrusterParticles[i];
            particle.y += particle.speed * deltaTime;
            particle.life -= deltaTime;

            if (particle.life <= 0) {
                this.thrusterParticles.splice(i, 1);
            }
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        this.drawThrusterParticles(ctx);
        this.drawShip(ctx);
        this.drawShield(ctx);
    }

    private drawShip(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // メインボディ
        ctx.fillStyle = this.invincible ? 'rgba(255, 0, 0, 0.5)' : GAME_CONSTANTS.PLAYER.COLORS.PRIMARY;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fill();

        // 補助翼
        ctx.fillStyle = GAME_CONSTANTS.PLAYER.COLORS.SECONDARY;
        ctx.beginPath();
        ctx.moveTo(-this.width / 4, 0);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.lineTo(0, this.height / 4);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.width / 4, 0);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.lineTo(0, this.height / 4);
        ctx.closePath();
        ctx.fill();

        // コックピット
        ctx.fillStyle = GAME_CONSTANTS.PLAYER.COLORS.ACCENT;
        ctx.beginPath();
        ctx.ellipse(0, -this.height / 6, this.width / 6, this.height / 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // エンジンの輝き
        const engineGlowSize = 10 + Math.sin(this.engineAnimationPhase) * 3;
        const gradient = ctx.createRadialGradient(
            0, this.height / 2,
            0, 0, this.height / 2, engineGlowSize
        );
        gradient.addColorStop(0, GAME_CONSTANTS.PLAYER.COLORS.ENGINE);
        gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, this.height / 2, engineGlowSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    private drawThrusterParticles(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        for (const particle of this.thrusterParticles) {
            const alpha = particle.life;
            const size = 5 * particle.life;
            ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    private drawShield(ctx: CanvasRenderingContext2D): void {
        if (this.shieldActive) {
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 10, 0, Math.PI * 2);
            ctx.stroke();

            const gradient = ctx.createRadialGradient(
                this.x + this.width / 2, this.y + this.height / 2, this.width / 2,
                this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 15
            );
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.restore();
        }
    }

    public takeDamage(amount: number): void {
        if (!this.invincible && !this.shieldActive) {
            this.health = Math.max(0, this.health - amount);
            this.eventEmitter.emit('healthChanged', this.health);
            this.invincible = true;
            this.lastHitTime = Date.now();
            if (this.health <= 0) {
                this.eventEmitter.emit('gameOver');
            }
        }
    }

    public activatePowerup(type: PowerUpType): void {
        const powerup = GAME_CONSTANTS.POWERUP.TYPES[type];
        powerup.effect(this);
        this.activePowerups.push({ type, startTime: Date.now() });
        this.eventEmitter.emit('powerUpActivated', type);

        setTimeout(() => this.deactivatePowerup(type), GAME_CONSTANTS.POWERUP.DURATION);
    }

    private deactivatePowerup(type: PowerUpType): void {
        this.activePowerups = this.activePowerups.filter(p => p.type !== type);
        switch (type) {
            case 'RAPID_FIRE':
                this.fireRate = GAME_CONSTANTS.PLAYER.FIRE_RATE;
                break;
            case 'TRIPLE_SHOT':
                this.bulletType = 'single';
                break;
            case 'SHIELD':
                this.shieldActive = false;
                break;
        }
        this.eventEmitter.emit('powerUpDeactivated', type);
    }

    public getHealth(): number {
        return this.health;
    }

    public setFireRate(rate: number): void {
        this.fireRate = rate;
    }

    public setBulletType(type: 'single' | 'triple'): void {
        this.bulletType = type;
    }

    public activateShield(): void {
        this.shieldActive = true;
    }

    public getPosition(): Vector2D {
        return { x: this.x, y: this.y };
    }
}
