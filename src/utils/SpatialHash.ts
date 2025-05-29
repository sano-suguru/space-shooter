import { GameObject } from '../entities/GameObject';

interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * 空間分割による衝突検出最適化
 * オブジェクトを格子状に分割して近隣オブジェクトのみをチェック
 */
export class SpatialHash {
    private cellSize: number;
    private grid = new Map<string, Set<GameObject>>();
    private objectToCells = new Map<GameObject, string[]>();

    constructor(cellSize: number = 64) {
        this.cellSize = cellSize;
    }

    /**
     * 座標からセルキーを生成
     */
    private getCellKey(x: number, y: number): string {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }

    /**
     * オブジェクトが占有するセルを取得
     */
    private getCells(obj: GameObject): string[] {
        const cells: string[] = [];
        const x = obj.getX();
        const y = obj.getY();
        const width = obj.getWidth();
        const height = obj.getHeight();

        const startX = Math.floor(x / this.cellSize);
        const endX = Math.floor((x + width) / this.cellSize);
        const startY = Math.floor(y / this.cellSize);
        const endY = Math.floor((y + height) / this.cellSize);

        for (let cellX = startX; cellX <= endX; cellX++) {
            for (let cellY = startY; cellY <= endY; cellY++) {
                cells.push(this.getCellKey(cellX * this.cellSize, cellY * this.cellSize));
            }
        }

        return cells;
    }

    /**
     * オブジェクトを空間に挿入
     */
    insert(obj: GameObject): void {
        const cells = this.getCells(obj);
        this.objectToCells.set(obj, cells);

        cells.forEach(cellKey => {
            if (!this.grid.has(cellKey)) {
                this.grid.set(cellKey, new Set());
            }
            this.grid.get(cellKey)!.add(obj);
        });
    }

    /**
     * オブジェクトを空間から削除
     */
    remove(obj: GameObject): void {
        const cells = this.objectToCells.get(obj);
        if (!cells) return;

        cells.forEach(cellKey => {
            const cell = this.grid.get(cellKey);
            if (cell) {
                cell.delete(obj);
                if (cell.size === 0) {
                    this.grid.delete(cellKey);
                }
            }
        });

        this.objectToCells.delete(obj);
    }

    /**
     * オブジェクトの近隣オブジェクトを取得
     */
    getNearby(obj: GameObject): Set<GameObject> {
        const cells = this.getCells(obj);
        const nearby = new Set<GameObject>();

        cells.forEach(cellKey => {
            const cell = this.grid.get(cellKey);
            if (cell) {
                cell.forEach(other => {
                    if (other !== obj) {
                        nearby.add(other);
                    }
                });
            }
        });

        return nearby;
    }

    /**
     * 矩形範囲内のオブジェクトを取得
     */
    getInRegion(region: Rectangle): Set<GameObject> {
        const objects = new Set<GameObject>();

        const startX = Math.floor(region.x / this.cellSize);
        const endX = Math.floor((region.x + region.width) / this.cellSize);
        const startY = Math.floor(region.y / this.cellSize);
        const endY = Math.floor((region.y + region.height) / this.cellSize);

        for (let cellX = startX; cellX <= endX; cellX++) {
            for (let cellY = startY; cellY <= endY; cellY++) {
                const cellKey = `${cellX},${cellY}`;
                const cell = this.grid.get(cellKey);
                if (cell) {
                    cell.forEach(obj => objects.add(obj));
                }
            }
        }

        return objects;
    }

    /**
     * 空間をクリア
     */
    clear(): void {
        this.grid.clear();
        this.objectToCells.clear();
    }

    /**
     * デバッグ情報を取得
     */
    getDebugInfo(): { cellCount: number; objectCount: number; avgObjectsPerCell: number } {
        let totalObjects = 0;
        this.grid.forEach(cell => {
            totalObjects += cell.size;
        });

        return {
            cellCount: this.grid.size,
            objectCount: this.objectToCells.size,
            avgObjectsPerCell: this.grid.size > 0 ? totalObjects / this.grid.size : 0
        };
    }
}

/**
 * 衝突検出最適化のためのヘルパークラス
 */
export class CollisionOptimizer {
    private spatialHash: SpatialHash;

    constructor(cellSize: number = 64) {
        this.spatialHash = new SpatialHash(cellSize);
    }

    /**
     * フレーム開始時にオブジェクトを空間に配置
     */
    updateSpatialHash(objects: GameObject[]): void {
        this.spatialHash.clear();
        objects.forEach(obj => this.spatialHash.insert(obj));
    }

    /**
     * 最適化された衝突チェック
     */
    checkCollisions<T extends GameObject, U extends GameObject>(
        sourceObjects: T[],
        targetObjects: U[],
        collisionCallback: (source: T, target: U) => void
    ): void {
        // ターゲットオブジェクトを空間に配置
        targetObjects.forEach(obj => this.spatialHash.insert(obj));

        // ソースオブジェクトごとに近隣のターゲットとのみ衝突チェック
        sourceObjects.forEach(source => {
            const nearby = this.spatialHash.getNearby(source);
            nearby.forEach(target => {
                if (targetObjects.includes(target as U)) {
                    collisionCallback(source, target as U);
                }
            });
        });
    }

    getSpatialHash(): SpatialHash {
        return this.spatialHash;
    }
}
