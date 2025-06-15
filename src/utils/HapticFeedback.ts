/**
 * 触覚フィードバックユーティリティクラス
 * モバイルデバイスでの振動フィードバックを提供
 */
export class HapticFeedback {
  /**
   * 振動パターンを実行
   * @param pattern - 振動パターン（数値または数値配列）
   */
  public static vibrate(pattern: number | number[]): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * 軽いタップ振動
   */
  public static lightTap(): void {
    this.vibrate(10);
  }

  /**
   * 中程度のタップ振動
   */
  public static mediumTap(): void {
    this.vibrate(50);
  }

  /**
   * 強いタップ振動
   */
  public static strongTap(): void {
    this.vibrate(100);
  }

  /**
   * ダブルタップ振動
   */
  public static doubleTap(): void {
    this.vibrate([50, 50, 50]);
  }

  /**
   * 成功時の振動パターン
   */
  public static success(): void {
    this.vibrate([100, 50, 100]);
  }

  /**
   * エラー時の振動パターン
   */
  public static error(): void {
    this.vibrate([200, 100, 200, 100, 200]);
  }

  /**
   * 警告時の振動パターン
   */
  public static warning(): void {
    this.vibrate([150, 75, 150]);
  }

  /**
   * 振動を停止
   */
  public static stop(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }

  /**
   * 振動がサポートされているかチェック
   */
  public static isSupported(): boolean {
    return 'vibrate' in navigator;
  }

  /**
   * カスタム振動パターンを作成
   * @param vibrateDuration - 振動時間（ms）
   * @param pauseDuration - 休止時間（ms）
   * @param repeatCount - 繰り返し回数
   */
  public static customPattern(
    vibrateDuration: number,
    pauseDuration: number,
    repeatCount: number
  ): void {
    const pattern: number[] = [];
    for (let i = 0; i < repeatCount; i++) {
      pattern.push(vibrateDuration);
      if (i < repeatCount - 1) {
        pattern.push(pauseDuration);
      }
    }
    this.vibrate(pattern);
  }
}
