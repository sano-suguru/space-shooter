import { PlayerProfile, PlayerStats } from '../types/PlayerProfile';

/**
 * プレイヤープロファイルの永続化を管理するクラス
 * LocalStorageを使用してゲーム間でデータを引き継ぐ
 */
export class PersistenceManager {
  private static readonly STORAGE_KEY = 'space_shooter_profile';
  private static readonly VERSION_KEY = 'space_shooter_profile_version';
  private static readonly CURRENT_VERSION = '1.0.0';

  /**
   * プレイヤープロファイルをLocalStorageに保存
   */
  static saveProfile(profile: PlayerProfile): void {
    try {
      const profileData = JSON.stringify(profile);
      localStorage.setItem(this.STORAGE_KEY, profileData);
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
    } catch (error) {
      console.warn('プレイヤープロファイルの保存に失敗しました:', error);
    }
  }

  /**
   * LocalStorageからプレイヤープロファイルを読み込み
   * データが存在しない場合はデフォルトプロファイルを返す
   */
  static loadProfile(): PlayerProfile {
    try {
      const savedProfile = localStorage.getItem(this.STORAGE_KEY);
      const savedVersion = localStorage.getItem(this.VERSION_KEY);

      if (!savedProfile) {
        return this.createDefaultProfile();
      }

      const profile = JSON.parse(savedProfile) as PlayerProfile;

      // バージョンチェック（将来的なマイグレーション用）
      if (savedVersion !== this.CURRENT_VERSION) {
        return this.migrateProfile(profile, savedVersion);
      }

      // プロファイルの整合性チェック
      return this.validateProfile(profile);
    } catch (error) {
      console.warn('プレイヤープロファイルの読み込みに失敗しました:', error);
      return this.createDefaultProfile();
    }
  }

  /**
   * デフォルトのプレイヤープロファイルを作成
   */
  private static createDefaultProfile(): PlayerProfile {
    return {
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
      stats: this.createDefaultStats(),
    };
  }

  /**
   * デフォルトのプレイヤー統計を作成
   */
  private static createDefaultStats(): PlayerStats {
    return {
      enemiesDestroyed: 0,
      bossesDefeated: 0,
      maxWaveReached: 0,
      powerupsCollected: 0,
      bulletsShot: 0,
      damageDealt: 0,
      damageTaken: 0,
      playStreakDays: 1,
    };
  }

  /**
   * プロファイルの整合性を検証し、不足フィールドを補完
   */
  private static validateProfile(profile: PlayerProfile): PlayerProfile {
    const defaultProfile = this.createDefaultProfile();

    // 基本フィールドの補完
    const validatedProfile: PlayerProfile = {
      totalGamesPlayed:
        profile.totalGamesPlayed ?? defaultProfile.totalGamesPlayed,
      totalScore: profile.totalScore ?? defaultProfile.totalScore,
      highScore: profile.highScore ?? defaultProfile.highScore,
      totalPlayTime: profile.totalPlayTime ?? defaultProfile.totalPlayTime,
      lastPlayDate: profile.lastPlayDate ?? defaultProfile.lastPlayDate,
      coins: Math.max(0, profile.coins ?? defaultProfile.coins),
      experience: Math.max(0, profile.experience ?? defaultProfile.experience),
      level: Math.max(1, profile.level ?? defaultProfile.level),
      unlockedUpgrades: Array.isArray(profile.unlockedUpgrades)
        ? profile.unlockedUpgrades
        : [],
      equippedUpgrades:
        profile.equippedUpgrades && typeof profile.equippedUpgrades === 'object'
          ? profile.equippedUpgrades
          : {},
      completedAchievements: Array.isArray(profile.completedAchievements)
        ? profile.completedAchievements
        : [],
      stats: this.validateStats(profile.stats),
    };

    return validatedProfile;
  }

  /**
   * 統計データの整合性を検証
   */
  private static validateStats(stats: PlayerStats | undefined): PlayerStats {
    const defaultStats = this.createDefaultStats();

    if (!stats || typeof stats !== 'object') {
      return defaultStats;
    }

    return {
      enemiesDestroyed: Math.max(
        0,
        stats.enemiesDestroyed ?? defaultStats.enemiesDestroyed
      ),
      bossesDefeated: Math.max(
        0,
        stats.bossesDefeated ?? defaultStats.bossesDefeated
      ),
      maxWaveReached: Math.max(
        0,
        stats.maxWaveReached ?? defaultStats.maxWaveReached
      ),
      powerupsCollected: Math.max(
        0,
        stats.powerupsCollected ?? defaultStats.powerupsCollected
      ),
      bulletsShot: Math.max(0, stats.bulletsShot ?? defaultStats.bulletsShot),
      damageDealt: Math.max(0, stats.damageDealt ?? defaultStats.damageDealt),
      damageTaken: Math.max(0, stats.damageTaken ?? defaultStats.damageTaken),
      playStreakDays: Math.max(
        1,
        stats.playStreakDays ?? defaultStats.playStreakDays
      ),
    };
  }

  /**
   * 旧バージョンからの移行処理（将来的な拡張用）
   */
  private static migrateProfile(
    profile: PlayerProfile,
    oldVersion: string | null
  ): PlayerProfile {
    console.log(
      `プロファイルを${oldVersion}から${this.CURRENT_VERSION}に移行中...`
    );

    // 現在はvalidateProfileで十分だが、将来的なバージョンアップ時に使用
    const migratedProfile = this.validateProfile(profile);

    // 移行後は新しいバージョンとして保存
    this.saveProfile(migratedProfile);

    return migratedProfile;
  }

  /**
   * プロファイルをリセット（デバッグ用）
   */
  static resetProfile(): PlayerProfile {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.VERSION_KEY);
    return this.createDefaultProfile();
  }

  /**
   * LocalStorageの使用可能性をチェック
   */
  static isStorageAvailable(): boolean {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (_error) {
      return false;
    }
  }
}
