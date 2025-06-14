import { DynamicEnemy } from '../../src/entities/DynamicEnemy';
import { Enemy } from '../../src/entities/Enemy';
import { EventEmitter } from '../../src/events/EventEmitter';
import { EventMap } from '../../src/events/EventType';
import { GameObjectFactory } from '../../src/factories/GameObjectFactory';
import { WaveManager } from '../../src/managers/WaveManager';
import { ProgressManager } from '../../src/progression/managers/ProgressManager';
import { RealRandomProvider } from '../../src/providers/RealRandomProvider';

// モックゲームクラス
class MockGame {
  private enemies: Array<Enemy | DynamicEnemy> = [];
  private messages: string[] = [];

  addEnemy(enemy: Enemy | DynamicEnemy): void {
    this.enemies.push(enemy);
  }

  showWaveMessage(message: string): void {
    this.messages.push(message);
  }

  getStateManager() {
    return {
      isPlaying: () => true,
    };
  }

  getDifficultyFactor(): number {
    return 0.1; // 基本的な難易度ファクター
  }

  getEnemies(): Array<Enemy | DynamicEnemy> {
    return this.enemies;
  }

  getMessages(): string[] {
    return this.messages;
  }

  reset(): void {
    this.enemies = [];
    this.messages = [];
  }
}

