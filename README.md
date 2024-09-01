# Space Shooter

Space Shooterは、TypeScriptとHTML5 Canvasを使用して開発された、宇宙空間を舞台にしたシューティングゲームです。プレイヤーは宇宙船を操縦し、様々な未確認飛行生物（UMA）と戦います。

![ゲームプレイのGIF](./gameplay.gif)

## 特徴

- 3種類のユニークな敵UMA（小、中、大）
- チャレンジングなボス戦
- パワーアップシステム（高速射撃、3連射、シールド）
- ダイナミックな背景（星、惑星、星雲）
- レベルシステムと難易度の段階的な上昇
- スコアトラッキングとゲームオーバー画面

## 使用技術

- TypeScript
- HTML5 Canvas
- Vite（ビルドツールとして）

## はじめ方

### 必要条件

- Node.js (v14以上)
- pnpm

### インストール

1. リポジトリをクローンします：
   ```
   git clone https://github.com/yourusername/space-uma-extermination-battle.git
   ```

2. プロジェクトディレクトリに移動します：
   ```
   cd space-uma-extermination-battle
   ```

3. 依存関係をインストールします：
   ```
   pnpm install
   ```

## 使用方法

1. 開発サーバーを起動します：
   ```
   pnpm dev
   ```

2. ブラウザで `http://localhost:5173` を開きます。

### 操作方法

- 左矢印キー: 左に移動
- 右矢印キー: 右に移動
- スペースキー: 射撃

## プロジェクト構造

- `src/`: ソースコード
  - `game/`: ゲームのコアロジック
  - `objects/`: ゲームオブジェクト（プレイヤー、敵、弾など）
  - `managers/`: ゲーム状態の管理
  - `utils/`: ユーティリティ関数と定数
- `public/`: 静的アセット

## 貢献

1. このリポジトリをフォークします
2. 新しいブランチを作成します（`git checkout -b feature/AmazingFeature`）
3. 変更をコミットします（`git commit -m 'Add some AmazingFeature'`）
4. ブランチにプッシュします（`git push origin feature/AmazingFeature`）
5. プルリクエストを作成します

## ライセンス

MITライセンスの下で配布されています。詳細は`LICENSE`ファイルを参照してください。