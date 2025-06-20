import { Game } from './core/Game';
import { Player } from './entities/Player';
import { EventEmitter } from './events/EventEmitter';
import { GameObjectFactory } from './factories/GameObjectFactory';
import { DOMManager, MessageManager } from './managers';
import { GameStateManager } from './managers/GameStateManager';
import { ReactLazyUIManager } from './managers/ReactLazyUIManager';
import { ScoreManager } from './managers/ScoreManager';
import { UIManager } from './managers/UIManager';
import { MobileUIIntegration } from './mobile/MobileUIManager';
import { ProgressManager } from './progression/managers/ProgressManager';
import { RealRandomProvider, RealTimeProvider } from './providers';
import { DeviceDetector } from './utils/DeviceDetector';
import { getElementOrThrow } from './utils/DOMUtils';
import { WeaponManager } from './weapons/managers/WeaponManager';

function initGame(): void {
  const canvas = getElementOrThrow<HTMLCanvasElement>('gameCanvas');
  const eventEmitter = new EventEmitter();
  const randomProvider = new RealRandomProvider();
  const timeProvider = new RealTimeProvider();

  // デバイスに応じた適切なInputManagerを選択
  const inputManager = DeviceDetector.getInputManager(canvas);

  const domManager = new DOMManager();
  const messageManager = new MessageManager(domManager, timeProvider);
  const player = new Player(eventEmitter, inputManager, randomProvider);
  const gameObjectFactory = new GameObjectFactory(randomProvider, eventEmitter);
  const scoreManager = new ScoreManager(eventEmitter);
  const stateManager = new GameStateManager(eventEmitter);

  // プログレッションシステムを初期化（ScoreManagerを渡してコンポジション実現）
  const progressManager = new ProgressManager(eventEmitter, scoreManager);

  // 武器システムを初期化
  const weaponManager = new WeaponManager(
    eventEmitter,
    progressManager.getProfile()
  );
  player.setWeaponManager(weaponManager);
  player.enableWeaponSystem(true);

  // 既存UIManagerを初期化
  const levelElement = getElementOrThrow<HTMLElement>('levelValue');
  const healthElement = getElementOrThrow<HTMLElement>('healthValue');
  const healthBarElement = getElementOrThrow<HTMLElement>('healthBarFill');
  const gameOverElement = getElementOrThrow<HTMLElement>('gameOver');
  const scoreElement = getElementOrThrow<HTMLElement>('scoreValue');
  new UIManager(
    eventEmitter,
    scoreElement,
    levelElement,
    healthElement,
    healthBarElement,
    gameOverElement
  );

  // React.lazy()システムを統合したUIManagerを初期化
  const reactLazyUIManager = new ReactLazyUIManager(
    eventEmitter,
    progressManager,
    weaponManager
  );
  console.log('🚀 ReactLazyUIManager initialized with code splitting');
  console.log('Active UI Manager:', reactLazyUIManager.getActiveUI());

  // モバイルUI統合システムを初期化
  const mobileUIIntegration = new MobileUIIntegration(eventEmitter, canvas);
  mobileUIIntegration.initialize();

  // デバイス情報をログ出力
  const deviceInfo = DeviceDetector.getDeviceInfo();
  console.log('🔧 Device Info:', deviceInfo);
  console.log('📱 Input Manager Type:', inputManager.constructor.name);

  const game = new Game(
    canvas,
    eventEmitter,
    scoreManager,
    player,
    gameObjectFactory,
    stateManager,
    inputManager,
    randomProvider,
    messageManager
  );

  // ゲーム終了時のクリーンアップ処理を追加
  const originalDispose = game.dispose?.bind(game);
  game.dispose = (): void => {
    mobileUIIntegration.dispose();
    if (originalDispose) {
      originalDispose();
    }
  };

  game.start();
}

function initApplication(): void {
  initGame(); // ゲーム初期化（React.lazy()システム統合済み）
}

document.addEventListener('DOMContentLoaded', initApplication);
