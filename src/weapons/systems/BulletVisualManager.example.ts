/**
 * BulletVisualManager使用例
 *
 * 既存のBulletクラスとBulletVisualManagerを統合する方法を示します。
 */

import { Bullet } from '../../entities/Bullet';
import { EnchantmentType } from '../types/EnchantmentTypes';
import { WeaponConfig, WeaponRarity, WeaponType } from '../types/WeaponTypes';

import { BulletVisualManager } from './BulletVisualManager';

/**
 * 使用例: 基本的な武器の弾丸ビジュアル設定
 */
export function createBasicLaserBullet(): {
  bullet: Bullet;
  visualManager: BulletVisualManager;
} {
  const visualManager = new BulletVisualManager();
  const bullet = new Bullet(100, 100);

  // 基本レーザー武器の設定
  const weaponConfig: WeaponConfig = {
    id: 'basic_laser_example',
    name: 'ベーシックレーザー',
    description: '標準的なエネルギー武器',
    type: WeaponType.BASIC_LASER,
    rarity: WeaponRarity.COMMON,
    damage: 1,
    fireRate: 200,
    bulletSpeed: 600,
    bulletCount: 1,
    unlockCondition: () => true,
    cost: 0,
    maxLevel: 10,
    icon: '🔫',
    color: '#00aaff',
  };

  // ビジュアル設定を適用
  visualManager.setBulletVisual(bullet, weaponConfig);

  return { bullet, visualManager };
}

/**
 * 使用例: エンチャント効果付きの弾丸
 */
export function createEnchantedBullet(): {
  bullet: Bullet;
  visualManager: BulletVisualManager;
} {
  const visualManager = new BulletVisualManager();
  const bullet = new Bullet(100, 100);

  // プラズマキャノンの設定
  const weaponConfig: WeaponConfig = {
    id: 'plasma_cannon_example',
    name: 'プラズマキャノン',
    description: '高威力のプラズマ弾',
    type: WeaponType.PLASMA_CANNON,
    rarity: WeaponRarity.RARE,
    damage: 2,
    fireRate: 300,
    bulletSpeed: 500,
    bulletCount: 1,
    unlockCondition: () => true,
    cost: 800,
    maxLevel: 8,
    icon: '⚡',
    color: '#0080ff',
  };

  // エンチャント効果
  const enchantments = [
    EnchantmentType.DAMAGE_BOOST,
    EnchantmentType.EXPLOSIVE_ROUNDS,
  ];

  // ビジュアル設定を適用
  visualManager.setBulletVisual(bullet, weaponConfig, enchantments);

  return { bullet, visualManager };
}

/**
 * 使用例: ゲームループでの更新と描画
 */
export function gameLoopExample(
  bullet: Bullet,
  visualManager: BulletVisualManager,
  ctx: CanvasRenderingContext2D,
  deltaTime: number
): void {
  // 弾丸の基本更新
  bullet.update(deltaTime);

  // ビジュアル状態の更新
  visualManager.updateBulletVisual(bullet, deltaTime);

  // カスタム描画（既存の描画を置き換え）
  visualManager.renderBullet(bullet, ctx);

  // 弾丸が非アクティブになったらクリーンアップ
  if (!bullet.isActive()) {
    visualManager.cleanupBulletVisual(bullet);
  }
}

/**
 * 使用例: 複数の弾丸を管理
 */
export class BulletManager {
  private bullets: Bullet[] = [];
  private visualManager = new BulletVisualManager();

  public createBullet(
    x: number,
    y: number,
    weaponConfig: WeaponConfig,
    enchantments: EnchantmentType[] = []
  ): Bullet {
    const bullet = new Bullet(x, y);
    this.visualManager.setBulletVisual(bullet, weaponConfig, enchantments);
    this.bullets.push(bullet);
    return bullet;
  }

