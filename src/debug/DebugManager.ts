/**
 * デバッグ機能の中央管理クラス
 */

import { Player } from '../entities/Player';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';
import { IGame } from '../interfaces/IGame';
import { WaveManager } from '../managers/WaveManager';

import { DebugState } from './types/DebugTypes';

export class DebugManager {
  private debugState: DebugState;
  private game: IGame;
  private player: Player;
  private eventEmitter: EventEmitter<EventMap>;
  private waveManager: WaveManager | null = null;

  constructor(
    game: IGame,
    player: Player,
    eventEmitter: EventEmitter<EventMap>
  ) {
    this.game = game;
    this.player = player;
    this.eventEmitter = eventEmitter;

    // デバッグ状態の初期化
    this.debugState = {
      isActive: true,
      invincible: false,
      timeMultiplier: 1.0,
      showUI: false,
      showCollisionBoxes: false,
      infiniteHealth: false,
      playerHealth: this.player.getHealth(),
      currentWave: 1,
      enemyCount: 0,
      fps: 60,
    };
  }

  /**
   * 無敵モードの切り替え
   */
  public toggleInvincibility(): void {
    this.debugState.invincible = !this.debugState.invincible;
    this.player.setDebugInvincible(this.debugState.invincible);

    console.log(
      `🛡️ デバッグ無敵モード: ${this.debugState.invincible ? 'ON' : 'OFF'}`
    );

    // TODO: カスタムイベントを追加する予定
    // this.eventEmitter.emit('debugModeToggled', { enabled: this.debugState.invincible });
  }

  /**
   * 無敵モードを設定
   */
  public setInvincibility(enabled: boolean): void {
    this.debugState.invincible = enabled;
    this.player.setDebugInvincible(enabled);

    console.log(`🛡️ デバッグ無敵モード: ${enabled ? 'ON' : 'OFF'}`);
  }

  /**
   * WaveManagerを設定
   */
  public setWaveManager(waveManager: WaveManager): void {
    this.waveManager = waveManager;
  }

  /**
   * 次のウェーブにスキップ
   */
  public skipToNextWave(): void {
    if (!this.waveManager) {
      console.warn('⚠️ WaveManagerが設定されていません');
      return;
    }

    // WaveManagerを通じて次のウェーブを開始
    const currentWave = this.waveManager.getCurrentWave();
    this.waveManager.startNextWave();
    console.log(
      `⏭️ Wave ${currentWave} から Wave ${currentWave + 1} にスキップしました`
    );
  }

  /**
   * ビジュアル効果の切り替え
   */
  public toggleEnhancedVisuals(): void {
    this.game.toggleEnhancedVisuals();
    const isEnabled = this.game.isEnhancedVisualsEnabled();
    console.log(`✨ 拡張ビジュアル効果: ${isEnabled ? 'ON' : 'OFF'}`);
  }

  /**
   * 背景最適化の切り替え
   */
  public toggleBackgroundOptimization(): void {
    this.game.toggleBackgroundOptimization();
    console.log('🎨 背景レンダリング最適化を切り替えました');
  }

  /**
   * 武器タイプの切り替え（デバッグ用）
   */
  public switchWeaponForDebug(slot: number): void {
    this.game.switchWeapon(slot);
    console.log(`🔫 武器スロット ${slot} に切り替えました`);
  }

