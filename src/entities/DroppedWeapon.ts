/**
 * ドロップされた武器エンティティ
 *
 * 敵撃破時にドロップされる武器アイテムを表現するエンティティです。
 */

import { GameConfig, createGameConfig } from '../config/GameConfigFactory';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';
import { EnchantedWeapon } from '../weapons/types/EnchantedWeapon';
import { WeaponRarity } from '../weapons/types/WeaponTypes';

import { GameObject } from './GameObject';

/**
 * ドロップされた武器の状態
 */
export enum DroppedWeaponState {
  SPAWNING = 'spawning',
  FLOATING = 'floating',
  ATTRACTING = 'attracting',
  COLLECTED = 'collected',
  EXPIRED = 'expired',
}

/**
 * ドロップされた武器エンティティクラス
 */
export class DroppedWeapon extends GameObject {
  private enchantedWeapon: EnchantedWeapon;
  private state: DroppedWeaponState = DroppedWeaponState.SPAWNING;
  private velocity: { x: number; y: number };
  private rotation: number = 0;
  private rotationSpeed: number;
  private glowIntensity: number = 0;
  private glowDirection: number = 1;
  private pulsePhase: number = 0;
  private lifeTime: number = 0;
  private maxLifeTime: number;
  private pickupRadius: number;
  private attractionSpeed: number = 200;
  private floatAmplitude: number = 10;
  private floatFrequency: number = 2;
  private gravityForce: number = 80; // フローティング状態での重力
  private spawnAnimation: number = 0;
  private trail: Array<{ x: number; y: number; alpha: number }> = [];
  private config: GameConfig;
  private eventEmitter: EventEmitter<EventMap> | null = null;
  private hasTriggeredWeaponFound: boolean = false;

  constructor(
    enchantedWeapon: EnchantedWeapon,
    x: number,
    y: number,
    config?: GameConfig,
    eventEmitter?: EventEmitter<EventMap>
  ) {
    const gameConfig = config ?? createGameConfig();

    super(x, y, 32, 32); // 32x32のサイズ

    this.config = gameConfig;
    this.enchantedWeapon = enchantedWeapon;
    this.maxLifeTime = 30000; // 30秒で消失
    this.pickupRadius = 50;
    this.eventEmitter = eventEmitter ?? null;

    // 初期速度（ランダムな方向に飛び散る）
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 100;
    this.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };

    this.rotationSpeed = (Math.random() - 0.5) * 4;
    this.pulsePhase = Math.random() * Math.PI * 2;

