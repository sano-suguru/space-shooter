import { createGameConfig } from '../../src/config/GameConfigFactory';
import { BossBullet } from '../../src/entities/BossBullet';
import { ExplosiveBullet } from '../../src/entities/bullets/ExplosiveBullet';
import { HomingBullet } from '../../src/entities/bullets/HomingBullet';
import { ReflectingBullet } from '../../src/entities/bullets/ReflectingBullet';
import { SplitBullet } from '../../src/entities/bullets/SplitBullet';
import '../canvas.setup';

// 型定義の追加
interface MockCanvasRenderingContext2D
  extends Partial<CanvasRenderingContext2D> {
  save: jest.Mock;
  restore: jest.Mock;
  translate: jest.Mock;
  rotate: jest.Mock;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  globalAlpha: number;
  lineCap: CanvasLineCap;
  beginPath: jest.Mock;
  closePath: jest.Mock;
  moveTo: jest.Mock;
  lineTo: jest.Mock;
  arc: jest.Mock;
  fillRect: jest.Mock;
  strokeRect: jest.Mock;
  fill: jest.Mock;
  stroke: jest.Mock;
  createRadialGradient: jest.Mock;
  createLinearGradient: jest.Mock;
  setLineDash: jest.Mock;
}

describe('BossBullet エンチャント効果メソッド', () => {
  let mockCtx: MockCanvasRenderingContext2D;
  let bossBullet: BossBullet;
  let config: ReturnType<typeof createGameConfig>;

  beforeEach(() => {
    // Canvas contextのモック
    mockCtx = {
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      globalAlpha: 1,
      lineCap: 'butt' as CanvasLineCap,
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      arc: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      setLineDash: jest.fn(),
      createRadialGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
    };

    // テスト用設定を作成
    config = createGameConfig();
    bossBullet = new BossBullet(100, 200, -50, 100, config);

    // コンソールログをモック化
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('貫通効果', () => {
    test('isPiercing() - デフォルトでfalseを返す', () => {
      expect(bossBullet.isPiercing()).toBe(false);
    });

    test('isPiercing() - 戻り値の型がbooleanである', () => {
      const result = bossBullet.isPiercing();
      expect(typeof result).toBe('boolean');
    });

    test('getPiercingCount() - デフォルトで0を返す', () => {
      expect(bossBullet.getPiercingCount()).toBe(0);
    });

    test('getPiercingCount() - 戻り値の型がnumberである', () => {
      const result = bossBullet.getPiercingCount();
      expect(typeof result).toBe('number');
    });

    test('複数回呼び出しても同じ値を返す', () => {
      const firstCall = bossBullet.isPiercing();
      const secondCall = bossBullet.isPiercing();
      const firstCountCall = bossBullet.getPiercingCount();
      const secondCountCall = bossBullet.getPiercingCount();

      expect(firstCall).toBe(secondCall);
      expect(firstCountCall).toBe(secondCountCall);
    });
  });

  describe('爆発効果', () => {
    test('isExplosive() - デフォルトでfalseを返す', () => {
      expect(bossBullet.isExplosive()).toBe(false);
    });

    test('isExplosive() - 戻り値の型がbooleanである', () => {
      const result = bossBullet.isExplosive();
      expect(typeof result).toBe('boolean');
    });

    test('getExplosionRadius() - デフォルトで0を返す', () => {
      expect(bossBullet.getExplosionRadius()).toBe(0);
    });

    test('getExplosionRadius() - 戻り値の型がnumberである', () => {
      const result = bossBullet.getExplosionRadius();
      expect(typeof result).toBe('number');
    });

    test('複数回呼び出しても同じ値を返す', () => {
      const firstCall = bossBullet.isExplosive();
      const secondCall = bossBullet.isExplosive();
      const firstRadiusCall = bossBullet.getExplosionRadius();
      const secondRadiusCall = bossBullet.getExplosionRadius();

      expect(firstCall).toBe(secondCall);
      expect(firstRadiusCall).toBe(secondRadiusCall);
    });
  });

  describe('ホーミング効果', () => {
    test('isHoming() - デフォルトでfalseを返す', () => {
      expect(bossBullet.isHoming()).toBe(false);
    });

    test('isHoming() - 戻り値の型がbooleanである', () => {
      const result = bossBullet.isHoming();
      expect(typeof result).toBe('boolean');
    });

    test('getHomingDuration() - デフォルトで0を返す', () => {
      expect(bossBullet.getHomingDuration()).toBe(0);
    });

    test('getHomingDuration() - 戻り値の型がnumberである', () => {
      const result = bossBullet.getHomingDuration();
      expect(typeof result).toBe('number');
    });

    test('複数回呼び出しても同じ値を返す', () => {
      const firstCall = bossBullet.isHoming();
      const secondCall = bossBullet.isHoming();
      const firstDurationCall = bossBullet.getHomingDuration();
      const secondDurationCall = bossBullet.getHomingDuration();

      expect(firstCall).toBe(secondCall);
      expect(firstDurationCall).toBe(secondDurationCall);
    });
  });

  describe('チェインライトニング効果', () => {
    test('hasChainLightning() - デフォルトでfalseを返す', () => {
      expect(bossBullet.hasChainLightning()).toBe(false);
    });

    test('hasChainLightning() - 戻り値の型がbooleanである', () => {
      const result = bossBullet.hasChainLightning();
      expect(typeof result).toBe('boolean');
    });

    test('getChainCount() - デフォルトで0を返す', () => {
      expect(bossBullet.getChainCount()).toBe(0);
    });

    test('getChainCount() - 戻り値の型がnumberである', () => {
      const result = bossBullet.getChainCount();
      expect(typeof result).toBe('number');
    });

    test('複数回呼び出しても同じ値を返す', () => {
      const firstCall = bossBullet.hasChainLightning();
      const secondCall = bossBullet.hasChainLightning();
      const firstCountCall = bossBullet.getChainCount();
      const secondCountCall = bossBullet.getChainCount();

      expect(firstCall).toBe(secondCall);
      expect(firstCountCall).toBe(secondCountCall);
    });
  });

  describe('分裂効果', () => {
    test('canSplit() - デフォルトでfalseを返す', () => {
      expect(bossBullet.canSplit()).toBe(false);
    });

    test('canSplit() - 戻り値の型がbooleanである', () => {
      const result = bossBullet.canSplit();
      expect(typeof result).toBe('boolean');
    });

    test('getSplitCount() - デフォルトで0を返す', () => {
      expect(bossBullet.getSplitCount()).toBe(0);
    });

    test('getSplitCount() - 戻り値の型がnumberである', () => {
      const result = bossBullet.getSplitCount();
      expect(typeof result).toBe('number');
    });

    test('複数回呼び出しても同じ値を返す', () => {
      const firstCall = bossBullet.canSplit();
      const secondCall = bossBullet.canSplit();
      const firstCountCall = bossBullet.getSplitCount();
      const secondCountCall = bossBullet.getSplitCount();

      expect(firstCall).toBe(secondCall);
      expect(firstCountCall).toBe(secondCountCall);
    });
  });

  describe('リコシェット効果', () => {
    test('canRicochet() - デフォルトでfalseを返す', () => {
      expect(bossBullet.canRicochet()).toBe(false);
    });

    test('canRicochet() - 戻り値の型がbooleanである', () => {
      const result = bossBullet.canRicochet();
      expect(typeof result).toBe('boolean');
    });

    test('getRicochetCount() - デフォルトで0を返す', () => {
      expect(bossBullet.getRicochetCount()).toBe(0);
    });

    test('getRicochetCount() - 戻り値の型がnumberである', () => {
      const result = bossBullet.getRicochetCount();
      expect(typeof result).toBe('number');
    });

    test('複数回呼び出しても同じ値を返す', () => {
      const firstCall = bossBullet.canRicochet();
      const secondCall = bossBullet.canRicochet();
      const firstCountCall = bossBullet.getRicochetCount();
      const secondCountCall = bossBullet.getRicochetCount();

      expect(firstCall).toBe(secondCall);
      expect(firstCountCall).toBe(secondCountCall);
    });
  });

  describe('クリティカル効果', () => {
    test('getCriticalChance() - デフォルトで0を返す', () => {
      expect(bossBullet.getCriticalChance()).toBe(0);
    });

    test('getCriticalChance() - 戻り値の型がnumberである', () => {
      const result = bossBullet.getCriticalChance();
      expect(typeof result).toBe('number');
    });

    test('複数回呼び出しても同じ値を返す', () => {
      const firstCall = bossBullet.getCriticalChance();
      const secondCall = bossBullet.getCriticalChance();

      expect(firstCall).toBe(secondCall);
    });
  });

  describe('凍結効果', () => {
    test('hasFreezeEffect() - デフォルトでfalseを返す', () => {
      expect(bossBullet.hasFreezeEffect()).toBe(false);
    });

    test('hasFreezeEffect() - 戻り値の型がbooleanである', () => {
      const result = bossBullet.hasFreezeEffect();
      expect(typeof result).toBe('boolean');
    });

    test('getFreezeDuration() - デフォルトで0を返す', () => {
      expect(bossBullet.getFreezeDuration()).toBe(0);
    });

    test('getFreezeDuration() - 戻り値の型がnumberである', () => {
      const result = bossBullet.getFreezeDuration();
      expect(typeof result).toBe('number');
    });

    test('複数回呼び出しても同じ値を返す', () => {
      const firstCall = bossBullet.hasFreezeEffect();
      const secondCall = bossBullet.hasFreezeEffect();
      const firstDurationCall = bossBullet.getFreezeDuration();
      const secondDurationCall = bossBullet.getFreezeDuration();

      expect(firstCall).toBe(secondCall);
      expect(firstDurationCall).toBe(secondDurationCall);
    });
  });

  describe('所有者情報', () => {
    test('getOwner() - 常に"boss"を返す', () => {
      expect(bossBullet.getOwner()).toBe('boss');
    });

    test('getOwner() - 戻り値の型が正しいユニオン型である', () => {
      const result = bossBullet.getOwner();
      expect(['player', 'enemy', 'boss']).toContain(result);
    });

    test('複数回呼び出しても同じ値を返す', () => {
      const firstCall = bossBullet.getOwner();
      const secondCall = bossBullet.getOwner();

      expect(firstCall).toBe(secondCall);
    });
  });

  describe('継承クラスでの動作確認', () => {
    describe('HomingBullet', () => {
      let homingBullet: HomingBullet;
      beforeEach(() => {
        homingBullet = new HomingBullet(50, 100, -30, 80, config, 2000, 0.001);
      });

      test('基本的なエンチャント効果メソッドが正常に動作する', () => {
        expect(homingBullet.isPiercing()).toBe(false);
        expect(homingBullet.getPiercingCount()).toBe(0);
        expect(homingBullet.isExplosive()).toBe(false);
        expect(homingBullet.getExplosionRadius()).toBe(0);
        expect(homingBullet.hasChainLightning()).toBe(false);
        expect(homingBullet.getChainCount()).toBe(0);
        expect(homingBullet.canSplit()).toBe(false);
        expect(homingBullet.getSplitCount()).toBe(0);
        expect(homingBullet.canRicochet()).toBe(false);
        expect(homingBullet.getRicochetCount()).toBe(0);
        expect(homingBullet.getCriticalChance()).toBe(0);
        expect(homingBullet.hasFreezeEffect()).toBe(false);
        expect(homingBullet.getFreezeDuration()).toBe(0);
        expect(homingBullet.getOwner()).toBe('boss');
      });

      test('ホーミング効果は基本実装のまま（デフォルト値）', () => {
        expect(homingBullet.isHoming()).toBe(false);
        expect(homingBullet.getHomingDuration()).toBe(0);
      });

      test('型安全性が保たれている', () => {
        expect(typeof homingBullet.isPiercing()).toBe('boolean');
        expect(typeof homingBullet.getPiercingCount()).toBe('number');
        expect(typeof homingBullet.getOwner()).toBe('string');
      });
    });

    describe('ExplosiveBullet', () => {
      let explosiveBullet: ExplosiveBullet;

      beforeEach(() => {
        explosiveBullet = new ExplosiveBullet(75, 150, -40, 60, config, 25, 3);
      });

      test('基本的なエンチャント効果メソッドが正常に動作する', () => {
        expect(explosiveBullet.isPiercing()).toBe(false);
        expect(explosiveBullet.getPiercingCount()).toBe(0);
        expect(explosiveBullet.isHoming()).toBe(false);
        expect(explosiveBullet.getHomingDuration()).toBe(0);
        expect(explosiveBullet.hasChainLightning()).toBe(false);
        expect(explosiveBullet.getChainCount()).toBe(0);
        expect(explosiveBullet.canSplit()).toBe(false);
        expect(explosiveBullet.getSplitCount()).toBe(0);
        expect(explosiveBullet.canRicochet()).toBe(false);
        expect(explosiveBullet.getRicochetCount()).toBe(0);
        expect(explosiveBullet.getCriticalChance()).toBe(0);
        expect(explosiveBullet.hasFreezeEffect()).toBe(false);
        expect(explosiveBullet.getFreezeDuration()).toBe(0);
        expect(explosiveBullet.getOwner()).toBe('boss');
      });

      test('爆発効果は基本実装のまま（デフォルト値）', () => {
        expect(explosiveBullet.isExplosive()).toBe(false);
        // ExplosiveBulletは実際の爆発半径を返す（25がデフォルト値）
        expect(explosiveBullet.getExplosionRadius()).toBe(25);
      });

      test('型安全性が保たれている', () => {
        expect(typeof explosiveBullet.isExplosive()).toBe('boolean');
        expect(typeof explosiveBullet.getExplosionRadius()).toBe('number');
        expect(typeof explosiveBullet.getOwner()).toBe('string');
      });
    });

    describe('SplitBullet', () => {
      let splitBullet: SplitBullet;

      beforeEach(() => {
        splitBullet = new SplitBullet(
          125,
          175,
          -60,
          40,
          config,
          1500,
          4,
          Math.PI / 4
        );
      });

      test('基本的なエンチャント効果メソッドが正常に動作する', () => {
        expect(splitBullet.isPiercing()).toBe(false);
        expect(splitBullet.getPiercingCount()).toBe(0);
        expect(splitBullet.isExplosive()).toBe(false);
        expect(splitBullet.getExplosionRadius()).toBe(0);
        expect(splitBullet.isHoming()).toBe(false);
        expect(splitBullet.getHomingDuration()).toBe(0);
        expect(splitBullet.hasChainLightning()).toBe(false);
        expect(splitBullet.getChainCount()).toBe(0);
        expect(splitBullet.canRicochet()).toBe(false);
        expect(splitBullet.getRicochetCount()).toBe(0);
        expect(splitBullet.getCriticalChance()).toBe(0);
        expect(splitBullet.hasFreezeEffect()).toBe(false);
        expect(splitBullet.getFreezeDuration()).toBe(0);
        expect(splitBullet.getOwner()).toBe('boss');
      });

      test('分裂効果は基本実装のまま（デフォルト値）', () => {
        expect(splitBullet.canSplit()).toBe(false);
        expect(splitBullet.getSplitCount()).toBe(0);
      });

      test('型安全性が保たれている', () => {
        expect(typeof splitBullet.canSplit()).toBe('boolean');
        expect(typeof splitBullet.getSplitCount()).toBe('number');
        expect(typeof splitBullet.getOwner()).toBe('string');
      });
    });

    describe('ReflectingBullet', () => {
      let reflectingBullet: ReflectingBullet;

      beforeEach(() => {
        reflectingBullet = new ReflectingBullet(200, 250, -70, 90, config, 5);
      });

      test('基本的なエンチャント効果メソッドが正常に動作する', () => {
        expect(reflectingBullet.isPiercing()).toBe(false);
        expect(reflectingBullet.getPiercingCount()).toBe(0);
        expect(reflectingBullet.isExplosive()).toBe(false);
        expect(reflectingBullet.getExplosionRadius()).toBe(0);
        expect(reflectingBullet.isHoming()).toBe(false);
        expect(reflectingBullet.getHomingDuration()).toBe(0);
        expect(reflectingBullet.hasChainLightning()).toBe(false);
        expect(reflectingBullet.getChainCount()).toBe(0);
        expect(reflectingBullet.canSplit()).toBe(false);
        expect(reflectingBullet.getSplitCount()).toBe(0);
        expect(reflectingBullet.getCriticalChance()).toBe(0);
        expect(reflectingBullet.hasFreezeEffect()).toBe(false);
        expect(reflectingBullet.getFreezeDuration()).toBe(0);
        expect(reflectingBullet.getOwner()).toBe('boss');
      });

      test('リコシェット効果は基本実装のまま（デフォルト値）', () => {
        expect(reflectingBullet.canRicochet()).toBe(false);
        expect(reflectingBullet.getRicochetCount()).toBe(0);
      });

      test('型安全性が保たれている', () => {
        expect(typeof reflectingBullet.canRicochet()).toBe('boolean');
        expect(typeof reflectingBullet.getRicochetCount()).toBe('number');
        expect(typeof reflectingBullet.getOwner()).toBe('string');
      });
    });
  });

  describe('エラーハンドリング', () => {
    test('nullやundefinedの設定でも正常に動作する', () => {
      const bulletWithNullConfig = new BossBullet(0, 0, 0, 0, undefined);

      expect(() => {
        bulletWithNullConfig.isPiercing();
        bulletWithNullConfig.getPiercingCount();
        bulletWithNullConfig.isExplosive();
        bulletWithNullConfig.getExplosionRadius();
        bulletWithNullConfig.isHoming();
        bulletWithNullConfig.getHomingDuration();
        bulletWithNullConfig.hasChainLightning();
        bulletWithNullConfig.getChainCount();
        bulletWithNullConfig.canSplit();
        bulletWithNullConfig.getSplitCount();
        bulletWithNullConfig.canRicochet();
        bulletWithNullConfig.getRicochetCount();
        bulletWithNullConfig.getCriticalChance();
        bulletWithNullConfig.hasFreezeEffect();
        bulletWithNullConfig.getFreezeDuration();
        bulletWithNullConfig.getOwner();
      }).not.toThrow();
    });

    test('極端な座標値でも正常に動作する', () => {
      const extremeBullet = new BossBullet(-1000, 10000, -999, 999, config);

      expect(() => {
        extremeBullet.isPiercing();
        extremeBullet.getPiercingCount();
        extremeBullet.isExplosive();
        extremeBullet.getExplosionRadius();
        extremeBullet.isHoming();
        extremeBullet.getHomingDuration();
        extremeBullet.hasChainLightning();
        extremeBullet.getChainCount();
        extremeBullet.canSplit();
        extremeBullet.getSplitCount();
        extremeBullet.canRicochet();
        extremeBullet.getRicochetCount();
        extremeBullet.getCriticalChance();
        extremeBullet.hasFreezeEffect();
        extremeBullet.getFreezeDuration();
        extremeBullet.getOwner();
      }).not.toThrow();
    });

    test('描画処理中にエンチャント効果メソッドを呼び出しても正常に動作する', () => {
      expect(() => {
        bossBullet.draw(mockCtx as unknown as CanvasRenderingContext2D);

        // 描画後にエンチャント効果メソッドを呼び出し
        bossBullet.isPiercing();
        bossBullet.isExplosive();
        bossBullet.isHoming();
        bossBullet.hasChainLightning();
        bossBullet.canSplit();
        bossBullet.canRicochet();
        bossBullet.getCriticalChance();
        bossBullet.hasFreezeEffect();
        bossBullet.getOwner();
      }).not.toThrow();
    });
  });

  describe('一貫性テスト', () => {
    test('全てのbooleanメソッドが一貫してfalseを返す', () => {
      const booleanMethods = [
        'isPiercing',
        'isExplosive',
        'isHoming',
        'hasChainLightning',
        'canSplit',
        'canRicochet',
        'hasFreezeEffect',
      ] as const;

      booleanMethods.forEach(method => {
        expect(bossBullet[method]()).toBe(false);
      });
    });

    test('全てのnumberメソッド（count/duration系）が一貫して0を返す', () => {
      const numberMethods = [
        'getPiercingCount',
        'getExplosionRadius',
        'getHomingDuration',
        'getChainCount',
        'getSplitCount',
        'getRicochetCount',
        'getCriticalChance',
        'getFreezeDuration',
      ] as const;

      numberMethods.forEach(method => {
        expect(bossBullet[method]()).toBe(0);
      });
    });

    test('getOwner()は常に"boss"を返す', () => {
      // 複数のインスタンスで確認
      const bullets = [
        new BossBullet(0, 0, 0, 0, config),
        new BossBullet(100, 200, -50, 100, config),
        new BossBullet(-50, 300, 25, -75, config),
      ];

      bullets.forEach(bullet => {
        expect(bullet.getOwner()).toBe('boss');
      });
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量のメソッド呼び出しでもパフォーマンスが劣化しない', () => {
      const startTime = performance.now();

      // 1000回の呼び出し
      for (let i = 0; i < 1000; i++) {
        bossBullet.isPiercing();
        bossBullet.getPiercingCount();
        bossBullet.isExplosive();
        bossBullet.getExplosionRadius();
        bossBullet.isHoming();
        bossBullet.getHomingDuration();
        bossBullet.hasChainLightning();
        bossBullet.getChainCount();
        bossBullet.canSplit();
        bossBullet.getSplitCount();
        bossBullet.canRicochet();
        bossBullet.getRicochetCount();
        bossBullet.getCriticalChance();
        bossBullet.hasFreezeEffect();
        bossBullet.getFreezeDuration();
        bossBullet.getOwner();
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // 実行時間が100ms以下であることを確認（十分に高速）
      expect(executionTime).toBeLessThan(100);
    });
  });
});
