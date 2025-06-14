import { EventEmitter } from '../../events/EventEmitter';
import { EventMap } from '../../events/EventType';
import { IRandomProvider } from '../../providers/IRandomProvider';
import { RealRandomProvider } from '../../providers/RealRandomProvider';
import { EnemyType, Vector2D } from '../../types';
import {
  EnemyGenerationRequest,
  DynamicEnemyConfig,
  DifficultyFactors,
} from '../types/EnemyGeneration';

import { EnemyGeneratorFactory } from './EnemyGeneratorFactory';

export class EnemyGenerationSystem {
  private factory: EnemyGeneratorFactory;
  private randomProvider: IRandomProvider;
  private eventEmitter: EventEmitter<EventMap>;
  private activeFlocks: Map<string, DynamicEnemyConfig[]> = new Map();
  private generationHistory: DynamicEnemyConfig[] = [];
  private maxHistorySize: number = 100;

  constructor(
    eventEmitter: EventEmitter<EventMap>,
    randomProvider?: IRandomProvider
  ) {
    this.eventEmitter = eventEmitter;
    this.randomProvider = randomProvider ?? new RealRandomProvider();
    this.factory = new EnemyGeneratorFactory(this.randomProvider);
  }

  /**
   * 単体の動的敵を生成
   */
  public generateEnemy(request: EnemyGenerationRequest): DynamicEnemyConfig {
    // 群れコンテキストを更新
    const updatedRequest = this.updateFlockingContext(request);

    // 敵を生成
    const enemy = this.factory.generateDynamicEnemy(updatedRequest);

    // 履歴に追加
    this.addToHistory(enemy);

    // 群れ管理を更新
    this.updateFlockManagement(enemy);

    // イベント発火
    this.eventEmitter.emit('dynamicEnemyGenerated', enemy);

    return enemy;
  }

  /**
   * 複数の敵を一括生成
   */
  public generateEnemyBatch(
    requests: EnemyGenerationRequest[]
  ): DynamicEnemyConfig[] {
    // 群れコンテキストを各リクエストに適用
    const updatedRequests = requests.map(request =>
      this.updateFlockingContext(request)
    );

    // バッチ生成
    const enemies = this.factory.generateEnemyBatch(updatedRequests);

    // 履歴と群れ管理を更新
    enemies.forEach(enemy => {
      this.addToHistory(enemy);
      this.updateFlockManagement(enemy);
    });

    // 統計情報をイベントで通知
    const stats = this.factory.getGenerationStats(enemies);
    this.eventEmitter.emit('enemyBatchGenerated', enemies, stats);

    return enemies;
  }

  /**
   * ウェーブ用の敵群を生成
   */
  public generateWaveEnemies(
    waveNumber: number,
    playerLevel: number,
    enemyTypes: Array<{
      type: EnemyType;
      count: number;
      positions?: Vector2D[];
    }>
  ): DynamicEnemyConfig[] {
    const difficultyFactors: DifficultyFactors = {
      playerLevel,
      currentWave: waveNumber,
      baseMultiplier: 1.0,
      levelScaling: 0.1,
      waveScaling: 0.05,
    };

    const allEnemies: DynamicEnemyConfig[] = [];

    enemyTypes.forEach(({ type, count, positions }) => {
      for (let i = 0; i < count; i++) {
        const position = positions?.[i] ?? this.generateRandomPosition();

        const request: EnemyGenerationRequest = {
          baseType: type,
          position,
          difficultyFactors,
          environmentalContext: this.getEnvironmentalContext(position),
          flockingContext: {
            existingFlocks: Array.from(this.activeFlocks.keys()),
            preferredFlockSize: this.calculatePreferredFlockSize(type),
          },
        };

        allEnemies.push(this.generateEnemy(request));
      }
    });

    return allEnemies;
  }

