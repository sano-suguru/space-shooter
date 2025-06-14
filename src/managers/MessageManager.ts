import { IDOMManager } from '../interfaces/IDOMManager';
import {
  IMessageManager,
  MessageSettings,
  MessagePriority,
} from '../interfaces/IMessageManager';
import { ITimeProvider } from '../providers/ITimeProvider';

/**
 * 本番環境用のメッセージ管理クラス
 * DOMManagerとTimeProviderを使用してUI表示を管理
 */
export class MessageManager implements IMessageManager {
  private currentMessageElement: HTMLElement | null = null;
  private currentTimeoutId: number | null = null;
  private settings: MessageSettings;

  constructor(
    private domManager: IDOMManager,
    private timeProvider: ITimeProvider
  ) {
    // デフォルト設定: ユーザーフィードバックに対応し、控えめ表示モードを有効化
    this.settings = {
      enabled: true,
      minPriority: 'minimal', // 全てのメッセージを表示
      showWaveMessages: true,
      showBossMessages: true,
      showLevelMessages: true,
      subtleMode: true, // 控えめ表示モードをデフォルトで有効
    };
  }

  public showMessage(
    text: string,
    duration: number = 3000,
    priority: MessagePriority = 'important'
  ): void {
    // 設定チェック: メッセージ表示が無効または重要度が不足の場合は表示しない
    if (!this.settings.enabled || !this.shouldShowMessage(priority)) {
      return;
    }

    // 既存のメッセージがあれば削除
    this.hideMessage();

    const messageElement = this.domManager.createElement('div');
    this.domManager.setTextContent(messageElement, text);

    // 控えめ表示モードの場合は、全てのメッセージを右上の小さな表示に統一
    if (this.settings.subtleMode) {
      this.applySubtleMessageStyle(messageElement, duration);
    } else {
      this.applyTraditionalMessageStyle(messageElement, duration);
    }
  }

  /**
   * 控えめなメッセージ表示スタイルを適用（ユーザーフィードバック対応）
   */
  private applySubtleMessageStyle(
    messageElement: HTMLElement,
    duration: number
  ): void {
    this.setupSubtleMessageLayout(messageElement);
    this.setupSubtleMessageStyling(messageElement);
    this.setupSubtleMessageAnimation(messageElement);
    this.displaySubtleMessage(messageElement, duration);
  }

  private setupSubtleMessageLayout(messageElement: HTMLElement): void {
    this.domManager.setStyle(messageElement, 'position', 'absolute');
    this.domManager.setStyle(messageElement, 'top', '50px');
    this.domManager.setStyle(messageElement, 'right', '10px');
    this.domManager.setStyle(messageElement, 'zIndex', '900');
    this.domManager.setStyle(messageElement, 'textAlign', 'right');
    this.domManager.setStyle(messageElement, 'maxWidth', '250px');
    this.domManager.setStyle(messageElement, 'pointerEvents', 'none');
  }

  private setupSubtleMessageStyling(messageElement: HTMLElement): void {
    // フォントスタイリング
    this.domManager.setStyle(messageElement, 'color', '#ffffff');
    this.domManager.setStyle(messageElement, 'fontSize', '16px');
    this.domManager.setStyle(messageElement, 'fontWeight', '600');
    this.domManager.setStyle(messageElement, 'fontFamily', 'Arial, sans-serif');
    this.domManager.setStyle(messageElement, 'lineHeight', '1.3');

    // テキストエフェクト
    this.domManager.setStyle(
      messageElement,
      'textShadow',
      '0 0 6px rgba(0, 255, 255, 0.7), 1px 1px 2px rgba(0, 0, 0, 0.8)'
    );

    // 背景スタイリング
    this.domManager.setStyle(
      messageElement,
      'backgroundColor',
      'rgba(0, 20, 40, 0.8)'
    );
    this.domManager.setStyle(messageElement, 'padding', '10px 14px');
    this.domManager.setStyle(messageElement, 'borderRadius', '6px');
    this.domManager.setStyle(
      messageElement,
      'border',
      '1px solid rgba(0, 255, 255, 0.5)'
    );
    this.domManager.setStyle(
      messageElement,
      'boxShadow',
      '0 2px 6px rgba(0, 255, 255, 0.2)'
    );
  }

  private setupSubtleMessageAnimation(messageElement: HTMLElement): void {
    this.domManager.setStyle(messageElement, 'opacity', '0');
    this.domManager.setStyle(messageElement, 'transform', 'translateX(100%)');
    this.domManager.setStyle(messageElement, 'transition', 'all 0.3s ease-out');
  }

