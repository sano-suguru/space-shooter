import { BaseBullet } from '../../src/entities/BaseBullet';
import { IBullet } from '../../src/interfaces/IBullet';

/**
 * IBulletインターフェーステスト用のモッククラス
 */
class MockBullet extends BaseBullet {
  constructor(
    x: number = 0,
    y: number = 0,
    private mockEnchantments: Partial<{
      piercing: boolean;
      piercingCount: number;
      explosive: boolean;
      explosionRadius: number;
      homing: boolean;
      homingDuration: number;
      chainLightning: boolean;
      chainCount: number;
      split: boolean;
      splitCount: number;
      ricochet: boolean;
      ricochetCount: number;
      criticalChance: number;
      freeze: boolean;
      freezeDuration: number;
    }> = {}
  ) {
    super(x, y, 10, 10); // GameObjectは4つの引数が必要
  }

  // エンチャント効果のオーバーライド
  public isPiercing(): boolean {
    return this.mockEnchantments.piercing ?? false;
  }

  public getPiercingCount(): number {
    return this.mockEnchantments.piercingCount ?? 0;
  }

  public isExplosive(): boolean {
    return this.mockEnchantments.explosive ?? false;
  }

  public getExplosionRadius(): number {
    return this.mockEnchantments.explosionRadius ?? 0;
  }

  public isHoming(): boolean {
    return this.mockEnchantments.homing ?? false;
  }

  public getHomingDuration(): number {
    return this.mockEnchantments.homingDuration ?? 0;
  }

  public hasChainLightning(): boolean {
    return this.mockEnchantments.chainLightning ?? false;
  }

  public getChainCount(): number {
    return this.mockEnchantments.chainCount ?? 0;
  }

  public canSplit(): boolean {
    return this.mockEnchantments.split ?? false;
  }

  public getSplitCount(): number {
    return this.mockEnchantments.splitCount ?? 0;
  }

  public canRicochet(): boolean {
    return this.mockEnchantments.ricochet ?? false;
  }

  public getRicochetCount(): number {
    return this.mockEnchantments.ricochetCount ?? 0;
  }

  public getCriticalChance(): number {
    return this.mockEnchantments.criticalChance ?? 0.0;
  }

  public hasFreezeEffect(): boolean {
    return this.mockEnchantments.freeze ?? false;
  }

  public getFreezeDuration(): number {
    return this.mockEnchantments.freezeDuration ?? 0;
  }

  // 抽象メソッドの実装
  public update(_deltaTime: number): void {
    // テスト用の空実装
  }

  public draw(_ctx: CanvasRenderingContext2D): void {
    // テスト用の空実装
  }
}

