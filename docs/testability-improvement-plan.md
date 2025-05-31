# テスタビリティ改善計画 - Space Shooter

## 📋 概要
Space Shooterプロジェクトのテスタビリティを段階的に改善し、包括的なテストスイートを構築するための詳細計画書

**作成日**: 2025/06/01  
**現在のフェーズ**: Phase 3（テスト基盤構築）  
**プロジェクト状況**: テスト基盤完備、一部テスト実装済み

---

## 🔍 現在のテスタビリティ分析

### ✅ 既に良好な状態
- **Jest環境**: 完全セットアップ済み
- **Canvas APIモック**: 全APIに対応したモック環境
- **BackgroundRenderer**: 15/15テスト完全パス
- **CollisionSystem**: テストスイート構築済み
- **GameObjectManager**: テストスイート構築済み
- **依存注入**: IGameEngineインターフェースによる抽象化完了
- **アーキテクチャ**: Clean Architecture適用済み

### 🚨 テスタビリティ問題（改善が必要）

#### 🔴 最優先（P0）- テストブロッカー

##### **1. Gameクラスの複雑な依存関係**
```typescript
// 問題のあるコード例
constructor(
    private canvas: HTMLCanvasElement,  // DOM依存
    // ... 8個のコンストラクタ引数
) {
    this.ctx = this.canvas.getContext('2d')!;  // 直接DOM操作
    this.initializeGameObjects();              // コンストラクタで重い処理
    this.setupEventListeners();               // DOM依存
}

// DOM直接操作
public showMessage(text: string): void {
    const messageElement = document.createElement('div');  // テスト困難
    document.body.appendChild(messageElement);             // グローバル状態変更
}
```

**影響**: Gameクラスのテストが困難、モック設定が複雑

##### **2. Playerクラスの責務過多**
```typescript
// 問題のあるコード例
constructor() {
    // DOM直接依存
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
}

private shoot(): void {
    const currentTime = Date.now();  // 静的依存、テスト困難
    // ...
}

private generateThrusterParticles(): void {
    // Math.random()への直接依存
    const particleCount = 3;
    for (let i = 0; i < particleCount; i++) {
        this.thrusterParticles.push({
            speed: Math.random() * 50 + 50,  // テスト困難
            life: 1
        });
    }
}
```

**影響**: 決定論的テストが不可能、時間依存のテストが困難

#### 🟡 高優先（P1）- テスト困難要因

##### **3. 静的依存関係**
```typescript
// 散在する問題例
setTimeout(() => { /* ... */ }, 3000);     // Game.ts
Date.now()                                 // Player.ts, Boss.ts
Math.random()                              // 複数のクラス
setInterval(this.spawnEnemy, 1000);        // Game.ts
performance.now()                          // BackgroundRenderer.ts
```

##### **4. DOM操作の分散**
```typescript
// UIManager.ts
updateScoreDisplay(score: number): void {
    this.scoreElement.textContent = score.toString();  // DOM直接操作
}

// Game.ts  
showGameOverScreen(): void {
    const gameOverElement = document.getElementById('gameOver')!;  // DOM直接依存
    gameOverElement.classList.remove('hidden');
}
```

#### 🟢 中優先（P2）- テスト改善余地

##### **5. エンティティクラスの複雑な描画ロジック**
- Boss.ts: 300行超の複雑な描画メソッド
- Enemy.ts: タイプ別の複雑な描画分岐
- Player.ts: アニメーション、パーティクル描画

##### **6. 非同期処理の制御困難**
- WaveManager: setTimeout依存の遅延処理
- Game: setInterval依存のスポーン処理
- PowerUp: 時間依存のエフェクト処理

---

## 🛠️ 段階的改善プラン

### **段階1: プロバイダー抽象化** 🚀
**目標**: 静的依存関係を抽象化し、モック可能にする  
**期間**: 1週間  
**影響範囲**: 小（既存コードの変更最小限）  
**効果**: 大（即座にテスト可能性向上）

