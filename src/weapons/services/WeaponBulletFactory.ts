/**
 * 武器システム - 武器弾丸ファクトリー
 *
 * 武器タイプに応じた弾丸を生成するファクトリークラス
 */

import { Bullet } from '../../entities/Bullet';
import { ExplosiveBullet } from '../../entities/bullets/ExplosiveBullet';
import { HomingBullet } from '../../entities/bullets/HomingBullet';
import { ReflectingBullet } from '../../entities/bullets/ReflectingBullet';
import { SplitBullet } from '../../entities/bullets/SplitBullet';
import { Player } from '../../entities/Player';
import { Vector2D } from '../../types';
import { IWeaponBulletFactory } from '../interfaces/IWeapon';
import { TrajectoryFactory } from '../trajectories/TrajectoryFactory';
import { TrajectoryConfig, TrajectoryType } from '../types/TrajectoryTypes';
import {
  WeaponConfig,
  WeaponRarity,
  WeaponSpecialEffectType,
  WeaponType,
} from '../types/WeaponTypes';

/**
 * 武器弾丸ファクトリークラス
 */
export class WeaponBulletFactory implements IWeaponBulletFactory {
  private bulletPools: Map<string, Bullet[]> = new Map();
  private maxPoolSize: number = 50;
  private trajectoryConfigs: Map<WeaponType, TrajectoryConfig> = new Map();

  constructor() {
    this.initializeTrajectoryConfigs();
  }

  /**
   * 弾道設定を初期化
   */
  private initializeTrajectoryConfigs(): void {
    // ベーシックレーザー：精密射撃
    this.trajectoryConfigs.set(WeaponType.BASIC_LASER, {
      type: TrajectoryType.PRECISION,
      parameters: {
        speed: 600,
        straightPhaseDuration: 500,
        trackingStrength: 0.002,
        trackingRange: Math.PI / 6,
      },
    });

    // プラズマキャノン：範囲攻撃
    this.trajectoryConfigs.set(WeaponType.PLASMA_CANNON, {
      type: TrajectoryType.AREA_EFFECT,
      parameters: {
        speed: 500,
        explosionDelay: 2000,
        explosionRadius: 25,
        explosionDamage: 0.9,
      },
    });

    // 速射砲：弾幕攻撃
    this.trajectoryConfigs.set(WeaponType.RAPID_FIRE, {
      type: TrajectoryType.BARRAGE,
      parameters: {
        speed: 650,
        spreadAngle: Math.PI / 12,
        bulletCount: 3,
      },
    });

    // エネルギービーム：回避困難
    this.trajectoryConfigs.set(WeaponType.ENERGY_BEAM, {
      type: TrajectoryType.EVASIVE,
      parameters: {
        speed: 700,
        wavePeriod: 800,
        maxAmplitude: 40,
        amplitudeGrowthRate: 0.05,
      },
    });
  }

  /**
   * 基本弾丸作成
   */
  public createBasicBullet(
    weaponConfig: WeaponConfig,
    position: Vector2D,
    _direction: Vector2D
  ): Bullet {
    const bullet = this.getBulletFromPool(weaponConfig.id) ?? new Bullet();

    // 武器設定に基づいて弾丸を初期化
    const speed = weaponConfig.bulletSpeed;
    const color = this.getWeaponColor(weaponConfig);

    bullet.initialize(
      position.x,
      position.y,
      speed, // 正の速度値を渡す
      color,
      'player' // プレイヤーの武器から発射された弾丸
    );

    // 弾道パターンを適用
    this.applyTrajectoryPattern(bullet, weaponConfig);

    return bullet;
  }

  /**
   * 弾道パターンを適用
   */
  private applyTrajectoryPattern(
    bullet: Bullet,
    weaponConfig: WeaponConfig
  ): void {
    const trajectoryConfig = this.trajectoryConfigs.get(weaponConfig.type);

    if (trajectoryConfig) {
      const trajectory = TrajectoryFactory.createTrajectory(trajectoryConfig);
      bullet.setTrajectory(trajectory);
    }
  }

