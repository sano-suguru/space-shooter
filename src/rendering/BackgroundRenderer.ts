import { GameConfig, createGameConfig } from '../config/GameConfigFactory';
import { Aurora } from '../entities/Aurora';
import { Comet } from '../entities/Comet';
import { MeteorShower } from '../entities/MeteorShower';
import { Nebula } from '../entities/Nebula';
import { Planet } from '../entities/Planet';
import { SpaceDust } from '../entities/SpaceDust';
import { Star } from '../entities/Star';
import {
  PerformanceMonitor,
  PerformanceMetrics,
} from '../utils/PerformanceMonitor';

import { LODManager, LODLevel } from './LODManager';

/**
 * 背景レンダリング最適化クラス
 * - 事前レンダリングによる描画コスト削減
 * - レイヤー別キャッシング戦略
 * - パフォーマンス測定機能
 */
export class BackgroundRenderer {
  // キャッシュ用オフスクリーンキャンバス
  private backgroundCache!: HTMLCanvasElement;
  private backgroundCacheCtx!: CanvasRenderingContext2D;

  private nebulaCache!: HTMLCanvasElement;
  private nebulaCacheCtx!: CanvasRenderingContext2D;

  private planetCache!: HTMLCanvasElement;
  private planetCacheCtx!: CanvasRenderingContext2D;

  // 静的要素専用キャッシュ（Phase 2追加）
  private staticElementsCache!: HTMLCanvasElement;
  private staticElementsCacheCtx!: CanvasRenderingContext2D;

  // キャッシュ状態管理
  private backgroundCacheValid = false;
  private nebulaCacheValid = false;
  private planetCacheValid = false;
  private staticElementsCacheValid = false;

  // パフォーマンス測定（レガシー）
  private renderTimes: number[] = [];
  private maxRenderTimeHistory = 100;

  // 惑星キャッシュ更新間隔（回転アニメーション用）
  private planetCacheUpdateInterval = 16; // ~60FPS時に16フレームごと
  private planetCacheFrameCounter = 0;

  // 新しいパフォーマンス監視・LODシステム
  private performanceMonitor: PerformanceMonitor;
  private lodManager: LODManager;
  private lastUpdateTime = 0;

  constructor(private config: GameConfig = createGameConfig()) {
    this.initializeCaches();
    this.performanceMonitor = new PerformanceMonitor();
    this.lodManager = new LODManager(this.performanceMonitor);
    this.lastUpdateTime = performance.now();
  }

  /**
   * キャッシュ用オフスクリーンキャンバスを初期化
   */
  private initializeCaches(): void {
    const width = this.config.canvas.width;
    const height = this.config.canvas.height;

    // 背景グラデーション用キャッシュ
    this.backgroundCache = document.createElement('canvas');
    this.backgroundCache.width = width;
    this.backgroundCache.height = height;
    this.backgroundCacheCtx = this.backgroundCache.getContext('2d')!;

    // 星雲用キャッシュ
    this.nebulaCache = document.createElement('canvas');
    this.nebulaCache.width = width;
    this.nebulaCache.height = height;
    this.nebulaCacheCtx = this.nebulaCache.getContext('2d')!;

    // 惑星用キャッシュ
    this.planetCache = document.createElement('canvas');
    this.planetCache.width = width;
    this.planetCache.height = height;
    this.planetCacheCtx = this.planetCache.getContext('2d')!;

    // 静的要素統合キャッシュ（Phase 2追加）
    this.staticElementsCache = document.createElement('canvas');
    this.staticElementsCache.width = width;
    this.staticElementsCache.height = height;
    this.staticElementsCacheCtx = this.staticElementsCache.getContext('2d')!;
  }

