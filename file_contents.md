# プロジェクトのソース一覧

## ./index.html

```html
<!DOCTYPE html>
<html lang="ja">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>スペースシューティングゲーム</title>
  <link rel="stylesheet" href="src/styles.css">
</head>

<body>
  <div id="game-container">
    <canvas id="gameCanvas"></canvas>
    <div class="aurora-overlay"></div>
    <div id="ui-overlay">
      <div id="score">スコア: <span id="scoreValue">0</span></div>
      <div id="level">レベル: <span id="levelValue">1</span></div>
      <div id="health">
        体力: <span id="healthValue">100</span>
        <div id="healthBar">
          <div id="healthBarFill"></div>
        </div>
      </div>
    </div>
    <div id="gameOver" class="hidden">
      <h2>ゲームオーバー</h2>
      <p>最終スコア: <span id="finalScore"></span></p>
      <button id="restartButton">リスタート</button>
    </div>
  </div>
  <script type="module" src="src/index.ts"></script>
</body>

</html>
```


## ./vite.config.js

```js
import { defineConfig } from 'vite'

export default defineConfig({
    base: '/space-shooter/'
})

```


## ./README.md

```md
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
   git clone https://github.com/yourusername/space-shooter.git
   ```

2. プロジェクトディレクトリに移動します：
   ```
   cd space-shooter
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
```


## ./extract-file-contents.sh

```sh
#!/bin/bash

# 出力ファイル名
output_file="file_contents.md"

# 出力ファイルを初期化
echo "# プロジェクトのソース一覧" > "$output_file"

# バッククォートをエスケープした文字列を変数に格納
code_block='```'

# ファイルを再帰的に検索し、内容を出力ファイルに追記
find . -type f \
    ! -path "./dist/*" \
    ! -path "./node_modules/*" \
    ! -path "./.git/*" \
    ! -name "pnpm-lock.yaml" \
    ! -name "$output_file" \
    -print0 | while IFS= read -r -d '' file; do
    echo -e "\n## $file\n" >> "$output_file"
    # ファイルの拡張子を取得
    extension="${file##*.}"
    # 拡張子が存在する場合のみ、コードブロックに追加
    if [ "$extension" != "$file" ]; then
        echo "${code_block}${extension}" >> "$output_file"
    else
        echo "${code_block}" >> "$output_file"
    fi
    cat "$file" >> "$output_file"
    echo -e "\n${code_block}\n" >> "$output_file"
done

echo "ファイル内容を $output_file に書き出しました。"
```


## ./.gitignore

```gitignore
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

```


## ./package.json

```json
{
  "name": "space-shooter",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "extract": "./extract-file-contents.sh",
    "deploy": "pnpm run build && gh-pages -d dist"
  },
  "devDependencies": {
    "gh-pages": "^6.1.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.1"
  },
  "packageManager": "pnpm@9.8.0+sha512.8e4c3550fb500e808dbc30bb0ce4dd1eb614e30b1c55245f211591ec2cdf9c611cabd34e1364b42f564bd54b3945ed0f49d61d1bbf2ec9bd74b866fcdc723276"
}
```


## ./tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}

```


## ./LICENCE

```/LICENCE
MIT License

Copyright (c) 2024 [Your Name or Your Organization]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```


## ./src/types/index.ts

```ts
import { Player } from "../objects/Player";

export type GameConstants = {
    readonly CANVAS: {
        readonly WIDTH: number;
        readonly HEIGHT: number;
    };
    readonly PLAYER: {
        readonly WIDTH: number;
        readonly HEIGHT: number;
        readonly MAX_SPEED: number;
        readonly ACCELERATION: number;
        readonly DECELERATION: number;
        readonly MAX_HEALTH: number;
        readonly INVINCIBILITY_TIME: number;
        readonly FIRE_RATE: number;
        readonly COLORS: {
            readonly PRIMARY: string;
            readonly SECONDARY: string
            readonly ACCENT: string
            readonly ENGINE: string
        }
    };
    readonly BULLET: {
        readonly WIDTH: number;
        readonly HEIGHT: number;
        readonly SPEED: number;
    };
    readonly ENEMY: {
        readonly SPAWN_INTERVAL: number;
        readonly TYPES: {
            readonly [key in EnemyType]: {
                readonly width: number;
                readonly height: number;
                readonly speed: number;
                readonly health: number;
                readonly score: number;
                readonly color: string;
            };
        };
    };
    readonly BOSS: {
        readonly WIDTH: number;
        readonly HEIGHT: number;
        readonly BULLET_SPEED: number;
        readonly FIRE_RATE: number;
        readonly INITIAL_HEALTH: number;
        readonly INITIAL_SPEED: number;
        readonly MOVEMENT_SPEED: number;
    };
    readonly POWERUP: {
        readonly WIDTH: number;
        readonly HEIGHT: number;
        readonly SPEED: number;
        readonly DURATION: number;
        readonly SPAWN_CHANCE: number;
        readonly TYPES: {
            readonly [key in PowerUpType]: {
                readonly color: string;
                readonly effect: (player: Player) => void;
            };
        };
    };
    readonly EXPLOSION: {
        readonly DURATION: number;
    };
    readonly BACKGROUND: {
        readonly STAR_COUNT: number;
        readonly PLANET_COUNT: number;
        readonly NEBULA_COUNT: number;
    };
};

export type EnemyType = 'SMALL' | 'MEDIUM' | 'LARGE';
export type PowerUpType = 'RAPID_FIRE' | 'TRIPLE_SHOT' | 'SHIELD';
export type MovementPattern = 'straight' | 'zigzag' | 'sine';
export type Vector2D = {
    x: number;
    y: number;
};

```


## ./src/styles.css

```css
:root {
  --color-primary: #000033;
  --color-secondary: #000066;
  --color-text: #fff;
  --color-accent: #00ffaa;
  --color-health-bar: #00ff00;
  --color-button-gradient-start: #4a4a4a;
  --color-button-gradient-end: #6a6a6a;
  --border-radius-small: 5px;
  --border-radius-medium: 10px;
  --border-radius-large: 15px;
  --border-radius-xl: 20px;
  --border-radius-xxl: 25px;
  --shadow-color: rgba(255, 255, 255, 0.3);
  --overlay-color: rgba(0, 0, 0, 0.5);
  --transition-duration: 0.3s;
}

body {
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  font-family: 'Arial', sans-serif;
  color: var(--color-text);
  overflow: hidden;
}

#game-container {
  position: relative;
  box-shadow: 0 0 50px rgba(0, 255, 255, 0.3);
  border-radius: var(--border-radius-medium);
}

#gameCanvas {
  border: 2px solid rgba(74, 74, 74, 0.5);
  border-radius: var(--border-radius-medium);
  background-color: transparent;
  animation: aurora-glow 8s infinite;
}

#ui-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 16px;
  color: var(--color-text);
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
}

#score,
#level,
#health {
  margin-bottom: 10px;
  background: var(--overlay-color);
  padding: 5px 10px;
  border-radius: var(--border-radius-large);
  backdrop-filter: blur(5px);
}

#health {
  display: flex;
  align-items: center;
}

#healthBar {
  width: 100px;
  height: 10px;
  background-color: rgba(51, 51, 51, 0.5);
  margin-left: 10px;
  border-radius: var(--border-radius-small);
  overflow: hidden;
}

#healthBarFill {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, var(--color-health-bar), var(--color-accent));
  transition: width var(--transition-duration) ease-in-out;
}

#gameOver {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  padding: 30px;
  border-radius: var(--border-radius-xl);
  text-align: center;
  border: 2px solid rgba(74, 74, 74, 0.5);
  box-shadow: 0 0 20px var(--shadow-color);
  backdrop-filter: blur(10px);
}

#gameOver h2 {
  font-size: 36px;
  margin-bottom: 20px;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

#restartButton {
  margin-top: 20px;
  padding: 12px 24px;
  font-size: 18px;
  cursor: pointer;
  background: linear-gradient(135deg, var(--color-button-gradient-start), var(--color-button-gradient-end));
  color: var(--color-text);
  border: none;
  border-radius: var(--border-radius-xxl);
  transition: all var(--transition-duration) ease;
  box-shadow: 0 0 10px var(--shadow-color);
}

#restartButton:hover {
  background: linear-gradient(135deg, var(--color-button-gradient-end), #8a8a8a);
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
}

.hidden {
  display: none;
}

.aurora-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background:
    radial-gradient(ellipse at top, rgba(0, 255, 100, 0.1), transparent 70%),
    radial-gradient(ellipse at bottom, rgba(0, 200, 255, 0.1), transparent 70%);
  mix-blend-mode: screen;
  opacity: 0.3;
  animation: aurora-pulse 15s infinite alternate;
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
}

@keyframes aurora-glow {

  0%,
  100% {
    filter: brightness(1) saturate(1);
  }

  50% {
    filter: brightness(1.1) saturate(1.1);
  }
}

@keyframes aurora-pulse {
  0% {
    opacity: 0.2;
  }

  100% {
    opacity: 0.4;
  }
}

.pulse {
  animation: pulse 2s infinite;
}
```


