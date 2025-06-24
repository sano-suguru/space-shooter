/**
 * エンチャント効果のデモンストレーション
 *
 * 貫通・クリティカル・凍結効果の動作を確認するためのデモコード
 */

import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';
import { IPlayer } from '../interfaces/IPlayer';
import { GameObjectManager } from '../managers/GameObjectManager';
import { CollisionSystem } from '../systems/CollisionSystem';
import { PowerUpType } from '../types';
import { DamageCalculator } from '../utils/DamageCalculator';

export class EnchantmentEffectsDemo {
  private gameObjectManager: GameObjectManager;
  private eventEmitter: EventEmitter<EventMap>;
  private collisionSystem: CollisionSystem;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.gameObjectManager = new GameObjectManager(this.eventEmitter);
    this.collisionSystem = new CollisionSystem(
      this.eventEmitter,
      this.gameObjectManager
    );

    // イベントリスナーを設定
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventEmitter.on('enemyDestroyed', (enemy: Enemy) => {
      console.log(`🎯 敵を撃破: ${enemy.getEnemyType()}`);
    });
  }

  /**
   * 貫通効果のデモ
   */
  public demonstratePiercingEffect(): void {
    console.log('\n=== 貫通効果デモ ===');

    // 貫通弾丸を作成
    const piercingBullet = new Bullet(100, 50);
    piercingBullet.initialize(100, 50);
    piercingBullet.setPiercing(3); // 3回貫通
    piercingBullet.setCriticalChance(0); // クリティカルなし

    // 敵を縦に配置
    const enemies = [
      new Enemy(100, 80),
      new Enemy(100, 110),
      new Enemy(100, 140),
      new Enemy(100, 170),
    ];

    this.gameObjectManager.addBullet(piercingBullet);
    enemies.forEach(enemy => this.gameObjectManager.addEnemy(enemy));

    console.log(
      `弾丸位置: (${piercingBullet.getX()}, ${piercingBullet.getY()})`
    );
    console.log(`貫通回数: ${piercingBullet.getPiercingCount()}`);
    console.log(`敵の数: ${enemies.length}`);

    // 衝突判定を実行
    this.collisionSystem.checkAllCollisions(this.createMockPlayer());

    console.log(`弾丸アクティブ: ${piercingBullet.isActive()}`);
    console.log(`残存敵数: ${this.gameObjectManager.getEnemies().length}`);
  }

  /**
   * クリティカル効果のデモ
   */
  public demonstrateCriticalEffect(): void {
    console.log('\n=== クリティカル効果デモ ===');

    // クリティカル弾丸を作成
    const criticalBullet = new Bullet(200, 50);
    criticalBullet.initialize(200, 50);
    criticalBullet.setCriticalChance(75); // 75%クリティカル

    const enemy = new Enemy(200, 80);
    const originalHealth = 3; // 敵の初期体力を想定

    this.gameObjectManager.addBullet(criticalBullet);
    this.gameObjectManager.addEnemy(enemy);

    console.log(`弾丸クリティカル確率: ${criticalBullet.getCriticalChance()}%`);
    console.log(`敵の初期体力: ${originalHealth} (想定)`);

    // ダメージ計算のテスト
    const damageResult = DamageCalculator.calculateDamage(1, 75);
    console.log(`計算されたダメージ: ${damageResult.damage}`);
    console.log(
      `クリティカルヒット: ${damageResult.isCritical ? 'はい' : 'いいえ'}`
    );

    // 衝突判定を実行
    this.collisionSystem.checkAllCollisions(this.createMockPlayer());
  }

  /**
   * 凍結効果のデモ
   */
  public demonstrateFreezeEffect(): void {
    console.log('\n=== 凍結効果デモ ===');

    // 凍結弾丸を作成
    const freezeBullet = new Bullet(300, 50);
    freezeBullet.initialize(300, 50);
    freezeBullet.setFreezeEffect(true);
    freezeBullet.setFreezeDuration(2); // 2秒凍結

    const enemy = new Enemy(300, 80);
    const initialY = enemy.getY();

    this.gameObjectManager.addBullet(freezeBullet);
    this.gameObjectManager.addEnemy(enemy);

    console.log(`凍結時間: ${freezeBullet.getFreezeDuration()}秒`);
    console.log(`敵の初期位置: (${enemy.getX()}, ${enemy.getY()})`);

    // 衝突判定を実行
    this.collisionSystem.checkAllCollisions(this.createMockPlayer());

    console.log(`敵の凍結状態: ${enemy.isFrozen() ? '凍結中' : '通常'}`);

    // 時間経過をシミュレート
    enemy.update(0.5); // 0.5秒経過
    console.log(`0.5秒後の位置: (${enemy.getX()}, ${enemy.getY()})`);
    console.log(
      `位置変化: ${enemy.getY() === initialY ? 'なし（凍結中）' : 'あり'}`
    );
  }

  /**
   * 複合効果のデモ
   */
  public demonstrateComboEffects(): void {
    console.log('\n=== 複合効果デモ ===');

    // 全効果を持つ弾丸を作成
    const comboBullet = new Bullet(400, 50);
    comboBullet.initialize(400, 50);
    comboBullet.setPiercing(2);
    comboBullet.setCriticalChance(100); // 確実にクリティカル
    comboBullet.setFreezeEffect(true);
    comboBullet.setFreezeDuration(1.5);

    const enemies = [
      new Enemy(400, 80),
      new Enemy(400, 110),
      new Enemy(400, 140),
    ];

    this.gameObjectManager.addBullet(comboBullet);
    enemies.forEach(enemy => this.gameObjectManager.addEnemy(enemy));

    console.log('複合効果弾丸の設定:');
    console.log(`- 貫通回数: ${comboBullet.getPiercingCount()}`);
    console.log(`- クリティカル確率: ${comboBullet.getCriticalChance()}%`);
    console.log(
      `- 凍結効果: ${comboBullet.hasFreezeEffect() ? 'あり' : 'なし'}`
    );
    console.log(`- 凍結時間: ${comboBullet.getFreezeDuration()}秒`);

    // 衝突判定を実行
    this.collisionSystem.checkAllCollisions(this.createMockPlayer());

    const remainingEnemies = this.gameObjectManager.getEnemies();
    console.log(`残存敵数: ${remainingEnemies.length}`);

    remainingEnemies.forEach((enemy, index) => {
      console.log(
        `敵${index + 1}: 凍結状態 = ${enemy.isFrozen() ? '凍結中' : '通常'}`
      );
    });
  }

  /**
   * 連鎖効果のデモ（Phase 2新機能）
   */
  public demonstrateChainLightningEffect(): void {
    console.log('\n=== 連鎖効果デモ（Phase 2） ===');

    // 連鎖効果弾丸を作成
    const chainBullet = new Bullet(500, 50);
    chainBullet.initialize(500, 50);
    chainBullet.setChainLightning(true);
    chainBullet.setChainCount(3); // 3回連鎖
    chainBullet.setCriticalChance(50); // 50%クリティカル

    // 敵を配置（連鎖しやすい位置に）
    const enemies = [
      new Enemy(500, 80), // 最初の対象
      new Enemy(520, 110), // 連鎖対象1
      new Enemy(480, 140), // 連鎖対象2
      new Enemy(510, 170), // 連鎖対象3
    ];

    this.gameObjectManager.addBullet(chainBullet);
    enemies.forEach(enemy => this.gameObjectManager.addEnemy(enemy));

    console.log('連鎖効果弾丸の設定:');
    console.log(`- 連鎖回数: ${chainBullet.getChainCount()}`);
    console.log(`- クリティカル確率: ${chainBullet.getCriticalChance()}%`);
    console.log(`- 敵の数: ${enemies.length}`);

    // 連鎖効果のデバッグモードを有効化
    this.collisionSystem.setChainLightningDebugMode(true);

    // 衝突判定を実行
    this.collisionSystem.checkAllCollisions(this.createMockPlayer());

    // 連鎖効果の統計を表示
    const stats = this.collisionSystem.getChainLightningStats();
    console.log('連鎖効果統計:');
    console.log(`- アクティブな視覚効果: ${stats.activeEffects}`);
    console.log(`- SpatialHashセル数: ${stats.spatialHashCells}`);

    console.log(`残存敵数: ${this.gameObjectManager.getEnemies().length}`);
  }

  /**
   * パフォーマンステストのデモ（Phase 3新機能）
   */
  public demonstratePerformanceTest(): void {
    console.log('\n=== パフォーマンステストデモ（Phase 3） ===');

    // 大量のオブジェクトを作成
    const bulletCount = 30;
    const enemyCount = 50;

    console.log(`弾丸数: ${bulletCount}, 敵数: ${enemyCount}`);

    // エンチャント効果付きの弾丸を大量作成
    for (let i = 0; i < bulletCount; i++) {
      const bullet = new Bullet(i * 15, 50);
      bullet.initialize(i * 15, 50);
      bullet.setPiercing(2);
      bullet.setCriticalChance(25);
      bullet.setChainLightning(true);
      bullet.setChainCount(3);
      this.gameObjectManager.addBullet(bullet);
    }

    // 敵を大量作成
    for (let i = 0; i < enemyCount; i++) {
      const enemy = new Enemy((i % 10) * 40, Math.floor(i / 10) * 40 + 100);
      this.gameObjectManager.addEnemy(enemy);
    }

    const startTime = performance.now();
    this.collisionSystem.checkAllCollisions(this.createMockPlayer());
    const endTime = performance.now();

    const executionTime = endTime - startTime;
    console.log(`処理時間: ${executionTime.toFixed(2)}ms`);
    console.log(`60FPS維持: ${executionTime < 16.67 ? 'OK' : 'NG'}`);

    // 統計情報を表示
    const stats = this.collisionSystem.getCollisionStats();
    console.log(`最適化効果: ${(stats.optimizationRatio * 100).toFixed(1)}%`);

    const remainingEnemies = this.gameObjectManager.getEnemies().length;
    console.log(`残存敵数: ${remainingEnemies}`);
  }

  /**
   * 複雑な複合効果のデモ（Phase 3新機能）
   */
  public demonstrateComplexComboEffects(): void {
    console.log('\n=== 複雑な複合効果デモ（Phase 3） ===');

    // 全エンチャント効果を持つ弾丸を作成
    const superBullet = new Bullet(300, 50);
    superBullet.initialize(300, 50);
    superBullet.setPiercing(3);
    superBullet.setCriticalChance(75);
    superBullet.setFreezeEffect(true);
    superBullet.setFreezeDuration(2);
    superBullet.setChainLightning(true);
    superBullet.setChainCount(4);

    // 複雑な配置の敵を作成
    const enemyFormations = [
      // 縦列（貫通テスト用）
      { x: 300, y: 80 },
      { x: 300, y: 110 },
      { x: 300, y: 140 },
      { x: 300, y: 170 },
      // 横列（連鎖テスト用）
      { x: 320, y: 100 },
      { x: 280, y: 120 },
      { x: 340, y: 140 },
      { x: 260, y: 160 },
    ];

    enemyFormations.forEach(pos => {
      const enemy = new Enemy(pos.x, pos.y);
      this.gameObjectManager.addEnemy(enemy);
    });

    this.gameObjectManager.addBullet(superBullet);

    console.log('スーパー弾丸の設定:');
    console.log(`- 貫通回数: ${superBullet.getPiercingCount()}`);
    console.log(`- クリティカル確率: ${superBullet.getCriticalChance()}%`);
    console.log(`- 凍結時間: ${superBullet.getFreezeDuration()}秒`);
    console.log(`- 連鎖回数: ${superBullet.getChainCount()}`);
    console.log(`- 敵の配置数: ${enemyFormations.length}`);

    // 連鎖効果のデバッグモードを有効化
    this.collisionSystem.setChainLightningDebugMode(true);

    const initialEnemyCount = this.gameObjectManager.getEnemies().length;
    this.collisionSystem.checkAllCollisions(this.createMockPlayer());

    const finalEnemyCount = this.gameObjectManager.getEnemies().length;
    const destroyedCount = initialEnemyCount - finalEnemyCount;
    const frozenCount = this.gameObjectManager
      .getEnemies()
      .filter(e => e.isFrozen()).length;

    console.log('\n結果:');
    console.log(`撃破敵数: ${destroyedCount}`);
    console.log(`凍結敵数: ${frozenCount}`);
    console.log(`残存敵数: ${finalEnemyCount}`);
    console.log(
      `効果率: ${(((destroyedCount + frozenCount) / initialEnemyCount) * 100).toFixed(1)}%`
    );

    // 連鎖効果の統計
    const chainStats = this.collisionSystem.getChainLightningStats();
    console.log(`連鎖視覚効果数: ${chainStats.activeEffects}`);
  }

  /**
   * 全デモを実行
   */
  public runAllDemos(): void {
    console.log('🎮 エンチャント効果デモンストレーション開始');

    this.demonstratePiercingEffect();
    this.clearGameObjects();

    this.demonstrateCriticalEffect();
    this.clearGameObjects();

    this.demonstrateFreezeEffect();
    this.clearGameObjects();

    this.demonstrateComboEffects();
    this.clearGameObjects();

    // Phase 2の新機能
    this.demonstrateChainLightningEffect();
    this.clearGameObjects();

    // Phase 3の新機能
    this.demonstratePerformanceTest();
    this.demonstrateComplexComboEffects();

    console.log('\n✅ 全デモ完了（Phase 3統合テストを含む）');
  }

  private createMockPlayer(): IPlayer {
    return {
      x: 500,
      y: 500,
      width: 50,
      height: 50,
      update: (_deltaTime: number): void => {
        // モックなので何もしない
      },
      draw: (_ctx: CanvasRenderingContext2D): void => {
        // モックなので何もしない
      },
      setFireRate: (_rate: number): void => {
        // モックなので何もしない
      },
      setBulletType: (_type: 'single' | 'triple'): void => {
        // モックなので何もしない
      },
      activateShield: (): void => {
        // モックなので何もしない
      },
      deactivateShield: (): void => {
        // モックなので何もしない
      },
      isShieldActive: (): boolean => false,
      activatePowerup: (_type: PowerUpType): void => {
        // モックなので何もしない
      },
      getHealth: (): number => 100,
      getMaxHealth: (): number => 100,
      takeDamage: (_amount: number): void => {
        // モックなので何もしない
      },
      getPosition: (): { x: number; y: number } => ({ x: 500, y: 500 }),
      getX: (): number => 500,
      getY: (): number => 500,
      getWidth: (): number => 50,
      getHeight: (): number => 50,
    };
  }

  private clearGameObjects(): void {
    // ゲームオブジェクトをクリア
    this.gameObjectManager.getBullets().forEach(bullet => bullet.deactivate());
    this.gameObjectManager.getEnemies().forEach(enemy => {
      this.gameObjectManager.removeEnemy(enemy);
    });
  }
}

// デモの実行例
if (typeof window === 'undefined') {
  // Node.js環境での実行
  const demo = new EnchantmentEffectsDemo();
  demo.runAllDemos();
}
