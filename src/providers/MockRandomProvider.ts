import { IRandomProvider } from './IRandomProvider';

/**
 * テスト用の決定論的RandomProvider実装
 * 予め設定された値やシード値で制御可能なランダム値を提供
 */
export class MockRandomProvider implements IRandomProvider {
  private values: number[] = [];
  private currentIndex = 0;
  private seed = 1;

  /**
   * 固定値リストを設定（テスト用）
   */
  setValues(values: number[]): void {
    this.values = [...values];
    this.currentIndex = 0;
  }

  /**
   * シード値を設定して疑似ランダム生成（テスト用）
   */
  setSeed(seed: number): void {
    this.seed = seed;
  }

  /**
   * 次の値を取得（固定値がある場合はそれを使用、なければ疑似ランダム）
   */
  random(): number {
    if (this.values.length > 0) {
      const value = this.values[this.currentIndex % this.values.length];
      this.currentIndex++;
      return value;
    }

    // 簡単な線形合同法による疑似ランダム生成
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  randomRange(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }

  randomChoice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    const index = Math.floor(this.random() * array.length);
    return array[index];
  }

  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  randomBoolean(): boolean {
    return this.random() < 0.5;
  }

  randomChance(probability: number): boolean {
    if (probability < 0 || probability > 1) {
      throw new Error('Probability must be between 0 and 1');
    }
    return this.random() < probability;
  }

  /**
   * 状態をリセット（テスト初期化用）
   */
  reset(): void {
    this.values = [];
    this.currentIndex = 0;
    this.seed = 1;
  }

  /**
   * 現在のインデックスを取得（デバッグ用）
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }
}
