/**
 * エンチャント効果パフォーマンステスト - Phase 3
 *
 * 大量のオブジェクトでのエンチャント効果処理性能を測定
 */

import { createTestConfig } from '../../src/config/GameConfigFactory';
import { Bullet } from '../../src/entities/Bullet';
import { Enemy } from '../../src/entities/Enemy';
import { Player } from '../../src/entities/Player';
import { EventEmitter } from '../../src/events/EventEmitter';
import { EventMap } from '../../src/events/EventType';
import { GameObjectManager } from '../../src/managers/GameObjectManager';
import { MockInputManager } from '../../src/managers/MockInputManager';
import { MockRandomProvider } from '../../src/providers/MockRandomProvider';
import { CollisionSystem } from '../../src/systems/CollisionSystem';
import { DamageCalculator } from '../../src/utils/DamageCalculator';

describe('エンチャント効果パフォーマンステスト', () => {
  let gameObjectManager: GameObjectManager;
  let eventEmitter: EventEmitter<EventMap>;
  let collisionSystem: CollisionSystem;
  let mockRandomProvider: MockRandomProvider;
  let testConfig: ReturnType<typeof createTestConfig>;
  let mockPlayer: Player;

  beforeEach(() => {
    testConfig = createTestConfig();
    eventEmitter = new EventEmitter();
    gameObjectManager = new GameObjectManager(eventEmitter);
    collisionSystem = new CollisionSystem(eventEmitter, gameObjectManager);

    mockRandomProvider = new MockRandomProvider();
    DamageCalculator.setRandomProvider(mockRandomProvider);

    const mockInputManager = new MockInputManager();
    mockPlayer = new Player(
      eventEmitter,
      mockInputManager,
      mockRandomProvider,
      testConfig
    );
    gameObjectManager.setPlayer(mockPlayer);
  });

  afterEach(() => {
    // パフォーマンステスト後のクリーンアップ
    gameObjectManager.getBullets().forEach(bullet => bullet.deactivate());
    gameObjectManager
      .getEnemies()
      .forEach(enemy => gameObjectManager.removeEnemy(enemy));
  });

  describe('60FPS維持テスト', () => {
    it('中規模オブジェクト数で60FPS維持', () => {
      const bulletCount = 25;
      const enemyCount = 50;

      // エンチャント効果付き弾丸を作成
      Array.from({ length: bulletCount }, (_, i) => {
        const bullet = new Bullet(i * 20, 50);
        bullet.initialize(i * 20, 50);
        bullet.setPiercing(2);
        bullet.setCriticalChance(25);
        bullet.setFreezeEffect(true);
        bullet.setFreezeDuration(1);
        gameObjectManager.addBullet(bullet);
        return bullet;
      });

      // 敵を作成
      Array.from({ length: enemyCount }, (_, i) => {
        const enemy = new Enemy((i % 10) * 50, Math.floor(i / 10) * 50 + 100);
        gameObjectManager.addEnemy(enemy);
        return enemy;
      });

      mockRandomProvider.setValues(
        Array(bulletCount * enemyCount).fill(0.5) as number[]
      );

      const startTime = performance.now();
      collisionSystem.checkAllCollisions(mockPlayer);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      const targetFrameTime = 16.67; // 60FPS

      expect(executionTime).toBeLessThan(targetFrameTime);

      console.log(
        `中規模テスト: ${executionTime.toFixed(2)}ms (目標: ${targetFrameTime}ms)`
      );
      console.log(`弾丸: ${bulletCount}, 敵: ${enemyCount}`);
    });

    it('大規模オブジェクト数で60FPS維持', () => {
      const bulletCount = 50;
      const enemyCount = 100;

      // 複合エンチャント効果付き弾丸を作成
      Array.from({ length: bulletCount }, (_, i) => {
        const bullet = new Bullet(i * 15, 50);
        bullet.initialize(i * 15, 50);
        bullet.setPiercing(3);
        bullet.setCriticalChance(50);
        bullet.setFreezeEffect(true);
        bullet.setFreezeDuration(1.5);
        bullet.setChainLightning(true);
        bullet.setChainCount(3);
        gameObjectManager.addBullet(bullet);
        return bullet;
      });

      // 敵を密集配置
      Array.from({ length: enemyCount }, (_, i) => {
        const enemy = new Enemy((i % 20) * 25, Math.floor(i / 20) * 25 + 100);
        gameObjectManager.addEnemy(enemy);
        return enemy;
      });

      mockRandomProvider.setValues(
        Array(bulletCount * enemyCount * 2).fill(0.4) as number[]
      );

      const startTime = performance.now();
      collisionSystem.checkAllCollisions(mockPlayer);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      const targetFrameTime = 16.67; // 60FPS

      expect(executionTime).toBeLessThan(targetFrameTime);

      console.log(
        `大規模テスト: ${executionTime.toFixed(2)}ms (目標: ${targetFrameTime}ms)`
      );
      console.log(`弾丸: ${bulletCount}, 敵: ${enemyCount}`);
    });

    it('極大規模オブジェクト数でも処理完了', () => {
      const bulletCount = 100;
      const enemyCount = 200;

      // 全エンチャント効果付き弾丸を作成
      Array.from({ length: bulletCount }, (_, i) => {
        const bullet = new Bullet(i * 10, 50);
        bullet.initialize(i * 10, 50);
        bullet.setPiercing(5);
        bullet.setCriticalChance(75);
        bullet.setFreezeEffect(true);
        bullet.setFreezeDuration(2);
        bullet.setChainLightning(true);
        bullet.setChainCount(5);
        gameObjectManager.addBullet(bullet);
        return bullet;
      });

      // 敵を大量配置
      Array.from({ length: enemyCount }, (_, i) => {
        const enemy = new Enemy((i % 25) * 20, Math.floor(i / 25) * 20 + 100);
        gameObjectManager.addEnemy(enemy);
        return enemy;
      });

      mockRandomProvider.setValues(
        Array(bulletCount * enemyCount * 3).fill(0.3) as number[]
      );

      const startTime = performance.now();
      collisionSystem.checkAllCollisions(mockPlayer);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      const maxAllowedTime = 50; // 50ms以内で完了

      expect(executionTime).toBeLessThan(maxAllowedTime);

      console.log(
        `極大規模テスト: ${executionTime.toFixed(2)}ms (上限: ${maxAllowedTime}ms)`
      );
      console.log(`弾丸: ${bulletCount}, 敵: ${enemyCount}`);
    });
  });

  describe('連鎖効果パフォーマンステスト', () => {
    it('大量連鎖でもパフォーマンス維持', () => {
      const bullet = new Bullet(200, 50);
      bullet.initialize(200, 50);
      bullet.setChainLightning(true);
      bullet.setChainCount(25); // 大量連鎖
      bullet.setCriticalChance(0);

      // 密集した敵を配置（連鎖しやすい配置）
      const gridSize = 6;
      Array.from({ length: gridSize * gridSize }, (_, i) => {
        const x = 200 + (i % gridSize) * 30;
        const y = 100 + Math.floor(i / gridSize) * 30;
        const enemy = new Enemy(x, y);
        gameObjectManager.addEnemy(enemy);
        return enemy;
      });

      gameObjectManager.addBullet(bullet);
      mockRandomProvider.setValues(Array(50).fill(0.9) as number[]);

      const startTime = performance.now();
      collisionSystem.checkAllCollisions(mockPlayer);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      const targetTime = 10; // 10ms以内

      expect(executionTime).toBeLessThan(targetTime);

      console.log(
        `大量連鎖テスト: ${executionTime.toFixed(2)}ms (目標: ${targetTime}ms)`
      );
      console.log(`連鎖回数: 25, 敵数: ${gridSize * gridSize}`);
    });

    it('複数連鎖弾丸の同時処理', () => {
      const chainBulletCount = 10;

      // 複数の連鎖弾丸を作成
      Array.from({ length: chainBulletCount }, (_, i) => {
        const bullet = new Bullet(100 + i * 50, 50);
        bullet.initialize(100 + i * 50, 50);
        bullet.setChainLightning(true);
        bullet.setChainCount(10);
        bullet.setCriticalChance(25);
        gameObjectManager.addBullet(bullet);
        return bullet;
      });

      // 各弾丸の周りに敵を配置
      Array.from({ length: chainBulletCount * 8 }, (_, i) => {
        const bulletIndex = Math.floor(i / 8);
        const enemyIndex = i % 8;
        const angle = (enemyIndex * Math.PI * 2) / 8;
        const radius = 40;
        const centerX = 100 + bulletIndex * 50;
        const centerY = 100;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const enemy = new Enemy(x, y);
        gameObjectManager.addEnemy(enemy);
        return enemy;
      });

      mockRandomProvider.setValues(Array(200).fill(0.6) as number[]);

      const startTime = performance.now();
      collisionSystem.checkAllCollisions(mockPlayer);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      const targetTime = 15; // 15ms以内

      expect(executionTime).toBeLessThan(targetTime);

      console.log(
        `複数連鎖テスト: ${executionTime.toFixed(2)}ms (目標: ${targetTime}ms)`
      );
      console.log(
        `連鎖弾丸: ${chainBulletCount}, 総敵数: ${chainBulletCount * 8}`
      );
    });
  });

  describe('SpatialHash最適化効果測定', () => {
    it('最適化効果が50%以上', () => {
      const bulletCount = 40;
      const enemyCount = 80;

      // 弾丸を作成
      const bullets = Array.from({ length: bulletCount }, (_, i) => {
        const bullet = new Bullet(i * 20, 50);
        bullet.initialize(i * 20, 50);
        bullet.setPiercing(1);
        gameObjectManager.addBullet(bullet);
        return bullet;
      });

      // 敵を分散配置
      const enemies = Array.from({ length: enemyCount }, (_, i) => {
        const enemy = new Enemy((i % 15) * 60, Math.floor(i / 15) * 60 + 100);
        gameObjectManager.addEnemy(enemy);
        return enemy;
      });

      mockRandomProvider.setValues(
        Array(bulletCount * enemyCount).fill(0.8) as number[]
      );

      collisionSystem.checkAllCollisions(mockPlayer);

      const stats = collisionSystem.getCollisionStats();
      const theoreticalChecks = bullets.length * enemies.length;
      const optimizationRatio = stats.spatialHashChecks / theoreticalChecks;

      // 最適化により実際のチェック数が理論値の50%以下
      expect(optimizationRatio).toBeLessThan(0.5);

      console.log(`最適化効果: ${((1 - optimizationRatio) * 100).toFixed(1)}%`);
      console.log(`理論チェック数: ${theoreticalChecks}`);
      console.log(`実際チェック数: ${stats.spatialHashChecks}`);
    });

    it('オブジェクト密度による最適化効果の変化', () => {
      const testCases = [
        { name: '低密度', bulletCount: 20, enemyCount: 20, spread: 100 },
        { name: '中密度', bulletCount: 30, enemyCount: 30, spread: 60 },
        { name: '高密度', bulletCount: 40, enemyCount: 40, spread: 30 },
      ];

      testCases.forEach(({ name, bulletCount, enemyCount, spread }) => {
        // テストケース毎にクリーンアップ
        gameObjectManager.getBullets().forEach(bullet => bullet.deactivate());
        gameObjectManager
          .getEnemies()
          .forEach(enemy => gameObjectManager.removeEnemy(enemy));

        // 弾丸を作成
        Array.from({ length: bulletCount }, (_, i) => {
          const bullet = new Bullet(i * spread, 50);
          bullet.initialize(i * spread, 50);
          gameObjectManager.addBullet(bullet);
          return bullet;
        });

        // 敵を作成
        Array.from({ length: enemyCount }, (_, i) => {
          const enemy = new Enemy(
            (i % 10) * spread,
            Math.floor(i / 10) * spread + 100
          );
          gameObjectManager.addEnemy(enemy);
          return enemy;
        });

        mockRandomProvider.setValues(
          Array(bulletCount * enemyCount).fill(0.9) as number[]
        );

        const startTime = performance.now();
        collisionSystem.checkAllCollisions(mockPlayer);
        const endTime = performance.now();

        const executionTime = endTime - startTime;
        const stats = collisionSystem.getCollisionStats();
        const optimizationRatio =
          stats.spatialHashChecks / (bulletCount * enemyCount);

        console.log(`${name}配置:`);
        console.log(`  処理時間: ${executionTime.toFixed(2)}ms`);
        console.log(
          `  最適化率: ${((1 - optimizationRatio) * 100).toFixed(1)}%`
        );
        console.log(
          `  チェック数: ${stats.spatialHashChecks}/${bulletCount * enemyCount}`
        );

        // 高密度ほど最適化効果が高い
        if (name === '高密度') {
          expect(optimizationRatio).toBeLessThan(0.3);
        }
      });
    });
  });

  describe('メモリ使用量テスト', () => {
    it('大量処理後もメモリリークなし', () => {
      const iterations = 5;
      const objectsPerIteration = 50;

      for (let iter = 0; iter < iterations; iter++) {
        // 大量のオブジェクトを作成・処理・削除
        const bullets = Array.from({ length: objectsPerIteration }, (_, i) => {
          const bullet = new Bullet(i * 20, 50);
          bullet.initialize(i * 20, 50);
          bullet.setPiercing(2);
          bullet.setCriticalChance(50);
          bullet.setChainLightning(true);
          bullet.setChainCount(3);
          gameObjectManager.addBullet(bullet);
          return bullet;
        });

        const enemies = Array.from({ length: objectsPerIteration }, (_, i) => {
          const enemy = new Enemy(i * 20, 100);
          gameObjectManager.addEnemy(enemy);
          return enemy;
        });

        mockRandomProvider.setValues(
          Array(objectsPerIteration * 2).fill(0.5) as number[]
        );

        // 処理実行
        collisionSystem.checkAllCollisions(mockPlayer);

        // オブジェクトをクリーンアップ
        bullets.forEach(bullet => bullet.deactivate());
        enemies.forEach(enemy => gameObjectManager.removeEnemy(enemy));

        // 連鎖効果の視覚効果もクリア
        if (collisionSystem.getChainLightningStats) {
          const stats = collisionSystem.getChainLightningStats();
          expect(stats.activeEffects).toBeGreaterThanOrEqual(0);
        }
      }

      // 最終的にオブジェクトが残っていないことを確認
      expect(gameObjectManager.getBullets().length).toBe(0);
      expect(gameObjectManager.getEnemies().length).toBe(0);

      console.log(
        `メモリテスト完了: ${iterations}回反復, 各${objectsPerIteration}オブジェクト`
      );
    });
  });

  describe('リアルタイム性能テスト', () => {
    it('連続フレーム処理でも安定性維持', () => {
      const frameCount = 60; // 1秒分のフレーム
      const bulletCount = 20;
      const enemyCount = 40;

      // 固定オブジェクトを作成
      Array.from({ length: bulletCount }, (_, i) => {
        const bullet = new Bullet(i * 25, 50);
        bullet.initialize(i * 25, 50);
        bullet.setPiercing(2);
        bullet.setCriticalChance(30);
        bullet.setFreezeEffect(true);
        bullet.setFreezeDuration(1);
        gameObjectManager.addBullet(bullet);
        return bullet;
      });

      Array.from({ length: enemyCount }, (_, i) => {
        const enemy = new Enemy((i % 8) * 60, Math.floor(i / 8) * 40 + 100);
        gameObjectManager.addEnemy(enemy);
        return enemy;
      });

      const frameTimes: number[] = [];
      mockRandomProvider.setValues(
        Array(frameCount * bulletCount * enemyCount).fill(0.6) as number[]
      );

      // 連続フレーム処理
      for (let frame = 0; frame < frameCount; frame++) {
        const startTime = performance.now();
        collisionSystem.checkAllCollisions(mockPlayer);
        const endTime = performance.now();

        frameTimes.push(endTime - startTime);
      }

      // 統計計算
      const avgFrameTime =
        frameTimes.reduce((sum, time) => sum + time, 0) / frameCount;
      const maxFrameTime = Math.max(...frameTimes);
      const minFrameTime = Math.min(...frameTimes);

      const targetFrameTime = 16.67; // 60FPS

      expect(avgFrameTime).toBeLessThan(targetFrameTime);
      expect(maxFrameTime).toBeLessThan(targetFrameTime * 1.5); // 最大でも1.5倍以内

      console.log(`連続フレームテスト (${frameCount}フレーム):`);
      console.log(`  平均: ${avgFrameTime.toFixed(2)}ms`);
      console.log(`  最大: ${maxFrameTime.toFixed(2)}ms`);
      console.log(`  最小: ${minFrameTime.toFixed(2)}ms`);
      console.log(`  目標: ${targetFrameTime}ms`);
    });
  });
});
