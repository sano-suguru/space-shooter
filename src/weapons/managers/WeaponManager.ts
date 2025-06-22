/**
 * 武器システム - 武器管理クラス
 *
 * プレイヤーの武器装備、購入、アップグレードを管理します。
 */

import { Bullet } from '../../entities/Bullet';
import { Player } from '../../entities/Player';
import { EventEmitter } from '../../events/EventEmitter';
import { EventMap } from '../../events/EventType';
import { PlayerProfile } from '../../progression/types/PlayerProfile';
import { IRandomProvider } from '../../providers/IRandomProvider';
import { RealRandomProvider } from '../../providers/RealRandomProvider';
import { Vector2D } from '../../types';
import { ALL_WEAPON_CONFIGS, getWeaponConfig } from '../data/weaponConfigs';
import { IWeaponManager } from '../interfaces/IWeapon';
import { EnhancedWeaponBulletFactory } from '../services/EnhancedWeaponBulletFactory';
import { WeaponBulletFactory } from '../services/WeaponBulletFactory';
import { ComboEffectProcessor } from '../systems/ComboEffectProcessor';
import { WeaponDropSystem } from '../systems/WeaponDropSystem';
import { EnchantedWeapon } from '../types/EnchantedWeapon';
import {
  EquippedWeapon,
  WeaponConfig,
  WeaponEquipResult,
  WeaponPurchaseResult,
  WeaponStats,
} from '../types/WeaponTypes';

/**
 * 武器管理クラス
 */
export class WeaponManager implements IWeaponManager {
  private equippedWeapons: Map<number, EquippedWeapon> = new Map();
  private ownedWeapons: Set<string> = new Set();
  private weaponStats: Map<string, WeaponStats> = new Map();
  private weaponCooldowns: Map<string, number> = new Map();
  private maxEquippedWeapons: number = 3;
  private bulletFactory: WeaponBulletFactory;
  private enhancedBulletFactory: EnhancedWeaponBulletFactory;
  private useEnhancedVisuals: boolean = true; // ビジュアル効果の有効/無効

  // エンチャント済み武器システム
  private enchantedWeapons: Map<string, EnchantedWeapon> = new Map();
  private weaponDropSystem: WeaponDropSystem;
  private comboEffectProcessor: ComboEffectProcessor;

  constructor(
    private eventEmitter: EventEmitter<EventMap>,
    private playerProfile: PlayerProfile,
    private randomProvider?: IRandomProvider
  ) {
    this.bulletFactory = new WeaponBulletFactory();
    this.enhancedBulletFactory = new EnhancedWeaponBulletFactory();

    // ランダムプロバイダーの初期化
    const provider = this.randomProvider ?? new RealRandomProvider();

    // エンチャントシステムの初期化
    this.weaponDropSystem = new WeaponDropSystem(provider);
    this.comboEffectProcessor = new ComboEffectProcessor();

    // 基本武器を初期装備として追加
    this.initializeBasicWeapon();
  }

  /**
   * 基本武器の初期化
   */
  private initializeBasicWeapon(): void {
    const basicWeapon = getWeaponConfig('basic_laser');
    if (basicWeapon) {
      this.ownedWeapons.add(basicWeapon.id);
      this.equipWeapon(basicWeapon.id, 0);
      this.initializeWeaponStats(basicWeapon.id);
    }
  }

  /**
   * 武器統計の初期化
   */
  private initializeWeaponStats(weaponId: string): void {
    this.weaponStats.set(weaponId, {
      totalShots: 0,
      totalHits: 0,
      totalDamage: 0,
      enemiesKilled: 0,
      accuracy: 0,
    });
  }

