/**
 * 時間関連操作の抽象化インターフェース
 * テスト時に時間を制御可能にし、決定論的テストを実現
 */
export interface ITimeProvider {
  /**
   * 現在時刻を取得（Date.now()の代替）
   */
  now(): number;

  /**
   * 指定時間後にコールバックを実行（setTimeoutの代替）
   */
  setTimeout(callback: () => void, delay: number): number;

  /**
   * 指定間隔でコールバックを実行（setIntervalの代替）
   */
  setInterval(callback: () => void, delay: number): number;

  /**
   * タイマーをクリア（clearTimeoutの代替）
   */
  clearTimeout(id: number): void;

  /**
   * インターバルをクリア（clearIntervalの代替）
   */
  clearInterval(id: number): void;
}