## ./src/managers/UIManager.ts

```ts
import { GAME_CONSTANTS } from "../utils/Constants";
import { EventEmitter, EventMap } from "../utils/EventEmitter";

export class UIManager {
    constructor(
        private eventEmitter: EventEmitter<EventMap>,
        private scoreElement: HTMLElement,
        private levelElement: HTMLElement,
        private healthElement: HTMLElement,
        private healthBarElement: HTMLElement,
        private gameOverElement: HTMLElement
    ) {
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.eventEmitter.on('scoreUpdated', (score: number) => this.updateScoreDisplay(score));
        this.eventEmitter.on('healthChanged', (health: number) => this.updateHealthDisplay(health));
        this.eventEmitter.on('levelUpdated', (level: number) => this.updateLevelDisplay(level));
        this.eventEmitter.on('gameOver', () => this.showGameOver());
    }


    updateScoreDisplay(score: number): void {
        this.scoreElement.textContent = score.toString();
    }

    updateLevelDisplay(level: number): void {
        this.levelElement.textContent = level.toString();
    }

    updateHealthDisplay(health: number): void {
        this.healthElement.textContent = health.toString();
        const healthPercentage = (health / GAME_CONSTANTS.PLAYER.MAX_HEALTH) * 100;
        this.healthBarElement.style.width = `${healthPercentage}%`;
    }

    showGameOver(): void {
        this.gameOverElement.classList.remove('hidden');
    }
}

```


## ./src/objects/Nebula.ts

```ts
import { GAME_CONSTANTS } from "../utils/Constants";

export class Nebula {
    private x: number;
    private y: number;
    private width: number;
    private height: number;
    private color: string;
    private particles: Array<{ x: number; y: number; radius: number; alpha: number }>;

    constructor() {
        this.x = Math.random() * GAME_CONSTANTS.CANVAS.WIDTH;
        this.y = Math.random() * GAME_CONSTANTS.CANVAS.HEIGHT;
        this.width = Math.random() * 200 + 100;
        this.height = Math.random() * 200 + 100;
        this.color = `hsla(${Math.random() * 360}, 70%, 50%, 0.2)`;
        this.particles = this.generateParticles();
    }

    private generateParticles(): Array<{ x: number; y: number; radius: number; alpha: number }> {
        return Array(50).fill(null).map(() => ({
            x: (Math.random() - 0.5) * this.width,
            y: (Math.random() - 0.5) * this.height,
            radius: Math.random() * 3 + 1,
            alpha: Math.random() * 0.5 + 0.2
        }));
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw nebula base
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw particles
        ctx.fillStyle = this.color.replace('0.2', '1');
        this.particles.forEach(particle => {
            ctx.globalAlpha = particle.alpha;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }
}

```


## ./src/objects/Explosion.ts

```ts
import { Vector2D } from "../types";
import { GAME_CONSTANTS } from "../utils/Constants";

export class Explosion {
    private x: number;
    private y: number;
    private particles: Array<{
        x: number;
        y: number;
        radius: number;
        speed: number;
        angle: number;
        color: string;
    }>;
    private duration: number;
    private currentFrame: number;
    private maxRadius: number;

    constructor({ x, y }: Vector2D, size: number = 1) {
        this.maxRadius = 30 * size;
        this.x = x;
        this.y = y;
        this.particles = [];
        this.duration = GAME_CONSTANTS.EXPLOSION.DURATION
        this.currentFrame = 0;

        const particleCount = Math.floor(50 * size);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.maxRadius;
            this.particles.push({
                x: this.x + Math.cos(angle) * radius * Math.random(),
                y: this.y + Math.sin(angle) * radius * Math.random(),
                radius: Math.random() * 4 + 1,
                speed: Math.random() * 100 + 25,
                angle: angle,
                color: this.getExplosionColor()
            });
        }
    }

    private getExplosionColor(): string {
        const hue = Math.random() * 60 + 10;
        const saturation = 100;
        const lightness = 50 + Math.random() * 30; // より明るい色も含める
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    public update(deltaTime: number): void {
        this.currentFrame++;
        const progress = this.currentFrame / this.duration;

        this.particles.forEach(particle => {
            const speedFactor = progress < 0.2 ? 1 : 1 - (progress - 0.2) / 0.8;
            particle.x += Math.cos(particle.angle) * particle.speed * deltaTime * speedFactor;
            particle.y += Math.sin(particle.angle) * particle.speed * deltaTime * speedFactor;
            particle.radius *= 0.98;
            particle.speed *= 0.98
        });
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        const progress = this.currentFrame / this.duration;
        this.particles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = Math.max(0, 1 - progress ** 1.5);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius * 1.2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    public isFinished(): boolean {
        return this.currentFrame >= this.duration;
    }
}

```


## ./src/objects/Enemy.ts

```ts
import { Game } from "../game/Game";
import { EnemyType, MovementPattern, Vector2D } from "../types";
import { GAME_CONSTANTS } from "../utils/Constants";
import { GameObject } from "./GameObject";

export class Enemy extends GameObject {
    private type: EnemyType;
    private speed: number;
    private health: number;
    private score: number;
    private color: string;
    private movementPattern: MovementPattern;
    private movementTimer: number = 0;
    private game: Game;
    private animationPhase: number = 0;
    private subEntities: { x: number, y: number, radius: number }[] = [];

    constructor(type: EnemyType, x: number, y: number, game: Game) {
        const enemyData = GAME_CONSTANTS.ENEMY.TYPES[type];
        super(x, y, enemyData.width, enemyData.height);
        this.type = type;
        this.speed = enemyData.speed;
        this.health = enemyData.health;
        this.score = enemyData.score;
        this.color = enemyData.color;
        this.movementPattern = this.getMovementPatternForType();
        this.game = game;

        // タイプに応じたサブエンティティの初期化
        if (type === 'MEDIUM') {
            const count = 3 + Math.floor(Math.random() * 3); // 3〜5個
            for (let i = 0; i < count; i++) {
                this.subEntities.push({
                    x: (Math.random() - 0.5) * this.width * 0.8,
                    y: (Math.random() - 0.5) * this.height * 0.8,
                    radius: this.width * (0.1 + Math.random() * 0.1)
                });
            }
        }
    }

    private getMovementPatternForType(): MovementPattern {
        switch (this.type) {
            case 'SMALL':
                return 'zigzag';
            case 'MEDIUM':
                return 'sine';
            case 'LARGE':
                return 'straight';
            default:
                return 'straight';
        }
    }

    public update(deltaTime: number): void {
        const speedMultiplier = 1 + this.game.getDifficultyFactor();
        this.y += this.speed * speedMultiplier * deltaTime;

        this.movementTimer += 3 * deltaTime;
        switch (this.movementPattern) {
            case 'zigzag':
                this.x += Math.sin(this.movementTimer * 2) * 2;
                break;
            case 'sine':
                this.x += Math.sin(this.movementTimer) * 1.5;
                break;
        }

        if (this.x < 0 || this.x + this.width > GAME_CONSTANTS.CANVAS.WIDTH) {
            this.movementPattern = 'straight';
        }

        this.animationPhase += deltaTime * 2;

        // MEDIUMタイプの場合、サブエンティティをアニメーション
        if (this.type === 'MEDIUM') {
            this.subEntities.forEach(entity => {
                entity.x += Math.sin(this.animationPhase + entity.y) * 0.5;
                entity.y += Math.cos(this.animationPhase + entity.x) * 0.5;
            });
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        switch (this.type) {
            case 'SMALL':
                this.drawSmallUMA(ctx);
                break;
            case 'MEDIUM':
                this.drawMediumUMA(ctx);
                break;
            case 'LARGE':
                this.drawLargeUMA(ctx);
                break;
        }

        ctx.restore();
    }

    private drawSmallUMA(ctx: CanvasRenderingContext2D): void {
        const radius = this.width / 2;

        // 本体（アメーバ状）
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const r = radius * (0.8 + Math.sin(this.animationPhase + i) * 0.2);
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();

        // 核
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // 偽足
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + this.animationPhase;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * radius * 0.8, Math.sin(angle) * radius * 0.8);
            ctx.lineTo(Math.cos(angle) * radius * 1.2, Math.sin(angle) * radius * 1.2);
            ctx.stroke();
        }
    }

    private drawMediumUMA(ctx: CanvasRenderingContext2D): void {
        const radius = this.width / 2;

        // 本体（クラゲ状）
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // 触手
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const length = radius * (1 + Math.sin(this.animationPhase + i) * 0.2);
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
            ctx.stroke();
        }

        // サブエンティティ（発光体）
        this.subEntities.forEach(entity => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    private drawLargeUMA(ctx: CanvasRenderingContext2D): void {
        const radius = this.width / 2;

        // 本体（結晶状）
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const r = radius * (1 + Math.cos(this.animationPhase + i) * 0.1);
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();

        // エネルギー放出
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const length = radius * (1.2 + Math.sin(this.animationPhase + i) * 0.3);
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
            ctx.stroke();
        }

        // 中心のコア
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // コアの周りの軌道
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, radius * (0.5 + i * 0.2), 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    public takeDamage(): boolean {
        this.health--;
        return this.health <= 0;
    }

    public getScore(): number {
        return this.score;
    }

    public isOnScreen(): boolean {
        return this.y < GAME_CONSTANTS.CANVAS.HEIGHT;
    }

    public getPosition(): Vector2D {
        return { x: this.x, y: this.y };
    }

    public getType(): EnemyType {
        return this.type;
    }
}

```