  /**
   * 武器購入
   */
  public async purchaseWeapon(weaponId: string): Promise<WeaponPurchaseResult> {
    // 非同期処理のシミュレーション（将来的にAPI呼び出しなどに対応）
    await new Promise(resolve => setTimeout(resolve, 0));
    const weaponConfig = getWeaponConfig(weaponId);
    if (!weaponConfig) {
      return {
        success: false,
        reason: 'not_unlocked',
      };
    }

    // 既に所有している場合
    if (this.ownedWeapons.has(weaponId)) {
      return {
        success: false,
        reason: 'already_owned',
      };
    }

    // 解除条件チェック
    if (!weaponConfig.unlockCondition(this.playerProfile)) {
      return {
        success: false,
        reason: 'not_unlocked',
      };
    }

    // 資金チェック
    if (this.playerProfile.coins < weaponConfig.cost) {
      return {
        success: false,
        reason: 'insufficient_funds',
      };
    }

    // 購入処理
    this.playerProfile.coins -= weaponConfig.cost;
    this.ownedWeapons.add(weaponId);
    this.initializeWeaponStats(weaponId);

    // イベント発火（将来的にカスタムイベントを追加予定）
    // this.eventEmitter.emit('weaponPurchased', {
    //   weaponId,
    //   cost: weaponConfig.cost,
    // });

    return {
      success: true,
      weaponId,
      costPaid: weaponConfig.cost,
      remainingCoins: this.playerProfile.coins,
    };
  }

  /**
   * 武器装備
   */
  public equipWeapon(weaponId: string, slot: number): WeaponEquipResult {
    // 所有チェック
    if (!this.ownedWeapons.has(weaponId)) {
      return {
        success: false,
        reason: 'weapon_not_owned',
      };
    }

    // スロット範囲チェック
    if (slot < 0 || slot >= this.maxEquippedWeapons) {
      return {
        success: false,
        reason: 'invalid_slot',
      };
    }

    // 既に装備されているかチェック
    for (const [_equippedSlot, equippedWeapon] of this.equippedWeapons) {
      if (equippedWeapon.weaponId === weaponId) {
        return {
          success: false,
          reason: 'already_equipped',
        };
      }
    }

    const weaponConfig = getWeaponConfig(weaponId);
    if (!weaponConfig) {
      return {
        success: false,
        reason: 'weapon_not_owned',
      };
    }

    // 既存武器の取り外し
    let replacedWeapon: string | undefined;
    if (this.equippedWeapons.has(slot)) {
      replacedWeapon = this.equippedWeapons.get(slot)?.weaponId;
    }

    // 新しい武器を装備
    const equippedWeapon: EquippedWeapon = {
      weaponId,
      config: weaponConfig,
      level: 1,
      lastFireTime: 0,
      slot,
      experience: 0,
    };

    this.equippedWeapons.set(slot, equippedWeapon);

    // イベント発火（将来的にカスタムイベントを追加予定）
    // this.eventEmitter.emit('weaponEquipped', { weaponId, slot });

    return {
      success: true,
      weaponId,
      slot,
      replacedWeapon,
    };
  }

  /**
   * 武器取り外し
   */
  public unequipWeapon(slot: number): WeaponEquipResult {
    if (!this.equippedWeapons.has(slot)) {
      return {
        success: false,
        reason: 'invalid_slot',
      };
    }

    const weapon = this.equippedWeapons.get(slot)!;
    this.equippedWeapons.delete(slot);

    // イベント発火（将来的にカスタムイベントを追加予定）
    // this.eventEmitter.emit('weaponUnequipped', {
    //   weaponId: weapon.weaponId,
    //   slot,
    // });

    return {
      success: true,
      weaponId: weapon.weaponId,
      slot,
    };
  }

  /**
   * 装備中武器取得
   */
  public getEquippedWeapons(): EquippedWeapon[] {
    return Array.from(this.equippedWeapons.values());
  }

  /**
   * 特定スロットの武器取得
   */
  public getWeaponInSlot(slot: number): EquippedWeapon | null {
    return this.equippedWeapons.get(slot) ?? null;
  }

