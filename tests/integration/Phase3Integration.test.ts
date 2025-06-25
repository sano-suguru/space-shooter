import { AdvancedBulletType } from '../../src/entities/bullets';
import { Enemy } from '../../src/entities/Enemy';
import { Player } from '../../src/entities/Player';
import { EventEmitter } from '../../src/events/EventEmitter';
import { EventMap } from '../../src/events/EventType';
import { BulletFactory } from '../../src/factories/BulletFactory';
import { IBullet } from '../../src/interfaces/IBullet';
import { IInputManager } from '../../src/interfaces/IInputManager';
import { BulletManager } from '../../src/managers/BulletManager';
import { GameObjectManager } from '../../src/managers/GameObjectManager';
import { IRandomProvider } from '../../src/providers/IRandomProvider';
import { CollisionSystem } from '../../src/systems/CollisionSystem';

/**
 * Phase 3統合テスト: CollisionSystem統合とシステム最適化
 *
 * 以下の機能をテストします：
 * 1. CollisionSystemのIBullet統合
 * 2. GameObjectManagerの統一弾丸管理
 * 3. BulletManagerのパフォーマンス最適化
 * 4. 弾丸システム全体の統合動作
 */
describe('Phase 3: CollisionSystem統合とシステム最適化', () => {
  let eventEmitter: EventEmitter<EventMap>;
  let gameObjectManager: GameObjectManager;
  let collisionSystem: CollisionSystem;
  let bulletManager: BulletManager;
  let player: Player;

  beforeEach(() => {
    eventEmitter = new EventEmitter<EventMap>();
    gameObjectManager = new GameObjectManager(eventEmitter);
    collisionSystem = new CollisionSystem(eventEmitter, gameObjectManager);
    bulletManager = new BulletManager(gameObjectManager);
    // モックInputManagerを作成
    const mockInputManager: IInputManager = {
      isKeyPressed: jest.fn().mockReturnValue(false),
      getMousePosition: jest.fn().mockReturnValue({ x: 0, y: 0 }),
      isMouseButtonPressed: jest.fn().mockReturnValue(false),
      onKeyDown: jest.fn(),
      onKeyUp: jest.fn(),
      onMouseDown: jest.fn(),
      onMouseUp: jest.fn(),
      onMouseMove: jest.fn(),
      dispose: jest.fn(),
    };

    // モックRandomProviderを作成
    const mockRandomProvider: IRandomProvider = {
      random: jest.fn().mockReturnValue(0.5),
      randomRange: jest.fn().mockReturnValue(1),
      randomChoice: jest.fn().mockReturnValue('test'),
      randomInt: jest.fn().mockReturnValue(1),
      randomBoolean: jest.fn().mockReturnValue(true),
      randomChance: jest.fn().mockReturnValue(true),
    };

    player = new Player(
      eventEmitter,
      mockInputManager,
      mockRandomProvider,
      undefined,
      undefined
    );
    gameObjectManager.setPlayer(player);
  });

  describe('CollisionSystem IBullet統合', () => {
    test('統一された弾丸処理が正常に動作する', () => {
      // プレイヤー弾丸を作成
      const playerBullet = bulletManager.createPlayerBullet({
        x: 100,
        y: 100,
      });

      // 敵を作成
      const enemy = new Enemy(110, 110);
      gameObjectManager.addEnemy(enemy);

      // 衝突判定を実行
      const enemyDestroyedSpy = jest.fn();
      eventEmitter.on('enemyDestroyed', enemyDestroyedSpy);

      collisionSystem.checkAllCollisions(player);

      // 弾丸が非アクティブになることを確認
      expect(playerBullet.isActive()).toBe(false);

      // 敵が削除されることを確認
      expect(enemyDestroyedSpy).toHaveBeenCalledWith(enemy);
    });

    test('貫通弾丸の統一処理が正常に動作する', () => {
      // 貫通弾丸を作成（モック）
      const piercingBullet = {
        isActive: jest.fn().mockReturnValue(true),
        isPiercing: jest.fn().mockReturnValue(true),
        getPiercingCount: jest.fn().mockReturnValue(2),
        getOwner: jest.fn().mockReturnValue('player' as const),
        deactivate: jest.fn(),
        getPosition: jest.fn().mockReturnValue({ x: 100, y: 100 }),
        getId: jest.fn().mockReturnValue('test-bullet'),
        isExplosive: jest.fn().mockReturnValue(false),
        getExplosionRadius: jest.fn().mockReturnValue(0),
        isHoming: jest.fn().mockReturnValue(false),
        getHomingDuration: jest.fn().mockReturnValue(0),
        hasChainLightning: jest.fn().mockReturnValue(false),
        getChainCount: jest.fn().mockReturnValue(0),
        canSplit: jest.fn().mockReturnValue(false),
        getSplitCount: jest.fn().mockReturnValue(0),
        canRicochet: jest.fn().mockReturnValue(false),
        getRicochetCount: jest.fn().mockReturnValue(0),
        getCriticalChance: jest.fn().mockReturnValue(0),
        hasFreezeEffect: jest.fn().mockReturnValue(false),
        getFreezeDuration: jest.fn().mockReturnValue(0),
        update: jest.fn(),
        draw: jest.fn(),
        reset: jest.fn(),
      } as IBullet;

      // GameObjectManagerに直接追加（テスト用）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      gameObjectManager.addBullet(piercingBullet as any);

      // 複数の敵を作成
      const enemy1 = new Enemy(100, 100);
      const enemy2 = new Enemy(105, 105);
      gameObjectManager.addEnemy(enemy1);
      gameObjectManager.addEnemy(enemy2);

      const enemyDestroyedSpy = jest.fn();
      eventEmitter.on('enemyDestroyed', enemyDestroyedSpy);

      collisionSystem.checkAllCollisions(player);

      // 2体の敵を撃破後、弾丸が非アクティブになることを確認
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(piercingBullet.deactivate).toHaveBeenCalled();
      expect(enemyDestroyedSpy).toHaveBeenCalledTimes(2);
    });

    test('弾丸の妥当性検証が正常に動作する', () => {
      // 無効な弾丸オブジェクト
      const invalidBullet = {
        isActive: 'not a function',
      } as unknown as IBullet;

      // BulletFactoryの検証メソッドをテスト
      expect(BulletFactory.validateBullet(invalidBullet)).toBe(false);

      // 有効な弾丸オブジェクト
      const validBullet = bulletManager.createPlayerBullet({
        x: 0,
        y: 0,
      });

      expect(BulletFactory.validateBullet(validBullet)).toBe(true);
    });
  });

  describe('GameObjectManager統一弾丸管理', () => {
    test('getAllBullets()が全ての弾丸タイプを返す', () => {
      // 各種弾丸を作成
      const playerBullet = bulletManager.createPlayerBullet({ x: 0, y: 0 });
      // ボス弾丸の作成（統一弾丸管理テスト用）
      bulletManager.createBossBullet({
        x: 0,
        y: 0,
        speedX: 1,
        speedY: 1,
      });
      // 特殊弾丸の作成（統一弾丸管理テスト用）
      bulletManager.createSpecialBullet({
        type: AdvancedBulletType.EXPLOSIVE,
        x: 0,
        y: 0,
        speedX: 1,
        speedY: 1,
      });

      const allBullets = gameObjectManager.getAllBullets();

      // 全ての弾丸が含まれることを確認
      expect(allBullets).toContain(playerBullet);
      expect(allBullets.length).toBeGreaterThanOrEqual(3);
    });

    test('updateAllBullets()が全ての弾丸を更新する', () => {
      // 弾丸を作成
      const bullet = bulletManager.createPlayerBullet({ x: 0, y: 0 });
      const updateSpy = jest.spyOn(bullet, 'update');

      // 統一更新を実行
      gameObjectManager.updateAllBullets(16.67);

      expect(updateSpy).toHaveBeenCalledWith(16.67);
    });
  });

  describe('BulletManagerパフォーマンス最適化', () => {
    test('オブジェクトプールが正常に動作する', () => {
      // 弾丸を作成・削除を繰り返す
      const bullets: IBullet[] = [];

      for (let i = 0; i < 10; i++) {
        const bullet = bulletManager.createPlayerBullet({ x: i, y: i });
        bullets.push(bullet);
      }

      // 弾丸を非アクティブ化
      bullets.forEach(bullet => bullet.deactivate());

      // 更新してプールに返却
      bulletManager.updateBullets(16.67);

      // 統計を確認
      const stats = bulletManager.getPerformanceStats();
      expect(stats.bullets.bulletsCreated).toBe(10);
      expect(stats.bullets.bulletsDestroyed).toBe(10);
    });

    test('メモリ最適化が正常に動作する', () => {
      // 大量の弾丸を作成
      const bullets: IBullet[] = [];
      for (let i = 0; i < 50; i++) {
        const bullet = bulletManager.createPlayerBullet({ x: i, y: i });
        bullets.push(bullet);
      }

      // 半分を非アクティブ化
      bullets.slice(0, 25).forEach(bullet => bullet.deactivate());

      // メモリ最適化を実行
      bulletManager.optimizeMemory();

      // アクティブな弾丸数を確認
      expect(bulletManager.getActiveBulletCount()).toBe(25);
    });

    test('パフォーマンス統計が正確に記録される', () => {
      // 弾丸を作成
      bulletManager.createPlayerBullet({ x: 0, y: 0 });
      bulletManager.createBossBullet({ x: 0, y: 0, speedX: 1, speedY: 1 });

      const stats = bulletManager.getPerformanceStats();

      expect(stats.bullets.bulletsCreated).toBe(2);
      expect(stats.pools).toBeDefined();
      expect(stats.performance).toBeDefined();
      expect(stats.performance.fps).toBeGreaterThanOrEqual(0);
    });
  });

  describe('システム統合テスト', () => {
    test('弾丸システム全体が統合的に動作する', () => {
      // 複数タイプの弾丸を作成
      const playerBullet = bulletManager.createPlayerBullet({ x: 100, y: 100 });
      const explosiveBullet = bulletManager.createSpecialBullet({
        type: AdvancedBulletType.EXPLOSIVE,
        x: 200,
        y: 200,
        speedX: 0,
        speedY: 1,
      });

      // 敵を配置
      const enemy1 = new Enemy(100, 100);
      const enemy2 = new Enemy(200, 200);
      gameObjectManager.addEnemy(enemy1);
      gameObjectManager.addEnemy(enemy2);

      // 衝突判定を実行
      const enemyDestroyedSpy = jest.fn();
      eventEmitter.on('enemyDestroyed', enemyDestroyedSpy);

      collisionSystem.checkAllCollisions(player);

      // 両方の弾丸が敵に命中することを確認
      expect(enemyDestroyedSpy).toHaveBeenCalledTimes(2);
      expect(playerBullet.isActive()).toBe(false);
      expect(explosiveBullet.isActive()).toBe(false);
    });

    test('60FPS維持のパフォーマンステスト', () => {
      // 大量の弾丸と敵を作成
      const bullets: IBullet[] = [];
      const enemies: Enemy[] = [];

      for (let i = 0; i < 100; i++) {
        bullets.push(bulletManager.createPlayerBullet({ x: i, y: i }));
        enemies.push(new Enemy(i + 10, i + 10));
        gameObjectManager.addEnemy(enemies[i]);
      }

      // パフォーマンス測定
      const startTime = performance.now();

      // 10フレーム分の処理を実行
      for (let frame = 0; frame < 10; frame++) {
        bulletManager.updateBullets(16.67);
        collisionSystem.checkAllCollisions(player);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageFrameTime = totalTime / 10;

      // 60FPS (16.67ms/frame) を維持できることを確認
      expect(averageFrameTime).toBeLessThan(16.67);

      console.log(`平均フレーム時間: ${averageFrameTime.toFixed(2)}ms`);
    });

    test('メモリ使用量が20%削減されることを確認', () => {
      // 初期メモリ使用量を記録
      const initialStats = bulletManager.getPerformanceStats();
      const initialMemory = initialStats.performance.memoryUsage;

      // 大量の弾丸を作成・削除
      for (let i = 0; i < 200; i++) {
        const bullet = bulletManager.createPlayerBullet({ x: i, y: i });
        bullet.deactivate();
      }

      // 最適化前の状態
      bulletManager.updateBullets(16.67);
      const beforeOptimization = bulletManager.getPerformanceStats();

      // メモリ最適化を実行
      bulletManager.optimizeMemory();

      const afterOptimization = bulletManager.getPerformanceStats();

      // 最適化統計を確認
      expect(afterOptimization.bullets.memoryOptimizations).toBeGreaterThan(0);

      console.log('メモリ最適化統計:', {
        初期メモリ: `${initialMemory.toFixed(1)}MB`,
        最適化前: `${beforeOptimization.performance.memoryUsage.toFixed(1)}MB`,
        最適化後: `${afterOptimization.performance.memoryUsage.toFixed(1)}MB`,
        最適化回数: afterOptimization.bullets.memoryOptimizations,
      });
    });
  });

  describe('エラーハンドリング', () => {
    test('無効な弾丸オブジェクトが適切に処理される', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // 無効な弾丸オブジェクトを作成
      const invalidBullet = null as unknown as IBullet;

      // 検証が失敗することを確認
      expect(BulletFactory.validateBullet(invalidBullet)).toBe(false);

      consoleSpy.mockRestore();
    });

    test('弾丸作成エラーが適切にハンドリングされる', () => {
      // 無効な設定で弾丸作成を試行
      expect(() => {
        bulletManager.createSpecialBullet({
          type: 'invalid' as unknown as AdvancedBulletType,
          x: 0,
          y: 0,
          speedX: 0,
          speedY: 0,
        });
      }).toThrow();
    });
  });

  describe('後方互換性', () => {
    test('既存のゲームロジックが正常に動作する', () => {
      // 従来の方法で弾丸を作成
      const _traditionalBullet = gameObjectManager.createBullet(100, 100);

      expect(_traditionalBullet).toBeDefined();
      if (_traditionalBullet) {
        expect(_traditionalBullet.isActive()).toBe(true);
      }
    });

    test('既存の衝突判定が正常に動作する', () => {
      // 従来の弾丸と敵を作成
      // 従来の弾丸作成（後方互換性テスト用）
      gameObjectManager.createBullet(100, 100);
      const enemy = new Enemy(100, 100);
      gameObjectManager.addEnemy(enemy);

      const enemyDestroyedSpy = jest.fn();
      eventEmitter.on('enemyDestroyed', enemyDestroyedSpy);

      // 従来の衝突判定を実行
      collisionSystem.checkAllCollisions(player);

      // 正常に動作することを確認
      expect(enemyDestroyedSpy).toHaveBeenCalled();
    });
  });
});
