import { GameConfig, createGameConfig } from '../config/GameConfigFactory';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';
import { IGame } from '../interfaces/IGame';
import { IInputManager } from '../interfaces/IInputManager';
import { IPlayer } from '../interfaces/IPlayer';
import { IRandomProvider } from '../providers/IRandomProvider';
import { PlayerRenderer } from '../rendering/PlayerRenderer';
import { PowerUpEffectService } from '../services/PowerUpEffectService';
import { PowerUpType, Vector2D } from '../types';
import { WeaponManager } from '../weapons/managers/WeaponManager';

import { Bullet } from './Bullet';
import { GameObject } from './GameObject';

export class Player extends GameObject implements IPlayer {
  private velocity: Vector2D = { x: 0, y: 0 };
  private health: number;
  private maxHealth: number;
  private fireRate: number;
  private bulletType: 'single' | 'triple' = 'single';
  private shieldActive = false;
  private invincible = false;
  private debugInvincible = false; // デバッグ用無敵フラグ
  private lastHitTime = 0;
  private lastFireTime = 0;
  private thrusterParticles: Array<{
    x: number;
    y: number;
    speed: number;
    life: number;
  }> = [];
  private playerRenderer: PlayerRenderer;
  private game?: IGame;
  private config: GameConfig;
  private powerUpEffectService?: PowerUpEffectService;
  private weaponManager?: WeaponManager;
  private useWeaponSystem: boolean = false; // 武器システム使用フラグ
  private activeWeaponSlot: number = 0; // アクティブ武器スロット

