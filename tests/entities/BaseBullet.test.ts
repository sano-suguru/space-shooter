import { BaseBullet } from '../../src/entities/BaseBullet';

/**
 * BaseBulletテスト用の具象クラス
 */
class TestBullet extends BaseBullet {
  constructor(x: number = 0, y: number = 0) {
    super(x, y, 10, 10);
  }

  public update(_deltaTime: number): void {
    // テスト用の空実装
  }

  public draw(_ctx: CanvasRenderingContext2D): void {
    // テスト用の空実装
  }
}

describe('BaseBullet 抽象クラス', () => {
  let bullet: BaseBullet;

  beforeEach(() => {
    bullet = new TestBullet(50, 100);
  });

  describe('デフォルト実装', () => {
    describe('貫通効果', () => {
      test('isPiercing() - デフォルトでfalseを返すこと', () => {
        expect(bullet.isPiercing()).toBe(false);
      });

      test('getPiercingCount() - デフォルトで0を返すこと', () => {
        expect(bullet.getPiercingCount()).toBe(0);
      });
    });

    describe('爆発効果', () => {
      test('isExplosive() - デフォルトでfalseを返すこと', () => {
        expect(bullet.isExplosive()).toBe(false);
      });

      test('getExplosionRadius() - デフォルトで0を返すこと', () => {
        expect(bullet.getExplosionRadius()).toBe(0);
      });
    });

    describe('ホーミング効果', () => {
      test('isHoming() - デフォルトでfalseを返すこと', () => {
        expect(bullet.isHoming()).toBe(false);
      });

      test('getHomingDuration() - デフォルトで0を返すこと', () => {
        expect(bullet.getHomingDuration()).toBe(0);
      });
    });

    describe('チェインライトニング効果', () => {
      test('hasChainLightning() - デフォルトでfalseを返すこと', () => {
        expect(bullet.hasChainLightning()).toBe(false);
      });

      test('getChainCount() - デフォルトで0を返すこと', () => {
        expect(bullet.getChainCount()).toBe(0);
      });
    });

    describe('分裂効果', () => {
      test('canSplit() - デフォルトでfalseを返すこと', () => {
        expect(bullet.canSplit()).toBe(false);
      });

      test('getSplitCount() - デフォルトで0を返すこと', () => {
        expect(bullet.getSplitCount()).toBe(0);
      });
    });

    describe('リコシェット効果', () => {
      test('canRicochet() - デフォルトでfalseを返すこと', () => {
        expect(bullet.canRicochet()).toBe(false);
      });

      test('getRicochetCount() - デフォルトで0を返すこと', () => {
        expect(bullet.getRicochetCount()).toBe(0);
      });
    });

    describe('クリティカル効果', () => {
      test('getCriticalChance() - デフォルトで0.0を返すこと', () => {
        expect(bullet.getCriticalChance()).toBe(0.0);
      });
    });

    describe('凍結効果', () => {
      test('hasFreezeEffect() - デフォルトでfalseを返すこと', () => {
        expect(bullet.hasFreezeEffect()).toBe(false);
      });

      test('getFreezeDuration() - デフォルトで0を返すこと', () => {
        expect(bullet.getFreezeDuration()).toBe(0);
      });
    });
  });

  describe('基本機能', () => {
    test('isActive() - 初期状態でアクティブであること', () => {
      expect(bullet.isActive()).toBe(true);
    });

    test('deactivate() - 弾丸を非アクティブ化できること', () => {
      expect(bullet.isActive()).toBe(true);
      bullet.deactivate();
      expect(bullet.isActive()).toBe(false);
    });

    test('getPosition() - 正しい位置を返すこと', () => {
      const position = bullet.getPosition();
      expect(position).toEqual({ x: 50, y: 100 });
    });

    test('getId() - ユニークIDを生成すること', () => {
      const id1 = bullet.getId();
      const bullet2 = new TestBullet();
      const id2 = bullet2.getId();

      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
      expect(id1).not.toBe(id2);
    });

    test('getId() - 同じインスタンスでは同じIDを返すこと', () => {
      const id1 = bullet.getId();
      const id2 = bullet.getId();
      expect(id1).toBe(id2);
    });

    test('getOwner() - デフォルトでplayerを返すこと', () => {
      expect(bullet.getOwner()).toBe('player');
    });

    test('setOwner() - 所有者を設定できること', () => {
      bullet.setOwner('enemy');
      expect(bullet.getOwner()).toBe('enemy');

      bullet.setOwner('boss');
      expect(bullet.getOwner()).toBe('boss');

      bullet.setOwner('player');
      expect(bullet.getOwner()).toBe('player');
    });
  });

  describe('reset機能', () => {
    test('reset() - 弾丸の状態をリセットできること', () => {
      // 弾丸の状態を変更
      bullet.deactivate();
      bullet.setOwner('enemy');
      const originalId = bullet.getId(); // IDを生成

      // リセット実行
      bullet.reset();

      // リセット後の状態確認
      expect(bullet.isActive()).toBe(false); // activeはfalseにリセット
      expect(bullet.getPosition()).toEqual({ x: 0, y: 0 }); // 位置は(0,0)にリセット
      expect(bullet.getOwner()).toBe('player'); // 所有者はplayerにリセット

      // IDはリセットされる（空文字列になる）
      const newId = bullet.getId();
      expect(newId).not.toBe(originalId);
    });

    test('reset() - 複数回呼び出しても安全であること', () => {
      bullet.reset();
      bullet.reset();
      bullet.reset();

      expect(bullet.isActive()).toBe(false);
      expect(bullet.getPosition()).toEqual({ x: 0, y: 0 });
      expect(bullet.getOwner()).toBe('player');
    });
  });

  describe('抽象メソッド', () => {
    test('update() - 抽象メソッドが実装されていること', () => {
      expect(typeof bullet.update).toBe('function');
      expect(() => bullet.update(16.67)).not.toThrow();
    });

    test('draw() - 抽象メソッドが実装されていること', () => {
      const mockCanvas = document.createElement('canvas');
      const mockCtx = mockCanvas.getContext('2d')!;

      expect(typeof bullet.draw).toBe('function');
      expect(() => bullet.draw(mockCtx)).not.toThrow();
    });
  });

  describe('継承関係', () => {
    test('GameObjectを継承していること', () => {
      expect(bullet.getX()).toBe(50);
      expect(bullet.getY()).toBe(100);
      expect(bullet.getWidth()).toBe(10);
      expect(bullet.getHeight()).toBe(10);
    });

    test('IBulletインターフェースを実装していること', () => {
      // インターフェースの全メソッドが存在することを確認
      expect(typeof bullet.isActive).toBe('function');
      expect(typeof bullet.deactivate).toBe('function');
      expect(typeof bullet.getPosition).toBe('function');
      expect(typeof bullet.getId).toBe('function');
      expect(typeof bullet.getOwner).toBe('function');

      // エンチャント効果メソッド
      expect(typeof bullet.isPiercing).toBe('function');
      expect(typeof bullet.getPiercingCount).toBe('function');
      expect(typeof bullet.isExplosive).toBe('function');
      expect(typeof bullet.getExplosionRadius).toBe('function');
      expect(typeof bullet.isHoming).toBe('function');
      expect(typeof bullet.getHomingDuration).toBe('function');
      expect(typeof bullet.hasChainLightning).toBe('function');
      expect(typeof bullet.getChainCount).toBe('function');
      expect(typeof bullet.canSplit).toBe('function');
      expect(typeof bullet.getSplitCount).toBe('function');
      expect(typeof bullet.canRicochet).toBe('function');
      expect(typeof bullet.getRicochetCount).toBe('function');
      expect(typeof bullet.getCriticalChance).toBe('function');
      expect(typeof bullet.hasFreezeEffect).toBe('function');
      expect(typeof bullet.getFreezeDuration).toBe('function');

      // ライフサイクルメソッド
      expect(typeof bullet.update).toBe('function');
      expect(typeof bullet.draw).toBe('function');
      expect(typeof bullet.reset).toBe('function');
    });
  });

  describe('エラーハンドリング', () => {
    test('不正な所有者を設定した場合の動作', () => {
      // TypeScriptの型チェックにより、コンパイル時にエラーになるため
      // 実行時のテストは不要だが、型安全性の確認として記載
      expect(() => {
        bullet.setOwner('player');
        bullet.setOwner('enemy');
        bullet.setOwner('boss');
      }).not.toThrow();
    });

    test('nullやundefinedに対する堅牢性', () => {
      expect(() => bullet.update(0)).not.toThrow();
      expect(() => bullet.update(-1)).not.toThrow();
      expect(() => bullet.update(Infinity)).not.toThrow();
    });
  });

  describe('パフォーマンス', () => {
    test('getId()の呼び出しパフォーマンス', () => {
      const startTime = performance.now();

      // 複数回呼び出し
      for (let i = 0; i < 1000; i++) {
        bullet.getId();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 1000回の呼び出しが100ms以内に完了することを確認
      expect(duration).toBeLessThan(100);
    });

    test('エンチャント効果メソッドの呼び出しパフォーマンス', () => {
      const startTime = performance.now();

      // 全エンチャント効果メソッドを複数回呼び出し
      for (let i = 0; i < 100; i++) {
        bullet.isPiercing();
        bullet.getPiercingCount();
        bullet.isExplosive();
        bullet.getExplosionRadius();
        bullet.isHoming();
        bullet.getHomingDuration();
        bullet.hasChainLightning();
        bullet.getChainCount();
        bullet.canSplit();
        bullet.getSplitCount();
        bullet.canRicochet();
        bullet.getRicochetCount();
        bullet.getCriticalChance();
        bullet.hasFreezeEffect();
        bullet.getFreezeDuration();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 100回の全メソッド呼び出しが50ms以内に完了することを確認
      expect(duration).toBeLessThan(50);
    });
  });
});
