import { IGameEngine } from "../interfaces/IGameEngine";
import { Aurora } from "../entities/Aurora";
import { Enemy } from "../entities/Enemy";
import { DynamicEnemy } from "../entities/DynamicEnemy";
import { Nebula } from "../entities/Nebula";
import { Planet } from "../entities/Planet";
import { PowerUp } from "../entities/PowerUp";
import { Star } from "../entities/Star";
import { Comet } from "../entities/Comet";
import { MeteorShower } from "../entities/MeteorShower";
import { SpaceDust } from "../entities/SpaceDust";
import { EnemyType, Vector2D } from "../types";
import { GAME_CONSTANTS } from "../constants/GameConstants";
import { randomRange } from "../utils/RandomUtils";
import { IRandomProvider } from "../providers";
import { EnemyGenerationSystem } from "../systems/enemy-generation/EnemyGenerationSystem";
import { EnemyGenerationRequest, DynamicEnemyConfig, DifficultyFactors } from "../systems/types/EnemyGeneration";
import { EventEmitter } from "../events/EventEmitter";
import { EventMap } from "../events/EventType";

export class GameObjectFactory {
    private randomProvider: IRandomProvider;
    private enemyGenerationSystem?: EnemyGenerationSystem;
    private dynamicEnemyEnabled: boolean = false;

    constructor(randomProvider: IRandomProvider, eventEmitter?: EventEmitter<EventMap>) {
        this.randomProvider = randomProvider;
        
        // 動的敵生成システムの初期化（オプション）
        if (eventEmitter) {
            this.enemyGenerationSystem = new EnemyGenerationSystem(eventEmitter, randomProvider);
            this.dynamicEnemyEnabled = true;
        }
    }

    /**
     * 動的敵生成システムを有効/無効にする
     */
    public setDynamicEnemyEnabled(enabled: boolean): void {
        this.dynamicEnemyEnabled = enabled && !!this.enemyGenerationSystem;
    }

    /**
     * 動的敵生成システムが有効かどうかを確認
     */
    public isDynamicEnemyEnabled(): boolean {
        return this.dynamicEnemyEnabled && !!this.enemyGenerationSystem;
    }

