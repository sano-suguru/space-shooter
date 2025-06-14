import { ProgressManager } from '../../src/progression/managers/ProgressManager';
import { PersistenceManager } from '../../src/progression/managers/PersistenceManager';
import { ScoreManager } from '../../src/managers/ScoreManager';
import { EventEmitter } from '../../src/events/EventEmitter';
import { EventMap } from '../../src/events/EventType';
import { PlayerProfile } from '../../src/progression/types/PlayerProfile';

// LocalStorageのモック
let mockStore: { [key: string]: string } = {};

const localStorageMock = {
  getItem: jest.fn((key: string) => mockStore[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockStore[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStore[key];
  }),
  clear: jest.fn(() => {
    mockStore = {};
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Node.js環境用のglobal設定
(globalThis as any).localStorage = localStorageMock;

describe('ProgressManager', () => {
  let progressManager: ProgressManager;
  let scoreManager: ScoreManager;
  let eventEmitter: EventEmitter<EventMap>;

  beforeEach(() => {
    // localStorageをクリア
    localStorageMock.clear();
    jest.clearAllMocks();

    eventEmitter = new EventEmitter<EventMap>();
    scoreManager = new ScoreManager(eventEmitter);
    progressManager = new ProgressManager(eventEmitter, scoreManager);
  });

  describe('初期化', () => {
    it('デフォルトプロファイルで初期化される', () => {
      const profile = progressManager.getProfile();

      expect(profile.totalGamesPlayed).toBe(0);
      expect(profile.totalScore).toBe(0);
      expect(profile.highScore).toBe(0);
      expect(profile.coins).toBe(0);
      expect(profile.experience).toBe(0);
      expect(profile.level).toBe(1);
    });

    it('既存プロファイルが読み込まれる', () => {
      const existingProfile: PlayerProfile = {
        totalGamesPlayed: 5,
        totalScore: 1000,
        highScore: 500,
        totalPlayTime: 60000,
        lastPlayDate: '2024-01-01T00:00:00.000Z',
        coins: 100,
        experience: 250,
        level: 3,
        unlockedUpgrades: ['rapid_fire'],
        equippedUpgrades: { rapid_fire: 2 },
        completedAchievements: ['first_steps'],
        stats: {
          enemiesDestroyed: 50,
          bossesDefeated: 2,
          maxWaveReached: 5,
          powerupsCollected: 10,
          bulletsShot: 200,
          damageDealt: 1000,
          damageTaken: 150,
          playStreakDays: 3,
        },
      };

      PersistenceManager.saveProfile(existingProfile);

      const newScoreManager = new ScoreManager(eventEmitter);
      const newProgressManager = new ProgressManager(
        eventEmitter,
        newScoreManager
      );
      const loadedProfile = newProgressManager.getProfile();

      expect(loadedProfile.totalGamesPlayed).toBe(5);
      expect(loadedProfile.coins).toBe(100);
      expect(loadedProfile.level).toBe(3);
    });
  });

  describe('スコア管理', () => {
    it('基本のスコア追加機能が継承される', () => {
      progressManager.addScore(100);
      expect(progressManager.getScore()).toBe(100);

      progressManager.addScore(50);
      expect(progressManager.getScore()).toBe(150);
    });

    it('スコア追加でコインと経験値が獲得される', () => {
      const initialCoins = progressManager.getCoins();
      const initialExp = progressManager.getExperience();

      progressManager.addScore(100);

      expect(progressManager.getCoins()).toBe(initialCoins + 10); // 100 * 0.1 = 10コイン
      expect(progressManager.getExperience()).toBe(initialExp + 5); // 100 * 0.05 = 5経験値
    });

    it('scoreUpdatedイベントが発行される', () => {
      const scoreUpdateSpy = jest.fn();
      eventEmitter.on('scoreUpdated', scoreUpdateSpy);

      progressManager.addScore(100);

      expect(scoreUpdateSpy).toHaveBeenCalledWith(100);
    });
  });

  describe('レベルシステム', () => {
    it('レベル1から開始される', () => {
      expect(progressManager.getLevel()).toBe(1);
    });

    it('経験値がたまるとレベルアップする', () => {
      const levelUpSpy = jest.fn();
      eventEmitter.on('playerLevelUp', levelUpSpy);

      // レベル2に必要な経験値: 100
      progressManager.addScore(2000); // 2000 * 0.05 = 100経験値

      expect(progressManager.getLevel()).toBe(2);
      expect(levelUpSpy).toHaveBeenCalledWith(2, 200); // レベル2 * 100 = 200ボーナスコイン
    });
  });

  describe('統計追跡', () => {
    it('敵撃破統計が更新される', () => {
      progressManager.updateSessionStats('enemiesDestroyed', 1);

      const profile = progressManager.getProfile();
      expect(profile.stats.enemiesDestroyed).toBe(1);
    });

    it('ボス撃破でボーナスコインが獲得される', () => {
      const initialCoins = progressManager.getCoins();

      progressManager.updateSessionStats('bossesDefeated', 1);

      expect(progressManager.getCoins()).toBe(initialCoins + 50);
    });

    it('パワーアップ収集統計が更新される', () => {
      progressManager.updateSessionStats('powerupsCollected', 1);

      const profile = progressManager.getProfile();
      expect(profile.stats.powerupsCollected).toBe(1);
    });
  });

  describe('ゲームセッション管理', () => {
    it('ゲーム開始時にセッションが初期化される', () => {
      const gameStartSpy = jest.fn();
      eventEmitter.on('gameStarted', gameStartSpy);

      progressManager.startGame();

      const session = progressManager.getCurrentSession();
      expect(session.score).toBe(0);
      expect(session.enemiesDestroyed).toBe(0);
      expect(gameStartSpy).toHaveBeenCalled();
    });

    it('ゲーム終了時にプロファイルが更新される', () => {
      progressManager.addScore(500);
      progressManager.updateSessionStats('enemiesDestroyed', 5);

      const initialGamesPlayed = progressManager.getProfile().totalGamesPlayed;

      const gameOverSpy = jest.fn();
      eventEmitter.on('gameOver', gameOverSpy);

      progressManager.endGame();

      const profile = progressManager.getProfile();
      expect(profile.totalGamesPlayed).toBe(initialGamesPlayed + 1);
      expect(profile.totalScore).toBe(500);
      expect(gameOverSpy).toHaveBeenCalled();
    });

    it('ハイスコアが更新される', () => {
      const currentHighScore = progressManager.getProfile().highScore;
      const newScore = currentHighScore + 100;

      progressManager.addScore(newScore);
      progressManager.endGame();

      expect(progressManager.getProfile().highScore).toBe(newScore);
    });
  });

  describe('コイン管理', () => {
    it('コインが正しく追加される', () => {
      const initialCoins = progressManager.getCoins();
      const coinsSpy = jest.fn();
      eventEmitter.on('coinsEarned', coinsSpy);

      progressManager.addCoins(100);

      expect(progressManager.getCoins()).toBe(initialCoins + 100);
      expect(coinsSpy).toHaveBeenCalledWith(100, initialCoins + 100);
    });

    it('コインが十分な場合に消費できる', () => {
      progressManager.addCoins(100);

      const result = progressManager.spendCoins(50);

      expect(result).toBe(true);
      expect(progressManager.getCoins()).toBe(50);
    });

    it('コインが不足している場合は消費できない', () => {
      const result = progressManager.spendCoins(100);

      expect(result).toBe(false);
      expect(progressManager.getCoins()).toBe(0);
    });
  });

  describe('イベント統合', () => {
    it('基本ゲームイベントが統計に反映される', () => {
      // 敵撃破イベント
      eventEmitter.emit('enemyDestroyed', {} as any);
      expect(progressManager.getProfile().stats.enemiesDestroyed).toBe(1);

      // ボス撃破イベント
      eventEmitter.emit('bossDefeated');
      expect(progressManager.getProfile().stats.bossesDefeated).toBe(1);

      // パワーアップ収集イベント
      eventEmitter.emit('powerUpCollected', {} as any);
      expect(progressManager.getProfile().stats.powerupsCollected).toBe(1);
    });
  });

  describe('データ永続化', () => {
    it('プロファイルの変更が自動保存される', () => {
      progressManager.addScore(100);

      // LocalStorageに保存されたかチェック
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'space_shooter_profile',
        expect.any(String)
      );
    });
  });
});