describe('システム統合テスト', () => {
  let eventEmitter: EventEmitter<EventMap>;
  let randomProvider: RealRandomProvider;
  let gameObjectFactory: GameObjectFactory;
  let waveManager: WaveManager;
  let progressManager: ProgressManager;
  let mockGame: MockGame;

  beforeEach(() => {
    eventEmitter = new EventEmitter<EventMap>();
    randomProvider = new RealRandomProvider();
    mockGame = new MockGame();

    // GameObjectFactoryを動的敵生成システム付きで初期化
    gameObjectFactory = new GameObjectFactory(randomProvider, eventEmitter);

    // WaveManagerを初期化
    waveManager = new WaveManager(
      eventEmitter,
      gameObjectFactory,
      mockGame as any
    );

    // ProgressManagerを初期化
    progressManager = new ProgressManager(eventEmitter);
  });

  afterEach(() => {
    mockGame.reset();
  });

  describe('GameObjectFactory統合', () => {
    test('動的敵生成システムが正常に初期化される', () => {
      expect(gameObjectFactory.isDynamicEnemyEnabled()).toBe(true);
    });

    test('動的敵生成が正常に動作する', () => {
      const enemy = gameObjectFactory.createDynamicEnemy(
        'SMALL',
        mockGame as any
      );

      expect(enemy).toBeDefined();
      expect(enemy instanceof DynamicEnemy).toBe(true);

      if (enemy instanceof DynamicEnemy) {
        const config = enemy.getDynamicConfig();
        expect(config.baseType).toBe('SMALL');
        expect(config.position).toBeDefined();
        expect(config.stats).toBeDefined();
      }
    });

    test('フォールバック機能が正常に動作する', () => {
      // 動的敵生成を無効にする
      gameObjectFactory.setDynamicEnemyEnabled(false);

      const enemy = gameObjectFactory.createDynamicEnemy(
        'MEDIUM',
        mockGame as any
      );

      expect(enemy).toBeDefined();
      expect(enemy instanceof Enemy).toBe(true);
      expect(enemy instanceof DynamicEnemy).toBe(false);
    });

    test('ウェーブ敵生成が正常に動作する', () => {
      const enemies = gameObjectFactory.createWaveEnemies(
        1, // waveNumber
        1, // playerLevel
        [
          { type: 'SMALL', count: 2 },
          { type: 'MEDIUM', count: 1 },
        ],
        mockGame as any
      );

      expect(enemies).toHaveLength(3);
      expect(enemies.every(enemy => enemy instanceof DynamicEnemy)).toBe(true);
    });
  });

  describe('WaveManager統合', () => {
    test('動的敵生成が有効な状態でウェーブが開始される', () => {
      waveManager.setUseDynamicEnemies(true);
      waveManager.setPlayerLevel(5);

      expect(waveManager.isDynamicEnemiesEnabled()).toBe(true);

      const waveStarted = waveManager.startNextWave();
      expect(waveStarted).toBe(true);
      expect(waveManager.getCurrentWave()).toBe(1);
    });

    test('プレイヤーレベルが難易度に反映される', () => {
      waveManager.setUseDynamicEnemies(true);
      waveManager.setPlayerLevel(10);

      const info = waveManager.getWaveManagerInfo();
      expect(info.playerLevel).toBe(10);
      expect(info.useDynamicEnemies).toBe(true);
    });

    test('環境敵生成が正常に動作する', () => {
      waveManager.setUseDynamicEnemies(true);
      waveManager.setPlayerLevel(3);

      const initialEnemyCount = mockGame.getEnemies().length;
      waveManager.spawnEnvironmentalEnemies('nebula', 2);

      expect(mockGame.getEnemies().length).toBe(initialEnemyCount + 2);
    });
  });

  describe('ProgressManager統合', () => {
    test('難易度ファクターが正常に計算される', () => {
      const factors = progressManager.calculateDifficultyFactors(5);

      expect(factors.playerLevel).toBeDefined();
      expect(factors.currentWave).toBe(5);
      expect(factors.baseMultiplier).toBe(1.0);
      expect(factors.levelScaling).toBeGreaterThanOrEqual(0);
      expect(factors.waveScaling).toBeGreaterThanOrEqual(0);
    });

    test('敵生成推奨設定が正常に取得される', () => {
      const recommendations =
        progressManager.getEnemyGenerationRecommendations();

      expect(recommendations.shouldUseEliteEnemies).toBeDefined();
      expect(recommendations.eliteSpawnChance).toBeGreaterThanOrEqual(0);
      expect(recommendations.recommendedFlockSize).toBeGreaterThan(0);
      expect(recommendations.difficultyMultiplier).toBeGreaterThan(0);
    });

    test('プレイヤー統計が正常に取得される', () => {
      const stats = progressManager.getPlayerStatsForEnemyGeneration();

      expect(stats.level).toBeGreaterThan(0);
      expect(stats.experience).toBeGreaterThanOrEqual(0);
      expect(['easy', 'normal', 'hard']).toContain(stats.preferredDifficulty);
      expect(['improving', 'stable', 'declining']).toContain(
        stats.recentPerformance
      );
    });

    test('動的敵撃破処理が正常に動作する', () => {
      const initialScore = progressManager.getScore();
      const initialCoins = progressManager.getCoins();

      // 通常敵撃破
      progressManager.handleDynamicEnemyDestroyed(false, 1.0);
      expect(progressManager.getScore()).toBeGreaterThan(initialScore);

      // エリート敵撃破
      progressManager.handleDynamicEnemyDestroyed(true, 2.0);
      expect(progressManager.getCoins()).toBeGreaterThan(initialCoins);
    });
  });

  describe('システム間連携', () => {
    test('ProgressManagerの難易度設定がWaveManagerに反映される', () => {
      const difficultyFactors = progressManager.calculateDifficultyFactors(3);
      waveManager.setPlayerLevel(difficultyFactors.playerLevel);

      const waveInfo = waveManager.getWaveManagerInfo();
      expect(waveInfo.playerLevel).toBe(difficultyFactors.playerLevel);
    });

    test('動的敵生成統計が正常に取得される', () => {
      waveManager.setUseDynamicEnemies(true);

      // 敵を生成
      gameObjectFactory.createDynamicEnemy('LARGE', mockGame as any);

      const stats = gameObjectFactory.getDynamicEnemyStatistics();
      expect(stats).toBeDefined();
      if (stats) {
        expect(stats.totalGenerated).toBeGreaterThan(0);
      }
    });

    test('システムリセットが正常に動作する', () => {
      // システムを使用状態にする
      waveManager.setUseDynamicEnemies(true);
      waveManager.startNextWave();
      gameObjectFactory.createDynamicEnemy('SMALL', mockGame as any);

      // リセット実行
      waveManager.reset();
      gameObjectFactory.resetDynamicEnemySystem();

      // リセット後の状態確認
      expect(waveManager.getCurrentWave()).toBe(0);
      expect(waveManager.isWaveActive()).toBe(false);

      const stats = gameObjectFactory.getDynamicEnemyStatistics();
      if (stats) {
        expect(stats.totalGenerated).toBe(0);
      }
    });
  });

  describe('エラーハンドリング', () => {
    test('動的敵生成失敗時のフォールバック', () => {
      // 意図的にエラーを発生させるため、無効な設定を使用
      const enemy = gameObjectFactory.createDynamicEnemySafe(
        'SMALL',
        mockGame as any,
        undefined,
        { x: -1000, y: -1000 } // 無効な位置
      );

      // フォールバックで通常の敵が生成されることを確認
      expect(enemy).toBeDefined();
    });

    test('動的敵生成システム未初期化時の処理', () => {
      // 動的敵生成システムなしでGameObjectFactoryを作成
      const basicFactory = new GameObjectFactory(randomProvider);

      expect(basicFactory.isDynamicEnemyEnabled()).toBe(false);

      const enemy = basicFactory.createDynamicEnemy('MEDIUM', mockGame as any);
      expect(enemy instanceof Enemy).toBe(true);
      expect(enemy instanceof DynamicEnemy).toBe(false);
    });
  });
});
