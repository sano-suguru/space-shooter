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
    "deploy": "gh-pages -d dist"
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
body {
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #000;
  font-family: Arial, sans-serif;
  color: #fff;
}

#game-container {
  position: relative;
}

#gameCanvas {
  border: 2px solid #4a4a4a;
  background-color: #000;
}

#ui-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 16px;
  color: #fff;
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
}

#score,
#level {
  margin-bottom: 5px;
}

#health {
  display: flex;
  align-items: center;
}

#healthBar {
  width: 100px;
  height: 10px;
  background-color: #333;
  margin-left: 10px;
  border-radius: 5px;
  overflow: hidden;
}

#healthBarFill {
  width: 100%;
  height: 100%;
  background-color: #0f0;
  transition: width 0.3s;
}

#gameOver {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  border: 2px solid #4a4a4a;
}

#restartButton {
  margin-top: 10px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: #4a4a4a;
  color: #fff;
  border: none;
  border-radius: 5px;
  transition: background-color 0.3s;
}

#restartButton:hover {
  background-color: #6a6a6a;
}

.hidden {
  display: none;
}
```


## ./src/managers/UIManager.ts

```ts
import { ScoreManager } from "../game/ScoreManager";
import { Observer } from "../interfaces/Observer";
import { Subject } from "../interfaces/Subject";
import { GAME_CONSTANTS } from "../utils/Constants";

export class UIManager implements Observer {
    private scoreElement: HTMLElement | null;
    private levelElement: HTMLElement | null;
    private healthElement: HTMLElement | null;
    private healthBarElement: HTMLElement | null;

    constructor() {
        this.scoreElement = document.getElementById('scoreValue');
        this.levelElement = document.getElementById('levelValue');
        this.healthElement = document.getElementById('healthValue');
        this.healthBarElement = document.getElementById('healthBarFill');
    }

    update(subject: Subject): void {
        if (subject instanceof ScoreManager) {
            this.updateScoreDisplay(subject.getScore());
        }
    }

    updateScoreDisplay(score: number): void {
        if (this.scoreElement) {
            this.scoreElement.textContent = score.toString();
        }
    }

    updateLevelDisplay(level: number): void {
        if (this.levelElement) {
            this.levelElement.textContent = level.toString();
        }
    }

    updateHealthDisplay(health: number): void {
        if (this.healthElement) {
            this.healthElement.textContent = health.toString();
        }
        if (this.healthBarElement) {
            const healthPercentage = (health / GAME_CONSTANTS.PLAYER.MAX_HEALTH) * 100;
            this.healthBarElement.style.width = `${healthPercentage}%`;
        }
    }
}
```


## ./src/managers/CollisionManager.ts

```ts
// import { Game } from "../game/Game";
// import { GameObject } from "../objects/GameObject";

// export class CollisionManager {
//     constructor(private game: Game) { }

//     checkCollisions(): void {
//         this.checkBulletEnemyCollisions();
//         this.checkPlayerEnemyCollisions();
//         this.checkPlayerPowerupCollisions();
//         if (this.game.boss) {
//             this.checkBossBattleCollisions();
//         }
//     }

//     private checkBulletEnemyCollisions(): void {
//         for (let i = this.game.bullets.length - 1; i >= 0; i--) {
//             for (let j = this.game.enemies.length - 1; j >= 0; j--) {
//                 if (this.checkCollision(this.game.bullets[i], this.game.enemies[j])) {
//                     this.game.bullets.splice(i, 1);
//                     if (this.game.enemies[j].takeDamage()) {
//                         this.game.addExplosion(this.game.enemies[j].getPosition());
//                         this.game.scoreManager.addScore(this.game.enemies[j].getScore());
//                         this.game.enemies.splice(j, 1);
//                     }
//                     break;
//                 }
//             }
//         }
//     }

//     private checkPlayerEnemyCollisions(): void {
//         for (let i = this.game.enemies.length - 1; i >= 0; i--) {
//             if (this.checkCollision(this.game.player, this.game.enemies[i])) {
//                 this.game.player.takeDamage(20);
//                 this.game.addExplosion(this.game.enemies[i].getPosition());
//                 this.game.enemies.splice(i, 1);
//             }
//         }
//     }

