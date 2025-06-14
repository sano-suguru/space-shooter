# GameConstants テスタブル設計移行計画

## 📋 概要

GameConstants調査結果を基に、テスタブルな設計への移行計画を策定しました。段階的移行を重視し、既存コードへの影響を最小化しながら、テスト容易性を向上させます。

## 🔍 現状分析

### 問題点
- **114箇所での直接参照**: 全体的な強結合状態
- **循環依存**: GameConstants → Player → GameConstants
- **副作用を持つ関数**: PowerUp効果が定数内で定義
- **テスト困難性**: グローバル状態への強依存

### 調査結果の詳細
```typescript
// 現在の問題のある構造
export const GAME_CONSTANTS = {
  POWERUP: {
    TYPES: {
      RAPID_FIRE: {
        effect: (player: Player) => { 
          player.setFireRate(GAME_CONSTANTS.PLAYER.FIRE_RATE / 2); // 循環依存
        }
      }
    }
  }
};
```

## 🏗️ アーキテクチャ設計

```mermaid
graph TB
    subgraph "新しいアーキテクチャ"
        CF[ConfigFactory] --> GC[GameConfig]
        CF --> TC[TestConfig]
        
        GC --> DI[DependencyInjection]
        TC --> DI
        
        DI --> P[Player]
        DI --> E[Enemy]
        DI --> PU[PowerUp]
        
        PES[PowerUpEffectService] --> P
        PES --> GC
        
        V[ZodValidator] --> CF
    end
    
    subgraph "既存システム（段階的移行）"
        OGC[GAME_CONSTANTS] -.-> CF
        OGC -.-> "Legacy Code"
    end
    
    style CF fill:#e1f5fe
    style PES fill:#f3e5f5
    style V fill:#e8f5e8
```

### 設計原則
1. **設定ファクトリーパターン**: 動的設定生成とテスト用設定の分離
2. **依存性注入**: コンストラクタ注入による設定の受け渡し
3. **副作用の分離**: PowerUp効果を外部サービスに分離
4. **段階的移行**: 既存コードとの互換性を保ちながら移行

## 📋 段階的移行戦略

### Phase 1: 基盤構築（影響最小）
**期間**: 1-2週間
**目標**: 新しいアーキテクチャの基盤を構築

1. **設定ファクトリーの導入**
   - `src/config/GameConfigFactory.ts` 作成
   - Zodバリデーション追加
   - デフォルト設定とテスト設定の分離

2. **PowerUpEffectServiceの分離**
   - `src/services/PowerUpEffectService.ts` 作成
   - 副作用を持つ関数の外部化
   - 循環依存の解決

3. **バリデーション機能の追加**
   - 設定値の型安全性確保
   - ランタイムバリデーション

### Phase 2: 依存性注入の実装
**期間**: 1週間
**目標**: Playerクラスから段階的に依存性注入を導入

1. **コンストラクタ注入の段階的導入**
   - Player クラスのコンストラクタ修正
   - 既存の GAME_CONSTANTS 参照を config 参照に変更

2. **既存コードとの互換性維持**
   - レガシーコードとの共存
   - 段階的な移行パス

### Phase 3: 循環依存の解決
**期間**: 2-3週間
**目標**: 他のエンティティクラスの移行

1. **PowerUp効果の完全分離**
   - PowerUpEffectService の完全実装
   - 効果の適用・解除ロジックの分離

2. **設定と実装の分離**
   - Enemy, PowerUp, Boss クラスの順次移行
   - 各クラスのテスト更新

### Phase 4: 全面移行
**期間**: 2週間
**目標**: レガシーコードの完全置換

1. **レガシーコードの段階的置換**
   - GAME_CONSTANTS の段階的削除
   - 全システムでの新しい設定システム使用

2. **テストカバレッジの向上**
   - 統合テストの追加
   - パフォーマンステストの実施

## 🔧 実装設計

### 1. 設定ファクトリーパターン

