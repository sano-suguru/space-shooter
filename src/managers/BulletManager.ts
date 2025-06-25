import { BossBullet } from '../entities/BossBullet';
import { Bullet } from '../entities/Bullet';
import { BulletConfig, AdvancedBulletType } from '../entities/bullets';
import { ExplosiveBullet } from '../entities/bullets/ExplosiveBullet';
import { HomingBullet } from '../entities/bullets/HomingBullet';
import { ReflectingBullet } from '../entities/bullets/ReflectingBullet';
import { SplitBullet } from '../entities/bullets/SplitBullet';
import {
  BulletFactory,
  PlayerBulletConfig,
  BossBulletConfig,
} from '../factories/BulletFactory';
import { IBullet } from '../interfaces/IBullet';
import { ObjectPool, PoolManager } from '../utils/ObjectPool';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';

import { GameObjectManager } from './GameObjectManager';

/**
 * 弾丸システムの統一管理クラス
 *
 * IBulletインターフェースを使用した統一的な弾丸管理を提供します。
 * ファクトリーパターンとオブジェクトプールを統合し、
 * パフォーマンスと保守性を向上させます。
 */
export class BulletManager {
  private bullets: Map<string, IBullet> = new Map();
  private bulletIdCounter = 0;
  private poolManager: PoolManager;
  private performanceMonitor: PerformanceMonitor;

  // パフォーマンス統計
  private stats = {
    bulletsCreated: 0,
    bulletsDestroyed: 0,
    poolHits: 0,
    poolMisses: 0,
    memoryOptimizations: 0,
  };

  constructor(private gameObjectManager: GameObjectManager) {
    this.poolManager = new PoolManager();
    this.performanceMonitor = new PerformanceMonitor();
    this.initializeBulletPools();
  }

  /**
   * 弾丸プールを初期化
   */
  private initializeBulletPools(): void {
    // 通常弾丸プール
    const bulletPool = new ObjectPool<IBullet>(
      () => BulletFactory.createPlayerBullet({ x: 0, y: 0 }),
      bullet => bullet.reset(),
      50, // 初期サイズ
      200 // 最大サイズ
    );
    this.poolManager.register('bullet', bulletPool);

    // 特殊弾丸プール
    const specialBulletPool = new ObjectPool<IBullet>(
      () =>
        BulletFactory.createSpecialBullet({
          type: AdvancedBulletType.EXPLOSIVE,
          x: 0,
          y: 0,
          speedX: 0,
          speedY: -5,
        }),
      bullet => bullet.reset(),
      20, // 初期サイズ
      100 // 最大サイズ
    );
    this.poolManager.register('specialBullet', specialBulletPool);
  }

  /**
   * プレイヤー弾丸を作成（プール使用）
   * @param config 弾丸設定
   * @returns 作成された弾丸
   */
  public createPlayerBullet(config: PlayerBulletConfig): IBullet {
    const startTime = performance.now();

    // プールから取得を試行
    const bulletPool = this.poolManager.getPool<IBullet>('bullet');
    let bullet: IBullet;

    if (bulletPool) {
      bullet = bulletPool.get();
      this.stats.poolHits++;
    } else {
      bullet = BulletFactory.createPlayerBullet(config);
      this.stats.poolMisses++;
    }

    const bulletId = this.generateBulletId();
    this.bullets.set(bulletId, bullet);
    this.stats.bulletsCreated++;

    // GameObjectManagerにも追加
    if (bullet instanceof Bullet) {
      this.gameObjectManager.addBullet(bullet);
    }

    // パフォーマンス記録
    const creationTime = performance.now() - startTime;
    this.performanceMonitor.recordRenderTime(creationTime);

    return bullet;
  }

  /**
   * ボス弾丸を作成
   * @param config 弾丸設定
   * @returns 作成された弾丸
   */
  public createBossBullet(config: BossBulletConfig): IBullet {
    const bullet = BulletFactory.createBossBullet(config);
    const bulletId = this.generateBulletId();
    this.bullets.set(bulletId, bullet);

    // GameObjectManagerにも追加
    if (bullet instanceof BossBullet) {
      this.gameObjectManager.addBossBullet(bullet);
    }

    return bullet;
  }

