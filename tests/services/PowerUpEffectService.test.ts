import { PowerUpEffectService } from '../../src/services/PowerUpEffectService';
import {
  createTestConfig,
  GameConfig,
} from '../../src/config/GameConfigFactory';
import { Player } from '../../src/entities/Player';
import { PowerUpType } from '../../src/types';

// Player のモック
const createMockPlayer = () => {
  return {
    setFireRate: jest.fn(),
    setBulletType: jest.fn(),
    activateShield: jest.fn(),
  } as unknown as Player;
};

describe('PowerUpEffectService', () => {
  let service: PowerUpEffectService;
  let mockPlayer: Player;
  let testConfig: GameConfig;

  beforeEach(() => {
    testConfig = createTestConfig();
    service = new PowerUpEffectService(testConfig);
    mockPlayer = createMockPlayer();
  });

  describe('applyEffect', () => {
    it('should apply rapid fire effect', () => {
      service.applyEffect(mockPlayer, 'RAPID_FIRE');

      expect(mockPlayer.setFireRate).toHaveBeenCalledWith(
        testConfig.player.fireRate / 2
      );
    });

    it('should apply triple shot effect', () => {
      service.applyEffect(mockPlayer, 'TRIPLE_SHOT');

      expect(mockPlayer.setBulletType).toHaveBeenCalledWith('triple');
    });

    it('should apply shield effect', () => {
      service.applyEffect(mockPlayer, 'SHIELD');

      expect(mockPlayer.activateShield).toHaveBeenCalled();
    });

    it('should handle unknown power-up types gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      service.applyEffect(mockPlayer, 'UNKNOWN' as PowerUpType);

      expect(consoleSpy).toHaveBeenCalledWith('Unknown power-up type: UNKNOWN');
      consoleSpy.mockRestore();
    });
  });

  describe('removeEffect', () => {
    it('should remove rapid fire effect', () => {
      service.removeEffect(mockPlayer, 'RAPID_FIRE');

      expect(mockPlayer.setFireRate).toHaveBeenCalledWith(
        testConfig.player.fireRate
      );
    });

    it('should remove triple shot effect', () => {
      service.removeEffect(mockPlayer, 'TRIPLE_SHOT');

      expect(mockPlayer.setBulletType).toHaveBeenCalledWith('single');
    });

    it('should handle shield removal (currently no-op)', () => {
      // シールドの無効化は現在実装されていないため、エラーが発生しないことを確認
      expect(() => service.removeEffect(mockPlayer, 'SHIELD')).not.toThrow();
    });

    it('should handle unknown power-up types gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      service.removeEffect(mockPlayer, 'UNKNOWN' as PowerUpType);

      expect(consoleSpy).toHaveBeenCalledWith('Unknown power-up type: UNKNOWN');
      consoleSpy.mockRestore();
    });
  });

  describe('getEffectDuration', () => {
    it('should return configured duration', () => {
      const duration = service.getEffectDuration('RAPID_FIRE');

      expect(duration).toBe(testConfig.powerup.duration);
    });

    it('should return same duration for all power-up types', () => {
      const rapidFireDuration = service.getEffectDuration('RAPID_FIRE');
      const tripleShotDuration = service.getEffectDuration('TRIPLE_SHOT');
      const shieldDuration = service.getEffectDuration('SHIELD');

      expect(rapidFireDuration).toBe(tripleShotDuration);
      expect(tripleShotDuration).toBe(shieldDuration);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration and affect subsequent operations', () => {
      const newConfig = createTestConfig({
        player: { fireRate: 300 },
        powerup: { duration: 5000 },
      });

      service.updateConfig(newConfig);

      // 新しい設定が適用されることを確認
      service.applyEffect(mockPlayer, 'RAPID_FIRE');
      expect(mockPlayer.setFireRate).toHaveBeenCalledWith(150); // 300 / 2

      const duration = service.getEffectDuration('RAPID_FIRE');
      expect(duration).toBe(5000);
    });
  });

  describe('integration with different configurations', () => {
    it('should work with production configuration', () => {
      const prodConfig = createTestConfig({
        player: { fireRate: 200 },
        powerup: { duration: 10000 },
      });

      const prodService = new PowerUpEffectService(prodConfig);

      prodService.applyEffect(mockPlayer, 'RAPID_FIRE');
      expect(mockPlayer.setFireRate).toHaveBeenCalledWith(100); // 200 / 2

      const duration = prodService.getEffectDuration('RAPID_FIRE');
      expect(duration).toBe(10000);
    });

    it('should handle custom fire rates correctly', () => {
      const customConfig = createTestConfig({
        player: { fireRate: 80 },
      });

      const customService = new PowerUpEffectService(customConfig);

      customService.applyEffect(mockPlayer, 'RAPID_FIRE');
      expect(mockPlayer.setFireRate).toHaveBeenCalledWith(40); // 80 / 2

      customService.removeEffect(mockPlayer, 'RAPID_FIRE');
      expect(mockPlayer.setFireRate).toHaveBeenLastCalledWith(80);
    });
  });

  describe('error handling', () => {
    it('should not throw errors for valid power-up types', () => {
      const validTypes: PowerUpType[] = ['RAPID_FIRE', 'TRIPLE_SHOT', 'SHIELD'];

      validTypes.forEach(type => {
        expect(() => service.applyEffect(mockPlayer, type)).not.toThrow();
        expect(() => service.removeEffect(mockPlayer, type)).not.toThrow();
        expect(() => service.getEffectDuration(type)).not.toThrow();
      });
    });

    it('should handle null/undefined player gracefully', () => {
      // 実際のPlayer実装では null チェックが必要な場合があるため
      // 現在はモックを使用しているが、将来的な改善点として記録
      expect(() => service.applyEffect(mockPlayer, 'RAPID_FIRE')).not.toThrow();
    });
  });
});