  /**
   * 環境に基づく敵生成
   */
  public generateEnvironmentalEnemies(
    environmentType: 'nebula' | 'planet' | 'asteroid_field',
    count: number,
    difficultyFactors: DifficultyFactors
  ): DynamicEnemyConfig[] {
    const enemies: DynamicEnemyConfig[] = [];

    for (let i = 0; i < count; i++) {
      const position = this.generateEnvironmentalPosition(environmentType);
      const enemyType = this.selectEnemyTypeForEnvironment(environmentType);

      const request: EnemyGenerationRequest = {
        baseType: enemyType,
        position,
        difficultyFactors,
        environmentalContext: {
          nearbyObjects: [environmentType],
          activeEffects: [],
        },
      };

      enemies.push(this.generateEnemy(request));
    }

    return enemies;
  }

  /**
   * 群れコンテキストを更新
   */
  private updateFlockingContext(
    request: EnemyGenerationRequest
  ): EnemyGenerationRequest {
    const existingFlocks = Array.from(this.activeFlocks.keys());
    const preferredFlockSize = this.calculatePreferredFlockSize(
      request.baseType
    );

    return {
      ...request,
      flockingContext: {
        existingFlocks,
        preferredFlockSize,
        ...request.flockingContext,
      },
    };
  }

  /**
   * 群れ管理を更新
   */
  private updateFlockManagement(enemy: DynamicEnemyConfig): void {
    if (enemy.flockId) {
      if (!this.activeFlocks.has(enemy.flockId)) {
        this.activeFlocks.set(enemy.flockId, []);
      }
      this.activeFlocks.get(enemy.flockId)!.push(enemy);
    }
  }

  /**
   * 履歴に追加
   */
  private addToHistory(enemy: DynamicEnemyConfig): void {
    this.generationHistory.push(enemy);

    // 履歴サイズを制限
    if (this.generationHistory.length > this.maxHistorySize) {
      this.generationHistory.shift();
    }
  }

  /**
   * ランダムな位置を生成
   */
  private generateRandomPosition(): Vector2D {
    return {
      x: this.randomProvider.randomRange(50, 350), // キャンバス幅を考慮
      y: this.randomProvider.randomRange(-150, -50),
    };
  }

  /**
   * 環境コンテキストを取得
   */
  private getEnvironmentalContext(position: Vector2D): {
    nearbyObjects: string[];
    activeEffects: string[];
  } {
    // 実際の実装では、背景オブジェクトとの距離を計算
    // ここでは簡略化
    const nearbyObjects: string[] = [];

    // 位置に基づいて近くのオブジェクトを判定（簡略化）
    if (position.x < 150) {
      nearbyObjects.push('nebula');
    }
    if (position.x > 250) {
      nearbyObjects.push('planet');
    }

    return {
      nearbyObjects,
      activeEffects: [],
    };
  }

  /**
   * 推奨群れサイズを計算
   */
  private calculatePreferredFlockSize(enemyType: EnemyType): number {
    switch (enemyType) {
      case 'SMALL':
        return this.randomProvider.randomInt(3, 5);
      case 'MEDIUM':
        return this.randomProvider.randomInt(2, 4);
      case 'LARGE':
        return this.randomProvider.randomInt(1, 3);
      default:
        return 3;
    }
  }

  /**
   * 環境に基づく位置生成
   */
  private generateEnvironmentalPosition(environmentType: string): Vector2D {
    // 環境タイプに基づいて適切な位置を生成
    switch (environmentType) {
      case 'nebula':
        return {
          x: this.randomProvider.randomRange(50, 200),
          y: this.randomProvider.randomRange(-100, -50),
        };
      case 'planet':
        return {
          x: this.randomProvider.randomRange(200, 350),
          y: this.randomProvider.randomRange(-100, -50),
        };
      default:
        return this.generateRandomPosition();
    }
  }

