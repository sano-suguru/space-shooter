# 弾丸システム統合設計ドキュメント

## 概要

本ドキュメントは、現在分散している弾丸システムを統合し、保守性・拡張性・パフォーマンスを向上させるための包括的な設計計画書です。

## 1. 現状分析

### 1.1 現在の弾丸システム構造

```
弾丸システム現状
├── 基本弾丸クラス
│   ├── Bullet.ts (705行) - プレイヤー弾丸
│   └── BossBullet.ts (250行) - ボス弾丸
├── 特殊弾丸クラス (bullets/)
│   ├── ExplosiveBullet.ts (123行)
│   ├── HomingBullet.ts (240行)
│   ├── ReflectingBullet.ts (226行)
│   └── SplitBullet.ts (248行)
├── 弾道システム
│   ├── TrajectoryFactory.ts (143行)
│   └── TrajectoryTypes.ts (117行)
├── ビジュアルシステム
│   └── BulletVisualManager.ts (1079行)
└── 武器システム連携
    └── WeaponTypes.ts (276行)
```

### 1.2 問題点の詳細分析

#### 1.2.1 アーキテクチャ問題
- **継承階層の不整合**: [`BossBullet`](src/entities/BossBullet.ts:5) と [`Bullet`](src/entities/Bullet.ts:16) が独立した基底クラス
- **コード重複**: 描画ロジック、軌跡管理、ID生成が各クラスで重複実装
- **責任分散**: ビジュアル効果が [`Bullet`](src/entities/Bullet.ts:196) と [`BulletVisualManager`](src/weapons/systems/BulletVisualManager.ts:30) に分散

#### 1.2.2 型安全性問題
- **型チェック不備**: [`bullets/index.ts`](src/entities/bullets/index.ts:111-134) の型ガード関数が不完全
- **設定注入の不整合**: 一部クラスで [`GameConfig`](src/config/GameConfigFactory.ts) の注入が任意

#### 1.2.3 パフォーマンス問題
- **オブジェクト生成コスト**: プール管理が部分的（[`TrajectoryFactory`](src/weapons/trajectories/TrajectoryFactory.ts:22-24) のみ）
- **描画処理の重複**: 各弾丸クラスで独自の描画ロジック実装
- **メモリリーク**: ビジュアル状態のクリーンアップが不完全

#### 1.2.4 拡張性問題
- **新弾丸タイプ追加の複雑さ**: 複数ファイルの修正が必要
- **エンチャント効果の制限**: [`Bullet`](src/entities/Bullet.ts:40-55) クラス内にハードコード

## 2. 設計目標

### 2.1 アーキテクチャ目標
- **統一された継承階層**: 単一の基底弾丸クラスから派生
- **責任の明確化**: 描画・移動・効果の責任分離
- **設定注入の統一**: 全弾丸クラスで一貫した設定管理

### 2.2 品質目標
- **型安全性**: 100% TypeScript strict mode 対応
- **テストカバレッジ**: 90%以上のコードカバレッジ
- **ESLint準拠**: 警告・エラー0件

### 2.3 パフォーマンス目標
- **オブジェクトプール**: 全弾丸タイプでプール管理
- **描画最適化**: 60FPS維持（16.67ms/frame以下）
- **メモリ使用量**: 現状比20%削減

## 3. 段階的実装計画

### Phase 1: 基盤統合 (Week 1-2)

#### 3.1.1 統一基底クラス設計

```typescript
// src/entities/bullets/BaseBullet.ts
export abstract class BaseBullet extends GameObject {
  // 共通プロパティ
  protected active: boolean = true;
  protected speed: number;
  protected owner: BulletOwner;
  protected uniqueId: string;
  protected config: GameConfig;
  
  // 共通インターフェース
  abstract update(deltaTime: number): void;
  abstract draw(ctx: CanvasRenderingContext2D): void;
  abstract getType(): BulletType;
  
  // 共通機能
  public getId(): string { /* 統一実装 */ }
  public isActive(): boolean { /* 統一実装 */ }
  public deactivate(): void { /* 統一実装 */ }
  public reset(): void { /* 統一実装 */ }
}
```