#### **Task 1.1: TimeProvider 作成**
```typescript
// 新規作成: src/providers/TimeProvider.ts
export interface ITimeProvider {
  now(): number;
  setTimeout(callback: () => void, delay: number): number;
  setInterval(callback: () => void, delay: number): number;
  clearTimeout(id: number): void;
  clearInterval(id: number): void;
}

export class RealTimeProvider implements ITimeProvider {
  now(): number { return Date.now(); }
  setTimeout(callback: () => void, delay: number): number {
    return window.setTimeout(callback, delay);
  }
  // ...
}

export class MockTimeProvider implements ITimeProvider {
  private currentTime = 0;
  private timers: Array<{id: number, callback: () => void, time: number}> = [];
  
  now(): number { return this.currentTime; }
  advanceTime(ms: number): void { /* テスト用時間進行 */ }
  // ...
}
```

#### **Task 1.2: RandomProvider 作成**
```typescript
// 新規作成: src/providers/RandomProvider.ts
export interface IRandomProvider {
  random(): number;
  randomRange(min: number, max: number): number;
  randomChoice<T>(array: T[]): T;
}

export class RealRandomProvider implements IRandomProvider {
  random(): number { return Math.random(); }
  // ...
}

export class MockRandomProvider implements IRandomProvider {
  private sequence: number[] = [];
  private index = 0;
  
  setSequence(values: number[]): void { this.sequence = values; }
  random(): number { return this.sequence[this.index++ % this.sequence.length]; }
  // ...
}
```

#### **Task 1.3: InputManager 作成**
```typescript
// 新規作成: src/managers/InputManager.ts
export interface IInputManager {
  isKeyPressed(key: string): boolean;
  onKeyDown(callback: (key: string) => void): void;
  onKeyUp(callback: (key: string) => void): void;
  dispose(): void;
}

export class RealInputManager implements IInputManager {
  private pressedKeys = new Set<string>();
  
  constructor() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }
  // ...
}

export class MockInputManager implements IInputManager {
  private pressedKeys = new Set<string>();
  
  simulateKeyPress(key: string): void { /* テスト用キー入力 */ }
  simulateKeyRelease(key: string): void { /* テスト用キー離し */ }
  // ...
}
```

### **段階2: DOM操作分離** 🔧
**目標**: DOM操作を抽象化し、テスタブルにする  
**期間**: 1週間  
**影響範囲**: 中（UIManagerとGameクラスの修正）

#### **Task 2.1: DOMManager 作成**
```typescript
// 新規作成: src/managers/DOMManager.ts
export interface IDOMManager {
  getElementById(id: string): HTMLElement | null;
  createElement(tagName: string): HTMLElement;
  appendChild(parent: HTMLElement, child: HTMLElement): void;
  removeChild(parent: HTMLElement, child: HTMLElement): void;
  setTextContent(element: HTMLElement, text: string): void;
  addClass(element: HTMLElement, className: string): void;
  removeClass(element: HTMLElement, className: string): void;
  setStyle(element: HTMLElement, property: string, value: string): void;
}

export class RealDOMManager implements IDOMManager {
  getElementById(id: string): HTMLElement | null {
    return document.getElementById(id);
  }
  // ...
}

export class MockDOMManager implements IDOMManager {
  private elements = new Map<string, MockElement>();
  
  getElementById(id: string): HTMLElement | null {
    return this.elements.get(id) as any || null;
  }
  // ...
}
```

#### **Task 2.2: MessageManager 作成**
```typescript
// 新規作成: src/managers/MessageManager.ts
export interface IMessageManager {
  showMessage(text: string, duration?: number): void;
  hideMessage(): void;
  showGameOverScreen(finalScore: number): void;
  hideGameOverScreen(): void;
}

export class MessageManager implements IMessageManager {
  constructor(private domManager: IDOMManager) {}
  
  showMessage(text: string, duration = 3000): void {
    // DOM操作をDOMManagerに委譲
    const messageElement = this.domManager.createElement('div');
    // ...
  }
}
```

### **段階3: クラス責務分離** ⚡
**目標**: 大きなクラスを責務別に分離し、テストしやすくする  
**期間**: 2週間  
**影響範囲**: 大（主要クラスのリファクタ）

