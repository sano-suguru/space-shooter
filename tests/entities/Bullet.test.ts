import { createGameConfig } from '../../src/config/GameConfigFactory';
import { Bullet } from '../../src/entities/Bullet';
import '../canvas.setup';

describe('Bullet', () => {
  let mockCtx: CanvasRenderingContext2D;

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
      lineCap: 'butt',
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      arc: jest.fn(),
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      createRadialGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
    } as any;
  });

  describe('初期化', () => {
    test('デフォルト設定で初期化される', () => {
      const bullet = new Bullet(100, 200);

      expect(bullet.getX()).toBe(100);
      expect(bullet.getY()).toBe(200);
      expect(bullet.isActive()).toBe(true);
    });

    test('カスタム設定で初期化される', () => {
      const config = createGameConfig({
        bullet: {
          width: 10,
          height: 20,
          speed: 800,
        },
      });

      const bullet = new Bullet(50, 100, config);

      expect(bullet.getX()).toBe(50);
      expect(bullet.getY()).toBe(100);
      expect(bullet.getWidth()).toBe(10);
      expect(bullet.getHeight()).toBe(20);
    });

    test('initialize メソッドで再初期化される', () => {
      const bullet = new Bullet();
      bullet.initialize(150, 250, 500, '#ff0000');

      expect(bullet.getX()).toBe(150);
      expect(bullet.getY()).toBe(250);
      expect(bullet.isActive()).toBe(true);
    });
  });

  describe('移動システム', () => {
    test('上方向に移動する', () => {
      const bullet = new Bullet(100, 200);
      const initialY = bullet.getY();

      bullet.update(0.016);

      expect(bullet.getY()).toBeLessThan(initialY);
    });

    test('非アクティブ時は移動しない', () => {
      const bullet = new Bullet(100, 200);
      bullet.deactivate();
      const initialY = bullet.getY();

      bullet.update(0.016);

      expect(bullet.getY()).toBe(initialY);
    });
  });

  describe('描画システム', () => {
    test('アクティブ時に描画される', () => {
      const bullet = new Bullet(100, 100);

      expect(() => {
        bullet.draw(mockCtx);
      }).not.toThrow();

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    test('非アクティブ時は描画されない', () => {
      const bullet = new Bullet(100, 100);
      bullet.deactivate();

      bullet.draw(mockCtx);

      expect(mockCtx.save).not.toHaveBeenCalled();
    });
  });

  describe('状態管理', () => {
    test('画面内判定が正しく動作する', () => {
      const bullet = new Bullet(100, 100);
      expect(bullet.isOnScreen()).toBe(true);

      // 画面外に移動
      // Config creation test - ensuring no errors during creation
      createGameConfig();
      for (let i = 0; i < 100; i++) {
        bullet.update(0.016);
      }
      expect(bullet.isOnScreen()).toBe(false);
    });

    test('リセット機能が正常に動作する', () => {
      const bullet = new Bullet(100, 200);
      bullet.initialize(150, 250, 500, '#ff0000');

      bullet.reset();

      expect(bullet.getX()).toBe(0);
      expect(bullet.getY()).toBe(0);
      expect(bullet.isActive()).toBe(false);
    });

    test('位置取得が正しく動作する', () => {
      const bullet = new Bullet(123, 456);
      const position = bullet.getPosition();

      expect(position.x).toBe(123);
      expect(position.y).toBe(456);
    });
  });

  describe('設定注入テスト', () => {
    test('カスタム設定が正しく適用される', () => {
      const customConfig = createGameConfig({
        bullet: {
          width: 8,
          height: 20,
          speed: 700,
        },
      });

      const bullet = new Bullet(0, 0, customConfig);
      bullet.initialize(100, 100);

      const initialY = bullet.getY();
      bullet.update(0.016);

      // カスタム速度で移動していることを確認
      const moveDistance = initialY - bullet.getY();
      expect(moveDistance).toBeGreaterThan(0);
    });
  });
});
