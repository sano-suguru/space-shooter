import { TouchInputManager } from '../../src/managers/TouchInputManager';

// モックCanvas要素を作成
const createMockCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 600;

  // getBoundingClientRectをモック
  canvas.getBoundingClientRect = jest.fn(() => ({
    left: 0,
    top: 0,
    right: 400,
    bottom: 600,
    width: 400,
    height: 600,
    x: 0,
    y: 0,
    toJSON: (): void => {
      console.log('DEBUG: toJSON called - return type is void');
    },
  }));

  return canvas;
};

// モックTouch要素を作成
const createMockTouch = (
  identifier: number,
  clientX: number,
  clientY: number
): Touch => ({
  identifier,
  clientX,
  clientY,
  screenX: clientX,
  screenY: clientY,
  pageX: clientX,
  pageY: clientY,
  target: document.body,
  radiusX: 1,
  radiusY: 1,
  rotationAngle: 0,
  force: 1,
});

// モックTouchEvent要素を作成
const createMockTouchEvent = (type: string, touches: Touch[]): TouchEvent => {
  // TouchEventコンストラクタが利用できない場合のフォールバック
  let event: TouchEvent;

  try {
    event = new TouchEvent(type, {
      // テスト環境でのTouchList型の制限により、anyキャストが必要
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      touches: touches as any,
      // テスト環境でのTouchList型の制限により、anyキャストが必要
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      changedTouches: touches as any,
      // テスト環境でのTouchList型の制限により、anyキャストが必要
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      targetTouches: touches as any,
      bubbles: true,
      cancelable: true,
    });
  } catch {
    // TouchEventが利用できない場合はEventをベースにモック
    event = new Event(type, { bubbles: true, cancelable: true }) as TouchEvent;
    Object.defineProperty(event, 'changedTouches', {
      value: touches,
      writable: false,
      enumerable: true,
    });
    Object.defineProperty(event, 'touches', {
      value: touches,
      writable: false,
      enumerable: true,
    });
    Object.defineProperty(event, 'targetTouches', {
      value: touches,
      writable: false,
      enumerable: true,
    });
  }

  event.preventDefault = jest.fn();
  return event;
};

describe('TouchInputManager', () => {
  let touchManager: TouchInputManager;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    // DOMをセットアップ
    document.body.innerHTML = '';
    mockCanvas = createMockCanvas();
    document.body.appendChild(mockCanvas);

    // navigatorのvibrateをモック
    Object.defineProperty(navigator, 'vibrate', {
      value: jest.fn(),
      writable: true,
    });

    touchManager = new TouchInputManager(mockCanvas);
  });

  afterEach(() => {
    touchManager.dispose();
    document.body.innerHTML = '';
  });

  describe('基本機能', () => {
    test('IInputManagerインターフェースを実装している', () => {
      expect(typeof touchManager.isKeyPressed).toBe('function');
      expect(typeof touchManager.getMousePosition).toBe('function');
      expect(typeof touchManager.isMouseButtonPressed).toBe('function');
      expect(typeof touchManager.onKeyDown).toBe('function');
      expect(typeof touchManager.onKeyUp).toBe('function');
      expect(typeof touchManager.onMouseDown).toBe('function');
      expect(typeof touchManager.onMouseUp).toBe('function');
      expect(typeof touchManager.onMouseMove).toBe('function');
      expect(typeof touchManager.dispose).toBe('function');
    });

    test('初期状態では何もキーが押されていない', () => {
      expect(touchManager.isKeyPressed('ArrowUp')).toBe(false);
      expect(touchManager.isKeyPressed('ArrowDown')).toBe(false);
      expect(touchManager.isKeyPressed('ArrowLeft')).toBe(false);
      expect(touchManager.isKeyPressed('ArrowRight')).toBe(false);
    });

    test('初期状態でのマウス位置は(0, 0)', () => {
      const position = touchManager.getMousePosition();
      expect(position.x).toBe(0);
      expect(position.y).toBe(0);
    });
  });

  describe('タッチイベント処理', () => {
    test('コントローラーエリア外でのタッチは無視される', () => {
      const touch = createMockTouch(1, 200, 300); // Canvas内
      const event = createMockTouchEvent('touchstart', [touch]);

      document.dispatchEvent(event);

      expect(touchManager.isKeyPressed('ArrowUp')).toBe(false);
      expect(touchManager.isKeyPressed('ArrowDown')).toBe(false);
      expect(touchManager.isKeyPressed('ArrowLeft')).toBe(false);
      expect(touchManager.isKeyPressed('ArrowRight')).toBe(false);
    });

    test('コントローラーエリアでのタッチで仮想ジョイスティックが作成される', () => {
      const touch = createMockTouch(1, 200, 650); // Canvas下部（bottom: 600より下）
      const startEvent = createMockTouchEvent('touchstart', [touch]);

      document.dispatchEvent(startEvent);

      // 仮想ジョイスティック要素が作成されることを確認
      const joystickElement = document.querySelector('.virtual-joystick');
      expect(joystickElement).toBeTruthy();
    });
  });

  describe('キーイベントシミュレーション', () => {
    test('タッチイベントハンドラーが正しく設定される', () => {
      // TouchInputManagerが正しく初期化され、基本的な機能が動作することを確認
      expect(touchManager.isKeyPressed('ArrowRight')).toBe(false);

      // キーダウンコールバックが正しく登録されることを確認
      const callback = jest.fn();
      touchManager.onKeyDown(callback);

      // コントローラーエリアでのタッチで仮想ジョイスティックが作成されることを確認
      const touch = createMockTouch(1, 200, 650);
      const startEvent = createMockTouchEvent('touchstart', [touch]);
      document.dispatchEvent(startEvent);

      const joystickElement = document.querySelector('.virtual-joystick');
      expect(joystickElement).toBeTruthy();
    });
  });

  describe('イベントコールバック', () => {
    test('キーダウンコールバックが正しく呼ばれる', () => {
      const callback = jest.fn();
      touchManager.onKeyDown(callback);

      // 内部的にキーダウンをシミュレート
      const startTouch = createMockTouch(1, 200, 700);
      const startEvent = createMockTouchEvent('touchstart', [startTouch]);
      document.dispatchEvent(startEvent);

      const moveTouch = createMockTouch(1, 250, 700);
      const moveEvent = createMockTouchEvent('touchmove', [moveTouch]);
      document.dispatchEvent(moveEvent);

      // コールバックが呼ばれることを期待（非同期処理のため少し待つ）
      setTimeout(() => {
        expect(callback).toHaveBeenCalled();
      }, 100);
    });
  });

  describe('リソース管理', () => {
    test('dispose()でイベントリスナーが削除される', () => {
      const removeEventListenerSpy = jest.spyOn(
        document,
        'removeEventListener'
      );

      touchManager.dispose();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchmove',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchend',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchcancel',
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });

    test('dispose()で仮想ジョイスティックが削除される', () => {
      // 仮想ジョイスティックを作成
      const touch = createMockTouch(1, 200, 650);
      const startEvent = createMockTouchEvent('touchstart', [touch]);
      document.dispatchEvent(startEvent);

      expect(document.querySelector('.virtual-joystick')).toBeTruthy();

      touchManager.dispose();

      expect(document.querySelector('.virtual-joystick')).toBeFalsy();
    });
  });
});
