/**
 * 弾道システム統合テスト
 *
 * 弾道パターンと武器システムの統合動作をテストします。
 */

import { WeaponBulletFactory } from '../../../src/weapons/services/WeaponBulletFactory';
import { TrajectoryFactory } from '../../../src/weapons/trajectories/TrajectoryFactory';
import { TrajectoryType } from '../../../src/weapons/types/TrajectoryTypes';
import {
  WeaponRarity,
  WeaponType,
  type WeaponConfig,
} from '../../../src/weapons/types/WeaponTypes';

describe('弾道システム統合テスト', () => {
  let bulletFactory: WeaponBulletFactory;

  beforeEach(() => {
    bulletFactory = new WeaponBulletFactory();
  });

  afterEach(() => {
    // プールをクリーンアップ
    bulletFactory.cleanup();
    TrajectoryFactory.cleanup();
  });

  describe('基本武器の弾道パターン', () => {
    test('ベーシックレーザーは精密射撃弾道を使用する', () => {
      const weaponConfig: WeaponConfig = {
        id: 'basic_laser',
        name: 'ベーシックレーザー',
        description: 'テスト用',
        type: WeaponType.BASIC_LASER,
        rarity: WeaponRarity.COMMON,
        damage: 1.2,
        fireRate: 200,
        bulletSpeed: 600,
        bulletCount: 1,
        unlockCondition: () => true,
        cost: 0,
        maxLevel: 10,
        icon: '🔫',
        color: '#ffffff',
      };

      const position = { x: 100, y: 100 };
      const direction = { x: 0, y: -1 };

      const bullets = bulletFactory.createWeaponTypeBullet(
        WeaponType.BASIC_LASER,
        weaponConfig,
        position,
        direction
      );

      expect(bullets).toHaveLength(1);
      const bullet = bullets[0];
      const trajectory = bullet.getTrajectory();

      expect(trajectory).toBeDefined();
      expect(trajectory?.getType()).toBe(TrajectoryType.PRECISION);
    });

    test('プラズマキャノンは範囲攻撃弾道を使用する', () => {
      const weaponConfig: WeaponConfig = {
        id: 'plasma_cannon',
        name: 'プラズマキャノン',
        description: 'テスト用',
        type: WeaponType.PLASMA_CANNON,
        rarity: WeaponRarity.UNCOMMON,
        damage: 1.8,
        fireRate: 300,
        bulletSpeed: 500,
        bulletCount: 1,
        unlockCondition: () => true,
        cost: 500,
        maxLevel: 8,
        icon: '⚡',
        color: '#00ff00',
      };

      const position = { x: 100, y: 100 };
      const direction = { x: 0, y: -1 };

      const bullets = bulletFactory.createWeaponTypeBullet(
        WeaponType.PLASMA_CANNON,
        weaponConfig,
        position,
        direction
      );

      expect(bullets).toHaveLength(1);
      const bullet = bullets[0];
      const trajectory = bullet.getTrajectory();

      expect(trajectory).toBeDefined();
      expect(trajectory?.getType()).toBe(TrajectoryType.AREA_EFFECT);
    });

    test('速射砲は弾幕攻撃弾道を使用する（3発同時発射）', () => {
      const weaponConfig: WeaponConfig = {
        id: 'rapid_fire',
        name: '速射砲',
        description: 'テスト用',
        type: WeaponType.RAPID_FIRE,
        rarity: WeaponRarity.UNCOMMON,
        damage: 0.7,
        fireRate: 100,
        bulletSpeed: 650,
        bulletCount: 3,
        unlockCondition: () => true,
        cost: 300,
        maxLevel: 12,
        icon: '🔥',
        color: '#00ff00',
      };

      const position = { x: 100, y: 100 };
      const direction = { x: 0, y: -1 };

      const bullets = bulletFactory.createWeaponTypeBullet(
        WeaponType.RAPID_FIRE,
        weaponConfig,
        position,
        direction
      );

      expect(bullets).toHaveLength(3);

      bullets.forEach((bullet, index) => {
        const trajectory = bullet.getTrajectory();
        expect(trajectory).toBeDefined();
        expect(trajectory?.getType()).toBe(TrajectoryType.BARRAGE);

        // 各弾丸が異なる弾道インデックスを持つことを確認
        if (trajectory && 'getBulletIndex' in trajectory) {
          const barrageTrajectory = trajectory as { getBulletIndex(): number };
          expect(barrageTrajectory.getBulletIndex()).toBe(index);
        }
      });
    });

    test('エネルギービームは回避困難弾道を使用する', () => {
      const weaponConfig: WeaponConfig = {
        id: 'energy_beam',
        name: 'エネルギービーム',
        description: 'テスト用',
        type: WeaponType.ENERGY_BEAM,
        rarity: WeaponRarity.RARE,
        damage: 1.1,
        fireRate: 150,
        bulletSpeed: 700,
        bulletCount: 1,
        unlockCondition: () => true,
        cost: 800,
        maxLevel: 10,
        icon: '💫',
        color: '#0080ff',
      };

      const position = { x: 100, y: 100 };
      const direction = { x: 0, y: -1 };

      const bullets = bulletFactory.createWeaponTypeBullet(
        WeaponType.ENERGY_BEAM,
        weaponConfig,
        position,
        direction
      );

      expect(bullets).toHaveLength(3); // エネルギービームは3連射

      bullets.forEach(bullet => {
        const trajectory = bullet.getTrajectory();
        expect(trajectory).toBeDefined();
        expect(trajectory?.getType()).toBe(TrajectoryType.EVASIVE);
      });
    });
  });

  describe('弾道パターンのプール管理', () => {
    test('弾道パターンはプールから再利用される', () => {
      const weaponConfig: WeaponConfig = {
        id: 'basic_laser',
        name: 'ベーシックレーザー',
        description: 'テスト用',
        type: WeaponType.BASIC_LASER,
        rarity: WeaponRarity.COMMON,
        damage: 1.2,
        fireRate: 200,
        bulletSpeed: 600,
        bulletCount: 1,
        unlockCondition: () => true,
        cost: 0,
        maxLevel: 10,
        icon: '🔫',
        color: '#ffffff',
      };

      const position = { x: 100, y: 100 };
      const direction = { x: 0, y: -1 };

      // 複数の弾丸を作成
      const bullets1 = bulletFactory.createWeaponTypeBullet(
        WeaponType.BASIC_LASER,
        weaponConfig,
        position,
        direction
      );

      const bullets2 = bulletFactory.createWeaponTypeBullet(
        WeaponType.BASIC_LASER,
        weaponConfig,
        position,
        direction
      );

      // 弾道パターンが設定されていることを確認
      expect(bullets1[0].getTrajectory()).toBeDefined();
      expect(bullets2[0].getTrajectory()).toBeDefined();

      // プール統計を確認
      const poolStats = TrajectoryFactory.getPoolStats();
      expect(typeof poolStats).toBe('object');
    });

    test('弾丸が非アクティブになると弾道パターンがプールに返却される', () => {
      const weaponConfig: WeaponConfig = {
        id: 'basic_laser',
        name: 'ベーシックレーザー',
        description: 'テスト用',
        type: WeaponType.BASIC_LASER,
        rarity: WeaponRarity.COMMON,
        damage: 1.2,
        fireRate: 200,
        bulletSpeed: 600,
        bulletCount: 1,
        unlockCondition: () => true,
        cost: 0,
        maxLevel: 10,
        icon: '🔫',
        color: '#ffffff',
      };

      const position = { x: 100, y: 100 };
      const direction = { x: 0, y: -1 };

      const bullets = bulletFactory.createWeaponTypeBullet(
        WeaponType.BASIC_LASER,
        weaponConfig,
        position,
        direction
      );

      const bullet = bullets[0];
      expect(bullet.getTrajectory()).toBeDefined();

      // 弾丸を非アクティブ化
      bullet.deactivate();
      bullet.cleanupTrajectory();

      expect(bullet.getTrajectory()).toBeUndefined();
    });
  });
});
