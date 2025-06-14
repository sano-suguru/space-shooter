import {
  PerformanceMonitor,
  PerformanceMetrics,
} from '../utils/PerformanceMonitor';

/**
 * Level of Detail (LOD) システム
 * パフォーマンスに基づいて動的に描画品質を調整
 */

export enum LODLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface LODSettings {
  particleMultiplier: number;
  detailLevel: number;
  updateFrequency: number;
  effectIntensity: number;
  animationQuality: number;
}

export interface LODThresholds {
  high: {
    minFPS: number;
    maxMemoryMB: number;
    maxRenderTimeMS: number;
  };
  medium: {
    minFPS: number;
    maxMemoryMB: number;
    maxRenderTimeMS: number;
  };
  low: {
    minFPS: number;
    maxMemoryMB: number;
    maxRenderTimeMS: number;
  };
}

export interface LODConfiguration {
  [LODLevel.HIGH]: LODSettings;
  [LODLevel.MEDIUM]: LODSettings;
  [LODLevel.LOW]: LODSettings;
}

export class LODManager {
  private currentLevel: LODLevel = LODLevel.HIGH;
  private previousLevel: LODLevel = LODLevel.HIGH;
  private performanceMonitor: PerformanceMonitor;

  private thresholds: LODThresholds = {
    high: {
      minFPS: 55,
      maxMemoryMB: 50,
      maxRenderTimeMS: 16.67, // 60FPS相当
    },
    medium: {
      minFPS: 40,
      maxMemoryMB: 75,
      maxRenderTimeMS: 25, // 40FPS相当
    },
    low: {
      minFPS: 25,
      maxMemoryMB: 100,
      maxRenderTimeMS: 40, // 25FPS相当
    },
  };

  private lodConfiguration: LODConfiguration = {
    [LODLevel.HIGH]: {
      particleMultiplier: 1.0,
      detailLevel: 1.0,
      updateFrequency: 1.0,
      effectIntensity: 1.0,
      animationQuality: 1.0,
    },
    [LODLevel.MEDIUM]: {
      particleMultiplier: 0.6,
      detailLevel: 0.8,
      updateFrequency: 0.8,
      effectIntensity: 0.8,
      animationQuality: 0.8,
    },
    [LODLevel.LOW]: {
      particleMultiplier: 0.3,
      detailLevel: 0.5,
      updateFrequency: 0.5,
      effectIntensity: 0.6,
      animationQuality: 0.5,
    },
  };

  // LOD切り替えのヒステリシス（頻繁な切り替えを防ぐ）
  private levelChangeTimer = 0;
  private readonly levelChangeDelay = 2000; // 2秒間の遅延
  private readonly evaluationInterval = 500; // 500ms間隔で評価
  private lastEvaluationTime = 0;

  // パフォーマンス履歴（安定性判定用）
  private performanceHistory: PerformanceMetrics[] = [];
  private readonly maxHistorySize = 10;

  constructor(
    performanceMonitor: PerformanceMonitor,
    customThresholds?: Partial<LODThresholds>
  ) {
    this.performanceMonitor = performanceMonitor;

    if (customThresholds) {
      this.thresholds = { ...this.thresholds, ...customThresholds };
    }
  }

  /**
   * パフォーマンス指標に基づいてLODレベルを更新
   */
  public updateLOD(deltaTime: number): void {
    const now = performance.now();

    // 評価間隔チェック
    if (now - this.lastEvaluationTime < this.evaluationInterval) {
      return;
    }

    this.lastEvaluationTime = now;

    // パフォーマンス指標を取得
    const metrics = this.performanceMonitor.getMetrics();
    this.addPerformanceHistory(metrics);

    // 推奨LODレベルを計算
    const recommendedLevel = this.calculateRecommendedLOD(metrics);

    // レベル変更のタイマー管理
    if (recommendedLevel !== this.currentLevel) {
      this.levelChangeTimer += deltaTime;

      if (this.levelChangeTimer >= this.levelChangeDelay) {
        this.changeLODLevel(recommendedLevel);
        this.levelChangeTimer = 0;
      }
    } else {
      this.levelChangeTimer = 0;
    }
  }

