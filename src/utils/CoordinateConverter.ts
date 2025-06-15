import { Vector2D } from '../types';

/**
 * 座標変換ユーティリティクラス
 * タッチ座標をCanvas座標系に変換する
 */
export class CoordinateConverter {
  /**
   * タッチ座標をCanvas座標に変換
   * @param touch - タッチイベントオブジェクト
   * @param canvas - 対象のCanvas要素
   * @returns Canvas座標系での座標
   */
  public static touchToCanvas(
    touch: Touch,
    canvas: HTMLCanvasElement
  ): Vector2D {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  }

  /**
   * 画面座標をCanvas座標に変換
   * @param screenX - 画面X座標
   * @param screenY - 画面Y座標
   * @param canvas - 対象のCanvas要素
   * @returns Canvas座標系での座標
   */
  public static screenToCanvas(
    screenX: number,
    screenY: number,
    canvas: HTMLCanvasElement
  ): Vector2D {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (screenX - rect.left) * scaleX,
      y: (screenY - rect.top) * scaleY,
    };
  }

  /**
   * Canvas座標を画面座標に変換
   * @param canvasX - CanvasX座標
   * @param canvasY - CanvasY座標
   * @param canvas - 対象のCanvas要素
   * @returns 画面座標系での座標
   */
  public static canvasToScreen(
    canvasX: number,
    canvasY: number,
    canvas: HTMLCanvasElement
  ): Vector2D {
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;

    return {
      x: canvasX * scaleX + rect.left,
      y: canvasY * scaleY + rect.top,
    };
  }

  /**
   * 正規化座標（-1 to 1）をCanvas座標に変換
   * @param normalizedX - 正規化X座標（-1 to 1）
   * @param normalizedY - 正規化Y座標（-1 to 1）
   * @param canvas - 対象のCanvas要素
   * @returns Canvas座標系での座標
   */
  public static normalizedToCanvas(
    normalizedX: number,
    normalizedY: number,
    canvas: HTMLCanvasElement
  ): Vector2D {
    return {
      x: ((normalizedX + 1) / 2) * canvas.width,
      y: ((normalizedY + 1) / 2) * canvas.height,
    };
  }

  /**
   * Canvas座標を正規化座標（-1 to 1）に変換
   * @param canvasX - CanvasX座標
   * @param canvasY - CanvasY座標
   * @param canvas - 対象のCanvas要素
   * @returns 正規化座標（-1 to 1）
   */
  public static canvasToNormalized(
    canvasX: number,
    canvasY: number,
    canvas: HTMLCanvasElement
  ): Vector2D {
    return {
      x: (canvasX / canvas.width) * 2 - 1,
      y: (canvasY / canvas.height) * 2 - 1,
    };
  }
}
