# Space Shooter 🚀

TypeScriptとHTML5 Canvasで開発された宇宙シューティングゲーム。Clean Architectureとモダンな開発手法を適用したプロダクション品質の実装です。

## 🎮 ゲーム特徴

- **3種類のユニークな敵UMA**（小、中、大サイズ）
- **チャレンジングなボス戦**システム
- **パワーアップシステム**（高速射撃、3連射、シールド）
- **プログレッションシステム**（アップグレード、アチーブメント）
- **複数ゲームモード**（ノーマル、ハードコア、サバイバル）
- **ダイナミック背景**（星、惑星、星雲）
- **📱 完全モバイル対応**（タッチ操作・レスポンシブデザイン）

## 🚀 クイックスタート

```bash
# プロジェクトディレクトリに移動
cd space-shooter

# 依存関係インストール
pnpm install

# 開発サーバー起動
pnpm dev
```

ブラウザで `http://localhost:5173/space-shooter/` を開いてプレイ開始！

### 🎮 操作方法

#### デスクトップ
- **←→ 矢印キー**: 左右移動
- **スペースキー**: 射撃

#### モバイル・タブレット
- **仮想ジョイスティック**: プレイヤー移動（画面下部左側）
- **射撃ボタン（🔥）**: 連続射撃（画面下部右側）
- **特殊攻撃ボタン（⚡）**: スペシャルアタック（画面下部右側）
- **触覚フィードバック**: 対応デバイスでバイブレーション

### 📱 対応デバイス・ブラウザ

#### デスクトップ
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

#### モバイル
- iOS Safari 14+ (iPhone/iPad)
- Chrome Mobile 90+ (Android)
- Samsung Internet 13+
- Firefox Mobile 88+

#### 推奨環境
- **画面解像度**: 375×667px以上
- **RAM**: 2GB以上
- **プロセッサ**: A12 Bionic / Snapdragon 660相当以上

## 🏗️ 技術スタック

- **TypeScript** - 型安全性・strict mode対応
- **HTML5 Canvas** - 高性能ゲーム描画・パーティクルシステム
- **React** - UI コンポーネント・進捗表示
- **Vite** - 高速ビルドツール・開発サーバー
- **Jest** - テストフレームワーク・jsdom環境
- **Clean Architecture** - 依存性注入・責務分離
- **Zod** - 設定バリデーション・型安全性

## 📊 プロジェクト品質

- ✅ **技術負債最小化** - 循環依存解消済み
- ✅ **テスト基盤** - 24テストスイート・537テスト（532成功）
- ✅ **パフォーマンス最適化** - O(n²)→O(n)衝突判定・背景描画77%改善
- ✅ **Clean Architecture** - 責務分離・依存性注入対応
- ✅ **デスクトップ対応** - キーボード操作・レスポンシブデザイン
- ✅ **継続開発中** - 品質向上・機能拡張進行中

## 📚 ドキュメント

詳細なドキュメントは [docs/](docs/) フォルダに体系的に整理されています：

- **[プロジェクト概要](docs/01-project-overview/)** - 現在状況・開発履歴
- **[アーキテクチャ](docs/02-architecture/)** - 技術仕様・パフォーマンス分析
- **[開発計画](docs/03-planning/)** - Phase1-5完了レポート・移行計画
- **[機能設計](docs/04-feature-design/)** - ボス戦・武器システム・デバッグモード
- **[UI/UX](docs/05-ui-ux/)** - UIライブラリ評価・モバイル対応

## 🧪 開発・テスト

```bash
# テスト実行（24スイート・537テスト）
pnpm test

# テストカバレッジ確認
pnpm test:coverage

# コード品質チェック
pnpm quality

# ビルド
pnpm build

# プレビュー
pnpm preview
```

## 🛠️ 開発者向け情報

このプロジェクトでは**モダンTypeScript/JavaScriptゲーム開発の実践的な手法**を採用しています：

- **Dependency Injection** - テスタブルな設計
- **Event-Driven Architecture** - 疎結合な通信
- **Object Pool Pattern** - メモリ効率最適化
- **Spatial Hash** - 高速衝突判定
- **Mock Provider Pattern** - 完全なテスト環境
- **Touch Input Management** - タッチイベント最適化・スロットリング
- **Device Detection** - 自動デバイス判定・InputManager切り替え
- **Virtual Joystick** - React製高性能仮想コントローラー
- **Haptic Feedback** - 触覚フィードバック統合
- **Responsive Design** - 完全レスポンシブUI・Safe Area対応

### 🔧 アーキテクチャ技術詳細

- **GameEngine**: ゲームループ・deltaTime管理・フレームレート制御
- **GameObjectManager**: エンティティライフサイクル・オブジェクトプール
- **CollisionSystem**: 空間分割（SpatialHash）による高速衝突判定
- **BackgroundRenderer**: 事前レンダリング・キャッシング・LODシステム
- **PerformanceMonitor**: FPS監視・メモリ使用量・パフォーマンス警告
- **WeaponSystem**: 武器管理・エンチャント・ドロップシステム
- **EventEmitter**: イベント駆動アーキテクチャ・疎結合通信
- **Provider Pattern**: 依存性注入・テスタブル設計（Random/Time）

## 🔍 開発状況

### 完了済み機能
- ✅ **Phase 1-5**: GameConstants テスタブル設計移行完了
- ✅ **背景システム**: 7種類のエンティティ・パーティクル効果
- ✅ **パフォーマンス最適化**: 衝突判定・背景描画・メモリ管理
- ✅ **武器システム**: 複数武器・エンチャント・ドロップ機能
- ✅ **ボス戦システム**: 3種類のボス・特殊攻撃パターン
- ✅ **デバッグモード**: 開発者向けデバッグ機能

### 開発中・計画中
- 🔄 **モバイル対応**: タッチ操作・レスポンシブUI
- 🔄 **プログレッションシステム**: アップグレード・実績
- 🔄 **テスト改善**: 失敗テスト修正・カバレッジ向上

## 🤝 貢献

1. リポジトリをフォーク
2. フィーチャーブランチ作成 (`git checkout -b feature/new-feature`)
3. 変更をコミット (`git commit -m 'Add new feature'`)
4. ブランチにプッシュ (`git push origin feature/new-feature`)
5. プルリクエストを作成

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

---

🎯 **ゲーム開発アーキテクチャの学習・参考資料としてご活用ください**