```typescript
// src/config/GameConfigFactory.ts
import { z } from 'zod';

const GameConfigSchema = z.object({
  canvas: z.object({
    width: z.number().positive(),
    height: z.number().positive()
  }),
  player: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    maxSpeed: z.number().positive(),
    acceleration: z.number().positive(),
    deceleration: z.number().positive(),
    maxHealth: z.number().positive(),
    invincibilityTime: z.number().positive(),
    fireRate: z.number().positive(),
    colors: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
      engine: z.string()
    })
  }),
  enemy: z.object({
    spawnInterval: z.number().positive(),
    types: z.record(z.object({
      width: z.number().positive(),
      height: z.number().positive(),
      speed: z.number().positive(),
      health: z.number().positive(),
      score: z.number().positive(),
      color: z.string()
    }))
  }),
  powerup: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    speed: z.number().positive(),
    duration: z.number().positive(),
    spawnChance: z.number().min(0).max(1)
  }),
  boss: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    bulletSpeed: z.number().positive(),
    fireRate: z.number().positive(),
    initialHealth: z.number().positive(),
    initialSpeed: z.number().positive(),
    movementSpeed: z.number().positive()
  }),
  explosion: z.object({
    duration: z.number().positive()
  }),
  background: z.object({
    starCount: z.number().positive(),
    planetCount: z.number().positive(),
    nebulaCount: z.number().positive()
  }),
  wave: z.object({
    systemEnabled: z.boolean(),
    clearBonusMultiplier: z.number().positive(),
    formationSpacing: z.number().positive(),
    spawnDelayBase: z.number().positive(),
    waveClearDelay: z.number().positive()
  })
});

export type GameConfig = z.infer<typeof GameConfigSchema>;

export function createGameConfig(overrides?: Partial<GameConfig>): GameConfig {
  const defaultConfig: GameConfig = {
    canvas: {
      width: 400,
      height: 600
    },
    player: {
      width: 50,
      height: 50,
      maxSpeed: 8,
      acceleration: 1.2,
      deceleration: 0.6,
      maxHealth: 100,
      invincibilityTime: 1000,
      fireRate: 200,
      colors: {
        primary: '#1a237e',
        secondary: '#3f51b5',
        accent: '#00bcd4',
        engine: '#ff9800'
      }
    },
    enemy: {
      spawnInterval: 1000,
      types: {
        SMALL: { width: 30, height: 30, speed: 180, health: 1, score: 10, color: '#7c4dff' },
        MEDIUM: { width: 50, height: 50, speed: 120, health: 2, score: 20, color: '#26c6da' },
        LARGE: { width: 70, height: 70, speed: 60, health: 3, score: 30, color: '#66bb6a' }
      }
    },
    powerup: {
      width: 30,
      height: 30,
      speed: 100,
      duration: 10000,
      spawnChance: 0.05
    },
    boss: {
      width: 150,
      height: 150,
      bulletSpeed: 200,
      fireRate: 1000,
      initialHealth: 50,
      initialSpeed: 50,
      movementSpeed: 50
    },
    explosion: {
      duration: 30
    },
    background: {
      starCount: 100,
      planetCount: 2,
      nebulaCount: 1
    },
    wave: {
      systemEnabled: true,
      clearBonusMultiplier: 2,
      formationSpacing: 40,
      spawnDelayBase: 200,
      waveClearDelay: 2000
    }
  };
  
  const mergedConfig = mergeConfigs(defaultConfig, overrides || {});
  return validateConfig(mergedConfig);
}

export function createTestConfig(testOverrides?: Partial<GameConfig>): GameConfig {
  const testDefaults: Partial<GameConfig> = {
    player: {
      fireRate: 50, // テスト用高速化
      invincibilityTime: 100 // テスト用短縮
    },
    enemy: {
      spawnInterval: 100 // テスト用高速化
    },
    powerup: {
      duration: 1000, // テスト用短縮
      spawnChance: 1.0 // テスト用確実出現
    }
  };
  
  return createGameConfig({
    ...testDefaults,
    ...testOverrides
  });
}

function mergeConfigs(base: GameConfig, override: Partial<GameConfig>): GameConfig {
  // Deep merge implementation
  return {
    ...base,
    ...override,
    player: { ...base.player, ...override.player },
    enemy: { 
      ...base.enemy, 
      ...override.enemy,
      types: { ...base.enemy.types, ...override.enemy?.types }
    },
    powerup: { ...base.powerup, ...override.powerup },
    boss: { ...base.boss, ...override.boss },
    explosion: { ...base.explosion, ...override.explosion },
    background: { ...base.background, ...override.background },
    wave: { ...base.wave, ...override.wave }
  };
}

function validateConfig(config: GameConfig): GameConfig {
  try {
    return GameConfigSchema.parse(config);
  } catch (error) {
    console.error('Invalid game configuration:', error);
    throw new Error('Game configuration validation failed');
  }
}
```

### 2. PowerUpEffectService

