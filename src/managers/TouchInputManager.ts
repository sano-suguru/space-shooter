import { IInputManager } from '../interfaces/IInputManager';
import { Vector2D } from '../types';
import { HapticFeedback } from '../utils/HapticFeedback';

/**
 * タッチポイント情報
 */
interface TouchPoint {
  id: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isJoystick: boolean;
}

/**
 * タッチ入力管理クラス
 * IInputManagerインターフェースを実装し、タッチイベントをキーボード・マウスイベントに変換
 * React版のVirtualJoystickコンポーネントと連携
 */
export class TouchInputManager implements IInputManager {
  private touchState = new Map<number, TouchPoint>();
  private currentMovement: Vector2D = { x: 0, y: 0 };
  private simulatedKeys = new Set<string>();
  private simulatedMouseButtons = new Set<number>();
  private mousePosition: Vector2D = { x: 0, y: 0 };
  private isJoystickActive = false;

  // イベントコールバック
  private keyDownCallbacks: ((key: string) => void)[] = [];
  private keyUpCallbacks: ((key: string) => void)[] = [];
  private mouseDownCallbacks: ((
    button: number,
    x: number,
    y: number
  ) => void)[] = [];
  private mouseUpCallbacks: ((button: number, x: number, y: number) => void)[] =
    [];
  private mouseMoveCallbacks: ((x: number, y: number) => void)[] = [];

  // バインドされたイベントハンドラー
  private boundHandlers: {
    touchStart: (event: TouchEvent) => void;
    touchMove: (event: TouchEvent) => void;
    touchEnd: (event: TouchEvent) => void;
    touchCancel: (event: TouchEvent) => void;
  };

  // タッチイベント最適化
  private lastTouchTime = 0;
  private readonly THROTTLE_MS = 16; // 60FPS
  private readonly DEAD_ZONE = 0.1; // デッドゾーン（10%）

  constructor(private canvas: HTMLCanvasElement) {
    this.boundHandlers = {
      touchStart: this.handleTouchStart.bind(this),
      touchMove: this.throttledTouchMove.bind(this),
      touchEnd: this.handleTouchEnd.bind(this),
      touchCancel: this.handleTouchCancel.bind(this),
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // タッチイベントをdocumentで全体をキャプチャ
    document.addEventListener('touchstart', this.boundHandlers.touchStart, {
      passive: false,
    });
    document.addEventListener('touchmove', this.boundHandlers.touchMove, {
      passive: false,
    });
    document.addEventListener('touchend', this.boundHandlers.touchEnd, {
      passive: false,
    });
    document.addEventListener('touchcancel', this.boundHandlers.touchCancel, {
      passive: false,
    });
  }

  private throttledTouchMove(event: TouchEvent): void {
    const now = performance.now();
    if (now - this.lastTouchTime >= this.THROTTLE_MS) {
      this.handleTouchMove(event);
      this.lastTouchTime = now;
    }
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchPoint: TouchPoint = {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        isJoystick: false,
      };

      // キャンバス内のタッチでゲーム開始をサポート
      const canvasRect = this.canvas.getBoundingClientRect();
      const isInCanvasArea =
        touch.clientX >= canvasRect.left &&
        touch.clientX <= canvasRect.right &&
        touch.clientY >= canvasRect.top &&
        touch.clientY <= canvasRect.bottom;

      if (isInCanvasArea) {
        // ゲーム開始のためにスペースキーをシミュレート
        this.simulateKeyDown(' ');
        setTimeout(() => this.simulateKeyUp(' '), 100);

        // 触覚フィードバック
        this.vibrate(10);
      }

      this.touchState.set(touch.identifier, touchPoint);
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchPoint = this.touchState.get(touch.identifier);

      if (!touchPoint) continue;

      touchPoint.currentX = touch.clientX;
      touchPoint.currentY = touch.clientY;

      // React版のVirtualJoystickからの移動情報は
      // MobileUIManagerを通じてイベントとして受信される
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchPoint = this.touchState.get(touch.identifier);

      if (touchPoint?.isJoystick) {
        this.isJoystickActive = false;
        this.updateMovement({ x: 0, y: 0 });

        // 触覚フィードバック
        this.vibrate(5);
      }

      this.touchState.delete(touch.identifier);
    }
  }

  private handleTouchCancel(event: TouchEvent): void {
    // touchendと同じ処理
    this.handleTouchEnd(event);
  }

  /**
   * React版VirtualJoystickからの移動情報を受信
   */
  public handleJoystickMovement(movement: Vector2D): void {
    this.isJoystickActive = true;
    this.updateMovement(movement);
  }

  /**
   * React版VirtualJoystickの開始を処理
   */
  public handleJoystickStart(): void {
    this.isJoystickActive = true;
    // ゲーム開始のためにスペースキーをシミュレート
    this.simulateKeyDown(' ');
    setTimeout(() => this.simulateKeyUp(' '), 100);
  }

