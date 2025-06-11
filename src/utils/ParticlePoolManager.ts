import { ObjectPool } from './ObjectPool';

/**
 * パーティクル専用のプール管理システム
 * 大量のパーティクル（星雲、オーロラ、宇宙塵）の効率的な管理を提供
 */

export interface ParticlePoolConfig {
    initialSize: number;
    maxSize: number;
    particleType: string;
}

export interface PooledParticle {
    x: number;
    y: number;
    active: boolean;
    reset(): void;
    update(deltaTime: number): void;
    draw(ctx: CanvasRenderingContext2D): void;
}

export interface ParticlePoolStats {
    totalPools: number;
    totalParticles: number;
    activeParticles: number;
    poolUtilization: number;
    memoryEfficiency: number;
    poolDetails: { [poolName: string]: PoolStats };
}

export interface PoolStats {
    poolSize: number;
    activeCount: number;
    utilizationRate: number;
    hitRate: number;
    missCount: number;
    totalRequests: number;
}

/**
 * パーティクルプール管理クラス
 * 背景エンティティの大量パーティクルを効率的に管理
 */
export class ParticlePoolManager {
    private pools = new Map<string, ObjectPool<PooledParticle>>();
    private poolConfigs = new Map<string, ParticlePoolConfig>();
    private poolStats = new Map<string, PoolStats>();
    private totalRequests = 0;
    private totalHits = 0;

    /**
     * パーティクルプールを登録
     */
    public registerPool<T extends PooledParticle>(
        poolName: string,
        createFn: () => T,
        config: ParticlePoolConfig
    ): void {
        const resetFn = (particle: T) => {
            particle.active = false;
            particle.reset();
        };

        const pool = new ObjectPool<T>(
            createFn,
            resetFn,
            config.initialSize,
            config.maxSize
        );

        this.pools.set(poolName, pool as unknown as ObjectPool<PooledParticle>);
        this.poolConfigs.set(poolName, config);
        this.poolStats.set(poolName, {
            poolSize: config.initialSize,
            activeCount: 0,
            utilizationRate: 0,
            hitRate: 0,
            missCount: 0,
            totalRequests: 0
        });
    }

    /**
     * プールからパーティクルを取得
     */
    public getParticle<T extends PooledParticle>(poolName: string): T | null {
        const pool = this.pools.get(poolName);
        const stats = this.poolStats.get(poolName);
        
        if (!pool || !stats) {
            console.warn(`ParticlePool '${poolName}' not found`);
            return null;
        }

        stats.totalRequests++;
        this.totalRequests++;

        const particle = pool.get() as T;
        if (particle) {
            particle.active = true;
            stats.activeCount++;
            this.totalHits++;
            stats.hitRate = this.totalHits / this.totalRequests;
        } else {
            stats.missCount++;
        }

        stats.utilizationRate = stats.activeCount / (stats.poolSize || 1);
        return particle;
    }

    /**
     * パーティクルをプールに返却
     */
    public releaseParticle(poolName: string, particle: PooledParticle): void {
        const pool = this.pools.get(poolName);
        const stats = this.poolStats.get(poolName);
        
        if (!pool || !stats) {
            console.warn(`ParticlePool '${poolName}' not found`);
            return;
        }

        if (particle.active) {
            particle.active = false;
            stats.activeCount = Math.max(0, stats.activeCount - 1);
            stats.utilizationRate = stats.activeCount / (stats.poolSize || 1);
        }

        pool.release(particle);
    }

    /**
     * 指定プールの全アクティブパーティクルを取得
     */
    public getActiveParticles<T extends PooledParticle>(poolName: string): T[] {
        // 実際の実装では、各エンティティが自身のアクティブパーティクルリストを管理
        // ここでは統計情報のみを提供
        // プールの存在確認
        if (!this.pools.has(poolName)) {
            console.warn(`ParticlePool '${poolName}' not found`);
        }
        return [];
    }

    /**
     * 指定プールのパーティクル数を動的に調整
     */
    public adjustPoolSize(poolName: string, newSize: number): void {
        const config = this.poolConfigs.get(poolName);
        const stats = this.poolStats.get(poolName);
        
        if (!config || !stats) {
            console.warn(`ParticlePool '${poolName}' not found`);
            return;
        }

        if (newSize > config.maxSize) {
            console.warn(`Requested size ${newSize} exceeds max size ${config.maxSize} for pool '${poolName}'`);
            return;
        }

        // プールサイズを更新
        stats.poolSize = newSize;
        config.initialSize = newSize;
        stats.utilizationRate = stats.activeCount / newSize;
    }

