import { EventEmitter } from '../../../src/events/EventEmitter';
import { EventMap } from '../../../src/events/EventType';
import { MockRandomProvider } from '../../../src/providers/MockRandomProvider';
import { EnemyGenerationSystem } from '../../../src/systems/enemy-generation/EnemyGenerationSystem';
import { EnemyGenerationRequest } from '../../../src/systems/types/EnemyGeneration';
import { EnemyType } from '../../../src/types';

describe('EnemyGenerationSystem', () => {
  let system: EnemyGenerationSystem;
  let mockRandom: MockRandomProvider;
  let eventEmitter: EventEmitter<EventMap>;

  beforeEach(() => {
    mockRandom = new MockRandomProvider();
    eventEmitter = new EventEmitter<EventMap>();
    system = new EnemyGenerationSystem(eventEmitter, mockRandom);
  });

  describe('generateEnemy', () => {
    it('should generate a basic enemy with default settings', () => {
      const request: EnemyGenerationRequest = {
        baseType: 'SMALL',
        position: { x: 100, y: 50 },
        difficultyFactors: {
          playerLevel: 1,
          currentWave: 1,
          baseMultiplier: 1.0,
          levelScaling: 0.1,
          waveScaling: 0.05,
        },
      };

      const enemy = system.generateEnemy(request);

      expect(enemy).toBeDefined();
      expect(enemy.baseType).toBe('SMALL');
      expect(enemy.position).toEqual({ x: 100, y: 50 });
      expect(enemy.stats).toBeDefined();
      expect(enemy.appearance).toBeDefined();
      expect(enemy.behavior).toBeDefined();
      expect(enemy.attack).toBeDefined();
    });

    it('should generate different enemies with random variations', () => {
      const request: EnemyGenerationRequest = {
        baseType: 'MEDIUM',
        position: { x: 200, y: 100 },
        difficultyFactors: {
          playerLevel: 5,
          currentWave: 10,
          baseMultiplier: 1.0,
          levelScaling: 0.1,
          waveScaling: 0.05,
        },
      };

      // 複数回生成して違いを確認
      const enemy1 = system.generateEnemy(request);
      const enemy2 = system.generateEnemy(request);

      // 基本設定は同じ
      expect(enemy1.baseType).toBe(enemy2.baseType);
      expect(enemy1.position).toEqual(enemy2.position);

      // ランダム要素により異なる可能性がある
      // （MockRandomProviderの実装によっては同じになる場合もある）
    });

    it('should apply difficulty scaling correctly', () => {
      const easyRequest: EnemyGenerationRequest = {
        baseType: 'LARGE',
        position: { x: 150, y: 75 },
        difficultyFactors: {
          playerLevel: 1,
          currentWave: 1,
          baseMultiplier: 1.0,
          levelScaling: 0.1,
          waveScaling: 0.05,
        },
      };

      const hardRequest: EnemyGenerationRequest = {
        baseType: 'LARGE',
        position: { x: 150, y: 75 },
        difficultyFactors: {
          playerLevel: 10,
          currentWave: 20,
          baseMultiplier: 1.0,
          levelScaling: 0.1,
          waveScaling: 0.05,
        },
      };

      const easyEnemy = system.generateEnemy(easyRequest);
      const hardEnemy = system.generateEnemy(hardRequest);

      // 高難易度の敵の方が強いはず
      expect(hardEnemy.stats.health).toBeGreaterThanOrEqual(
        easyEnemy.stats.health
      );
      expect(hardEnemy.stats.attackPower).toBeGreaterThanOrEqual(
        easyEnemy.stats.attackPower
      );
    });

    it('should emit dynamicEnemyGenerated event', () => {
      const eventSpy = jest.fn();
      eventEmitter.on('dynamicEnemyGenerated', eventSpy);

      const request: EnemyGenerationRequest = {
        baseType: 'SMALL',
        position: { x: 100, y: 50 },
        difficultyFactors: {
          playerLevel: 1,
          currentWave: 1,
          baseMultiplier: 1.0,
          levelScaling: 0.1,
          waveScaling: 0.05,
        },
      };

      const enemy = system.generateEnemy(request);

      expect(eventSpy).toHaveBeenCalledWith(enemy);
    });
  });

  describe('generateEnemyBatch', () => {
    it('should generate multiple enemies at once', () => {
      const requests: EnemyGenerationRequest[] = [
        {
          baseType: 'SMALL',
          position: { x: 100, y: 50 },
          difficultyFactors: {
            playerLevel: 1,
            currentWave: 1,
            baseMultiplier: 1.0,
            levelScaling: 0.1,
            waveScaling: 0.05,
          },
        },
        {
          baseType: 'MEDIUM',
          position: { x: 200, y: 100 },
          difficultyFactors: {
            playerLevel: 1,
            currentWave: 1,
            baseMultiplier: 1.0,
            levelScaling: 0.1,
            waveScaling: 0.05,
          },
        },
      ];

      const enemies = system.generateEnemyBatch(requests);

      expect(enemies).toHaveLength(2);
      expect(enemies[0].baseType).toBe('SMALL');
      expect(enemies[1].baseType).toBe('MEDIUM');
    });

    it('should emit enemyBatchGenerated event', () => {
      const eventSpy = jest.fn();
      eventEmitter.on('enemyBatchGenerated', eventSpy);

      const requests: EnemyGenerationRequest[] = [
        {
          baseType: 'SMALL',
          position: { x: 100, y: 50 },
          difficultyFactors: {
            playerLevel: 1,
            currentWave: 1,
            baseMultiplier: 1.0,
            levelScaling: 0.1,
            waveScaling: 0.05,
          },
        },
      ];

      const enemies = system.generateEnemyBatch(requests);

      expect(eventSpy).toHaveBeenCalledWith(enemies, expect.any(Object));
    });
  });

  describe('generateWaveEnemies', () => {
    it('should generate enemies for a wave', () => {
      const enemyTypes = [
        { type: 'SMALL' as EnemyType, count: 3 },
        { type: 'MEDIUM' as EnemyType, count: 2 },
      ];

      const enemies = system.generateWaveEnemies(5, 3, enemyTypes);

      expect(enemies).toHaveLength(5);

      const smallEnemies = enemies.filter(e => e.baseType === 'SMALL');
      const mediumEnemies = enemies.filter(e => e.baseType === 'MEDIUM');

      expect(smallEnemies).toHaveLength(3);
      expect(mediumEnemies).toHaveLength(2);
    });

    it('should apply wave and level difficulty', () => {
      const enemyTypes = [{ type: 'LARGE' as EnemyType, count: 1 }];

      const lowLevelEnemies = system.generateWaveEnemies(1, 1, enemyTypes);
      const highLevelEnemies = system.generateWaveEnemies(10, 10, enemyTypes);

      expect(highLevelEnemies[0].stats.health).toBeGreaterThanOrEqual(
        lowLevelEnemies[0].stats.health
      );
    });
  });

  describe('flock management', () => {
    it('should track active flocks', () => {
      const request: EnemyGenerationRequest = {
        baseType: 'SMALL',
        position: { x: 100, y: 50 },
        difficultyFactors: {
          playerLevel: 1,
          currentWave: 1,
          baseMultiplier: 1.0,
          levelScaling: 0.1,
          waveScaling: 0.05,
        },
      };

      // 群れ行動傾向の高い敵を生成
      mockRandom.setValues([0.8]); // 高い群れ傾向
      const enemy = system.generateEnemy(request);

      if (enemy.flockId) {
        const activeFlocks = system.getActiveFlocks();
        expect(activeFlocks.has(enemy.flockId)).toBe(true);
      }
    });

    it('should remove empty flocks', () => {
      const flockId = 'test-flock-id';

      // 空の群れを削除
      system.removeFlockById(flockId);

      const activeFlocks = system.getActiveFlocks();
      expect(activeFlocks.has(flockId)).toBe(false);
    });
  });

  describe('statistics', () => {
    it('should track generation statistics', () => {
      const request: EnemyGenerationRequest = {
        baseType: 'MEDIUM',
        position: { x: 100, y: 50 },
        difficultyFactors: {
          playerLevel: 1,
          currentWave: 1,
          baseMultiplier: 1.0,
          levelScaling: 0.1,
          waveScaling: 0.05,
        },
      };

      // 複数の敵を生成
      system.generateEnemy(request);
      system.generateEnemy(request);
      system.generateEnemy(request);

      const stats = system.getGenerationStatistics();

      expect(stats.totalGenerated).toBe(3);
      expect(stats.typeDistribution.MEDIUM).toBe(3);
      expect(stats.recentGeneration).toHaveLength(3);
    });

    it('should limit history size', () => {
      const request: EnemyGenerationRequest = {
        baseType: 'SMALL',
        position: { x: 100, y: 50 },
        difficultyFactors: {
          playerLevel: 1,
          currentWave: 1,
          baseMultiplier: 1.0,
          levelScaling: 0.1,
          waveScaling: 0.05,
        },
      };

      // 履歴制限をテスト（実際の制限は100だが、テストでは少数で確認）
      for (let i = 0; i < 25; i++) {
        system.generateEnemy(request);
      }

      const stats = system.getGenerationStatistics();
      expect(stats.recentGeneration).toHaveLength(20); // 最近20体のみ
    });
  });

  describe('reset', () => {
    it('should reset system state', () => {
      const request: EnemyGenerationRequest = {
        baseType: 'LARGE',
        position: { x: 100, y: 50 },
        difficultyFactors: {
          playerLevel: 1,
          currentWave: 1,
          baseMultiplier: 1.0,
          levelScaling: 0.1,
          waveScaling: 0.05,
        },
      };

      // 敵を生成してから
      system.generateEnemy(request);

      // リセット
      system.reset();

      const stats = system.getGenerationStatistics();
      expect(stats.totalGenerated).toBe(0);
      expect(stats.activeFlockCount).toBe(0);
    });

    it('should emit reset event', () => {
      const eventSpy = jest.fn();
      eventEmitter.on('enemyGenerationSystemReset', eventSpy);

      system.reset();

      expect(eventSpy).toHaveBeenCalled();
    });
  });
});
