import { GameConfig } from '../../config/GameConfigFactory';
import { BossBullet } from '../BossBullet';
import { Explosion } from '../Explosion';

/**
 * 爆発弾クラス - 着弾時に爆発エフェクトを生成する弾丸
 */
export class ExplosiveBullet extends BossBullet {
  private explosionRadius: number;
  private explosionDamage: number;
  private hasExploded: boolean = false;
  private explosion?: Explosion;

  constructor(
    x: number,
    y: number,
    speedX: number,
    speedY: number,
    config?: GameConfig,
    explosionRadius: number = 30,
    explosionDamage: number = 2
  ) {
    super(x, y, speedX, speedY, config);
    this.explosionRadius = explosionRadius;
    this.explosionDamage = explosionDamage;
  }

  /**
   * 爆発を発生させる
   */
  public explode(): Explosion | null {
    if (this.hasExploded) {
      return null;
    }

    console.log(
      `[DEBUG] ExplosiveBullet: Exploding at (${this.x}, ${this.y}) with radius ${this.explosionRadius}`
    );
    this.hasExploded = true;
    this.explosion = new Explosion(this.getConfig());
    this.explosion.initialize(
      { x: this.x + this.width / 2, y: this.y + this.height / 2 },
      this.explosionRadius / 30 // サイズ調整
    );

    return this.explosion;
  }

  /**
   * 爆発半径を取得
   */
  public getExplosionRadius(): number {
    return this.explosionRadius;
  }

  /**
   * 爆発ダメージを取得
   */
  public getExplosionDamage(): number {
    return this.explosionDamage;
  }

  /**
   * 爆発済みかどうかを確認
   */
  public hasExplodedAlready(): boolean {
    return this.hasExploded;
  }

  /**
   * 爆発エフェクトを取得
   */
  public getExplosion(): Explosion | undefined {
    return this.explosion;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    // 爆発弾は赤みがかった色で描画
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // 爆発予告の光るエフェクト
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffaaaa';
    ctx.fillRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);
    ctx.shadowBlur = 0;
  }

  /**
   * オブジェクトプール用のリセット
   */
  public reset(): void {
    this.hasExploded = false;
    this.explosion = undefined;
  }

  /**
   * 初期化（オブジェクトプール用）
   */
  public initialize(
    x: number,
    y: number,
    speedX: number,
    speedY: number,
    explosionRadius?: number,
    explosionDamage?: number
  ): void {
    this.x = x;
    this.y = y;
    this.hasExploded = false;
    this.explosion = undefined;

    if (explosionRadius !== undefined) {
      this.explosionRadius = explosionRadius;
    }
    if (explosionDamage !== undefined) {
      this.explosionDamage = explosionDamage;
    }
  }
}