    /**
     * 全プールの統計情報を取得
     */
    public getStats(): ParticlePoolStats {
        let totalParticles = 0;
        let activeParticles = 0;
        const poolDetails: { [poolName: string]: PoolStats } = {};

        this.poolStats.forEach((stats, poolName) => {
            totalParticles += stats.poolSize;
            activeParticles += stats.activeCount;
            poolDetails[poolName] = { ...stats };
        });

        const poolUtilization = totalParticles > 0 ? activeParticles / totalParticles : 0;
        const memoryEfficiency = this.totalRequests > 0 ? this.totalHits / this.totalRequests : 0;

        return {
            totalPools: this.pools.size,
            totalParticles,
            activeParticles,
            poolUtilization,
            memoryEfficiency,
            poolDetails
        };
    }

    /**
     * 特定プールの統計情報を取得
     */
    public getPoolStats(poolName: string): PoolStats | null {
        return this.poolStats.get(poolName) || null;
    }

    /**
     * 全プールをクリア
     */
    public clearAllPools(): void {
        this.pools.forEach(pool => pool.clear());
        this.poolStats.forEach(stats => {
            stats.activeCount = 0;
            stats.utilizationRate = 0;
        });
    }

    /**
     * 特定プールをクリア
     */
    public clearPool(poolName: string): void {
        const pool = this.pools.get(poolName);
        const stats = this.poolStats.get(poolName);
        
        if (pool && stats) {
            pool.clear();
            stats.activeCount = 0;
            stats.utilizationRate = 0;
        }
    }

    /**
     * プール効率の最適化
     * 使用率に基づいてプールサイズを動的調整
     */
    public optimizePools(): void {
        this.poolStats.forEach((stats, poolName) => {
            const config = this.poolConfigs.get(poolName);
            if (!config) return;

            // 使用率が80%を超える場合、プールサイズを増加
            if (stats.utilizationRate > 0.8 && stats.poolSize < config.maxSize) {
                const newSize = Math.min(
                    Math.floor(stats.poolSize * 1.2),
                    config.maxSize
                );
                this.adjustPoolSize(poolName, newSize);
            }
            // 使用率が30%を下回る場合、プールサイズを減少
            else if (stats.utilizationRate < 0.3 && stats.poolSize > config.initialSize) {
                const newSize = Math.max(
                    Math.floor(stats.poolSize * 0.8),
                    config.initialSize
                );
                this.adjustPoolSize(poolName, newSize);
            }
        });
    }

    /**
     * デバッグ情報をコンソールに出力
     */
    public logStats(): void {
        const stats = this.getStats();
        
        console.group('🎨 Particle Pool Manager Stats');
        console.log(`📊 Total Pools: ${stats.totalPools}`);
        console.log(`🎯 Total Particles: ${stats.totalParticles}`);
        console.log(`⚡ Active Particles: ${stats.activeParticles}`);
        console.log(`📈 Pool Utilization: ${(stats.poolUtilization * 100).toFixed(1)}%`);
        console.log(`💾 Memory Efficiency: ${(stats.memoryEfficiency * 100).toFixed(1)}%`);
        
        console.group('🔍 Pool Details');
        Object.entries(stats.poolDetails).forEach(([poolName, poolStats]) => {
            console.group(`📦 ${poolName}`);
            console.log(`Size: ${poolStats.poolSize}`);
            console.log(`Active: ${poolStats.activeCount}`);
            console.log(`Utilization: ${(poolStats.utilizationRate * 100).toFixed(1)}%`);
            console.log(`Hit Rate: ${(poolStats.hitRate * 100).toFixed(1)}%`);
            console.log(`Misses: ${poolStats.missCount}`);
            console.groupEnd();
        });
        console.groupEnd();
        
        console.groupEnd();
    }

    /**
     * リソースクリーンアップ
     */
    public dispose(): void {
        this.clearAllPools();
        this.pools.clear();
        this.poolConfigs.clear();
        this.poolStats.clear();
        this.totalRequests = 0;
        this.totalHits = 0;
    }
}

/**
 * グローバルなパーティクルプールマネージャーインスタンス
 */
export const globalParticlePoolManager = new ParticlePoolManager();
