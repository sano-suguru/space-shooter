import { IDOMManager } from '../../interfaces/IDOMManager.js';
import { ProgressManager } from '../managers/ProgressManager.js';
import { EventEmitter } from '../../events/EventEmitter.js';
import { EventMap } from '../../events/EventType.js';
import { DOMBuilder, DOM } from '../../utils/DOMBuilder.js';

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
        const display = DOMBuilder.createElement({
            tag: 'div',
            id: 'progress-display',
            className: 'progress-display'
        });

        // Progress Header
        const progressHeader = DOM.div('progress-header');
        
        // Player Level Section
        const playerLevel = DOMBuilder.createElement({
            tag: 'div',
            className: 'player-level',
            id: 'player-level'
        });
        
        const levelLabel = DOM.span('level-label', 'Lv.');
        const levelNumber = DOM.span('level-number', '1');
        
        playerLevel.appendChild(levelLabel);
        playerLevel.appendChild(levelNumber);

        // Player Coins Section
        const playerCoins = DOMBuilder.createElement({
            tag: 'div',
            className: 'player-coins',
            id: 'player-coins'
        });
        
        const coinsIcon = DOM.span('coins-icon', '💰');
        const coinsAmount = DOM.span('coins-amount', '0');
        
        playerCoins.appendChild(coinsIcon);
        playerCoins.appendChild(coinsAmount);

        progressHeader.appendChild(playerLevel);
        progressHeader.appendChild(playerCoins);

        // Experience Bar Section
        const experienceBar = DOMBuilder.createElement({
            tag: 'div',
            className: 'experience-bar',
            id: 'experience-bar'
        });
        
        const xpLabel = DOM.div('xp-label');
        const xpLabelText = DOM.span('', '経験値');
        const xpText = DOMBuilder.createElement({
            tag: 'span',
            className: 'xp-text',
            id: 'xp-text',
            textContent: '0 / 100'
        });
        
        xpLabel.appendChild(xpLabelText);
        xpLabel.appendChild(xpText);
        
        const xpBarContainer = DOM.div('xp-bar-container');
        const xpBarFill = DOMBuilder.createElement({
            tag: 'div',
            className: 'xp-bar-fill',
            id: 'xp-bar-fill'
        });
        xpBarFill.style.width = '0%';
        
        xpBarContainer.appendChild(xpBarFill);
        
        experienceBar.appendChild(xpLabel);
        experienceBar.appendChild(xpBarContainer);

        // Quick Stats Section
        const quickStats = DOMBuilder.createElement({
            tag: 'div',
            className: 'quick-stats',
            id: 'quick-stats'
        });
        
        // High Score Stat
        const highScoreStat = this.createStatItem('🎯', 'ハイスコア', '0', 'high-score');
        
        // Total Games Stat
        const totalGamesStat = this.createStatItem('🎮', '総ゲーム数', '0', 'total-games');
        
        // Enemies Destroyed Stat
        const enemiesStat = this.createStatItem('💥', '敵撃破数', '0', 'enemies-destroyed');
        
        quickStats.appendChild(highScoreStat);
        quickStats.appendChild(totalGamesStat);
        quickStats.appendChild(enemiesStat);

        // Assemble the complete display
        display.appendChild(progressHeader);
        display.appendChild(experienceBar);
        display.appendChild(quickStats);

        // Store references
        this.levelElement = levelNumber;
        this.xpBarElement = xpBarFill;
        this.coinsElement = coinsAmount;
        this.statsElement = quickStats;

        return display;
    }

    private createStatItem(icon: string, label: string, value: string, valueId: string): HTMLElement {
        const statItem = DOM.div('stat-item');
        
        const statIcon = DOM.span('stat-icon', icon);
        
        const statInfo = DOM.div('stat-info');
        const statLabel = DOM.span('stat-label', label);
        const statValue = DOMBuilder.createElement({
            tag: 'span',
            className: 'stat-value',
            id: valueId,
            textContent: value
        });
        
        statInfo.appendChild(statLabel);
        statInfo.appendChild(statValue);
        
        statItem.appendChild(statIcon);
        statItem.appendChild(statInfo);
        
        return statItem;
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
        const notification = DOMBuilder.createElement({
            tag: 'div',
            className: 'level-up-notification'
        });
        
        const notificationContent = DOM.div('notification-content');
        
        const notificationIcon = DOM.div('notification-icon');
        notificationIcon.textContent = '🆙';
        
        const notificationText = DOM.div('notification-text');
        
        const title = DOMBuilder.createElement({
            tag: 'h3',
            textContent: 'レベルアップ！'
        });
        
        const levelMessage = DOM.p('', `レベル ${newLevel}に到達しました！`);
        
        const bonusCoins = DOM.p('bonus-coins', `ボーナス: 💰 ${coinsEarned}`);
        
        notificationText.appendChild(title);
        notificationText.appendChild(levelMessage);
        notificationText.appendChild(bonusCoins);
        
        notificationContent.appendChild(notificationIcon);
        notificationContent.appendChild(notificationText);
        
        notification.appendChild(notificationContent);

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
        const notification = DOMBuilder.createElement({
            tag: 'div',
            className: 'high-score-notification'
        });
        
        const notificationContent = DOM.div('notification-content');
        
        const notificationIcon = DOM.div('notification-icon');
        notificationIcon.textContent = '🏆';
        
        const notificationText = DOM.div('notification-text');
        
        const title = DOMBuilder.createElement({
            tag: 'h4',
            textContent: '新記録達成！'
        });
        
        const message = DOM.p('', 'ハイスコアを更新しました！');
        
        notificationText.appendChild(title);
        notificationText.appendChild(message);
        
        notificationContent.appendChild(notificationIcon);
        notificationContent.appendChild(notificationText);
        
        notification.appendChild(notificationContent);

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
