import { GAME_CONSTANTS } from '../constants/GameConstants';
import { Star } from '../entities/Star';
import { Planet } from '../entities/Planet';
import { Nebula } from '../entities/Nebula';
import { Aurora } from '../entities/Aurora';

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

    // キャッシュ状態管理
    private backgroundCacheValid = false;
    private nebulaCacheValid = false;
    private planetCacheValid = false;

    // パフォーマンス測定
    private renderTimes: number[] = [];
    private maxRenderTimeHistory = 100;

    // 惑星キャッシュ更新間隔（回転アニメーション用）
    private planetCacheUpdateInterval = 16; // ~60FPS時に16フレームごと
    private planetCacheFrameCounter = 0;

    constructor() {
        this.initializeCaches();
    }

    /**
     * キャッシュ用オフスクリーンキャンバスを初期化
     */
    private initializeCaches(): void {
        const width = GAME_CONSTANTS.CANVAS.WIDTH;
        const height = GAME_CONSTANTS.CANVAS.HEIGHT;

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
    }

    /**
     * 背景グラデーションを事前レンダリング
     */
    private renderBackgroundToCache(): void {
        const ctx = this.backgroundCacheCtx;
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONSTANTS.CANVAS.HEIGHT);
        gradient.addColorStop(0, 'rgba(10, 10, 35, 1)');
        gradient.addColorStop(0.5, 'rgba(20, 20, 50, 1)');
        gradient.addColorStop(1, 'rgba(30, 30, 70, 1)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_CONSTANTS.CANVAS.WIDTH, GAME_CONSTANTS.CANVAS.HEIGHT);

        this.backgroundCacheValid = true;
    }

    /**
     * 星雲を事前レンダリング
     */
    private renderNebulaToCache(nebulas: Nebula[]): void {
        const ctx = this.nebulaCacheCtx;
        ctx.clearRect(0, 0, GAME_CONSTANTS.CANVAS.WIDTH, GAME_CONSTANTS.CANVAS.HEIGHT);

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
        ctx.clearRect(0, 0, GAME_CONSTANTS.CANVAS.WIDTH, GAME_CONSTANTS.CANVAS.HEIGHT);

        planets.forEach(planet => {
            planet.draw(ctx);
        });

        this.planetCacheValid = true;
        this.planetCacheFrameCounter = 0;
    }

    /**
     * 最適化された背景描画
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
        if (!this.planetCacheValid || this.planetCacheFrameCounter >= this.planetCacheUpdateInterval) {
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
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONSTANTS.CANVAS.HEIGHT);
        gradient.addColorStop(0, 'rgba(10, 10, 35, 1)');
        gradient.addColorStop(0.5, 'rgba(20, 20, 50, 1)');
        gradient.addColorStop(1, 'rgba(30, 30, 70, 1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_CONSTANTS.CANVAS.WIDTH, GAME_CONSTANTS.CANVAS.HEIGHT);

        // 全要素を毎フレーム描画
        nebulas.forEach(nebula => nebula.draw(ctx));
        planets.forEach(planet => planet.draw(ctx));
        stars.forEach(star => star.draw(ctx));
        auroras.forEach(aurora => aurora.draw(ctx));

        // パフォーマンス測定
        const endTime = performance.now();
        this.recordRenderTime(endTime - startTime);
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
     * パフォーマンス統計を取得
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
                    planet: this.planetCacheValid
                }
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
                planet: this.planetCacheValid
            }
        };
    }

    /**
     * キャッシュを無効化（画面サイズ変更時など）
     */
    public invalidateCache(): void {
        this.backgroundCacheValid = false;
        this.nebulaCacheValid = false;
        this.planetCacheValid = false;
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
     * デバッグ情報を表示
     */
    public logPerformanceInfo(): void {
        const stats = this.getPerformanceStats();
        console.log('Background Renderer Performance:', {
            'Average Render Time': `${stats.averageRenderTime.toFixed(2)}ms`,
            'Min/Max Render Time': `${stats.minRenderTime.toFixed(2)}ms / ${stats.maxRenderTime.toFixed(2)}ms`,
            'Sample Count': stats.sampleCount,
            'Cache Status': stats.cacheUtilization
        });
    }
}