## ./src/objects/Bullet.ts

```ts
import { GAME_CONSTANTS } from "../utils/Constants";
import { GameObject } from "./GameObject";

export class Bullet extends GameObject {
    constructor(x: number, y: number) {
        super(x, y, GAME_CONSTANTS.BULLET.WIDTH, GAME_CONSTANTS.BULLET.HEIGHT);
    }

    public update(deltaTime: number): void {
        this.y -= GAME_CONSTANTS.BULLET.SPEED * deltaTime;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    public isOnScreen(): boolean {
        return this.y + this.height > 0;
    }
}

```


## ./src/objects/PowerUp.ts

```ts
import { PowerUpType } from "../types";
import { GAME_CONSTANTS } from "../utils/Constants";
import { GameObject } from "./GameObject";

export class PowerUp extends GameObject {
    private type: PowerUpType;
    private color: string;
    private rotation: number = 0;
    private rotationSpeed: number;
    private glowIntensity: number = 0;
    private glowDirection: number = 1;
    private trail: Array<{ x: number; y: number; alpha: number }> = [];
    private trailUpdateCounter: number = 0;

    constructor(x: number, y: number) {
        super(x, y, GAME_CONSTANTS.POWERUP.WIDTH, GAME_CONSTANTS.POWERUP.HEIGHT);
        this.type = this.getRandomPowerUpType();
        this.color = GAME_CONSTANTS.POWERUP.TYPES[this.type].color;
        this.rotationSpeed = Math.random() * 0.1 + 0.05;
    }

    private getRandomPowerUpType(): PowerUpType {
        const types = Object.keys(GAME_CONSTANTS.POWERUP.TYPES) as PowerUpType[];
        return types[Math.floor(Math.random() * types.length)];
    }

    public update(deltaTime: number): void {
        this.y += GAME_CONSTANTS.POWERUP.SPEED * deltaTime;
        this.rotation += this.rotationSpeed * deltaTime;

        // Update glow effect
        this.glowIntensity += 0.05 * this.glowDirection;
        if (this.glowIntensity >= 1 || this.glowIntensity <= 0) {
            this.glowDirection *= -1;
        }

        // Update trail
        this.trailUpdateCounter += deltaTime;
        if (this.trailUpdateCounter >= 0.05) { // Add a new trail point every 50ms
            this.trail.unshift({ x: this.x, y: this.y, alpha: 1 });
            this.trailUpdateCounter = 0;
        }

        if (this.trail.length > 30) {  // Significantly increased trail length
            this.trail.pop();
        }
        this.trail.forEach(point => point.alpha -= 0.02);  // Even slower fade-out
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        // Draw trail
        this.drawTrail(ctx);

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        // Draw glow effect
        const glowSize = this.width / 2 + 5 + this.glowIntensity * 3;
        const gradient = ctx.createRadialGradient(0, 0, this.width / 2, 0, 0, glowSize);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Draw outer circle
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();

        // Draw inner colored circle
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Draw power-up type symbol
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let symbol: string;
        switch (this.type) {
            case 'RAPID_FIRE':
                symbol = 'R';
                break;
            case 'TRIPLE_SHOT':
                symbol = 'T';
                break;
            case 'SHIELD':
                symbol = 'S';
                break;
        }
        ctx.fillText(symbol, 0, 0);

        ctx.restore();
    }

    private drawTrail(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        for (let i = this.trail.length - 1; i >= 0; i--) {
            const point = this.trail[i];
            const size = (this.width / 2) * (1 - i / this.trail.length) * 0.8;  // Slightly reduced max size
            ctx.fillStyle = `rgba(${parseInt(this.color.slice(1, 3), 16)}, ${parseInt(this.color.slice(3, 5), 16)}, ${parseInt(this.color.slice(5, 7), 16)}, ${point.alpha * 0.8})`;  // Further increased base alpha
            ctx.beginPath();
            ctx.arc(point.x + this.width / 2, point.y + this.height / 2, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    public isOnScreen(): boolean {
        return this.y < GAME_CONSTANTS.CANVAS.HEIGHT;
    }

    public getType(): PowerUpType {
        return this.type;
    }
}

```


## ./src/objects/GameObject.ts

```ts
import { Drawable } from "../interfaces/Drawable";
import { Updateable } from "../interfaces/Updateable";

export abstract class GameObject implements Drawable, Updateable {
    constructor(
        protected x: number,
        protected y: number,
        protected width: number,
        protected height: number
    ) { }

    abstract update(deltaTime: number): void;
    abstract draw(ctx: CanvasRenderingContext2D): void;

    public getX(): number {
        return this.x;
    }

    public getY(): number {
        return this.y;
    }

    public getWidth(): number {
        return this.width;
    }

    public getHeight(): number {
        return this.height;
    }
}
```


## ./src/objects/Planet.ts

```ts
import { GAME_CONSTANTS } from "../utils/Constants";

export class Planet {
    private x: number;
    private y: number;
    private radius: number;
    private baseColor: string;
    private craters: Array<{ x: number; y: number; radius: number }>;
    private rotation: number;
    private rotationSpeed: number;

    constructor() {
        this.x = Math.random() * GAME_CONSTANTS.CANVAS.WIDTH;
        this.y = Math.random() * GAME_CONSTANTS.CANVAS.HEIGHT;
        this.radius = Math.random() * 30 + 20;
        this.baseColor = `hsl(${Math.random() * 360}, 50%, 50%)`;
        this.craters = this.generateCraters();
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.01;
    }

    private generateCraters(): Array<{ x: number; y: number; radius: number }> {
        const craterCount = Math.floor(Math.random() * 5) + 3;
        return Array(craterCount).fill(null).map(() => ({
            x: (Math.random() - 0.5) * this.radius * 1.5,
            y: (Math.random() - 0.5) * this.radius * 1.5,
            radius: Math.random() * (this.radius * 0.3) + (this.radius * 0.1)
        }));
    }

    public update(deltaTime: number): void {
        this.rotation += this.rotationSpeed * deltaTime;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw planet base
        ctx.fillStyle = this.baseColor;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw craters
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.craters.forEach(crater => {
            ctx.beginPath();
            ctx.arc(crater.x, crater.y, crater.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }
}

```


## ./src/objects/Player.ts

