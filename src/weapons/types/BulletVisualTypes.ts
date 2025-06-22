/**
 * 弾丸ビジュアルシステム - タイプ定義
 *
 * 武器タイプとエンチャント効果による弾丸の見た目を定義します。
 */

import { EnchantmentType } from './EnchantmentTypes';
import { WeaponType, WeaponRarity } from './WeaponTypes';

/**
 * 弾丸ビジュアル効果タイプ
 */
export enum BulletVisualEffectType {
  // 基本エフェクト
  GLOW = 'glow', // 光輪効果
  PULSE = 'pulse', // パルス効果
  TRAIL = 'trail', // 軌跡効果
  SPARKLE = 'sparkle', // 輝き効果

  // 特殊エフェクト
  ENERGY_AURA = 'energy_aura', // エネルギーオーラ
  FLAME_TRAIL = 'flame_trail', // 炎の軌跡
  ELECTRIC_ARC = 'electric_arc', // 電気アーク
  FROST_MIST = 'frost_mist', // 霜の霧

  // 高級エフェクト
  PARTICLE_BURST = 'particle_burst', // パーティクル爆発
  RAINBOW_TRAIL = 'rainbow_trail', // 虹色軌跡
  DISTORTION = 'distortion', // 空間歪み
  CONSTELLATION = 'constellation', // 星座パターン
}

/**
 * 色設定
 */
export interface ColorConfig {
  primary: string; // メインカラー
  secondary?: string; // サブカラー
  accent?: string; // アクセントカラー
  alpha?: number; // 透明度 (0-1)
}

/**
 * パーティクル設定
 */
export interface ParticleConfig {
  count: number; // パーティクル数
  size: number; // サイズ
  speed: number; // 速度
  lifetime: number; // 生存時間
  color: ColorConfig; // 色設定
  spread: number; // 拡散角度
}

/**
 * アニメーション設定
 */
export interface AnimationConfig {
  duration: number; // アニメーション時間
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  loop: boolean; // ループするか
  reverse: boolean; // 逆再生するか
}

/**
 * ビジュアルエフェクト設定
 */
export interface VisualEffectConfig {
  type: BulletVisualEffectType;
  intensity: number; // 効果の強度 (0-1)
  color: ColorConfig;
  animation?: AnimationConfig;
  particles?: ParticleConfig;
  size?: number; // エフェクトサイズ倍率
  offset?: { x: number; y: number }; // オフセット
}

/**
 * 弾丸ビジュアル設定
 */
export interface BulletVisualConfig {
  // 基本設定
  baseColor: ColorConfig;
  size: number; // サイズ倍率
  shape: 'circle' | 'beam' | 'missile' | 'energy' | 'plasma';

  // エフェクト設定
  effects: VisualEffectConfig[];

  // 軌跡設定
  trail: {
    enabled: boolean;
    length: number;
    width: number;
    color: ColorConfig;
    fadeRate: number;
  };

  // パルス設定
  pulse: {
    enabled: boolean;
    frequency: number;
    amplitude: number;
    color?: ColorConfig;
  };

  // 回転設定
  rotation: {
    enabled: boolean;
    speed: number;
    direction: 'clockwise' | 'counter-clockwise';
  };
}

/**
 * 武器タイプ別ビジュアル設定
 */
export interface WeaponTypeVisualConfig {
  weaponType: WeaponType;
  baseVisual: BulletVisualConfig;
  rarityModifiers: Partial<Record<WeaponRarity, Partial<BulletVisualConfig>>>;
}

/**
 * エンチャント効果ビジュアル設定
 */
export interface EnchantmentVisualConfig {
  enchantmentType: EnchantmentType;
  visualModifier: Partial<BulletVisualConfig>;
  additionalEffects: VisualEffectConfig[];
  priority: number; // 複数エンチャント時の優先度
}

/**
 * 組み合わせ効果ビジュアル設定
 */
export interface ComboVisualConfig {
  enchantmentTypes: EnchantmentType[];
  name: string;
  description: string;
  visualOverride: Partial<BulletVisualConfig>;
  specialEffects: VisualEffectConfig[];
}

/**
 * 弾丸ビジュアル状態
 */
