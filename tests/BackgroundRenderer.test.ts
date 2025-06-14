import { BackgroundRenderer } from '../src/rendering/BackgroundRenderer';
import { Star } from '../src/entities/Star';
import { Planet } from '../src/entities/Planet';
import { Nebula } from '../src/entities/Nebula';
import { Aurora } from '../src/entities/Aurora';
import { MockRandomProvider } from '../src/providers/MockRandomProvider';

describe('BackgroundRenderer', () => {
  let renderer: BackgroundRenderer;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;
  let mockRandomProvider: MockRandomProvider;

  beforeEach(() => {
    // Create mock canvas and context
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 400;
    mockCanvas.height = 600;
    mockContext = mockCanvas.getContext('2d') as CanvasRenderingContext2D;

    // Create mock random provider
    mockRandomProvider = new MockRandomProvider();
    mockRandomProvider.setValues([0.5, 0.3, 0.7, 0.2, 0.8, 0.1, 0.9, 0.4, 0.6]);

    renderer = new BackgroundRenderer();
  });

  describe('初期化とセットアップ', () => {
    test('BackgroundRendererが正常に初期化される', () => {
      expect(renderer).toBeDefined();
      expect(renderer.getPerformanceStats()).toBeDefined();
    });

    test('キャッシュシステムが正常に初期化される', () => {
      const stats = renderer.getPerformanceStats();
      expect(stats.cacheUtilization.background).toBe(false);
      expect(stats.cacheUtilization.nebula).toBe(false);
      expect(stats.cacheUtilization.planet).toBe(false);
      expect(stats.averageRenderTime).toBe(0);
    });
  });

  describe('最適化された背景描画', () => {
    let mockStars: Star[];
    let mockPlanets: Planet[];
    let mockNebulas: Nebula[];
    let mockAuroras: Aurora[];

    beforeEach(() => {
      // テスト用のモック背景要素を作成
      mockStars = [
        new Star(mockRandomProvider),
        new Star(mockRandomProvider),
        new Star(mockRandomProvider),
      ];

      mockPlanets = [new Planet(), new Planet()];

      mockNebulas = [new Nebula()];

      mockAuroras = [new Aurora()];
    });

    test('drawOptimizedBackground が正常に実行される', () => {
      expect(() => {
        renderer.drawOptimizedBackground(
          mockContext,
          mockStars,
          mockPlanets,
          mockNebulas,
          mockAuroras
        );
      }).not.toThrow();
    });

    test('drawTraditionalBackground が正常に実行される', () => {
      expect(() => {
        renderer.drawTraditionalBackground(
          mockContext,
          mockStars,
          mockPlanets,
          mockNebulas,
          mockAuroras
        );
      }).not.toThrow();
    });

    test('最適化描画で適切なCanvasメソッドが呼び出される', () => {
      const drawImageSpy = jest.spyOn(mockContext, 'drawImage');

      renderer.drawOptimizedBackground(
        mockContext,
        mockStars,
        mockPlanets,
        mockNebulas,
        mockAuroras
      );

      // キャッシュされた画像が描画される
      expect(drawImageSpy).toHaveBeenCalled();
    });
  });

  describe('パフォーマンス測定システム', () => {
    test('パフォーマンス統計が正しく記録される', () => {
      const mockStars = [new Star(mockRandomProvider)];
      const mockPlanets: Planet[] = [];
      const mockNebulas: Nebula[] = [];
      const mockAuroras: Aurora[] = [];

      // 複数回描画を実行してパフォーマンス統計を蓄積
      for (let i = 0; i < 5; i++) {
        renderer.drawOptimizedBackground(
          mockContext,
          mockStars,
          mockPlanets,
          mockNebulas,
          mockAuroras
        );
      }

      const stats = renderer.getPerformanceStats();
      expect(stats.averageRenderTime).toBeGreaterThanOrEqual(0);
      expect(stats.minRenderTime).toBeGreaterThanOrEqual(0);
      expect(stats.maxRenderTime).toBeGreaterThanOrEqual(0);
      expect(stats.minRenderTime).toBeLessThanOrEqual(stats.maxRenderTime);
      expect(stats.sampleCount).toBe(5);
    });

    test('キャッシュ利用状況が正しく報告される', () => {
      const mockStars = [new Star(mockRandomProvider)];

      // 複数回描画してキャッシュを構築
      for (let i = 0; i < 3; i++) {
        renderer.drawOptimizedBackground(mockContext, mockStars, [], [], []);
      }

      const stats = renderer.getPerformanceStats();
      expect(stats.cacheUtilization.background).toBe(true);
      expect(stats.cacheUtilization.nebula).toBe(true);
      expect(stats.cacheUtilization.planet).toBe(true);
    });
  });

  describe('キャッシュ管理', () => {
    test('キャッシュ無効化が正常に機能する', () => {
      // 初回描画でキャッシュを構築
      renderer.drawOptimizedBackground(mockContext, [], [], [], []);

      let stats = renderer.getPerformanceStats();
      expect(stats.cacheUtilization.background).toBe(true);

      // キャッシュ無効化
      renderer.invalidateCache();

      stats = renderer.getPerformanceStats();
      expect(stats.cacheUtilization.background).toBe(false);
      expect(stats.cacheUtilization.nebula).toBe(false);
      expect(stats.cacheUtilization.planet).toBe(false);
    });

    test('リソースクリーンアップが正常に動作する', () => {
      // パフォーマンス統計を蓄積
      for (let i = 0; i < 3; i++) {
        renderer.drawOptimizedBackground(mockContext, [], [], [], []);
      }

      let stats = renderer.getPerformanceStats();
      expect(stats.sampleCount).toBe(3);

      // クリーンアップ実行
      renderer.dispose();

      stats = renderer.getPerformanceStats();
      expect(stats.sampleCount).toBe(0);
      expect(stats.cacheUtilization.background).toBe(false);
    });
  });

  describe('エラーハンドリング', () => {
    test('null contextでは適切にエラーが発生する', () => {
      expect(() => {
        renderer.drawOptimizedBackground(null as any, [], [], [], []);
      }).toThrow();
    });

    test('空の配列で正常に動作する', () => {
      expect(() => {
        renderer.drawOptimizedBackground(mockContext, [], [], [], []);
      }).not.toThrow();

      const stats = renderer.getPerformanceStats();
      expect(stats).toBeDefined();
      expect(stats.sampleCount).toBe(1);
    });

    test('大量の要素でもパフォーマンスが安定している', () => {
      // 大量の星を生成
      const manyStars = Array.from(
        { length: 100 },
        () => new Star(mockRandomProvider)
      );

      const startTime = performance.now();

      renderer.drawOptimizedBackground(mockContext, manyStars, [], [], []);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 合理的な時間内（100ms未満）で完了することを確認
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('最適化ON/OFF比較機能', () => {
    test('最適化版と従来版の両方が正常に動作する', () => {
      const mockElements = {
        stars: [new Star(mockRandomProvider)],
        planets: [new Planet()],
        nebulas: [new Nebula()],
        auroras: [new Aurora()],
      };

      expect(() => {
        renderer.drawOptimizedBackground(
          mockContext,
          mockElements.stars,
          mockElements.planets,
          mockElements.nebulas,
          mockElements.auroras
        );
      }).not.toThrow();

      expect(() => {
        renderer.drawTraditionalBackground(
          mockContext,
          mockElements.stars,
          mockElements.planets,
          mockElements.nebulas,
          mockElements.auroras
        );
      }).not.toThrow();
    });

    test('パフォーマンス統計が両方の描画方法で記録される', () => {
      const mockStars = [new Star(mockRandomProvider)];

      renderer.drawOptimizedBackground(mockContext, mockStars, [], [], []);
      renderer.drawTraditionalBackground(mockContext, mockStars, [], [], []);

      const stats = renderer.getPerformanceStats();
      expect(stats.sampleCount).toBe(2);
      expect(stats.averageRenderTime).toBeGreaterThanOrEqual(0); // テスト環境では0以上で十分
    });
  });

  describe('デバッグ機能', () => {
    test('パフォーマンス情報ログが正常に動作する', () => {
      const consoleGroupSpy = jest.spyOn(console, 'group').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleGroupEndSpy = jest
        .spyOn(console, 'groupEnd')
        .mockImplementation();

      // 統計データを蓄積
      renderer.drawOptimizedBackground(mockContext, [], [], [], []);

      // ログ出力
      renderer.logPerformanceInfo();

      // 複雑なグループ化されたログ出力を確認
      expect(consoleGroupSpy).toHaveBeenCalledWith(
        '🎨 Background Renderer Performance'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Average Render Time')
      );
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      consoleGroupSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });

    test('簡易パフォーマンス情報ログが正常に動作する', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // 統計データを蓄積
      renderer.drawOptimizedBackground(mockContext, [], [], [], []);

      // 簡易ログ出力（テスト用）
      renderer.logSimplePerformanceInfo();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Background Renderer Performance:',
        expect.objectContaining({
          'Average Render Time': expect.stringContaining('ms'),
          'Sample Count': expect.any(Number),
          'Cache Status': expect.objectContaining({
            background: expect.any(Boolean),
            nebula: expect.any(Boolean),
            planet: expect.any(Boolean),
          }),
        })
      );

      consoleSpy.mockRestore();
    });
  });
});
