/**
 * オブジェクトプールクラス
 * 頻繁に作成・削除されるオブジェクトを再利用してガベージコレクションの負荷を軽減
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn?: (obj: T) => void;
  private maxSize: number;

  constructor(
    createFn: () => T,
    resetFn?: (obj: T) => void,
    initialSize: number = 10,
    maxSize: number = 100
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;

    // 初期プールを作成
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
    }
  }

  /**
   * プールからオブジェクトを取得
   */
  get(): T {
    const obj = this.pool.pop() ?? this.createFn();
    return obj;
  }

  /**
   * オブジェクトをプールに返却
   */
  release(obj: T): void {
    if (this.pool.length >= this.maxSize) {
      return; // プールが満杯の場合は破棄
    }

    if (this.resetFn) {
      this.resetFn(obj);
    }
    this.pool.push(obj);
  }

  /**
   * プール内のオブジェクト数を取得
   */
  getPoolSize(): number {
    return this.pool.length;
  }

  /**
   * プールをクリア
   */
  clear(): void {
    this.pool = [];
  }
}

/**
 * 複数のオブジェクトプールを管理するマネージャー
 */
export class PoolManager {
  private pools = new Map<string, ObjectPool<unknown>>();

  register<T>(name: string, pool: ObjectPool<T>): void {
    this.pools.set(name, pool as ObjectPool<unknown>);
  }

  getPool<T>(name: string): ObjectPool<T> | undefined {
    const pool = this.pools.get(name);
    return pool as ObjectPool<T> | undefined;
  }

  clearAll(): void {
    this.pools.forEach(pool => pool.clear());
    this.pools.clear();
  }

  getStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    this.pools.forEach((pool, name) => {
      stats[name] = pool.getPoolSize();
    });
    return stats;
  }
}