#### 3.1.2 弾丸タイプ統一

```typescript
// src/entities/bullets/types/BulletTypes.ts
export enum BulletType {
  PLAYER_BASIC = 'player_basic',
  BOSS_BASIC = 'boss_basic',
  EXPLOSIVE = 'explosive',
  HOMING = 'homing',
  REFLECTING = 'reflecting',
  SPLIT = 'split'
}

export interface BulletConfig {
  type: BulletType;
  owner: BulletOwner;
  position: Vector2D;
  velocity: Vector2D;
  visualConfig?: BulletVisualConfig;
  specialParams?: BulletSpecialParams;
}
```

#### 3.1.3 ファクトリーパターン実装

```typescript
// src/entities/bullets/BulletFactory.ts
export class BulletFactory {
  private static pools: Map<BulletType, ObjectPool<BaseBullet>>;
  
  public static create(config: BulletConfig): BaseBullet {
    const pool = this.getPool(config.type);
    const bullet = pool.get();
    bullet.initialize(config);
    return bullet;
  }
  
  public static release(bullet: BaseBullet): void {
    const pool = this.getPool(bullet.getType());
    pool.release(bullet);
  }
}
```

### Phase 2: 移行実装 (Week 3-4)

#### 3.2.1 既存クラスの移行順序

1. **Bullet → PlayerBullet**: 最も使用頻度が高いため最初に移行
2. **BossBullet → BossBullet**: 基底クラス変更のみ
3. **特殊弾丸クラス**: 個別に順次移行

#### 3.2.2 移行戦略

```typescript
// 段階的移行のためのアダプターパターン
export class BulletAdapter {
  public static adaptLegacyBullet(legacyBullet: Bullet): BaseBullet {
    // 既存Bulletインスタンスを新しいPlayerBulletに変換
  }
  
  public static createCompatibilityLayer(): void {
    // 既存コードとの互換性を保つためのレイヤー
  }
}
```

### Phase 3: 機能統合 (Week 5-6)

#### 3.3.1 ビジュアルシステム統合

```typescript
// src/entities/bullets/systems/BulletRenderSystem.ts
export class BulletRenderSystem {
  private visualManager: BulletVisualManager;
  private performanceMonitor: PerformanceMonitor;
  
  public render(bullets: BaseBullet[], ctx: CanvasRenderingContext2D): void {
    // 統一された描画処理
    // パフォーマンス監視付き
    // LOD (Level of Detail) 対応
  }
}
```

#### 3.3.2 弾道システム統合

```typescript
// src/entities/bullets/systems/BulletMovementSystem.ts
export class BulletMovementSystem {
  public update(bullets: BaseBullet[], deltaTime: number): void {
    bullets.forEach(bullet => {
      if (bullet.hasTrajectory()) {
        bullet.updateTrajectory(deltaTime);
      } else {
        bullet.updateBasicMovement(deltaTime);
      }
    });
  }
}
```

### Phase 4: 最適化・テスト (Week 7-8)

#### 3.4.1 パフォーマンス最適化

```typescript
// src/entities/bullets/optimization/BulletOptimizer.ts
export class BulletOptimizer {
  private static readonly MAX_BULLETS = 500;
  private static readonly CULL_DISTANCE = 100;
  
  public static cullOffscreenBullets(bullets: BaseBullet[]): BaseBullet[] {
    // 画面外弾丸の除去
  }
  
  public static optimizeRenderOrder(bullets: BaseBullet[]): BaseBullet[] {
    // 描画順序の最適化（Z-order, 透明度順）
  }
}
```

## 4. 技術仕様

### 4.1 インターフェース設計

#### 4.1.1 核心インターフェース

