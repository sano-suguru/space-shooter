import { GameConfig, createGameConfig } from '../../config/GameConfigFactory';
import { IGameEngine } from '../../interfaces/IGameEngine';
import { Boss } from '../Boss';
import { BossBullet } from '../BossBullet';
import {
  createAdvancedBullet,
  AdvancedBulletType,
  HomingBullet,
  ReflectingBullet,
  SplitBullet,
} from '../bullets';
import { Player } from '../Player';

/**
 * ストーム・インターセプターボス
 * Wave 22+に登場する機動特化型ボス
 * 高速機動と分身攻撃による撹乱戦術を特徴とする
 */
export class StormInterceptor extends Boss {
  // フェーズ管理
  private currentPhase: 1 | 2 | 3 = 1;
  private maxHealth: number;

  // 分身システム
  private clones: Array<{
    x: number;
    y: number;
    health: number;
    maxHealth: number;
    isActive: boolean;
    movePattern: number;
    lastFireTime: number;
    trailEffect: Array<{ x: number; y: number; alpha: number }>;
  }> = [];

  // 高速機動システム
  private movementPattern: 'zigzag' | 'circle' | 'storm' = 'zigzag';
  private movementPhase: number = 0;
  private baseSpeed: number;
  private currentSpeed: number;
  private targetX: number = 0;
  private targetY: number = 0;

  // 軌跡エフェクト
  private trailPoints: Array<{ x: number; y: number; alpha: number }> = [];
  private maxTrailPoints: number = 15;

  // 攻撃パターン用
  private lastAttackTime: number = 0;
  private player?: Player;

  // 視覚エフェクト
  private phaseTransitionEffect: number = 0;
  private isTransitioning: boolean = false;
  private stormEffect: number = 0;
  private cloneSpawnEffect: number = 0;

  // フェーズ別攻撃間隔
  private readonly PHASE1_INTERVAL = 800; // 0.8秒間隔
  private readonly PHASE2_INTERVAL = 1000; // 1.0秒間隔
  private readonly PHASE3_INTERVAL = 400; // 0.4秒間隔

  constructor(game: IGameEngine, config?: GameConfig, player?: Player) {
    const gameConfig = config ?? createGameConfig();

    // ストーム・インターセプターの設定
    const interceptorConfig = {
      ...gameConfig,
      boss: {
        ...gameConfig.boss,
        width: 45, // 設計書通りの小さなサイズ
        height: 35,
        initialHealth: 80, // 体力80
        movementSpeed: gameConfig.boss.movementSpeed * 2.5, // 移動速度2.5倍
        fireRate: 800, // 基本発射間隔
        bulletSpeed: gameConfig.boss.bulletSpeed * 1.8, // 攻撃力1.8倍
      },
    };

    super(game, interceptorConfig);
    this.maxHealth = interceptorConfig.boss.initialHealth;
    this.baseSpeed = interceptorConfig.boss.movementSpeed;
    this.currentSpeed = this.baseSpeed;
    this.player = player;
    this.initializeInterceptorSystems();
  }

  /**
   * ストーム・インターセプター専用システムを初期化
   */
  private initializeInterceptorSystems(): void {
    // 初期位置を設定
    this.targetX = this.x;
    this.targetY = this.y;

    // 軌跡エフェクトを初期化
    this.trailPoints = [];
  }

  /**
   * プレイヤー参照を設定
   */
  public setPlayer(player: Player): void {
    this.player = player;
  }

  public update(deltaTime: number): void {
    // 基本更新をスキップして独自の移動システムを使用
    this.updateCustomMovement(deltaTime);
    this.updatePhase();
    this.updateMovementPattern(deltaTime);
    this.updateClones(deltaTime);
    this.updateVisualEffects(deltaTime);
    this.updateAttackPattern(deltaTime);
    this.updateTrailEffect();

    // 攻撃処理は各フェーズの更新で個別に処理
  }

  /**
   * カスタム移動システム
   */
  private updateCustomMovement(deltaTime: number): void {
    // 高速機動パターンに基づいて移動
    this.movementPhase += deltaTime * 0.001;

    switch (this.movementPattern) {
      case 'zigzag':
        this.updateZigzagMovement(deltaTime);
        break;
      case 'circle':
        this.updateCircleMovement(deltaTime);
        break;
      case 'storm':
        this.updateStormMovement(deltaTime);
        break;
    }

    // 画面境界チェック
    this.clampToScreen();
  }