//     private checkPlayerPowerupCollisions(): void {
//         for (let i = this.game.powerups.length - 1; i >= 0; i--) {
//             if (this.checkCollision(this.game.player, this.game.powerups[i])) {
//                 this.game.player.activatePowerup(this.game.powerups[i].getType());
//                 this.game.powerups.splice(i, 1);
//             }
//         }
//     }

//     private checkBossBattleCollisions(): void {
//         if (this.game.boss && this.checkCollision(this.game.player, this.game.boss)) {
//             this.game.player.takeDamage(20);
//         }

//         for (let i = this.game.bullets.length - 1; i >= 0; i--) {
//             if (this.game.boss && this.checkCollision(this.game.bullets[i], this.game.boss)) {
//                 this.game.bullets.splice(i, 1);
//                 if (this.game.boss.takeDamage()) {
//                     this.game.addExplosion(this.game.boss.getPosition());
//                     this.game.boss = null;
//                     this.game.handleBossDefeat();
//                 }
//             }
//         }

//         for (let i = this.game.bossBullets.length - 1; i >= 0; i--) {
//             if (this.checkCollision(this.game.player, this.game.bossBullets[i])) {
//                 this.game.player.takeDamage(20);
//                 this.game.bossBullets.splice(i, 1);
//             }
//         }
//     }

