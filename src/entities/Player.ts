import { PowerUpType, Vector2D } from "../types";
import { GAME_CONSTANTS } from "../constants/GameConstants";
import { EventEmitter } from "../events/EventEmitter";
import { Bullet } from "./Bullet";
import { GameObject } from "./GameObject";
import { EventMap } from "../events/EventType";
import { IGameEngine } from "../interfaces/IGameEngine";
import { IInputManager } from "../interfaces/IInputManager";
import { IRandomProvider } from "../providers/IRandomProvider";
import { UpgradeEffect } from "../progression/types/Upgrade";
import { PlayerRenderer } from "../rendering/PlayerRenderer";

export class Player extends GameObject {
    private velocity: Vector2D = { x: 0, y: 0 };
    private health: number;
    private maxHealth: number;
    private fireRate: number;
    private bulletType: 'single' | 'triple' = 'single';
    private shieldActive = false;
    private activePowerups: { type: PowerUpType; startTime: number }[] = [];
    private engineAnimationPhase = 0;
    private invincible = false;
    private lastHitTime = 0;
    private lastFireTime = 0;
    private thrusterParticles: Array<{ x: number; y: number; speed: number; life: number }> = [];
    private playerRenderer: PlayerRenderer;
    
    // アップグレード効果関連
    private currentUpgradeEffect: UpgradeEffect = {};
    private baseStats = {
        health: GAME_CONSTANTS.PLAYER.MAX_HEALTH,
        fireRate: GAME_CONSTANTS.PLAYER.FIRE_RATE,
        moveSpeed: GAME_CONSTANTS.PLAYER.MAX_SPEED,
        bulletDamage: 1,
        bulletCount: 1,
        bulletSpeed: GAME_CONSTANTS.BULLET.SPEED
    };

    constructor(
        private eventEmitter: EventEmitter<EventMap>,
        private inputManager: IInputManager,
        private randomProvider: IRandomProvider,
        private game?: IGameEngine
    ) {
        super(
            GAME_CONSTANTS.CANVAS.WIDTH / 2 - GAME_CONSTANTS.PLAYER.WIDTH / 2,
            GAME_CONSTANTS.CANVAS.HEIGHT - GAME_CONSTANTS.PLAYER.HEIGHT - 10,
            GAME_CONSTANTS.PLAYER.WIDTH,
            GAME_CONSTANTS.PLAYER.HEIGHT
        );
        this.health = GAME_CONSTANTS.PLAYER.MAX_HEALTH;
        this.maxHealth = GAME_CONSTANTS.PLAYER.MAX_HEALTH;
        this.fireRate = GAME_CONSTANTS.PLAYER.FIRE_RATE;
        this.playerRenderer = new PlayerRenderer();
    }

    public setKeyState(_key: string, _isPressed: boolean): void {
        // この方法は非推奨 - InputManagerを直接使用してください
        // 後方互換性のために残しています
    }

    public update(deltaTime: number): void {
        this.updateMovement();
        this.updateShooting();
        this.updateInvincibility();
        this.updateEngineAnimation(deltaTime);
        this.updateThrusterParticles(deltaTime);
    }

    private updateMovement(): void {
        this.updateVelocity();

        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.clampPosition();

        this.generateThrusterParticles();
    }

    private updateVelocity(): void {
        const { ACCELERATION } = GAME_CONSTANTS.PLAYER;
        const effectiveMaxSpeed = this.getEffectiveMaxSpeed();

        // X軸移動
        if (this.inputManager.isKeyPressed('ArrowLeft')) {
            this.velocity.x = Math.max(this.velocity.x - ACCELERATION, -effectiveMaxSpeed);
        } else if (this.inputManager.isKeyPressed('ArrowRight')) {
            this.velocity.x = Math.min(this.velocity.x + ACCELERATION, effectiveMaxSpeed);
        } else {
            this.applyDecelerationX();
        }

        // Y軸移動
        if (this.inputManager.isKeyPressed('ArrowUp')) {
            this.velocity.y = Math.max(this.velocity.y - ACCELERATION, -effectiveMaxSpeed);
        } else if (this.inputManager.isKeyPressed('ArrowDown')) {
            this.velocity.y = Math.min(this.velocity.y + ACCELERATION, effectiveMaxSpeed);
        } else {
            this.applyDecelerationY();
        }
    }