#### **Task 3.1: Gameクラス依存注入リファクタ**
```typescript
// 修正: src/core/Game.ts
export interface GameDependencies {
  canvas: HTMLCanvasElement;
  timeProvider: ITimeProvider;
  randomProvider: IRandomProvider;
  domManager: IDOMManager;
  inputManager: IInputManager;
  messageManager: IMessageManager;
}

export class Game implements IGameEngine {
  constructor(
    private dependencies: GameDependencies,
    private eventEmitter: EventEmitter<EventMap>,
    // ... 他の依存関係
  ) {
    this.setup();
  }
  
  private setup(): void {
    // 重い初期化処理をコンストラクタから分離
  }
}
```

#### **Task 3.2: Playerクラス責務分離**
```typescript
// 修正: src/entities/Player.ts
export class Player extends GameObject {
  constructor(
    private eventEmitter: EventEmitter<EventMap>,
    private timeProvider: ITimeProvider,
    private randomProvider: IRandomProvider,
    private inputManager: IInputManager,
    private game?: IGameEngine
  ) {
    super(/* ... */);
    this.setupInputHandling();
  }
  
  private setupInputHandling(): void {
    this.inputManager.onKeyDown((key) => this.handleKeyDown(key));
    this.inputManager.onKeyUp((key) => this.handleKeyUp(key));
  }
}
```

### **段階4: テストスイート拡充** 🧪
**目標**: 全主要クラスのテストスイートを作成  
**期間**: 2週間  
**影響範囲**: テストコードのみ

#### **Task 4.1: 主要クラステスト作成**
- `tests/Player.test.ts` - プレイヤーロジック全般
- `tests/Game.test.ts` - ゲームループ、状態管理
- `tests/GameEngine.test.ts` - ゲームエンジン機能
- `tests/Boss.test.ts` - ボス戦ロジック
- `tests/Enemy.test.ts` - 敵の動作・AI

#### **Task 4.2: 統合テスト作成**
- `tests/integration/GameFlow.test.ts` - ゲーム全体フロー
- `tests/integration/CollisionIntegration.test.ts` - 衝突判定統合
- `tests/integration/WaveSystem.test.ts` - ウェーブシステム

---

## 📊 実装詳細とコード例

### **TimeProviderの実装例**
```typescript
// Player.tsでの使用例（修正前 → 修正後）

// 修正前（テスト困難）
private shoot(): void {
  const currentTime = Date.now();
  if (currentTime - this.lastFireTime >= this.fireRate) {
    // 射撃処理
    this.lastFireTime = currentTime;
  }
}

// 修正後（テスト可能）
private shoot(): void {
  const currentTime = this.timeProvider.now();
  if (currentTime - this.lastFireTime >= this.fireRate) {
    // 射撃処理
    this.lastFireTime = currentTime;
  }
}

// テストコード例
test('連射レート制限が正しく動作する', () => {
  const mockTimeProvider = new MockTimeProvider();
  const player = new Player(eventEmitter, mockTimeProvider, ...);
  
  // 最初の射撃
  mockTimeProvider.setTime(0);
  player.setKeyState(' ', true);
  player.update(16);
  
  // 射撃間隔内での射撃試行
  mockTimeProvider.setTime(100); // fireRateより短い
  player.update(16);
  
  // 実際の弾丸数をチェック
  expect(mockEventEmitter.getEmittedEvents('playerShot')).toHaveLength(1);
  
  // 十分な時間経過後の射撃
  mockTimeProvider.setTime(300); // fireRateより長い
  player.update(16);
  
  expect(mockEventEmitter.getEmittedEvents('playerShot')).toHaveLength(2);
});
```

### **DOMManagerの実装例**
```typescript
// Game.tsでの使用例（修正前 → 修正後）

// 修正前（テスト困難）
public showMessage(text: string): void {
  const messageElement = document.createElement('div');
  messageElement.textContent = text;
  messageElement.style.position = 'absolute';
  document.body.appendChild(messageElement);
  
  setTimeout(() => {
    document.body.removeChild(messageElement);
  }, 3000);
}

// 修正後（テスト可能）
public showMessage(text: string): void {
  this.messageManager.showMessage(text, 3000);
}

// テストコード例
test('メッセージが正しく表示される', () => {
  const mockMessageManager = new MockMessageManager();
  const game = new Game({ messageManager: mockMessageManager, ... });
  
  game.showMessage('Test Message');
  
  expect(mockMessageManager.getDisplayedMessages()).toContain('Test Message');
  expect(mockMessageManager.getLastMessageDuration()).toBe(3000);
});
```

