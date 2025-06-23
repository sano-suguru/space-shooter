import { Game } from '../core/Game';
import { DroppedWeapon } from '../entities/DroppedWeapon';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';
import { WeaponComparisonSystem } from '../systems/WeaponComparisonSystem';
import { WeaponComparisonUI } from '../ui/WeaponComparisonUI';
import { EnchantedWeapon } from '../weapons/types/EnchantedWeapon';

import { GameObjectManager } from './GameObjectManager';
import { GameStateManager } from './GameStateManager';

/**
 * 武器比較マネージャー
 * 武器発見イベントを処理し、比較UIを表示して選択を管理
 */
export class WeaponComparisonManager {
  private comparisonSystem: WeaponComparisonSystem;
  private comparisonUI: WeaponComparisonUI;
  private currentDroppedWeapon: DroppedWeapon | null = null;
  private gameObjectManager: GameObjectManager;
  private gameStateManager: GameStateManager;
  private gameInstance: Game | null = null;
  private weaponFoundHandler:
    | ((data: {
        droppedWeapon: DroppedWeapon;
        playerPosition: { x: number; y: number };
      }) => void)
    | null = null;
  private isListenerSetup = false;

  constructor(
    private eventEmitter: EventEmitter<EventMap>,
    gameObjectManager: GameObjectManager,
    gameStateManager: GameStateManager
  ) {
    this.comparisonSystem = new WeaponComparisonSystem();
    this.comparisonUI = new WeaponComparisonUI();
    this.gameObjectManager = gameObjectManager;
    this.gameStateManager = gameStateManager;

    // WeaponComparisonUIにGameStateManagerを設定
    this.comparisonUI.setGameStateManager(gameStateManager);

    this.setupEventListeners();
  }

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    // 重複登録を防ぐため、既にセットアップ済みの場合はスキップ
    if (this.isListenerSetup) {
      console.log('🔧 WeaponComparisonManager: イベントリスナー既に設定済み');
      return;
    }

    // ハンドラー関数を保存
    this.weaponFoundHandler = this.handleWeaponFound.bind(this);

    // イベントリスナーを登録
    this.eventEmitter.on('weaponFound', this.weaponFoundHandler);

