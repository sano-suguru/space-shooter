import { Player } from '../entities/Player';
import { GameObjectManager } from '../managers/GameObjectManager';
import { BackgroundRenderer } from './BackgroundRenderer';

/**
 * ゲームの描画処理を専門に扱うクラス
 * Game.tsから描画関連の責務を分離
 */
export class GameRenderer {
    private useOptimizedBackground = true;

    constructor(
        private ctx: CanvasRenderingContext2D,
        private backgroundRenderer: BackgroundRenderer
    ) {}

    /**
     * ゲーム全体の描画処理
     */
    public render(
        player: Player,
        gameObjectManager: GameObjectManager,
        deltaTime: number = 16.67
    ): void {
        this.drawBackground(gameObjectManager, deltaTime);
        this.drawGameObjects(player, gameObjectManager);
    }

    /**
     * 最適化された背景描画（LOD対応・新しい幻想的なエンティティを含む）
     */
    private drawBackground(gameObjectManager: GameObjectManager, deltaTime: number = 16.67): void {
        const stars = gameObjectManager.getStars();
        const planets = gameObjectManager.getPlanets();
        const nebulas = gameObjectManager.getNebulas();
        const auroras = gameObjectManager.getAuroras();
        
        // 新しい幻想的なエンティティを取得
        const comets = gameObjectManager.getComets();
        const meteorShowers = gameObjectManager.getMeteorShowers();
        const spaceDusts = gameObjectManager.getSpaceDusts();

        if (this.useOptimizedBackground) {
            // Phase 2: LOD対応の最適化描画を使用（推奨）
            this.backgroundRenderer.drawOptimizedBackgroundWithLOD(
                this.ctx,
                stars,
                planets,
                nebulas,
                auroras,
                comets,
                meteorShowers,
                spaceDusts,
                deltaTime
            );
        } else {
            // Phase 1: 基本的な最適化描画（互換性維持）
            this.backgroundRenderer.drawEnhancedBackground(
                this.ctx,
                stars,
                planets,
                nebulas,
                auroras,
                comets,
                meteorShowers,
                spaceDusts
            );
        }
    }

    /**
     * ゲームオブジェクトの描画
     */
    private drawGameObjects(
        player: Player,
        gameObjectManager: GameObjectManager
    ): void {
        // プレイヤー描画
        player.draw(this.ctx);

        // ゲームオブジェクト描画
        gameObjectManager.getBullets().forEach(bullet => bullet.draw(this.ctx));
        gameObjectManager.getEnemies().forEach(enemy => enemy.draw(this.ctx));
        gameObjectManager.getPowerups().forEach(powerup => powerup.draw(this.ctx));
        gameObjectManager.getExplosions().forEach(explosion => explosion.draw(this.ctx));

        // ボス関連描画
        const boss = gameObjectManager.getBoss();
        if (boss) {
            boss.draw(this.ctx);
            gameObjectManager.getBossBullets().forEach(bullet => bullet.draw(this.ctx));
        }
    }

    /**
     * 背景レンダリング最適化の切り替え
     */
    public toggleBackgroundOptimization(): void {
        this.useOptimizedBackground = !this.useOptimizedBackground;
        console.log(`Background optimization: ${this.useOptimizedBackground ? 'ON' : 'OFF'}`);
    }

    /**
     * 背景レンダリングパフォーマンス統計を取得（レガシー）
     */
    public getBackgroundPerformanceStats() {
        return this.backgroundRenderer.getPerformanceStats();
    }

    /**
     * 詳細な背景レンダリングパフォーマンス統計を取得
     */
    public getDetailedBackgroundPerformanceStats() {
        return this.backgroundRenderer.getDetailedPerformanceStats();
    }

    /**
     * パフォーマンス監視システムへのアクセス
     */
    public getPerformanceMonitor() {
        return this.backgroundRenderer.getPerformanceMonitor();
    }

    /**
     * LOD管理システムへのアクセス
     */
    public getLODManager() {
        return this.backgroundRenderer.getLODManager();
    }

    /**
     * 背景レンダリングパフォーマンス情報をコンソールに出力
     */
    public logBackgroundPerformance(): void {
        this.backgroundRenderer.logPerformanceInfo();
    }

    /**
     * リソースクリーンアップ
     */
    public dispose(): void {
        this.backgroundRenderer.dispose();
    }
}
