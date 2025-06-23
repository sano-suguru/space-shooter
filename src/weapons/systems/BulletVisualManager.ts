/**
 * 弾丸ビジュアル管理システム
 *
 * 武器設定とエンチャント情報から弾丸の見た目を決定し、
 * 既存のBulletクラスと連携してビジュアルエフェクトを管理します。
 */

import { Bullet } from '../../entities/Bullet';
import {
  getComboVisualConfig,
  getEnchantmentVisualConfig,
  getWeaponTypeVisualConfig,
} from '../data/bulletVisualConfigs';
import {
  BulletRenderContext,
  BulletVisualConfig,
  BulletVisualEffectType,
  BulletVisualState,
  ColorConfig,
  Particle,
  ParticleSystem,
  VisualEffectConfig,
} from '../types/BulletVisualTypes';
import { EnchantmentType } from '../types/EnchantmentTypes';
import { WeaponConfig } from '../types/WeaponTypes';

/**
 * 弾丸ビジュアル管理クラス
 */
export class BulletVisualManager {
  private visualStates: Map<string, BulletVisualState> = new Map();
  private particlePools: Map<string, Particle[]> = new Map();
  private maxParticlePoolSize = 50; // パーティクルプールサイズを削減
  private maxActiveParticles = 100; // アクティブパーティクル数制限
  private performanceMode = false; // パフォーマンスモード
  private frameTimeThreshold = 16.67; // 60FPS基準（ms）
  private performanceCheckInterval = 1000; // パフォーマンスチェック間隔（ms）
  private lastPerformanceCheck = 0;

  /**
   * 弾丸のビジュアル設定を生成
   */
  public generateBulletVisual(
    weaponConfig: WeaponConfig,
    enchantments: EnchantmentType[] = []
  ): BulletVisualConfig {
    // 基本武器タイプのビジュアル設定を取得
    const weaponTypeConfig = getWeaponTypeVisualConfig(weaponConfig.type);
    if (!weaponTypeConfig) {
      throw new Error(
        `武器タイプ ${weaponConfig.type} のビジュアル設定が見つかりません`
      );
    }

    // ベースビジュアル設定をコピー
    let visualConfig: BulletVisualConfig = JSON.parse(
      JSON.stringify(weaponTypeConfig.baseVisual)
    ) as BulletVisualConfig;

    // レアリティによる修正を適用
    const rarityModifier =
      weaponTypeConfig.rarityModifiers[weaponConfig.rarity];
    if (rarityModifier) {
      visualConfig = this.mergeVisualConfigs(visualConfig, rarityModifier);
    }

    // エンチャント効果による修正を適用
    if (enchantments.length > 0) {
      visualConfig = this.applyEnchantmentEffects(visualConfig, enchantments);
    }

    return visualConfig;
  }

  /**
   * 弾丸にビジュアル状態を設定
   */
  public setBulletVisual(
    bullet: Bullet,
    weaponConfig: WeaponConfig,
    enchantments: EnchantmentType[] = []
  ): void {
    const visualConfig = this.generateBulletVisual(weaponConfig, enchantments);

    const bulletId = bullet.getId();

    const visualState: BulletVisualState = {
      config: visualConfig,
      animationTime: 0,
      effectStates: new Map(),
      particleSystems: new Map(),
    };

    // エフェクト状態を初期化
    visualConfig.effects.forEach(effect => {
      visualState.effectStates.set(effect.type, 0);

      // パーティクルシステムを初期化
      if (effect.particles) {
        const particleSystem: ParticleSystem = {
          particles: [],
          config: effect.particles,
          lastEmitTime: 0,
          active: true,
        };
        visualState.particleSystems.set(effect.type, particleSystem);
      }
    });

    this.visualStates.set(bulletId, visualState);

    // 弾丸の基本設定を更新
    this.updateBulletBasicProperties(bullet, visualConfig);
  }

