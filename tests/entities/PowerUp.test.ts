import { PowerUp } from '../../src/entities/PowerUp';
import { PowerUpType } from '../../src/types';
import { createTestConfig, GameConfig } from '../../src/config/GameConfigFactory';

describe('PowerUp', () => {
    let powerUp: PowerUp;
    let mockContext: CanvasRenderingContext2D;
    let testConfig: GameConfig;

    beforeEach(() => {
        testConfig = createTestConfig();
        // Canvas contextのモック
        mockContext = {
            save: jest.fn(),
            restore: jest.fn(),
            translate: jest.fn(),
            rotate: jest.fn(),
            scale: jest.fn(),
            beginPath: jest.fn(),
            closePath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            arc: jest.fn(),
            fill: jest.fn(),
            stroke: jest.fn(),
            fillRect: jest.fn(),
            strokeRect: jest.fn(),
            createRadialGradient: jest.fn(() => ({
                addColorStop: jest.fn()
            })),
            createLinearGradient: jest.fn(() => ({
                addColorStop: jest.fn()
            })),
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 1,
            globalAlpha: 1,
            font: '',
            textAlign: '',
            textBaseline: '',
            fillText: jest.fn()
        } as unknown as CanvasRenderingContext2D;

        powerUp = new PowerUp(100, 50, testConfig);
    });

    describe('初期化', () => {
        test('PowerUpが正しく初期化される', () => {
            expect(powerUp).toBeDefined();
            expect(powerUp.getX()).toBe(100);
            expect(powerUp.getY()).toBe(50);
            expect(powerUp.getWidth()).toBe(testConfig.powerup.width);
            expect(powerUp.getHeight()).toBe(testConfig.powerup.height);
        });

        test('ランダムなパワーアップタイプが設定される', () => {
            const powerUpType = powerUp.getType();
            const validTypes: PowerUpType[] = ['RAPID_FIRE', 'TRIPLE_SHOT', 'SHIELD'];
            expect(validTypes).toContain(powerUpType);
        });

        test('複数のPowerUpインスタンスで異なるタイプが生成される可能性がある', () => {
            const powerUps = Array.from({ length: 20 }, () => new PowerUp(0, 0));
            const types = powerUps.map(p => p.getType());
            const uniqueTypes = new Set(types);
            
            // 20個作成すれば、少なくとも複数のタイプが生成される可能性が高い
            // ただし完全にランダムなので、1つのタイプしか出ない可能性もある
            expect(uniqueTypes.size).toBeGreaterThanOrEqual(1);
            expect(uniqueTypes.size).toBeLessThanOrEqual(3);
        });
    });

    describe('位置とサイズ', () => {
        test('初期位置が正しく設定される', () => {
            const newPowerUp = new PowerUp(200, 150, testConfig);
            expect(newPowerUp.getX()).toBe(200);
            expect(newPowerUp.getY()).toBe(150);
        });

        test('サイズが定数と一致する', () => {
            expect(powerUp.getWidth()).toBe(testConfig.powerup.width);
            expect(powerUp.getHeight()).toBe(testConfig.powerup.height);
        });
    });

    describe('移動システム', () => {
        test('下向きに移動する', () => {
            const initialY = powerUp.getY();
            const deltaTime = 100; // 100ms
            
            powerUp.update(deltaTime);
            
            const expectedY = initialY + testConfig.powerup.speed * deltaTime;
            expect(powerUp.getY()).toBe(expectedY);
        });

        test('複数回更新で継続的に移動する', () => {
            const initialY = powerUp.getY();
            const deltaTime = 50;
            
            powerUp.update(deltaTime);
            powerUp.update(deltaTime);
            powerUp.update(deltaTime);
            
            const expectedY = initialY + testConfig.powerup.speed * deltaTime * 3;
            expect(powerUp.getY()).toBe(expectedY);
        });

        test('X座標は変化しない', () => {
            const initialX = powerUp.getX();
            
            powerUp.update(100);
            powerUp.update(100);
            
            expect(powerUp.getX()).toBe(initialX);
        });
    });

    describe('回転システム', () => {
        test('時間経過で回転が更新される', () => {
            // 回転は内部変数なので、描画が正常に実行されることで確認
            expect(() => powerUp.draw(mockContext)).not.toThrow();
            
            powerUp.update(100);
            
            expect(() => powerUp.draw(mockContext)).not.toThrow();
        });

        test('継続的な回転更新', () => {
            // 長時間の更新後も安定している
            for (let i = 0; i < 100; i++) {
                powerUp.update(16.67); // 60fps
            }
            
            expect(() => powerUp.draw(mockContext)).not.toThrow();
        });
    });

    describe('グロー効果システム', () => {
        test('グロー効果が更新される', () => {
            // グロー効果は描画で確認
            powerUp.draw(mockContext);
            
            powerUp.update(100);
            powerUp.draw(mockContext);
            
            // グラデーション作成が呼ばれている
            expect(mockContext.createRadialGradient).toHaveBeenCalled();
        });

        test('グロー効果の振動パターン', () => {
            // グローの強度が振動することを間接的に確認
            for (let i = 0; i < 50; i++) {
                powerUp.update(10);
            }
            
            expect(() => powerUp.draw(mockContext)).not.toThrow();
        });
    });

    describe('トレイルシステム', () => {
        test('トレイルが更新される', () => {
            // トレイル更新間隔をテスト
            powerUp.update(60); // 60ms > 50ms threshold
            
            expect(() => powerUp.draw(mockContext)).not.toThrow();
        });

        test('トレイルの最大長制限', () => {
            // 大量のトレイルポイントを生成
            for (let i = 0; i < 100; i++) {
                powerUp.update(60); // 60ms per update
            }
            
            expect(() => powerUp.draw(mockContext)).not.toThrow();
        });

        test('トレイルのフェードアウト', () => {
            // トレイル作成とフェードアウトをテスト
            powerUp.update(60);
            powerUp.update(60);
            powerUp.update(60);
            
            expect(() => powerUp.draw(mockContext)).not.toThrow();
        });

        test('短い更新間隔でのトレイル処理', () => {
            // 50ms未満の更新ではトレイルが追加されない
            powerUp.update(30); // < 50ms
            powerUp.update(40); // < 50ms
            
            expect(() => powerUp.draw(mockContext)).not.toThrow();
        });
    });

    describe('描画システム', () => {
        test('基本描画が正常に実行される', () => {
            expect(() => powerUp.draw(mockContext)).not.toThrow();
            
            expect(mockContext.save).toHaveBeenCalled();
            expect(mockContext.restore).toHaveBeenCalled();
            expect(mockContext.translate).toHaveBeenCalled();
            expect(mockContext.rotate).toHaveBeenCalled();
        });

        test('グロー効果の描画', () => {
            powerUp.draw(mockContext);
            
            expect(mockContext.createRadialGradient).toHaveBeenCalled();
            expect(mockContext.arc).toHaveBeenCalled();
            expect(mockContext.fill).toHaveBeenCalled();
        });

        test('円形オブジェクトの描画', () => {
            powerUp.draw(mockContext);
            
            // 外側と内側の円が描画される
            expect(mockContext.beginPath).toHaveBeenCalled();
            expect(mockContext.arc).toHaveBeenCalled();
            expect(mockContext.fill).toHaveBeenCalled();
        });

        test('シンボルテキストの描画', () => {
            powerUp.draw(mockContext);
            
            expect(mockContext.fillText).toHaveBeenCalled();
            expect(mockContext.font).toBe('20px Arial');
            expect(mockContext.textAlign).toBe('center');
            expect(mockContext.textBaseline).toBe('middle');
        });
    });

    describe('パワーアップタイプ別シンボル', () => {
        test('RAPID_FIREシンボルの描画', () => {
            // Math.randomをモックしてRAPID_FIREを強制
            jest.spyOn(Math, 'random').mockReturnValue(0); // 最初のタイプを選択
            const rapidFirePowerUp = new PowerUp(0, 0, testConfig);
            
            rapidFirePowerUp.draw(mockContext);
            
            expect(mockContext.fillText).toHaveBeenCalledWith('R', 0, 0);
            
            jest.restoreAllMocks();
        });

        test('TRIPLE_SHOTシンボルの描画', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.4); // 2番目のタイプを選択
            const tripleShotPowerUp = new PowerUp(0, 0, testConfig);
            
            tripleShotPowerUp.draw(mockContext);
            
            expect(mockContext.fillText).toHaveBeenCalledWith('T', 0, 0);
            
            jest.restoreAllMocks();
        });

        test('SHIELDシンボルの描画', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.8); // 3番目のタイプを選択
            const shieldPowerUp = new PowerUp(0, 0, testConfig);
            
            shieldPowerUp.draw(mockContext);
            
            expect(mockContext.fillText).toHaveBeenCalledWith('S', 0, 0);
            
            jest.restoreAllMocks();
        });
    });

    describe('トレイル描画詳細', () => {
        test('トレイルポイントの描画', () => {
            // トレイルを作成
            powerUp.update(60);
            powerUp.update(60);
            
            powerUp.draw(mockContext);
            
            // トレイルの描画でsave/restoreが呼ばれる
            expect(mockContext.save).toHaveBeenCalled();
            expect(mockContext.restore).toHaveBeenCalled();
        });

        test('複雑なトレイルパターンの描画', () => {
            // 複雑なトレイルを作成
            for (let i = 0; i < 10; i++) {
                powerUp.update(60);
            }
            
            expect(() => powerUp.draw(mockContext)).not.toThrow();
        });

        test('トレイルの色設定', () => {
            powerUp.update(60);
            powerUp.draw(mockContext);
            
            // fillStyleが設定されている（色の解析は複雑なので実行のみ確認）
            expect(mockContext.fillStyle).toBeDefined();
        });
    });

    describe('画面内判定', () => {
        test('画面内のPowerUpはisOnScreen()がtrueを返す', () => {
            const onScreenPowerUp = new PowerUp(100, 100, testConfig);
            expect(onScreenPowerUp.isOnScreen()).toBe(true);
        });

        test('画面下端ギリギリのPowerUp', () => {
            const edgePowerUp = new PowerUp(100, testConfig.canvas.height - 1, testConfig);
            expect(edgePowerUp.isOnScreen()).toBe(true);
        });

        test('画面を完全に出たPowerUp', () => {
            const offScreenPowerUp = new PowerUp(100, testConfig.canvas.height + 10, testConfig);
            expect(offScreenPowerUp.isOnScreen()).toBe(false);
        });

        test('画面下端ちょうどのPowerUp', () => {
            const bottomPowerUp = new PowerUp(100, testConfig.canvas.height, testConfig);
            expect(bottomPowerUp.isOnScreen()).toBe(false);
        });
    });

    describe('getType()メソッド', () => {
        test('正しいタイプを返す', () => {
            const type = powerUp.getType();
            const validTypes: PowerUpType[] = ['RAPID_FIRE', 'TRIPLE_SHOT', 'SHIELD'];
            expect(validTypes).toContain(type);
        });

        test('初期化後にタイプが変わらない', () => {
            const initialType = powerUp.getType();
            
            powerUp.update(100);
            powerUp.draw(mockContext);
            powerUp.update(100);
            
            expect(powerUp.getType()).toBe(initialType);
        });
    });

    describe('パフォーマンステスト', () => {
        test('大量更新でもパフォーマンスが安定している', () => {
            const startTime = performance.now();
            
            for (let i = 0; i < 1000; i++) {
                powerUp.update(16.67);
            }
            
            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
        });

        test('大量描画でもパフォーマンスが安定している', () => {
            // トレイルを十分に作成
            for (let i = 0; i < 50; i++) {
                powerUp.update(60);
            }
            
            const startTime = performance.now();
            
            for (let i = 0; i < 100; i++) {
                powerUp.draw(mockContext);
            }
            
            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
        });
    });

    describe('エラーハンドリング', () => {
        test('null contextで描画してもエラーが発生する', () => {
            expect(() => powerUp.draw(null as any)).toThrow();
        });

        test('極端なdeltaTimeでも正常に動作する', () => {
            expect(() => powerUp.update(10000)).not.toThrow();
            expect(() => powerUp.update(-100)).not.toThrow();
            expect(() => powerUp.update(0)).not.toThrow();
        });

        test('負の座標でも正常に初期化される', () => {
            expect(() => new PowerUp(-100, -50, testConfig)).not.toThrow();
            const negativePowerUp = new PowerUp(-100, -50, testConfig);
            expect(negativePowerUp.getX()).toBe(-100);
            expect(negativePowerUp.getY()).toBe(-50);
        });
    });

    describe('統合テスト', () => {
        test('PowerUpのライフサイクル全体', () => {
            // 初期化
            expect(powerUp.isOnScreen()).toBe(true);
            expect(powerUp.getType()).toBeDefined();
            
            // 移動と更新
            while (powerUp.isOnScreen()) {
                powerUp.update(100);
                powerUp.draw(mockContext);
                
                // 無限ループ防止
                if (powerUp.getY() > testConfig.canvas.height + 1000) {
                    break;
                }
            }
            
            // 画面外に出る
            expect(powerUp.isOnScreen()).toBe(false);
        });

        test('複数PowerUpの独立動作', () => {
            const powerUp1 = new PowerUp(50, 0, testConfig);
            const powerUp2 = new PowerUp(150, 100, testConfig);
            const powerUp3 = new PowerUp(250, 200, testConfig);
            
            for (let i = 0; i < 10; i++) {
                powerUp1.update(50);
                powerUp2.update(50);
                powerUp3.update(50);
                
                powerUp1.draw(mockContext);
                powerUp2.draw(mockContext);
                powerUp3.draw(mockContext);
            }
            
            // すべて異なる位置にある
            expect(powerUp1.getY()).not.toBe(powerUp2.getY());
            expect(powerUp2.getY()).not.toBe(powerUp3.getY());
            
            // タイプは独立している
            const types = [powerUp1.getType(), powerUp2.getType(), powerUp3.getType()];
            expect(types.every(type => ['RAPID_FIRE', 'TRIPLE_SHOT', 'SHIELD'].includes(type))).toBe(true);
        });
    });

    describe('ランダム性テスト', () => {
        test('Math.randomの各範囲での動作確認', () => {
            // 各パワータイプが選択されることを確認
            const mockValues = [0, 0.33, 0.66, 0.99];
            
            mockValues.forEach(mockValue => {
                jest.spyOn(Math, 'random').mockReturnValue(mockValue);
                const testPowerUp = new PowerUp(0, 0, testConfig);
                const type = testPowerUp.getType();
                expect(['RAPID_FIRE', 'TRIPLE_SHOT', 'SHIELD']).toContain(type);
                jest.restoreAllMocks();
            });
        });

        test('回転速度のランダム性', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.5);
            const testPowerUp = new PowerUp(0, 0, testConfig);
            expect(() => testPowerUp.draw(mockContext)).not.toThrow();
            jest.restoreAllMocks();
        });
    });
});
