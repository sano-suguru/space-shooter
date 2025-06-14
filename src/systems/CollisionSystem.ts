import { GameObject } from '../entities/GameObject';
import { Player } from '../entities/Player';
import { Boss } from '../entities/Boss';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { PowerUp } from '../entities/PowerUp';
import { IPlayer } from '../interfaces/IPlayer';
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
    private totalChecks = 0;
    private spatialHashChecks = 0;

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
    public checkAllCollisions(player: IPlayer): void {
        // 衝突可能な全オブジェクトを取得
        const allObjects = this.gameObjectManager.getAllCollidableObjects();
        allObjects.push(player as unknown as GameObject);

        // 空間分割による最適化を適用
        this.collisionOptimizer.updateSpatialHash(allObjects);

        // 各種衝突判定を実行（SpatialHash最適化版）
        this.checkBulletEnemyCollisions();
        this.checkBulletPlayerCollisions(player);
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
            this.spatialHashChecks += nearbyObjects.size;
            this.totalChecks += enemies.length; // 理論上の総当たり数

            for (const nearbyObj of nearbyObjects) {
                // 型ガードを使用して敵オブジェクトかチェック
                if (this.isEnemy(nearbyObj) && enemies.includes(nearbyObj)) {
                    if (this.checkCollision(bullet, nearbyObj)) {
                        bullet.deactivate();
                        if (nearbyObj.takeDamage()) {
                            this.eventEmitter.emit('enemyDestroyed', nearbyObj);
                            this.gameObjectManager.removeEnemy(nearbyObj);
                        }
                        // 弾丸は一度の衝突で無効化されるが、同じ座標の敵もチェック
                    }
                }
            }
        });
    }

    /**
     * 弾丸とプレイヤーの衝突判定（SpatialHash最適化版）
     * 敵弾丸がプレイヤーに当たった場合を処理
     */
    private checkBulletPlayerCollisions(player: IPlayer): void {
        const bullets = this.gameObjectManager.getBullets();
        if (bullets.length === 0) return;

        const nearbyObjects = this.collisionOptimizer.getSpatialHash().getNearby(player as unknown as GameObject);
        this.spatialHashChecks += nearbyObjects.size;
        this.totalChecks += bullets.length;

        for (const nearbyObj of nearbyObjects) {
            if (this.isBullet(nearbyObj) && bullets.includes(nearbyObj)) {
                if (nearbyObj.isActive() && this.checkCollision(player as unknown as GameObject, nearbyObj)) {
                    this.eventEmitter.emit('playerDamaged', 20);
                    nearbyObj.deactivate();
                    break; // プレイヤーは一度の衝突で処理終了
                }
            }
        }
    }

    /**
     * プレイヤーと敵の衝突判定（SpatialHash最適化版）
     */
    private checkPlayerEnemyCollisions(player: IPlayer): void {
        const enemies = this.gameObjectManager.getEnemies();
        if (enemies.length === 0) return;

        const nearbyObjects = this.collisionOptimizer.getSpatialHash().getNearby(player as unknown as GameObject);
        this.spatialHashChecks += nearbyObjects.size;
        this.totalChecks += enemies.length;

        for (const nearbyObj of nearbyObjects) {
            if (this.isEnemy(nearbyObj) && enemies.includes(nearbyObj)) {
                if (this.checkCollision(player as unknown as GameObject, nearbyObj)) {
                    this.eventEmitter.emit('playerDamaged', 20);
                    this.eventEmitter.emit('enemyDestroyed', nearbyObj);
                    this.gameObjectManager.removeEnemy(nearbyObj);
                }
            }
        }
    }

    /**
     * プレイヤーとパワーアップの衝突判定（SpatialHash最適化版）
     */
    private checkPlayerPowerupCollisions(player: IPlayer): void {
        const powerups = this.gameObjectManager.getPowerups();
        if (powerups.length === 0) return;

        const nearbyObjects = this.collisionOptimizer.getSpatialHash().getNearby(player as unknown as GameObject);
        this.spatialHashChecks += nearbyObjects.size;
        this.totalChecks += powerups.length;

        for (const nearbyObj of nearbyObjects) {
            if (this.isPowerUp(nearbyObj) && powerups.includes(nearbyObj)) {
                if (this.checkCollision(player as unknown as GameObject, nearbyObj)) {
                    this.eventEmitter.emit('powerUpCollected', nearbyObj);
                    this.gameObjectManager.removePowerUp(nearbyObj);
                }
            }
        }
    }

    /**
     * ボス戦の衝突判定（部分的SpatialHash最適化）
     */
    private checkBossBattleCollisions(player: IPlayer, boss: Boss): void {
        const bullets = this.gameObjectManager.getBullets();
        const bossBullets = this.gameObjectManager.getBossBullets();

        // プレイヤーとボスの衝突（単体なので従来通り）
        if (this.checkCollision(player as unknown as GameObject, boss)) {
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
            const nearbyObjects = this.collisionOptimizer.getSpatialHash().getNearby(player as unknown as GameObject);
            bossBullets.forEach((bossBullet, index) => {
                if (nearbyObjects.has(bossBullet)) {
                    if (this.checkCollision(player as unknown as GameObject, bossBullet)) {
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
     * 型ガード関数：オブジェクトがEnemyかどうかを判定
     */
    private isEnemy(obj: GameObject): obj is Enemy {
        return obj instanceof Enemy;
    }

    /**
     * 型ガード関数：オブジェクトがBulletかどうかを判定
     */
    private isBullet(obj: GameObject): obj is Bullet {
        return obj instanceof Bullet;
    }

    /**
     * 型ガード関数：オブジェクトがPowerUpかどうかを判定
     */
    private isPowerUp(obj: GameObject): obj is PowerUp {
        return obj instanceof PowerUp;
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
    public measureCollisionPerformance(player: IPlayer): number {
        const startTime = performance.now();
        this.checkAllCollisions(player);
        const endTime = performance.now();
        const duration = endTime - startTime;

        console.log(`Collision Detection Performance: ${duration.toFixed(3)}ms`);
        return duration;
    }

    /**
     * 衝突判定統計を取得（テスト用）
     */
    public getCollisionStats(): { totalChecks: number; spatialHashChecks: number; optimizationRatio: number } {
        const optimizationRatio = this.totalChecks > 0 ? this.spatialHashChecks / this.totalChecks : 0;
        return {
            totalChecks: this.totalChecks,
            spatialHashChecks: this.spatialHashChecks,
            optimizationRatio
        };
    }

    /**
     * 簡単な衝突判定メソッド（テスト用エイリアス）
     */
    public checkCollisions(): void {
        // GameObjectManagerからプレイヤーを取得
        const player = this.gameObjectManager.getPlayer();
        if (player) {
            // 実際のプレイヤーで衝突判定
            this.checkAllCollisions(player);
        } else {
            // プレイヤーが設定されていない場合のフォールバック
            const allObjects = this.gameObjectManager.getAllCollidableObjects();
            if (allObjects.length === 0) return;

            // 仮のプレイヤー位置でテスト用衝突判定
            const mockPlayer = {
                getX: () => 200,
                getY: () => 300,
                getWidth: () => 50,
                getHeight: () => 50
            } as Player;

            this.checkAllCollisions(mockPlayer);
        }
    }
}