  /**
   * 現在のLODレベルを取得
   */
  public getCurrentLevel(): LODLevel {
    return this.currentLevel;
  }

  /**
   * 現在のLOD設定を取得
   */
  public getCurrentSettings(): LODSettings {
    return { ...this.lodConfiguration[this.currentLevel] };
  }

  /**
   * 指定されたベース数に対してLOD調整されたパーティクル数を取得
   */
  public getAdjustedParticleCount(baseCount: number): number {
    const settings = this.getCurrentSettings();
    return Math.floor(baseCount * settings.particleMultiplier);
  }

  /**
   * 詳細レベルの倍率を取得
   */
  public getDetailMultiplier(): number {
    return this.getCurrentSettings().detailLevel;
  }

  /**
   * 更新頻度の倍率を取得
   */
  public getUpdateFrequencyMultiplier(): number {
    return this.getCurrentSettings().updateFrequency;
  }

  /**
   * エフェクト強度の倍率を取得
   */
  public getEffectIntensityMultiplier(): number {
    return this.getCurrentSettings().effectIntensity;
  }

  /**
   * アニメーション品質の倍率を取得
   */
  public getAnimationQualityMultiplier(): number {
    return this.getCurrentSettings().animationQuality;
  }

  /**
   * 手動でLODレベルを設定
   */
  public setLODLevel(level: LODLevel): void {
    if (level !== this.currentLevel) {
      this.changeLODLevel(level);
    }
  }

  /**
   * LOD統計情報を取得
   */
  public getLODStats(): {
    currentLevel: LODLevel;
    previousLevel: LODLevel;
    settings: LODSettings;
    thresholds: LODThresholds;
    changeTimer: number;
    performanceStable: boolean;
    recommendedLevel: LODLevel;
  } {
    const metrics = this.performanceMonitor.getMetrics();
    const recommendedLevel = this.calculateRecommendedLOD(metrics);

    return {
      currentLevel: this.currentLevel,
      previousLevel: this.previousLevel,
      settings: this.getCurrentSettings(),
      thresholds: this.thresholds,
      changeTimer: this.levelChangeTimer,
      performanceStable: this.isPerformanceStable(),
      recommendedLevel,
    };
  }

  /**
   * LOD設定をカスタマイズ
   */
  public customizeLODSettings(
    level: LODLevel,
    settings: Partial<LODSettings>
  ): void {
    this.lodConfiguration[level] = {
      ...this.lodConfiguration[level],
      ...settings,
    };
  }

