import { IInputManager } from "../interfaces/IInputManager";

/**
 * テスト用の入力管理クラス
 * 決定論的なテストを可能にするため、手動でキーやマウスの状態を制御
 */
export class MockInputManager implements IInputManager {
  private keys = new Set<string>();
  private mouseButtons = new Set<number>();
  private mousePosition = { x: 0, y: 0 };
  
  // イベントコールバック
  private keyDownCallbacks: ((key: string) => void)[] = [];
  private keyUpCallbacks: ((key: string) => void)[] = [];
  private mouseDownCallbacks: ((button: number, x: number, y: number) => void)[] = [];
  private mouseUpCallbacks: ((button: number, x: number, y: number) => void)[] = [];
  private mouseMoveCallbacks: ((x: number, y: number) => void)[] = [];

  // IInputManager interface implementation
  
  public isKeyPressed(key: string): boolean {
    return this.keys.has(key);
  }

  public getMousePosition(): { x: number; y: number } {
    return { ...this.mousePosition };
  }

  public isMouseButtonPressed(button: number): boolean {
    return this.mouseButtons.has(button);
  }

  public onKeyDown(callback: (key: string) => void): void {
    this.keyDownCallbacks.push(callback);
  }

  public onKeyUp(callback: (key: string) => void): void {
    this.keyUpCallbacks.push(callback);
  }

  public onMouseDown(callback: (button: number, x: number, y: number) => void): void {
    this.mouseDownCallbacks.push(callback);
  }

  public onMouseUp(callback: (button: number, x: number, y: number) => void): void {
    this.mouseUpCallbacks.push(callback);
  }

  public onMouseMove(callback: (x: number, y: number) => void): void {
    this.mouseMoveCallbacks.push(callback);
  }

  public dispose(): void {
    // 内部状態をクリア
    this.keys.clear();
    this.mouseButtons.clear();
    this.keyDownCallbacks = [];
    this.keyUpCallbacks = [];
    this.mouseDownCallbacks = [];
    this.mouseUpCallbacks = [];
    this.mouseMoveCallbacks = [];
  }

  // テスト用のコントロールメソッド

  /**
   * キーの押下をシミュレート
   */
  public simulateKeyDown(key: string): void {
    if (!this.keys.has(key)) {
      this.keys.add(key);
      this.keyDownCallbacks.forEach(callback => callback(key));
    }
  }

  /**
   * キーの離すをシミュレート
   */
  public simulateKeyUp(key: string): void {
    if (this.keys.has(key)) {
      this.keys.delete(key);
      this.keyUpCallbacks.forEach(callback => callback(key));
    }
  }

  /**
   * キーを押す（同時にdownとupイベントをトリガー）
   */
  public simulateKeyPress(key: string): void {
    this.simulateKeyDown(key);
    this.simulateKeyUp(key);
  }

  /**
   * 複数のキーを同時に押下
   */
  public simulateMultipleKeysDown(keys: string[]): void {
    keys.forEach(key => this.simulateKeyDown(key));
  }

  /**
   * 複数のキーを同時に離す
   */
  public simulateMultipleKeysUp(keys: string[]): void {
    keys.forEach(key => this.simulateKeyUp(key));
  }

  /**
   * マウスボタンの押下をシミュレート
   */
  public simulateMouseDown(button: number, x: number, y: number): void {
    this.mouseButtons.add(button);
    this.mousePosition = { x, y };
    this.mouseDownCallbacks.forEach(callback => callback(button, x, y));
  }

  /**
   * マウスボタンの離すをシミュレート
   */
  public simulateMouseUp(button: number, x: number, y: number): void {
    this.mouseButtons.delete(button);
    this.mousePosition = { x, y };
    this.mouseUpCallbacks.forEach(callback => callback(button, x, y));
  }

  /**
   * マウスクリックをシミュレート（downとupの組み合わせ）
   */
  public simulateMouseClick(button: number, x: number, y: number): void {
    this.simulateMouseDown(button, x, y);
    this.simulateMouseUp(button, x, y);
  }

  /**
   * マウス移動をシミュレート
   */
  public simulateMouseMove(x: number, y: number): void {
    this.mousePosition = { x, y };
    this.mouseMoveCallbacks.forEach(callback => callback(x, y));
  }

  /**
   * マウス位置を設定（イベントなし）
   */
  public setMousePosition(x: number, y: number): void {
    this.mousePosition = { x, y };
  }

  /**
   * すべてのキーをクリア
   */
  public clearAllKeys(): void {
    const pressedKeys = Array.from(this.keys);
    pressedKeys.forEach(key => this.simulateKeyUp(key));
  }

  /**
   * すべてのマウスボタンをクリア
   */
  public clearAllMouseButtons(): void {
    const pressedButtons = Array.from(this.mouseButtons);
    pressedButtons.forEach(button => this.simulateMouseUp(button, this.mousePosition.x, this.mousePosition.y));
  }

  /**
   * 入力状態を完全にリセット
   */
  public reset(): void {
    this.clearAllKeys();
    this.clearAllMouseButtons();
    this.mousePosition = { x: 0, y: 0 };
  }

  /**
   * 現在押されているキーの一覧を取得（テスト用）
   */
  public getPressedKeys(): string[] {
    return Array.from(this.keys);
  }

  /**
   * 現在押されているマウスボタンの一覧を取得（テスト用）
   */
  public getPressedMouseButtons(): number[] {
    return Array.from(this.mouseButtons);
  }
}
