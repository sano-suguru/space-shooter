/**
 * GameModeManager handles game mode selection, unlocking, and statistics
 */

import { EventEmitter } from '../../events/EventEmitter.js';
import { EventMap } from '../../events/EventType.js';
import { GameMode, GameModeModifiers, GameModeStats, GameModeUnlockStatus } from '../types/GameMode.js';
import { PlayerProfile } from '../types/PlayerProfile.js';
import { 
    GAME_MODES, 
    getGameModeById, 
    getUnlockedGameModes, 
    getLockedGameModes, 
    isGameModeUnlocked,
    getGameModeUnlockRequirement,
    getDefaultGameMode,
    DEFAULT_GAME_MODE_CONFIG
} from '../data/gameModes';

/**
 * Manages game modes, their unlock status, and related statistics
 */
export class GameModeManager {
    private eventEmitter: EventEmitter<EventMap>;
    private currentGameMode: GameMode;
    private playerProfile: PlayerProfile;
    
    constructor(eventEmitter: EventEmitter<EventMap>, playerProfile: PlayerProfile) {
        this.eventEmitter = eventEmitter;
        this.playerProfile = playerProfile;
        
        // Initialize with default or last selected game mode
        const lastSelectedMode = this.getLastSelectedGameMode();
        this.currentGameMode = lastSelectedMode || getDefaultGameMode();
        
        // Ensure the selected mode is unlocked, fallback to default if not
        if (!this.isCurrentModeUnlocked()) {
            this.currentGameMode = getDefaultGameMode();
        }
    }

    /**
     * Update the player profile reference
     */
    updatePlayerProfile(profile: PlayerProfile): void {
        const previousProfile = this.playerProfile;
        this.playerProfile = profile;
        
        // Check for newly unlocked game modes
        this.checkForNewlyUnlockedModes(previousProfile);
    }

    /**
     * Get the currently selected game mode
     */
    getCurrentGameMode(): GameMode {
        return this.currentGameMode;
    }

    /**
     * Get current game mode modifiers
     */
    getCurrentModifiers(): GameModeModifiers {
        return this.currentGameMode.modifiers;
    }

    /**
     * Select a new game mode
     */
    selectGameMode(modeId: string): boolean {
        const newMode = getGameModeById(modeId);
        
        if (!newMode) {
            console.warn(`Game mode with id '${modeId}' not found`);
            return false;
        }

        if (!newMode.unlockCondition(this.playerProfile)) {
            console.warn(`Game mode '${modeId}' is locked`);
            return false;
        }

        const previousMode = this.currentGameMode;
        this.currentGameMode = newMode;
        
        // Always save selection if configured to remember
        if (DEFAULT_GAME_MODE_CONFIG.rememberLastSelection) {
            this.saveLastSelectedGameMode(modeId);
        }

        // Emit game mode change event only if mode actually changed
        if (previousMode.id !== newMode.id) {
            this.eventEmitter.emit('gameModeChanged', newMode, previousMode);
        }
        
        return true;
    }

    /**
     * Get all available game modes
     */
    getAllGameModes(): GameMode[] {
        return [...GAME_MODES];
    }

    /**
     * Get all unlocked game modes
     */
    getUnlockedGameModes(): GameMode[] {
        return getUnlockedGameModes(this.playerProfile);
    }

    /**
     * Get all locked game modes
     */
    getLockedGameModes(): GameMode[] {
        return getLockedGameModes(this.playerProfile);
    }

    /**
     * Check if a specific game mode is unlocked
     */
    isGameModeUnlocked(modeId: string): boolean {
        return isGameModeUnlocked(modeId, this.playerProfile);
    }

    /**
     * Get unlock status for all game modes
     */
    getGameModeUnlockStatuses(): GameModeUnlockStatus[] {
        return GAME_MODES.map(mode => ({
            mode,
            isUnlocked: mode.unlockCondition(this.playerProfile),
            unlockRequirement: mode.unlockCondition(this.playerProfile) 
                ? undefined 
                : getGameModeUnlockRequirement(mode.id)
        }));
    }

    /**
     * Get game mode statistics
     */
    getGameModeStats(): GameModeStats {
        const unlockedModes = this.getUnlockedGameModes();
        
        return {
            totalModes: GAME_MODES.length,
            unlockedModes: unlockedModes.length,
            currentMode: this.currentGameMode,
            gamesPlayedByMode: this.getGamesPlayedByMode(),
            highScoresByMode: this.getHighScoresByMode()
        };
    }

