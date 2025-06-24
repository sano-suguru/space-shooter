import { MockRandomProvider } from '../../src/providers/MockRandomProvider';
import { RealRandomProvider } from '../../src/providers/RealRandomProvider';
import { DamageCalculator } from '../../src/utils/DamageCalculator';

describe('DamageCalculator', () => {
  let mockRandomProvider: MockRandomProvider;

  beforeEach(() => {
    mockRandomProvider = new MockRandomProvider();
    DamageCalculator.setRandomProvider(mockRandomProvider);
  });

  afterEach(() => {
    // テスト後にリアルランダムプロバイダーに戻す
    DamageCalculator.setRandomProvider(new RealRandomProvider());
  });

  describe('calculateDamage', () => {
    it('クリティカルヒットが発生しない場合、ベースダメージを返す', () => {
      // クリティカル確率50%、ランダム値0.6（クリティカル発生しない）
      mockRandomProvider.setValues([0.6]);

      const result = DamageCalculator.calculateDamage(10, 50);

      expect(result.damage).toBe(10);
      expect(result.isCritical).toBe(false);
    });

    it('クリティカルヒットが発生する場合、倍率を適用したダメージを返す', () => {
      // クリティカル確率50%、ランダム値0.3（クリティカル発生）
      mockRandomProvider.setValues([0.3]);

      const result = DamageCalculator.calculateDamage(10, 50, 2.5);

      expect(result.damage).toBe(25);
      expect(result.isCritical).toBe(true);
    });

    it('クリティカル確率0%の場合、常にクリティカルが発生しない', () => {
      mockRandomProvider.setValues([0.1]);

      const result = DamageCalculator.calculateDamage(10, 0);

      expect(result.damage).toBe(10);
      expect(result.isCritical).toBe(false);
    });

    it('クリティカル確率100%の場合、常にクリティカルが発生する', () => {
      mockRandomProvider.setValues([0.9]);

      const result = DamageCalculator.calculateDamage(10, 100);

      expect(result.damage).toBe(20);
      expect(result.isCritical).toBe(true);
    });
  });

  describe('calculateChainDamage', () => {
    it('連鎖ダメージを正しく計算する', () => {
      // 全てクリティカルヒットしない設定
      mockRandomProvider.setValues([0.6, 0.7, 0.8]);

      const results = DamageCalculator.calculateChainDamage(10, 50, 3, 0.8);

      expect(results).toHaveLength(3);
      expect(results[0].damage).toBe(10);
      expect(results[1].damage).toBe(8); // 10 * 0.8
      expect(results[2].damage).toBe(6.4); // 8 * 0.8
      expect(results.every(r => !r.isCritical)).toBe(true);
    });

    it('連鎖中にクリティカルが発生する', () => {
      // 2回目だけクリティカルヒット
      mockRandomProvider.setValues([0.6, 0.3, 0.8]);

      const results = DamageCalculator.calculateChainDamage(10, 50, 3, 0.8);

      expect(results).toHaveLength(3);
      expect(results[0].damage).toBe(10);
      expect(results[0].isCritical).toBe(false);
      expect(results[1].damage).toBe(16); // 8 * 2.0 (クリティカル)
      expect(results[1].isCritical).toBe(true);
      expect(results[2].damage).toBe(6.4); // 8 * 0.8 (ベースダメージは減衰後)
      expect(results[2].isCritical).toBe(false);
    });
  });

  describe('calculatePiercingDamage', () => {
    it('貫通ダメージを正しく計算する', () => {
      // 全てクリティカルヒットしない設定
      mockRandomProvider.setValues([0.6, 0.7]);

      const results = DamageCalculator.calculatePiercingDamage(10, 50, 2, 0.9);

      expect(results).toHaveLength(2);
      expect(results[0].damage).toBe(10);
      expect(results[1].damage).toBe(9); // 10 * 0.9
      expect(results.every(r => !r.isCritical)).toBe(true);
    });

    it('貫通中にクリティカルが発生する', () => {
      // 1回目だけクリティカルヒット
      mockRandomProvider.setValues([0.3, 0.8]);

      const results = DamageCalculator.calculatePiercingDamage(10, 50, 2, 0.9);

      expect(results).toHaveLength(2);
      expect(results[0].damage).toBe(20); // 10 * 2.0 (クリティカル)
      expect(results[0].isCritical).toBe(true);
      expect(results[1].damage).toBe(9); // 10 * 0.9 (ベースダメージは減衰後)
      expect(results[1].isCritical).toBe(false);
    });
  });
});
