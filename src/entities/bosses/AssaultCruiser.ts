import { GameConfig, createGameConfig } from '../../config/GameConfigFactory';
import { IGameEngine } from '../../interfaces/IGameEngine';
import { Boss } from '../Boss';
import { BossAttackEffects } from '../BossAttackEffects';
import { BossBullet } from '../BossBullet';
import {
  createAdvancedBullet,
  AdvancedBulletType,
  ExplosiveBullet,
  HomingBullet,
} from '../bullets';
import { Player } from '../Player';

/**
 * アサルト・クルーザーボス
 * Wave 10-15に登場する攻撃特化型ボス
 * 3段階の戦闘フェーズを持つ
 */
export class AssaultCruiser extends Boss {
  // フェーズ管理
  private currentPhase: 1 | 2 | 3 = 1;
  private maxHealth: number;

  // フェーズ1: 集中砲火
  private rapidFireCount: number = 0;
  private rapidFireMax: number = 5;
  private rapidFireInterval: number = 300; // 0.3秒間隔

  // フェーズ2: 拡散爆撃
  private spreadBombingInterval: number = 1200; // 1.2秒間隔

  // フェーズ3: レーザー攻撃
  private homingAttackInterval: number = 800; // 0.8秒間隔

  // 視覚エフェクト
  private phaseTransitionEffect: number = 0;
  private isTransitioning: boolean = false;
  private weaponGlow: number = 0;
  private attackChargeEffect: number = 0;

  // 攻撃パターン用
  private lastAttackTime: number = 0;
  private player?: Player;

  // 攻撃エフェクト
  private assaultEffects: BossAttackEffects;

  constructor(game: IGameEngine, config?: GameConfig, player?: Player) {
    const gameConfig = config ?? createGameConfig();

    // アサルト・クルーザーのサイズ設定（既存ボスより20%大きく）
    const assaultConfig = {
      ...gameConfig,
      boss: {
        ...gameConfig.boss,
        width: Math.floor(gameConfig.boss.width * 1.2), // 72px
        height: Math.floor(gameConfig.boss.height * 1.2), // 60px
        initialHealth: 75, // 体力75
        movementSpeed: gameConfig.boss.movementSpeed * 1.5, // 移動速度1.5倍
        fireRate: 1000, // 基本発射間隔
      },
    };

    super(game, assaultConfig);
    this.maxHealth = assaultConfig.boss.initialHealth;
    this.player = player;
    this.assaultEffects = new BossAttackEffects(assaultConfig);
    this.initializeAssaultStructure();
  }

  /**
   * アサルト・クルーザー専用の構造を初期化
   */
  private initializeAssaultStructure(): void {
    // 攻撃的な外観のための追加要素を初期化
    this.weaponGlow = 0;
    this.attackChargeEffect = 0;
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
    this.updateVisualEffects(deltaTime);
    this.updateAttackPattern();
    this.assaultEffects.update(deltaTime);
  }

