// Jest Test Setup
// This file runs before each test file and sets up global test configurations

import '@testing-library/jest-dom';

// Extend Jest matchers with custom game-specific matchers
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveValidGameObject(): R;
    }
  }
}

// Custom matchers for game testing
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toHaveValidGameObject(received: unknown) {
    const hasRequiredProperties =
      received &&
      typeof received === 'object' &&
      'x' in received &&
      'y' in received &&
      'update' in received &&
      'draw' in received &&
      typeof (received as Record<string, unknown>).x === 'number' &&
      typeof (received as Record<string, unknown>).y === 'number' &&
      typeof (received as Record<string, unknown>).update === 'function' &&
      typeof (received as Record<string, unknown>).draw === 'function';

    if (hasRequiredProperties) {
      return {
        message: () => `expected object not to be a valid game object`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected object to be a valid game object with x, y, update, and draw properties`,
        pass: false,
      };
    }
  },
});

// Mock console methods to reduce noise during testing
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();

  // タイマーとアニメーションフレームのクリーンアップログ
  console.log('🧹 Cleaning up timers and animation frames...');

  // 全てのタイマーをクリア
  jest.clearAllTimers();

  // アクティブなタイマーの数をログ出力
  const activeTimeouts = (globalThis as Record<string, unknown>)
    ._activeTimeouts as Set<number> | undefined;
  if (activeTimeouts && activeTimeouts.size > 0) {
    console.warn(
      `⚠️  ${activeTimeouts.size} active timeouts detected after test`
    );
    activeTimeouts.forEach((timerId: number) => clearTimeout(timerId));
    activeTimeouts.clear();
  }

  // アクティブなアニメーションフレームをクリーンアップ
  const activeFrames = (globalThis as Record<string, unknown>)
    ._activeAnimationFrames as Set<number> | undefined;
  if (activeFrames && activeFrames.size > 0) {
    console.warn(
      `⚠️  ${activeFrames.size} active animation frames detected after test`
    );
    activeFrames.forEach((frameId: number) => cancelAnimationFrame(frameId));
    activeFrames.clear();
  }

  // グローバルなアニメーションフレームをクリーンアップ
  const activeGlobalFrames = (globalThis as Record<string, unknown>)
    ._activeGlobalAnimationFrames as Set<number> | undefined;
  if (activeGlobalFrames && activeGlobalFrames.size > 0) {
    console.warn(
      `⚠️  ${activeGlobalFrames.size} active global animation frames detected after test`
    );
    activeGlobalFrames.forEach((frameId: number) => clearTimeout(frameId));
    activeGlobalFrames.clear();
  }
});

// Global test timeout
jest.setTimeout(10000);

// テスト開始前のログ
beforeEach(() => {
  console.log('🧪 Starting test...');
  // タイマーの設定は各テストファイルで必要に応じて行う
});

// テスト終了後にタイマーをリセット
afterEach(() => {
  // タイマーが使用されている場合のみリセット
  if (jest.isMockFunction(setTimeout)) {
    jest.useRealTimers();
  }
});
