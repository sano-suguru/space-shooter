/**
 * 弾丸ビジュアル設定データ
 *
 * 武器タイプ別の弾丸ビジュアル設定とエンチャント効果による視覚変化を定義します。
 */

import {
  BulletVisualConfig,
  BulletVisualEffectType,
  ComboVisualConfig,
  EnchantmentVisualConfig,
  ENCHANTMENT_COLORS,
  VISUAL_CONSTANTS,
  WEAPON_TYPE_COLORS,
  WeaponTypeVisualConfig,
} from '../types/BulletVisualTypes';
import { EnchantmentType } from '../types/EnchantmentTypes';
import { WeaponRarity, WeaponType } from '../types/WeaponTypes';

/**
 * 基本レーザー武器のビジュアル設定
 */
const BASIC_LASER_VISUAL: BulletVisualConfig = {
  baseColor: {
    primary: WEAPON_TYPE_COLORS[WeaponType.BASIC_LASER].primary,
    secondary: WEAPON_TYPE_COLORS[WeaponType.BASIC_LASER].secondary,
    alpha: VISUAL_CONSTANTS.DEFAULT_ALPHA,
  },
  size: VISUAL_CONSTANTS.DEFAULT_SIZE,
  shape: 'beam',
  effects: [
    {
      type: BulletVisualEffectType.GLOW,
      intensity: 0.6,
      color: {
        primary: WEAPON_TYPE_COLORS[WeaponType.BASIC_LASER].primary,
        alpha: VISUAL_CONSTANTS.GLOW_ALPHA,
      },
    },
  ],
  trail: {
    enabled: true,
    length: VISUAL_CONSTANTS.DEFAULT_TRAIL_LENGTH,
    width: 2,
    color: {
      primary: WEAPON_TYPE_COLORS[WeaponType.BASIC_LASER].primary,
      alpha: VISUAL_CONSTANTS.TRAIL_ALPHA,
    },
    fadeRate: VISUAL_CONSTANTS.EFFECT_FADE_RATE,
  },
  pulse: {
    enabled: false,
    frequency: VISUAL_CONSTANTS.DEFAULT_PULSE_FREQUENCY,
    amplitude: 0.2,
  },
  rotation: {
    enabled: false,
    speed: VISUAL_CONSTANTS.DEFAULT_ROTATION_SPEED,
    direction: 'clockwise',
  },
};

/**
 * プラズマキャノンのビジュアル設定
 */
const PLASMA_CANNON_VISUAL: BulletVisualConfig = {
  baseColor: {
    primary: WEAPON_TYPE_COLORS[WeaponType.PLASMA_CANNON].primary,
    secondary: WEAPON_TYPE_COLORS[WeaponType.PLASMA_CANNON].secondary,
    alpha: VISUAL_CONSTANTS.DEFAULT_ALPHA,
  },
  size: 1.5,
  shape: 'plasma',
  effects: [
    {
      type: BulletVisualEffectType.PULSE,
      intensity: 0.8,
      color: {
        primary: WEAPON_TYPE_COLORS[WeaponType.PLASMA_CANNON].primary,
        alpha: 0.7,
      },
      animation: {
        duration: 1000,
        easing: 'ease-in-out',
        loop: true,
        reverse: true,
      },
    },
    {
      type: BulletVisualEffectType.ENERGY_AURA,
      intensity: 0.5,
      color: {
        primary: WEAPON_TYPE_COLORS[WeaponType.PLASMA_CANNON].secondary,
        alpha: 0.4,
      },
    },
  ],
  trail: {
    enabled: true,
    length: 6,
    width: 4,
    color: {
      primary: WEAPON_TYPE_COLORS[WeaponType.PLASMA_CANNON].primary,
      alpha: 0.5,
    },
    fadeRate: 0.9,
  },
  pulse: {
    enabled: true,
    frequency: 3.0,
    amplitude: 0.4,
    color: {
      primary: WEAPON_TYPE_COLORS[WeaponType.PLASMA_CANNON].secondary,
      alpha: 0.6,
    },
  },
  rotation: {
    enabled: true,
    speed: 0.1,
    direction: 'clockwise',
  },
};

/**
 * エネルギービームのビジュアル設定
 */
