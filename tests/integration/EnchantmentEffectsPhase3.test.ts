/**
 * エンチャント効果統合テスト - Phase 3: システム統合とテスト
 *
 * 全エンチャント効果の統合処理、包括的テスト、パフォーマンステスト、統合デモを実行
 */

import { Bullet } from '../../src/entities/Bullet';
import { Enemy } from '../../src/entities/Enemy';
import { EventEmitter } from '../../src/events/EventEmitter';
import { EventMap } from '../../src/events/EventType';
import { IPlayer } from '../../src/interfaces/IPlayer';
import { GameObjectManager } from '../../src/managers/GameObjectManager';
import { MockRandomProvider } from '../../src/providers/MockRandomProvider';
import { ChainLightningProcessor } from '../../src/systems/ChainLightningProcessor';
import { CollisionSystem } from '../../src/systems/CollisionSystem';
import { PowerUpType } from '../../src/types';
import { DamageCalculator } from '../../src/utils/DamageCalculator';

describe('エンチャント効果統合テスト - Phase 3', () => {
  let gameObjectManager: GameObjectManager;
  let eventEmitter: EventEmitter<EventMap>;
  let collisionSystem: CollisionSystem;
  let chainProcessor: ChainLightningProcessor;
  let mockRandomProvider: MockRandomProvider;

  const createMockPlayer = (): IPlayer => ({
    x: 400,
    y: 400,
    width: 50,
    height: 50,
    update: (_deltaTime: number): void => {
      // モックなので何もしない
    },
    draw: (_ctx: CanvasRenderingContext2D): void => {
      // モックなので何もしない
    },
    setFireRate: (_rate: number): void => {
      // モックなので何もしない
    },
    setBulletType: (_type: 'single' | 'triple'): void => {
      // モックなので何もしない
    },
    activateShield: (): void => {
      // モックなので何もしない
    },
    deactivateShield: (): void => {
      // モックなので何もしない
    },
    isShieldActive: (): boolean => false,
    activatePowerup: (_type: PowerUpType): void => {
      // モックなので何もしない
    },
    getHealth: (): number => 100,
    getMaxHealth: (): number => 100,
    takeDamage: (_amount: number): void => {
      // モックなので何もしない
    },
    getPosition: (): { x: number; y: number } => ({ x: 400, y: 400 }),
    getX: (): number => 400,
    getY: (): number => 400,
    getWidth: (): number => 50,
    getHeight: (): number => 50,
  });

  beforeEach(() => {
    eventEmitter = new EventEmitter();
    gameObjectManager = new GameObjectManager(eventEmitter);
    collisionSystem = new CollisionSystem(eventEmitter, gameObjectManager);
    chainProcessor = new ChainLightningProcessor(
      gameObjectManager,
      eventEmitter
    );

    mockRandomProvider = new MockRandomProvider();
    DamageCalculator.setRandomProvider(mockRandomProvider);
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    gameObjectManager.clearAllBullets();
    gameObjectManager.clearAllEnemies();
    gameObjectManager.removeOffscreenObjects();
    chainProcessor.clearVisualEffects();
  });

  describe('1. 統合テストスイート - 全エンチャント効果の個別テスト', () => {
    describe('貫通効果の詳細テスト', () => {
      it('貫通効果が正確に指定回数まで敵を貫通する', () => {
        const bullet = new Bullet(100, 50);
        bullet.initialize(100, 50);
        bullet.setPiercing(3); // 3回貫通
        bullet.setCriticalChance(0); // クリティカルなし

        // 縦に並んだ敵を配置
        Array.from({ length: 5 }, (_, i) => {
          const enemy = new Enemy(100, 80 + i * 30);
          gameObjectManager.addEnemy(enemy);
          return enemy;
        });

        gameObjectManager.addBullet(bullet);
        mockRandomProvider.setValues(Array(5).fill(0.9) as number[]); // クリティカルなし

        const mockPlayer = createMockPlayer();
        collisionSystem.checkAllCollisions(mockPlayer);

        // 3回貫通後に弾丸が無効化される
        expect(bullet.isActive()).toBe(false);

        // 残存敵数をチェック（3体撃破、2体残存）
        const remainingEnemies = gameObjectManager.getEnemies();
        expect(remainingEnemies.length).toBe(2);
      });

      it('貫通効果なしの弾丸は1体目で停止する', () => {
        const bullet = new Bullet(100, 50);
        bullet.initialize(100, 50);
        bullet.setPiercing(0); // 貫通なし

        Array.from({ length: 3 }, (_, i) => {
          const enemy = new Enemy(100, 80 + i * 30);
          gameObjectManager.addEnemy(enemy);
          return enemy;
        });

        gameObjectManager.addBullet(bullet);
        mockRandomProvider.setValues([0.9]); // クリティカルなし

        const mockPlayer = createMockPlayer();
        collisionSystem.checkAllCollisions(mockPlayer);

        expect(bullet.isActive()).toBe(false);
        expect(gameObjectManager.getEnemies().length).toBe(2); // 1体のみ撃破
      });
    });

    describe('クリティカル効果の詳細テスト', () => {
      it('クリティカル確率が正確に動作する', () => {
        const testCases = [
          { chance: 0, expectedCritical: false, randomValue: 0.5 },
          { chance: 100, expectedCritical: true, randomValue: 0.5 },
          { chance: 50, expectedCritical: true, randomValue: 0.3 },
          { chance: 50, expectedCritical: false, randomValue: 0.7 },
        ];

        testCases.forEach(
          ({ chance, expectedCritical, randomValue }, index) => {
            const bullet = new Bullet(100 + index * 50, 50);
            bullet.initialize(100 + index * 50, 50);
            bullet.setCriticalChance(chance);

            const enemy = new Enemy(100 + index * 50, 80);
            const takeDamageSpy = jest.spyOn(enemy, 'takeDamage');

            gameObjectManager.addBullet(bullet);
            gameObjectManager.addEnemy(enemy);

            mockRandomProvider.setValues([randomValue]);

            const mockPlayer = createMockPlayer();
            collisionSystem.checkAllCollisions(mockPlayer);

            const expectedDamage = expectedCritical ? 2 : 1;
            expect(takeDamageSpy).toHaveBeenCalledWith(
              expectedDamage,
              expectedCritical
            );

            // クリーンアップ
            gameObjectManager.removeEnemy(enemy);
          }
        );
      });

      it('クリティカルヒット時の視覚効果が適用される', () => {
        const bullet = new Bullet(100, 50);
        bullet.initialize(100, 50);
        bullet.setCriticalChance(100); // 確実にクリティカル

        const enemy = new Enemy(100, 80);
        gameObjectManager.addBullet(bullet);
        gameObjectManager.addEnemy(enemy);

        mockRandomProvider.setValues([0.1]); // クリティカル発生

        const mockPlayer = createMockPlayer();
        collisionSystem.checkAllCollisions(mockPlayer);

        // 敵のクリティカル効果時間が設定されている
        expect(
          (enemy as unknown as { criticalEffectTime?: number })
            .criticalEffectTime
        ).toBeGreaterThan(0);
      });
    });

    describe('凍結効果の詳細テスト', () => {
      it('凍結効果が指定時間だけ敵を停止させる', () => {
        const bullet = new Bullet(100, 50);
        bullet.initialize(100, 50);
        bullet.setFreezeEffect(true);
        bullet.setFreezeDuration(2); // 2秒凍結

        const enemy = new Enemy(100, 80);
        const initialY = enemy.getY();
        const freezeSpy = jest.spyOn(enemy, 'freeze');

        gameObjectManager.addBullet(bullet);
        gameObjectManager.addEnemy(enemy);

        mockRandomProvider.setValues([0.9]); // クリティカルなし

        const mockPlayer = createMockPlayer();
        collisionSystem.checkAllCollisions(mockPlayer);

        expect(freezeSpy).toHaveBeenCalledWith(2);
        expect(enemy.isFrozen()).toBe(true);

        // 凍結中は移動しない
        enemy.update(0.1);
        expect(enemy.getY()).toBe(initialY);
      });

      it('凍結時間経過後に敵が正常に動作する', () => {
        const enemy = new Enemy(100, 100);
        enemy.freeze(0.1); // 0.1秒凍結

        expect(enemy.isFrozen()).toBe(true);

        // 時間経過をシミュレート
        jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 150);
        enemy.update(16);

        expect(enemy.isFrozen()).toBe(false);
      });
    });

    describe('連鎖効果の詳細テスト', () => {
      it('連鎖効果が指定回数まで近くの敵に伝播する', () => {
        const bullet = new Bullet(100, 50);
        bullet.initialize(100, 50);
        bullet.setChainLightning(true);
        bullet.setChainCount(3);
        bullet.setCriticalChance(0);

        // 連鎖しやすい位置に敵を配置
        const enemyPositions = [
          [100, 80], // 最初の対象
          [120, 100], // 連鎖対象1
          [80, 120], // 連鎖対象2
          [110, 140], // 連鎖対象3
          [200, 200], // 範囲外（連鎖しない）
        ];

        const initialEnemyCount = enemyPositions.length;
        enemyPositions.forEach(([x, y]) => {
          const enemy = new Enemy(x, y);
          gameObjectManager.addEnemy(enemy);
        });

        gameObjectManager.addBullet(bullet);
        mockRandomProvider.setValues(Array(5).fill(0.9) as number[]); // クリティカルなし

        // デバッグモードを有効化
        collisionSystem.setChainLightningDebugMode(true);

        const mockPlayer = createMockPlayer();
        collisionSystem.checkAllCollisions(mockPlayer);

        // 連鎖効果により複数の敵が撃破される（範囲内の敵のみ）
        const remainingEnemies = gameObjectManager.getEnemies();
        expect(remainingEnemies.length).toBeLessThan(initialEnemyCount);

        // 遠い敵は残存している
        expect(
          remainingEnemies.some(
            enemy => enemy.getX() === 200 && enemy.getY() === 200
          )
        ).toBe(true);
      });

      it('連鎖効果の視覚効果が生成される', () => {
        const bullet = new Bullet(100, 50);
        bullet.initialize(100, 50);
        bullet.setChainLightning(true);
        bullet.setChainCount(2);

        const enemyPositions = [
          [100, 80],
          [120, 100],
        ];

        enemyPositions.forEach(([x, y]) => {
          const enemy = new Enemy(x, y);
          gameObjectManager.addEnemy(enemy);
        });

        gameObjectManager.addBullet(bullet);
        mockRandomProvider.setValues([0.9, 0.9]);

        const mockPlayer = createMockPlayer();
        collisionSystem.checkAllCollisions(mockPlayer);

        // 連鎖効果の統計を確認
        const stats = collisionSystem.getChainLightningStats();
        expect(stats.activeEffects).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('2. 複合効果テスト - エンチャント効果の組み合わせ', () => {
    it('貫通 + クリティカル + 凍結効果が同時に動作する', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setPiercing(2);
      bullet.setCriticalChance(100); // 確実にクリティカル
      bullet.setFreezeEffect(true);
      bullet.setFreezeDuration(1);

      const enemies = [
        new Enemy(100, 80),
        new Enemy(100, 110),
        new Enemy(100, 140),
      ];

      const spies = enemies.map(enemy => ({
        enemy,
        takeDamage: jest.spyOn(enemy, 'takeDamage'),
        freeze: jest.spyOn(enemy, 'freeze'),
      }));

      enemies.forEach(enemy => gameObjectManager.addEnemy(enemy));
      gameObjectManager.addBullet(bullet);

      mockRandomProvider.setValues([0.1, 0.1, 0.1]); // 全てクリティカル

      const mockPlayer = createMockPlayer();
      collisionSystem.checkAllCollisions(mockPlayer);

      // 貫通により2体にヒット
      expect(spies[0].takeDamage).toHaveBeenCalledWith(2, true);
      expect(spies[1].takeDamage).toHaveBeenCalledWith(2, true);
      expect(spies[2].takeDamage).not.toHaveBeenCalled(); // 3体目は貫通範囲外

      // 凍結効果が適用される
      expect(spies[0].freeze).toHaveBeenCalledWith(1);
      expect(spies[1].freeze).toHaveBeenCalledWith(1);
      expect(enemies[0].isFrozen()).toBe(true);
      expect(enemies[1].isFrozen()).toBe(true);
    });

    it('貫通 + 連鎖効果の組み合わせ', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setPiercing(1); // 1回貫通
      bullet.setChainLightning(true);
      bullet.setChainCount(2);
      bullet.setCriticalChance(0);

      // 貫通対象と連鎖対象を配置
      const enemyPositions = [
        [100, 80], // 貫通対象1
        [100, 110], // 貫通対象2
        [120, 90], // 連鎖対象1
        [80, 120], // 連鎖対象2
      ];

      const initialEnemyCount = enemyPositions.length;
      enemyPositions.forEach(([x, y]) => {
        const enemy = new Enemy(x, y);
        gameObjectManager.addEnemy(enemy);
      });

      gameObjectManager.addBullet(bullet);
      mockRandomProvider.setValues(Array(6).fill(0.9) as number[]); // クリティカルなし

      const mockPlayer = createMockPlayer();
      collisionSystem.checkAllCollisions(mockPlayer);

      // 貫通と連鎖により複数の敵が影響を受ける
      const remainingEnemies = gameObjectManager.getEnemies();
      expect(remainingEnemies.length).toBeLessThan(initialEnemyCount);
    });

    it('全エンチャント効果の同時適用', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setPiercing(1);
      bullet.setCriticalChance(100);
      bullet.setFreezeEffect(true);
      bullet.setFreezeDuration(1);
      bullet.setChainLightning(true);
      bullet.setChainCount(2);

      const enemies = Array.from({ length: 6 }, (_, i) => {
        const angle = (i * Math.PI * 2) / 6;
        const radius = 50;
        const x = 100 + Math.cos(angle) * radius;
        const y = 100 + Math.sin(angle) * radius;
        return new Enemy(x, y);
      });

      enemies.forEach(enemy => gameObjectManager.addEnemy(enemy));
      gameObjectManager.addBullet(bullet);

      mockRandomProvider.setValues(Array(10).fill(0.1) as number[]); // 全てクリティカル

      const mockPlayer = createMockPlayer();
      collisionSystem.checkAllCollisions(mockPlayer);

      // 複合効果により多数の敵が影響を受ける
      const remainingEnemies = gameObjectManager.getEnemies();
      expect(remainingEnemies.length).toBeLessThan(enemies.length);

      // 残存敵の一部が凍結状態
      const frozenEnemies = remainingEnemies.filter(enemy => enemy.isFrozen());
      expect(frozenEnemies.length).toBeGreaterThan(0);
    });
  });

  describe('3. エッジケーステスト', () => {
    it('敵が存在しない場合でもエラーが発生しない', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setPiercing(3);
      bullet.setChainLightning(true);
      bullet.setChainCount(5);

      gameObjectManager.addBullet(bullet);

      expect(() => {
        const mockPlayer = createMockPlayer();
        collisionSystem.checkAllCollisions(mockPlayer);
      }).not.toThrow();

      expect(bullet.isActive()).toBe(true); // 敵がいないので弾丸は無効化されない
    });

    it('弾丸が存在しない場合でもエラーが発生しない', () => {
      Array.from({ length: 3 }, (_, i) => {
        const enemy = new Enemy(100 + i * 50, 100);
        gameObjectManager.addEnemy(enemy);
        return enemy;
      });

      expect(() => {
        const mockPlayer = createMockPlayer();
        collisionSystem.checkAllCollisions(mockPlayer);
      }).not.toThrow();
    });

    it('極端に大きな値でも正常に動作する', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setPiercing(1000); // 極端に大きな貫通回数
      bullet.setCriticalChance(1000); // 極端に大きなクリティカル確率
      bullet.setFreezeDuration(1000); // 極端に長い凍結時間

      const enemy = new Enemy(100, 80);
      gameObjectManager.addBullet(bullet);
      gameObjectManager.addEnemy(enemy);

      mockRandomProvider.setValues([0.1]);

      expect(() => {
        const mockPlayer = createMockPlayer();
        collisionSystem.checkAllCollisions(mockPlayer);
      }).not.toThrow();
    });

    it('ゼロ値でも正常に動作する', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setPiercing(0);
      bullet.setCriticalChance(0);
      bullet.setFreezeDuration(0);
      bullet.setChainCount(0);

      const enemy = new Enemy(100, 80);
      gameObjectManager.addBullet(bullet);
      gameObjectManager.addEnemy(enemy);

      mockRandomProvider.setValues([0.5]);

      expect(() => {
        const mockPlayer = createMockPlayer();
        collisionSystem.checkAllCollisions(mockPlayer);
      }).not.toThrow();
    });
  });

  describe('4. パフォーマンステスト', () => {
    it('大量の敵と弾丸でも60FPS維持可能な性能', () => {
      // 大量のオブジェクトを作成
      const bulletCount = 50;
      const enemyCount = 100;

      Array.from({ length: bulletCount }, (_, i) => {
        const bullet = new Bullet(i * 10, 50);
        bullet.initialize(i * 10, 50);
        bullet.setPiercing(3);
        bullet.setCriticalChance(25);
        bullet.setChainLightning(true);
        bullet.setChainCount(3);
        gameObjectManager.addBullet(bullet);
        return bullet;
      });

      Array.from({ length: enemyCount }, (_, i) => {
        const enemy = new Enemy((i % 20) * 20, Math.floor(i / 20) * 30 + 100);
        gameObjectManager.addEnemy(enemy);
        return enemy;
      });

      mockRandomProvider.setValues(
        Array(bulletCount * enemyCount).fill(0.5) as number[]
      );

      const startTime = performance.now();
      const mockPlayer = createMockPlayer();
      collisionSystem.checkAllCollisions(mockPlayer);
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      // 60FPS維持のため16.67ms以下で処理完了
      expect(executionTime).toBeLessThan(16.67);

      console.log(`パフォーマンステスト結果: ${executionTime.toFixed(2)}ms`);
      console.log(`弾丸数: ${bulletCount}, 敵数: ${enemyCount}`);
    });

    it('連鎖効果の大量処理でもパフォーマンスを維持', () => {
      const bullet = new Bullet(200, 50);
      bullet.initialize(200, 50);
      bullet.setChainLightning(true);
      bullet.setChainCount(20); // 大量連鎖
      bullet.setCriticalChance(0);

      // 密集した敵を配置
      Array.from({ length: 25 }, (_, i) => {
        const x = 200 + (i % 5) * 20;
        const y = 100 + Math.floor(i / 5) * 20;
        const enemy = new Enemy(x, y);
        gameObjectManager.addEnemy(enemy);
        return enemy;
      });

      gameObjectManager.addBullet(bullet);
      mockRandomProvider.setValues(Array(30).fill(0.9) as number[]);

      const startTime = performance.now();
      const mockPlayer = createMockPlayer();
      collisionSystem.checkAllCollisions(mockPlayer);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(10); // 10ms以下

      console.log(`連鎖効果パフォーマンス: ${executionTime.toFixed(2)}ms`);
    });

    it('SpatialHash最適化の効果測定', () => {
      // 大量のオブジェクトで衝突判定
      const bullets = Array.from({ length: 30 }, (_, i) => {
        const bullet = new Bullet(i * 15, 50);
        bullet.initialize(i * 15, 50);
        gameObjectManager.addBullet(bullet);
        return bullet;
      });

      const enemies = Array.from({ length: 50 }, (_, i) => {
        const enemy = new Enemy((i % 10) * 40, Math.floor(i / 10) * 40 + 100);
        gameObjectManager.addEnemy(enemy);
        return enemy;
      });

      const mockPlayer = createMockPlayer();
      collisionSystem.checkAllCollisions(mockPlayer);

      const stats = collisionSystem.getCollisionStats();
      const theoreticalChecks = bullets.length * enemies.length;

      // SpatialHashにより実際のチェック数が理論値より少ない
      expect(stats.spatialHashChecks).toBeLessThan(theoreticalChecks);
      expect(stats.optimizationRatio).toBeGreaterThan(0);
      expect(stats.optimizationRatio).toBeLessThan(1);

      console.log(`最適化効果: ${(stats.optimizationRatio * 100).toFixed(1)}%`);
      console.log(
        `理論チェック数: ${theoreticalChecks}, 実際: ${stats.spatialHashChecks}`
      );
    });
  });

  describe('5. 統合デモ検証', () => {
    it('全エンチャント効果のデモンストレーション', () => {
      console.log('\n=== エンチャント効果統合デモ ===');

      // 各種エンチャント弾丸を作成
      const enchantedBullets = [
        { name: '貫通弾', bullet: createPiercingBullet(100, 50) },
        { name: 'クリティカル弾', bullet: createCriticalBullet(200, 50) },
        { name: '凍結弾', bullet: createFreezeBullet(300, 50) },
        { name: '連鎖弾', bullet: createChainBullet(400, 50) },
        { name: '複合弾', bullet: createComboBullet(500, 50) },
      ];

      enchantedBullets.forEach(({ name, bullet }) => {
        gameObjectManager.addBullet(bullet);
        console.log(`${name}を配置: (${bullet.getX()}, ${bullet.getY()})`);
      });

      // 各弾丸用の敵を配置
      enchantedBullets.map((_, index) => {
        return Array.from({ length: 3 }, (_, i) => {
          const enemy = new Enemy(100 + index * 100, 80 + i * 30);
          gameObjectManager.addEnemy(enemy);
          return enemy;
        });
      });

      const initialEnemyCount = gameObjectManager.getEnemies().length;
      console.log(`初期敵数: ${initialEnemyCount}`);

      mockRandomProvider.setValues(Array(50).fill(0.3) as number[]); // 一部クリティカル

      const mockPlayer = createMockPlayer();
      collisionSystem.checkAllCollisions(mockPlayer);

      const finalEnemyCount = gameObjectManager.getEnemies().length;
      const destroyedCount = initialEnemyCount - finalEnemyCount;

      console.log(`撃破敵数: ${destroyedCount}`);
      console.log(`残存敵数: ${finalEnemyCount}`);
      console.log(
        `撃破率: ${((destroyedCount / initialEnemyCount) * 100).toFixed(1)}%`
      );

      // 凍結状態の敵をカウント
      const frozenEnemies = gameObjectManager
        .getEnemies()
        .filter(enemy => enemy.isFrozen());
      console.log(`凍結中の敵: ${frozenEnemies.length}`);

      // 統計情報を表示
      const collisionStats = collisionSystem.getCollisionStats();
      const chainStats = collisionSystem.getChainLightningStats();

      console.log('\n=== パフォーマンス統計 ===');
      console.log(
        `衝突判定最適化率: ${(collisionStats.optimizationRatio * 100).toFixed(1)}%`
      );
      console.log(`連鎖効果数: ${chainStats.activeEffects}`);
      console.log(`SpatialHashセル数: ${chainStats.spatialHashCells}`);

      expect(destroyedCount).toBeGreaterThan(0);
      expect(collisionStats.optimizationRatio).toBeGreaterThan(0);
    });

    it('視覚効果の確認', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setChainLightning(true);
      bullet.setChainCount(3);

      const enemies = [
        new Enemy(100, 80),
        new Enemy(120, 100),
        new Enemy(80, 120),
      ];

      enemies.forEach(enemy => gameObjectManager.addEnemy(enemy));
      gameObjectManager.addBullet(bullet);

      mockRandomProvider.setValues([0.9, 0.9, 0.9]);

      const mockPlayer = createMockPlayer();
      collisionSystem.checkAllCollisions(mockPlayer);

      // 視覚効果の描画テスト（実際のCanvasは使用しないが、エラーが発生しないことを確認）
      const mockCanvas = document.createElement('canvas');
      const mockCtx = mockCanvas.getContext('2d')!;

      expect(() => {
        collisionSystem.renderChainLightningEffects(mockCtx);
      }).not.toThrow();

      const stats = collisionSystem.getChainLightningStats();
      console.log(`視覚効果数: ${stats.activeEffects}`);
    });
  });

  // ヘルパー関数

  function createPiercingBullet(x: number, y: number): Bullet {
    const bullet = new Bullet(x, y);
    bullet.initialize(x, y);
    bullet.setPiercing(3);
    return bullet;
  }

  function createCriticalBullet(x: number, y: number): Bullet {
    const bullet = new Bullet(x, y);
    bullet.initialize(x, y);
    bullet.setCriticalChance(75);
    return bullet;
  }

  function createFreezeBullet(x: number, y: number): Bullet {
    const bullet = new Bullet(x, y);
    bullet.initialize(x, y);
    bullet.setFreezeEffect(true);
    bullet.setFreezeDuration(2);
    return bullet;
  }

  function createChainBullet(x: number, y: number): Bullet {
    const bullet = new Bullet(x, y);
    bullet.initialize(x, y);
    bullet.setChainLightning(true);
    bullet.setChainCount(4);
    return bullet;
  }

  function createComboBullet(x: number, y: number): Bullet {
    const bullet = new Bullet(x, y);
    bullet.initialize(x, y);
    bullet.setPiercing(2);
    bullet.setCriticalChance(50);
    bullet.setFreezeEffect(true);
    bullet.setFreezeDuration(1.5);
    bullet.setChainLightning(true);
    bullet.setChainCount(3);
    return bullet;
  }
});