  /**
   * 背景グラデーションを事前レンダリング
   */
  private renderBackgroundToCache(): void {
    const ctx = this.backgroundCacheCtx;
    const gradient = ctx.createLinearGradient(
      0,
      0,
      0,
      this.config.canvas.height
    );
    gradient.addColorStop(0, 'rgba(10, 10, 35, 1)');
    gradient.addColorStop(0.5, 'rgba(20, 20, 50, 1)');
    gradient.addColorStop(1, 'rgba(30, 30, 70, 1)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.config.canvas.width, this.config.canvas.height);

    this.backgroundCacheValid = true;
  }

  /**
   * 改良された背景グラデーションを事前レンダリング
   */
  private renderEnhancedBackgroundToCache(): void {
    const ctx = this.backgroundCacheCtx;

    // より深い宇宙感のある多層グラデーション
    const gradient = ctx.createRadialGradient(
      this.config.canvas.width * 0.3,
      this.config.canvas.height * 0.2,
      0,
      this.config.canvas.width * 0.5,
      this.config.canvas.height * 0.5,
      Math.max(this.config.canvas.width, this.config.canvas.height)
    );

    gradient.addColorStop(0, 'rgba(25, 25, 60, 1)'); // 中心部 - 深い青紫
    gradient.addColorStop(0.3, 'rgba(15, 15, 45, 1)'); // 中間 - 暗い青
    gradient.addColorStop(0.7, 'rgba(8, 8, 25, 1)'); // 外側 - 深い暗闇
    gradient.addColorStop(1, 'rgba(5, 5, 15, 1)'); // 最外層 - ほぼ黒

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.config.canvas.width, this.config.canvas.height);

    // 微細な星の輝きをオーバーレイとして追加
    this.addStardustOverlay(ctx);

    this.backgroundCacheValid = true;
  }

  /**
   * 微細な星屑オーバーレイを追加
   */
  private addStardustOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.globalCompositeOperation = 'screen';

    // ランダムな微細な光点を散りばめる
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * this.config.canvas.width;
      const y = Math.random() * this.config.canvas.height;
      const size = Math.random() * 0.8 + 0.2;
      const alpha = Math.random() * 0.3 + 0.1;

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * 星雲を事前レンダリング
   */
  private renderNebulaToCache(nebulas: Nebula[]): void {
    const ctx = this.nebulaCacheCtx;
    ctx.clearRect(0, 0, this.config.canvas.width, this.config.canvas.height);

    nebulas.forEach(nebula => {
      nebula.draw(ctx);
    });

    this.nebulaCacheValid = true;
  }

  /**
   * 惑星を事前レンダリング（定期的に更新）
   */
  private renderPlanetsToCache(planets: Planet[]): void {
    const ctx = this.planetCacheCtx;
    ctx.clearRect(0, 0, this.config.canvas.width, this.config.canvas.height);

    planets.forEach(planet => {
      planet.draw(ctx);
    });

    this.planetCacheValid = true;
    this.planetCacheFrameCounter = 0;
  }

  /**
   * 静的要素を統合キャッシュに事前レンダリング（Phase 2追加）
   * 背景グラデーション、星雲、惑星を一つのキャッシュに統合
   */
  private renderStaticElementsToCache(
    nebulas: Nebula[],
    planets: Planet[]
  ): void {
    const ctx = this.staticElementsCacheCtx;
    ctx.clearRect(0, 0, this.config.canvas.width, this.config.canvas.height);

    // 1. 背景グラデーション
    if (!this.backgroundCacheValid) {
      this.renderEnhancedBackgroundToCache();
    }
    ctx.drawImage(this.backgroundCache, 0, 0);

    // 2. 星雲（完全静的）
    if (!this.nebulaCacheValid) {
      this.renderNebulaToCache(nebulas);
    }
    ctx.drawImage(this.nebulaCache, 0, 0);

    // 3. 惑星（定期更新が必要だが、静的キャッシュに含める）
    this.planetCacheFrameCounter++;
    if (
      !this.planetCacheValid ||
      this.planetCacheFrameCounter >= this.planetCacheUpdateInterval
    ) {
      this.renderPlanetsToCache(planets);
    }
    ctx.drawImage(this.planetCache, 0, 0);

    this.staticElementsCacheValid = true;
  }

