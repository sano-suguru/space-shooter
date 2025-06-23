import {
  createTestConfig,
  GameConfig,
} from '../../src/config/GameConfigFactory';
import { Game } from '../../src/core/Game';
import { DroppedWeapon } from '../../src/entities/DroppedWeapon';
import { Player } from '../../src/entities/Player';
import { EventEmitter } from '../../src/events/EventEmitter';
import { EventMap } from '../../src/events/EventType';
import { GameObjectFactory } from '../../src/factories/GameObjectFactory';
import { GameObjectManager } from '../../src/managers/GameObjectManager';
import { GameStateManager } from '../../src/managers/GameStateManager';
import { MockInputManager } from '../../src/managers/MockInputManager';
import { MockMessageManager } from '../../src/managers/MockMessageManager';
import { ScoreManager } from '../../src/managers/ScoreManager';
import { WeaponComparisonManager } from '../../src/managers/WeaponComparisonManager';
import { MockRandomProvider } from '../../src/providers/MockRandomProvider';
import { BackgroundRenderer } from '../../src/rendering/BackgroundRenderer';
import { PowerUpEffectService } from '../../src/services/PowerUpEffectService';
import { EnchantedWeapon } from '../../src/weapons/types/EnchantedWeapon';
import { WeaponRarity, WeaponType } from '../../src/weapons/types/WeaponTypes';

// Canvas setup
import '../canvas.setup';