```typescript
// src/entities/bullets/interfaces/IBullet.ts
export interface IBullet extends IGameObject {
  // 基本操作
  initialize(config: BulletConfig): void;
  update(deltaTime: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
  reset(): void;
  
  // 状態管理
  isActive(): boolean;
  deactivate(): void;
  getId(): string;
  getType(): BulletType;
  getOwner(): BulletOwner;
  
  // 物理特性
  getPosition(): Vector2D;
  getVelocity(): Vector2D;
  setVelocity(velocity: Vector2D): void;
  getBounds(): Rectangle;
  
  // 特殊機能
  hasTrajectory(): boolean;
  getTrajectory(): IBulletTrajectory | null;
  setTrajectory(trajectory: IBulletTrajectory): void;
  
  // ビジュアル
  getVisualConfig(): BulletVisualConfig | null;
  setVisualConfig(config: BulletVisualConfig): void;
}
```

#### 4.1.2 弾丸管理インターフェース

```typescript
// src/entities/bullets/interfaces/IBulletManager.ts
export interface IBulletManager {
  // 弾丸生成・管理
  createBullet(config: BulletConfig): IBullet;
  releaseBullet(bullet: IBullet): void;
  
  // 一括操作
  updateAll(deltaTime: number): void;
  renderAll(ctx: CanvasRenderingContext2D): void;
  clearAll(): void;
  
  // 検索・フィルタ
  getBulletsByOwner(owner: BulletOwner): IBullet[];
  getBulletsByType(type: BulletType): IBullet[];
  getActiveBullets(): IBullet[];
  
  // 統計・デバッグ
  getStats(): BulletManagerStats;
  getPoolStats(): PoolStats;
}
```

### 4.2 クラス階層設計

```
BaseBullet (abstract)
├── PlayerBullet
│   ├── BasicPlayerBullet
│   ├── EnchantedPlayerBullet
│   └── WeaponSpecificBullet
├── EnemyBullet
│   ├── BasicEnemyBullet
│   └── BossBullet
└── SpecialBullet
    ├── ExplosiveBullet
    ├── HomingBullet
    ├── ReflectingBullet
    └── SplitBullet
```

### 4.3 メソッド仕様

#### 4.3.1 BaseBullet核心メソッド

```typescript
export abstract class BaseBullet implements IBullet {
  /**
   * 弾丸を初期化
   * @param config 弾丸設定
   * @throws BulletInitializationError 初期化失敗時
   */
  public initialize(config: BulletConfig): void;
  
  /**
   * 弾丸状態を更新
   * @param deltaTime フレーム時間差（ミリ秒）
   * @performance O(1) - 定数時間での更新を保証
   */
  public abstract update(deltaTime: number): void;
  
  /**
   * 弾丸を描画
   * @param ctx Canvas描画コンテキスト
   * @performance 16.67ms以下での描画完了を目標
   */
  public abstract draw(ctx: CanvasRenderingContext2D): void;
  
  /**
   * オブジェクトプール用リセット
   * @postcondition 初期状態に完全復元
   */
  public reset(): void;
}
```

## 5. ESLint対応戦略

### 5.1 型安全性確保

#### 5.1.1 strict mode 対応

```typescript
// tsconfig.json 設定強化
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### 5.1.2 ESLint ルール適用

```javascript
// eslint.config.js 弾丸システム専用ルール
{
  files: ['src/entities/bullets/**/*.ts'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    'complexity': ['error', 10], // 弾丸クラスは複雑度10以下
    'max-lines-per-function': ['error', 50], // 関数は50行以下
    'max-lines': ['error', 300] // ファイルは300行以下
  }
}
```

### 5.2 コード品質基準

#### 5.2.1 命名規則

```typescript
// 統一命名規則
export enum BulletType {
  PLAYER_BASIC = 'player_basic', // SCREAMING_SNAKE_CASE
}

export class PlayerBullet extends BaseBullet { // PascalCase
  private readonly maxSpeed: number; // camelCase + readonly
  
  public getMaxSpeed(): number { // getterはget prefix
    return this.maxSpeed;
  }
}
```

#### 5.2.2 エラーハンドリング

```typescript
// 統一エラーハンドリング
export class BulletError extends Error {
  constructor(
    message: string,
    public readonly bulletId: string,
    public readonly bulletType: BulletType
  ) {
    super(`[${bulletType}:${bulletId}] ${message}`);
    this.name = 'BulletError';
  }
}

