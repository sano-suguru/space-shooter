import { Player } from '../entities/Player';
import { GameObjectManager } from '../managers/GameObjectManager';
import { WeaponManager } from '../weapons/managers/WeaponManager';

import { BackgroundRenderer } from './BackgroundRenderer';

/**
 * ゲームの描画処理を専門に扱うクラス
 * Game.tsから描画関連の責務を分離
 */
export class GameRenderer {
  private useOptimizedBackground = true;
  private weaponManager: WeaponManager | null = null;

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
    deltaTime: number = 16.67,
    weaponManager?: WeaponManager
  ): void {
    this.drawBackground(gameObjectManager, deltaTime);
    this.drawGameObjects(player, gameObjectManager, weaponManager);
  }

  /**
   * 最適化された背景描画（LOD対応・新しい幻想的なエンティティを含む）
   */
  private drawBackground(
    gameObjectManager: GameObjectManager,
    deltaTime: number = 16.67
  ): void {
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
    gameObjectManager: GameObjectManager,
    weaponManager?: WeaponManager
  ): void {
    // プレイヤー描画
    player.draw(this.ctx);

    // 弾丸描画（ビジュアル効果対応）
    const bullets = gameObjectManager.getBullets();
    if (weaponManager?.isEnhancedVisualsEnabled()) {
      // カスタムビジュアル効果付きで描画
      weaponManager.renderBullets(bullets, this.ctx);
    } else {
      // 従来の描画
      bullets.forEach(bullet => bullet.draw(this.ctx));
    }

    // その他のゲームオブジェクト描画
    gameObjectManager.getEnemies().forEach(enemy => enemy.draw(this.ctx));
    gameObjectManager.getPowerups().forEach(powerup => powerup.draw(this.ctx));
    gameObjectManager
      .getDroppedWeapons()
      .forEach(weapon => weapon.draw(this.ctx));
    gameObjectManager
      .getExplosions()
      .forEach(explosion => explosion.draw(this.ctx));

    // 新しい弾丸タイプの描画（特殊弾丸は従来の描画を使用）
    gameObjectManager
      .getExplosiveBullets()
      .forEach(bullet => bullet.draw(this.ctx));
    gameObjectManager
      .getHomingBullets()
      .forEach(bullet => bullet.draw(this.ctx));
    gameObjectManager
      .getReflectingBullets()
      .forEach(bullet => bullet.draw(this.ctx));
    gameObjectManager
      .getSplitBullets()
      .forEach(bullet => bullet.draw(this.ctx));

    // ボス関連描画
    const boss = gameObjectManager.getBoss();
    if (boss) {
      boss.draw(this.ctx);
      gameObjectManager
        .getBossBullets()
        .forEach(bullet => bullet.draw(this.ctx));
    }
  }

  /**
   * 背景レンダリング最適化の切り替え
   */
  public toggleBackgroundOptimization(): void {
    this.useOptimizedBackground = !this.useOptimizedBackground;
    console.log(
      `Background optimization: ${this.useOptimizedBackground ? 'ON' : 'OFF'}`
    );
  }

  /**
   * 武器マネージャーを設定
   */
  public setWeaponManager(weaponManager: WeaponManager): void {
    this.weaponManager = weaponManager;
  }

  /**
   * ビジュアル効果の有効/無効を切り替え
   */
  public toggleEnhancedVisuals(): void {
    if (this.weaponManager) {
      const currentState = this.weaponManager.isEnhancedVisualsEnabled();
      this.weaponManager.setEnhancedVisualsEnabled(!currentState);
      console.log(`Enhanced bullet visuals: ${!currentState ? 'ON' : 'OFF'}`);
    }
  }

  /**
   * ビジュアル効果の状態を取得
   */
  public isEnhancedVisualsEnabled(): boolean {
    return this.weaponManager?.isEnhancedVisualsEnabled() ?? false;
  }

  /**
   * 背景レンダリングパフォーマンス統計を取得（レガシー）
   */
  public getBackgroundPerformanceStats(): ReturnType<
    BackgroundRenderer['getPerformanceStats']
  > {
    return this.backgroundRenderer.getPerformanceStats();
  }

  /**
   * 詳細な背景レンダリングパフォーマンス統計を取得
   */
  public getDetailedBackgroundPerformanceStats(): ReturnType<
    BackgroundRenderer['getDetailedPerformanceStats']
  > {
    return this.backgroundRenderer.getDetailedPerformanceStats();
  }

  /**
   * パフォーマンス監視システムへのアクセス
   */
  public getPerformanceMonitor(): ReturnType<
    BackgroundRenderer['getPerformanceMonitor']
  > {
    return this.backgroundRenderer.getPerformanceMonitor();
  }

  /**
   * LOD管理システムへのアクセス
   */
  public getLODManager(): ReturnType<BackgroundRenderer['getLODManager']> {
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
