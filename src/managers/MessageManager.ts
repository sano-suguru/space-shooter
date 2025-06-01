import { IMessageManager } from "../interfaces/IMessageManager";
import { IDOMManager } from "../interfaces/IDOMManager";
import { ITimeProvider } from "../providers/ITimeProvider";

/**
 * 本番環境用のメッセージ管理クラス
 * DOMManagerとTimeProviderを使用してUI表示を管理
 */
export class MessageManager implements IMessageManager {
  private currentMessageElement: HTMLElement | null = null;
  private currentTimeoutId: number | null = null;

  constructor(
    private domManager: IDOMManager,
    private timeProvider: ITimeProvider
  ) {}

  public showMessage(text: string, duration: number = 3000): void {
    // 既存のメッセージがあれば削除
    this.hideMessage();

    const messageElement = this.domManager.createElement('div');
    this.domManager.setTextContent(messageElement, text);

    // 基本的な位置設定
    this.domManager.setStyle(messageElement, 'position', 'absolute');
    this.domManager.setStyle(messageElement, 'top', '50%');
    this.domManager.setStyle(messageElement, 'left', '50%');
    this.domManager.setStyle(messageElement, 'transform', 'translate(-50%, -50%)');
    this.domManager.setStyle(messageElement, 'textAlign', 'center');
    this.domManager.setStyle(messageElement, 'zIndex', '1000');

    // フォントスタイリング
    this.domManager.setStyle(messageElement, 'color', '#ffffff');
    this.domManager.setStyle(messageElement, 'fontSize', '32px');
    this.domManager.setStyle(messageElement, 'fontWeight', 'bold');
    this.domManager.setStyle(messageElement, 'fontFamily', 'Arial, sans-serif');

    // テキストエフェクト（視認性向上）
    this.domManager.setStyle(messageElement, 'textShadow', `
      0 0 10px #00ffff,
      0 0 20px #00ffff,
      0 0 30px #00ffff,
      2px 2px 4px rgba(0, 0, 0, 0.8)
    `);

    // 背景スタイリング
    this.domManager.setStyle(messageElement, 'backgroundColor', 'rgba(0, 20, 40, 0.9)');
    this.domManager.setStyle(messageElement, 'padding', '20px 40px');
    this.domManager.setStyle(messageElement, 'borderRadius', '15px');
    this.domManager.setStyle(messageElement, 'border', '2px solid #00ffff');
    this.domManager.setStyle(messageElement, 'boxShadow', `
      0 0 20px rgba(0, 255, 255, 0.5),
      inset 0 0 20px rgba(0, 255, 255, 0.1)
    `);

    // アニメーション設定
    this.domManager.setStyle(messageElement, 'opacity', '0');
    this.domManager.setStyle(messageElement, 'transform', 'translate(-50%, -50%) scale(0.5)');
    this.domManager.setStyle(messageElement, 'transition', 'all 0.3s ease-out');

    const body = this.domManager.getBody();
    this.domManager.appendChild(body, messageElement);
    this.currentMessageElement = messageElement;

    // フェードイン効果（requestAnimationFrameの代替）
    this.timeProvider.setTimeout(() => {
      this.domManager.setStyle(messageElement, 'opacity', '1');
      this.domManager.setStyle(messageElement, 'transform', 'translate(-50%, -50%) scale(1)');
    }, 50);

    // フェードアウトして削除
    this.currentTimeoutId = this.timeProvider.setTimeout(() => {
      this.domManager.setStyle(messageElement, 'transition', 'all 0.5s ease-in');
      this.domManager.setStyle(messageElement, 'opacity', '0');
      this.domManager.setStyle(messageElement, 'transform', 'translate(-50%, -50%) scale(0.8)');

      this.timeProvider.setTimeout(() => {
        if (this.currentMessageElement === messageElement && this.domManager.contains(body, messageElement)) {
          this.domManager.removeChild(body, messageElement);
          this.currentMessageElement = null;
        }
      }, 500);
    }, duration - 500);
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

  public showNotification(text: string, type: 'info' | 'success' | 'warning' = 'info', duration: number = 2000): void {
    const notificationElement = this.domManager.createElement('div');
    this.domManager.setTextContent(notificationElement, text);

    // 通知の基本スタイル
    this.domManager.setStyle(notificationElement, 'position', 'fixed');
    this.domManager.setStyle(notificationElement, 'top', '20px');
    this.domManager.setStyle(notificationElement, 'right', '20px');
    this.domManager.setStyle(notificationElement, 'zIndex', '2000');
    this.domManager.setStyle(notificationElement, 'padding', '15px 20px');
    this.domManager.setStyle(notificationElement, 'borderRadius', '8px');
    this.domManager.setStyle(notificationElement, 'color', '#ffffff');
    this.domManager.setStyle(notificationElement, 'fontSize', '16px');
    this.domManager.setStyle(notificationElement, 'fontWeight', 'bold');
    this.domManager.setStyle(notificationElement, 'maxWidth', '300px');
    this.domManager.setStyle(notificationElement, 'wordWrap', 'break-word');

    // タイプ別の色設定
    switch (type) {
      case 'success':
        this.domManager.setStyle(notificationElement, 'backgroundColor', 'rgba(0, 150, 0, 0.9)');
        this.domManager.setStyle(notificationElement, 'border', '2px solid #00ff00');
        break;
      case 'warning':
        this.domManager.setStyle(notificationElement, 'backgroundColor', 'rgba(255, 150, 0, 0.9)');
        this.domManager.setStyle(notificationElement, 'border', '2px solid #ffaa00');
        break;
      default: // 'info'
        this.domManager.setStyle(notificationElement, 'backgroundColor', 'rgba(0, 100, 200, 0.9)');
        this.domManager.setStyle(notificationElement, 'border', '2px solid #0080ff');
        break;
    }

    // アニメーション設定
    this.domManager.setStyle(notificationElement, 'opacity', '0');
    this.domManager.setStyle(notificationElement, 'transform', 'translateX(100%)');
    this.domManager.setStyle(notificationElement, 'transition', 'all 0.3s ease-out');

    const body = this.domManager.getBody();
    this.domManager.appendChild(body, notificationElement);

    // スライドイン効果
    this.timeProvider.setTimeout(() => {
      this.domManager.setStyle(notificationElement, 'opacity', '1');
      this.domManager.setStyle(notificationElement, 'transform', 'translateX(0)');
    }, 50);

    // スライドアウトして削除
    this.timeProvider.setTimeout(() => {
      this.domManager.setStyle(notificationElement, 'transition', 'all 0.3s ease-in');
      this.domManager.setStyle(notificationElement, 'opacity', '0');
      this.domManager.setStyle(notificationElement, 'transform', 'translateX(100%)');

      this.timeProvider.setTimeout(() => {
        if (this.domManager.contains(body, notificationElement)) {
          this.domManager.removeChild(body, notificationElement);
        }
      }, 300);
    }, duration - 300);
  }

  public dispose(): void {
    this.hideMessage();
  }
}