export class BulletInitializationError extends BulletError {
  constructor(bulletId: string, bulletType: BulletType, cause: string) {
    super(`Initialization failed: ${cause}`, bulletId, bulletType);
  }
}
```

## 6. ユニットテスト設計

### 6.1 テスト戦略

#### 6.1.1 テスト構造

```
tests/entities/bullets/
├── BaseBullet.test.ts
├── PlayerBullet.test.ts
├── BossBullet.test.ts
├── SpecialBullets.test.ts
├── BulletFactory.test.ts
├── BulletManager.test.ts
└── integration/
    ├── BulletSystemIntegration.test.ts
    └── PerformanceTest.test.ts
```

#### 6.1.2 テストケース設計

```typescript
// tests/entities/bullets/BaseBullet.test.ts
describe('BaseBullet', () => {
  describe('初期化', () => {
    test('正常な設定で初期化される', () => {
      const config: BulletConfig = createValidBulletConfig();
      const bullet = new TestBullet();
      
      expect(() => bullet.initialize(config)).not.toThrow();
      expect(bullet.isActive()).toBe(true);
      expect(bullet.getType()).toBe(config.type);
    });
    
    test('不正な設定で初期化エラーが発生する', () => {
      const invalidConfig = createInvalidBulletConfig();
      const bullet = new TestBullet();
      
      expect(() => bullet.initialize(invalidConfig))
        .toThrow(BulletInitializationError);
    });
  });
  
  describe('状態管理', () => {
    test('アクティブ状態が正しく管理される', () => {
      const bullet = createTestBullet();
      
      expect(bullet.isActive()).toBe(true);
      bullet.deactivate();
      expect(bullet.isActive()).toBe(false);
    });
    
    test('リセット後に初期状態に戻る', () => {
      const bullet = createTestBullet();
      bullet.update(100); // 状態変更
      
      bullet.reset();
      
      expect(bullet.getPosition()).toEqual({ x: 0, y: 0 });
      expect(bullet.isActive()).toBe(false);
    });
  });
});
```

### 6.2 モックとスタブ

#### 6.2.1 Canvas モック

```typescript
// tests/mocks/CanvasMock.ts
export class CanvasMock implements Partial<CanvasRenderingContext2D> {
  public drawCalls: DrawCall[] = [];
  
  public fillRect(x: number, y: number, w: number, h: number): void {
    this.drawCalls.push({ type: 'fillRect', args: [x, y, w, h] });
  }
  
  public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void {
    this.drawCalls.push({ type: 'arc', args: [x, y, radius, startAngle, endAngle] });
  }
  
  public getDrawCallsOfType(type: string): DrawCall[] {
    return this.drawCalls.filter(call => call.type === type);
  }
}
```

#### 6.2.2 GameConfig モック

```typescript
// tests/mocks/GameConfigMock.ts
export function createMockGameConfig(overrides?: Partial<GameConfig>): GameConfig {
  return {
    bullet: {
      width: 5,
      height: 15,
      speed: 500,
      ...overrides?.bullet
    },
    canvas: {
      width: 800,
      height: 600,
      ...overrides?.canvas
    },
    ...overrides
  };
}
```

### 6.3 パフォーマンステスト

```typescript
// tests/performance/BulletPerformance.test.ts
describe('弾丸システムパフォーマンス', () => {
  test('1000個の弾丸更新が16ms以下で完了する', () => {
    const bullets = createBullets(1000);
    
    const startTime = performance.now();
    bullets.forEach(bullet => bullet.update(16));
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(16);
  });
  
  test('弾丸プールが正しくメモリを管理する', () => {
    const initialMemory = getMemoryUsage();
    
    // 大量の弾丸を生成・解放
    for (let i = 0; i < 10000; i++) {
      const bullet = BulletFactory.create(createBulletConfig());
      BulletFactory.release(bullet);
    }
    
    const finalMemory = getMemoryUsage();
    const memoryIncrease = finalMemory - initialMemory;
    
    expect(memoryIncrease).toBeLessThan(1024 * 1024); // 1MB以下
  });
});
```

## 7. 実機テスト指示

### 7.1 Phase別テスト手順

#### Phase 1: 基盤テスト
```bash
# 基盤クラステスト
npm test -- --testPathPattern="BaseBullet|BulletFactory"