  constructor(
    private eventEmitter: EventEmitter<EventMap>,
    private inputManager: IInputManager,
    private randomProvider: IRandomProvider,
    config?: GameConfig,
    powerUpEffectService?: PowerUpEffectService
  ) {
    // 後方互換性のため、設定が提供されない場合はデフォルト設定を使用
    const gameConfig = config ?? Player.createLegacyConfig();

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

  public setKeyState(_key: string, _pressed: boolean): void {
    // この方法は非推奨 - InputManagerを直接使用してください
    // 後方互換性のために残しています
    // 実装は空のまま（InputManagerを直接使用することを推奨）
  }

  public update(deltaTime: number): void {
    this.updateMovement();
    this.updateShooting();
    this.updateInvincibility();
    this.updateEngineAnimation();
    this.updateThrusterParticles(deltaTime);

    // 武器システム更新
    if (this.weaponManager) {
      this.weaponManager.update(deltaTime);
    }
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
    if (this.isLeftKeyPressed()) {
      this.velocity.x = Math.max(this.velocity.x - acceleration, -maxSpeed);
    } else if (this.isRightKeyPressed()) {
      this.velocity.x = Math.min(this.velocity.x + acceleration, maxSpeed);
    } else {
      this.applyXDeceleration(deceleration);
    }

    // Y軸移動
    if (this.isUpKeyPressed()) {
      this.velocity.y = Math.max(this.velocity.y - acceleration, -maxSpeed);
    } else if (this.isDownKeyPressed()) {
      this.velocity.y = Math.min(this.velocity.y + acceleration, maxSpeed);
    } else {
      this.applyYDeceleration(deceleration);
    }
  }

  /**
   * 左移動キーが押されているかチェック（矢印キーまたはWASDキー）
   */
  private isLeftKeyPressed(): boolean {
    return (
      this.inputManager.isKeyPressed('ArrowLeft') ||
      this.inputManager.isKeyPressed('a') ||
      this.inputManager.isKeyPressed('A')
    );
  }

  /**
   * 右移動キーが押されているかチェック（矢印キーまたはWASDキー）
   */
  private isRightKeyPressed(): boolean {
    return (
      this.inputManager.isKeyPressed('ArrowRight') ||
      this.inputManager.isKeyPressed('d') ||
      this.inputManager.isKeyPressed('D')
    );
  }

  /**
   * 上移動キーが押されているかチェック（矢印キーまたはWASDキー）
   */
  private isUpKeyPressed(): boolean {
    return (
      this.inputManager.isKeyPressed('ArrowUp') ||
      this.inputManager.isKeyPressed('w') ||
      this.inputManager.isKeyPressed('W')
    );
  }

  /**
   * 下移動キーが押されているかチェック（矢印キーまたはWASDキー）
   */
  private isDownKeyPressed(): boolean {
    return (
      this.inputManager.isKeyPressed('ArrowDown') ||
      this.inputManager.isKeyPressed('s') ||
      this.inputManager.isKeyPressed('S')
    );
  }

  /**
   * X軸の減速を適用
   */
  private applyXDeceleration(deceleration: number): void {
    if (this.velocity.x > 0) {
      this.velocity.x = Math.max(0, this.velocity.x - deceleration);
    } else if (this.velocity.x < 0) {
      this.velocity.x = Math.min(0, this.velocity.x + deceleration);
    }
  }

  /**
   * Y軸の減速を適用
   */
  private applyYDeceleration(deceleration: number): void {
    if (this.velocity.y > 0) {
      this.velocity.y = Math.max(0, this.velocity.y - deceleration);
    } else if (this.velocity.y < 0) {
      this.velocity.y = Math.min(0, this.velocity.y + deceleration);
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
    if (this.useWeaponSystem && this.weaponManager) {
      // 武器システムを使用した射撃
      this.shootWithWeapons();
    } else {
      // 従来の射撃システム
      this.shoot();
    }
  }

  public shoot(): void {
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
   * 武器システムを使用した射撃
   */
  public shootWithWeapons(): void {
    if (!this.weaponManager) return;

    const bullets = this.weaponManager.fireAllWeapons(this);
    bullets.forEach(bullet => {
      this.eventEmitter.emit('playerShot', bullet);
    });
  }

  /**
   * 特定の武器で射撃
   */
  public shootWithWeapon(weaponId: string): void {
    if (!this.weaponManager) return;

    const bullets = this.weaponManager.fireWeapon(weaponId, this);
    bullets.forEach(bullet => {
      this.eventEmitter.emit('playerShot', bullet);
    });
  }

  /**
   * 弾丸を作成（プール使用 or フォールバック）
   */
  private createBullet(
    x: number,
    y: number,
    speed?: number,
    color?: string
  ): Bullet | null {
    const bulletSpeed = speed ?? this.config.bullet.speed;

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
    if (
      this.invincible &&
      Date.now() - this.lastHitTime > this.config.player.invincibilityTime
    ) {
      this.invincible = false;
    }
  }

  private updateEngineAnimation(): void {
    // エンジンアニメーションは削除してシンプル化
  }

  private generateThrusterParticles(): void {
    const particleCount = 3;
    for (let i = 0; i < particleCount; i++) {
      this.thrusterParticles.push({
        x: this.x + this.width / 2,
        y: this.y + this.height,
        speed: this.randomProvider.random() * 50 + 50,
        life: 1,
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
    // デバッグ無敵時はダメージを受けない
    if (this.debugInvincible) {
      return;
    }

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

      setTimeout(
        () => this.deactivatePowerup(type),
        this.config.powerup.duration
      );
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

  /**
   * 速度を直接設定（モバイル用）
   */
  public setVelocity(x: number, y: number): void {
    this.velocity.x = Math.max(
      -this.config.player.maxSpeed,
      Math.min(this.config.player.maxSpeed, x)
    );
    this.velocity.y = Math.max(
      -this.config.player.maxSpeed,
      Math.min(this.config.player.maxSpeed, y)
    );
  }

  /**
   * 特殊攻撃を発動（モバイル用）
   */
  public activateSpecialAttack(): void {
    if (this.useWeaponSystem && this.weaponManager) {
      // 武器システム使用時：全武器で一斉射撃
      this.shootWithWeapons();
    } else {
      // 従来システム：一時的にトリプルショットを発動
      const originalBulletType = this.bulletType;
      this.bulletType = 'triple';
      this.shoot();

      // 少し遅延してから元に戻す
      setTimeout(() => {
        this.bulletType = originalBulletType;
      }, 100);
    }
  }

  /**
   * 現在の速度を取得
   */
  public getVelocity(): Vector2D {
    return { ...this.velocity };
  }

  /**
   * デバッグ無敵モードを設定（デバッグ用）
   */
  public setDebugInvincible(invincible: boolean): void {
    this.debugInvincible = invincible;
  }

  /**
   * デバッグ無敵モードの状態を取得（デバッグ用）
   */
  public isDebugInvincible(): boolean {
    return this.debugInvincible;
  }

  /**
   * 武器管理システムを設定
   */
  public setWeaponManager(weaponManager: WeaponManager): void {
    this.weaponManager = weaponManager;
  }

  /**
   * 武器管理システムを取得
   */
  public getWeaponManager(): WeaponManager | undefined {
    return this.weaponManager;
  }

  /**
   * 武器システム使用を有効化
   */
  public enableWeaponSystem(enable: boolean = true): void {
    this.useWeaponSystem = enable;
  }

  /**
   * 武器システムが有効かどうか
   */
  public isWeaponSystemEnabled(): boolean {
    return this.useWeaponSystem;
  }

  /**
   * 武器購入
   */
  public async purchaseWeapon(weaponId: string): Promise<boolean> {
    if (!this.weaponManager) return false;

    const result = await this.weaponManager.purchaseWeapon(weaponId);
    return result.success;
  }

  /**
   * 武器装備
   */
  public equipWeapon(weaponId: string, slot: number): boolean {
    if (!this.weaponManager) return false;

    const result = this.weaponManager.equipWeapon(weaponId, slot);
    return result.success;
  }

  /**
   * 武器取り外し
   */
  public unequipWeapon(slot: number): boolean {
    if (!this.weaponManager) return false;

    const result = this.weaponManager.unequipWeapon(slot);
    return result.success;
  }

  /**
   * 装備中武器一覧取得
   */
  public getEquippedWeapons() {
    return this.weaponManager?.getEquippedWeapons() ?? [];
  }

  /**
   * 所有武器一覧取得
   */
  public getOwnedWeapons(): string[] {
    return this.weaponManager?.getOwnedWeapons() ?? [];
  }

  /**
   * 利用可能武器一覧取得
   */
  public getAvailableWeapons() {
    return this.weaponManager?.getAvailableWeapons() ?? [];
  }

  /**
   * アクティブ武器スロットを設定
   */
  public setActiveWeaponSlot(slot: number): void {
    this.activeWeaponSlot = slot;
  }

  /**
   * アクティブ武器スロットを取得
   */
  public getActiveWeaponSlot(): number {
    return this.activeWeaponSlot;
  }
}
