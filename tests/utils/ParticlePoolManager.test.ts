import { ParticlePoolManager, PooledParticle } from '../../src/utils/ParticlePoolManager';

// テスト用のパーティクル実装
class TestParticle implements PooledParticle {
    public x: number = 0;
    public y: number = 0;
    public active: boolean = false;

    public reset(): void {
        this.x = 0;
        this.y = 0;
        this.active = false;
    }

    public update(deltaTime: number): void {
        if (this.active) {
            this.x += deltaTime;
            this.y += deltaTime;
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        if (this.active) {
            ctx.fillRect(this.x, this.y, 1, 1);
        }
    }
}

describe('ParticlePoolManager', () => {
    let poolManager: ParticlePoolManager;

    beforeEach(() => {
        poolManager = new ParticlePoolManager();
    });

    afterEach(() => {
        poolManager.dispose();
    });

    describe('プール登録と基本操作', () => {
        test('パーティクルプールを正常に登録できる', () => {
            poolManager.registerPool(
                'test-pool',
                () => new TestParticle(),
                {
                    initialSize: 10,
                    maxSize: 20,
                    particleType: 'test'
                }
            );

            const stats = poolManager.getPoolStats('test-pool');
            expect(stats).toBeDefined();
            expect(stats?.poolSize).toBe(10);
        });

        test('プールからパーティクルを取得できる', () => {
            poolManager.registerPool(
                'test-pool',
                () => new TestParticle(),
                {
                    initialSize: 5,
                    maxSize: 10,
                    particleType: 'test'
                }
            );

            const particle = poolManager.getParticle<TestParticle>('test-pool');
            expect(particle).toBeDefined();
            expect(particle?.active).toBe(true);
        });

        test('パーティクルをプールに返却できる', () => {
            poolManager.registerPool(
                'test-pool',
                () => new TestParticle(),
                {
                    initialSize: 5,
                    maxSize: 10,
                    particleType: 'test'
                }
            );

            const particle = poolManager.getParticle<TestParticle>('test-pool');
            expect(particle).toBeDefined();

            if (particle) {
                poolManager.releaseParticle('test-pool', particle);
                expect(particle.active).toBe(false);
            }
        });
    });

    describe('統計情報', () => {
        test('プール統計情報を正常に取得できる', () => {
            poolManager.registerPool(
                'test-pool',
                () => new TestParticle(),
                {
                    initialSize: 10,
                    maxSize: 20,
                    particleType: 'test'
                }
            );

            const stats = poolManager.getStats();
            expect(stats.totalPools).toBe(1);
            expect(stats.totalParticles).toBe(10);
            expect(stats.activeParticles).toBe(0);
        });

        test('アクティブパーティクル数が正しく追跡される', () => {
            poolManager.registerPool(
                'test-pool',
                () => new TestParticle(),
                {
                    initialSize: 5,
                    maxSize: 10,
                    particleType: 'test'
                }
            );

            // パーティクルを取得
            const particle1 = poolManager.getParticle<TestParticle>('test-pool');
            poolManager.getParticle<TestParticle>('test-pool'); // 2つ目のパーティクル取得

            const stats = poolManager.getStats();
            expect(stats.activeParticles).toBe(2);

            // パーティクルを返却
            if (particle1) {
                poolManager.releaseParticle('test-pool', particle1);
            }

            const updatedStats = poolManager.getStats();
            expect(updatedStats.activeParticles).toBe(1);
        });

        test('プール使用率が正しく計算される', () => {
            poolManager.registerPool(
                'test-pool',
                () => new TestParticle(),
                {
                    initialSize: 10,
                    maxSize: 20,
                    particleType: 'test'
                }
            );

            // 5個のパーティクルを取得
            for (let i = 0; i < 5; i++) {
                poolManager.getParticle<TestParticle>('test-pool');
            }

            const stats = poolManager.getStats();
            expect(stats.poolUtilization).toBe(0.5); // 5/10 = 0.5
        });
    });

    describe('プールサイズ調整', () => {
        test('プールサイズを動的に調整できる', () => {
            poolManager.registerPool(
                'test-pool',
                () => new TestParticle(),
                {
                    initialSize: 10,
                    maxSize: 30,
                    particleType: 'test'
                }
            );

            poolManager.adjustPoolSize('test-pool', 20);

            const stats = poolManager.getPoolStats('test-pool');
            expect(stats?.poolSize).toBe(20);
        });

        test('最大サイズを超えるサイズ調整は拒否される', () => {
            poolManager.registerPool(
                'test-pool',
                () => new TestParticle(),
                {
                    initialSize: 10,
                    maxSize: 20,
                    particleType: 'test'
                }
            );

            // コンソール警告をモック
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            poolManager.adjustPoolSize('test-pool', 30);

            expect(consoleSpy).toHaveBeenCalled();
            
            const stats = poolManager.getPoolStats('test-pool');
            expect(stats?.poolSize).toBe(10); // 変更されない

            consoleSpy.mockRestore();
        });
    });

    describe('プール最適化', () => {
        test('使用率に基づいてプールサイズが自動調整される', () => {
            poolManager.registerPool(
                'test-pool',
                () => new TestParticle(),
                {
                    initialSize: 10,
                    maxSize: 50,
                    particleType: 'test'
                }
            );

            // 使用率を80%以上にする（9個取得）
            for (let i = 0; i < 9; i++) {
                poolManager.getParticle<TestParticle>('test-pool');
            }

            poolManager.optimizePools();

            const stats = poolManager.getPoolStats('test-pool');
            expect(stats?.poolSize).toBeGreaterThan(10);
        });
    });

    describe('エラーハンドリング', () => {
        test('存在しないプールからのパーティクル取得はnullを返す', () => {
            const particle = poolManager.getParticle<TestParticle>('non-existent-pool');
            expect(particle).toBeNull();
        });

        test('存在しないプールへのパーティクル返却は警告を出す', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const testParticle = new TestParticle();

            poolManager.releaseParticle('non-existent-pool', testParticle);

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('存在しないプールの統計情報取得はnullを返す', () => {
            const stats = poolManager.getPoolStats('non-existent-pool');
            expect(stats).toBeNull();
        });
    });

    describe('メモリ効率性', () => {
        test('メモリ効率性が正しく計算される', () => {
            poolManager.registerPool(
                'test-pool',
                () => new TestParticle(),
                {
                    initialSize: 10,
                    maxSize: 20,
                    particleType: 'test'
                }
            );

            // 複数回パーティクルを取得（ヒット率を上げる）
            for (let i = 0; i < 5; i++) {
                poolManager.getParticle<TestParticle>('test-pool');
            }

            const stats = poolManager.getStats();
            expect(stats.memoryEfficiency).toBeGreaterThan(0);
            expect(stats.memoryEfficiency).toBeLessThanOrEqual(1);
        });
    });

    describe('リソースクリーンアップ', () => {
        test('プールクリアが正常に動作する', () => {
            poolManager.registerPool(
                'test-pool',
                () => new TestParticle(),
                {
                    initialSize: 10,
                    maxSize: 20,
                    particleType: 'test'
                }
            );

            // パーティクルを取得
            poolManager.getParticle<TestParticle>('test-pool');

            poolManager.clearPool('test-pool');

            const stats = poolManager.getPoolStats('test-pool');
            expect(stats?.activeCount).toBe(0);
        });

        test('全プールクリアが正常に動作する', () => {
            poolManager.registerPool(
                'test-pool-1',
                () => new TestParticle(),
                {
                    initialSize: 5,
                    maxSize: 10,
                    particleType: 'test'
                }
            );

            poolManager.registerPool(
                'test-pool-2',
                () => new TestParticle(),
                {
                    initialSize: 5,
                    maxSize: 10,
                    particleType: 'test'
                }
            );

            poolManager.clearAllPools();

            const stats = poolManager.getStats();
            expect(stats.activeParticles).toBe(0);
        });

        test('disposeが全リソースをクリーンアップする', () => {
            poolManager.registerPool(
                'test-pool',
                () => new TestParticle(),
                {
                    initialSize: 10,
                    maxSize: 20,
                    particleType: 'test'
                }
            );

            poolManager.dispose();

            const stats = poolManager.getStats();
            expect(stats.totalPools).toBe(0);
            expect(stats.totalParticles).toBe(0);
        });
    });
});