  /**
   * 環境に適した敵タイプを選択
   */
  private selectEnemyTypeForEnvironment(environmentType: string): EnemyType {
    switch (environmentType) {
      case 'nebula':
        // 星雲では小型・中型敵が多い
        return this.randomProvider.randomChoice([
          'SMALL',
          'MEDIUM',
        ] as EnemyType[]);
      case 'planet':
        // 惑星近くでは大型敵が多い
        return this.randomProvider.randomChoice([
          'MEDIUM',
          'LARGE',
        ] as EnemyType[]);
      default:
        return this.randomProvider.randomChoice([
          'SMALL',
          'MEDIUM',
          'LARGE',
        ] as EnemyType[]);
    }
  }

  /**
   * 群れを削除（敵が全滅した時など）
   */
  public removeFlockById(flockId: string): void {
    this.activeFlocks.delete(flockId);
    this.eventEmitter.emit('flockDestroyed', flockId);
  }

  /**
   * 群れから敵を削除
   */
  public removeEnemyFromFlock(flockId: string, enemyId: string): void {
    const flock = this.activeFlocks.get(flockId);
    if (flock) {
      const index = flock.findIndex(
        enemy => `${enemy.position.x}_${enemy.position.y}` === enemyId
      );
      if (index !== -1) {
        flock.splice(index, 1);

        // 群れが空になったら削除
        if (flock.length === 0) {
          this.removeFlockById(flockId);
        }
      }
    }
  }

  /**
   * アクティブな群れ情報を取得
   */
  public getActiveFlocks(): Map<string, DynamicEnemyConfig[]> {
    return new Map(this.activeFlocks);
  }

  /**
   * 生成統計を取得
   */
  public getGenerationStatistics(): {
    totalGenerated: number;
    recentGeneration: DynamicEnemyConfig[];
    typeDistribution: Record<EnemyType, number>;
    eliteRatio: number;
    averageDifficulty: number;
    activeFlockCount: number;
  } {
    const recent = this.generationHistory.slice(-20); // 最近20体
    const typeDistribution: Record<EnemyType, number> = {
      SMALL: 0,
      MEDIUM: 0,
      LARGE: 0,
    };

    let eliteCount = 0;
    let totalDifficulty = 0;

    this.generationHistory.forEach(enemy => {
      typeDistribution[enemy.baseType]++;
      if (enemy.isElite) eliteCount++;

      if (enemy.difficultyFactors) {
        const avgMultiplier =
          (enemy.difficultyFactors.playerLevel *
            enemy.difficultyFactors.levelScaling +
            enemy.difficultyFactors.currentWave *
              enemy.difficultyFactors.waveScaling) /
          2;
        totalDifficulty += avgMultiplier;
      }
    });

    return {
      totalGenerated: this.generationHistory.length,
      recentGeneration: recent,
      typeDistribution,
      eliteRatio:
        this.generationHistory.length > 0
          ? eliteCount / this.generationHistory.length
          : 0,
      averageDifficulty:
        this.generationHistory.length > 0
          ? totalDifficulty / this.generationHistory.length
          : 0,
      activeFlockCount: this.activeFlocks.size,
    };
  }

  /**
   * システムをリセット
   */
  public reset(): void {
    this.activeFlocks.clear();
    this.generationHistory = [];
    this.eventEmitter.emit('enemyGenerationSystemReset');
  }

  /**
   * デバッグ情報を取得
   */
  public getDebugInfo(): {
    systemStatus: string;
    activeFlocks: Array<{
      id: string;
      memberCount: number;
      leaderExists: boolean;
    }>;
    recentEnemies: Array<
      ReturnType<EnemyGeneratorFactory['getDetailedEnemyInfo']>
    >;
    statistics: ReturnType<EnemyGenerationSystem['getGenerationStatistics']>;
  } {
    const flockInfo = Array.from(this.activeFlocks.entries()).map(
      ([id, members]) => ({
        id,
        memberCount: members.length,
        leaderExists: members.some(member => !member.leaderId),
      })
    );

    const recentEnemies = this.generationHistory
      .slice(-5)
      .map(enemy => this.factory.getDetailedEnemyInfo(enemy));

    return {
      systemStatus: 'Active',
      activeFlocks: flockInfo,
      recentEnemies,
      statistics: this.getGenerationStatistics(),
    };
  }
}
