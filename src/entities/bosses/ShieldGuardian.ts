import { GameConfig, createGameConfig } from '../../config/GameConfigFactory';
import { IGameEngine } from '../../interfaces/IGameEngine';
import { Boss } from '../Boss';
import { BossBullet } from '../BossBullet';
import {
  createAdvancedBullet,
  AdvancedBulletType,
  ReflectingBullet,
  SplitBullet,
} from '../bullets';
import { Player } from '../Player';

/**
 * シールド・ガーディアンボス
 * Wave 16-21に登場する防御特化型ボス
 * 多層シールドシステムによる持久戦を特徴とする
 */
export class ShieldGuardian extends Boss {
  // フェーズ管理
  private currentPhase: 1 | 2 | 3 = 1;
  private maxHealth: number;

  // シールドシステム
  private guardianShields: Array<{
    health: number;
    maxHealth: number;
    isActive: boolean;
    rotation: number;
    pulsePhase: number;
  }> = [];
  private finalShield: {
    health: number;
    maxHealth: number;
    isActive: boolean;
    rotation: number;
    pulsePhase: number;
  } | null = null;

  // 攻撃パターン用
  private lastAttackTime: number = 0;
  private player?: Player;

  // 視覚エフェクト
  private phaseTransitionEffect: number = 0;
  private isTransitioning: boolean = false;
  private shieldBreakEffect: number = 0;
  private isShieldBreaking: boolean = false;

  // フェーズ別攻撃間隔
  private readonly PHASE1_INTERVAL = 1500; // 1.5秒間隔
  private readonly PHASE2_INTERVAL = 1000; // 1.0秒間隔
  private readonly PHASE3_INTERVAL = 600; // 0.6秒間隔

  constructor(game: IGameEngine, config?: GameConfig, player?: Player) {
    const gameConfig = config ?? createGameConfig();

    // シールド・ガーディアンの設定
    const guardianConfig = {
      ...gameConfig,
      boss: {
        ...gameConfig.boss,
        width: 60, // 設計書通りのサイズ
        height: 50,
        initialHealth: 100, // 体力100
        movementSpeed: gameConfig.boss.movementSpeed * 0.8, // 移動速度0.8倍
        fireRate: 1500, // 基本発射間隔
        bulletSpeed: gameConfig.boss.bulletSpeed * 1.5, // 攻撃力1.5倍
      },
    };

    super(game, guardianConfig);
    this.maxHealth = guardianConfig.boss.initialHealth;
    this.player = player;
    this.initializeShieldSystem();
  }

  /**
   * シールドシステムを初期化
   */
  private initializeShieldSystem(): void {
    // フェーズ1用の3層シールド
    for (let i = 0; i < 3; i++) {
      this.guardianShields.push({
        health: 20,
        maxHealth: 20,
        isActive: true,
        rotation: (i * Math.PI * 2) / 3,
        pulsePhase: (i * Math.PI) / 3,
      });
    }
  }

  /**
   * プレイヤー参照を設定
   */
  public setPlayer(player: Player): void {
    this.player = player;
  }

  public update(deltaTime: number): void {
    super.update(deltaTime);

    this.updatePhase();
    this.updateShieldSystem(deltaTime);
    this.updateVisualEffects(deltaTime);
    this.updateAttackPattern(deltaTime);
  }

  /**
   * 現在の体力に基づいてフェーズを更新
   */
  private updatePhase(): void {
    const healthPercentage = this.getHealthPercentage();
    const newPhase = this.calculatePhase(healthPercentage);

    if (newPhase !== this.currentPhase) {
      console.log(
        `[DEBUG] ShieldGuardian: Phase transition ${this.currentPhase} -> ${newPhase} (Health: ${this.getHealthPercentage().toFixed(2)})`
      );
      this.triggerPhaseTransition(newPhase);
    }
  }

  /**
   * 体力パーセンテージからフェーズを計算
   */
  private calculatePhase(healthPercentage: number): 1 | 2 | 3 {
    if (healthPercentage > 0.67) return 1;
    if (healthPercentage > 0.34) return 2;
    return 3;
  }

  /**
   * 体力パーセンテージを取得
   */
  private getHealthPercentage(): number {
    return this.getCurrentHealth() / this.maxHealth;
  }

