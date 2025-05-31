import { IRandomProvider } from './IRandomProvider';

/**
 * 実際のランダム関数を使用するRandomProviderの実装
 * 本番環境で使用
 */
export class RealRandomProvider implements IRandomProvider {
  random(): number {
    return Math.random();
  }

  randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  randomChoice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    return array[Math.floor(Math.random() * array.length)];
  }

  randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  randomBoolean(): boolean {
    return Math.random() < 0.5;
  }

  randomChance(probability: number): boolean {
    if (probability < 0 || probability > 1) {
      throw new Error('Probability must be between 0 and 1');
    }
    return Math.random() < probability;
  }
}
