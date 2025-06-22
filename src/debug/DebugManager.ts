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