  /**
   * 現在の体力を取得（推定値）
   */
  private getCurrentHealth(): number {
    // 実装の簡略化のため、フェーズから逆算
    switch (this.currentPhase) {
      case 1:
        return Math.floor(this.maxHealth * 0.8); // 80%と仮定
      case 2:
        return Math.floor(this.maxHealth * 0.5); // 50%と仮定
      case 3:
        return Math.floor(this.maxHealth * 0.2); // 20%と仮定
      default:
        return this.maxHealth;
    }
  }

  /**
   * フェーズ移行をトリガー
   */
  private triggerPhaseTransition(newPhase: 1 | 2 | 3): void {
    this.currentPhase = newPhase;
    this.isTransitioning = true;
    this.phaseTransitionEffect = 0;
    this.lastAttackTime = Date.now();

    // フェーズ3で最終シールドを展開
    if (newPhase === 3 && !this.finalShield) {
      this.finalShield = {
        health: 50,
        maxHealth: 50,
        isActive: true,
        rotation: 0,
        pulsePhase: 0,
      };
    }
  }

  /**
   * シールドシステムを更新
   */
  private updateShieldSystem(deltaTime: number): void {
    // 通常シールドの更新
    this.guardianShields.forEach(shield => {
      if (shield.isActive) {
        shield.rotation += deltaTime * 0.5;
        shield.pulsePhase += deltaTime * 2;
      }
    });

    // 最終シールドの更新
    if (this.finalShield?.isActive) {
      this.finalShield.rotation += deltaTime * 0.3;
      this.finalShield.pulsePhase += deltaTime * 1.5;
    }
  }

  /**
   * 視覚エフェクトを更新
   */
  private updateVisualEffects(deltaTime: number): void {
    if (this.isTransitioning) {
      this.phaseTransitionEffect += deltaTime * 4;
      if (this.phaseTransitionEffect > Math.PI * 2) {
        this.isTransitioning = false;
      }
    }

    if (this.isShieldBreaking) {
      this.shieldBreakEffect += deltaTime * 6;
      if (this.shieldBreakEffect > Math.PI) {
        this.isShieldBreaking = false;
      }
    }
  }

  /**
   * 攻撃パターンを更新
   */
  private updateAttackPattern(_deltaTime: number): void {
    if (this.isTransitioning) return;

    const currentTime = Date.now();

    switch (this.currentPhase) {
      case 1:
        this.updatePhase1Attack(currentTime);
        break;
      case 2:
        this.updatePhase2Attack(currentTime);
        break;
      case 3:
        this.updatePhase3Attack(currentTime);
        break;
    }
  }

  /**
   * フェーズ1: シールド展開中の反射弾攻撃
   */
  private updatePhase1Attack(currentTime: number): void {
    if (currentTime - this.lastAttackTime >= this.PHASE1_INTERVAL) {
      this.executeReflectingAttack();
      this.lastAttackTime = currentTime;
    }
  }

  /**
   * フェーズ2: 反撃モードの爆発弾攻撃
   */
  private updatePhase2Attack(currentTime: number): void {
    if (currentTime - this.lastAttackTime >= this.PHASE2_INTERVAL) {
      this.executeExplosiveAttack();
      this.lastAttackTime = currentTime;
    }
  }

  /**
   * フェーズ3: 最後の砦の分身弾攻撃
   */
  private updatePhase3Attack(currentTime: number): void {
    if (currentTime - this.lastAttackTime >= this.PHASE3_INTERVAL) {
      this.executeSplitAttack();
      this.lastAttackTime = currentTime;
    }
  }

  /**
   * 反射弾攻撃を実行（5方向）
   */
  private executeReflectingAttack(): void {
    const bossCenterX = this.x + this.width / 2;
    const bossCenterY = this.y + this.height;
    const directions = 5;

    for (let i = 0; i < directions; i++) {
      const angle = (Math.PI / 4) * (i - 2); // -π/2 から π/2 の範囲で5方向
      const speed = this.getConfig().boss.bulletSpeed;
      const speedX = Math.sin(angle) * speed;
      const speedY = Math.cos(angle) * speed;

      const reflectingBullet = createAdvancedBullet(
        {
          type: AdvancedBulletType.REFLECTING,
          x: bossCenterX,
          y: bossCenterY,
          speedX,
          speedY,
          specialParams: {
            maxReflections: 2,
          },
        },
        this.getConfig()
      ) as ReflectingBullet;

      this.addBulletToGame(reflectingBullet);
    }
  }

