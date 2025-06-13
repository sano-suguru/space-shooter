import { ScoreManager } from '../../managers/ScoreManager';
import { EventEmitter } from '../../events/EventEmitter';
import { EventMap } from '../../events/EventType';
import { PlayerProfile, GameSession } from '../types/PlayerProfile';
import { PersistenceManager } from './PersistenceManager';
import { DifficultyFactors } from '../../systems/types/EnemyGeneration';

/**
 * シンプルなプログレッションシステム管理クラス
 */
export class ProgressManager {
    private profile: PlayerProfile;
    private currentSession: GameSession;
    private eventEmitter: EventEmitter<EventMap>;
    private scoreManager: ScoreManager;

    constructor(eventEmitter: EventEmitter<EventMap>, scoreManager?: ScoreManager) {
        this.eventEmitter = eventEmitter;
        this.scoreManager = scoreManager || new ScoreManager(eventEmitter);
        this.profile = PersistenceManager.loadProfile();
        this.currentSession = this.initializeSession();
        this.setupEventListeners();
    }

    public getScore(): number {
        return this.scoreManager.getScore();
    }

    public addScore(points: number): void {
        this.scoreManager.addScore(points);
        this.updateProgression(points);
    }

    private updateProgression(points: number): void {
        // シンプルなコイン獲得
        const coinsEarned = Math.floor(points * 0.1);
        this.profile.coins += coinsEarned;

        // シンプルな経験値獲得
        const experienceEarned = Math.floor(points * 0.05);
        this.profile.experience += experienceEarned;

        // シンプルなレベル計算
        const newLevel = Math.floor(this.profile.experience / 100) + 1;
        if (newLevel > this.profile.level) {
            this.profile.level = newLevel;
            this.eventEmitter.emit('playerLevelUp', newLevel, newLevel * 100);
        }

        this.currentSession.score = this.getScore();
        this.saveProfile();
    }

    updateSessionStats(statType: keyof GameSession, value: number): void {
        // シンプルな統計更新
        switch (statType) {
            case 'enemiesDestroyed':
                this.currentSession.enemiesDestroyed += value;
                this.profile.stats.enemiesDestroyed += value;
                break;
            case 'bossesDefeated':
                this.currentSession.bossesDefeated += value;
                this.profile.stats.bossesDefeated += value;
                this.profile.coins += 50; // 固定ボーナス
                break;
            case 'powerupsCollected':
                this.currentSession.powerupsCollected += value;
                this.profile.stats.powerupsCollected += value;
                break;
        }
        this.saveProfile();
    }

    /**
     * ゲーム開始時の処理
     */
    startGame(): void {
        this.currentSession = this.initializeSession();
        this.eventEmitter.emit('gameStarted');
    }

    endGame(): void {
        this.currentSession.endTime = Date.now();
        this.currentSession.playTime = this.currentSession.endTime - this.currentSession.startTime;

        this.profile.totalGamesPlayed++;
        this.profile.totalScore += this.getScore();
        this.profile.totalPlayTime += this.currentSession.playTime;
        this.profile.lastPlayDate = new Date().toISOString();

        if (this.getScore() > this.profile.highScore) {
            this.profile.highScore = this.getScore();
        }

        this.saveProfile();
        this.eventEmitter.emit('gameOver');
    }

    /**
     * セッションの初期化
     */
    private initializeSession(): GameSession {
        return {
            score: 0,
            waveReached: 0,
            enemiesDestroyed: 0,
            bossesDefeated: 0,
            powerupsCollected: 0,
            bulletsShot: 0,
            damageDealt: 0,
            damageTaken: 0,
            playTime: 0,
            perfectWaves: 0,
            startTime: Date.now(),
            endTime: 0
        };
    }

    /**
     * イベントリスナーの設定
     */
    private setupEventListeners(): void {
        this.eventEmitter.on('enemyDestroyed', () => {
            this.updateSessionStats('enemiesDestroyed', 1);
        });

        this.eventEmitter.on('bossDefeated', () => {
            this.updateSessionStats('bossesDefeated', 1);
        });

        this.eventEmitter.on('powerUpCollected', () => {
            this.updateSessionStats('powerupsCollected', 1);
        });
    }

    // 基本的なゲッター関数群
    getProfile(): PlayerProfile {
        return { ...this.profile };
    }

    getCurrentSession(): GameSession {
        return { ...this.currentSession };
    }

    getCoins(): number {
        return this.profile.coins;
    }

    getLevel(): number {
        return this.profile.level;
    }

    getExperience(): number {
        return this.profile.experience;
    }

    addCoins(amount: number): void {
        this.profile.coins += amount;
        this.eventEmitter.emit('coinsEarned', amount, this.profile.coins);
        this.saveProfile();
    }

    spendCoins(amount: number): boolean {
        if (this.profile.coins >= amount) {
            this.profile.coins -= amount;
            this.saveProfile();
            return true;
        }
        return false;
    }

