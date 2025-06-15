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
 * 仮想ジョイスティッククラス
 */
class VirtualJoystick {
  private centerX: number;
  private centerY: number;
  private knobX: number;
  private knobY: number;
  private readonly maxDistance: number = 50;
  private element!: HTMLElement;
  private knobElement!: HTMLElement;

  constructor(x: number, y: number) {
    this.centerX = x;
    this.centerY = y;
    this.knobX = x;
    this.knobY = y;
    this.createElement();
  }

  private createElement(): void {
    // ジョイスティック本体
    this.element = document.createElement('div');
    this.element.className = 'virtual-joystick';
    this.element.style.cssText = `
      position: absolute;
      width: 120px;
      height: 120px;
      background: radial-gradient(circle, rgba(0,255,170,0.3), rgba(0,255,170,0.1));
      border: 2px solid rgba(0,255,170,0.6);
      border-radius: 50%;
      backdrop-filter: blur(5px);
      pointer-events: none;
      z-index: 1000;
      transform: translate(-50%, -50%);
      left: ${this.centerX}px;
      top: ${this.centerY}px;
    `;

    // ジョイスティックノブ
    this.knobElement = document.createElement('div');
    this.knobElement.className = 'joystick-knob';
    this.knobElement.style.cssText = `
      position: absolute;
      width: 40px;
      height: 40px;
      background: rgba(0,255,170,0.8);
      border-radius: 50%;
      box-shadow: 0 0 15px rgba(0,255,170,0.5);
      transform: translate(-50%, -50%);
      left: 50%;
      top: 50%;
      transition: all 0.1s ease;
    `;

    this.element.appendChild(this.knobElement);
    document.body.appendChild(this.element);
  }

  public updateKnobPosition(x: number, y: number): Vector2D {
    const deltaX = x - this.centerX;
    const deltaY = y - this.centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance <= this.maxDistance) {
      this.knobX = x;
      this.knobY = y;
    } else {
      // 最大距離で制限
      const angle = Math.atan2(deltaY, deltaX);
      this.knobX = this.centerX + Math.cos(angle) * this.maxDistance;
      this.knobY = this.centerY + Math.sin(angle) * this.maxDistance;
    }

    // ノブの位置を更新
    const knobOffsetX = this.knobX - this.centerX;
    const knobOffsetY = this.knobY - this.centerY;
    this.knobElement.style.left = `${50 + (knobOffsetX / 60) * 50}%`;
    this.knobElement.style.top = `${50 + (knobOffsetY / 60) * 50}%`;

    return this.getMovementVector();
  }

  private getMovementVector(): Vector2D {
    const deltaX = this.knobX - this.centerX;
    const deltaY = this.knobY - this.centerY;
    return {
      x: deltaX / this.maxDistance, // -1 to 1
      y: deltaY / this.maxDistance, // -1 to 1
    };
  }

  public getPosition(): Vector2D {
    return { x: this.centerX, y: this.centerY };
  }

  public destroy(): void {
    if (this.element?.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  public reset(x: number, y: number): void {
    this.centerX = x;
    this.centerY = y;
    this.knobX = x;
    this.knobY = y;
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
    this.knobElement.style.left = '50%';
    this.knobElement.style.top = '50%';
  }

  public hide(): void {
    this.element.style.display = 'none';
  }

  public show(): void {
    this.element.style.display = 'block';
  }
}

/**
 * タッチ入力管理クラス
 * IInputManagerインターフェースを実装し、タッチイベントをキーボード・マウスイベントに変換
 */
export class TouchInputManager implements IInputManager {
  private touchState = new Map<number, TouchPoint>();
  private virtualJoystick: VirtualJoystick | null = null;
  private currentMovement: Vector2D = { x: 0, y: 0 };
  private simulatedKeys = new Set<string>();
  private simulatedMouseButtons = new Set<number>();
  private mousePosition: Vector2D = { x: 0, y: 0 };

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

      // 画面下部エリア（Canvas外）でのタッチをジョイスティックとして扱う
      const canvasRect = this.canvas.getBoundingClientRect();
      const isInControllerArea = touch.clientY > canvasRect.bottom;

      if (isInControllerArea && !this.virtualJoystick) {
        // 仮想ジョイスティックを作成
        this.virtualJoystick = new VirtualJoystick(
          touch.clientX,
          touch.clientY
        );
        touchPoint.isJoystick = true;

        // ゲーム開始のためにスペースキーをシミュレート
        this.simulateKeyDown(' ');
        setTimeout(() => this.simulateKeyUp(' '), 100);

        // 触覚フィードバック
        this.vibrate(10);
      } else {
        // キャンバス内のタッチでもゲーム開始をサポート
        const isInCanvasArea =
          touch.clientX >= canvasRect.left &&
          touch.clientX <= canvasRect.right &&
          touch.clientY >= canvasRect.top &&
          touch.clientY <= canvasRect.bottom;

        if (isInCanvasArea) {
          // ゲーム開始のためにスペースキーをシミュレート
          this.simulateKeyDown(' ');
          setTimeout(() => this.simulateKeyUp(' '), 100);
        }
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

      if (touchPoint.isJoystick && this.virtualJoystick) {
        // ジョイスティックの移動ベクトルを更新
        const movement = this.virtualJoystick.updateKnobPosition(
          touch.clientX,
          touch.clientY
        );
        this.updateMovement(movement);
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchPoint = this.touchState.get(touch.identifier);

      if (touchPoint?.isJoystick && this.virtualJoystick) {
        // ジョイスティックを削除
        this.virtualJoystick.destroy();
        this.virtualJoystick = null;
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

    // マウス位置の更新（ジョイスティック位置）
    if (this.virtualJoystick) {
      this.mousePosition = this.virtualJoystick.getPosition();
      this.mouseMoveCallbacks.forEach(callback =>
        callback(this.mousePosition.x, this.mousePosition.y)
      );
    }
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

    // 仮想ジョイスティックを削除
    if (this.virtualJoystick) {
      this.virtualJoystick.destroy();
      this.virtualJoystick = null;
    }

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