  /**
   * 武器を強制ドロップ（デバッグ用）
   */
  public forceWeaponDrop(): void {
    console.log('🎁 デバッグ: 武器強制ドロップを実行');

    // プレイヤーの位置を取得
    const playerPosition = this.player.getPosition();
    console.log('📍 プレイヤー位置:', playerPosition);

    // 武器マネージャーを取得
    const weaponManager = this.player.getWeaponManager();
    if (!weaponManager) {
      console.error('❌ WeaponManagerが見つかりません');
      return;
    }
    console.log('✅ WeaponManager取得成功');

    // 武器ドロップシステムを取得
    const weaponDropSystem = weaponManager.getWeaponDropSystem();
    if (!weaponDropSystem) {
      console.error('❌ WeaponDropSystemが見つかりません');
      return;
    }
    console.log('✅ WeaponDropSystem取得成功');

    // 強制ドロップ用の敵情報を作成
    const debugEnemyInfo = {
      type: 'elite' as const, // エリート敵として扱い、ドロップ率を上げる
      level: 10, // 高レベルに設定
      position: {
        x: playerPosition.x + 50, // プレイヤーの少し右側にドロップ
        y: playerPosition.y,
      },
    };

    // 武器ドロップを試行（強制的に成功させるため複数回試行）
    let dropAttempts = 0;
    const maxAttempts = 10;

    while (dropAttempts < maxAttempts) {
      console.log(`🎲 ドロップ試行 ${dropAttempts + 1}/${maxAttempts}`);
      const dropResult = weaponDropSystem.attemptDrop(debugEnemyInfo);
      
      console.log('🎲 ドロップ結果:', {
        success: dropResult.success,
        actualDropRate: dropResult.actualDropRate,
        dropReason: dropResult.dropReason,
        hasDroppedWeapon: !!dropResult.droppedWeapon,
        hasEnchantedWeapon: !!dropResult.enchantedWeapon,
      });

      if (dropResult.success && dropResult.droppedWeapon) {
        console.log('✅ 武器ドロップ成功 - GameObjectManagerに追加中...');
        
        // DroppedWeaponにEventEmitterを設定
        dropResult.droppedWeapon.setEventEmitter(this.eventEmitter);
        console.log('✅ EventEmitter設定完了');

        // 直接的なアクセス方法を試行
        try {
          // Game.tsのhandleWeaponDropメソッドと同じ方法を使用
          const gameInstance = this.game as any;
          if (gameInstance.gameObjectManager && gameInstance.gameObjectManager.addDroppedWeapon) {
            gameInstance.gameObjectManager.addDroppedWeapon(dropResult.droppedWeapon);
            console.log('✅ GameObjectManagerに武器追加成功（直接アクセス）');
          } else {
            console.error('❌ GameObjectManagerまたはaddDroppedWeaponメソッドが見つかりません');
            console.log('🔍 利用可能なプロパティ:', Object.keys(gameInstance));
          }
        } catch (error) {
          console.error('❌ GameObjectManagerへの追加でエラー:', error);
        }

        console.log('🎉 デバッグ武器ドロップ成功:', {
          weaponName: dropResult.enchantedWeapon?.displayName,
          rarity: dropResult.enchantedWeapon?.rarity,
          position: debugEnemyInfo.position,
          attempts: dropAttempts + 1,
        });

        // 成功メッセージを表示
        this.game.showMessage(
          `🔧 デバッグ: ${dropResult.enchantedWeapon?.rarity?.toUpperCase()}武器をドロップしました！`,
          2000,
          'info'
        );

        return;
      }

      dropAttempts++;
    }

    console.warn(`⚠️ ${maxAttempts}回試行しましたが武器ドロップに失敗しました`);
    this.game.showMessage(
      '🔧 デバッグ: 武器ドロップに失敗しました',
      1500,
      'info'
    );
  }

  /**
   * パフォーマンス統計の表示
   */
  public logPerformanceStats(): void {
    try {
      const stats = this.game.getAllPerformanceStats();
      console.log('📊 パフォーマンス統計:', {
        背景レンダリング: {
          統計データ: stats.background,
        },
        オブジェクトプール: {
          統計データ: stats.pools,
        },
        パフォーマンス: {
          統計データ: stats.performance,
        },
        LOD: {
          統計データ: stats.lod,
        },
        ビジュアル効果: this.game.isEnhancedVisualsEnabled() ? 'ON' : 'OFF',
      });
    } catch (error) {
      console.warn('⚠️ パフォーマンス統計の取得に失敗しました:', error);
    }
  }

  /**
   * デバッグ状態を取得
   */
  public getDebugState(): DebugState {
    // 現在の状態を更新
    this.debugState.playerHealth = this.player.getHealth();

    if (this.waveManager) {
      this.debugState.currentWave = this.waveManager.getCurrentWave();
    }

    return { ...this.debugState };
  }

  /**
   * デバッグモードがアクティブかどうか
   */
  public isActive(): boolean {
    return this.debugState.isActive;
  }

  /**
   * デバッグモードを有効/無効にする
   */
  public setActive(active: boolean): void {
    this.debugState.isActive = active;

    if (!active) {
      // デバッグモードを無効にする際は、全ての効果をリセット
      this.resetAllEffects();
    }

    console.log(`🔧 デバッグモード: ${active ? 'ON' : 'OFF'}`);
  }

  /**
   * 全てのデバッグ効果をリセット
   */
  private resetAllEffects(): void {
    this.setInvincibility(false);
    // ビジュアル効果は保持（ユーザーの設定として）
    // 他の効果も今後ここでリセット
  }

  /**
   * デバッグ情報をコンソールに出力
   */
  public logDebugInfo(): void {
    const state = this.getDebugState();
    console.log('🔍 デバッグ情報:', {
      無敵モード: state.invincible ? 'ON' : 'OFF',
      プレイヤー体力: `${state.playerHealth}/${this.player.getMaxHealth()}`,
      現在ウェーブ: state.currentWave,
      敵数: state.enemyCount,
      FPS: state.fps,
      ビジュアル効果: this.game.isEnhancedVisualsEnabled() ? 'ON' : 'OFF',
      装備武器数: this.game.getEquippedWeapons().length,
    });
  }

  /**
   * リソースのクリーンアップ
   */
  public dispose(): void {
    this.resetAllEffects();
    console.log('🔧 DebugManager disposed');
  }
}