  private displaySubtleMessage(
    messageElement: HTMLElement,
    duration: number
  ): void {
    const body = this.domManager.getBody();
    this.domManager.appendChild(body, messageElement);
    this.currentMessageElement = messageElement;

    // スライドイン効果
    this.timeProvider.setTimeout(() => {
      this.domManager.setStyle(messageElement, 'opacity', '1');
      this.domManager.setStyle(messageElement, 'transform', 'translateX(0)');
    }, 50);

    // スライドアウトして削除
    const subtleDuration = Math.min(duration * 0.7, 2000);
    this.currentTimeoutId = this.timeProvider.setTimeout(() => {
      this.animateSubtleMessageOut(messageElement, body);
    }, subtleDuration - 300);
  }

  private animateSubtleMessageOut(
    messageElement: HTMLElement,
    body: HTMLElement
  ): void {
    this.domManager.setStyle(messageElement, 'transition', 'all 0.3s ease-in');
    this.domManager.setStyle(messageElement, 'opacity', '0');
    this.domManager.setStyle(messageElement, 'transform', 'translateX(100%)');

    this.timeProvider.setTimeout(() => {
      if (
        this.currentMessageElement === messageElement &&
        this.domManager.contains(body, messageElement)
      ) {
        this.domManager.removeChild(body, messageElement);
        this.currentMessageElement = null;
      }
    }, 300);
  }

  /**
   * 従来のメッセージ表示スタイルを適用（後方互換性）
   */
  private applyTraditionalMessageStyle(
    messageElement: HTMLElement,
    duration: number
  ): void {
    this.setupTraditionalMessageLayout(messageElement);
    this.setupTraditionalMessageStyling(messageElement);
    this.setupTraditionalMessageAnimation(messageElement);
    this.displayTraditionalMessage(messageElement, duration);
  }

  private setupTraditionalMessageLayout(messageElement: HTMLElement): void {
    this.domManager.setStyle(messageElement, 'position', 'absolute');
    this.domManager.setStyle(messageElement, 'top', '50%');
    this.domManager.setStyle(messageElement, 'left', '50%');
    this.domManager.setStyle(
      messageElement,
      'transform',
      'translate(-50%, -50%)'
    );
    this.domManager.setStyle(messageElement, 'textAlign', 'center');
    this.domManager.setStyle(messageElement, 'zIndex', '1000');
  }

  private setupTraditionalMessageStyling(messageElement: HTMLElement): void {
    // フォントスタイリング
    this.domManager.setStyle(messageElement, 'color', '#ffffff');
    this.domManager.setStyle(messageElement, 'fontSize', '32px');
    this.domManager.setStyle(messageElement, 'fontWeight', 'bold');
    this.domManager.setStyle(messageElement, 'fontFamily', 'Arial, sans-serif');

    // テキストエフェクト
    this.domManager.setStyle(
      messageElement,
      'textShadow',
      '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff, 2px 2px 4px rgba(0, 0, 0, 0.8)'
    );

    // 背景スタイリング
    this.domManager.setStyle(
      messageElement,
      'backgroundColor',
      'rgba(0, 20, 40, 0.9)'
    );
    this.domManager.setStyle(messageElement, 'padding', '20px 40px');
    this.domManager.setStyle(messageElement, 'borderRadius', '15px');
    this.domManager.setStyle(messageElement, 'border', '2px solid #00ffff');
    this.domManager.setStyle(
      messageElement,
      'boxShadow',
      '0 0 20px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.1)'
    );
  }

  private setupTraditionalMessageAnimation(messageElement: HTMLElement): void {
    this.domManager.setStyle(messageElement, 'opacity', '0');
    this.domManager.setStyle(
      messageElement,
      'transform',
      'translate(-50%, -50%) scale(0.5)'
    );
    this.domManager.setStyle(messageElement, 'transition', 'all 0.3s ease-out');
  }

  private displayTraditionalMessage(
    messageElement: HTMLElement,
    duration: number
  ): void {
    const body = this.domManager.getBody();
    this.domManager.appendChild(body, messageElement);
    this.currentMessageElement = messageElement;

    // フェードイン効果
    this.timeProvider.setTimeout(() => {
      this.domManager.setStyle(messageElement, 'opacity', '1');
      this.domManager.setStyle(
        messageElement,
        'transform',
        'translate(-50%, -50%) scale(1)'
      );
    }, 50);

    // フェードアウトして削除
    this.currentTimeoutId = this.timeProvider.setTimeout(() => {
      this.animateTraditionalMessageOut(messageElement, body);
    }, duration - 500);
  }

  private animateTraditionalMessageOut(
    messageElement: HTMLElement,
    body: HTMLElement
  ): void {
    this.domManager.setStyle(messageElement, 'transition', 'all 0.5s ease-in');
    this.domManager.setStyle(messageElement, 'opacity', '0');
    this.domManager.setStyle(
      messageElement,
      'transform',
      'translate(-50%, -50%) scale(0.8)'
    );

    this.timeProvider.setTimeout(() => {
      if (
        this.currentMessageElement === messageElement &&
        this.domManager.contains(body, messageElement)
      ) {
        this.domManager.removeChild(body, messageElement);
        this.currentMessageElement = null;
      }
    }, 500);
  }

