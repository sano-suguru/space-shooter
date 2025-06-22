import { Game } from './core/Game';
import { Player } from './entities/Player';
import { EventEmitter } from './events/EventEmitter';
import { EventMap } from './events/EventType';
import { GameObjectFactory } from './factories/GameObjectFactory';
import { IInputManager } from './interfaces/IInputManager';
import { DOMManager, MessageManager } from './managers';
import { GameStateManager } from './managers/GameStateManager';
import { InputManager } from './managers/InputManager';
import { ReactLazyUIManager } from './managers/ReactLazyUIManager';
import { ScoreManager } from './managers/ScoreManager';
import { UIManager } from './managers/UIManager';
import { ProgressManager } from './progression/managers/ProgressManager';
import { RealRandomProvider, RealTimeProvider } from './providers';
import { getElementOrThrow } from './utils/DOMUtils';
import { WeaponManager } from './weapons/managers/WeaponManager';

function initGame(): void {
  const canvas = getElementOrThrow<HTMLCanvasElement>('gameCanvas');
  const eventEmitter = new EventEmitter();
  const randomProvider = new RealRandomProvider();
  const timeProvider = new RealTimeProvider();

  // デスクトップ用InputManagerを使用
  const inputManager = new InputManager(canvas);

  const coreManagers = initializeCoreManagers(
    eventEmitter,
    timeProvider,
    inputManager,
    randomProvider
  );

  const weaponManager = initializeWeaponSystem(
    eventEmitter,
    coreManagers.progressManager,
    coreManagers.player
  );

  initializeUIManagers(
    eventEmitter,
    coreManagers.progressManager,
    weaponManager
  );

  const game = createGame(
    canvas,
    eventEmitter,
    coreManagers,
    inputManager,
    randomProvider,
    timeProvider
  );

  game.start();
}

function initializeCoreManagers(
  eventEmitter: EventEmitter<EventMap>,
  timeProvider: RealTimeProvider,
  inputManager: IInputManager,
  randomProvider: RealRandomProvider
): {
  domManager: DOMManager;
  messageManager: MessageManager;
  player: Player;
  gameObjectFactory: GameObjectFactory;
  scoreManager: ScoreManager;
  stateManager: GameStateManager;
  progressManager: ProgressManager;
} {
  const domManager = new DOMManager();
  const messageManager = new MessageManager(domManager, timeProvider);
  const player = new Player(eventEmitter, inputManager, randomProvider);
  const gameObjectFactory = new GameObjectFactory(randomProvider, eventEmitter);
  const scoreManager = new ScoreManager(eventEmitter);
  const stateManager = new GameStateManager(eventEmitter);
  const progressManager = new ProgressManager(eventEmitter, scoreManager);

  return {
    domManager,
    messageManager,
    player,
    gameObjectFactory,
    scoreManager,
    stateManager,
    progressManager,
  };
}

function initializeWeaponSystem(
  eventEmitter: EventEmitter<EventMap>,
  progressManager: ProgressManager,
  player: Player
): WeaponManager {
  const weaponManager = new WeaponManager(
    eventEmitter,
    progressManager.getProfile()
  );
  player.setWeaponManager(weaponManager);
  player.enableWeaponSystem(true);
  return weaponManager;
}

function initializeUIManagers(
  eventEmitter: EventEmitter<EventMap>,
  progressManager: ProgressManager,
  weaponManager: WeaponManager
): void {
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
}

function createGame(
  canvas: HTMLCanvasElement,
  eventEmitter: EventEmitter<EventMap>,
  managers: ReturnType<typeof initializeCoreManagers>,
  inputManager: IInputManager,
  randomProvider: RealRandomProvider,
  _timeProvider: RealTimeProvider
): Game {
  return new Game(
    canvas,
    eventEmitter,
    managers.scoreManager,
    managers.player,
    managers.gameObjectFactory,
    managers.stateManager,
    inputManager,
    randomProvider,
    managers.messageManager
  );
}

function initApplication(): void {
  initGame(); // ゲーム初期化（React.lazy()システム統合済み）
}

document.addEventListener('DOMContentLoaded', initApplication);
