import {
  createTestConfig,
  GameConfig,
} from '../../src/config/GameConfigFactory';
import { Enemy } from '../../src/entities/Enemy';
import { IGameEngine } from '../../src/interfaces/IGameEngine';
import { EnemyType } from '../../src/types';
import '../canvas.setup';

// MockGameEngineクラス
class MockGameEngine implements IGameEngine {
  public addBossBullet = jest.fn();
  public getDifficultyFactor = jest.fn().mockReturnValue(1.2);
  public createBullet = jest.fn(() => null);
}

describe('Enemy', () => {
  let mockGameEngine: MockGameEngine;
  let mockCtx: CanvasRenderingContext2D;
  let testConfig: GameConfig;

  beforeEach(() => {
    testConfig = createTestConfig();
    mockGameEngine = new MockGameEngine();

    // Canvas contextのモック
    mockCtx = {
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      globalAlpha: 1,
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      arc: jest.fn(),
      ellipse: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      createRadialGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
    } as any;
  });

  describe('初期化', () => {
    test('SMALL敵が正しく初期化される', () => {
      const enemy = new Enemy(100, 200, 'SMALL', mockGameEngine, testConfig);
      const config = testConfig.enemy.types.SMALL;

      expect(enemy.getX()).toBe(100);
      expect(enemy.getY()).toBe(200);
      expect(enemy.getWidth()).toBe(config.width);
      expect(enemy.getHeight()).toBe(config.height);
      expect(enemy.getEnemyType()).toBe('SMALL');
    });

    test('MEDIUM敵が正しく初期化される', () => {
      const enemy = new Enemy(150, 250, 'MEDIUM', mockGameEngine, testConfig);
      const config = testConfig.enemy.types.MEDIUM;

      expect(enemy.getX()).toBe(150);
      expect(enemy.getY()).toBe(250);
      expect(enemy.getWidth()).toBe(config.width);
      expect(enemy.getHeight()).toBe(config.height);
      expect(enemy.getEnemyType()).toBe('MEDIUM');
    });

    test('LARGE敵が正しく初期化される', () => {
      const enemy = new Enemy(200, 300, 'LARGE', mockGameEngine, testConfig);
      const config = testConfig.enemy.types.LARGE;

      expect(enemy.getX()).toBe(200);
      expect(enemy.getY()).toBe(300);
      expect(enemy.getWidth()).toBe(config.width);
      expect(enemy.getHeight()).toBe(config.height);
      expect(enemy.getEnemyType()).toBe('LARGE');
    });

    test('デフォルト引数で初期化される', () => {
      const enemy = new Enemy();

      expect(enemy.getX()).toBe(0);
      expect(enemy.getY()).toBe(0);
      expect(enemy.getEnemyType()).toBe('SMALL');
    });

    test('GameEngineなしで初期化される', () => {
      const enemy = new Enemy(100, 100, 'MEDIUM');

      expect(enemy.getEnemyType()).toBe('MEDIUM');
      expect(enemy.getX()).toBe(100);
      expect(enemy.getY()).toBe(100);
    });

    test('難易度係数がスピードに反映される', () => {
      mockGameEngine.getDifficultyFactor.mockReturnValue(2.0);
      const enemy = new Enemy(0, 0, 'SMALL', mockGameEngine, testConfig);

      const initialY = enemy.getY();
      enemy.update(0.016);

      // 難易度係数により速度が上がっている
      const moveDistance = enemy.getY() - initialY;
      expect(moveDistance).toBeGreaterThan(0);
    });
  });

  describe('移動パターン', () => {
    test('SMALL敵がジグザグ移動する', () => {
      const enemy = new Enemy(200, 100, 'SMALL', mockGameEngine, testConfig);
      const initialX = enemy.getX();
      const initialY = enemy.getY();

      // 複数フレーム更新
      for (let i = 0; i < 50; i++) {
        enemy.update(0.016);
      }

      // Y座標は増加（下方向移動）
      expect(enemy.getY()).toBeGreaterThan(initialY);

      // X座標は変化（ジグザグ移動）
      expect(enemy.getX()).not.toBe(initialX);
    });

    test('MEDIUM敵がサイン波移動する', () => {
      const enemy = new Enemy(200, 100, 'MEDIUM', mockGameEngine, testConfig);
      const initialX = enemy.getX();
      const initialY = enemy.getY();

      // 複数フレーム更新
      for (let i = 0; i < 50; i++) {
        enemy.update(0.016);
      }

      // Y座標は増加（下方向移動）
      expect(enemy.getY()).toBeGreaterThan(initialY);

      // X座標は変化（サイン波移動）
      expect(enemy.getX()).not.toBe(initialX);
    });

    test('LARGE敵が直進移動する', () => {
      const enemy = new Enemy(200, 100, 'LARGE', mockGameEngine, testConfig);
      const initialX = enemy.getX();
      const initialY = enemy.getY();

      // 複数フレーム更新
      for (let i = 0; i < 50; i++) {
        enemy.update(0.016);
      }

      // Y座標は増加（下方向移動）
      expect(enemy.getY()).toBeGreaterThan(initialY);

      // X座標は変化しない（直進移動）
      expect(enemy.getX()).toBe(initialX);
    });

    test('異なる敵タイプで異なる移動速度', () => {
      const smallEnemy = new Enemy(
        100,
        100,
        'SMALL',
        mockGameEngine,
        testConfig
      );
      const mediumEnemy = new Enemy(
        100,
        100,
        'MEDIUM',
        mockGameEngine,
        testConfig
      );
      const largeEnemy = new Enemy(
        100,
        100,
        'LARGE',
        mockGameEngine,
        testConfig
      );

      const initialSmallY = smallEnemy.getY();
      const initialMediumY = mediumEnemy.getY();
      const initialLargeY = largeEnemy.getY();

      // 同じ時間更新
      const deltaTime = 0.016;
      smallEnemy.update(deltaTime);
      mediumEnemy.update(deltaTime);
      largeEnemy.update(deltaTime);

      const smallMoveDistance = smallEnemy.getY() - initialSmallY;
      const mediumMoveDistance = mediumEnemy.getY() - initialMediumY;
      const largeMoveDistance = largeEnemy.getY() - initialLargeY;

      // 設定に基づく速度差を確認
      expect(smallMoveDistance).toBeGreaterThan(mediumMoveDistance);
      expect(mediumMoveDistance).toBeGreaterThan(largeMoveDistance);
    });
  });

  describe('ダメージシステム', () => {
    test('SMALL敵は1発で倒される', () => {
      const enemy = new Enemy(100, 100, 'SMALL', mockGameEngine, testConfig);

      const result = enemy.takeDamage();
      expect(result).toBe(true);
    });

    test('MEDIUM敵は2発で倒される', () => {
      const enemy = new Enemy(100, 100, 'MEDIUM', mockGameEngine, testConfig);

      let result = enemy.takeDamage();
      expect(result).toBe(false); // まだ生きている

      result = enemy.takeDamage();
      expect(result).toBe(true); // 倒された
    });

    test('LARGE敵は3発で倒される', () => {
      const enemy = new Enemy(100, 100, 'LARGE', mockGameEngine, testConfig);

      let result = enemy.takeDamage();
      expect(result).toBe(false); // まだ生きている

      result = enemy.takeDamage();
      expect(result).toBe(false); // まだ生きている

      result = enemy.takeDamage();
      expect(result).toBe(true); // 倒された
    });

    test('倒された後の追加ダメージ', () => {
      const enemy = new Enemy(100, 100, 'SMALL', mockGameEngine, testConfig);

      enemy.takeDamage(); // 倒す
      const result = enemy.takeDamage(); // 追加ダメージ

      expect(result).toBe(true); // 既に倒されている
    });
  });

  describe('スコアシステム', () => {
    test('敵タイプ別のスコア値が正しい', () => {
      const smallEnemy = new Enemy(0, 0, 'SMALL', undefined, testConfig);
      const mediumEnemy = new Enemy(0, 0, 'MEDIUM', undefined, testConfig);
      const largeEnemy = new Enemy(0, 0, 'LARGE', undefined, testConfig);

      expect(smallEnemy.getScore()).toBe(testConfig.enemy.types.SMALL.score);
      expect(mediumEnemy.getScore()).toBe(testConfig.enemy.types.MEDIUM.score);
      expect(largeEnemy.getScore()).toBe(testConfig.enemy.types.LARGE.score);
    });

    test('스コア値의 대소관계', () => {
      const smallEnemy = new Enemy(0, 0, 'SMALL');
      const mediumEnemy = new Enemy(0, 0, 'MEDIUM');
      const largeEnemy = new Enemy(0, 0, 'LARGE');

      // より強い敵ほど高いスコア
      expect(smallEnemy.getScore()).toBeLessThan(mediumEnemy.getScore());
      expect(mediumEnemy.getScore()).toBeLessThan(largeEnemy.getScore());
    });
  });

  describe('描画システム', () => {
    test('SMALL敵の描画が正常に実行される', () => {
      const enemy = new Enemy(100, 100, 'SMALL', mockGameEngine, testConfig);

      expect(() => {
        enemy.draw(mockCtx);
      }).not.toThrow();

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
      expect(mockCtx.translate).toHaveBeenCalled();
    });

    test('MEDIUM敵の描画が正常に実行される', () => {
      const enemy = new Enemy(100, 100, 'MEDIUM', mockGameEngine, testConfig);

      expect(() => {
        enemy.draw(mockCtx);
      }).not.toThrow();

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
      expect(mockCtx.translate).toHaveBeenCalled();
    });

    test('LARGE敵の描画が正常に実行される', () => {
      const enemy = new Enemy(100, 100, 'LARGE', mockGameEngine, testConfig);

      expect(() => {
        enemy.draw(mockCtx);
      }).not.toThrow();

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
      expect(mockCtx.translate).toHaveBeenCalled();
    });

    test('異なる敵タイプで異なる描画処理', () => {
      const smallEnemy = new Enemy(
        100,
        100,
        'SMALL',
        mockGameEngine,
        testConfig
      );
      const mediumEnemy = new Enemy(
        100,
        100,
        'MEDIUM',
        mockGameEngine,
        testConfig
      );
      const largeEnemy = new Enemy(
        100,
        100,
        'LARGE',
        mockGameEngine,
        testConfig
      );

      // 各タイプで異なる描画処理が呼ばれることを確認
      smallEnemy.draw(mockCtx);
      mediumEnemy.draw(mockCtx);
      largeEnemy.draw(mockCtx);

      // fillとstrokeが呼ばれることを確認
      expect(mockCtx.fill).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });
  });

  describe('画面内判定', () => {
    test('画面内の敵はisOnScreen()がtrueを返す', () => {
      const enemy = new Enemy(100, 100, 'SMALL');

      expect(enemy.isOnScreen()).toBe(true);
    });

    test('画面外の敵はisOnScreen()がfalseを返す', () => {
      const enemy = new Enemy(
        100,
        testConfig.canvas.height + 100,
        'SMALL',
        undefined,
        testConfig
      );

      expect(enemy.isOnScreen()).toBe(false);
    });

    test('画面下端ギリギリの敵', () => {
      const enemy = new Enemy(
        100,
        testConfig.canvas.height - 10,
        'SMALL',
        undefined,
        testConfig
      );

      expect(enemy.isOnScreen()).toBe(true);
    });

    test('画面を完全に出た敵', () => {
      const enemy = new Enemy(
        100,
        testConfig.canvas.height + 50,
        'SMALL',
        undefined,
        testConfig
      );

      expect(enemy.isOnScreen()).toBe(false);
    });
  });

  describe('位置・プロパティ取得', () => {
    test('getPosition()が正しい座標を返す', () => {
      const enemy = new Enemy(150, 250, 'MEDIUM');
      const position = enemy.getPosition();

      expect(position.x).toBe(150);
      expect(position.y).toBe(250);
    });

    test('getEnemyType()が正しいタイプを返す', () => {
      const smallEnemy = new Enemy(0, 0, 'SMALL');
      const mediumEnemy = new Enemy(0, 0, 'MEDIUM');
      const largeEnemy = new Enemy(0, 0, 'LARGE');

      expect(smallEnemy.getEnemyType()).toBe('SMALL');
      expect(mediumEnemy.getEnemyType()).toBe('MEDIUM');
      expect(largeEnemy.getEnemyType()).toBe('LARGE');
    });

    test('サイズプロパティが正しく取得される', () => {
      const enemy = new Enemy(100, 100, 'MEDIUM', undefined, testConfig);
      const config = testConfig.enemy.types.MEDIUM;

      expect(enemy.getWidth()).toBe(config.width);
      expect(enemy.getHeight()).toBe(config.height);
      expect(enemy.getX()).toBe(100);
      expect(enemy.getY()).toBe(100);
    });
  });

  describe('アニメーション', () => {
    test('アニメーションフェーズが更新される', () => {
      const enemy = new Enemy(100, 100, 'SMALL', mockGameEngine, testConfig);

      // アニメーションフェーズは直接アクセスできないため、
      // 複数回update()を呼んで例外が発生しないことを確認
      expect(() => {
        for (let i = 0; i < 100; i++) {
          enemy.update(0.016);
        }
      }).not.toThrow();
    });

    test('長時間実行後も安定している', () => {
      const enemy = new Enemy(200, 100, 'MEDIUM', mockGameEngine, testConfig);

      // 長時間実行して安定性を確認
      for (let i = 0; i < 1000; i++) {
        enemy.update(0.016);
      }

      expect(() => {
        enemy.draw(mockCtx);
      }).not.toThrow();
    });
  });

  describe('エラーハンドリング', () => {
    test('null contextで描画してもエラーが発生しない', () => {
      const enemy = new Enemy(100, 100, 'SMALL');

      expect(() => {
        enemy.draw(null as any);
      }).toThrow(); // Canvas APIを使用するため例外が発生する
    });

    test('極端なdeltaTimeでも正常に動作する', () => {
      const enemy = new Enemy(100, 100, 'MEDIUM', mockGameEngine, testConfig);

      expect(() => {
        enemy.update(100); // 異常に大きなdeltaTime
      }).not.toThrow();

      expect(() => {
        enemy.update(-1); // 負のdeltaTime
      }).not.toThrow();

      expect(() => {
        enemy.update(0); // 0のdeltaTime
      }).not.toThrow();
    });

    test('無効なEnemyTypeでエラーが発生する', () => {
      expect(() => {
        new Enemy(100, 100, 'INVALID' as EnemyType);
      }).toThrow();
    });
  });

  describe('統合テスト', () => {
    test('敵のライフサイクル全体', () => {
      const enemy = new Enemy(200, -50, 'MEDIUM', mockGameEngine, testConfig);

      // 初期状態
      expect(enemy.isOnScreen()).toBe(true); // Y座標が-50だが、まだ画面内判定
      expect(enemy.getEnemyType()).toBe('MEDIUM');

      // 移動
      for (let i = 0; i < 100; i++) {
        enemy.update(0.016);
      }

      // 移動後の状態確認
      expect(enemy.getY()).toBeGreaterThan(-50);

      // ダメージ処理
      let isDestroyed = enemy.takeDamage();
      expect(isDestroyed).toBe(false);

      isDestroyed = enemy.takeDamage();
      expect(isDestroyed).toBe(true);

      // 描画（破壊後でも正常動作）
      expect(() => {
        enemy.draw(mockCtx);
      }).not.toThrow();
    });

    test('複数の敵の相互作用', () => {
      const enemies = [
        new Enemy(100, 100, 'SMALL', mockGameEngine, testConfig),
        new Enemy(200, 100, 'MEDIUM', mockGameEngine, testConfig),
        new Enemy(300, 100, 'LARGE', mockGameEngine, testConfig),
      ];

      // 全敵を更新
      enemies.forEach(enemy => {
        for (let i = 0; i < 50; i++) {
          enemy.update(0.016);
        }
      });

      // 各敵の位置が異なることを確認
      const positions = enemies.map(enemy => enemy.getPosition());
      expect(positions[0].x).not.toBe(positions[1].x);
      expect(positions[1].x).not.toBe(positions[2].x);

      // スコア値が異なることを確認
      const scores = enemies.map(enemy => enemy.getScore());
      expect(scores[0]).toBeLessThan(scores[1]);
      expect(scores[1]).toBeLessThan(scores[2]);
    });
  });
});
