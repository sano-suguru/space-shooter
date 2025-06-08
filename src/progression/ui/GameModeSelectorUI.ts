import { IDOMManager } from '../../interfaces/IDOMManager.js';
import { GameModeManager } from '../managers/GameModeManager.js';
import { ProgressManager } from '../managers/ProgressManager.js';
import { GameMode } from '../types/GameMode.js';
import { EventEmitter } from '../../events/EventEmitter.js';
import { EventMap } from '../../events/EventType.js';
import { DOMBuilder, DOM } from '../../utils/DOMBuilder.js';

export class GameModeSelectorUI {
    private container: HTMLElement;
    private modeListElement: HTMLElement | null = null;
    private currentModeElement: HTMLElement | null = null;

    constructor(
        private domManager: IDOMManager,
        private gameModeManager: GameModeManager,
        private progressManager: ProgressManager,
        private eventEmitter: EventEmitter<EventMap>
    ) {
        this.container = this.createSelectorUI();
        this.setupEventListeners();
        this.updateDisplay();
    }

    private createSelectorUI(): HTMLElement {
        const selector = DOMBuilder.createElement({
            tag: 'div',
            id: 'game-mode-selector',
            className: 'game-mode-selector hidden'
        });

        // ヘッダーセクション
        const selectorHeader = DOM.div('selector-header');
        
        // タイトルセクション
        const selectorTitle = DOM.div('selector-title');
        const titleH2 = DOM.h2('', '🎮 ゲームモード選択');
        const closeButton = DOMBuilder.createElement({
            tag: 'button',
            className: 'close-button',
            id: 'close-selector',
            textContent: '×'
        });
        
        selectorTitle.appendChild(titleH2);
        selectorTitle.appendChild(closeButton);

        // 現在のモードセクション
        const currentMode = DOMBuilder.createElement({
            tag: 'div',
            className: 'current-mode',
            id: 'current-mode'
        });
        
        const modeLabel = DOM.span('mode-label', '現在のモード:');
        const modeName = DOM.span('mode-name', 'Normal');
        
        currentMode.appendChild(modeLabel);
        currentMode.appendChild(modeName);

        // ヘッダーに要素を追加
        selectorHeader.appendChild(selectorTitle);
        selectorHeader.appendChild(currentMode);

        // モードリスト
        const modeList = DOMBuilder.createElement({
            tag: 'div',
            className: 'mode-list',
            id: 'mode-list'
        });

        // セレクターに要素を追加
        selector.appendChild(selectorHeader);
        selector.appendChild(modeList);

        // 参照を保存
        this.modeListElement = modeList;
        this.currentModeElement = modeName;

        return selector;
    }

    private setupEventListeners(): void {
        // セレクター閉じるボタン
        const closeButton = this.container.querySelector('#close-selector');
        closeButton?.addEventListener('click', () => {
            this.hide();
        });

        // ゲームモード関連イベントの監視
        this.eventEmitter.on('gameModeChanged', (newMode, previousMode) => {
            this.updateCurrentModeDisplay();
            this.updateModeList();
            this.showModeChangeNotification(newMode, previousMode);
        });

        this.eventEmitter.on('gameModeUnlocked', (gameMode) => {
            this.showModeUnlockedNotification(gameMode);
            this.updateModeList();
        });

        this.eventEmitter.on('gameModeHighScore', (gameMode, score) => {
            this.updateModeStats(gameMode.id, score);
        });

        this.eventEmitter.on('profileUpdated', () => {
            this.updateDisplay();
        });
    }

    private updateDisplay(): void {
        this.updateCurrentModeDisplay();
        this.updateModeList();
    }

    private updateCurrentModeDisplay(): void {
        const currentMode = this.gameModeManager.getCurrentGameMode();
        if (this.currentModeElement) {
            this.currentModeElement.textContent = currentMode.name;
        }
    }

    private updateModeList(): void {
        const allModes = this.gameModeManager.getAllGameModes();
        const currentModeId = this.gameModeManager.getCurrentGameMode().id;

        if (!this.modeListElement) return;

        this.modeListElement.innerHTML = '';

        allModes.forEach((mode: GameMode) => {
            const modeElement = this.createModeElement(mode, currentModeId);
            this.modeListElement!.appendChild(modeElement);
        });
    }