  /**
   * 弾丸のビジュアル状態を更新
   */
  public updateBulletVisual(bullet: Bullet, deltaTime: number): void {
    const bulletId = bullet.getId();
    const visualState = this.visualStates.get(bulletId);

    if (!visualState) {
      return;
    }

    // 自動パフォーマンス調整
    this.checkAndAdjustPerformance(deltaTime);

    // アニメーション時間を更新
    visualState.animationTime += deltaTime;

    // エフェクト状態を更新（パフォーマンスモードでは頻度を下げる）
    if (!this.performanceMode || Math.random() < 0.5) {
      visualState.effectStates.forEach((state, effectType) => {
        visualState.effectStates.set(effectType, state + deltaTime);
      });
    }

    // パーティクルシステムを更新
    visualState.particleSystems.forEach(particleSystem => {
      this.updateParticleSystem(particleSystem, deltaTime, bullet);
    });
  }

  /**
   * パフォーマンスをチェックして自動調整
   */
  private checkAndAdjustPerformance(deltaTime: number): void {
    const currentTime = Date.now();

    if (
      currentTime - this.lastPerformanceCheck >
      this.performanceCheckInterval
    ) {
      // フレーム時間が閾値を超えている場合はパフォーマンスモードを有効化
      if (deltaTime > this.frameTimeThreshold * 1.5) {
        if (!this.performanceMode) {
          this.performanceMode = true;
          console.log('🚀 パフォーマンスモードを自動有効化しました');
        }
      } else if (deltaTime < this.frameTimeThreshold && this.performanceMode) {
        // パフォーマンスが改善されたら通常モードに戻す
        this.performanceMode = false;
        console.log('✨ 通常ビジュアルモードに復帰しました');
      }

      this.lastPerformanceCheck = currentTime;
    }
  }

  /**
   * 弾丸のカスタム描画
   */
  public renderBullet(bullet: Bullet, ctx: CanvasRenderingContext2D): void {
    const bulletId = bullet.getId();
    const visualState = this.visualStates.get(bulletId);

    if (!visualState) {
      // ビジュアル状態がない場合は通常の描画
      bullet.draw(ctx);
      return;
    }

    const renderContext: BulletRenderContext = {
      ctx,
      x: bullet.getPosition().x,
      y: bullet.getPosition().y,
      width: bullet.width * visualState.config.size,
      height: bullet.height * visualState.config.size,
      deltaTime: 16, // 仮の値、実際は外部から渡される
      globalAlpha: ctx.globalAlpha,
    };

    ctx.save();

    // 追尾状態の特別なエフェクトを描画
    this.renderTrackingEffects(bullet, renderContext);

    // 弾丸本体を描画（常に描画）
    this.renderBulletBody(visualState, renderContext);

    // パフォーマンスモードでは重い処理をスキップ
    if (!this.performanceMode) {
      // カスタムトレイルを描画
      this.renderCustomTrail(visualState, renderContext);

      // エフェクトを描画
      this.renderEffects(visualState, renderContext);

      // パーティクルを描画
      this.renderParticles(visualState, renderContext);
    } else {
      // パフォーマンスモードでは軽量なトレイルのみ
      this.renderCustomTrail(visualState, renderContext);
    }

    ctx.restore();
  }

  /**
   * 弾丸のビジュアル状態をクリーンアップ
   */
  public cleanupBulletVisual(bullet: Bullet): void {
    const bulletId = bullet.getId();
    const visualState = this.visualStates.get(bulletId);

    if (visualState) {
      // パーティクルをプールに戻す
      visualState.particleSystems.forEach(particleSystem => {
        this.returnParticlesToPool(particleSystem.particles);
      });

      this.visualStates.delete(bulletId);
    }
  }

