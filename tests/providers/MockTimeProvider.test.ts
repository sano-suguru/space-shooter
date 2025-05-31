import { MockTimeProvider } from '../../src/providers/MockTimeProvider';

describe('MockTimeProvider', () => {
  let timeProvider: MockTimeProvider;

  beforeEach(() => {
    timeProvider = new MockTimeProvider();
  });

  describe('now()', () => {
    it('初期時刻は0を返す', () => {
      expect(timeProvider.now()).toBe(0);
    });

    it('setTimeで設定した時刻を返す', () => {
      timeProvider.setTime(1000);
      expect(timeProvider.now()).toBe(1000);
    });

    it('advanceTimeで時間を進められる', () => {
      timeProvider.advanceTime(500);
      expect(timeProvider.now()).toBe(500);
      
      timeProvider.advanceTime(300);
      expect(timeProvider.now()).toBe(800);
    });
  });

  describe('setTimeout()', () => {
    it('指定時間後にコールバックが実行される', () => {
      const callback = jest.fn();
      timeProvider.setTimeout(callback, 1000);
      
      // まだ実行されない
      expect(callback).not.toHaveBeenCalled();
      
      // 999ms進める - まだ実行されない
      timeProvider.advanceTime(999);
      expect(callback).not.toHaveBeenCalled();
      
      // 1000ms以上進める - 実行される
      timeProvider.advanceTime(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('複数のタイマーが正しく動作する', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      timeProvider.setTimeout(callback1, 500);
      timeProvider.setTimeout(callback2, 1000);
      
      timeProvider.advanceTime(500);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();
      
      timeProvider.advanceTime(500);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('setInterval()', () => {
    it('指定間隔でコールバックが繰り返し実行される', () => {
      const callback = jest.fn();
      timeProvider.setInterval(callback, 1000);
      
      // 初回実行まで
      timeProvider.advanceTime(1000);
      expect(callback).toHaveBeenCalledTimes(1);
      
      // 2回目実行
      timeProvider.advanceTime(1000);
      expect(callback).toHaveBeenCalledTimes(2);
      
      // 3回目実行
      timeProvider.advanceTime(1000);
      expect(callback).toHaveBeenCalledTimes(3);
    });
  });

  describe('clearTimeout()', () => {
    it('タイマーを削除できる', () => {
      const callback = jest.fn();
      const timerId = timeProvider.setTimeout(callback, 1000);
      
      timeProvider.clearTimeout(timerId);
      timeProvider.advanceTime(1000);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('clearInterval()', () => {
    it('インターバルタイマーを削除できる', () => {
      const callback = jest.fn();
      const timerId = timeProvider.setInterval(callback, 1000);
      
      timeProvider.advanceTime(1000);
      expect(callback).toHaveBeenCalledTimes(1);
      
      timeProvider.clearInterval(timerId);
      timeProvider.advanceTime(1000);
      expect(callback).toHaveBeenCalledTimes(1); // 増えない
    });
  });

  describe('clearAllTimers()', () => {
    it('すべてのタイマーをクリアする', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      timeProvider.setTimeout(callback1, 500);
      timeProvider.setInterval(callback2, 1000);
      
      timeProvider.clearAllTimers();
      timeProvider.advanceTime(1000);
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('getPendingTimerCount()', () => {
    it('待機中のタイマー数を正しく返す', () => {
      expect(timeProvider.getPendingTimerCount()).toBe(0);
      
      timeProvider.setTimeout(() => {}, 1000);
      expect(timeProvider.getPendingTimerCount()).toBe(1);
      
      timeProvider.setInterval(() => {}, 500);
      expect(timeProvider.getPendingTimerCount()).toBe(2);
      
      timeProvider.advanceTime(1000);
      expect(timeProvider.getPendingTimerCount()).toBe(1); // setTimeoutは削除、setIntervalは残る
    });
  });
});