//     private checkCollision(obj1: GameObject, obj2: GameObject): boolean {
//         return obj1.getX() < obj2.getX() + obj2.getWidth() &&
//             obj1.getX() + obj1.getWidth() > obj2.getX() &&
//             obj1.getY() < obj2.getY() + obj2.getHeight() &&
//             obj1.getY() + obj1.getHeight() > obj2.getY();
//     }
// }

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
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        // 外側の円
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();

        // 内側の色付き円
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // パワーアップタイプを示すシンボル
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
import { Game } from "../game/Game";
import { PowerUpType, Vector2D } from "../types";
import { GAME_CONSTANTS } from "../utils/Constants";
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

    constructor(private game: Game) {
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
        if (this.keys['ArrowLeft']) this.velocity.x -= GAME_CONSTANTS.PLAYER.ACCELERATION;
        if (this.keys['ArrowRight']) this.velocity.x += GAME_CONSTANTS.PLAYER.ACCELERATION;
        if (this.keys[' ']) this.shoot();
        this.move(deltaTime);
        this.updateInvincibility();
        this.updateEngineAnimation(deltaTime);
    }

    private move(deltaTime: number): void {
        if (this.keys['ArrowLeft']) this.velocity.x -= GAME_CONSTANTS.PLAYER.ACCELERATION;
        if (this.keys['ArrowRight']) this.velocity.x += GAME_CONSTANTS.PLAYER.ACCELERATION;

        this.velocity.x = Math.max(Math.min(this.velocity.x, GAME_CONSTANTS.PLAYER.MAX_SPEED), -GAME_CONSTANTS.PLAYER.MAX_SPEED);

        this.x += this.velocity.x * deltaTime;
        if (this.x < 0) {
            this.x = 0;
            this.velocity.x = 0;
        } else if (this.x + this.width > GAME_CONSTANTS.CANVAS.WIDTH) {
            this.x = GAME_CONSTANTS.CANVAS.WIDTH - this.width;
            this.velocity.x = 0;
        }

        // Apply deceleration
        if (Math.abs(this.velocity.x) > 0) {
            const deceleration = Math.sign(this.velocity.x) * -GAME_CONSTANTS.PLAYER.DECELERATION;
            this.velocity.x += deceleration;
            if (Math.abs(this.velocity.x) < GAME_CONSTANTS.PLAYER.DECELERATION) {
                this.velocity.x = 0;
            }
        }
    }

    private shoot(): void {
        const currentTime = Date.now();
        if (currentTime - this.lastFireTime >= this.fireRate) {
            if (this.bulletType === 'single') {
                this.game.addBullet(new Bullet(this.x + this.width / 2 - GAME_CONSTANTS.BULLET.WIDTH / 2, this.y));
            } else if (this.bulletType === 'triple') {
                this.game.addBullet(new Bullet(this.x + this.width / 2 - GAME_CONSTANTS.BULLET.WIDTH / 2, this.y));
                this.game.addBullet(new Bullet(this.x + this.width / 2 - GAME_CONSTANTS.BULLET.WIDTH / 2 - 20, this.y + 10));
                this.game.addBullet(new Bullet(this.x + this.width / 2 - GAME_CONSTANTS.BULLET.WIDTH / 2 + 20, this.y + 10));
            }
            this.lastFireTime = currentTime;
        }
    }

    public takeDamage(amount: number): void {
        if (!this.invincible && !this.shieldActive) {
            this.health = Math.max(0, this.health - amount);
            this.invincible = true;
            this.lastHitTime = Date.now();
            if (this.health <= 0) {
                this.game.gameOver();
            }
        }
    }

    private updateInvincibility(): void {
        if (this.invincible && Date.now() - this.lastHitTime > GAME_CONSTANTS.PLAYER.INVINCIBILITY_TIME) {
            this.invincible = false;
        }
    }

    private updateEngineAnimation(deltaTime: number): void {
        this.engineAnimationPhase += GAME_CONSTANTS.PLAYER.ACCELERATION * deltaTime;
        if (this.engineAnimationPhase > Math.PI * 2) {
            this.engineAnimationPhase = 0;
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        // 機体の描画
        ctx.fillStyle = this.invincible ? 'rgba(255, 0, 0, 0.5)' : '#00ff00';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // ウィングの描画
        ctx.fillStyle = '#0099ff';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height * 0.7);
        ctx.lineTo(this.x - this.width * 0.3, this.y + this.height);
        ctx.lineTo(this.x + this.width * 0.3, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.x + this.width, this.y + this.height * 0.7);
        ctx.lineTo(this.x + this.width - this.width * 0.3, this.y + this.height);
        ctx.lineTo(this.x + this.width + this.width * 0.3, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // エンジンの描画
        const engineGlowSize = 5 + Math.sin(this.engineAnimationPhase) * 2;
        const gradient = ctx.createRadialGradient(
            this.x + this.width / 2, this.y + this.height,
            0, this.x + this.width / 2, this.y + this.height, engineGlowSize
        );
        gradient.addColorStop(0, 'rgba(255, 255, 0, 1)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height, engineGlowSize, 0, Math.PI * 2);
        ctx.fill();

        // シールドの描画
        if (this.shieldActive) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 10, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    public activatePowerup(type: PowerUpType): void {
        const powerup = GAME_CONSTANTS.POWERUP.TYPES[type];
        powerup.effect(this);
        this.activePowerups.push({ type, startTime: Date.now() });

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
import { Enemy } from "../objects/Enemy";
import { PowerUp } from "../objects/PowerUp";

export type GameEventMap = {
    'enemyDestroyed': (enemy: Enemy) => void;
    'playerDamaged': (damage: number) => void;
    'bossDamaged': () => void;
    'bossDefeated': () => void;
    'powerUpCollected': (powerUp: PowerUp) => void;
    'scoreUpdated': (newScore: number) => void;
    'levelCompleted': (level: number) => void;
    // 他のイベントをここに追加
};

export type GameEventName = keyof GameEventMap;

export class EventEmitter<T extends Record<string, any> = GameEventMap> {
    private events: { [K in keyof T]?: T[K][] } = {};

    on<K extends keyof T>(eventName: K, callback: T[K]): void {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName]!.push(callback);
    }

    off<K extends keyof T>(eventName: K, callback: T[K]): void {
        if (!this.events[eventName]) return;
        this.events[eventName] = this.events[eventName]!.filter(cb => cb !== callback);
    }

    emit<K extends keyof T>(eventName: K, ...args: Parameters<T[K]>): void {
        if (!this.events[eventName]) return;
        this.events[eventName]!.forEach(callback => callback(...args));
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
        MAX_SPEED: 128,
        ACCELERATION: 3,
        DECELERATION: 2,
        MAX_HEALTH: 100,
        INVINCIBILITY_TIME: 1000,
        FIRE_RATE: 200
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


## ./src/game/Game.ts

```ts
import { GameObjectFactory } from "../factories/GameObjectFactory";
import { Updateable } from "../interfaces/Updateable";
import { UIManager } from "../managers/UIManager";
import { Boss } from "../objects/Boss";
import { BossBullet } from "../objects/BossBullet";
import { Bullet } from "../objects/Bullet";
import { Enemy } from "../objects/Enemy";
import { Explosion } from "../objects/Explosion";
import { GameObject } from "../objects/GameObject";
import { Nebula } from "../objects/Nebula";
import { Planet } from "../objects/Planet";
import { Player } from "../objects/Player";
import { PowerUp } from "../objects/PowerUp";
import { Star } from "../objects/Star";
import { EnemyType } from "../types";
import { GAME_CONSTANTS } from "../utils/Constants";
import { EventEmitter, GameEventMap } from "../utils/EventEmitter";
import { GameState, GameStateManager } from "./GameStateManager";
import { ScoreManager } from "./ScoreManager";

export class Game extends EventEmitter<GameEventMap> {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private player: Player;
    private bullets: Bullet[] = [];
    private enemies: Enemy[] = [];
    private stars: Star[] = [];
    private explosions: Explosion[] = [];
    private planets: Planet[] = [];
    private nebulas: Nebula[] = [];
    private powerups: PowerUp[] = [];
    private boss: Boss | null = null;
    private bossBullets: BossBullet[] = [];
    private level = 1;
    private bossSpawnScore: number = 1000;
    private currentScore: number = 0;
    private lastTime = 0;
    private deltaTime = 0;
    private stateManager: GameStateManager = new GameStateManager();
    private scoreManager: ScoreManager = new ScoreManager();
    private uiManager: UIManager = new UIManager();
    private difficultyFactor: number = 0;
    private currentBossHealth: number = GAME_CONSTANTS.BOSS.INITIAL_HEALTH;


    constructor() {
        super()
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.canvas.width = GAME_CONSTANTS.CANVAS.WIDTH;
        this.canvas.height = GAME_CONSTANTS.CANVAS.HEIGHT;

        this.player = new Player(this);
        this.initializeGameObjects();
        this.setupEventListeners();
        this.scoreManager.attach(this.uiManager);
        this.stateManager.setState(GameState.PLAYING);
    }



    private initializeGameObjects(): void {
        this.stars = Array.from({ length: GAME_CONSTANTS.BACKGROUND.STAR_COUNT }, () => new Star());
        this.planets = Array.from({ length: GAME_CONSTANTS.BACKGROUND.PLANET_COUNT }, () => new Planet());
        this.nebulas = Array.from({ length: GAME_CONSTANTS.BACKGROUND.NEBULA_COUNT }, () => new Nebula());
    }

    private setupEventListeners(): void {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.addEventListener('click', this.restartGame);
        }
        this.on('enemyDestroyed', this.handleEnemyDestroyed);
        this.on('playerDamaged', this.handlePlayerDamaged);
        this.on('bossDamaged', this.handleBossDamaged);
        this.on('bossDefeated', this.handleBossDefeated);
        this.on('powerUpCollected', this.handlePowerUpCollected);
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

    private handlePlayerDamaged = (damage: number): void => {
        this.player.takeDamage(damage);
        if (this.player.getHealth() <= 0) {
            this.gameOver();
        }
    }

    private handleBossDamaged = (): void => {
        if (this.boss && this.boss.takeDamage()) {
            this.emit('bossDefeated');
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
        this.gameLoop(0);
        setInterval(this.spawnEnemy, GAME_CONSTANTS.ENEMY.SPAWN_INTERVAL);
    }

    private gameLoop = (currentTime: number): void => {
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (this.stateManager.isPlaying()) {
            this.update();
            this.draw();
        }

        requestAnimationFrame(this.gameLoop);
    }

    private update(): void {
        this.player.update(this.deltaTime);
        this.updateGameObjects();
        this.checkCollisions();
        this.removeOffscreenObjects();
        this.uiManager.updateHealthDisplay(this.player.getHealth());
        this.uiManager.updateLevelDisplay(this.level);
    }

    private updateGameObjects(): void {
        const updateables: Updateable[] = [
            ...this.bullets,
            ...this.enemies,
            ...this.powerups,
            ...this.explosions,
            ...this.stars,
            ...this.planets,
            ...this.bossBullets
        ];

        if (this.boss) {
            updateables.push(this.boss);
        }

        updateables.forEach(obj => obj.update(this.deltaTime));

        this.currentScore = this.scoreManager.getScore();
        if (this.currentScore >= this.bossSpawnScore && !this.boss) {
            this.spawnBoss();
        }
    }

    private spawnBoss(): void {
        this.boss = new Boss(this);
        this.showMessage("ボスが出現しました！");
    }

    private checkCollisions(): void {
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
                        this.emit('enemyDestroyed', this.enemies[j])
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
                this.emit('playerDamaged', 20);
                this.emit('enemyDestroyed', this.enemies[i]);
                this.enemies.splice(i, 1);
            }
        }
    }

    private checkPlayerPowerupCollisions(): void {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            if (this.checkCollision(this.player, this.powerups[i])) {
                this.emit('powerUpCollected', this.powerups[i]);
                this.powerups.splice(i, 1);
            }
        }
    }

    private checkBossBattleCollisions(): void {
        if (this.boss && this.checkCollision(this.player, this.boss)) {
            this.emit('playerDamaged', 20);
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            if (this.boss && this.checkCollision(this.bullets[i], this.boss)) {
                this.bullets.splice(i, 1);
                this.emit('bossDamaged');
            }
        }

        for (let i = this.bossBullets.length - 1; i >= 0; i--) {
            if (this.checkCollision(this.player, this.bossBullets[i])) {
                this.emit('playerDamaged', 20);
                this.bossBullets.splice(i, 1);
            }
        }
    }

    private removeOffscreenObjects(): void {
        this.bullets = this.bullets.filter(bullet => bullet.isOnScreen());
        this.enemies = this.enemies.filter(enemy => enemy.isOnScreen());
        this.powerups = this.powerups.filter(powerup => powerup.isOnScreen());
        this.explosions = this.explosions.filter(explosion => !explosion.isFinished());
        this.bossBullets = this.bossBullets.filter(bullet => bullet.isOnScreen());
    }

    private drawBackground(): void {
        // Create a gradient for the background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, GAME_CONSTANTS.CANVAS.HEIGHT);
        gradient.addColorStop(0, '#000033');
        gradient.addColorStop(1, '#000066');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, GAME_CONSTANTS.CANVAS.WIDTH, GAME_CONSTANTS.CANVAS.HEIGHT);

        this.nebulas.forEach(nebula => nebula.draw(this.ctx));
        this.planets.forEach(planet => planet.draw(this.ctx));
        this.stars.forEach(star => star.draw(this.ctx));

        // 星座の線を描画
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(50, 50);
        this.ctx.lineTo(100, 100);
        this.ctx.lineTo(150, 75);
        this.ctx.lineTo(200, 150);
        this.ctx.stroke();
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
            this.enemies.push(GameObjectFactory.createEnemy(randomType, this));  // thisを追加

            if (Math.random() < GAME_CONSTANTS.POWERUP.SPAWN_CHANCE) {
                this.powerups.push(GameObjectFactory.createPowerUp());
            }
        }
    }

    private checkCollision(obj1: GameObject, obj2: GameObject): boolean {
        return obj1.getX() < obj2.getX() + obj2.getWidth() &&
            obj1.getX() + obj1.getWidth() > obj2.getX() &&
            obj1.getY() < obj2.getY() + obj2.getHeight() &&
            obj1.getY() + obj1.getHeight() > obj2.getY();
    }

    public gameOver(): void {
        this.stateManager.setState(GameState.GAME_OVER);
        const gameOverElement = document.getElementById('gameOver');
        if (gameOverElement) {
            gameOverElement.classList.remove('hidden');
        }
        const finalScoreElement = document.getElementById('finalScore');
        if (finalScoreElement) {
            finalScoreElement.textContent = this.scoreManager.getScore().toString();
        }
    }

    private restartGame = (): void => {
        const gameOverElement = document.getElementById('gameOver');
        if (gameOverElement) {
            gameOverElement.classList.add('hidden');
        }
        this.resetGame();
        this.start();
    }

    private resetGame(): void {
        this.player = new Player(this);
        this.bullets = [];
        this.enemies = [];
        this.powerups = [];
        this.explosions = [];
        this.boss = null;
        this.bossBullets = [];
        this.level = 1;
        this.bossSpawnScore = 1000;
        this.scoreManager = new ScoreManager();
        this.scoreManager.attach(this.uiManager);
        this.stateManager.setState(GameState.PLAYING);
    }

    private handleBossDefeat(): void {
        this.scoreManager.addScore(500);

        this.showMessage(`レベル ${this.level} クリア！次のレベルが始まります。`);

        this.level++;
        this.uiManager.updateLevelDisplay(this.level);

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

        this.showMessage(`レベル ${this.level} 開始！`);
    }

    private showMessage(text: string): void {
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

    public addBullet(bullet: Bullet): void {
        this.bullets.push(bullet);
    }

    public addBossBullet(bullet: BossBullet): void {
        this.bossBullets.push(bullet);
    }

    public pauseGame(): void {
        this.stateManager.setState(GameState.PAUSED);
    }

    public resumeGame(): void {
        this.stateManager.setState(GameState.PLAYING);
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
import { Observer } from "../interfaces/Observer";
import { Subject } from "../interfaces/Subject";

export class ScoreManager implements Subject {
    private observers: Observer[] = [];
    private score: number = 0;

    attach(observer: Observer): void {
        const isExist = this.observers.includes(observer);
        if (!isExist) {
            this.observers.push(observer);
        }
    }

    detach(observer: Observer): void {
        const observerIndex = this.observers.indexOf(observer);
        if (observerIndex !== -1) {
            this.observers.splice(observerIndex, 1);
        }
    }

    notify(): void {
        for (const observer of this.observers) {
            observer.update(this);
        }
    }

    getScore(): number {
        return this.score;
    }

    addScore(points: number): void {
        this.score += points;
        this.notify();
    }
}

```


## ./src/game/GameStateManager.ts

```ts
export class GameStateManager {
    private currentState: GameState = GameState.STARTING;

    setState(newState: GameState): void {
        this.currentState = newState;
    }

    getState(): GameState {
        return this.currentState;
    }

    isPlaying(): boolean {
        return this.currentState === GameState.PLAYING;
    }
}

export enum GameState {
    STARTING,
    PLAYING,
    PAUSED,
    GAME_OVER
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
import { Enemy } from "../objects/Enemy";
import { PowerUp } from "../objects/PowerUp";
import { EnemyType } from "../types";
import { GAME_CONSTANTS } from "../utils/Constants";
import { randomRange } from "../utils/MathUtils";

export class GameObjectFactory {
    static createEnemy(type: EnemyType, game: Game): Enemy {
        const enemyData = GAME_CONSTANTS.ENEMY.TYPES[type];
        const x = randomRange(0, GAME_CONSTANTS.CANVAS.WIDTH - enemyData.width);
        return new Enemy(type, x, -enemyData.height, game);
    }

    static createPowerUp(): PowerUp {
        const x = randomRange(0, GAME_CONSTANTS.CANVAS.WIDTH - GAME_CONSTANTS.POWERUP.WIDTH);
        return new PowerUp(x, -GAME_CONSTANTS.POWERUP.HEIGHT);
    }
}
```


## ./src/index.ts

```ts
import { Game } from './game/Game';

let game: Game;

function initGame(): void {
    game = new Game();
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


## ./src/interfaces/Subject.ts

```ts
import { Observer } from "./Observer";

export interface Subject {
    attach(observer: Observer): void;
    detach(observer: Observer): void;
    notify(): void;
}

```


## ./src/interfaces/Observer.ts

```ts
import { Subject } from "./Subject";

export interface Observer {
    update(subject: Subject): void;
}

```