  /**
   * 閾値をカスタマイズ
   */
  public customizeThresholds(thresholds: Partial<LODThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * デバッグ情報をコンソールに出力
   */
  public logLODInfo(): void {
    const stats = this.getLODStats();
    const metrics = this.performanceMonitor.getMetrics();

    console.group('🎯 LOD Manager Stats');
    console.log(`📊 Current Level: ${stats.currentLevel}`);
    console.log(`🔄 Recommended Level: ${stats.recommendedLevel}`);
    console.log(`⚖️ Performance Stable: ${stats.performanceStable}`);
    console.log(`⏱️ Change Timer: ${(stats.changeTimer / 1000).toFixed(1)}s`);

    console.group('🎛️ Current Settings');
    console.log(
      `🎨 Particle Multiplier: ${(stats.settings.particleMultiplier * 100).toFixed(0)}%`
    );
    console.log(
      `🔍 Detail Level: ${(stats.settings.detailLevel * 100).toFixed(0)}%`
    );
    console.log(
      `🔄 Update Frequency: ${(stats.settings.updateFrequency * 100).toFixed(0)}%`
    );
    console.log(
      `✨ Effect Intensity: ${(stats.settings.effectIntensity * 100).toFixed(0)}%`
    );
    console.log(
      `🎬 Animation Quality: ${(stats.settings.animationQuality * 100).toFixed(0)}%`
    );
    console.groupEnd();

    console.group('📈 Performance Metrics');
    console.log(
      `📊 FPS: ${metrics.fps.toFixed(1)} (avg: ${metrics.averageFPS.toFixed(1)})`
    );
    console.log(`💾 Memory: ${metrics.memoryUsage.toFixed(1)}MB`);
    console.log(`🎨 Render Time: ${metrics.renderTime.toFixed(2)}ms`);
    console.groupEnd();

    console.groupEnd();
  }

  /**
   * LODシステムをリセット
   */
  public reset(): void {
    this.currentLevel = LODLevel.HIGH;
    this.previousLevel = LODLevel.HIGH;
    this.levelChangeTimer = 0;
    this.performanceHistory.length = 0;
    this.lastEvaluationTime = 0;
  }

  private calculateRecommendedLOD(metrics: PerformanceMetrics): LODLevel {
    // 複数の指標を総合的に評価
    const fpsScore = this.calculateFPSScore(metrics.averageFPS);
    const memoryScore = this.calculateMemoryScore(metrics.memoryUsage);
    const renderTimeScore = this.calculateRenderTimeScore(
      metrics.averageRenderTime
    );

    // 重み付き平均（FPSを最重要視）
    const totalScore =
      fpsScore * 0.5 + memoryScore * 0.3 + renderTimeScore * 0.2;

    if (totalScore >= 0.8) {
      return LODLevel.HIGH;
    } else if (totalScore >= 0.5) {
      return LODLevel.MEDIUM;
    } else {
      return LODLevel.LOW;
    }
  }

  private calculateFPSScore(fps: number): number {
    if (fps >= this.thresholds.high.minFPS) {
      return 1.0;
    } else if (fps >= this.thresholds.medium.minFPS) {
      return 0.7;
    } else if (fps >= this.thresholds.low.minFPS) {
      return 0.4;
    } else {
      return 0.0;
    }
  }

  private calculateMemoryScore(memoryMB: number): number {
    if (memoryMB <= this.thresholds.high.maxMemoryMB) {
      return 1.0;
    } else if (memoryMB <= this.thresholds.medium.maxMemoryMB) {
      return 0.7;
    } else if (memoryMB <= this.thresholds.low.maxMemoryMB) {
      return 0.4;
    } else {
      return 0.0;
    }
  }

  private calculateRenderTimeScore(renderTimeMS: number): number {
    if (renderTimeMS <= this.thresholds.high.maxRenderTimeMS) {
      return 1.0;
    } else if (renderTimeMS <= this.thresholds.medium.maxRenderTimeMS) {
      return 0.7;
    } else if (renderTimeMS <= this.thresholds.low.maxRenderTimeMS) {
      return 0.4;
    } else {
      return 0.0;
    }
  }

  private changeLODLevel(newLevel: LODLevel): void {
    if (newLevel === this.currentLevel) return;

    this.previousLevel = this.currentLevel;
    this.currentLevel = newLevel;

    console.log(
      `🎯 LOD Level changed: ${this.previousLevel} → ${this.currentLevel}`
    );

    // レベル変更イベントを発火（将来的にEventEmitterと統合可能）
    this.onLODLevelChanged(this.previousLevel, this.currentLevel);
  }

  private onLODLevelChanged(oldLevel: LODLevel, newLevel: LODLevel): void {
    // LODレベル変更時の処理
    // 将来的にはEventEmitterを使用してイベントを発火
    console.log(`🔄 LOD transition: ${oldLevel} → ${newLevel}`);
  }

  private addPerformanceHistory(metrics: PerformanceMetrics): void {
    this.performanceHistory.push(metrics);

    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.shift();
    }
  }

  private isPerformanceStable(): boolean {
    if (this.performanceHistory.length < 5) return false;

    const recentMetrics = this.performanceHistory.slice(-5);
    const fpsValues = recentMetrics.map(m => m.fps);

    // FPSの標準偏差を計算
    const average =
      fpsValues.reduce((sum, fps) => sum + fps, 0) / fpsValues.length;
    const variance =
      fpsValues.reduce((sum, fps) => sum + Math.pow(fps - average, 2), 0) /
      fpsValues.length;
    const standardDeviation = Math.sqrt(variance);

    // 標準偏差が平均の10%以下なら安定とみなす
    return standardDeviation <= average * 0.1;
  }
}
