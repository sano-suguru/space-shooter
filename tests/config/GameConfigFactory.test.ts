import { createGameConfig, createTestConfig, GameConfig } from '../../src/config/GameConfigFactory';

describe('GameConfigFactory', () => {
  describe('createGameConfig', () => {
    it('should create default configuration', () => {
      const config = createGameConfig();
      
      expect(config.canvas.width).toBe(400);
      expect(config.canvas.height).toBe(600);
      expect(config.player.maxHealth).toBe(100);
      expect(config.player.fireRate).toBe(200);
      expect(config.enemy.spawnInterval).toBe(1000);
    });

    it('should merge overrides with default configuration', () => {
      const overrides = {
        player: {
          maxHealth: 150,
          fireRate: 100
        },
        enemy: {
          spawnInterval: 500
        }
      };

      const config = createGameConfig(overrides);
      
      expect(config.player.maxHealth).toBe(150);
      expect(config.player.fireRate).toBe(100);
      expect(config.player.maxSpeed).toBe(8); // デフォルト値が保持される
      expect(config.enemy.spawnInterval).toBe(500);
      expect(config.canvas.width).toBe(400); // 他の設定は影響を受けない
    });

    it('should handle nested object overrides', () => {
      const overrides = {
        player: {
          colors: {
            primary: '#ff0000'
          }
        }
      };

      const config = createGameConfig(overrides);
      
      expect(config.player.colors.primary).toBe('#ff0000');
      expect(config.player.colors.secondary).toBe('#3f51b5'); // 他の色は保持される
    });

    it('should handle enemy types overrides', () => {
      const overrides = {
        enemy: {
          types: {
            SMALL: {
              health: 2,
              score: 20
            }
          }
        }
      };

      const config = createGameConfig(overrides);
      
      expect(config.enemy.types.SMALL.health).toBe(2);
      expect(config.enemy.types.SMALL.score).toBe(20);
      expect(config.enemy.types.SMALL.width).toBe(30); // 他のプロパティは保持される
      expect(config.enemy.types.MEDIUM).toBeDefined(); // 他のタイプも保持される
    });

    it('should validate configuration and throw error for invalid values', () => {
      const invalidOverrides = {
        player: {
          maxHealth: -10 // 負の値は無効
        }
      };

      expect(() => createGameConfig(invalidOverrides)).toThrow('Game configuration validation failed');
    });
  });

  describe('createTestConfig', () => {
    it('should create test configuration with optimized values', () => {
      const config = createTestConfig();
      
      expect(config.player.fireRate).toBe(50); // テスト用高速化
      expect(config.player.invincibilityTime).toBe(100); // テスト用短縮
      expect(config.enemy.spawnInterval).toBe(100); // テスト用高速化
      expect(config.powerup.duration).toBe(1000); // テスト用短縮
      expect(config.powerup.spawnChance).toBe(1.0); // テスト用確実出現
    });

    it('should merge test overrides with test defaults', () => {
      const testOverrides = {
        player: {
          maxHealth: 50
        },
        canvas: {
          width: 800
        }
      };

      const config = createTestConfig(testOverrides);
      
      expect(config.player.maxHealth).toBe(50);
      expect(config.player.fireRate).toBe(50); // テストデフォルトが保持される
      expect(config.canvas.width).toBe(800);
      expect(config.canvas.height).toBe(600); // デフォルト値が保持される
    });

    it('should maintain all required properties', () => {
      const config = createTestConfig();
      
      // 全ての必須プロパティが存在することを確認
      expect(config.canvas).toBeDefined();
      expect(config.player).toBeDefined();
      expect(config.bullet).toBeDefined();
      expect(config.enemy).toBeDefined();
      expect(config.powerup).toBeDefined();
      expect(config.boss).toBeDefined();
      expect(config.explosion).toBeDefined();
      expect(config.background).toBeDefined();
      expect(config.wave).toBeDefined();
    });
  });

  describe('configuration validation', () => {
    it('should accept valid configuration', () => {
      const validConfig = {
        canvas: { width: 800, height: 600 },
        player: { fireRate: 150 }
      };

      expect(() => createGameConfig(validConfig)).not.toThrow();
    });

    it('should reject configuration with missing required nested properties', () => {
      const invalidConfig = {
        enemy: {
          types: {
            INVALID: {
              width: 30,
              height: 30
              // speed, health, score, color が不足
            }
          }
        }
      };

      expect(() => createGameConfig(invalidConfig)).toThrow();
    });

    it('should reject configuration with invalid types', () => {
      const invalidConfig = {
        player: {
          fireRate: 'invalid' // 数値である必要がある
        }
      };

      expect(() => createGameConfig(invalidConfig as any)).toThrow();
    });
  });
});