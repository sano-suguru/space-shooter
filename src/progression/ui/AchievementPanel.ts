import { IDOMManager } from '../../interfaces/IDOMManager.js';
import { AchievementManager } from '../managers/AchievementManager.js';
import { ProgressManager } from '../managers/ProgressManager.js';
import { Achievement } from '../types/Achievement.js';
import { EventEmitter } from '../../events/EventEmitter.js';
import { EventMap } from '../../events/EventType.js';

type AchievementCategory = 'combat' | 'survival' | 'collection' | 'mastery' | 'special';

export class AchievementPanel {
    private container: HTMLElement;
    private achievementListElement: HTMLElement | null = null;
    private currentCategory: AchievementCategory = 'combat';
    private statsElement: HTMLElement | null = null;

    constructor(
        private domManager: IDOMManager,
        private achievementManager: AchievementManager,
        private progressManager: ProgressManager,
        private eventEmitter: EventEmitter<EventMap>
    ) {
        this.container = this.createAchievementPanel();
        this.setupEventListeners();
        this.updateDisplay();
    }

    private createAchievementPanel(): HTMLElement {
        const panel = this.domManager.createElement('div');
        panel.id = 'achievement-panel';
        panel.className = 'achievement-panel hidden';

        panel.innerHTML = `
            <div class="achievement-header">
                <div class="achievement-title">
                    <h2>🏆 アチーブメント</h2>
                    <button class="close-button" id="close-achievements">×</button>
                </div>
                <div class="achievement-stats" id="achievement-stats">
                    <span class="completed">完了: 0/0</span>
                    <span class="completion-rate">達成率: 0%</span>
                </div>
            </div>
            <div class="achievement-categories">
                <button class="category-tab active" data-category="combat">⚔️ 戦闘</button>
                <button class="category-tab" data-category="survival">🛡️ 生存</button>
                <button class="category-tab" data-category="collection">📦 収集</button>
                <button class="category-tab" data-category="mastery">📈 熟練</button>
                <button class="category-tab" data-category="special">⭐ 特別</button>
            </div>
            <div class="achievement-list" id="achievement-list"></div>
        `;

        this.achievementListElement = panel.querySelector('#achievement-list');
        this.statsElement = panel.querySelector('#achievement-stats');

        return panel;
    }