const ENERGY_BEAM_VISUAL: BulletVisualConfig = {
  baseColor: {
    primary: WEAPON_TYPE_COLORS[WeaponType.ENERGY_BEAM].primary,
    secondary: WEAPON_TYPE_COLORS[WeaponType.ENERGY_BEAM].secondary,
    alpha: VISUAL_CONSTANTS.DEFAULT_ALPHA,
  },
  size: 1.2,
  shape: 'energy',
  effects: [
    {
      type: BulletVisualEffectType.SPARKLE,
      intensity: 0.9,
      color: {
        primary: '#ffffff',
        alpha: 0.8,
      },
      particles: {
        count: 6,
        size: 2,
        speed: 50,
        lifetime: 500,
        color: {
          primary: WEAPON_TYPE_COLORS[WeaponType.ENERGY_BEAM].secondary,
          alpha: 0.7,
        },
        spread: Math.PI / 3,
      },
    },
  ],
  trail: {
    enabled: true,
    length: 10,
    width: 3,
    color: {
      primary: WEAPON_TYPE_COLORS[WeaponType.ENERGY_BEAM].primary,
      alpha: 0.6,
    },
    fadeRate: 0.92,
  },
  pulse: {
    enabled: false,
    frequency: 2.0,
    amplitude: 0.3,
  },
  rotation: {
    enabled: true,
    speed: 0.3,
    direction: 'counter-clockwise',
  },
};

/**
 * 爆発弾のビジュアル設定
 */
const EXPLOSIVE_ROUNDS_VISUAL: BulletVisualConfig = {
  baseColor: {
    primary: WEAPON_TYPE_COLORS[WeaponType.EXPLOSIVE_ROUNDS].primary,
    secondary: WEAPON_TYPE_COLORS[WeaponType.EXPLOSIVE_ROUNDS].secondary,
    alpha: VISUAL_CONSTANTS.DEFAULT_ALPHA,
  },
  size: 1.3,
  shape: 'circle',
  effects: [
    {
      type: BulletVisualEffectType.ENERGY_AURA,
      intensity: 0.7,
      color: {
        primary: '#ff4400',
        alpha: 0.5,
      },
    },
    {
      type: BulletVisualEffectType.PULSE,
      intensity: 0.6,
      color: {
        primary: '#ffaa00',
        alpha: 0.4,
      },
      animation: {
        duration: 800,
        easing: 'ease-in-out',
        loop: true,
        reverse: true,
      },
    },
  ],
  trail: {
    enabled: true,
    length: 8,
    width: 3,
    color: {
      primary: '#ff6600',
      alpha: 0.7,
    },
    fadeRate: 0.88,
  },
  pulse: {
    enabled: true,
    frequency: 4.0,
    amplitude: 0.3,
    color: {
      primary: '#ffaa00',
      alpha: 0.5,
    },
  },
  rotation: {
    enabled: false,
    speed: 0.2,
    direction: 'clockwise',
  },
};

/**
 * 追尾ミサイルのビジュアル設定
 */
const HOMING_MISSILES_VISUAL: BulletVisualConfig = {
  baseColor: {
    primary: WEAPON_TYPE_COLORS[WeaponType.HOMING_MISSILES].primary,
    secondary: WEAPON_TYPE_COLORS[WeaponType.HOMING_MISSILES].secondary,
    alpha: VISUAL_CONSTANTS.DEFAULT_ALPHA,
  },
  size: 1.1,
  shape: 'missile',
  effects: [
    {
      type: BulletVisualEffectType.TRAIL,
      intensity: 0.8,
      color: {
        primary: '#00ffff',
        alpha: 0.6,
      },
    },
  ],
  trail: {
    enabled: true,
    length: 12,
    width: 2,
    color: {
      primary: WEAPON_TYPE_COLORS[WeaponType.HOMING_MISSILES].secondary,
      alpha: 0.8,
    },
    fadeRate: 0.95,
  },
  pulse: {
    enabled: false,
    frequency: 2.0,
    amplitude: 0.2,
  },
  rotation: {
    enabled: false,
    speed: 0.1,
    direction: 'clockwise',
  },
};

/**
 * 分裂弾のビジュアル設定
 */
