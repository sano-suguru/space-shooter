import { GameObject } from '../entities/GameObject';
import { Player } from '../entities/Player';
import { Boss } from '../entities/Boss';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';
import { GameObjectManager } from '../managers/GameObjectManager';
import { CollisionOptimizer } from '../utils/SpatialHash';
import { checkCollision } from '../utils/CollisionUtils';

/**
 * 衝突判定システム - SpatialHash最適化版
 * 全ての衝突判定処理を統合管理し、SpatialHashによるO(n)最適化を適用
 */
export class CollisionSystem {
    private collisionOptimizer: CollisionOptimizer;

    constructor(
        private eventEmitter: EventEmitter<EventMap>,
        private gameObjectManager: GameObjectManager
    ) {
        this.collisionOptimizer = new CollisionOptimizer(64);
    }

    /**
     * メインの衝突判定処理
     * 全ての衝突判定を統合的に実行
     */
    public checkAllCollisions(player: Player): void {
        // 衝突可能な全オブジェクトを取得
        const allObjects = this.gameObjectManager.getAllCollidableObjects();
        allObjects.push(player);

        // 空間分割による最適化を適用
        this.collisionOptimizer.updateSpatialHash(allObjects);

        // 各種衝突判定を実行（SpatialHash最適化版）
        this.checkBulletEnemyCollisions();
        this.checkPlayerEnemyCollisions(player);
        this.checkPlayerPowerupCollisions(player);
        
        const boss = this.gameObjectManager.getBoss();
        if (boss) {
            this.checkBossBattleCollisions(player, boss);
        }
    }

    /**
     * 弾丸と敵の衝突判定（SpatialHash最適化版）
     * O(n²) → O(n) に最適化
     */
    private checkBulletEnemyCollisions(): void {
        const bullets = this.gameObjectManager.getBullets();
        const enemies = this.gameObjectManager.getEnemies();

        if (bullets.length === 0 || enemies.length === 0) return;

        // SpatialHashを使用した最適化衝突判定
        bullets.forEach(bullet => {
            if (!bullet.isActive()) return;
            
            const nearbyObjects = this.collisionOptimizer.getSpatialHash().getNearby(bullet);
            for (const nearbyObj of nearbyObjects) {
                // 型安全性を保ちつつ敵オブジェクトかチェック
                if (enemies.includes(nearbyObj as any)) {
                    const enemy = nearbyObj as any;
                    if (this.checkCollision(bullet, enemy)) {
                        bullet.deactivate();
                        if (enemy.takeDamage()) {
                            this.eventEmitter.emit('enemyDestroyed', enemy);
                            this.gameObjectManager.removeEnemy(enemy);
                        }
                        break; // 弾丸は一度の衝突で無効化
                    }
                }
            }
        });
    }

    /**
     * プレイヤーと敵の衝突判定（SpatialHash最適化版）
     */
    private checkPlayerEnemyCollisions(player: Player): void {
        const enemies = this.gameObjectManager.getEnemies();
        if (enemies.length === 0) return;

        const nearbyObjects = this.collisionOptimizer.getSpatialHash().getNearby(player);
        for (const nearbyObj of nearbyObjects) {
            if (enemies.includes(nearbyObj as any)) {
                const enemy = nearbyObj as any;
                if (this.checkCollision(player, enemy)) {
                    this.eventEmitter.emit('playerDamaged', 20);
                    this.eventEmitter.emit('enemyDestroyed', enemy);
                    this.gameObjectManager.removeEnemy(enemy);
                }
            }
        }
    }

    /**
     * プレイヤーとパワーアップの衝突判定（SpatialHash最適化版）
     */
    private checkPlayerPowerupCollisions(player: Player): void {
        const powerups = this.gameObjectManager.getPowerups();
        if (powerups.length === 0) return;

        const nearbyObjects = this.collisionOptimizer.getSpatialHash().getNearby(player);
        for (const nearbyObj of nearbyObjects) {
            if (powerups.includes(nearbyObj as any)) {
                const powerup = nearbyObj as any;
                if (this.checkCollision(player, powerup)) {
                    this.eventEmitter.emit('powerUpCollected', powerup);
                    this.gameObjectManager.removePowerUp(powerup);
                }
            }
        }
    }

    /**
     * ボス戦の衝突判定（部分的SpatialHash最適化）
     */
    private checkBossBattleCollisions(player: Player, boss: Boss): void {
        const bullets = this.gameObjectManager.getBullets();
        const bossBullets = this.gameObjectManager.getBossBullets();

        // プレイヤーとボスの衝突（単体なので従来通り）
        if (this.checkCollision(player, boss)) {
            this.eventEmitter.emit('playerDamaged', 20);
        }

        // プレイヤーの弾丸とボスの衝突（弾丸側を最適化）
        bullets.forEach(bullet => {
            if (!bullet.isActive()) return;
            
            if (this.checkCollision(bullet, boss)) {
                bullet.deactivate();
                this.eventEmitter.emit('bossDamaged');
            }
        });

        // プレイヤーとボス弾の衝突（ボス弾側を最適化）
        if (bossBullets.length > 0) {
            const nearbyObjects = this.collisionOptimizer.getSpatialHash().getNearby(player);
            bossBullets.forEach((bossBullet, index) => {
                if (nearbyObjects.has(bossBullet)) {
                    if (this.checkCollision(player, bossBullet)) {
                        this.eventEmitter.emit('playerDamaged', 20);
                        // ボス弾は一度当たったら消える
                        bossBullets.splice(index, 1);
                    }
                }
            });
        }
    }

    /**
     * 基本的な衝突判定ヘルパーメソッド
     */
    private checkCollision(obj1: GameObject, obj2: GameObject): boolean {
        return checkCollision(obj1, obj2);
    }

    /**
     * 最適化された衝突チェック（外部API）
     */
    public checkOptimizedCollisions<T extends GameObject, U extends GameObject>(
        sourceObjects: T[],
        targetObjects: U[],
        collisionCallback: (source: T, target: U) => void
    ): void {
        this.collisionOptimizer.checkCollisions(sourceObjects, targetObjects, collisionCallback);
    }

    /**
     * 衝突最適化システムの統計情報を取得（デバッグ用）
     */
    public getOptimizationStats(): { cellCount: number; objectCount: number; avgObjectsPerCell: number } {
        return this.collisionOptimizer.getSpatialHash().getDebugInfo();
    }

    /**
     * パフォーマンス測定用：処理時間を測定
     */
    public measureCollisionPerformance(player: Player): number {
        const startTime = performance.now();
        this.checkAllCollisions(player);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`Collision Detection Performance: ${duration.toFixed(3)}ms`);
        return duration;
    }
}
