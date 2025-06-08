import { IDOMManager } from '../../interfaces/IDOMManager.js';
import { AchievementManager } from '../managers/AchievementManager.js';
import { ProgressManager } from '../managers/ProgressManager.js';
import { Achievement } from '../types/Achievement.js';
import { EventEmitter } from '../../events/EventEmitter.js';
import { EventMap } from '../../events/EventType.js';
import { DOMBuilder, DOM } from '../../utils/DOMBuilder.js';
import { AchievementCategory } from '../../types/react/index.js';

export class AchievementPanel {
    private container: HTMLElement;
    private achievementListElement: HTMLElement | null = null;
    private currentCategory: AchievementCategory = 'combat';
    private statsElement: HTMLElement | null = null;
    private useReact: boolean = true; // デフォルトでReactを使用
    private reactRoot: any = null;

    constructor(
        private domManager: IDOMManager,
        private achievementManager: AchievementManager,
        private progressManager: ProgressManager,
        private eventEmitter: EventEmitter<EventMap>
    ) {
        this.container = this.createContainer();
        this.setupEventListeners();
        this.render();
    }

    private createContainer(): HTMLElement {
        return DOMBuilder.createElement({
            tag: 'div',
            id: 'achievement-panel',
            className: 'achievement-panel hidden'
        });
    }

    private render(): void {
        if (this.useReact) {
            this.renderReactComponent();
        } else {
            this.renderWithDOMBuilder();
        }
    }

    private async renderReactComponent(): Promise<void> {
        try {
            // 動的インポートでReactコンポーネントとReactDOMを読み込み
            const [
                { AchievementPanel: AchievementPanelComponent },
                { createRoot }
            ] = await Promise.all([
                import('../../components/ui/AchievementPanel.js'),
                import('react-dom/client')
            ]);

            // React Rootが未作成の場合は作成
            if (!this.reactRoot) {
                this.reactRoot = createRoot(this.container);
            }

            // プロップスを準備
            const props = {
                isVisible: !this.container.classList.contains('hidden'),
                achievements: this.achievementManager.getDisplayAchievements(false),
                playerProfile: this.progressManager.getProfile(),
                onClose: () => this.hide(),
                onCategoryChange: (category: AchievementCategory) => {
                    this.currentCategory = category;
                },
                onAchievementSelect: (achievement: any) => {
                    console.log('アチーブメント選択:', achievement);
                }
            };

            // Reactコンポーネントをレンダリング
            const { createElement } = await import('react');
            this.reactRoot.render(createElement(AchievementPanelComponent, props));

        } catch (error) {
            console.warn('React AchievementPanel の読み込みに失敗しました。DOMBuilderにフォールバックします:', error);
            this.useReact = false;
            this.renderWithDOMBuilder();
        }
    }

    private renderWithDOMBuilder(): void {
        // 既存のDOMBuilder実装を保持
        this.container.innerHTML = '';
        const panel = this.createAchievementPanel();
        this.container.appendChild(panel);
        this.updateDisplay();
    }

    private createAchievementPanel(): HTMLElement {
        const panel = DOMBuilder.createElement({
            tag: 'div',
            id: 'achievement-panel',
            className: 'achievement-panel hidden'
        });

        // アチーブメントヘッダー
        const achievementHeader = this.createAchievementHeader();
        
        // カテゴリータブ
        const achievementCategories = this.createAchievementCategories();
        
        // アチーブメントリスト
        this.achievementListElement = DOMBuilder.createElement({
            tag: 'div',
            className: 'achievement-list',
            id: 'achievement-list'
        });

        panel.appendChild(achievementHeader);
        panel.appendChild(achievementCategories);
        panel.appendChild(this.achievementListElement);

        return panel;
    }

