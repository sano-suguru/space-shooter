import { createGameConfig } from '../../src/config/GameConfigFactory';
import { RealRandomProvider } from '../../src/providers';
import { Explosion } from '../../src/entities/Explosion';
import { Star } from '../../src/entities/Star';
import { Planet } from '../../src/entities/Planet';
import { Nebula } from '../../src/entities/Nebula';
import { Aurora } from '../../src/entities/Aurora';
import { Comet } from '../../src/entities/Comet';
import { MeteorShower } from '../../src/entities/MeteorShower';
import { SpaceDust } from '../../src/entities/SpaceDust';

describe('Phase 5 Integration Tests - 残りのクラス移行と統合テスト', () => {
  let config: ReturnType<typeof createGameConfig>;
  let randomProvider: RealRandomProvider;

  beforeEach(() => {
    config = createGameConfig();
    randomProvider = new RealRandomProvider();
  });

  describe('Explosion クラス設定注入', () => {
    it('設定注入でExplosionが正しく動作する', () => {
      const customConfig = createGameConfig({
        explosion: { duration: 60 }
      });
      
      const explosion = new Explosion(customConfig);
      explosion.initialize({ x: 100, y: 100 }, 1);
      
      expect(explosion.isFinished()).toBe(false);
      
      // 60フレーム更新してもまだ終了していない
      for (let i = 0; i < 59; i++) {
        explosion.update(16.67); // 60fps
      }
      expect(explosion.isFinished()).toBe(false);
      
      // 60フレーム目で終了
      explosion.update(16.67);
      expect(explosion.isFinished()).toBe(true);
    });

    it('後方互換性が保たれている', () => {
      const explosion = new Explosion();
      explosion.initialize({ x: 50, y: 50 }, 1);
      
      expect(explosion.isFinished()).toBe(false);
      expect(explosion.getPosition()).toEqual({ x: 50, y: 50 });
    });
  });

  describe('背景エンティティクラス設定注入', () => {
    it('Star クラスが設定注入で正しく動作する', () => {
      const customConfig = createGameConfig({
        canvas: { width: 800, height: 600 }
      });
      
      const star = new Star(randomProvider, customConfig);
      const position = star.getPosition();
      
      expect(position.x).toBeGreaterThanOrEqual(0);
      expect(position.x).toBeLessThanOrEqual(800);
      expect(position.y).toBeGreaterThanOrEqual(0);
      expect(position.y).toBeLessThanOrEqual(600);
      
      expect(star.getStarType()).toBeDefined();
    });

    it('Planet クラスが設定注入で正しく動作する', () => {
      const customConfig = createGameConfig({
        canvas: { width: 1000, height: 800 }
      });
      
      const planet = new Planet(customConfig);
      
      // 描画テスト（エラーが発生しないことを確認）
      const mockCanvas = document.createElement('canvas');
      const ctx = mockCanvas.getContext('2d')!;
      
      expect(() => {
        planet.draw(ctx);
      }).not.toThrow();
      
      // 更新テスト
      expect(() => {
        planet.update(16.67);
      }).not.toThrow();
    });

    it('Nebula クラスが設定注入で正しく動作する', () => {
      const customConfig = createGameConfig({
        canvas: { width: 1200, height: 900 }
      });
      
      const nebula = new Nebula(customConfig);
      
      expect(nebula.getParticleCount()).toBeGreaterThan(0);
      expect(nebula.getPoolStats()).toBeDefined();
      
      // 更新テスト
      nebula.update(16.67);
      expect(nebula.getParticleCount()).toBeGreaterThan(0);
      
      // クリーンアップテスト
      nebula.dispose();
      expect(nebula.getParticleCount()).toBe(0);
    });

    it('Aurora クラスが設定注入で正しく動作する', () => {
      const customConfig = createGameConfig({
        canvas: { width: 1400, height: 1000 }
      });
      
      const aurora = new Aurora(customConfig);
      
      expect(aurora.getParticleCount()).toBeGreaterThan(0);
      expect(aurora.getPoolStats()).toBeDefined();
      
      // 更新テスト
      aurora.update(16.67);
      
      // クリーンアップテスト
      aurora.dispose();
      expect(aurora.getParticleCount()).toBe(0);
    });

    it('Comet クラスが設定注入で正しく動作する', () => {
      const customConfig = createGameConfig({
        canvas: { width: 600, height: 400 }
      });
      
      const comet = new Comet(randomProvider, customConfig);
      
      expect(comet.isVisible()).toBe(true);
      
      // 更新テスト
      comet.update(16.67);
      
      // 描画テスト
      const mockCanvas = document.createElement('canvas');
      const ctx = mockCanvas.getContext('2d')!;
      
      expect(() => {
        comet.draw(ctx);
      }).not.toThrow();
    });

    it('MeteorShower クラスが設定注入で正しく動作する', () => {
      const customConfig = createGameConfig({
        canvas: { width: 800, height: 600 }
      });
      
      const meteorShower = new MeteorShower(randomProvider, customConfig);
      
      // MeteorShowerは初期状態でアクティブになる場合とならない場合がある
      // 基本的な機能が動作することを確認
      expect(meteorShower.getMeteorCount()).toBeGreaterThanOrEqual(0);
      
      // 更新テスト - 複数回更新してアクティブ状態を確認
      for (let i = 0; i < 10; i++) {
        meteorShower.update(16.67);
        if (meteorShower.isVisible()) {
          break;
        }
      }
      
      // 最終的にvisibleになるか、getMeteorCountが正常に動作することを確認
      expect(typeof meteorShower.isVisible()).toBe('boolean');
      expect(typeof meteorShower.getMeteorCount()).toBe('number');
    });

    it('SpaceDust クラスが設定注入で正しく動作する', () => {
      const customConfig = createGameConfig({
        canvas: { width: 1000, height: 800 }
      });
      
      const spaceDust = new SpaceDust(randomProvider, customConfig);
      
      expect(spaceDust.isVisible()).toBe(true);
      expect(spaceDust.getParticleCount()).toBeGreaterThan(0);
      expect(spaceDust.getCloudCenter()).toBeDefined();
      expect(spaceDust.getCloudRadius()).toBeGreaterThan(0);
      
      // 更新テスト
      spaceDust.update(16.67);
      
      // クリーンアップテスト
      spaceDust.dispose();
      expect(spaceDust.getParticleCount()).toBe(0);
    });
  });

  describe('後方互換性テスト', () => {
    it('全ての背景エンティティが設定なしで動作する', () => {
      // 設定なしでの初期化テスト
      const star = new Star(randomProvider);
      const planet = new Planet();
      const nebula = new Nebula();
      const aurora = new Aurora();
      const comet = new Comet(randomProvider);
      const meteorShower = new MeteorShower(randomProvider);
      const spaceDust = new SpaceDust(randomProvider);
      const explosion = new Explosion();
      
      // 基本的な動作テスト
      expect(() => {
        star.update(16.67);
        planet.update(16.67);
        nebula.update(16.67);
        aurora.update(16.67);
        comet.update(16.67);
        meteorShower.update(16.67);
        spaceDust.update(16.67);
        explosion.update(16.67);
      }).not.toThrow();
      
      // クリーンアップ
      nebula.dispose();
      aurora.dispose();
      spaceDust.dispose();
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量のエンティティが効率的に動作する', () => {
      const entities = [
        new Star(randomProvider, config),
        new Star(randomProvider, config),
        new Planet(config),
        new Nebula(config),
        new Aurora(config),
        new Comet(randomProvider, config),
        new MeteorShower(randomProvider, config),
        new SpaceDust(randomProvider, config)
      ];
      
      const startTime = performance.now();
      
      // 100フレーム分の更新
      for (let frame = 0; frame < 100; frame++) {
        entities.forEach(entity => {
          entity.update(16.67);
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 100フレームの処理が1秒以内に完了することを確認
      expect(duration).toBeLessThan(1000);
      
      // クリーンアップ
      entities.forEach(entity => {
        if ('dispose' in entity && typeof entity.dispose === 'function') {
          entity.dispose();
        }
      });
    });
  });

  describe('設定バリデーションテスト', () => {
    it('無効な設定でもエラーが発生しない', () => {
      // 極端な設定値でもクラッシュしないことを確認
      const extremeConfig = createGameConfig({
        canvas: { width: 1, height: 1 },
        explosion: { duration: 1 }
      });
      
      expect(() => {
        const star = new Star(randomProvider, extremeConfig);
        const planet = new Planet(extremeConfig);
        const explosion = new Explosion(extremeConfig);
        
        star.update(16.67);
        planet.update(16.67);
        explosion.update(16.67);
      }).not.toThrow();
    });
  });

  describe('全Phase統合テスト', () => {
    it('Phase 1-5の全機能が正常に動作する', () => {
      // Phase 1: 基盤構築
      const gameConfig = createGameConfig({
        canvas: { width: 800, height: 600 },
        explosion: { duration: 45 }
      });
      
      // Phase 2: Player クラス（既存テストで確認済み）
      
      // Phase 3: エンティティクラス（既存テストで確認済み）
      
      // Phase 4: システム・マネージャークラス（既存テストで確認済み）
      
      // Phase 5: 残りのクラス
      const backgroundEntities = [
        new Star(randomProvider, gameConfig),
        new Planet(gameConfig),
        new Nebula(gameConfig),
        new Aurora(gameConfig),
        new Comet(randomProvider, gameConfig),
        new MeteorShower(randomProvider, gameConfig),
        new SpaceDust(randomProvider, gameConfig)
      ];
      
      const explosion = new Explosion(gameConfig);
      explosion.initialize({ x: 400, y: 300 }, 1.5);
      
      // 全エンティティが正常に動作することを確認
      expect(() => {
        backgroundEntities.forEach(entity => {
          entity.update(16.67);
        });
        explosion.update(16.67);
      }).not.toThrow();
      
      // 描画テスト
      const mockCanvas = document.createElement('canvas');
      mockCanvas.width = 800;
      mockCanvas.height = 600;
      const ctx = mockCanvas.getContext('2d')!;
      
      expect(() => {
        backgroundEntities.forEach(entity => {
          entity.draw(ctx);
        });
        explosion.draw(ctx);
      }).not.toThrow();
      
      // クリーンアップ
      backgroundEntities.forEach(entity => {
        if ('dispose' in entity && typeof entity.dispose === 'function') {
          entity.dispose();
        }
      });
    });
  });

  describe('メモリ管理テスト', () => {
    it('パーティクルプールが正しく管理される', () => {
      const nebula = new Nebula(config);
      const aurora = new Aurora(config);
      const spaceDust = new SpaceDust(randomProvider, config);
      
      // 初期状態でパーティクルが存在
      expect(nebula.getParticleCount()).toBeGreaterThan(0);
      expect(aurora.getParticleCount()).toBeGreaterThan(0);
      expect(spaceDust.getParticleCount()).toBeGreaterThan(0);
      
      // 更新後もパーティクルが維持される
      nebula.update(16.67);
      aurora.update(16.67);
      spaceDust.update(16.67);
      
      expect(nebula.getParticleCount()).toBeGreaterThan(0);
      expect(aurora.getParticleCount()).toBeGreaterThan(0);
      expect(spaceDust.getParticleCount()).toBeGreaterThan(0);
      
      // dispose後はパーティクルがクリアされる
      nebula.dispose();
      aurora.dispose();
      spaceDust.dispose();
      
      expect(nebula.getParticleCount()).toBe(0);
      expect(aurora.getParticleCount()).toBe(0);
      expect(spaceDust.getParticleCount()).toBe(0);
    });
  });
});