  /**
   * 最適化された背景描画（新しいエンティティ対応）
   * @param ctx メインキャンバスのコンテキスト
   * @param stars 星の配列
   * @param planets 惑星の配列
   * @param nebulas 星雲の配列
   * @param auroras オーロラの配列
   * @param comets 彗星の配列
   * @param meteorShowers 流星群の配列
   * @param spaceDusts 宇宙塵雲の配列
   */
  public drawEnhancedBackground(
    ctx: CanvasRenderingContext2D,
    stars: Star[],
    planets: Planet[],
    nebulas: Nebula[],
    auroras: Aurora[],
    comets: Comet[],
    meteorShowers: MeteorShower[],
    spaceDusts: SpaceDust[]
  ): void {
    const startTime = performance.now();

    // 1. 背景グラデーション（改良版 - より深い宇宙感）
    if (!this.backgroundCacheValid) {
      this.renderEnhancedBackgroundToCache();
    }
    ctx.drawImage(this.backgroundCache, 0, 0);

    // 2. 星雲（キャッシュ使用 - 完全静的）
    if (!this.nebulaCacheValid) {
      this.renderNebulaToCache(nebulas);
    }
    ctx.drawImage(this.nebulaCache, 0, 0);

    // 3. 宇宙塵雲（遠景エフェクト）
    spaceDusts.forEach(dust => dust.draw(ctx));

    // 4. 惑星（定期更新キャッシュ使用）
    this.planetCacheFrameCounter++;
    if (
      !this.planetCacheValid ||
      this.planetCacheFrameCounter >= this.planetCacheUpdateInterval
    ) {
      this.renderPlanetsToCache(planets);
    }
    ctx.drawImage(this.planetCache, 0, 0);

    // 5. 星（毎フレーム描画 - 改良されたバリエーション）
    stars.forEach(star => star.draw(ctx));

    // 6. 流星群（中景エフェクト）
    meteorShowers.forEach(shower => shower.draw(ctx));

    // 7. 彗星（動的エフェクト）
    comets.forEach(comet => comet.draw(ctx));

    // 8. オーロラ（前景エフェクト）
    auroras.forEach(aurora => aurora.draw(ctx));

    // パフォーマンス測定
    const endTime = performance.now();
    this.recordRenderTime(endTime - startTime);
    this.performanceMonitor.recordRenderTime(endTime - startTime);
  }

