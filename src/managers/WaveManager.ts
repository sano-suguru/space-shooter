import { GAME_CONSTANTS } from "../constants/GameConstants";
import { EventEmitter } from "../events/EventEmitter";
import { EventMap } from "../events/EventType";
import { GameObjectFactory } from "../factories/GameObjectFactory";
import { FormationType, Vector2D, WaveConfig, WaveEnemyConfig } from "../types";
import { Game } from "../core/Game";

export class WaveManager {
    private currentWave: number = 0;
    private waveActive: boolean = false;
    private enemiesRemaining: number = 0;
    private spawnQueue: { enemy: WaveEnemyConfig; position: Vector2D; spawnTime: number }[] = [];
    private waveConfig: WaveConfig[] = [];

    constructor(
        private eventEmitter: EventEmitter<EventMap>,
        private gameObjectFactory: GameObjectFactory,
        private game: Game
    ) {
        this.initializeWaveConfigs();
        this.setupEventListeners();
    }

    private initializeWaveConfigs(): void {
        this.waveConfig = [
            // Wave 1: 小敵の基本フォーメーション
            {
                id: 1,
                name: "偵察隊",
                enemies: [
                    { type: 'SMALL', count: 5, formation: 'line', delay: 300 }
                ],
                bonusScore: 50,
                nextWaveDelay: 2000
            },
            // Wave 2: V字フォーメーション
            {
                id: 2,
                name: "V編隊",
                enemies: [
                    { type: 'SMALL', count: 7, formation: 'vformation', delay: 250 }
                ],
                bonusScore: 75,
                nextWaveDelay: 2500
            },
            // Wave 3: 混合フォーメーション
            {
                id: 3,
                name: "混合部隊",
                enemies: [
                    { type: 'SMALL', count: 4, formation: 'line', delay: 200 },
                    { type: 'MEDIUM', count: 2, formation: 'circle', delay: 400, offsetY: 80 }
                ],
                bonusScore: 100,
                nextWaveDelay: 3000
            },
            // Wave 4: ダイヤモンドフォーメーション
            {
                id: 4,
                name: "ダイヤモンド編隊",
                enemies: [
                    { type: 'MEDIUM', count: 5, formation: 'diamond', delay: 350 }
                ],
                bonusScore: 125,
                nextWaveDelay: 3000
            },
            // Wave 5: 大規模攻撃
            {
                id: 5,
                name: "大侵攻",
                enemies: [
                    { type: 'SMALL', count: 8, formation: 'arrow', delay: 150 },
                    { type: 'MEDIUM', count: 3, formation: 'line', delay: 300, offsetY: 60 },
                    { type: 'LARGE', count: 1, formation: 'circle', delay: 500, offsetY: 120 }
                ],
                bonusScore: 200,
                nextWaveDelay: 4000
            }
        ];
    }

    private setupEventListeners(): void {
        this.eventEmitter.on('enemyDestroyed', this.handleEnemyDestroyed);
    }

    private handleEnemyDestroyed = (): void => {
        if (this.waveActive) {
            this.enemiesRemaining--;
            if (this.enemiesRemaining <= 0 && this.spawnQueue.length === 0) {
                this.completeWave();
            }
        }
    };

    public startNextWave(): boolean {
        if (!GAME_CONSTANTS.WAVE.SYSTEM_ENABLED) {
            return false;
        }

        if (this.currentWave >= this.waveConfig.length) {
            // 最後のウェーブを超えた場合は、難易度を上げて繰り返し
            this.generateDynamicWave();
        } else {
            const wave = this.waveConfig[this.currentWave];
            this.prepareWave(wave);
        }

        this.currentWave++;
        this.waveActive = true;
        return true;
    }

    private prepareWave(waveConfig: WaveConfig): void {
        this.spawnQueue = [];
        this.enemiesRemaining = 0;

        let totalDelay = 0;

        waveConfig.enemies.forEach(enemyGroup => {
            const positions = this.generateFormation(
                enemyGroup.formation,
                enemyGroup.count,
                enemyGroup.offsetX || 0,
                enemyGroup.offsetY || 0
            );

            positions.forEach((position, index) => {
                this.spawnQueue.push({
                    enemy: enemyGroup,
                    position,
                    spawnTime: Date.now() + totalDelay + (index * enemyGroup.delay)
                });
                this.enemiesRemaining++;
            });

            totalDelay += enemyGroup.delay * enemyGroup.count + 500; // グループ間の間隔
        });

        this.eventEmitter.emit('waveStarted', waveConfig);
        this.game.showMessage(`Wave ${waveConfig.id}: ${waveConfig.name}`);
    }

