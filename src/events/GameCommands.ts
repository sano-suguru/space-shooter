import { Enemy } from "../entities/Enemy";
import { PowerUp } from "../entities/PowerUp";
import { EnemyType } from "../types";

/**
 * ゲーム内のコマンドイベント定義
 * 直接的なメソッド呼び出しをイベント駆動に変換するためのコマンドイベント
 */
export type GameCommandMap = Readonly<{
    // オブジェクト生成コマンド
    'createEnemy': (type: EnemyType, x?: number, y?: number) => void;
    'createPowerUp': (x?: number, y?: number) => void;
    'createExplosion': (x: number, y: number, scale?: number) => void;
    
    // ゲーム状態制御コマンド
    'startGame': () => void;
    'pauseGame': () => void;
    'resumeGame': () => void;
    'restartGame': () => void;
    'gameOver': () => void;
    
    // レベル制御コマンド
    'startNextLevel': () => void;
    'spawnBoss': () => void;
    
    // オブジェクト管理コマンド
    'removeEnemy': (enemy: Enemy) => void;
    'removePowerUp': (powerUp: PowerUp) => void;
    'cleanupOffscreenObjects': () => void;
    
    // UI制御コマンド
    'showMessage': (message: string, duration?: number) => void;
    'hideMessage': () => void;
    'updateUI': () => void;
    
    // デバッグコマンド
    'toggleDebugMode': () => void;
    'showPoolStats': () => void;
}>;
