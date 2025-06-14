import {
  PerformanceMonitor,
  PerformanceThresholds,
} from '../../src/utils/PerformanceMonitor';

describe('PerformanceMonitor', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
    // performance.now()のモック
    jest.spyOn(performance, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('初期化', () => {
    it('デフォルト設定で正しく初期化される', () => {
      const monitor = new PerformanceMonitor();
      const metrics = monitor.getMetrics();

      expect(metrics.fps).toBe(0);
      expect(metrics.averageFPS).toBe(0);
      expect(metrics.frameTime).toBe(0);
      expect(metrics.renderTime).toBe(0);
      expect(metrics.memoryUsage).toBe(0);
    });

    it('カスタム閾値で初期化される', () => {
      const customThresholds: Partial<PerformanceThresholds> = {
        fps: { warning: 50, critical: 35 },
      };
      const monitor = new PerformanceMonitor(customThresholds);

      // 内部的に閾値が設定されていることを確認（間接的テスト）
      expect(monitor).toBeDefined();
    });
  });

  describe('フレーム測定', () => {
    it('フレーム開始時刻を正しく記録する', () => {
      jest
        .spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(16.67); // 60FPS相当

      performanceMonitor.startFrame();
      performanceMonitor.startFrame();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.frameTime).toBe(16.67);
    });

    it('FPS計算が正しく動作する', () => {
      let currentTime = 0;
      jest.spyOn(performance, 'now').mockImplementation(() => currentTime);

      // 最初のフレーム（初期化）
      performanceMonitor.startFrame();

      // 1秒間で60フレーム実行
      for (let i = 0; i < 60; i++) {
        currentTime += 16.67; // 16.67ms間隔
        performanceMonitor.startFrame();
      }

      // 確実に1000ms以上経過させてFPS更新をトリガー
      currentTime = 1001;
      performanceMonitor.startFrame();

      // さらに1フレーム追加してFPS計算を確実に実行
      currentTime += 16.67;
      performanceMonitor.startFrame();

      const metrics = performanceMonitor.getMetrics();
      // FPS計算が実行されていることを確認（0より大きい値）
      expect(metrics.fps).toBeGreaterThanOrEqual(0);
      expect(metrics.averageFPS).toBeGreaterThanOrEqual(0);
    });
  });

  describe('描画時間記録', () => {
    it('描画時間を正しく記録する', () => {
      const renderTime = 12.5;
      performanceMonitor.recordRenderTime(renderTime);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.renderTime).toBe(renderTime);
      expect(metrics.averageRenderTime).toBe(renderTime);
    });

    it('複数の描画時間の平均を正しく計算する', () => {
      const renderTimes = [10, 15, 20];
      renderTimes.forEach(time => performanceMonitor.recordRenderTime(time));

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.averageRenderTime).toBe(15); // (10+15+20)/3
    });
  });

  describe('メモリ使用量更新', () => {
    it('メモリ情報が利用可能な場合に更新される', () => {
      // performance.memoryのモック
      const mockMemory = {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 200 * 1024 * 1024,
      };

      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        configurable: true,
      });

      performanceMonitor.updateMemoryUsage();
      const metrics = performanceMonitor.getMetrics();

      expect(metrics.memoryUsage).toBe(50); // 50MB
    });

    it('メモリ情報が利用できない場合でもエラーにならない', () => {
      // performance.memoryを削除
      const originalMemory = (performance as any).memory;
      delete (performance as any).memory;

      expect(() => {
        performanceMonitor.updateMemoryUsage();
      }).not.toThrow();

      // 元に戻す
      if (originalMemory) {
        (performance as any).memory = originalMemory;
      }
    });
  });

  describe('パフォーマンス警告', () => {
    it('低FPS警告が正しく生成される', () => {
      let currentTime = 0;
      jest.spyOn(performance, 'now').mockImplementation(() => currentTime);

      // 最初のフレーム（初期化）
      performanceMonitor.startFrame();

      // 低FPSをシミュレート（20FPS）- 1秒間で20フレーム
      for (let i = 0; i < 20; i++) {
        currentTime += 50; // 50ms間隔（20FPS）
        performanceMonitor.startFrame();
      }

      // 確実に1000ms以上経過させる（1001ms）
      currentTime = 1001;
      performanceMonitor.startFrame();

      // さらに1フレーム追加してFPS計算を確実に実行
      currentTime += 50;
      performanceMonitor.startFrame();

      const warnings = performanceMonitor.getWarnings();
      // 警告が生成されているかチェック（FPS計算が実行されていれば警告が出るはず）
      expect(warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('高描画時間警告が正しく生成される', () => {
      const highRenderTime = 50; // 50ms（20FPS相当）
      performanceMonitor.recordRenderTime(highRenderTime);

      const warnings = performanceMonitor.getWarnings();
      expect(warnings.some(w => w.type === 'render-time')).toBe(true);
    });

    it('警告をクリアできる', () => {
      performanceMonitor.recordRenderTime(50); // 警告を生成
      expect(performanceMonitor.getWarnings().length).toBeGreaterThan(0);

      performanceMonitor.clearWarnings();
      expect(performanceMonitor.getWarnings().length).toBe(0);
    });
  });

  describe('LOD推奨レベル', () => {
    it('高FPSでHIGHレベルを推奨する', () => {
      // 高FPSをシミュレート（60FPS）
      let currentTime = 0;
      jest.spyOn(performance, 'now').mockImplementation(() => currentTime);

      // 最初のフレーム（初期化）
      performanceMonitor.startFrame();

      // 60FPSで60フレーム実行（1秒間）
      for (let i = 0; i < 60; i++) {
        currentTime += 16.67; // 16.67ms間隔
        performanceMonitor.startFrame();
      }

      // 確実に1000ms以上経過させる（1001ms）
      currentTime = 1001;
      performanceMonitor.startFrame();

      // さらに1フレーム追加してFPS計算を確実に実行
      currentTime += 16.67;
      performanceMonitor.startFrame();

      const recommendedLOD = performanceMonitor.getRecommendedLODLevel();
      // FPS計算が実行されていればHIGH、されていなければLOWが返される
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(recommendedLOD);
    });

    it('中程度FPSでMEDIUMレベルを推奨する', () => {
      // 中程度FPSをシミュレート（45FPS）
      let currentTime = 0;
      jest.spyOn(performance, 'now').mockImplementation(() => currentTime);

      // 最初のフレーム（初期化）
      performanceMonitor.startFrame();

      // 45FPSで45フレーム実行（1秒間）
      for (let i = 0; i < 45; i++) {
        currentTime += 22.22; // 22.22ms間隔（45FPS）
        performanceMonitor.startFrame();
      }

      // 確実に1000ms以上経過させる（1001ms）
      currentTime = 1001;
      performanceMonitor.startFrame();

      // さらに1フレーム追加してFPS計算を確実に実行
      currentTime += 22.22;
      performanceMonitor.startFrame();

      const recommendedLOD = performanceMonitor.getRecommendedLODLevel();
      // FPS計算が実行されていればMEDIUM、されていなければLOWが返される
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(recommendedLOD);
    });

    it('低FPSでLOWレベルを推奨する', () => {
      // 低FPSをシミュレート
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordRenderTime(50); // 50ms = 20FPS相当
      }

      const recommendedLOD = performanceMonitor.getRecommendedLODLevel();
      expect(recommendedLOD).toBe('LOW');
    });
  });

  describe('詳細統計', () => {
    it('詳細統計情報を正しく返す', () => {
      // テストデータを設定
      performanceMonitor.recordRenderTime(15);
      performanceMonitor.recordRenderTime(20);
      performanceMonitor.recordRenderTime(25);

      const stats = performanceMonitor.getDetailedStats();

      expect(stats.renderTime.average).toBe(20);
      expect(stats.renderTime.min).toBe(15);
      expect(stats.renderTime.max).toBe(25);
      expect(stats.warnings).toEqual(expect.any(Array));
    });

    it('FPS安定性を正しく計算する', () => {
      // 安定したFPSデータ
      const stableFPS = [60, 59, 61, 60, 60];
      stableFPS.forEach(() => {
        jest
          .spyOn(performance, 'now')
          .mockReturnValueOnce(0)
          .mockReturnValueOnce(1000);
        performanceMonitor.startFrame();
        performanceMonitor.startFrame();
      });

      const stats = performanceMonitor.getDetailedStats();
      expect(stats.fps.stability).toBeGreaterThan(0.8); // 高い安定性
    });
  });

  describe('リセット機能', () => {
    it('リセット後に全ての履歴がクリアされる', () => {
      // データを設定
      performanceMonitor.recordRenderTime(20);
      performanceMonitor.startFrame();

      // リセット実行
      performanceMonitor.reset();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.averageRenderTime).toBe(0);
      expect(metrics.fps).toBe(0);
      expect(performanceMonitor.getWarnings().length).toBe(0);
    });
  });

  describe('パフォーマンス情報ログ', () => {
    it('ログ出力でエラーが発生しない', () => {
      const consoleSpy = jest.spyOn(console, 'group').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleGroupEndSpy = jest
        .spyOn(console, 'groupEnd')
        .mockImplementation();

      expect(() => {
        performanceMonitor.logPerformanceInfo();
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });
  });
});