  /**
   * 特殊弾丸作成
   */
  public createSpecialBullet(
    weaponConfig: WeaponConfig,
    position: Vector2D,
    direction: Vector2D
  ): Bullet {
    if (!weaponConfig.specialEffect) {
      return this.createBasicBullet(weaponConfig, position, direction);
    }

    const { type, parameters } = weaponConfig.specialEffect;
    const speedX = weaponConfig.bulletSpeed * direction.x;
    const speedY = weaponConfig.bulletSpeed * direction.y;

    switch (type) {
      case 'explosive':
        return new ExplosiveBullet(
          position.x,
          position.y,
          speedX,
          speedY,
          undefined,
          parameters.explosionRadius ?? 30,
          parameters.explosionDamage ?? 1
        ) as unknown as Bullet;

      case 'homing':
        return new HomingBullet(
          position.x,
          position.y,
          speedX,
          speedY,
          undefined,
          parameters.homingDuration ?? 3000,
          parameters.homingTurnSpeed ?? 0.002
        ) as unknown as Bullet;

      case 'split':
        return new SplitBullet(
          position.x,
          position.y,
          speedX,
          speedY,
          undefined,
          parameters.splitDelay ?? 2000,
          parameters.splitCount ?? 3,
          parameters.splitAngleSpread ?? Math.PI / 3
        ) as unknown as Bullet;

      case 'bounce':
        return new ReflectingBullet(
          position.x,
          position.y,
          speedX,
          speedY,
          undefined,
          parameters.bounceCount ?? 3
        ) as unknown as Bullet;

      default:
        return this.createBasicBullet(weaponConfig, position, direction);
    }
  }

  /**
   * 複数弾丸作成（拡散射撃用）
   */
  public createMultipleBullets(
    weaponConfig: WeaponConfig,
    position: Vector2D,
    direction: Vector2D
  ): Bullet[] {
    const bullets: Bullet[] = [];
    const bulletCount = weaponConfig.bulletCount;
    const spreadAngle = weaponConfig.spreadAngle ?? 0;

    if (bulletCount === 1) {
      // 単発の場合
      const bullet = weaponConfig.specialEffect
        ? this.createSpecialBullet(weaponConfig, position, direction)
        : this.createBasicBullet(weaponConfig, position, direction);
      bullets.push(bullet);
    } else {
      // 複数発の場合（拡散射撃）
      const angleStep = spreadAngle / (bulletCount - 1);
      const startAngle = -spreadAngle / 2;

      for (let i = 0; i < bulletCount; i++) {
        const angle = startAngle + angleStep * i;
        const bulletDirection = {
          x: direction.x + Math.sin(angle),
          y: direction.y * Math.cos(angle),
        };

        const bullet = weaponConfig.specialEffect
          ? this.createSpecialBullet(weaponConfig, position, bulletDirection)
          : this.createBasicBullet(weaponConfig, position, bulletDirection);

        bullets.push(bullet);
      }
    }

    return bullets;
  }

  /**
   * 武器タイプ別弾丸作成
   */
  public createWeaponTypeBullet(
    weaponType: WeaponType,
    weaponConfig: WeaponConfig,
    position: Vector2D,
    direction: Vector2D
  ): Bullet[] {
    switch (weaponType) {
      case WeaponType.RAPID_FIRE:
        // 速射砲は小さく速い弾丸
        return this.createRapidFireBullets(weaponConfig, position, direction);

      case WeaponType.PLASMA_CANNON:
        // プラズマキャノンは大きく遅い弾丸
        return this.createPlasmaBullets(weaponConfig, position, direction);

      case WeaponType.MISSILE_LAUNCHER:
        // ミサイルランチャーは追尾ミサイル
        return this.createMissileBullets(weaponConfig, position, direction);

      case WeaponType.ENERGY_BEAM:
        // エネルギービームは連続弾
        return this.createBeamBullets(weaponConfig, position, direction);

      default:
        return this.createMultipleBullets(weaponConfig, position, direction);
    }
  }

