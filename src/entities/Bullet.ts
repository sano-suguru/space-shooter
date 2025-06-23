import { GameConfig, createGameConfig } from '../config/GameConfigFactory';
import { BulletVisualManager } from '../weapons/systems/BulletVisualManager';
import { TrajectoryFactory } from '../weapons/trajectories/TrajectoryFactory';
import { EnchantmentType } from '../weapons/types/EnchantmentTypes';
import { IBulletTrajectory } from '../weapons/types/TrajectoryTypes';
import { WeaponConfig } from '../weapons/types/WeaponTypes';

import { GameObject } from './GameObject';

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

export class Bullet extends GameObject {
  private active: boolean = true;
  private speed: number;
  private color: string = '#ff0000';
  private animationTime: number = 0;
  private trail: TrailPoint[] = [];
  private maxTrailLength: number = 8;
  private bulletType: 'plasma' | 'laser' | 'energy' | 'missile' = 'plasma';
  private rotation: number = 0;
  private rotationSpeed: number = 0.2;
  private pulsePhase: number = 0;
  private config: GameConfig;
  private owner: 'player' | 'enemy' | 'boss' = 'player'; // 弾丸の所有者

  // 弾道システム関連
  private trajectory?: IBulletTrajectory;

  // ビジュアル効果関連
  private visualManager: BulletVisualManager | null = null;
  private weaponConfig: WeaponConfig | null = null;
  private enchantments: EnchantmentType[] = [];
  private useCustomVisuals: boolean = false;

  // エンチャント効果プロパティ
  private piercing: boolean = false;
  private piercingCount: number = 0;
  private explosive: boolean = false;
  private explosionRadius: number = 0;
  private homing: boolean = false;
  private homingDuration: number = 0;
  private chainLightning: boolean = false;
  private chainCount: number = 0;
  private split: boolean = false;
  private splitCount: number = 0;
  private ricochet: boolean = false;
  private ricochetCount: number = 0;
  private criticalChance: number = 0;
  private uniqueId: string = '';

  constructor(x: number = 0, y: number = 0, config?: GameConfig) {
    // 後方互換性のため、configが未指定の場合はデフォルト設定を使用
    const gameConfig = config ?? createGameConfig();

    super(x, y, gameConfig.bullet.width, gameConfig.bullet.height);

    this.config = gameConfig;
    this.speed = gameConfig.bullet.speed;
  }

  /**
   * 弾丸を初期化（美しいエフェクト付き）
   */
  public initialize(
    x: number,
    y: number,
    speed?: number,
    color?: string,
    owner?: 'player' | 'enemy' | 'boss'
  ): void {
    this.x = x;
    this.y = y;
    this.active = true;
    this.speed = speed ?? this.config.bullet.speed;
    this.color = color ?? '#00aaff';
    this.animationTime = 0;
    this.trail = [];
    this.rotation = 0;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.owner = owner ?? 'player'; // デフォルトはプレイヤー

    // 色から弾丸タイプを判定
    if (color?.includes('ff')) this.bulletType = 'energy';
    else if (color?.includes('00')) this.bulletType = 'plasma';
    else if (color?.includes('aa')) this.bulletType = 'laser';
    else this.bulletType = 'missile';
  }

  /**
   * 弾丸をリセット（オブジェクトプール用）
   */
  public reset(): void {
    // ビジュアル状態をクリーンアップ
    this.cleanupVisuals();

    // 弾道状態をクリーンアップ
    this.cleanupTrajectory();

    // 基本リセット処理
    this.x = 0;
    this.y = 0;
    this.active = false;
    this.speed = this.config.bullet.speed;
    this.color = '#00aaff';
    this.animationTime = 0;
    this.trail = [];
    this.rotation = 0;
    this.pulsePhase = 0;
    this.bulletType = 'plasma';
    this.owner = 'player';
  }