---

## 🧪 テストケース作成計画

### **Phase 1: 基本機能テスト**
```typescript
// Player.test.ts
describe('Player', () => {
  let player: Player;
  let mockTimeProvider: MockTimeProvider;
  let mockInputManager: MockInputManager;
  let mockEventEmitter: MockEventEmitter;

  beforeEach(() => {
    mockTimeProvider = new MockTimeProvider();
    mockInputManager = new MockInputManager();
    mockEventEmitter = new MockEventEmitter();
    
    player = new Player(
      mockEventEmitter,
      mockTimeProvider,
      new MockRandomProvider(),
      mockInputManager
    );
  });

  describe('移動処理', () => {
    test('左キー押下で左に移動する', () => {
      mockInputManager.simulateKeyPress('ArrowLeft');
      
      const initialX = player.getX();
      player.update(16);
      
      expect(player.getX()).toBeLessThan(initialX);
    });

    test('画面端で移動が制限される', () => {
      // プレイヤーを左端に配置
      player.setPosition(0, player.getY());
      mockInputManager.simulateKeyPress('ArrowLeft');
      
      player.update(16);
      
      expect(player.getX()).toBe(0);
      expect(player.getVelocity().x).toBe(0);
    });
  });

  describe('射撃処理', () => {
    test('スペースキー押下で弾丸が発射される', () => {
      mockInputManager.simulateKeyPress(' ');
      
      player.update(16);
      
      const shotEvents = mockEventEmitter.getEmittedEvents('playerShot');
      expect(shotEvents).toHaveLength(1);
    });

    test('連射レート制限が機能する', () => {
      mockTimeProvider.setTime(0);
      mockInputManager.simulateKeyPress(' ');
      player.update(16);

      // 短時間後に再射撃試行
      mockTimeProvider.setTime(50);
      player.update(16);

      expect(mockEventEmitter.getEmittedEvents('playerShot')).toHaveLength(1);

      // 十分な時間後に再射撃
      mockTimeProvider.setTime(250);
      player.update(16);

      expect(mockEventEmitter.getEmittedEvents('playerShot')).toHaveLength(2);
    });
  });

  describe('パワーアップ処理', () => {
    test('RAPID_FIREパワーアップで連射レートが向上する', () => {
      player.activatePowerup('RAPID_FIRE');
      
      expect(player.getFireRate()).toBe(GAME_CONSTANTS.PLAYER.FIRE_RATE / 2);
    });

    test('TRIPLE_SHOTパワーアップで3発同時射撃になる', () => {
      player.activatePowerup('TRIPLE_SHOT');
      mockInputManager.simulateKeyPress(' ');
      
      player.update(16);
      
      expect(mockEventEmitter.getEmittedEvents('playerShot')).toHaveLength(3);
    });
  });
});
```

### **Phase 2: 統合テスト**
```typescript
// integration/GameFlow.test.ts
describe('ゲームフロー統合テスト', () => {
  let game: Game;
  let mockDependencies: GameDependencies;

  beforeEach(() => {
    mockDependencies = {
      timeProvider: new MockTimeProvider(),
      randomProvider: new MockRandomProvider(),
      domManager: new MockDOMManager(),
      inputManager: new MockInputManager(),
      messageManager: new MockMessageManager(),
      canvas: new MockCanvas() as any
    };
    
    game = new Game(mockDependencies, ...);
  });

  test('ゲーム開始から敵出現まで', () => {
    game.start();
    
    // 敵スポーン間隔経過
    mockDependencies.timeProvider.advanceTime(GAME_CONSTANTS.ENEMY.SPAWN_INTERVAL);
    
    expect(game.getEnemies()).toHaveLength(1);
  });

  test('スコア到達でボス出現', () => {
    // スコアをボス出現値まで設定
    game.getScoreManager().addScore(1000);
    game.update(16);
    
    expect(game.getBoss()).not.toBeNull();
    expect(mockDependencies.messageManager.getDisplayedMessages())
      .toContain('ボスが出現しました！');
  });
});
```

---

## 📈 進捗管理とマイルストーン