    /**
     * Record a game completion for the current mode
     */
    recordGameCompletion(score: number): void {
        const modeId = this.currentGameMode.id;
        
        // Update games played count
        if (!this.playerProfile.gameModeStats) {
            this.playerProfile.gameModeStats = {
                gamesPlayedByMode: {},
                highScoresByMode: {}
            };
        }

        if (!this.playerProfile.gameModeStats.gamesPlayedByMode[modeId]) {
            this.playerProfile.gameModeStats.gamesPlayedByMode[modeId] = 0;
        }
        
        if (!this.playerProfile.gameModeStats.highScoresByMode[modeId]) {
            this.playerProfile.gameModeStats.highScoresByMode[modeId] = 0;
        }

        this.playerProfile.gameModeStats.gamesPlayedByMode[modeId]++;
        
        // Update high score if necessary
        if (score > this.playerProfile.gameModeStats.highScoresByMode[modeId]) {
            this.playerProfile.gameModeStats.highScoresByMode[modeId] = score;
            this.eventEmitter.emit('gameModeHighScore', this.currentGameMode, score);
        }
    }

    /**
     * Apply game mode modifiers to base values
     */
    applyModifiers<T extends Record<string, number>>(baseValues: T): T {
        const modifiers = this.currentGameMode.modifiers;
        const result = { ...baseValues } as T;

        // Apply specific modifier mappings using type-safe property access
        if ('enemySpeed' in result && typeof result['enemySpeed'] === 'number') {
            (result as any).enemySpeed *= modifiers.enemySpeedMultiplier;
        }
        
        if ('enemyHealth' in result && typeof result['enemyHealth'] === 'number') {
            (result as any).enemyHealth *= modifiers.enemyHealthMultiplier;
        }
        
        if ('spawnRate' in result && typeof result['spawnRate'] === 'number') {
            (result as any).spawnRate *= modifiers.enemySpawnRateMultiplier;
        }

        return result;
    }

    /**
     * Calculate reward with game mode multipliers
     */
    calculateReward(baseReward: { score?: number; coins?: number; experience?: number }): typeof baseReward {
        const modifiers = this.currentGameMode.modifiers;
        
        return {
            score: baseReward.score ? Math.floor(baseReward.score * modifiers.scoreMultiplier) : baseReward.score,
            coins: baseReward.coins ? Math.floor(baseReward.coins * modifiers.coinMultiplier) : baseReward.coins,
            experience: baseReward.experience ? Math.floor(baseReward.experience * modifiers.experienceMultiplier) : baseReward.experience
        };
    }

    /**
     * Check if current mode is unlocked
     */
    private isCurrentModeUnlocked(): boolean {
        return this.currentGameMode.unlockCondition(this.playerProfile);
    }

    /**
     * Check for newly unlocked game modes
     */
    private checkForNewlyUnlockedModes(previousProfile: PlayerProfile): void {
        const previouslyUnlocked = getUnlockedGameModes(previousProfile);
        const currentlyUnlocked = getUnlockedGameModes(this.playerProfile);
        
        // Find newly unlocked modes
        const newlyUnlocked = currentlyUnlocked.filter(
            mode => !previouslyUnlocked.some(prevMode => prevMode.id === mode.id)
        );

        // Emit events for newly unlocked modes
        newlyUnlocked.forEach(mode => {
            this.eventEmitter.emit('gameModeUnlocked', mode);
        });
    }

    /**
     * Get games played by mode
     */
    private getGamesPlayedByMode(): { [modeId: string]: number } {
        return this.playerProfile.gameModeStats?.gamesPlayedByMode || {};
    }

    /**
     * Get high scores by mode
     */
    private getHighScoresByMode(): { [modeId: string]: number } {
        return this.playerProfile.gameModeStats?.highScoresByMode || {};
    }

    /**
     * Save the last selected game mode
     */
    private saveLastSelectedGameMode(modeId: string): void {
        try {
            localStorage.setItem('lastSelectedGameMode', modeId);
        } catch (error) {
            console.warn('Failed to save last selected game mode:', error);
        }
    }

    /**
     * Get the last selected game mode
     */
    private getLastSelectedGameMode(): GameMode | null {
        try {
            const lastModeId = localStorage.getItem('lastSelectedGameMode');
            return lastModeId ? getGameModeById(lastModeId) || null : null;
        } catch (error) {
            console.warn('Failed to load last selected game mode:', error);
            return null;
        }
    }
}