  /**
   * 現在の体力に基づいてフェーズを更新
   */
  private updatePhase(): void {
    const healthPercentage = this.getHealthPercentage();
    const newPhase = this.calculatePhase(healthPercentage);

    if (newPhase !== this.currentPhase) {
      console.log(
        `[DEBUG] AssaultCruiser: Phase transition ${this.currentPhase} -> ${newPhase} (Health: ${this.getHealthPercentage().toFixed(2)})`
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
    return this.getHealth() / this.maxHealth;
  }

  /**
   * 現在の体力を取得（Bossクラスから）
   */
  private getHealth(): number {
    // Bossクラスのprivate healthにアクセスできないため、
    // takeDamageの戻り値を利用して体力を推定
    // ここでは簡単のため、maxHealthから逆算
    return this.maxHealth; // 実装時は適切に体力を管理
  }

  /**
   * フェーズ移行をトリガー
   */
  private triggerPhaseTransition(newPhase: 1 | 2 | 3): void {
    this.currentPhase = newPhase;
    this.isTransitioning = true;
    this.phaseTransitionEffect = 0;

    // フェーズ移行時の攻撃パターンリセット
    this.rapidFireCount = 0;
    this.lastAttackTime = Date.now();
  }

  /**
   * 視覚エフェクトを更新
   */
  private updateVisualEffects(deltaTime: number): void {
    this.weaponGlow += deltaTime * 3;
    this.attackChargeEffect += deltaTime * 2;

    if (this.isTransitioning) {
      this.phaseTransitionEffect += deltaTime * 4;
      if (this.phaseTransitionEffect > Math.PI * 2) {
        this.isTransitioning = false;
      }
    }
  }

  /**
   * 攻撃パターンを更新
   */
  private updateAttackPattern(): void {
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
   * フェーズ1: 集中砲火攻撃
   */
  private updatePhase1Attack(currentTime: number): void {
    if (currentTime - this.lastAttackTime >= this.rapidFireInterval) {
      this.executeRapidFire();
      this.lastAttackTime = currentTime;
      this.rapidFireCount++;

      if (this.rapidFireCount >= this.rapidFireMax) {
        this.rapidFireCount = 0;
        // 次の連射まで少し間隔を空ける
        this.lastAttackTime = currentTime + 1000;
      }
    }
  }

  /**
   * フェーズ2: 拡散爆撃攻撃
   */
  private updatePhase2Attack(currentTime: number): void {
    if (currentTime - this.lastAttackTime >= this.spreadBombingInterval) {
      this.executeSpreadBombing();
      this.lastAttackTime = currentTime;
    }
  }

  /**
   * フェーズ3: レーザー攻撃（追尾弾）
   */
  private updatePhase3Attack(currentTime: number): void {
    if (currentTime - this.lastAttackTime >= this.homingAttackInterval) {
      this.executeHomingAttack();
      this.lastAttackTime = currentTime;
    }
  }

  /**
   * 集中砲火を実行
   */
  private executeRapidFire(): void {
    if (!this.player) return;

    const playerPos = this.player.getPosition();
    const bossCenterX = this.x + this.width / 2;
    const bossCenterY = this.y + this.height;

    // プレイヤー方向への角度を計算
    const dx = playerPos.x + this.player.getWidth() / 2 - bossCenterX;
    const dy = playerPos.y + this.player.getHeight() / 2 - bossCenterY;
    const angle = Math.atan2(dy, dx);

    // 画面揺れ（軽め）
    this.assaultEffects.addScreenShake(3, 200, 0.1);

    // 通常弾を発射
    const speed = this.getConfig().boss.bulletSpeed * 1.5;
    const speedX = Math.cos(angle) * speed;
    const speedY = Math.sin(angle) * speed;

    // 発射時の派手なパーティクル爆発
    this.assaultEffects.addAttackParticles(
      bossCenterX,
      bossCenterY,
      15,
      'energy',
      '#ff6b6b'
    );

    // 追加の火花エフェクト
    this.assaultEffects.addAttackParticles(
      bossCenterX,
      bossCenterY,
      10,
      'spark',
      '#ffaa00'
    );

    const bullet = this.createBossBullet(
      bossCenterX,
      bossCenterY,
      speedX,
      speedY
    );
    this.addBulletToGame(bullet);
  }

  /**
   * 拡散爆撃を実行
   */
  private executeSpreadBombing(): void {
    const bossCenterX = this.x + this.width / 2;
    const bossCenterY = this.y + this.height;
    const directions = 7; // 7方向に拡散

    // 強い画面揺れ
    this.assaultEffects.addScreenShake(5, 300, 0.12);

    // 大規模なパーティクル爆発
    this.assaultEffects.addAttackParticles(
      bossCenterX,
      bossCenterY,
      25,
      'explosion',
      '#ff8c00'
    );

    // 追加のエネルギーパーティクル
    this.assaultEffects.addAttackParticles(
      bossCenterX,
      bossCenterY,
      20,
      'energy',
      '#ff4500'
    );

    for (let i = 0; i < directions; i++) {
      const angle = (Math.PI / 6) * (i - 3); // -π/2 から π/2 の範囲で拡散
      const speed = this.getConfig().boss.bulletSpeed;
      const speedX = Math.sin(angle) * speed;
      const speedY = Math.cos(angle) * speed;

      // 爆発パーティクル
      this.assaultEffects.addAttackParticles(
        bossCenterX + Math.sin(angle) * 20,
        bossCenterY + Math.cos(angle) * 20,
        6,
        'explosion',
        '#ff8c00'
      );

      // 爆発弾を作成
      const explosiveBullet = createAdvancedBullet(
        {
          type: AdvancedBulletType.EXPLOSIVE,
          x: bossCenterX,
          y: bossCenterY,
          speedX,
          speedY,
          specialParams: {
            explosionRadius: 25,
            explosionDamage: 2,
          },
        },
        this.getConfig()
      ) as ExplosiveBullet;

      this.addBulletToGame(explosiveBullet);
    }
  }

  /**
   * 追尾攻撃を実行
   */
  private executeHomingAttack(): void {
    if (!this.player) return;

    const bossCenterX = this.x + this.width / 2;
    const bossCenterY = this.y + this.height;
    const bulletCount = 3; // 3発同時発射

    for (let i = 0; i < bulletCount; i++) {
      const offsetX = (i - 1) * 20; // 横に少しずらして発射
      const speed = this.getConfig().boss.bulletSpeed * 0.8;

      // 初期方向はプレイヤー方向
      const playerPos = this.player.getPosition();
      const dx =
        playerPos.x + this.player.getWidth() / 2 - (bossCenterX + offsetX);
      const dy = playerPos.y + this.player.getHeight() / 2 - bossCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const speedX = distance > 0 ? (dx / distance) * speed : 0;
      const speedY = distance > 0 ? (dy / distance) * speed : speed;

      // 追尾弾を作成
      const homingBullet = createAdvancedBullet(
        {
          type: AdvancedBulletType.HOMING,
          x: bossCenterX + offsetX,
          y: bossCenterY,
          speedX,
          speedY,
          specialParams: {
            homingDuration: 3000,
            turnSpeed: 0.003,
          },
        },
        this.getConfig()
      ) as HomingBullet;

      homingBullet.setTarget(this.player);
      this.addBulletToGame(homingBullet);
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    // 攻撃エフェクトを最初に描画
    this.assaultEffects.draw(ctx);

    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

    // フェーズ移行エフェクト
    if (this.isTransitioning) {
      this.drawPhaseTransitionEffect(ctx);
    }

    // アサルト・クルーザーのメインボディ
    this.drawAssaultBody(ctx);

    // 武器システム
    this.drawWeaponSystems(ctx);

    // フェーズインジケーター
    this.drawPhaseIndicator(ctx);

    ctx.restore();
    this.drawAssaultHealthBar(ctx);
  }

  /**
   * アサルト・クルーザーのメインボディを描画
   */
  private drawAssaultBody(ctx: CanvasRenderingContext2D): void {
    const baseRadius = this.width / 2.5;

    // 深紅のグラデーション
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 1.4);
    gradient.addColorStop(0, '#8B0000'); // 深紅
    gradient.addColorStop(0.4, '#DC143C'); // クリムゾン
    gradient.addColorStop(1, '#4B0000'); // 暗い赤

    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 3;

    // 攻撃的な角張った形状
    const vertices = 8;
    ctx.beginPath();
    for (let i = 0; i < vertices; i++) {
      const angle = (i / vertices) * Math.PI * 2;
      const sharpness = i % 2 === 0 ? 1.2 : 0.8; // 角張った効果
      const radius = baseRadius * sharpness;

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.8; // 縦に圧縮

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  /**
   * 武器システムを描画
   */
  private drawWeaponSystems(ctx: CanvasRenderingContext2D): void {
    const weaponGlowIntensity = Math.sin(this.weaponGlow) * 0.5 + 0.5;

    // フェーズに応じた武器の描画
    switch (this.currentPhase) {
      case 1:
        this.drawRapidFireWeapons(ctx, weaponGlowIntensity);
        break;
      case 2:
        this.drawBombingWeapons(ctx, weaponGlowIntensity);
        break;
      case 3:
        this.drawLaserWeapons(ctx, weaponGlowIntensity);
        break;
    }
  }

  /**
   * 集中砲火用武器を描画
   */
  private drawRapidFireWeapons(
    ctx: CanvasRenderingContext2D,
    intensity: number
  ): void {
    const weaponPositions = [
      { x: -this.width / 4, y: this.height / 4 },
      { x: this.width / 4, y: this.height / 4 },
    ];

    weaponPositions.forEach(pos => {
      ctx.fillStyle = `rgba(255, 107, 107, ${intensity})`;
      ctx.fillRect(pos.x - 4, pos.y - 8, 8, 16);

      // 発射口の光
      ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.8})`;
      ctx.fillRect(pos.x - 2, pos.y + 6, 4, 4);
    });
  }

  /**
   * 爆撃用武器を描画
   */
  private drawBombingWeapons(
    ctx: CanvasRenderingContext2D,
    intensity: number
  ): void {
    const weaponSize = 12;
    ctx.fillStyle = `rgba(255, 165, 0, ${intensity})`;
    ctx.fillRect(-weaponSize / 2, this.height / 3, weaponSize, weaponSize);

    // 爆発エフェクト予告
    ctx.strokeStyle = `rgba(255, 69, 0, ${intensity * 0.6})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      -weaponSize,
      this.height / 3 - weaponSize / 2,
      weaponSize * 2,
      weaponSize * 2
    );
  }

  /**
   * レーザー用武器を描画
   */
  private drawLaserWeapons(
    ctx: CanvasRenderingContext2D,
    intensity: number
  ): void {
    const laserPositions = [
      { x: -this.width / 3, y: 0 },
      { x: 0, y: this.height / 4 },
      { x: this.width / 3, y: 0 },
    ];

    laserPositions.forEach(pos => {
      // レーザー発射口
      ctx.fillStyle = `rgba(0, 191, 255, ${intensity})`;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
      ctx.fill();

      // 追尾レーザーの予告線
      if (this.player && intensity > 0.7) {
        const playerPos = this.player.getPosition();
        const targetX =
          playerPos.x + this.player.getWidth() / 2 - (this.x + this.width / 2);
        const targetY =
          playerPos.y +
          this.player.getHeight() / 2 -
          (this.y + this.height / 2);

        ctx.strokeStyle = `rgba(0, 191, 255, 0.3)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  }

  /**
   * フェーズインジケーターを描画
   */
  private drawPhaseIndicator(ctx: CanvasRenderingContext2D): void {
    const indicatorY = -this.height / 2 - 20;

    for (let i = 1; i <= 3; i++) {
      const x = (i - 2) * 15;
      const active = i === this.currentPhase;

      ctx.fillStyle = active ? '#FF6B6B' : 'rgba(255, 107, 107, 0.3)';
      ctx.fillRect(x - 5, indicatorY, 10, 5);

      if (active) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(x - 3, indicatorY + 1, 6, 3);
      }
    }
  }

  /**
   * フェーズ移行エフェクトを描画
   */
  private drawPhaseTransitionEffect(ctx: CanvasRenderingContext2D): void {
    const pulseSize = Math.sin(this.phaseTransitionEffect) * 20;
    const alpha = Math.sin(this.phaseTransitionEffect * 2) * 0.5 + 0.5;

    ctx.strokeStyle = `rgba(255, 107, 107, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2 + pulseSize, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * 体力バーを描画（オーバーライド）
   */
  private drawAssaultHealthBar(ctx: CanvasRenderingContext2D): void {
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
        gradient.addColorStop(0, '#8B0000');
        gradient.addColorStop(1, '#DC143C');
        break;
      case 2:
        gradient.addColorStop(0, '#FF4500');
        gradient.addColorStop(1, '#FF8C00');
        break;
      case 3:
        gradient.addColorStop(0, '#00BFFF');
        gradient.addColorStop(1, '#87CEEB');
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

    // フェーズ境界線
    const phase1Boundary = (barWidth - 4) * 0.67;
    const phase2Boundary = (barWidth - 4) * 0.34;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(this.x - 8 + phase1Boundary, this.y - 38);
    ctx.lineTo(this.x - 8 + phase1Boundary, this.y - 28);
    ctx.moveTo(this.x - 8 + phase2Boundary, this.y - 38);
    ctx.lineTo(this.x - 8 + phase2Boundary, this.y - 28);
    ctx.stroke();
  }

  /**
   * 現在のフェーズを取得
   */
  public getCurrentPhase(): 1 | 2 | 3 {
    return this.currentPhase;
  }

  /**
   * ゲームエンジンの参照を取得
   */
  private getGame(): IGameEngine {
    // Bossクラスのprotectedメンバーにアクセス
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return (this as any).game;
  }

  /**
   * 設定を取得
   */
  private getConfig(): GameConfig {
    // Bossクラスのprotectedメンバーにアクセス
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