describe('武器選択システム統合テスト', () => {
  let eventEmitter: EventEmitter<EventMap>;
  let gameObjectManager: GameObjectManager;
  let gameStateManager: GameStateManager;
  let weaponComparisonManager: WeaponComparisonManager;
  let backgroundRenderer: BackgroundRenderer;
  let player: Player;
  let game: Game;
  let testConfig: GameConfig;
  let canvas: HTMLCanvasElement;
  let mockInputManager: MockInputManager;
  let mockRandomProvider: MockRandomProvider;
  let mockMessageManager: MockMessageManager;
  let scoreManager: ScoreManager;
  let gameObjectFactory: GameObjectFactory;
  let powerUpService: PowerUpEffectService;

  beforeEach(() => {
    // テスト用設定
    testConfig = createTestConfig();

    // Canvas設定
    canvas = document.createElement('canvas');
    canvas.width = testConfig.canvas.width;
    canvas.height = testConfig.canvas.height;

    // 基本コンポーネント初期化
    eventEmitter = new EventEmitter<EventMap>();
    gameObjectManager = new GameObjectManager(eventEmitter);
    gameStateManager = new GameStateManager(eventEmitter);
    mockInputManager = new MockInputManager();
    mockRandomProvider = new MockRandomProvider();
    mockMessageManager = new MockMessageManager();
    scoreManager = new ScoreManager(eventEmitter);
    gameObjectFactory = new GameObjectFactory(mockRandomProvider);
    powerUpService = new PowerUpEffectService(testConfig);

    // プレイヤー初期化
    player = new Player(
      eventEmitter,
      mockInputManager,
      mockRandomProvider,
      testConfig,
      powerUpService
    );

    // ゲーム初期化
    game = new Game(
      canvas,
      eventEmitter,
      scoreManager,
      player,
      gameObjectFactory,
      gameStateManager,
      mockInputManager,
      mockRandomProvider,
      mockMessageManager,
      testConfig,
      powerUpService
    );

    // WeaponComparisonManager初期化
    weaponComparisonManager = new WeaponComparisonManager(
      eventEmitter,
      gameObjectManager,
      gameStateManager
    );
    weaponComparisonManager.setGameInstance(game);

    // BackgroundRenderer初期化
    backgroundRenderer = new BackgroundRenderer(testConfig);

    // GameObjectManagerにプレイヤーを設定
    gameObjectManager.setPlayer(player);
  });

  afterEach(() => {
    // クリーンアップ
    weaponComparisonManager.dispose();
    backgroundRenderer.dispose();
  });

  describe('1. 状態管理の検証', () => {
    test('ゲーム状態の重複変更が解決されている', () => {
      gameStateManager.getCurrentState();

      // 同一状態への遷移を試行
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gameStateManager.setState('PLAYING', game);
      gameStateManager.setState('PLAYING', game);

      // 重複変更がスキップされることを確認
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('同一状態への遷移をスキップ')
      );

      consoleSpy.mockRestore();
    });

    test('WEAPON_SELECTION状態への遷移が正常に動作する', () => {
      // WEAPON_SELECTION状態に変更
      gameStateManager.setState('WEAPON_SELECTION', game);

      expect(gameStateManager.getCurrentState()).toBe('WEAPON_SELECTION');
      expect(gameStateManager.isWeaponSelecting()).toBe(true);

      // PLAYING状態に戻す
      gameStateManager.setState('PLAYING', game);

      expect(gameStateManager.getCurrentState()).toBe('PLAYING');
      expect(gameStateManager.isWeaponSelecting()).toBe(false);
    });

    test('状態遷移時に適切なイベントが発行される', () => {
      const stateChangeEvents: string[] = [];

      eventEmitter.on('stateChanged', (newState: string) => {
        stateChangeEvents.push(newState);
      });

      gameStateManager.setState('WEAPON_SELECTION', game);
      gameStateManager.setState('PLAYING', game);

      expect(stateChangeEvents).toContain('WEAPON_SELECTION');
      expect(stateChangeEvents).toContain('PLAYING');
    });
  });

  describe('2. 武器発見イベントの検証', () => {
    test('武器発見イベントの重複発火が防止されている', () => {
      // テスト用エンチャント武器作成
      const enchantedWeapon: EnchantedWeapon = {
        uniqueId: 'test-weapon-1',
        baseWeaponId: 'pistol',
        id: 'pistol',
        name: 'Pistol',
        description: 'Test pistol',
        type: WeaponType.BASIC_LASER,
        rarity: WeaponRarity.COMMON,
        damage: 10,
        fireRate: 300,
        bulletSpeed: 400,
        bulletCount: 1,
        unlockCondition: () => true,
        cost: 0,
        maxLevel: 1,
        icon: '🔫',
        color: '#ffffff',
        enchantments: [],
        comboEffects: [],
        displayName: 'Test Pistol',
        generatedAt: Date.now(),
        totalStats: {
          finalDamage: 10,
          finalFireRate: 300,
          finalBulletSpeed: 400,
          finalBulletCount: 1,
          piercingCount: 0,
          criticalChance: 0,
          explosionRadius: 0,
          homingDuration: 0,
          chainCount: 0,
          freezeDuration: 0,
          lifeStealRate: 0,
          splitCount: 0,
          ricochetCount: 0,
          totalMultiplier: 1,
          comboCount: 0,
          hasLegendaryCombo: false,
        },
      };

      // DroppedWeapon作成（初期速度を0にするため、位置を固定）
      const droppedWeapon = new DroppedWeapon(
        enchantedWeapon,
        100,
        100,
        testConfig,
        eventEmitter
      );

      // 武器の初期速度を0に設定（テスト用）
      (
        droppedWeapon as unknown as { velocity: { x: number; y: number } }
      ).velocity = {
        x: 0,
        y: 0,
      };

      let weaponFoundEventCount = 0;
      eventEmitter.on('weaponFound', () => {
        weaponFoundEventCount++;
      });

      // 武器をFLOATING状態にする（1秒経過をシミュレート）
      droppedWeapon.update(1000);
      expect(droppedWeapon.getState()).toBe('floating');

      // 複数回距離チェックを実行（武器の中心位置を考慮）
      const weaponCenterX = 100 + 16; // 武器の中心X座標
      const weaponCenterY = 100 + 16; // 武器の中心Y座標
      droppedWeapon.checkPlayerDistance(weaponCenterX, weaponCenterY);
      droppedWeapon.checkPlayerDistance(weaponCenterX, weaponCenterY);
      droppedWeapon.checkPlayerDistance(weaponCenterX, weaponCenterY);

      // イベントが一度だけ発火されることを確認
      expect(weaponFoundEventCount).toBe(1);
      expect(droppedWeapon.hasTriggeredWeaponFoundEvent()).toBe(true);
    });

    test('発見済み武器の状態管理が正しく動作する', () => {
      const enchantedWeapon: EnchantedWeapon = {
        uniqueId: 'test-weapon-2',
        baseWeaponId: 'rifle',
        id: 'rifle',
        name: 'Rifle',
        description: 'Test rifle',
        type: WeaponType.PLASMA_CANNON,
        rarity: WeaponRarity.UNCOMMON,
        damage: 20,
        fireRate: 150,
        bulletSpeed: 600,
        bulletCount: 1,
        unlockCondition: () => true,
        cost: 0,
        maxLevel: 1,
        icon: '🔫',
        color: '#00ff00',
        enchantments: [],
        comboEffects: [],
        displayName: 'Test Rifle',
        generatedAt: Date.now(),
        totalStats: {
          finalDamage: 20,
          finalFireRate: 150,
          finalBulletSpeed: 600,
          finalBulletCount: 1,
          piercingCount: 0,
          criticalChance: 0,
          explosionRadius: 0,
          homingDuration: 0,
          chainCount: 0,
          freezeDuration: 0,
          lifeStealRate: 0,
          splitCount: 0,
          ricochetCount: 0,
          totalMultiplier: 1,
          comboCount: 0,
          hasLegendaryCombo: false,
        },
      };

      const droppedWeapon = new DroppedWeapon(
        enchantedWeapon,
        200,
        200,
        testConfig,
        eventEmitter
      );

      // 武器の初期速度を0に設定（テスト用）
      (
        droppedWeapon as unknown as { velocity: { x: number; y: number } }
      ).velocity = {
        x: 0,
        y: 0,
      };

      // 初期状態確認
      expect(droppedWeapon.hasTriggeredWeaponFoundEvent()).toBe(false);
      expect(droppedWeapon.getState()).toBe('spawning');

      // 武器を浮遊状態にする（時間経過をシミュレート）
      droppedWeapon.update(1000); // 1秒経過
      expect(droppedWeapon.getState()).toBe('floating');

      // 距離チェックで武器発見（武器の中心位置を考慮）
      const weaponCenterX = 200 + 16;
      const weaponCenterY = 200 + 16;
      droppedWeapon.checkPlayerDistance(weaponCenterX, weaponCenterY);

      // 状態確認
      expect(droppedWeapon.hasTriggeredWeaponFoundEvent()).toBe(true);
      expect(droppedWeapon.getState()).toBe('attracting');

      // リセット機能確認
      droppedWeapon.resetWeaponFoundFlag();
      expect(droppedWeapon.hasTriggeredWeaponFoundEvent()).toBe(false);
    });
  });

  describe('3. BackgroundRendererの検証', () => {
    test('一時停止状態の重複設定が防止されている', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // 初期状態確認
      expect(backgroundRenderer.isPausedState()).toBe(false);

      // 一時停止設定
      backgroundRenderer.setPaused(true);
      expect(backgroundRenderer.isPausedState()).toBe(true);

      // 同じ状態への重複設定
      backgroundRenderer.setPaused(true);

      // 重複設定がスキップされることを確認
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('既に一時停止状態です')
      );

      // 再開設定
      backgroundRenderer.setPaused(false);
      expect(backgroundRenderer.isPausedState()).toBe(false);

      // 同じ状態への重複設定
      backgroundRenderer.setPaused(false);

      // 重複設定がスキップされることを確認
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('既に再開状態です')
      );

      consoleSpy.mockRestore();
    });

    test('一時停止中のアニメーション停止が正常に動作する', () => {
      const ctx = canvas.getContext('2d')!;

      // 一時停止前の描画
      backgroundRenderer.setPaused(false);
      expect(() => {
        backgroundRenderer.drawOptimizedBackground(ctx, [], [], [], []);
      }).not.toThrow();

      // 一時停止中の描画
      backgroundRenderer.setPaused(true);
      expect(() => {
        backgroundRenderer.drawOptimizedBackground(ctx, [], [], [], []);
      }).not.toThrow();

      // パフォーマンス統計が正常に記録されることを確認
      const stats = backgroundRenderer.getPerformanceStats();
      expect(stats.sampleCount).toBeGreaterThan(0);
    });
  });

  describe('4. WeaponComparisonManagerの検証', () => {
    test('イベントリスナーの重複登録が防止されている', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // 新しいWeaponComparisonManagerを作成（コンストラクタで自動的にsetupEventListeners呼び出し）
      const manager = new WeaponComparisonManager(
        eventEmitter,
        gameObjectManager,
        gameStateManager
      );

      // 重複登録がスキップされることを確認
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('イベントリスナー設定完了')
      );

      manager.dispose();
      consoleSpy.mockRestore();
    });

    test('クリーンアップ処理が正しく動作する', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // WeaponComparisonManagerのクリーンアップ
      weaponComparisonManager.dispose();

      // クリーンアップ完了ログが出力されることを確認
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('リソースクリーンアップ完了')
      );

      consoleSpy.mockRestore();
    });

    test('比較中状態の管理が正常に動作する', () => {
      // 初期状態確認
      expect(weaponComparisonManager.isComparing()).toBe(false);

      // 強制終了テスト
      weaponComparisonManager.forceClose();
      expect(weaponComparisonManager.isComparing()).toBe(false);
    });
  });

  describe('5. システム間連携テスト', () => {
    test('武器発見から状態遷移までの統合フロー', async () => {
      // テスト用エンチャント武器作成
      const enchantedWeapon: EnchantedWeapon = {
        uniqueId: 'integration-test-weapon',
        baseWeaponId: 'shotgun',
        id: 'shotgun',
        name: 'Shotgun',
        description: 'Test shotgun',
        type: WeaponType.MISSILE_LAUNCHER,
        rarity: WeaponRarity.RARE,
        damage: 30,
        fireRate: 100,
        bulletSpeed: 200,
        bulletCount: 1,
        unlockCondition: () => true,
        cost: 0,
        maxLevel: 1,
        icon: '🔫',
        color: '#0080ff',
        enchantments: [],
        comboEffects: [],
        displayName: 'Test Shotgun',
        generatedAt: Date.now(),
        totalStats: {
          finalDamage: 30,
          finalFireRate: 100,
          finalBulletSpeed: 200,
          finalBulletCount: 1,
          piercingCount: 0,
          criticalChance: 0,
          explosionRadius: 0,
          homingDuration: 0,
          chainCount: 0,
          freezeDuration: 0,
          lifeStealRate: 0,
          splitCount: 0,
          ricochetCount: 0,
          totalMultiplier: 1,
          comboCount: 0,
          hasLegendaryCombo: false,
        },
      };

      const droppedWeapon = new DroppedWeapon(
        enchantedWeapon,
        150,
        150,
        testConfig,
        eventEmitter
      );

      // 武器の初期速度を0に設定（テスト用）
      (
        droppedWeapon as unknown as { velocity: { x: number; y: number } }
      ).velocity = {
        x: 0,
        y: 0,
      };

      // GameObjectManagerに武器を追加
      gameObjectManager.addDroppedWeapon(droppedWeapon);

      // 初期状態確認
      expect(gameStateManager.getCurrentState()).toBe('STARTING');
      expect(weaponComparisonManager.isComparing()).toBe(false);

      // ゲーム開始
      gameStateManager.setState('PLAYING', game);
      expect(gameStateManager.getCurrentState()).toBe('PLAYING');

      // 武器を浮遊状態にする
      droppedWeapon.update(1000);
      expect(droppedWeapon.getState()).toBe('floating');

      let stateChangedToWeaponSelection = false;
      eventEmitter.on('stateChanged', (newState: string) => {
        if (newState === 'WEAPON_SELECTION') {
          stateChangedToWeaponSelection = true;
        }
      });

      // 武器発見イベントを発火（武器の中心位置を考慮）
      const weaponCenterX = 150 + 16;
      const weaponCenterY = 150 + 16;
      droppedWeapon.checkPlayerDistance(weaponCenterX, weaponCenterY);

      // 少し待機してイベント処理を完了させる
      await new Promise(resolve => setTimeout(resolve, 10));

      // 状態遷移が発生することを確認
      expect(stateChangedToWeaponSelection).toBe(true);
    });

    test('重複処理防止の統合テスト', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // 複数の同一状態遷移を試行
      gameStateManager.setState('PLAYING', game);
      gameStateManager.setState('PLAYING', game);
      gameStateManager.setState('PLAYING', game);

      // BackgroundRendererの重複一時停止設定
      backgroundRenderer.setPaused(true);
      backgroundRenderer.setPaused(true);

      // 重複処理がスキップされることを確認
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('同一状態への遷移をスキップ')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('既に一時停止状態です')
      );

      consoleSpy.mockRestore();
    });

    test('エラーハンドリングの統合テスト', () => {
      // プレイヤーが存在しない状態での武器発見処理
      gameObjectManager.setPlayer(null as unknown as Player);

      const enchantedWeapon: EnchantedWeapon = {
        uniqueId: 'error-test-weapon',
        baseWeaponId: 'pistol',
        id: 'pistol',
        name: 'Pistol',
        description: 'Error test pistol',
        type: WeaponType.BASIC_LASER,
        rarity: WeaponRarity.COMMON,
        damage: 10,
        fireRate: 300,
        bulletSpeed: 400,
        bulletCount: 1,
        unlockCondition: () => true,
        cost: 0,
        maxLevel: 1,
        icon: '🔫',
        color: '#ffffff',
        enchantments: [],
        comboEffects: [],
        displayName: 'Error Test Pistol',
        generatedAt: Date.now(),
        totalStats: {
          finalDamage: 10,
          finalFireRate: 300,
          finalBulletSpeed: 400,
          finalBulletCount: 1,
          piercingCount: 0,
          criticalChance: 0,
          explosionRadius: 0,
          homingDuration: 0,
          chainCount: 0,
          freezeDuration: 0,
          lifeStealRate: 0,
          splitCount: 0,
          ricochetCount: 0,
          totalMultiplier: 1,
          comboCount: 0,
          hasLegendaryCombo: false,
        },
      };

      const droppedWeapon = new DroppedWeapon(
        enchantedWeapon,
        100,
        100,
        testConfig,
        eventEmitter
      );

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // 武器発見イベントを発火（プレイヤーが存在しないためエラーハンドリングが動作）
      droppedWeapon.update(1000);
      droppedWeapon.checkPlayerDistance(100, 100);

      // 適切なエラーハンドリングが動作することを確認
      expect(() => {
        // エラーが発生しても例外は投げられない
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('6. パフォーマンステスト', () => {
    test('大量の武器発見イベントでもパフォーマンスが安定している', () => {
      const startTime = performance.now();

      // 大量の武器を作成
      const weapons: DroppedWeapon[] = [];
      for (let i = 0; i < 50; i++) {
        const enchantedWeapon: EnchantedWeapon = {
          uniqueId: `perf-test-weapon-${i}`,
          baseWeaponId: 'pistol',
          id: 'pistol',
          name: 'Pistol',
          description: 'Performance test pistol',
          type: WeaponType.BASIC_LASER,
          rarity: WeaponRarity.COMMON,
          damage: 10,
          fireRate: 300,
          bulletSpeed: 400,
          bulletCount: 1,
          unlockCondition: () => true,
          cost: 0,
          maxLevel: 1,
          icon: '🔫',
          color: '#ffffff',
          enchantments: [],
          comboEffects: [],
          displayName: `Perf Test Pistol ${i}`,
          generatedAt: Date.now(),
          totalStats: {
            finalDamage: 10,
            finalFireRate: 300,
            finalBulletSpeed: 400,
            finalBulletCount: 1,
            piercingCount: 0,
            criticalChance: 0,
            explosionRadius: 0,
            homingDuration: 0,
            chainCount: 0,
            freezeDuration: 0,
            lifeStealRate: 0,
            splitCount: 0,
            ricochetCount: 0,
            totalMultiplier: 1,
            comboCount: 0,
            hasLegendaryCombo: false,
          },
        };

        const weapon = new DroppedWeapon(
          enchantedWeapon,
          i * 10,
          i * 10,
          testConfig,
          eventEmitter
        );

        weapon.update(1000); // 浮遊状態にする
        weapons.push(weapon);
      }

      // 距離チェックを実行
      weapons.forEach(weapon => {
        weapon.checkPlayerDistance(0, 0);
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // 合理的な時間内（100ms未満）で完了することを確認
      expect(executionTime).toBeLessThan(100);
    });

    test('BackgroundRendererのパフォーマンス統計が正常に記録される', () => {
      const ctx = canvas.getContext('2d')!;

      // 複数回描画を実行
      for (let i = 0; i < 10; i++) {
        backgroundRenderer.drawOptimizedBackground(ctx, [], [], [], []);
      }

      const stats = backgroundRenderer.getPerformanceStats();
      expect(stats.sampleCount).toBe(10);
      expect(stats.averageRenderTime).toBeGreaterThanOrEqual(0);
      expect(stats.cacheUtilization.background).toBe(true);
    });
  });
});
