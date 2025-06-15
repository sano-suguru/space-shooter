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

- **TypeScript** - 型安全性
- **HTML5 Canvas** - ゲーム描画
- **React** - モバイルUI・仮想ジョイスティック
- **Vite** - 高速ビルドツール
- **Jest** - テストフレームワーク
- **Clean Architecture** - 保守性・拡張性

## 📊 プロジェクト品質

- ✅ **技術負債ゼロ** - 循環依存完全解消
- ✅ **テストカバレッジ60%** - 233テスト全成功
- ✅ **パフォーマンス最適化** - O(n²)→O(n)衝突判定
- ✅ **Clean Architecture** - 責務分離完了
- ✅ **クロスプラットフォーム対応** - デスクトップ・モバイル完全対応
- ✅ **プロダクション品質** - 安定動作確認済み

## 📚 ドキュメント

詳細なドキュメントは [docs/](docs/) フォルダに体系的に整理されています：

- **[プロジェクト概要](docs/01-project-overview/)** - 基本情報・開発状況
- **[アーキテクチャ](docs/02-architecture/)** - 技術仕様・パフォーマンス
- **[開発計画](docs/03-planning/)** - 技術負債・改善計画
- **[機能設計](docs/04-feature-design/)** - プログレッションシステム
- **[UI/UX](docs/05-ui-ux/)** - UIライブラリ評価

## 🧪 開発・テスト

```bash
# テスト実行
pnpm test

# ビルド
pnpm build

# プレビュー
pnpm preview
```

## 🛠️ 開発者向け情報

このプロジェクトは**モダンTypeScript/JavaScriptゲーム開発のベストプラクティス実装例**として設計されています：

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

### 🔧 モバイル対応技術詳細

- **TouchInputManager**: タッチイベントをキーボード入力に変換
- **VirtualJoystick**: React製の高精度仮想ジョイスティック
- **DeviceDetector**: ユーザーエージェント・タッチ機能自動判定
- **MobileUIIntegration**: React DOM統合によるモバイルUI管理
- **CoordinateConverter**: 画面座標・ゲーム座標変換
- **HapticFeedback**: Web Vibration API統合

## 🤝 貢献

1. フォーク
2. フィーチャーブランチ作成 (`git checkout -b feature/amazing-feature`)
3. コミット (`git commit -m 'Add amazing feature'`)
4. プッシュ (`git push origin feature/amazing-feature`)
5. プルリクエスト作成

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

---

🎯 **高品質なゲーム開発アーキテクチャの学習・参考にご活用ください！**
