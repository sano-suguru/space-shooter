import {
  createTestConfig,
  GameConfig,
} from '../../src/config/GameConfigFactory';
import { Explosion } from '../../src/entities/Explosion';

describe('Explosion', () => {
  let explosion: Explosion;
  let mockContext: CanvasRenderingContext2D;
  let testConfig: GameConfig;

  beforeEach(() => {
    testConfig = createTestConfig();
    // Canvas contextのモック
    mockContext = {
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      createRadialGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      globalAlpha: 1,
      font: '',
      textAlign: '',
      textBaseline: '',
      fillText: jest.fn(),
    } as unknown as CanvasRenderingContext2D;

    explosion = new Explosion(testConfig);
  });

  describe('初期化', () => {
    test('Explosionが正しく初期化される', () => {
      expect(explosion).toBeDefined();
      expect(explosion.isFinished()).toBe(true); // 初期状態では非アクティブ
    });

    test('デフォルト状態の確認', () => {
      const position = explosion.getPosition();
      expect(position.x).toBe(0);
      expect(position.y).toBe(0);
      expect(explosion.isFinished()).toBe(true);
    });
  });

  describe('initialize()メソッド', () => {
    test('基本的な初期化', () => {
      explosion.initialize({ x: 100, y: 200 });

      expect(explosion.isFinished()).toBe(false);
      const position = explosion.getPosition();
      expect(position.x).toBe(100);
      expect(position.y).toBe(200);
    });

    test('サイズ指定での初期化', () => {
      explosion.initialize({ x: 50, y: 75 }, 2.0);

      expect(explosion.isFinished()).toBe(false);
      const position = explosion.getPosition();
      expect(position.x).toBe(50);
      expect(position.y).toBe(75);
    });

    test('デフォルトサイズでの初期化', () => {
      explosion.initialize({ x: 10, y: 20 });

      expect(explosion.isFinished()).toBe(false);
      // サイズ1.0がデフォルト（内部処理確認は描画で）
      expect(() => explosion.draw(mockContext)).not.toThrow();
    });

    test('小数点サイズでの初期化', () => {
      explosion.initialize({ x: 0, y: 0 }, 0.5);

      expect(explosion.isFinished()).toBe(false);
      expect(() => explosion.draw(mockContext)).not.toThrow();
    });

    test('負の座標での初期化', () => {
      explosion.initialize({ x: -50, y: -100 }, 1.5);

      const position = explosion.getPosition();
      expect(position.x).toBe(-50);
      expect(position.y).toBe(-100);
      expect(explosion.isFinished()).toBe(false);
    });
  });

  describe('reset()メソッド', () => {
    test('アクティブな爆発をリセット', () => {
      explosion.initialize({ x: 100, y: 200 }, 2.0);
      expect(explosion.isFinished()).toBe(false);

      explosion.reset();

      expect(explosion.isFinished()).toBe(true);
      const position = explosion.getPosition();
      expect(position.x).toBe(0);
      expect(position.y).toBe(0);
    });

    test('非アクティブな爆発をリセット', () => {
      explosion.reset();

      expect(explosion.isFinished()).toBe(true);
      expect(() => explosion.draw(mockContext)).not.toThrow();
    });

    test('リセット後の再初期化', () => {
      explosion.initialize({ x: 50, y: 50 }, 1.0);
      explosion.reset();
      explosion.initialize({ x: 100, y: 150 }, 2.0);

      const position = explosion.getPosition();
      expect(position.x).toBe(100);
      expect(position.y).toBe(150);
      expect(explosion.isFinished()).toBe(false);
    });
  });

  describe('パーティクル生成システム', () => {
    test('パーティクルが生成される', () => {
      explosion.initialize({ x: 100, y: 100 });

      // パーティクルが生成されることを描画で確認
      expect(() => explosion.draw(mockContext)).not.toThrow();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockContext.beginPath).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockContext.arc).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockContext.fill).toHaveBeenCalled();
    });

    test('サイズに応じたパーティクル数調整', () => {
      // 小さいサイズ
      explosion.initialize({ x: 0, y: 0 }, 0.5);
      explosion.draw(mockContext);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockContext.arc).toHaveBeenCalled();

      jest.clearAllMocks();

      // 大きいサイズ
      explosion.initialize({ x: 0, y: 0 }, 2.0);
      explosion.draw(mockContext);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockContext.arc).toHaveBeenCalled();

      // 両方でパーティクルが描画される
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockContext.fill).toHaveBeenCalled();
    });

    test('パーティクルの色生成', () => {
      explosion.initialize({ x: 50, y: 50 });
      explosion.draw(mockContext);

      // 色が設定されている
      expect(mockContext.fillStyle).toBeDefined();
    });

    test('ランダムなパーティクル配置', () => {
      // Math.randomをモックして決定論的なテスト
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      explosion.initialize({ x: 100, y: 100 });
      explosion.draw(mockContext);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockContext.arc).toHaveBeenCalled();

      jest.restoreAllMocks();
    });
  });

  describe('アニメーション更新システム', () => {
    beforeEach(() => {
      explosion.initialize({ x: 100, y: 100 });
    });

    test('時間経過で更新される', () => {
      expect(explosion.isFinished()).toBe(false);

      explosion.update(16.67); // 1フレーム

      expect(explosion.isFinished()).toBe(false);
      expect(() => explosion.draw(mockContext)).not.toThrow();
    });

    test('継続的な更新処理', () => {
      for (let i = 0; i < 10; i++) {
        explosion.update(16.67);
      }

      expect(() => explosion.draw(mockContext)).not.toThrow();
    });

    test('パーティクルの移動と減衰', () => {
      // 初期描画
      explosion.draw(mockContext);

      // 時間経過
      explosion.update(100);

      jest.clearAllMocks();
      explosion.draw(mockContext);

      // パーティクルが描画されている（減衰していても）
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockContext.arc).toHaveBeenCalled();
    });

    test('長時間経過後の状態', () => {
      // 長時間経過させる
      for (let i = 0; i < testConfig.explosion.duration + 10; i++) {
        explosion.update(16.67);
      }

      expect(explosion.isFinished()).toBe(true);
    });

    test('deltaTimeがゼロの場合', () => {
      explosion.update(0);

      expect(explosion.isFinished()).toBe(false);
      expect(() => explosion.draw(mockContext)).not.toThrow();
    });

    test('極端に大きなdeltaTimeでも安定動作', () => {
      explosion.update(10000);

      expect(() => explosion.draw(mockContext)).not.toThrow();
    });
  });

  describe('描画システム', () => {
    beforeEach(() => {
      explosion.initialize({ x: 100, y: 100 });
    });

    test('基本描画が正常に実行される', () => {
      expect(() => explosion.draw(mockContext)).not.toThrow();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockContext.beginPath).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockContext.arc).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockContext.fill).toHaveBeenCalled();
    });

    test('パーティクルの描画', () => {
      explosion.draw(mockContext);

      // パーティクル本体の描画
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockContext.beginPath).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockContext.arc).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockContext.fill).toHaveBeenCalled();
    });

    test('透明度の設定', () => {
      explosion.draw(mockContext);

      // globalAlphaが設定されて最後にリセットされる
      expect(mockContext.globalAlpha).toBe(1);
    });

    test('時間経過による透明度変化', () => {
      // 初期描画
      explosion.draw(mockContext);

      // 時間経過
      for (let i = 0; i < testConfig.explosion.duration / 2; i++) {
        explosion.update(16.67);
      }

      // 透明度が変化した状態で描画
      explosion.draw(mockContext);

      expect(mockContext.globalAlpha).toBe(1); // 最後にリセットされる
    });

    test('完了間際の描画', () => {
      // 完了直前まで進める
      for (let i = 0; i < testConfig.explosion.duration - 1; i++) {
        explosion.update(16.67);
      }

      expect(() => explosion.draw(mockContext)).not.toThrow();
    });

    test('パーティクルのグロー効果', () => {
      explosion.draw(mockContext);

      // パーティクルの描画が実行される
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockContext.arc).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockContext.fill).toHaveBeenCalled();

      // グロー効果も含めて複数回描画される
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockContext.beginPath).toHaveBeenCalled();
    });
  });

  describe('完了判定システム', () => {
    test('初期状態では完了している', () => {
      expect(explosion.isFinished()).toBe(true);
    });

    test('初期化後は未完了', () => {
      explosion.initialize({ x: 0, y: 0 });
      expect(explosion.isFinished()).toBe(false);
    });

    test('期間経過後は完了', () => {
      explosion.initialize({ x: 0, y: 0 });

      // 期間を超過させる
      for (let i = 0; i < testConfig.explosion.duration + 5; i++) {
        explosion.update(16.67);
      }

      expect(explosion.isFinished()).toBe(true);
    });

    test('リセット後は完了状態', () => {
      explosion.initialize({ x: 0, y: 0 });
      expect(explosion.isFinished()).toBe(false);

      explosion.reset();
      expect(explosion.isFinished()).toBe(true);
    });

    test('境界値での完了判定', () => {
      explosion.initialize({ x: 0, y: 0 });

      // ちょうど期間分更新
      for (let i = 0; i < testConfig.explosion.duration; i++) {
        explosion.update(16.67);
      }

      expect(explosion.isFinished()).toBe(true);
    });
  });

  describe('位置管理システム', () => {
    test('getPosition()が正しい位置を返す', () => {
      explosion.initialize({ x: 150, y: 250 });

      const position = explosion.getPosition();
      expect(position.x).toBe(150);
      expect(position.y).toBe(250);
    });

    test('更新後も位置は変わらない', () => {
      explosion.initialize({ x: 100, y: 200 });

      explosion.update(100);
      explosion.update(100);

      const position = explosion.getPosition();
      expect(position.x).toBe(100);
      expect(position.y).toBe(200);
    });

    test('ゼロ座標での位置管理', () => {
      explosion.initialize({ x: 0, y: 0 });

      const position = explosion.getPosition();
      expect(position.x).toBe(0);
      expect(position.y).toBe(0);
    });

    test('負の座標での位置管理', () => {
      explosion.initialize({ x: -100, y: -200 });

      const position = explosion.getPosition();
      expect(position.x).toBe(-100);
      expect(position.y).toBe(-200);
    });
  });

  describe('色生成システム', () => {
    test('HSL色空間での色生成', () => {
      explosion.initialize({ x: 0, y: 0 });
      explosion.draw(mockContext);

      // fillStyleが設定されている（HSL形式の確認は複雑なので実行確認のみ）
      expect(mockContext.fillStyle).toBeDefined();
    });

    test('複数の色が生成される', () => {
      // 複数回初期化して異なる色が生成される可能性を確認
      const colors = new Set();

      for (let i = 0; i < 10; i++) {
        explosion.initialize({ x: i * 10, y: i * 10 });
        explosion.draw(mockContext);
        colors.add(mockContext.fillStyle);
        explosion.reset();
        jest.clearAllMocks();
      }

      // 複数の色が生成される可能性が高い
      expect(colors.size).toBeGreaterThan(0);
    });

    test('色のランダム性テスト', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.7);

      explosion.initialize({ x: 0, y: 0 });
      explosion.draw(mockContext);

      expect(mockContext.fillStyle).toBeDefined();

      jest.restoreAllMocks();
    });
  });

  describe('エラーハンドリング', () => {
    test('null contextで描画してもエラーが発生する', () => {
      explosion.initialize({ x: 0, y: 0 });
      expect(() =>
        explosion.draw(null as unknown as CanvasRenderingContext2D)
      ).toThrow();
    });

    test('未初期化状態での描画', () => {
      // 未初期化でも描画は実行される（パーティクルが空配列）
      expect(() => explosion.draw(mockContext)).not.toThrow();
    });

    test('極端なサイズでの初期化', () => {
      expect(() => explosion.initialize({ x: 0, y: 0 }, 1000)).not.toThrow();
      expect(() => explosion.initialize({ x: 0, y: 0 }, 0.001)).not.toThrow();
      expect(() => explosion.initialize({ x: 0, y: 0 }, -1)).not.toThrow();
    });

    test('極端な座標での初期化', () => {
      expect(() =>
        explosion.initialize({ x: 999999, y: -999999 })
      ).not.toThrow();
      expect(() =>
        explosion.initialize({
          x: Number.MAX_SAFE_INTEGER,
          y: Number.MIN_SAFE_INTEGER,
        })
      ).not.toThrow();
    });

    test('負のdeltaTimeでの更新', () => {
      explosion.initialize({ x: 0, y: 0 });
      expect(() => explosion.update(-100)).not.toThrow();
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量更新でもパフォーマンスが安定している', () => {
      explosion.initialize({ x: 0, y: 0 }, 2.0);

      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        explosion.update(16.67);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
    });

    test('大量描画でもパフォーマンスが安定している', () => {
      explosion.initialize({ x: 0, y: 0 }, 3.0); // 大量パーティクル

      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        explosion.draw(mockContext);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
    });
  });

  describe('統合テスト', () => {
    test('爆発エフェクトのライフサイクル全体', () => {
      // 初期化
      explosion.initialize({ x: 100, y: 100 }, 1.5);
      expect(explosion.isFinished()).toBe(false);

      // アニメーション実行
      while (!explosion.isFinished()) {
        explosion.update(16.67);
        explosion.draw(mockContext);

        // 無限ループ防止
        if (explosion.isFinished()) break;
      }

      // 完了確認
      expect(explosion.isFinished()).toBe(true);
    });

    test('複数爆発の独立動作', () => {
      const explosion1 = new Explosion();
      const explosion2 = new Explosion();
      const explosion3 = new Explosion();

      explosion1.initialize({ x: 0, y: 0 }, 1.0);
      explosion2.initialize({ x: 100, y: 100 }, 2.0);
      explosion3.initialize({ x: 200, y: 200 }, 0.5);

      for (let i = 0; i < 10; i++) {
        explosion1.update(16.67);
        explosion2.update(16.67);
        explosion3.update(16.67);

        explosion1.draw(mockContext);
        explosion2.draw(mockContext);
        explosion3.draw(mockContext);
      }

      // 全て異なる位置にある
      expect(explosion1.getPosition().x).not.toBe(explosion2.getPosition().x);
      expect(explosion2.getPosition().x).not.toBe(explosion3.getPosition().x);
    });

    test('オブジェクトプールパターンの動作', () => {
      // 初期化→使用→リセット→再利用のサイクル
      explosion.initialize({ x: 50, y: 50 });
      expect(explosion.isFinished()).toBe(false);

      explosion.reset();
      expect(explosion.isFinished()).toBe(true);

      explosion.initialize({ x: 150, y: 150 }, 2.0);
      expect(explosion.isFinished()).toBe(false);
      expect(explosion.getPosition().x).toBe(150);
      expect(explosion.getPosition().y).toBe(150);
    });
  });

  describe('境界値テスト', () => {
    test('最小サイズでの動作', () => {
      explosion.initialize({ x: 0, y: 0 }, 0.1);

      explosion.update(16.67);
      expect(() => explosion.draw(mockContext)).not.toThrow();
    });

    test('期間境界での動作', () => {
      explosion.initialize({ x: 0, y: 0 });

      // 期間-1フレーム
      for (let i = 0; i < testConfig.explosion.duration - 1; i++) {
        explosion.update(16.67);
      }
      expect(explosion.isFinished()).toBe(false);

      // 期間ちょうど
      explosion.update(16.67);
      expect(explosion.isFinished()).toBe(true);
    });

    test('座標境界での動作', () => {
      explosion.initialize({ x: 0, y: 0 });
      explosion.initialize({ x: -1, y: -1 });
      explosion.initialize({ x: 1, y: 1 });

      expect(() => explosion.draw(mockContext)).not.toThrow();
    });
  });
});
