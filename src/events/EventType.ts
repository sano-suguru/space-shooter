import { Bullet } from '../entities/Bullet';
import { DroppedWeapon } from '../entities/DroppedWeapon';
import { Enemy } from '../entities/Enemy';
import { PowerUp } from '../entities/PowerUp';
import { GameStateKey } from '../managers/GameStateManager';
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
  mobileJoystickStart: () => void;
  mobileJoystickEnd: () => void;

  // 武器システムイベント
  weaponSwitched: (data: {
    weaponId: string;
    slot: number;
    weaponName: string;
  }) => void;
  weaponPurchased: (data: { weaponId: string; cost: number }) => void;
  weaponEquipped: (data: { weaponId: string; slot: number }) => void;
  weaponUnequipped: (data: { weaponId: string; slot: number }) => void;
  weaponFound: (data: {
    droppedWeapon: DroppedWeapon;
    playerPosition: { x: number; y: number };
  }) => void;
  weaponSelectionStarted: (data: {
    availableWeapons: DroppedWeapon[];
    playerPosition: { x: number; y: number };
  }) => void;
  weaponSelectionCompleted: (data: {
    selectedWeaponIndex: number;
    selectedWeapon: DroppedWeapon;
  }) => void;
}> &
  GameCommandMap;