  /**
   * 爆発弾攻撃を実行（3方向）
   */
  private executeExplosiveAttack(): void {
    if (!this.player) return;

    const bossCenterX = this.x + this.width / 2;
    const bossCenterY = this.y + this.height;
    const playerPos = this.player.getPosition();

    // プレイヤー方向への角度を計算
    const dx = playerPos.x + this.player.getWidth() / 2 - bossCenterX;
    const dy = playerPos.y + this.player.getHeight() / 2 - bossCenterY;
    const baseAngle = Math.atan2(dy, dx);

    // 3方向に拡散
    for (let i = -1; i <= 1; i++) {
      const angle = baseAngle + (i * Math.PI) / 6; // ±30度の拡散
      const speed = this.getConfig().boss.bulletSpeed * 1.2;
      const speedX = Math.cos(angle) * speed;
      const speedY = Math.sin(angle) * speed;

      const bullet = this.createBossBullet(
        bossCenterX,
        bossCenterY,
        speedX,
        speedY
      );
      this.addBulletToGame(bullet);
    }
  }

  /**
   * 分身弾攻撃を実行
   */
  private executeSplitAttack(): void {
    const bossCenterX = this.x + this.width / 2;
    const bossCenterY = this.y + this.height;
    const speed = this.getConfig().boss.bulletSpeed * 0.8;

    // 下方向に分身弾を発射
    const splitBullet = createAdvancedBullet(
      {
        type: AdvancedBulletType.SPLIT,
        x: bossCenterX,
        y: bossCenterY,
        speedX: 0,
        speedY: speed,
        specialParams: {
          splitDelay: 1000,
          splitCount: 4,
          splitAngleSpread: Math.PI / 2,
        },
      },
      this.getConfig()
    ) as SplitBullet;

    this.addBulletToGame(splitBullet);
  }

  /**
   * ダメージを受ける処理をオーバーライド
   */
  public takeDamage(): boolean {
    // シールドが有効な場合はシールドにダメージ
    if (this.hasActiveShield()) {
      return this.damageShield();
    }

    // シールドがない場合は本体にダメージ
    return super.takeDamage();
  }

  /**
   * アクティブなシールドがあるかチェック
   */
  private hasActiveShield(): boolean {
    // 最終シールドをチェック
    if (
      this.finalShield &&
      this.finalShield.isActive &&
      this.finalShield.health > 0
    ) {
      return true;
    }

    // 通常シールドをチェック
    return this.guardianShields.some(
      shield => shield.isActive && shield.health > 0
    );
  }

  /**
   * シールドにダメージを与える
   */
  private damageShield(): boolean {
    // 最終シールドを優先
    if (
      this.finalShield &&
      this.finalShield.isActive &&
      this.finalShield.health > 0
    ) {
      this.finalShield.health--;
      if (this.finalShield.health <= 0) {
        this.finalShield.isActive = false;
        this.triggerShieldBreakEffect();
      }
      return false; // ボス本体は無傷
    }

    // 通常シールドにダメージ
    for (const shield of this.guardianShields) {
      if (shield.isActive && shield.health > 0) {
        shield.health--;
        if (shield.health <= 0) {
          shield.isActive = false;
          this.triggerShieldBreakEffect();
        }
        return false; // ボス本体は無傷
      }
    }

    return false;
  }

  /**
   * シールド破壊エフェクトをトリガー
   */
  private triggerShieldBreakEffect(): void {
    this.isShieldBreaking = true;
    this.shieldBreakEffect = 0;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

    // フェーズ移行エフェクト
    if (this.isTransitioning) {
      this.drawPhaseTransitionEffect(ctx);
    }

    // シールド破壊エフェクト
    if (this.isShieldBreaking) {
      this.drawShieldBreakEffect(ctx);
    }

    // シールドガーディアンのメインボディ
    this.drawGuardianBody(ctx);

    // シールドシステム
    this.drawShieldSystem(ctx);

    // フェーズインジケーター
    this.drawPhaseIndicator(ctx);

    ctx.restore();
    this.drawGuardianHealthBar(ctx);
  }

  /**
   * シールド・ガーディアンのメインボディを描画
   */
  private drawGuardianBody(ctx: CanvasRenderingContext2D): void {
    const baseRadius = this.width / 2.2;

    // 青緑のグラデーション（#008B8B）
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 1.4);
    gradient.addColorStop(0, '#20B2AA'); // ライトシーグリーン
    gradient.addColorStop(0.4, '#008B8B'); // ダークターコイズ（メインカラー）
    gradient.addColorStop(1, '#2F4F4F'); // ダークスレートグレー

    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#40E0D0'; // ターコイズ
    ctx.lineWidth = 3;