    private createAchievementHeader(): HTMLElement {
        const closeButton = DOMBuilder.createElement({
            tag: 'button',
            className: 'close-button',
            id: 'close-achievements',
            textContent: '×'
        });

        const achievementTitle = DOMBuilder.createElement({
            tag: 'div',
            className: 'achievement-title',
            children: [
                DOM.h2('🏆 アチーブメント'),
                closeButton
            ]
        });

        // 統計情報の初期表示
        this.statsElement = DOMBuilder.createElement({
            tag: 'div',
            className: 'achievement-stats',
            id: 'achievement-stats',
            children: [
                DOM.span('completed', '完了: 0/0'),
                DOM.span('completion-rate', '達成率: 0%')
            ]
        });

        return DOMBuilder.createElement({
            tag: 'div',
            className: 'achievement-header',
            children: [achievementTitle, this.statsElement]
        });
    }

    private createAchievementCategories(): HTMLElement {
        const combatTab = DOMBuilder.createElement({
            tag: 'button',
            className: 'category-tab active',
            textContent: '⚔️ 戦闘',
            attributes: { 'data-category': 'combat' }
        });

        const survivalTab = DOMBuilder.createElement({
            tag: 'button',
            className: 'category-tab',
            textContent: '🛡️ 生存',
            attributes: { 'data-category': 'survival' }
        });

        const collectionTab = DOMBuilder.createElement({
            tag: 'button',
            className: 'category-tab',
            textContent: '📦 収集',
            attributes: { 'data-category': 'collection' }
        });

        const masteryTab = DOMBuilder.createElement({
            tag: 'button',
            className: 'category-tab',
            textContent: '📈 熟練',
            attributes: { 'data-category': 'mastery' }
        });

        const specialTab = DOMBuilder.createElement({
            tag: 'button',
            className: 'category-tab',
            textContent: '⭐ 特別',
            attributes: { 'data-category': 'special' }
        });

        return DOMBuilder.createElement({
            tag: 'div',
            className: 'achievement-categories',
            children: [combatTab, survivalTab, collectionTab, masteryTab, specialTab]
        });
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
            // 既存の子要素をクリア
            this.statsElement.innerHTML = '';
            
            // 安全なDOM構築で統計情報を再作成
            const completedSpan = DOM.span('completed', `完了: ${stats.completedAchievements}/${stats.totalAchievements}`);
            const completionRateSpan = DOM.span('completion-rate', `達成率: ${stats.completionPercentage}%`);
            
            this.statsElement.appendChild(completedSpan);
            this.statsElement.appendChild(completionRateSpan);
        }
    }

    private updateAchievementList(): void {
        const achievements = this.achievementManager.getDisplayAchievements(false, this.currentCategory);

        if (!this.achievementListElement) return;

        this.achievementListElement.innerHTML = '';

        if (achievements.length === 0) {
            const noAchievementsDiv = DOMBuilder.createElement({
                tag: 'div',
                className: 'no-achievements',
                children: [
                    DOM.p('このカテゴリーにはアチーブメントがありません')
                ]
            });
            this.achievementListElement.appendChild(noAchievementsDiv);
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

        // アチーブメントアイコン
        const achievementIcon = this.createAchievementIcon(isCompleted);
        
        // アチーブメントコンテンツ
        const achievementContent = this.createAchievementContent(achievement, isCompleted, progress);
        
        // アチーブメントステータス
        const achievementStatus = this.createAchievementStatus(isCompleted);

        return DOMBuilder.createElement({
            tag: 'div',
            className: `achievement-item ${isCompleted ? 'completed' : 'incomplete'}`,
            attributes: { 'data-achievement-id': achievement.id },
            children: [achievementIcon, achievementContent, achievementStatus]
        });
    }

    private createAchievementIcon(isCompleted: boolean): HTMLElement {
        return DOMBuilder.createElement({
            tag: 'div',
            className: 'achievement-icon',
            textContent: isCompleted ? '🏆' : '⭐'
        });
    }

    private createAchievementContent(achievement: Achievement, isCompleted: boolean, progress: any): HTMLElement {
        const achievementInfo = this.createAchievementInfo(achievement);
        const achievementProgress = this.createAchievementProgressSection(isCompleted, progress);

        return DOMBuilder.createElement({
            tag: 'div',
            className: 'achievement-content',
            children: [achievementInfo, achievementProgress]
        });
    }

    private createAchievementInfo(achievement: Achievement): HTMLElement {
        const rewardElement = this.createRewardElement(achievement);
        const children = [
            DOM.h3(achievement.name, 'achievement-name'),
            DOM.p(achievement.description, 'achievement-description')
        ];

        if (rewardElement) {
            children.push(rewardElement);
        }

        return DOMBuilder.createElement({
            tag: 'div',
            className: 'achievement-info',
            children: children
        });
    }

    private createAchievementProgressSection(isCompleted: boolean, progress: any): HTMLElement {
        const progressText = DOMBuilder.createElement({
            tag: 'div',
            className: 'progress-text',
            textContent: isCompleted ? '完了！' : progress ? `${progress.current}/${progress.required}` : '進捗なし'
        });

        const children = [progressText];

        if (!isCompleted && progress) {
            const progressBar = this.createProgressBar(progress.current, progress.required);
            children.push(progressBar);
        }

        return DOMBuilder.createElement({
            tag: 'div',
            className: 'achievement-progress',
            children: children
        });
    }

    private createAchievementStatus(isCompleted: boolean): HTMLElement {
        const statusBadge = DOMBuilder.createElement({
            tag: 'span',
            className: `status-badge ${isCompleted ? 'completed' : 'incomplete'}`,
            textContent: isCompleted ? '完了' : '未完了'
        });

        return DOMBuilder.createElement({
            tag: 'div',
            className: 'achievement-status',
            children: [statusBadge]
        });
    }

    private createRewardElement(achievement: Achievement): HTMLElement | null {
        const rewards = [];
        
        if (achievement.reward.coins > 0) {
            rewards.push(`💰 ${achievement.reward.coins}`);
        }
        
        if (achievement.reward.experience > 0) {
            rewards.push(`✨ ${achievement.reward.experience} XP`);
        }

        if (rewards.length > 0) {
            return DOMBuilder.createElement({
                tag: 'div',
                className: 'achievement-rewards',
                textContent: `報酬: ${rewards.join(', ')}`
            });
        }

        return null;
    }

    private createProgressBar(current: number, required: number): HTMLElement {
        const percentage = Math.min((current / required) * 100, 100);
        
        const progressFill = DOMBuilder.createElement({
            tag: 'div',
            className: 'progress-fill',
            attributes: { style: `width: ${percentage}%` }
        });
        
        return DOMBuilder.createElement({
            tag: 'div',
            className: 'progress-bar',
            children: [progressFill]
        });
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
        const notificationIcon = DOMBuilder.createElement({
            tag: 'div',
            className: 'notification-icon',
            textContent: '🏆'
        });

        const notificationText = DOMBuilder.createElement({
            tag: 'div',
            className: 'notification-text',
            children: [
                DOMBuilder.createElement({
                    tag: 'h4',
                    textContent: 'アチーブメント解除！'
                }),
                DOM.p(achievement.name)
            ]
        });

        const notificationContent = DOMBuilder.createElement({
            tag: 'div',
            className: 'notification-content',
            children: [notificationIcon, notificationText]
        });

        const notification = DOMBuilder.createElement({
            tag: 'div',
            className: 'achievement-notification',
            children: [notificationContent]
        });

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
        if (this.useReact) {
            this.renderReactComponent();
        } else {
            this.updateDisplay();
        }
    }

    public hide(): void {
        this.container.classList.add('hidden');
        if (this.useReact) {
            this.renderReactComponent();
        }
    }

    public toggle(): void {
        if (this.container.classList.contains('hidden')) {
            this.show();
        } else {
            this.hide();
        }
    }

    /**
     * React/DOMBuilder間の切り替え（開発・テスト用）
     */
    public setUseReact(useReact: boolean): void {
        if (this.useReact !== useReact) {
            this.useReact = useReact;
            this.render();
        }
    }

    /**
     * 現在のレンダリングモードを取得
     */
    public getUseReact(): boolean {
        return this.useReact;
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
