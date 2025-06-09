import { GAME_CONSTANTS } from "../constants/GameConstants";
import { EventEmitter } from "../events/EventEmitter";
import { EventMap } from "../events/EventType";
import { GameObjectFactory } from "../factories/GameObjectFactory";
import { FormationType, Vector2D, WaveConfig, WaveEnemyConfig } from "../types";
import { Game } from "../core/Game";
import { WaveConfiguration } from "../data/WaveConfiguration";

export class WaveManager {
    private currentWave: number = 0;
    private waveActive: boolean = false;
    private enemiesRemaining: number = 0;
    private spawnQueue: { enemy: WaveEnemyConfig; position: Vector2D; spawnTime: number }[] = [];

    constructor(
        private eventEmitter: EventEmitter<EventMap>,
        private gameObjectFactory: GameObjectFactory,
        private game: Game
    ) {
        this.setupEventListeners();
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

        this.currentWave++;
        
        // 定義済みウェーブの範囲内かチェック
        if (this.currentWave <= WaveConfiguration.getWaveCount()) {
            const wave = WaveConfiguration.getWaveConfig(this.currentWave);
            if (wave) {
                this.prepareWave(wave);
            }
        } else {
            // 動的ウェーブを生成
            const dynamicWave = WaveConfiguration.generateDynamicWave(this.currentWave);
            this.prepareWave(dynamicWave);
        }

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
        this.game.showWaveMessage(`Wave ${waveConfig.id}: ${waveConfig.name}`);
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
        
        // 現在のウェーブ設定を取得（動的ウェーブの場合は最低値を使用）
        let completedWave = WaveConfiguration.getWaveConfig(this.currentWave);
        if (!completedWave) {
            completedWave = { bonusScore: 100, nextWaveDelay: 2000 } as WaveConfig;
        }

        // ウェーブクリアボーナス
        const bonusScore = completedWave.bonusScore * GAME_CONSTANTS.WAVE.CLEAR_BONUS_MULTIPLIER;
        this.eventEmitter.emit('waveCompleted', this.currentWave, bonusScore);

        this.game.showWaveMessage(`Wave ${this.currentWave} Complete! Bonus: ${bonusScore}`);

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
