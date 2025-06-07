import { ScoreManager } from '../../managers/ScoreManager';
import { EventEmitter } from '../../events/EventEmitter';
import { EventMap } from '../../events/EventType';
import { PlayerProfile, GameSession } from '../types/PlayerProfile';
import { PersistenceManager } from './PersistenceManager';
import { UpgradeManager } from './UpgradeManager';
import { AchievementManager } from './AchievementManager';
import { GameModeManager } from './GameModeManager';
import type { Achievement } from '../types/Achievement';
import type { GameMode, GameModeModifiers } from '../types/GameMode';

/**
 * プログレッションシステムの中核を管理するクラス
 * ScoreManagerを拡張し、既存機能を完全保持しつつプログレッション機能を追加
 */
export class ProgressManager extends ScoreManager {
    private profile: PlayerProfile;
    private currentSession: GameSession;
    private sessionStartTime: number;
    private upgradeManager: UpgradeManager;
    private achievementManager: AchievementManager;
    private gameModeManager: GameModeManager;

    // レベルアップ計算用定数
    private static readonly BASE_EXP_REQUIREMENT = 100;
    private static readonly EXP_MULTIPLIER = 1.5;
    
    // コイン獲得計算用定数
    private static readonly SCORE_TO_COINS_RATIO = 0.1;
    private static readonly WAVE_BONUS_COINS = 10;
    private static readonly BOSS_BONUS_COINS = 50;

    constructor(eventEmitter: EventEmitter<EventMap>) {
        super(eventEmitter);
        
        // プロファイル読み込み
        this.profile = PersistenceManager.loadProfile();
        
        // アップグレードマネージャー初期化
        this.upgradeManager = new UpgradeManager(eventEmitter, this.profile);
        
        // アチーブメントマネージャー初期化
        this.achievementManager = new AchievementManager(
            this.profile,
            (updatedProfile) => {
                this.profile = updatedProfile;
                this.saveProfile();
            },
            (achievement) => {
                this.eventEmitter.emit('achievementUnlocked', achievement);
                console.log(`🏆 アチーブメント達成: ${achievement.name}`);
            }
        );
        
        // ゲームモードマネージャー初期化
        this.gameModeManager = new GameModeManager(eventEmitter, this.profile);
        
        // セッション初期化
        this.sessionStartTime = Date.now();
        this.currentSession = this.initializeSession();
        
        // レベルアップ通知の設定
        this.setupEventListeners();
    }

    /**
     * 既存のaddScore機能を拡張してプログレッション要素を追加
     */
    addScore(points: number): void {
        // 基本のスコア更新（親クラスの機能）
        super.addScore(points);
        
        // プログレッション要素の更新
        this.updateProgression(points);
    }

    /**
     * プログレッション関連の更新処理
     */
    private updateProgression(points: number): void {
        const prevLevel = this.profile.level;
        
        // ゲームモード報酬の適用
        const baseReward = {
            coins: Math.floor(points * ProgressManager.SCORE_TO_COINS_RATIO),
            experience: Math.floor(points * 0.05)
        };
        
        const modifiedReward = this.gameModeManager.calculateReward(baseReward);
        
        // コイン獲得計算（ゲームモード修正後）
        const coinsEarned = modifiedReward.coins || 0;
        this.profile.coins += coinsEarned;
        
        // 経験値獲得計算（ゲームモード修正後）
        const experienceEarned = modifiedReward.experience || 0;
        this.profile.experience += experienceEarned;
        
        // セッション統計の更新
        this.currentSession.score = this.getScore();
        
        // イベント発行
        if (coinsEarned > 0) {
            this.eventEmitter.emit('coinsEarned', coinsEarned, this.profile.coins);
        }
        
        if (experienceEarned > 0) {
            this.eventEmitter.emit('experienceGained', experienceEarned, this.profile.experience);
        }
        
        // レベルアップチェック
        const newLevel = this.calculateLevel(this.profile.experience);
        if (newLevel > prevLevel) {
            this.handleLevelUp(prevLevel, newLevel);
        }
        
        // プロファイル保存
        this.saveProfile();
    }


    /**
     * 経験値からレベルを計算
     */
    private calculateLevel(experience: number): number {
        if (experience < ProgressManager.BASE_EXP_REQUIREMENT) {
            return 1;
        }
        
        let level = 1;
        let totalExpRequired = 0;
        
        while (totalExpRequired <= experience) {
            const expForNextLevel = Math.floor(
                ProgressManager.BASE_EXP_REQUIREMENT * Math.pow(ProgressManager.EXP_MULTIPLIER, level - 1)
            );
            totalExpRequired += expForNextLevel;
            
            if (totalExpRequired <= experience) {
                level++;
            }
        }
        
        return level;
    }