    private createModeElement(mode: GameMode, currentModeId: string): HTMLElement {
        const isUnlocked = this.gameModeManager.isGameModeUnlocked(mode.id);
        const isCurrent = mode.id === currentModeId;
        const stats = this.getIndividualModeStats(mode.id);

        const modeDiv = DOMBuilder.createElement({
            tag: 'div',
            className: `mode-item ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''}`,
            attributes: { 'data-mode-id': mode.id }
        });

        const difficultyIcon = this.getDifficultyIcon(mode.id);

        // Mode Header
        const modeHeader = DOM.div('mode-header');
        
        // Mode Info Section
        const modeInfo = DOM.div('mode-info');
        
        const modeTitle = DOM.div('mode-title');
        const modeIcon = DOM.span('mode-icon', difficultyIcon);
        const modeName = DOM.h3('mode-name', mode.name);
        
        modeTitle.appendChild(modeIcon);
        modeTitle.appendChild(modeName);
        
        if (isCurrent) {
            const currentBadge = DOM.span('current-badge', '選択中');
            modeTitle.appendChild(currentBadge);
        }
        
        if (!isUnlocked) {
            const lockedBadge = DOM.span('locked-badge', '🔒');
            modeTitle.appendChild(lockedBadge);
        }

        const modeDescription = DOM.p('mode-description', mode.description);
        
        modeInfo.appendChild(modeTitle);
        modeInfo.appendChild(modeDescription);

        // Mode Stats Section
        const modeStats = DOM.div('mode-stats');
        
        const gamesPlayedStat = DOM.div('stat-item');
        gamesPlayedStat.appendChild(DOM.span('stat-label', 'プレイ回数'));
        gamesPlayedStat.appendChild(DOM.span('stat-value', stats.gamesPlayed.toString()));
        
        const highScoreStat = DOM.div('stat-item');
        highScoreStat.appendChild(DOM.span('stat-label', '最高スコア'));
        highScoreStat.appendChild(DOM.span('stat-value', stats.highScore.toLocaleString()));
        
        modeStats.appendChild(gamesPlayedStat);
        modeStats.appendChild(highScoreStat);

        modeHeader.appendChild(modeInfo);
        modeHeader.appendChild(modeStats);

        // Mode Details Section
        const modeDetails = DOM.div('mode-details');
        
        const modeModifiers = DOM.div('mode-modifiers');
        const modifiersTitle = DOMBuilder.createElement({
            tag: 'h4',
            textContent: 'モード効果:'
        });
        modeModifiers.appendChild(modifiersTitle);
        
        const modifiersElement = this.createModifiersElement(mode);
        modeModifiers.appendChild(modifiersElement);
        
        const modeReward = DOM.div('mode-reward');
        const rewardMultiplier = DOM.span('reward-multiplier', `報酬倍率: ×${mode.rewardMultiplier}`);
        modeReward.appendChild(rewardMultiplier);
        
        modeDetails.appendChild(modeModifiers);
        modeDetails.appendChild(modeReward);

        // Mode Footer Section
        const modeFooter = DOM.div('mode-footer');
        const buttonElement = this.createModeButtonElement(mode, isUnlocked, isCurrent);
        modeFooter.appendChild(buttonElement);

        // Assemble the complete element
        modeDiv.appendChild(modeHeader);
        modeDiv.appendChild(modeDetails);
        modeDiv.appendChild(modeFooter);

        return modeDiv;
    }

    private getIndividualModeStats(modeId: string): { gamesPlayed: number; highScore: number } {
        const profile = this.progressManager.getProfile();
        const gameModeStats = profile.gameModeStats || { gamesPlayedByMode: {}, highScoresByMode: {} };
        
        return {
            gamesPlayed: gameModeStats.gamesPlayedByMode[modeId] || 0,
            highScore: gameModeStats.highScoresByMode[modeId] || 0
        };
    }

    private getDifficultyIcon(modeId: string): string {
        switch (modeId) {
            case 'normal': return '⚪';
            case 'hardcore': return '🔴';
            case 'survival': return '🟡';
            default: return '❓';
        }
    }