  /**
   * 特殊弾丸を作成
   * @param config 弾丸設定
   * @returns 作成された弾丸
   */
  public createSpecialBullet(config: BulletConfig): IBullet {
    const bullet = BulletFactory.createSpecialBullet(config);
    const bulletId = this.generateBulletId();
    this.bullets.set(bulletId, bullet);

    // 弾丸タイプに応じてGameObjectManagerに追加
    this.addSpecialBulletToManager(bullet, config);

    return bullet;
  }

  /**
   * 全弾丸を更新（パフォーマンス最適化版）
   * @param deltaTime 経過時間
   */
  public updateBullets(deltaTime: number): void {
    const startTime = performance.now();
    this.performanceMonitor.startFrame();

    const bulletsToRemove: string[] = [];
    let activeCount = 0;

    this.bullets.forEach((bullet, id) => {
      if (bullet.isActive()) {
        bullet.update(deltaTime);
        activeCount++;
      } else {
        bulletsToRemove.push(id);
      }
    });

    // 非アクティブな弾丸をプールに返却
    bulletsToRemove.forEach(id => {
      const bullet = this.bullets.get(id);
      if (bullet) {
        this.returnBulletToPool(bullet);
        this.bullets.delete(id);
        this.stats.bulletsDestroyed++;
      }
    });

    // パフォーマンス記録
    const updateTime = performance.now() - startTime;
    this.performanceMonitor.recordRenderTime(updateTime);
    this.performanceMonitor.updateMemoryUsage();

    // 自動最適化（アクティブ弾丸が少ない場合）
    if (activeCount < this.bullets.size * 0.3) {
      this.optimizeMemory();
    }
  }

  /**
   * 弾丸をプールに返却
   * @param bullet 返却する弾丸
   */
  private returnBulletToPool(bullet: IBullet): void {
    // 弾丸タイプに応じて適切なプールに返却
    const bulletPool = this.poolManager.getPool<IBullet>('bullet');
    const specialBulletPool =
      this.poolManager.getPool<IBullet>('specialBullet');

    if (bullet.isExplosive() || bullet.isHoming() || bullet.canSplit()) {
      if (specialBulletPool) {
        specialBulletPool.release(bullet);
      }
    } else {
      if (bulletPool) {
        bulletPool.release(bullet);
      }
    }
  }

  /**
   * 全弾丸を描画
   * @param ctx 描画コンテキスト
   */
  public renderBullets(ctx: CanvasRenderingContext2D): void {
    this.bullets.forEach(bullet => {
      if (bullet.isActive()) {
        bullet.draw(ctx);
      }
    });
  }

  /**
   * 指定された弾丸を削除
   * @param bulletId 弾丸ID
   */
  public removeBullet(bulletId: string): void {
    this.bullets.delete(bulletId);
  }

  /**
   * 全弾丸をクリア
   */
  public clearAllBullets(): void {
    this.bullets.forEach(bullet => {
      bullet.deactivate();
    });
    this.bullets.clear();
  }

  /**
   * アクティブな弾丸数を取得
   * @returns アクティブな弾丸数
   */
  public getActiveBulletCount(): number {
    let count = 0;
    this.bullets.forEach(bullet => {
      if (bullet.isActive()) {
        count++;
      }
    });
    return count;
  }

  /**
   * 弾丸統計情報を取得
   * @returns 弾丸統計
   */
  public getBulletStats(): {
    total: number;
    active: number;
    inactive: number;
    playerBullets: number;
    enemyBullets: number;
    bossBullets: number;
  } {
    let active = 0;
    let playerBullets = 0;
    let enemyBullets = 0;
    let bossBullets = 0;

    this.bullets.forEach(bullet => {
      if (bullet.isActive()) {
        active++;
        const owner = bullet.getOwner();
        switch (owner) {
          case 'player':
            playerBullets++;
            break;
          case 'enemy':
            enemyBullets++;
            break;
          case 'boss':
            bossBullets++;
            break;
        }
      }
    });

    return {
      total: this.bullets.size,
      active,
      inactive: this.bullets.size - active,
      playerBullets,
      enemyBullets,
      bossBullets,
    };
  }

