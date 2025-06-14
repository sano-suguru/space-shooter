/**
 * プレイヤーの永続的なプログレッション情報を管理するインターフェース
 * LocalStorageに保存され、ゲーム間で情報が引き継がれる
 */
export interface PlayerProfile {
  // 基本統計
  totalGamesPlayed: number;
  totalScore: number;
  highScore: number;
  totalPlayTime: number;
  lastPlayDate: string;

  // 永続通貨システム
  coins: number; // メイン通貨
  experience: number; // 経験値
  level: number; // プレイヤーレベル

  // プログレッション状態
  unlockedUpgrades: string[];
  equippedUpgrades: { [key: string]: number };
  completedAchievements: string[];

  // 詳細統計
  stats: PlayerStats;

  // ゲームモード統計
  gameModeStats?: {
    gamesPlayedByMode: { [modeId: string]: number };
    highScoresByMode: { [modeId: string]: number };
  };
}

/**
 * プレイヤーの詳細統計情報
 */
export interface PlayerStats {
  enemiesDestroyed: number;
  bossesDefeated: number;
  maxWaveReached: number;
  powerupsCollected: number;
  bulletsShot: number;
  damageDealt: number;
  damageTaken: number;
  playStreakDays: number;
}

/**
 * 単一ゲームセッションの統計（アチーブメント判定用）
 */
export interface GameSession {
  score: number;
  waveReached: number;
  enemiesDestroyed: number;
  bossesDefeated: number;
  powerupsCollected: number;
  bulletsShot: number;
  damageDealt: number;
  damageTaken: number;
  playTime: number;
  perfectWaves: number;
  startTime: number;
  endTime: number;
}