```ts
import { PowerUpType, Vector2D } from "../types";
import { GAME_CONSTANTS } from "../utils/Constants";
import { EventEmitter, EventMap } from "../utils/EventEmitter";
import { Bullet } from "./Bullet";
import { GameObject } from "./GameObject";

export class Player extends GameObject {
    private velocity: Vector2D = { x: 0, y: 0 };
    private health: number;
    private fireRate: number;
    private bulletType: 'single' | 'triple' = 'single';
    private shieldActive = false;
    private activePowerups: { type: PowerUpType; startTime: number }[] = [];
    private keys: { [key: string]: boolean } = {};
    private engineAnimationPhase = 0;
    private invincible = false;
    private lastHitTime = 0;
    private lastFireTime = 0;
    private thrusterParticles: Array<{ x: number; y: number; speed: number; life: number }> = [];


    constructor(
        private eventEmitter: EventEmitter<EventMap>,
    ) {
        super(
            GAME_CONSTANTS.CANVAS.WIDTH / 2 - GAME_CONSTANTS.PLAYER.WIDTH / 2,
            GAME_CONSTANTS.CANVAS.HEIGHT - GAME_CONSTANTS.PLAYER.HEIGHT - 10,
            GAME_CONSTANTS.PLAYER.WIDTH,
            GAME_CONSTANTS.PLAYER.HEIGHT
        );
        this.health = GAME_CONSTANTS.PLAYER.MAX_HEALTH;
        this.fireRate = GAME_CONSTANTS.PLAYER.FIRE_RATE;
    }

    public setKeyState(key: string, isPressed: boolean): void {
        this.keys[key] = isPressed;
    }

    public update(deltaTime: number): void {
        this.updateMovement();
        this.updateShooting();
        this.updateInvincibility();
        this.updateEngineAnimation(deltaTime);
        this.updateThrusterParticles(deltaTime);
    }

    private updateMovement(): void {
        const { CANVAS } = GAME_CONSTANTS;

        this.updateVelocity();

        this.x += this.velocity.x;
        this.clampPosition(0, CANVAS.WIDTH - this.width);

        this.generateThrusterParticles();
    }

    private updateVelocity(): void {
        const { ACCELERATION, MAX_SPEED } = GAME_CONSTANTS.PLAYER;

        if (this.keys['ArrowLeft']) {
            this.velocity.x = Math.max(this.velocity.x - ACCELERATION, -MAX_SPEED);
        } else if (this.keys['ArrowRight']) {
            this.velocity.x = Math.min(this.velocity.x + ACCELERATION, MAX_SPEED);
        } else {
            this.applyDeceleration();
        }
    }

    private applyDeceleration(): void {
        const { DECELERATION } = GAME_CONSTANTS.PLAYER;

        if (this.velocity.x > 0) {
            this.velocity.x = Math.max(0, this.velocity.x - DECELERATION);
        } else if (this.velocity.x < 0) {
            this.velocity.x = Math.min(0, this.velocity.x + DECELERATION);
        }
    }

    private clampPosition(min: number, max: number): void {
        if (this.x < min) {
            this.x = min;
            this.velocity.x = 0;
        } else if (this.x > max) {
            this.x = max;
            this.velocity.x = 0;
        }
    }

    private updateShooting(): void {
        if (this.keys[' ']) this.shoot();
    }

    private shoot(): void {
        const currentTime = Date.now();
        if (currentTime - this.lastFireTime >= this.fireRate) {
            if (this.bulletType === 'single') {
                this.eventEmitter.emit('playerShot', new Bullet(this.x + this.width / 2 - GAME_CONSTANTS.BULLET.WIDTH / 2, this.y))
            } else if (this.bulletType === 'triple') {
                this.eventEmitter.emit('playerShot', new Bullet(this.x + this.width / 2 - GAME_CONSTANTS.BULLET.WIDTH / 2, this.y));
                this.eventEmitter.emit('playerShot', new Bullet(this.x + this.width / 2 - GAME_CONSTANTS.BULLET.WIDTH / 2 - 20, this.y + 10));
                this.eventEmitter.emit('playerShot', new Bullet(this.x + this.width / 2 - GAME_CONSTANTS.BULLET.WIDTH / 2 + 20, this.y + 10));
            }
            this.lastFireTime = currentTime;
        }
    }

    private updateInvincibility(): void {
        if (this.invincible && Date.now() - this.lastHitTime > GAME_CONSTANTS.PLAYER.INVINCIBILITY_TIME) {
            this.invincible = false;
        }
    }

    private updateEngineAnimation(deltaTime: number): void {
        this.engineAnimationPhase += 10 * deltaTime;
        if (this.engineAnimationPhase > Math.PI * 2) {
            this.engineAnimationPhase = 0;
        }
    }

    private generateThrusterParticles(): void {
        const particleCount = 3;
        for (let i = 0; i < particleCount; i++) {
            this.thrusterParticles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height,
                speed: Math.random() * 50 + 50,
                life: 1
            });
        }
    }

    private updateThrusterParticles(deltaTime: number): void {
        for (let i = this.thrusterParticles.length - 1; i >= 0; i--) {
            const particle = this.thrusterParticles[i];
            particle.y += particle.speed * deltaTime;
            particle.life -= deltaTime;

            if (particle.life <= 0) {
                this.thrusterParticles.splice(i, 1);
            }
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        this.drawThrusterParticles(ctx);
        this.drawShip(ctx);
        this.drawShield(ctx);
    }

    private drawShip(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // メインボディ
        ctx.fillStyle = this.invincible ? 'rgba(255, 0, 0, 0.5)' : GAME_CONSTANTS.PLAYER.COLORS.PRIMARY;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fill();

        // 補助翼
        ctx.fillStyle = GAME_CONSTANTS.PLAYER.COLORS.SECONDARY;
        ctx.beginPath();
        ctx.moveTo(-this.width / 4, 0);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.lineTo(0, this.height / 4);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.width / 4, 0);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.lineTo(0, this.height / 4);
        ctx.closePath();
        ctx.fill();

        // コックピット
        ctx.fillStyle = GAME_CONSTANTS.PLAYER.COLORS.ACCENT;
        ctx.beginPath();
        ctx.ellipse(0, -this.height / 6, this.width / 6, this.height / 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // エンジンの輝き
        const engineGlowSize = 10 + Math.sin(this.engineAnimationPhase) * 3;
        const gradient = ctx.createRadialGradient(
            0, this.height / 2,
            0, 0, this.height / 2, engineGlowSize
        );
        gradient.addColorStop(0, GAME_CONSTANTS.PLAYER.COLORS.ENGINE);
        gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, this.height / 2, engineGlowSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    private drawThrusterParticles(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        for (const particle of this.thrusterParticles) {
            const alpha = particle.life;
            const size = 5 * particle.life;
            ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    private drawShield(ctx: CanvasRenderingContext2D): void {
        if (this.shieldActive) {
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 10, 0, Math.PI * 2);
            ctx.stroke();

            const gradient = ctx.createRadialGradient(
                this.x + this.width / 2, this.y + this.height / 2, this.width / 2,
                this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 15
            );
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.restore();
        }
    }

    public takeDamage(amount: number): void {
        if (!this.invincible && !this.shieldActive) {
            this.health = Math.max(0, this.health - amount);
            this.eventEmitter.emit('healthChanged', this.health);
            this.invincible = true;
            this.lastHitTime = Date.now();
            if (this.health <= 0) {
                this.eventEmitter.emit('gameOver');
            }
        }
    }

    public activatePowerup(type: PowerUpType): void {
        const powerup = GAME_CONSTANTS.POWERUP.TYPES[type];
        powerup.effect(this);
        this.activePowerups.push({ type, startTime: Date.now() });
        this.eventEmitter.emit('powerUpActivated', type);

        setTimeout(() => this.deactivatePowerup(type), GAME_CONSTANTS.POWERUP.DURATION);
    }

    private deactivatePowerup(type: PowerUpType): void {
        this.activePowerups = this.activePowerups.filter(p => p.type !== type);
        switch (type) {
            case 'RAPID_FIRE':
                this.fireRate = GAME_CONSTANTS.PLAYER.FIRE_RATE;
                break;
            case 'TRIPLE_SHOT':
                this.bulletType = 'single';
                break;
            case 'SHIELD':
                this.shieldActive = false;
                break;
        }
        this.eventEmitter.emit('powerUpDeactivated', type);
    }

    public getHealth(): number {
        return this.health;
    }

    public setFireRate(rate: number): void {
        this.fireRate = rate;
    }

    public setBulletType(type: 'single' | 'triple'): void {
        this.bulletType = type;
    }

    public activateShield(): void {
        this.shieldActive = true;
    }

    public getPosition(): Vector2D {
        return { x: this.x, y: this.y };
    }
}

```


## ./src/objects/Aurora.ts

