/**
 * デバッグ用キー入力処理クラス
 */

import { IInputManager } from '../interfaces/IInputManager';

import { DebugManager } from './DebugManager';

export class DebugInputHandler {
  private debugManager: DebugManager;
  private inputManager: IInputManager;
  private isSetup: boolean = false;

  constructor(debugManager: DebugManager, inputManager: IInputManager) {
    this.debugManager = debugManager;
    this.inputManager = inputManager;
    this.setupKeyBindings();
  }

  /**
   * キーバインドの設定
   */
  private setupKeyBindings(): void {
    if (this.isSetup) {
      return;
    }

    this.inputManager.onKeyDown((key: string) => {
      this.handleKeyDown(key);
    });

    this.isSetup = true;
    console.log('🎮 デバッグキーバインドを設定しました');
  }

  /**
   * キー押下時の処理
   */
  private handleKeyDown(key: string): void {
    // デバッグモードが無効な場合は何もしない
    if (!this.debugManager.isActive()) {
      return;
    }

    switch (key) {
      case 'F2':
      case '2': // テスト用に2キーでも無敵切り替え
        this.debugManager.toggleInvincibility();
        break;
      case 'F1':
      case '1': // テスト用に1キーでもデバッグ情報表示
        this.debugManager.logDebugInfo();
        break;
      case 'F3':
        // TODO: 時間停止/再開
        console.log('⏸️ F3: 時間停止/再開（未実装）');
        break;
      case 'F4':
      case '4': // テスト用に4キーでもウェーブスキップ
        // 次のウェーブへスキップ
        this.debugManager.skipToNextWave();
        break;
      case 'F5':
        // TODO: 敵全削除
        console.log('💥 F5: 敵全削除（未実装）');
        break;
      case 'F6':
        // TODO: パワーアップ全取得
        console.log('⚡ F6: パワーアップ全取得（未実装）');
        break;
      case 'F12':
        // デバッグ情報をコンソールに出力
        this.debugManager.logDebugInfo();
        break;
      default:
        // 他のキーは無視
        break;
    }
  }

  /**
   * リソースのクリーンアップ
   */
  public dispose(): void {
    // 現在の実装では特にクリーンアップは不要
    console.log('🎮 DebugInputHandler disposed');
  }
}
