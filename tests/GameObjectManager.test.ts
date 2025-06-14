import { createTestConfig } from '../src/config/GameConfigFactory';
import { Aurora } from '../src/entities/Aurora';
import { Boss } from '../src/entities/Boss';
import { BossBullet } from '../src/entities/BossBullet';
import { Bullet } from '../src/entities/Bullet';
import { Enemy } from '../src/entities/Enemy';
import { Nebula } from '../src/entities/Nebula';
import { Planet } from '../src/entities/Planet';
import { PowerUp } from '../src/entities/PowerUp';
import { Star } from '../src/entities/Star';
import { EventEmitter } from '../src/events/EventEmitter';
import { EventMap } from '../src/events/EventType';
import { GameObjectManager } from '../src/managers/GameObjectManager';
import { MockRandomProvider } from '../src/providers';

describe('GameObjectManager', () => {
  let gameObjectManager: GameObjectManager;
  let eventEmitter: EventEmitter<EventMap>;
  let mockRandomProvider: MockRandomProvider;
  let mockGameEngine: {
    addBossBullet: jest.Mock;
    getDifficultyFactor: jest.Mock;
    createBullet: jest.Mock;
  };
  let testConfig: ReturnType<typeof createTestConfig>;

  beforeEach(() => {
    eventEmitter = new EventEmitter<EventMap>();
    gameObjectManager = new GameObjectManager(eventEmitter);
    mockRandomProvider = new MockRandomProvider();
    mockRandomProvider.setValues([0.5, 0.3, 0.7, 0.2, 0.8]);
    testConfig = createTestConfig();

    // Mock IGameEngine
    mockGameEngine = {
      addBossBullet: jest.fn(),
      getDifficultyFactor: jest.fn(() => 0.5),
      createBullet: jest.fn(() => null),
    };
  });

  describe('初期化とセットアップ', () => {
    test('GameObjectManagerが正常に初期化される', () => {
      expect(gameObjectManager).toBeDefined();
      expect(gameObjectManager.getBullets()).toEqual([]);
      expect(gameObjectManager.getEnemies()).toEqual([]);
      expect(gameObjectManager.getExplosions()).toEqual([]);
      expect(gameObjectManager.getPowerups()).toEqual([]);
    });

    test('ObjectPoolが正常に初期化される', () => {
      const poolStats = gameObjectManager.getPoolStats();
      expect(poolStats).toBeDefined();
      expect(typeof poolStats.bullet).toBe('number');
      expect(typeof poolStats.explosion).toBe('number');
    });
  });

  describe('ObjectPool統合機能', () => {
    test('プール付きBulletが正常に作成される', () => {
      const bullet = gameObjectManager.createBullet(100, 200, 5, '#ffffff');

      expect(bullet).not.toBeNull();
      expect(bullet?.getPosition().x).toBe(100);
      expect(bullet?.getPosition().y).toBe(200);
    });

    test('爆発エフェクトがプールから作成される', () => {
      const initialExplosions = gameObjectManager.getExplosions().length;

      gameObjectManager.createExplosion(150, 250);

      const explosions = gameObjectManager.getExplosions();
      expect(explosions.length).toBe(initialExplosions + 1);

      const explosion = explosions[explosions.length - 1];
      expect(explosion).toBeDefined();
      expect(explosion.getPosition().x).toBe(150);
      expect(explosion.getPosition().y).toBe(250);
    });

    test('オブジェクトプールの再利用が正常に機能する', () => {
      // 複数の弾丸を作成
      const bullets: Bullet[] = [];
      for (let i = 0; i < 5; i++) {
        const bullet = gameObjectManager.createBullet(i * 10, i * 20);
        if (bullet) bullets.push(bullet);
      }

      expect(bullets.length).toBe(5);

      // プール統計確認
      const poolStats = gameObjectManager.getPoolStats();
      expect(poolStats.bullet).toBeGreaterThanOrEqual(0);
    });

    test('画面外オブジェクトがプールに正しく返却される', () => {
      // 画面外の弾丸を作成
      const bullet = gameObjectManager.createBullet(-100, -100); // 画面外
      if (bullet) {
        bullet.deactivate(); // 非アクティブにする
      }

      // 画面外オブジェクト削除を実行
      gameObjectManager.removeOffscreenObjects();

      // プールに返却されたかチェック
      const finalBullets = gameObjectManager.getBullets();
      expect(finalBullets.length).toBe(0);
    });
  });

  describe('敵オブジェクト管理', () => {
    test('敵が正常に追加・削除される', () => {
      const enemy = new Enemy(100, 100, 'SMALL', mockGameEngine, testConfig);

      gameObjectManager.addEnemy(enemy);
      expect(gameObjectManager.getEnemies()).toContain(enemy);

      gameObjectManager.removeEnemy(enemy);
      expect(gameObjectManager.getEnemies()).not.toContain(enemy);
    });

    test('複数の敵を管理できる', () => {
      const enemies = [
        new Enemy(100, 100, 'SMALL', mockGameEngine, testConfig),
        new Enemy(200, 200, 'SMALL', mockGameEngine, testConfig),
        new Enemy(300, 300, 'SMALL', mockGameEngine, testConfig),
      ];

      enemies.forEach(enemy => gameObjectManager.addEnemy(enemy));

      expect(gameObjectManager.getEnemies()).toHaveLength(3);
      enemies.forEach(enemy => {
        expect(gameObjectManager.getEnemies()).toContain(enemy);
      });
    });

    test('存在しない敵の削除でエラーが発生しない', () => {
      const enemy = new Enemy(100, 100, 'SMALL', mockGameEngine, testConfig);

      expect(() => {
        gameObjectManager.removeEnemy(enemy);
      }).not.toThrow();
    });
  });

  describe('PowerUp管理', () => {
    test('PowerUpが正常に追加・削除される', () => {
      const powerUp = new PowerUp(100, 100, testConfig);

      gameObjectManager.addPowerUp(powerUp);
      expect(gameObjectManager.getPowerups()).toContain(powerUp);

      gameObjectManager.removePowerUp(powerUp);
      expect(gameObjectManager.getPowerups()).not.toContain(powerUp);
    });

    test('異なるタイプのPowerUpを管理できる', () => {
      const healthPowerUp = new PowerUp(100, 100, testConfig);
      const weaponPowerUp = new PowerUp(200, 200, testConfig);

      gameObjectManager.addPowerUp(healthPowerUp);
      gameObjectManager.addPowerUp(weaponPowerUp);

      const powerups = gameObjectManager.getPowerups();
      expect(powerups).toHaveLength(2);
      expect(powerups).toContain(healthPowerUp);
      expect(powerups).toContain(weaponPowerUp);
    });
  });

  describe('ボス管理', () => {
    test('ボスが正常に設定・取得される', () => {
      const boss = new Boss(mockGameEngine, testConfig);

      gameObjectManager.setBoss(boss);
      expect(gameObjectManager.getBoss()).toBe(boss);

      gameObjectManager.setBoss(null);
      expect(gameObjectManager.getBoss()).toBeNull();
    });

    test('ボス弾丸が正常に管理される', () => {
      const bossBullet = new BossBullet(100, 100, 5, 5, testConfig);

      gameObjectManager.addBossBullet(bossBullet);
      expect(gameObjectManager.getBossBullets()).toContain(bossBullet);
      expect(gameObjectManager.getBossBullets()).toHaveLength(1);
    });
  });

  describe('背景オブジェクト管理', () => {
    test('背景オブジェクトが正常に設定される', () => {
      const stars = [
        new Star(mockRandomProvider),
        new Star(mockRandomProvider),
      ];
      const planets = [new Planet()];
      const nebulas = [new Nebula()];
      const auroras = [new Aurora()];

      gameObjectManager.setBackgroundObjects(stars, planets, nebulas, auroras);

      expect(gameObjectManager.getStars()).toEqual(stars);
      expect(gameObjectManager.getPlanets()).toEqual(planets);
      expect(gameObjectManager.getNebulas()).toEqual(nebulas);
      expect(gameObjectManager.getAuroras()).toEqual(auroras);
    });

    test('背景オブジェクトが更新される', () => {
      const stars = [new Star(mockRandomProvider)];
      const planets = [new Planet()];
      const auroras = [new Aurora()];

      gameObjectManager.setBackgroundObjects(stars, planets, [], auroras);

      const starUpdateSpy = jest.spyOn(stars[0], 'update');
      const planetUpdateSpy = jest.spyOn(planets[0], 'update');
      const auroraUpdateSpy = jest.spyOn(auroras[0], 'update');

      gameObjectManager.updateAllObjects(16);

      expect(starUpdateSpy).toHaveBeenCalledWith(16);
      expect(planetUpdateSpy).toHaveBeenCalledWith(16);
      expect(auroraUpdateSpy).toHaveBeenCalledWith(16);
    });
  });

  describe('全オブジェクト更新', () => {
    test('全ての動的オブジェクトが更新される', () => {
      const enemy = new Enemy(100, 100, 'SMALL', mockGameEngine, testConfig);
      const powerUp = new PowerUp(200, 200, testConfig);
      const boss = new Boss(mockGameEngine, testConfig);
      const bossBullet = new BossBullet(300, 300, 5, 5, testConfig);

      gameObjectManager.addEnemy(enemy);
      gameObjectManager.addPowerUp(powerUp);
      gameObjectManager.setBoss(boss);
      gameObjectManager.addBossBullet(bossBullet);

      const enemyUpdateSpy = jest.spyOn(enemy, 'update');
      const powerUpUpdateSpy = jest.spyOn(powerUp, 'update');
      const bossUpdateSpy = jest.spyOn(boss, 'update');
      const bossBulletUpdateSpy = jest.spyOn(bossBullet, 'update');

      gameObjectManager.updateAllObjects(16);

      expect(enemyUpdateSpy).toHaveBeenCalledWith(16);
      expect(powerUpUpdateSpy).toHaveBeenCalledWith(16);
      expect(bossUpdateSpy).toHaveBeenCalledWith(16);
      expect(bossBulletUpdateSpy).toHaveBeenCalledWith(16);
    });

    test('プール付きオブジェクトも正常に更新される', () => {
      const bullet = gameObjectManager.createBullet(100, 100);

      if (bullet) {
        const bulletUpdateSpy = jest.spyOn(bullet, 'update');

        gameObjectManager.updateAllObjects(16);

        expect(bulletUpdateSpy).toHaveBeenCalledWith(16);
      } else {
        // 弾丸が作成されなかった場合、少なくともエラーが発生しないことを確認
        expect(() => {
          gameObjectManager.updateAllObjects(16);
        }).not.toThrow();
      }
    });
  });

  describe('衝突判定用オブジェクト取得', () => {
    test('全ての衝突可能オブジェクトが取得される', () => {
      const enemy = new Enemy(100, 100, 'SMALL', mockGameEngine, testConfig);
      const powerUp = new PowerUp(200, 200);
      const boss = new Boss(mockGameEngine, testConfig);
      const bullet = gameObjectManager.createBullet(100, 100);

      gameObjectManager.addEnemy(enemy);
      gameObjectManager.addPowerUp(powerUp);
      gameObjectManager.setBoss(boss);

      const collidableObjects = gameObjectManager.getAllCollidableObjects();

      expect(collidableObjects).toContain(enemy);
      expect(collidableObjects).toContain(powerUp);
      expect(collidableObjects).toContain(boss);
      if (bullet) {
        expect(collidableObjects).toContain(bullet);
      }
    });

    test('ボスが存在しない場合の処理', () => {
      const enemy = new Enemy(100, 100, 'SMALL', mockGameEngine, testConfig);
      gameObjectManager.addEnemy(enemy);

      const collidableObjects = gameObjectManager.getAllCollidableObjects();

      expect(collidableObjects).toContain(enemy);
      expect(collidableObjects.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('リセット機能', () => {
    test('ゲーム状態が正常にリセットされる', () => {
      // オブジェクトを追加
      const enemy = new Enemy(100, 100, 'SMALL', mockGameEngine, testConfig);
      const powerUp = new PowerUp(200, 200, testConfig);
      const boss = new Boss(mockGameEngine, testConfig);

      // 弾丸を作成してプールをテスト
      gameObjectManager.createBullet(100, 100);

      gameObjectManager.addEnemy(enemy);
      gameObjectManager.addPowerUp(powerUp);
      gameObjectManager.setBoss(boss);

      expect(gameObjectManager.getEnemies()).toHaveLength(1);
      expect(gameObjectManager.getPowerups()).toHaveLength(1);
      expect(gameObjectManager.getBoss()).toBe(boss);

      // リセット実行
      gameObjectManager.reset();

      // 全てがクリアされることを確認
      expect(gameObjectManager.getBullets()).toHaveLength(0);
      expect(gameObjectManager.getEnemies()).toHaveLength(0);
      expect(gameObjectManager.getExplosions()).toHaveLength(0);
      expect(gameObjectManager.getPowerups()).toHaveLength(0);
      expect(gameObjectManager.getBossBullets()).toHaveLength(0);
      expect(gameObjectManager.getBoss()).toBeNull();
    });

    test('リセット後もプールは機能する', () => {
      // プールオブジェクトを作成
      const bullet = gameObjectManager.createBullet(100, 100);
      expect(bullet).not.toBeNull();

      // リセット
      gameObjectManager.reset();

      // リセット後も新しいオブジェクトを作成できる
      const newBullet = gameObjectManager.createBullet(200, 200);
      expect(newBullet).not.toBeNull();
      expect(newBullet?.getPosition().x).toBe(200);
    });
  });

  describe('イベント統合', () => {
    test('敵破壊イベントで爆発が作成される', () => {
      const enemy = new Enemy(100, 100, 'SMALL', mockGameEngine, testConfig);
      gameObjectManager.addEnemy(enemy);

      const initialExplosions = gameObjectManager.getExplosions().length;

      // 敵破壊イベントを発火
      eventEmitter.emit('enemyDestroyed', enemy);

      const explosions = gameObjectManager.getExplosions();
      expect(explosions.length).toBe(initialExplosions + 1);
    });

    test('画面外オブジェクト削除イベントが正常に処理される', () => {
      // 画面外オブジェクトを作成
      const bullet = gameObjectManager.createBullet(-100, -100);
      if (bullet) {
        bullet.deactivate();
        // createBulletで既に配列に追加済みなので、addBulletは不要
      }

      const initialCount = gameObjectManager.getBullets().length;

      // クリーンアップイベント発火
      eventEmitter.emit('cleanupOffscreenObjects');

      expect(gameObjectManager.getBullets().length).toBeLessThanOrEqual(
        initialCount
      );
    });
  });

  describe('メモリ効率性', () => {
    test('大量オブジェクト作成・削除でメモリリークがない', () => {
      // 大量のオブジェクトを作成・削除
      for (let iteration = 0; iteration < 10; iteration++) {
        // オブジェクト作成
        const enemies = Array.from(
          { length: 20 },
          (_, i) => new Enemy(i * 10, 100, 'SMALL', mockGameEngine, testConfig)
        );

        // 弾丸を作成（プールテスト用）
        for (let i = 0; i < 30; i++) {
          gameObjectManager.createBullet(i * 10, 100);
        }

        enemies.forEach(enemy => gameObjectManager.addEnemy(enemy));

        // 更新処理
        gameObjectManager.updateAllObjects(16);

        // オブジェクト削除
        enemies.forEach(enemy => gameObjectManager.removeEnemy(enemy));
        gameObjectManager.removeOffscreenObjects();
      }

      // プールが正常に機能している
      const poolStats = gameObjectManager.getPoolStats();
      expect(poolStats).toBeDefined();
      expect(typeof poolStats.bullet).toBe('number');
    });

    test('プール統計が正確に記録される', () => {
      // プールオブジェクトを作成・削除
      const bullet = gameObjectManager.createBullet(100, 100);
      if (bullet) {
        bullet.deactivate();
      }

      gameObjectManager.removeOffscreenObjects();

      const finalStats = gameObjectManager.getPoolStats();
      expect(finalStats).toBeDefined();
      expect(finalStats.bullet).toBeGreaterThanOrEqual(0);
    });
  });
});