    resetProfile(): void {
        this.profile = PersistenceManager.resetProfile();
        console.log('プレイヤープロファイルをリセットしました');
    }

    /**
     * 動的敵生成用の難易度ファクターを計算
     */
    public calculateDifficultyFactors(currentWave: number): DifficultyFactors {
        const playerLevel = this.profile.level;
        const baseMultiplier = 1.0;
        
        // プレイヤーレベルに基づくスケーリング（レベル10で2倍の難易度）
        const levelScaling = Math.min(0.1 * (playerLevel - 1), 1.0);
        
        // ウェーブに基づくスケーリング（ウェーブ20で2倍の難易度）
        const waveScaling = Math.min(0.05 * (currentWave - 1), 1.0);

        return {
            playerLevel,
            currentWave,
            baseMultiplier,
            levelScaling,
            waveScaling
        };
    }

    /**
     * プレイヤーの熟練度に基づく敵生成の推奨設定を取得
     */
    public getEnemyGenerationRecommendations(): {
        shouldUseEliteEnemies: boolean;
        eliteSpawnChance: number;
        recommendedFlockSize: number;
        difficultyMultiplier: number;
    } {
        const level = this.profile.level;
        const gamesPlayed = this.profile.totalGamesPlayed;

        // 熟練度の計算
        const skillLevel = Math.min(level + Math.floor(gamesPlayed / 10), 50);
        
        return {
            shouldUseEliteEnemies: level >= 3,
            eliteSpawnChance: Math.min(0.05 + (level - 3) * 0.02, 0.25), // 5%から最大25%
            recommendedFlockSize: Math.min(3 + Math.floor(level / 5), 8), // 3から最大8
            difficultyMultiplier: 1.0 + (skillLevel * 0.02) // スキルレベルに応じて最大2倍
        };
    }

    /**
     * 動的敵生成システム用のプレイヤー統計を取得
     */
    public getPlayerStatsForEnemyGeneration(): {
        level: number;
        experience: number;
        averageWaveReached: number;
        preferredDifficulty: 'easy' | 'normal' | 'hard';
        recentPerformance: 'improving' | 'stable' | 'declining';
    } {
        const recentGames = Math.min(this.profile.totalGamesPlayed, 5);
        const averageWave = recentGames > 0 ?
            this.currentSession.waveReached / recentGames : 1;

        // 最近のパフォーマンス評価（簡略化）
        let recentPerformance: 'improving' | 'stable' | 'declining' = 'stable';
        if (this.profile.totalGamesPlayed >= 3) {
            const currentScore = this.getScore();
            const averageScore = this.profile.totalScore / this.profile.totalGamesPlayed;
            
            if (currentScore > averageScore * 1.2) {
                recentPerformance = 'improving';
            } else if (currentScore < averageScore * 0.8) {
                recentPerformance = 'declining';
            }
        }

        // 推奨難易度の計算
        let preferredDifficulty: 'easy' | 'normal' | 'hard' = 'normal';
        if (this.profile.level < 3 || recentPerformance === 'declining') {
            preferredDifficulty = 'easy';
        } else if (this.profile.level > 10 && recentPerformance === 'improving') {
            preferredDifficulty = 'hard';
        }

        return {
            level: this.profile.level,
            experience: this.profile.experience,
            averageWaveReached: averageWave,
            preferredDifficulty,
            recentPerformance
        };
    }

    /**
     * ウェーブ到達時の処理（動的敵生成システム用）
     */
    public updateWaveReached(waveNumber: number): void {
        if (waveNumber > this.currentSession.waveReached) {
            this.currentSession.waveReached = waveNumber;
            
            // ウェーブ到達ボーナス
            const waveBonus = waveNumber * 10;
            this.addScore(waveBonus);
            
            console.log(`Wave ${waveNumber} reached! Bonus: ${waveBonus} points`);
        }
    }

    /**
     * 動的敵撃破時の処理
     */
    public handleDynamicEnemyDestroyed(isElite: boolean, threatLevel: number): void {
        // 基本スコア
        let baseScore = 100;
        
        // エリート敵の場合はボーナス
        if (isElite) {
            baseScore *= 2;
            this.profile.coins += 5; // エリート敵ボーナスコイン
        }
        
        // 脅威レベルに基づくスコア調整
        const threatBonus = Math.floor(baseScore * (threatLevel - 1) * 0.5);
        
        this.addScore(baseScore + threatBonus);
        this.updateSessionStats('enemiesDestroyed', 1);
        
        // 特別な実績チェック（エリート敵撃破など）
        if (isElite) {
            console.log(`Elite enemy defeated! Bonus: ${baseScore + threatBonus} points, 5 coins`);
        }
    }

    /**
     * プロファイル保存
     */
    private saveProfile(): void {
        PersistenceManager.saveProfile(this.profile);
    }
}
