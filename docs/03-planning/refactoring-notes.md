# リファクタリングメモ

## 📝 概要
技術的負債改善作業中に発見した問題、解決策、学習内容を記録

---

## 🔧 作業ログ

### **2025/05/31 - プロジェクト開始**
- **作業内容**: 技術的負債調査、改善計画策定
- **発見事項**: 
  - Gameクラスが500行超のGod Object
  - 循環依存が3箇所で発生
  - SpatialHashが実装済みだが未使用
- **次回アクション**: 依存関係の具体的分析

---

## 💡 解決パターン集

### **循環依存の解決方法**

#### **パターン1: インターフェース分離**
```typescript
// Before: 具象クラス依存
import { Game } from '../core/Game';
private game: Game;

// After: インターフェース依存
import { IGameEngine } from '../interfaces/IGameEngine';
private gameEngine: IGameEngine;
```

#### **パターン2: イベント駆動通信**
```typescript
// Before: 直接メソッド呼び出し
this.game.createBullet(x, y);

// After: イベント発行
this.eventEmitter.emit('createBullet', { x, y });
```

#### **パターン3: 依存注入**
```typescript
// Before: 具象クラスを直接作成
class Player {
  constructor() {
    this.game = new Game(); // 循環依存の原因
  }
}

// After: 依存注入
class Player {
  constructor(private gameEngine: IGameEngine) {}
}
```

### **大きなクラスの分割方法**

#### **責務の特定**
1. **単一責任原則の適用**: 1クラス1責務
2. **関連するメソッドをグループ化**
3. **依存関係の最小化**

#### **分割の手順**
1. 責務別にメソッドを分類
2. 新しいクラス/インターフェースを設計
3. 段階的にメソッドを移動
4. 依存関係を再構築

---

## 🚨 よくある問題と対処法

### **問題: TypeScriptコンパイルエラー**
```bash
# エラー例
TS2305: Module '"./Game"' has no exported member 'GameInterface'.
```
**対処法**: インターフェースの export/import を確認

### **問題: 実行時エラー**
```bash
# エラー例
TypeError: Cannot read property 'createBullet' of undefined
```
**対処法**: 依存注入の設定を確認

### **問題: 循環依存警告**
```bash
# 警告例
Circular dependency detected: Game -> Player -> Game
```
**対処法**: イベント駆動通信への置換

---

## 📊 パフォーマンス改善メモ

### **衝突判定最適化**
- **現状**: O(n²) の総当たり判定
- **改善案**: SpatialHashによるO(n)最適化
- **実装場所**: `src/systems/CollisionSystem.ts`

### **描画最適化**
- **現状**: 毎フレーム全背景を再描画
- **改善案**: 静的背景の事前レンダリング
- **実装場所**: `src/rendering/BackgroundRenderer.ts`

---

## 🧪 テスト戦略

### **テスト対象の優先順位**
1. **P0**: コアロジック（Player, Game, CollisionUtils）
2. **P1**: マネージャー系（ScoreManager, GameStateManager）
3. **P2**: ファクトリー系（GameObjectFactory）

### **モック戦略**
```typescript
// Canvas APIのモック
const mockContext = {
  fillRect: jest.fn(),
  drawImage: jest.fn(),
  // ...
};

// 時間関数のモック
jest.spyOn(Date, 'now').mockReturnValue(1000);
jest.spyOn(Math, 'random').mockReturnValue(0.5);
```

---

## 🎯 アーキテクチャ決定記録

### **ADR-001: インターフェース分離の採用**
- **日付**: 2025/05/31
- **決定**: 循環依存解消のためインターフェース分離を採用
- **理由**: 
  - テスタビリティの向上
  - 依存関係の明確化
  - 将来の拡張性確保
- **トレードオフ**: 
  - ファイル数の増加
  - 初期実装コストの増加

### **ADR-002: イベント駆動アーキテクチャの部分採用**
- **日付**: 2025/05/31
- **決定**: 循環依存が発生する箇所でイベント駆動通信を採用
- **理由**:
  - 完全な依存関係の分離
  - 拡張性の向上
- **トレードオフ**:
  - デバッグの複雑化
  - イベントの型安全性確保が必要

---

## 📚 学習メモ

### **TypeScript関連**
- 循環依存の検出方法
- インターフェース分離の原則
- 依存注入パターンの実装

### **ゲーム開発関連**
- 空間分割による衝突判定最適化
- Canvas描画の最適化テクニック
- ゲームループの設計パターン

### **設計パターン関連**
- Strategy パターンの活用場面
- Observer パターン（EventEmitter）の応用
- Factory パターンの拡張

---

## 🔜 次回セッション準備

### **開始前チェック**
- [ ] 前回の進捗確認
- [ ] 動作確認（npm run dev）
- [ ] 今回のタスク内容確認

### **今回のタスク**
**Task**: 1.1.1 依存関係の可視化
- [ ] 依存関係コマンド実行
- [ ] 結果をdependency-analysis.mdに記録
- [ ] 循環依存の詳細分析

### **想定課題**
- Gameクラスの複雑な依存関係
- 隠れた循環依存の発見
- リファクタリング範囲の拡大

---

**最終更新**: 2025/05/31  
**次回更新予定**: 次回セッション終了時
