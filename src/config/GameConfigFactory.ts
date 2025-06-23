import { z } from 'zod';

const GameConfigSchema = z.object({
  canvas: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  player: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    maxSpeed: z.number().positive(),
    acceleration: z.number().positive(),
    deceleration: z.number().positive(),
    maxHealth: z.number().positive(),
    invincibilityTime: z.number().positive(),
    fireRate: z.number().positive(),
    colors: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
      engine: z.string(),
    }),
  }),
  bullet: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    speed: z.number().positive(),
  }),
  enemy: z.object({
    spawnInterval: z.number().positive(),
    types: z.record(
      z.object({
        width: z.number().positive(),
        height: z.number().positive(),
        speed: z.number().positive(),
        health: z.number().positive(),
        score: z.number().positive(),
        color: z.string(),
      })
    ),
  }),
  powerup: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    speed: z.number().positive(),
    duration: z.number().positive(),
    spawnChance: z.number().min(0).max(1),
    types: z.record(
      z.object({
        color: z.string(),
      })
    ),
  }),
  boss: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    bulletSpeed: z.number().positive(),
    fireRate: z.number().positive(),
    initialHealth: z.number().positive(),
    initialSpeed: z.number().positive(),
    movementSpeed: z.number().positive(),
    // 新ボス設定
    assaultCruiser: z
      .object({
        health: z.number().positive(),
        speed: z.number().positive(),
        attackPower: z.number().positive(),
      })
      .optional(),
    shieldGuardian: z
      .object({
        health: z.number().positive(),
        speed: z.number().positive(),
        attackPower: z.number().positive(),
        shieldLayers: z.number().positive(),
      })
      .optional(),
    stormInterceptor: z
      .object({
        health: z.number().positive(),
        speed: z.number().positive(),
        attackPower: z.number().positive(),
        cloneCount: z.number().positive(),
      })
      .optional(),
  }),
  explosion: z.object({
    duration: z.number().positive(),
  }),
  background: z.object({
    starCount: z.number().positive(),
    planetCount: z.number().positive(),
    nebulaCount: z.number().positive(),
  }),
  wave: z.object({
    systemEnabled: z.boolean(),
    clearBonusMultiplier: z.number().positive(),
    formationSpacing: z.number().positive(),
    spawnDelayBase: z.number().positive(),
    waveClearDelay: z.number().positive(),
  }),
});

export type GameConfig = z.infer<typeof GameConfigSchema>;

// Deep partial type for nested configuration overrides
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export function createGameConfig(
  overrides?: DeepPartial<GameConfig>
): GameConfig {
  const defaultConfig = createDefaultConfig();
  const mergedConfig = deepMerge(defaultConfig, overrides ?? {});
  return validateConfig(mergedConfig);
}

function createDefaultConfig(): GameConfig {
  return {
    canvas: createCanvasConfig(),
    player: createPlayerConfig(),
    bullet: createBulletConfig(),
    enemy: createEnemyConfig(),
    powerup: createPowerUpConfig(),
    boss: createBossConfig(),
    explosion: createExplosionConfig(),
    background: createBackgroundConfig(),
    wave: createWaveConfig(),
  };
}

function createCanvasConfig(): GameConfig['canvas'] {
  return {
    width: 400,
    height: 600,
  };
}

function createPlayerConfig(): GameConfig['player'] {
  return {
    width: 50,
    height: 50,
    maxSpeed: 8,
    acceleration: 1.2,
    deceleration: 0.6,
    maxHealth: 100,
    invincibilityTime: 1000,
    fireRate: 200,
    colors: {
      primary: '#1a237e',
      secondary: '#3f51b5',
      accent: '#00bcd4',
      engine: '#ff9800',
    },
  };
}

function createBulletConfig(): GameConfig['bullet'] {
  return {
    width: 5, // 元のサイズに戻す（プレイヤー弾は動的に調整）
    height: 15, // 元のサイズに戻す（プレイヤー弾は動的に調整）
    speed: 600,
  };
}

