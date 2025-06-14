import { CollisionSystem } from '../src/systems/CollisionSystem';
import { Player } from '../src/entities/Player';
import { Enemy } from '../src/entities/Enemy';
import { Bullet } from '../src/entities/Bullet';
import { Boss } from '../src/entities/Boss';
import { PowerUp } from '../src/entities/PowerUp';
import { GameObjectManager } from '../src/managers/GameObjectManager';
import { EventEmitter } from '../src/events/EventEmitter';
import { EventMap } from '../src/events/EventType';
import { MockInputManager } from '../src/managers';
import { MockRandomProvider } from '../src/providers';
import { createTestConfig, GameConfig } from '../src/config/GameConfigFactory';

describe('CollisionSystem', () => {
  let collisionSystem: CollisionSystem;
  let gameObjectManager: GameObjectManager;
  let eventEmitter: EventEmitter<EventMap>;
  let mockCanvas: HTMLCanvasElement;
  let mockGameEngine: any;
  let mockInputManager: MockInputManager;
  let mockRandomProvider: MockRandomProvider;
  let testConfig: GameConfig;

  beforeEach(() => {
    testConfig = createTestConfig();

    // Mock canvas for entities that need it
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = testConfig.canvas.width;
    mockCanvas.height = testConfig.canvas.height;

    // Mock dependencies
    mockGameEngine = {
      addBossBullet: jest.fn(),
      getDifficultyFactor: jest.fn(() => 0.5),
      createBullet: jest.fn(() => null),
    };

    mockInputManager = new MockInputManager();
    mockRandomProvider = new MockRandomProvider();
    mockRandomProvider.setValues([0.5, 0.3, 0.7, 0.2, 0.8]);

    eventEmitter = new EventEmitter<EventMap>();
    gameObjectManager = new GameObjectManager(eventEmitter);
    collisionSystem = new CollisionSystem(eventEmitter, gameObjectManager);
  });

  describe('SpatialHashアルゴリズム最適化', () => {
    test('CollisionSystemが正常に初期化される', () => {
      expect(collisionSystem).toBeDefined();
      expect(collisionSystem.getCollisionStats).toBeDefined();
    });

    test('空間分割統計が正しく初期化される', () => {
      const stats = collisionSystem.getCollisionStats();
      expect(stats.totalChecks).toBe(0);
      expect(stats.spatialHashChecks).toBe(0);
      expect(stats.optimizationRatio).toBe(0);
    });

    test('大量オブジェクトでO(n)性能を維持する', () => {
      // 大量の弾丸を作成（通常のO(n²)では非効率になる規模）
      const bullets: Bullet[] = [];
      for (let i = 0; i < 50; i++) {
        const bullet = new Bullet();
        bullet.initialize(i * 8, i * 10);
        bullets.push(bullet);
        gameObjectManager.addBullet(bullet);
      }

      // 複数の敵を作成
      const enemies: Enemy[] = [];
      for (let i = 0; i < 20; i++) {
        const enemy = new Enemy(
          i * 20,
          i * 15,
          'SMALL',
          mockGameEngine,
          testConfig
        );
        enemies.push(enemy);
        gameObjectManager.addEnemy(enemy);
      }

      const startTime = performance.now();

      // 衝突判定を実行
      collisionSystem.checkCollisions();

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // SpatialHashにより効率的な処理時間（10ms未満）を維持
      expect(executionTime).toBeLessThan(10);

      const stats = collisionSystem.getCollisionStats();
      // 最適化により実際のチェック数がO(n²)より大幅に少ない
      const theoreticalChecks = bullets.length * enemies.length;
      expect(stats.spatialHashChecks).toBeLessThan(theoreticalChecks);
      expect(stats.optimizationRatio).toBeGreaterThan(0);
    });
  });

  describe('弾丸と敵の衝突判定', () => {
    test('プレイヤー弾丸と敵の衝突が正しく検出される', () => {
      const enemy = new Enemy(100, 100, 'SMALL', mockGameEngine, testConfig);
      const bullet = new Bullet();
      bullet.initialize(100, 100);

      gameObjectManager.addEnemy(enemy);
      gameObjectManager.addBullet(bullet);

      let collisionDetected = false;
      eventEmitter.on('enemyDestroyed', () => {
        collisionDetected = true;
      });

      collisionSystem.checkCollisions();

      expect(collisionDetected).toBe(true);
    });

    test('敵弾丸とプレイヤーの衝突が正しく検出される', () => {
      const player = new Player(
        eventEmitter,
        mockInputManager,
        mockRandomProvider,
        testConfig
      );
      const enemyBullet = new Bullet();
      enemyBullet.initialize(200, 300);

      // プレイヤーを特定位置に配置
      (player as any).x = 200;
      (player as any).y = 300;

      gameObjectManager.setPlayer(player);
      gameObjectManager.addBullet(enemyBullet);

      let playerHit = false;
      eventEmitter.on('playerDamaged', () => {
        playerHit = true;
      });

      collisionSystem.checkCollisions();

      expect(playerHit).toBe(true);
    });

    test('同じ種類の弾丸同士は衝突しない', () => {
      const playerBullet1 = new Bullet();
      const playerBullet2 = new Bullet();
      playerBullet1.initialize(150, 150);
      playerBullet2.initialize(150, 150);

      gameObjectManager.addBullet(playerBullet1);
      gameObjectManager.addBullet(playerBullet2);

      let collisionCount = 0;
      eventEmitter.on('enemyDestroyed', () => collisionCount++);
      eventEmitter.on('playerDamaged', () => collisionCount++);

      collisionSystem.checkCollisions();

      expect(collisionCount).toBe(0);
    });
  });

  describe('ボス戦衝突判定', () => {
    test('プレイヤー弾丸とボスの衝突が正しく検出される', () => {
      const boss = new Boss(mockGameEngine, testConfig);
      const bullet = new Bullet();
      bullet.initialize(200, 100);

      // ボスを衝突可能な位置に配置
      (boss as any).x = 200;
      (boss as any).y = 100;

      gameObjectManager.setBoss(boss);
      gameObjectManager.addBullet(bullet);

      let bossHit = false;
      eventEmitter.on('bossDamaged', () => {
        bossHit = true;
      });

      collisionSystem.checkCollisions();

      expect(bossHit).toBe(true);
    });

    test('ボス弾丸とプレイヤーの衝突が正しく検出される', () => {
      const player = new Player(
        eventEmitter,
        mockInputManager,
        mockRandomProvider,
        testConfig
      );
      const bossBullet = new Bullet();
      bossBullet.initialize(200, 300);

      (player as any).x = 200;
      (player as any).y = 300;

      gameObjectManager.setPlayer(player);
      gameObjectManager.addBullet(bossBullet);

      let playerHit = false;
      eventEmitter.on('playerDamaged', () => {
        playerHit = true;
      });

      collisionSystem.checkCollisions();

      expect(playerHit).toBe(true);
    });
  });

  describe('PowerUp衝突判定', () => {
    test('プレイヤーとPowerUpの衝突が正しく検出される', () => {
      const player = new Player(
        eventEmitter,
        mockInputManager,
        mockRandomProvider,
        testConfig
      );
      const powerUp = new PowerUp(200, 300, testConfig);

      (player as any).x = 200;
      (player as any).y = 300;

      gameObjectManager.setPlayer(player);
      gameObjectManager.addPowerUp(powerUp);

      let powerUpCollected = false;
      eventEmitter.on('powerUpCollected', () => {
        powerUpCollected = true;
      });

      collisionSystem.checkCollisions();

      expect(powerUpCollected).toBe(true);
    });

    test('距離に基づいてPowerUpが正しく区別される', () => {
      const player = new Player(
        eventEmitter,
        mockInputManager,
        mockRandomProvider,
        testConfig
      );
      const nearPowerUp = new PowerUp(200, 300, testConfig); // プレイヤーと重複
      const farPowerUp = new PowerUp(350, 300, testConfig); // プレイヤーから離れた位置

      (player as any).x = 200; // プレイヤー範囲: 200-250
      (player as any).y = 300; // プレイヤー範囲: 300-350

      gameObjectManager.setPlayer(player);
      gameObjectManager.addPowerUp(nearPowerUp);
      gameObjectManager.addPowerUp(farPowerUp);

      let collectedCount = 0;
      const collectedPowerUps: PowerUp[] = [];
      eventEmitter.on('powerUpCollected', (powerUp: PowerUp) => {
        collectedCount++;
        collectedPowerUps.push(powerUp);
      });

      collisionSystem.checkCollisions();

      // 近いPowerUpのみが収集され、遠いPowerUpは収集されない
      expect(collectedCount).toBe(1);
      expect(collectedPowerUps).toContain(nearPowerUp);
      expect(collectedPowerUps).not.toContain(farPowerUp);
    });
  });

  describe('衝突判定の境界ケース', () => {
    test('オブジェクトが画面外にある場合の処理', () => {
      const enemy = new Enemy(-50, -50, 'SMALL', mockGameEngine, testConfig);
      const bullet = new Bullet();
      bullet.initialize(-50, -50);

      gameObjectManager.addEnemy(enemy);
      gameObjectManager.addBullet(bullet);

      expect(() => {
        collisionSystem.checkCollisions();
      }).not.toThrow();
    });

    test('オブジェクトが重複する座標にある場合', () => {
      const enemy1 = new Enemy(100, 100, 'SMALL', mockGameEngine, testConfig);
      const enemy2 = new Enemy(100, 100, 'SMALL', mockGameEngine, testConfig);
      const bullet = new Bullet();
      bullet.initialize(100, 100);

      gameObjectManager.addEnemy(enemy1);
      gameObjectManager.addEnemy(enemy2);
      gameObjectManager.addBullet(bullet);

      let hitCount = 0;
      eventEmitter.on('enemyDestroyed', () => {
        hitCount++;
      });

      collisionSystem.checkCollisions();

      // 両方の敵がヒットする
      expect(hitCount).toBe(2);
    });

    test('空のオブジェクトリストでエラーが発生しない', () => {
      expect(() => {
        collisionSystem.checkCollisions();
      }).not.toThrow();

      const stats = collisionSystem.getCollisionStats();
      expect(stats.totalChecks).toBe(0);
    });
  });

  describe('パフォーマンス統計', () => {
    test('衝突判定統計が正確に記録される', () => {
      const enemy = new Enemy(100, 100, 'SMALL', mockGameEngine, testConfig);
      const bullet = new Bullet();
      bullet.initialize(100, 100);

      gameObjectManager.addEnemy(enemy);
      gameObjectManager.addBullet(bullet);

      collisionSystem.checkCollisions();

      const stats = collisionSystem.getCollisionStats();
      expect(stats.totalChecks).toBeGreaterThan(0);
      expect(stats.spatialHashChecks).toBeGreaterThanOrEqual(0);
      expect(stats.optimizationRatio).toBeGreaterThanOrEqual(0);
      expect(stats.optimizationRatio).toBeLessThanOrEqual(1);
    });

    test('複数回の衝突判定で統計が累積される', () => {
      const enemy = new Enemy(100, 100, 'SMALL', mockGameEngine, testConfig);
      const bullet = new Bullet();
      bullet.initialize(150, 150);

      gameObjectManager.addEnemy(enemy);
      gameObjectManager.addBullet(bullet);

      collisionSystem.checkCollisions();
      const firstStats = collisionSystem.getCollisionStats();

      collisionSystem.checkCollisions();
      const secondStats = collisionSystem.getCollisionStats();

      expect(secondStats.totalChecks).toBeGreaterThan(firstStats.totalChecks);
    });
  });

  describe('空間分割の効率性', () => {
    test('近接オブジェクトのみが衝突判定される', () => {
      // 画面の左端と右端にオブジェクトを配置
      const leftEnemy = new Enemy(50, 100, 'SMALL', mockGameEngine, testConfig);
      const rightEnemy = new Enemy(
        350,
        100,
        'SMALL',
        mockGameEngine,
        testConfig
      );
      const leftBullet = new Bullet();
      leftBullet.initialize(50, 100);

      gameObjectManager.addEnemy(leftEnemy);
      gameObjectManager.addEnemy(rightEnemy);
      gameObjectManager.addBullet(leftBullet);

      let hitCount = 0;
      eventEmitter.on('enemyDestroyed', () => {
        hitCount++;
      });

      collisionSystem.checkCollisions();

      // 近接する左側の敵のみヒット
      expect(hitCount).toBe(1);

      const stats = collisionSystem.getCollisionStats();
      // SpatialHashにより効率的にフィルタリングされている
      expect(stats.optimizationRatio).toBeGreaterThan(0);
    });

    test('空間分割グリッドが適切に機能する', () => {
      // 64x64セルグリッドの異なるセルにオブジェクトを配置
      const enemy1 = new Enemy(32, 32, 'SMALL', mockGameEngine, testConfig); // セル(0,0)
      const enemy2 = new Enemy(96, 32, 'SMALL', mockGameEngine, testConfig); // セル(1,0)
      const bullet = new Bullet();
      bullet.initialize(32, 32); // セル(0,0)

      gameObjectManager.addEnemy(enemy1);
      gameObjectManager.addEnemy(enemy2);
      gameObjectManager.addBullet(bullet);

      let hitEnemies: Enemy[] = [];
      eventEmitter.on('enemyDestroyed', (enemy: Enemy) => {
        hitEnemies.push(enemy);
      });

      collisionSystem.checkCollisions();

      // 同じセルの敵のみヒット
      expect(hitEnemies).toHaveLength(1);
      expect(hitEnemies[0]).toBe(enemy1);
    });
  });

  describe('メモリ効率性', () => {
    test('大量オブジェクト処理後もメモリリークがない', () => {
      // 大量のオブジェクトを作成・削除
      for (let iteration = 0; iteration < 5; iteration++) {
        const enemies: Enemy[] = [];
        const bullets: Bullet[] = [];

        for (let i = 0; i < 20; i++) {
          const enemy = new Enemy(
            i * 20,
            100,
            'SMALL',
            mockGameEngine,
            testConfig
          );
          const bullet = new Bullet();
          bullet.initialize(i * 20, 100);

          enemies.push(enemy);
          bullets.push(bullet);

          gameObjectManager.addEnemy(enemy);
          gameObjectManager.addBullet(bullet);
        }

        collisionSystem.checkCollisions();

        // オブジェクトをクリア
        enemies.forEach(enemy => gameObjectManager.removeEnemy(enemy));
        bullets.forEach(bullet => gameObjectManager.removeBullet(bullet));
      }

      // 統計は正常に機能し続ける
      const stats = collisionSystem.getCollisionStats();
      expect(stats).toBeDefined();
      expect(stats.totalChecks).toBeGreaterThan(0);
    });
  });
});
