import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { PowerUp } from '../entities/PowerUp';
import { GameStateKey } from '../managers/GameStateManager';
import type { Achievement } from '../progression/types/Achievement';
import type { GameMode } from '../progression/types/GameMode';
import type { DynamicEnemyConfig } from '../systems/types/EnemyGeneration';
import { WaveConfig } from '../types';

import { GameCommandMap } from './GameCommands';

// Event type constants
export const EventType = {
  ENEMY_HIT: 'enemyHit',
  PLAYER_HIT: 'playerHit',
  BOSS_HIT: 'bossHit',
  POWERUP_COLLECTED: 'powerUpCollected',
} as const;

export type EventMap = Readonly<{
  // ゲーム状態イベント
  enemyDestroyed: (enemy: Enemy) => void;
  playerShot: (bulltet: Bullet) => void;
  playerDamaged: (damage: number) => void;
  bossDamaged: () => void;
  bossDefeated: () => void;
  powerUpCollected: (powerUp: PowerUp) => void;
  scoreUpdated: (newScore: number) => void;
  levelCompleted: (level: number) => void;
  healthChanged: (newHealth: number) => void;
  powerUpActivated: (type: string) => void;
  powerUpDeactivated: (type: string) => void;
  gameStarted: () => void;
  gamePaused: () => void;
  gameResumed: () => void;
  gameOver: () => void;
  bossSpawned: () => void;
  levelStarted: (level: number) => void;
  levelUpdated: (level: number) => void;
  stateChanged: (newState: GameStateKey) => void;
  waveStarted: (waveConfig: WaveConfig) => void;
  waveCompleted: (waveNumber: number, bonusScore: number) => void;

  // プログレッションシステムイベント
  playerLevelUp: (newLevel: number, coinsEarned: number) => void;
  experienceGained: (amount: number, totalExperience: number) => void;
  coinsEarned: (amount: number, totalCoins: number) => void;
  achievementUnlocked: (achievement: Achievement) => void;
  achievementProgress: (
    achievementId: string,
    current: number,
    required: number
  ) => void;
  upgradeApplied: (upgradeId: string, newLevel: number) => void;
  profileUpdated: () => void;

  // ゲームモードシステムイベント
  gameModeChanged: (newMode: GameMode, previousMode: GameMode) => void;
  gameModeUnlocked: (gameMode: GameMode) => void;
  gameModeHighScore: (gameMode: GameMode, score: number) => void;

  // 敵生成システムイベント
  dynamicEnemyGenerated: (enemy: DynamicEnemyConfig) => void;
  enemyBatchGenerated: (
    enemies: DynamicEnemyConfig[],
    stats: {
      totalCount: number;
      typeDistribution: Record<string, number>;
      eliteCount: number;
      averagePower: number;
      flockCount: number;
      specialAbilityCount: number;
      difficultyLevel: string;
    }
  ) => void;
  flockDestroyed: (flockId: string) => void;
  enemyGenerationSystemReset: () => void;

  // モバイルタッチイベント
  mobileShootStart: () => void;
  mobileShootEnd: () => void;
  mobileSpecialStart: () => void;
  mobileSpecialEnd: () => void;
  mobileJoystickMove: (movement: { x: number; y: number }) => void;
}> &
  GameCommandMap;
