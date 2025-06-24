import { Boss } from '../entities/Boss';
import { Bullet } from '../entities/Bullet';
import { DroppedWeapon } from '../entities/DroppedWeapon';
import { Enemy } from '../entities/Enemy';
import { GameObject } from '../entities/GameObject';
import { Player } from '../entities/Player';
import { PowerUp } from '../entities/PowerUp';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';
import { IPlayer } from '../interfaces/IPlayer';
import { GameObjectManager } from '../managers/GameObjectManager';
import { checkCollision } from '../utils/CollisionUtils';
import { CollisionOptimizer } from '../utils/SpatialHash';

import { ChainLightningProcessor } from './ChainLightningProcessor';
import { EnchantmentEffectProcessor } from './EnchantmentEffectProcessor';

/**
 * 衝突判定システム - SpatialHash最適化版
 * 全ての衝突判定処理を統合管理し、SpatialHashによるO(n)最適化を適用
 */
export class CollisionSystem {
  private collisionOptimizer: CollisionOptimizer;
  private totalChecks = 0;
  private spatialHashChecks = 0;
  // 武器発見状態管理（重複発火防止用）
  private discoveredWeapons = new Set<DroppedWeapon>();
  // エンチャント効果処理システム
  private enchantmentProcessor?: EnchantmentEffectProcessor;
  // 連鎖効果処理システム
  private chainLightningProcessor?: ChainLightningProcessor;

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
    // 衝突可能な全オブジェクトを取得（ドロップされた武器を含む）
    const allObjects =
      this.gameObjectManager.getAllCollidableObjectsWithWeapons();
    allObjects.push(player as unknown as GameObject);

    // 空間分割による最適化を適用
    this.collisionOptimizer.updateSpatialHash(allObjects);

    // 各種衝突判定を実行（SpatialHash最適化版）
    this.checkBulletEnemyCollisions();
    this.checkBulletPlayerCollisions(player);
    this.checkPlayerEnemyCollisions(player);
    this.checkPlayerPowerupCollisions(player);
    this.checkPlayerDroppedWeaponCollisions(player);

