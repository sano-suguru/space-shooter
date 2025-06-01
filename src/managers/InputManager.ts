import { IInputManager } from "../interfaces/IInputManager";

/**
 * 本番環境用の入力管理クラス
 * DOM イベントを使用してキーボードとマウスの入力を処理
 */
export class InputManager implements IInputManager {
  private keys = new Set<string>();
  private mouseButtons = new Set<number>();
  private mousePosition = { x: 0, y: 0 };
  
  // イベントコールバック
  private keyDownCallbacks: ((key: string) => void)[] = [];
  private keyUpCallbacks: ((key: string) => void)[] = [];
  private mouseDownCallbacks: ((button: number, x: number, y: number) => void)[] = [];
  private mouseUpCallbacks: ((button: number, x: number, y: number) => void)[] = [];
  private mouseMoveCallbacks: ((x: number, y: number) => void)[] = [];
  
  // バインドされたイベントハンドラー（removeEventListenerのため）
  private boundHandlers: {
    keyDown: (event: KeyboardEvent) => void;
    keyUp: (event: KeyboardEvent) => void;
    mouseDown: (event: MouseEvent) => void;
    mouseUp: (event: MouseEvent) => void;
    mouseMove: (event: MouseEvent) => void;
    contextMenu: (event: Event) => void;
  };

  constructor(private canvas: HTMLCanvasElement) {
    this.boundHandlers = {
      keyDown: this.handleKeyDown.bind(this),
      keyUp: this.handleKeyUp.bind(this),
      mouseDown: this.handleMouseDown.bind(this),
      mouseUp: this.handleMouseUp.bind(this),
      mouseMove: this.handleMouseMove.bind(this),
      contextMenu: this.handleContextMenu.bind(this)
    };
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // キーボードイベント（documentで全体をキャプチャ）
    document.addEventListener('keydown', this.boundHandlers.keyDown);
    document.addEventListener('keyup', this.boundHandlers.keyUp);
    
    // マウスイベント（canvasに限定）
    this.canvas.addEventListener('mousedown', this.boundHandlers.mouseDown);
    this.canvas.addEventListener('mouseup', this.boundHandlers.mouseUp);
    this.canvas.addEventListener('mousemove', this.boundHandlers.mouseMove);
    this.canvas.addEventListener('contextmenu', this.boundHandlers.contextMenu);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key;
    
    // ゲーム関連キーのデフォルト動作を防ぐ
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key)) {
      event.preventDefault();
    }
    
    if (!this.keys.has(key)) {
      this.keys.add(key);
      this.keyDownCallbacks.forEach(callback => callback(key));
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.key;
    
    if (this.keys.has(key)) {
      this.keys.delete(key);
      this.keyUpCallbacks.forEach(callback => callback(key));
    }
  }

  private handleMouseDown(event: MouseEvent): void {
    const button = event.button;
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.mouseButtons.add(button);
    this.mouseDownCallbacks.forEach(callback => callback(button, x, y));
  }

  private handleMouseUp(event: MouseEvent): void {
    const button = event.button;
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.mouseButtons.delete(button);
    this.mouseUpCallbacks.forEach(callback => callback(button, x, y));
  }

  private handleMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.mousePosition = { x, y };
    this.mouseMoveCallbacks.forEach(callback => callback(x, y));
  }

  private handleContextMenu(event: Event): void {
    // 右クリックメニューを無効化
    event.preventDefault();
  }

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
    // イベントリスナーを削除
    document.removeEventListener('keydown', this.boundHandlers.keyDown);
    document.removeEventListener('keyup', this.boundHandlers.keyUp);
    
    this.canvas.removeEventListener('mousedown', this.boundHandlers.mouseDown);
    this.canvas.removeEventListener('mouseup', this.boundHandlers.mouseUp);
    this.canvas.removeEventListener('mousemove', this.boundHandlers.mouseMove);
    this.canvas.removeEventListener('contextmenu', this.boundHandlers.contextMenu);
    
    // 内部状態をクリア
    this.keys.clear();
    this.mouseButtons.clear();
    this.keyDownCallbacks = [];
    this.keyUpCallbacks = [];
    this.mouseDownCallbacks = [];
    this.mouseUpCallbacks = [];
    this.mouseMoveCallbacks = [];
  }
}