  /**
   * React版VirtualJoystickの終了を処理
   */
  public handleJoystickEnd(): void {
    this.isJoystickActive = false;
    this.updateMovement({ x: 0, y: 0 });
  }

  private updateMovement(movement: Vector2D): void {
    const prevMovement = { ...this.currentMovement };
    this.currentMovement = movement;

    // デッドゾーン適用
    if (Math.abs(this.currentMovement.x) < this.DEAD_ZONE) {
      this.currentMovement.x = 0;
    }
    if (Math.abs(this.currentMovement.y) < this.DEAD_ZONE) {
      this.currentMovement.y = 0;
    }

    // キー状態の更新
    this.updateKeyStates(prevMovement, this.currentMovement);

    // マウス位置の更新（画面中央を基準）
    this.mousePosition = {
      x: this.canvas.width / 2 + this.currentMovement.x * 100,
      y: this.canvas.height / 2 + this.currentMovement.y * 100,
    };

    this.mouseMoveCallbacks.forEach(callback =>
      callback(this.mousePosition.x, this.mousePosition.y)
    );
  }

  private updateKeyStates(
    prevMovement: Vector2D,
    currentMovement: Vector2D
  ): void {
    this.updateXAxisKeys(prevMovement.x, currentMovement.x);
    this.updateYAxisKeys(prevMovement.y, currentMovement.y);
  }

  private updateXAxisKeys(prevX: number, currentX: number): void {
    if (prevX <= 0 && currentX > 0) {
      this.simulateKeyDown('ArrowRight');
    } else if (prevX >= 0 && currentX < 0) {
      this.simulateKeyDown('ArrowLeft');
    }

    if (prevX > 0 && currentX <= 0) {
      this.simulateKeyUp('ArrowRight');
    } else if (prevX < 0 && currentX >= 0) {
      this.simulateKeyUp('ArrowLeft');
    }
  }

  private updateYAxisKeys(prevY: number, currentY: number): void {
    if (prevY <= 0 && currentY > 0) {
      this.simulateKeyDown('ArrowDown');
    } else if (prevY >= 0 && currentY < 0) {
      this.simulateKeyDown('ArrowUp');
    }

    if (prevY > 0 && currentY <= 0) {
      this.simulateKeyUp('ArrowDown');
    } else if (prevY < 0 && currentY >= 0) {
      this.simulateKeyUp('ArrowUp');
    }
  }

  private simulateKeyDown(key: string): void {
    if (!this.simulatedKeys.has(key)) {
      this.simulatedKeys.add(key);
      this.keyDownCallbacks.forEach(callback => callback(key));
    }
  }

  private simulateKeyUp(key: string): void {
    if (this.simulatedKeys.has(key)) {
      this.simulatedKeys.delete(key);
      this.keyUpCallbacks.forEach(callback => callback(key));
    }
  }

  private vibrate(duration: number): void {
    HapticFeedback.vibrate(duration);
  }

  // IInputManager interface implementation

  public isKeyPressed(key: string): boolean {
    return this.simulatedKeys.has(key);
  }

  public getMousePosition(): { x: number; y: number } {
    return { ...this.mousePosition };
  }

  public isMouseButtonPressed(button: number): boolean {
    return this.simulatedMouseButtons.has(button);
  }

  public onKeyDown(callback: (key: string) => void): void {
    this.keyDownCallbacks.push(callback);
  }

  public onKeyUp(callback: (key: string) => void): void {
    this.keyUpCallbacks.push(callback);
  }

  public onMouseDown(
    callback: (button: number, x: number, y: number) => void
  ): void {
    this.mouseDownCallbacks.push(callback);
  }

  public onMouseUp(
    callback: (button: number, x: number, y: number) => void
  ): void {
    this.mouseUpCallbacks.push(callback);
  }

  public onMouseMove(callback: (x: number, y: number) => void): void {
    this.mouseMoveCallbacks.push(callback);
  }

  public dispose(): void {
    // イベントリスナーを削除
    document.removeEventListener('touchstart', this.boundHandlers.touchStart);
    document.removeEventListener('touchmove', this.boundHandlers.touchMove);
    document.removeEventListener('touchend', this.boundHandlers.touchEnd);
    document.removeEventListener('touchcancel', this.boundHandlers.touchCancel);

    // 内部状態をクリア
    this.touchState.clear();
    this.simulatedKeys.clear();
    this.simulatedMouseButtons.clear();
    this.keyDownCallbacks = [];
    this.keyUpCallbacks = [];
    this.mouseDownCallbacks = [];
    this.mouseUpCallbacks = [];
    this.mouseMoveCallbacks = [];
  }
}