  /**
   * LOD対応の最適化された背景描画（Phase 2改良版）
   * パフォーマンスに基づいて動的に品質を調整 + 静的キャッシュ統合
   */
  public drawOptimizedBackgroundWithLOD(
    ctx: CanvasRenderingContext2D,
    stars: Star[],
    planets: Planet[],
    nebulas: Nebula[],
    auroras: Aurora[],
    comets: Comet[],
    meteorShowers: MeteorShower[],
    spaceDusts: SpaceDust[],
    deltaTime: number
  ): void {
    // パフォーマンス監視開始
    this.performanceMonitor.startFrame();
    const startTime = performance.now();

    // LODシステム更新
    this.lodManager.updateLOD(deltaTime);
    const lodSettings = this.lodManager.getCurrentSettings();
    const currentLOD = this.lodManager.getCurrentLevel();

    // メモリ使用量更新
    this.performanceMonitor.updateMemoryUsage();

    // Phase 2: 静的要素統合キャッシュの使用
    if (
      !this.staticElementsCacheValid ||
      this.planetCacheFrameCounter >= this.planetCacheUpdateInterval
    ) {
      this.renderStaticElementsToCache(nebulas, planets);
    }

    // 静的要素を一括描画（背景、星雲、惑星）
    if (currentLOD !== LODLevel.LOW) {
      ctx.globalAlpha = lodSettings.effectIntensity;
      ctx.drawImage(this.staticElementsCache, 0, 0);
      ctx.globalAlpha = 1.0;
    } else {
      // 低品質モードでは背景のみ
      if (!this.backgroundCacheValid) {
        this.renderEnhancedBackgroundToCache();
      }
      ctx.drawImage(this.backgroundCache, 0, 0);
    }

    // 動的要素の描画
    // 3. 宇宙塵雲（LOD調整）
    const adjustedSpaceDusts = this.getAdjustedEntityArray(
      spaceDusts,
      lodSettings.particleMultiplier
    );
    adjustedSpaceDusts.forEach(dust => dust.draw(ctx));

    // 5. 星（LOD調整）
    const adjustedStars = this.getAdjustedEntityArray(
      stars,
      lodSettings.particleMultiplier
    );
    adjustedStars.forEach(star => star.draw(ctx));

    // 6. 流星群（中品質以上で描画）
    if (currentLOD !== LODLevel.LOW) {
      const adjustedMeteorShowers = this.getAdjustedEntityArray(
        meteorShowers,
        lodSettings.particleMultiplier
      );
      adjustedMeteorShowers.forEach(shower => shower.draw(ctx));
    }

    // 7. 彗星（LOD調整）
    const adjustedComets = this.getAdjustedEntityArray(
      comets,
      lodSettings.particleMultiplier
    );
    adjustedComets.forEach(comet => comet.draw(ctx));

    // 8. オーロラ（LOD調整）
    const adjustedAuroras = this.getAdjustedEntityArray(
      auroras,
      lodSettings.particleMultiplier
    );
    ctx.globalAlpha = lodSettings.effectIntensity;
    adjustedAuroras.forEach(aurora => aurora.draw(ctx));
    ctx.globalAlpha = 1.0;

    // パフォーマンス測定終了
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    this.recordRenderTime(renderTime);
    this.performanceMonitor.recordRenderTime(renderTime);
  }

  /**
   * 最適化された背景描画（従来版との互換性維持）
   * @param ctx メインキャンバスのコンテキスト
   * @param stars 星の配列
   * @param planets 惑星の配列
   * @param nebulas 星雲の配列
   * @param auroras オーロラの配列
   */
  public drawOptimizedBackground(
    ctx: CanvasRenderingContext2D,
    stars: Star[],
    planets: Planet[],
    nebulas: Nebula[],
    auroras: Aurora[]
  ): void {
    const startTime = performance.now();

    // 1. 背景グラデーション（キャッシュ使用）
    if (!this.backgroundCacheValid) {
      this.renderBackgroundToCache();
    }
    ctx.drawImage(this.backgroundCache, 0, 0);

    // 2. 星雲（キャッシュ使用 - 完全静的）
    if (!this.nebulaCacheValid) {
      this.renderNebulaToCache(nebulas);
    }
    ctx.drawImage(this.nebulaCache, 0, 0);

    // 3. 惑星（定期更新キャッシュ使用）
    this.planetCacheFrameCounter++;
    if (
      !this.planetCacheValid ||
      this.planetCacheFrameCounter >= this.planetCacheUpdateInterval
    ) {
      this.renderPlanetsToCache(planets);
    }
    ctx.drawImage(this.planetCache, 0, 0);

    // 4. 星（毎フレーム描画 - アニメーション有り）
    stars.forEach(star => star.draw(ctx));

    // 5. オーロラ（毎フレーム描画 - アニメーション有り）
    auroras.forEach(aurora => aurora.draw(ctx));

    // パフォーマンス測定
    const endTime = performance.now();
    this.recordRenderTime(endTime - startTime);
    this.performanceMonitor.recordRenderTime(endTime - startTime);
  }

