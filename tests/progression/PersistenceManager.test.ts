import { PersistenceManager } from '../../src/progression/managers/PersistenceManager';
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
(
  globalThis as unknown as { localStorage: typeof localStorageMock }
).localStorage = localStorageMock;

describe('PersistenceManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    // モックの実装をリセット
    localStorageMock.getItem.mockImplementation(
      (key: string) => mockStore[key] || null
    );
    localStorageMock.setItem.mockImplementation(
      (key: string, value: string) => {
        mockStore[key] = value;
      }
    );
    localStorageMock.removeItem.mockImplementation((key: string) => {
      delete mockStore[key];
    });
  });

  describe('プロファイル保存', () => {
    it('プロファイルをLocalStorageに保存できる', () => {
      const profile: PlayerProfile = {
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

      PersistenceManager.saveProfile(profile);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'space_shooter_profile',
        JSON.stringify(profile)
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'space_shooter_profile_version',
        '1.0.0'
      );
    });

    it('保存エラー時にコンソール警告が出力される', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // 一時的にsetItemをエラーを投げるようにオーバーライド
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      const profile: PlayerProfile = {
        totalGamesPlayed: 0,
        totalScore: 0,
        highScore: 0,
        totalPlayTime: 0,
        lastPlayDate: new Date().toISOString(),
        coins: 0,
        experience: 0,
        level: 1,
        unlockedUpgrades: [],
        equippedUpgrades: {},
        completedAchievements: [],
        stats: {
          enemiesDestroyed: 0,
          bossesDefeated: 0,
          maxWaveReached: 0,
          powerupsCollected: 0,
          bulletsShot: 0,
          damageDealt: 0,
          damageTaken: 0,
          playStreakDays: 1,
        },
      };

      PersistenceManager.saveProfile(profile);

      expect(consoleSpy).toHaveBeenCalledWith(
        'プレイヤープロファイルの保存に失敗しました:',
        expect.any(Error)
      );

      // モックを元に戻す
      localStorageMock.setItem.mockImplementation(originalSetItem);
      consoleSpy.mockRestore();
    });
  });

  describe('プロファイル読み込み', () => {
    it('保存されたプロファイルを正しく読み込める', () => {
      const originalProfile: PlayerProfile = {
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

      localStorageMock.setItem(
        'space_shooter_profile',
        JSON.stringify(originalProfile)
      );
      localStorageMock.setItem('space_shooter_profile_version', '1.0.0');

      const loadedProfile = PersistenceManager.loadProfile();

      expect(loadedProfile).toEqual(originalProfile);
    });

    it('データが存在しない場合はデフォルトプロファイルを返す', () => {
      const profile = PersistenceManager.loadProfile();

      expect(profile.totalGamesPlayed).toBe(0);
      expect(profile.totalScore).toBe(0);
      expect(profile.coins).toBe(0);
      expect(profile.level).toBe(1);
      expect(profile.unlockedUpgrades).toEqual([]);
      expect(profile.stats.enemiesDestroyed).toBe(0);
    });

    it('読み込みエラー時はデフォルトプロファイルを返す', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // 一時的にgetItemをエラーを投げるようにオーバーライド
      const originalGetItem = localStorageMock.getItem;
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const profile = PersistenceManager.loadProfile();

      expect(profile.level).toBe(1);
      expect(profile.coins).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        'プレイヤープロファイルの読み込みに失敗しました:',
        expect.any(Error)
      );

      // モックを元に戻す
      localStorageMock.getItem.mockImplementation(originalGetItem);
      consoleSpy.mockRestore();
    });

    it('無効なJSONの場合はデフォルトプロファイルを返す', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // 直接mockStoreに無効なJSONを設定
      mockStore['space_shooter_profile'] = 'invalid json';

      const profile = PersistenceManager.loadProfile();

      expect(profile.level).toBe(1);
      expect(profile.coins).toBe(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('プロファイル検証', () => {
    it('不完全なプロファイルが補完される', () => {
      const incompleteProfile = {
        totalGamesPlayed: 5,
        coins: 100,
        // その他のフィールドが欠如
      };

      localStorageMock.setItem(
        'space_shooter_profile',
        JSON.stringify(incompleteProfile)
      );
      localStorageMock.setItem('space_shooter_profile_version', '1.0.0');

      const profile = PersistenceManager.loadProfile();

      expect(profile.totalGamesPlayed).toBe(5);
      expect(profile.coins).toBe(100);
      expect(profile.totalScore).toBe(0); // デフォルト値で補完
      expect(profile.level).toBe(1); // デフォルト値で補完
      expect(profile.stats.enemiesDestroyed).toBe(0); // 統計も補完
    });

    it('負の値が正の値に修正される', () => {
      const invalidProfile = {
        totalGamesPlayed: 0,
        totalScore: 0,
        highScore: 0,
        totalPlayTime: 0,
        lastPlayDate: new Date().toISOString(),
        coins: -100, // 負の値
        experience: -50, // 負の値
        level: 0, // 無効なレベル
        unlockedUpgrades: [],
        equippedUpgrades: {},
        completedAchievements: [],
        stats: {
          enemiesDestroyed: -10, // 負の値
          bossesDefeated: 0,
          maxWaveReached: 0,
          powerupsCollected: 0,
          bulletsShot: 0,
          damageDealt: 0,
          damageTaken: 0,
          playStreakDays: 0, // 無効な値
        },
      };

      localStorageMock.setItem(
        'space_shooter_profile',
        JSON.stringify(invalidProfile)
      );
      localStorageMock.setItem('space_shooter_profile_version', '1.0.0');

      const profile = PersistenceManager.loadProfile();

      expect(profile.coins).toBe(0); // 負の値が0に修正
      expect(profile.experience).toBe(0); // 負の値が0に修正
      expect(profile.level).toBe(1); // 0が1に修正
      expect(profile.stats.enemiesDestroyed).toBe(0); // 負の値が0に修正
      expect(profile.stats.playStreakDays).toBe(1); // 0が1に修正
    });

    it('配列フィールドが正しく検証される', () => {
      const invalidProfile = {
        totalGamesPlayed: 0,
        totalScore: 0,
        highScore: 0,
        totalPlayTime: 0,
        lastPlayDate: new Date().toISOString(),
        coins: 0,
        experience: 0,
        level: 1,
        unlockedUpgrades: 'invalid', // 無効な型
        equippedUpgrades: 'invalid', // 無効な型
        completedAchievements: null, // null
        stats: {
          enemiesDestroyed: 0,
          bossesDefeated: 0,
          maxWaveReached: 0,
          powerupsCollected: 0,
          bulletsShot: 0,
          damageDealt: 0,
          damageTaken: 0,
          playStreakDays: 1,
        },
      };

      localStorageMock.setItem(
        'space_shooter_profile',
        JSON.stringify(invalidProfile)
      );
      localStorageMock.setItem('space_shooter_profile_version', '1.0.0');

      const profile = PersistenceManager.loadProfile();

      expect(Array.isArray(profile.unlockedUpgrades)).toBe(true);
      expect(profile.unlockedUpgrades).toEqual([]);
      expect(typeof profile.equippedUpgrades).toBe('object');
      expect(profile.equippedUpgrades).toEqual({});
      expect(Array.isArray(profile.completedAchievements)).toBe(true);
      expect(profile.completedAchievements).toEqual([]);
    });
  });

  describe('バージョン管理', () => {
    it('異なるバージョンの場合は移行処理が実行される', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const oldProfile = {
        totalGamesPlayed: 5,
        coins: 100,
        level: 3,
      };

      localStorageMock.setItem(
        'space_shooter_profile',
        JSON.stringify(oldProfile)
      );
      localStorageMock.setItem('space_shooter_profile_version', '0.9.0');

      const profile = PersistenceManager.loadProfile();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('プロファイルを0.9.0から1.0.0に移行中')
      );
      expect(profile.totalGamesPlayed).toBe(5);
      expect(profile.coins).toBe(100);
      expect(profile.level).toBe(3);

      consoleSpy.mockRestore();
    });
  });

  describe('ユーティリティ機能', () => {
    it('プロファイルをリセットできる', () => {
      // まず何かデータを保存
      const profile: PlayerProfile = {
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
      PersistenceManager.saveProfile(profile);

      // リセット実行
      const resetProfile = PersistenceManager.resetProfile();

      expect(resetProfile.totalGamesPlayed).toBe(0);
      expect(resetProfile.coins).toBe(0);
      expect(resetProfile.level).toBe(1);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'space_shooter_profile'
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'space_shooter_profile_version'
      );
    });

    it('LocalStorageの使用可否を判定できる', () => {
      expect(PersistenceManager.isStorageAvailable()).toBe(true);

      // 一時的にsetItemをエラーを投げるようにオーバーライド
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage disabled');
      });

      expect(PersistenceManager.isStorageAvailable()).toBe(false);

      // モックを元に戻す
      localStorageMock.setItem.mockImplementation(originalSetItem);
    });
  });
});