    private createModifiersElement(mode: GameMode): HTMLElement {
        const modifiers = [];

        if (mode.modifiers.enemyHealthMultiplier !== 1) {
            const percentage = Math.round(mode.modifiers.enemyHealthMultiplier * 100);
            modifiers.push(`敵体力: ${percentage}%`);
        }

        if (mode.modifiers.enemySpeedMultiplier !== 1) {
            const percentage = Math.round(mode.modifiers.enemySpeedMultiplier * 100);
            modifiers.push(`敵速度: ${percentage}%`);
        }

        if (mode.modifiers.enemySpawnRateMultiplier !== 1) {
            const percentage = Math.round(mode.modifiers.enemySpawnRateMultiplier * 100);
            modifiers.push(`敵出現率: ${percentage}%`);
        }

        if (mode.modifiers.scoreMultiplier !== 1) {
            const percentage = Math.round(mode.modifiers.scoreMultiplier * 100);
            modifiers.push(`スコア: ${percentage}%`);
        }

        if (mode.modifiers.coinMultiplier !== 1) {
            const percentage = Math.round(mode.modifiers.coinMultiplier * 100);
            modifiers.push(`コイン: ${percentage}%`);
        }

        if (mode.modifiers.experienceMultiplier !== 1) {
            const percentage = Math.round(mode.modifiers.experienceMultiplier * 100);
            modifiers.push(`経験値: ${percentage}%`);
        }

        if (modifiers.length > 0) {
            const ul = DOMBuilder.createElement({ tag: 'ul' });
            modifiers.forEach(mod => {
                const li = DOMBuilder.createElement({ tag: 'li', textContent: mod });
                ul.appendChild(li);
            });
            return ul;
        } else {
            return DOM.p('', '標準設定');
        }
    }

    private createModeButtonElement(mode: GameMode, isUnlocked: boolean, isCurrent: boolean): HTMLElement {
        if (!isUnlocked) {
            const profile = this.progressManager.getProfile();
            const canUnlock = mode.unlockCondition(profile);

            if (canUnlock) {
                return DOMBuilder.createElement({
                    tag: 'button',
                    className: 'unlock-button',
                    textContent: '解除する',
                    attributes: { 'data-mode-id': mode.id }
                });
            } else {
                const div = DOM.div('unlock-requirement');
                div.textContent = `解除条件: ${this.getUnlockRequirementText(mode)}`;
                return div;
            }
        }

        if (isCurrent) {
            const button = DOMBuilder.createElement({
                tag: 'button',
                className: 'select-button current',
                textContent: '選択中'
            });
            (button as HTMLButtonElement).disabled = true;
            return button;
        }

        return DOMBuilder.createElement({
            tag: 'button',
            className: 'select-button',
            textContent: '選択する',
            attributes: { 'data-mode-id': mode.id }
        });
    }

    private getModifiersText(mode: GameMode): string {
        const modifiers = [];

        if (mode.modifiers.enemyHealthMultiplier !== 1) {
            const percentage = Math.round(mode.modifiers.enemyHealthMultiplier * 100);
            modifiers.push(`敵体力: ${percentage}%`);
        }

        if (mode.modifiers.enemySpeedMultiplier !== 1) {
            const percentage = Math.round(mode.modifiers.enemySpeedMultiplier * 100);
            modifiers.push(`敵速度: ${percentage}%`);
        }

        if (mode.modifiers.enemySpawnRateMultiplier !== 1) {
            const percentage = Math.round(mode.modifiers.enemySpawnRateMultiplier * 100);
            modifiers.push(`敵出現率: ${percentage}%`);
        }

        if (mode.modifiers.scoreMultiplier !== 1) {
            const percentage = Math.round(mode.modifiers.scoreMultiplier * 100);
            modifiers.push(`スコア: ${percentage}%`);
        }

        if (mode.modifiers.coinMultiplier !== 1) {
            const percentage = Math.round(mode.modifiers.coinMultiplier * 100);
            modifiers.push(`コイン: ${percentage}%`);
        }

        if (mode.modifiers.experienceMultiplier !== 1) {
            const percentage = Math.round(mode.modifiers.experienceMultiplier * 100);
            modifiers.push(`経験値: ${percentage}%`);
        }

        return modifiers.length > 0 ?
            `<ul>${modifiers.map(mod => `<li>${mod}</li>`).join('')}</ul>` :
            '<p>標準設定</p>';
    }

    private createModeButton(mode: GameMode, isUnlocked: boolean, isCurrent: boolean): string {
        if (!isUnlocked) {
            const profile = this.progressManager.getProfile();
            const canUnlock = mode.unlockCondition(profile);

            if (canUnlock) {
                return `<button class="unlock-button" data-mode-id="${mode.id}">解除する</button>`;
            } else {
                return `<div class="unlock-requirement">解除条件: ${this.getUnlockRequirementText(mode)}</div>`;
            }
        }

        if (isCurrent) {
            return `<button class="select-button current" disabled>選択中</button>`;
        }

        return `<button class="select-button" data-mode-id="${mode.id}">選択する</button>`;
    }

