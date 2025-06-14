/**
 * パフォーマンス監視システム
 * FPS、描画時間、メモリ使用量の詳細監視とリアルタイム統計情報の収集・表示
 */

// Chrome Performance Memory API の型定義
interface PerformanceMemory {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
    memory: PerformanceMemory;
}

export interface PerformanceMetrics {
    fps: number;
    averageFPS: number;
    minFPS: number;
    maxFPS: number;
    frameTime: number;
    averageFrameTime: number;
    renderTime: number;
    averageRenderTime: number;
    memoryUsage: number;
    memoryTrend: 'stable' | 'increasing' | 'decreasing';
    timestamp: number;
}

export interface PerformanceWarning {
    type: 'fps' | 'memory' | 'render-time';
    severity: 'low' | 'medium' | 'high';
    message: string;
    value: number;
    threshold: number;
    timestamp: number;
}

export interface PerformanceThresholds {
    fps: {
        warning: number;
        critical: number;
    };
    memory: {
        warning: number; // MB
        critical: number; // MB
    };
    renderTime: {
        warning: number; // ms
        critical: number; // ms
    };
}

export class PerformanceMonitor {
    private fpsHistory: number[] = [];
    private frameTimeHistory: number[] = [];
    private renderTimeHistory: number[] = [];
    private memoryHistory: number[] = [];
    
    private lastFrameTime = 0;
    private frameCount = 0;
    private lastFPSUpdate = 0;
    private currentFPS = 0;
    
    private readonly maxHistorySize = 100;
    private readonly fpsUpdateInterval = 1000; // 1秒間隔でFPS更新
    
    private warnings: PerformanceWarning[] = [];
    private readonly maxWarnings = 50;
    
    private thresholds: PerformanceThresholds = {
        fps: {
            warning: 45,
            critical: 30
        },
        memory: {
            warning: 100,
            critical: 200
        },
        renderTime: {
            warning: 20,
            critical: 33.33 // 30FPS相当
        }
    };

    constructor(customThresholds?: Partial<PerformanceThresholds>) {
        if (customThresholds) {
            this.thresholds = { ...this.thresholds, ...customThresholds };
        }
        this.lastFrameTime = performance.now();
        this.lastFPSUpdate = this.lastFrameTime;
    }

    /**
     * フレーム開始時に呼び出す
     */
    public startFrame(): void {
        const now = performance.now();
        const frameTime = now - this.lastFrameTime;
        
        this.frameTimeHistory.push(frameTime);
        if (this.frameTimeHistory.length > this.maxHistorySize) {
            this.frameTimeHistory.shift();
        }
        
        this.frameCount++;
        
        // FPS計算（1秒間隔）
        if (now - this.lastFPSUpdate >= this.fpsUpdateInterval) {
            this.currentFPS = (this.frameCount * 1000) / (now - this.lastFPSUpdate);
            this.fpsHistory.push(this.currentFPS);
            
            if (this.fpsHistory.length > this.maxHistorySize) {
                this.fpsHistory.shift();
            }
            
            this.frameCount = 0;
            this.lastFPSUpdate = now;
            
            // FPS警告チェック
            this.checkFPSWarnings(this.currentFPS);
        }
        
        this.lastFrameTime = now;
    }

    /**
     * 描画時間を記録
     */
    public recordRenderTime(renderTime: number): void {
        this.renderTimeHistory.push(renderTime);
        if (this.renderTimeHistory.length > this.maxHistorySize) {
            this.renderTimeHistory.shift();
        }
        
        // 描画時間警告チェック
        this.checkRenderTimeWarnings(renderTime);
    }

    /**
     * メモリ使用量を更新
     */
    public updateMemoryUsage(): void {
        if ('memory' in performance && this.hasMemoryInfo(performance)) {
            const memInfo = performance.memory;
            if (memInfo && typeof memInfo.usedJSHeapSize === 'number') {
                const usedMemoryMB = memInfo.usedJSHeapSize / (1024 * 1024);
                
                this.memoryHistory.push(usedMemoryMB);
                if (this.memoryHistory.length > this.maxHistorySize) {
                    this.memoryHistory.shift();
                }
                
                // メモリ警告チェック
                this.checkMemoryWarnings(usedMemoryMB);
            }
        }
    }