  /**
   * ジグザグ移動パターン
   */
  private updateZigzagMovement(deltaTime: number): void {
    const amplitude = 150;
    const frequency = 2;

    this.targetX =
      this.getGameConfig().canvas.width / 2 +
      Math.sin(this.movementPhase * frequency) * amplitude;
    this.targetY = 50 + Math.sin(this.movementPhase * frequency * 0.5) * 30;

    this.moveTowardsTarget(deltaTime);
  }

  /**
   * 円形移動パターン
   */
  private updateCircleMovement(deltaTime: number): void {
    const centerX = this.getGameConfig().canvas.width / 2;
    const centerY = 100;
    const radius = 80;

    this.targetX = centerX + Math.cos(this.movementPhase * 3) * radius;
    this.targetY = centerY + Math.sin(this.movementPhase * 3) * radius * 0.5;

    this.moveTowardsTarget(deltaTime);
  }

  /**
   * 嵐の突撃移動パターン
   */
  private updateStormMovement(deltaTime: number): void {
    // 画面全体を駆け巡る最高速度移動
    const speed = this.baseSpeed * 2;
    const changeInterval = 1000; // 1秒ごとに方向変更

    if (Date.now() % changeInterval < 50) {
      // 新しいランダムターゲットを設定
      this.targetX =
        Math.random() * (this.getGameConfig().canvas.width - this.width);
      this.targetY = 30 + Math.random() * 100;
    }

    this.moveTowardsTarget(deltaTime, speed);
  }

