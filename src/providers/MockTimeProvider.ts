import { ITimeProvider } from './ITimeProvider';

/**
 * テスト用の時間制御可能なTimeProvider実装
 * 時間を手動で進めることで決定論的テストを実現
 */
export class MockTimeProvider implements ITimeProvider {
  private currentTime = 0;
  private timers = new Map<
    number,
    {
      callback: () => void;
      triggerTime: number;
      interval?: boolean;
      intervalTime?: number;
    }
  >();
  private nextTimerId = 1;

  /**
   * 現在時刻を取得
   */
  now(): number {
    return this.currentTime;
  }

  /**
   * 時間を手動で進める（テスト用）
   */
  advanceTime(ms: number): void {
    this.currentTime += ms;
    this.processTimers();
  }

  /**
   * 特定の時刻に時間を設定（テスト用）
   */
  setTime(time: number): void {
    this.currentTime = time;
    this.processTimers();
  }

  /**
   * すべてのタイマーをクリア（テスト初期化用）
   */
  clearAllTimers(): void {
    this.timers.clear();
    this.nextTimerId = 1;
  }

  setTimeout(callback: () => void, delay: number): number {
    const id = this.nextTimerId++;
    this.timers.set(id, {
      callback,
      triggerTime: this.currentTime + delay,
    });
    return id;
  }

  setInterval(callback: () => void, delay: number): number {
    const id = this.nextTimerId++;
    this.timers.set(id, {
      callback,
      triggerTime: this.currentTime + delay,
      interval: true,
      intervalTime: delay,
    });
    return id;
  }

  clearTimeout(id: number): void {
    this.timers.delete(id);
  }

  clearInterval(id: number): void {
    this.timers.delete(id);
  }

  /**
   * 現在時刻に達したタイマーを実行
   */
  private processTimers(): void {
    type TimerData = {
      callback: () => void;
      triggerTime: number;
      interval?: boolean;
      intervalTime?: number;
    };

    const toExecute: Array<{ id: number; timer: TimerData }> = [];

    for (const [id, timer] of this.timers.entries()) {
      if (timer.triggerTime <= this.currentTime) {
        toExecute.push({ id, timer });
      }
    }

    for (const { id, timer } of toExecute) {
      timer.callback();

      if (timer.interval && timer.intervalTime) {
        // インターバルタイマーは次の実行時刻を設定
        timer.triggerTime = this.currentTime + timer.intervalTime;
      } else {
        // 一回実行のタイマーは削除
        this.timers.delete(id);
      }
    }
  }

  /**
   * 待機中のタイマー数を取得（デバッグ用）
   */
  getPendingTimerCount(): number {
    return this.timers.size;
  }
}
