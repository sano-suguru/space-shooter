/**
 * 入力管理インターフェース
 * キーボードとマウスの入力を抽象化し、テスタビリティを向上させる
 */
export interface IInputManager {
  // キー入力関連
  isKeyPressed(key: string): boolean;

  // マウス入力関連
  getMousePosition(): { x: number; y: number };
  isMouseButtonPressed(button: number): boolean;

  // イベントハンドラー登録
  onKeyDown(callback: (key: string) => void): void;
  onKeyUp(callback: (key: string) => void): void;
  onMouseDown(callback: (button: number, x: number, y: number) => void): void;
  onMouseUp(callback: (button: number, x: number, y: number) => void): void;
  onMouseMove(callback: (x: number, y: number) => void): void;

  // リソース管理
  dispose(): void;
}