    // 防御的な六角形デザイン
    const vertices = 6;
    ctx.beginPath();
    for (let i = 0; i < vertices; i++) {
      const angle = (i / vertices) * Math.PI * 2;
      const radius = baseRadius;

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.9;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 中央のコア
    ctx.fillStyle = '#40E0D0';
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * シールドシステムを描画
   */
  private drawShieldSystem(ctx: CanvasRenderingContext2D): void {
    // 通常シールドの描画
    this.guardianShields.forEach((shield, index) => {
      if (shield.isActive && shield.health > 0) {
        this.drawShieldLayer(ctx, shield, 40 + index * 15, index);
      }
    });

    // 最終シールドの描画
    if (
      this.finalShield &&
      this.finalShield.isActive &&
      this.finalShield.health > 0
    ) {
      this.drawFinalShield(ctx, this.finalShield);
    }
  }

  /**
   * シールド層を描画
   */
  private drawShieldLayer(
    ctx: CanvasRenderingContext2D,
    shield: {
      health: number;
      maxHealth: number;
      rotation: number;
      pulsePhase: number;
    },
    radius: number,
    layerIndex: number
  ): void {
    const healthRatio = shield.health / shield.maxHealth;
    const opacity = Math.sin(shield.pulsePhase) * 0.2 + 0.5;
    const alpha = Math.floor(opacity * healthRatio * 255)
      .toString(16)
      .padStart(2, '0');

    ctx.strokeStyle = `#008B8B${alpha}`;
    ctx.lineWidth = 3 - layerIndex * 0.5;

    // 六角形シールド
    ctx.beginPath();
    const segments = 6;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2 + shield.rotation;
      const wave = Math.sin(angle * 2 + shield.pulsePhase) * 3;
      const currentRadius = radius + wave;

      const x = Math.cos(angle) * currentRadius;
      const y = Math.sin(angle) * currentRadius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  /**
   * 最終シールドを描画
   */
  private drawFinalShield(
    ctx: CanvasRenderingContext2D,
    shield: {
      health: number;
      maxHealth: number;
      rotation: number;
      pulsePhase: number;
    }
  ): void {
    const healthRatio = shield.health / shield.maxHealth;
    const intensity = Math.sin(shield.pulsePhase) * 0.3 + 0.7;
    const alpha = Math.floor(intensity * healthRatio * 255)
      .toString(16)
      .padStart(2, '0');

    ctx.strokeStyle = `#FF6347${alpha}`; // トマト色で最終シールドを強調
    ctx.lineWidth = 4;

    // より強固な八角形シールド
    ctx.beginPath();
    const segments = 8;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2 + shield.rotation;
      const wave = Math.sin(angle * 3 + shield.pulsePhase) * 5;
      const radius = 70 + wave;

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // 最終シールドの内部エネルギー
    ctx.fillStyle = `rgba(255, 99, 71, ${intensity * healthRatio * 0.2})`;
    ctx.beginPath();
    ctx.arc(0, 0, 65, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * フェーズインジケーターを描画
   */
  private drawPhaseIndicator(ctx: CanvasRenderingContext2D): void {
    const indicatorY = -this.height / 2 - 25;

    for (let i = 1; i <= 3; i++) {
      const x = (i - 2) * 15;
      const active = i === this.currentPhase;

      ctx.fillStyle = active ? '#008B8B' : 'rgba(0, 139, 139, 0.3)';
      ctx.fillRect(x - 5, indicatorY, 10, 5);

      if (active) {
        ctx.fillStyle = 'rgba(64, 224, 208, 0.8)';
        ctx.fillRect(x - 3, indicatorY + 1, 6, 3);
      }
    }
  }

  /**
   * フェーズ移行エフェクトを描画
   */
  private drawPhaseTransitionEffect(ctx: CanvasRenderingContext2D): void {
    const pulseSize = Math.sin(this.phaseTransitionEffect) * 25;
    const alpha = Math.sin(this.phaseTransitionEffect * 2) * 0.5 + 0.5;

    ctx.strokeStyle = `rgba(0, 139, 139, ${alpha})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2 + pulseSize, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * シールド破壊エフェクトを描画
   */
  private drawShieldBreakEffect(ctx: CanvasRenderingContext2D): void {
    const explosionSize = Math.sin(this.shieldBreakEffect) * 30;
    const alpha = 1 - this.shieldBreakEffect / Math.PI;

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 2;

    // 破壊の衝撃波
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const startRadius = 20;
      const endRadius = startRadius + explosionSize;

      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * startRadius, Math.sin(angle) * startRadius);
      ctx.lineTo(Math.cos(angle) * endRadius, Math.sin(angle) * endRadius);
      ctx.stroke();
    }
  }

  /**
   * 体力バーを描画（オーバーライド）
   */
  private drawGuardianHealthBar(ctx: CanvasRenderingContext2D): void {
    const healthPercentage = this.getHealthPercentage();
    const barWidth = this.width + 20;
    const barHeight = 10;

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(this.x - 10, this.y - 40, barWidth, barHeight + 4);

    // フェーズに応じた色のグラデーション
    const gradient = ctx.createLinearGradient(
      this.x - 8,
      0,
      this.x - 8 + barWidth - 4,
      0
    );

    switch (this.currentPhase) {
      case 1:
        gradient.addColorStop(0, '#008B8B');
        gradient.addColorStop(1, '#20B2AA');
        break;
      case 2:
        gradient.addColorStop(0, '#FF4500');
        gradient.addColorStop(1, '#FF8C00');
        break;
      case 3:
        gradient.addColorStop(0, '#FF6347');
        gradient.addColorStop(1, '#FF7F50');
        break;
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(
      this.x - 8,
      this.y - 38,
      (barWidth - 4) * healthPercentage,
      barHeight
    );

    // 枠
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x - 8, this.y - 38, barWidth - 4, barHeight);

    // シールド状態インジケーター
    this.drawShieldStatusIndicator(ctx);
  }

  /**
   * シールド状態インジケーターを描画
   */
  private drawShieldStatusIndicator(ctx: CanvasRenderingContext2D): void {
    const indicatorY = this.y - 50;
    let x = this.x - 8;

    // 通常シールドの状態
    this.guardianShields.forEach((shield, _index) => {
      const healthRatio = shield.isActive
        ? shield.health / shield.maxHealth
        : 0;
      ctx.fillStyle =
        healthRatio > 0
          ? `rgba(0, 139, 139, ${healthRatio})`
          : 'rgba(100, 100, 100, 0.3)';
      ctx.fillRect(x, indicatorY, 8, 4);
      x += 10;
    });

    // 最終シールドの状態
    if (this.finalShield) {
      const healthRatio = this.finalShield.isActive
        ? this.finalShield.health / this.finalShield.maxHealth
        : 0;
      ctx.fillStyle =
        healthRatio > 0
          ? `rgba(255, 99, 71, ${healthRatio})`
          : 'rgba(100, 100, 100, 0.3)';
      ctx.fillRect(x + 5, indicatorY, 12, 4);
    }
  }

  /**
   * 現在のフェーズを取得
   */
  public getCurrentPhase(): 1 | 2 | 3 {
    return this.currentPhase;
  }

  /**
   * シールド状態を取得
   */
  public getShieldStatus(): {
    normalShields: Array<{
      health: number;
      maxHealth: number;
      isActive: boolean;
    }>;
    finalShield: {
      health: number;
      maxHealth: number;
      isActive: boolean;
    } | null;
  } {
    return {
      normalShields: this.guardianShields.map(shield => ({
        health: shield.health,
        maxHealth: shield.maxHealth,
        isActive: shield.isActive,
      })),
      finalShield: this.finalShield
        ? {
            health: this.finalShield.health,
            maxHealth: this.finalShield.maxHealth,
            isActive: this.finalShield.isActive,
          }
        : null,
    };
  }

  /**
   * ゲームエンジンの参照を取得
   */
  private getGame(): IGameEngine {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return (this as any).game;
  }

  /**
   * 設定を取得
   */
  private getConfig(): GameConfig {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return (this as any).config;
  }

  /**
   * BossBulletを作成するヘルパーメソッド
   */
  private createBossBullet(
    x: number,
    y: number,
    speedX: number,
    speedY: number
  ): BossBullet {
    return new BossBullet(x, y, speedX, speedY, this.getConfig());
  }

  /**
   * 弾丸をゲームに追加するヘルパーメソッド
   */
  private addBulletToGame(bullet: BossBullet): void {
    this.getGame().addBossBullet(bullet);
  }
}
