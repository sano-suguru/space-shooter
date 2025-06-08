/**
 * React.lazy()システムとの統合を担当するUIマネージャー
 * Phase 4.4: Performance Testing and Integration
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { EventEmitter } from "../events/EventEmitter";
import { EventMap } from "../events/EventType";
import { ProgressManager } from "../progression/managers/ProgressManager";
import { getElementOrThrow } from "../utils/DOMUtils";
import { 
  SafeAchievementPanel, 
  SafeGameModeSelector, 
  SafeProgressDisplay, 
  SafeUpgradeShop,
  ComponentPreloader
} from "../components/ui/lazy/LazyComponents";

/**
 * React.lazy()コンポーネントを統合したUIマネージャー
 */
export class ReactLazyUIManager {
  private roots: Map<string, Root> = new Map();
  private activeUI: string | null = null;
  
  // ボタン要素
  private upgradeShopBtn!: HTMLElement;
  private achievementPanelBtn!: HTMLElement;
  private gameModeBtn!: HTMLElement;
  private progressDisplayBtn!: HTMLElement;

  constructor(
    private eventEmitter: EventEmitter<EventMap>,
    private progressManager: ProgressManager
  ) {
    this.initializeButtons();
    this.initializeReactRoots();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.preloadComponents();
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
   * React Rootを初期化
   */
  private initializeReactRoots(): void {
    const containers = [
      'upgrade-shop-container',
      'achievement-panel-container',
      'game-mode-selector-container',
      'progress-display-container'
    ];

    containers.forEach(containerId => {
      const container = getElementOrThrow(containerId);
      const root = createRoot(container);
      this.roots.set(containerId, root);
    });
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
    this.eventEmitter.on('profileUpdated', () => this.handleProfileUpdate());
    this.eventEmitter.on('achievementUnlocked', () => this.handleAchievementUnlock());
    this.eventEmitter.on('gameModeChanged', () => this.handleGameModeChange());
  }

  /**
   * キーボードショートカットを設定
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
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
   * コンポーネントを事前読み込み
   */
  private async preloadComponents(): Promise<void> {
    try {
      await ComponentPreloader.preloadAll();
      console.log('🚀 React.lazy() components preloaded successfully');
    } catch (error) {
      console.warn('Failed to preload components:', error);
    }
  }

  /**
   * アップグレードショップの表示/非表示を切り替え
   */
  public toggleUpgradeShop(): void {
    if (this.activeUI === 'upgrade-shop') {
      this.hideAllUIs();
    } else {
      this.hideAllUIs();
      this.showUpgradeShop();
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
      this.showAchievementPanel();
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
      this.showGameModeSelector();
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
      this.showProgressDisplay();
      this.activeUI = 'progress-display';
      this.updateButtonState('progress-display');
    }
  }

  /**
   * アップグレードショップを表示
   */
  private showUpgradeShop(): void {
    const root = this.roots.get('upgrade-shop-container');
    if (!root) {
      console.error('UpgradeShop container not found');
      return;
    }

    const profile = this.progressManager.getProfile();
    const upgradeManager = this.progressManager.getUpgradeManager();
    const availableUpgrades = upgradeManager.getAvailableUpgrades();
    
    console.log('🛒 Rendering UpgradeShop with data:');
    console.log('  Profile coins:', profile.coins);
    console.log('  Profile level:', profile.level);  
    console.log('  Available upgrades count:', availableUpgrades.length);
    console.log('  Available upgrades:', availableUpgrades.map(u => ({ id: u.id, name: u.name, category: u.category })));
    console.log('  Container element exists:', !!root);
    
    root.render(
      React.createElement(SafeUpgradeShop, {
        isVisible: true,
        playerProfile: profile,
        availableUpgrades: upgradeManager.getAvailableUpgrades(),
        onClose: () => {
          console.log('🛒 UpgradeShop close requested');
          this.hideAllUIs();
        },
        onPurchase: async (upgradeId: string): Promise<boolean> => {
          console.log('🛒 Purchase attempt:', upgradeId);
          try {
            const result = this.progressManager.purchaseUpgrade(upgradeId);
            console.log('🛒 Purchase result:', result);
            
            if (result.success) {
              // プロファイル更新後に再レンダリング
              setTimeout(() => {
                if (this.activeUI === 'upgrade-shop') {
                  this.showUpgradeShop();
                }
              }, 100);
            }
            
            return result.success;
          } catch (error) {
            console.error('🛒 Purchase error:', error);
            return false;
          }
        }
      })
    );
  }

  /**
   * 実績パネルを表示
   */
  private showAchievementPanel(): void {
    const root = this.roots.get('achievement-panel-container');
    if (root) {
      const profile = this.progressManager.getProfile();
      const achievementManager = this.progressManager.getAchievementManager();
      
      root.render(
        React.createElement(SafeAchievementPanel, {
          isVisible: true,
          playerProfile: profile,
          achievements: achievementManager.getDisplayAchievements(),
          onClose: () => this.hideAllUIs()
        })
      );
    }
  }

  /**
   * ゲームモードセレクターを表示
   */
  private showGameModeSelector(): void {
    const root = this.roots.get('game-mode-selector-container');
    if (root) {
      const profile = this.progressManager.getProfile();
      const gameModeManager = this.progressManager.getGameModeManager();
      
      root.render(
        React.createElement(SafeGameModeSelector, {
          isVisible: true,
          playerProfile: profile,
          gameModes: gameModeManager.getAllGameModes(),
          currentMode: gameModeManager.getCurrentGameMode(),
          onClose: () => this.hideAllUIs(),
          onModeSelect: (mode) => {
            gameModeManager.selectGameMode(mode.id);
            this.eventEmitter.emit('gameModeChanged', mode, gameModeManager.getCurrentGameMode());
          }
        })
      );
    }
  }

  /**
   * 進行状況表示を表示
   */
  private showProgressDisplay(): void {
    const root = this.roots.get('progress-display-container');
    if (root) {
      const profile = this.progressManager.getProfile();
      
      root.render(
        React.createElement(SafeProgressDisplay, {
          isVisible: true,
          playerProfile: profile,
          onClose: () => this.hideAllUIs()
        })
      );
    }
  }

  /**
   * 全てのプログレッションUIを非表示にする
   */
  public hideAllUIs(): void {
    this.roots.forEach(root => {
      root.render(null);
    });
    this.activeUI = null;
    this.resetButtonStates();
  }

  /**
   * ボタンの状態を更新
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
   * プロファイル更新の処理
   */
  private handleProfileUpdate(): void {
    if (this.activeUI === 'progress-display') {
      this.showProgressDisplay();
    }
    if (this.activeUI === 'upgrade-shop') {
      this.showUpgradeShop();
    }
  }

  /**
   * 実績解除の処理
   */
  private handleAchievementUnlock(): void {
    if (this.activeUI === 'achievement-panel') {
      this.showAchievementPanel();
    }
  }

  /**
   * ゲームモード変更の処理
   */
  private handleGameModeChange(): void {
    if (this.activeUI === 'game-mode-selector') {
      this.showGameModeSelector();
    }
  }

  /**
   * アクティブなUI名を取得
   */
  public getActiveUI(): string | null {
    return this.activeUI;
  }

  /**
   * リソースのクリーンアップ
   */
  public dispose(): void {
    this.roots.forEach(root => {
      root.unmount();
    });
    this.roots.clear();
  }
}
