/**
 * GameMode types and interfaces for the progression system
 */

import { PlayerProfile } from './PlayerProfile.js';

/**
 * Game mode modifiers that affect gameplay mechanics
 */
export interface GameModeModifiers {
    /** Multiplier for enemy movement speed */
    enemySpeedMultiplier: number;
    
    /** Multiplier for enemy health points */
    enemyHealthMultiplier: number;
    
    /** Multiplier for enemy spawn rate */
    enemySpawnRateMultiplier: number;
    
    /** Multiplier for score calculation */
    scoreMultiplier: number;
    
    /** Multiplier for coin rewards */
    coinMultiplier: number;
    
    /** Multiplier for experience rewards */
    experienceMultiplier: number;
}

/**
 * Represents a game mode with specific rules and modifiers
 */
export interface GameMode {
    /** Unique identifier for the game mode */
    id: string;
    
    /** Display name for the game mode */
    name: string;
    
    /** Detailed description of the game mode */
    description: string;
    
    /** Condition that must be met to unlock this game mode */
    unlockCondition: (profile: PlayerProfile) => boolean;
    
    /** Gameplay modifiers applied in this mode */
    modifiers: GameModeModifiers;
    
    /** Optional special rules that apply to this mode */
    specialRules?: string[];
    
    /** Overall reward multiplier for this mode */
    rewardMultiplier: number;
    
    /** Whether this mode is currently locked */
    isLocked?: boolean;
}

/**
 * Result of checking game mode unlock status
 */
export interface GameModeUnlockStatus {
    /** The game mode being checked */
    mode: GameMode;
    
    /** Whether the mode is currently unlocked */
    isUnlocked: boolean;
    
    /** Description of what needs to be achieved to unlock (if locked) */
    unlockRequirement?: string;
}

/**
 * Statistics about game modes
 */
export interface GameModeStats {
    /** Total number of available game modes */
    totalModes: number;
    
    /** Number of unlocked game modes */
    unlockedModes: number;
    
    /** Currently selected game mode */
    currentMode: GameMode;
    
    /** Games played in each mode */
    gamesPlayedByMode: { [modeId: string]: number };
    
    /** High scores achieved in each mode */
    highScoresByMode: { [modeId: string]: number };
}

/**
 * Configuration for game mode selection
 */
export interface GameModeConfig {
    /** Default game mode ID */
    defaultMode: string;
    
    /** Whether to remember the last selected mode */
    rememberLastSelection: boolean;
}
