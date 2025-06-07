import { IDOMManager } from '../../interfaces/IDOMManager.js';
import { ProgressManager } from '../managers/ProgressManager.js';
import { EventEmitter } from '../../events/EventEmitter.js';
import { EventMap } from '../../events/EventType.js';

export class ProgressDisplayUI {
    private container: HTMLElement;
    private levelElement: HTMLElement | null = null;
    private xpBarElement: HTMLElement | null = null;
    private coinsElement: HTMLElement | null = null;
    private statsElement: HTMLElement | null = null;

    constructor(
        private domManager: IDOMManager,
        private progressManager: ProgressManager,
        private eventEmitter: EventEmitter<EventMap>
    ) {
        this.container = this.createProgressDisplay();
        this.setupEventListeners();
        this.updateDisplay();
    }

    private createProgressDisplay(): HTMLElement {
        const display = this.domManager.createElement('div');
        display.id = 'progress-display';
        display.className = 'progress-display';

        display.innerHTML = `
            <div class="progress-header">
                <div class="player-level" id="player-level">
                    <span class="level-label">Lv.</span>
                    <span class="level-number">1</span>
                </div>
                <div class="player-coins" id="player-coins">
                    <span class="coins-icon">💰</span>
                    <span class="coins-amount">0</span>
                </div>
            </div>
            <div class="experience-bar" id="experience-bar">
                <div class="xp-label">
                    <span>経験値</span>
                    <span class="xp-text" id="xp-text">0 / 100</span>
                </div>
                <div class="xp-bar-container">
                    <div class="xp-bar-fill" id="xp-bar-fill" style="width: 0%"></div>
                </div>
            </div>
            <div class="quick-stats" id="quick-stats">
                <div class="stat-item">
                    <span class="stat-icon">🎯</span>
                    <div class="stat-info">
                        <span class="stat-label">ハイスコア</span>
                        <span class="stat-value" id="high-score">0</span>
                    </div>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">🎮</span>
                    <div class="stat-info">
                        <span class="stat-label">総ゲーム数</span>
                        <span class="stat-value" id="total-games">0</span>
                    </div>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">💥</span>
                    <div class="stat-info">
                        <span class="stat-label">敵撃破数</span>
                        <span class="stat-value" id="enemies-destroyed">0</span>
                    </div>
                </div>
            </div>
        `;

        this.levelElement = display.querySelector('#player-level .level-number');
        this.xpBarElement = display.querySelector('#xp-bar-fill');
        this.coinsElement = display.querySelector('#player-coins .coins-amount');
        this.statsElement = display.querySelector('#quick-stats');

        return display;
    }

    private setupEventListeners(): void {
        // プログレッション関連イベントの監視
        this.eventEmitter.on('playerLevelUp', (newLevel, coinsEarned) => {
            this.showLevelUpNotification(newLevel, coinsEarned);
            this.updateDisplay();
        });

        this.eventEmitter.on('experienceGained', (amount, totalExperience) => {
            this.updateExperienceBar(totalExperience);
            this.showExperienceGainedEffect(amount);
        });

        this.eventEmitter.on('coinsEarned', (amount, totalCoins) => {
            this.updateCoinsDisplay(totalCoins);
            this.showCoinsEarnedEffect(amount);
        });

        this.eventEmitter.on('scoreUpdated', (newScore) => {
            this.updateHighScore(newScore);
        });

        this.eventEmitter.on('profileUpdated', () => {
            this.updateDisplay();
        });

        this.eventEmitter.on('enemyDestroyed', () => {
            this.updateEnemyCount();
        });

        this.eventEmitter.on('gameStarted', () => {
            this.updateTotalGamesCount();
        });
    }

    private updateDisplay(): void {
        const profile = this.progressManager.getProfile();
        
        // レベル表示更新
        if (this.levelElement) {
            this.levelElement.textContent = profile.level.toString();
        }

        // コイン表示更新
        if (this.coinsElement) {
            this.coinsElement.textContent = profile.coins.toLocaleString();
        }

        // 経験値バー更新
        this.updateExperienceBar(profile.experience);

        // 統計情報更新
        this.updateQuickStats();
    }

    private updateExperienceBar(currentExperience: number): void {
        const profile = this.progressManager.getProfile();
        const currentLevel = profile.level;
        
        // 簡易的なレベル計算（1000 XPごとにレベルアップ）
        const xpForCurrentLevel = (currentLevel - 1) * 1000;
        const xpForNextLevel = currentLevel * 1000;
        const currentLevelXP = currentExperience - xpForCurrentLevel;
        const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
        
        const percentage = Math.min((currentLevelXP / xpNeededForNext) * 100, 100);

        // XPバーの更新
        if (this.xpBarElement) {
            this.xpBarElement.style.width = `${percentage}%`;
        }

        // XPテキストの更新
        const xpTextElement = this.container.querySelector('#xp-text');
        if (xpTextElement) {
            xpTextElement.textContent = `${currentLevelXP} / ${xpNeededForNext}`;
        }
    }