    /**
     * 次のレベルまでに必要な経験値を計算
     */
    getExperienceToNextLevel(): number {
        const currentLevel = this.profile.level;
        const currentExp = this.profile.experience;
        
        // 次のレベルに必要な経験値
        const expForNextLevel = Math.floor(
            ProgressManager.BASE_EXP_REQUIREMENT * Math.pow(ProgressManager.EXP_MULTIPLIER, currentLevel - 1)
        );
        
        // 現在のレベルまでに必要だった総経験値を計算
        let totalExpForCurrentLevel = 0;
        for (let i = 1; i < currentLevel; i++) {
            totalExpForCurrentLevel += Math.floor(
                ProgressManager.BASE_EXP_REQUIREMENT * Math.pow(ProgressManager.EXP_MULTIPLIER, i - 1)
            );
        }
        
        // 次のレベルまでに必要な総経験値
        const totalExpForNextLevel = totalExpForCurrentLevel + expForNextLevel;
        
        return totalExpForNextLevel - currentExp;
    }

    /**
     * セッション統計を更新
     */
    updateSessionStats(statType: keyof GameSession, value: number): void {
        switch (statType) {
            case 'enemiesDestroyed':
                this.currentSession.enemiesDestroyed += value;
                this.profile.stats.enemiesDestroyed += value;
                break;
            case 'bossesDefeated':
                this.currentSession.bossesDefeated += value;
                this.profile.stats.bossesDefeated += value;
                // ボス撃破ボーナス（ゲームモード修正適用）
                const bossBonus = this.gameModeManager.calculateReward({ coins: ProgressManager.BOSS_BONUS_COINS });
                const bonusCoins = bossBonus.coins || 0;
                this.profile.coins += bonusCoins;
                this.eventEmitter.emit('coinsEarned', bonusCoins, this.profile.coins);
                break;
            case 'powerupsCollected':
                this.currentSession.powerupsCollected += value;
                this.profile.stats.powerupsCollected += value;
                break;
            case 'bulletsShot':
                this.currentSession.bulletsShot += value;
                this.profile.stats.bulletsShot += value;
                break;
            case 'damageDealt':
                this.currentSession.damageDealt += value;
                this.profile.stats.damageDealt += value;
                break;
            case 'damageTaken':
                this.currentSession.damageTaken += value;
                this.profile.stats.damageTaken += value;
                break;
            case 'waveReached':
                this.currentSession.waveReached = Math.max(this.currentSession.waveReached, value);
                this.profile.stats.maxWaveReached = Math.max(this.profile.stats.maxWaveReached, value);
                // ウェーブクリアボーナス（ゲームモード修正適用）
                if (value > 1) {
                    const waveBonus = this.gameModeManager.calculateReward({ coins: ProgressManager.WAVE_BONUS_COINS });
                    const bonusCoins = waveBonus.coins || 0;
                    this.profile.coins += bonusCoins;
                    this.eventEmitter.emit('coinsEarned', bonusCoins, this.profile.coins);
                }
                break;
        }
        
        this.saveProfile();
    }

    /**
     * ゲーム開始時の処理
     */
    startGame(): void {
        this.sessionStartTime = Date.now();
        this.currentSession = this.initializeSession();
        this.eventEmitter.emit('gameStarted');
    }

    /**
     * ゲーム終了時の処理
     */
    endGame(): void {
        this.currentSession.endTime = Date.now();
        this.currentSession.playTime = this.currentSession.endTime - this.currentSession.startTime;
        
        // プロファイルの基本統計を更新
        this.profile.totalGamesPlayed++;
        this.profile.totalScore += this.getScore();
        this.profile.totalPlayTime += this.currentSession.playTime;
        this.profile.lastPlayDate = new Date().toISOString();
        
        if (this.getScore() > this.profile.highScore) {
            this.profile.highScore = this.getScore();
        }
        
        // ゲームモード統計を記録
        this.gameModeManager.recordGameCompletion(this.getScore());
        
        // アチーブメント判定を実行
        const unlockedAchievements = this.achievementManager.checkAchievements(this.currentSession);
        
        // プロファイル保存
        this.saveProfile();
        
        // アチーブメント解除通知
        if (unlockedAchievements.length > 0) {
            console.log(`🎉 ${unlockedAchievements.length}個のアチーブメントが解除されました！`);
            unlockedAchievements.forEach(result => {
                console.log(`  - ${result.achievement.name}: +${result.achievement.reward.coins}コイン, +${result.achievement.reward.experience}経験値`);
            });
        }
        
        // イベント発行
        this.eventEmitter.emit('profileUpdated');
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
        // 既存ゲームイベントとの連携
        this.eventEmitter.on('enemyDestroyed', () => {
            this.updateSessionStats('enemiesDestroyed', 1);
        });
        
        this.eventEmitter.on('bossDefeated', () => {
            this.updateSessionStats('bossesDefeated', 1);
        });
        
        this.eventEmitter.on('powerUpCollected', () => {
            this.updateSessionStats('powerupsCollected', 1);
        });
        
        this.eventEmitter.on('playerShot', () => {
            this.updateSessionStats('bulletsShot', 1);
        });
        
        this.eventEmitter.on('playerDamaged', (damage) => {
            this.updateSessionStats('damageTaken', damage);
        });
        
        this.eventEmitter.on('waveCompleted', (waveNumber) => {
            this.updateSessionStats('waveReached', waveNumber);
        });
    }