const SPLIT_SHOT_VISUAL: BulletVisualConfig = {
  baseColor: {
    primary: WEAPON_TYPE_COLORS[WeaponType.SPLIT_SHOT].primary,
    secondary: WEAPON_TYPE_COLORS[WeaponType.SPLIT_SHOT].secondary,
    alpha: VISUAL_CONSTANTS.DEFAULT_ALPHA,
  },
  size: 1.0,
  shape: 'energy',
  effects: [
    {
      type: BulletVisualEffectType.SPARKLE,
      intensity: 0.7,
      color: {
        primary: '#ffffff',
        alpha: 0.9,
      },
      particles: {
        count: 4,
        size: 1,
        speed: 30,
        lifetime: 300,
        color: {
          primary: WEAPON_TYPE_COLORS[WeaponType.SPLIT_SHOT].primary,
          alpha: 0.8,
        },
        spread: Math.PI / 4,
      },
    },
  ],
  trail: {
    enabled: true,
    length: 6,
    width: 2,
    color: {
      primary: WEAPON_TYPE_COLORS[WeaponType.SPLIT_SHOT].primary,
      alpha: 0.6,
    },
    fadeRate: 0.9,
  },
  pulse: {
    enabled: true,
    frequency: 5.0,
    amplitude: 0.2,
    color: {
      primary: '#ffffff',
      alpha: 0.7,
    },
  },
  rotation: {
    enabled: true,
    speed: 0.4,
    direction: 'clockwise',
  },
};

/**
 * 速射砲のビジュアル設定
 */
const RAPID_FIRE_VISUAL: BulletVisualConfig = {
  baseColor: {
    primary: WEAPON_TYPE_COLORS[WeaponType.RAPID_FIRE].primary,
    secondary: WEAPON_TYPE_COLORS[WeaponType.RAPID_FIRE].secondary,
    alpha: VISUAL_CONSTANTS.DEFAULT_ALPHA,
  },
  size: 0.8,
  shape: 'beam',
  effects: [
    {
      type: BulletVisualEffectType.TRAIL,
      intensity: 0.9,
      color: {
        primary: WEAPON_TYPE_COLORS[WeaponType.RAPID_FIRE].secondary,
        alpha: 0.7,
      },
    },
  ],
  trail: {
    enabled: true,
    length: 15,
    width: 1,
    color: {
      primary: WEAPON_TYPE_COLORS[WeaponType.RAPID_FIRE].primary,
      alpha: 0.8,
    },
    fadeRate: 0.96,
  },
  pulse: {
    enabled: false,
    frequency: 1.0,
    amplitude: 0.1,
  },
  rotation: {
    enabled: false,
    speed: 0.5,
    direction: 'clockwise',
  },
};

/**
 * ミサイルランチャーのビジュアル設定
 */
const MISSILE_LAUNCHER_VISUAL: BulletVisualConfig = {
  baseColor: {
    primary: WEAPON_TYPE_COLORS[WeaponType.MISSILE_LAUNCHER].primary,
    secondary: WEAPON_TYPE_COLORS[WeaponType.MISSILE_LAUNCHER].secondary,
    alpha: VISUAL_CONSTANTS.DEFAULT_ALPHA,
  },
  size: 1.8,
  shape: 'missile',
  effects: [
    {
      type: BulletVisualEffectType.FLAME_TRAIL,
      intensity: 0.8,
      color: {
        primary: '#ff4400',
        secondary: '#ffaa00',
        alpha: 0.7,
      },
      particles: {
        count: 8,
        size: 3,
        speed: 80,
        lifetime: 400,
        color: {
          primary: '#ff6600',
          alpha: 0.6,
        },
        spread: Math.PI / 6,
      },
    },
  ],
  trail: {
    enabled: true,
    length: 10,
    width: 4,
    color: {
      primary: '#ff4400',
      alpha: 0.6,
    },
    fadeRate: 0.85,
  },
  pulse: {
    enabled: false,
    frequency: 2.0,
    amplitude: 0.3,
  },
  rotation: {
    enabled: false,
    speed: 0.1,
    direction: 'clockwise',
  },
};

/**
 * 武器タイプ別ビジュアル設定
 */
