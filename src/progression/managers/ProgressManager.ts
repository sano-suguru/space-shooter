import { ScoreManager } from '../../managers/ScoreManager';
import { EventEmitter } from '../../events/EventEmitter';
import { EventMap } from '../../events/EventType';
import { PlayerProfile, GameSession } from '../types/PlayerProfile';
import { PersistenceManager } from './PersistenceManager';

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
     * プロファイル保存
     */
    private saveProfile(): void {
        PersistenceManager.saveProfile(this.profile);
    }
}
