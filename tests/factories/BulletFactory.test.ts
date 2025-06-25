import {
  GameConfig,
  createTestConfig,
} from '../../src/config/GameConfigFactory';
import { BulletConfig, AdvancedBulletType } from '../../src/entities/bullets';
import {
  BulletFactory,
  BossBulletConfig,
  PlayerBulletConfig,
} from '../../src/factories/BulletFactory';
import { IBullet } from '../../src/interfaces/IBullet';

describe('BulletFactory', () => {
  let mockGameConfig: GameConfig;

  beforeEach(() => {
    mockGameConfig = createTestConfig();
  });

  describe('createPlayerBullet', () => {
    test('基本的なプレイヤー弾丸を作成できること', () => {
      const config: PlayerBulletConfig = {
        x: 100,
        y: 200,
      };

      const bullet = BulletFactory.createPlayerBullet(config, mockGameConfig);

      expect(bullet).toBeDefined();
      expect(bullet.isActive()).toBe(true);
      expect(bullet.getOwner()).toBe('player');
      expect(bullet.getPosition()).toEqual({ x: 100, y: 200 });
    });

    test('カスタム設定でプレイヤー弾丸を作成できること', () => {
      const config: PlayerBulletConfig = {
        x: 50,
        y: 75,
        speed: 15,
        color: '#0000ff',
      };

      const bullet = BulletFactory.createPlayerBullet(config, mockGameConfig);

      expect(bullet).toBeDefined();
      expect(bullet.isActive()).toBe(true);
      expect(bullet.getOwner()).toBe('player');
      expect(bullet.getPosition()).toEqual({ x: 50, y: 75 });
    });

    test('GameConfig無しでプレイヤー弾丸を作成できること', () => {
      const config: PlayerBulletConfig = {
        x: 0,
        y: 0,
      };

      const bullet = BulletFactory.createPlayerBullet(config);

      expect(bullet).toBeDefined();
      expect(bullet.isActive()).toBe(true);
      expect(bullet.getOwner()).toBe('player');
    });

    test('IBulletインターフェースを実装していること', () => {
      const config: PlayerBulletConfig = {
        x: 10,
        y: 20,
      };

      const bullet = BulletFactory.createPlayerBullet(config, mockGameConfig);

      // インターフェースの全メソッドが存在することを確認
      expect(typeof bullet.isActive).toBe('function');
      expect(typeof bullet.deactivate).toBe('function');
      expect(typeof bullet.getPosition).toBe('function');
      expect(typeof bullet.getId).toBe('function');
      expect(typeof bullet.getOwner).toBe('function');
      expect(typeof bullet.update).toBe('function');
      expect(typeof bullet.draw).toBe('function');
      expect(typeof bullet.reset).toBe('function');
    });

    test('複数の弾丸が異なるIDを持つこと', () => {
      const config: PlayerBulletConfig = {
        x: 0,
        y: 0,
      };

      const bullet1 = BulletFactory.createPlayerBullet(config, mockGameConfig);
      const bullet2 = BulletFactory.createPlayerBullet(config, mockGameConfig);

      expect(bullet1.getId()).not.toBe(bullet2.getId());
    });
  });

  describe('createBossBullet', () => {
    test('基本的なボス弾丸を作成できること', () => {
      const config: BossBulletConfig = {
        x: 300,
        y: 400,
        speedX: 2,
        speedY: 3,
      };

      const bullet = BulletFactory.createBossBullet(config, mockGameConfig);

      expect(bullet).toBeDefined();
      expect(bullet.isActive()).toBe(true);
      expect(bullet.getOwner()).toBe('boss');
      expect(bullet.getPosition()).toEqual({ x: 300, y: 400 });
    });

    test('GameConfig無しでボス弾丸を作成できること', () => {
      const config: BossBulletConfig = {
        x: 100,
        y: 150,
        speedX: -1,
        speedY: 2,
      };

      const bullet = BulletFactory.createBossBullet(config);

      expect(bullet).toBeDefined();
      expect(bullet.isActive()).toBe(true);
      expect(bullet.getOwner()).toBe('boss');
    });

    test('負の速度でボス弾丸を作成できること', () => {
      const config: BossBulletConfig = {
        x: 200,
        y: 250,
        speedX: -5,
        speedY: -3,
      };

      const bullet = BulletFactory.createBossBullet(config, mockGameConfig);

      expect(bullet).toBeDefined();
      expect(bullet.isActive()).toBe(true);
    });

    test('IBulletインターフェースを実装していること', () => {
      const config: BossBulletConfig = {
        x: 0,
        y: 0,
        speedX: 1,
        speedY: 1,
      };

      const bullet = BulletFactory.createBossBullet(config, mockGameConfig);

      // インターフェースの全メソッドが存在することを確認
      expect(typeof bullet.isActive).toBe('function');
      expect(typeof bullet.deactivate).toBe('function');
      expect(typeof bullet.getPosition).toBe('function');
      expect(typeof bullet.getId).toBe('function');
      expect(typeof bullet.getOwner).toBe('function');
      expect(typeof bullet.update).toBe('function');
      expect(typeof bullet.draw).toBe('function');
      expect(typeof bullet.reset).toBe('function');
    });
  });

  describe('createSpecialBullet', () => {
    test('ホーミング弾丸を作成できること', () => {
      const config: BulletConfig = {
        type: AdvancedBulletType.HOMING,
        x: 100,
        y: 100,
        speedX: 5,
        speedY: 0,
        specialParams: {
          homingDuration: 2000,
        },
      };

      const bullet = BulletFactory.createSpecialBullet(config, mockGameConfig);

      expect(bullet).toBeDefined();
      expect(bullet.isActive()).toBe(true);
      expect(bullet.getOwner()).toBe('boss');
      expect(bullet.isHoming()).toBe(true);
      expect(bullet.getHomingDuration()).toBe(2000);
    });

    test('爆発弾丸を作成できること', () => {
      const config: BulletConfig = {
        type: AdvancedBulletType.EXPLOSIVE,
        x: 150,
        y: 200,
        speedX: 8,
        speedY: 0,
        specialParams: {
          explosionRadius: 50,
        },
      };

      const bullet = BulletFactory.createSpecialBullet(config, mockGameConfig);

      expect(bullet).toBeDefined();
      expect(bullet.isActive()).toBe(true);
      expect(bullet.getOwner()).toBe('boss');
      expect(bullet.isExplosive()).toBe(true);
      expect(bullet.getExplosionRadius()).toBe(50);
    });

    test('分裂弾丸を作成できること', () => {
      const config: BulletConfig = {
        type: AdvancedBulletType.SPLIT,
        x: 200,
        y: 300,
        speedX: 6,
        speedY: 0,
        specialParams: {
          splitCount: 3,
        },
      };

      const bullet = BulletFactory.createSpecialBullet(config, mockGameConfig);

      expect(bullet).toBeDefined();
      expect(bullet.isActive()).toBe(true);
      expect(bullet.getOwner()).toBe('boss');
      expect(bullet.canSplit()).toBe(true);
      expect(bullet.getSplitCount()).toBe(3);
    });

    test('リフレクト弾丸を作成できること', () => {
      const config: BulletConfig = {
        type: AdvancedBulletType.REFLECTING,
        x: 250,
        y: 350,
        speedX: 7,
        speedY: 0,
        specialParams: {
          maxReflections: 2,
        },
      };

      const bullet = BulletFactory.createSpecialBullet(config, mockGameConfig);

      expect(bullet).toBeDefined();
      expect(bullet.isActive()).toBe(true);
      expect(bullet.getOwner()).toBe('boss');
      expect(bullet.canRicochet()).toBe(true);
      expect(bullet.getRicochetCount()).toBe(2);
    });

    test('GameConfig無しで特殊弾丸を作成できること', () => {
      const config: BulletConfig = {
        type: AdvancedBulletType.HOMING,
        x: 0,
        y: 0,
        speedX: 5,
        speedY: 0,
      };

      const bullet = BulletFactory.createSpecialBullet(config);

      expect(bullet).toBeDefined();
      expect(bullet.isActive()).toBe(true);
    });
  });

  describe('エラーハンドリング', () => {
    test('不正な座標でも弾丸を作成できること', () => {
      const playerConfig: PlayerBulletConfig = {
        x: -100,
        y: -200,
      };

      const bullet = BulletFactory.createPlayerBullet(
        playerConfig,
        mockGameConfig
      );
      expect(bullet).toBeDefined();
      expect(bullet.getPosition()).toEqual({ x: -100, y: -200 });
    });

    test('極端な値でも弾丸を作成できること', () => {
      const bossConfig: BossBulletConfig = {
        x: Infinity,
        y: -Infinity,
        speedX: 1000,
        speedY: -1000,
      };

      expect(() => {
        const bullet = BulletFactory.createBossBullet(
          bossConfig,
          mockGameConfig
        );
        expect(bullet).toBeDefined();
      }).not.toThrow();
    });

    test('NaN値でも弾丸を作成できること', () => {
      const playerConfig: PlayerBulletConfig = {
        x: NaN,
        y: NaN,
        speed: NaN,
      };

      expect(() => {
        const bullet = BulletFactory.createPlayerBullet(
          playerConfig,
          mockGameConfig
        );
        expect(bullet).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('型安全性', () => {
    test('戻り値がIBulletインターフェースに準拠していること', () => {
      const playerConfig: PlayerBulletConfig = {
        x: 0,
        y: 0,
      };

      const bullet: IBullet = BulletFactory.createPlayerBullet(
        playerConfig,
        mockGameConfig
      );

      // TypeScriptの型チェックが正常に動作することを確認
      expect(typeof bullet.isActive()).toBe('boolean');
      expect(typeof bullet.getId()).toBe('string');
      expect(typeof bullet.getPosition()).toBe('object');
      expect(['player', 'enemy', 'boss']).toContain(bullet.getOwner());
    });

    test('全ての弾丸タイプが同じインターフェースを実装していること', () => {
      const playerBullet = BulletFactory.createPlayerBullet(
        { x: 0, y: 0 },
        mockGameConfig
      );
      const bossBullet = BulletFactory.createBossBullet(
        { x: 0, y: 0, speedX: 1, speedY: 1 },
        mockGameConfig
      );
      const specialBullet = BulletFactory.createSpecialBullet(
        {
          type: AdvancedBulletType.HOMING,
          x: 0,
          y: 0,
          speedX: 5,
          speedY: 0,
        },
        mockGameConfig
      );

      const bullets: IBullet[] = [playerBullet, bossBullet, specialBullet];

      bullets.forEach(bullet => {
        expect(typeof bullet.isActive).toBe('function');
        expect(typeof bullet.getOwner).toBe('function');
        expect(typeof bullet.getPosition).toBe('function');
        expect(typeof bullet.getId).toBe('function');
        expect(typeof bullet.update).toBe('function');
        expect(typeof bullet.draw).toBe('function');
        expect(typeof bullet.reset).toBe('function');
      });
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量の弾丸生成パフォーマンス', () => {
      const startTime = performance.now();

      const bullets: IBullet[] = [];
      for (let i = 0; i < 1000; i++) {
        const playerBullet = BulletFactory.createPlayerBullet(
          {
            x: i,
            y: i,
          },
          mockGameConfig
        );
        bullets.push(playerBullet);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(bullets.length).toBe(1000);
      expect(duration).toBeLessThan(1000); // 1秒以内に1000個の弾丸を生成
    });

    test('異なるタイプの弾丸生成パフォーマンス', () => {
      const startTime = performance.now();

      const bullets: IBullet[] = [];
      for (let i = 0; i < 100; i++) {
        const playerBullet = BulletFactory.createPlayerBullet(
          { x: i, y: i },
          mockGameConfig
        );
        const bossBullet = BulletFactory.createBossBullet(
          {
            x: i,
            y: i,
            speedX: 1,
            speedY: 1,
          },
          mockGameConfig
        );
        const specialBullet = BulletFactory.createSpecialBullet(
          {
            type: AdvancedBulletType.HOMING,
            x: i,
            y: i,
            speedX: 5,
            speedY: 0,
          },
          mockGameConfig
        );

        bullets.push(playerBullet, bossBullet, specialBullet);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(bullets.length).toBe(300);
      expect(duration).toBeLessThan(500); // 500ms以内に300個の弾丸を生成
    });
  });

  describe('メモリ効率性', () => {
    test('弾丸のリセット機能が正常に動作すること', () => {
      const config: PlayerBulletConfig = {
        x: 100,
        y: 200,
      };

      const bullet = BulletFactory.createPlayerBullet(config, mockGameConfig);
      const originalId = bullet.getId();

      // 弾丸をリセット
      bullet.reset();

      // リセット後の状態確認
      expect(bullet.isActive()).toBe(false);
      expect(bullet.getPosition()).toEqual({ x: 0, y: 0 });
      expect(bullet.getOwner()).toBe('player');

      // 新しいIDが生成されることを確認
      const newId = bullet.getId();
      expect(newId).not.toBe(originalId);
    });
  });
});
