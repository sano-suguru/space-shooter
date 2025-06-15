import { GameConfig, createGameConfig } from '../config/GameConfigFactory';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';
import { DeviceDetector } from '../utils/DeviceDetector';

export class UIManager {
  private config: GameConfig;
  private isMobile: boolean;
  private mobileControlsContainer: HTMLElement | null = null;
  private virtualJoystickContainer: HTMLElement | null = null;
  private touchActionButtons: HTMLElement | null = null;

  constructor(
    private eventEmitter: EventEmitter<EventMap>,
    private scoreElement: HTMLElement,
    private levelElement: HTMLElement,
    private healthElement: HTMLElement,
    private healthBarElement: HTMLElement,
    private gameOverElement: HTMLElement,
    config?: GameConfig
  ) {
    // 設定注入対応（後方互換性を保持）
    this.config = config ?? createGameConfig();
    this.isMobile = DeviceDetector.isMobile();
    this.setupEventListeners();
    this.initializeMobileUI();
  }

  private setupEventListeners(): void {
    this.eventEmitter.on('scoreUpdated', (score: number) =>
      this.updateScoreDisplay(score)
    );
    this.eventEmitter.on('healthChanged', (health: number) =>
      this.updateHealthDisplay(health)
    );
    this.eventEmitter.on('levelUpdated', (level: number) =>
      this.updateLevelDisplay(level)
    );
    this.eventEmitter.on('gameOver', () => this.showGameOver());
  }

  updateScoreDisplay(score: number): void {
    this.scoreElement.textContent = score.toString();
  }

  updateLevelDisplay(level: number): void {
    this.levelElement.textContent = level.toString();
  }

  updateHealthDisplay(health: number): void {
    this.healthElement.textContent = health.toString();
    const healthPercentage = (health / this.config.player.maxHealth) * 100;
    this.healthBarElement.style.width = `${healthPercentage}%`;
  }

  showGameOver(): void {
    this.gameOverElement.classList.remove('hidden');
  }

  /**
   * 設定を取得（テスト用）
   */
  /**
   * モバイルUI初期化
   */
  private initializeMobileUI(): void {
    if (!this.isMobile) return;

    this.createMobileControlsContainer();
    this.createTouchActionButtons();
    this.adjustUIForMobile();
  }

  /**
   * モバイルコントロールコンテナ作成
   */
  private createMobileControlsContainer(): void {
    this.mobileControlsContainer = document.createElement('div');
    this.mobileControlsContainer.className = 'mobile-controls';
    this.mobileControlsContainer.id = 'mobile-controls';
    document.body.appendChild(this.mobileControlsContainer);

    // 仮想ジョイスティック用コンテナ
    this.virtualJoystickContainer = document.createElement('div');
    this.virtualJoystickContainer.className = 'virtual-joystick-container';
    this.virtualJoystickContainer.id = 'virtual-joystick-container';
    this.mobileControlsContainer.appendChild(this.virtualJoystickContainer);
  }

  /**
   * タッチアクションボタン作成
   */
  private createTouchActionButtons(): void {
    this.touchActionButtons = document.createElement('div');
    this.touchActionButtons.className = 'touch-action-buttons';
    this.touchActionButtons.id = 'touch-action-buttons';

    // 射撃ボタン
    const shootButton = document.createElement('button');
    shootButton.className = 'touch-action-btn shoot';
    shootButton.innerHTML = '🔥';
    shootButton.setAttribute('aria-label', '射撃');
    shootButton.addEventListener(
      'touchstart',
      this.handleShootStart.bind(this),
      {
        passive: false,
      }
    );
    shootButton.addEventListener('touchend', this.handleShootEnd.bind(this), {
      passive: false,
    });

    // 特殊攻撃ボタン
    const specialButton = document.createElement('button');
    specialButton.className = 'touch-action-btn special';
    specialButton.innerHTML = '⚡';
    specialButton.setAttribute('aria-label', '特殊攻撃');
    specialButton.addEventListener(
      'touchstart',
      this.handleSpecialStart.bind(this),
      { passive: false }
    );
    specialButton.addEventListener(
      'touchend',
      this.handleSpecialEnd.bind(this),
      {
        passive: false,
      }
    );

    this.touchActionButtons.appendChild(shootButton);
    this.touchActionButtons.appendChild(specialButton);
    document.body.appendChild(this.touchActionButtons);
  }

  /**
   * モバイル用UI調整
   */
  private adjustUIForMobile(): void {
    // ゲームコンテナの調整
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.style.width = '100vw';
      gameContainer.style.height = '100vh';
      gameContainer.style.borderRadius = '0';
    }

    // キャンバスの調整
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.borderRadius = '0';
      canvas.style.border = 'none';
    }

    // プログレッションメニューの調整
    const progressionMenu = document.getElementById('progression-menu');
    if (progressionMenu) {
      progressionMenu.classList.add('mobile-optimized');
    }

    // デスクトップ専用要素を非表示
    document.body.classList.add('mobile-device');
  }

  /**
   * 射撃ボタン開始処理
   */
  private handleShootStart(event: TouchEvent): void {
    event.preventDefault();
    this.eventEmitter.emit('mobileShootStart');
  }

  /**
   * 射撃ボタン終了処理
   */
  private handleShootEnd(event: TouchEvent): void {
    event.preventDefault();
    this.eventEmitter.emit('mobileShootEnd');
  }

  /**
   * 特殊攻撃ボタン開始処理
   */
  private handleSpecialStart(event: TouchEvent): void {
    event.preventDefault();
    this.eventEmitter.emit('mobileSpecialStart');
  }

  /**
   * 特殊攻撃ボタン終了処理
   */
  private handleSpecialEnd(event: TouchEvent): void {
    event.preventDefault();
    this.eventEmitter.emit('mobileSpecialEnd');
  }

  /**
   * 仮想ジョイスティックコンテナを取得
   */
  public getVirtualJoystickContainer(): HTMLElement | null {
    return this.virtualJoystickContainer;
  }

  /**
   * モバイルコントロールの表示/非表示
   */
  public setMobileControlsVisible(visible: boolean): void {
    if (!this.isMobile || !this.mobileControlsContainer) return;

    if (visible) {
      this.mobileControlsContainer.classList.add('active');
    } else {
      this.mobileControlsContainer.classList.remove('active');
    }
  }

  /**
   * プログレッションメニューのモバイル最適化
   */
  public optimizeProgressionMenuForMobile(): void {
    if (!this.isMobile) return;

    const progressionContainers = [
      'upgrade-shop-container',
      'achievement-panel-container',
      'game-mode-selector-container',
      'progress-display-container',
    ];

    progressionContainers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        container.classList.add('mobile-optimized');
      }
    });
  }

  /**
   * モバイルデバイス判定
   */
  public isMobileDevice(): boolean {
    return this.isMobile;
  }

  /**
   * 設定を取得（テスト用）
   */
  public getConfig(): GameConfig {
    return this.config;
  }

  /**
   * リソースクリーンアップ
   */
  public dispose(): void {
    if (this.mobileControlsContainer?.parentNode) {
      this.mobileControlsContainer.parentNode.removeChild(
        this.mobileControlsContainer
      );
    }
    if (this.touchActionButtons?.parentNode) {
      this.touchActionButtons.parentNode.removeChild(this.touchActionButtons);
    }
  }
}