```ts
import { GAME_CONSTANTS } from "../utils/Constants";

export class Aurora {
    private curves: { offset: number; amplitude: number; speed: number }[];
    private colors: string[];

    constructor() {
        this.curves = Array(5).fill(null).map(() => ({
            offset: Math.random() * Math.PI * 2,
            amplitude: Math.random() * 40 + 20,
            speed: (Math.random() + 0.5) * 0.0005
        }));
        this.colors = [
            'rgba(0, 255, 100, 0.1)',
            'rgba(0, 200, 255, 0.1)',
            'rgba(100, 0, 255, 0.1)',
            'rgba(255, 100, 200, 0.1)',
            'rgba(255, 200, 0, 0.1)'
        ];
    }

    public update(deltaTime: number): void {
        this.curves.forEach(curve => {
            curve.offset += curve.speed * deltaTime;
        });
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        this.curves.forEach((curve, index) => {
            const gradient = ctx.createLinearGradient(0, 0, GAME_CONSTANTS.CANVAS.WIDTH, 0);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(0.5, this.colors[index]);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = gradient;

            const y = Math.sin(curve.offset) * curve.amplitude + GAME_CONSTANTS.CANVAS.HEIGHT / 3;
            ctx.beginPath();
            ctx.moveTo(0, y);

            for (let x = 0; x <= GAME_CONSTANTS.CANVAS.WIDTH; x += 5) {
                const relativeX = x / GAME_CONSTANTS.CANVAS.WIDTH;
                const yOffset = Math.sin(curve.offset + relativeX * Math.PI * 4) * curve.amplitude;
                ctx.lineTo(x, y + yOffset);
            }

            ctx.lineTo(GAME_CONSTANTS.CANVAS.WIDTH, GAME_CONSTANTS.CANVAS.HEIGHT);
            ctx.lineTo(0, GAME_CONSTANTS.CANVAS.HEIGHT);
            ctx.closePath();
            ctx.fill();
        });

        ctx.restore();
    }
}

```


## ./src/objects/Boss.ts

```ts
import { Game } from "../game/Game";
import { Vector2D } from "../types";
import { GAME_CONSTANTS } from "../utils/Constants";
import { BossBullet } from "./BossBullet";
import { GameObject } from "./GameObject";

export class Boss extends GameObject {
    private health: number;
    private moveDirection: number = 1;
    private lastFireTime: number = 0;
    private game: Game;

    constructor(game: Game) {
        super(
            GAME_CONSTANTS.CANVAS.WIDTH / 2 - GAME_CONSTANTS.BOSS.WIDTH / 2,
            -GAME_CONSTANTS.BOSS.HEIGHT,
            GAME_CONSTANTS.BOSS.WIDTH,
            GAME_CONSTANTS.BOSS.HEIGHT
        );
        this.health = game.getCurrentBossHealth();
        this.game = game;
    }

    public update(deltaTime: number): void {
        if (this.y < 50) {
            this.y += GAME_CONSTANTS.BOSS.INITIAL_SPEED * deltaTime;
        } else {
            const nextX = this.x + this.moveDirection * GAME_CONSTANTS.BOSS.MOVEMENT_SPEED * deltaTime;

            if (nextX <= 0) {
                this.x = 0;
                this.moveDirection = 1;
            } else if (nextX + this.width >= GAME_CONSTANTS.CANVAS.WIDTH) {
                this.x = GAME_CONSTANTS.CANVAS.WIDTH - this.width;
                this.moveDirection = -1;
            } else {
                this.x = nextX;
            }
        }

        const currentTime = Date.now();
        if (currentTime - this.lastFireTime > GAME_CONSTANTS.BOSS.FIRE_RATE) {
            this.shoot();
            this.lastFireTime = currentTime;
        }
    }

    private shoot(): void {
        const angleSpread = Math.PI / 8; // 角度の広がりを調整（小さくすると狭くなる）
        for (let i = -1; i <= 1; i++) {
            const angle = i * angleSpread;
            const speedX = Math.sin(angle) * GAME_CONSTANTS.BOSS.BULLET_SPEED;
            const speedY = Math.cos(angle) * GAME_CONSTANTS.BOSS.BULLET_SPEED;
            this.game.addBossBullet(new BossBullet(
                this.x + this.width / 2,
                this.y + this.height,
                speedX,
                speedY
            ));
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        // 本体の描画
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // 目の描画
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.3, this.y + this.height * 0.3, this.width * 0.1, 0, Math.PI * 2);
        ctx.arc(this.x + this.width * 0.7, this.y + this.height * 0.3, this.width * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.3, this.y + this.height * 0.3, this.width * 0.05, 0, Math.PI * 2);
        ctx.arc(this.x + this.width * 0.7, this.y + this.height * 0.3, this.width * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // 体力バーの描画
        const healthPercentage = this.health / GAME_CONSTANTS.BOSS.INITIAL_HEALTH;
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x, this.y - 20, this.width * healthPercentage, 10);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(this.x, this.y - 20, this.width, 10);
    }

    public takeDamage(): boolean {
        this.health--;
        return this.health <= 0;
    }

    public getPosition(): Vector2D {
        return { x: this.x, y: this.y };
    }
}

```


## ./src/objects/Star.ts

```ts
import { GAME_CONSTANTS } from "../utils/Constants";

export class Star {
    private x: number;
    private y: number;
    private size: number;
    private speed: number;
    private twinkleSpeed: number;
    private twinkleOffset: number;

    constructor() {
        this.x = Math.random() * GAME_CONSTANTS.CANVAS.WIDTH;
        this.y = Math.random() * GAME_CONSTANTS.CANVAS.HEIGHT;
        this.size = Math.random() * 2 + 1;
        this.speed = Math.random() * 10 + 5;
        this.twinkleSpeed = Math.random() * 0.05 + 0.01;
        this.twinkleOffset = Math.random() * Math.PI * 2;
    }

    public update(deltaTime: number): void {
        this.y += this.speed * deltaTime;
        if (this.y > GAME_CONSTANTS.CANVAS.HEIGHT) {
            this.y = 0;
            this.x = Math.random() * GAME_CONSTANTS.CANVAS.WIDTH;
        }
        this.twinkleOffset += this.twinkleSpeed;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        const twinkle = Math.sin(this.twinkleOffset) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + twinkle * 0.5})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * (0.8 + twinkle * 0.2), 0, Math.PI * 2);
        ctx.fill();
    }
}
```


## ./src/objects/BossBullet.ts

```ts
import { GAME_CONSTANTS } from "../utils/Constants";
import { GameObject } from "./GameObject";

export class BossBullet extends GameObject {
    private speedX: number;
    private speedY: number;

    constructor(x: number, y: number, speedX: number, speedY: number) {
        super(x, y, GAME_CONSTANTS.BULLET.WIDTH, GAME_CONSTANTS.BULLET.HEIGHT);
        this.speedX = speedX;
        this.speedY = speedY;
    }

    public update(deltaTime: number): void {
        this.x += this.speedX * deltaTime;
        this.y += this.speedY * deltaTime;
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    public isOnScreen(): boolean {
        return this.y < GAME_CONSTANTS.CANVAS.HEIGHT && this.y > 0 &&
            this.x < GAME_CONSTANTS.CANVAS.WIDTH && this.x > 0;
    }
}

```


## ./src/utils/MathUtils.ts

```ts
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

```


## ./src/utils/EventEmitter.ts

```ts
import { GameStateKey } from '../game/GameStateManager';
import { Bullet } from '../objects/Bullet';
import { Enemy } from '../objects/Enemy';
import { PowerUp } from '../objects/PowerUp';

export type EventMap = {
    'enemyDestroyed': (enemy: Enemy) => void;
    'playerShot': (bulltet: Bullet) => void;
    'playerDamaged': (damage: number) => void;
    'bossDamaged': () => void;
    'bossDefeated': () => void;
    'powerUpCollected': (powerUp: PowerUp) => void;
    'scoreUpdated': (newScore: number) => void;
    'levelCompleted': (level: number) => void;
    'healthChanged': (newHealth: number) => void;
    'powerUpActivated': (type: string) => void;
    'powerUpDeactivated': (type: string) => void;
    'gameStarted': () => void;
    'gamePaused': () => void;
    'gameResumed': () => void;
    'gameOver': () => void;
    'bossSpawned': () => void;
    'levelStarted': (level: number) => void;
    'levelUpdated': (level: number) => void;
    'stateChanged': (newState: GameStateKey) => void;
};

export class EventEmitter<EventMap extends Record<string, any>> {
    private listeners: Partial<{ [K in keyof EventMap]: ((data: EventMap[K]) => void)[] }> = {};

    on<K extends keyof EventMap>(event: K, listener: EventMap[K]): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event]!.push(listener as any);
    }

    emit<K extends keyof EventMap>(event: K, ...data: Parameters<EventMap[K]>): void {
        if (!this.listeners[event]) return;
        this.listeners[event]!.forEach(listener => {
            try {
                (listener as any)(...data);
            } catch (error) {
                console.error(`Error in listener for event ${String(event)}:`, error);
            }
        });
    }
}

```


## ./src/utils/Constants.ts

