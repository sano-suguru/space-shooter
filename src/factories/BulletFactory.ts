import { GameConfig } from '../config/GameConfigFactory';
import { BossBullet } from '../entities/BossBullet';
import { Bullet } from '../entities/Bullet';
import { BulletConfig, createAdvancedBullet } from '../entities/bullets';
import { IBullet } from '../interfaces/IBullet';

/**
 * 弾丸ファクトリークラス
 *
 * 統一された弾丸生成システムを提供します。
 * 全ての弾丸タイプの生成を一元管理し、型安全性を保証します。
 */
export class BulletFactory {
  /**
   * 統一された弾丸作成メソッド
   * @param config 弾丸設定
   * @param gameConfig ゲーム設定
   * @returns 弾丸インスタンス
   */
  public createBullet(config: BulletConfig, gameConfig?: GameConfig): IBullet {
    return createAdvancedBullet(config, gameConfig);
  }

  /**
   * プレイヤー弾丸を作成
   * @param config 弾丸設定
   * @param gameConfig ゲーム設定
   * @returns プレイヤー弾丸インスタンス
   */
  public static createPlayerBullet(
    config: PlayerBulletConfig,
    gameConfig?: GameConfig
  ): IBullet {
    const bullet = new Bullet(config.x, config.y, gameConfig);

    bullet.initialize(config.x, config.y, config.speed, config.color, 'player');

    return bullet;
  }

  /**
   * ボス弾丸を作成
   * @param config 弾丸設定
   * @param gameConfig ゲーム設定
   * @returns ボス弾丸インスタンス
   */
  public static createBossBullet(
    config: BossBulletConfig,
    gameConfig?: GameConfig
  ): IBullet {
    return new BossBullet(
      config.x,
      config.y,
      config.speedX,
      config.speedY,
      gameConfig
    );
  }

  /**
   * 特殊弾丸を作成
   * @param config 弾丸設定
   * @param gameConfig ゲーム設定
   * @returns 特殊弾丸インスタンス
   */
  public static createSpecialBullet(
    config: BulletConfig,
    gameConfig?: GameConfig
  ): IBullet {
    return createAdvancedBullet(config, gameConfig);
  }

  /**
   * 弾丸の妥当性を検証
   * @param bullet 検証する弾丸
   * @returns 妥当性の結果
   */
  public static validateBullet(bullet: IBullet): boolean {
    try {
      return (
        bullet &&
        typeof bullet.isActive === 'function' &&
        typeof bullet.isPiercing === 'function' &&
        typeof bullet.getOwner === 'function' &&
        typeof bullet.deactivate === 'function' &&
        typeof bullet.update === 'function' &&
        typeof bullet.draw === 'function'
      );
    } catch (error) {
      console.error('BulletFactory: Invalid bullet object:', error);
      return false;
    }
  }
}

// ========================================
// 型定義
// ========================================

/**
 * プレイヤー弾丸設定
 */
export interface PlayerBulletConfig {
  x: number;
  y: number;
  speed?: number;
  color?: string;
}

/**
 * ボス弾丸設定
 */
export interface BossBulletConfig {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
}
