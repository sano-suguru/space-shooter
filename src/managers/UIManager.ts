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

    // React版のMobileUIManagerが存在する場合は重複作成を避ける
    const existingMobileUI = document.getElementById('mobile-ui-container');
    if (existingMobileUI) {
      console.log(
        'React版MobileUIManagerが既に存在するため、重複作成をスキップします'
      );
      return;
    }

    // フォールバック用の基本的なモバイルUI調整のみ実行
    this.adjustUIForMobile();
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
   * 仮想ジョイスティックコンテナを取得（レガシー対応）
   */
  public getVirtualJoystickContainer(): HTMLElement | null {
    // React版MobileUIManagerを使用するため、nullを返す
    return null;
  }

  /**
   * モバイルコントロールの表示/非表示（レガシー対応）
   */
  public setMobileControlsVisible(visible: boolean): void {
    if (!this.isMobile) return;

    // React版MobileUIManagerが制御するため、ここでは何もしない
    console.log(`モバイルコントロール表示状態: ${visible ? '表示' : '非表示'}`);
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
