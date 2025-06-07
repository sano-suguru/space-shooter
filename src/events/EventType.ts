import { Bullet } from "../entities/Bullet";
import { Enemy } from "../entities/Enemy";
import { PowerUp } from "../entities/PowerUp";
import { GameStateKey } from "../managers/GameStateManager";
import { WaveConfig } from "../types";
import { GameCommandMap } from "./GameCommands";
import type { Achievement } from "../progression/types/Achievement";

// Event type constants
export const EventType = {
    ENEMY_HIT: 'enemyHit',
    PLAYER_HIT: 'playerHit', 
    BOSS_HIT: 'bossHit',
    POWERUP_COLLECTED: 'powerUpCollected'
} as const;

export type EventMap = Readonly<{
    // ゲーム状態イベント
    'enemyDestroyed': (enemy: Enemy) => void;
    'playerShot': (bulltet: Bullet) => void;
    'playerDamaged': (damage: number) => void;
    'bossDamaged': () => void;
    'bossDefeated': () => void;
    'powerUpCollected': (powerUp: PowerUp) => void;
    'scoreUpdated': (newScore: number) => void;
    'levelCompleted': (level: number) => void;
    'healthChanged': (newHealth: number) => void;
    'powerUpActivated': (type: string) => void;
    'powerUpDeactivated': (type: string) => void;
    'gameStarted': () => void;
    'gamePaused': () => void;
    'gameResumed': () => void;
    'gameOver': () => void;
    'bossSpawned': () => void;
    'levelStarted': (level: number) => void;
    'levelUpdated': (level: number) => void;
    'stateChanged': (newState: GameStateKey) => void;
    'waveStarted': (waveConfig: WaveConfig) => void;
    'waveCompleted': (waveNumber: number, bonusScore: number) => void;
    
    // プログレッションシステムイベント
    'playerLevelUp': (newLevel: number, coinsEarned: number) => void;
    'experienceGained': (amount: number, totalExperience: number) => void;
    'coinsEarned': (amount: number, totalCoins: number) => void;
    'achievementUnlocked': (achievement: Achievement) => void;
    'achievementProgress': (achievementId: string, current: number, required: number) => void;
    'upgradeApplied': (upgradeId: string, newLevel: number) => void;
    'profileUpdated': () => void;
}> & GameCommandMap;
