import { ITimeProvider } from './ITimeProvider';

/**
 * 実際の時間関数を使用するTimeProviderの実装
 * 本番環境で使用
 */
export class RealTimeProvider implements ITimeProvider {
  now(): number {
    return Date.now();
  }

  setTimeout(callback: () => void, delay: number): number {
    return window.setTimeout(callback, delay);
  }

  setInterval(callback: () => void, delay: number): number {
    return window.setInterval(callback, delay);
  }

  clearTimeout(id: number): void {
    window.clearTimeout(id);
  }

  clearInterval(id: number): void {
    window.clearInterval(id);
  }
}