  public update(deltaTime: number): void {
    if (!this.active) return;

    // 弾道システムによる位置更新
    if (this.trajectory && !this.trajectory.isComplete()) {
      this.trajectory.update(this, deltaTime);

      if (this.trajectory.isComplete()) {
        TrajectoryFactory.returnToPool(this.trajectory);
        this.trajectory = undefined;
      }
    } else {
      // 従来の直線移動（後方互換性）
      if (this.owner === 'player') {
        // プレイヤーの弾丸は上向き（負の方向）
        this.y -= this.speed * deltaTime;
      } else {
        // 敵・ボスの弾丸は下向き（正の方向）
        this.y += this.speed * deltaTime;
      }
    }

    // アニメーション更新
    this.animationTime += deltaTime;

    // ミサイルタイプ以外は回転する
    if (this.bulletType !== 'missile') {
      this.rotation += this.rotationSpeed;
    }

    this.pulsePhase += deltaTime * 4;

    // トレイル更新
    this.updateTrail();

    // カスタムビジュアル更新
    if (this.useCustomVisuals && this.visualManager) {
      this.visualManager.updateBulletVisual(this, deltaTime);
    }
  }

  private updateTrail(): void {
    // 新しいトレイルポイントを追加
    this.trail.unshift({
      x: this.x + this.width / 2,
      y: this.y + this.height,
      alpha: 1.0,
    });

    // トレイルポイントのアルファ値を減少
    this.trail.forEach((point, index) => {
      point.alpha = Math.max(0, 1 - index / this.maxTrailLength);
    });

    // 古いトレイルポイントを削除
    if (this.trail.length > this.maxTrailLength) {
      this.trail = this.trail.slice(0, this.maxTrailLength);
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    // カスタムビジュアルが有効な場合はBulletVisualManagerを使用
    if (this.useCustomVisuals && this.visualManager) {
      this.visualManager.renderBullet(this, ctx);
      return;
    }

    // 従来の描画処理
    ctx.save();

    // トレイルの描画
    this.drawTrail(ctx);

    // 弾丸本体の描画
    this.drawBulletBody(ctx);

    ctx.restore();
  }

  private drawTrail(ctx: CanvasRenderingContext2D): void {
    if (this.trail.length < 2) return;

    for (let i = 1; i < this.trail.length; i++) {
      const current = this.trail[i - 1];
      const previous = this.trail[i];

      const gradient = ctx.createLinearGradient(
        current.x,
        current.y,
        previous.x,
        previous.y
      );

      gradient.addColorStop(
        0,
        this.color.replace(')', `, ${current.alpha * 0.6})`)
      );
      gradient.addColorStop(
        1,
        this.color.replace(')', `, ${previous.alpha * 0.3})`)
      );

      ctx.strokeStyle = gradient;
      ctx.lineWidth = this.width * current.alpha * 0.8;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(current.x, current.y);
      ctx.lineTo(previous.x, previous.y);
      ctx.stroke();
    }
  }

  private drawBulletBody(ctx: CanvasRenderingContext2D): void {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate(this.rotation);

    switch (this.bulletType) {
      case 'plasma':
        this.drawPlasmaBullet(ctx);
        break;
      case 'laser':
        this.drawLaserBullet(ctx);
        break;
      case 'energy':
        this.drawEnergyBullet(ctx);
        break;
      case 'missile':
        this.drawMissileBullet(ctx);
        break;
    }
  }

  private drawPlasmaBullet(ctx: CanvasRenderingContext2D): void {
    const pulseSize = 1 + Math.sin(this.pulsePhase) * 0.3;
    const radius = (this.width / 2) * pulseSize;

    // 外側の光輪
    const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.5);
    outerGradient.addColorStop(0, this.color);
    outerGradient.addColorStop(0.4, this.color.replace(')', ', 0.6)'));
    outerGradient.addColorStop(1, this.color.replace(')', ', 0)'));

    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 中心コア
    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    coreGradient.addColorStop(0.3, this.color);
    coreGradient.addColorStop(1, this.color.replace(')', ', 0.8)'));

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawLaserBullet(ctx: CanvasRenderingContext2D): void {
    const length = this.height;
    const width = this.width;

    // レーザービーム
    const gradient = ctx.createLinearGradient(0, -length / 2, 0, length / 2);
    gradient.addColorStop(0, this.color.replace(')', ', 0.2)'));
    gradient.addColorStop(0.5, this.color);
    gradient.addColorStop(1, this.color.replace(')', ', 0.2)'));

    ctx.fillStyle = gradient;
    ctx.fillRect(-width / 2, -length / 2, width, length);

    // 中央の明るいライン
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(-width / 4, -length / 2, width / 2, length);
  }

  private drawEnergyBullet(ctx: CanvasRenderingContext2D): void {
    const size = this.width;

    // エネルギー球
    for (let i = 0; i < 3; i++) {
      const radius = (size / 2) * (1 - i * 0.2);
      const alpha = 0.8 - i * 0.2;

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      gradient.addColorStop(0, this.color.replace(')', `, ${alpha})`));
      gradient.addColorStop(1, this.color.replace(')', ', 0)'));

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // エネルギーの輝き
    const sparkCount = 6;
    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2 + this.animationTime * 2;
      const sparkLength = size * 0.4;

      ctx.strokeStyle = this.color.replace(')', ', 0.7)');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * size * 0.2, Math.sin(angle) * size * 0.2);
      ctx.lineTo(Math.cos(angle) * sparkLength, Math.sin(angle) * sparkLength);
      ctx.stroke();
    }
  }

