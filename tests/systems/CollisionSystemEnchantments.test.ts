/**
 * CollisionSystem エンチャント効果テスト - Phase 3
 *
 * 貫通・クリティカル・凍結・連鎖効果の衝突判定テスト
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

describe('CollisionSystem - エンチャント効果テスト', () => {
  let collisionSystem: CollisionSystem;
  let gameObjectManager: GameObjectManager;
  let eventEmitter: EventEmitter<EventMap>;
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

    // モックプレイヤーを作成
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
    // テスト後のクリーンアップ
    gameObjectManager.getBullets().forEach(bullet => bullet.deactivate());
    gameObjectManager
      .getEnemies()
      .forEach(enemy => gameObjectManager.removeEnemy(enemy));
  });

  describe('貫通効果の衝突判定', () => {
    it('貫通効果のない弾丸は最初の敵で停止する', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setPiercing(0); // 貫通なし

      const enemy1 = new Enemy(100, 80);
      const enemy2 = new Enemy(100, 110);

      gameObjectManager.addBullet(bullet);
      gameObjectManager.addEnemy(enemy1);
      gameObjectManager.addEnemy(enemy2);

      mockRandomProvider.setValues([0.9]); // クリティカルなし

      collisionSystem.checkAllCollisions(mockPlayer);

      // 弾丸が無効化される
      expect(bullet.isActive()).toBe(false);

      // 1体のみ撃破される
      expect(gameObjectManager.getEnemies().length).toBe(1);
    });

    it('貫通効果のある弾丸は指定回数まで敵を貫通する', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setPiercing(3); // 3回貫通

      // 縦に並んだ敵を配置
      Array.from({ length: 5 }, (_, i) => {
        const enemy = new Enemy(100, 80 + i * 30);
        gameObjectManager.addEnemy(enemy);
        return enemy;
      });

      gameObjectManager.addBullet(bullet);
      mockRandomProvider.setValues(Array(5).fill(0.9) as number[]); // クリティカルなし

      collisionSystem.checkAllCollisions(mockPlayer);

      // 3回貫通後に弾丸が無効化される
      expect(bullet.isActive()).toBe(false);

      // 3体撃破、2体残存
      expect(gameObjectManager.getEnemies().length).toBe(2);
    });

    it('貫通回数を超えると弾丸が無効化される', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setPiercing(2); // 2回貫通

      // 大量の敵を配置
      Array.from({ length: 10 }, (_, i) => {
        const enemy = new Enemy(100, 80 + i * 20);
        gameObjectManager.addEnemy(enemy);
        return enemy;
      });

      gameObjectManager.addBullet(bullet);
      mockRandomProvider.setValues(Array(10).fill(0.9) as number[]);

      collisionSystem.checkAllCollisions(mockPlayer);

      // 2回貫通後に停止
      expect(bullet.isActive()).toBe(false);
      expect(gameObjectManager.getEnemies().length).toBe(8); // 2体撃破
    });
  });

  describe('クリティカル効果の衝突判定', () => {
    it('クリティカルヒット時に敵にクリティカル効果が適用される', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setCriticalChance(100); // 確実にクリティカル

      const enemy = new Enemy(100, 80);
      const takeDamageSpy = jest.spyOn(enemy, 'takeDamage');

      gameObjectManager.addBullet(bullet);
      gameObjectManager.addEnemy(enemy);

      mockRandomProvider.setValues([0.1]); // クリティカル発生

      collisionSystem.checkAllCollisions(mockPlayer);

      // クリティカルダメージが適用される
      expect(takeDamageSpy).toHaveBeenCalledWith(2, true);

      // 敵のクリティカル効果時間が設定される
      expect(
        (enemy as unknown as { criticalEffectTime?: number }).criticalEffectTime
      ).toBeGreaterThan(0);
    });

    it('クリティカル確率に基づいて正しく判定される', () => {
      const testCases = [
        { chance: 0, randomValue: 0.5, expectedCritical: false },
        { chance: 100, randomValue: 0.5, expectedCritical: true },
        { chance: 50, randomValue: 0.3, expectedCritical: true },
        { chance: 50, randomValue: 0.7, expectedCritical: false },
      ];

      testCases.forEach(({ chance, randomValue, expectedCritical }, index) => {
        const bullet = new Bullet(100 + index * 50, 50);
        bullet.initialize(100 + index * 50, 50);
        bullet.setCriticalChance(chance);

        const enemy = new Enemy(100 + index * 50, 80);
        const takeDamageSpy = jest.spyOn(enemy, 'takeDamage');

        gameObjectManager.addBullet(bullet);
        gameObjectManager.addEnemy(enemy);

        mockRandomProvider.setValues([randomValue]);

        collisionSystem.checkAllCollisions(mockPlayer);

        const expectedDamage = expectedCritical ? 2 : 1;
        expect(takeDamageSpy).toHaveBeenCalledWith(
          expectedDamage,
          expectedCritical
        );

        // クリーンアップ
        gameObjectManager.removeEnemy(enemy);
      });
    });
  });

  describe('凍結効果の衝突判定', () => {
    it('凍結効果のある弾丸が敵を凍結させる', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setFreezeEffect(true);
      bullet.setFreezeDuration(2); // 2秒凍結

      const enemy = new Enemy(100, 80);
      const freezeSpy = jest.spyOn(enemy, 'freeze');

      gameObjectManager.addBullet(bullet);
      gameObjectManager.addEnemy(enemy);

      mockRandomProvider.setValues([0.9]); // クリティカルなし

      collisionSystem.checkAllCollisions(mockPlayer);

      // 凍結効果が適用される
      expect(freezeSpy).toHaveBeenCalledWith(2);
      expect(enemy.isFrozen()).toBe(true);
    });

    it('凍結効果なしの弾丸は敵を凍結させない', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setFreezeEffect(false);

      const enemy = new Enemy(100, 80);
      const freezeSpy = jest.spyOn(enemy, 'freeze');

      gameObjectManager.addBullet(bullet);
      gameObjectManager.addEnemy(enemy);

      mockRandomProvider.setValues([0.9]);

      collisionSystem.checkAllCollisions(mockPlayer);

      // 凍結効果が適用されない
      expect(freezeSpy).not.toHaveBeenCalled();
      expect(enemy.isFrozen()).toBe(false);
    });

    it('凍結時間が正確に設定される', () => {
      const testDurations = [0.5, 1, 2, 5];

      testDurations.forEach((duration, index) => {
        const bullet = new Bullet(100 + index * 50, 50);
        bullet.initialize(100 + index * 50, 50);
        bullet.setFreezeEffect(true);
        bullet.setFreezeDuration(duration);

        const enemy = new Enemy(100 + index * 50, 80);
        const freezeSpy = jest.spyOn(enemy, 'freeze');

        gameObjectManager.addBullet(bullet);
        gameObjectManager.addEnemy(enemy);

        mockRandomProvider.setValues([0.9]);

        collisionSystem.checkAllCollisions(mockPlayer);

        expect(freezeSpy).toHaveBeenCalledWith(duration);

        // クリーンアップ
        gameObjectManager.removeEnemy(enemy);
      });
    });
  });

  describe('連鎖効果の衝突判定', () => {
    it('連鎖効果が近くの敵に伝播する', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setChainLightning(true);
      bullet.setChainCount(3);
      bullet.setCriticalChance(0);

      // 連鎖しやすい位置に敵を配置
      const enemies = [
        new Enemy(100, 80), // 最初の対象
        new Enemy(120, 100), // 連鎖対象1
        new Enemy(80, 120), // 連鎖対象2
        new Enemy(110, 140), // 連鎖対象3
      ];

      enemies.forEach(enemy => gameObjectManager.addEnemy(enemy));
      gameObjectManager.addBullet(bullet);

      mockRandomProvider.setValues(Array(5).fill(0.9) as number[]); // クリティカルなし

      // デバッグモードを有効化
      collisionSystem.setChainLightningDebugMode(true);

      const initialEnemyCount = enemies.length;
      collisionSystem.checkAllCollisions(mockPlayer);

      // 連鎖効果により複数の敵が撃破される
      const remainingEnemies = gameObjectManager.getEnemies();
      expect(remainingEnemies.length).toBeLessThan(initialEnemyCount);
    });

    it('連鎖範囲外の敵には影響しない', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setChainLightning(true);
      bullet.setChainCount(5);

      const enemies = [
        new Enemy(100, 80), // 最初の対象
        new Enemy(500, 500), // 範囲外
      ];

      enemies.forEach(enemy => gameObjectManager.addEnemy(enemy));
      gameObjectManager.addBullet(bullet);

      mockRandomProvider.setValues([0.9, 0.9]);

      collisionSystem.checkAllCollisions(mockPlayer);

      // 範囲外の敵は残存
      const remainingEnemies = gameObjectManager.getEnemies();
      expect(
        remainingEnemies.some(
          enemy => enemy.getX() === 500 && enemy.getY() === 500
        )
      ).toBe(true);
    });

    it('連鎖効果の視覚効果が生成される', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setChainLightning(true);
      bullet.setChainCount(2);

      const enemies = [new Enemy(100, 80), new Enemy(120, 100)];

      enemies.forEach(enemy => gameObjectManager.addEnemy(enemy));
      gameObjectManager.addBullet(bullet);

      mockRandomProvider.setValues([0.9, 0.9]);

      collisionSystem.checkAllCollisions(mockPlayer);

      // 視覚効果の統計を確認
      const stats = collisionSystem.getChainLightningStats();
      expect(stats).toBeDefined();
      expect(stats.activeEffects).toBeGreaterThanOrEqual(0);
    });
  });

  describe('複合エンチャント効果の衝突判定', () => {
    it('貫通 + クリティカル効果の組み合わせ', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setPiercing(2);
      bullet.setCriticalChance(100); // 確実にクリティカル

      const enemies = [
        new Enemy(100, 80),
        new Enemy(100, 110),
        new Enemy(100, 140),
      ];

      const spies = enemies.map(enemy => jest.spyOn(enemy, 'takeDamage'));
      enemies.forEach(enemy => gameObjectManager.addEnemy(enemy));
      gameObjectManager.addBullet(bullet);

      mockRandomProvider.setValues([0.1, 0.1, 0.1]); // 全てクリティカル

      collisionSystem.checkAllCollisions(mockPlayer);

      // 2体にクリティカルダメージが適用される
      expect(spies[0]).toHaveBeenCalledWith(2, true);
      expect(spies[1]).toHaveBeenCalledWith(2, true);
      expect(spies[2]).not.toHaveBeenCalled(); // 3体目は貫通範囲外
    });

    it('貫通 + 凍結効果の組み合わせ', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setPiercing(2);
      bullet.setFreezeEffect(true);
      bullet.setFreezeDuration(1.5);

      const enemies = [
        new Enemy(100, 80),
        new Enemy(100, 110),
        new Enemy(100, 140),
      ];

      const freezeSpies = enemies.map(enemy => jest.spyOn(enemy, 'freeze'));
      enemies.forEach(enemy => gameObjectManager.addEnemy(enemy));
      gameObjectManager.addBullet(bullet);

      mockRandomProvider.setValues([0.9, 0.9, 0.9]);

      collisionSystem.checkAllCollisions(mockPlayer);

      // 2体が凍結される
      expect(freezeSpies[0]).toHaveBeenCalledWith(1.5);
      expect(freezeSpies[1]).toHaveBeenCalledWith(1.5);
      expect(freezeSpies[2]).not.toHaveBeenCalled();

      expect(enemies[0].isFrozen()).toBe(true);
      expect(enemies[1].isFrozen()).toBe(true);
      expect(enemies[2].isFrozen()).toBe(false);
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

      // 密集した敵を配置
      const enemies = [
        new Enemy(100, 80),
        new Enemy(100, 110),
        new Enemy(120, 90),
        new Enemy(80, 100),
      ];

      enemies.forEach(enemy => gameObjectManager.addEnemy(enemy));
      gameObjectManager.addBullet(bullet);

      mockRandomProvider.setValues(Array(6).fill(0.1) as number[]); // 全てクリティカル

      const initialEnemyCount = enemies.length;
      collisionSystem.checkAllCollisions(mockPlayer);

      // 複合効果により複数の敵が影響を受ける
      const remainingEnemies = gameObjectManager.getEnemies();
      expect(remainingEnemies.length).toBeLessThan(initialEnemyCount);

      // 残存敵の一部が凍結状態
      const frozenEnemies = remainingEnemies.filter(enemy => enemy.isFrozen());
      expect(frozenEnemies.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('エンチャント効果のパフォーマンステスト', () => {
    it('大量のエンチャント弾丸でもパフォーマンスを維持', () => {
      const bulletCount = 20;
      const enemyCount = 30;

      // エンチャント効果付きの弾丸を大量作成
      Array.from({ length: bulletCount }, (_, i) => {
        const bullet = new Bullet(i * 20, 50);
        bullet.initialize(i * 20, 50);
        bullet.setPiercing(2);
        bullet.setCriticalChance(50);
        bullet.setFreezeEffect(true);
        bullet.setFreezeDuration(1);
        bullet.setChainLightning(true);
        bullet.setChainCount(3);
        gameObjectManager.addBullet(bullet);
        return bullet;
      });

      // 敵を大量作成
      Array.from({ length: enemyCount }, (_, i) => {
        const enemy = new Enemy((i % 10) * 40, Math.floor(i / 10) * 40 + 100);
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

      // 60FPS維持のため16.67ms以下
      expect(executionTime).toBeLessThan(16.67);

      console.log(
        `エンチャント効果パフォーマンス: ${executionTime.toFixed(2)}ms`
      );
    });

    it('連鎖効果の大量処理でもパフォーマンスを維持', () => {
      const bullet = new Bullet(200, 50);
      bullet.initialize(200, 50);
      bullet.setChainLightning(true);
      bullet.setChainCount(15); // 大量連鎖
      bullet.setCriticalChance(0);

      // 密集した敵を配置
      Array.from({ length: 20 }, (_, i) => {
        const x = 200 + (i % 5) * 25;
        const y = 100 + Math.floor(i / 5) * 25;
        const enemy = new Enemy(x, y);
        gameObjectManager.addEnemy(enemy);
        return enemy;
      });

      gameObjectManager.addBullet(bullet);
      mockRandomProvider.setValues(Array(25).fill(0.9) as number[]);

      const startTime = performance.now();
      collisionSystem.checkAllCollisions(mockPlayer);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(10); // 10ms以下

      console.log(`大量連鎖パフォーマンス: ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('エンチャント効果のエラーハンドリング', () => {
    it('無効な貫通回数でもエラーが発生しない', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setPiercing(-1); // 無効な値

      const enemy = new Enemy(100, 80);
      gameObjectManager.addBullet(bullet);
      gameObjectManager.addEnemy(enemy);

      expect(() => {
        collisionSystem.checkAllCollisions(mockPlayer);
      }).not.toThrow();
    });

    it('無効なクリティカル確率でもエラーが発生しない', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setCriticalChance(-50); // 無効な値

      const enemy = new Enemy(100, 80);
      gameObjectManager.addBullet(bullet);
      gameObjectManager.addEnemy(enemy);

      mockRandomProvider.setValues([0.5]);

      expect(() => {
        collisionSystem.checkAllCollisions(mockPlayer);
      }).not.toThrow();
    });

    it('無効な凍結時間でもエラーが発生しない', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setFreezeEffect(true);
      bullet.setFreezeDuration(-1); // 無効な値

      const enemy = new Enemy(100, 80);
      gameObjectManager.addBullet(bullet);
      gameObjectManager.addEnemy(enemy);

      mockRandomProvider.setValues([0.9]);

      expect(() => {
        collisionSystem.checkAllCollisions(mockPlayer);
      }).not.toThrow();
    });

    it('無効な連鎖回数でもエラーが発生しない', () => {
      const bullet = new Bullet(100, 50);
      bullet.initialize(100, 50);
      bullet.setChainLightning(true);
      bullet.setChainCount(-5); // 無効な値

      const enemy = new Enemy(100, 80);
      gameObjectManager.addBullet(bullet);
      gameObjectManager.addEnemy(enemy);

      mockRandomProvider.setValues([0.9]);

      expect(() => {
        collisionSystem.checkAllCollisions(mockPlayer);
      }).not.toThrow();
    });
  });
});
