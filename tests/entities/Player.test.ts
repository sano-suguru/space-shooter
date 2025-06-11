import { Player } from '../../src/entities/Player';
import { EventEmitter } from '../../src/events/EventEmitter';
import { EventMap } from '../../src/events/EventType';
import { IGameEngine } from '../../src/interfaces/IGameEngine';
import { MockInputManager } from '../../src/managers/MockInputManager';
import { MockRandomProvider } from '../../src/providers/MockRandomProvider';
import { GAME_CONSTANTS } from '../../src/constants/GameConstants';
import '../canvas.setup';

// モックGameEngineクラス
class MockGameEngine implements IGameEngine {
    public createBullet = jest.fn();
    public addBossBullet = jest.fn();
    public getDifficultyFactor = jest.fn().mockReturnValue(1);
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
            return delay as any;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('初期化', () => {
        test('プレイヤーが正しい初期位置に配置される', () => {
            const expectedX = GAME_CONSTANTS.CANVAS.WIDTH / 2 - GAME_CONSTANTS.PLAYER.WIDTH / 2;
            const expectedY = GAME_CONSTANTS.CANVAS.HEIGHT - GAME_CONSTANTS.PLAYER.HEIGHT - 10;
            const position = player.getPosition();

            expect(position.x).toBe(expectedX);
            expect(position.y).toBe(expectedY);
        });

        test('初期体力が最大値に設定される', () => {
            expect(player.getHealth()).toBe(GAME_CONSTANTS.PLAYER.MAX_HEALTH);
        });

        test('初期位置が正しく取得できる', () => {
            const position = player.getPosition();
            const expectedX = GAME_CONSTANTS.CANVAS.WIDTH / 2 - GAME_CONSTANTS.PLAYER.WIDTH / 2;
            const expectedY = GAME_CONSTANTS.CANVAS.HEIGHT - GAME_CONSTANTS.PLAYER.HEIGHT - 10;

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

            const maxMovement = GAME_CONSTANTS.PLAYER.MAX_SPEED * 0.016;
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

            expect(player.getPosition().x).toBe(GAME_CONSTANTS.CANVAS.WIDTH - GAME_CONSTANTS.PLAYER.WIDTH);
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

            expect(player.getPosition().y).toBe(GAME_CONSTANTS.CANVAS.HEIGHT - GAME_CONSTANTS.PLAYER.HEIGHT);
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

            // 十分な時間経過
            jest.spyOn(Date, 'now').mockReturnValue(1000 + GAME_CONSTANTS.PLAYER.FIRE_RATE + 100);
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
            jest.spyOn(Date, 'now').mockReturnValue(1000 + GAME_CONSTANTS.PLAYER.FIRE_RATE / 2 + 10);
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
            player.takeDamage(GAME_CONSTANTS.PLAYER.MAX_HEALTH + 10);

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

            // 無敵時間経過
            jest.spyOn(Date, 'now').mockReturnValue(1000 + GAME_CONSTANTS.PLAYER.INVINCIBILITY_TIME + 100);
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
});
