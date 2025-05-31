import { MockRandomProvider } from '../../src/providers/MockRandomProvider';

describe('MockRandomProvider', () => {
  let randomProvider: MockRandomProvider;

  beforeEach(() => {
    randomProvider = new MockRandomProvider();
  });

  describe('setValues() と random()', () => {
    it('設定した値を順番に返す', () => {
      randomProvider.setValues([0.1, 0.5, 0.9]);
      
      expect(randomProvider.random()).toBe(0.1);
      expect(randomProvider.random()).toBe(0.5);
      expect(randomProvider.random()).toBe(0.9);
    });

    it('値のリストを超えると最初から繰り返す', () => {
      randomProvider.setValues([0.2, 0.8]);
      
      expect(randomProvider.random()).toBe(0.2);
      expect(randomProvider.random()).toBe(0.8);
      expect(randomProvider.random()).toBe(0.2); // 最初に戻る
      expect(randomProvider.random()).toBe(0.8);
    });

    it('固定値が設定されていない場合は疑似ランダム値を返す', () => {
      const value1 = randomProvider.random();
      const value2 = randomProvider.random();
      
      expect(value1).toBeGreaterThanOrEqual(0);
      expect(value1).toBeLessThan(1);
      expect(value2).toBeGreaterThanOrEqual(0);
      expect(value2).toBeLessThan(1);
      expect(value1).not.toBe(value2);
    });
  });

  describe('setSeed()', () => {
    it('同じシード値では同じ値が生成される', () => {
      const provider1 = new MockRandomProvider();
      const provider2 = new MockRandomProvider();
      
      provider1.setSeed(12345);
      provider2.setSeed(12345);
      
      const values1 = Array(5).fill(0).map(() => provider1.random());
      const values2 = Array(5).fill(0).map(() => provider2.random());
      
      expect(values1).toEqual(values2);
    });

    it('異なるシード値では異なる値が生成される', () => {
      const provider1 = new MockRandomProvider();
      const provider2 = new MockRandomProvider();
      
      provider1.setSeed(12345);
      provider2.setSeed(54321);
      
      const values1 = Array(5).fill(0).map(() => provider1.random());
      const values2 = Array(5).fill(0).map(() => provider2.random());
      
      expect(values1).not.toEqual(values2);
    });
  });

  describe('randomRange()', () => {
    it('指定範囲内の値を返す', () => {
      randomProvider.setValues([0.5]);
      
      const result = randomProvider.randomRange(10, 20);
      expect(result).toBe(15); // 0.5 * (20-10) + 10 = 15
    });

    it('複数回呼び出しで異なる値を返す', () => {
      randomProvider.setValues([0.0, 0.5, 1.0]);
      
      expect(randomProvider.randomRange(0, 10)).toBe(0);   // 0.0 * 10 + 0 = 0
      expect(randomProvider.randomRange(0, 10)).toBe(5);   // 0.5 * 10 + 0 = 5
      expect(randomProvider.randomRange(0, 10)).toBe(10);  // 1.0 * 10 + 0 = 10
    });
  });

  describe('randomChoice()', () => {
    it('配列から要素を選択する', () => {
      randomProvider.setValues([0.0, 0.5, 0.9]);
      const array = ['a', 'b', 'c'];
      
      expect(randomProvider.randomChoice(array)).toBe('a'); // index 0
      expect(randomProvider.randomChoice(array)).toBe('b'); // index 1
      expect(randomProvider.randomChoice(array)).toBe('c'); // index 2
    });

    it('空配列の場合はエラーを投げる', () => {
      expect(() => randomProvider.randomChoice([])).toThrow('Cannot choose from empty array');
    });
  });

  describe('randomInt()', () => {
    it('指定範囲内の整数を返す', () => {
      randomProvider.setValues([0.0, 0.5, 0.99]);
      
      expect(randomProvider.randomInt(1, 5)).toBe(1); // floor(0.0 * 5) + 1 = 1
      expect(randomProvider.randomInt(1, 5)).toBe(3); // floor(0.5 * 5) + 1 = 3
      expect(randomProvider.randomInt(1, 5)).toBe(5); // floor(0.99 * 5) + 1 = 5
    });
  });

  describe('randomBoolean()', () => {
    it('0.5未満でfalse、0.5以上でtrueを返す', () => {
      randomProvider.setValues([0.3, 0.7]);
      
      expect(randomProvider.randomBoolean()).toBe(true);  // 0.3 < 0.5
      expect(randomProvider.randomBoolean()).toBe(false); // 0.7 >= 0.5
    });
  });

  describe('randomChance()', () => {
    it('指定確率でtrueを返す', () => {
      randomProvider.setValues([0.2, 0.8]);
      
      expect(randomProvider.randomChance(0.5)).toBe(true);  // 0.2 < 0.5
      expect(randomProvider.randomChance(0.5)).toBe(false); // 0.8 >= 0.5
    });

    it('確率が範囲外の場合はエラーを投げる', () => {
      expect(() => randomProvider.randomChance(-0.1)).toThrow('Probability must be between 0 and 1');
      expect(() => randomProvider.randomChance(1.1)).toThrow('Probability must be between 0 and 1');
    });

    it('境界値で正しく動作する', () => {
      randomProvider.setValues([0.0, 1.0]);
      
      expect(randomProvider.randomChance(0)).toBe(false); // 0.0 >= 0
      expect(randomProvider.randomChance(1)).toBe(false); // 1.0 >= 1
    });
  });

  describe('reset()', () => {
    it('すべての状態をリセットする', () => {
      randomProvider.setValues([0.5]);
      randomProvider.setSeed(12345);
      randomProvider.random(); // インデックスを進める
      
      randomProvider.reset();
      
      expect(randomProvider.getCurrentIndex()).toBe(0);
      // リセット後は疑似ランダム生成に戻る（固定値なし）
      const value = randomProvider.random();
      expect(value).not.toBe(0.5);
    });
  });

  describe('getCurrentIndex()', () => {
    it('現在のインデックスを正しく返す', () => {
      randomProvider.setValues([0.1, 0.2, 0.3]);
      
      expect(randomProvider.getCurrentIndex()).toBe(0);
      
      randomProvider.random();
      expect(randomProvider.getCurrentIndex()).toBe(1);
      
      randomProvider.random();
      expect(randomProvider.getCurrentIndex()).toBe(2);
      
      randomProvider.random();
      expect(randomProvider.getCurrentIndex()).toBe(3); // 次は0に戻るが、インデックスは増加
    });
  });
});