  /**
   * 所有武器一覧取得
   */
  public getOwnedWeapons(): string[] {
    return Array.from(this.ownedWeapons);
  }

  /**
   * 利用可能武器一覧取得
   */
  public getAvailableWeapons(): WeaponConfig[] {
    return ALL_WEAPON_CONFIGS.filter(config =>
      config.unlockCondition(this.playerProfile)
    );
  }

  /**
   * 武器アップグレード
   */
  public upgradeWeapon(weaponId: string): boolean {
    const equippedWeapon = Array.from(this.equippedWeapons.values()).find(
      w => w.weaponId === weaponId
    );

    if (
      !equippedWeapon ||
      equippedWeapon.level >= equippedWeapon.config.maxLevel
    ) {
      return false;
    }

    // アップグレード実行
    equippedWeapon.level++;
    equippedWeapon.experience = 0;

    // イベント発火（将来的にカスタムイベントを追加予定）
    // this.eventEmitter.emit('weaponUpgraded', {
    //   weaponId,
    //   newLevel: equippedWeapon.level,
    // });

    return true;
  }

  /**
   * 全武器で射撃
   */
  public fireAllWeapons(player: Player): Bullet[] {
    const bullets: Bullet[] = [];
    const currentTime = Date.now();

    for (const weapon of this.equippedWeapons.values()) {
      if (currentTime - weapon.lastFireTime >= weapon.config.fireRate) {
        const weaponBullets = this.fireWeapon(weapon.weaponId, player);
        bullets.push(...weaponBullets);
      }
    }

    return bullets;
  }

  /**
   * 特定武器で射撃
   */
  public fireWeapon(weaponId: string, player: Player): Bullet[] {
    const weapon = Array.from(this.equippedWeapons.values()).find(
      w => w.weaponId === weaponId
    );

    if (!weapon) {
      return [];
    }

    const currentTime = Date.now();
    if (currentTime - weapon.lastFireTime < weapon.config.fireRate) {
      return [];
    }

    // 射撃位置計算
    const playerPos = player.getPosition();
    const bulletStartX = playerPos.x + player.getWidth() / 2;
    const bulletStartY = playerPos.y;

    // 弾丸生成（ビジュアル効果の有無に応じて選択）
    const direction = { x: 0, y: -1 }; // 上向き
    const position = { x: bulletStartX, y: bulletStartY };

    let bullets: Bullet[];
    if (this.useEnhancedVisuals) {
      // エンチャント済み武器の場合はエンチャント情報を取得
      const enchantedWeapon = this.enchantedWeapons.get(weaponId);
      const enchantments = enchantedWeapon?.enchantments.map(e => e.type) ?? [];

      bullets = this.enhancedBulletFactory.createWeaponTypeVisualBullet(
        weapon.config.type,
        weapon.config,
        position,
        direction,
        enchantments
      );
    } else {
      bullets = this.bulletFactory.createWeaponTypeBullet(
        weapon.config.type,
        weapon.config,
        position,
        direction
      );
    }

    // 追尾弾丸の場合、ターゲットを設定
    bullets.forEach(bullet => {
      if (weapon.config.specialEffect?.type === 'homing') {
        this.bulletFactory.setHomingTarget(bullet, player);
      }
    });

    // 発射時刻更新
    weapon.lastFireTime = currentTime;

    // 統計更新
    this.updateWeaponStats(weaponId, 'shot', bullets.length);

    // イベント発火（将来的にカスタムイベントを追加予定）
    // this.eventEmitter.emit('weaponFired', {
    //   weaponId,
    //   bulletCount: bullets.length,
    // });

    return bullets;
  }

  /**
   * 武器用弾丸作成
   */
  private createBulletForWeapon(
    weapon: EquippedWeapon,
    position: Vector2D
  ): Bullet | null {
    // WeaponBulletFactoryを使用して弾丸作成
    const direction = { x: 0, y: -1 }; // 上向き

    // 武器タイプ別弾丸作成
    const bullets = this.bulletFactory.createWeaponTypeBullet(
      weapon.config.type,
      weapon.config,
      position,
      direction
    );

    // 最初の弾丸を返す（複数弾丸の場合は別途処理）
    return bullets.length > 0 ? bullets[0] : null;
  }

