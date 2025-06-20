/**
 * デバッグモード関連の型定義
 */

import { EnemyType, Vector2D } from '../../types';

/**
 * デバッグ状態を管理する型
 */
export interface DebugState {
  /** デバッグモードが有効かどうか */
  isActive: boolean;

  /** 無敵モードが有効かどうか */
  invincible: boolean;

  /** 時間の倍率（0で停止、1で通常速度） */
  timeMultiplier: number;

  /** デバッグUIを表示するかどうか */
  showUI: boolean;

  /** 衝突判定の境界を表示するかどうか */
  showCollisionBoxes: boolean;

  /** 無限体力モードが有効かどうか */
  infiniteHealth: boolean;

  /** 現在のプレイヤー体力 */
  playerHealth: number;

  /** 現在のウェーブ番号 */
  currentWave: number;

  /** 現在の敵数 */
  enemyCount: number;

  /** 現在のFPS */
  fps: number;
}

/**
 * シナリオデータの型
 */
export interface DebugScenario {
  /** シナリオID */
  id: string;

  /** シナリオ名 */
  name: string;

  /** 説明 */
  description: string;

  /** プレイヤー状態 */
  playerState: {
    health: number;
    position: Vector2D;
    powerUps: string[];
  };

  /** ウェーブ状態 */
  waveState: {
    currentWave: number;
    enemiesRemaining: number;
  };

  /** 敵の配置 */
  enemies: Array<{
    type: EnemyType;
    position: Vector2D;
    health?: number;
  }>;

  /** ボス状態（存在する場合） */
  bossState?: {
    type: string;
    health: number;
    position: Vector2D;
  };
}

/**
 * デバッグコマンドの型
 */
export interface DebugCommand {
  /** コマンド名 */
  name: string;

  /** 説明 */
  description: string;

  /** キーバインド */
  keyBinding?: string;

  /** 実行関数 */
  execute: () => void;
}

/**
 * デバッグ統計情報の型
 */
export interface DebugStats {
  /** フレームレート */
  fps: number;

  /** 描画時間（ミリ秒） */
  renderTime: number;

  /** 更新時間（ミリ秒） */
  updateTime: number;

  /** オブジェクト数 */
  objectCount: {
    enemies: number;
    bullets: number;
    powerUps: number;
    particles: number;
  };

  /** メモリ使用量（推定） */
  memoryUsage: {
    objects: number;
    pools: number;
  };
}

/**
 * デバッグイベントの型
 */
export type DebugEventType =
  | 'debugModeToggled'
  | 'invincibilityToggled'
  | 'timeMultiplierChanged'
  | 'waveJumped'
  | 'enemySpawned'
  | 'scenarioLoaded'
  | 'scenarioSaved';

/**
 * デバッグイベントデータの型
 */
export interface DebugEventData {
  debugModeToggled: { enabled: boolean };
  invincibilityToggled: { enabled: boolean };
  timeMultiplierChanged: { multiplier: number };
  waveJumped: { waveNumber: number };
  enemySpawned: { type: EnemyType; position: Vector2D };
  scenarioLoaded: { scenarioId: string };
  scenarioSaved: { scenarioId: string; name: string };
}
