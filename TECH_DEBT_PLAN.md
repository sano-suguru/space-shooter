# 技術的負債改善計画 - Space Shooter

## 🎯 プロジェクト目標
Space Shooterの技術的負債を段階的に解消し、機能拡張しやすいコードベースを構築する

## 📊 現在の状況
- ✅ 技術的負債の調査・分析完了
- ⬜ 改善作業未着手
- **現在のフェーズ**: フェーズ1（基盤安定化）
- **次回開始タスク**: 1.1.1 依存関係の可視化

---

## 🚨 主要な技術的負債

### 🔴 最優先（P0）
1. **循環依存問題**: Game ⇔ Player, Game ⇔ Boss, Game ⇔ Enemy
2. **God Object問題**: Game クラスが10以上の責務を持つ（500行超）
3. **パフォーマンス問題**: O(n²) 衝突判定、SpatialHash未活用

### 🟡 中優先（P1）
4. **型安全性不足**: EventEmitterでany使用、エラーハンドリング不足
5. **コード重複**: 描画・アニメーション・衝突判定ロジック
6. **テスタビリティ**: 依存注入不足、モック困難

### 🟢 低優先（P2）
7. **設計パターン**: Strategy/Stateパターン不完全
8. **保守性**: 長いメソッド、マジックナンバー、ドキュメント不足

---

## 🏗️ フェーズ1: 基盤安定化（3週間想定）

### **Epic 1.1: 循環依存解消**

#### **Task 1.1.1: 依存関係の可視化** 
- **状況**: ⬜ 未着手
- **ファイル**: `docs/dependency-analysis.md`
- **コマンド**:
  ```bash
  find src -name "*.ts" -exec grep -l "import.*Game" {} \;
  find src -name "*.ts" -exec grep -l "import.*Player\|Boss\|Enemy" {} \;
  ```
- **完了条件**: 循環依存3つが特定・文書化されている
- **工数**: 2時間

#### **Task 1.1.2: IGameEngine インターフェース作成**
- **状況**: ⬜ 未着手
- **新ファイル**: `src/interfaces/IGameEngine.ts`
- **作業内容**:
  1. `src/interfaces/` ディレクトリ作成
  2. Game クラスの公開メソッドをインターフェース化
  3. Player.ts の GameInterface を置換
- **完了条件**: Player/Boss/Enemy が具象Gameクラスに直接依存しない
- **工数**: 3時間

#### **Task 1.1.3: イベント駆動通信への移行**
- **状況**: ⬜ 未着手  
- **新ファイル**: `src/events/GameCommands.ts`
- **作業内容**:
  1. 直接メソッド呼び出しをイベントに変換
  2. EventType.ts にコマンドイベント追加
  3. Game.ts でイベントハンドラー実装
- **完了条件**: 循環依存が完全解消、npm run build エラーなし
- **工数**: 4時間

### **Epic 1.2: Game クラス分割**

#### **Task 1.2.1: GameEngine 抽出**
- **状況**: ⬜ 未着手
- **新ファイル**: `src/core/GameEngine.ts`
- **移動する責務**:
  - `gameLoop()`, `start()`, `pause()`, `resume()`
  - `deltaTime` 計算、`requestAnimationFrame` 管理
- **完了条件**: ゲームループ処理がGame.tsから完全分離
- **工数**: 4時間

#### **Task 1.2.2: GameObjectManager 作成**
- **状況**: ⬜ 未着手
- **新ファイル**: `src/managers/GameObjectManager.ts`
- **移動する責務**:
  - `bullets`, `enemies`, `explosions` 等の配列管理
  - `removeOffscreenObjects()`, `updateGameObjects()`
  - オブジェクトプール管理
- **完了条件**: オブジェクト管理ロジックが分離
- **工数**: 5時間

#### **Task 1.2.3: CollisionSystem 分離**
- **状況**: ⬜ 未着手
- **新ファイル**: `src/systems/CollisionSystem.ts`  
- **移動する責務**:
  - 全ての `check*Collision()` メソッド
  - SpatialHash との統合準備
- **完了条件**: Game.ts が200行以下、責務明確化
- **工数**: 4時間

---

## ⚡ フェーズ2: パフォーマンス最適化（2週間想定）

### **Epic 2.1: 衝突判定最適化**

#### **Task 2.1.1: SpatialHash 統合**
- **状況**: ⬜ 未着手
- **対象**: `src/utils/SpatialHash.ts` → `src/systems/CollisionSystem.ts`
- **ベンチマーク**: パフォーマンス測定コード実装
- **完了条件**: 衝突判定処理時間30%削減
- **工数**: 6時間

### **Epic 2.2: 描画最適化**  