# 型チェック
npm run type-check

# ESLint チェック
npm run lint -- src/entities/bullets/
```

#### Phase 2: 移行テスト
```bash
# 既存機能の回帰テスト
npm test -- --testPathPattern="integration"

# ビジュアル回帰テスト（手動）
npm run dev
# ブラウザで弾丸の見た目・動作確認
```

#### Phase 3: 統合テスト
```bash
# 全体統合テスト
npm test

# パフォーマンステスト
npm run test:performance

# メモリリークテスト
npm run test:memory
```

#### Phase 4: 最終検証
```bash
# 全体ビルドテスト
npm run build

# E2Eテスト
npm run test:e2e

# プロダクションテスト
npm run preview
```

### 7.2 動作確認項目

#### 7.2.1 基本機能確認
- [ ] プレイヤー弾丸の発射・移動・消失
- [ ] ボス弾丸の各種パターン動作
- [ ] 特殊弾丸（爆発・追尾・反射・分裂）の正常動作
- [ ] 弾丸同士の衝突判定
- [ ] 画面外での自動消失

#### 7.2.2 ビジュアル確認
- [ ] 弾丸の描画品質（トレイル・エフェクト）
- [ ] エンチャント効果の視覚表現
- [ ] パフォーマンスモード時の描画軽量化
- [ ] 異なる解像度での表示確認

#### 7.2.3 パフォーマンス確認
- [ ] 60FPS維持（Chrome DevTools Performance タブ）
- [ ] メモリ使用量の安定性（Memory タブ）
- [ ] CPU使用率の妥当性
- [ ] 大量弾丸時の動作安定性（500個以上）

## 8. マイグレーションガイド

### 8.1 既存コードの移行手順

#### 8.1.1 Bullet クラス使用箇所の移行

**Before:**
```typescript
// 旧実装
const bullet = new Bullet(x, y, config);
bullet.initialize(x, y, speed, color, 'player');
```

**After:**
```typescript
// 新実装
const bulletConfig: BulletConfig = {
  type: BulletType.PLAYER_BASIC,
  owner: BulletOwner.PLAYER,
  position: { x, y },
  velocity: { x: 0, y: -speed },
  visualConfig: { color, size: 1.0 }
};
const bullet = BulletFactory.create(bulletConfig);
```

#### 8.1.2 BossBullet クラス使用箇所の移行

**Before:**
```typescript
// 旧実装
const bossBullet = new BossBullet(x, y, speedX, speedY, config);
```

**After:**
```typescript
// 新実装
const bulletConfig: BulletConfig = {
  type: BulletType.BOSS_BASIC,
  owner: BulletOwner.BOSS,
  position: { x, y },
  velocity: { x: speedX, y: speedY }
};
const bossBullet = BulletFactory.create(bulletConfig);
```

#### 8.1.3 特殊弾丸の移行

**Before:**
```typescript
// 旧実装
const homingBullet = new HomingBullet(x, y, speedX, speedY, config, duration, turnSpeed);
homingBullet.setTarget(player);
```

**After:**
```typescript
// 新実装
const bulletConfig: BulletConfig = {
  type: BulletType.HOMING,
  owner: BulletOwner.BOSS,
  position: { x, y },
  velocity: { x: speedX, y: speedY },
  specialParams: {
    homingDuration: duration,
    turnSpeed: turnSpeed,
    target: player
  }
};
const homingBullet = BulletFactory.create(bulletConfig);
```

### 8.2 段階的移行戦略

#### 8.2.1 Week 1: 基盤準備
1. `BaseBullet` クラス実装
2. `BulletFactory` 実装
3. 基本テスト作成

#### 8.2.2 Week 2: PlayerBullet 移行
1. `PlayerBullet` クラス実装
2. `Bullet` → `PlayerBullet` 移行
3. 回帰テスト実行

#### 8.2.3 Week 3: BossBullet 移行
1. `BossBullet` リファクタリング
2. 既存機能の保持確認
3. 統合テスト実行

#### 8.2.4 Week 4: 特殊弾丸移行
1. 各特殊弾丸クラスの移行
2. ファクトリーパターン統合
3. 全体テスト実行

### 8.3 互換性保持

#### 8.3.1 レガシーサポート

```typescript
// src/entities/bullets/legacy/BulletLegacyAdapter.ts
export class BulletLegacyAdapter {
  /**
   * 旧Bulletクラスのインターフェースを提供
   * @deprecated Phase 2完了後に削除予定
   */
  public static createLegacyBullet(x: number, y: number, config?: GameConfig): IBullet {
    console.warn('Legacy Bullet interface is deprecated. Use BulletFactory.create() instead.');
    
    const bulletConfig: BulletConfig = {
      type: BulletType.PLAYER_BASIC,
      owner: BulletOwner.PLAYER,
      position: { x, y },
      velocity: { x: 0, y: -500 }
    };
    
    return BulletFactory.create(bulletConfig);
  }
}
```

## 9. リスク分析

### 9.1 技術リスク

#### 9.1.1 高リスク項目

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|----------|------|
| パフォーマンス劣化 | 高 | 中 | 段階的最適化、ベンチマーク継続実施 |
| 既存機能の破綻 | 高 | 低 | 包括的回帰テスト、段階的移行 |
| メモリリーク | 中 | 中 | プール管理の厳密実装、メモリ監視 |

#### 9.1.2 中リスク項目

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|----------|------|
| ESLint違反の大量発生 | 中 | 高 | 段階的適用、自動修正ツール活用 |
| テストカバレッジ不足 | 中 | 中 | TDD採用、カバレッジ監視 |
| 開発期間の延長 | 中 | 中 | バッファ期間設定、優先度管理 |

### 9.2 対策詳細

#### 9.2.1 パフォーマンス劣化対策

```typescript
// パフォーマンス監視システム
export class BulletPerformanceMonitor {
  private frameTimeThreshold = 16.67; // 60FPS
  private memoryThreshold = 100 * 1024 * 1024; // 100MB
  