describe('IBullet インターフェース', () => {
  let bullet: IBullet;

  beforeEach(() => {
    bullet = new MockBullet(100, 200);
  });

  describe('基本機能', () => {
    test('isActive() - 初期状態でアクティブであること', () => {
      expect(bullet.isActive()).toBe(true);
    });

    test('deactivate() - 弾丸を非アクティブ化できること', () => {
      bullet.deactivate();
      expect(bullet.isActive()).toBe(false);
    });

    test('getPosition() - 正しい位置を返すこと', () => {
      const position = bullet.getPosition();
      expect(position).toEqual({ x: 100, y: 200 });
    });

    test('getId() - ユニークIDを返すこと', () => {
      const id1 = bullet.getId();
      const bullet2 = new MockBullet();
      const id2 = bullet2.getId();

      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
      expect(id1).not.toBe(id2);
    });

    test('getOwner() - 所有者を返すこと', () => {
      expect(['player', 'enemy', 'boss']).toContain(bullet.getOwner());
    });
  });

  describe('エンチャント効果', () => {
    describe('貫通効果', () => {
      test('isPiercing() - デフォルトでfalseを返すこと', () => {
        expect(bullet.isPiercing()).toBe(false);
      });

      test('getPiercingCount() - デフォルトで0を返すこと', () => {
        expect(bullet.getPiercingCount()).toBe(0);
      });

      test('貫通効果が有効な場合の動作', () => {
        const piercingBullet = new MockBullet(0, 0, {
          piercing: true,
          piercingCount: 3,
        });

        expect(piercingBullet.isPiercing()).toBe(true);
        expect(piercingBullet.getPiercingCount()).toBe(3);
      });
    });

    describe('爆発効果', () => {
      test('isExplosive() - デフォルトでfalseを返すこと', () => {
        expect(bullet.isExplosive()).toBe(false);
      });

      test('getExplosionRadius() - デフォルトで0を返すこと', () => {
        expect(bullet.getExplosionRadius()).toBe(0);
      });

      test('爆発効果が有効な場合の動作', () => {
        const explosiveBullet = new MockBullet(0, 0, {
          explosive: true,
          explosionRadius: 50,
        });

        expect(explosiveBullet.isExplosive()).toBe(true);
        expect(explosiveBullet.getExplosionRadius()).toBe(50);
      });
    });

    describe('ホーミング効果', () => {
      test('isHoming() - デフォルトでfalseを返すこと', () => {
        expect(bullet.isHoming()).toBe(false);
      });

      test('getHomingDuration() - デフォルトで0を返すこと', () => {
        expect(bullet.getHomingDuration()).toBe(0);
      });

      test('ホーミング効果が有効な場合の動作', () => {
        const homingBullet = new MockBullet(0, 0, {
          homing: true,
          homingDuration: 2000,
        });

        expect(homingBullet.isHoming()).toBe(true);
        expect(homingBullet.getHomingDuration()).toBe(2000);
      });
    });

    describe('チェインライトニング効果', () => {
      test('hasChainLightning() - デフォルトでfalseを返すこと', () => {
        expect(bullet.hasChainLightning()).toBe(false);
      });

      test('getChainCount() - デフォルトで0を返すこと', () => {
        expect(bullet.getChainCount()).toBe(0);
      });

      test('チェインライトニング効果が有効な場合の動作', () => {
        const chainBullet = new MockBullet(0, 0, {
          chainLightning: true,
          chainCount: 4,
        });

        expect(chainBullet.hasChainLightning()).toBe(true);
        expect(chainBullet.getChainCount()).toBe(4);
      });
    });

    describe('分裂効果', () => {
      test('canSplit() - デフォルトでfalseを返すこと', () => {
        expect(bullet.canSplit()).toBe(false);
      });

      test('getSplitCount() - デフォルトで0を返すこと', () => {
        expect(bullet.getSplitCount()).toBe(0);
      });

      test('分裂効果が有効な場合の動作', () => {
        const splitBullet = new MockBullet(0, 0, {
          split: true,
          splitCount: 3,
        });

        expect(splitBullet.canSplit()).toBe(true);
        expect(splitBullet.getSplitCount()).toBe(3);
      });
    });

    describe('リコシェット効果', () => {
      test('canRicochet() - デフォルトでfalseを返すこと', () => {
        expect(bullet.canRicochet()).toBe(false);
      });

      test('getRicochetCount() - デフォルトで0を返すこと', () => {
        expect(bullet.getRicochetCount()).toBe(0);
      });

      test('リコシェット効果が有効な場合の動作', () => {
        const ricochetBullet = new MockBullet(0, 0, {
          ricochet: true,
          ricochetCount: 2,
        });

        expect(ricochetBullet.canRicochet()).toBe(true);
        expect(ricochetBullet.getRicochetCount()).toBe(2);
      });
    });

    describe('クリティカル効果', () => {
      test('getCriticalChance() - デフォルトで0.0を返すこと', () => {
        expect(bullet.getCriticalChance()).toBe(0.0);
      });

      test('クリティカル確率が設定されている場合の動作', () => {
        const criticalBullet = new MockBullet(0, 0, {
          criticalChance: 0.25,
        });

        expect(criticalBullet.getCriticalChance()).toBe(0.25);
      });

      test('クリティカル確率の範囲チェック', () => {
        const criticalBullet = new MockBullet(0, 0, {
          criticalChance: 0.5,
        });

        const chance = criticalBullet.getCriticalChance();
        expect(chance).toBeGreaterThanOrEqual(0.0);
        expect(chance).toBeLessThanOrEqual(1.0);
      });
    });

    describe('凍結効果', () => {
      test('hasFreezeEffect() - デフォルトでfalseを返すこと', () => {
        expect(bullet.hasFreezeEffect()).toBe(false);
      });

      test('getFreezeDuration() - デフォルトで0を返すこと', () => {
        expect(bullet.getFreezeDuration()).toBe(0);
      });

      test('凍結効果が有効な場合の動作', () => {
        const freezeBullet = new MockBullet(0, 0, {
          freeze: true,
          freezeDuration: 1500,
        });

        expect(freezeBullet.hasFreezeEffect()).toBe(true);
        expect(freezeBullet.getFreezeDuration()).toBe(1500);
      });
    });
  });

  describe('ライフサイクル', () => {
    test('update() - メソッドが存在すること', () => {
      expect(typeof bullet.update).toBe('function');
      expect(() => bullet.update(16.67)).not.toThrow();
    });

    test('draw() - メソッドが存在すること', () => {
      const mockCanvas = document.createElement('canvas');
      const mockCtx = mockCanvas.getContext('2d')!;

      expect(typeof bullet.draw).toBe('function');
      expect(() => bullet.draw(mockCtx)).not.toThrow();
    });

    test('reset() - 弾丸をリセットできること', () => {
      // 弾丸の状態を変更
      bullet.deactivate();

      // リセット実行
      bullet.reset();

      // リセット後の状態確認
      expect(bullet.isActive()).toBe(false); // resetでactiveはfalseになる
      expect(bullet.getPosition()).toEqual({ x: 0, y: 0 });
      expect(bullet.getOwner()).toBe('player');
    });
  });

  describe('複合エンチャント効果', () => {
    test('複数のエンチャント効果を同時に持てること', () => {
      const multiEnchantBullet = new MockBullet(0, 0, {
        piercing: true,
        piercingCount: 2,
        explosive: true,
        explosionRadius: 30,
        homing: true,
        homingDuration: 1000,
      });

      expect(multiEnchantBullet.isPiercing()).toBe(true);
      expect(multiEnchantBullet.getPiercingCount()).toBe(2);
      expect(multiEnchantBullet.isExplosive()).toBe(true);
      expect(multiEnchantBullet.getExplosionRadius()).toBe(30);
      expect(multiEnchantBullet.isHoming()).toBe(true);
      expect(multiEnchantBullet.getHomingDuration()).toBe(1000);
    });
  });

  describe('型安全性', () => {
    test('インターフェースの型チェック', () => {
      // TypeScriptの型チェックが正常に動作することを確認
      const testBullet: IBullet = new MockBullet();

      // 基本機能の型チェック
      expect(typeof testBullet.isActive()).toBe('boolean');
      expect(typeof testBullet.getId()).toBe('string');
      expect(typeof testBullet.getPosition()).toBe('object');
      expect(['player', 'enemy', 'boss']).toContain(testBullet.getOwner());

      // エンチャント効果の型チェック
      expect(typeof testBullet.isPiercing()).toBe('boolean');
      expect(typeof testBullet.getPiercingCount()).toBe('number');
      expect(typeof testBullet.isExplosive()).toBe('boolean');
      expect(typeof testBullet.getExplosionRadius()).toBe('number');
      expect(typeof testBullet.getCriticalChance()).toBe('number');
    });
  });
});