  /**
   * エンチャント効果をビジュアル設定に適用
   */
  private applyEnchantmentEffects(
    baseConfig: BulletVisualConfig,
    enchantments: EnchantmentType[]
  ): BulletVisualConfig {
    let config = { ...baseConfig };

    // 組み合わせ効果をチェック
    const comboConfig = getComboVisualConfig(enchantments);
    if (comboConfig) {
      config = this.mergeVisualConfigs(config, comboConfig.visualOverride);
      config.effects.push(...comboConfig.specialEffects);
      return config;
    }

    // 個別エンチャント効果を適用（優先度順）
    const sortedEnchantments = enchantments
      .map(type => ({ type, config: getEnchantmentVisualConfig(type) }))
      .filter(item => item.config)
      .sort((a, b) => (a.config?.priority ?? 0) - (b.config?.priority ?? 0));

    sortedEnchantments.forEach(({ config: enchantConfig }) => {
      if (enchantConfig) {
        config = this.mergeVisualConfigs(config, enchantConfig.visualModifier);
        config.effects.push(...enchantConfig.additionalEffects);
      }
    });

    return config;
  }

  /**
   * ビジュアル設定をマージ
   */
  private mergeVisualConfigs(
    base: BulletVisualConfig,
    override: Partial<BulletVisualConfig>
  ): BulletVisualConfig {
    const merged = { ...base };

    // 基本プロパティをマージ
    if (override.baseColor) {
      merged.baseColor = { ...merged.baseColor, ...override.baseColor };
    }
    if (override.size !== undefined) {
      merged.size = override.size;
    }
    if (override.shape) {
      merged.shape = override.shape;
    }

    // エフェクトをマージ
    if (override.effects) {
      merged.effects = [...merged.effects, ...override.effects];
    }

    // トレイル設定をマージ
    if (override.trail) {
      merged.trail = { ...merged.trail, ...override.trail };
    }

    // パルス設定をマージ
    if (override.pulse) {
      merged.pulse = { ...merged.pulse, ...override.pulse };
    }

    // 回転設定をマージ
    if (override.rotation) {
      merged.rotation = { ...merged.rotation, ...override.rotation };
    }

    return merged;
  }

  /**
   * 弾丸の基本プロパティを更新
   */
  private updateBulletBasicProperties(
    bullet: Bullet,
    config: BulletVisualConfig
  ): void {
    // 色を設定
    const colorString = this.colorConfigToString(config.baseColor);
    bullet.setType(bullet.getPosition().x, colorString); // 既存のsetTypeメソッドを使用

    // サイズは描画時に適用されるため、ここでは設定しない
  }