  public hideMessage(): void {
    if (this.currentMessageElement) {
      const body = this.domManager.getBody();
      if (this.domManager.contains(body, this.currentMessageElement)) {
        this.domManager.removeChild(body, this.currentMessageElement);
      }
      this.currentMessageElement = null;
    }

    if (this.currentTimeoutId !== null) {
      this.timeProvider.clearTimeout(this.currentTimeoutId);
      this.currentTimeoutId = null;
    }
  }

  public showGameOverScreen(finalScore: number): void {
    const gameOverElement = this.domManager.getElementById('gameOver');
    if (gameOverElement) {
      this.domManager.removeClass(gameOverElement, 'hidden');
    }

    const finalScoreElement = this.domManager.getElementById('finalScore');
    if (finalScoreElement) {
      this.domManager.setTextContent(finalScoreElement, finalScore.toString());
    }
  }

  public hideGameOverScreen(): void {
    const gameOverElement = this.domManager.getElementById('gameOver');
    if (gameOverElement) {
      this.domManager.addClass(gameOverElement, 'hidden');
    }
  }

  public showNotification(
    text: string,
    type: 'info' | 'success' | 'warning' = 'info',
    duration: number = 2000
  ): void {
    const notificationElement = this.createNotificationElement(text);
    this.applyNotificationBaseStyles(notificationElement);
    this.applyNotificationTypeStyles(notificationElement, type);
    this.setupNotificationAnimation(notificationElement);
    this.displayAndAnimateNotification(notificationElement, duration);
  }

  /**
   * 通知要素を作成
   */
  private createNotificationElement(text: string): HTMLElement {
    const notificationElement = this.domManager.createElement('div');
    this.domManager.setTextContent(notificationElement, text);
    return notificationElement;
  }

  /**
   * 通知の基本スタイルを適用
   */
  private applyNotificationBaseStyles(element: HTMLElement): void {
    this.domManager.setStyle(element, 'position', 'fixed');
    this.domManager.setStyle(element, 'top', '20px');
    this.domManager.setStyle(element, 'right', '20px');
    this.domManager.setStyle(element, 'zIndex', '2000');
    this.domManager.setStyle(element, 'padding', '15px 20px');
    this.domManager.setStyle(element, 'borderRadius', '8px');
    this.domManager.setStyle(element, 'color', '#ffffff');
    this.domManager.setStyle(element, 'fontSize', '16px');
    this.domManager.setStyle(element, 'fontWeight', 'bold');
    this.domManager.setStyle(element, 'maxWidth', '300px');
    this.domManager.setStyle(element, 'wordWrap', 'break-word');
  }

  /**
   * 通知タイプ別のスタイルを適用
   */
  private applyNotificationTypeStyles(
    element: HTMLElement,
    type: 'info' | 'success' | 'warning'
  ): void {
    switch (type) {
      case 'success':
        this.domManager.setStyle(
          element,
          'backgroundColor',
          'rgba(0, 150, 0, 0.9)'
        );
        this.domManager.setStyle(element, 'border', '2px solid #00ff00');
        break;
      case 'warning':
        this.domManager.setStyle(
          element,
          'backgroundColor',
          'rgba(255, 150, 0, 0.9)'
        );
        this.domManager.setStyle(element, 'border', '2px solid #ffaa00');
        break;
      default: // 'info'
        this.domManager.setStyle(
          element,
          'backgroundColor',
          'rgba(0, 100, 200, 0.9)'
        );
        this.domManager.setStyle(element, 'border', '2px solid #0080ff');
        break;
    }
  }

  /**
   * 通知のアニメーション設定
   */
  private setupNotificationAnimation(element: HTMLElement): void {
    this.domManager.setStyle(element, 'opacity', '0');
    this.domManager.setStyle(element, 'transform', 'translateX(100%)');
    this.domManager.setStyle(element, 'transition', 'all 0.3s ease-out');
  }

  /**
   * 通知を表示してアニメーション実行
   */
  private displayAndAnimateNotification(
    element: HTMLElement,
    duration: number
  ): void {
    const body = this.domManager.getBody();
    this.domManager.appendChild(body, element);

    // スライドイン効果
    this.timeProvider.setTimeout(() => {
      this.domManager.setStyle(element, 'opacity', '1');
      this.domManager.setStyle(element, 'transform', 'translateX(0)');
    }, 50);

    // スライドアウトして削除
    this.timeProvider.setTimeout(() => {
      this.animateNotificationOut(element, body);
    }, duration - 300);
  }