  /**
   * 速射砲用弾丸作成（3発同時発射）
   */
  private createRapidFireBullets(
    weaponConfig: WeaponConfig,
    position: Vector2D,
    direction: Vector2D
  ): Bullet[] {
    const bullets: Bullet[] = [];
    const trajectoryConfig = this.trajectoryConfigs.get(WeaponType.RAPID_FIRE);

    if (!trajectoryConfig) {
      // フォールバック：通常の弾丸
      const bullet = this.createBasicBullet(weaponConfig, position, direction);
      bullet.setType(weaponConfig.bulletSpeed * 1.2, '#ffaa00');
      return [bullet];
    }

    // 3発同時発射（中央、左、右）
    for (let i = 0; i < 3; i++) {
      const bullet = this.getBulletFromPool(weaponConfig.id) ?? new Bullet();

      // 弾丸を初期化
      bullet.initialize(
        position.x,
        position.y,
        weaponConfig.bulletSpeed * 1.2,
        '#ffaa00',
        'player'
      );

      // 弾道パターンを設定（弾丸インデックス付き）
      const trajectory = TrajectoryFactory.createTrajectory(
        trajectoryConfig,
        i
      );
      bullet.setTrajectory(trajectory);

      bullets.push(bullet);
    }

    return bullets;
  }

  /**
   * プラズマキャノン用弾丸作成
   */
  private createPlasmaBullets(
    weaponConfig: WeaponConfig,
    position: Vector2D,
    direction: Vector2D
  ): Bullet[] {
    const bullet = this.createBasicBullet(weaponConfig, position, direction);
    // プラズマキャノンは大きく遅い弾丸に調整
    bullet.setType(weaponConfig.bulletSpeed * 0.8, '#00ffaa');
    return [bullet];
  }

  /**
   * ミサイルランチャー用弾丸作成
   */
  private createMissileBullets(
    weaponConfig: WeaponConfig,
    position: Vector2D,
    direction: Vector2D
  ): Bullet[] {
    // ミサイルは追尾効果を持つ
    const modifiedConfig = {
      ...weaponConfig,
      specialEffect: {
        type: 'homing' as WeaponSpecialEffectType,
        parameters: {
          homingDuration: 2000,
          homingTurnSpeed: 0.003,
        },
      },
    };
    return this.createMultipleBullets(modifiedConfig, position, direction);
  }

  /**
   * エネルギービーム用弾丸作成
   */
  private createBeamBullets(
    weaponConfig: WeaponConfig,
    position: Vector2D,
    direction: Vector2D
  ): Bullet[] {
    const bullets: Bullet[] = [];
    // エネルギービームは連続的な弾丸
    for (let i = 0; i < 3; i++) {
      const offsetPosition = {
        x: position.x,
        y: position.y - i * 10,
      };
      const bullet = this.createBasicBullet(
        weaponConfig,
        offsetPosition,
        direction
      );
      bullet.setType(weaponConfig.bulletSpeed, '#00aaff');
      bullets.push(bullet);
    }
    return bullets;
  }

  /**
   * 武器色取得
   */
  private getWeaponColor(weaponConfig: WeaponConfig): string {
    switch (weaponConfig.rarity) {
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
        return '#00aaff';
    }
  }

  /**
   * 弾丸プールから取得
   */
  public getBulletFromPool(weaponId: string): Bullet | null {
    const pool = this.bulletPools.get(weaponId);
    if (pool && pool.length > 0) {
      return pool.pop() ?? null;
    }
    return null;
  }

  /**
   * 弾丸プールに返却
   */
  public returnBulletToPool(weaponId: string, bullet: Bullet): void {
    if (!this.bulletPools.has(weaponId)) {
      this.bulletPools.set(weaponId, []);
    }

    const pool = this.bulletPools.get(weaponId)!;
    if (pool.length < this.maxPoolSize) {
      bullet.reset();
      pool.push(bullet);
    }
  }

  /**
   * 追尾弾丸にターゲット設定
   */
  public setHomingTarget(bullet: Bullet, target: Player): void {
    // 型安全性のためのチェック
    if ('setTarget' in bullet && typeof bullet.setTarget === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      (bullet as any).setTarget(target);
    }
  }

  /**
   * プール統計取得
   */
  public getPoolStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const [weaponId, pool] of this.bulletPools) {
      stats[weaponId] = pool.length;
    }
    return stats;
  }

  /**
   * プールクリーンアップ
   */
  public cleanup(): void {
    this.bulletPools.clear();
  }
}