  /**
   * カスタムトレイルを描画
   */
  private renderCustomTrail(
    visualState: BulletVisualState,
    context: BulletRenderContext
  ): void {
    const { config } = visualState;
    const { ctx } = context;

    if (!config.trail.enabled) {
      return;
    }

    // カスタムトレイル描画ロジック
    // 既存のBulletクラスのトレイル描画を拡張
    ctx.save();
    ctx.globalAlpha *= 0.8;

    const gradient = ctx.createLinearGradient(
      context.x,
      context.y,
      context.x,
      context.y + config.trail.length * 10
    );

    const trailColor = this.colorConfigToString(config.trail.color);
    gradient.addColorStop(0, trailColor);
    gradient.addColorStop(1, this.setColorAlpha(trailColor, 0));

    ctx.strokeStyle = gradient;
    ctx.lineWidth = config.trail.width;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(context.x, context.y);
    ctx.lineTo(context.x, context.y + config.trail.length * 5);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 弾丸本体を描画
   */
  private renderBulletBody(
    visualState: BulletVisualState,
    context: BulletRenderContext
  ): void {
    const { config } = visualState;
    const { ctx } = context;

    ctx.save();

    // サイズ調整
    ctx.scale(config.size, config.size);

    // 回転
    if (config.rotation.enabled) {
      const rotationAngle =
        visualState.animationTime *
        config.rotation.speed *
        (config.rotation.direction === 'clockwise' ? 1 : -1);
      ctx.rotate(rotationAngle);
    }

    // 形状に応じた描画
    this.renderBulletShape(config, context);

    ctx.restore();
  }

  /**
   * 弾丸の形状を描画
   */
  private renderBulletShape(
    config: BulletVisualConfig,
    context: BulletRenderContext
  ): void {
    const { ctx } = context;
    const centerX = context.width / 2;
    const centerY = context.height / 2;

    ctx.translate(centerX, centerY);

    const baseColor = this.colorConfigToString(config.baseColor);

    switch (config.shape) {
      case 'circle':
        this.renderCircleShape(ctx, centerX, centerY, baseColor);
        break;
      case 'beam':
        this.renderBeamShape(ctx, context.width, context.height, baseColor);
        break;
      case 'missile':
        this.renderMissileShape(ctx, context.width, context.height, baseColor);
        break;
      case 'energy':
        this.renderEnergyShape(ctx, centerX, centerY, baseColor);
        break;
      case 'plasma':
        this.renderPlasmaShape(ctx, centerX, centerY, baseColor);
        break;
    }
  }

  /**
   * 円形弾丸を描画
   */
  private renderCircleShape(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    color: string
  ): void {
    const radius = Math.min(centerX, centerY);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, color);
    gradient.addColorStop(1, this.setColorAlpha(color, 0.8));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * ビーム形状を描画
   */
  private renderBeamShape(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    color: string
  ): void {
    const gradient = ctx.createLinearGradient(0, -height / 2, 0, height / 2);
    gradient.addColorStop(0, this.setColorAlpha(color, 0.2));
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, this.setColorAlpha(color, 0.2));

    ctx.fillStyle = gradient;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 中央の明るいライン
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(-width / 4, -height / 2, width / 2, height);
  }

  /**
   * ミサイル形状を描画
   */
  private renderMissileShape(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    _color: string
  ): void {
    // ミサイル本体
    ctx.fillStyle = '#888888';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // 先端
    ctx.fillStyle = '#aaaaaa';
    ctx.beginPath();
    ctx.moveTo(0, -height / 2);
    ctx.lineTo(-width / 3, -height / 4);
    ctx.lineTo(width / 3, -height / 4);
    ctx.closePath();
    ctx.fill();

    // 推進炎
    const flameGradient = ctx.createLinearGradient(0, height / 2, 0, height);
    flameGradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
    flameGradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.6)');
    flameGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

