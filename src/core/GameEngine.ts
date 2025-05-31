/**
 * GameEngine - ゲームループの管理を担当するクラス
 * 
 * 責務:
 * - ゲームループの開始・停止・一時停止・再開
 * - deltaTime 計算
 * - requestAnimationFrame 管理
 * - フレームレート制御
 */
export class GameEngine {
    private lastTime = 0;
    private deltaTime = 0;
    private gameLoopId: number | null = null;
    private isRunning = false;
    private isPaused = false;

    constructor(
        private updateCallback: (deltaTime: number) => void,
        private drawCallback: () => void
    ) {}

    /**
     * ゲームを開始
     */
    public start(): void {
        if (this.isRunning && !this.isPaused) {
            return; // 既に実行中の場合は何もしない
        }

        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = 0; // リセット
        this.startGameLoop();
    }

    /**
     * ゲームを一時停止
     */
    public pause(): void {
        if (!this.isRunning || this.isPaused) {
            return;
        }

        this.isPaused = true;
        this.stopGameLoop();
    }

    /**
     * ゲームを再開
     */
    public resume(): void {
        if (!this.isRunning || !this.isPaused) {
            return;
        }

        this.isPaused = false;
        this.lastTime = 0; // リセットしてdeltaTimeのジャンプを防ぐ
        this.startGameLoop();
    }

    /**
     * ゲームを停止
     */
    public stop(): void {
        this.isRunning = false;
        this.isPaused = false;
        this.stopGameLoop();
    }

    /**
     * ゲームループの内部実装
     */
    private gameLoop = (currentTime: number): void => {
        // deltaTime計算（初回は0にする）
        this.deltaTime = this.lastTime === 0 ? 0 : (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // deltaTimeの上限を設定（長時間の一時停止後の異常な値を防ぐ）
        this.deltaTime = Math.min(this.deltaTime, 1/30); // 最大30FPS相当

        // ゲーム更新
        this.updateCallback(this.deltaTime);
        
        // 描画
        this.drawCallback();

        // 次のフレームをリクエスト（停止されていない場合のみ）
        if (this.isRunning && !this.isPaused) {
            this.gameLoopId = requestAnimationFrame(this.gameLoop);
        }
    }

    /**
     * ゲームループを開始
     */
    private startGameLoop(): void {
        if (this.gameLoopId === null) {
            this.gameLoopId = requestAnimationFrame(this.gameLoop);
        }
    }

    /**
     * ゲームループを停止
     */
    private stopGameLoop(): void {
        if (this.gameLoopId !== null) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }

    /**
     * 現在のdeltaTimeを取得
     */
    public getDeltaTime(): number {
        return this.deltaTime;
    }

    /**
     * ゲームが実行中かどうか
     */
    public isGameRunning(): boolean {
        return this.isRunning && !this.isPaused;
    }

    /**
     * ゲームが一時停止中かどうか
     */
    public isGamePaused(): boolean {
        return this.isPaused;
    }

    /**
     * デバッグ情報を取得
     */
    public getDebugInfo(): {
        isRunning: boolean;
        isPaused: boolean;
        deltaTime: number;
        fps: number;
    } {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            deltaTime: this.deltaTime,
            fps: this.deltaTime > 0 ? Math.round(1 / this.deltaTime) : 0
        };
    }
}
