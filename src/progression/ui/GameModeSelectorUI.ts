import { IDOMManager } from '../../interfaces/IDOMManager.js';
import { GameModeManager } from '../managers/GameModeManager.js';
import { ProgressManager } from '../managers/ProgressManager.js';
import { GameMode } from '../types/GameMode.js';
import { EventEmitter } from '../../events/EventEmitter.js';
import { EventMap } from '../../events/EventType.js';

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
        const selector = this.domManager.createElement('div');
        selector.id = 'game-mode-selector';
        selector.className = 'game-mode-selector hidden';

        selector.innerHTML = `
            <div class="selector-header">
                <div class="selector-title">
                    <h2>🎮 ゲームモード選択</h2>
                    <button class="close-button" id="close-selector">×</button>
                </div>
                <div class="current-mode" id="current-mode">
                    <span class="mode-label">現在のモード:</span>
                    <span class="mode-name">Normal</span>
                </div>
            </div>
            <div class="mode-list" id="mode-list"></div>
        `;

        this.modeListElement = selector.querySelector('#mode-list');
        this.currentModeElement = selector.querySelector('#current-mode .mode-name');

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

        const modeDiv = this.domManager.createElement('div');
        modeDiv.className = `mode-item ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''}`;
        modeDiv.setAttribute('data-mode-id', mode.id);

        const difficultyIcon = this.getDifficultyIcon(mode.id);
        const modifiersText = this.getModifiersText(mode);

        modeDiv.innerHTML = `
            <div class="mode-header">
                <div class="mode-info">
                    <div class="mode-title">
                        <span class="mode-icon">${difficultyIcon}</span>
                        <h3 class="mode-name">${mode.name}</h3>
                        ${isCurrent ? '<span class="current-badge">選択中</span>' : ''}
                        ${!isUnlocked ? '<span class="locked-badge">🔒</span>' : ''}
                    </div>
                    <p class="mode-description">${mode.description}</p>
                </div>
                <div class="mode-stats">
                    <div class="stat-item">
                        <span class="stat-label">プレイ回数</span>
                        <span class="stat-value">${stats.gamesPlayed}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">最高スコア</span>
                        <span class="stat-value">${stats.highScore.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            <div class="mode-details">
                <div class="mode-modifiers">
                    <h4>モード効果:</h4>
                    ${modifiersText}
                </div>
                <div class="mode-reward">
                    <span class="reward-multiplier">報酬倍率: ×${mode.rewardMultiplier}</span>
                </div>
            </div>
            <div class="mode-footer">
                ${this.createModeButton(mode, isUnlocked, isCurrent)}
            </div>
        `;

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
        const notification = this.domManager.createElement('div');
        notification.className = 'mode-notification success';

        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">🎮</div>
                <div class="notification-text">
                    <h4>ゲームモード変更</h4>
                    <p>${previousMode.name} → ${newMode.name}</p>
                </div>
            </div>
        `;

        this.showNotification(notification);
    }

    private showModeUnlockedNotification(gameMode: GameMode): void {
        const notification = this.domManager.createElement('div');
        notification.className = 'mode-notification unlock';

        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">🔓</div>
                <div class="notification-text">
                    <h4>新モード解除！</h4>
                    <p>${gameMode.name}が利用可能になりました</p>
                </div>
            </div>
        `;

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