    /**
     * 現在のパフォーマンス指標を取得
     */
    public getMetrics(): PerformanceMetrics {
        const averageFPS = this.calculateAverage(this.fpsHistory);
        const averageFrameTime = this.calculateAverage(this.frameTimeHistory);
        const averageRenderTime = this.calculateAverage(this.renderTimeHistory);
        const currentMemory = this.memoryHistory.length > 0 ? this.memoryHistory[this.memoryHistory.length - 1] : 0;
        
        return {
            fps: this.currentFPS,
            averageFPS,
            minFPS: this.fpsHistory.length > 0 ? Math.min(...this.fpsHistory) : 0,
            maxFPS: this.fpsHistory.length > 0 ? Math.max(...this.fpsHistory) : 0,
            frameTime: this.frameTimeHistory.length > 0 ? this.frameTimeHistory[this.frameTimeHistory.length - 1] : 0,
            averageFrameTime,
            renderTime: this.renderTimeHistory.length > 0 ? this.renderTimeHistory[this.renderTimeHistory.length - 1] : 0,
            averageRenderTime,
            memoryUsage: currentMemory,
            memoryTrend: this.getMemoryTrend(),
            timestamp: performance.now()
        };
    }

    /**
     * パフォーマンス統計情報を取得
     */
    public getDetailedStats(): {
        fps: { current: number; average: number; min: number; max: number; stability: number };
        frameTime: { current: number; average: number; min: number; max: number };
        renderTime: { current: number; average: number; min: number; max: number };
        memory: { current: number; average: number; min: number; max: number; trend: string };
        warnings: PerformanceWarning[];
    } {
        const fpsStability = this.calculateStability(this.fpsHistory);
        
        return {
            fps: {
                current: this.currentFPS,
                average: this.calculateAverage(this.fpsHistory),
                min: this.fpsHistory.length > 0 ? Math.min(...this.fpsHistory) : 0,
                max: this.fpsHistory.length > 0 ? Math.max(...this.fpsHistory) : 0,
                stability: fpsStability
            },
            frameTime: {
                current: this.frameTimeHistory.length > 0 ? this.frameTimeHistory[this.frameTimeHistory.length - 1] : 0,
                average: this.calculateAverage(this.frameTimeHistory),
                min: this.frameTimeHistory.length > 0 ? Math.min(...this.frameTimeHistory) : 0,
                max: this.frameTimeHistory.length > 0 ? Math.max(...this.frameTimeHistory) : 0
            },
            renderTime: {
                current: this.renderTimeHistory.length > 0 ? this.renderTimeHistory[this.renderTimeHistory.length - 1] : 0,
                average: this.calculateAverage(this.renderTimeHistory),
                min: this.renderTimeHistory.length > 0 ? Math.min(...this.renderTimeHistory) : 0,
                max: this.renderTimeHistory.length > 0 ? Math.max(...this.renderTimeHistory) : 0
            },
            memory: {
                current: this.memoryHistory.length > 0 ? this.memoryHistory[this.memoryHistory.length - 1] : 0,
                average: this.calculateAverage(this.memoryHistory),
                min: this.memoryHistory.length > 0 ? Math.min(...this.memoryHistory) : 0,
                max: this.memoryHistory.length > 0 ? Math.max(...this.memoryHistory) : 0,
                trend: this.getMemoryTrend()
            },
            warnings: [...this.warnings]
        };
    }

    /**
     * パフォーマンス警告を取得
     */
    public getWarnings(): PerformanceWarning[] {
        return [...this.warnings];
    }

    /**
     * 警告をクリア
     */
    public clearWarnings(): void {
        this.warnings.length = 0;
    }

    /**
     * 推奨LODレベルを取得
     */
    public getRecommendedLODLevel(): 'HIGH' | 'MEDIUM' | 'LOW' {
        const metrics = this.getMetrics();
        
        // FPSベースの判定
        if (metrics.averageFPS >= 55) {
            return 'HIGH';
        } else if (metrics.averageFPS >= 40) {
            return 'MEDIUM';
        } else {
            return 'LOW';
        }
    }

