export type GameConstants = {
  readonly CANVAS: {
    readonly WIDTH: number;
    readonly HEIGHT: number;
  };
  readonly PLAYER: {
    readonly WIDTH: number;
    readonly HEIGHT: number;
    readonly MAX_SPEED: number;
    readonly ACCELERATION: number;
    readonly DECELERATION: number;
    readonly MAX_HEALTH: number;
    readonly INVINCIBILITY_TIME: number;
    readonly FIRE_RATE: number;
    readonly COLORS: {
      readonly PRIMARY: string;
      readonly SECONDARY: string;
      readonly ACCENT: string;
      readonly ENGINE: string;
    };
  };
  readonly BULLET: {
    readonly WIDTH: number;
    readonly HEIGHT: number;
    readonly SPEED: number;
  };
  readonly ENEMY: {
    readonly SPAWN_INTERVAL: number;
    readonly TYPES: {
      readonly [key in EnemyType]: {
        readonly width: number;
        readonly height: number;
        readonly speed: number;
        readonly health: number;
        readonly score: number;
        readonly color: string;
      };
    };
  };
  readonly BOSS: {
    readonly WIDTH: number;
    readonly HEIGHT: number;
    readonly BULLET_SPEED: number;
    readonly FIRE_RATE: number;
    readonly INITIAL_HEALTH: number;
    readonly INITIAL_SPEED: number;
    readonly MOVEMENT_SPEED: number;
  };
  readonly POWERUP: {
    readonly WIDTH: number;
    readonly HEIGHT: number;
    readonly SPEED: number;
    readonly DURATION: number;
    readonly SPAWN_CHANCE: number;
    readonly TYPES: {
      readonly [key in PowerUpType]: {
        readonly color: string;
        readonly effect:
          | ((player: import('../interfaces/IPlayer').IPlayer) => void)
          | null;
      };
    };
  };
  readonly EXPLOSION: {
    readonly DURATION: number;
  };
  readonly BACKGROUND: {
    readonly STAR_COUNT: number;
    readonly PLANET_COUNT: number;
    readonly NEBULA_COUNT: number;
  };
  readonly WAVE: {
    readonly SYSTEM_ENABLED: boolean;
    readonly CLEAR_BONUS_MULTIPLIER: number;
    readonly FORMATION_SPACING: number;
    readonly SPAWN_DELAY_BASE: number;
    readonly WAVE_CLEAR_DELAY: number;
  };
};

export type EnemyType = 'SMALL' | 'MEDIUM' | 'LARGE';
export type PowerUpType = 'RAPID_FIRE' | 'TRIPLE_SHOT' | 'SHIELD';
export type MovementPattern = 'straight' | 'zigzag' | 'sine';
export type FormationType =
  | 'line'
  | 'vformation'
  | 'circle'
  | 'diamond'
  | 'arrow';
export type Vector2D = {
  x: number;
  y: number;
};

// 新ボス関連の型定義
export type BossType =
  | 'BASIC'
  | 'ASSAULT_CRUISER'
  | 'SHIELD_GUARDIAN'
  | 'STORM_INTERCEPTOR';

export type BossPhase = 1 | 2 | 3;

export type BossMovementPattern = 'horizontal' | 'zigzag' | 'circle' | 'storm';

// 新しい弾丸タイプ
export type AdvancedBulletType =
  | 'EXPLOSIVE'
  | 'HOMING'
  | 'REFLECTING'
  | 'SPLIT';

// ボス設定インターface
export interface BossConfig {
  type: BossType;
  waveRange: {
    min: number;
    max: number;
  };
  stats: {
    health: number;
    speed: number;
    attackPower: number;
    size: {
      width: number;
      height: number;
    };
  };
  phases: BossPhaseConfig[];
}

export interface BossPhaseConfig {
  phase: BossPhase;
  healthThreshold: number; // 体力パーセンテージ
  attackPattern: string;
  attackInterval: number;
  movementPattern: BossMovementPattern;
  specialAbilities?: string[];
}

// シールド関連
export interface ShieldConfig {
  health: number;
  maxHealth: number;
  isActive: boolean;
  rotation: number;
  pulsePhase: number;
}

// 分身関連
export interface CloneConfig {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  isActive: boolean;
  movePattern: number;
  lastFireTime: number;
  trailEffect: Array<{ x: number; y: number; alpha: number }>;
}

export interface WaveEnemyConfig {
  type: EnemyType;
  count: number;
  formation: FormationType;
  delay: number; // スポーン間の遅延（ミリ秒）
  offsetX?: number; // フォーメーションのX軸オフセット
  offsetY?: number; // フォーメーションのY軸オフセット
}

export interface WaveConfig {
  id: number;
  name: string;
  enemies: WaveEnemyConfig[];
  bonusScore: number;
  nextWaveDelay: number; // 次のウェーブまでの間隔（ミリ秒）
}