    this.isListenerSetup = true;
    console.log('🔧 WeaponComparisonManager: イベントリスナー設定完了');
  }

  /**
   * 武器発見イベントを処理
   */
  private handleWeaponFound(data: {
    droppedWeapon: DroppedWeapon;
    playerPosition: { x: number; y: number };
  }): void {
    console.log(
      '🔍 武器比較システム開始:',
      data.droppedWeapon.getEnchantedWeapon().displayName
    );

    // 既に比較中の場合は処理しない
    if (this.currentDroppedWeapon) {
      console.log('⚠️ 既に武器比較中のため、新しい武器発見をスキップします');
      return;
    }

    // プレイヤーの取得を試行
    const player = this.gameObjectManager.getPlayer() as
      | import('../entities/Player').Player
      | null;

    if (!player) {
      console.warn('⚠️ プレイヤーが見つからないため、武器比較をスキップします');
      return;
    }

    console.log('🎮 ゲーム状態をWEAPON_SELECTIONに変更します');

    // ゲーム状態をWEAPON_SELECTIONに変更（時間停止）
    if (this.gameInstance) {
      this.gameStateManager.setState('WEAPON_SELECTION', this.gameInstance);
    }

    this.currentDroppedWeapon = data.droppedWeapon;

    const currentWeapon = this.getCurrentPlayerWeapon(player);
    const newWeapon = data.droppedWeapon.getEnchantedWeapon();

    // 比較データを生成
    const comparisonData = this.comparisonSystem.generateComparisonData(
      currentWeapon,
      newWeapon
    );

    // 比較UIを表示
    this.comparisonUI.show(comparisonData, this.handlePlayerChoice.bind(this));

    console.log('⏸️ 武器選択状態に移行しました - ゲーム時間停止', {
      weaponName: newWeapon.displayName,
      rarity: newWeapon.rarity,
      playerPosition: data.playerPosition,
    });
  }

  /**
   * プレイヤーの現在の武器を取得
   */
  private getCurrentPlayerWeapon(
    player: import('../entities/Player').Player | null
  ): EnchantedWeapon | null {
    console.log('🔍 現在の武器取得開始:', {
      hasPlayer: !!player,
    });

    if (!player) {
      console.warn('⚠️ プレイヤーが見つかりません');
      return null;
    }

    // Player.tsのgetCurrentWeaponメソッドを使用
    if (
      'getCurrentWeapon' in player &&
      typeof player.getCurrentWeapon === 'function'
    ) {
      const currentWeapon = player.getCurrentWeapon();
      if (currentWeapon) {
        console.log('✅ 現在の武器取得成功:', {
          weaponName: currentWeapon.displayName,
          rarity: currentWeapon.rarity,
        });
        return currentWeapon;
      }
    }

    console.warn('❌ 現在の武器が見つかりません（武器なし状態）');
    return null;
  }

  /**
   * プレイヤーの選択を処理
   */
  private handlePlayerChoice(equipNew: boolean): void {
    if (!this.currentDroppedWeapon) {
      console.warn('⚠️ 武器選択処理エラー: ドロップされた武器が見つかりません');
      return;
    }

    if (equipNew) {
      console.log('✅ 新しい武器を装備します');
      this.equipNewWeapon();
    } else {
      console.log('❌ 現在の武器を保持します');
      this.keepCurrentWeapon();
    }

    // 武器選択完了後、ゲーム状態をPLAYINGに戻す
    console.log('🎮 武器選択完了 - ゲーム状態をPLAYINGに戻します');
    if (this.gameInstance) {
      this.gameStateManager.setState('PLAYING', this.gameInstance);
    }

    this.currentDroppedWeapon = null;
  }

  /**
   * 新しい武器を装備
   */
  private equipNewWeapon(): void {
    if (!this.currentDroppedWeapon) return;

    const player = this.gameObjectManager.getPlayer() as
      | import('../entities/Player').Player
      | null;
    if (!player) {
      console.warn('⚠️ プレイヤーが見つかりません');
      return;
    }

    // 武器を収集
    const enchantedWeapon = this.currentDroppedWeapon.collect();

    // プレイヤーに武器を装備
    if ('equipEnchantedWeapon' in player) {
      const equipResult = player.equipEnchantedWeapon(enchantedWeapon);
      if (equipResult) {
        console.log(
          `⚔️ 武器装備成功: ${enchantedWeapon.displayName} (${enchantedWeapon.rarity})`
        );

        // 装備成功イベントを発行
        this.eventEmitter.emit('weaponEquipped', {
          weaponId: enchantedWeapon.uniqueId,
          slot: 0, // 現在のスロット（後で動的に取得）
        });
      } else {
        console.warn(
          `⚠️ 武器装備失敗: ${enchantedWeapon.displayName} (スロット満杯)`
        );
        // 装備失敗の場合は武器をフィールドに戻す（後で実装）
        return;
      }
    }

    // ドロップされた武器をゲームから削除
    this.gameObjectManager.removeDroppedWeapon(this.currentDroppedWeapon);
    console.log(`🎉 武器拾得完了: ${enchantedWeapon.displayName}`);
  }

  /**
   * 現在の武器を保持（新しい武器を無視）
   */
  private keepCurrentWeapon(): void {
    if (!this.currentDroppedWeapon) return;

    console.log(
      `💨 武器を無視: ${this.currentDroppedWeapon.getEnchantedWeapon().displayName}`
    );

    // 武器はフィールドに残したまま、比較状態をリセット
    // プレイヤーが再度近づけば再び比較UIが表示される
  }

  /**
   * 強制的に武器比較を終了
   */
  public forceClose(): void {
    this.comparisonUI.hide();

    // 強制終了時もゲーム状態をPLAYINGに戻す
    if (this.currentDroppedWeapon && this.gameInstance) {
      console.log('🎮 武器比較強制終了 - ゲーム状態をPLAYINGに戻します');
      this.gameStateManager.setState('PLAYING', this.gameInstance);
    }

    this.currentDroppedWeapon = null;
  }

  /**
   * 現在比較中かどうかを確認
   */
  public isComparing(): boolean {
    return this.currentDroppedWeapon !== null;
  }

  /**
   * Gameインスタンスを設定（初期化時に呼び出される）
   */
  public setGameInstance(game: Game): void {
    this.gameInstance = game;
    // WeaponComparisonUIにもGameインスタンスを設定
    this.comparisonUI.setGameInstance(game);
  }

  /**
   * リソースクリーンアップ
   */
  public dispose(): void {
    // イベントリスナーのクリーンアップ
    if (this.weaponFoundHandler && this.isListenerSetup) {
      // 現在のEventEmitterの実装では直接削除できないため、
      // フラグでリスナーを無効化
      this.weaponFoundHandler = null;
      this.isListenerSetup = false;
    }

    // 現在の比較状態をクリア
    this.currentDroppedWeapon = null;

    console.log('🧹 WeaponComparisonManager: リソースクリーンアップ完了');
  }
}