export const WEAPON_TYPE_VISUAL_CONFIGS: WeaponTypeVisualConfig[] = [
  {
    weaponType: WeaponType.BASIC_LASER,
    baseVisual: BASIC_LASER_VISUAL,
    rarityModifiers: {
      [WeaponRarity.UNCOMMON]: {
        size: 1.1,
        effects: [
          {
            type: BulletVisualEffectType.GLOW,
            intensity: 0.7,
            color: { primary: '#00ff00', alpha: 0.5 },
          },
        ],
      },
      [WeaponRarity.RARE]: {
        size: 1.2,
        effects: [
          {
            type: BulletVisualEffectType.GLOW,
            intensity: 0.8,
            color: { primary: '#0080ff', alpha: 0.6 },
          },
          {
            type: BulletVisualEffectType.SPARKLE,
            intensity: 0.5,
            color: { primary: '#ffffff', alpha: 0.7 },
          },
        ],
      },
      [WeaponRarity.EPIC]: {
        size: 1.4,
        effects: [
          {
            type: BulletVisualEffectType.ENERGY_AURA,
            intensity: 0.9,
            color: { primary: '#8000ff', alpha: 0.7 },
          },
          {
            type: BulletVisualEffectType.SPARKLE,
            intensity: 0.7,
            color: { primary: '#ffffff', alpha: 0.8 },
          },
        ],
      },
      [WeaponRarity.LEGENDARY]: {
        size: 1.6,
        effects: [
          {
            type: BulletVisualEffectType.RAINBOW_TRAIL,
            intensity: 1.0,
            color: { primary: '#ff8000', alpha: 0.8 },
          },
          {
            type: BulletVisualEffectType.CONSTELLATION,
            intensity: 0.8,
            color: { primary: '#ffffff', alpha: 0.9 },
          },
        ],
      },
    },
  },
  {
    weaponType: WeaponType.PLASMA_CANNON,
    baseVisual: PLASMA_CANNON_VISUAL,
    rarityModifiers: {
      [WeaponRarity.RARE]: {
        pulse: {
          enabled: true,
          frequency: 4.0,
          amplitude: 0.5,
          color: { primary: '#ff00ff', alpha: 0.7 },
        },
      },
      [WeaponRarity.EPIC]: {
        effects: [
          {
            type: BulletVisualEffectType.ELECTRIC_ARC,
            intensity: 0.8,
            color: { primary: '#8000ff', alpha: 0.6 },
          },
        ],
      },
      [WeaponRarity.LEGENDARY]: {
        effects: [
          {
            type: BulletVisualEffectType.DISTORTION,
            intensity: 0.9,
            color: { primary: '#ff8000', alpha: 0.8 },
          },
        ],
      },
    },
  },
  {
    weaponType: WeaponType.ENERGY_BEAM,
    baseVisual: ENERGY_BEAM_VISUAL,
    rarityModifiers: {},
  },
  {
    weaponType: WeaponType.EXPLOSIVE_ROUNDS,
    baseVisual: EXPLOSIVE_ROUNDS_VISUAL,
    rarityModifiers: {},
  },
  {
    weaponType: WeaponType.HOMING_MISSILES,
    baseVisual: HOMING_MISSILES_VISUAL,
    rarityModifiers: {},
  },
  {
    weaponType: WeaponType.SPLIT_SHOT,
    baseVisual: SPLIT_SHOT_VISUAL,
    rarityModifiers: {},
  },
  {
    weaponType: WeaponType.RAPID_FIRE,
    baseVisual: RAPID_FIRE_VISUAL,
    rarityModifiers: {},
  },
  {
    weaponType: WeaponType.MISSILE_LAUNCHER,
    baseVisual: MISSILE_LAUNCHER_VISUAL,
    rarityModifiers: {},
  },
];

/**
 * エンチャント効果ビジュアル設定
 */