#### **Task 2.2.1: 背景事前レンダリング**
- **状況**: ⬜ 未着手
- **新ファイル**: `src/rendering/BackgroundRenderer.ts`
- **作業内容**: 星・惑星・星雲の事前描画キャッシュ
- **完了条件**: 背景描画コスト50%削減
- **工数**: 4時間

---

## 🧪 フェーズ3: テスト基盤（2週間想定）

### **Epic 3.1: テスト環境構築**

#### **Task 3.1.1: Jest セットアップ**
- **状況**: ⬜ 未着手
- **コマンド**: 
  ```bash
  npm install --save-dev jest @types/jest ts-jest @testing-library/jest-dom
  npx ts-jest config:init
  ```
- **設定ファイル**: `jest.config.js`
- **完了条件**: `npm test` でテスト実行可能

#### **Task 3.1.2: コアクラステスト作成**
- **状況**: ⬜ 未着手
- **対象**: Player, ScoreManager, CollisionUtils
- **完了条件**: テストカバレッジ50%以上

---

## 📝 セッション管理

### **現在の進捗状況**
```
フェーズ1: 基盤安定化 - 🎉 完了！
├── 1.1.1 依存関係可視化      [x] 100% ✅ 完了
├── 1.1.2 IGameEngine作成     [x] 100% ✅ 完了
├── 1.1.3 イベント駆動移行    [x] 100% ✅ 完了
├── 1.2.1 GameEngine抽出      [x] 100% ✅ 完了  
├── 1.2.2 GameObjectManager   [x] 100% ✅ 完了
└── 1.2.3 CollisionSystem分離 [x] 100% ✅ 完了

進捗: 6/6 タスク完了 (100%) 🎉
```

### **次回セッション開始時のチェックリスト**
- [ ] このドキュメントの進捗状況を確認
- [ ] `npm run build` && `npm run dev` で現状確認
- [ ] 今回着手するタスクの完了条件を確認
- [ ] 作業開始前にGitブランチ作成

### **セッション終了時のチェックリスト**
- [ ] 進捗状況を更新（上記の [ ] を [x] に）
- [ ] 次回の開始タスクを明記
- [ ] 発見した問題点や課題をメモ
- [ ] `git add . && git commit -m "作業内容"` でコミット

### **タスク完了の判断基準**

#### **1.1.1 依存関係可視化**
- [ ] `docs/dependency-analysis.md` が存在
- [ ] 循環依存3つが図示されている
- [ ] 各ファイルのimport関係が整理されている

#### **1.1.2 IGameEngine作成**
- [ ] `src/interfaces/IGameEngine.ts` が存在
- [ ] Player.ts で IGameEngine を使用
- [ ] Boss.ts, Enemy.ts で IGameEngine を使用
- [ ] `npm run build` でエラーなし

#### **1.1.3 イベント駆動移行**
- [ ] `src/events/GameCommands.ts` が存在
- [ ] 直接メソッド呼び出しが50%以上削減
- [ ] 循環依存が完全解消
- [ ] アプリケーションが正常動作

### **緊急時の巻き戻し**
```bash
# 問題発生時の対処
git stash                    # 現在の変更を退避
git checkout main           # メインブランチに戻る
git branch -D [問題ブランチ]  # 問題ブランチ削除
```

### **作業時間の目安**
- **1セッション**: 2-4時間
- **1タスク**: 2-6時間
- **1エピック**: 8-15時間
- **1フェーズ**: 20-30時間

---

## 🔄 継続開発のコツ

### **セッション開始時**
1. 前回の最終コミットをチェック
2. `npm run dev` でアプリ動作確認
3. このドキュメントで次タスクを確認
4. 作業ブランチ作成: `git checkout -b task-1-1-1`

### **セッション中**
1. 小さなコミットを頻繁に実行
2. 動作確認を随時実施
3. 問題発見時はすぐにメモ

### **セッション終了時**
1. 進捗を正確に記録
2. 次回の開始ポイントを明記
3. 課題や気づきをドキュメント化

---

## 📚 参考情報

### **関連ドキュメント**
- `docs/dependency-analysis.md` - 依存関係分析
- `docs/performance-benchmarks.md` - パフォーマンス測定結果
- `docs/refactoring-notes.md` - リファクタリング時の課題・解決策

### **重要なファイル**
- `src/core/Game.ts` - メインのGameクラス（分割対象）
- `src/entities/Player.ts` - 循環依存の主要原因
- `src/utils/SpatialHash.ts` - 実装済みだが未使用の最適化
- `src/events/EventType.ts` - イベント定義

### **開発コマンド**
```bash
npm run dev      # 開発サーバー起動
npm run build    # ビルド実行
npm run preview  # ビルド結果確認
npm test         # テスト実行（Jest導入後）
```

---

**最終更新**: 2025/05/31  
**次回開始タスク**: 1.1.1 依存関係の可視化  
**推定完了日**: フェーズ1完了まで約3週間