    private applyDecelerationX(): void {
        const { DECELERATION } = GAME_CONSTANTS.PLAYER;

        if (this.velocity.x > 0) {
            this.velocity.x = Math.max(0, this.velocity.x - DECELERATION);
        } else if (this.velocity.x < 0) {
            this.velocity.x = Math.min(0, this.velocity.x + DECELERATION);
        }
    }

    private applyDecelerationY(): void {
        const { DECELERATION } = GAME_CONSTANTS.PLAYER;

        if (this.velocity.y > 0) {
            this.velocity.y = Math.max(0, this.velocity.y - DECELERATION);
        } else if (this.velocity.y < 0) {
            this.velocity.y = Math.min(0, this.velocity.y + DECELERATION);
        }
    }

    private clampPosition(): void {
        const { CANVAS } = GAME_CONSTANTS;

        // X軸の制限
        if (this.x < 0) {
            this.x = 0;
            this.velocity.x = 0;
        } else if (this.x > CANVAS.WIDTH - this.width) {
            this.x = CANVAS.WIDTH - this.width;
            this.velocity.x = 0;
        }

        // Y軸の制限
        if (this.y < 0) {
            this.y = 0;
            this.velocity.y = 0;
        } else if (this.y > CANVAS.HEIGHT - this.height) {
            this.y = CANVAS.HEIGHT - this.height;
            this.velocity.y = 0;
        }
    }

    private updateShooting(): void {
        if (this.inputManager.isKeyPressed(' ')) {
            this.shoot();
        }
    }

    private shoot(): void {
        const currentTime = Date.now();
        if (currentTime - this.lastFireTime >= this.fireRate) {
            const centerX = this.x + this.width / 2 - GAME_CONSTANTS.BULLET.WIDTH / 2;

            if (this.bulletType === 'single') {
                const bullet = this.createBullet(centerX, this.y);
                if (bullet) {
                    this.eventEmitter.emit('playerShot', bullet);
                }
            } else if (this.bulletType === 'triple') {
                // 中央の弾丸
                const centerBullet = this.createBullet(centerX, this.y);
                if (centerBullet) {
                    this.eventEmitter.emit('playerShot', centerBullet);
                }

                // 左の弾丸
                const leftBullet = this.createBullet(centerX - 20, this.y + 10);
                if (leftBullet) {
                    this.eventEmitter.emit('playerShot', leftBullet);
                }

                // 右の弾丸
                const rightBullet = this.createBullet(centerX + 20, this.y + 10);
                if (rightBullet) {
                    this.eventEmitter.emit('playerShot', rightBullet);
                }
            }
            this.lastFireTime = currentTime;
        }
    }

