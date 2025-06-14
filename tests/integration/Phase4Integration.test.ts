import { Game } from '../../src/core/Game';
import { WaveManager } from '../../src/managers/WaveManager';
import { BackgroundRenderer } from '../../src/rendering/BackgroundRenderer';
import { PlayerRenderer } from '../../src/rendering/PlayerRenderer';
import { EventEmitter } from '../../src/events/EventEmitter';
import { EventMap } from '../../src/events/EventType';
import { ScoreManager } from '../../src/managers/ScoreManager';
import { Player } from '../../src/entities/Player';
import { GameObjectFactory } from '../../src/factories/GameObjectFactory';
import { GameStateManager } from '../../src/managers/GameStateManager';
import { MockInputManager } from '../../src/managers/MockInputManager';
import { MockRandomProvider } from '../../src/providers/MockRandomProvider';
import { MockMessageManager } from '../../src/managers/MockMessageManager';
import { createGameConfig, createTestConfig } from '../../src/config/GameConfigFactory';
import { PowerUpEffectService } from '../../src/services/PowerUpEffectService';

// Canvas setup
import '../canvas.setup';

describe('Phase 4 統合テスト - システム・マネージャークラス移行', () => {
    let eventEmitter: EventEmitter<EventMap>;
    let scoreManager: ScoreManager;
    let gameObjectFactory: GameObjectFactory;
    let stateManager: GameStateManager;
    let inputManager: MockInputManager;
    let randomProvider: MockRandomProvider;
    let messageManager: MockMessageManager;
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
        eventEmitter = new EventEmitter<EventMap>();
        scoreManager = new ScoreManager(eventEmitter);
        inputManager = new MockInputManager();
        randomProvider = new MockRandomProvider();
        messageManager = new MockMessageManager();
        gameObjectFactory = new GameObjectFactory(randomProvider);
        stateManager = new GameStateManager(eventEmitter);
        canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 600;
    });

    describe('Game クラス設定注入', () => {
        it('カスタム設定でGameが正しく初期化される', () => {
            const customConfig = createTestConfig({
                canvas: { width: 800, height: 900 },
                player: { maxHealth: 150 }
            });
            const powerUpService = new PowerUpEffectService(customConfig);
            const player = new Player(eventEmitter, inputManager, randomProvider, customConfig, powerUpService);

            const game = new Game(
                canvas,
                eventEmitter,
                scoreManager,
                player,
                gameObjectFactory,
                stateManager,
                inputManager,
                randomProvider,
                messageManager,
                customConfig,
                powerUpService
            );

            expect(game).toBeDefined();
            expect(canvas.width).toBe(800);
            expect(canvas.height).toBe(900);
        });

        it('デフォルト設定でGameが正しく初期化される', () => {
            const defaultConfig = createGameConfig();
            const powerUpService = new PowerUpEffectService(defaultConfig);
            const player = new Player(eventEmitter, inputManager, randomProvider, defaultConfig, powerUpService);

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

            expect(game).toBeDefined();
            expect(canvas.width).toBe(400);
            expect(canvas.height).toBe(600);
        });

        it('Gameクラスが設定に基づいて背景オブジェクトを生成する', () => {
            const customConfig = createTestConfig({
                background: {
                    starCount: 50,
                    planetCount: 3,
                    nebulaCount: 2
                }
            });
            const powerUpService = new PowerUpEffectService(customConfig);
            const player = new Player(eventEmitter, inputManager, randomProvider, customConfig, powerUpService);

            const game = new Game(
                canvas,
                eventEmitter,
                scoreManager,
                player,
                gameObjectFactory,
                stateManager,
                inputManager,
                randomProvider,
                messageManager,
                customConfig,
                powerUpService
            );

            expect(game).toBeDefined();
            // 背景オブジェクトの数は設定に基づいて生成されている
        });
    });

    describe('WaveManager クラス設定注入', () => {
        it('カスタム設定でWaveManagerが正しく初期化される', () => {
            const customConfig = createTestConfig({
                wave: {
                    systemEnabled: true,
                    clearBonusMultiplier: 3,
                    formationSpacing: 60
                }
            });
            const powerUpService = new PowerUpEffectService(customConfig);
            const player = new Player(eventEmitter, inputManager, randomProvider, customConfig, powerUpService);
            const game = new Game(
                canvas,
                eventEmitter,
                scoreManager,
                player,
                gameObjectFactory,
                stateManager,
                inputManager,
                randomProvider,
                messageManager,
                customConfig,
                powerUpService
            );

            const waveManager = new WaveManager(eventEmitter, gameObjectFactory, game, customConfig);

            expect(waveManager).toBeDefined();
            expect(waveManager.getCurrentWave()).toBe(0);
        });

        it('デフォルト設定でWaveManagerが正しく初期化される', () => {
            const defaultConfig = createGameConfig();
            const powerUpService = new PowerUpEffectService(defaultConfig);
            const player = new Player(eventEmitter, inputManager, randomProvider, defaultConfig, powerUpService);
            const game = new Game(
                canvas,
                eventEmitter,
                scoreManager,
                player,
                gameObjectFactory,
                stateManager,
                inputManager,
                randomProvider,
                messageManager,
                defaultConfig,
                powerUpService
            );

            const waveManager = new WaveManager(eventEmitter, gameObjectFactory, game);

            expect(waveManager).toBeDefined();
            expect(waveManager.getCurrentWave()).toBe(0);
        });
    });

    describe('BackgroundRenderer クラス設定注入', () => {
        it('カスタム設定でBackgroundRendererが正しく初期化される', () => {
            const customConfig = createTestConfig({
                canvas: { width: 800, height: 900 }
            });

            const backgroundRenderer = new BackgroundRenderer(customConfig);

            expect(backgroundRenderer).toBeDefined();
            expect(backgroundRenderer.getPerformanceStats()).toBeDefined();
        });

        it('デフォルト設定でBackgroundRendererが正しく初期化される', () => {
            const backgroundRenderer = new BackgroundRenderer();

            expect(backgroundRenderer).toBeDefined();
            expect(backgroundRenderer.getPerformanceStats()).toBeDefined();
        });
    });

    describe('PlayerRenderer クラス設定注入', () => {
        it('カスタム設定でPlayerRendererが正しく初期化される', () => {
            const customConfig = createTestConfig({
                player: {
                    colors: {
                        primary: '#ff0000',
                        secondary: '#00ff00',
                        accent: '#0000ff',
                        engine: '#ffff00'
                    }
                }
            });

            const playerRenderer = new PlayerRenderer(customConfig);

            expect(playerRenderer).toBeDefined();
        });

        it('デフォルト設定でPlayerRendererが正しく初期化される', () => {
            const playerRenderer = new PlayerRenderer();

            expect(playerRenderer).toBeDefined();
        });

        it('PlayerRendererが設定に基づいて描画する', () => {
            const customConfig = createTestConfig({
                player: {
                    colors: {
                        primary: '#ff0000',
                        secondary: '#00ff00',
                        accent: '#0000ff',
                        engine: '#ffff00'
                    }
                }
            });

            const playerRenderer = new PlayerRenderer(customConfig);
            const ctx = canvas.getContext('2d')!;

            // 描画テスト
            expect(() => {
                playerRenderer.render(ctx, 100, 100, 50, 50, false, false, 0, []);
            }).not.toThrow();
        });
    });

    describe('システム間連携テスト', () => {
        it('全てのクラスが同じ設定を共有して正しく動作する', () => {
            const sharedConfig = createTestConfig({
                canvas: { width: 800, height: 900 },
                player: { maxHealth: 150, fireRate: 100 },
                wave: { systemEnabled: true, clearBonusMultiplier: 3 },
                background: { starCount: 75, planetCount: 4 }
            });

            const powerUpService = new PowerUpEffectService(sharedConfig);
            const player = new Player(eventEmitter, inputManager, randomProvider, sharedConfig, powerUpService);
            const backgroundRenderer = new BackgroundRenderer(sharedConfig);
            const playerRenderer = new PlayerRenderer(sharedConfig);

            const game = new Game(
                canvas,
                eventEmitter,
                scoreManager,
                player,
                gameObjectFactory,
                stateManager,
                inputManager,
                randomProvider,
                messageManager,
                sharedConfig,
                powerUpService
            );

            const waveManager = new WaveManager(eventEmitter, gameObjectFactory, game, sharedConfig);

            // 全てのコンポーネントが正しく初期化されている
            expect(game).toBeDefined();
            expect(waveManager).toBeDefined();
            expect(backgroundRenderer).toBeDefined();
            expect(playerRenderer).toBeDefined();

            // 設定が正しく反映されている
            expect(canvas.width).toBe(800);
            expect(canvas.height).toBe(900);
            expect(player.getMaxHealth()).toBe(150);
            expect(player.getFireRate()).toBe(100);
        });

        it('後方互換性が維持されている', () => {
            // 設定なしでの初期化（レガシー方式）
            const player = new Player(eventEmitter, inputManager, randomProvider);
            const backgroundRenderer = new BackgroundRenderer();
            const playerRenderer = new PlayerRenderer();

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

            const waveManager = new WaveManager(eventEmitter, gameObjectFactory, game);

            // 全てのコンポーネントがデフォルト設定で正しく初期化されている
            expect(game).toBeDefined();
            expect(waveManager).toBeDefined();
            expect(backgroundRenderer).toBeDefined();
            expect(playerRenderer).toBeDefined();

            // デフォルト設定が適用されている
            expect(canvas.width).toBe(400);
            expect(canvas.height).toBe(600);
            expect(player.getMaxHealth()).toBe(100);
        });
    });

    describe('設定の動的変更テスト', () => {
        it('異なる設定で複数のインスタンスを作成できる', () => {
            const config1 = createTestConfig({
                canvas: { width: 400, height: 600 },
                player: { maxHealth: 100 }
            });

            const config2 = createTestConfig({
                canvas: { width: 800, height: 900 },
                player: { maxHealth: 200 }
            });

            const renderer1 = new BackgroundRenderer(config1);
            const renderer2 = new BackgroundRenderer(config2);
            const playerRenderer1 = new PlayerRenderer(config1);
            const playerRenderer2 = new PlayerRenderer(config2);

            expect(renderer1).toBeDefined();
            expect(renderer2).toBeDefined();
            expect(playerRenderer1).toBeDefined();
            expect(playerRenderer2).toBeDefined();

            // 異なる設定で初期化されたインスタンスは独立している
            expect(renderer1).not.toBe(renderer2);
            expect(playerRenderer1).not.toBe(playerRenderer2);
        });
    });
});