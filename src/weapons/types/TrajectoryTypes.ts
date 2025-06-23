/**
 * 弾道システム - タイプ定義
 *
 * 弾道パターンシステムで使用される基本的なタイプ定義を提供します。
 */

import { Bullet } from '../../entities/Bullet';

/**
 * 弾道タイプ列挙
 */
export enum TrajectoryType {
  STRAIGHT = 'straight', // 直線軌道（デフォルト）
  PRECISION = 'precision', // 精密射撃（軽微な追尾）
  AREA_EFFECT = 'area_effect', // 範囲攻撃（着弾時爆発）
  BARRAGE = 'barrage', // 弾幕攻撃（3発同時発射）
  EVASIVE = 'evasive', // 回避困難（サイン波軌道）
}

/**
 * 弾道設定パラメータ
 */
export interface TrajectoryConfig {
  type: TrajectoryType;
  parameters: TrajectoryParameters;
}

/**
 * 弾道パラメータ（各弾道タイプ共通）
 */
export interface TrajectoryParameters {
  // 基本パラメータ
  speed: number;

  // 精密射撃用パラメータ
  straightPhaseDuration?: number; // 直線移動時間（ms）
  trackingStrength?: number; // 追尾強度（0-1）
  trackingRange?: number; // 追尾範囲（ラジアン）

  // 範囲攻撃用パラメータ
  explosionDelay?: number; // 爆発遅延時間（ms）
  explosionRadius?: number; // 爆発半径（px）
  explosionDamage?: number; // 爆発ダメージ

  // 弾幕攻撃用パラメータ
  spreadAngle?: number; // 拡散角度（ラジアン）
  bulletCount?: number; // 弾丸数

  // 回避困難用パラメータ
  wavePeriod?: number; // 波の周期（ms）
  maxAmplitude?: number; // 最大振幅（px）
  amplitudeGrowthRate?: number; // 振幅成長率
}

/**
 * 弾道デバッグ情報
 */
export interface TrajectoryDebugInfo {
  type: TrajectoryType;
  elapsedTime: number;
  phase: string;
  targetPosition?: { x: number; y: number };
  currentAmplitude?: number;
  trackingActive?: boolean;
}

/**
 * 弾道インターフェース
 */
export interface IBulletTrajectory {
  /**
   * 弾丸の軌道を更新
   */
  update(bullet: Bullet, deltaTime: number): void;

  /**
   * 弾道が完了したかどうか
   */
  isComplete(): boolean;

  /**
   * 弾道をリセット（オブジェクトプール用）
   */
  reset(): void;

  /**
   * 弾道タイプを取得
   */
  getType(): TrajectoryType;

  /**
   * デバッグ情報を取得
   */
  getDebugInfo(): TrajectoryDebugInfo;
}

/**
 * 2D座標
 */
export interface Vector2D {
  x: number;
  y: number;
}

/**
 * 弾道状態
 */
export interface TrajectoryState {
  startTime: number;
  isCompleted: boolean;
  phase: string;
  initialPosition: Vector2D;
  initialVelocity: Vector2D;
  targetPosition?: Vector2D;
  currentAmplitude?: number;
}