export const ENCHANTMENT_VISUAL_CONFIGS: EnchantmentVisualConfig[] = [
  {
    enchantmentType: EnchantmentType.DAMAGE_BOOST,
    priority: 1,
    visualModifier: {
      size: 1.2,
      baseColor: {
        primary: ENCHANTMENT_COLORS[EnchantmentType.DAMAGE_BOOST].primary,
        accent: ENCHANTMENT_COLORS[EnchantmentType.DAMAGE_BOOST].accent,
        alpha: 0.9,
      },
    },
    additionalEffects: [
      {
        type: BulletVisualEffectType.GLOW,
        intensity: 0.8,
        color: {
          primary: ENCHANTMENT_COLORS[EnchantmentType.DAMAGE_BOOST].primary,
          alpha: 0.6,
        },
      },
    ],
  },
  {
    enchantmentType: EnchantmentType.FIRE_RATE_BOOST,
    priority: 2,
    visualModifier: {
      trail: {
        enabled: true,
        length: 20,
        width: 3,
        color: {
          primary: ENCHANTMENT_COLORS[EnchantmentType.FIRE_RATE_BOOST].primary,
          alpha: 0.8,
        },
        fadeRate: 0.98,
      },
    },
    additionalEffects: [
      {
        type: BulletVisualEffectType.TRAIL,
        intensity: 0.9,
        color: {
          primary: ENCHANTMENT_COLORS[EnchantmentType.FIRE_RATE_BOOST].accent,
          alpha: 0.7,
        },
      },
    ],
  },
  {
    enchantmentType: EnchantmentType.PIERCING,
    priority: 3,
    visualModifier: {
      shape: 'beam',
      baseColor: {
        primary: ENCHANTMENT_COLORS[EnchantmentType.PIERCING].primary,
        accent: ENCHANTMENT_COLORS[EnchantmentType.PIERCING].accent,
        alpha: 0.9,
      },
    },
    additionalEffects: [
      {
        type: BulletVisualEffectType.SPARKLE,
        intensity: 0.8,
        color: {
          primary: '#ffffff',
          alpha: 0.9,
        },
        particles: {
          count: 8,
          size: 2,
          speed: 60,
          lifetime: 400,
          color: {
            primary: ENCHANTMENT_COLORS[EnchantmentType.PIERCING].accent,
            alpha: 0.8,
          },
          spread: Math.PI / 4,
        },
      },
    ],
  },
  {
    enchantmentType: EnchantmentType.EXPLOSIVE_ROUNDS,
    priority: 4,
    visualModifier: {
      pulse: {
        enabled: true,
        frequency: 6.0,
        amplitude: 0.4,
        color: {
          primary: ENCHANTMENT_COLORS[EnchantmentType.EXPLOSIVE_ROUNDS].primary,
          alpha: 0.7,
        },
      },
    },
    additionalEffects: [
      {
        type: BulletVisualEffectType.ENERGY_AURA,
        intensity: 0.7,
        color: {
          primary: ENCHANTMENT_COLORS[EnchantmentType.EXPLOSIVE_ROUNDS].primary,
          alpha: 0.5,
        },
      },
    ],
  },
  {
    enchantmentType: EnchantmentType.HOMING_BULLETS,
    priority: 5,
    visualModifier: {
      trail: {
        enabled: true,
        length: 15,
        width: 2,
        color: {
          primary: ENCHANTMENT_COLORS[EnchantmentType.HOMING_BULLETS].primary,
          alpha: 0.8,
        },
        fadeRate: 0.95,
      },
    },
    additionalEffects: [
      {
        type: BulletVisualEffectType.TRAIL,
        intensity: 0.8,
        color: {
          primary: ENCHANTMENT_COLORS[EnchantmentType.HOMING_BULLETS].accent,
          alpha: 0.6,
        },
      },
    ],
  },
  {
    enchantmentType: EnchantmentType.CRITICAL_HIT,
    priority: 6,
    visualModifier: {
      baseColor: {
        primary: ENCHANTMENT_COLORS[EnchantmentType.CRITICAL_HIT].primary,
        accent: ENCHANTMENT_COLORS[EnchantmentType.CRITICAL_HIT].accent,
        alpha: 0.9,
      },
    },
    additionalEffects: [
      {
        type: BulletVisualEffectType.SPARKLE,
        intensity: 1.0,
        color: {
          primary: ENCHANTMENT_COLORS[EnchantmentType.CRITICAL_HIT].accent,
          alpha: 0.9,
        },
        particles: {
          count: 12,
          size: 3,
          speed: 80,
          lifetime: 600,
          color: {
            primary: ENCHANTMENT_COLORS[EnchantmentType.CRITICAL_HIT].primary,
            alpha: 0.8,
          },
          spread: Math.PI / 2,
        },
      },
    ],
  },
  {
    enchantmentType: EnchantmentType.CHAIN_LIGHTNING,
    priority: 7,
    visualModifier: {
      rotation: {
        enabled: true,
        speed: 0.5,
        direction: 'counter-clockwise',
      },
    },
    additionalEffects: [
      {
        type: BulletVisualEffectType.ELECTRIC_ARC,
        intensity: 0.9,
        color: {
          primary: ENCHANTMENT_COLORS[EnchantmentType.CHAIN_LIGHTNING].primary,
          alpha: 0.8,
        },
      },
    ],
  },
  {
    enchantmentType: EnchantmentType.FREEZE_EFFECT,
    priority: 8,
    visualModifier: {
      baseColor: {
        primary: ENCHANTMENT_COLORS[EnchantmentType.FREEZE_EFFECT].primary,
        accent: ENCHANTMENT_COLORS[EnchantmentType.FREEZE_EFFECT].accent,
        alpha: 0.8,
      },
    },
    additionalEffects: [
      {
        type: BulletVisualEffectType.FROST_MIST,
        intensity: 0.7,
        color: {
          primary: ENCHANTMENT_COLORS[EnchantmentType.FREEZE_EFFECT].accent,
          alpha: 0.6,
        },
        particles: {
          count: 6,
          size: 2,
          speed: 40,
          lifetime: 800,
          color: {
            primary: ENCHANTMENT_COLORS[EnchantmentType.FREEZE_EFFECT].primary,
            alpha: 0.7,
          },
          spread: Math.PI / 3,
        },
      },
    ],
  },
];