  /**
   * 従来の描画方法（比較用）
   */
  public drawTraditionalBackground(
    ctx: CanvasRenderingContext2D,
    stars: Star[],
    planets: Planet[],
    nebulas: Nebula[],
    auroras: Aurora[]
  ): void {
    const startTime = performance.now();

    // 背景グラデーション
    const gradient = ctx.createLinearGradient(
      0,
      0,
      0,
      this.config.canvas.height
    );
    gradient.addColorStop(0, 'rgba(10, 10, 35, 1)');
    gradient.addColorStop(0.5, 'rgba(20, 20, 50, 1)');
    gradient.addColorStop(1, 'rgba(30, 30, 70, 1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.config.canvas.width, this.config.canvas.height);

    // 全要素を毎フレーム描画
    nebulas.forEach(nebula => nebula.draw(ctx));
    planets.forEach(planet => planet.draw(ctx));
    stars.forEach(star => star.draw(ctx));
    auroras.forEach(aurora => aurora.draw(ctx));

    // パフォーマンス測定
    const endTime = performance.now();
    this.recordRenderTime(endTime - startTime);
    this.performanceMonitor.recordRenderTime(endTime - startTime);
  }

  /**
   * 描画時間を記録
   */
  private recordRenderTime(time: number): void {
    this.renderTimes.push(time);
    if (this.renderTimes.length > this.maxRenderTimeHistory) {
      this.renderTimes.shift();
    }
  }

  /**
   * パフォーマンス統計を取得（レガシー）
   */
  public getPerformanceStats(): {
    averageRenderTime: number;
    minRenderTime: number;
    maxRenderTime: number;
    sampleCount: number;
    cacheUtilization: {
      background: boolean;
      nebula: boolean;
      planet: boolean;
    };
  } {
    if (this.renderTimes.length === 0) {
      return {
        averageRenderTime: 0,
        minRenderTime: 0,
        maxRenderTime: 0,
        sampleCount: 0,
        cacheUtilization: {
          background: this.backgroundCacheValid,
          nebula: this.nebulaCacheValid,
          planet: this.planetCacheValid,
        },
      };
    }

    const sum = this.renderTimes.reduce((a, b) => a + b, 0);
    return {
      averageRenderTime: sum / this.renderTimes.length,
      minRenderTime: Math.min(...this.renderTimes),
      maxRenderTime: Math.max(...this.renderTimes),
      sampleCount: this.renderTimes.length,
      cacheUtilization: {
        background: this.backgroundCacheValid,
        nebula: this.nebulaCacheValid,
        planet: this.planetCacheValid,
      },
    };
  }

  /**
   * 詳細なパフォーマンス統計を取得（新システム）
   */
  public getDetailedPerformanceStats(): {
    performanceMetrics: PerformanceMetrics;
    lodStats: any;
    cacheUtilization: {
      background: boolean;
      nebula: boolean;
      planet: boolean;
    };
    renderingStats: {
      totalFrames: number;
      averageRenderTime: number;
      cacheHitRate: number;
    };
  } {
    return {
      performanceMetrics: this.performanceMonitor.getMetrics(),
      lodStats: this.lodManager.getLODStats(),
      cacheUtilization: {
        background: this.backgroundCacheValid,
        nebula: this.nebulaCacheValid,
        planet: this.planetCacheValid,
      },
      renderingStats: {
        totalFrames: this.renderTimes.length,
        averageRenderTime:
          this.renderTimes.length > 0
            ? this.renderTimes.reduce((a, b) => a + b, 0) /
              this.renderTimes.length
            : 0,
        cacheHitRate: this.calculateCacheHitRate(),
      },
    };
  }

  /**
   * パフォーマンスベースの設定更新
   */
  public updatePerformanceBasedSettings(): void {
    const now = performance.now();
    const deltaTime = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    // LODシステム更新
    this.lodManager.updateLOD(deltaTime);

    // メモリ使用量更新
    this.performanceMonitor.updateMemoryUsage();

    // 動的な惑星キャッシュ更新間隔調整
    const lodSettings = this.lodManager.getCurrentSettings();
    this.planetCacheUpdateInterval = Math.floor(
      16 / lodSettings.updateFrequency
    );
  }

  /**
   * LOD対応のエンティティ配列調整
   */
  private getAdjustedEntityArray<T>(entities: T[], multiplier: number): T[] {
    if (multiplier >= 1.0) {
      return entities;
    }

    const targetCount = Math.floor(entities.length * multiplier);
    if (targetCount >= entities.length) {
      return entities;
    }

    // 均等に間引く
    const step = entities.length / targetCount;
    const result: T[] = [];

    for (let i = 0; i < targetCount; i++) {
      const index = Math.floor(i * step);
      if (index < entities.length) {
        result.push(entities[index]);
      }
    }

    return result;
  }

  /**
   * キャッシュヒット率を計算
   */
  private calculateCacheHitRate(): number {
    const totalCaches = 3;
    let hitCount = 0;

    if (this.backgroundCacheValid) hitCount++;
    if (this.nebulaCacheValid) hitCount++;
    if (this.planetCacheValid) hitCount++;

    return hitCount / totalCaches;
  }

  /**
   * パフォーマンス監視システムへのアクセス
   */
  public getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }

