/**
 * 武器ビジュアルシステム統合デモ
 *
 * このファイルは統合されたシステムの動作確認とデバッグに使用します。
 */

import { EnhancedWeaponBulletFactory } from '../services/EnhancedWeaponBulletFactory';
import { EnchantmentType } from '../types/EnchantmentTypes';
import { WeaponType, WeaponRarity } from '../types/WeaponTypes';

/**
 * ビジュアル統合デモクラス
 */
export class VisualIntegrationDemo {
  private enhancedFactory: EnhancedWeaponBulletFactory;

  constructor() {
    this.enhancedFactory = new EnhancedWeaponBulletFactory();
  }

  /**
   * 基本的なビジュアル効果のデモ
   */
  public demonstrateBasicVisuals(): void {
    console.log('🎨 基本ビジュアル効果デモを開始...');

    // サンプル武器設定
    const weaponConfig = {
      id: 'demo_plasma',
      name: 'デモプラズマキャノン',
      description: 'ビジュアル効果デモ用',
      type: WeaponType.PLASMA_CANNON,
      rarity: WeaponRarity.RARE,
      damage: 50,
      fireRate: 300,
      bulletSpeed: 400,
      bulletCount: 1,
      unlockCondition: () => true,
      cost: 0,
      maxLevel: 5,
      icon: '🔫',
      color: '#aa00ff',
    };

    // エンチャント効果なしの弾丸
    const basicBullet = this.enhancedFactory.createVisualBullet(
      weaponConfig,
      { x: 100, y: 100 },
      { x: 0, y: -1 }
    );

    console.log('✅ 基本弾丸作成完了:', {
      hasCustomVisuals: basicBullet.isCustomVisualsEnabled(),
      weaponConfig: basicBullet.getWeaponConfig()?.name,
    });
  }

  /**
   * エンチャント効果付きビジュアルのデモ
   */
  public demonstrateEnchantedVisuals(): void {
    console.log('✨ エンチャント効果ビジュアルデモを開始...');

    const weaponConfig = {
      id: 'demo_enchanted',
      name: 'デモエンチャント武器',
      description: 'エンチャント効果デモ用',
      type: WeaponType.ENERGY_BEAM,
      rarity: WeaponRarity.LEGENDARY,
      damage: 100,
      fireRate: 200,
      bulletSpeed: 500,
      bulletCount: 3,
      unlockCondition: () => true,
      cost: 0,
      maxLevel: 10,
      icon: '⚡',
      color: '#ff8000',
    };

    // 複数のエンチャント効果
    const enchantments = [
      EnchantmentType.DAMAGE_BOOST,
      EnchantmentType.EXPLOSIVE_ROUNDS,
      EnchantmentType.CHAIN_LIGHTNING,
    ];

    const enchantedBullets = this.enhancedFactory.createMultipleVisualBullets(
      weaponConfig,
      { x: 200, y: 200 },
      { x: 0, y: -1 },
      enchantments
    );

    console.log('✅ エンチャント弾丸作成完了:', {
      bulletCount: enchantedBullets.length,
      enchantments: enchantments.length,
      firstBulletEnchantments: enchantedBullets[0]?.getEnchantments().length,
    });
  }

  /**
   * 武器タイプ別ビジュアルのデモ
   */
  public demonstrateWeaponTypeVisuals(): void {
    console.log('🔫 武器タイプ別ビジュアルデモを開始...');

    const weaponTypes = [
      WeaponType.BASIC_LASER,
      WeaponType.PLASMA_CANNON,
      WeaponType.MISSILE_LAUNCHER,
      WeaponType.ENERGY_BEAM,
    ];

    weaponTypes.forEach((weaponType, index) => {
      const weaponConfig = {
        id: `demo_${weaponType}`,
        name: `デモ${weaponType}`,
        description: `${weaponType}のビジュアルデモ`,
        type: weaponType,
        rarity: WeaponRarity.UNCOMMON,
        damage: 25 + index * 10,
        fireRate: 250,
        bulletSpeed: 350,
        bulletCount: 1,
        unlockCondition: () => true,
        cost: 0,
        maxLevel: 3,
        icon: '🎯',
        color: `hsl(${index * 90}, 70%, 50%)`,
      };

      const bullets = this.enhancedFactory.createWeaponTypeVisualBullet(
        weaponType,
        weaponConfig,
        { x: 50 + index * 50, y: 300 },
        { x: 0, y: -1 }
      );

      console.log(`✅ ${weaponType} 弾丸作成完了:`, {
        bulletCount: bullets.length,
        weaponType,
      });
    });
  }

