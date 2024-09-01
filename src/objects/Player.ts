import { Game } from "../game/Game";
import { PowerUpType, Vector2D } from "../types";
import { GAME_CONSTANTS } from "../utils/Constants";
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

    constructor(private game: Game) {
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
        if (this.keys['ArrowLeft']) this.velocity.x -= GAME_CONSTANTS.PLAYER.ACCELERATION;
        if (this.keys['ArrowRight']) this.velocity.x += GAME_CONSTANTS.PLAYER.ACCELERATION;
        if (this.keys[' ']) this.shoot();
        this.move(deltaTime);
        this.updateInvincibility();
        this.updateEngineAnimation(deltaTime);
    }

    private move(deltaTime: number): void {
        if (this.keys['ArrowLeft']) this.velocity.x -= GAME_CONSTANTS.PLAYER.ACCELERATION;
        if (this.keys['ArrowRight']) this.velocity.x += GAME_CONSTANTS.PLAYER.ACCELERATION;

        this.velocity.x = Math.max(Math.min(this.velocity.x, GAME_CONSTANTS.PLAYER.MAX_SPEED), -GAME_CONSTANTS.PLAYER.MAX_SPEED);

        this.x += this.velocity.x * deltaTime;
        if (this.x < 0) {
            this.x = 0;
            this.velocity.x = 0;
        } else if (this.x + this.width > GAME_CONSTANTS.CANVAS.WIDTH) {
            this.x = GAME_CONSTANTS.CANVAS.WIDTH - this.width;
            this.velocity.x = 0;
        }

        // Apply deceleration
        if (Math.abs(this.velocity.x) > 0) {
            const deceleration = Math.sign(this.velocity.x) * -GAME_CONSTANTS.PLAYER.DECELERATION;
            this.velocity.x += deceleration;
            if (Math.abs(this.velocity.x) < GAME_CONSTANTS.PLAYER.DECELERATION) {
                this.velocity.x = 0;
            }
        }
    }

    private shoot(): void {
        const currentTime = Date.now();
        if (currentTime - this.lastFireTime >= this.fireRate) {
            if (this.bulletType === 'single') {
                this.game.addBullet(new Bullet(this.x + this.width / 2 - GAME_CONSTANTS.BULLET.WIDTH / 2, this.y));
            } else if (this.bulletType === 'triple') {
                this.game.addBullet(new Bullet(this.x + this.width / 2 - GAME_CONSTANTS.BULLET.WIDTH / 2, this.y));
                this.game.addBullet(new Bullet(this.x + this.width / 2 - GAME_CONSTANTS.BULLET.WIDTH / 2 - 20, this.y + 10));
                this.game.addBullet(new Bullet(this.x + this.width / 2 - GAME_CONSTANTS.BULLET.WIDTH / 2 + 20, this.y + 10));
            }
            this.lastFireTime = currentTime;
        }
    }

    public takeDamage(amount: number): void {
        if (!this.invincible && !this.shieldActive) {
            this.health = Math.max(0, this.health - amount);
            this.invincible = true;
            this.lastHitTime = Date.now();
            if (this.health <= 0) {
                this.game.gameOver();
            }
        }
    }

    private updateInvincibility(): void {
        if (this.invincible && Date.now() - this.lastHitTime > GAME_CONSTANTS.PLAYER.INVINCIBILITY_TIME) {
            this.invincible = false;
        }
    }

    private updateEngineAnimation(deltaTime: number): void {
        this.engineAnimationPhase += GAME_CONSTANTS.PLAYER.ACCELERATION * deltaTime;
        if (this.engineAnimationPhase > Math.PI * 2) {
            this.engineAnimationPhase = 0;
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        // 機体の描画
        ctx.fillStyle = this.invincible ? 'rgba(255, 0, 0, 0.5)' : '#00ff00';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // ウィングの描画
        ctx.fillStyle = '#0099ff';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height * 0.7);
        ctx.lineTo(this.x - this.width * 0.3, this.y + this.height);
        ctx.lineTo(this.x + this.width * 0.3, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.x + this.width, this.y + this.height * 0.7);
        ctx.lineTo(this.x + this.width - this.width * 0.3, this.y + this.height);
        ctx.lineTo(this.x + this.width + this.width * 0.3, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // エンジンの描画
        const engineGlowSize = 5 + Math.sin(this.engineAnimationPhase) * 2;
        const gradient = ctx.createRadialGradient(
            this.x + this.width / 2, this.y + this.height,
            0, this.x + this.width / 2, this.y + this.height, engineGlowSize
        );
        gradient.addColorStop(0, 'rgba(255, 255, 0, 1)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height, engineGlowSize, 0, Math.PI * 2);
        ctx.fill();

        // シールドの描画
        if (this.shieldActive) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 10, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    public activatePowerup(type: PowerUpType): void {
        const powerup = GAME_CONSTANTS.POWERUP.TYPES[type];
        powerup.effect(this);
        this.activePowerups.push({ type, startTime: Date.now() });

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