function createEnemyConfig(): GameConfig['enemy'] {
  return {
    spawnInterval: 1000,
    types: {
      SMALL: {
        width: 30,
        height: 30,
        speed: 180,
        health: 1,
        score: 10,
        color: '#7c4dff',
      },
      MEDIUM: {
        width: 50,
        height: 50,
        speed: 120,
        health: 2,
        score: 20,
        color: '#26c6da',
      },
      LARGE: {
        width: 70,
        height: 70,
        speed: 60,
        health: 3,
        score: 30,
        color: '#66bb6a',
      },
    },
  };
}

function createPowerUpConfig(): GameConfig['powerup'] {
  return {
    width: 30,
    height: 30,
    speed: 100,
    duration: 10000,
    spawnChance: 0.05,
    types: {
      RAPID_FIRE: { color: '#66bb6a' },
      TRIPLE_SHOT: { color: '#7c4dff' },
      SHIELD: { color: '#26c6da' },
    },
  };
}

function createBossConfig(): GameConfig['boss'] {
  return {
    width: 150,
    height: 150,
    bulletSpeed: 200,
    fireRate: 1000,
    initialHealth: 50,
    initialSpeed: 50,
    movementSpeed: 50,
    // 新ボス設定のデフォルト値
    assaultCruiser: {
      health: 75,
      speed: 75, // 1.5倍速
      attackPower: 150, // 1.5倍攻撃力
    },
    shieldGuardian: {
      health: 100,
      speed: 40, // 0.8倍速
      attackPower: 150, // 1.5倍攻撃力
      shieldLayers: 3,
    },
    stormInterceptor: {
      health: 80,
      speed: 125, // 2.5倍速
      attackPower: 180, // 1.8倍攻撃力
      cloneCount: 3,
    },
  };
}

function createExplosionConfig(): GameConfig['explosion'] {
  return {
    duration: 30,
  };
}

function createBackgroundConfig(): GameConfig['background'] {
  return {
    starCount: 100,
    planetCount: 2,
    nebulaCount: 1,
  };
}

function createWaveConfig(): GameConfig['wave'] {
  return {
    systemEnabled: true,
    clearBonusMultiplier: 2,
    formationSpacing: 40,
    spawnDelayBase: 200,
    waveClearDelay: 2000,
  };
}

export function createTestConfig(
  testOverrides?: DeepPartial<GameConfig>
): GameConfig {
  const testDefaults: DeepPartial<GameConfig> = {
    player: {
      fireRate: 50, // テスト用高速化
      invincibilityTime: 100, // テスト用短縮
    },
    enemy: {
      spawnInterval: 100, // テスト用高速化
    },
    powerup: {
      duration: 1000, // テスト用短縮
      spawnChance: 1.0, // テスト用確実出現
    },
  };

  return createGameConfig(deepMerge(testDefaults, testOverrides ?? {}));
}

function deepMerge<T>(base: T, override: DeepPartial<T>): T {
  const result = { ...base };

  for (const key in override) {
    if (override[key] !== undefined) {
      const overrideValue = override[key];
      if (
        typeof overrideValue === 'object' &&
        overrideValue !== null &&
        !Array.isArray(overrideValue)
      ) {
        const baseValue = (result as Record<string, unknown>)[key as string];
        (result as Record<string, unknown>)[key as string] = deepMerge(
          baseValue ?? {},
          overrideValue as DeepPartial<unknown>
        );
      } else {
        (result as Record<string, unknown>)[key as string] = overrideValue;
      }
    }
  }

  return result;
}

function validateConfig(config: GameConfig): GameConfig {
  try {
    return GameConfigSchema.parse(config);
  } catch (error) {
    console.error('Invalid game configuration:', error);
    throw new Error('Game configuration validation failed');
  }
}
