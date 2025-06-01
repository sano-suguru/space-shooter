import { MockInputManager } from '../../src/managers/MockInputManager';

describe('MockInputManager', () => {
  let mockInputManager: MockInputManager;

  beforeEach(() => {
    mockInputManager = new MockInputManager();
  });

  afterEach(() => {
    mockInputManager.dispose();
  });

  describe('キー入力テスト', () => {
    it('キーの押下を正しく検出する', () => {
      expect(mockInputManager.isKeyPressed('ArrowUp')).toBe(false);
      
      mockInputManager.simulateKeyDown('ArrowUp');
      expect(mockInputManager.isKeyPressed('ArrowUp')).toBe(true);
      
      mockInputManager.simulateKeyUp('ArrowUp');
      expect(mockInputManager.isKeyPressed('ArrowUp')).toBe(false);
    });

    it('複数のキーを同時に処理できる', () => {
      mockInputManager.simulateMultipleKeysDown(['ArrowUp', 'ArrowLeft', ' ']);
      
      expect(mockInputManager.isKeyPressed('ArrowUp')).toBe(true);
      expect(mockInputManager.isKeyPressed('ArrowLeft')).toBe(true);
      expect(mockInputManager.isKeyPressed(' ')).toBe(true);
      expect(mockInputManager.isKeyPressed('ArrowDown')).toBe(false);
    });

    it('キーダウンイベントコールバックが呼ばれる', () => {
      const callback = jest.fn();
      mockInputManager.onKeyDown(callback);
      
      mockInputManager.simulateKeyDown('ArrowUp');
      expect(callback).toHaveBeenCalledWith('ArrowUp');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('キーアップイベントコールバックが呼ばれる', () => {
      const callback = jest.fn();
      mockInputManager.onKeyUp(callback);
      
      mockInputManager.simulateKeyDown('ArrowUp');
      mockInputManager.simulateKeyUp('ArrowUp');
      expect(callback).toHaveBeenCalledWith('ArrowUp');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('同じキーを重複して押下した場合、イベントは一度だけ発火する', () => {
      const callback = jest.fn();
      mockInputManager.onKeyDown(callback);
      
      mockInputManager.simulateKeyDown('ArrowUp');
      mockInputManager.simulateKeyDown('ArrowUp'); // 重複
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(mockInputManager.isKeyPressed('ArrowUp')).toBe(true);
    });

    it('現在押されているキーの一覧を取得できる', () => {
      mockInputManager.simulateMultipleKeysDown(['a', 'b', 'c']);
      
      const pressedKeys = mockInputManager.getPressedKeys();
      expect(pressedKeys).toHaveLength(3);
      expect(pressedKeys).toContain('a');
      expect(pressedKeys).toContain('b');
      expect(pressedKeys).toContain('c');
    });
  });

  describe('マウス入力テスト', () => {
    it('マウス位置を正しく管理する', () => {
      expect(mockInputManager.getMousePosition()).toEqual({ x: 0, y: 0 });
      
      mockInputManager.setMousePosition(100, 200);
      expect(mockInputManager.getMousePosition()).toEqual({ x: 100, y: 200 });
    });

    it('マウスボタンの押下を正しく検出する', () => {
      expect(mockInputManager.isMouseButtonPressed(0)).toBe(false);
      
      mockInputManager.simulateMouseDown(0, 50, 100);
      expect(mockInputManager.isMouseButtonPressed(0)).toBe(true);
      expect(mockInputManager.getMousePosition()).toEqual({ x: 50, y: 100 });
      
      mockInputManager.simulateMouseUp(0, 50, 100);
      expect(mockInputManager.isMouseButtonPressed(0)).toBe(false);
    });

    it('マウスクリックイベントコールバックが呼ばれる', () => {
      const downCallback = jest.fn();
      const upCallback = jest.fn();
      
      mockInputManager.onMouseDown(downCallback);
      mockInputManager.onMouseUp(upCallback);
      
      mockInputManager.simulateMouseClick(0, 100, 200);
      
      expect(downCallback).toHaveBeenCalledWith(0, 100, 200);
      expect(upCallback).toHaveBeenCalledWith(0, 100, 200);
    });

    it('マウス移動イベントコールバックが呼ばれる', () => {
      const callback = jest.fn();
      mockInputManager.onMouseMove(callback);
      
      mockInputManager.simulateMouseMove(150, 250);
      
      expect(callback).toHaveBeenCalledWith(150, 250);
      expect(mockInputManager.getMousePosition()).toEqual({ x: 150, y: 250 });
    });

    it('現在押されているマウスボタンの一覧を取得できる', () => {
      mockInputManager.simulateMouseDown(0, 0, 0);
      mockInputManager.simulateMouseDown(1, 0, 0);
      
      const pressedButtons = mockInputManager.getPressedMouseButtons();
      expect(pressedButtons).toHaveLength(2);
      expect(pressedButtons).toContain(0);
      expect(pressedButtons).toContain(1);
    });
  });

  describe('状態管理テスト', () => {
    it('すべてのキーをクリアできる', () => {
      mockInputManager.simulateMultipleKeysDown(['a', 'b', 'c']);
      expect(mockInputManager.getPressedKeys()).toHaveLength(3);
      
      mockInputManager.clearAllKeys();
      expect(mockInputManager.getPressedKeys()).toHaveLength(0);
      expect(mockInputManager.isKeyPressed('a')).toBe(false);
    });

    it('すべてのマウスボタンをクリアできる', () => {
      mockInputManager.simulateMouseDown(0, 0, 0);
      mockInputManager.simulateMouseDown(1, 0, 0);
      expect(mockInputManager.getPressedMouseButtons()).toHaveLength(2);
      
      mockInputManager.clearAllMouseButtons();
      expect(mockInputManager.getPressedMouseButtons()).toHaveLength(0);
      expect(mockInputManager.isMouseButtonPressed(0)).toBe(false);
    });

    it('完全にリセットできる', () => {
      mockInputManager.simulateMultipleKeysDown(['a', 'b']);
      mockInputManager.simulateMouseDown(0, 100, 200);
      mockInputManager.setMousePosition(300, 400);
      
      mockInputManager.reset();
      
      expect(mockInputManager.getPressedKeys()).toHaveLength(0);
      expect(mockInputManager.getPressedMouseButtons()).toHaveLength(0);
      expect(mockInputManager.getMousePosition()).toEqual({ x: 0, y: 0 });
    });

    it('disposeでリソースをクリーンアップできる', () => {
      mockInputManager.simulateMultipleKeysDown(['a', 'b']);
      mockInputManager.simulateMouseDown(0, 0, 0);
      
      mockInputManager.dispose();
      
      expect(mockInputManager.getPressedKeys()).toHaveLength(0);
      expect(mockInputManager.getPressedMouseButtons()).toHaveLength(0);
      expect(mockInputManager.getMousePosition()).toEqual({ x: 0, y: 0 });
    });
  });

  describe('イベントコールバック複数登録テスト', () => {
    it('複数のキーダウンコールバックが全て呼ばれる', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      mockInputManager.onKeyDown(callback1);
      mockInputManager.onKeyDown(callback2);
      
      mockInputManager.simulateKeyDown('ArrowUp');
      
      expect(callback1).toHaveBeenCalledWith('ArrowUp');
      expect(callback2).toHaveBeenCalledWith('ArrowUp');
    });

    it('複数のマウスイベントコールバックが全て呼ばれる', () => {
      const moveCallback1 = jest.fn();
      const moveCallback2 = jest.fn();
      
      mockInputManager.onMouseMove(moveCallback1);
      mockInputManager.onMouseMove(moveCallback2);
      
      mockInputManager.simulateMouseMove(100, 200);
      
      expect(moveCallback1).toHaveBeenCalledWith(100, 200);
      expect(moveCallback2).toHaveBeenCalledWith(100, 200);
    });
  });
});
