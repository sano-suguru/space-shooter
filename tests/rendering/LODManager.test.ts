import { LODManager, LODLevel, LODThresholds } from '../../src/rendering/LODManager';
import { PerformanceMonitor } from '../../src/utils/PerformanceMonitor';

describe('LODManager', () => {
    let performanceMonitor: PerformanceMonitor;
    let lodManager: LODManager;

    beforeEach(() => {
        performanceMonitor = new PerformanceMonitor();
        lodManager = new LODManager(performanceMonitor);
        
        // performance.now()のモック
        jest.spyOn(performance, 'now').mockReturnValue(0);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('初期化', () => {
        it('デフォルト設定で正しく初期化される', () => {
            const manager = new LODManager(performanceMonitor);
            
            expect(manager.getCurrentLevel()).toBe(LODLevel.HIGH);
            expect(manager.getCurrentSettings()).toEqual({
                particleMultiplier: 1.0,
                detailLevel: 1.0,
                updateFrequency: 1.0,
                effectIntensity: 1.0,
                animationQuality: 1.0
            });
        });

        it('カスタム閾値で初期化される', () => {
            const customThresholds: Partial<LODThresholds> = {
                high: { minFPS: 60, maxMemoryMB: 40, maxRenderTimeMS: 15 }
            };
            
            const manager = new LODManager(performanceMonitor, customThresholds);
            expect(manager).toBeDefined();
        });
    });

    describe('LODレベル管理', () => {
        it('初期状態でHIGHレベルが設定される', () => {
            expect(lodManager.getCurrentLevel()).toBe(LODLevel.HIGH);
        });

        it('手動でLODレベルを変更できる', () => {
            lodManager.setLODLevel(LODLevel.MEDIUM);
            expect(lodManager.getCurrentLevel()).toBe(LODLevel.MEDIUM);
            
            lodManager.setLODLevel(LODLevel.LOW);
            expect(lodManager.getCurrentLevel()).toBe(LODLevel.LOW);
        });

        it('同じレベルを設定しても変更されない', () => {
            const initialLevel = lodManager.getCurrentLevel();
            lodManager.setLODLevel(initialLevel);
            expect(lodManager.getCurrentLevel()).toBe(initialLevel);
        });
    });

    describe('LOD設定', () => {
        it('HIGHレベルの設定が正しい', () => {
            lodManager.setLODLevel(LODLevel.HIGH);
            const settings = lodManager.getCurrentSettings();
            
            expect(settings.particleMultiplier).toBe(1.0);
            expect(settings.detailLevel).toBe(1.0);
            expect(settings.updateFrequency).toBe(1.0);
            expect(settings.effectIntensity).toBe(1.0);
            expect(settings.animationQuality).toBe(1.0);
        });

        it('MEDIUMレベルの設定が正しい', () => {
            lodManager.setLODLevel(LODLevel.MEDIUM);
            const settings = lodManager.getCurrentSettings();
            
            expect(settings.particleMultiplier).toBe(0.6);
            expect(settings.detailLevel).toBe(0.8);
            expect(settings.updateFrequency).toBe(0.8);
            expect(settings.effectIntensity).toBe(0.8);
            expect(settings.animationQuality).toBe(0.8);
        });

        it('LOWレベルの設定が正しい', () => {
            lodManager.setLODLevel(LODLevel.LOW);
            const settings = lodManager.getCurrentSettings();
            
            expect(settings.particleMultiplier).toBe(0.3);
            expect(settings.detailLevel).toBe(0.5);
            expect(settings.updateFrequency).toBe(0.5);
            expect(settings.effectIntensity).toBe(0.6);
            expect(settings.animationQuality).toBe(0.5);
        });
    });

    describe('パーティクル数調整', () => {
        it('HIGHレベルでパーティクル数が変更されない', () => {
            lodManager.setLODLevel(LODLevel.HIGH);
            const baseCount = 100;
            const adjustedCount = lodManager.getAdjustedParticleCount(baseCount);
            
            expect(adjustedCount).toBe(100);
        });

        it('MEDIUMレベルでパーティクル数が60%に調整される', () => {
            lodManager.setLODLevel(LODLevel.MEDIUM);
            const baseCount = 100;
            const adjustedCount = lodManager.getAdjustedParticleCount(baseCount);
            
            expect(adjustedCount).toBe(60);
        });

        it('LOWレベルでパーティクル数が30%に調整される', () => {
            lodManager.setLODLevel(LODLevel.LOW);
            const baseCount = 100;
            const adjustedCount = lodManager.getAdjustedParticleCount(baseCount);
            
            expect(adjustedCount).toBe(30);
        });

        it('小数点以下は切り捨てられる', () => {
            lodManager.setLODLevel(LODLevel.MEDIUM);
            const baseCount = 7; // 7 * 0.6 = 4.2
            const adjustedCount = lodManager.getAdjustedParticleCount(baseCount);
            
            expect(adjustedCount).toBe(4);
        });
    });

    describe('倍率取得メソッド', () => {
        beforeEach(() => {
            lodManager.setLODLevel(LODLevel.MEDIUM);
        });

        it('詳細レベル倍率を正しく返す', () => {
            expect(lodManager.getDetailMultiplier()).toBe(0.8);
        });

        it('更新頻度倍率を正しく返す', () => {
            expect(lodManager.getUpdateFrequencyMultiplier()).toBe(0.8);
        });

        it('エフェクト強度倍率を正しく返す', () => {
            expect(lodManager.getEffectIntensityMultiplier()).toBe(0.8);
        });

        it('アニメーション品質倍率を正しく返す', () => {
            expect(lodManager.getAnimationQualityMultiplier()).toBe(0.8);
        });
    });

    describe('LOD更新', () => {
        it('評価間隔内では更新されない', () => {
            const initialLevel = lodManager.getCurrentLevel();
            
            // 短い時間での更新
            lodManager.updateLOD(100); // 100ms
            
            expect(lodManager.getCurrentLevel()).toBe(initialLevel);
        });

        it('パフォーマンス履歴が蓄積される', () => {
            // パフォーマンスデータを設定
            performanceMonitor.recordRenderTime(20);
            
            // 十分な時間経過をシミュレート
            jest.spyOn(performance, 'now').mockReturnValue(1000);
            
            lodManager.updateLOD(1000);
            
            const stats = lodManager.getLODStats();
            expect(stats).toBeDefined();
        });
    });

    describe('カスタマイズ機能', () => {
        it('LOD設定をカスタマイズできる', () => {
            const customSettings = {
                particleMultiplier: 0.5,
                effectIntensity: 0.7
            };
            
            lodManager.customizeLODSettings(LODLevel.HIGH, customSettings);
            lodManager.setLODLevel(LODLevel.HIGH);
            
            const settings = lodManager.getCurrentSettings();
            expect(settings.particleMultiplier).toBe(0.5);
            expect(settings.effectIntensity).toBe(0.7);
            // 他の設定は変更されない
            expect(settings.detailLevel).toBe(1.0);
        });

        it('閾値をカスタマイズできる', () => {
            const customThresholds = {
                high: { minFPS: 70, maxMemoryMB: 30, maxRenderTimeMS: 10 }
            };
            
            expect(() => {
                lodManager.customizeThresholds(customThresholds);
            }).not.toThrow();
        });
    });

    describe('統計情報', () => {
        it('LOD統計情報を正しく返す', () => {
            const stats = lodManager.getLODStats();
            
            expect(stats.currentLevel).toBe(LODLevel.HIGH);
            expect(stats.settings).toBeDefined();
            expect(stats.thresholds).toBeDefined();
            expect(stats.changeTimer).toBe(0);
            expect(typeof stats.performanceStable).toBe('boolean');
            expect(stats.recommendedLevel).toBeDefined();
        });

        it('レベル変更後の統計情報が更新される', () => {
            lodManager.setLODLevel(LODLevel.MEDIUM);
            const stats = lodManager.getLODStats();
            
            expect(stats.currentLevel).toBe(LODLevel.MEDIUM);
            expect(stats.previousLevel).toBe(LODLevel.HIGH);
        });
    });

    describe('リセット機能', () => {
        it('リセット後に初期状態に戻る', () => {
            // 状態を変更
            lodManager.setLODLevel(LODLevel.LOW);
            lodManager.updateLOD(1000);
            
            // リセット実行
            lodManager.reset();
            
            expect(lodManager.getCurrentLevel()).toBe(LODLevel.HIGH);
            const stats = lodManager.getLODStats();
            expect(stats.changeTimer).toBe(0);
        });
    });

    describe('ログ出力', () => {
        it('ログ出力でエラーが発生しない', () => {
            const consoleSpy = jest.spyOn(console, 'group').mockImplementation();
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
            const consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();

            expect(() => {
                lodManager.logLODInfo();
            }).not.toThrow();

            expect(consoleSpy).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalled();
            expect(consoleGroupEndSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
            consoleLogSpy.mockRestore();
            consoleGroupEndSpy.mockRestore();
        });
    });

    describe('エッジケース', () => {
        it('0個のパーティクルでも正しく処理される', () => {
            lodManager.setLODLevel(LODLevel.LOW);
            const adjustedCount = lodManager.getAdjustedParticleCount(0);
            
            expect(adjustedCount).toBe(0);
        });

        it('非常に大きなパーティクル数でも正しく処理される', () => {
            lodManager.setLODLevel(LODLevel.MEDIUM);
            const baseCount = 10000;
            const adjustedCount = lodManager.getAdjustedParticleCount(baseCount);
            
            expect(adjustedCount).toBe(6000);
        });

        it('負のdeltaTimeでもエラーにならない', () => {
            expect(() => {
                lodManager.updateLOD(-100);
            }).not.toThrow();
        });
    });
});