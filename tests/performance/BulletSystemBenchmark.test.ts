import { createGameConfig } from '../../src/config/GameConfigFactory';
import {
  AdvancedBulletType,
  createAdvancedBullet,
} from '../../src/entities/bullets';
import { Enemy } from '../../src/entities/Enemy';
import { Player } from '../../src/entities/Player';
import { EventEmitter } from '../../src/events/EventEmitter';
import { EventMap } from '../../src/events/EventType';
import { BulletFactory } from '../../src/factories/BulletFactory';
import { IBullet } from '../../src/interfaces/IBullet';
import { BulletManager } from '../../src/managers/BulletManager';
import { GameObjectManager } from '../../src/managers/GameObjectManager';
import { MockInputManager } from '../../src/managers/MockInputManager';
import { MockRandomProvider } from '../../src/providers/MockRandomProvider';
import { CollisionSystem } from '../../src/systems/CollisionSystem';

/**
 * 弾丸システムパフォーマンスベンチマーク
 *
 * 詳細なパフォーマンス測定と最適化確認を実施します。
 */
describe('弾丸システムパフォーマンスベンチマーク', () => {
  let bulletManager: BulletManager;
  let collisionSystem: CollisionSystem;
  let gameObjectManager: GameObjectManager;
  let eventEmitter: EventEmitter<EventMap>;

  beforeEach(() => {
    const mockInputManager = new MockInputManager();
    const mockRandomProvider = new MockRandomProvider();
    const gameConfig = createGameConfig();

    eventEmitter = new EventEmitter<EventMap>();
    gameObjectManager = new GameObjectManager(eventEmitter);
    bulletManager = new BulletManager(gameObjectManager);
    collisionSystem = new CollisionSystem(eventEmitter, gameObjectManager);

    // Player インスタンスは必要に応じて各テスト内で作成
    new Player(eventEmitter, mockInputManager, mockRandomProvider, gameConfig);
  });

  describe('大量弾丸生成パフォーマンス', () => {
    test('1000個の弾丸生成時間測定', () => {
      const startTime = performance.now();
      const bullets: IBullet[] = [];

      for (let i = 0; i < 1000; i++) {
        bullets.push(
          BulletFactory.createPlayerBullet({
            x: i % 800,
            y: i % 600,
          })
        );
      }

      const endTime = performance.now();
      const creationTime = endTime - startTime;

      console.log(`🔫 1000個弾丸生成時間: ${creationTime.toFixed(2)}ms`);

      // 1000個の弾丸生成が100ms以内であることを確認
      expect(creationTime).toBeLessThan(100);
      expect(bullets.length).toBe(1000);

      // 全弾丸が有効であることを確認
      const validBullets = bullets.filter(bullet =>
        BulletFactory.validateBullet(bullet)
      );
      expect(validBullets.length).toBe(1000);
    });

    test('特殊弾丸生成パフォーマンス', () => {
      const bulletTypes = [
        AdvancedBulletType.EXPLOSIVE,
        AdvancedBulletType.HOMING,
        AdvancedBulletType.REFLECTING,
        AdvancedBulletType.SPLIT,
      ];

      const results: Record<string, number> = {};

      bulletTypes.forEach(type => {
        const startTime = performance.now();
        const bullets: IBullet[] = [];

        for (let i = 0; i < 100; i++) {
          bullets.push(
            createAdvancedBullet({
              type,
              x: i % 800,
              y: i % 600,
              speedX: 0,
              speedY: -5,
            })
          );
        }

        const endTime = performance.now();
        const creationTime = endTime - startTime;
        results[type] = creationTime;

        console.log(
          `⚡ ${type}弾丸100個生成時間: ${creationTime.toFixed(2)}ms`
        );

        // 各特殊弾丸タイプの生成が50ms以内であることを確認
        expect(creationTime).toBeLessThan(50);
        expect(bullets.length).toBe(100);
      });

      // 結果をログ出力
      console.table(results);
    });
  });

  describe('メモリ使用量詳細分析', () => {
    test('弾丸生成・削除サイクルのメモリ効率', () => {
      const performanceWithMemory = performance as unknown as {
        memory?: { usedJSHeapSize: number };
      };
      const initialMemory = performanceWithMemory.memory?.usedJSHeapSize ?? 0;
      const memorySnapshots: number[] = [];

      // 10回のサイクルを実行
      for (let cycle = 0; cycle < 10; cycle++) {
        const bullets: IBullet[] = [];

        // 500個の弾丸を生成
        for (let i = 0; i < 500; i++) {
          bullets.push(
            BulletFactory.createPlayerBullet({
              x: Math.random() * 800,
              y: Math.random() * 600,
            })
          );
        }

        // 弾丸を非アクティブ化
        bullets.forEach(bullet => bullet.deactivate());

        // メモリ使用量を記録
        const currentMemory = performanceWithMemory.memory?.usedJSHeapSize ?? 0;
        memorySnapshots.push(currentMemory - initialMemory);

        // 強制ガベージコレクション（可能な場合）
        const globalWithGc = globalThis as unknown as { gc?: () => void };
        if (globalWithGc.gc) {
          globalWithGc.gc();
        }
      }

      console.log('📊 メモリ使用量推移:', memorySnapshots);

      // メモリ使用量が安定していることを確認
      const maxMemory = Math.max(...memorySnapshots);
      const minMemory = Math.min(...memorySnapshots);
      const memoryVariation = maxMemory - minMemory;

      console.log(`📈 メモリ使用量変動: ${memoryVariation} bytes`);

      // メモリ使用量の変動が初期メモリの50%以内であることを確認
      if (initialMemory > 0) {
        expect(memoryVariation).toBeLessThan(initialMemory * 0.5);
      }
    });

    test('オブジェクトプール効率測定', () => {
      const poolStats = bulletManager.getPerformanceStats();
      const initialStats = { ...poolStats.bullets };

      // 大量の弾丸を生成・削除
      for (let i = 0; i < 1000; i++) {
        const bullet = bulletManager.createPlayerBullet({
          x: i % 800,
          y: i % 600,
        });
        bullet.deactivate();
      }

      const finalStats = bulletManager.getPerformanceStats().bullets;
      const poolHitRate =
        finalStats.poolHits / (finalStats.poolHits + finalStats.poolMisses);

      console.log('🎯 オブジェクトプール統計:', {
        初期プールヒット: initialStats.poolHits,
        最終プールヒット: finalStats.poolHits,
        プールミス: finalStats.poolMisses,
        ヒット率: `${(poolHitRate * 100).toFixed(1)}%`,
      });

      // プールヒット率が70%以上であることを確認
      expect(poolHitRate).toBeGreaterThan(0.7);
    });
  });

  describe('フレームレート安定性検証', () => {
    test('60FPS維持 - 複雑なシナリオ', () => {
      const frameCount = 300; // 5秒間のテスト
      const frameTimes: number[] = [];
      const bullets: IBullet[] = [];
      const enemies: Enemy[] = [];

      for (let frame = 0; frame < frameCount; frame++) {
        const frameStart = performance.now();

        // 弾丸生成（毎フレーム2個）
        for (let i = 0; i < 2; i++) {
          bullets.push(
            BulletFactory.createPlayerBullet({
              x: Math.random() * 800,
              y: Math.random() * 600,
            })
          );
        }

        // 敵生成（10フレームごと）
        if (frame % 10 === 0) {
          enemies.push(new Enemy(Math.random() * 800, 50, 'SMALL'));
        }

        // 弾丸更新
        bullets.forEach(bullet => bullet.update(16.67));

        // 敵更新
        enemies.forEach(enemy => enemy.update(16.67));

        // 衝突判定
        collisionSystem.checkCollisions();

        // 非アクティブオブジェクトの削除
        for (let i = bullets.length - 1; i >= 0; i--) {
          if (!bullets[i].isActive()) {
            bullets.splice(i, 1);
          }
        }

        const frameEnd = performance.now();
        const frameTime = frameEnd - frameStart;
        frameTimes.push(frameTime);
      }

      // フレーム時間統計
      const averageFrameTime =
        frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const maxFrameTime = Math.max(...frameTimes);
      const minFrameTime = Math.min(...frameTimes);

      console.log('🎮 フレームレート統計:', {
        平均フレーム時間: `${averageFrameTime.toFixed(2)}ms`,
        最大フレーム時間: `${maxFrameTime.toFixed(2)}ms`,
        最小フレーム時間: `${minFrameTime.toFixed(2)}ms`,
        平均FPS: `${(1000 / averageFrameTime).toFixed(1)}`,
        最終弾丸数: bullets.length,
        最終敵数: enemies.length,
      });

      // 60FPS維持確認（16.67ms未満）
      expect(averageFrameTime).toBeLessThan(16.67);
      expect(maxFrameTime).toBeLessThan(33.33); // 30FPS以上は維持
    });

    test('CPU使用率最適化確認', () => {
      const testDuration = 1000; // 1秒間のテスト
      const startTime = performance.now();
      let operationCount = 0;

      const bullets: IBullet[] = [];
      const enemies: Enemy[] = [];

      // 初期オブジェクト生成
      for (let i = 0; i < 100; i++) {
        bullets.push(
          BulletFactory.createPlayerBullet({
            x: Math.random() * 800,
            y: Math.random() * 600,
          })
        );
        enemies.push(
          new Enemy(Math.random() * 800, Math.random() * 600, 'SMALL')
        );
      }

      // 1秒間処理を実行
      while (performance.now() - startTime < testDuration) {
        // 弾丸更新
        bullets.forEach(bullet => bullet.update(16.67));

        // 敵更新
        enemies.forEach(enemy => enemy.update(16.67));

        // 衝突判定
        collisionSystem.checkCollisions();

        operationCount++;
      }

      const actualDuration = performance.now() - startTime;
      const operationsPerSecond = (operationCount / actualDuration) * 1000;

      console.log('⚡ CPU効率統計:', {
        実行時間: `${actualDuration.toFixed(2)}ms`,
        操作回数: operationCount,
        秒間操作数: operationsPerSecond.toFixed(0),
        弾丸数: bullets.length,
        敵数: enemies.length,
      });

      // 最低限の処理効率を確認
      expect(operationsPerSecond).toBeGreaterThan(100);
    });
  });

  describe('スケーラビリティテスト', () => {
    test('弾丸数増加時のパフォーマンス劣化測定', () => {
      const bulletCounts = [100, 500, 1000, 2000, 5000];
      const results: Array<{ count: number; time: number; fps: number }> = [];

      bulletCounts.forEach(count => {
        const bullets: IBullet[] = [];

        // 指定数の弾丸を生成
        for (let i = 0; i < count; i++) {
          bullets.push(
            BulletFactory.createPlayerBullet({
              x: Math.random() * 800,
              y: Math.random() * 600,
            })
          );
        }

        // 10フレーム分の処理時間を測定
        const startTime = performance.now();
        for (let frame = 0; frame < 10; frame++) {
          bullets.forEach(bullet => bullet.update(16.67));
        }
        const endTime = performance.now();

        const totalTime = endTime - startTime;
        const averageFrameTime = totalTime / 10;
        const fps = 1000 / averageFrameTime;

        results.push({
          count,
          time: averageFrameTime,
          fps,
        });

        console.log(
          `📊 弾丸${count}個: ${averageFrameTime.toFixed(2)}ms (${fps.toFixed(1)}FPS)`
        );
      });

      console.table(results);

      // 1000個までは60FPS維持、5000個でも30FPS以上維持
      const result1000 = results.find(r => r.count === 1000);
      const result5000 = results.find(r => r.count === 5000);

      if (result1000) {
        expect(result1000.fps).toBeGreaterThan(60);
      }
      if (result5000) {
        expect(result5000.fps).toBeGreaterThan(30);
      }
    });

    test('メモリ使用量スケーラビリティ', () => {
      const bulletCounts = [1000, 5000, 10000];
      const memoryResults: Array<{ count: number; memory: number }> = [];

      bulletCounts.forEach(count => {
        const performanceWithMemory = performance as unknown as {
          memory?: { usedJSHeapSize: number };
        };
        const initialMemory = performanceWithMemory.memory?.usedJSHeapSize ?? 0;
        const bullets: IBullet[] = [];

        // 指定数の弾丸を生成
        for (let i = 0; i < count; i++) {
          bullets.push(
            BulletFactory.createPlayerBullet({
              x: i % 800,
              y: i % 600,
            })
          );
        }

        const finalMemory = performanceWithMemory.memory?.usedJSHeapSize ?? 0;
        const memoryUsed = finalMemory - initialMemory;

        memoryResults.push({
          count,
          memory: memoryUsed,
        });

        console.log(
          `💾 弾丸${count}個: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB`
        );

        // 弾丸を削除してメモリを解放
        bullets.forEach(bullet => bullet.deactivate());
      });

      console.table(memoryResults);

      // メモリ使用量が線形に増加していることを確認
      if (memoryResults.length >= 2) {
        const ratio = memoryResults[1].memory / memoryResults[0].memory;
        const expectedRatio = memoryResults[1].count / memoryResults[0].count;

        // メモリ使用量の増加率が弾丸数の増加率の2倍以内であることを確認
        expect(ratio).toBeLessThan(expectedRatio * 2);
      }
    });
  });

  describe('最適化効果測定', () => {
    test('SpatialHash衝突判定最適化効果', () => {
      const bullets: IBullet[] = [];
      const enemies: Enemy[] = [];

      // テスト用オブジェクト生成
      for (let i = 0; i < 200; i++) {
        bullets.push(
          BulletFactory.createPlayerBullet({
            x: Math.random() * 800,
            y: Math.random() * 600,
          })
        );
      }

      for (let i = 0; i < 50; i++) {
        enemies.push(
          new Enemy(Math.random() * 800, Math.random() * 600, 'SMALL')
        );
      }

      // 衝突判定パフォーマンス測定
      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        collisionSystem.checkCollisions();
      }
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const averageTime = totalTime / 100;

      console.log('🎯 衝突判定最適化統計:', {
        総実行時間: `${totalTime.toFixed(2)}ms`,
        平均実行時間: `${averageTime.toFixed(2)}ms`,
        弾丸数: bullets.length,
        敵数: enemies.length,
        最適化統計: collisionSystem.getOptimizationStats(),
      });

      // 衝突判定が効率的に実行されていることを確認
      expect(averageTime).toBeLessThan(5); // 5ms以内
    });

    test('パフォーマンス統計の正確性', () => {
      // BulletManagerの統計機能をテスト
      const initialStats = bulletManager.getPerformanceStats();

      // 弾丸を生成・削除
      const bullets: IBullet[] = [];
      for (let i = 0; i < 100; i++) {
        bullets.push(
          bulletManager.createPlayerBullet({
            x: i % 800,
            y: i % 600,
          })
        );
      }

      bullets.forEach(bullet => bullet.deactivate());

      const finalStats = bulletManager.getPerformanceStats();

      console.log('📈 パフォーマンス統計比較:', {
        初期統計: initialStats.bullets,
        最終統計: finalStats.bullets,
        プール統計: finalStats.pools,
      });

      // 統計が正確に記録されていることを確認
      expect(finalStats.bullets.bulletsCreated).toBeGreaterThan(
        initialStats.bullets.bulletsCreated
      );
      expect(finalStats.bullets.bulletsDestroyed).toBeGreaterThanOrEqual(
        initialStats.bullets.bulletsDestroyed
      );
    });
  });
});