  /**
   * 通知のスライドアウトアニメーション
   */
  private animateNotificationOut(
    element: HTMLElement,
    body: HTMLElement
  ): void {
    this.domManager.setStyle(element, 'transition', 'all 0.3s ease-in');
    this.domManager.setStyle(element, 'opacity', '0');
    this.domManager.setStyle(element, 'transform', 'translateX(100%)');

    this.timeProvider.setTimeout(() => {
      if (this.domManager.contains(body, element)) {
        this.domManager.removeChild(body, element);
      }
    }, 300);
  }

  public showWaveMessage(text: string, duration: number = 1500): void {
    const waveElement = this.createWaveElement(text);
    this.setupWaveMessageStyling(waveElement);
    this.displayWaveMessage(waveElement, duration);
  }

  private createWaveElement(text: string): HTMLElement {
    const waveElement = this.domManager.createElement('div');
    this.domManager.setTextContent(waveElement, text);
    return waveElement;
  }

  private setupWaveMessageStyling(waveElement: HTMLElement): void {
    this.setupWaveMessageLayout(waveElement);
    this.setupWaveMessageAppearance(waveElement);
    this.setupWaveMessageAnimation(waveElement);
  }

  private setupWaveMessageLayout(waveElement: HTMLElement): void {
    this.domManager.setStyle(waveElement, 'position', 'absolute');
    this.domManager.setStyle(waveElement, 'top', '10px');
    this.domManager.setStyle(waveElement, 'right', '10px');
    this.domManager.setStyle(waveElement, 'zIndex', '800');
    this.domManager.setStyle(waveElement, 'textAlign', 'right');
    this.domManager.setStyle(waveElement, 'width', '200px');
    this.domManager.setStyle(waveElement, 'pointerEvents', 'none');
  }

  private setupWaveMessageAppearance(waveElement: HTMLElement): void {
    // フォントスタイリング
    this.domManager.setStyle(waveElement, 'color', '#ffffff');
    this.domManager.setStyle(waveElement, 'fontSize', '18px');
    this.domManager.setStyle(waveElement, 'fontWeight', '600');
    this.domManager.setStyle(waveElement, 'fontFamily', 'Arial, sans-serif');

    // テキストエフェクト
    this.domManager.setStyle(
      waveElement,
      'textShadow',
      '0 0 8px rgba(0, 255, 255, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.7)'
    );

    // 背景スタイリング
    this.domManager.setStyle(
      waveElement,
      'backgroundColor',
      'rgba(0, 20, 40, 0.75)'
    );
    this.domManager.setStyle(waveElement, 'padding', '12px 16px');
    this.domManager.setStyle(waveElement, 'borderRadius', '8px');
    this.domManager.setStyle(
      waveElement,
      'border',
      '1px solid rgba(0, 255, 255, 0.6)'
    );
    this.domManager.setStyle(
      waveElement,
      'boxShadow',
      '0 2px 8px rgba(0, 255, 255, 0.3)'
    );
  }

  private setupWaveMessageAnimation(waveElement: HTMLElement): void {
    this.domManager.setStyle(waveElement, 'opacity', '0');
    this.domManager.setStyle(waveElement, 'transform', 'translateX(100%)');
    this.domManager.setStyle(waveElement, 'transition', 'all 0.3s ease-out');
  }

  private displayWaveMessage(waveElement: HTMLElement, duration: number): void {
    const body = this.domManager.getBody();
    this.domManager.appendChild(body, waveElement);

    // スライドイン効果
    this.timeProvider.setTimeout(() => {
      this.domManager.setStyle(waveElement, 'opacity', '1');
      this.domManager.setStyle(waveElement, 'transform', 'translateX(0)');
    }, 50);

    // スライドアウトして削除
    this.timeProvider.setTimeout(() => {
      this.animateWaveMessageOut(waveElement, body);
    }, duration - 300);
  }

  private animateWaveMessageOut(
    waveElement: HTMLElement,
    body: HTMLElement
  ): void {
    this.domManager.setStyle(waveElement, 'transition', 'all 0.3s ease-in');
    this.domManager.setStyle(waveElement, 'opacity', '0');
    this.domManager.setStyle(waveElement, 'transform', 'translateX(100%)');

    this.timeProvider.setTimeout(() => {
      if (this.domManager.contains(body, waveElement)) {
        this.domManager.removeChild(body, waveElement);
      }
    }, 300);
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

  /**
   * 重要度と設定に基づいてメッセージを表示するかどうかを判定
   */
  private shouldShowMessage(priority: MessagePriority): boolean {
    const priorityLevels: Record<MessagePriority, number> = {
      critical: 4,
      important: 3,
      info: 2,
      minimal: 1,
    };

    return (
      priorityLevels[priority] >= priorityLevels[this.settings.minPriority]
    );
  }

  public dispose(): void {
    this.hideMessage();
  }
}
