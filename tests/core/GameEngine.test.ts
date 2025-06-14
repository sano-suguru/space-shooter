import { GameEngine } from '../../src/core/GameEngine';
import '../canvas.setup';

describe('GameEngine', () => {
    let gameEngine: GameEngine;
    let mockUpdateCallback: jest.Mock;
    let mockDrawCallback: jest.Mock;
    let mockRequestAnimationFrame: jest.Mock;
    let mockCancelAnimationFrame: jest.Mock;

    beforeEach(() => {
        // コールバック関数のモック
        mockUpdateCallback = jest.fn();
        mockDrawCallback = jest.fn();

        // requestAnimationFrame と cancelAnimationFrame のモック
        mockRequestAnimationFrame = jest.fn();
        mockCancelAnimationFrame = jest.fn();

        // グローバル関数の置き換え
        (globalThis as any).requestAnimationFrame = mockRequestAnimationFrame;
        (globalThis as any).cancelAnimationFrame = mockCancelAnimationFrame;

        gameEngine = new GameEngine(mockUpdateCallback, mockDrawCallback);

        // アニメーションフレームIDを設定（連続的なIDを返すようにする）
        let frameId = 1;
        mockRequestAnimationFrame.mockImplementation((_callback: Function) => {
            const id = frameId++;
            console.log(`🎬 requestAnimationFrame called, assigned ID: ${id}`);
            // アクティブなフレームIDを記録
            (globalThis as any)._activeAnimationFrames = (globalThis as any)._activeAnimationFrames || new Set();
            (globalThis as any)._activeAnimationFrames.add(id);
            return id;
        });
        
        // cancelAnimationFrameのモック
        mockCancelAnimationFrame.mockImplementation((id: number) => {
            console.log(`🧹 cancelAnimationFrame called for ID: ${id}`);
            if ((globalThis as any)._activeAnimationFrames) {
                (globalThis as any)._activeAnimationFrames.delete(id);
            }
        });
    });

    afterEach(() => {
        // アクティブなアニメーションフレームをクリーンアップ
        const activeFrames = (globalThis as any)._activeAnimationFrames;
        if (activeFrames && activeFrames.size > 0) {
            console.warn(`⚠️  ${activeFrames.size} active animation frames detected in GameEngine.test.ts`);
            activeFrames.forEach((frameId: any) => {
                console.log(`🧹 Canceling animation frame: ${frameId}`);
                cancelAnimationFrame(frameId);
            });
            activeFrames.clear();
        }
        
        jest.restoreAllMocks();
    });

    describe('初期化', () => {
        test('GameEngineが正しく初期化される', () => {
            expect(gameEngine).toBeDefined();
            expect(gameEngine.isGameRunning()).toBe(false);
            expect(gameEngine.isGamePaused()).toBe(false);
            expect(gameEngine.getDeltaTime()).toBe(0);
        });

        test('デバッグ情報が初期状態で正しく取得できる', () => {
            const debugInfo = gameEngine.getDebugInfo();

            expect(debugInfo.isRunning).toBe(false);
            expect(debugInfo.isPaused).toBe(false);
            expect(debugInfo.deltaTime).toBe(0);
            expect(debugInfo.fps).toBe(0);
        });
    });

    describe('ゲームループ制御', () => {
        test('start()でゲームが開始される', () => {
            gameEngine.start();

            expect(gameEngine.isGameRunning()).toBe(true);
            expect(gameEngine.isGamePaused()).toBe(false);
            expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);
        });

        test('既に実行中の場合はstart()で何もしない', () => {
            gameEngine.start();
            mockRequestAnimationFrame.mockClear();

            gameEngine.start(); // 2回目の呼び出し

            expect(mockRequestAnimationFrame).not.toHaveBeenCalled();
        });

        test('pause()でゲームが一時停止される', () => {
            gameEngine.start();
            gameEngine.pause();

            expect(gameEngine.isGameRunning()).toBe(false);
            expect(gameEngine.isGamePaused()).toBe(true);
            expect(mockCancelAnimationFrame).toHaveBeenCalledTimes(1);
        });

        test('実行中でない場合はpause()で何もしない', () => {
            gameEngine.pause(); // 実行前に一時停止を試行

            expect(mockCancelAnimationFrame).not.toHaveBeenCalled();
        });

        test('既に一時停止中の場合はpause()で何もしない', () => {
            gameEngine.start();
            gameEngine.pause();
            mockCancelAnimationFrame.mockClear();

            gameEngine.pause(); // 2回目の一時停止

            expect(mockCancelAnimationFrame).not.toHaveBeenCalled();
        });

        test('resume()で一時停止から再開される', () => {
            gameEngine.start();
            gameEngine.pause();
            mockRequestAnimationFrame.mockClear();

            gameEngine.resume();

            expect(gameEngine.isGameRunning()).toBe(true);
            expect(gameEngine.isGamePaused()).toBe(false);
            expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);
        });

        test('実行中でない場合はresume()で何もしない', () => {
            gameEngine.resume(); // 実行前に再開を試行

            expect(mockRequestAnimationFrame).not.toHaveBeenCalled();
        });

        test('一時停止中でない場合はresume()で何もしない', () => {
            gameEngine.start();
            mockRequestAnimationFrame.mockClear();

            gameEngine.resume(); // 実行中に再開を試行

            expect(mockRequestAnimationFrame).not.toHaveBeenCalled();
        });

        test('stop()でゲームが停止される', () => {
            gameEngine.start();
            gameEngine.stop();

            expect(gameEngine.isGameRunning()).toBe(false);
            expect(gameEngine.isGamePaused()).toBe(false);
            expect(mockCancelAnimationFrame).toHaveBeenCalledTimes(1);
        });

        test('停止後にstart()で再開できる', () => {
            gameEngine.start();
            gameEngine.stop();
            mockRequestAnimationFrame.mockClear();

            gameEngine.start();

            expect(gameEngine.isGameRunning()).toBe(true);
            expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);
        });
    });

    describe('ゲームループ実行', () => {
        test('ゲームループでupdateCallbackが呼ばれる', () => {
            let gameLoopCallback: Function;
            mockRequestAnimationFrame.mockImplementation((callback: Function) => {
                gameLoopCallback = callback;
                return 1;
            });

            gameEngine.start();
            expect(mockRequestAnimationFrame).toHaveBeenCalled();

            // ゲームループを手動実行
            gameLoopCallback!(16.67); // 60FPS相当

            expect(mockUpdateCallback).toHaveBeenCalledTimes(1);
            expect(mockDrawCallback).toHaveBeenCalledTimes(1);
        });

        test('初回実行時のdeltaTimeは0', () => {
            let gameLoopCallback: Function;
            mockRequestAnimationFrame.mockImplementation((callback: Function) => {
                gameLoopCallback = callback;
                return 1;
            });

            gameEngine.start();
            gameLoopCallback!(16.67);

            expect(mockUpdateCallback).toHaveBeenCalledWith(0);
            expect(gameEngine.getDeltaTime()).toBe(0);
        });

        test('2回目以降はdeltaTimeが正しく計算される', () => {
            let gameLoopCallback: Function;
            mockRequestAnimationFrame.mockImplementation((callback: Function) => {
                gameLoopCallback = callback;
                return 1;
            });

            gameEngine.start();
            
            // 初回実行（lastTime = 0なので deltaTime = 0）
            gameLoopCallback!(1000); // 任意の値
            expect(mockUpdateCallback).toHaveBeenCalledWith(0);

            // 2回目実行（16.67ms後 = 60FPS）
            gameLoopCallback!(1016.67);
            expect(mockUpdateCallback.mock.calls[1][0]).toBeCloseTo(0.01667, 4);
            expect(gameEngine.getDeltaTime()).toBeCloseTo(0.01667, 4);
        });

        test('deltaTimeの上限が適用される', () => {
            let gameLoopCallback: Function;
            mockRequestAnimationFrame.mockImplementation((callback: Function) => {
                gameLoopCallback = callback;
                return 1;
            });

            gameEngine.start();
            
            // 初回実行（lastTime = 0 なので deltaTime = 0）
            gameLoopCallback!(1000);
            expect(mockUpdateCallback).toHaveBeenCalledWith(0);

            // 長時間経過後（2秒 = 2000ms後、差分1000ms = 1秒）
            gameLoopCallback!(2000);
            
            // deltaTimeは最大30FPS相当（1/30 ≈ 0.0333）に制限される
            expect(mockUpdateCallback).toHaveBeenCalledWith(1/30);
            expect(gameEngine.getDeltaTime()).toBeCloseTo(1/30, 4);
        });

        test('ゲームループが継続的に実行される', () => {
            let gameLoopCallback: Function;
            let callCount = 0;
            mockRequestAnimationFrame.mockImplementation((callback: Function) => {
                gameLoopCallback = callback;
                return ++callCount;
            });

            gameEngine.start();
            
            // 最初のフレーム
            gameLoopCallback!(16.67);
            expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(2); // start() + gameLoop内部

            // 2番目のフレーム
            gameLoopCallback!(33.33);
            expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(3);
        });

        test('停止時にゲームループが終了する', () => {
            let gameLoopCallback: Function;
            mockRequestAnimationFrame.mockImplementation((callback: Function) => {
                gameLoopCallback = callback;
                return 1;
            });

            gameEngine.start();
            gameEngine.stop();
            mockRequestAnimationFrame.mockClear();

            // 停止後にゲームループを実行
            gameLoopCallback!(16.67);

            // 次のフレームはリクエストされない
            expect(mockRequestAnimationFrame).not.toHaveBeenCalled();
        });

        test('一時停止時にゲームループが終了する', () => {
            let gameLoopCallback: Function;
            mockRequestAnimationFrame.mockImplementation((callback: Function) => {
                gameLoopCallback = callback;
                return 1;
            });

            gameEngine.start();
            gameEngine.pause();
            mockRequestAnimationFrame.mockClear();

            // 一時停止後にゲームループを実行
            gameLoopCallback!(16.67);

            // 次のフレームはリクエストされない
            expect(mockRequestAnimationFrame).not.toHaveBeenCalled();
        });
    });

    describe('状態管理', () => {
        test('isGameRunning()が正しい状態を返す', () => {
            expect(gameEngine.isGameRunning()).toBe(false);

            gameEngine.start();
            expect(gameEngine.isGameRunning()).toBe(true);

            gameEngine.pause();
            expect(gameEngine.isGameRunning()).toBe(false);

            gameEngine.resume();
            expect(gameEngine.isGameRunning()).toBe(true);

            gameEngine.stop();
            expect(gameEngine.isGameRunning()).toBe(false);
        });

        test('isGamePaused()が正しい状態を返す', () => {
            expect(gameEngine.isGamePaused()).toBe(false);

            gameEngine.start();
            expect(gameEngine.isGamePaused()).toBe(false);

            gameEngine.pause();
            expect(gameEngine.isGamePaused()).toBe(true);

            gameEngine.resume();
            expect(gameEngine.isGamePaused()).toBe(false);

            gameEngine.stop();
            expect(gameEngine.isGamePaused()).toBe(false);
        });
    });

    describe('デバッグ情報', () => {
        test('getDebugInfo()が正確な情報を返す', () => {
            let gameLoopCallback: Function;
            mockRequestAnimationFrame.mockImplementation((callback: Function) => {
                gameLoopCallback = callback;
                return 1;
            });

            gameEngine.start();
            gameLoopCallback!(1000); // 初回（deltaTime = 0）
            gameLoopCallback!(1016.67); // 2回目（16.67ms後 = 60FPS）

            const debugInfo = gameEngine.getDebugInfo();

            expect(debugInfo.isRunning).toBe(true);
            expect(debugInfo.isPaused).toBe(false);
            expect(debugInfo.deltaTime).toBeCloseTo(0.01667, 4);
            expect(debugInfo.fps).toBe(60); // 1 / 0.01667 ≈ 60
        });

        test('deltaTimeが0の時のFPS計算', () => {
            const debugInfo = gameEngine.getDebugInfo();

            expect(debugInfo.fps).toBe(0);
        });

        test('一時停止状態のデバッグ情報', () => {
            // まずゲームループを実行してdeltaTimeを設定
            let gameLoopCallback: Function;
            mockRequestAnimationFrame.mockImplementation((callback: Function) => {
                gameLoopCallback = callback;
                return 1;
            });

            gameEngine.start();
            gameLoopCallback!(1000); // 初回実行
            gameEngine.pause();

            const debugInfo = gameEngine.getDebugInfo();

            // 一時停止中でもisRunningは内部フラグのためtrue
            expect(debugInfo.isRunning).toBe(true);
            expect(debugInfo.isPaused).toBe(true);
            // ただし、isGameRunning()メソッドはfalseを返す
            expect(gameEngine.isGameRunning()).toBe(false);
        });
    });

    describe('エラーハンドリング', () => {
        test('updateCallbackでエラーが発生した場合', () => {
            mockUpdateCallback.mockImplementation(() => {
                throw new Error('Update error');
            });

            let gameLoopCallback: Function;
            mockRequestAnimationFrame.mockImplementation((callback: Function) => {
                gameLoopCallback = callback;
                return 1;
            });

            gameEngine.start();

            // エラーが発生する
            expect(() => {
                gameLoopCallback!(16.67);
            }).toThrow('Update error');

            // エラーが発生してもstart()時の1回は呼ばれている
            expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);
        });

        test('drawCallbackでエラーが発生した場合', () => {
            mockDrawCallback.mockImplementation(() => {
                throw new Error('Draw error');
            });

            let gameLoopCallback: Function;
            mockRequestAnimationFrame.mockImplementation((callback: Function) => {
                gameLoopCallback = callback;
                return 1;
            });

            gameEngine.start();

            expect(() => {
                gameLoopCallback!(16.67);
            }).toThrow('Draw error');

            // updateCallbackは正常に呼ばれる
            expect(mockUpdateCallback).toHaveBeenCalledTimes(1);
            // エラーが発生してもstart()時の1回は呼ばれている
            expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);
        });
    });

    describe('複数回の状態変更', () => {
        test('start → pause → resume → stop のシーケンス', () => {
            // start
            gameEngine.start();
            expect(gameEngine.isGameRunning()).toBe(true);
            expect(gameEngine.isGamePaused()).toBe(false);

            // pause
            gameEngine.pause();
            expect(gameEngine.isGameRunning()).toBe(false);
            expect(gameEngine.isGamePaused()).toBe(true);

            // resume
            gameEngine.resume();
            expect(gameEngine.isGameRunning()).toBe(true);
            expect(gameEngine.isGamePaused()).toBe(false);

            // stop
            gameEngine.stop();
            expect(gameEngine.isGameRunning()).toBe(false);
            expect(gameEngine.isGamePaused()).toBe(false);
        });

        test('resume後のlastTimeリセット', () => {
            let gameLoopCallback: Function;
            mockRequestAnimationFrame.mockImplementation((callback: Function) => {
                gameLoopCallback = callback;
                return 1;
            });

            gameEngine.start();
            gameLoopCallback!(0);
            gameLoopCallback!(16.67);

            // 一時停止
            gameEngine.pause();
            
            // 再開
            gameEngine.resume();
            
            // 再開後の最初のフレームではdeltaTimeが0になる
            gameLoopCallback!(100); // 長時間経過を想定
            expect(mockUpdateCallback).toHaveBeenLastCalledWith(0);
        });

        test('start後のlastTimeリセット', () => {
            let gameLoopCallback: Function;
            mockRequestAnimationFrame.mockImplementation((callback: Function) => {
                gameLoopCallback = callback;
                return 1;
            });

            gameEngine.start();
            gameLoopCallback!(0);
            gameLoopCallback!(16.67);
            gameEngine.stop();

            // 再開始
            gameEngine.start();
            gameLoopCallback!(200); // 長時間経過を想定
            
            // 再開始後の最初のフレームではdeltaTimeが0になる
            expect(mockUpdateCallback).toHaveBeenLastCalledWith(0);
        });
    });

    describe('フレームレート関連', () => {
        test('高フレームレート時の動作', () => {
            let gameLoopCallback: Function;
            mockRequestAnimationFrame.mockImplementation((callback: Function) => {
                gameLoopCallback = callback;
                return 1;
            });

            gameEngine.start();
            gameLoopCallback!(1000); // 初回（deltaTime = 0）
            gameLoopCallback!(1008.33); // 2回目（8.33ms後 = 120FPS相当）

            expect(mockUpdateCallback.mock.calls[1][0]).toBeCloseTo(0.00833, 4);
            expect(gameEngine.getDeltaTime()).toBeCloseTo(0.00833, 4);

            const debugInfo = gameEngine.getDebugInfo();
            expect(debugInfo.fps).toBe(120);
        });

        test('低フレームレート時の動作（deltaTime上限適用）', () => {
            let gameLoopCallback: Function;
            mockRequestAnimationFrame.mockImplementation((callback: Function) => {
                gameLoopCallback = callback;
                return 1;
            });

            gameEngine.start();
            gameLoopCallback!(1000); // 初回（deltaTime = 0）
            gameLoopCallback!(1050); // 2回目（50ms後）

            // 50msは1/30秒（約33.33ms）の上限に制限される
            expect(mockUpdateCallback.mock.calls[1][0]).toBeCloseTo(1/30, 4);
            expect(gameEngine.getDeltaTime()).toBeCloseTo(1/30, 4);

            const debugInfo = gameEngine.getDebugInfo();
            expect(debugInfo.fps).toBe(30); // 1 / (1/30) = 30
        });
    });
});