  /**
   * パフォーマンステスト
   */
  public performanceTest(): void {
    console.log('⚡ パフォーマンステストを開始...');

    const startTime = performance.now();
    const bulletCount = 100;
    const bullets = [];

    const weaponConfig = {
      id: 'perf_test',
      name: 'パフォーマンステスト武器',
      description: 'パフォーマンステスト用',
      type: WeaponType.RAPID_FIRE,
      rarity: WeaponRarity.COMMON,
      damage: 10,
      fireRate: 100,
      bulletSpeed: 600,
      bulletCount: 1,
      unlockCondition: () => true,
      cost: 0,
      maxLevel: 1,
      icon: '💨',
      color: '#ffffff',
    };

    // 大量の弾丸を作成
    for (let i = 0; i < bulletCount; i++) {
      const bullet = this.enhancedFactory.createVisualBullet(
        weaponConfig,
        { x: Math.random() * 800, y: Math.random() * 600 },
        { x: 0, y: -1 },
        [EnchantmentType.DAMAGE_BOOST]
      );
      bullets.push(bullet);
    }

    const endTime = performance.now();
    const creationTime = endTime - startTime;

    // 統計情報を取得
    const stats = this.enhancedFactory.getEnhancedStats();

    console.log('📊 パフォーマンステスト結果:', {
      弾丸数: bulletCount,
      作成時間: `${creationTime.toFixed(2)}ms`,
      平均作成時間: `${(creationTime / bulletCount).toFixed(4)}ms/bullet`,
      プール統計: stats.poolStats,
      ビジュアル統計: stats.visualStats,
    });

    // クリーンアップ
    this.enhancedFactory.cleanupBulletVisuals(bullets);
    console.log('🧹 クリーンアップ完了');
  }

  /**
   * 統合テストの実行
   */
  public runIntegrationTest(): void {
    console.log('🚀 武器ビジュアルシステム統合テストを開始...');
    console.log('='.repeat(50));

    try {
      this.demonstrateBasicVisuals();
      console.log('');

      this.demonstrateEnchantedVisuals();
      console.log('');

      this.demonstrateWeaponTypeVisuals();
      console.log('');

      this.performanceTest();
      console.log('');

      console.log('✅ 統合テスト完了 - すべてのテストが成功しました！');
    } catch (error) {
      console.error('❌ 統合テスト中にエラーが発生しました:', error);
    }

    console.log('='.repeat(50));
  }

  /**
   * リソースクリーンアップ
   */
  public cleanup(): void {
    this.enhancedFactory.cleanup();
    console.log('🧹 VisualIntegrationDemo クリーンアップ完了');
  }
}

/**
 * デモの実行（開発時のテスト用）
 */
export function runVisualIntegrationDemo(): void {
  const demo = new VisualIntegrationDemo();
  demo.runIntegrationTest();
  demo.cleanup();
}

// 開発時のテスト実行
if (typeof window !== 'undefined') {
  // デバッグモードまたは開発環境で自動実行
  const isDebugMode = (window as Window & { DEBUG_MODE?: boolean }).DEBUG_MODE;
  const isDevelopment = import.meta.env.DEV;

  if (isDebugMode || isDevelopment) {
    console.log('🎮 ビジュアル統合デモを実行中...', {
      debugMode: isDebugMode,
      development: isDevelopment,
    });

    // 少し遅延させてから実行（他のシステムの初期化を待つ）
    setTimeout(() => {
      try {
        runVisualIntegrationDemo();
      } catch (error) {
        console.error('❌ ビジュアル統合デモでエラーが発生:', error);
      }
    }, 1000);
  }
}
