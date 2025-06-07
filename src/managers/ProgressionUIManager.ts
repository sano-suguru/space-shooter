import { EventEmitter } from "../events/EventEmitter";
import { EventMap } from "../events/EventType";
import { IDOMManager } from "../interfaces/IDOMManager";
import { UpgradeShopUI } from "../progression/ui/UpgradeShopUI";
import { AchievementPanel } from "../progression/ui/AchievementPanel";
import { GameModeSelectorUI } from "../progression/ui/GameModeSelectorUI";
import { ProgressDisplayUI } from "../progression/ui/ProgressDisplayUI";
import { ProgressManager } from "../progression/managers/ProgressManager";
import { getElementOrThrow } from "../utils/DOMUtils";

/**
 * プログレッションUI要素へのアクセスと管理を担当するクラス
 * ボタンクリックとキーボードショートカットを処理し、各UIコンポーネントの表示/非表示を制御
 */
export class ProgressionUIManager {
    private upgradeShopUI!: UpgradeShopUI;
    private achievementPanel!: AchievementPanel;
    private gameModeSelector!: GameModeSelectorUI;
    private progressDisplay!: ProgressDisplayUI;

    // ボタン要素
    private upgradeShopBtn!: HTMLElement;
    private achievementPanelBtn!: HTMLElement;
    private gameModeBtn!: HTMLElement;
    private progressDisplayBtn!: HTMLElement;

    // UI状態管理
    private activeUI: string | null = null;

    constructor(
        private eventEmitter: EventEmitter<EventMap>,
        private domManager: IDOMManager,
        private progressManager: ProgressManager
    ) {
        this.initializeButtons();
        this.initializeUIComponents();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
    }

    /**
     * プログレッションUIコンポーネントを初期化
     */
    private initializeUIComponents(): void {
        // UIコンポーネントを初期化（独自にDOM要素を作成）
        this.upgradeShopUI = new UpgradeShopUI(
            this.domManager,
            this.progressManager.getUpgradeManager(),
            this.progressManager,
            this.eventEmitter
        );

        this.achievementPanel = new AchievementPanel(
            this.domManager,
            this.progressManager.getAchievementManager(),
            this.progressManager,
            this.eventEmitter
        );

        this.gameModeSelector = new GameModeSelectorUI(
            this.domManager,
            this.progressManager.getGameModeManager(),
            this.progressManager,
            this.eventEmitter
        );

        this.progressDisplay = new ProgressDisplayUI(
            this.domManager,
            this.progressManager,
            this.eventEmitter
        );

        // UIコンテナに追加
        this.appendUIToContainers();

        // 初期状態では全て非表示
        this.hideAllUIs();
    }

    /**
     * UIコンポーネントを適切なコンテナに追加
     */
    private appendUIToContainers(): void {
        const upgradeShopContainer = getElementOrThrow('upgrade-shop-container');
        const achievementPanelContainer = getElementOrThrow('achievement-panel-container');
        const gameModeContainer = getElementOrThrow('game-mode-selector-container');
        const progressDisplayContainer = getElementOrThrow('progress-display-container');

        upgradeShopContainer.appendChild(this.upgradeShopUI.getElement());
        achievementPanelContainer.appendChild(this.achievementPanel.getElement());
        gameModeContainer.appendChild(this.gameModeSelector.getElement());
        progressDisplayContainer.appendChild(this.progressDisplay.getElement());
    }

    /**
     * プログレッションボタン要素を初期化
     */
    private initializeButtons(): void {
        this.upgradeShopBtn = getElementOrThrow('upgrade-shop-btn');
        this.achievementPanelBtn = getElementOrThrow('achievement-panel-btn');
        this.gameModeBtn = getElementOrThrow('game-mode-btn');
        this.progressDisplayBtn = getElementOrThrow('progress-display-btn');
    }

    /**
     * イベントリスナーを設定
     */
    private setupEventListeners(): void {
        // ボタンクリックイベント
        this.upgradeShopBtn.addEventListener('click', () => this.toggleUpgradeShop());
        this.achievementPanelBtn.addEventListener('click', () => this.toggleAchievementPanel());
        this.gameModeBtn.addEventListener('click', () => this.toggleGameModeSelector());
        this.progressDisplayBtn.addEventListener('click', () => this.toggleProgressDisplay());

        // プログレッション関連イベント
        this.eventEmitter.on('profileUpdated', () => this.updateProgressDisplay());
        this.eventEmitter.on('achievementUnlocked', () => this.updateAchievementPanel());
        this.eventEmitter.on('gameModeChanged', () => this.updateGameModeSelector());
    }