  public monitorFrame(bullets: IBullet[]): PerformanceReport {
    const startTime = performance.now();
    
    // 弾丸更新処理
    bullets.forEach(bullet => bullet.update(16));
    
    const endTime = performance.now();
    const frameTime = endTime - startTime;
    
    if (frameTime > this.frameTimeThreshold) {
      console.warn(`Frame time exceeded: ${frameTime}ms`);
      this.triggerOptimization();
    }
    
    return {
      frameTime,
      bulletCount: bullets.length,
      memoryUsage: this.getMemoryUsage()
    };
  }
}
```

#### 9.2.2 回帰テスト戦略

```typescript
// 回帰テスト自動化
export class BulletRegressionTest {
  public async runFullRegressionSuite(): Promise<TestResult> {
    const tests = [
      this.testBasicBulletMovement,
      this.testBossBulletPatterns,
      this.testSpecialBulletEffects,
      this.testCollisionDetection,
      this.testVisualEffects
    ];
    
    const results = await Promise.all(tests.map(test => test()));
    return this.aggregateResults(results);
  }
}
```

## 10. 完了基準

### 10.1 Phase別完了基準

#### Phase 1: 基盤統合完了基準
- [ ] `BaseBullet` 抽象クラス実装完了
- [ ] `BulletFactory` 実装完了
- [ ] `BulletType` 列挙型定義完了
- [ ] 基本インターフェース定義完了
- [ ] 単体テスト90%以上のカバレッジ
- [ ] ESLint エラー・警告 0件
- [ ] TypeScript strict mode 対応完了

#### Phase 2: 移行実装完了基準
- [ ] `PlayerBullet` クラス実装完了
- [ ] `BossBullet` リファクタリング完了
- [ ] 既存機能の100%互換性保持
- [ ] 回帰テスト全件パス
- [ ] パフォーマンス劣化なし（±5%以内）
- [ ] メモリ使用量増加なし

#### Phase 3: 機能統合完了基準
- [ ] 特殊弾丸クラス全移行完了
- [ ] `BulletRenderSystem` 統合完了
- [ ] `BulletMovementSystem` 統合完了
- [ ] ビジュアル効果統合完了
- [ ] 統合テスト全件パス
- [ ] パフォーマンス目標達成（60FPS維持）

#### Phase 4: 最適化・テスト完了基準
- [ ] オブジェクトプール最適化完了
- [ ] 描画最適化完了
- [ ] メモリ使用量20%削減達成
- [ ] 全テストスイート実行時間30秒以内
- [ ] E2Eテスト全件パス
- [ ] プロダクション環境での動作確認完了

### 10.2 品質基準

#### 10.2.1 コード品質
- **テストカバレッジ**: 90%以上
- **ESLint準拠**: エラー・警告 0件
- **TypeScript**: strict mode 100%対応
- **循環的複雑度**: 10以下（弾丸クラス）
- **関数行数**: 50行以下
- **ファイル行数**: 300行以下

#### 10.2.2 パフォーマンス基準
- **フレームレート**: 60FPS維持（16.67ms/frame以下）
- **メモリ使用量**: 現状比20%削減
- **弾丸処理能力**: 500個同時処理可能
- **初期化時間**: 100ms以下
- **プール取得時間**: 1ms以下

#### 10.2.3 機能基準
- **既存機能**: 100%互換性保持
- **新機能**: 設計仕様通り動作
- **エラーハンドリング**: 全例外ケース対応
- **ログ出力**: 適切なレベルでの出力
- **デバッグ情報**: 開発時の十分な情報提供

### 10.3 受け入れテスト

#### 10.3.1 機能テスト項目
```typescript
// 受け入れテストスイート
describe('弾丸システム統合 - 受け入れテスト', () => {
  describe('基本機能', () => {
    test('プレイヤー弾丸の正常動作', async () => {
      // プレイヤー弾丸の発射・移動・消失
    });
    
    test('ボス弾丸パターンの正常動作', async () => {
      // 各種ボス弾丸パターンの動作確認
    });
    
    test('特殊弾丸効果の正常動作', async () => {
      // 爆発・追尾・反射・分裂の動作確認
    });
  });
  
  describe('パフォーマンス', () => {
    test('大量弾丸処理性能', async () => {
      // 500個の弾丸同時処理テスト
    });
    
    test('メモリ使用量テスト', async () => {
      // メモリリーク・使用量テスト
    });
  });
  
  describe('統合性', () => {
    test('武器システム連携', async () => {
      // 武器システムとの連携確認
    });
    
    test('エンチャント効果連携', async () => {
      // エンチャントシステムとの連携確認
    });
  });
});
```

#### 10.3.2 ユーザビリティテスト
- [ ] 弾丸の視認性確認
- [ ] エフェクトの美観確認
- [ ] 操作レスポンスの確認
- [ ] 異なるデバイスでの動作確認

### 10.4 リリース基準

#### 10.4.1 必須条件
- [ ] 全Phase完了基準クリア
- [ ] 全品質基準クリア
- [ ] 受け入れテスト全件パス
- [ ] セキュリティ監査完了
- [ ] パフォーマンス監査完了

#### 10.4.2 推奨条件
- [ ] ドキュメント整備完了
- [ ] 開発者向けガイド作成
- [ ] 運用監視設定完了
- [ ] ロールバック手順確立

## 11. 付録

### 11.1 参考資料

#### 11.1.1 設計パターン
- **Factory Pattern**: 弾丸生成の統一化
- **Object Pool Pattern**: メモリ効率化
- **Strategy Pattern**: 弾道パターンの切り替え
- **Observer Pattern**: 弾丸イベントの通知
- **Adapter Pattern**: レガシーコードとの互換性

#### 11.1.2 パフォーマンス最適化技法
- **Spatial Partitioning**: 衝突判定の最適化
- **Level of Detail (LOD)**: 距離に応じた描画品質調整
- **Frustum Culling**: 画面外オブジェクトの除外
- **Batch Rendering**: 描画コールの最適化

### 11.2 用語集

| 用語 | 定義 |
|------|------|
| BaseBullet | 全弾丸クラスの基底となる抽象クラス |
| BulletFactory | 弾丸インスタンスの生成を管理するファクトリークラス |
| BulletPool | 弾丸オブジェクトの再利用を管理するプール |
| BulletOwner | 弾丸の所有者（プレイヤー・敵・ボス）を示す列挙型 |
| TrajectorySystem | 弾丸の軌道パターンを管理するシステム |
| VisualSystem | 弾丸の視覚効果を管理するシステム |

### 11.3 実装例

#### 11.3.1 基本的な弾丸作成

```typescript
// 基本的なプレイヤー弾丸の作成
const playerBullet = BulletFactory.create({
  type: BulletType.PLAYER_BASIC,
  owner: BulletOwner.PLAYER,
  position: { x: playerX, y: playerY },
  velocity: { x: 0, y: -500 }
});

