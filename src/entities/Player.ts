import { PowerUpType, Vector2D } from "../types";
import { EventEmitter } from "../events/EventEmitter";
import { Bullet } from "./Bullet";
import { GameObject } from "./GameObject";
import { EventMap } from "../events/EventType";
import { IInputManager } from "../interfaces/IInputManager";
import { IRandomProvider } from "../providers/IRandomProvider";
import { IGame } from "../interfaces/IGame";
import { IPlayer } from "../interfaces/IPlayer";
import { PlayerRenderer } from "../rendering/PlayerRenderer";
import { GameConfig, createGameConfig } from "../config/GameConfigFactory";
import { PowerUpEffectService } from "../services/PowerUpEffectService";

export class Player extends GameObject implements IPlayer {
    private velocity: Vector2D = { x: 0, y: 0 };
    private health: number;
    private maxHealth: number;
    private fireRate: number;
    private bulletType: 'single' | 'triple' = 'single';
    private shieldActive = false;
    private invincible = false;
    private lastHitTime = 0;
    private lastFireTime = 0;
    private thrusterParticles: Array<{ x: number; y: number; speed: number; life: number }> = [];
    private playerRenderer: PlayerRenderer;
    private game?: IGame;
    private config: GameConfig;
    private powerUpEffectService?: PowerUpEffectService;

    constructor(
        private eventEmitter: EventEmitter<EventMap>,
        private inputManager: IInputManager,
        private randomProvider: IRandomProvider,
        config?: GameConfig,
        powerUpEffectService?: PowerUpEffectService
    ) {
        // 後方互換性のため、設定が提供されない場合はデフォルト設定を使用
        const gameConfig = config || Player.createLegacyConfig();
        
        super(
            gameConfig.canvas.width / 2 - gameConfig.player.width / 2,
            gameConfig.canvas.height - gameConfig.player.height - 10,
            gameConfig.player.width,
            gameConfig.player.height
        );
        
        this.config = gameConfig;
        this.powerUpEffectService = powerUpEffectService;
        this.health = this.config.player.maxHealth;
        this.maxHealth = this.config.player.maxHealth;
        this.fireRate = this.config.player.fireRate;
        this.playerRenderer = new PlayerRenderer(this.config);
    }

    /**
     * レガシー設定を作成（後方互換性のため）
     */
    private static createLegacyConfig(): GameConfig {
        return createGameConfig();
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
        const { acceleration, deceleration, maxSpeed } = this.config.player;

        // X軸移動
        if (this.inputManager.isKeyPressed('ArrowLeft')) {
            this.velocity.x = Math.max(this.velocity.x - acceleration, -maxSpeed);
        } else if (this.inputManager.isKeyPressed('ArrowRight')) {
            this.velocity.x = Math.min(this.velocity.x + acceleration, maxSpeed);
        } else {
            // X軸の減速
            if (this.velocity.x > 0) {
                this.velocity.x = Math.max(0, this.velocity.x - deceleration);
            } else if (this.velocity.x < 0) {
                this.velocity.x = Math.min(0, this.velocity.x + deceleration);
            }
        }

        // Y軸移動
        if (this.inputManager.isKeyPressed('ArrowUp')) {
            this.velocity.y = Math.max(this.velocity.y - acceleration, -maxSpeed);
        } else if (this.inputManager.isKeyPressed('ArrowDown')) {
            this.velocity.y = Math.min(this.velocity.y + acceleration, maxSpeed);
        } else {
            // Y軸の減速
            if (this.velocity.y > 0) {
                this.velocity.y = Math.max(0, this.velocity.y - deceleration);
            } else if (this.velocity.y < 0) {
                this.velocity.y = Math.min(0, this.velocity.y + deceleration);
            }
        }
    }

    private clampPosition(): void {
        const { canvas } = this.config;

        // X軸の制限
        if (this.x < 0) {
            this.x = 0;
            this.velocity.x = 0;
        } else if (this.x > canvas.width - this.width) {
            this.x = canvas.width - this.width;
            this.velocity.x = 0;
        }

        // Y軸の制限
        if (this.y < 0) {
            this.y = 0;
            this.velocity.y = 0;
        } else if (this.y > canvas.height - this.height) {
            this.y = canvas.height - this.height;
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
            const centerX = this.x + this.width / 2 - this.config.bullet.width / 2;

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
        const bulletSpeed = speed || this.config.bullet.speed;
        
        if (this.game) {
            return this.game.createBullet(x, y, bulletSpeed, color);
        } else {
            // フォールバック：Gameインスタンスがない場合は直接作成
            const bullet = new Bullet();
            bullet.initialize(x, y, bulletSpeed, color);
            return bullet;
        }
    }

    private updateInvincibility(): void {
        if (this.invincible && Date.now() - this.lastHitTime > this.config.player.invincibilityTime) {
            this.invincible = false;
        }
    }

    private updateEngineAnimation(_deltaTime: number): void {
        // エンジンアニメーションは削除してシンプル化
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
            0, // エンジンアニメーション削除
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
        if (this.powerUpEffectService) {
            // 新しいPowerUpEffectServiceを使用
            this.powerUpEffectService.applyEffect(this, type);
            this.eventEmitter.emit('powerUpActivated', type);

            const duration = this.powerUpEffectService.getEffectDuration(type);
            setTimeout(() => {
                this.powerUpEffectService?.removeEffect(this, type);
                this.eventEmitter.emit('powerUpDeactivated', type);
            }, duration);
        } else {
            // フォールバック：基本的な効果を直接適用
            this.applyBasicPowerUpEffect(type);
            this.eventEmitter.emit('powerUpActivated', type);

            setTimeout(() => this.deactivatePowerup(type), this.config.powerup.duration);
        }
    }

    /**
     * 基本的なPowerUp効果を直接適用（PowerUpEffectServiceが利用できない場合）
     */
    private applyBasicPowerUpEffect(type: PowerUpType): void {
        switch (type) {
            case 'RAPID_FIRE':
                this.fireRate = this.config.player.fireRate / 2;
                break;
            case 'TRIPLE_SHOT':
                this.bulletType = 'triple';
                break;
            case 'SHIELD':
                this.shieldActive = true;
                break;
        }
    }

    private deactivatePowerup(type: PowerUpType): void {
        // レガシー実装（後方互換性のため）
        switch (type) {
            case 'RAPID_FIRE':
                this.fireRate = this.config.player.fireRate;
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
     * 最大体力を取得
     */
    public getMaxHealth(): number {
        return this.maxHealth;
    }

    /**
     * ダメージ軽減を適用（シンプル版）
     */
    private applyDamageReduction(damage: number): number {
        return damage; // シンプル化のため軽減なし
    }

    /**
     * 後からGameインスタンスを設定（循環依存回避のため）
     */
    public setGame(game: IGame): void {
        this.game = game;
    }

    /**
     * 現在の発射レートを取得（テスト用）
     */
    public getFireRate(): number {
        return this.fireRate;
    }

    /**
     * 現在の弾丸タイプを取得（テスト用）
     */
    public getBulletType(): 'single' | 'triple' {
        return this.bulletType;
    }

    /**
     * シールドの状態を取得（テスト用）
     */
    public isShieldActive(): boolean {
        return this.shieldActive;
    }

    /**
     * 設定を取得（テスト用）
     */
    public getConfig(): GameConfig {
        return this.config;
    }

    /**
     * PowerUpEffectServiceを設定（テスト用）
     */
    public setPowerUpEffectService(service: PowerUpEffectService): void {
        this.powerUpEffectService = service;
    }
}
