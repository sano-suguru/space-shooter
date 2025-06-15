import { IInputManager } from '../interfaces/IInputManager';
import { InputManager } from '../managers/InputManager';
import { TouchInputManager } from '../managers/TouchInputManager';

/**
 * デバイス検出ユーティリティクラス
 * タッチデバイスかどうかを判定し、適切なInputManagerを提供する
 */
export class DeviceDetector {
  /**
   * タッチデバイスかどうかを判定
   */
  public static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * モバイルデバイスかどうかを判定（精度向上版）
   */
  public static isMobile(): boolean {
    // より包括的なモバイルデバイス判定
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = [
      'android',
      'webos',
      'iphone',
      'ipad',
      'ipod',
      'blackberry',
      'iemobile',
      'opera mini',
      'mobile',
      'tablet',
      'kindle',
      'silk',
      'gt-',
      'samsung',
      'nokia',
      'sony',
      'htc',
    ];

    // ユーザーエージェントベースの判定
    const isMobileUA = mobileKeywords.some(keyword =>
      userAgent.includes(keyword)
    );

    // タッチデバイス判定との組み合わせ
    const isTouchDevice = this.isTouchDevice();

    // 画面サイズベースの判定
    const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 768;

    // より正確な判定：タッチデバイスかつ小さい画面、またはモバイルUA
    return (isTouchDevice && isSmallScreen) || isMobileUA;
  }

  /**
   * デバイスに応じた適切なInputManagerを取得
   * @param canvas - ゲームキャンバス要素
   * @returns 適切なInputManagerインスタンス
   */
  public static getInputManager(canvas: HTMLCanvasElement): IInputManager {
    if (this.isTouchDevice()) {
      return new TouchInputManager(canvas);
    } else {
      return new InputManager(canvas);
    }
  }

  /**
   * 画面の向きを取得
   */
  public static getOrientation(): 'portrait' | 'landscape' {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  /**
   * 画面サイズカテゴリを取得
   */
  public static getScreenSizeCategory(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;

    if (width <= 480) {
      return 'mobile';
    } else if (width <= 768) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * デバイス情報を取得
   */
  public static getDeviceInfo(): {
    isTouchDevice: boolean;
    isMobile: boolean;
    orientation: 'portrait' | 'landscape';
    screenCategory: 'mobile' | 'tablet' | 'desktop';
    screenWidth: number;
    screenHeight: number;
  } {
    return {
      isTouchDevice: this.isTouchDevice(),
      isMobile: this.isMobile(),
      orientation: this.getOrientation(),
      screenCategory: this.getScreenSizeCategory(),
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
    };
  }
}