// エンチャント付き弾丸の作成
const enchantedBullet = BulletFactory.create({
  type: BulletType.PLAYER_BASIC,
  owner: BulletOwner.PLAYER,
  position: { x: playerX, y: playerY },
  velocity: { x: 0, y: -500 },
  visualConfig: {
    color: { primary: '#00ffaa', alpha: 1.0 },
    size: 1.2,
    effects: [
      { type: BulletVisualEffectType.GLOW, intensity: 0.8 }
    ]
  }
});
```

#### 11.3.2 特殊弾丸の作成

```typescript
// 追尾弾の作成
const homingBullet = BulletFactory.create({
  type: BulletType.HOMING,
  owner: BulletOwner.BOSS,
  position: { x: bossX, y: bossY },
  velocity: { x: 100, y: 200 },
  specialParams: {
    homingDuration: 3000,
    turnSpeed: 0.002,
    target: player
  }
});

// 分裂弾の作成
const splitBullet = BulletFactory.create({
  type: BulletType.SPLIT,
  owner: BulletOwner.BOSS,
  position: { x: bossX, y: bossY },
  velocity: { x: 0, y: 300 },
  specialParams: {
    splitDelay: 2000,
    splitCount: 5,
    splitAngleSpread: Math.PI / 2
  }
});
```

### 11.4 トラブルシューティング

#### 11.4.1 よくある問題と解決策

**問題**: 弾丸が表示されない
```typescript
// 原因: 弾丸が非アクティブ状態
// 解決: アクティブ状態を確認
if (!bullet.isActive()) {
  console.warn('Bullet is not active:', bullet.getId());
}
```

**問題**: パフォーマンスが低下する
```typescript
// 原因: プールが正しく使用されていない
// 解決: 弾丸の適切な解放
bullets.forEach(bullet => {
  if (!bullet.isOnScreen()) {
    BulletFactory.release(bullet);
  }
});
```

**問題**: メモリリークが発生する
```typescript
// 原因: ビジュアル状態のクリーンアップ不足
// 解決: 適切なクリーンアップ
bullet.cleanupVisuals();
bullet.cleanupTrajectory();
BulletFactory.release(bullet);
```

---

## まとめ

本設計ドキュメントは、弾丸システムの統合を通じて以下の目標達成を目指します：

1. **保守性の向上**: 統一されたアーキテクチャによる理解しやすいコード
2. **拡張性の確保**: 新機能追加時の影響範囲最小化
3. **パフォーマンス最適化**: メモリ効率とフレームレート向上
4. **品質保証**: 包括的なテストとESLint準拠

段階的な実装により、既存機能を破綻させることなく、より良いシステムへの移行を実現します。

**実装開始日**: 2025年6月25日
**完了予定日**: 2025年8月20日（8週間）
**責任者**: 開発チーム
**レビュアー**: アーキテクト・QAチーム