/**
 * 組み合わせ効果ビジュアル設定
 */
export const COMBO_VISUAL_CONFIGS: ComboVisualConfig[] = [
  {
    name: '貫通爆発弾',
    description: '白い輝きと赤いオーラの組み合わせ',
    enchantmentTypes: [
      EnchantmentType.PIERCING,
      EnchantmentType.EXPLOSIVE_ROUNDS,
    ],
    visualOverride: {
      size: 1.5,
      baseColor: {
        primary: '#ffffff',
        secondary: '#ff4400',
        alpha: 0.9,
      },
    },
    specialEffects: [
      {
        type: BulletVisualEffectType.SPARKLE,
        intensity: 1.0,
        color: { primary: '#ffffff', alpha: 0.9 },
      },
      {
        type: BulletVisualEffectType.ENERGY_AURA,
        intensity: 0.8,
        color: { primary: '#ff4400', alpha: 0.6 },
      },
    ],
  },
  {
    name: '追尾分裂弾',
    description: '青い軌跡と緑の光点の組み合わせ',
    enchantmentTypes: [
      EnchantmentType.HOMING_BULLETS,
      EnchantmentType.MULTI_SPLIT,
    ],
    visualOverride: {
      size: 1.3,
      trail: {
        enabled: true,
        length: 18,
        width: 3,
        color: { primary: '#0088ff', alpha: 0.8 },
        fadeRate: 0.96,
      },
    },
    specialEffects: [
      {
        type: BulletVisualEffectType.TRAIL,
        intensity: 0.9,
        color: { primary: '#00ffff', alpha: 0.7 },
      },
      {
        type: BulletVisualEffectType.SPARKLE,
        intensity: 0.8,
        color: { primary: '#88ff00', alpha: 0.8 },
      },
    ],
  },
  {
    name: 'クリティカル連鎖',
    description: '金色の輝きと紫の電気アーク',
    enchantmentTypes: [
      EnchantmentType.CRITICAL_HIT,
      EnchantmentType.CHAIN_LIGHTNING,
    ],
    visualOverride: {
      size: 1.4,
      baseColor: {
        primary: '#ffaa00',
        secondary: '#8000ff',
        alpha: 0.9,
      },
    },
    specialEffects: [
      {
        type: BulletVisualEffectType.SPARKLE,
        intensity: 1.0,
        color: { primary: '#ffaa00', alpha: 0.9 },
      },
      {
        type: BulletVisualEffectType.ELECTRIC_ARC,
        intensity: 0.9,
        color: { primary: '#8000ff', alpha: 0.8 },
      },
    ],
  },
];

/**
 * 武器タイプ別ビジュアル設定取得
 */
export function getWeaponTypeVisualConfig(
  weaponType: WeaponType
): WeaponTypeVisualConfig | undefined {
  return WEAPON_TYPE_VISUAL_CONFIGS.find(
    config => config.weaponType === weaponType
  );
}

/**
 * エンチャント効果ビジュアル設定取得
 */
export function getEnchantmentVisualConfig(
  enchantmentType: EnchantmentType
): EnchantmentVisualConfig | undefined {
  return ENCHANTMENT_VISUAL_CONFIGS.find(
    config => config.enchantmentType === enchantmentType
  );
}

/**
 * 組み合わせ効果ビジュアル設定取得
 */
export function getComboVisualConfig(
  enchantmentTypes: EnchantmentType[]
): ComboVisualConfig | undefined {
  return COMBO_VISUAL_CONFIGS.find(
    config =>
      config.enchantmentTypes.length === enchantmentTypes.length &&
      config.enchantmentTypes.every(type => enchantmentTypes.includes(type))
  );
}
