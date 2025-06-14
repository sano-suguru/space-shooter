// Jest Test Setup
// This file runs before each test file and sets up global test configurations

import '@testing-library/jest-dom';

// Extend Jest matchers with custom game-specific matchers
declare global {
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
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toHaveValidGameObject(received: any) {
    const hasRequiredProperties = received && 
      typeof received.x === 'number' &&
      typeof received.y === 'number' &&
      typeof received.update === 'function' &&
      typeof received.draw === 'function';

    if (hasRequiredProperties) {
      return {
        message: () => `expected object not to be a valid game object`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected object to be a valid game object with x, y, update, and draw properties`,
        pass: false,
      };
    }
  }
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
  jest.useRealTimers();
  
  // アクティブなタイマーの数をログ出力
  const activeTimeouts = (globalThis as any)._activeTimeouts;
  if (activeTimeouts && activeTimeouts.size > 0) {
    console.warn(`⚠️  ${activeTimeouts.size} active timeouts detected after test`);
    activeTimeouts.forEach((timerId: any) => clearTimeout(timerId));
    activeTimeouts.clear();
  }
  
  // アクティブなアニメーションフレームをクリーンアップ
  const activeFrames = (globalThis as any)._activeAnimationFrames;
  if (activeFrames && activeFrames.size > 0) {
    console.warn(`⚠️  ${activeFrames.size} active animation frames detected after test`);
    activeFrames.forEach((frameId: any) => cancelAnimationFrame(frameId));
    activeFrames.clear();
  }
  
  // グローバルなアニメーションフレームをクリーンアップ
  const activeGlobalFrames = (globalThis as any)._activeGlobalAnimationFrames;
  if (activeGlobalFrames && activeGlobalFrames.size > 0) {
    console.warn(`⚠️  ${activeGlobalFrames.size} active global animation frames detected after test`);
    activeGlobalFrames.forEach((frameId: any) => clearTimeout(frameId));
    activeGlobalFrames.clear();
  }
});

// Global test timeout
jest.setTimeout(10000);

// テスト開始前のログ
beforeEach(() => {
  console.log('🧪 Starting test...');
  jest.useFakeTimers();
});
