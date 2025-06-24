/**
 * エンチャント効果のテスト
 */

import { createGameConfig } from '../../src/config/GameConfigFactory';
import { Bullet } from '../../src/entities/Bullet';
import { Enemy } from '../../src/entities/Enemy';
import { DamageCalculator } from '../../src/utils/DamageCalculator';

describe('EnchantmentEffects', () => {
  let gameConfig: ReturnType<typeof createGameConfig>;

  beforeEach(() => {
    gameConfig = createGameConfig();
  });

  describe('DamageCalculator', () => {
    it('should calculate normal damage when no critical', () => {
      const result = DamageCalculator.calculateDamage(10, 0);
      expect(result.damage).toBe(10);
      expect(result.isCritical).toBe(false);
    });

    it('should calculate critical damage when critical chance is 100%', () => {
      const result = DamageCalculator.calculateDamage(10, 100);
      expect(result.damage).toBe(20); // 2倍
      expect(result.isCritical).toBe(true);
    });

    it('should calculate chain damage with reduction', () => {
      const results = DamageCalculator.calculateChainDamage(10, 0, 3, 0.8);
      expect(results).toHaveLength(3);
      expect(results[0].damage).toBe(10);
      expect(results[1].damage).toBe(8);
      expect(results[2].damage).toBe(6.4);
    });
  });

  describe('Bullet enchantment effects', () => {
    let bullet: Bullet;

    beforeEach(() => {
      bullet = new Bullet(0, 0, gameConfig);
    });

    it('should set and get piercing effect', () => {
      bullet.setPiercing(3);
      expect(bullet.isPiercing()).toBe(true);
      expect(bullet.getPiercingCount()).toBe(3);
    });

    it('should set and get critical chance', () => {
      bullet.setCriticalChance(25);
      expect(bullet.getCriticalChance()).toBe(25);
    });

    it('should set and get chain lightning effect', () => {
      bullet.setChainLightning(true);
      bullet.setChainCount(5);
      expect(bullet.hasChainLightning()).toBe(true);
      expect(bullet.getChainCount()).toBe(5);
    });

    it('should set and get freeze effect', () => {
      bullet.setFreezeEffect(true);
      bullet.setFreezeDuration(3);
      expect(bullet.hasFreezeEffect()).toBe(true);
      expect(bullet.getFreezeDuration()).toBe(3);
    });

    it('should reset freeze effect on bullet reset', () => {
      bullet.setFreezeEffect(true);
      bullet.setFreezeDuration(3);
      bullet.reset();
      expect(bullet.hasFreezeEffect()).toBe(false);
      expect(bullet.getFreezeDuration()).toBe(0);
    });
  });

  describe('Enemy enchantment effects', () => {
    let enemy: Enemy;

    beforeEach(() => {
      enemy = new Enemy(0, 0, 'SMALL', undefined, gameConfig);
    });

    it('should take damage with critical effect', () => {
      const initialHealth = enemy['health'];
      const isDestroyed = enemy.takeDamage(1, true); // 1ダメージに変更
      expect(enemy['health']).toBe(initialHealth - 1);
      expect(enemy['criticalEffectTime']).toBeGreaterThan(0);
      expect(isDestroyed).toBe(initialHealth === 1); // ヘルスが1の場合は撃破される
    });

    it('should freeze and unfreeze enemy', () => {
      const originalSpeed = enemy['speed'];
      enemy.freeze(1); // 1秒間凍結

      expect(enemy.isFrozen()).toBe(true);
      expect(enemy['speed']).toBe(0);

      // 時間経過をシミュレート
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 1100);
      enemy.update(16); // 1フレーム更新

      expect(enemy.isFrozen()).toBe(false);
      expect(enemy['speed']).toBe(originalSpeed);
    });

    it('should not move when frozen', () => {
      const initialY = enemy.getY();
      enemy.freeze(1);
      enemy.update(16);
      expect(enemy.getY()).toBe(initialY); // 位置が変わらない
    });
  });
});