    private setupEventListeners(): void {
        // カテゴリタブのクリック処理
        const categoryTabs = this.container.querySelectorAll('.category-tab');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                const category = target.getAttribute('data-category') as AchievementCategory;
                this.switchCategory(category);
            });
        });

        // パネル閉じるボタン
        const closeButton = this.container.querySelector('#close-achievements');
        closeButton?.addEventListener('click', () => {
            this.hide();
        });

        // アチーブメント関連イベントの監視
        this.eventEmitter.on('achievementUnlocked', (achievement) => {
            this.showAchievementUnlockedAnimation(achievement);
            this.updateDisplay();
        });

        this.eventEmitter.on('achievementProgress', (achievementId, current, required) => {
            this.updateAchievementProgress(achievementId, current, required);
        });

        this.eventEmitter.on('profileUpdated', () => {
            this.updateDisplay();
        });
    }

    private switchCategory(category: AchievementCategory): void {
        this.currentCategory = category;
        
        // タブの表示状態を更新
        const tabs = this.container.querySelectorAll('.category-tab');
        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-category') === category) {
                tab.classList.add('active');
            }
        });

        this.updateAchievementList();
    }

    private updateDisplay(): void {
        this.updateStats();
        this.updateAchievementList();
    }

    private updateStats(): void {
        const stats = this.achievementManager.getAchievementStats();

        if (this.statsElement) {
            this.statsElement.innerHTML = `
                <span class="completed">完了: ${stats.completedAchievements}/${stats.totalAchievements}</span>
                <span class="completion-rate">達成率: ${stats.completionPercentage}%</span>
            `;
        }
    }

    private updateAchievementList(): void {
        const achievements = this.achievementManager.getDisplayAchievements(false, this.currentCategory);

        if (!this.achievementListElement) return;

        this.achievementListElement.innerHTML = '';

        if (achievements.length === 0) {
            this.achievementListElement.innerHTML = `
                <div class="no-achievements">
                    <p>このカテゴリーにはアチーブメントがありません</p>
                </div>
            `;
            return;
        }

        // 完了済みを後に、未完了を前に表示
        const sortedAchievements = achievements.sort((a: Achievement, b: Achievement) => {
            const profile = this.progressManager.getProfile();
            const aCompleted = profile.completedAchievements.includes(a.id);
            const bCompleted = profile.completedAchievements.includes(b.id);
            
            if (aCompleted && !bCompleted) return 1;
            if (!aCompleted && bCompleted) return -1;
            return 0;
        });

        sortedAchievements.forEach((achievement: Achievement) => {
            const achievementElement = this.createAchievementElement(achievement);
            this.achievementListElement!.appendChild(achievementElement);
        });
    }

    private createAchievementElement(achievement: Achievement): HTMLElement {
        const profile = this.progressManager.getProfile();
        const isCompleted = profile.completedAchievements.includes(achievement.id);
        const progress = this.achievementManager.getAchievementProgress(achievement.id);

        const achievementDiv = this.domManager.createElement('div');
        achievementDiv.className = `achievement-item ${isCompleted ? 'completed' : 'incomplete'}`;
        achievementDiv.setAttribute('data-achievement-id', achievement.id);

        const progressBar = progress ? this.createProgressBar(progress.current, progress.required) : '';
        const rewardText = this.getRewardText(achievement);

        achievementDiv.innerHTML = `
            <div class="achievement-icon">
                ${isCompleted ? '🏆' : '⭐'}
            </div>
            <div class="achievement-content">
                <div class="achievement-info">
                    <h3 class="achievement-name">${achievement.name}</h3>
                    <p class="achievement-description">${achievement.description}</p>
                    ${rewardText}
                </div>
                <div class="achievement-progress">
                    <div class="progress-text">
                        ${isCompleted ? '完了！' : progress ? `${progress.current}/${progress.required}` : '進捗なし'}
                    </div>
                    ${!isCompleted && progress ? progressBar : ''}
                </div>
            </div>
            <div class="achievement-status">
                ${isCompleted ? 
                    '<span class="status-badge completed">完了</span>' : 
                    '<span class="status-badge incomplete">未完了</span>'
                }
            </div>
        `;

        return achievementDiv;
    }

    private createProgressBar(current: number, required: number): string {
        const percentage = Math.min((current / required) * 100, 100);
        return `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
        `;
    }

    private getRewardText(achievement: Achievement): string {
        const rewards = [];
        
        if (achievement.reward.coins > 0) {
            rewards.push(`💰 ${achievement.reward.coins}`);
        }
        
        if (achievement.reward.experience > 0) {
            rewards.push(`✨ ${achievement.reward.experience} XP`);
        }

        return rewards.length > 0 ? 
            `<div class="achievement-rewards">報酬: ${rewards.join(', ')}</div>` : '';
    }

    private updateAchievementProgress(achievementId: string, current: number, required: number): void {
        const achievementElement = this.container.querySelector(`[data-achievement-id="${achievementId}"]`);
        if (!achievementElement) return;

        const progressText = achievementElement.querySelector('.progress-text');
        const progressFill = achievementElement.querySelector('.progress-fill') as HTMLElement;

        if (progressText) {
            progressText.textContent = `${current}/${required}`;
        }

        if (progressFill) {
            const percentage = Math.min((current / required) * 100, 100);
            progressFill.style.width = `${percentage}%`;
        }
    }

    private showAchievementUnlockedAnimation(achievement: Achievement): void {
        // アチーブメント解除の通知アニメーション
        const notification = this.domManager.createElement('div');
        notification.className = 'achievement-notification';
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">🏆</div>
                <div class="notification-text">
                    <h4>アチーブメント解除！</h4>
                    <p>${achievement.name}</p>
                </div>
            </div>
        `;

        // ゲームコンテナに追加（全画面表示）
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(notification);
            
            // アニメーション後に自動削除
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    notification.remove();
                }, 500);
            }, 3000);
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

    public switchToCategory(category: AchievementCategory): void {
        this.switchCategory(category);
    }
}