export interface BulletVisualState {
  config: BulletVisualConfig;
  animationTime: number;
  effectStates: Map<BulletVisualEffectType, number>;
  particleSystems: Map<string, ParticleSystem>;
}

/**
 * パーティクルシステム
 */
export interface ParticleSystem {
  particles: Particle[];
  config: ParticleConfig;
  lastEmitTime: number;
  active: boolean;
}

/**
 * パーティクル
 */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: ColorConfig;
  alpha: number;
}

/**
 * レンダリングコンテキスト
 */
export interface BulletRenderContext {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  deltaTime: number;
  globalAlpha: number;
}

/**
 * ビジュアル設定ビルダー
 */
export interface BulletVisualBuilder {
  setBaseColor(color: ColorConfig): BulletVisualBuilder;
  setSize(size: number): BulletVisualBuilder;
  setShape(shape: BulletVisualConfig['shape']): BulletVisualBuilder;
  addEffect(effect: VisualEffectConfig): BulletVisualBuilder;
  setTrail(config: BulletVisualConfig['trail']): BulletVisualBuilder;
  setPulse(config: BulletVisualConfig['pulse']): BulletVisualBuilder;
  setRotation(config: BulletVisualConfig['rotation']): BulletVisualBuilder;
  build(): BulletVisualConfig;
}

/**
 * 定数定義
 */
export const VISUAL_CONSTANTS = {
  // デフォルト値
  DEFAULT_SIZE: 1.0,
  DEFAULT_TRAIL_LENGTH: 8,
  DEFAULT_PULSE_FREQUENCY: 2.0,
  DEFAULT_ROTATION_SPEED: 0.2,

  // 制限値
  MAX_EFFECTS: 5,
  MAX_PARTICLES: 100,
  MAX_TRAIL_LENGTH: 20,

  // アニメーション
  ANIMATION_SPEED_MULTIPLIER: 1.0,
  EFFECT_FADE_RATE: 0.95,

  // 色
  DEFAULT_ALPHA: 0.8,
  GLOW_ALPHA: 0.4,
  TRAIL_ALPHA: 0.6,
} as const;

/**
 * 武器タイプ別デフォルト色
 */
export const WEAPON_TYPE_COLORS = {
  [WeaponType.BASIC_LASER]: { primary: '#00aaff', secondary: '#ffffff' },
  [WeaponType.PLASMA_CANNON]: { primary: '#aa00ff', secondary: '#ff00aa' },
  [WeaponType.ENERGY_BEAM]: { primary: '#ffaa00', secondary: '#ffffff' },
  [WeaponType.EXPLOSIVE_ROUNDS]: { primary: '#ff4400', secondary: '#ffaa00' },
  [WeaponType.HOMING_MISSILES]: { primary: '#0088ff', secondary: '#00ffff' },
  [WeaponType.SPLIT_SHOT]: { primary: '#88ff00', secondary: '#ffffff' },
  [WeaponType.RAPID_FIRE]: { primary: '#ff8800', secondary: '#ffff00' },
  [WeaponType.MISSILE_LAUNCHER]: { primary: '#666666', secondary: '#ff4400' },
} as const;

/**
 * エンチャント効果色
 */
export const ENCHANTMENT_COLORS = {
  [EnchantmentType.DAMAGE_BOOST]: { primary: '#ff0000', accent: '#ffaaaa' },
  [EnchantmentType.FIRE_RATE_BOOST]: { primary: '#ffff00', accent: '#ffffff' },
  [EnchantmentType.PIERCING]: { primary: '#ffffff', accent: '#aaaaff' },
  [EnchantmentType.EXPLOSIVE_ROUNDS]: { primary: '#ff4400', accent: '#ffaa00' },
  [EnchantmentType.HOMING_BULLETS]: { primary: '#0088ff', accent: '#00ffff' },
  [EnchantmentType.CRITICAL_HIT]: { primary: '#ffaa00', accent: '#ffffff' },
  [EnchantmentType.CHAIN_LIGHTNING]: { primary: '#8800ff', accent: '#ffffff' },
  [EnchantmentType.FREEZE_EFFECT]: { primary: '#00ffff', accent: '#aaffff' },
} as const;
