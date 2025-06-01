/**
 * メッセージ表示の抽象化インターフェース
 * UI表示ロジックをテスタブルにし、DOM依存を分離
 */
export interface IMessageManager {
  /**
   * ゲーム内メッセージを表示
   * @param text 表示するメッセージ
   * @param duration 表示時間（ミリ秒）、デフォルトは3000ms
   */
  showMessage(text: string, duration?: number): void;

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
  showNotification(text: string, type?: 'info' | 'success' | 'warning', duration?: number): void;

  /**
   * リソースクリーンアップ
   */
  dispose(): void;
}