    /**
     * パフォーマンス情報をコンソールに出力
     */
    public logPerformanceInfo(): void {
        const stats = this.getDetailedStats();
        
        console.group('🚀 Performance Monitor Stats');
        console.log(`📊 FPS: ${stats.fps.current.toFixed(1)} (avg: ${stats.fps.average.toFixed(1)}, stability: ${(stats.fps.stability * 100).toFixed(1)}%)`);
        console.log(`⏱️ Frame Time: ${stats.frameTime.current.toFixed(2)}ms (avg: ${stats.frameTime.average.toFixed(2)}ms)`);
        console.log(`🎨 Render Time: ${stats.renderTime.current.toFixed(2)}ms (avg: ${stats.renderTime.average.toFixed(2)}ms)`);
        console.log(`💾 Memory: ${stats.memory.current.toFixed(1)}MB (trend: ${stats.memory.trend})`);
        
        if (stats.warnings.length > 0) {
            console.warn(`⚠️ Active Warnings: ${stats.warnings.length}`);
            stats.warnings.slice(-5).forEach(warning => {
                console.warn(`  ${warning.type}: ${warning.message}`);
            });
        }
        
        console.log(`🎯 Recommended LOD: ${this.getRecommendedLODLevel()}`);
        console.groupEnd();
    }

    /**
     * 履歴をリセット
     */
    public reset(): void {
        this.fpsHistory.length = 0;
        this.frameTimeHistory.length = 0;
        this.renderTimeHistory.length = 0;
        this.memoryHistory.length = 0;
        this.warnings.length = 0;
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.lastFPSUpdate = this.lastFrameTime;
        this.currentFPS = 0;
    }

    private calculateAverage(values: number[]): number {
        if (values.length === 0) return 0;
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }

    private calculateStability(values: number[]): number {
        if (values.length < 2) return 1;
        
        const average = this.calculateAverage(values);
        const variance = values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / values.length;
        const standardDeviation = Math.sqrt(variance);
        
        // 安定性を0-1の範囲で表現（標準偏差が小さいほど安定）
        return Math.max(0, 1 - (standardDeviation / average));
    }

    private getMemoryTrend(): 'stable' | 'increasing' | 'decreasing' {
        if (this.memoryHistory.length < 10) return 'stable';
        
        const recent = this.memoryHistory.slice(-10);
        const older = this.memoryHistory.slice(-20, -10);
        
        if (older.length === 0) return 'stable';
        
        const recentAvg = this.calculateAverage(recent);
        const olderAvg = this.calculateAverage(older);
        const threshold = olderAvg * 0.05; // 5%の変化を閾値とする
        
        if (recentAvg > olderAvg + threshold) {
            return 'increasing';
        } else if (recentAvg < olderAvg - threshold) {
            return 'decreasing';
        } else {
            return 'stable';
        }
    }

    private checkFPSWarnings(fps: number): void {
        if (fps < this.thresholds.fps.critical) {
            this.addWarning('fps', 'high', `Critical FPS drop: ${fps.toFixed(1)} FPS`, fps, this.thresholds.fps.critical);
        } else if (fps < this.thresholds.fps.warning) {
            this.addWarning('fps', 'medium', `Low FPS detected: ${fps.toFixed(1)} FPS`, fps, this.thresholds.fps.warning);
        }
    }

    private checkRenderTimeWarnings(renderTime: number): void {
        if (renderTime > this.thresholds.renderTime.critical) {
            this.addWarning('render-time', 'high', `Critical render time: ${renderTime.toFixed(2)}ms`, renderTime, this.thresholds.renderTime.critical);
        } else if (renderTime > this.thresholds.renderTime.warning) {
            this.addWarning('render-time', 'medium', `High render time: ${renderTime.toFixed(2)}ms`, renderTime, this.thresholds.renderTime.warning);
        }
    }

    private checkMemoryWarnings(memoryMB: number): void {
        if (memoryMB > this.thresholds.memory.critical) {
            this.addWarning('memory', 'high', `Critical memory usage: ${memoryMB.toFixed(1)}MB`, memoryMB, this.thresholds.memory.critical);
        } else if (memoryMB > this.thresholds.memory.warning) {
            this.addWarning('memory', 'medium', `High memory usage: ${memoryMB.toFixed(1)}MB`, memoryMB, this.thresholds.memory.warning);
        }
    }

    private addWarning(type: PerformanceWarning['type'], severity: PerformanceWarning['severity'], message: string, value: number, threshold: number): void {
        const warning: PerformanceWarning = {
            type,
            severity,
            message,
            value,
            threshold,
            timestamp: performance.now()
        };
        
        this.warnings.push(warning);
        
        if (this.warnings.length > this.maxWarnings) {
            this.warnings.shift();
        }
    }

    /**
     * 型ガード関数：performanceオブジェクトがmemoryプロパティを持つかチェック
     */
    private hasMemoryInfo(perf: Performance): perf is PerformanceWithMemory {
        return 'memory' in perf && typeof (perf as any).memory === 'object';
    }
}