    /**
     * 弾丸を作成（プール使用 or フォールバック）
     */
    private createBullet(x: number, y: number, speed?: number, color?: string): Bullet | null {
        const effectiveBulletSpeed = speed || this.getEffectiveBulletSpeed();
        
        if (this.game) {
            return this.game.createBullet(x, y, effectiveBulletSpeed, color);
        } else {
            // フォールバック：Gameインスタンスがない場合は直接作成
            const bullet = new Bullet();
            bullet.initialize(x, y, effectiveBulletSpeed, color);
            return bullet;
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
                speed: this.randomProvider.random() * 50 + 50,
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
        this.playerRenderer.render(
            ctx,
            this.x,
            this.y,
            this.width,
            this.height,
            this.invincible,
            this.shieldActive,
            this.engineAnimationPhase,
            this.thrusterParticles
        );
    }

    public takeDamage(amount: number): void {
        if (!this.invincible && !this.shieldActive) {
            const reducedDamage = this.applyDamageReduction(amount);
            this.health = Math.max(0, this.health - reducedDamage);
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

    /**
     * アップグレード効果を適用する
     */
    public applyUpgradeEffect(upgradeEffect: UpgradeEffect): void {
        this.currentUpgradeEffect = { ...upgradeEffect };
        this.recalculateStats();
    }

    /**
     * アップグレード効果を考慮した統計値を再計算
     */
    private recalculateStats(): void {
        const effect = this.currentUpgradeEffect;

        // 体力関連
        const newMaxHealth = Math.floor(this.baseStats.health * (effect.healthMultiplier || 1));
        if (newMaxHealth !== this.maxHealth) {
            const healthRatio = this.health / this.maxHealth;
            this.maxHealth = newMaxHealth;
            this.health = Math.floor(this.maxHealth * healthRatio); // 現在の体力割合を維持
        }

        // 射撃速度
        this.fireRate = Math.floor(this.baseStats.fireRate / (effect.fireRateMultiplier || 1));

        // 弾丸タイプを多重射撃に設定（bulletCountMultiplierが1より大きい場合）
        if (effect.bulletCountMultiplier && effect.bulletCountMultiplier > 1) {
            this.bulletType = 'triple';
        }
    }

    /**
     * アップグレード効果を考慮した移動速度を取得
     */
    private getEffectiveMaxSpeed(): number {
        const effect = this.currentUpgradeEffect;
        return this.baseStats.moveSpeed * (effect.moveSpeedMultiplier || 1);
    }

    /**
     * アップグレード効果を考慮した弾丸速度を取得
     */
    private getEffectiveBulletSpeed(): number {
        const effect = this.currentUpgradeEffect;
        return this.baseStats.bulletSpeed * (effect.bulletSpeedMultiplier || 1);
    }

    /**
     * アップグレード効果を考慮したダメージ軽減を適用
     */
    private applyDamageReduction(damage: number): number {
        const effect = this.currentUpgradeEffect;
        const reduction = effect.damageReductionPercent || 0;
        return Math.max(1, Math.floor(damage * (1 - reduction)));
    }

    /**
     * アップグレード効果を考慮した経験値ボーナスを取得
     */
    public getExperienceMultiplier(): number {
        return this.currentUpgradeEffect.experienceBonusMultiplier || 1;
    }

    /**
     * アップグレード効果を考慮したコインボーナスを取得
     */
    public getCoinMultiplier(): number {
        return this.currentUpgradeEffect.coinBonusMultiplier || 1;
    }

    /**
     * アップグレード効果を考慮したマグネット範囲を取得
     */
    public getMagnetRange(): number {
        const baseRange = 50; // デフォルトのマグネット範囲
        return baseRange + (this.currentUpgradeEffect.magnetRangeBonus || 0);
    }

    /**
     * アップグレード効果を考慮したラッキードロップ確率を取得
     */
    public getLuckyDropChance(): number {
        return this.currentUpgradeEffect.luckyDropChanceBonus || 0;
    }

    /**
     * 現在のアップグレード効果を取得
     */
    public getCurrentUpgradeEffect(): UpgradeEffect {
        return { ...this.currentUpgradeEffect };
    }

    /**
     * 最大体力を取得
     */
    public getMaxHealth(): number {
        return this.maxHealth;
    }

    /**
     * アップグレードによる弾丸ダメージ倍率を取得
     */
    public getBulletDamageMultiplier(): number {
        return this.currentUpgradeEffect.bulletDamageMultiplier || 1;
    }

    /**
     * 後からGameインスタンスを設定（循環依存回避のため）
     */
    public setGame(game: IGameEngine): void {
        this.game = game;
    }
}