    // ゲッター関数群
    getProfile(): PlayerProfile {
        return { ...this.profile }; // コピーを返してデータ保護
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

    // デバッグ用機能
    resetProfile(): void {
        this.profile = PersistenceManager.resetProfile();
        console.log('プレイヤープロファイルをリセットしました');
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

    // アップグレード関連メソッド
    
    /**
     * アップグレードを購入する
     */
    purchaseUpgrade(upgradeId: string) {
        const result = this.upgradeManager.purchaseUpgrade(upgradeId);
        if (result.success) {
            // プロファイル同期
            this.upgradeManager.updateProfile(this.profile);
            this.saveProfile();
        }
        return result;
    }

    /**
     * UpgradeManagerのインスタンスを取得
     */
    getUpgradeManager(): UpgradeManager {
        return this.upgradeManager;
    }

    /**
     * プレイヤーの現在のアップグレード効果を取得
     */
    getPlayerUpgradeEffect() {
        return this.upgradeManager.getTotalEffect();
    }

    // アチーブメント関連メソッド
    
    /**
     * AchievementManagerのインスタンスを取得
     */
    getAchievementManager(): AchievementManager {
        return this.achievementManager;
    }

    /**
     * アチーブメント統計情報を取得
     */
    getAchievementStats() {
        return this.achievementManager.getAchievementStats();
    }

    /**
     * 次の目標アチーブメントを取得
     */
    getNextTargetAchievement() {
        return this.achievementManager.getNextTargetAchievement();
    }

    /**
     * アチーブメント進捗情報を取得
     */
    getAchievementProgress(achievementId: string) {
        return this.achievementManager.getAchievementProgress(achievementId);
    }

    /**
     * 最近達成されたアチーブメントを取得
     */
    getRecentAchievements() {
        return this.achievementManager.getRecentAchievements();
    }

    /**
     * アチーブメント完了率を取得
     */
    getAchievementCompletionPercentage(): number {
        return this.achievementManager.getCompletionPercentage();
    }

    // ゲームモード関連メソッド
    
    /**
     * GameModeManagerのインスタンスを取得
     */
    getGameModeManager(): GameModeManager {
        return this.gameModeManager;
    }

    /**
     * 現在のゲームモードを取得
     */
    getCurrentGameMode(): GameMode {
        return this.gameModeManager.getCurrentGameMode();
    }

    /**
     * 現在のゲームモード修正子を取得
     */
    getCurrentGameModeModifiers(): GameModeModifiers {
        return this.gameModeManager.getCurrentModifiers();
    }

    /**
     * ゲームモードを選択
     */
    selectGameMode(modeId: string): boolean {
        return this.gameModeManager.selectGameMode(modeId);
    }

    /**
     * 利用可能なゲームモードを取得
     */
    getAvailableGameModes(): GameMode[] {
        return this.gameModeManager.getUnlockedGameModes();
    }

    /**
     * ゲームモード統計を取得
     */
    getGameModeStats() {
        return this.gameModeManager.getGameModeStats();
    }

    /**
     * ゲームモードのアンロック状況を取得
     */
    getGameModeUnlockStatuses() {
        return this.gameModeManager.getGameModeUnlockStatuses();
    }

    /**
     * プロファイル保存時に各Managerも同期
     */
    private saveProfile(): void {
        PersistenceManager.saveProfile(this.profile);
        // 各Managerのプロファイルも更新
        this.upgradeManager.updateProfile(this.profile);
        this.achievementManager.updateProfile(this.profile);
        this.gameModeManager.updatePlayerProfile(this.profile);
    }

    /**
     * プロファイル更新時の処理を拡張
     */
    private handleLevelUp(oldLevel: number, newLevel: number): void {
        this.profile.level = newLevel;
        
        // レベルアップボーナスコイン
        const levelUpBonus = newLevel * 100;
        this.profile.coins += levelUpBonus;
        
        // 各Managerにプロファイル変更を通知
        this.upgradeManager.updateProfile(this.profile);
        this.gameModeManager.updatePlayerProfile(this.profile);
        
        // イベント発行
        this.eventEmitter.emit('playerLevelUp', newLevel, levelUpBonus);
        
        console.log(`レベルアップ！ ${oldLevel} → ${newLevel} (ボーナス: ${levelUpBonus}コイン)`);
    }
}