    // 🔧 コンストラクタ呼び出しログ
    console.log(`🏗️ DroppedWeapon作成: ${this.enchantedWeapon.displayName}`, {
      position: { x: this.x, y: this.y },
      spawnAnimation: this.spawnAnimation,
      lifeTime: this.lifeTime,
      state: this.state,
      timestamp: Date.now(),
    });
  }

  /**
   * 更新処理
   */
  public update(deltaTime: number): void {
    console.log(
      `🚀 update()開始: ${this.enchantedWeapon.displayName} (deltaTime: ${deltaTime})`
    );

    this.lifeTime += deltaTime;

    // 🔧 デバッグ: 詳細な状態情報を毎回ログ出力
    console.log(`🔧 武器詳細状態: ${this.enchantedWeapon.displayName}`, {
      lifeTime: (this.lifeTime / 1000).toFixed(3) + 's',
      spawnAnimation: (this.spawnAnimation / 1000).toFixed(3) + 's',
      state: this.state,
      deltaTime: deltaTime.toFixed(3),
      position: { x: this.x.toFixed(1), y: this.y.toFixed(1) },
    });

    // デバッグ: update()が呼ばれていることを確認（1秒ごと）
    if (
      Math.floor(this.lifeTime / 1000) !==
      Math.floor((this.lifeTime - deltaTime) / 1000)
    ) {
      console.log(
        `🔄 武器update: ${this.enchantedWeapon.displayName} (life: ${(this.lifeTime / 1000).toFixed(1)}s, state: ${this.state}, spawnAnim: ${(this.spawnAnimation / 1000).toFixed(1)}s)`
      );
    }

    // 寿命チェック
    if (this.lifeTime >= this.maxLifeTime) {
      this.state = DroppedWeaponState.EXPIRED;
      return;
    }

    // 画面外チェック（画面下端を超えた場合は削除）
    if (this.y > this.config.canvas.height + this.height) {
      console.log(
        `🗑️ 武器が画面外に流れて削除: ${this.enchantedWeapon.displayName}`,
        {
          position: { x: this.x, y: this.y },
          screenHeight: this.config.canvas.height,
        }
      );
      this.state = DroppedWeaponState.EXPIRED;
      return;
    }

    // 状態別の更新処理
    switch (this.state) {
      case DroppedWeaponState.SPAWNING:
        this.updateSpawning(deltaTime);
        break;
      case DroppedWeaponState.FLOATING:
        this.updateFloating(deltaTime);
        break;
      case DroppedWeaponState.ATTRACTING:
        this.updateAttracting(deltaTime);
        break;
    }

    // 共通の更新処理
    this.updateCommon(deltaTime);
  }

  /**
   * スポーン状態の更新
   */
  private updateSpawning(deltaTime: number): void {
    console.log(`🔧 updateSpawning開始: ${this.enchantedWeapon.displayName}`, {
      spawnAnimationBefore: (this.spawnAnimation / 1000).toFixed(3) + 's',
      deltaTime: deltaTime.toFixed(3),
      deltaTimeUnit:
        'deltaTimeが秒単位なら' + (deltaTime * 1000).toFixed(3) + 'ms',
    });

    // 🔧 deltaTimeの単位を確認 - 秒単位の場合はミリ秒に変換
    const deltaTimeMs = deltaTime > 1 ? deltaTime : deltaTime * 1000;
    console.log(
      `🔧 deltaTime変換: ${deltaTime.toFixed(3)} → ${deltaTimeMs.toFixed(3)}ms`
    );

    this.spawnAnimation += deltaTimeMs;

    console.log(
      `🔧 spawnAnimation更新後: ${(this.spawnAnimation / 1000).toFixed(3)}s (${this.spawnAnimation.toFixed(3)}ms)`
    );

    // 初期の飛び散り動作
    this.x += this.velocity.x * deltaTime;
    this.y += this.velocity.y * deltaTime;

    // 速度減衰
    this.velocity.x *= 0.95;
    this.velocity.y *= 0.95;

    // 重力効果
    this.velocity.y += 200 * deltaTime;

    // 🔧 状態遷移条件をチェック
    const shouldTransition = this.spawnAnimation >= 1000;
    console.log(`🔧 状態遷移チェック: ${this.enchantedWeapon.displayName}`, {
      spawnAnimation: (this.spawnAnimation / 1000).toFixed(3) + 's',
      threshold: '1.000s',
      shouldTransition,
      currentState: this.state,
    });

    // 一定時間後にフローティング状態に移行
    if (shouldTransition) {
      console.log('🔄 武器状態: SPAWNING → FLOATING', {
        weaponName: this.enchantedWeapon.displayName,
        position: { x: this.x, y: this.y },
        spawnAnimationFinal: (this.spawnAnimation / 1000).toFixed(3) + 's',
      });
      this.state = DroppedWeaponState.FLOATING;
      this.velocity.x = 0;
      this.velocity.y = 0;
    }
  }

  /**
   * フローティング状態の更新
   */
  private updateFloating(deltaTime: number): void {
    // ふわふわと浮遊する動作
    const floatOffset =
      Math.sin((this.lifeTime * this.floatFrequency) / 1000) *
      this.floatAmplitude;
    this.y += (floatOffset * deltaTime) / 100;

    // 重力効果で徐々に下方向に移動
    this.y += this.gravityForce * deltaTime;
  }

  /**
   * 引き寄せ状態の更新
   */
  private updateAttracting(deltaTime: number): void {
    // プレイヤーに向かって移動（実装時にプレイヤー位置を取得）
    // 現在は単純に上に移動
    this.y -= this.attractionSpeed * deltaTime;
  }

  /**
   * 共通の更新処理
   */
  private updateCommon(deltaTime: number): void {
    // 回転
    this.rotation += this.rotationSpeed * deltaTime;

    // グロー効果
    this.glowIntensity += 0.003 * this.glowDirection * deltaTime;
    if (this.glowIntensity >= 1 || this.glowIntensity <= 0) {
      this.glowDirection *= -1;
    }
    this.glowIntensity = Math.max(0, Math.min(1, this.glowIntensity));

    // パルス効果
    this.pulsePhase += deltaTime * 3;

    // トレイル更新
    this.updateTrail();
  }

  /**
   * トレイル更新
   */
  private updateTrail(): void {
    // 新しいトレイルポイントを追加
    this.trail.unshift({
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
      alpha: 1.0,
    });

    // トレイルポイントのアルファ値を減少
    this.trail.forEach((point, index) => {
      point.alpha = Math.max(0, 1 - index / 10);
    });

    // 古いトレイルポイントを削除
    if (this.trail.length > 10) {
      this.trail = this.trail.slice(0, 10);
    }
  }

  /**
   * 描画処理
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.state === DroppedWeaponState.EXPIRED) return;

    ctx.save();

    // トレイル描画
    this.drawTrail(ctx);

    // 武器本体描画
    this.drawWeapon(ctx);

    // エンチャント効果描画
    this.drawEnchantmentEffects(ctx);

    // UI情報描画
    this.drawWeaponInfo(ctx);

    ctx.restore();
  }

  /**
   * トレイル描画
   */
  private drawTrail(ctx: CanvasRenderingContext2D): void {
    if (this.trail.length < 2) return;

    const rarityColor = this.getRarityColor();

    for (let i = 1; i < this.trail.length; i++) {
      const current = this.trail[i - 1];
      const previous = this.trail[i];

      ctx.strokeStyle = `${rarityColor}${Math.floor(current.alpha * 100)
        .toString(16)
        .padStart(2, '0')}`;
      ctx.lineWidth = 3 * current.alpha;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(current.x, current.y);
      ctx.lineTo(previous.x, previous.y);
      ctx.stroke();
    }
  }

  /**
   * 武器本体描画
   */
  private drawWeapon(ctx: CanvasRenderingContext2D): void {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate(this.rotation);

    // スポーン時のスケール効果
    let scale = 1;
    if (this.state === DroppedWeaponState.SPAWNING) {
      scale = Math.min(1, this.spawnAnimation / 500);
    }

    // パルス効果
    const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.1;
    scale *= pulseScale;

    ctx.scale(scale, scale);

    // グロー効果
    const rarityColor = this.getRarityColor();
    const glowRadius = 20 + this.glowIntensity * 10;

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
    gradient.addColorStop(0, `${rarityColor}80`);
    gradient.addColorStop(0.5, `${rarityColor}40`);
    gradient.addColorStop(1, `${rarityColor}00`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // 武器アイコン描画
    this.drawWeaponIcon(ctx);

    ctx.resetTransform();
  }

  /**
   * 武器アイコン描画
   */
  private drawWeaponIcon(ctx: CanvasRenderingContext2D): void {
    const rarityColor = this.getRarityColor();

    // 外枠
    ctx.strokeStyle = rarityColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // 背景
    ctx.fillStyle = `${rarityColor}20`;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // 武器タイプアイコン
    ctx.fillStyle = rarityColor;
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.enchantedWeapon.icon, 0, 0);
  }

  /**
   * エンチャント効果描画
   */
  private drawEnchantmentEffects(ctx: CanvasRenderingContext2D): void {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // エンチャント数に応じた星の描画
    const enchantmentCount = this.enchantedWeapon.enchantments.length;
    const starRadius = 40;

    for (let i = 0; i < enchantmentCount; i++) {
      const angle = (i / enchantmentCount) * Math.PI * 2 + this.rotation * 0.5;
      const starX = centerX + Math.cos(angle) * starRadius;
      const starY = centerY + Math.sin(angle) * starRadius;

      this.drawStar(ctx, starX, starY, 4, this.getRarityColor());
    }

    // レジェンダリー組み合わせの特別効果
    if (this.enchantedWeapon.totalStats.hasLegendaryCombo) {
      this.drawLegendaryEffect(ctx, centerX, centerY);
    }
  }

  /**
   * 星の描画
   */
  private drawStar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string
  ): void {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = `${color}80`;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5;
      const radius = i % 2 === 0 ? size : size / 2;
      const pointX = Math.cos(angle) * radius;
      const pointY = Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  /**
   * レジェンダリー効果描画
   */
  private drawLegendaryEffect(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number
  ): void {
    const time = this.lifeTime / 1000;

    // 虹色の輪
    for (let i = 0; i < 6; i++) {
      const hue = (i * 60 + time * 50) % 360;
      const color = `hsl(${hue}, 100%, 50%)`;
      const radius = 50 + Math.sin(time * 2 + i) * 10;

      ctx.strokeStyle = `${color}60`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /**
   * 武器情報描画
   */
  private drawWeaponInfo(ctx: CanvasRenderingContext2D): void {
    // 武器名表示
    ctx.fillStyle = this.getRarityColor();
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(
      this.enchantedWeapon.displayName,
      this.x + this.width / 2,
      this.y - 20
    );

    // 寿命バー
    const remainingLife = 1 - this.lifeTime / this.maxLifeTime;
    const barWidth = this.width;
    const barHeight = 3;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(this.x, this.y + this.height + 5, barWidth, barHeight);

    ctx.fillStyle = remainingLife > 0.3 ? '#00ff00' : '#ff0000';
    ctx.fillRect(
      this.x,
      this.y + this.height + 5,
      barWidth * remainingLife,
      barHeight
    );
  }

  /**
   * レアリティ色を取得
   */
  private getRarityColor(): string {
    switch (this.enchantedWeapon.rarity) {
      case WeaponRarity.COMMON:
        return '#ffffff';
      case WeaponRarity.UNCOMMON:
        return '#00ff00';
      case WeaponRarity.RARE:
        return '#0080ff';
      case WeaponRarity.EPIC:
        return '#8000ff';
      case WeaponRarity.LEGENDARY:
        return '#ff8000';
      default:
        return '#ffffff';
    }
  }

  /**
   * プレイヤーとの距離チェック
   */
  public checkPlayerDistance(playerX: number, playerY: number): boolean {
    const dx = this.x + this.width / 2 - playerX;
    const dy = this.y + this.height / 2 - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 距離が近い場合のみログ出力（スパム防止）
    if (distance <= this.pickupRadius * 2) {
      console.log(`🔍 武器距離チェック: ${this.enchantedWeapon.displayName}`, {
        weaponPos: `(${this.x.toFixed(1)}, ${this.y.toFixed(1)})`,
        playerPos: `(${playerX.toFixed(1)}, ${playerY.toFixed(1)})`,
        distance: distance.toFixed(1),
        pickupRadius: this.pickupRadius,
        state: this.state,
        lifeTime: (this.lifeTime / 1000).toFixed(1) + 's',
        hasTriggeredWeaponFound: this.hasTriggeredWeaponFound,
      });
    }

    // 武器発見イベントの発火（一度だけ）
    if (
      distance <= this.pickupRadius &&
      this.state === DroppedWeaponState.FLOATING &&
      !this.hasTriggeredWeaponFound &&
      this.eventEmitter
    ) {
      console.log(
        `🔍 武器発見イベント発火: ${this.enchantedWeapon.displayName}`,
        {
          distance: distance.toFixed(1),
          pickupRadius: this.pickupRadius,
          playerPosition: { x: playerX, y: playerY },
        }
      );

      this.hasTriggeredWeaponFound = true;
      this.eventEmitter.emit('weaponFound', {
        droppedWeapon: this,
        playerPosition: { x: playerX, y: playerY },
      });

      // 状態をATTRACTINGに変更
      this.state = DroppedWeaponState.ATTRACTING;
      console.log(
        `🎯 ${this.enchantedWeapon.displayName}: FLOATING → ATTRACTING (weaponFound発火)`
      );
      return true;
    }

    // 従来の処理（weaponFoundイベント未発火の場合）
    if (
      distance <= this.pickupRadius &&
      this.state === DroppedWeaponState.FLOATING &&
      this.hasTriggeredWeaponFound
    ) {
      console.log(
        `🎯 ${this.enchantedWeapon.displayName}: FLOATING → ATTRACTING (既存処理)`
      );
      this.state = DroppedWeaponState.ATTRACTING;
      return true;
    }

    const canCollect =
      distance <= 20 && this.state === DroppedWeaponState.ATTRACTING;

    if (distance <= 30) {
      // 近い場合のみログ出力
      console.log(`🎯 拾得判定: ${this.enchantedWeapon.displayName}`, {
        canCollect,
        distance: distance.toFixed(1),
        requiredDistance: 20,
        isAttracting: this.state === DroppedWeaponState.ATTRACTING,
        currentState: this.state,
      });
    }

    return canCollect;
  }

  /**
   * 武器を収集
   */
  public collect(): EnchantedWeapon {
    this.state = DroppedWeaponState.COLLECTED;
    return this.enchantedWeapon;
  }

  /**
   * 状態取得
   */
  public getState(): DroppedWeaponState {
    return this.state;
  }

  /**
   * エンチャント済み武器取得
   */
  public getEnchantedWeapon(): EnchantedWeapon {
    return this.enchantedWeapon;
  }

  /**
   * 画面内チェック
   */
  public isOnScreen(): boolean {
    return (
      this.state !== DroppedWeaponState.EXPIRED &&
      this.state !== DroppedWeaponState.COLLECTED &&
      this.x > -this.width &&
      this.x < this.config.canvas.width + this.width &&
      this.y > -this.height &&
      this.y < this.config.canvas.height + this.height
    );
  }

  /**
   * EventEmitterを設定
   */
  public setEventEmitter(eventEmitter: EventEmitter<EventMap>): void {
    this.eventEmitter = eventEmitter;
  }

  /**
   * 武器発見フラグをリセット（テスト用）
   */
  public resetWeaponFoundFlag(): void {
    this.hasTriggeredWeaponFound = false;
  }

  /**
   * 武器発見フラグの状態を取得（テスト用）
   */
  public hasTriggeredWeaponFoundEvent(): boolean {
    return this.hasTriggeredWeaponFound;
  }
}
