/**
 * シンプルなReact統合UIマネージャー
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';

import { SafeProgressDisplay } from '../components/ui/lazy/LazyComponents';
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
  }

  /**
   * 全てのボタンの状態をリセット
   */
  private resetButtonStates(): void {
    this.progressDisplayBtn?.classList.remove('active');
  }

  /**
   * プロファイル更新の処理
   */
  private handleProfileUpdate(): void {
    if (this.activeUI === 'progress-display') {
      this.showProgressDisplay();
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
