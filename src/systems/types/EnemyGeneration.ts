import { EnemyType, Vector2D } from '../../types';

// 外見設定
export interface AppearanceConfig {
  baseShape: 'hexagon' | 'triangle' | 'octagon' | 'star' | 'diamond';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  size: number; // 0.8 - 1.5の範囲
  glowIntensity: number; // 0.0 - 1.0
  animationSpeed: number; // 0.5 - 2.0
  trailEffect: boolean;
}

// 能力値設定
export interface EnemyStats {
  health: number;
  speed: number;
  attackPower: number;
  defense: number;
  fireRate: number;
  accuracy: number;
  experienceReward: number;
  scoreValue: number;
}

// 行動設定
export type BehaviorPattern =
  | 'straight' // 直進
  | 'zigzag' // ジグザグ
  | 'sine' // サイン波
  | 'spiral' // 螺旋
  | 'aggressive_chase'; // 積極的追跡

export interface BehaviorConfig {
  pattern: BehaviorPattern;
  aggressiveness: number; // 0.0 - 1.0
  flockingTendency: number; // 0.0 - 1.0
  environmentalAwareness: number; // 0.0 - 1.0
}

// 攻撃能力設定
export interface AttackAbility {
  bulletType: 'single' | 'spread' | 'homing' | 'burst';
  bulletCount: number;
  bulletSpeed: number;
  specialEffects: SpecialEffect[];
}

export type SpecialEffect =
  | 'piercing' // 貫通
  | 'explosive' // 爆発
  | 'slowing' // 減速
  | 'splitting'; // 分裂

// 難易度調整
export interface DifficultyFactors {
  playerLevel: number;
  currentWave: number;
  baseMultiplier: number;
  levelScaling: number;
  waveScaling: number;
}

export interface DifficultyModifiers {
  healthMultiplier: number;
  speedMultiplier: number;
  attackMultiplier: number;
  specialAbilityChance: number;
  eliteEnemyChance: number;
}

// 群れ行動
export interface FlockingRules {
  separationRadius: number; // 分離距離
  alignmentRadius: number; // 整列距離
  cohesionRadius: number; // 結束距離
  leaderFollowDistance: number; // リーダー追従距離
  maxFlockSize: number; // 最大群れサイズ
}

// 環境効果
export interface EnvironmentalEffect {
  triggerZone: 'nebula' | 'planet' | 'asteroid_field';
  effectType: 'speed_boost' | 'damage_boost' | 'shield_regen' | 'stealth';
  intensity: number;
  duration: number;
}

// 動的敵生成設定
export interface DynamicEnemyConfig {
  baseType: EnemyType;
  position: Vector2D;
  appearance: AppearanceConfig;
  stats: EnemyStats;
  behavior: BehaviorConfig;
  attack: AttackAbility;
  difficultyFactors?: DifficultyFactors;
  environmentalEffects?: EnvironmentalEffect[];
  isElite?: boolean;
  flockId?: string;
  leaderId?: string;
}

// 敵生成リクエスト
export interface EnemyGenerationRequest {
  baseType: EnemyType;
  position: Vector2D;
  difficultyFactors: DifficultyFactors;
  environmentalContext?: {
    nearbyObjects: string[];
    activeEffects: EnvironmentalEffect[];
  };
  flockingContext?: {
    existingFlocks: string[];
    preferredFlockSize: number;
  };
}
