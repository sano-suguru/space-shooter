// Canvas API Mock for Jest Tests
// This file provides mock implementations for HTML5 Canvas API used in the game

// Define HTMLCanvasElement if not available (Node environment)
if (typeof HTMLCanvasElement === 'undefined') {
  (globalThis as Record<string, unknown>).HTMLCanvasElement =
    class HTMLCanvasElement {
      width = 400;
      height = 600;
      getContext(): null {
        return null;
      }
    };
}

// HTMLCanvasElement mock
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => ({
    // Canvas 2D Context methods
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    strokeRect: jest.fn(),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),

    // Path methods
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    arc: jest.fn(),
    ellipse: jest.fn(),
    rect: jest.fn(),
    quadraticCurveTo: jest.fn(),
    bezierCurveTo: jest.fn(),
    arcTo: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),

    // Transform methods
    save: jest.fn(),
    restore: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    translate: jest.fn(),
    transform: jest.fn(),
    setTransform: jest.fn(),
    resetTransform: jest.fn(),

    // Style properties
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    lineDashOffset: 0,
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    direction: 'inherit',
    globalAlpha: 1.0,
    globalCompositeOperation: 'source-over',

    // Image drawing methods
    drawImage: jest.fn(),
    createImageData: jest.fn(),
    getImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1,
    })),
    putImageData: jest.fn(),

    // Gradient methods
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    createRadialGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    createPattern: jest.fn(),

    // Shadow properties
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,

    // Clipping
    clip: jest.fn(),

    // State
    canvas: {
      width: 400,
      height: 600,
    },
  })),
});

// Complete Canvas 2D Context mock
const createMockContext = (): Record<string, unknown> => ({
  // Canvas 2D Context methods
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  strokeRect: jest.fn(),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),

  // Path methods
  beginPath: jest.fn(),
  closePath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  arc: jest.fn(),
  ellipse: jest.fn(),
  rect: jest.fn(),
  quadraticCurveTo: jest.fn(),
  bezierCurveTo: jest.fn(),
  arcTo: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),

  // Transform methods
  save: jest.fn(),
  restore: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  translate: jest.fn(),
  transform: jest.fn(),
  setTransform: jest.fn(),
  resetTransform: jest.fn(),

  // Style properties
  fillStyle: '#000000',
  strokeStyle: '#000000',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  miterLimit: 10,
  lineDashOffset: 0,
  font: '10px sans-serif',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  direction: 'inherit',
  globalAlpha: 1.0,
  globalCompositeOperation: 'source-over',

  // Image drawing methods
  drawImage: jest.fn(),
  createImageData: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1,
  })),
  putImageData: jest.fn(),

  // Gradient methods
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  createPattern: jest.fn(),

  // Shadow properties
  shadowBlur: 0,
  shadowColor: 'rgba(0, 0, 0, 0)',
  shadowOffsetX: 0,
  shadowOffsetY: 0,

  // Clipping
  clip: jest.fn(),

  // State
  canvas: {
    width: 400,
    height: 600,
  },
});

// Define document if not available (Node environment)
if (typeof document === 'undefined') {
  (globalThis as Record<string, unknown>).document = {
    createElement: jest.fn(() => ({
      width: 400,
      height: 600,
      getContext: jest.fn(() => createMockContext()),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      style: {},
      textContent: '',
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(),
      },
    })),
    getElementById: jest.fn(() => ({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      style: {},
      textContent: '',
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(),
      },
    })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      contains: jest.fn(() => true),
    },
  };
} else {
  // document は存在するが、必要なメソッドをモック化
  if (!document.addEventListener) {
    document.addEventListener = jest.fn();
  }
  if (!document.removeEventListener) {
    document.removeEventListener = jest.fn();
  }
  if (!document.getElementById) {
    document.getElementById = jest.fn(
      () =>
        ({
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          style: {},
          textContent: '',
          classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn(),
          },
        }) as unknown as HTMLElement
    );
  }
  if (!document.body) {
    (document as unknown as Record<string, unknown>).body = {
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      contains: jest.fn(() => true),
    };
  }
}

// Define window if not available (Node environment)
if (typeof window === 'undefined') {
  (globalThis as Record<string, unknown>).window = {};
}

// Performance API mock for background renderer optimization
let performanceCounter = 0;
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => {
      // テスト環境でリアルな描画時間をシミュレート
      performanceCounter += Math.random() * 2 + 0.1; // 0.1-2.1ms のランダムな時間
      return performanceCounter;
    }),
  },
});

// RequestAnimationFrame mock
const mockRequestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
  const id = setTimeout(() => callback(Date.now()), 16);
  console.log(`🎬 Global requestAnimationFrame called, assigned ID: ${id}`);
  // アクティブなフレームIDを記録
  const globalThis_: Record<string, unknown> = globalThis as Record<
    string,
    unknown
  >;
  globalThis_._activeGlobalAnimationFrames =
    globalThis_._activeGlobalAnimationFrames ?? new Set();
  (globalThis_._activeGlobalAnimationFrames as Set<number>).add(id);
  return id;
});

const mockCancelAnimationFrame = jest.fn((id: number) => {
  console.log(`🧹 Global cancelAnimationFrame called for ID: ${id}`);
  clearTimeout(id);
  const globalThis_: Record<string, unknown> = globalThis as Record<
    string,
    unknown
  >;
  if (globalThis_._activeGlobalAnimationFrames) {
    (globalThis_._activeGlobalAnimationFrames as Set<number>).delete(id);
  }
});

Object.defineProperty(window, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame,
});

// グローバルスコープにも定義
(globalThis as Record<string, unknown>).requestAnimationFrame =
  mockRequestAnimationFrame;
(globalThis as Record<string, unknown>).cancelAnimationFrame =
  mockCancelAnimationFrame;

// Event mock
Object.defineProperty(window, 'Event', {
  value: class MockEvent {
    type: string;
    constructor(type: string) {
      this.type = type;
    }
  },
});
