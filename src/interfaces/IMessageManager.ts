/**
 * メッセージ表示の抽象化インターフェース
 * UI表示ロジックをテスタブルにし、DOM依存を分離
 */

/**
 * メッセージ重要度レベル
 */
export type MessagePriority = 'critical' | 'important' | 'info' | 'minimal';

/**
 * メッセージ表示設定
 */
export interface MessageSettings {
  /** メッセージ表示を有効にするか */
  enabled: boolean;
  /** 表示する最小重要度レベル */
  minPriority: MessagePriority;
  /** Wave関連メッセージを表示するか */
  showWaveMessages: boolean;
  /** ボス関連メッセージを表示するか */
  showBossMessages: boolean;
  /** レベル関連メッセージを表示するか */
  showLevelMessages: boolean;
  /** 控えめ表示モード（全て右上の小さな表示に統一） */
  subtleMode: boolean;
}

export interface IMessageManager {
  /**
   * ゲーム内メッセージを表示
   * @param text 表示するメッセージ
   * @param duration 表示時間（ミリ秒）、デフォルトは3000ms
   * @param priority メッセージの重要度
   */
  showMessage(
    text: string,
    duration?: number,
    priority?: MessagePriority
  ): void;

  /**
   * 現在表示中のメッセージを非表示
   */
  hideMessage(): void;

  /**
   * ゲームオーバー画面を表示
   * @param finalScore 最終スコア
   */
  showGameOverScreen(finalScore: number): void;

  /**
   * ゲームオーバー画面を非表示
   */
  hideGameOverScreen(): void;

  /**
   * 一時的な通知メッセージを表示（レベルアップ等）
   * @param text 通知テキスト
   * @param type 通知タイプ（'info', 'success', 'warning'）
   * @param duration 表示時間
   */
  showNotification(
    text: string,
    type?: 'info' | 'success' | 'warning',
    duration?: number
  ): void;

  /**
   * Wave情報を控えめに表示（ゲームプレイを妨げない形で）
   * @param text Wave情報テキスト
   * @param duration 表示時間（ミリ秒）、デフォルトは1500ms
   */
  showWaveMessage(text: string, duration?: number): void;

  /**
   * メッセージ表示設定を更新
   * @param settings 新しい設定
   */
  updateSettings(settings: Partial<MessageSettings>): void;

  /**
   * 現在のメッセージ表示設定を取得
   */
  getSettings(): MessageSettings;

  /**
   * リソースクリーンアップ
   */
  dispose(): void;
}