```typescript
// src/services/PowerUpEffectService.ts
import { PowerUpType } from '../types';
import { Player } from '../entities/Player';
import { GameConfig } from '../config/GameConfigFactory';

export class PowerUpEffectService {
  constructor(private config: GameConfig) {}
  
  applyEffect(player: Player, type: PowerUpType): void {
    switch (type) {
      case 'RAPID_FIRE':
        player.setFireRate(this.config.player.fireRate / 2);
        break;
      case 'TRIPLE_SHOT':
        player.setBulletType('triple');
        break;
      case 'SHIELD':
        player.activateShield();
        break;
      default:
        console.warn(`Unknown power-up type: ${type}`);
    }
  }
  
  removeEffect(player: Player, type: PowerUpType): void {
    switch (type) {
      case 'RAPID_FIRE':
        player.setFireRate(this.config.player.fireRate);
        break;
      case 'TRIPLE_SHOT':
        player.setBulletType('single');
        break;
      case 'SHIELD':
        player.deactivateShield();
        break;
      default:
        console.warn(`Unknown power-up type: ${type}`);
    }
  }
  
  getEffectDuration(type: PowerUpType): number {
    return this.config.powerup.duration;
  }
}
```

### 3. 依存性注入の実装

```typescript
// src/entities/Player.ts (改修版の主要部分)
export class Player extends GameObject {
  private velocity: Vector2D = { x: 0, y: 0 };
  private health: number;
  private maxHealth: number;
  private fireRate: number;
  // ... 他のプロパティ

  constructor(
    private eventEmitter: EventEmitter<EventMap>,
    private inputManager: IInputManager,
    private randomProvider: IRandomProvider,
    private config: GameConfig, // 新規追加
    private powerUpEffectService?: PowerUpEffectService // 新規追加
  ) {
    super(
      config.canvas.width / 2 - config.player.width / 2,
      config.canvas.height - config.player.height - 10,
      config.player.width,
      config.player.height
    );
    this.health = config.player.maxHealth;
    this.maxHealth = config.player.maxHealth;
    this.fireRate = config.player.fireRate;
    this.playerRenderer = new PlayerRenderer();
  }

  private updateVelocity(): void {
    const { acceleration, deceleration, maxSpeed } = this.config.player;

    // X軸移動
    if (this.inputManager.isKeyPressed('ArrowLeft')) {
      this.velocity.x = Math.max(this.velocity.x - acceleration, -maxSpeed);
    } else if (this.inputManager.isKeyPressed('ArrowRight')) {
      this.velocity.x = Math.min(this.velocity.x + acceleration, maxSpeed);
    } else {
      // 減速処理
      if (this.velocity.x > 0) {
        this.velocity.x = Math.max(0, this.velocity.x - deceleration);
      } else if (this.velocity.x < 0) {
        this.velocity.x = Math.min(0, this.velocity.x + deceleration);
      }
    }

    // Y軸移動（同様の実装）
    // ...
  }

  private clampPosition(): void {
    const { canvas } = this.config;

    // 境界チェック
    if (this.x < 0) {
      this.x = 0;
      this.velocity.x = 0;
    } else if (this.x > canvas.width - this.width) {
      this.x = canvas.width - this.width;
      this.velocity.x = 0;
    }

    if (this.y < 0) {
      this.y = 0;
      this.velocity.y = 0;
    } else if (this.y > canvas.height - this.height) {
      this.y = canvas.height - this.height;
      this.velocity.y = 0;
    }
  }

  public activatePowerup(type: PowerUpType): void {
    if (this.powerUpEffectService) {
      this.powerUpEffectService.applyEffect(this, type);
      this.eventEmitter.emit('powerUpActivated', type);

      const duration = this.powerUpEffectService.getEffectDuration(type);
      setTimeout(() => {
        this.powerUpEffectService?.removeEffect(this, type);
        this.eventEmitter.emit('powerUpDeactivated', type);
      }, duration);
    }
  }

  private updateInvincibility(): void {
    if (this.invincible && Date.now() - this.lastHitTime > this.config.player.invincibilityTime) {
      this.invincible = false;
    }
  }

  // ... 他のメソッド
}
```

## 🧪 テスト戦略

### 1. 単体テスト改善