  /**
   * 弾丸IDを生成
   * @returns ユニークな弾丸ID
   */
  private generateBulletId(): string {
    return `bullet_${++this.bulletIdCounter}_${Date.now()}`;
  }

  /**
   * 特殊弾丸をGameObjectManagerに追加
   * @param bullet 弾丸
   * @param config 弾丸設定
   */
  private addSpecialBulletToManager(
    bullet: IBullet,
    config: BulletConfig
  ): void {
    // 弾丸タイプに応じて適切なメソッドを呼び出し
    const bulletType = config.type as string;
    switch (bulletType) {
      case 'explosive':
        if (bullet instanceof ExplosiveBullet) {
          this.gameObjectManager.addExplosiveBullet(bullet);
        }
        break;
      case 'homing':
        if (bullet instanceof HomingBullet) {
          this.gameObjectManager.addHomingBullet(bullet);
        }
        break;
      case 'reflecting':
        if (bullet instanceof ReflectingBullet) {
          this.gameObjectManager.addReflectingBullet(bullet);
        }
        break;
      case 'split':
        if (bullet instanceof SplitBullet) {
          this.gameObjectManager.addSplitBullet(bullet);
        }
        break;
      default:
        // デフォルトは通常弾丸として追加
        if (bullet instanceof Bullet) {
          this.gameObjectManager.addBullet(bullet);
        }
        break;
    }
  }

  /**
   * メモリ使用量を最適化（強化版）
   */
  public optimizeMemory(): void {
    const startTime = performance.now();
    const bulletsToRemove: string[] = [];

    this.bullets.forEach((bullet, id) => {
      if (!bullet.isActive()) {
        this.returnBulletToPool(bullet);
        bulletsToRemove.push(id);
      }
    });

    bulletsToRemove.forEach(id => {
      this.bullets.delete(id);
    });

    // プールも最適化
    this.poolManager.getPool('bullet')?.clear();
    this.poolManager.getPool('specialBullet')?.clear();

    this.stats.memoryOptimizations++;

    const optimizationTime = performance.now() - startTime;
    console.log(
      `🧹 BulletManager: ${bulletsToRemove.length}個の非アクティブ弾丸を削除 (${optimizationTime.toFixed(2)}ms)`
    );
  }

  /**
   * パフォーマンス統計を取得
   */
  public getPerformanceStats(): {
    bullets: {
      bulletsCreated: number;
      bulletsDestroyed: number;
      poolHits: number;
      poolMisses: number;
      memoryOptimizations: number;
    };
    pools: { [key: string]: number };
    performance: ReturnType<PerformanceMonitor['getMetrics']>;
  } {
    return {
      bullets: { ...this.stats },
      pools: this.poolManager.getStats(),
      performance: this.performanceMonitor.getMetrics(),
    };
  }

  /**
   * パフォーマンス情報をログ出力
   */
  public logPerformanceInfo(): void {
    const stats = this.getPerformanceStats();

    console.group('🔫 BulletManager Performance Stats');
    console.log('弾丸統計:', stats.bullets);
    console.log('プール統計:', stats.pools);
    console.log('パフォーマンス:', {
      FPS: stats.performance.fps.toFixed(1),
      メモリ使用量: `${stats.performance.memoryUsage.toFixed(1)}MB`,
      描画時間: `${stats.performance.renderTime.toFixed(2)}ms`,
    });
    console.groupEnd();

    // 詳細なパフォーマンス情報も出力
    this.performanceMonitor.logPerformanceInfo();
  }

  /**
   * デバッグ情報を出力
   */
  public logDebugInfo(): void {
    const stats = this.getBulletStats();
    console.log('🔫 BulletManager統計:', {
      総弾丸数: stats.total,
      アクティブ: stats.active,
      非アクティブ: stats.inactive,
      プレイヤー弾丸: stats.playerBullets,
      敵弾丸: stats.enemyBullets,
      ボス弾丸: stats.bossBullets,
    });
  }
}