  public update(deltaTime: number): void {
    this.bullets.forEach(bullet => {
      bullet.update(deltaTime);
      this.visualManager.updateBulletVisual(bullet, deltaTime);
    });

    // 非アクティブな弾丸を削除
    this.bullets = this.bullets.filter(bullet => {
      if (!bullet.isActive()) {
        this.visualManager.cleanupBulletVisual(bullet);
        return false;
      }
      return true;
    });
  }

  public render(ctx: CanvasRenderingContext2D): void {
    this.bullets.forEach(bullet => {
      this.visualManager.renderBullet(bullet, ctx);
    });
  }

  public cleanup(): void {
    this.bullets.forEach(bullet => {
      this.visualManager.cleanupBulletVisual(bullet);
    });
    this.bullets = [];
    this.visualManager.cleanup();
  }

  public getStats(): {
    bulletCount: number;
    visualStats: ReturnType<BulletVisualManager['getStats']>;
  } {
    return {
      bulletCount: this.bullets.length,
      visualStats: this.visualManager.getStats(),
    };
  }
}

/**
 * 使用例: 武器タイプ別の弾丸作成
 */
export function createWeaponTypeBullets(): {
  bullets: Array<{ bullet: Bullet; weaponType: WeaponType }>;
  visualManager: BulletVisualManager;
} {
  const visualManager = new BulletVisualManager();
  const bullets: Array<{ bullet: Bullet; weaponType: WeaponType }> = [];

  const weaponTypes = [
    WeaponType.BASIC_LASER,
    WeaponType.PLASMA_CANNON,
    WeaponType.ENERGY_BEAM,
    WeaponType.EXPLOSIVE_ROUNDS,
    WeaponType.HOMING_MISSILES,
    WeaponType.SPLIT_SHOT,
    WeaponType.RAPID_FIRE,
    WeaponType.MISSILE_LAUNCHER,
  ];

  weaponTypes.forEach((weaponType, index) => {
    const bullet = new Bullet(100 + index * 50, 100);

    const weaponConfig: WeaponConfig = {
      id: `${weaponType}_example`,
      name: `${weaponType} Example`,
      description: `Example weapon of type ${weaponType}`,
      type: weaponType,
      rarity: WeaponRarity.COMMON,
      damage: 1,
      fireRate: 200,
      bulletSpeed: 600,
      bulletCount: 1,
      unlockCondition: () => true,
      cost: 0,
      maxLevel: 10,
      icon: '🔫',
      color: '#00aaff',
    };

    visualManager.setBulletVisual(bullet, weaponConfig);
    bullets.push({ bullet, weaponType });
  });

  return { bullets, visualManager };
}

/**
 * 使用例: エンチャント組み合わせ効果のテスト
 */
export function testComboEffects(): {
  bullets: Array<{ bullet: Bullet; enchantments: EnchantmentType[] }>;
  visualManager: BulletVisualManager;
} {
  const visualManager = new BulletVisualManager();
  const bullets: Array<{
    bullet: Bullet;
    enchantments: EnchantmentType[];
  }> = [];

  const combos = [
    [EnchantmentType.PIERCING, EnchantmentType.EXPLOSIVE_ROUNDS],
    [EnchantmentType.HOMING_BULLETS, EnchantmentType.MULTI_SPLIT],
    [EnchantmentType.CRITICAL_HIT, EnchantmentType.CHAIN_LIGHTNING],
  ];

  const baseWeaponConfig: WeaponConfig = {
    id: 'combo_test',
    name: 'コンボテスト武器',
    description: 'エンチャント組み合わせテスト用',
    type: WeaponType.ENERGY_BEAM,
    rarity: WeaponRarity.EPIC,
    damage: 2,
    fireRate: 250,
    bulletSpeed: 550,
    bulletCount: 1,
    unlockCondition: () => true,
    cost: 1000,
    maxLevel: 10,
    icon: '✨',
    color: '#8000ff',
  };

  combos.forEach((enchantments, index) => {
    const bullet = new Bullet(100 + index * 100, 200);
    visualManager.setBulletVisual(bullet, baseWeaponConfig, enchantments);
    bullets.push({ bullet, enchantments });
  });

  return { bullets, visualManager };
}