### **Week 1: 段階1 - プロバイダー抽象化**
- [ ] Day 1-2: TimeProvider/RandomProvider作成
- [ ] Day 3-4: InputManager作成
- [ ] Day 5: Player/Gameクラスへの適用
- [ ] Day 6-7: テスト作成、動作確認

### **Week 2: 段階2 - DOM操作分離**
- [ ] Day 1-2: DOMManager作成
- [ ] Day 3-4: MessageManager作成  
- [ ] Day 5: Gameクラスへの適用
- [ ] Day 6-7: テスト作成、動作確認

### **Week 3-4: 段階3 - クラス責務分離**
- [ ] Week 3: Gameクラス依存注入リファクタ
- [ ] Week 4: Playerクラス責務分離

### **Week 5-6: 段階4 - テストスイート拡充**
- [ ] Week 5: 主要クラステスト作成
- [ ] Week 6: 統合テスト作成

### **完了条件**
- [ ] 全主要クラスが単体テスト可能
- [ ] テストカバレッジ80%以上
- [ ] CI/CDでのテスト自動実行
- [ ] ゲーム機能に影響なし
- [ ] パフォーマンス劣化なし

---

## 🔧 開発ガイドライン

### **依存注入のベストプラクティス**
```typescript
// Good: インターフェースに依存
constructor(private timeProvider: ITimeProvider) {}

// Bad: 具象クラスに依存  
constructor(private timeProvider: RealTimeProvider) {}

// Good: ファクトリーパターン
class GameFactory {
  static createForProduction(): Game {
    return new Game({
      timeProvider: new RealTimeProvider(),
      randomProvider: new RealRandomProvider(),
      // ...
    });
  }
  
  static createForTesting(): Game {
    return new Game({
      timeProvider: new MockTimeProvider(),
      randomProvider: new MockRandomProvider(),
      // ...
    });
  }
}
```

### **テストのベストプラクティス**
```typescript
// Good: 決定論的テスト
test('敵が予測可能な動きをする', () => {
  mockRandomProvider.setSequence([0.5, 0.3, 0.8]);
  mockTimeProvider.setTime(0);
  
  const enemy = new Enemy(...);
  enemy.update(16);
  
  // 予測可能な結果をテスト
  expect(enemy.getPosition()).toEqual({ x: 200, y: 150 });
});

// Bad: 非決定論的テスト
test('敵が移動する', () => {
  const enemy = new Enemy(...);
  const initialPos = enemy.getPosition();
  
  enemy.update(16);
  
  // ランダム要素により結果が不安定
  expect(enemy.getPosition()).not.toEqual(initialPos);
});
```

---

## 📚 参考資料

### **関連ドキュメント**
- `CURRENT_STATUS_SUMMARY.md` - プロジェクト現状
- `docs/dependency-analysis.md` - 依存関係分析
- `docs/refactoring-notes.md` - リファクタリング記録

### **テスト対象クラス優先度**
1. **P0 (最優先)**: Player, Game, GameEngine
2. **P1 (高優先)**: Boss, Enemy, CollisionSystem  
3. **P2 (中優先)**: ScoreManager, GameStateManager
4. **P3 (低優先)**: UI系、描画系

### **設計パターン活用**
- **Dependency Injection**: 依存関係の注入
- **Factory Pattern**: オブジェクト生成の抽象化
- **Strategy Pattern**: アルゴリズムの切り替え（Provider系）
- **Facade Pattern**: 複雑なサブシステムの隠蔽（Manager系）

---

## 🎯 期待される効果

### **短期効果（1-2週間後）**
- [ ] 時間依存処理のテストが可能
- [ ] ランダム処理の決定論的テスト
- [ ] DOM操作のモック化テスト

### **中期効果（1ヶ月後）**
- [ ] 全主要クラスの単体テスト完備
- [ ] 統合テストによる品質保証
- [ ] CI/CDでの自動テスト実行

### **長期効果（継続的）**
- [ ] 新機能開発時のテスト駆動開発
- [ ] リグレッション防止
- [ ] 保守性・拡張性の大幅向上
- [ ] 開発者の自信向上

---

**最終更新**: 2025/06/01  
**次回アクション**: 段階1 TimeProvider作成開始  
**担当者**: Tech Lead  
**進捗確認**: 週次レビュー
