/**
 * 拡張武器弾丸ファクトリー
 *
 * 既存のWeaponBulletFactoryを拡張し、BulletVisualManagerと統合します。
 */

import { Bullet } from '../../entities/Bullet';
import { Vector2D } from '../../types';
import { BulletVisualManager } from '../systems/BulletVisualManager';
import { EnchantmentType } from '../types/EnchantmentTypes';
import { WeaponConfig, WeaponType } from '../types/WeaponTypes';

import { WeaponBulletFactory } from './WeaponBulletFactory';

/**
 * 拡張武器弾丸ファクトリークラス
 */
export class EnhancedWeaponBulletFactory extends WeaponBulletFactory {
  private visualManager: BulletVisualManager;

  constructor() {
    super();
    this.visualManager = new BulletVisualManager();
  }

  /**
   * ビジュアル効果付きの弾丸を作成
   */
  public createVisualBullet(
    weaponConfig: WeaponConfig,
    position: Vector2D,
    direction: Vector2D,
    enchantments: EnchantmentType[] = []
  ): Bullet {
    // 基本弾丸を作成
    const bullets = this.createWeaponTypeBullet(
      weaponConfig.type,
      weaponConfig,
      position,
      direction
    );

    // 最初の弾丸にビジュアル効果を適用
    const bullet = bullets[0];
    if (bullet) {
      this.visualManager.setBulletVisual(bullet, weaponConfig, enchantments);
    }

    return bullet;
  }

  /**
   * 複数のビジュアル効果付き弾丸を作成
   */
  public createMultipleVisualBullets(
    weaponConfig: WeaponConfig,
    position: Vector2D,
    direction: Vector2D,
    enchantments: EnchantmentType[] = []
  ): Bullet[] {
    // 複数弾丸を作成
    const bullets = this.createMultipleBullets(
      weaponConfig,
      position,
      direction
    );

    // 各弾丸にビジュアル効果を適用
    bullets.forEach(bullet => {
      this.visualManager.setBulletVisual(bullet, weaponConfig, enchantments);
    });

    return bullets;
  }

  /**
   * 武器タイプ別のビジュアル効果付き弾丸を作成
   */
  public createWeaponTypeVisualBullet(
    weaponType: WeaponType,
    weaponConfig: WeaponConfig,
    position: Vector2D,
    direction: Vector2D,
    enchantments: EnchantmentType[] = []
  ): Bullet[] {
    // 武器タイプ別弾丸を作成
    const bullets = this.createWeaponTypeBullet(
      weaponType,
      weaponConfig,
      position,
      direction
    );

    // 各弾丸にビジュアル効果を適用
    bullets.forEach(bullet => {
      this.visualManager.setBulletVisual(bullet, weaponConfig, enchantments);
    });

    return bullets;
  }

  /**
   * 弾丸のビジュアル状態を更新
   */
  public updateBulletVisuals(bullets: Bullet[], deltaTime: number): void {
    bullets.forEach(bullet => {
      this.visualManager.updateBulletVisual(bullet, deltaTime);
    });
  }

  /**
   * 弾丸のカスタム描画
   */
  public renderBullets(bullets: Bullet[], ctx: CanvasRenderingContext2D): void {
    bullets.forEach(bullet => {
      this.visualManager.renderBullet(bullet, ctx);
    });
  }

  /**
   * 弾丸のビジュアル状態をクリーンアップ
   */
  public cleanupBulletVisuals(bullets: Bullet[]): void {
    bullets.forEach(bullet => {
      this.visualManager.cleanupBulletVisual(bullet);
    });
  }

  /**
   * ビジュアルマネージャーを取得
   */
  public getVisualManager(): BulletVisualManager {
    return this.visualManager;
  }

  /**
   * ファクトリーのクリーンアップ
   */
  public override cleanup(): void {
    super.cleanup();
    this.visualManager.cleanup();
  }

  /**
   * 統計情報を取得
   */
  public getEnhancedStats(): {
    poolStats: Record<string, number>;
    visualStats: ReturnType<BulletVisualManager['getStats']>;
  } {
    return {
      poolStats: this.getPoolStats(),
      visualStats: this.visualManager.getStats(),
    };
  }
}

/**
 * グローバルな拡張ファクトリーインスタンス
 */
export const enhancedWeaponBulletFactory = new EnhancedWeaponBulletFactory();

/**
 * 便利関数: エンチャント効果付き弾丸の簡単作成
 */
export function createEnchantedBullet(
  weaponConfig: WeaponConfig,
  x: number,
  y: number,
  enchantments: EnchantmentType[] = []
): Bullet {
  return enhancedWeaponBulletFactory.createVisualBullet(
    weaponConfig,
    { x, y },
    { x: 0, y: -1 }, // 上向き
    enchantments
  );
}

/**
 * 便利関数: 武器タイプ別弾丸の簡単作成
 */
export function createWeaponTypeBullet(
  weaponType: WeaponType,
  weaponConfig: WeaponConfig,
  x: number,
  y: number,
  enchantments: EnchantmentType[] = []
): Bullet[] {
  return enhancedWeaponBulletFactory.createWeaponTypeVisualBullet(
    weaponType,
    weaponConfig,
    { x, y },
    { x: 0, y: -1 }, // 上向き
    enchantments
  );
}

/**
 * 便利関数: 弾丸の更新と描画
 */
export function updateAndRenderBullets(
  bullets: Bullet[],
  ctx: CanvasRenderingContext2D,
  deltaTime: number
): void {
  // 基本更新
  bullets.forEach(bullet => bullet.update(deltaTime));

  // ビジュアル更新
  enhancedWeaponBulletFactory.updateBulletVisuals(bullets, deltaTime);

  // カスタム描画
  enhancedWeaponBulletFactory.renderBullets(bullets, ctx);
}

/**
 * 便利関数: 非アクティブ弾丸のクリーンアップ
 */
export function cleanupInactiveBullets(bullets: Bullet[]): Bullet[] {
  const activeBullets: Bullet[] = [];
  const inactiveBullets: Bullet[] = [];

  bullets.forEach(bullet => {
    if (bullet.isActive()) {
      activeBullets.push(bullet);
    } else {
      inactiveBullets.push(bullet);
    }
  });

  // 非アクティブ弾丸をクリーンアップ
  if (inactiveBullets.length > 0) {
    enhancedWeaponBulletFactory.cleanupBulletVisuals(inactiveBullets);
  }

  return activeBullets;
}
