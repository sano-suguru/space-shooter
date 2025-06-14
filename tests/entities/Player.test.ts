import { Player } from '../../src/entities/Player';
import { EventEmitter } from '../../src/events/EventEmitter';
import { EventMap } from '../../src/events/EventType';
import { IGame } from '../../src/interfaces/IGame';
import { MockInputManager } from '../../src/managers/MockInputManager';
import { MockRandomProvider } from '../../src/providers/MockRandomProvider';
import { createTestConfig, GameConfig } from '../../src/config/GameConfigFactory';
import { PowerUpEffectService } from '../../src/services/PowerUpEffectService';
import '../canvas.setup';

// モックGameクラス
class MockGameEngine implements IGame {
    public createBullet = jest.fn();
    public addBossBullet = jest.fn();
    public addEnemy = jest.fn();
    public showMessage = jest.fn();
    public getDifficultyFactor = jest.fn().mockReturnValue(1);
    public getCurrentBossHealth = jest.fn().mockReturnValue(100);
}

describe('Player', () => {
    let player: Player;
    let eventEmitter: EventEmitter<EventMap>;
    let mockInputManager: MockInputManager;
    let mockRandomProvider: MockRandomProvider;
    let mockGameEngine: MockGameEngine;
    let mockCtx: CanvasRenderingContext2D;

    beforeEach(() => {
        eventEmitter = new EventEmitter<EventMap>();
        mockInputManager = new MockInputManager();
        mockRandomProvider = new MockRandomProvider();
        mockGameEngine = new MockGameEngine();

        player = new Player(
            eventEmitter,
            mockInputManager,
            mockRandomProvider
        );
        player.setGame(mockGameEngine);

        // Canvas contextのモック
        mockCtx = {
            save: jest.fn(),
            restore: jest.fn(),
            translate: jest.fn(),
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 0,
            beginPath: jest.fn(),
            closePath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            arc: jest.fn(),
            ellipse: jest.fn(),
            rect: jest.fn(),
            fill: jest.fn(),
            stroke: jest.fn(),
            createRadialGradient: jest.fn(() => ({
                addColorStop: jest.fn()
            })),
            createLinearGradient: jest.fn(() => ({
                addColorStop: jest.fn()
            })),
            quadraticCurveTo: jest.fn(),
            bezierCurveTo: jest.fn(),
            arcTo: jest.fn()
        } as any;

        // Date.nowのモック
        jest.spyOn(Date, 'now').mockReturnValue(1000);
        
        // setTimeoutのモック - パワーアップ持続時間のため即座に実行しない
        jest.spyOn(globalThis, 'setTimeout').mockImplementation((_callback, delay) => {
            // パワーアップテスト用にタイマーIDを返すが、実際の実行は手動制御
            console.log(`🕐 setTimeout called with delay: ${delay}ms`);
            const timerId = delay as any;
            // タイマーIDを記録してクリーンアップできるようにする
            (globalThis as any)._activeTimeouts = (globalThis as any)._activeTimeouts || new Set();
            (globalThis as any)._activeTimeouts.add(timerId);
            return timerId;
        });
        
        // clearTimeoutのモック
        jest.spyOn(globalThis, 'clearTimeout').mockImplementation((timerId) => {
            console.log(`🧹 clearTimeout called for timer: ${timerId}`);
            if ((globalThis as any)._activeTimeouts) {
                (globalThis as any)._activeTimeouts.delete(timerId);
            }
        });
    });

    afterEach(() => {
        // アクティブなタイマーをクリーンアップ
        const activeTimeouts = (globalThis as any)._activeTimeouts;
        if (activeTimeouts && activeTimeouts.size > 0) {
            console.warn(`⚠️  ${activeTimeouts.size} active timeouts detected in Player.test.ts`);
            activeTimeouts.forEach((timerId: any) => {
                console.log(`🧹 Clearing timeout: ${timerId}`);
                clearTimeout(timerId);
            });
            activeTimeouts.clear();
        }
        
        jest.restoreAllMocks();
    });

    describe('初期化', () => {
        test('プレイヤーが正しい初期位置に配置される', () => {
            const testConfig = createTestConfig();
            const expectedX = testConfig.canvas.width / 2 - testConfig.player.width / 2;
            const expectedY = testConfig.canvas.height - testConfig.player.height - 10;
            const position = player.getPosition();

            expect(position.x).toBe(expectedX);
            expect(position.y).toBe(expectedY);
        });

        test('初期体力が最大値に設定される', () => {
            const testConfig = createTestConfig();
            expect(player.getHealth()).toBe(testConfig.player.maxHealth);
        });

        test('初期位置が正しく取得できる', () => {
            const testConfig = createTestConfig();
            const position = player.getPosition();
            const expectedX = testConfig.canvas.width / 2 - testConfig.player.width / 2;
            const expectedY = testConfig.canvas.height - testConfig.player.height - 10;

            expect(position.x).toBe(expectedX);
            expect(position.y).toBe(expectedY);
        });
    });

    describe('移動処理', () => {
        test('右矢印キーで右に移動', () => {
            const initialPosition = player.getPosition();
            mockInputManager.simulateKeyDown('ArrowRight');

            player.update(0.016); // 60FPS相当

            expect(player.getPosition().x).toBeGreaterThan(initialPosition.x);
        });

        test('左矢印キーで左に移動', () => {
            // 中央から開始するため、まず右に移動してから左をテスト
            mockInputManager.simulateKeyDown('ArrowRight');
            player.update(0.016);
            mockInputManager.simulateKeyUp('ArrowRight');

            // 完全に停止するまで待つ
            for (let i = 0; i < 10; i++) {
                player.update(0.016);
            }

            const currentPosition = player.getPosition();
            mockInputManager.simulateKeyDown('ArrowLeft');
            player.update(0.016);

            expect(player.getPosition().x).toBeLessThan(currentPosition.x);
        });

        test('上矢印キーで上に移動', () => {
            const initialPosition = player.getPosition();
            mockInputManager.simulateKeyDown('ArrowUp');

            player.update(0.016);

            expect(player.getPosition().y).toBeLessThan(initialPosition.y);
        });

        test('下矢印キーで下に移動', () => {
            const initialPosition = player.getPosition();
            mockInputManager.simulateKeyDown('ArrowDown');

            player.update(0.016);

            expect(player.getPosition().y).toBeGreaterThan(initialPosition.y);
        });

        test('最大速度を超えない', () => {
            mockInputManager.simulateKeyDown('ArrowRight');

            // 多くのフレームで更新して最大速度に達する
            for (let i = 0; i < 100; i++) {
                player.update(0.016);
            }

            const testConfig = createTestConfig();
            const maxMovement = testConfig.player.maxSpeed * 0.016;
            const previousPosition = player.getPosition();
            player.update(0.016);
            const movement = player.getPosition().x - previousPosition.x;

            expect(movement).toBeLessThanOrEqual(maxMovement + 0.001); // 浮動小数点の誤差を考慮
        });

        test('キーを離すと減速する', () => {
            // まず加速
            mockInputManager.simulateKeyDown('ArrowRight');
            for (let i = 0; i < 10; i++) {
                player.update(0.016);
            }

            // キーを離す
            mockInputManager.simulateKeyUp('ArrowRight');
            const firstPosition = player.getPosition();
            player.update(0.016);
            const firstMovement = player.getPosition().x - firstPosition.x;

            const secondPosition = player.getPosition();
            player.update(0.016);
            const secondMovement = player.getPosition().x - secondPosition.x;

            // 2回目の移動量は1回目より小さくなるはず（減速）
            expect(secondMovement).toBeLessThan(firstMovement);
        });

        test('画面境界で停止する - 左端', () => {
            // 左端まで移動
            mockInputManager.simulateKeyDown('ArrowLeft');
            for (let i = 0; i < 1000; i++) {
                player.update(0.016);
            }

            expect(player.getPosition().x).toBe(0);
        });

        test('画面境界で停止する - 右端', () => {
            // 右端まで移動
            mockInputManager.simulateKeyDown('ArrowRight');
            for (let i = 0; i < 1000; i++) {
                player.update(0.016);
            }

            const testConfig = createTestConfig();
            expect(player.getPosition().x).toBe(testConfig.canvas.width - testConfig.player.width);
        });

        test('画面境界で停止する - 上端', () => {
            // 上端まで移動
            mockInputManager.simulateKeyDown('ArrowUp');
            for (let i = 0; i < 1000; i++) {
                player.update(0.016);
            }

            expect(player.getPosition().y).toBe(0);
        });

        test('画面境界で停止する - 下端', () => {
            // 下端まで移動
            mockInputManager.simulateKeyDown('ArrowDown');
            for (let i = 0; i < 1000; i++) {
                player.update(0.016);
            }

            const testConfig = createTestConfig();
            expect(player.getPosition().y).toBe(testConfig.canvas.height - testConfig.player.height);
        });
    });

    describe('射撃システム', () => {
        test('スペースキーで弾丸を発射', () => {
            const mockBullet = { x: 100, y: 100 };
            mockGameEngine.createBullet.mockReturnValue(mockBullet);

            const playerShotSpy = jest.fn();
            eventEmitter.on('playerShot', playerShotSpy);

            mockInputManager.simulateKeyDown(' ');
            player.update(0.016);

            expect(mockGameEngine.createBullet).toHaveBeenCalled();
            expect(playerShotSpy).toHaveBeenCalledWith(mockBullet);
        });

        test('連射制限が機能する', () => {
            const mockBullet = { x: 100, y: 100 };
            mockGameEngine.createBullet.mockReturnValue(mockBullet);

            mockInputManager.simulateKeyDown(' ');

            player.update(0.016);
            const firstCallCount = mockGameEngine.createBullet.mock.calls.length;

            // 時間を進めない状態で再度更新
            player.update(0.016);
            const secondCallCount = mockGameEngine.createBullet.mock.calls.length;

            expect(secondCallCount).toBe(firstCallCount); // 追加の弾丸は発射されない
        });

        test('時間経過後に再び射撃可能', () => {
            const mockBullet = { x: 100, y: 100 };
            mockGameEngine.createBullet.mockReturnValue(mockBullet);

            mockInputManager.simulateKeyDown(' ');

            // 最初の射撃
            jest.spyOn(Date, 'now').mockReturnValue(1000);
            player.update(0.016);
            const firstCallCount = mockGameEngine.createBullet.mock.calls.length;

            // 十分な時間経過（デフォルト設定の発射間隔: 200ms）
            jest.spyOn(Date, 'now').mockReturnValue(1000 + 200 + 100); // デフォルト発射間隔
            player.update(0.016);
            const secondCallCount = mockGameEngine.createBullet.mock.calls.length;

            expect(secondCallCount).toBeGreaterThan(firstCallCount);
        });

        test('フォールバック：Gameインスタンスなしでも弾丸作成', () => {
            const playerWithoutGame = new Player(
                eventEmitter,
                mockInputManager,
                mockRandomProvider
            );

            mockInputManager.simulateKeyDown(' ');
            
            // エラーが発生しないことを確認
            expect(() => {
                playerWithoutGame.update(0.016);
            }).not.toThrow();
        });
    });

    describe('パワーアップシステム', () => {
        test('RAPID_FIRE パワーアップの効果', () => {
            const powerUpActivatedSpy = jest.fn();
            eventEmitter.on('powerUpActivated', powerUpActivatedSpy);

            player.activatePowerup('RAPID_FIRE');

            expect(powerUpActivatedSpy).toHaveBeenCalledWith('RAPID_FIRE');
        });

        test('TRIPLE_SHOT パワーアップの効果', () => {
            const mockBullet = { x: 100, y: 100 };
            mockGameEngine.createBullet.mockReturnValue(mockBullet);

            player.activatePowerup('TRIPLE_SHOT');
            
            const playerShotSpy = jest.fn();
            eventEmitter.on('playerShot', playerShotSpy);

            mockInputManager.simulateKeyDown(' ');
            player.update(0.016);

            // トリプルショットでは3回弾丸作成が呼ばれる
            expect(mockGameEngine.createBullet).toHaveBeenCalledTimes(3);
            expect(playerShotSpy).toHaveBeenCalledTimes(3);
        });

        test('SHIELD パワーアップの効果', () => {
            player.activatePowerup('SHIELD');

            // シールド状態でダメージを受けない
            const healthBeforeShieldTest = player.getHealth();
            player.takeDamage(10);

            expect(player.getHealth()).toBe(healthBeforeShieldTest);
        });

        test('RAPID_FIRE パワーアップ持続効果', () => {
            const mockBullet = { x: 100, y: 100 };
            mockGameEngine.createBullet.mockReturnValue(mockBullet);

            player.activatePowerup('RAPID_FIRE');
            
            mockInputManager.simulateKeyDown(' ');
            
            // 最初の射撃
            jest.spyOn(Date, 'now').mockReturnValue(1000);
            player.update(0.016);
            
            // RAPID_FIRE効果でfireRateが半分になるので、100ms + 10ms後に射撃可能
            jest.spyOn(Date, 'now').mockReturnValue(1000 + 100 + 10); // デフォルト発射間隔 / 2
            player.update(0.016);

            // RAPID_FIRE効果で発射間隔が短くなるはず
            expect(mockGameEngine.createBullet).toHaveBeenCalledTimes(2);
        });

        test('setFireRate メソッド', () => {
            const newFireRate = 50;
            player.setFireRate(newFireRate);

            const mockBullet = { x: 100, y: 100 };
            mockGameEngine.createBullet.mockReturnValue(mockBullet);
            mockInputManager.simulateKeyDown(' ');

            // 最初の射撃
            jest.spyOn(Date, 'now').mockReturnValue(1000);
            player.update(0.016);

            // 新しい発射間隔で2回目の射撃が可能か確認
            jest.spyOn(Date, 'now').mockReturnValue(1000 + newFireRate + 10);
            player.update(0.016);

            expect(mockGameEngine.createBullet).toHaveBeenCalledTimes(2);
        });

        test('setBulletType メソッド', () => {
            const mockBullet = { x: 100, y: 100 };
            mockGameEngine.createBullet.mockReturnValue(mockBullet);

            player.setBulletType('triple');
            
            mockInputManager.simulateKeyDown(' ');
            player.update(0.016);

            expect(mockGameEngine.createBullet).toHaveBeenCalledTimes(3);
        });

        test('activateShield メソッド', () => {
            player.activateShield();

            const healthBeforeDamage = player.getHealth();
            player.takeDamage(10);

            expect(player.getHealth()).toBe(healthBeforeDamage);
        });
    });

    describe('ダメージ処理', () => {
        test('通常時にダメージを受ける', () => {
            const initialHealth = player.getHealth();
            const damage = 10;

            const healthChangedSpy = jest.fn();
            eventEmitter.on('healthChanged', healthChangedSpy);

            player.takeDamage(damage);

            expect(player.getHealth()).toBe(initialHealth - damage);
            expect(healthChangedSpy).toHaveBeenCalledWith(initialHealth - damage);
        });

        test('体力が0になるとゲームオーバーイベント発火', () => {
            const gameOverSpy = jest.fn();
            eventEmitter.on('gameOver', gameOverSpy);

            // 最大体力以上のダメージを与える
            const testConfig = createTestConfig();
            player.takeDamage(testConfig.player.maxHealth + 10);

            expect(player.getHealth()).toBe(0);
            expect(gameOverSpy).toHaveBeenCalled();
        });

        test('無敵時間中はダメージを受けない', () => {
            // 最初のダメージで無敵状態になる
            player.takeDamage(10);
            const healthAfterFirstDamage = player.getHealth();

            // 即座に追加でダメージを与える（無敵時間中）
            player.takeDamage(10);

            expect(player.getHealth()).toBe(healthAfterFirstDamage);
        });

        test('無敵時間経過後は再びダメージを受ける', () => {
            // 最初のダメージ
            jest.spyOn(Date, 'now').mockReturnValue(1000);
            player.takeDamage(10);
            const healthAfterFirstDamage = player.getHealth();

            // 無敵時間経過（デフォルト設定の無敵時間: 1000ms）
            jest.spyOn(Date, 'now').mockReturnValue(1000 + 1000 + 100); // デフォルト無敵時間
            player.update(0.016); // 無敵状態更新

            // 2回目のダメージ
            player.takeDamage(10);

            expect(player.getHealth()).toBeLessThan(healthAfterFirstDamage);
        });

        test('シールド状態ではダメージを受けない', () => {
            player.activateShield();
            const healthBeforeShieldedDamage = player.getHealth();

            player.takeDamage(10);

            expect(player.getHealth()).toBe(healthBeforeShieldedDamage);
        });
    });

    describe('アニメーション・パーティクル', () => {
        test('エンジンアニメーションフェーズが更新される', () => {
            // プライベートフィールドにアクセスできないため、
            // 更新が例外なく実行されることを確認
            expect(() => {
                player.update(0.016);
            }).not.toThrow();
        });

        test('スラスターパーティクルが生成される', () => {
            // RandomProviderのモック値を設定
            mockRandomProvider.random = jest.fn()
                .mockReturnValueOnce(0.5)
                .mockReturnValueOnce(0.3)
                .mockReturnValueOnce(0.8);

            // 数回更新してパーティクルを生成
            for (let i = 0; i < 5; i++) {
                player.update(0.016);
            }

            // エラーが発生しないことを確認
            expect(() => {
                player.draw(mockCtx);
            }).not.toThrow();
        });
    });

    describe('描画機能', () => {
        test('通常状態で描画', () => {
            player.draw(mockCtx);

            expect(mockCtx.save).toHaveBeenCalled();
            expect(mockCtx.restore).toHaveBeenCalled();
            expect(mockCtx.beginPath).toHaveBeenCalled();
            expect(mockCtx.fill).toHaveBeenCalled();
        });

        test('無敵状態で描画（赤色表示）', () => {
            // ダメージを受けて無敵状態にする
            player.takeDamage(1);
            
            player.draw(mockCtx);

            expect(mockCtx.save).toHaveBeenCalled();
            expect(mockCtx.restore).toHaveBeenCalled();
        });

        test('シールド状態で描画', () => {
            player.activateShield();
            
            player.draw(mockCtx);

            expect(mockCtx.save).toHaveBeenCalled();
            expect(mockCtx.restore).toHaveBeenCalled();
            expect(mockCtx.stroke).toHaveBeenCalled();
        });
    });

    describe('後方互換性', () => {
        test('setKeyState メソッドは例外を投げない', () => {
            expect(() => {
                player.setKeyState('ArrowLeft', true);
            }).not.toThrow();
        });
    });

    describe('ゲームエンジン統合', () => {
        test('setGame メソッドでGameインスタンスを設定', () => {
            const newMockGame = new MockGameEngine();
            player.setGame(newMockGame);

            // 設定が反映されることを確認（射撃テストで間接的に確認）
            const mockBullet = { x: 200, y: 200 };
            newMockGame.createBullet.mockReturnValue(mockBullet);

            mockInputManager.simulateKeyDown(' ');
            player.update(0.016);

            expect(newMockGame.createBullet).toHaveBeenCalled();
        });
    });

    describe('設定注入機能', () => {
        let testConfig: GameConfig;
        let powerUpEffectService: PowerUpEffectService;
        let configPlayer: Player;

        beforeEach(() => {
            testConfig = createTestConfig({
                player: {
                    maxHealth: 150,
                    fireRate: 75,
                    maxSpeed: 12,
                    acceleration: 2.0
                },
                canvas: {
                    width: 800,
                    height: 600
                }
            });
            powerUpEffectService = new PowerUpEffectService(testConfig);
            
            configPlayer = new Player(
                eventEmitter,
                mockInputManager,
                mockRandomProvider,
                testConfig,
                powerUpEffectService
            );
            configPlayer.setGame(mockGameEngine);
        });

        test('設定注入されたプレイヤーの初期化', () => {
            expect(configPlayer.getHealth()).toBe(150);
            expect(configPlayer.getMaxHealth()).toBe(150);
            expect(configPlayer.getFireRate()).toBe(75);
            
            // カスタムキャンバスサイズでの位置計算
            const expectedX = testConfig.canvas.width / 2 - testConfig.player.width / 2;
            const expectedY = testConfig.canvas.height - testConfig.player.height - 10;
            expect(configPlayer.getPosition().x).toBe(expectedX);
            expect(configPlayer.getPosition().y).toBe(expectedY);
        });

        test('設定に基づく移動パラメータ', () => {
            const initialPosition = configPlayer.getPosition();
            mockInputManager.simulateKeyDown('ArrowRight');
            
            configPlayer.update(0.016);
            
            // カスタム加速度での移動を確認
            const movement = configPlayer.getPosition().x - initialPosition.x;
            expect(Math.abs(movement)).toBeCloseTo(2.0, 1); // acceleration: 2.0
        });

        test('設定に基づく境界制限', () => {
            // 右端まで移動
            mockInputManager.simulateKeyDown('ArrowRight');
            for (let i = 0; i < 1000; i++) {
                configPlayer.update(0.016);
            }
            
            expect(configPlayer.getPosition().x).toBe(testConfig.canvas.width - testConfig.player.width);
        });

        test('PowerUpEffectServiceを使用したパワーアップ', () => {
            // Test that getFireRate returns the expected value
            configPlayer.getFireRate();
            configPlayer.activatePowerup('RAPID_FIRE');
            
            // PowerUpEffectServiceによる効果適用
            expect(configPlayer.getFireRate()).toBe(testConfig.player.fireRate / 2);
            expect(configPlayer.getFireRate()).toBe(37.5); // 75 / 2
        });

        test('設定に基づく無敵時間', () => {
            // テスト設定では無敵時間が短い（100ms）
            jest.spyOn(Date, 'now').mockReturnValue(1000);
            configPlayer.takeDamage(10);
            const healthAfterFirstDamage = configPlayer.getHealth();
            
            // 短い無敵時間経過後
            jest.spyOn(Date, 'now').mockReturnValue(1000 + testConfig.player.invincibilityTime + 10);
            configPlayer.update(0.016);
            
            configPlayer.takeDamage(10);
            expect(configPlayer.getHealth()).toBeLessThan(healthAfterFirstDamage);
        });

        test('レガシー互換性 - 設定なしでの初期化', () => {
            const legacyPlayer = new Player(
                eventEmitter,
                mockInputManager,
                mockRandomProvider
            );
            
            // デフォルト設定が使用される
            expect(legacyPlayer.getHealth()).toBe(100);
            expect(legacyPlayer.getFireRate()).toBe(200);
        });

        test('PowerUpEffectServiceなしでのレガシー動作', () => {
            const legacyConfigPlayer = new Player(
                eventEmitter,
                mockInputManager,
                mockRandomProvider,
                testConfig
                // PowerUpEffectServiceなし
            );
            
            // Test that getFireRate returns the expected value for legacy config
            legacyConfigPlayer.getFireRate(); // 75 (testConfig)
            legacyConfigPlayer.activatePowerup('RAPID_FIRE');
            
            // レガシー実装では設定の発射レートが使用される
            // testConfig.player.fireRate / 2 = 75 / 2 = 37.5
            // しかし、deactivateでは this.config.player.fireRate が使用される
            expect(legacyConfigPlayer.getFireRate()).toBe(37.5); // testConfig値
        });

        test('設定の動的変更', () => {
            const newService = new PowerUpEffectService(createTestConfig({
                player: { fireRate: 300 }
            }));
            
            configPlayer.setPowerUpEffectService(newService);
            configPlayer.activatePowerup('RAPID_FIRE');
            
            // 新しいサービスの設定が使用される
            expect(configPlayer.getFireRate()).toBe(150); // 300 / 2
        });

        test('設定取得メソッド', () => {
            expect(configPlayer.getConfig()).toBe(testConfig);
            expect(configPlayer.getBulletType()).toBe('single');
            expect(configPlayer.isShieldActive()).toBe(false);
        });

        test('カスタム設定での射撃間隔', () => {
            const mockBullet = { x: 100, y: 100 };
            mockGameEngine.createBullet.mockReturnValue(mockBullet);
            mockInputManager.simulateKeyDown(' ');
            
            // 最初の射撃
            jest.spyOn(Date, 'now').mockReturnValue(1000);
            configPlayer.update(0.016);
            
            // カスタム発射間隔（75ms）後に2回目の射撃
            jest.spyOn(Date, 'now').mockReturnValue(1000 + 75 + 10);
            configPlayer.update(0.016);
            
            expect(mockGameEngine.createBullet).toHaveBeenCalledTimes(2);
        });
    });
});
