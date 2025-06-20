/**
 * 武器システム統合テスト
 * Phase 4: ゲーム統合とテスト
 */

import { Player } from '../entities/Player';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';
import { InputManager } from '../managers/InputManager';
import { PlayerProfile } from '../progression/types/PlayerProfile';
import { RealRandomProvider } from '../providers';
import { WeaponManager } from '../weapons/managers/WeaponManager';

describe('武器システム統合テスト', () => {
  let eventEmitter: EventEmitter<EventMap>;
  let player: Player;
  let weaponManager: WeaponManager;
  let playerProfile: PlayerProfile;

  beforeEach(() => {
    eventEmitter = new EventEmitter();
    const inputManager = new InputManager(document.createElement('canvas'));
    const randomProvider = new RealRandomProvider();

    // テスト用プレイヤープロファイル
    playerProfile = {
      level: 5,
      experience: 500,
      coins: 1000,
      highScore: 5000,
      totalScore: 10000,
      totalGamesPlayed: 10,
      totalPlayTime: 3600000,
      lastPlayDate: new Date().toISOString(),
      equippedUpgrades: {},
      unlockedUpgrades: [],
      completedAchievements: [],
      stats: {
        enemiesDestroyed: 100,
        bossesDefeated: 5,
        powerupsCollected: 20,
        bulletsShot: 500,
        damageDealt: 10000,
        damageTaken: 1000,
        maxWaveReached: 10,
        playStreakDays: 5,
      },
    };

    player = new Player(eventEmitter, inputManager, randomProvider);
    weaponManager = new WeaponManager(eventEmitter, playerProfile);

    // 武器システムを有効化
    player.setWeaponManager(weaponManager);
    player.enableWeaponSystem(true);
  });

  test('プレイヤーに武器システムが正しく統合されている', () => {
    expect(player.getWeaponManager()).toBe(weaponManager);
    expect(player.isWeaponSystemEnabled()).toBe(true);
  });

  test('基本武器が初期装備されている', () => {
    const equippedWeapons = weaponManager.getEquippedWeapons();
    expect(equippedWeapons).toHaveLength(1);
    expect(equippedWeapons[0].weaponId).toBe('basic_laser');
    expect(equippedWeapons[0].slot).toBe(0);
  });

  test('武器購入が正常に動作する', async () => {
    const initialCoins = playerProfile.coins;
    const result = await weaponManager.purchaseWeapon('rapid_laser');

    expect(result.success).toBe(true);
    expect(playerProfile.coins).toBeLessThan(initialCoins);
    expect(weaponManager.getOwnedWeapons()).toContain('rapid_laser');
  });

  test('武器装備が正常に動作する', async () => {
    // まず武器を購入
    await weaponManager.purchaseWeapon('rapid_laser');

    // 武器を装備
    const result = weaponManager.equipWeapon('rapid_laser', 1);

    expect(result.success).toBe(true);
    expect(result.slot).toBe(1);

    const equippedWeapons = weaponManager.getEquippedWeapons();
    expect(equippedWeapons).toHaveLength(2);
    expect(equippedWeapons.find(w => w.slot === 1)?.weaponId).toBe(
      'rapid_laser'
    );
  });

  test('武器取り外しが正常に動作する', async () => {
    // 武器を購入・装備
    await weaponManager.purchaseWeapon('rapid_laser');
    weaponManager.equipWeapon('rapid_laser', 1);

    // 武器を取り外し
    const result = weaponManager.unequipWeapon(1);

    expect(result.success).toBe(true);
    expect(result.slot).toBe(1);

    const equippedWeapons = weaponManager.getEquippedWeapons();
    expect(equippedWeapons.find(w => w.slot === 1)).toBeUndefined();
  });

  test('アクティブ武器スロットの管理が正常に動作する', () => {
    // 初期状態
    expect(player.getActiveWeaponSlot()).toBe(0);

    // アクティブスロットを変更
    player.setActiveWeaponSlot(1);
    expect(player.getActiveWeaponSlot()).toBe(1);

    player.setActiveWeaponSlot(2);
    expect(player.getActiveWeaponSlot()).toBe(2);
  });

  test('武器システムを使用した射撃が動作する', () => {
    const shotEvents: any[] = [];
    eventEmitter.on('playerShot', bullet => {
      shotEvents.push(bullet);
    });

    // 武器システムで射撃
    player.shootWithWeapons();

    expect(shotEvents.length).toBeGreaterThan(0);
  });

  test('利用可能武器一覧が正しく取得できる', () => {
    const availableWeapons = weaponManager.getAvailableWeapons();

    expect(availableWeapons.length).toBeGreaterThan(0);
    expect(availableWeapons.some(w => w.id === 'basic_laser')).toBe(true);
  });

  test('武器統計が正しく管理される', () => {
    const weaponId = 'basic_laser';

    // 射撃統計を更新
    weaponManager.onWeaponHit(weaponId, 50);
    weaponManager.onEnemyKilled(weaponId);

    const stats = weaponManager.getWeaponStats(weaponId);
    expect(stats).toBeDefined();
    expect(stats!.totalHits).toBe(1);
    expect(stats!.totalDamage).toBe(50);
    expect(stats!.enemiesKilled).toBe(1);
  });

  test('武器システムのリセットが正常に動作する', async () => {
    // 武器を購入・装備
    await weaponManager.purchaseWeapon('rapid_laser');
    weaponManager.equipWeapon('rapid_laser', 1);

    // リセット
    weaponManager.reset();

    // 基本武器のみが装備されている状態に戻る
    const equippedWeapons = weaponManager.getEquippedWeapons();
    expect(equippedWeapons).toHaveLength(1);
    expect(equippedWeapons[0].weaponId).toBe('basic_laser');
  });
});
