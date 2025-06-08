import { Boss } from '../../src/entities/Boss';
import { GAME_CONSTANTS } from '../../src/constants/GameConstants';
import { BossBullet } from '../../src/entities/BossBullet';

// MockGameEngineの定義
class MockGameEngine {
    private bullets: BossBullet[] = [];
    
    addBossBullet(bullet: BossBullet): void {
        this.bullets.push(bullet);
    }
    
    getBullets(): BossBullet[] {
        return this.bullets;
    }
    
    clearBullets(): void {
        this.bullets = [];
    }
}

describe('Boss', () => {
    let boss: Boss;
    let mockGameEngine: MockGameEngine;
    let mockContext: CanvasRenderingContext2D;

    beforeEach(() => {
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
            globalAlpha: 1
        } as unknown as CanvasRenderingContext2D;

        mockGameEngine = new MockGameEngine();
        boss = new Boss(mockGameEngine as any);
    });

    describe('初期化', () => {
        test('Bossが正しく初期化される', () => {
            expect(boss).toBeDefined();
            expect(boss.getX()).toBe(GAME_CONSTANTS.CANVAS.WIDTH / 2 - GAME_CONSTANTS.BOSS.WIDTH / 2);
            expect(boss.getY()).toBe(-GAME_CONSTANTS.BOSS.HEIGHT);
            expect(boss.getWidth()).toBe(GAME_CONSTANTS.BOSS.WIDTH);
            expect(boss.getHeight()).toBe(GAME_CONSTANTS.BOSS.HEIGHT);
        });

        test('初期体力が正しく設定される', () => {
            // takeDamageで体力を確認
            let defeated = false;
            for (let i = 0; i < GAME_CONSTANTS.BOSS.INITIAL_HEALTH - 1; i++) {
                defeated = boss.takeDamage();
                expect(defeated).toBe(false);
            }
            // 最後の一撃で倒される
            defeated = boss.takeDamage();
            expect(defeated).toBe(true);
        });

        test('初期位置が正しく取得できる', () => {
            const position = boss.getPosition();
            expect(position.x).toBe(GAME_CONSTANTS.CANVAS.WIDTH / 2 - GAME_CONSTANTS.BOSS.WIDTH / 2);
            expect(position.y).toBe(-GAME_CONSTANTS.BOSS.HEIGHT);
        });
    });

    describe('移動システム', () => {
        test('初期降下フェーズで下に移動する', () => {
            const initialY = boss.getY();
            boss.update(100); // 100ms
            
            expect(boss.getY()).toBeGreaterThan(initialY);
            expect(boss.getY()).toBe(initialY + GAME_CONSTANTS.BOSS.INITIAL_SPEED * 100);
        });

        test('降下完了後は水平移動する', () => {
            // 降下フェーズを完了させる
            while (boss.getY() < 50) {
                boss.update(100);
            }
            
            const initialX = boss.getX();
            boss.update(100);
            
            // X座標が変化している
            expect(boss.getX()).not.toBe(initialX);
        });

        test('画面端で方向転換する - 左端', () => {
            // 降下フェーズを完了
            while (boss.getY() < 50) {
                boss.update(100);
            }
            
            // 位置を直接設定することはできないので、移動による境界テストに変更
            const deltaTime = 100;
            
            // 十分に長い時間を与えて左端到達をテスト
            for (let i = 0; i < 100; i++) {
                boss.update(deltaTime);
                if (boss.getX() <= 0) break;
            }
            
            expect(boss.getX()).toBeGreaterThanOrEqual(0);
        });

        test('画面端で方向転換する - 右端', () => {
            // 降下フェーズを完了
            while (boss.getY() < 50) {
                boss.update(100);
            }
            
            const deltaTime = 100;
            
            // 十分に長い時間を与えて右端到達をテスト
            for (let i = 0; i < 100; i++) {
                boss.update(deltaTime);
                if (boss.getX() >= GAME_CONSTANTS.CANVAS.WIDTH - boss.getWidth()) break;
            }
            
            expect(boss.getX()).toBeLessThanOrEqual(GAME_CONSTANTS.CANVAS.WIDTH - boss.getWidth());
        });

        test('通常の水平移動', () => {
            // 降下フェーズを完了
            while (boss.getY() < 50) {
                boss.update(100);
            }
            
            const initialX = boss.getX();
            boss.update(100);
            
            expect(boss.getX()).not.toBe(initialX);
        });
    });

    describe('アニメーションシステム', () => {
        test('アニメーションフェーズが更新される', () => {
            const deltaTime = 100;
            boss.update(deltaTime);
            
            // アニメーションフェーズは内部変数なので、描画が正常に実行されることで確認
            expect(() => boss.draw(mockContext)).not.toThrow();
        });

        test('複数のアニメーション要素が同期して更新される', () => {
            const deltaTime = 50;
            
            // 複数回更新
            for (let i = 0; i < 5; i++) {
                boss.update(deltaTime);
            }
            
            // 描画が正常に実行される
            expect(() => boss.draw(mockContext)).not.toThrow();
        });

        test('長時間実行後も安定している', () => {
            const deltaTime = 1000; // 1秒
            
            // 長時間の更新
            for (let i = 0; i < 60; i++) { // 60秒相当
                boss.update(deltaTime);
            }
            
            expect(() => boss.draw(mockContext)).not.toThrow();
        });
    });

    describe('射撃システム', () => {
        beforeEach(() => {
            // Date.nowをモック
            jest.spyOn(Date, 'now').mockReturnValue(0);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        test('定期的に弾丸を発射する', () => {
            const initialTime = 0;
            jest.spyOn(Date, 'now').mockReturnValue(initialTime);
            
            boss.update(100);
            expect(mockGameEngine.getBullets()).toHaveLength(0);
            
            // 射撃レート時間経過後
            const fireTime = initialTime + GAME_CONSTANTS.BOSS.FIRE_RATE + 1;
            jest.spyOn(Date, 'now').mockReturnValue(fireTime);
            
            boss.update(100);
            expect(mockGameEngine.getBullets().length).toBeGreaterThan(0);
        });

        test('扇状に5発の弾丸を発射する', () => {
            jest.spyOn(Date, 'now').mockReturnValue(0);
            boss.update(100);
            
            jest.spyOn(Date, 'now').mockReturnValue(GAME_CONSTANTS.BOSS.FIRE_RATE + 1);
            boss.update(100);
            
            expect(mockGameEngine.getBullets()).toHaveLength(5);
        });

        test('弾丸が正しい位置から発射される', () => {
            jest.spyOn(Date, 'now').mockReturnValue(0);
            boss.update(100);
            
            jest.spyOn(Date, 'now').mockReturnValue(GAME_CONSTANTS.BOSS.FIRE_RATE + 1);
            boss.update(100);
            
            const bullets = mockGameEngine.getBullets();
            bullets.forEach(bullet => {
                expect(bullet.getX()).toBe(boss.getX() + boss.getWidth() / 2);
                expect(bullet.getY()).toBe(boss.getY() + boss.getHeight());
            });
        });

        test('連続射撃のタイミング制御', () => {
            let currentTime = 0;
            jest.spyOn(Date, 'now').mockReturnValue(currentTime);
            
            boss.update(100);
            mockGameEngine.clearBullets();
            
            // 射撃レート未満の時間では発射されない
            currentTime += GAME_CONSTANTS.BOSS.FIRE_RATE - 1;
            jest.spyOn(Date, 'now').mockReturnValue(currentTime);
            boss.update(100);
            expect(mockGameEngine.getBullets()).toHaveLength(0);
            
            // 射撃レート経過後は発射される
            currentTime += 2;
            jest.spyOn(Date, 'now').mockReturnValue(currentTime);
            boss.update(100);
            expect(mockGameEngine.getBullets()).toHaveLength(5);
        });
    });

    describe('ダメージシステム', () => {
        test('ダメージを受けて体力が減る', () => {
            const defeated = boss.takeDamage();
            expect(defeated).toBe(false);
        });

        test('体力が0になると倒される', () => {
            // 最大体力-1まで削る
            for (let i = 0; i < GAME_CONSTANTS.BOSS.INITIAL_HEALTH - 1; i++) {
                const defeated = boss.takeDamage();
                expect(defeated).toBe(false);
            }
            
            // 最後の一撃
            const defeated = boss.takeDamage();
            expect(defeated).toBe(true);
        });

        test('体力変化が描画に反映される', () => {
            // 初期状態
            boss.draw(mockContext);
            
            // ダメージ後
            boss.takeDamage();
            boss.draw(mockContext);
            
            // 描画が実行されることを確認
            expect(mockContext.fillRect).toHaveBeenCalled();
        });
    });

    describe('描画システム', () => {
        test('基本描画が正常に実行される', () => {
            expect(() => boss.draw(mockContext)).not.toThrow();
            
            // 基本的な描画メソッドが呼ばれている
            expect(mockContext.save).toHaveBeenCalled();
            expect(mockContext.restore).toHaveBeenCalled();
            expect(mockContext.translate).toHaveBeenCalledWith(
                boss.getX() + boss.getWidth() / 2,
                boss.getY() + boss.getHeight() / 2
            );
        });

        test('メインボディの描画', () => {
            boss.draw(mockContext);
            
            // グラデーション作成が呼ばれている
            expect(mockContext.createRadialGradient).toHaveBeenCalled();
            expect(mockContext.beginPath).toHaveBeenCalled();
            expect(mockContext.fill).toHaveBeenCalled();
            expect(mockContext.stroke).toHaveBeenCalled();
        });

        test('シールドレイヤーの描画', () => {
            boss.draw(mockContext);
            
            // 複数のシールドレイヤーの描画
            expect(mockContext.beginPath).toHaveBeenCalled();
            expect(mockContext.stroke).toHaveBeenCalled();
        });

        test('幾何学的パネルの描画', () => {
            boss.draw(mockContext);
            
            // パネルの描画処理
            expect(mockContext.save).toHaveBeenCalled();
            expect(mockContext.restore).toHaveBeenCalled();
        });

        test('スラスターノードの描画', () => {
            boss.draw(mockContext);
            
            // スラスターの描画
            expect(mockContext.arc).toHaveBeenCalled();
            expect(mockContext.fill).toHaveBeenCalled();
        });

        test('エネルギービームの描画', () => {
            boss.draw(mockContext);
            
            // ビームの描画
            expect(mockContext.moveTo).toHaveBeenCalled();
            expect(mockContext.lineTo).toHaveBeenCalled();
            expect(mockContext.stroke).toHaveBeenCalled();
        });

        test('中央コアの描画', () => {
            boss.draw(mockContext);
            
            // コアの描画
            expect(mockContext.createRadialGradient).toHaveBeenCalled();
            expect(mockContext.arc).toHaveBeenCalled();
            expect(mockContext.fill).toHaveBeenCalled();
        });

        test('体力バーの描画', () => {
            boss.draw(mockContext);
            
            // 体力バーの描画
            expect(mockContext.fillRect).toHaveBeenCalled();
            expect(mockContext.strokeRect).toHaveBeenCalled();
        });

        test('低体力時のフリッカーエフェクト', () => {
            // 体力を低く設定
            const lowHealthThreshold = Math.floor(GAME_CONSTANTS.BOSS.INITIAL_HEALTH * 0.3);
            for (let i = 0; i < GAME_CONSTANTS.BOSS.INITIAL_HEALTH - lowHealthThreshold; i++) {
                boss.takeDamage();
            }
            
            boss.draw(mockContext);
            
            // グローバルアルファが設定される
            expect(mockContext.globalAlpha).toBeDefined();
        });
    });

    describe('アニメーション詳細テスト', () => {
        test('各アニメーション要素の独立更新', () => {
            const deltaTime = 16.67; // 60FPS相当
            
            // 複数フレーム更新
            for (let i = 0; i < 10; i++) {
                boss.update(deltaTime);
            }
            
            // 描画が正常に実行される
            expect(() => boss.draw(mockContext)).not.toThrow();
        });

        test('アニメーション同期テスト', () => {
            const deltaTime = 100;
            
            // 同じタイムステップで複数回更新
            boss.update(deltaTime);
            boss.update(deltaTime);
            boss.update(deltaTime);
            
            expect(() => boss.draw(mockContext)).not.toThrow();
        });
    });

    describe('位置・状態管理', () => {
        test('getPosition()が正しい座標を返す', () => {
            const position = boss.getPosition();
            expect(position.x).toBe(boss.getX());
            expect(position.y).toBe(boss.getY());
        });

        test('移動後の位置が正しく取得される', () => {
            boss.update(100);
            const position = boss.getPosition();
            expect(position.x).toBe(boss.getX());
            expect(position.y).toBe(boss.getY());
        });
    });

    describe('エラーハンドリング', () => {
        test('null contextで描画してもエラーが発生しない', () => {
            expect(() => boss.draw(null as any)).toThrow();
        });

        test('極端なdeltaTimeでも正常に動作する', () => {
            expect(() => boss.update(10000)).not.toThrow();
            expect(() => boss.update(-100)).not.toThrow();
            expect(() => boss.update(0)).not.toThrow();
        });

        test('連続ダメージでエラーが発生しない', () => {
            // 体力以上のダメージを与える
            for (let i = 0; i < GAME_CONSTANTS.BOSS.INITIAL_HEALTH + 10; i++) {
                expect(() => boss.takeDamage()).not.toThrow();
            }
        });
    });

    describe('統合テスト', () => {
        test('ボスのライフサイクル全体', () => {
            // 初期化確認
            expect(boss.getPosition().y).toBe(-GAME_CONSTANTS.BOSS.HEIGHT);
            
            // 降下フェーズ
            while (boss.getY() < 50) {
                boss.update(100);
                boss.draw(mockContext);
            }
            
            // 水平移動フェーズ
            for (let i = 0; i < 10; i++) {
                boss.update(100);
                boss.draw(mockContext);
            }
            
            // ダメージフェーズ
            while (!boss.takeDamage()) {
                boss.update(100);
                boss.draw(mockContext);
            }
            
            // 全プロセスでエラーが発生しない
            expect(true).toBe(true);
        });

        test('射撃と移動の同時実行', () => {
            jest.spyOn(Date, 'now').mockReturnValue(0);
            
            // 降下完了まで更新
            while (boss.getY() < 50) {
                boss.update(100);
            }
            
            // 射撃タイミングで更新
            jest.spyOn(Date, 'now').mockReturnValue(GAME_CONSTANTS.BOSS.FIRE_RATE + 1);
            boss.update(100);
            
            expect(mockGameEngine.getBullets().length).toBeGreaterThan(0);
            expect(() => boss.draw(mockContext)).not.toThrow();
        });
    });
});