    private generateFormation(type: FormationType, count: number, offsetX: number, offsetY: number): Vector2D[] {
        const positions: Vector2D[] = [];
        const spacing = GAME_CONSTANTS.WAVE.FORMATION_SPACING;
        const centerX = GAME_CONSTANTS.CANVAS.WIDTH / 2 + offsetX;
        const centerY = -50 - offsetY;

        switch (type) {
            case 'line':
                for (let i = 0; i < count; i++) {
                    positions.push({
                        x: centerX - ((count - 1) * spacing) / 2 + i * spacing,
                        y: centerY
                    });
                }
                break;

            case 'vformation':
                const halfCount = Math.floor(count / 2);
                for (let i = 0; i < count; i++) {
                    const distanceFromCenter = Math.abs(i - halfCount);
                    positions.push({
                        x: centerX - ((count - 1) * spacing) / 2 + i * spacing,
                        y: centerY - distanceFromCenter * 20
                    });
                }
                break;

            case 'circle':
                for (let i = 0; i < count; i++) {
                    const angle = (i / count) * Math.PI * 2;
                    const radius = spacing;
                    positions.push({
                        x: centerX + Math.cos(angle) * radius,
                        y: centerY + Math.sin(angle) * radius
                    });
                }
                break;

            case 'diamond':
                if (count === 1) {
                    positions.push({ x: centerX, y: centerY });
                } else if (count === 3) {
                    positions.push({ x: centerX, y: centerY - spacing });
                    positions.push({ x: centerX - spacing, y: centerY });
                    positions.push({ x: centerX + spacing, y: centerY });
                } else if (count === 5) {
                    positions.push({ x: centerX, y: centerY - spacing });
                    positions.push({ x: centerX - spacing, y: centerY });
                    positions.push({ x: centerX, y: centerY });
                    positions.push({ x: centerX + spacing, y: centerY });
                    positions.push({ x: centerX, y: centerY + spacing });
                }
                break;

            case 'arrow':
                for (let i = 0; i < count; i++) {
                    const row = Math.floor(i / 3);
                    const col = i % 3;
                    const rowWidth = Math.min(3, count - row * 3);
                    positions.push({
                        x: centerX - ((rowWidth - 1) * spacing) / 2 + col * spacing,
                        y: centerY - row * spacing
                    });
                }
                break;
        }

        return positions;
    }

    private generateDynamicWave(): void {
        const waveLevel = this.currentWave - this.waveConfig.length + 1;
        const difficulty = Math.min(waveLevel * 0.2, 2.0); // 最大2倍まで

        const dynamicWave: WaveConfig = {
            id: this.currentWave + 1,
            name: `猛攻 ${waveLevel}`,
            enemies: [
                {
                    type: 'SMALL',
                    count: Math.floor(6 + difficulty * 3),
                    formation: ['line', 'vformation', 'circle'][Math.floor(Math.random() * 3)] as FormationType,
                    delay: Math.max(100, 300 - difficulty * 50)
                },
                {
                    type: 'MEDIUM',
                    count: Math.floor(2 + difficulty),
                    formation: ['diamond', 'arrow'][Math.floor(Math.random() * 2)] as FormationType,
                    delay: Math.max(200, 400 - difficulty * 50),
                    offsetY: 80
                }
            ],
            bonusScore: Math.floor(150 + difficulty * 50),
            nextWaveDelay: 3000
        };

        if (waveLevel > 3) {
            dynamicWave.enemies.push({
                type: 'LARGE',
                count: Math.floor(1 + difficulty * 0.5),
                formation: 'circle',
                delay: Math.max(300, 500 - difficulty * 50),
                offsetY: 140
            });
        }

        this.prepareWave(dynamicWave);
    }

    public update(): void {
        if (!this.waveActive || this.spawnQueue.length === 0) return;

        const currentTime = Date.now();

        // スポーン待ちの敵をチェック
        for (let i = this.spawnQueue.length - 1; i >= 0; i--) {
            const spawnItem = this.spawnQueue[i];
            if (currentTime >= spawnItem.spawnTime) {
                this.spawnEnemy(spawnItem.enemy, spawnItem.position);
                this.spawnQueue.splice(i, 1);
            }
        }
    }

    private spawnEnemy(enemyConfig: WaveEnemyConfig, position: Vector2D): void {
        const enemy = this.gameObjectFactory.createEnemyAtPosition(
            enemyConfig.type,
            position.x,
            position.y,
            this.game
        );
        this.game.addEnemy(enemy);
    }

    private completeWave(): void {
        this.waveActive = false;
        const completedWave = this.waveConfig[this.currentWave - 1] || { bonusScore: 100, nextWaveDelay: 2000 };

        // ウェーブクリアボーナス
        const bonusScore = completedWave.bonusScore * GAME_CONSTANTS.WAVE.CLEAR_BONUS_MULTIPLIER;
        this.eventEmitter.emit('waveCompleted', this.currentWave, bonusScore);

        this.game.showMessage(`Wave ${this.currentWave} Complete! Bonus: ${bonusScore}`);

        // 次のウェーブまでの遅延
        setTimeout(() => {
            if (this.game.getStateManager().isPlaying()) {
                this.startNextWave();
            }
        }, completedWave.nextWaveDelay);
    }

    public isWaveActive(): boolean {
        return this.waveActive;
    }

    public getCurrentWave(): number {
        return this.currentWave;
    }

    public getEnemiesRemaining(): number {
        return this.enemiesRemaining + this.spawnQueue.length;
    }

    public reset(): void {
        this.currentWave = 0;
        this.waveActive = false;
        this.enemiesRemaining = 0;
        this.spawnQueue = [];
    }
}
