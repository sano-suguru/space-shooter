/**
 * 武器システム - インターフェース定義
 *
 * 武器システムで使用される基本インターフェースを定義します。
 */

import { Bullet } from '../../entities/Bullet';
import { Player } from '../../entities/Player';
import { Vector2D } from '../../types';
import {
  EquippedWeapon,
  WeaponConfig,
  WeaponEquipResult,
  WeaponPurchaseResult,
  WeaponStats,
  WeaponUpgradeEffect,
} from '../types/WeaponTypes';

/**
 * 武器インターフェース
 */
export interface IWeapon {
  /**
   * 武器ID取得
   */
  getId(): string;

  /**
   * 武器設定取得
   */
  getConfig(): WeaponConfig;

  /**
   * 現在レベル取得
   */
  getLevel(): number;

  /**
   * 武器レベルアップ
   */
  levelUp(): boolean;

  /**
   * 射撃可能かチェック
   */
  canFire(): boolean;

  /**
   * 射撃実行
   */
  fire(position: Vector2D, direction: Vector2D): Bullet[];

  /**
   * 武器更新（クールダウンなど）
   */
  update(deltaTime: number): void;

  /**
   * 武器統計更新
   */
  updateStats(hit: boolean, damage: number): void;

  /**
   * 武器統計取得
   */
  getStats(): WeaponStats;

  /**
   * 武器リセット
   */
  reset(): void;
}

/**
 * 武器管理インターフェース
 */
export interface IWeaponManager {
  /**
   * 武器購入
   */
  purchaseWeapon(weaponId: string): Promise<WeaponPurchaseResult>;

  /**
   * 武器装備
   */
  equipWeapon(weaponId: string, slot: number): WeaponEquipResult;

  /**
   * 武器取り外し
   */
  unequipWeapon(slot: number): WeaponEquipResult;

  /**
   * 装備中武器取得
   */
  getEquippedWeapons(): EquippedWeapon[];

  /**
   * 特定スロットの武器取得
   */
  getWeaponInSlot(slot: number): EquippedWeapon | null;

  /**
   * 所有武器一覧取得
   */
  getOwnedWeapons(): string[];

  /**
   * 利用可能武器一覧取得
   */
  getAvailableWeapons(): WeaponConfig[];

  /**
   * 武器アップグレード
   */
  upgradeWeapon(weaponId: string): boolean;

  /**
   * 全武器で射撃
   */
  fireAllWeapons(player: Player): Bullet[];

  /**
   * 特定武器で射撃
   */
  fireWeapon(weaponId: string, player: Player): Bullet[];

  /**
   * 武器システム更新
   */
  update(deltaTime: number): void;

  /**
   * 武器統計取得
   */
  getWeaponStats(weaponId: string): WeaponStats | null;

  /**
   * 全武器統計取得
   */
  getAllWeaponStats(): Map<string, WeaponStats>;

  /**
   * 武器システムリセット
   */
  reset(): void;
}

/**
 * 武器効果サービスインターフェース
 */
export interface IWeaponEffectService {
  /**
   * 武器効果適用
   */
  applyWeaponEffect(weapon: IWeapon, bullet: Bullet): void;

  /**
   * レベル別効果取得
   */
  getUpgradeEffect(weaponId: string, level: number): WeaponUpgradeEffect;

  /**
   * 特殊効果処理
   */
  processSpecialEffect(
    weapon: IWeapon,
    bullet: Bullet,
    target?: Vector2D
  ): Bullet[];

  /**
   * 効果クリーンアップ
   */
  cleanup(): void;
}

/**
 * 武器弾丸ファクトリーインターフェース
 */
export interface IWeaponBulletFactory {
  /**
   * 基本弾丸作成
   */
  createBasicBullet(
    weaponConfig: WeaponConfig,
    position: Vector2D,
    direction: Vector2D
  ): Bullet;

  /**
   * 特殊弾丸作成
   */
  createSpecialBullet(
    weaponConfig: WeaponConfig,
    position: Vector2D,
    direction: Vector2D
  ): Bullet;

  /**
   * 複数弾丸作成（拡散射撃用）
   */
  createMultipleBullets(
    weaponConfig: WeaponConfig,
    position: Vector2D,
    direction: Vector2D
  ): Bullet[];

  /**
   * 弾丸プール取得
   */
  getBulletFromPool(weaponId: string): Bullet | null;

  /**
   * 弾丸プールに返却
   */
  returnBulletToPool(weaponId: string, bullet: Bullet): void;
}

/**
 * 武器アップグレード管理インターフェース
 */
export interface IWeaponUpgradeManager {
  /**
   * アップグレード可能かチェック
   */
  canUpgrade(weaponId: string): boolean;

  /**
   * アップグレード実行
   */
  upgradeWeapon(weaponId: string): boolean;

  /**
   * アップグレードコスト計算
   */
  calculateUpgradeCost(weaponId: string, currentLevel: number): number;

  /**
   * アップグレード効果計算
   */
  calculateUpgradeEffect(
    weaponId: string,
    currentLevel: number
  ): WeaponUpgradeEffect;

  /**
   * 最大レベルチェック
   */
  isMaxLevel(weaponId: string, currentLevel: number): boolean;
}

/**
 * 武器データプロバイダーインターフェース
 */
export interface IWeaponDataProvider {
  /**
   * 武器設定取得
   */
  getWeaponConfig(weaponId: string): WeaponConfig | null;

  /**
   * 全武器設定取得
   */
  getAllWeaponConfigs(): WeaponConfig[];

  /**
   * カテゴリ別武器取得
   */
  getWeaponsByCategory(category: string): WeaponConfig[];

  /**
   * レアリティ別武器取得
   */
  getWeaponsByRarity(rarity: string): WeaponConfig[];

  /**
   * 武器検索
   */
  searchWeapons(query: string): WeaponConfig[];

  /**
   * 武器設定更新
   */
  updateWeaponConfig(weaponId: string, config: Partial<WeaponConfig>): boolean;
}

/**
 * 武器イベントインターフェース
 */
export interface IWeaponEventHandler {
  /**
   * 武器購入イベント
   */
  onWeaponPurchased(weaponId: string, cost: number): void;

  /**
   * 武器装備イベント
   */
  onWeaponEquipped(weaponId: string, slot: number): void;

  /**
   * 武器取り外しイベント
   */
  onWeaponUnequipped(weaponId: string, slot: number): void;

  /**
   * 武器アップグレードイベント
   */
  onWeaponUpgraded(weaponId: string, newLevel: number): void;

  /**
   * 武器射撃イベント
   */
  onWeaponFired(weaponId: string, bulletCount: number): void;

  /**
   * 武器命中イベント
   */
  onWeaponHit(weaponId: string, damage: number): void;
}