  private drawMissileBullet(ctx: CanvasRenderingContext2D): void {
    const length = this.height;
    const width = this.width;

    // ミサイル本体
    ctx.fillStyle = '#888888';
    ctx.fillRect(-width / 2, -length / 2, width, length);

    // 先端
    ctx.fillStyle = '#aaaaaa';
    ctx.beginPath();
    ctx.moveTo(0, -length / 2);
    ctx.lineTo(-width / 3, -length / 4);
    ctx.lineTo(width / 3, -length / 4);
    ctx.closePath();
    ctx.fill();

    // 推進炎
    const flameGradient = ctx.createLinearGradient(0, length / 2, 0, length);
    flameGradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
    flameGradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.6)');
    flameGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

    ctx.fillStyle = flameGradient;
    ctx.fillRect(-width / 3, length / 2, (width * 2) / 3, length / 2);
  }

  public isOnScreen(): boolean {
    return this.active && this.y + this.height > 0;
  }

  public isActive(): boolean {
    return this.active;
  }

  public deactivate(): void {
    this.active = false;
  }

  /**
   * 弾丸の種類を設定
   */
  public setType(speed: number, color: string): void {
    this.speed = speed;
    this.color = color;
  }

  /**
   * 弾丸の位置を取得
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  // エンチャント効果メソッド
  public setPiercing(count: number): void {
    this.piercing = count > 0;
    this.piercingCount = count;
  }

  public setExplosive(explosive: boolean): void {
    this.explosive = explosive;
  }

  public setExplosionRadius(radius: number): void {
    this.explosionRadius = radius;
  }

  public setHoming(homing: boolean): void {
    this.homing = homing;
  }

  public setHomingDuration(duration: number): void {
    this.homingDuration = duration;
  }

  public setChainLightning(chain: boolean): void {
    this.chainLightning = chain;
  }

  public setChainCount(count: number): void {
    this.chainCount = count;
  }

  public setSplit(split: boolean): void {
    this.split = split;
  }

  public setSplitCount(count: number): void {
    this.splitCount = count;
  }

  public setRicochet(ricochet: boolean): void {
    this.ricochet = ricochet;
  }

  public setRicochetCount(count: number): void {
    this.ricochetCount = count;
  }

  public setCriticalChance(chance: number): void {
    this.criticalChance = chance;
  }

  public getId(): string {
    if (!this.uniqueId) {
      this.uniqueId = `bullet_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
    return this.uniqueId;
  }

  // エンチャント効果の取得メソッド
  public isPiercing(): boolean {
    return this.piercing;
  }

  public getPiercingCount(): number {
    return this.piercingCount;
  }

  public isExplosive(): boolean {
    return this.explosive;
  }

  public getExplosionRadius(): number {
    return this.explosionRadius;
  }

  public isHoming(): boolean {
    return this.homing;
  }

  public getHomingDuration(): number {
    return this.homingDuration;
  }

  public hasChainLightning(): boolean {
    return this.chainLightning;
  }

  public getChainCount(): number {
    return this.chainCount;
  }

  public canSplit(): boolean {
    return this.split;
  }

  public getSplitCount(): number {
    return this.splitCount;
  }

  public canRicochet(): boolean {
    return this.ricochet;
  }

  public getRicochetCount(): number {
    return this.ricochetCount;
  }

  public getCriticalChance(): number {
    return this.criticalChance;
  }

  /**
   * 弾丸の所有者を取得
   */
  public getOwner(): 'player' | 'enemy' | 'boss' {
    return this.owner;
  }

  /**
   * 弾丸の所有者を設定
   */
  public setOwner(owner: 'player' | 'enemy' | 'boss'): void {
    this.owner = owner;
  }

  /**
   * ビジュアルマネージャーを設定
   */
  public setVisualManager(visualManager: BulletVisualManager): void {
    this.visualManager = visualManager;
  }

  /**
   * 武器設定とエンチャント情報を設定してビジュアル効果を有効化
   */
  public setWeaponVisual(
    weaponConfig: WeaponConfig,
    enchantments: EnchantmentType[] = [],
    visualManager?: BulletVisualManager
  ): void {
    this.weaponConfig = weaponConfig;
    this.enchantments = [...enchantments];

    if (visualManager) {
      this.visualManager = visualManager;
    }

    if (this.visualManager) {
      this.visualManager.setBulletVisual(this, weaponConfig, enchantments);
      this.useCustomVisuals = true;
    }
  }

  /**
   * カスタムビジュアルの有効/無効を切り替え
   */
  public setCustomVisualsEnabled(enabled: boolean): void {
    this.useCustomVisuals = enabled;
  }

  /**
   * カスタムビジュアルが有効かどうかを取得
   */
  public isCustomVisualsEnabled(): boolean {
    return this.useCustomVisuals;
  }

  /**
   * 武器設定を取得
   */
  public getWeaponConfig(): WeaponConfig | null {
    return this.weaponConfig;
  }

  /**
   * エンチャント情報を取得
   */
  public getEnchantments(): EnchantmentType[] {
    return [...this.enchantments];
  }

  /**
   * ビジュアルマネージャーを取得
   */
  public getVisualManager(): BulletVisualManager | null {
    return this.visualManager;
  }

  /**
   * 弾道パターンを設定
   */
  public setTrajectory(trajectory: IBulletTrajectory): void {
    if (this.trajectory) {
      TrajectoryFactory.returnToPool(this.trajectory);
    }
    this.trajectory = trajectory;
  }

  /**
   * 弾道パターンを取得
   */
  public getTrajectory(): IBulletTrajectory | undefined {
    return this.trajectory;
  }

  /**
   * 弾道パターンをクリーンアップ
   */
  public cleanupTrajectory(): void {
    if (this.trajectory) {
      TrajectoryFactory.returnToPool(this.trajectory);
      this.trajectory = undefined;
    }
  }

  /**
   * ビジュアル状態をクリーンアップ
   */
  public cleanupVisuals(): void {
    if (this.visualManager && this.useCustomVisuals) {
      this.visualManager.cleanupBulletVisual(this);
    }
    this.useCustomVisuals = false;
    this.weaponConfig = null;
    this.enchantments = [];
  }
}