  /**
   * 武器システム更新
   */
  public update(deltaTime: number): void {
    // クールダウン更新
    for (const [weaponId, cooldown] of this.weaponCooldowns) {
      const newCooldown = Math.max(0, cooldown - deltaTime);
      this.weaponCooldowns.set(weaponId, newCooldown);
    }
  }

  /**
   * 弾丸のビジュアル更新（外部から呼び出し用）
   */
  public updateBulletVisuals(bullets: Bullet[], deltaTime: number): void {
    if (this.useEnhancedVisuals) {
      this.enhancedBulletFactory.updateBulletVisuals(bullets, deltaTime);
    }
  }

  /**
   * 弾丸のカスタム描画（外部から呼び出し用）
   */
  public renderBullets(bullets: Bullet[], ctx: CanvasRenderingContext2D): void {
    if (this.useEnhancedVisuals) {
      this.enhancedBulletFactory.renderBullets(bullets, ctx);
    } else {
      // 従来の描画
      bullets.forEach(bullet => bullet.draw(ctx));
    }
  }

  /**
   * 非アクティブ弾丸のクリーンアップ（外部から呼び出し用）
   */
  public cleanupInactiveBullets(bullets: Bullet[]): Bullet[] {
    const activeBullets: Bullet[] = [];
    const inactiveBullets: Bullet[] = [];

    bullets.forEach(bullet => {
      if (bullet.isActive()) {
        activeBullets.push(bullet);
      } else {
        inactiveBullets.push(bullet);
      }
    });

    // 非アクティブ弾丸のビジュアルをクリーンアップ
    if (this.useEnhancedVisuals && inactiveBullets.length > 0) {
      this.enhancedBulletFactory.cleanupBulletVisuals(inactiveBullets);
    }

    return activeBullets;
  }

  /**
   * ビジュアル効果の有効/無効を切り替え
   */
  public setEnhancedVisualsEnabled(enabled: boolean): void {
    this.useEnhancedVisuals = enabled;
  }

  /**
   * ビジュアル効果が有効かどうかを取得
   */
  public isEnhancedVisualsEnabled(): boolean {
    return this.useEnhancedVisuals;
  }

  /**
   * 拡張弾丸ファクトリーを取得
   */
  public getEnhancedBulletFactory(): EnhancedWeaponBulletFactory {
    return this.enhancedBulletFactory;
  }

  /**
   * 武器統計更新
   */
  private updateWeaponStats(
    weaponId: string,
    type: 'shot' | 'hit' | 'kill',
    value: number = 1
  ): void {
    const stats = this.weaponStats.get(weaponId);
    if (!stats) return;

    switch (type) {
      case 'shot':
        stats.totalShots += value;
        break;
      case 'hit':
        stats.totalHits += value;
        stats.totalDamage += value;
        break;
      case 'kill':
        stats.enemiesKilled += value;
        break;
    }

    // 命中率計算
    stats.accuracy =
      stats.totalShots > 0 ? stats.totalHits / stats.totalShots : 0;
  }

  /**
   * 武器統計取得
   */
  public getWeaponStats(weaponId: string): WeaponStats | null {
    return this.weaponStats.get(weaponId) ?? null;
  }

  /**
   * 全武器統計取得
   */
  public getAllWeaponStats(): Map<string, WeaponStats> {
    return new Map(this.weaponStats);
  }

  /**
   * 武器システムリセット
   */
  public reset(): void {
    this.equippedWeapons.clear();
    this.ownedWeapons.clear();
    this.weaponStats.clear();
    this.weaponCooldowns.clear();
    this.bulletFactory.cleanup();
    this.enhancedBulletFactory.cleanup();
    this.initializeBasicWeapon();
  }