```typescript
// tests/entities/Player.test.ts
import { Player } from '../../src/entities/Player';
import { createTestConfig } from '../../src/config/GameConfigFactory';
import { PowerUpEffectService } from '../../src/services/PowerUpEffectService';

describe('Player', () => {
  let player: Player;
  let mockConfig: GameConfig;
  let mockPowerUpService: PowerUpEffectService;
  let mockEventEmitter: EventEmitter<EventMap>;
  let mockInputManager: IInputManager;
  let mockRandomProvider: IRandomProvider;
  
  beforeEach(() => {
    mockConfig = createTestConfig({
      player: { 
        fireRate: 100, 
        maxSpeed: 10,
        invincibilityTime: 500
      }
    });
    
    mockPowerUpService = new PowerUpEffectService(mockConfig);
    mockEventEmitter = new EventEmitter();
    mockInputManager = new MockInputManager();
    mockRandomProvider = new MockRandomProvider();
    
    player = new Player(
      mockEventEmitter,
      mockInputManager,
      mockRandomProvider,
      mockConfig,
      mockPowerUpService
    );
  });
  
  it('should use injected config for movement', () => {
    // テスト用設定での動作確認
    expect(player.getMaxHealth()).toBe(mockConfig.player.maxHealth);
  });

  it('should apply power-up effects through service', () => {
    const originalFireRate = player.getFireRate();
    player.activatePowerup('RAPID_FIRE');
    expect(player.getFireRate()).toBe(originalFireRate / 2);
  });

  it('should respect config boundaries', () => {
    // 境界値テスト
    player.x = -10;
    player.update(16); // 1フレーム更新
    expect(player.x).toBe(0);
  });
});
```

### 2. 統合テスト強化

```typescript
// tests/integration/ConfigurableGame.test.ts
describe('Configurable Game', () => {
  it('should work with different configurations', () => {
    const fastConfig = createTestConfig({
      enemy: { spawnInterval: 100 },
      player: { fireRate: 50 },
      powerup: { spawnChance: 1.0 }
    });
    
    const game = new Game(
      canvas, 
      eventEmitter, 
      scoreManager,
      new Player(eventEmitter, inputManager, randomProvider, fastConfig),
      gameObjectFactory,
      stateManager,
      inputManager,
      randomProvider,
      messageManager,
      fastConfig // 設定を注入
    );
    
    // 高速設定でのゲーム動作テスト
    game.start();
    
    // パワーアップが確実に出現することを確認
    jest.advanceTimersByTime(1000);
    expect(game.getGameObjectManager().getPowerups().length).toBeGreaterThan(0);
  });

  it('should maintain performance with custom config', () => {
    const performanceConfig = createTestConfig({
      background: { starCount: 50 }, // 軽量化
      enemy: { spawnInterval: 2000 } // 低頻度
    });
    
    const startTime = performance.now();
    const game = new Game(/* ... */, performanceConfig);
    
    // パフォーマンステスト
    for (let i = 0; i < 100; i++) {
      game.updateGameObjects(16);
    }
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(100); // 100ms以内
  });
});
```

### 3. PowerUpEffectService テスト

```typescript
// tests/services/PowerUpEffectService.test.ts
describe('PowerUpEffectService', () => {
  let service: PowerUpEffectService;
  let mockPlayer: Player;
  let testConfig: GameConfig;

  beforeEach(() => {
    testConfig = createTestConfig();
    service = new PowerUpEffectService(testConfig);
    mockPlayer = createMockPlayer();
  });

  it('should apply rapid fire effect', () => {
    service.applyEffect(mockPlayer, 'RAPID_FIRE');
    expect(mockPlayer.setFireRate).toHaveBeenCalledWith(
      testConfig.player.fireRate / 2
    );
  });

  it('should remove effects correctly', () => {
    service.applyEffect(mockPlayer, 'RAPID_FIRE');
    service.removeEffect(mockPlayer, 'RAPID_FIRE');
    expect(mockPlayer.setFireRate).toHaveBeenLastCalledWith(
      testConfig.player.fireRate
    );
  });

  it('should handle unknown power-up types gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    service.applyEffect(mockPlayer, 'UNKNOWN' as PowerUpType);
    expect(consoleSpy).toHaveBeenCalledWith('Unknown power-up type: UNKNOWN');
    consoleSpy.mockRestore();
  });
});
```

## 📊 移行手順書

### Step 1: 基盤準備（1-2週間）

#### 1.1 ディレクトリ構造作成
```bash
mkdir -p src/config
mkdir -p src/services
mkdir -p tests/config
mkdir -p tests/services
```

#### 1.2 依存関係追加
```bash
npm install zod
npm install --save-dev @types/jest
```

#### 1.3 ファイル作成順序
1. `src/config/GameConfigFactory.ts`
2. `src/services/PowerUpEffectService.ts`
3. `tests/config/GameConfigFactory.test.ts`
4. `tests/services/PowerUpEffectService.test.ts`

