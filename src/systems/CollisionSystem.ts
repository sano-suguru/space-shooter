import { GameObject } from '../entities/GameObject';
import { Player } from '../entities/Player';
import { Boss } from '../entities/Boss';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';
import { GameObjectManager } from '../managers/GameObjectManager';
import { CollisionOptimizer } from '../utils/SpatialHash';
import { checkCollision } from '../utils/CollisionUtils';

/**
 * 衝突判定システム
 * 全ての衝突判定処理を統合管理し、SpatialHashによる最適化を適用
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

        // 各種衝突判定を実行
        this.checkBulletEnemyCollisions();
        this.checkPlayerEnemyCollisions(player);
        this.checkPlayerPowerupCollisions(player);
        
        const boss = this.gameObjectManager.getBoss();
        if (boss) {
            this.checkBossBattleCollisions(player, boss);
        }
    }

    /**
     * 弾丸と敵の衝突判定
     */
    private checkBulletEnemyCollisions(): void {
        const bullets = this.gameObjectManager.getBullets();
        const enemies = this.gameObjectManager.getEnemies();

        for (let i = bullets.length - 1; i >= 0; i--) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                if (this.checkCollision(bullets[i], enemies[j])) {
                    bullets[i].deactivate();
                    if (enemies[j].takeDamage()) {
                        this.eventEmitter.emit('enemyDestroyed', enemies[j]);
                        this.gameObjectManager.removeEnemy(enemies[j]);
                    }
                    break;
                }
            }
        }
    }

    /**
     * プレイヤーと敵の衝突判定
     */
    private checkPlayerEnemyCollisions(player: Player): void {
        const enemies = this.gameObjectManager.getEnemies();

        for (let i = enemies.length - 1; i >= 0; i--) {
            if (this.checkCollision(player, enemies[i])) {
                this.eventEmitter.emit('playerDamaged', 20);
                this.eventEmitter.emit('enemyDestroyed', enemies[i]);
                this.gameObjectManager.removeEnemy(enemies[i]);
            }
        }
    }

    /**
     * プレイヤーとパワーアップの衝突判定
     */
    private checkPlayerPowerupCollisions(player: Player): void {
        const powerups = this.gameObjectManager.getPowerups();

        for (let i = powerups.length - 1; i >= 0; i--) {
            if (this.checkCollision(player, powerups[i])) {
                this.eventEmitter.emit('powerUpCollected', powerups[i]);
                this.gameObjectManager.removePowerUp(powerups[i]);
            }
        }
    }

    /**
     * ボス戦の衝突判定
     */
    private checkBossBattleCollisions(player: Player, boss: Boss): void {
        const bullets = this.gameObjectManager.getBullets();
        const bossBullets = this.gameObjectManager.getBossBullets();

        // プレイヤーとボスの衝突
        if (this.checkCollision(player, boss)) {
            this.eventEmitter.emit('playerDamaged', 20);
        }

        // プレイヤーの弾丸とボスの衝突
        for (let i = bullets.length - 1; i >= 0; i--) {
            if (this.checkCollision(bullets[i], boss)) {
                bullets[i].deactivate();
                this.eventEmitter.emit('bossDamaged');
            }
        }

        // プレイヤーとボス弾の衝突
        for (let i = bossBullets.length - 1; i >= 0; i--) {
            if (this.checkCollision(player, bossBullets[i])) {
                this.eventEmitter.emit('playerDamaged', 20);
                // ボス弾は一度当たったら消える
                bossBullets.splice(i, 1);
            }
        }
    }

    /**
     * 基本的な衝突判定ヘルパーメソッド
     */
    private checkCollision(obj1: GameObject, obj2: GameObject): boolean {
        return checkCollision(obj1, obj2);
    }

    /**
     * 最適化された衝突チェック（将来的にSpatialHashを活用）
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
}
