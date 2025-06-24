import { Bullet } from '../../src/entities/Bullet';
import { Enemy } from '../../src/entities/Enemy';
import { EventEmitter } from '../../src/events/EventEmitter';
import { EventMap } from '../../src/events/EventType';
import { IPlayer } from '../../src/interfaces/IPlayer';
import { GameObjectManager } from '../../src/managers/GameObjectManager';
import { MockRandomProvider } from '../../src/providers/MockRandomProvider';
import { CollisionSystem } from '../../src/systems/CollisionSystem';
import { PowerUpType } from '../../src/types';
import { DamageCalculator } from '../../src/utils/DamageCalculator';

describe('エンチャント効果統合テスト', () => {
  let gameObjectManager: GameObjectManager;
  let eventEmitter: EventEmitter<EventMap>;
  let collisionSystem: CollisionSystem;
  let mockRandomProvider: MockRandomProvider;

  const createMockPlayer = (): IPlayer => ({
    x: 200,
    y: 200,
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
    getPosition: (): { x: number; y: number } => ({ x: 200, y: 200 }),
    getX: (): number => 200,
    getY: (): number => 200,
    getWidth: (): number => 50,
    getHeight: (): number => 50,
  });

  beforeEach(() => {
    eventEmitter = new EventEmitter();
    gameObjectManager = new GameObjectManager(eventEmitter);
    collisionSystem = new CollisionSystem(eventEmitter, gameObjectManager);

    mockRandomProvider = new MockRandomProvider();
    DamageCalculator.setRandomProvider(mockRandomProvider);
  });

  describe('貫通効果', () => {
    it('貫通効果のない弾丸は1体の敵に当たると無効化される', () => {
      const bullet = new Bullet(100, 100);
      bullet.initialize(100, 100);
      bullet.setPiercing(0); // 貫通なし

      const enemy1 = new Enemy(100, 120);
      const enemy2 = new Enemy(100, 140);

      gameObjectManager.addBullet(bullet);
      gameObjectManager.addEnemy(enemy1);
      gameObjectManager.addEnemy(enemy2);

      // クリティカルなし設定
      mockRandomProvider.setValues([0.9]);

      collisionSystem.checkAllCollisions(createMockPlayer());

      expect(bullet.isActive()).toBe(false);
    });

    it('貫通効果のある弾丸は指定回数まで敵を貫通する', () => {
      const bullet = new Bullet(100, 100);
      bullet.initialize(100, 100);
      bullet.setPiercing(2); // 2回貫通

      const enemy1 = new Enemy(100, 120);
      const enemy2 = new Enemy(100, 140);
      const enemy3 = new Enemy(100, 160);

      gameObjectManager.addBullet(bullet);
      gameObjectManager.addEnemy(enemy1);
      gameObjectManager.addEnemy(enemy2);
      gameObjectManager.addEnemy(enemy3);

      // クリティカルなし設定
      mockRandomProvider.setValues([0.9, 0.9, 0.9]);

      collisionSystem.checkAllCollisions(createMockPlayer());

      // 2回貫通後に無効化される
      expect(bullet.isActive()).toBe(false);
    });
  });

  describe('クリティカル効果', () => {
    it('クリティカルヒットが発生すると敵にクリティカル効果が表示される', () => {
      const bullet = new Bullet(100, 100);
      bullet.initialize(100, 100);
      bullet.setCriticalChance(100); // 100%クリティカル

      const enemy = new Enemy(100, 120);
      const takeDamageSpy = jest.spyOn(enemy, 'takeDamage');

      gameObjectManager.addBullet(bullet);
      gameObjectManager.addEnemy(enemy);

      // クリティカル発生設定
      mockRandomProvider.setValues([0.1]);

      collisionSystem.checkAllCollisions(createMockPlayer());

      expect(takeDamageSpy).toHaveBeenCalledWith(2, true); // ダメージ2倍、クリティカルフラグtrue
    });

    it('クリティカルヒットが発生しない場合は通常ダメージ', () => {
      const bullet = new Bullet(100, 100);
      bullet.initialize(100, 100);
      bullet.setCriticalChance(0); // 0%クリティカル

      const enemy = new Enemy(100, 120);
      const takeDamageSpy = jest.spyOn(enemy, 'takeDamage');

      gameObjectManager.addBullet(bullet);
      gameObjectManager.addEnemy(enemy);

      // クリティカル発生しない設定
      mockRandomProvider.setValues([0.9]);

      collisionSystem.checkAllCollisions(createMockPlayer());

      expect(takeDamageSpy).toHaveBeenCalledWith(1, false); // 通常ダメージ、クリティカルフラグfalse
    });
  });

  describe('凍結効果', () => {
    it('凍結効果のある弾丸が敵に当たると敵が凍結する', () => {
      const bullet = new Bullet(100, 100);
      bullet.initialize(100, 100);
      bullet.setFreezeEffect(true);
      bullet.setFreezeDuration(2); // 2秒凍結

      const enemy = new Enemy(100, 120);
      const freezeSpy = jest.spyOn(enemy, 'freeze');

      gameObjectManager.addBullet(bullet);
      gameObjectManager.addEnemy(enemy);

      // クリティカルなし設定
      mockRandomProvider.setValues([0.9]);

      collisionSystem.checkAllCollisions(createMockPlayer());

      expect(freezeSpy).toHaveBeenCalledWith(2);
      expect(enemy.isFrozen()).toBe(true);
    });

    it('凍結中の敵は移動しない', () => {
      const enemy = new Enemy(100, 100);
      enemy.freeze(1); // 1秒凍結

      const initialY = enemy.getY();

      // 時間経過をシミュレート
      enemy.update(0.1); // 100ms経過

      expect(enemy.getY()).toBe(initialY); // 位置が変わらない
      expect(enemy.isFrozen()).toBe(true);
    });
  });

  describe('複合効果', () => {
    it('貫通+クリティカル+凍結効果が同時に動作する', () => {
      const bullet = new Bullet(100, 100);
      bullet.initialize(100, 100);
      bullet.setPiercing(2);
      bullet.setCriticalChance(100);
      bullet.setFreezeEffect(true);
      bullet.setFreezeDuration(1);

      const enemy1 = new Enemy(100, 120);
      const enemy2 = new Enemy(100, 140);

      const takeDamageSpy1 = jest.spyOn(enemy1, 'takeDamage');
      const takeDamageSpy2 = jest.spyOn(enemy2, 'takeDamage');
      const freezeSpy1 = jest.spyOn(enemy1, 'freeze');
      const freezeSpy2 = jest.spyOn(enemy2, 'freeze');

      gameObjectManager.addBullet(bullet);
      gameObjectManager.addEnemy(enemy1);
      gameObjectManager.addEnemy(enemy2);

      // 両方クリティカル発生設定
      mockRandomProvider.setValues([0.1, 0.1]);

      collisionSystem.checkAllCollisions(createMockPlayer());

      // 両方の敵にクリティカルダメージと凍結効果が適用される
      expect(takeDamageSpy1).toHaveBeenCalledWith(2, true);
      expect(takeDamageSpy2).toHaveBeenCalledWith(2, true);
      expect(freezeSpy1).toHaveBeenCalledWith(1);
      expect(freezeSpy2).toHaveBeenCalledWith(1);
      expect(enemy1.isFrozen()).toBe(true);
      expect(enemy2.isFrozen()).toBe(true);
    });
  });
});