```ts
import { Player } from "../objects/Player";
import { GameConstants } from "../types";

export const GAME_CONSTANTS: GameConstants = {
    CANVAS: {
        WIDTH: 400,
        HEIGHT: 600
    },
    PLAYER: {
        WIDTH: 50,
        HEIGHT: 50,
        MAX_SPEED: 6,
        ACCELERATION: 0.8,
        DECELERATION: 0.3,
        MAX_HEALTH: 100,
        INVINCIBILITY_TIME: 1000,
        FIRE_RATE: 200,
        COLORS: {
            PRIMARY: '#1a237e', // 濃紺
            SECONDARY: '#3f51b5', // 紺碧
            ACCENT: '#00bcd4', // シアン
            ENGINE: '#ff9800', // オレンジ
        }
    },
    BULLET: {
        WIDTH: 5,
        HEIGHT: 15,
        SPEED: 600
    },
    ENEMY: {
        SPAWN_INTERVAL: 1000,
        TYPES: {
            SMALL: { width: 30, height: 30, speed: 180, health: 1, score: 10, color: '#ff00ff' },
            MEDIUM: { width: 50, height: 50, speed: 120, health: 2, score: 20, color: '#00ffff' },
            LARGE: { width: 70, height: 70, speed: 60, health: 3, score: 30, color: '#ffff00' }
        }
    },
    BOSS: {
        WIDTH: 150,
        HEIGHT: 150,
        BULLET_SPEED: 200,
        FIRE_RATE: 1000,
        INITIAL_HEALTH: 50,
        INITIAL_SPEED: 50,
        MOVEMENT_SPEED: 50
    },
    POWERUP: {
        WIDTH: 30,
        HEIGHT: 30,
        SPEED: 100,
        DURATION: 10000,
        SPAWN_CHANCE: 0.05,
        TYPES: {
            RAPID_FIRE: {
                color: '#00ff00',
                effect: (player: Player) => { player.setFireRate(GAME_CONSTANTS.PLAYER.FIRE_RATE / 2); }
            },
            TRIPLE_SHOT: {
                color: '#0000ff',
                effect: (player: Player) => { player.setBulletType('triple'); }
            },
            SHIELD: {
                color: '#ffff00',
                effect: (player: Player) => { player.activateShield(); }
            }
        }
    },
    EXPLOSION: {
        DURATION: 30
    },
    BACKGROUND: {
        STAR_COUNT: 100,
        PLANET_COUNT: 2,
        NEBULA_COUNT: 1
    }
};
```


## ./src/utils/HtmlUtils.ts

```ts
export function getElementOrThrow<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Element with id "${id}" not found`);
    }
    return element as T;
}

```


## ./src/game/Game.ts

```ts
import { GameObjectFactory } from "../factories/GameObjectFactory";
import { Aurora } from "../objects/Aurora";
import { Boss } from "../objects/Boss";
import { BossBullet } from "../objects/BossBullet";
import { Bullet } from "../objects/Bullet";
import { Enemy } from "../objects/Enemy";
import { Explosion } from "../objects/Explosion";
import { Nebula } from "../objects/Nebula";
import { Planet } from "../objects/Planet";
import { Player } from "../objects/Player";
import { PowerUp } from "../objects/PowerUp";
import { Star } from "../objects/Star";
import { EnemyType } from "../types";
import { GAME_CONSTANTS } from "../utils/Constants";
import { EventEmitter, EventMap } from "../utils/EventEmitter";
import { GameStateManager } from "./GameStateManager";
import { ScoreManager } from "./ScoreManager";

export class Game {
    private ctx: CanvasRenderingContext2D;
    private bullets: Bullet[] = [];
    private enemies: Enemy[] = [];
    private stars: Star[] = [];
    private explosions: Explosion[] = [];
    private planets: Planet[] = [];
    private nebulas: Nebula[] = [];
    private auroras: Aurora[] = [];
    private powerups: PowerUp[] = [];
    private boss: Boss | null = null;
    private bossBullets: BossBullet[] = [];
    private level = 1;
    private bossSpawnScore: number = 1000;
    private currentScore: number = 0;
    private lastTime = 0;
    private deltaTime = 0;
    private difficultyFactor: number = 0;
    private currentBossHealth: number = GAME_CONSTANTS.BOSS.INITIAL_HEALTH;
    private gameLoopId: number | null = null;

    constructor(
        private canvas: HTMLCanvasElement,
        private eventEmitter: EventEmitter<EventMap>,
        private scoreManager: ScoreManager,
        private player: Player,
        private gameObjectFactory: GameObjectFactory,
        private stateManager: GameStateManager
    ) {
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.canvas.width = GAME_CONSTANTS.CANVAS.WIDTH;
        this.canvas.height = GAME_CONSTANTS.CANVAS.HEIGHT;
        this.initializeGameObjects();
        this.setupEventListeners();
        this.stateManager.setState('STARTING', this);
    }

    private initializeGameObjects(): void {
        this.stars = Array.from({ length: GAME_CONSTANTS.BACKGROUND.STAR_COUNT }, () => this.gameObjectFactory.createStar());
        this.planets = Array.from({ length: GAME_CONSTANTS.BACKGROUND.PLANET_COUNT }, () => this.gameObjectFactory.createPlanet());
        this.nebulas = Array.from({ length: GAME_CONSTANTS.BACKGROUND.NEBULA_COUNT }, () => this.gameObjectFactory.createNebula());
        this.auroras = Array.from({ length: 2 }, () => this.gameObjectFactory.createAurora());
    }