  /**
   * ターゲット位置に向かって移動
   */
  private moveTowardsTarget(deltaTime: number, customSpeed?: number): void {
    const speed = customSpeed ?? this.currentSpeed;
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      const moveX = (dx / distance) * speed * deltaTime;
      const moveY = (dy / distance) * speed * deltaTime;

      this.x += moveX;
      this.y += moveY;
    }
  }

  /**
   * 画面内に位置を制限
   */
  private clampToScreen(): void {
    const config = this.getGameConfig();
    this.x = Math.max(0, Math.min(config.canvas.width - this.width, this.x));
    this.y = Math.max(0, Math.min(200, this.y)); // 上部200px以内に制限
  }

  /**
   * 現在の体力に基づいてフェーズを更新
   */
  private updatePhase(): void {
    const healthPercentage = this.getHealthPercentage();
    const newPhase = this.calculatePhase(healthPercentage);

    if (newPhase !== this.currentPhase) {
      console.log(
        `[DEBUG] StormInterceptor: Phase transition ${this.currentPhase} -> ${newPhase} (Health: ${this.getHealthPercentage().toFixed(2)})`
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
        return Math.floor(this.maxHealth * 0.8);
      case 2:
        return Math.floor(this.maxHealth * 0.5);
      case 3:
        return Math.floor(this.maxHealth * 0.2);
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

    // フェーズに応じて移動パターンと速度を変更
    switch (newPhase) {
      case 1:
        this.movementPattern = 'zigzag';
        this.currentSpeed = this.baseSpeed;
        break;
      case 2:
        this.movementPattern = 'circle';
        this.currentSpeed = this.baseSpeed * 1.2;
        this.spawnClones();
        break;
      case 3:
        this.movementPattern = 'storm';
        this.currentSpeed = this.baseSpeed * 1.8;
        this.despawnClones();
        break;
    }
  }

  /**
   * 分身を生成
   */
  private spawnClones(): void {
    this.cloneSpawnEffect = 0;
    const cloneCount = 3;

    for (let i = 0; i < cloneCount; i++) {
      const angle = (i / cloneCount) * Math.PI * 2;
      const distance = 80;

      this.clones.push({
        x: this.x + Math.cos(angle) * distance,
        y: this.y + Math.sin(angle) * distance,
        health: Math.floor(this.maxHealth * 0.5), // 本体の50%の体力
        maxHealth: Math.floor(this.maxHealth * 0.5),
        isActive: true,
        movePattern: i,
        lastFireTime: Date.now() + i * 200, // 攻撃タイミングをずらす
        trailEffect: [],
      });
    }
  }

  /**
   * 分身を消去
   */
  private despawnClones(): void {
    this.clones.forEach(clone => {
      clone.isActive = false;
    });
    this.clones = [];
  }

  /**
   * 移動パターンを更新
   */
  private updateMovementPattern(_deltaTime: number): void {
    // フェーズ1では予測困難な機動パターンを追加
    if (this.currentPhase === 1) {
      // ランダムな方向変更を追加
      if (Math.random() < 0.02) {
        // 2%の確率で方向変更
        this.targetX += (Math.random() - 0.5) * 100;
        this.targetY += (Math.random() - 0.5) * 50;
      }
    }
  }

  /**
   * 分身を更新
   */
  private updateClones(_deltaTime: number): void {
    this.clones.forEach((clone, index) => {
      if (!clone.isActive) return;

      // 分身の移動パターン
      const angle =
        (index / this.clones.length) * Math.PI * 2 + this.movementPhase * 2;
      const distance = 60 + Math.sin(this.movementPhase * 3 + index) * 20;

      clone.x = this.x + Math.cos(angle) * distance;
      clone.y = this.y + Math.sin(angle) * distance;

      // 画面境界チェック
      const config = this.getGameConfig();
      clone.x = Math.max(
        0,
        Math.min(config.canvas.width - this.width, clone.x)
      );
      clone.y = Math.max(0, Math.min(200, clone.y));

      // 分身の軌跡エフェクト更新
      clone.trailEffect.push({ x: clone.x, y: clone.y, alpha: 1 });
      if (clone.trailEffect.length > 8) {
        clone.trailEffect.shift();
      }
      clone.trailEffect.forEach((point, i) => {
        point.alpha = ((i + 1) / clone.trailEffect.length) * 0.5;
      });
    });
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

    this.stormEffect += deltaTime * 3;
    this.cloneSpawnEffect += deltaTime * 2;
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
   * フェーズ1: 高速機動中の追尾弾攻撃
   */
  private updatePhase1Attack(currentTime: number): void {
    if (currentTime - this.lastAttackTime >= this.PHASE1_INTERVAL) {
      this.executeHomingAttack();
      this.lastAttackTime = currentTime;
    }
  }

  /**
   * フェーズ2: 分身と本体の同時反射弾攻撃
   */
  private updatePhase2Attack(currentTime: number): void {
    if (currentTime - this.lastAttackTime >= this.PHASE2_INTERVAL) {
      this.executeReflectingAttack();
      this.executeCloneAttacks();
      this.lastAttackTime = currentTime;
    }
  }

  /**
   * フェーズ3: 嵐の突撃中の分身弾連続発射
   */
  private updatePhase3Attack(currentTime: number): void {
    if (currentTime - this.lastAttackTime >= this.PHASE3_INTERVAL) {
      this.executeSplitAttack();
      this.lastAttackTime = currentTime;
    }
  }

  /**
   * 追尾弾攻撃を実行
   */
  private executeHomingAttack(): void {
    if (!this.player) return;

    const bossCenterX = this.x + this.width / 2;
    const bossCenterY = this.y + this.height;
    const bulletCount = 2; // 2発同時発射

    for (let i = 0; i < bulletCount; i++) {
      const offsetX = (i - 0.5) * 15;
      const speed = this.getGameConfig().boss.bulletSpeed * 0.9;

      // 初期方向はプレイヤー方向
      const playerPos = this.player.getPosition();
      const dx =
        playerPos.x + this.player.getWidth() / 2 - (bossCenterX + offsetX);
      const dy = playerPos.y + this.player.getHeight() / 2 - bossCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const speedX = distance > 0 ? (dx / distance) * speed : 0;
      const speedY = distance > 0 ? (dy / distance) * speed : speed;

      const homingBullet = createAdvancedBullet(
        {
          type: AdvancedBulletType.HOMING,
          x: bossCenterX + offsetX,
          y: bossCenterY,
          speedX,
          speedY,
          specialParams: {
            homingDuration: 2500,
            turnSpeed: 0.004,
          },
        },
        this.getGameConfig()
      ) as HomingBullet;

      homingBullet.setTarget(this.player);
      this.addBulletToGameEngine(homingBullet);
    }
  }

  /**
   * 反射弾攻撃を実行
   */
  private executeReflectingAttack(): void {
    const bossCenterX = this.x + this.width / 2;
    const bossCenterY = this.y + this.height;
    const directions = 3;

    for (let i = 0; i < directions; i++) {
      const angle = (Math.PI / 3) * (i - 1); // -60度から60度の範囲で3方向
      const speed = this.getGameConfig().boss.bulletSpeed;
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
        this.getGameConfig()
      ) as ReflectingBullet;

      this.addBulletToGameEngine(reflectingBullet);
    }
  }

  /**
   * 分身の攻撃を実行
   */
  private executeCloneAttacks(): void {
    this.clones.forEach(clone => {
      if (!clone.isActive) return;

      const currentTime = Date.now();
      if (currentTime - clone.lastFireTime >= this.PHASE2_INTERVAL) {
        const speed = this.getGameConfig().boss.bulletSpeed * 0.8;
        const bullet = this.createBossBulletInstance(
          clone.x + this.width / 2,
          clone.y + this.height,
          0,
          speed
        );
        this.addBulletToGameEngine(bullet);
        clone.lastFireTime = currentTime;
      }
    });
  }

  /**
   * 分身弾攻撃を実行
   */
  private executeSplitAttack(): void {
    const bossCenterX = this.x + this.width / 2;
    const bossCenterY = this.y + this.height;
    const speed = this.getGameConfig().boss.bulletSpeed * 0.7;

    const splitBullet = createAdvancedBullet(
      {
        type: AdvancedBulletType.SPLIT,
        x: bossCenterX,
        y: bossCenterY,
        speedX: 0,
        speedY: speed,
        specialParams: {
          splitDelay: 800,
          splitCount: 5,
          splitAngleSpread: Math.PI / 2,
        },
      },
      this.getGameConfig()
    ) as SplitBullet;

    this.addBulletToGameEngine(splitBullet);
  }

  /**
   * 軌跡エフェクトを更新
   */
  private updateTrailEffect(): void {
    // 本体の軌跡を追加
    this.trailPoints.push({
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
      alpha: 1,
    });

    // 古い軌跡を削除
    if (this.trailPoints.length > this.maxTrailPoints) {
      this.trailPoints.shift();
    }

    // 軌跡の透明度を更新
    this.trailPoints.forEach((point, index) => {
      point.alpha = ((index + 1) / this.trailPoints.length) * 0.7;
    });
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

    // フェーズ移行エフェクト
    if (this.isTransitioning) {
      this.drawInterceptorPhaseTransitionEffect(ctx);
    }

    // 軌跡エフェクト
    this.drawTrailEffect(ctx);

    // ストーム・インターセプターのメインボディ
    this.drawInterceptorBody(ctx);

    // フェーズインジケーター
    this.drawPhaseIndicator(ctx);

    ctx.restore();

    // 分身を描画
    this.drawClones(ctx);

    // 体力バーを描画
    this.drawInterceptorHealthBar(ctx);
  }

  /**
   * ストーム・インターセプターのメインボディを描画
   */
  private drawInterceptorBody(ctx: CanvasRenderingContext2D): void {
    const baseRadius = this.width / 2.8;

    // 紫色のグラデーション（#800080）
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 1.4);
    gradient.addColorStop(0, '#DA70D6'); // オーキッド
    gradient.addColorStop(0.4, '#800080'); // 紫（メインカラー）
    gradient.addColorStop(1, '#4B0082'); // インディゴ

    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#DDA0DD'; // プラム
    ctx.lineWidth = 2;

    // 流線型の高速機体デザイン
    ctx.beginPath();
    // 前方（尖った形状）
    ctx.moveTo(0, -baseRadius * 1.2);
    // 右翼
    ctx.quadraticCurveTo(
      baseRadius * 0.8,
      -baseRadius * 0.3,
      baseRadius,
      baseRadius * 0.5
    );
    // 後方右
    ctx.lineTo(baseRadius * 0.3, baseRadius);
    // 後方中央
    ctx.lineTo(0, baseRadius * 0.8);
    // 後方左
    ctx.lineTo(-baseRadius * 0.3, baseRadius);
    // 左翼
    ctx.quadraticCurveTo(
      -baseRadius * 0.8,
      -baseRadius * 0.3,
      0,
      -baseRadius * 1.2
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // エンジンノズル
    const enginePositions = [
      { x: -baseRadius * 0.2, y: baseRadius * 0.9 },
      { x: baseRadius * 0.2, y: baseRadius * 0.9 },
    ];

    enginePositions.forEach(pos => {
      const engineGradient = ctx.createRadialGradient(
        pos.x,
        pos.y,
        0,
        pos.x,
        pos.y,
        8
      );
      engineGradient.addColorStop(0, '#FF69B4'); // ホットピンク
      engineGradient.addColorStop(0.5, '#800080');
      engineGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = engineGradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // 中央のコア
    ctx.fillStyle = '#DDA0DD';
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // コアの内部光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 軌跡エフェクトを描画
   */
  private drawTrailEffect(ctx: CanvasRenderingContext2D): void {
    if (this.trailPoints.length < 2) return;

    ctx.strokeStyle = '#800080';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    for (let i = 1; i < this.trailPoints.length; i++) {
      const current = this.trailPoints[i];
      const previous = this.trailPoints[i - 1];

      const alpha = current.alpha * 0.6;
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      ctx.moveTo(
        previous.x - (this.x + this.width / 2),
        previous.y - (this.y + this.height / 2)
      );
      ctx.lineTo(
        current.x - (this.x + this.width / 2),
        current.y - (this.y + this.height / 2)
      );
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  /**
   * 分身を描画
   */
  private drawClones(ctx: CanvasRenderingContext2D): void {
    this.clones.forEach(clone => {
      if (!clone.isActive) return;

      ctx.save();
      ctx.translate(clone.x + this.width / 2, clone.y + this.height / 2);

      // 分身の軌跡
      this.drawCloneTrail(ctx, clone);

      // 分身本体（本体より少し透明）
      ctx.globalAlpha = 0.7;

      const baseRadius = this.width / 3.2; // 本体より少し小さく

      const gradient = ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        baseRadius * 1.4
      );
      gradient.addColorStop(0, '#DA70D6');
      gradient.addColorStop(0.4, '#800080');
      gradient.addColorStop(1, '#4B0082');

      ctx.fillStyle = gradient;
      ctx.strokeStyle = '#DDA0DD';
      ctx.lineWidth = 1.5;

      // 簡略化された分身形状
      ctx.beginPath();
      ctx.moveTo(0, -baseRadius);
      ctx.quadraticCurveTo(
        baseRadius * 0.7,
        -baseRadius * 0.2,
        baseRadius * 0.8,
        baseRadius * 0.4
      );
      ctx.lineTo(baseRadius * 0.2, baseRadius * 0.8);
      ctx.lineTo(0, baseRadius * 0.6);
      ctx.lineTo(-baseRadius * 0.2, baseRadius * 0.8);
      ctx.quadraticCurveTo(
        -baseRadius * 0.7,
        -baseRadius * 0.2,
        0,
        -baseRadius
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.restore();
    });
  }

  /**
   * 分身の軌跡を描画
   */
  private drawCloneTrail(
    ctx: CanvasRenderingContext2D,
    clone: (typeof this.clones)[0]
  ): void {
    if (clone.trailEffect.length < 2) return;

    ctx.strokeStyle = '#800080';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    for (let i = 1; i < clone.trailEffect.length; i++) {
      const current = clone.trailEffect[i];
      const previous = clone.trailEffect[i - 1];

      ctx.globalAlpha = current.alpha;

      ctx.beginPath();
      ctx.moveTo(
        previous.x - (clone.x + this.width / 2),
        previous.y - (clone.y + this.height / 2)
      );
      ctx.lineTo(
        current.x - (clone.x + this.width / 2),
        current.y - (clone.y + this.height / 2)
      );
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  /**
   * フェーズインジケーターを描画
   */
  private drawPhaseIndicator(ctx: CanvasRenderingContext2D): void {
    const indicatorY = -this.height / 2 - 20;

    for (let i = 1; i <= 3; i++) {
      const x = (i - 2) * 12;
      const active = i === this.currentPhase;

      ctx.fillStyle = active ? '#800080' : 'rgba(128, 0, 128, 0.3)';
      ctx.fillRect(x - 4, indicatorY, 8, 4);

      if (active) {
        ctx.fillStyle = 'rgba(221, 160, 221, 0.8)';
        ctx.fillRect(x - 2, indicatorY + 1, 4, 2);
      }
    }
  }

  /**
   * フェーズ移行エフェクトを描画
   */
  private drawInterceptorPhaseTransitionEffect(
    ctx: CanvasRenderingContext2D
  ): void {
    const pulseSize = Math.sin(this.phaseTransitionEffect) * 30;
    const alpha = Math.sin(this.phaseTransitionEffect * 2) * 0.5 + 0.5;

    ctx.strokeStyle = `rgba(128, 0, 128, ${alpha})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2 + pulseSize, 0, Math.PI * 2);
    ctx.stroke();

    // 嵐エフェクト
    if (this.currentPhase === 3) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + this.stormEffect;
        const radius = this.width / 2 + pulseSize + 10;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        ctx.fillStyle = `rgba(221, 160, 221, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * 体力バーを描画（オーバーライド）
   */
  private drawInterceptorHealthBar(ctx: CanvasRenderingContext2D): void {
    const healthPercentage = this.getHealthPercentage();
    const barWidth = this.width + 20;
    const barHeight = 8;

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(this.x - 10, this.y - 35, barWidth, barHeight + 4);

    // フェーズに応じた色のグラデーション
    const gradient = ctx.createLinearGradient(
      this.x - 8,
      0,
      this.x - 8 + barWidth - 4,
      0
    );

    switch (this.currentPhase) {
      case 1:
        gradient.addColorStop(0, '#800080');
        gradient.addColorStop(1, '#DA70D6');
        break;
      case 2:
        gradient.addColorStop(0, '#4B0082');
        gradient.addColorStop(1, '#9370DB');
        break;
      case 3:
        gradient.addColorStop(0, '#8B008B');
        gradient.addColorStop(1, '#FF69B4');
        break;
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(
      this.x - 8,
      this.y - 33,
      (barWidth - 4) * healthPercentage,
      barHeight
    );

    // 枠
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x - 8, this.y - 33, barWidth - 4, barHeight);

    // フェーズ境界線
    const phase1Boundary = (barWidth - 4) * 0.67;
    const phase2Boundary = (barWidth - 4) * 0.34;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(this.x - 8 + phase1Boundary, this.y - 33);
    ctx.lineTo(this.x - 8 + phase1Boundary, this.y - 25);
    ctx.moveTo(this.x - 8 + phase2Boundary, this.y - 33);
    ctx.lineTo(this.x - 8 + phase2Boundary, this.y - 25);
    ctx.stroke();

    // 分身状態インジケーター
    if (this.clones.length > 0) {
      ctx.fillStyle = 'rgba(128, 0, 128, 0.8)';
      ctx.fillRect(this.x - 8, this.y - 45, 8, 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '10px Arial';
      ctx.fillText(
        `×${this.clones.filter(c => c.isActive).length}`,
        this.x + 2,
        this.y - 42
      );
    }
  }

  /**
   * 現在のフェーズを取得
   */
  public getCurrentPhase(): 1 | 2 | 3 {
    return this.currentPhase;
  }

  /**
   * 分身状態を取得
   */
  public getCloneStatus(): Array<{
    x: number;
    y: number;
    health: number;
    maxHealth: number;
    isActive: boolean;
  }> {
    return this.clones.map(clone => ({
      x: clone.x,
      y: clone.y,
      health: clone.health,
      maxHealth: clone.maxHealth,
      isActive: clone.isActive,
    }));
  }

  /**
   * 現在の移動パターンを取得
   */
  public getMovementPattern(): 'zigzag' | 'circle' | 'storm' {
    return this.movementPattern;
  }

  /**
   * ゲームエンジンの参照を取得
   */
  private getGameEngine(): IGameEngine {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return (this as any).game;
  }

  /**
   * 設定を取得
   */
  private getGameConfig(): GameConfig {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return (this as any).config;
  }

  /**
   * BossBulletを作成するヘルパーメソッド
   */
  private createBossBulletInstance(
    x: number,
    y: number,
    speedX: number,
    speedY: number
  ): BossBullet {
    return new BossBullet(x, y, speedX, speedY, this.getGameConfig());
  }

  /**
   * 弾丸をゲームに追加するヘルパーメソッド
   */
  private addBulletToGameEngine(bullet: BossBullet): void {
    this.getGameEngine().addBossBullet(bullet);
  }
}