  /**
   * LOD管理システムへのアクセス
   */
  public getLODManager(): LODManager {
    return this.lodManager;
  }

  /**
   * キャッシュを無効化（画面サイズ変更時など）
   */
  public invalidateCache(): void {
    this.backgroundCacheValid = false;
    this.nebulaCacheValid = false;
    this.planetCacheValid = false;
    this.staticElementsCacheValid = false;
    this.planetCacheFrameCounter = 0;
  }

  /**
   * リソースクリーンアップ
   */
  public dispose(): void {
    this.renderTimes.length = 0;
    this.invalidateCache();
  }

  /**
   * デバッグ情報を表示（拡張版）
   */
  public logPerformanceInfo(): void {
    const legacyStats = this.getPerformanceStats();
    const detailedStats = this.getDetailedPerformanceStats();

    console.group('🎨 Background Renderer Performance');

    // レガシー統計
    console.group('📊 Legacy Stats');
    console.log(
      `⏱️ Average Render Time: ${legacyStats.averageRenderTime.toFixed(2)}ms`
    );
    console.log(
      `📈 Min/Max Render Time: ${legacyStats.minRenderTime.toFixed(2)}ms / ${legacyStats.maxRenderTime.toFixed(2)}ms`
    );
    console.log(`📋 Sample Count: ${legacyStats.sampleCount}`);
    console.log(`💾 Cache Status:`, legacyStats.cacheUtilization);
    console.groupEnd();

    // 詳細パフォーマンス統計
    console.group('🚀 Advanced Performance Metrics');
    this.performanceMonitor.logPerformanceInfo();
    console.groupEnd();

    // LOD統計
    console.group('🎯 LOD System Stats');
    this.lodManager.logLODInfo();
    console.groupEnd();

    // レンダリング統計
    console.group('🎨 Rendering Stats');
    console.log(`🖼️ Total Frames: ${detailedStats.renderingStats.totalFrames}`);
    console.log(
      `⚡ Cache Hit Rate: ${(detailedStats.renderingStats.cacheHitRate * 100).toFixed(1)}%`
    );
    console.log(
      `🔄 Planet Cache Update Interval: ${this.planetCacheUpdateInterval} frames`
    );
    console.groupEnd();

    console.groupEnd();
  }

  /**
   * 簡易パフォーマンス情報を表示
   */
  public logSimplePerformanceInfo(): void {
    const stats = this.getPerformanceStats();
    console.log('Background Renderer Performance:', {
      'Average Render Time': `${stats.averageRenderTime.toFixed(2)}ms`,
      'Min/Max Render Time': `${stats.minRenderTime.toFixed(2)}ms / ${stats.maxRenderTime.toFixed(2)}ms`,
      'Sample Count': stats.sampleCount,
      'Cache Status': stats.cacheUtilization,
    });
  }
}