    /**
     * キーボードショートカットを設定
     */
    private setupKeyboardShortcuts(): void {
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            // ゲーム中のみショートカットを有効化（他のUIが開いている時は無効）
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (event.key.toLowerCase()) {
                case 'u':
                    event.preventDefault();
                    this.toggleUpgradeShop();
                    break;
                case 'a':
                    event.preventDefault();
                    this.toggleAchievementPanel();
                    break;
                case 'm':
                    event.preventDefault();
                    this.toggleGameModeSelector();
                    break;
                case 'p':
                    event.preventDefault();
                    this.toggleProgressDisplay();
                    break;
                case 'escape':
                    event.preventDefault();
                    this.hideAllUIs();
                    break;
            }
        });
    }

    /**
     * アップグレードショップの表示/非表示を切り替え
     */
    public toggleUpgradeShop(): void {
        if (this.activeUI === 'upgrade-shop') {
            this.hideAllUIs();
        } else {
            this.hideAllUIs();
            this.upgradeShopUI.show();
            this.activeUI = 'upgrade-shop';
            this.updateButtonState('upgrade-shop');
        }
    }

    /**
     * 実績パネルの表示/非表示を切り替え
     */
    public toggleAchievementPanel(): void {
        if (this.activeUI === 'achievement-panel') {
            this.hideAllUIs();
        } else {
            this.hideAllUIs();
            this.achievementPanel.show();
            this.activeUI = 'achievement-panel';
            this.updateButtonState('achievement-panel');
        }
    }

    /**
     * ゲームモードセレクターの表示/非表示を切り替え
     */
    public toggleGameModeSelector(): void {
        if (this.activeUI === 'game-mode-selector') {
            this.hideAllUIs();
        } else {
            this.hideAllUIs();
            this.gameModeSelector.show();
            this.activeUI = 'game-mode-selector';
            this.updateButtonState('game-mode-selector');
        }
    }

    /**
     * 進行状況表示の表示/非表示を切り替え
     */
    public toggleProgressDisplay(): void {
        if (this.activeUI === 'progress-display') {
            this.hideAllUIs();
        } else {
            this.hideAllUIs();
            this.progressDisplay.show();
            this.activeUI = 'progress-display';
            this.updateButtonState('progress-display');
        }
    }

    /**
     * 全てのプログレッションUIを非表示にする
     */
    public hideAllUIs(): void {
        this.upgradeShopUI.hide();
        this.achievementPanel.hide();
        this.gameModeSelector.hide();
        this.progressDisplay.hide();
        this.activeUI = null;
        this.resetButtonStates();
    }

    /**
     * ボタンの状態を更新（アクティブ状態の視覚的表示）
     */
    private updateButtonState(activeUIName: string): void {
        this.resetButtonStates();
        
        switch (activeUIName) {
            case 'upgrade-shop':
                this.upgradeShopBtn.classList.add('active');
                break;
            case 'achievement-panel':
                this.achievementPanelBtn.classList.add('active');
                break;
            case 'game-mode-selector':
                this.gameModeBtn.classList.add('active');
                break;
            case 'progress-display':
                this.progressDisplayBtn.classList.add('active');
                break;
        }
    }

    /**
     * 全てのボタンの状態をリセット
     */
    private resetButtonStates(): void {
        this.upgradeShopBtn?.classList.remove('active');
        this.achievementPanelBtn?.classList.remove('active');
        this.gameModeBtn?.classList.remove('active');
        this.progressDisplayBtn?.classList.remove('active');
    }

    /**
     * 進行状況表示を更新
     */
    private updateProgressDisplay(): void {
        if (this.activeUI === 'progress-display') {
            this.progressDisplay.updateRealtime();
        }
    }

    /**
     * 実績パネルを更新
     */
    private updateAchievementPanel(): void {
        if (this.activeUI === 'achievement-panel') {
            // 実績パネルが開いている場合、自動的に更新
            this.achievementPanel.hide();
            this.achievementPanel.show();
        }
    }

    /**
     * ゲームモードセレクターを更新
     */
    private updateGameModeSelector(): void {
        if (this.activeUI === 'game-mode-selector') {
            // ゲームモードセレクターが開いている場合、自動的に更新
            this.gameModeSelector.hide();
            this.gameModeSelector.show();
        }
    }

    /**
     * プログレッションUIコンポーネントへの直接アクセス（テスト用）
     */
    public getUpgradeShopUI(): UpgradeShopUI {
        return this.upgradeShopUI;
    }

    public getAchievementPanel(): AchievementPanel {
        return this.achievementPanel;
    }

    public getGameModeSelector(): GameModeSelectorUI {
        return this.gameModeSelector;
    }

    public getProgressDisplay(): ProgressDisplayUI {
        return this.progressDisplay;
    }

    /**
     * 現在アクティブなUI名を取得
     */
    public getActiveUI(): string | null {
        return this.activeUI;
    }

    /**
     * 特定のUIが表示されているかチェック
     */
    public isUIVisible(uiName: string): boolean {
        return this.activeUI === uiName;
    }
}
