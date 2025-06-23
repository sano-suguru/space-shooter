import {
  AppearanceConfig,
  EnemyStats,
  BehaviorConfig,
  AttackAbility,
} from '../systems/types/EnemyGeneration';
import { EnemyType } from '../types';

// カラーパレット
export const COLOR_PALETTES = {
  // 基本色
  BASIC: [
    '#7c4dff', // 紫
    '#26c6da', // シアン
    '#66bb6a', // グリーン
    '#ff7043', // オレンジ
    '#42a5f5', // ブルー
  ],
  // アクセント色
  ACCENT: [
    '#ffffff', // ホワイト
    '#ffeb3b', // イエロー
    '#e91e63', // ピンク
    '#00bcd4', // ライトシアン
    '#8bc34a', // ライトグリーン
  ],
  // セカンダリ色
  SECONDARY: [
    '#1a237e', // 濃紺
    '#3f51b5', // 紺碧
    '#4a148c', // 濃紫
    '#1b5e20', // 濃緑
    '#bf360c', // 濃オレンジ
  ],
};

// 基本形状の定義
export const BASE_SHAPES: AppearanceConfig['baseShape'][] = [
  'hexagon',
  'triangle',
  'octagon',
  'star',
  'diamond',
];

// 敵タイプ別のベース設定
export const ENEMY_BASE_TEMPLATES: Record<
  EnemyType,
  {
    stats: EnemyStats;
    behavior: BehaviorConfig;
    attack: AttackAbility;
    appearance: Partial<AppearanceConfig>;
  }
> = {
  SMALL: {
    stats: {
      health: 1,
      speed: 120,
      attackPower: 1,
      defense: 0,
      fireRate: 2000,
      accuracy: 0.7,
      experienceReward: 5,
      scoreValue: 10,
    },
    behavior: {
      pattern: 'zigzag',
      aggressiveness: 0.3,
      flockingTendency: 0.6,
      environmentalAwareness: 0.4,
    },
    attack: {
      bulletType: 'single',
      bulletCount: 1,
      bulletSpeed: 150,
      specialEffects: [],
    },
    appearance: {
      baseShape: 'triangle',
      size: 0.9,
      glowIntensity: 0.6,
      animationSpeed: 1.2,
      trailEffect: true,
    },
  },
  MEDIUM: {
    stats: {
      health: 2,
      speed: 80,
      attackPower: 2,
      defense: 1,
      fireRate: 1500,
      accuracy: 0.8,
      experienceReward: 10,
      scoreValue: 20,
    },
    behavior: {
      pattern: 'sine',
      aggressiveness: 0.5,
      flockingTendency: 0.4,
      environmentalAwareness: 0.6,
    },
    attack: {
      bulletType: 'single',
      bulletCount: 1,
      bulletSpeed: 180,
      specialEffects: [],
    },
    appearance: {
      baseShape: 'hexagon',
      size: 1.0,
      glowIntensity: 0.7,
      animationSpeed: 1.0,
      trailEffect: false,
    },
  },
  LARGE: {
    stats: {
      health: 3,
      speed: 40,
      attackPower: 3,
      defense: 2,
      fireRate: 1000,
      accuracy: 0.9,
      experienceReward: 20,
      scoreValue: 30,
    },
    behavior: {
      pattern: 'straight',
      aggressiveness: 0.7,
      flockingTendency: 0.2,
      environmentalAwareness: 0.8,
    },
    attack: {
      bulletType: 'spread',
      bulletCount: 3,
      bulletSpeed: 120,
      specialEffects: [],
    },
    appearance: {
      baseShape: 'octagon',
      size: 1.3,
      glowIntensity: 0.8,
      animationSpeed: 0.8,
      trailEffect: false,
    },
  },
};

// ランダム生成用の変動範囲
export const VARIATION_RANGES = {
  stats: {
    health: { min: 0.8, max: 1.3 },
    speed: { min: 0.7, max: 1.4 },
    attackPower: { min: 0.9, max: 1.2 },
    defense: { min: 0.8, max: 1.5 },
    fireRate: { min: 0.6, max: 1.5 },
    accuracy: { min: 0.9, max: 1.1 },
    experienceReward: { min: 1.0, max: 1.5 },
    scoreValue: { min: 1.0, max: 1.5 },
  },
  appearance: {
    size: { min: 0.9, max: 1.3 },
    glowIntensity: { min: 0.3, max: 1.0 },
    animationSpeed: { min: 0.5, max: 2.0 },
  },
  behavior: {
    aggressiveness: { min: 0.0, max: 1.0 },
    flockingTendency: { min: 0.0, max: 1.0 },
    environmentalAwareness: { min: 0.0, max: 1.0 },
  },
};

// 特殊能力の出現確率（レベル依存）
export const SPECIAL_ABILITY_CHANCES = {
  piercing: 0.05, // 5%
  explosive: 0.03, // 3%
  slowing: 0.04, // 4%
  splitting: 0.02, // 2%
};

// エリート敵の設定
export const ELITE_MODIFIERS = {
  stats: {
    healthMultiplier: 2.5,
    speedMultiplier: 1.2,
    attackMultiplier: 1.5,
    defenseMultiplier: 2.0,
    experienceMultiplier: 3.0,
    scoreMultiplier: 5.0,
  },
  appearance: {
    sizeMultiplier: 1.2,
    glowIntensityBonus: 0.3,
    specialEffects: ['enhanced_glow', 'particle_trail'],
  },
  behavior: {
    aggressivenessBonus: 0.3,
    leadershipChance: 0.8,
  },
};

// 新しい行動パターンの設定
export const ADVANCED_BEHAVIOR_PATTERNS = {
  spiral: {
    spiralRadius: 50,
    spiralSpeed: 2.0,
    centerGravity: 0.3,
  },
  aggressive_chase: {
    chaseSpeed: 1.5,
    attackRange: 100,
    retreatThreshold: 0.3,
  },
};

// 攻撃パターンの詳細設定
export const ATTACK_PATTERNS = {
  spread: {
    angleSpread: Math.PI / 4, // 45度
    bulletSpacing: Math.PI / 8, // 22.5度間隔
  },
  burst: {
    burstCount: 3,
    burstInterval: 100, // ms
    burstSpread: Math.PI / 6, // 30度
  },
  homing: {
    homingStrength: 0.02,
    homingRange: 150,
    maxTurnRate: Math.PI / 30, // 6度/フレーム
  },
};
