// Canvas API Mock for Jest Tests
// This file provides mock implementations for HTML5 Canvas API used in the game

// Define HTMLCanvasElement if not available (Node environment)
if (typeof HTMLCanvasElement === 'undefined') {
  (globalThis as any).HTMLCanvasElement = class HTMLCanvasElement {
    width = 400;
    height = 600;
    getContext() {
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
      height: 1
    })),
    putImageData: jest.fn(),
    
    // Gradient methods
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn()
    })),
    createRadialGradient: jest.fn(() => ({
      addColorStop: jest.fn()
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
      height: 600
    }
  }))
});

// Complete Canvas 2D Context mock
const createMockContext = () => ({
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
    height: 1
  })),
  putImageData: jest.fn(),
  
  // Gradient methods
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  })),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn()
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
    height: 600
  }
});

// Define document if not available (Node environment)
if (typeof document === 'undefined') {
  (globalThis as any).document = {
    createElement: jest.fn(() => ({
      width: 400,
      height: 600,
      getContext: jest.fn(() => createMockContext())
    }))
  };
}

// Define window if not available (Node environment)
if (typeof window === 'undefined') {
  (globalThis as any).window = {};
}

// Performance API mock for background renderer optimization
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now())
  }
});

// RequestAnimationFrame mock
Object.defineProperty(window, 'requestAnimationFrame', {
  value: jest.fn((callback: any) => {
    return setTimeout(callback, 16);
  })
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: jest.fn((id: number) => {
    clearTimeout(id);
  })
});

// Event mock
Object.defineProperty(window, 'Event', {
  value: class MockEvent {
    type: string;
    constructor(type: string) {
      this.type = type;
    }
  }
});