    const boss = this.gameObjectManager.getBoss();
    if (boss) {
      this.checkBossBattleCollisions(player, boss);
    }
  }

  /**
   * 弾丸と敵の衝突判定（SpatialHash最適化版 + エンチャント効果対応）
   * O(n²) → O(n) に最適化、貫通効果に対応
   */
  private checkBulletEnemyCollisions(): void {
    const enemies = this.gameObjectManager.getEnemies();
    if (enemies.length === 0) return;

    // プレイヤーの弾丸を処理（エンチャント効果あり）
    this.processPlayerBulletCollisions(enemies);

    // ボス弾丸を処理（エンチャント効果なし）
    this.processBossBulletCollisions(enemies);
  }

  /**
   * プレイヤーの弾丸と敵の衝突判定
   */
  private processPlayerBulletCollisions(enemies: Enemy[]): void {
    const bullets = this.gameObjectManager.getBullets();
    if (bullets.length === 0) return;

    bullets.forEach(bullet => {
      if (!bullet.isActive()) return;

      const nearbyObjects = this.collisionOptimizer
        .getSpatialHash()
        .getNearby(bullet);
      this.spatialHashChecks += nearbyObjects.size;
      this.totalChecks += enemies.length;

      let hitCount = 0;
      const maxPiercing = bullet.isPiercing() ? bullet.getPiercingCount() : 0;

      for (const nearbyObj of nearbyObjects) {
        if (this.isEnemy(nearbyObj) && enemies.includes(nearbyObj)) {
          if (this.checkCollision(bullet, nearbyObj)) {
            hitCount++;

            // エンチャント効果処理
            this.processEnchantmentEffects(bullet, nearbyObj);

            // 貫通判定：貫通効果がない場合は即座に弾丸を無効化
            if (!bullet.isPiercing()) {
              bullet.deactivate();
              break;
            }

            // 貫通効果がある場合は、貫通回数をチェック
            if (hitCount >= maxPiercing + 1) {
              bullet.deactivate();
              break;
            }
          }
        }
      }
    });
  }

  /**
   * ボス弾丸と敵の衝突判定（エンチャント効果なし）
   */
  private processBossBulletCollisions(enemies: Enemy[]): void {
    // ボス弾丸の処理
    const bossBullets = this.gameObjectManager.getBossBullets();
    const homingBullets = this.gameObjectManager.getHomingBullets();
    const explosiveBullets = this.gameObjectManager.getExplosiveBullets();
    const reflectingBullets = this.gameObjectManager.getReflectingBullets();
    const splitBullets = this.gameObjectManager.getSplitBullets();

    // 各弾丸タイプを個別に処理
    [
      ...bossBullets,
      ...homingBullets,
      ...explosiveBullets,
      ...reflectingBullets,
      ...splitBullets,
    ].forEach(bullet => {
      if (!bullet.isActive()) return;

      const nearbyObjects = this.collisionOptimizer
        .getSpatialHash()
        .getNearby(bullet);
      this.spatialHashChecks += nearbyObjects.size;
      this.totalChecks += enemies.length;

      for (const nearbyObj of nearbyObjects) {
        if (this.isEnemy(nearbyObj) && enemies.includes(nearbyObj)) {
          if (this.checkCollision(bullet, nearbyObj)) {
            // ボス弾丸は貫通しないので即座に無効化
            bullet.deactivate();
            break;
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

    const nearbyObjects = this.collisionOptimizer
      .getSpatialHash()
      .getNearby(player as unknown as GameObject);
    this.spatialHashChecks += nearbyObjects.size;
    this.totalChecks += bullets.length;

    for (const nearbyObj of nearbyObjects) {
      if (this.isBullet(nearbyObj) && bullets.includes(nearbyObj)) {
        // プレイヤーの弾丸は除外
        if (nearbyObj.getOwner() === 'player') {
          continue;
        }

        if (
          nearbyObj.isActive() &&
          this.checkCollision(player as unknown as GameObject, nearbyObj)
        ) {
          console.log('💥 敵弾丸がプレイヤーに命中:', {
            bulletOwner: nearbyObj.getOwner(),
            damage: 20,
          });
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

    const nearbyObjects = this.collisionOptimizer
      .getSpatialHash()
      .getNearby(player as unknown as GameObject);
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

    const nearbyObjects = this.collisionOptimizer
      .getSpatialHash()
      .getNearby(player as unknown as GameObject);
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
   * プレイヤーとドロップされた武器の衝突判定（SpatialHash最適化版）
   */
  private checkPlayerDroppedWeaponCollisions(player: IPlayer): void {
    const droppedWeapons = this.gameObjectManager.getDroppedWeapons();
    if (droppedWeapons.length === 0) return;

    const nearbyObjects = this.collisionOptimizer
      .getSpatialHash()
      .getNearby(player as unknown as GameObject);
    this.spatialHashChecks += nearbyObjects.size;
    this.totalChecks += droppedWeapons.length;

    for (const nearbyObj of nearbyObjects) {
      if (
        this.isDroppedWeapon(nearbyObj) &&
        droppedWeapons.includes(nearbyObj)
      ) {
        // DroppedWeaponクラスの距離チェックメソッドを使用
        const playerPos = player.getPosition();

        if (nearbyObj.checkPlayerDistance(playerPos.x, playerPos.y)) {
          // 重複発火防止：武器が既に発見済みかチェック
          if (!this.discoveredWeapons.has(nearbyObj)) {
            console.log(
              `🔍 武器発見: ${nearbyObj.getEnchantedWeapon().displayName}`
            );

            // 武器を発見済みとしてマーク
            this.discoveredWeapons.add(nearbyObj);

            // 武器比較システムを呼び出す
            this.eventEmitter.emit('weaponFound', {
              droppedWeapon: nearbyObj,
              playerPosition: playerPos,
            });
          }
        } else {
          // プレイヤーが離れた場合は発見状態をリセット
          if (this.discoveredWeapons.has(nearbyObj)) {
            this.discoveredWeapons.delete(nearbyObj);
          }
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
      const nearbyObjects = this.collisionOptimizer
        .getSpatialHash()
        .getNearby(player as unknown as GameObject);
      bossBullets.forEach((bossBullet, index) => {
        if (nearbyObjects.has(bossBullet)) {
          if (
            this.checkCollision(player as unknown as GameObject, bossBullet)
          ) {
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
   * 型ガード関数：オブジェクトがDroppedWeaponかどうかを判定
   */
  private isDroppedWeapon(obj: GameObject): obj is DroppedWeapon {
    return obj instanceof DroppedWeapon;
  }

  /**
   * 最適化された衝突チェック（外部API）
   */
  public checkOptimizedCollisions<T extends GameObject, U extends GameObject>(
    sourceObjects: T[],
    targetObjects: U[],
    collisionCallback: (source: T, target: U) => void
  ): void {
    this.collisionOptimizer.checkCollisions(
      sourceObjects,
      targetObjects,
      collisionCallback
    );
  }

  /**
   * 衝突最適化システムの統計情報を取得（デバッグ用）
   */
  public getOptimizationStats(): {
    cellCount: number;
    objectCount: number;
    avgObjectsPerCell: number;
  } {
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
  public getCollisionStats(): {
    totalChecks: number;
    spatialHashChecks: number;
    optimizationRatio: number;
  } {
    const optimizationRatio =
      this.totalChecks > 0 ? this.spatialHashChecks / this.totalChecks : 0;
    return {
      totalChecks: this.totalChecks,
      spatialHashChecks: this.spatialHashChecks,
      optimizationRatio,
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
        getHeight: () => 50,
      } as Player;

      this.checkAllCollisions(mockPlayer);
    }
  }

  /**
   * 発見済み武器の状態をクリア（デバッグ用）
   */
  public clearDiscoveredWeapons(): void {
    this.discoveredWeapons.clear();
    console.log('🧹 CollisionSystem: 発見済み武器状態をクリア');
  }

  /**
   * 発見済み武器の数を取得（デバッグ用）
   */
  public getDiscoveredWeaponsCount(): number {
    return this.discoveredWeapons.size;
  }

  /**
   * エンチャント効果を処理する
   * @param bullet 弾丸
   * @param enemy 敵
   */
  private processEnchantmentEffects(bullet: Bullet, enemy: Enemy): void {
    this.enchantmentProcessor ??= new EnchantmentEffectProcessor(
      this.gameObjectManager,
      this.eventEmitter
    );

    this.enchantmentProcessor.processEffects(bullet, enemy);
  }

  /**
   * 連鎖効果の視覚効果を描画
   */
  public renderChainLightningEffects(ctx: CanvasRenderingContext2D): void {
    if (this.chainLightningProcessor) {
      this.chainLightningProcessor.renderVisualEffects(ctx);
    }
  }

  /**
   * 連鎖効果処理システムを取得（遅延初期化）
   */
  private getChainLightningProcessor(): ChainLightningProcessor {
    this.chainLightningProcessor ??= new ChainLightningProcessor(
      this.gameObjectManager,
      this.eventEmitter
    );
    return this.chainLightningProcessor;
  }

  /**
   * 連鎖効果のデバッグモードを設定
   */
  public setChainLightningDebugMode(enabled: boolean): void {
    this.getChainLightningProcessor().setDebugMode(enabled);
  }

  /**
   * 連鎖効果のパフォーマンス統計を取得
   */
  public getChainLightningStats(): {
    activeEffects: number;
    spatialHashCells: number;
  } {
    return this.getChainLightningProcessor().getPerformanceStats();
  }
}