  /**
   * 武器命中時の統計更新（外部から呼び出し用）
   */
  public onWeaponHit(weaponId: string, damage: number): void {
    this.updateWeaponStats(weaponId, 'hit', damage);
  }

  /**
   * 武器による敵撃破時の統計更新（外部から呼び出し用）
   */
  public onEnemyKilled(weaponId: string): void {
    this.updateWeaponStats(weaponId, 'kill', 1);
  }

  /**
   * 弾丸ファクトリー取得
   */
  public getBulletFactory(): WeaponBulletFactory {
    return this.bulletFactory;
  }

  /**
   * 弾丸プール統計取得
   */
  public getBulletPoolStats(): Record<string, number> {
    const basicStats = this.bulletFactory.getPoolStats();
    if (this.useEnhancedVisuals) {
      const enhancedStats = this.enhancedBulletFactory.getEnhancedStats();
      return {
        ...basicStats,
        enhanced_pool: Object.keys(enhancedStats.poolStats).length,
        visual_states: enhancedStats.visualStats.activeVisualStates,
        total_particles: enhancedStats.visualStats.totalParticles,
      };
    }
    return basicStats;
  }

  // エンチャント済み武器システムのメソッド

  /**
   * エンチャント済み武器を装備
   */
  public equipEnchantedWeapon(
    enchantedWeapon: EnchantedWeapon,
    slot: number
  ): WeaponEquipResult {
    // スロット範囲チェック
    if (slot < 0 || slot >= this.maxEquippedWeapons) {
      return {
        success: false,
        reason: 'invalid_slot',
      };
    }

    // エンチャント済み武器を保存
    this.enchantedWeapons.set(enchantedWeapon.uniqueId, enchantedWeapon);

    // 既存武器の取り外し
    let replacedWeapon: string | undefined;
    if (this.equippedWeapons.has(slot)) {
      replacedWeapon = this.equippedWeapons.get(slot)?.weaponId;
    }

    // エンチャント済み武器を装備武器として設定
    const equippedWeapon: EquippedWeapon = {
      weaponId: enchantedWeapon.uniqueId,
      config: enchantedWeapon,
      level: 1,
      lastFireTime: 0,
      slot,
      experience: 0,
    };

    this.equippedWeapons.set(slot, equippedWeapon);
    this.initializeWeaponStats(enchantedWeapon.uniqueId);

    return {
      success: true,
      weaponId: enchantedWeapon.uniqueId,
      slot,
      replacedWeapon,
    };
  }

  /**
   * エンチャント済み武器で射撃（組み合わせ効果適用）
   */
  public fireEnchantedWeapon(weaponId: string, player: Player): Bullet[] {
    const weapon = Array.from(this.equippedWeapons.values()).find(
      w => w.weaponId === weaponId
    );

    if (!weapon) {
      return [];
    }

    const currentTime = Date.now();
    if (currentTime - weapon.lastFireTime < weapon.config.fireRate) {
      return [];
    }

    const enchantedWeapon = this.enchantedWeapons.get(weaponId);
    if (!enchantedWeapon) {
      // 通常の武器として射撃
      return this.fireWeapon(weaponId, player);
    }

    // 射撃位置計算
    const playerPos = player.getPosition();
    const bulletStartX = playerPos.x + player.getWidth() / 2;
    const bulletStartY = playerPos.y;
    const firePosition = { x: bulletStartX, y: bulletStartY };
    const fireDirection = { x: 0, y: -1 };

    // 基本弾丸を生成（ビジュアル効果付き）
    let bullets: Bullet[];
    if (this.useEnhancedVisuals) {
      bullets = this.enhancedBulletFactory.createWeaponTypeVisualBullet(
        weapon.config.type,
        weapon.config,
        firePosition,
        fireDirection,
        enchantedWeapon.enchantments.map(e => e.type)
      );
    } else {
      bullets = this.bulletFactory.createWeaponTypeBullet(
        weapon.config.type,
        weapon.config,
        firePosition,
        fireDirection
      );
    }

    // エンチャント効果を適用
    const comboResult = this.comboEffectProcessor.applyComboEffects(
      enchantedWeapon,
      bullets,
      firePosition,
      fireDirection
    );

    // 発射時刻更新
    weapon.lastFireTime = currentTime;

    // 統計更新
    this.updateWeaponStats(
      weaponId,
      'shot',
      comboResult.modifiedBullets.length
    );

    return comboResult.modifiedBullets;
  }

