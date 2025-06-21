/**
 * シンプルなReact統合UIマネージャー
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';

import { SafeProgressDisplay } from '../components/ui/lazy/LazyComponents';
import { UpgradeShop } from '../components/ui/UpgradeShop';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';
import { ProgressManager } from '../progression/managers/ProgressManager';
import { getElementOrThrow } from '../utils/DOMUtils';
import type { WeaponManager } from '../weapons/managers/WeaponManager';

/**
 * シンプルなReact統合UIマネージャー
 */
export class ReactLazyUIManager {
  private roots: Map<string, Root> = new Map();
  private activeUI: string | null = null;

  private progressDisplayBtn!: HTMLElement;
  private upgradeShopBtn!: HTMLElement;

  constructor(
    private eventEmitter: EventEmitter<EventMap>,
    private progressManager: ProgressManager,
    private weaponManager?: WeaponManager
  ) {
    this.initializeButtons();
    this.initializeReactRoots();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
  }

  /**
   * ボタン要素を初期化
   */
  private initializeButtons(): void {
    try {
      this.progressDisplayBtn = getElementOrThrow('progress-display-btn');
    } catch (_error) {
      console.warn('Progress display button not found, UI will be limited');
    }

    try {
      this.upgradeShopBtn = getElementOrThrow('upgrade-shop-btn');
    } catch (_error) {
      console.warn('Upgrade shop button not found, UI will be limited');
    }
  }

  /**
   * React Rootを初期化
   */
  private initializeReactRoots(): void {
    try {
      const container = getElementOrThrow('progress-display-container');
      const root = createRoot(container);
      this.roots.set('progress-display-container', root);
    } catch (_error) {
      console.warn('Progress display container not found');
    }

    try {
      const container = getElementOrThrow('upgrade-shop-container');
      const root = createRoot(container);
      this.roots.set('upgrade-shop-container', root);
    } catch (_error) {
      console.warn('Upgrade shop container not found');
    }
  }

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    if (this.progressDisplayBtn) {
      this.progressDisplayBtn.addEventListener('click', () =>
        this.toggleProgressDisplay()
      );
    }

    if (this.upgradeShopBtn) {
      this.upgradeShopBtn.addEventListener('click', () =>
        this.toggleUpgradeShop()
      );
    }

    this.eventEmitter.on('profileUpdated', () => this.handleProfileUpdate());
  }

  /**
   * キーボードショートカットを設定
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'p':
          event.preventDefault();
          this.toggleProgressDisplay();
          break;
        case 'u':
          event.preventDefault();
          this.toggleUpgradeShop();
          break;
        case 'escape':
          event.preventDefault();
          this.hideAllUIs();
          break;
      }
    });
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
   * アップグレードショップの表示/非表示を切り替え
   */
  public toggleUpgradeShop(): void {
    console.log('🔫 ショップボタンがクリックされました');
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
          onClose: () => this.hideAllUIs(),
        })
      );
    }
  }

  /**
   * アップグレードショップを表示
   */
  private showUpgradeShop(): void {
    console.log('🔫 ショップ表示を試行中:', {
      hasWeaponManager: !!this.weaponManager,
      hasRoot: !!this.roots.get('upgrade-shop-container'),
    });

    const root = this.roots.get('upgrade-shop-container');
    if (root && this.weaponManager) {
      const profile = this.progressManager.getProfile();

      root.render(
        React.createElement(UpgradeShop, {
          isVisible: true,
          playerProfile: profile,
          availableUpgrades: [], // 空の配列（武器カテゴリのみ使用）
          onClose: () => this.hideAllUIs(),
          onPurchase: () => Promise.resolve(false), // ダミー実装
          weaponManager: this.weaponManager,
        })
      );
    } else {
      console.error('🔫 ショップ表示に失敗:', {
        hasRoot: !!root,
        hasWeaponManager: !!this.weaponManager,
      });
    }
  }

  /**
   * 全てのUIを非表示にする
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

    if (activeUIName === 'progress-display' && this.progressDisplayBtn) {
      this.progressDisplayBtn.classList.add('active');
    }
    if (activeUIName === 'upgrade-shop' && this.upgradeShopBtn) {
      this.upgradeShopBtn.classList.add('active');
    }
  }

  /**
   * 全てのボタンの状態をリセット
   */
  private resetButtonStates(): void {
    this.progressDisplayBtn?.classList.remove('active');
    this.upgradeShopBtn?.classList.remove('active');
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

  /**
   * WeaponManagerを設定
   */
  public setWeaponManager(weaponManager: WeaponManager): void {
    this.weaponManager = weaponManager;
  }

  /**
   * WeaponManagerを取得
   */
  public getWeaponManager(): WeaponManager | undefined {
    return this.weaponManager;
  }
}