    private getUnlockRequirementText(mode: GameMode): string {
        // 実際の解除条件に基づいてテキストを生成
        // これは簡易実装なので、実際にはもっと詳細な条件テキストが必要
        switch (mode.id) {
            case 'hardcore':
                return 'レベル5達成とノーマルモードでスコア5000達成';
            case 'survival':
                return 'レベル10達成とハードコアモードでウェーブ10到達';
            default:
                return '条件不明';
        }
    }

    private setupModeButtons(): void {
        // 選択ボタンのイベントリスナー
        const selectButtons = this.container.querySelectorAll('.select-button:not(.current)');
        selectButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                const modeId = target.getAttribute('data-mode-id');
                if (modeId) {
                    this.selectMode(modeId);
                }
            });
        });

        // 解除ボタンのイベントリスナー
        const unlockButtons = this.container.querySelectorAll('.unlock-button');
        unlockButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                const modeId = target.getAttribute('data-mode-id');
                if (modeId) {
                    this.unlockMode(modeId);
                }
            });
        });
    }

    private selectMode(modeId: string): void {
        const success = this.gameModeManager.selectGameMode(modeId);

        if (success) {
            this.showModeSelectionSuccess();
        } else {
            this.showModeSelectionError();
        }
    }

    private unlockMode(modeId: string): void {
        // GameModeManager doesn't have direct unlock functionality
        // Modes are unlocked automatically when conditions are met
        this.showModeUnlockError();
    }

    private updateModeStats(modeId: string, score: number): void {
        const modeElement = this.container.querySelector(`[data-mode-id="${modeId}"]`);
        if (!modeElement) return;

        const highScoreElement = modeElement.querySelector('.stat-value');
        if (highScoreElement) {
            highScoreElement.textContent = score.toLocaleString();
        }
    }

    private showModeChangeNotification(newMode: GameMode, previousMode: GameMode): void {
        const notification = DOMBuilder.createElement({
            tag: 'div',
            className: 'mode-notification success'
        });

        const notificationContent = DOM.div('notification-content');
        
        const notificationIcon = DOM.div('notification-icon');
        notificationIcon.textContent = '🎮';
        
        const notificationText = DOM.div('notification-text');
        const title = DOMBuilder.createElement({
            tag: 'h4',
            textContent: 'ゲームモード変更'
        });
        const message = DOM.p('', `${previousMode.name} → ${newMode.name}`);
        
        notificationText.appendChild(title);
        notificationText.appendChild(message);
        
        notificationContent.appendChild(notificationIcon);
        notificationContent.appendChild(notificationText);
        
        notification.appendChild(notificationContent);

        this.showNotification(notification);
    }

    private showModeUnlockedNotification(gameMode: GameMode): void {
        const notification = DOMBuilder.createElement({
            tag: 'div',
            className: 'mode-notification unlock'
        });

        const notificationContent = DOM.div('notification-content');
        
        const notificationIcon = DOM.div('notification-icon');
        notificationIcon.textContent = '🔓';
        
        const notificationText = DOM.div('notification-text');
        const title = DOMBuilder.createElement({
            tag: 'h4',
            textContent: '新モード解除！'
        });
        const message = DOM.p('', `${gameMode.name}が利用可能になりました`);
        
        notificationText.appendChild(title);
        notificationText.appendChild(message);
        
        notificationContent.appendChild(notificationIcon);
        notificationContent.appendChild(notificationText);
        
        notification.appendChild(notificationContent);

        this.showNotification(notification);
    }

    private showModeSelectionSuccess(): void {
        const notification = this.domManager.createElement('div');
        notification.className = 'mode-feedback success';
        notification.textContent = 'モードを変更しました！';
        this.showNotification(notification);
    }

    private showModeSelectionError(): void {
        const notification = this.domManager.createElement('div');
        notification.className = 'mode-feedback error';
        notification.textContent = 'モード変更に失敗しました';
        this.showNotification(notification);
    }

    private showModeUnlockSuccess(): void {
        const notification = this.domManager.createElement('div');
        notification.className = 'mode-feedback success';
        notification.textContent = 'モードを解除しました！';
        this.showNotification(notification);
    }

    private showModeUnlockError(): void {
        const notification = this.domManager.createElement('div');
        notification.className = 'mode-feedback error';
        notification.textContent = 'モード解除に失敗しました';
        this.showNotification(notification);
    }

    private showNotification(notification: HTMLElement): void {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(notification);

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
        // ボタンイベントを再設定
        setTimeout(() => this.setupModeButtons(), 0);
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
}