    createStar(): Star {
        return new Star(this.randomProvider);
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

    createComet(): Comet {
        return new Comet(this.randomProvider);
    }

    createMeteorShower(): MeteorShower {
        return new MeteorShower(this.randomProvider);
    }

    createSpaceDust(): SpaceDust {
        return new SpaceDust(this.randomProvider);
    }

    createEnemy(type: EnemyType, game: IGameEngine): Enemy {
        const enemyData = GAME_CONSTANTS.ENEMY.TYPES[type];
        const x = randomRange(0, GAME_CONSTANTS.CANVAS.WIDTH - enemyData.width);
        return new Enemy(x, -enemyData.height, type, game);
    }

    createEnemyAtPosition(type: EnemyType, x: number, y: number, game: IGameEngine): Enemy {
        return new Enemy(x, y, type, game);
    }

    /**
     * 動的敵を生成（新機能）
     */
    createDynamicEnemy(
        type: EnemyType,
        game: IGameEngine,
        difficultyFactors?: DifficultyFactors,
        position?: Vector2D
    ): Enemy | DynamicEnemy {
        // 動的敵生成が無効の場合は従来の敵を生成
        if (!this.isDynamicEnemyEnabled()) {
            if (position) {
                return this.createEnemyAtPosition(type, position.x, position.y, game);
            } else {
                return this.createEnemy(type, game);
            }
        }

        // 動的敵生成リクエストを作成
        const enemyPosition = position || {
            x: randomRange(50, GAME_CONSTANTS.CANVAS.WIDTH - 50),
            y: randomRange(-150, -50)
        };

        const request: EnemyGenerationRequest = {
            baseType: type,
            position: enemyPosition,
            difficultyFactors: difficultyFactors || {
                playerLevel: 1,
                currentWave: 1,
                baseMultiplier: 1.0,
                levelScaling: 0.1,
                waveScaling: 0.05
            },
            environmentalContext: {
                nearbyObjects: [],
                activeEffects: []
            }
        };

        // 動的敵を生成
        const dynamicConfig = this.enemyGenerationSystem!.generateEnemy(request);
        return new DynamicEnemy(dynamicConfig, game);
    }

    /**
     * ウェーブ用の動的敵群を生成
     */
    createWaveEnemies(
        waveNumber: number,
        playerLevel: number,
        enemyTypes: Array<{ type: EnemyType; count: number; positions?: Vector2D[] }>,
        game: IGameEngine
    ): Array<Enemy | DynamicEnemy> {
        const enemies: Array<Enemy | DynamicEnemy> = [];

        // 動的敵生成が無効の場合は従来の方法で生成
        if (!this.isDynamicEnemyEnabled()) {
            enemyTypes.forEach(({ type, count, positions }) => {
                for (let i = 0; i < count; i++) {
                    const position = positions?.[i];
                    if (position) {
                        enemies.push(this.createEnemyAtPosition(type, position.x, position.y, game));
                    } else {
                        enemies.push(this.createEnemy(type, game));
                    }
                }
            });
            return enemies;
        }

        // 動的敵生成システムを使用
        const dynamicConfigs = this.enemyGenerationSystem!.generateWaveEnemies(
            waveNumber,
            playerLevel,
            enemyTypes
        );

        // DynamicEnemyインスタンスを作成
        dynamicConfigs.forEach(config => {
            enemies.push(new DynamicEnemy(config, game));
        });

        return enemies;
    }

    /**
     * 環境に基づく動的敵を生成
     */
    createEnvironmentalEnemies(
        environmentType: 'nebula' | 'planet' | 'asteroid_field',
        count: number,
        playerLevel: number,
        currentWave: number,
        game: IGameEngine
    ): Array<Enemy | DynamicEnemy> {
        const enemies: Array<Enemy | DynamicEnemy> = [];

        // 動的敵生成が無効の場合は従来の方法で生成
        if (!this.isDynamicEnemyEnabled()) {
            for (let i = 0; i < count; i++) {
                const randomType = this.randomProvider.randomChoice(['SMALL', 'MEDIUM', 'LARGE'] as EnemyType[]);
                enemies.push(this.createEnemy(randomType, game));
            }
            return enemies;
        }

        // 動的敵生成システムを使用
        const difficultyFactors: DifficultyFactors = {
            playerLevel,
            currentWave,
            baseMultiplier: 1.0,
            levelScaling: 0.1,
            waveScaling: 0.05
        };

        const dynamicConfigs = this.enemyGenerationSystem!.generateEnvironmentalEnemies(
            environmentType,
            count,
            difficultyFactors
        );

        // DynamicEnemyインスタンスを作成
        dynamicConfigs.forEach(config => {
            enemies.push(new DynamicEnemy(config, game));
        });

        return enemies;
    }

    createPowerUp(): PowerUp {
        const x = randomRange(0, GAME_CONSTANTS.CANVAS.WIDTH - GAME_CONSTANTS.POWERUP.WIDTH);
        return new PowerUp(x, -GAME_CONSTANTS.POWERUP.HEIGHT);
    }

    /**
     * 動的敵生成システムの統計情報を取得
     */
    public getDynamicEnemyStatistics() {
        if (!this.enemyGenerationSystem) {
            return null;
        }
        return this.enemyGenerationSystem.getGenerationStatistics();
    }

    /**
     * 動的敵生成システムをリセット
     */
    public resetDynamicEnemySystem(): void {
        if (this.enemyGenerationSystem) {
            this.enemyGenerationSystem.reset();
        }
    }

    /**
     * 群れを削除
     */
    public removeFlockById(flockId: string): void {
        if (this.enemyGenerationSystem) {
            this.enemyGenerationSystem.removeFlockById(flockId);
        }
    }

    /**
     * 群れから敵を削除
     */
    public removeEnemyFromFlock(flockId: string, enemyId: string): void {
        if (this.enemyGenerationSystem) {
            this.enemyGenerationSystem.removeEnemyFromFlock(flockId, enemyId);
        }
    }

    /**
     * デバッグ情報を取得
     */
    public getDebugInfo() {
        if (!this.enemyGenerationSystem) {
            return {
                dynamicEnemyEnabled: false,
                message: 'Dynamic enemy generation system not initialized'
            };
        }

        return {
            dynamicEnemyEnabled: this.dynamicEnemyEnabled,
            systemInfo: this.enemyGenerationSystem.getDebugInfo()
        };
    }

    /**
     * フォールバック機能：動的敵生成に失敗した場合の従来敵生成
     */
    private createFallbackEnemy(type: EnemyType, position: Vector2D, game: IGameEngine): Enemy {
        console.warn('Dynamic enemy generation failed, falling back to traditional enemy creation');
        return this.createEnemyAtPosition(type, position.x, position.y, game);
    }

    /**
     * 安全な動的敵生成（エラーハンドリング付き）
     */
    public createDynamicEnemySafe(
        type: EnemyType,
        game: IGameEngine,
        difficultyFactors?: DifficultyFactors,
        position?: Vector2D
    ): Enemy | DynamicEnemy {
        try {
            return this.createDynamicEnemy(type, game, difficultyFactors, position);
        } catch (error) {
            console.error('Error creating dynamic enemy:', error);
            
            // フォールバック：従来の敵生成
            const fallbackPosition = position || {
                x: randomRange(50, GAME_CONSTANTS.CANVAS.WIDTH - 50),
                y: randomRange(-150, -50)
            };
            
            return this.createFallbackEnemy(type, fallbackPosition, game);
        }
    }
}
