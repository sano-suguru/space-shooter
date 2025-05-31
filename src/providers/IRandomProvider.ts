/**
 * ランダム関数の抽象化インターフェース
 * テスト時にランダム値を制御可能にし、決定論的テストを実現
 */
export interface IRandomProvider {
  /**
   * 0以上1未満のランダムな数値を取得（Math.random()の代替）
   */
  random(): number;

  /**
   * 指定範囲内のランダムな数値を取得
   */
  randomRange(min: number, max: number): number;

  /**
   * 配列からランダムに要素を選択
   */
  randomChoice<T>(array: T[]): T;

  /**
   * ランダムな整数を取得
   */
  randomInt(min: number, max: number): number;

  /**
   * ランダムなブール値を取得
   */
  randomBoolean(): boolean;

  /**
   * 指定確率でtrueを返す
   */
  randomChance(probability: number): boolean;
}