    private setupEventListeners(): void {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.addEventListener('click', this.restartGame);
        }
        this.eventEmitter.on('enemyDestroyed', this.handleEnemyDestroyed);
        this.eventEmitter.on('playerShot', this.handlePlayerShot);
        this.eventEmitter.on('playerDamaged', this.handlePlayerDamaged);
        this.eventEmitter.on('bossDamaged', this.handleBossDamaged);
        this.eventEmitter.on('bossDefeated', this.handleBossDefeated);
        this.eventEmitter.on('powerUpCollected', this.handlePowerUpCollected);
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            this.handleInput(e.key);
        });
    }

    private handleKeyDown = (e: KeyboardEvent): void => {
        this.player.setKeyState(e.key, true);
    }

    private handleKeyUp = (e: KeyboardEvent): void => {
        this.player.setKeyState(e.key, false);
    }

    private handleEnemyDestroyed = (enemy: Enemy): void => {
        const enemyPosition = enemy.getPosition();
        const explosionPosition = {
            x: enemyPosition.x + enemy.getWidth() / 2,
            y: enemyPosition.y + enemy.getHeight() / 2
        };
        this.explosions.push(new Explosion(explosionPosition));
        this.scoreManager.addScore(enemy.getScore());
    }

    private handlePlayerShot = (bullet: Bullet): void => {
        this.bullets.push(bullet);
    }

    private handlePlayerDamaged = (damage: number): void => {
        this.player.takeDamage(damage);
        if (this.player.getHealth() <= 0) {
            this.gameOver();
        }
    }

    private handleBossDamaged = (): void => {
        if (this.boss && this.boss.takeDamage()) {
            this.eventEmitter.emit('bossDefeated');
        }
    }

    private handleBossDefeated = (): void => {
        if (this.boss) {
            this.explosions.push(new Explosion(this.boss.getPosition()));
            this.boss = null;
            this.handleBossDefeat();
        }
    }

    private handlePowerUpCollected = (powerUp: PowerUp): void => {
        this.player.activatePowerup(powerUp.getType());
    }

    public start(): void {
        this.eventEmitter.emit('gameStarted');
        this.gameLoop(0);
        setInterval(this.spawnEnemy, GAME_CONSTANTS.ENEMY.SPAWN_INTERVAL);
    }

    private gameLoop = (currentTime: number): void => {
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update();
        this.draw();

        this.gameLoopId = requestAnimationFrame(this.gameLoop);
    }

    private update(): void {
        this.stateManager.update(this);
    }

    public updateGameObjects(): void {
        this.player.update(this.deltaTime);
        this.bullets.forEach(bullet => bullet.update(this.deltaTime));
        this.enemies.forEach(enemy => enemy.update(this.deltaTime));
        this.powerups.forEach(powerup => powerup.update(this.deltaTime));
        this.explosions.forEach(explosion => explosion.update(this.deltaTime));
        this.stars.forEach(star => star.update(this.deltaTime));
        this.planets.forEach(planet => planet.update(this.deltaTime));
        this.auroras.forEach(aurora => aurora.update(this.deltaTime));
        this.bossBullets.forEach(bossBullet => bossBullet.update(this.deltaTime));

        if (this.boss) {
            this.boss.update(this.deltaTime);
        }

        this.currentScore = this.scoreManager.getScore();
        if (this.currentScore >= this.bossSpawnScore && !this.boss) {
            this.spawnBoss();
        }
    }

    private spawnBoss(): void {
        this.boss = new Boss(this);
        this.eventEmitter.emit('bossSpawned');
        this.showMessage("ボスが出現しました！");
    }

    public checkCollisions(): void {
        this.checkBulletEnemyCollisions();
        this.checkPlayerEnemyCollisions();
        this.checkPlayerPowerupCollisions();
        if (this.boss) {
            this.checkBossBattleCollisions();
        }
    }

    private checkBulletEnemyCollisions(): void {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                if (this.checkCollision(this.bullets[i], this.enemies[j])) {
                    this.bullets.splice(i, 1);
                    if (this.enemies[j].takeDamage()) {
                        this.eventEmitter.emit('enemyDestroyed', this.enemies[j])
                        this.enemies.splice(j, 1);
                    }
                    break;
                }
            }
        }
    }

    private checkPlayerEnemyCollisions(): void {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.checkCollision(this.player, this.enemies[i])) {
                this.eventEmitter.emit('playerDamaged', 20);
                this.eventEmitter.emit('enemyDestroyed', this.enemies[i]);
                this.enemies.splice(i, 1);
            }
        }
    }

    private checkPlayerPowerupCollisions(): void {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            if (this.checkCollision(this.player, this.powerups[i])) {
                this.eventEmitter.emit('powerUpCollected', this.powerups[i]);
                this.powerups.splice(i, 1);
            }
        }
    }

    private checkBossBattleCollisions(): void {
        if (this.boss && this.checkCollision(this.player, this.boss)) {
            this.eventEmitter.emit('playerDamaged', 20);
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            if (this.boss && this.checkCollision(this.bullets[i], this.boss)) {
                this.bullets.splice(i, 1);
                this.eventEmitter.emit('bossDamaged');
            }
        }

        for (let i = this.bossBullets.length - 1; i >= 0; i--) {
            if (this.checkCollision(this.player, this.bossBullets[i])) {
                this.eventEmitter.emit('playerDamaged', 20);
                this.bossBullets.splice(i, 1);
            }
        }
    }

    public removeOffscreenObjects(): void {
        this.bullets = this.bullets.filter(bullet => bullet.isOnScreen());
        this.enemies = this.enemies.filter(enemy => enemy.isOnScreen());
        this.powerups = this.powerups.filter(powerup => powerup.isOnScreen());
        this.explosions = this.explosions.filter(explosion => !explosion.isFinished());
        this.bossBullets = this.bossBullets.filter(bullet => bullet.isOnScreen());
    }

    private drawBackground(): void {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, GAME_CONSTANTS.CANVAS.HEIGHT);
        gradient.addColorStop(0, 'rgba(10, 10, 35, 1)');
        gradient.addColorStop(0.5, 'rgba(20, 20, 50, 1)');
        gradient.addColorStop(1, 'rgba(30, 30, 70, 1)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, GAME_CONSTANTS.CANVAS.WIDTH, GAME_CONSTANTS.CANVAS.HEIGHT);

        this.nebulas.forEach(nebula => nebula.draw(this.ctx));
        this.planets.forEach(planet => planet.draw(this.ctx));
        this.stars.forEach(star => star.draw(this.ctx));
        this.auroras.forEach(aurora => aurora.draw(this.ctx));
    }

    private draw(): void {
        this.drawBackground();
        this.player.draw(this.ctx);
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.powerups.forEach(powerup => powerup.draw(this.ctx));
        this.explosions.forEach(explosion => explosion.draw(this.ctx));
        if (this.boss) {
            this.boss.draw(this.ctx);
            this.bossBullets.forEach(bullet => bullet.draw(this.ctx));
        }
    }

    private spawnEnemy = (): void => {
        if (this.stateManager.isPlaying() && !this.boss) {
            const enemyTypes = Object.keys(GAME_CONSTANTS.ENEMY.TYPES) as EnemyType[];
            const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            this.enemies.push(this.gameObjectFactory.createEnemy(randomType, this));

            if (Math.random() < GAME_CONSTANTS.POWERUP.SPAWN_CHANCE) {
                this.powerups.push(this.gameObjectFactory.createPowerUp());
            }
        }
    }

    private checkCollision(obj1: { getX: () => number; getY: () => number; getWidth: () => number; getHeight: () => number }, obj2: { getX: () => number; getY: () => number; getWidth: () => number; getHeight: () => number }): boolean {
        return obj1.getX() < obj2.getX() + obj2.getWidth() &&
            obj1.getX() + obj1.getWidth() > obj2.getX() &&
            obj1.getY() < obj2.getY() + obj2.getHeight() &&
            obj1.getY() + obj1.getHeight() > obj2.getY();
    }

    public gameOver(): void {
        this.stateManager.setState('GAME_OVER', this);
    }

    private restartGame = (): void => {
        this.resetGame();
        this.stateManager.setState('PLAYING', this);
    }

    public resetGame(): void {
        this.player = new Player(this.eventEmitter);
        this.bullets = [];
        this.enemies = [];
        this.powerups = [];
        this.explosions = [];
        this.boss = null;
        this.bossBullets = [];
        this.level = 1;
        this.bossSpawnScore = 1000;
        this.scoreManager = new ScoreManager(this.eventEmitter);
        this.difficultyFactor = 0;
        this.currentBossHealth = GAME_CONSTANTS.BOSS.INITIAL_HEALTH;
    }

    private handleBossDefeat(): void {
        this.scoreManager.addScore(500);

        this.showMessage(`レベル ${this.level} クリア！次のレベルが始まります。`);

        this.level++;
        this.eventEmitter.emit('levelUpdated', this.level);

        setTimeout(() => {
            this.startNextLevel();
        }, 3000);
        this.bossSpawnScore = this.currentScore + 1000;
    }

    private startNextLevel(): void {
        this.enemies = [];
        this.bossBullets = [];
        this.powerups = [];

        this.difficultyFactor = this.level * 0.1;

        this.currentBossHealth = GAME_CONSTANTS.BOSS.INITIAL_HEALTH + (this.level - 1) * 10;

        this.bossSpawnScore = this.scoreManager.getScore() + 1000;

        this.eventEmitter.emit('levelStarted', this.level);
        this.showMessage(`レベル ${this.level} 開始！`);
    }

    public showMessage(text: string): void {
        const messageElement = document.createElement('div');
        messageElement.textContent = text;
        messageElement.style.position = 'absolute';
        messageElement.style.top = '50%';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translate(-50%, -50%)';
        messageElement.style.color = 'white';
        messageElement.style.fontSize = '24px';
        messageElement.style.textAlign = 'center';
        document.body.appendChild(messageElement);

        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, 3000);
    }

    public hideMessage(): void {
        // メッセージ要素を探して削除
        const messageElement = document.querySelector('div[style*="position: absolute"]');
        if (messageElement) {
            document.body.removeChild(messageElement);
        }
    }

    public addBossBullet(bullet: BossBullet): void {
        this.bossBullets.push(bullet);
    }

    public resumeGameLoop(): void {
        if (!this.gameLoopId) {
            this.gameLoop(0);
        }
    }

    public pauseGameLoop(): void {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }

    public showGameOverScreen(): void {
        const gameOverElement = document.getElementById('gameOver');
        if (gameOverElement) {
            gameOverElement.classList.remove('hidden');
        }
        const finalScoreElement = document.getElementById('finalScore');
        if (finalScoreElement) {
            finalScoreElement.textContent = this.scoreManager.getScore().toString();
        }
    }

    public hideGameOverScreen(): void {
        const gameOverElement = document.getElementById('gameOver');
        if (gameOverElement) {
            gameOverElement.classList.add('hidden');
        }
    }

    public getStateManager(): GameStateManager {
        return this.stateManager;
    }

    public handleInput(input: string): void {
        this.stateManager.handleInput(this, input);
    }

    public updateUI(): void {
        this.eventEmitter.emit('healthChanged', this.player.getHealth());
        this.eventEmitter.emit('levelUpdated', this.level);
        this.eventEmitter.emit('scoreUpdated', this.scoreManager.getScore());
    }

    public getDifficultyFactor(): number {
        return this.difficultyFactor;
    }

    public getCurrentBossHealth(): number {
        return this.currentBossHealth;
    }
}

```


## ./src/game/ScoreManager.ts

```ts
import { EventEmitter, EventMap } from "../utils/EventEmitter";

export class ScoreManager {
    private score: number = 0;

    constructor(
        private eventEmitter: EventEmitter<EventMap>
    ) { }

    getScore(): number {
        return this.score;
    }

    addScore(points: number): void {
        this.score += points;
        this.eventEmitter.emit('scoreUpdated', this.score)
    }
}