    private updateCoinsDisplay(totalCoins: number): void {
        if (this.coinsElement) {
            this.coinsElement.textContent = totalCoins.toLocaleString();
        }
    }

    private updateQuickStats(): void {
        const profile = this.progressManager.getProfile();

        // ハイスコア更新
        const highScoreElement = this.container.querySelector('#high-score');
        if (highScoreElement) {
            highScoreElement.textContent = profile.highScore.toLocaleString();
        }

        // 総ゲーム数更新
        const totalGamesElement = this.container.querySelector('#total-games');
        if (totalGamesElement) {
            totalGamesElement.textContent = profile.totalGamesPlayed.toLocaleString();
        }

        // 敵撃破数更新
        const enemiesElement = this.container.querySelector('#enemies-destroyed');
        if (enemiesElement) {
            enemiesElement.textContent = profile.stats.enemiesDestroyed.toLocaleString();
        }
    }

    private updateHighScore(newScore: number): void {
        const highScoreElement = this.container.querySelector('#high-score');
        if (highScoreElement) {
            const profile = this.progressManager.getProfile();
            if (newScore > profile.highScore) {
                highScoreElement.textContent = newScore.toLocaleString();
                this.showNewHighScoreEffect();
            }
        }
    }

    private updateEnemyCount(): void {
        const enemiesElement = this.container.querySelector('#enemies-destroyed');
        if (enemiesElement) {
            const profile = this.progressManager.getProfile();
            enemiesElement.textContent = profile.stats.enemiesDestroyed.toLocaleString();
        }
    }

    private updateTotalGamesCount(): void {
        const totalGamesElement = this.container.querySelector('#total-games');
        if (totalGamesElement) {
            const profile = this.progressManager.getProfile();
            totalGamesElement.textContent = profile.totalGamesPlayed.toLocaleString();
        }
    }

    private showLevelUpNotification(newLevel: number, coinsEarned: number): void {
        const notification = this.domManager.createElement('div');
        notification.className = 'level-up-notification';
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">🆙</div>
                <div class="notification-text">
                    <h3>レベルアップ！</h3>
                    <p>レベル ${newLevel}に到達しました！</p>
                    <p class="bonus-coins">ボーナス: 💰 ${coinsEarned}</p>
                </div>
            </div>
        `;

        this.showNotification(notification, 4000);
    }

    private showExperienceGainedEffect(amount: number): void {
        const xpEffect = this.domManager.createElement('div');
        xpEffect.className = 'xp-gained-effect';
        xpEffect.textContent = `+${amount} XP`;
        
        // 経験値バーの近くに表示
        const xpBarContainer = this.container.querySelector('.xp-bar-container');
        if (xpBarContainer) {
            xpBarContainer.appendChild(xpEffect);
            
            setTimeout(() => {
                xpEffect.remove();
            }, 2000);
        }
    }

    private showCoinsEarnedEffect(amount: number): void {
        const coinEffect = this.domManager.createElement('div');
        coinEffect.className = 'coins-gained-effect';
        coinEffect.textContent = `+${amount}`;
        
        // コイン表示の近くに表示
        const coinsContainer = this.container.querySelector('#player-coins');
        if (coinsContainer) {
            coinsContainer.appendChild(coinEffect);
            
            setTimeout(() => {
                coinEffect.remove();
            }, 2000);
        }
    }

    private showNewHighScoreEffect(): void {
        const highScoreElement = this.container.querySelector('#high-score');
        if (highScoreElement) {
            highScoreElement.classList.add('new-high-score');
            
            setTimeout(() => {
                highScoreElement.classList.remove('new-high-score');
            }, 3000);
        }

        // ハイスコア通知
        const notification = this.domManager.createElement('div');
        notification.className = 'high-score-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">🏆</div>
                <div class="notification-text">
                    <h4>新記録達成！</h4>
                    <p>ハイスコアを更新しました！</p>
                </div>
            </div>
        `;

        this.showNotification(notification, 3000);
    }

    private showNotification(notification: HTMLElement, duration: number = 3000): void {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    notification.remove();
                }, 500);
            }, duration);
        }
    }

    public show(): void {
        this.container.classList.remove('hidden');
        this.updateDisplay();
    }

    public hide(): void {
        this.container.classList.add('hidden');
    }

    public toggle(): void {
        if (this.container.classList.contains('hidden')) {
            this.show();
        } else {
            this.hide();
        }
    }

    public getElement(): HTMLElement {
        return this.container;
    }

    public isVisible(): boolean {
        return !this.container.classList.contains('hidden');
    }

    public updateRealtime(): void {
        // リアルタイム更新が必要な場合に呼び出し
        this.updateDisplay();
    }

    public getProgressInfo(): {
        level: number;
        experience: number;
        coins: number;
        nextLevelXP: number;
    } {
        const profile = this.progressManager.getProfile();
        const nextLevelXP = profile.level * 1000;
        
        return {
            level: profile.level,
            experience: profile.experience,
            coins: profile.coins,
            nextLevelXP
        };
    }
}