#### 1.4 検証項目
- [ ] 設定ファクトリーが正常に動作する
- [ ] バリデーションが適切に機能する
- [ ] テスト設定が生成できる
- [ ] PowerUpEffectService が独立して動作する

### Step 2: Player クラス移行（1週間）

#### 2.1 Player クラス修正
1. コンストラクタに `GameConfig` と `PowerUpEffectService` を追加
2. `GAME_CONSTANTS` 参照を `this.config` 参照に変更
3. `activatePowerup` メソッドを PowerUpEffectService 使用に変更

#### 2.2 テスト更新
1. `tests/entities/Player.test.ts` を新しい構造に対応
2. 設定注入のテストケース追加
3. PowerUp効果のテストケース更新

#### 2.3 検証項目
- [ ] Player クラスが設定注入で動作する
- [ ] 既存の動作が保持されている
- [ ] PowerUp効果が正常に動作する
- [ ] テストが全て通る

### Step 3: 他エンティティの移行（2-3週間）

#### 3.1 移行順序
1. **Enemy クラス** (1週間)
   - 設定注入の追加
   - 敵タイプ設定の参照変更
   - テスト更新

2. **PowerUp クラス** (3-4日)
   - 設定注入の追加
   - サイズ・速度設定の参照変更
   - テスト更新

3. **Boss クラス** (3-4日)
   - 設定注入の追加
   - ボス設定の参照変更
   - テスト更新

#### 3.2 各クラス共通作業
- コンストラクタ修正
- `GAME_CONSTANTS` 参照の置換
- テストケース更新
- 統合テスト追加

### Step 4: システム全体の移行（2週間）

#### 4.1 Game クラス修正（1週間）
1. 設定ファクトリーの使用
2. 各エンティティへの設定注入
3. PowerUpEffectService の初期化と注入

#### 4.2 レガシーコード削除（1週間）
1. `GAME_CONSTANTS` の段階的削除
2. 未使用インポートの削除
3. 型定義の更新

#### 4.3 最終検証
- [ ] 全テストが通る
- [ ] パフォーマンスが維持されている
- [ ] 新機能（設定変更）が動作する
- [ ] レガシーコードが完全に削除されている

## 🎯 期待される成果

### 1. テスト容易性の向上
- **設定の差し替えが容易**: テスト用設定で高速化・確実化
- **モック化の簡素化**: 依存性注入により外部依存を制御
- **単体テストの独立性**: 各クラスが独立してテスト可能

### 2. 循環依存の解決
- **設定と実装の完全分離**: PowerUp効果が外部サービスに分離
- **依存関係の明確化**: コンストラクタ注入により依存関係が明示的
- **保守性の向上**: 変更影響範囲の限定

### 3. 開発効率の向上
- **新機能追加の簡素化**: 設定追加だけで新機能対応
- **デバッグの容易化**: 設定変更でデバッグモード切り替え
- **チーム開発の効率化**: 設定ファイルでの協調作業

### 4. 保守性の向上
- **設定の一元管理**: 全設定が一箇所に集約
- **型安全性の確保**: Zodによるランタイムバリデーション
- **ドキュメント化**: 設定スキーマが仕様書として機能

## 📈 成功指標

### 定量的指標
- [ ] **テストカバレッジ**: 90% 以上維持
- [ ] **パフォーマンス**: 既存比±5%以内
- [ ] **ビルド時間**: 既存比+10%以内
- [ ] **バンドルサイズ**: 既存比+5%以内

### 定性的指標
- [ ] **全エンティティクラスでの設定注入完了**
- [ ] **PowerUp効果の完全分離**
- [ ] **循環依存の完全解決**
- [ ] **既存機能の動作保証**
- [ ] **新機能追加の容易性確認**

### 検証方法
1. **自動テスト**: CI/CDでの全テスト実行
2. **パフォーマンステスト**: ベンチマークスイートの実行
3. **手動テスト**: 実際のゲームプレイでの動作確認
4. **コードレビュー**: 設計原則の遵守確認

## 🚀 次のステップ

この設計計画の承認後、以下の手順で実装を開始します：

1. **実装モードへの移行**: Code モードでの実装開始
2. **Phase 1の実装**: 基盤構築から開始
3. **継続的な検証**: 各フェーズでの動作確認
4. **ドキュメント更新**: 実装に合わせた設計書の更新

---

**作成日**: 2025年6月14日  
**作成者**: Architect Mode  
**バージョン**: 1.0  
**ステータス**: 承認待ち