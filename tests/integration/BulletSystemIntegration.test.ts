import { createTestConfig } from '../../src/config/GameConfigFactory';
import { BaseBullet } from '../../src/entities/BaseBullet';
import { BossBullet } from '../../src/entities/BossBullet';
import { Bullet } from '../../src/entities/Bullet';
import { AdvancedBulletType, BulletConfig } from '../../src/entities/bullets';
import {
  BulletFactory,
  BossBulletConfig,
  PlayerBulletConfig,
} from '../../src/factories/BulletFactory';
import { IBullet } from '../../src/interfaces/IBullet';

describe('弾丸システム統合テスト', () => {
  const mockGameConfig = createTestConfig();

  describe('インターフェース統一性', () => {
    test('全弾丸クラスがIBulletインターフェースを実装していること', () => {
      // プレイヤー弾丸
      const playerBullet = new Bullet(100, 200, mockGameConfig);
      expect(playerBullet).toBeInstanceOf(BaseBullet);
      expect(typeof playerBullet.isActive).toBe('function');
      expect(typeof playerBullet.getOwner).toBe('function');
      expect(typeof playerBullet.getPosition).toBe('function');

      // ボス弾丸
      const bossBullet = new BossBullet(150, 250, 2, 3, mockGameConfig);
      expect(bossBullet).toBeInstanceOf(BaseBullet);
      expect(typeof bossBullet.isActive).toBe('function');
      expect(typeof bossBullet.getOwner).toBe('function');
      expect(typeof bossBullet.getPosition).toBe('function');
    });

    test('全弾丸がエンチャント効果メソッドを実装していること', () => {
      const bullets: IBullet[] = [
        new Bullet(0, 0, mockGameConfig),
        new BossBullet(0, 0, 1, 1, mockGameConfig),
      ];

      bullets.forEach(bullet => {
        // 貫通効果
        expect(typeof bullet.isPiercing).toBe('function');
        expect(typeof bullet.getPiercingCount).toBe('function');

        // 爆発効果
        expect(typeof bullet.isExplosive).toBe('function');
        expect(typeof bullet.getExplosionRadius).toBe('function');

        // ホーミング効果
        expect(typeof bullet.isHoming).toBe('function');
        expect(typeof bullet.getHomingDuration).toBe('function');

        // チェインライトニング効果
        expect(typeof bullet.hasChainLightning).toBe('function');
        expect(typeof bullet.getChainCount).toBe('function');

        // 分裂効果
        expect(typeof bullet.canSplit).toBe('function');
        expect(typeof bullet.getSplitCount).toBe('function');

        // リコシェット効果
        expect(typeof bullet.canRicochet).toBe('function');
        expect(typeof bullet.getRicochetCount).toBe('function');

        // クリティカル効果
        expect(typeof bullet.getCriticalChance).toBe('function');

        // 凍結効果
        expect(typeof bullet.hasFreezeEffect).toBe('function');
        expect(typeof bullet.getFreezeDuration).toBe('function');
      });
    });

    test('全弾丸がライフサイクルメソッドを実装していること', () => {
      const bullets: IBullet[] = [
        new Bullet(0, 0, mockGameConfig),
        new BossBullet(0, 0, 1, 1, mockGameConfig),
      ];

      bullets.forEach(bullet => {
        expect(typeof bullet.update).toBe('function');
        expect(typeof bullet.draw).toBe('function');
        expect(typeof bullet.reset).toBe('function');
      });
    });
  });

  describe('ファクトリー統合', () => {
    test('ファクトリーで生成された弾丸がインターフェースに準拠していること', () => {
      const playerConfig: PlayerBulletConfig = { x: 100, y: 200 };
      const bossConfig: BossBulletConfig = {
        x: 150,
        y: 250,
        speedX: 2,
        speedY: 3,
      };
      const specialConfig: BulletConfig = {
        type: AdvancedBulletType.HOMING,
        x: 200,
        y: 300,
        speedX: 4,
        speedY: 5,
      };

      const playerBullet = BulletFactory.createPlayerBullet(
        playerConfig,
        mockGameConfig
      );
      const bossBullet = BulletFactory.createBossBullet(
        bossConfig,
        mockGameConfig
      );
      const specialBullet = BulletFactory.createSpecialBullet(
        specialConfig,
        mockGameConfig
      );

      const bullets: IBullet[] = [playerBullet, bossBullet, specialBullet];

      bullets.forEach(bullet => {
        // 基本機能の確認
        expect(bullet.isActive()).toBe(true);
        expect(typeof bullet.getId()).toBe('string');
        expect(typeof bullet.getPosition()).toBe('object');
        expect(['player', 'enemy', 'boss']).toContain(bullet.getOwner());

        // エンチャント効果の確認（デフォルト値）
        expect(typeof bullet.isPiercing()).toBe('boolean');
        expect(typeof bullet.getPiercingCount()).toBe('number');
        expect(typeof bullet.isExplosive()).toBe('boolean');
        expect(typeof bullet.getExplosionRadius()).toBe('number');

        // ライフサイクルメソッドの確認
        expect(() => bullet.update(16.67)).not.toThrow();
        expect(() => bullet.reset()).not.toThrow();
      });
    });

    test('ファクトリーで生成された特殊弾丸が正しいエンチャント効果を持つこと', () => {
      const homingConfig: BulletConfig = {
        type: AdvancedBulletType.HOMING,
        x: 0,
        y: 0,
        speedX: 5,
        speedY: 0,
        specialParams: {
          homingDuration: 2000,
        },
      };

      const explosiveConfig: BulletConfig = {
        type: AdvancedBulletType.EXPLOSIVE,
        x: 0,
        y: 0,
        speedX: 5,
        speedY: 0,
        specialParams: {
          explosionRadius: 50,
        },
      };

      const homingBullet = BulletFactory.createSpecialBullet(
        homingConfig,
        mockGameConfig
      );
      const explosiveBullet = BulletFactory.createSpecialBullet(
        explosiveConfig,
        mockGameConfig
      );

      // ホーミング弾丸の確認
      expect(homingBullet.isHoming()).toBe(true);
      expect(homingBullet.getHomingDuration()).toBe(2000);

      // 爆発弾丸の確認
      expect(explosiveBullet.isExplosive()).toBe(true);
      expect(explosiveBullet.getExplosionRadius()).toBe(50);
    });
  });

  describe('後方互換性', () => {
    test('既存の弾丸システムとの互換性確認', () => {
      // 既存のBulletクラスが新しいインターフェースに対応していること
      const oldBullet = new Bullet(100, 200, mockGameConfig);

      // 基本機能
      expect(oldBullet.isActive()).toBe(true);
      expect(oldBullet.getOwner()).toBe('player');
      expect(oldBullet.getPosition()).toEqual({ x: 100, y: 200 });

      // エンチャント効果（デフォルト値）
      expect(oldBullet.isPiercing()).toBe(false);
      expect(oldBullet.getPiercingCount()).toBe(0);
      expect(oldBullet.isExplosive()).toBe(false);
      expect(oldBullet.getExplosionRadius()).toBe(0);

      // ライフサイクル
      expect(() => oldBullet.update(16.67)).not.toThrow();
      expect(() => oldBullet.reset()).not.toThrow();
    });

    test('既存のBossBulletクラスが新しいインターフェースに対応していること', () => {
      const oldBossBullet = new BossBullet(150, 250, 2, 3, mockGameConfig);

      // 基本機能
      expect(oldBossBullet.isActive()).toBe(true);
      expect(oldBossBullet.getOwner()).toBe('boss');
      expect(oldBossBullet.getPosition()).toEqual({ x: 150, y: 250 });

      // エンチャント効果（デフォルト値）
      expect(oldBossBullet.isPiercing()).toBe(false);
      expect(oldBossBullet.isExplosive()).toBe(false);
      expect(oldBossBullet.isHoming()).toBe(false);

      // ライフサイクル
      expect(() => oldBossBullet.update(16.67)).not.toThrow();
      expect(() => oldBossBullet.reset()).not.toThrow();
    });
  });

  describe('型安全性統合テスト', () => {
    test('全ての弾丸タイプが同じインターフェースで扱えること', () => {
      const bullets: IBullet[] = [
        BulletFactory.createPlayerBullet({ x: 0, y: 0 }, mockGameConfig),
        BulletFactory.createBossBullet(
          { x: 0, y: 0, speedX: 1, speedY: 1 },
          mockGameConfig
        ),
        BulletFactory.createSpecialBullet(
          {
            type: AdvancedBulletType.HOMING,
            x: 0,
            y: 0,
            speedX: 1,
            speedY: 1,
          },
          mockGameConfig
        ),
      ];

      // 統一されたインターフェースで操作できることを確認
      bullets.forEach(bullet => {
        bullet.deactivate();
        expect(bullet.isActive()).toBe(false);

        const position = bullet.getPosition();
        expect(typeof position.x).toBe('number');
        expect(typeof position.y).toBe('number');

        const id = bullet.getId();
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
      });
    });

    test('弾丸配列の型安全な操作', () => {
      const bullets: IBullet[] = [];

      // 異なるタイプの弾丸を同じ配列に格納
      bullets.push(
        BulletFactory.createPlayerBullet({ x: 10, y: 20 }, mockGameConfig)
      );
      bullets.push(
        BulletFactory.createBossBullet(
          { x: 30, y: 40, speedX: 1, speedY: 1 },
          mockGameConfig
        )
      );
      bullets.push(
        BulletFactory.createSpecialBullet(
          {
            type: AdvancedBulletType.EXPLOSIVE,
            x: 50,
            y: 60,
            speedX: 2,
            speedY: 2,
          },
          mockGameConfig
        )
      );

      // 統一されたインターフェースで一括処理
      const activeBullets = bullets.filter(bullet => bullet.isActive());
      expect(activeBullets.length).toBe(3);

      const bulletIds = bullets.map(bullet => bullet.getId());
      expect(bulletIds.length).toBe(3);
      expect(new Set(bulletIds).size).toBe(3); // 全てユニーク
    });
  });

  describe('パフォーマンス統合テスト', () => {
    test('大量の弾丸生成と操作のパフォーマンス', () => {
      const startTime = performance.now();

      const bullets: IBullet[] = [];

      // 1000個の弾丸を生成
      for (let i = 0; i < 1000; i++) {
        const bulletType = i % 3;
        switch (bulletType) {
          case 0:
            bullets.push(
              BulletFactory.createPlayerBullet({ x: i, y: i }, mockGameConfig)
            );
            break;
          case 1:
            bullets.push(
              BulletFactory.createBossBullet(
                { x: i, y: i, speedX: 1, speedY: 1 },
                mockGameConfig
              )
            );
            break;
          case 2:
            bullets.push(
              BulletFactory.createSpecialBullet(
                {
                  type: AdvancedBulletType.HOMING,
                  x: i,
                  y: i,
                  speedX: 1,
                  speedY: 1,
                },
                mockGameConfig
              )
            );
            break;
        }
      }

      // 全弾丸の更新処理
      bullets.forEach(bullet => bullet.update(16.67));

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(bullets.length).toBe(1000);
      expect(duration).toBeLessThan(1000); // 1秒以内に完了
    });

    test('弾丸のリセットとリサイクルのパフォーマンス', () => {
      const bullets: IBullet[] = [];

      // 100個の弾丸を生成
      for (let i = 0; i < 100; i++) {
        bullets.push(
          BulletFactory.createPlayerBullet({ x: i, y: i }, mockGameConfig)
        );
      }

      const startTime = performance.now();

      // 全弾丸をリセット
      bullets.forEach(bullet => bullet.reset());

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // 100ms以内に完了
    });
  });

  describe('エラーハンドリング統合テスト', () => {
    test('不正な設定での弾丸生成エラーハンドリング', () => {
      // 不正な特殊弾丸タイプ
      expect(() => {
        BulletFactory.createSpecialBullet(
          {
            type: 'invalid' as AdvancedBulletType,
            x: 0,
            y: 0,
            speedX: 1,
            speedY: 1,
          },
          mockGameConfig
        );
      }).toThrow();
    });

    test('極端な値での弾丸操作の安全性', () => {
      const bullet = BulletFactory.createPlayerBullet(
        { x: Infinity, y: -Infinity },
        mockGameConfig
      );

      expect(() => {
        bullet.update(NaN);
        bullet.update(Infinity);
        bullet.update(-Infinity);
      }).not.toThrow();

      expect(() => {
        bullet.deactivate();
        bullet.reset();
      }).not.toThrow();
    });
  });

  describe('メモリ効率性統合テスト', () => {
    test('弾丸のライフサイクル管理', () => {
      const bullets: IBullet[] = [];

      // 弾丸を生成
      for (let i = 0; i < 50; i++) {
        bullets.push(
          BulletFactory.createPlayerBullet({ x: i, y: i }, mockGameConfig)
        );
      }

      // 一部の弾丸を非アクティブ化
      bullets.slice(0, 25).forEach(bullet => bullet.deactivate());

      // アクティブな弾丸のみをフィルタリング
      const activeBullets = bullets.filter(bullet => bullet.isActive());
      expect(activeBullets.length).toBe(25);

      // 非アクティブな弾丸をリセット（再利用準備）
      bullets
        .filter(bullet => !bullet.isActive())
        .forEach(bullet => bullet.reset());

      // リセット後の状態確認
      const resetBullets = bullets.filter(bullet => !bullet.isActive());
      expect(resetBullets.length).toBe(25);
    });
  });
});