    ctx.fillStyle = flameGradient;
    ctx.fillRect(-width / 3, height / 2, (width * 2) / 3, height / 2);
  }

  /**
   * エネルギー形状を描画
   */
  private renderEnergyShape(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    color: string
  ): void {
    const size = Math.min(centerX, centerY) * 2;

    // エネルギー球
    for (let i = 0; i < 3; i++) {
      const radius = (size / 2) * (1 - i * 0.2);
      const alpha = 0.8 - i * 0.2;

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      gradient.addColorStop(0, this.setColorAlpha(color, alpha));
      gradient.addColorStop(1, this.setColorAlpha(color, 0));

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // エネルギーの輝き
    const sparkCount = 6;
    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2;
      const sparkLength = size * 0.4;

      ctx.strokeStyle = this.setColorAlpha(color, 0.7);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * size * 0.2, Math.sin(angle) * size * 0.2);
      ctx.lineTo(Math.cos(angle) * sparkLength, Math.sin(angle) * sparkLength);
      ctx.stroke();
    }
  }

  /**
   * プラズマ形状を描画
   */
  private renderPlasmaShape(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    color: string
  ): void {
    const radius = Math.min(centerX, centerY);
    const pulseSize = 1 + Math.sin(Date.now() * 0.005) * 0.3;
    const actualRadius = radius * pulseSize;

    // 外側の光輪
    const outerGradient = ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      actualRadius * 1.5
    );
    outerGradient.addColorStop(0, color);
    outerGradient.addColorStop(0.4, this.setColorAlpha(color, 0.6));
    outerGradient.addColorStop(1, this.setColorAlpha(color, 0));

    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, actualRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 中心コア
    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, actualRadius);
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    coreGradient.addColorStop(0.3, color);
    coreGradient.addColorStop(1, this.setColorAlpha(color, 0.8));

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, actualRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * エフェクトを描画
   */
  private renderEffects(
    visualState: BulletVisualState,
    context: BulletRenderContext
  ): void {
    visualState.config.effects.forEach(effect => {
      this.renderSingleEffect(effect, visualState, context);
    });
  }

  /**
   * 単一エフェクトを描画
   */
  private renderSingleEffect(
    effect: VisualEffectConfig,
    visualState: BulletVisualState,
    context: BulletRenderContext
  ): void {
    const { ctx } = context;

    ctx.save();
    ctx.globalAlpha *= effect.intensity;

    switch (effect.type) {
      case BulletVisualEffectType.GLOW:
        this.renderGlowEffect(effect, context);
        break;
      case BulletVisualEffectType.PULSE:
        this.renderPulseEffect(effect, visualState, context);
        break;
      case BulletVisualEffectType.SPARKLE:
        this.renderSparkleEffect(effect, context);
        break;
      case BulletVisualEffectType.ENERGY_AURA:
        this.renderEnergyAuraEffect(effect, context);
        break;
      case BulletVisualEffectType.ELECTRIC_ARC:
        this.renderElectricArcEffect(effect, context);
        break;
      case BulletVisualEffectType.FROST_MIST:
        this.renderFrostMistEffect(effect, context);
        break;
      // 他のエフェクトタイプも同様に実装
    }

    ctx.restore();
  }

  /**
   * グローエフェクトを描画
   */
  private renderGlowEffect(
    effect: VisualEffectConfig,
    context: BulletRenderContext
  ): void {
    const { ctx } = context;
    const radius =
      Math.max(context.width, context.height) * (effect.size ?? 1.5);

    const gradient = ctx.createRadialGradient(
      context.x,
      context.y,
      0,
      context.x,
      context.y,
      radius
    );

    const color = this.colorConfigToString(effect.color);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, this.setColorAlpha(color, 0));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(context.x, context.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * パルスエフェクトを描画
   */
  private renderPulseEffect(
    effect: VisualEffectConfig,
    visualState: BulletVisualState,
    context: BulletRenderContext
  ): void {
    const { ctx } = context;
    const time = visualState.animationTime;
    const pulseValue = Math.sin(time * 0.01) * 0.5 + 0.5;
    const radius =
      Math.max(context.width, context.height) * (1 + pulseValue * 0.5);

    const gradient = ctx.createRadialGradient(
      context.x,
      context.y,
      0,
      context.x,
      context.y,
      radius
    );

    const color = this.colorConfigToString(effect.color);
    gradient.addColorStop(0, this.setColorAlpha(color, pulseValue * 0.8));
    gradient.addColorStop(1, this.setColorAlpha(color, 0));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(context.x, context.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * スパークルエフェクトを描画
   */
  private renderSparkleEffect(
    effect: VisualEffectConfig,
    context: BulletRenderContext
  ): void {
    const { ctx } = context;
    const sparkCount = 8;
    const time = Date.now() * 0.01;

    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2 + time;
      const distance = 20 + Math.sin(time + i) * 10;
      const x = context.x + Math.cos(angle) * distance;
      const y = context.y + Math.sin(angle) * distance;

      ctx.fillStyle = this.colorConfigToString(effect.color);
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * エネルギーオーラエフェクトを描画
   */
  private renderEnergyAuraEffect(
    effect: VisualEffectConfig,
    context: BulletRenderContext
  ): void {
    const { ctx } = context;
    const radius = Math.max(context.width, context.height) * 2;

    const gradient = ctx.createRadialGradient(
      context.x,
      context.y,
      radius * 0.3,
      context.x,
      context.y,
      radius
    );

    const color = this.colorConfigToString(effect.color);
    gradient.addColorStop(0, this.setColorAlpha(color, 0));
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, this.setColorAlpha(color, 0));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(context.x, context.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 電気アークエフェクトを描画
   */
  private renderElectricArcEffect(
    effect: VisualEffectConfig,
    context: BulletRenderContext
  ): void {
    const { ctx } = context;
    const arcCount = 4;

    ctx.strokeStyle = this.colorConfigToString(effect.color);
    ctx.lineWidth = 2;

    for (let i = 0; i < arcCount; i++) {
      const startAngle = (i / arcCount) * Math.PI * 2;
      const endAngle = startAngle + Math.PI / 4;
      const radius = 15 + Math.random() * 10;

      const startX = context.x + Math.cos(startAngle) * radius;
      const startY = context.y + Math.sin(startAngle) * radius;
      const endX = context.x + Math.cos(endAngle) * radius;
      const endY = context.y + Math.sin(endAngle) * radius;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }

  /**
   * 霜の霧エフェクトを描画
   */
  private renderFrostMistEffect(
    effect: VisualEffectConfig,
    context: BulletRenderContext
  ): void {
    const { ctx } = context;
    const mistCount = 6;

    for (let i = 0; i < mistCount; i++) {
      const angle = (i / mistCount) * Math.PI * 2;
      const distance = 10 + Math.random() * 15;
      const x = context.x + Math.cos(angle) * distance;
      const y = context.y + Math.sin(angle) * distance;
      const size = 3 + Math.random() * 4;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      const color = this.colorConfigToString(effect.color);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, this.setColorAlpha(color, 0));

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * パーティクルを描画
   */
  private renderParticles(
    visualState: BulletVisualState,
    context: BulletRenderContext
  ): void {
    visualState.particleSystems.forEach(particleSystem => {
      this.renderParticleSystem(particleSystem, context);
    });
  }

  /**
   * パーティクルシステムを描画
   */
  private renderParticleSystem(
    particleSystem: ParticleSystem,
    context: BulletRenderContext
  ): void {
    const { ctx } = context;

    particleSystem.particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha *= particle.alpha;

      const color = this.colorConfigToString(particle.color);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  /**
   * パーティクルシステムを更新
   */
  private updateParticleSystem(
    particleSystem: ParticleSystem,
    deltaTime: number,
    bullet: Bullet
  ): void {
    const currentTime = Date.now();

    // パフォーマンスモードでは生成頻度を下げる
    const emitInterval = this.performanceMode ? 200 : 100;

    // 新しいパーティクルを生成（総数制限付き）
    if (currentTime - particleSystem.lastEmitTime > emitInterval) {
      const totalParticles = this.getTotalActiveParticles();
      if (totalParticles < this.maxActiveParticles) {
        this.emitParticles(particleSystem, bullet);
      }
      particleSystem.lastEmitTime = currentTime;
    }

    // 既存のパーティクルを更新
    particleSystem.particles = particleSystem.particles.filter(particle => {
      particle.x += particle.vx * deltaTime * 0.001;
      particle.y += particle.vy * deltaTime * 0.001;
      particle.life += deltaTime;
      particle.alpha = Math.max(0, 1 - particle.life / particle.maxLife);

      return particle.life < particle.maxLife;
    });
  }

  /**
   * パーティクルを生成
   */
  private emitParticles(particleSystem: ParticleSystem, bullet: Bullet): void {
    const { config } = particleSystem;
    const bulletPos = bullet.getPosition();

    const maxEmit = this.performanceMode ? 1 : Math.min(config.count, 2);
    for (let i = 0; i < maxEmit; i++) {
      // パフォーマンスモードでは1個、通常は最大2個まで
      const angle = Math.random() * config.spread - config.spread / 2;
      const speed = config.speed * (0.5 + Math.random() * 0.5);

      const particle: Particle = {
        x: bulletPos.x,
        y: bulletPos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: config.lifetime,
        size: config.size,
        color: config.color,
        alpha: 1.0,
      };

      particleSystem.particles.push(particle);
    }
  }

  /**
   * パーティクルをプールに戻す
   */
  private returnParticlesToPool(particles: Particle[]): void {
    particles.forEach(particle => {
      const poolKey = 'default';
      if (!this.particlePools.has(poolKey)) {
        this.particlePools.set(poolKey, []);
      }

      const pool = this.particlePools.get(poolKey)!;
      if (pool.length < this.maxParticlePoolSize) {
        // パーティクルをリセット
        particle.life = 0;
        particle.alpha = 1.0;
        pool.push(particle);
      }
    });
  }

  /**
   * アクティブなパーティクル総数を取得
   */
  private getTotalActiveParticles(): number {
    let total = 0;
    this.visualStates.forEach(visualState => {
      visualState.particleSystems.forEach(particleSystem => {
        total += particleSystem.particles.length;
      });
    });
    return total;
  }

  /**
   * パフォーマンスモードを設定
   */
  public setPerformanceMode(enabled: boolean): void {
    this.performanceMode = enabled;
  }

  /**
   * ColorConfigを文字列に変換
   */
  private colorConfigToString(colorConfig: ColorConfig): string {
    const { primary, alpha = 1.0 } = colorConfig;

    if (primary.startsWith('#')) {
      // HEX色をRGBAに変換
      const hex = primary.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // すでにrgba形式の場合はアルファ値を調整
    if (primary.startsWith('rgba(')) {
      return primary.replace(/,\s*[\d.]+\)$/, `, ${alpha})`);
    }

    // rgb形式の場合はrgbaに変換
    if (primary.startsWith('rgb(')) {
      return primary.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    }

    return primary;
  }

  /**
   * 色文字列のアルファ値を安全に変更
   */
  private setColorAlpha(color: string, alpha: number): string {
    // rgba形式の場合
    if (color.startsWith('rgba(')) {
      return color.replace(/,\s*[\d.]+\)$/, `, ${alpha})`);
    }

    // rgb形式の場合
    if (color.startsWith('rgb(')) {
      return color.replace(')', `, ${alpha})`).replace('rgb(', 'rgba(');
    }

    // hex形式の場合
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // その他の場合はそのまま返す
    return color;
  }

  /**
   * 全てのビジュアル状態をクリーンアップ
   */
  public cleanup(): void {
    this.visualStates.forEach((visualState, _bulletId) => {
      visualState.particleSystems.forEach(particleSystem => {
        this.returnParticlesToPool(particleSystem.particles);
      });
    });

    this.visualStates.clear();
    this.particlePools.clear();
  }

  /**
   * 統計情報を取得
   */
  public getStats(): {
    activeVisualStates: number;
    totalParticles: number;
    pooledParticles: number;
    performanceMode: boolean;
    maxActiveParticles: number;
  } {
    let totalParticles = 0;
    let pooledParticles = 0;

    this.visualStates.forEach(visualState => {
      visualState.particleSystems.forEach(particleSystem => {
        totalParticles += particleSystem.particles.length;
      });
    });

    this.particlePools.forEach(pool => {
      pooledParticles += pool.length;
    });

    return {
      activeVisualStates: this.visualStates.size,
      totalParticles,
      pooledParticles,
      performanceMode: this.performanceMode,
      maxActiveParticles: this.maxActiveParticles,
    };
  }

  /**
   * 追尾状態の特別なエフェクトを描画（無効化）
   */
  private renderTrackingEffects(
    _bullet: Bullet,
    _context: BulletRenderContext
  ): void {
    // 追尾線エフェクトは不要のため無効化
    return;
  }
}