  /**
   * 全エンチャント済み武器で射撃
   */
  public fireAllEnchantedWeapons(player: Player): Bullet[] {
    const bullets: Bullet[] = [];
    const currentTime = Date.now();

    for (const weapon of this.equippedWeapons.values()) {
      if (currentTime - weapon.lastFireTime >= weapon.config.fireRate) {
        const weaponBullets = this.fireEnchantedWeapon(weapon.weaponId, player);
        bullets.push(...weaponBullets);
      }
    }

    return bullets;
  }

  /**
   * 武器ドロップシステムを取得
   */
  public getWeaponDropSystem(): WeaponDropSystem {
    return this.weaponDropSystem;
  }

  /**
   * エンチャント済み武器を取得
   */
  public getEnchantedWeapon(weaponId: string): EnchantedWeapon | null {
    return this.enchantedWeapons.get(weaponId) ?? null;
  }

  /**
   * 全エンチャント済み武器を取得
   */
  public getAllEnchantedWeapons(): EnchantedWeapon[] {
    return Array.from(this.enchantedWeapons.values());
  }

  /**
   * エンチャント済み武器の比較
   */
  public compareWeapons(
    currentWeaponId: string,
    candidateWeapon: EnchantedWeapon
  ): {
    betterWeapon: EnchantedWeapon;
    improvements: string[];
    recommendation: 'upgrade' | 'keep_current' | 'situational';
  } {
    const currentWeapon = this.enchantedWeapons.get(currentWeaponId);

    if (!currentWeapon) {
      return {
        betterWeapon: candidateWeapon,
        improvements: ['新しい武器を装備'],
        recommendation: 'upgrade',
      };
    }

    const improvements: string[] = [];
    const currentStats = currentWeapon.totalStats;
    const candidateStats = candidateWeapon.totalStats;

    // 基本性能比較
    if (candidateStats.finalDamage > currentStats.finalDamage) {
      improvements.push(
        `攻撃力: ${currentStats.finalDamage} → ${candidateStats.finalDamage}`
      );
    }

    if (candidateStats.finalFireRate < currentStats.finalFireRate) {
      improvements.push(
        `連射速度向上: ${currentStats.finalFireRate}ms → ${candidateStats.finalFireRate}ms`
      );
    }

    if (candidateStats.totalMultiplier > currentStats.totalMultiplier) {
      improvements.push(
        `組み合わせ倍率: ${currentStats.totalMultiplier.toFixed(2)}x → ${candidateStats.totalMultiplier.toFixed(2)}x`
      );
    }

    // エンチャント数比較
    if (
      candidateWeapon.enchantments.length > currentWeapon.enchantments.length
    ) {
      improvements.push(
        `エンチャント数: ${currentWeapon.enchantments.length} → ${candidateWeapon.enchantments.length}`
      );
    }

    // 推奨度判定
    let recommendation: 'upgrade' | 'keep_current' | 'situational';
    if (improvements.length >= 3) {
      recommendation = 'upgrade';
    } else if (improvements.length === 0) {
      recommendation = 'keep_current';
    } else {
      recommendation = 'situational';
    }

    return {
      betterWeapon: improvements.length > 0 ? candidateWeapon : currentWeapon,
      improvements,
      recommendation,
    };
  }
}
