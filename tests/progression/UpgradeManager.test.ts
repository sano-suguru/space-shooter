import { EventEmitter } from '../../src/events/EventEmitter';
import { EventMap } from '../../src/events/EventType';
import { UPGRADE_CONFIGS } from '../../src/progression/data/upgrades';
import { UpgradeManager } from '../../src/progression/managers/UpgradeManager';
import { PlayerProfile } from '../../src/progression/types/PlayerProfile';

describe('UpgradeManager', () => {
  let upgradeManager: UpgradeManager;
  let eventEmitter: EventEmitter<EventMap>;
  let mockProfile: PlayerProfile;

  beforeEach(() => {
    eventEmitter = new EventEmitter<EventMap>();
    mockProfile = {
      totalGamesPlayed: 1,
      totalScore: 1000,
      highScore: 1000,
      totalPlayTime: 300,
      lastPlayDate: '2024-01-01T00:00:00.000Z',
      coins: 1000,
      experience: 100,
      level: 3,
      unlockedUpgrades: [],
      equippedUpgrades: {},
      completedAchievements: [],
      stats: {
        enemiesDestroyed: 50,
        bossesDefeated: 2,
        maxWaveReached: 5,
        powerupsCollected: 10,
        bulletsShot: 200,
        damageDealt: 500,
        damageTaken: 100,
        playStreakDays: 1,
      },
    };
    upgradeManager = new UpgradeManager(eventEmitter, mockProfile);
  });

  describe('初期化', () => {
    it('正しく初期化される', () => {
      expect(upgradeManager).toBeInstanceOf(UpgradeManager);
      expect(upgradeManager.getTotalEffect()).toEqual({});
    });

    it('既存のアップグレードが正しく読み込まれる', () => {
      const profileWithUpgrades: PlayerProfile = {
        ...mockProfile,
        equippedUpgrades: {
          rapid_fire: 2,
          power_shot: 1,
        },
      };

      const manager = new UpgradeManager(eventEmitter, profileWithUpgrades);
      const effect = manager.getTotalEffect();

      expect(effect.fireRateMultiplier).toBeCloseTo(1.3); // 1 + (2 * 0.15)
      expect(effect.bulletDamageMultiplier).toBeCloseTo(1.2); // 1 + (1 * 0.2)
    });
  });

  describe('アップグレード購入', () => {
    it('利用可能なアップグレードが正しく購入できる', () => {
      const result = upgradeManager.purchaseUpgrade('rapid_fire');

      expect(result.success).toBe(true);
      expect(result.newLevel).toBe(1);
      expect(result.costPaid).toBe(100);
      expect(result.remainingCoins).toBe(900);
      expect(mockProfile.coins).toBe(900);
      expect(mockProfile.equippedUpgrades['rapid_fire']).toBe(1);
    });

    it('解除されていないアップグレードの購入は失敗する', () => {
      // multi_shotは100体の敵を倒す必要があるが、mockProfileは50体のみ
      const result = upgradeManager.purchaseUpgrade('multi_shot');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('not_unlocked');
    });

    it('コインが不足している場合は購入できない', () => {
      mockProfile.coins = 50; // rapid_fireは100コイン必要
      upgradeManager.updateProfile(mockProfile);

      const result = upgradeManager.purchaseUpgrade('rapid_fire');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('insufficient_funds');
    });

    it('最大レベルに達している場合は購入できない', () => {
      // rapid_fireを最大レベル(10)に設定
      mockProfile.equippedUpgrades['rapid_fire'] = 10;
      upgradeManager.updateProfile(mockProfile);

      const result = upgradeManager.purchaseUpgrade('rapid_fire');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('max_level_reached');
    });

    it('存在しないアップグレードの購入は失敗する', () => {
      const result = upgradeManager.purchaseUpgrade('non_existent_upgrade');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('unknown_upgrade');
    });

    it('購入時に適切なイベントが発火される', () => {
      const upgradeAppliedSpy = jest.fn();
      const profileUpdatedSpy = jest.fn();

      eventEmitter.on('upgradeApplied', upgradeAppliedSpy);
      eventEmitter.on('profileUpdated', profileUpdatedSpy);

      upgradeManager.purchaseUpgrade('rapid_fire');

      expect(upgradeAppliedSpy).toHaveBeenCalledWith('rapid_fire', 1);
      expect(profileUpdatedSpy).toHaveBeenCalled();
    });
  });

  describe('アップグレード効果計算', () => {
    it('単一アップグレードの効果が正しく適用される', () => {
      upgradeManager.purchaseUpgrade('rapid_fire');
      const effect = upgradeManager.getTotalEffect();

      expect(effect.fireRateMultiplier).toBeCloseTo(1.15); // 1 + (1 * 0.15)
    });

    it('複数アップグレードの効果が正しく組み合わされる', () => {
      upgradeManager.purchaseUpgrade('rapid_fire');
      upgradeManager.purchaseUpgrade('power_shot');

      const effect = upgradeManager.getTotalEffect();

      expect(effect.fireRateMultiplier).toBeCloseTo(1.15);
      expect(effect.bulletDamageMultiplier).toBeCloseTo(1.2);
    });

    it('同じアップグレードの複数レベルが正しく適用される', () => {
      // 十分なコインを設定
      mockProfile.coins = 5000;
      upgradeManager.updateProfile(mockProfile);

      upgradeManager.purchaseUpgrade('rapid_fire'); // レベル1
      upgradeManager.purchaseUpgrade('rapid_fire'); // レベル2

      const effect = upgradeManager.getTotalEffect();
      expect(effect.fireRateMultiplier).toBeCloseTo(1.3); // 1 + (2 * 0.15)
    });
  });

  describe('アップグレード情報取得', () => {
    it('現在のアップグレードレベルが正しく取得できる', () => {
      upgradeManager.purchaseUpgrade('rapid_fire');

      expect(upgradeManager.getUpgradeLevel('rapid_fire')).toBe(1);
      expect(upgradeManager.getUpgradeLevel('power_shot')).toBe(0);
    });

    it('アップグレードコストが正しく計算される', () => {
      expect(upgradeManager.getUpgradeCost('rapid_fire')).toBe(100);

      upgradeManager.purchaseUpgrade('rapid_fire');
      expect(upgradeManager.getUpgradeCost('rapid_fire')).toBe(150); // 100 * 1.5
    });

    it('利用可能なアップグレードが正しく取得できる', () => {
      const available = upgradeManager.getAvailableUpgrades();
      const availableIds = available.map(u => u.id);

      expect(availableIds).toContain('rapid_fire'); // 常に利用可能
      expect(availableIds).toContain('power_shot'); // レベル3以上で利用可能
      expect(availableIds).not.toContain('multi_shot'); // 100体倒す必要
    });

    it('カテゴリ別のアップグレードが正しく取得できる', () => {
      const weaponUpgrades =
        upgradeManager.getAvailableUpgradesByCategory('weapon');
      const defenseUpgrades =
        upgradeManager.getAvailableUpgradesByCategory('defense');
      const utilityUpgrades =
        upgradeManager.getAvailableUpgradesByCategory('utility');

      expect(weaponUpgrades.length).toBeGreaterThan(0);
      expect(defenseUpgrades.length).toBeGreaterThan(0);
      expect(utilityUpgrades.length).toBeGreaterThan(0);

      expect(weaponUpgrades.every(u => u.category === 'weapon')).toBe(true);
      expect(defenseUpgrades.every(u => u.category === 'defense')).toBe(true);
      expect(utilityUpgrades.every(u => u.category === 'utility')).toBe(true);
    });

    it('購入可能性が正しく判定される', () => {
      expect(upgradeManager.canPurchaseUpgrade('rapid_fire')).toBe(true);
      expect(upgradeManager.canPurchaseUpgrade('multi_shot')).toBe(false); // 解除されていない

      mockProfile.coins = 50;
      upgradeManager.updateProfile(mockProfile);
      expect(upgradeManager.canPurchaseUpgrade('rapid_fire')).toBe(false); // コイン不足
    });
  });

  describe('アップグレード統計', () => {
    it('統計情報が正しく取得できる', () => {
      upgradeManager.purchaseUpgrade('rapid_fire');
      upgradeManager.purchaseUpgrade('power_shot');

      const stats = upgradeManager.getUpgradeStats();

      expect(stats.totalUpgradesOwned).toBe(2);
      expect(stats.totalCoinsSpent).toBe(250); // 100 + 150
      expect(stats.averageUpgradeLevel).toBe(1);
    });
  });

  describe('プロフィール更新', () => {
    it('プロフィール更新時にアップグレードが再計算される', () => {
      const newProfile: PlayerProfile = {
        ...mockProfile,
        equippedUpgrades: {
          rapid_fire: 3,
        },
      };

      upgradeManager.updateProfile(newProfile);
      const effect = upgradeManager.getTotalEffect();

      expect(effect.fireRateMultiplier).toBeCloseTo(1.45); // 1 + (3 * 0.15)
    });
  });

  describe('データの整合性', () => {
    it('全てのアップグレード設定が有効である', () => {
      UPGRADE_CONFIGS.forEach(config => {
        expect(config.id).toBeTruthy();
        expect(config.name).toBeTruthy();
        expect(config.description).toBeTruthy();
        expect(['weapon', 'defense', 'utility']).toContain(config.category);
        expect(config.maxLevel).toBeGreaterThan(0);
        expect(config.baseCost).toBeGreaterThan(0);
        expect(config.costMultiplier).toBeGreaterThan(1);
        expect(typeof config.unlockCondition).toBe('function');
        expect(typeof config.effect).toBe('function');

        // 効果関数が正常に動作することを確認
        const effect = config.effect(1);
        expect(typeof effect).toBe('object');
      });
    });

    it('アップグレードIDが重複していない', () => {
      const ids = UPGRADE_CONFIGS.map(config => config.id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size);
    });
  });
});
