import { Game } from '../src/core/Game';
import { Player } from '../src/entities/Player';
import { EventEmitter } from '../src/events/EventEmitter';
import { EventMap } from '../src/events/EventType';
import { GameObjectFactory } from '../src/factories/GameObjectFactory';
import { GameStateManager } from '../src/managers/GameStateManager';
import { ScoreManager } from '../src/managers/ScoreManager';
import { MockInputManager, MockDOMManager, MockMessageManager } from '../src/managers';
import { MockRandomProvider, MockTimeProvider } from '../src/providers';

describe('Game', () => {
  let game: Game;
  let mockCanvas: HTMLCanvasElement;
  let eventEmitter: EventEmitter<EventMap>;
  let scoreManager: ScoreManager;
  let player: Player;
  let gameObjectFactory: GameObjectFactory;
  let stateManager: GameStateManager;
  let mockInputManager: MockInputManager;
  let mockRandomProvider: MockRandomProvider;
  let mockDOMManager: MockDOMManager;
  let mockMessageManager: MockMessageManager;
  let mockTimeProvider: MockTimeProvider;

  beforeEach(() => {
    // Canvas と Context のモック
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 400;
    mockCanvas.height = 600;

    // 依存関係のモック作成
    eventEmitter = new EventEmitter<EventMap>();
    mockInputManager = new MockInputManager();
    mockRandomProvider = new MockRandomProvider();
    mockRandomProvider.setValues([0.5, 0.3, 0.7, 0.2, 0.8]);
    mockDOMManager = new MockDOMManager();
    mockTimeProvider = new MockTimeProvider();
    mockMessageManager = new MockMessageManager();

    // Game依存オブジェクトの作成
    scoreManager = new ScoreManager(eventEmitter);
    player = new Player(eventEmitter, mockInputManager, mockRandomProvider);
    gameObjectFactory = new GameObjectFactory(mockRandomProvider);
    stateManager = new GameStateManager(eventEmitter);

    // Gameインスタンス作成
    game = new Game(
      mockCanvas,
      eventEmitter,
      scoreManager,
      player,
      gameObjectFactory,
      stateManager,
      mockInputManager,
      mockRandomProvider,
      mockDOMManager,
      mockMessageManager,
      mockTimeProvider
    );
  });

  describe('初期化とセットアップ', () => {
    test('Gameが正常に初期化される', () => {
      expect(game).toBeDefined();
      expect(game.getDifficultyFactor).toBeDefined();
      expect(game.createBullet).toBeDefined();
    });

    test('IGameEngineインターフェースが正しく実装されている', () => {
      // IGameEngine のメソッドが存在することを確認
      expect(typeof game.addBossBullet).toBe('function');
      expect(typeof game.getDifficultyFactor).toBe('function');
      expect(typeof game.createBullet).toBe('function');
    });

    test('初期状態が正しく設定される', () => {
      expect(game.getDifficultyFactor()).toBe(0);
    });
  });

  describe('ゲームループ管理', () => {
    test('ゲーム開始が正常に動作する', () => {
      expect(() => {
        game.start();
      }).not.toThrow();
    });

    test('ゲーム更新が正常に動作する', () => {
      expect(() => {
        game.updateGameObjects(16);
      }).not.toThrow();
    });

    test('衝突判定が実行される', () => {
      expect(() => {
        game.checkCollisions();
      }).not.toThrow();
    });
  });

  describe('オブジェクト管理', () => {
    test('弾丸が正常に作成される', () => {
      const bullet = game.createBullet(100, 200);
      
      expect(bullet).toBeDefined();
      if (bullet) {
        expect(bullet.getPosition().x).toBe(100);
        expect(bullet.getPosition().y).toBe(200);
      }
    });

    test('ボス弾丸が追加される', () => {
      const bossBullet = {
        getX: () => 100,
        getY: () => 200,
        getWidth: () => 5,
        getHeight: () => 15,
        update: jest.fn(),
        draw: jest.fn(),
        isOnScreen: () => true
      } as any;

      expect(() => {
        game.addBossBullet(bossBullet);
      }).not.toThrow();
    });

    test('敵が追加される', () => {
      const enemy = gameObjectFactory.createEnemy('SMALL', game);
      
      expect(() => {
        game.addEnemy(enemy);
      }).not.toThrow();
    });
  });

  describe('スコアとレベル管理', () => {
    test('難易度係数が正しく取得される', () => {
      const difficulty = game.getDifficultyFactor();
      expect(typeof difficulty).toBe('number');
      expect(difficulty).toBeGreaterThanOrEqual(0);
    });

    test('UIが更新される', () => {
      const healthChangedSpy = jest.fn();
      eventEmitter.on('healthChanged', healthChangedSpy);

      game.updateUI();

      expect(healthChangedSpy).toHaveBeenCalled();
    });
  });

  describe('メッセージ表示', () => {
    test('メッセージが表示される', () => {
      game.showMessage('Test Message');
      
      expect(mockMessageManager.getLastMessage()?.text).toBe('Test Message');
    });

    test('メッセージが非表示になる', () => {
      game.showMessage('Test Message');
      game.hideMessage();
      
      expect(mockMessageManager.isMessageVisible()).toBe(false);
    });
  });

  describe('ゲーム状態管理', () => {
    test('ゲームオーバーが正常に動作する', () => {
      expect(() => {
        game.gameOver();
      }).not.toThrow();
    });

    test('ゲームリセットが正常に動作する', () => {
      expect(() => {
        game.resetGame();
      }).not.toThrow();
    });

    test('ゲーム状態マネージャーが取得できる', () => {
      const manager = game.getStateManager();
      expect(manager).toBeDefined();
      expect(manager.getCurrentState).toBeDefined();
    });
  });

  describe('入力処理', () => {
    test('入力処理が正常に動作する', () => {
      expect(() => {
        game.handleInput('Escape');
      }).not.toThrow();
    });
  });

  describe('ゲームループ制御', () => {
    test('ゲームループが一時停止される', () => {
      expect(() => {
        game.pauseGameLoop();
      }).not.toThrow();
    });

    test('ゲームループが再開される', () => {
      expect(() => {
        game.resumeGameLoop();
      }).not.toThrow();
    });
  });

  describe('ゲームオーバー画面', () => {
    test('ゲームオーバー画面が表示される', () => {
      game.showGameOverScreen();
      
      expect(mockMessageManager.isGameOverScreenVisible()).toBe(true);
    });

    test('ゲームオーバー画面が非表示になる', () => {
      game.showGameOverScreen();
      game.hideGameOverScreen();
      
      expect(mockMessageManager.isGameOverScreenVisible()).toBe(false);
    });
  });

  describe('ウェーブシステム', () => {
    test('ウェーブシステムが開始される', () => {
      expect(() => {
        game.startWaveSystem();
      }).not.toThrow();
    });
  });

  describe('背景レンダリング', () => {
    test('背景最適化が切り替わる', () => {
      expect(() => {
        game.toggleBackgroundOptimization();
      }).not.toThrow();
    });

    test('背景パフォーマンス統計が取得できる', () => {
      const stats = game.getBackgroundPerformanceStats();
      expect(stats).toBeDefined();
      expect(typeof stats.averageRenderTime).toBe('number');
    });

    test('背景パフォーマンス情報がログ出力される', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      game.logBackgroundPerformance();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('プール統計', () => {
    test('プール統計が取得できる', () => {
      const stats = game.getPoolStats();
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });
  });

  describe('リソース管理', () => {
    test('リソースが正常にクリーンアップされる', () => {
      expect(() => {
        game.dispose();
      }).not.toThrow();
    });
  });

  describe('エラーハンドリング', () => {
    test('無効な入力でエラーが発生しない', () => {
      expect(() => {
        game.handleInput('InvalidKey');
      }).not.toThrow();
    });

    test('存在しない弾丸作成でエラーが発生しない', () => {
      const bullet = game.createBullet(-100, -100);
      expect(bullet).toBeDefined();
    });
  });

  describe('イベント統合', () => {
    test('スコア更新イベントが発行される', () => {
      const scoreUpdatedSpy = jest.fn();
      eventEmitter.on('scoreUpdated', scoreUpdatedSpy);

      game.updateUI();

      expect(scoreUpdatedSpy).toHaveBeenCalled();
    });

    test('ゲーム開始イベントが発行される', () => {
      const gameStartedSpy = jest.fn();
      eventEmitter.on('gameStarted', gameStartedSpy);

      game.start();

      expect(gameStartedSpy).toHaveBeenCalled();
    });
  });
});
