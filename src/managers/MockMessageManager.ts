import { IMessageManager, MessageSettings, MessagePriority } from "../interfaces/IMessageManager";

/**
 * テスト用のメッセージ管理クラス
 * メッセージ表示操作をモック化し、決定論的テストを可能にする
 */
export class MockMessageManager implements IMessageManager {
  private displayedMessages: Array<{
    text: string;
    duration: number;
    priority?: MessagePriority;
    timestamp: number;
  }> = [];
  
  private notifications: Array<{
    text: string;
    type: 'info' | 'success' | 'warning';
    duration: number;
    timestamp: number;
  }> = [];
  
  private waveMessages: Array<{
    text: string;
    duration: number;
    timestamp: number;
  }> = [];
  
  private gameOverScreenVisible = false;
  private gameOverFinalScore = 0;
  private currentMessageVisible = false;
  private settings: MessageSettings = {
    enabled: true,
    minPriority: 'minimal',
    showWaveMessages: true,
    showBossMessages: true,
    showLevelMessages: true,
    subtleMode: true
  };

  public showMessage(text: string, duration: number = 3000, priority: MessagePriority = 'important'): void {
    this.displayedMessages.push({
      text,
      duration,
      priority,
      timestamp: Date.now()
    });
    this.currentMessageVisible = true;
  }

  public hideMessage(): void {
    this.currentMessageVisible = false;
  }

  public showGameOverScreen(finalScore: number): void {
    this.gameOverScreenVisible = true;
    this.gameOverFinalScore = finalScore;
  }

  public hideGameOverScreen(): void {
    this.gameOverScreenVisible = false;
    this.gameOverFinalScore = 0;
  }

  public showNotification(text: string, type: 'info' | 'success' | 'warning' = 'info', duration: number = 2000): void {
    this.notifications.push({
      text,
      type,
      duration,
      timestamp: Date.now()
    });
  }

  public showWaveMessage(text: string, duration: number = 1500): void {
    this.waveMessages.push({
      text,
      duration,
      timestamp: Date.now()
    });
  }

  public dispose(): void {
    this.displayedMessages = [];
    this.notifications = [];
    this.waveMessages = [];
    this.gameOverScreenVisible = false;
    this.gameOverFinalScore = 0;
    this.currentMessageVisible = false;
  }

  // テスト用ヘルパーメソッド

  /**
   * 表示されたメッセージの一覧を取得
   */
  public getDisplayedMessages(): Array<{
    text: string;
    duration: number;
    timestamp: number;
  }> {
    return [...this.displayedMessages];
  }

  /**
   * 最後に表示されたメッセージを取得
   */
  public getLastMessage(): { text: string; duration: number; timestamp: number } | null {
    return this.displayedMessages.length > 0 
      ? this.displayedMessages[this.displayedMessages.length - 1] 
      : null;
  }

  /**
   * 特定のテキストのメッセージが表示されたかチェック
   */
  public hasMessageBeenDisplayed(text: string): boolean {
    return this.displayedMessages.some(msg => msg.text === text);
  }

  /**
   * 表示されたメッセージ数を取得
   */
  public getMessageCount(): number {
    return this.displayedMessages.length;
  }

  /**
   * 表示された通知の一覧を取得
   */
  public getNotifications(): Array<{
    text: string;
    type: 'info' | 'success' | 'warning';
    duration: number;
    timestamp: number;
  }> {
    return [...this.notifications];
  }

  /**
   * 最後に表示された通知を取得
   */
  public getLastNotification(): { 
    text: string; 
    type: 'info' | 'success' | 'warning'; 
    duration: number; 
    timestamp: number 
  } | null {
    return this.notifications.length > 0 
      ? this.notifications[this.notifications.length - 1] 
      : null;
  }

  /**
   * 特定のタイプの通知が表示されたかチェック
   */
  public hasNotificationOfType(type: 'info' | 'success' | 'warning'): boolean {
    return this.notifications.some(notification => notification.type === type);
  }

  /**
   * 特定のテキストの通知が表示されたかチェック
   */
  public hasNotificationBeenDisplayed(text: string): boolean {
    return this.notifications.some(notification => notification.text === text);
  }

  /**
   * ゲームオーバー画面が表示されているかチェック
   */
  public isGameOverScreenVisible(): boolean {
    return this.gameOverScreenVisible;
  }

  /**
   * ゲームオーバー画面の最終スコアを取得
   */
  public getGameOverFinalScore(): number {
    return this.gameOverFinalScore;
  }

  /**
   * 現在メッセージが表示されているかチェック
   */
  public isMessageVisible(): boolean {
    return this.currentMessageVisible;
  }

  /**
   * 指定した期間内に表示されたメッセージを取得
   */
  public getMessagesInTimeRange(startTime: number, endTime: number): Array<{
    text: string;
    duration: number;
    timestamp: number;
  }> {
    return this.displayedMessages.filter(msg => 
      msg.timestamp >= startTime && msg.timestamp <= endTime
    );
  }

  /**
   * 最後のメッセージの表示時間を取得
   */
  public getLastMessageDuration(): number {
    const lastMessage = this.getLastMessage();
    return lastMessage ? lastMessage.duration : 0;
  }

  /**
   * 状態をリセット（テスト間のクリーンアップ用）
   */
  public reset(): void {
    this.dispose();
  }

  /**
   * 表示されたWaveメッセージの一覧を取得
   */
  public getWaveMessages(): Array<{
    text: string;
    duration: number;
    timestamp: number;
  }> {
    return [...this.waveMessages];
  }

  /**
   * 最後に表示されたWaveメッセージを取得
   */
  public getLastWaveMessage(): { text: string; duration: number; timestamp: number } | null {
    return this.waveMessages.length > 0 
      ? this.waveMessages[this.waveMessages.length - 1] 
      : null;
  }

  /**
   * 特定のテキストのWaveメッセージが表示されたかチェック
   */
  public hasWaveMessageBeenDisplayed(text: string): boolean {
    return this.waveMessages.some(msg => msg.text === text);
  }

  /**
   * 表示されたWaveメッセージ数を取得
   */
  public getWaveMessageCount(): number {
    return this.waveMessages.length;
  }

  /**
   * すべての記録をクリア（テスト用）
   */
  public clearHistory(): void {
    this.displayedMessages = [];
    this.notifications = [];
    this.waveMessages = [];
  }

  /**
   * メッセージ表示設定を更新
   */
  public updateSettings(newSettings: Partial<MessageSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * 現在のメッセージ表示設定を取得
   */
  public getSettings(): MessageSettings {
    return { ...this.settings };
  }
}