```


## ./src/game/GameStateManager.ts

```ts
import { Game } from "./Game";
import { EventEmitter, EventMap } from "../utils/EventEmitter";

export type GameStateKey = 'STARTING' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface GameState {
    enter(game: Game): void;
    update(game: Game): void;
    exit(game: Game): void;
    handleInput(game: Game, input: string): void;
}

class StartingState implements GameState {
    enter(game: Game): void {
        console.log("Entering Starting state");
        game.resetGame();
        game.showMessage("Press SPACE to start the game");
    }

    update(_game: Game): void {
        // Starting state doesn't need update logic
    }

    exit(game: Game): void {
        console.log("Exiting Starting state");
        game.hideMessage();
    }

    handleInput(game: Game, input: string): void {
        if (input === ' ') {
            game.getStateManager().setState('PLAYING', game);
        }
    }
}

class PlayingState implements GameState {
    enter(game: Game): void {
        console.log("Entering Playing state");
        game.resumeGameLoop();
    }

    update(game: Game): void {
        game.updateGameObjects();
        game.checkCollisions();
        game.removeOffscreenObjects();
        game.updateUI();
    }

    exit(_game: Game): void {
        console.log("Exiting Playing state");
    }

    handleInput(game: Game, input: string): void {
        if (input === 'Escape') {
            game.getStateManager().setState('PAUSED', game);
        }
    }
}

class PausedState implements GameState {
    enter(game: Game): void {
        console.log("Entering Paused state");
        game.pauseGameLoop();
        game.showMessage("Game Paused. Press SPACE to resume");
    }

    update(_game: Game): void {
        // Paused state doesn't need update logic
    }

    exit(game: Game): void {
        console.log("Exiting Paused state");
        game.hideMessage();
    }

    handleInput(game: Game, input: string): void {
        if (input === ' ') {
            game.getStateManager().setState('PLAYING', game);
        }
    }
}

class GameOverState implements GameState {
    enter(game: Game): void {
        console.log("Entering Game Over state");
        game.pauseGameLoop();
        game.showGameOverScreen();
    }

    update(_game: Game): void {
        // Game Over state doesn't need update logic
    }

    exit(game: Game): void {
        console.log("Exiting Game Over state");
        game.hideGameOverScreen();
    }

    handleInput(game: Game, input: string): void {
        if (input === 'r') {
            game.getStateManager().setState('STARTING', game);
        }
    }
}

export class GameStateManager {
    private currentState: GameState;
    private states: Record<GameStateKey, GameState>;

    constructor(private eventEmitter: EventEmitter<EventMap>) {
        this.states = {
            STARTING: new StartingState(),
            PLAYING: new PlayingState(),
            PAUSED: new PausedState(),
            GAME_OVER: new GameOverState()
        };
        this.currentState = this.states.STARTING;
    }

    setState(newState: GameStateKey, game: Game): void {
        this.currentState.exit(game);
        this.currentState = this.states[newState];
        this.currentState.enter(game);
        this.eventEmitter.emit('stateChanged', newState);
    }

    update(game: Game): void {
        this.currentState.update(game);
    }

    handleInput(game: Game, input: string): void {
        this.currentState.handleInput(game, input);
    }

    isPlaying(): boolean {
        return this.currentState === this.states.PLAYING;
    }

    getCurrentState(): GameStateKey {
        return Object.keys(this.states).find(
            key => this.states[key as GameStateKey] === this.currentState
        ) as GameStateKey;
    }
}

```


## ./src/vite-env.d.ts

```ts
/// <reference types="vite/client" />

```


## ./src/typescript.svg

```svg
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="32" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 256"><path fill="#007ACC" d="M0 128v128h256V0H0z"></path><path fill="#FFF" d="m56.612 128.85l-.081 10.483h33.32v94.68h23.568v-94.68h33.321v-10.28c0-5.69-.122-10.444-.284-10.566c-.122-.162-20.4-.244-44.983-.203l-44.74.122l-.121 10.443Zm149.955-10.742c6.501 1.625 11.459 4.51 16.01 9.224c2.357 2.52 5.851 7.111 6.136 8.208c.08.325-11.053 7.802-17.798 11.988c-.244.162-1.22-.894-2.317-2.52c-3.291-4.795-6.745-6.867-12.028-7.233c-7.76-.528-12.759 3.535-12.718 10.321c0 1.992.284 3.17 1.097 4.795c1.707 3.536 4.876 5.649 14.832 9.956c18.326 7.883 26.168 13.084 31.045 20.48c5.445 8.249 6.664 21.415 2.966 31.208c-4.063 10.646-14.14 17.879-28.323 20.276c-4.388.772-14.79.65-19.504-.203c-10.28-1.828-20.033-6.908-26.047-13.572c-2.357-2.6-6.949-9.387-6.664-9.874c.122-.163 1.178-.813 2.356-1.504c1.138-.65 5.446-3.129 9.509-5.485l7.355-4.267l1.544 2.276c2.154 3.29 6.867 7.801 9.712 9.305c8.167 4.307 19.383 3.698 24.909-1.26c2.357-2.153 3.332-4.388 3.332-7.68c0-2.966-.366-4.266-1.91-6.501c-1.99-2.845-6.054-5.242-17.595-10.24c-13.206-5.69-18.895-9.224-24.096-14.832c-3.007-3.25-5.852-8.452-7.03-12.8c-.975-3.617-1.22-12.678-.447-16.335c2.723-12.76 12.353-21.659 26.25-24.3c4.51-.853 14.994-.528 19.424.569Z"></path></svg>
```


## ./src/factories/GameObjectFactory.ts

```ts
import { Game } from "../game/Game";
import { Aurora } from "../objects/Aurora";
import { Enemy } from "../objects/Enemy";
import { Nebula } from "../objects/Nebula";
import { Planet } from "../objects/Planet";
import { PowerUp } from "../objects/PowerUp";
import { Star } from "../objects/Star";
import { EnemyType } from "../types";
import { GAME_CONSTANTS } from "../utils/Constants";
import { randomRange } from "../utils/MathUtils";

export class GameObjectFactory {
    createStar(): Star {
        return new Star();
    }

    createPlanet(): Planet {
        return new Planet();
    }

    createNebula(): Nebula {
        return new Nebula();
    }

    createAurora(): Aurora {
        return new Aurora();
    }

    createEnemy(type: EnemyType, game: Game): Enemy {
        const enemyData = GAME_CONSTANTS.ENEMY.TYPES[type];
        const x = randomRange(0, GAME_CONSTANTS.CANVAS.WIDTH - enemyData.width);
        return new Enemy(type, x, -enemyData.height, game);
    }

    createPowerUp(): PowerUp {
        const x = randomRange(0, GAME_CONSTANTS.CANVAS.WIDTH - GAME_CONSTANTS.POWERUP.WIDTH);
        return new PowerUp(x, -GAME_CONSTANTS.POWERUP.HEIGHT);
    }
}
```


## ./src/index.ts

```ts
import { GameObjectFactory } from './factories/GameObjectFactory';
import { Game } from './game/Game';
import { GameStateManager } from './game/GameStateManager';
import { ScoreManager } from './game/ScoreManager';
import { UIManager } from './managers/UIManager';
import { Player } from './objects/Player';
import { EventEmitter } from './utils/EventEmitter';
import { getElementOrThrow } from './utils/HtmlUtils';

function initGame(): void {
    const canvas = getElementOrThrow<HTMLCanvasElement>('gameCanvas');
    const eventEmitter = new EventEmitter();
    const player = new Player(eventEmitter);
    const gameObjectFactory = new GameObjectFactory();
    const scoreManager = new ScoreManager(eventEmitter);
    const stateManager = new GameStateManager(eventEmitter);

    const levelElement = getElementOrThrow<HTMLElement>('levelValue');
    const healthElement = getElementOrThrow<HTMLElement>('healthValue');
    const healthBarElement = getElementOrThrow<HTMLElement>('healthBarFill');
    const gameOverElement = getElementOrThrow<HTMLElement>('gameOver')
    const scoreElement = getElementOrThrow<HTMLElement>('scoreValue');
    new UIManager(eventEmitter, scoreElement, levelElement, healthElement, healthBarElement, gameOverElement);

    const game = new Game(
        canvas,
        eventEmitter,
        scoreManager,
        player,
        gameObjectFactory,
        stateManager
    );

    game.start();
}

document.addEventListener('DOMContentLoaded', initGame);

```


## ./src/interfaces/Updateable.ts

```ts
export interface Updateable {
    update(deltaTime: number): void;
}

```


## ./src/interfaces/Drawable.ts

```ts
export interface Drawable {
    draw(ctx: CanvasRenderingContext2D): void;
}

```

