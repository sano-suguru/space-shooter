# Space Shooter - プロジェクト基本情報 🚀

TypeScriptとHTML5 Canvasで開発された宇宙シューティングゲーム。Clean Architectureとモダンな開発手法を適用したプロダクション品質の実装です。

## 🎮 ゲーム特徴

- **3種類のユニークな敵UMA**（小、中、大サイズ）
- **チャレンジングなボス戦**システム
- **パワーアップシステム**（高速射撃、3連射、シールド）
- **プログレッションシステム**（アップグレード、アチーブメント）
- **複数ゲームモード**（ノーマル、ハードコア、サバイバル）
- **ダイナミック背景**（星、惑星、星雲）

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
- **←→ 矢印キー**: 左右移動
- **スペースキー**: 射撃

## 🏗️ 技術スタック

- **TypeScript** - 型安全性
- **HTML5 Canvas** - ゲーム描画
- **Vite** - 高速ビルドツール
- **Jest** - テストフレームワーク
- **Clean Architecture** - 保守性・拡張性

## 📊 プロジェクト品質指標

- ✅ **技術負債ゼロ** - 循環依存完全解消
- ✅ **テストカバレッジ60%** - 233テスト全成功
- ✅ **パフォーマンス最適化** - O(n²)→O(n)衝突判定
- ✅ **Clean Architecture** - 責務分離完了
- ✅ **プロダクション品質** - 安定動作確認済み

## 📁 現在のプロジェクト構造

```
src/
├── core/                    # コアエンジン
│   ├── Game.ts             # メインゲームクラス
│   └── GameEngine.ts       # ゲームループ管理
├── entities/               # ゲームオブジェクト
│   ├── Player.ts
│   ├── Enemy.ts
│   ├── Boss.ts
│   └── PowerUp.ts
├── managers/               # システム管理
│   ├── GameObjectManager.ts
│   ├── WaveManager.ts
│   ├── MessageManager.ts
│   └── UIManager.ts
├── progression/            # プログレッション機能
│   ├── managers/
│   ├── types/
│   └── ui/
├── systems/               # システムコンポーネント
│   └── CollisionSystem.ts
├── utils/                 # ユーティリティ
├── interfaces/            # インターフェース定義
└── components/            # UI コンポーネント
```

## 🧪 開発・テスト

```bash
# テスト実行
pnpm test

# ビルド
pnpm build

# プレビュー
pnpm preview
```

## 🛠️ 開発者向け技術情報

### アーキテクチャパターン
- **Dependency Injection** - テスタブルな設計
- **Event-Driven Architecture** - 疎結合な通信
- **Object Pool Pattern** - メモリ効率最適化  
- **Spatial Hash** - 高速衝突判定
- **Mock Provider Pattern** - 完全なテスト環境

### パフォーマンス最適化
- **SpatialHash**: O(n²) → O(n) 衝突判定
- **BackgroundRenderer**: 50%描画コスト削減
- **ObjectPool**: メモリ使用量最適化

## 🤝 貢献ガイドライン

1. フォーク
2. フィーチャーブランチ作成 (`git checkout -b feature/amazing-feature`)
3. コミット (`git commit -m 'Add amazing feature'`)
4. プッシュ (`git push origin feature/amazing-feature`)
5. プルリクエスト作成

## 📄 ライセンス

MIT License - 詳細は [LICENSE](../../LICENSE) ファイルを参照

---

**最終更新**: 2025/06/08  
**このドキュメントは**: プロジェクトの基本情報を提供します  
**詳細情報**: [ドキュメント索引](../README.md) から関連ドキュメントをご確認ください
