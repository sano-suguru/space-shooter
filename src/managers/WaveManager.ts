import { GameConfig, createGameConfig } from '../config/GameConfigFactory';
import { Game } from '../core/Game';
import { WaveConfiguration } from '../data/WaveConfiguration';
import { DynamicEnemy } from '../entities/DynamicEnemy';
import { Enemy } from '../entities/Enemy';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';
import { GameObjectFactory } from '../factories/GameObjectFactory';
import {
  FormationType,
  Vector2D,
  WaveConfig,
  WaveEnemyConfig,
  EnemyType,
} from '../types';

export class WaveManager {
  private currentWave: number = 0;
  private waveActive: boolean = false;
  private enemiesRemaining: number = 0;
  private spawnQueue: {
    enemy: WaveEnemyConfig;
    position: Vector2D;
    spawnTime: number;
  }[] = [];
  private useDynamicEnemies: boolean = false;
  private playerLevel: number = 1;

  constructor(
    private eventEmitter: EventEmitter<EventMap>,
    private gameObjectFactory: GameObjectFactory,
    private game: Game,
    private config: GameConfig = createGameConfig()
  ) {
    this.setupEventListeners();
    // 動的敵生成が利用可能かチェック
    this.useDynamicEnemies = this.gameObjectFactory.isDynamicEnemyEnabled();
  }

  /**
   * 動的敵生成の使用を設定
   */
  public setUseDynamicEnemies(enabled: boolean): void {
    this.useDynamicEnemies =
      enabled && this.gameObjectFactory.isDynamicEnemyEnabled();
  }

  /**
   * プレイヤーレベルを設定（難易度調整用）
   */
  public setPlayerLevel(level: number): void {
    this.playerLevel = level;
  }

  /**
   * 動的敵生成が有効かどうかを確認
   */
  public isDynamicEnemiesEnabled(): boolean {
    return this.useDynamicEnemies;
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
    if (!this.config.wave.systemEnabled) {
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
      const dynamicWave = WaveConfiguration.generateDynamicWave(
        this.currentWave
      );
      this.prepareWave(dynamicWave);
    }

    this.waveActive = true;
    return true;
  }

  private prepareWave(waveConfig: WaveConfig): void {
    this.spawnQueue = [];
    this.enemiesRemaining = 0;

    let totalDelay = 0;

    // 動的敵生成を使用する場合の特別な処理
    if (this.useDynamicEnemies) {
      this.prepareDynamicWave(waveConfig);
      return;
    }

    // 従来のウェーブ準備処理
    waveConfig.enemies.forEach(enemyGroup => {
      const positions = this.generateFormation(
        enemyGroup.formation,
        enemyGroup.count,
        enemyGroup.offsetX ?? 0,
        enemyGroup.offsetY ?? 0
      );

      positions.forEach((position, index) => {
        this.spawnQueue.push({
          enemy: enemyGroup,
          position,
          spawnTime: Date.now() + totalDelay + index * enemyGroup.delay,
        });
        this.enemiesRemaining++;
      });

      totalDelay += enemyGroup.delay * enemyGroup.count + 500; // グループ間の間隔
    });

    this.eventEmitter.emit('waveStarted', waveConfig);
    this.game.showWaveMessage(`Wave ${waveConfig.id}: ${waveConfig.name}`);
  }

  /**
   * 動的ウェーブの準備
   */
  private prepareDynamicWave(waveConfig: WaveConfig): void {
    let totalDelay = 0;

    // ウェーブ設定から敵タイプと数を抽出
    const enemyTypeData: Array<{
      type: EnemyType;
      count: number;
      positions?: Vector2D[];
    }> = [];

    waveConfig.enemies.forEach(enemyGroup => {
      const positions = this.generateFormation(
        enemyGroup.formation,
        enemyGroup.count,
        enemyGroup.offsetX ?? 0,
        enemyGroup.offsetY ?? 0
      );

      enemyTypeData.push({
        type: enemyGroup.type,
        count: enemyGroup.count,
        positions: positions,
      });

      // スポーンキューに追加（動的敵用の特別な処理）
      positions.forEach((position, index) => {
        this.spawnQueue.push({
          enemy: enemyGroup,
          position,
          spawnTime: Date.now() + totalDelay + index * enemyGroup.delay,
        });
        this.enemiesRemaining++;
      });

      totalDelay += enemyGroup.delay * enemyGroup.count + 500;
    });

    // 動的敵生成の統計情報をログ出力
    console.log(
      `Dynamic wave ${this.currentWave} prepared with ${enemyTypeData.length} enemy groups for player level ${this.playerLevel}`
    );

    this.eventEmitter.emit('waveStarted', waveConfig);

    const dynamicMessage = this.useDynamicEnemies ? ' (Dynamic)' : '';
    this.game.showWaveMessage(
      `Wave ${waveConfig.id}: ${waveConfig.name}${dynamicMessage}`
    );
  }

  private generateFormation(
    type: FormationType,
    count: number,
    offsetX: number,
    offsetY: number
  ): Vector2D[] {
    const positions: Vector2D[] = [];
    const spacing = this.config.wave.formationSpacing;
    const centerX = this.config.canvas.width / 2 + offsetX;
    const centerY = -50 - offsetY;

    switch (type) {
      case 'line':
        for (let i = 0; i < count; i++) {
          positions.push({
            x: centerX - ((count - 1) * spacing) / 2 + i * spacing,
            y: centerY,
          });
        }
        break;

      case 'vformation': {
        const halfCount = Math.floor(count / 2);
        for (let i = 0; i < count; i++) {
          const distanceFromCenter = Math.abs(i - halfCount);
          positions.push({
            x: centerX - ((count - 1) * spacing) / 2 + i * spacing,
            y: centerY - distanceFromCenter * 20,
          });
        }
        break;
      }

      case 'circle':
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const radius = spacing;
          positions.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
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
            y: centerY - row * spacing,
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
    let enemy: Enemy | DynamicEnemy;

    if (this.useDynamicEnemies) {
      // 動的敵生成を使用
      const difficultyFactors = {
        playerLevel: this.playerLevel,
        currentWave: this.currentWave,
        baseMultiplier: 1.0,
        levelScaling: 0.1,
        waveScaling: 0.05,
      };

      enemy = this.gameObjectFactory.createDynamicEnemySafe(
        enemyConfig.type,
        this.game,
        difficultyFactors,
        position
      );
    } else {
      // 従来の敵生成を使用
      enemy = this.gameObjectFactory.createEnemyAtPosition(
        enemyConfig.type,
        position.x,
        position.y,
        this.game
      );
    }

    this.game.addEnemy(enemy);

    // 動的敵の場合、追加情報をログ出力
    if (enemy instanceof DynamicEnemy && this.useDynamicEnemies) {
      const config = enemy.getDynamicConfig();
      console.log(
        `Dynamic enemy spawned: ${config.baseType}${config.isElite ? ' (Elite)' : ''} at wave ${this.currentWave}`
      );
    }
  }

  private completeWave(): void {
    this.waveActive = false;

    // 現在のウェーブ設定を取得（動的ウェーブの場合は最低値を使用）
    let completedWave = WaveConfiguration.getWaveConfig(this.currentWave);
    completedWave ??= { bonusScore: 100, nextWaveDelay: 2000 } as WaveConfig;

    // ウェーブクリアボーナス
    const bonusScore =
      completedWave.bonusScore * this.config.wave.clearBonusMultiplier;
    this.eventEmitter.emit('waveCompleted', this.currentWave, bonusScore);

    this.game.showWaveMessage(
      `Wave ${this.currentWave} Complete! Bonus: ${bonusScore}`
    );

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

    // 動的敵生成システムもリセット
    if (this.useDynamicEnemies) {
      this.gameObjectFactory.resetDynamicEnemySystem();
    }
  }

  /**
   * 動的敵生成の統計情報を取得
   */
  public getDynamicEnemyStatistics(): ReturnType<
    GameObjectFactory['getDynamicEnemyStatistics']
  > {
    if (!this.useDynamicEnemies) {
      return null;
    }
    return this.gameObjectFactory.getDynamicEnemyStatistics();
  }

  /**
   * WaveManagerの状態情報を取得
   */
  public getWaveManagerInfo(): {
    currentWave: number;
    waveActive: boolean;
    enemiesRemaining: number;
    spawnQueueLength: number;
    useDynamicEnemies: boolean;
    playerLevel: number;
    dynamicEnemyStats: ReturnType<WaveManager['getDynamicEnemyStatistics']>;
  } {
    return {
      currentWave: this.currentWave,
      waveActive: this.waveActive,
      enemiesRemaining: this.enemiesRemaining,
      spawnQueueLength: this.spawnQueue.length,
      useDynamicEnemies: this.useDynamicEnemies,
      playerLevel: this.playerLevel,
      dynamicEnemyStats: this.getDynamicEnemyStatistics(),
    };
  }

  /**
   * 環境敵を生成（背景オブジェクトとの相互作用用）
   */
  public spawnEnvironmentalEnemies(
    environmentType: 'nebula' | 'planet' | 'asteroid_field',
    count: number = 1
  ): void {
    if (!this.useDynamicEnemies) {
      // 従来の方法で環境敵を生成
      for (let i = 0; i < count; i++) {
        const randomType: EnemyType = ['SMALL', 'MEDIUM', 'LARGE'][
          Math.floor(Math.random() * 3)
        ] as EnemyType;
        const enemy = this.gameObjectFactory.createEnemy(randomType, this.game);
        this.game.addEnemy(enemy);
      }
      return;
    }

    // 動的環境敵を生成
    const enemies = this.gameObjectFactory.createEnvironmentalEnemies(
      environmentType,
      count,
      this.playerLevel,
      this.currentWave,
      this.game
    );

    enemies.forEach(enemy => {
      this.game.addEnemy(enemy);
    });

    console.log(
      `Spawned ${count} environmental enemies (${environmentType}) using dynamic generation`
    );
  }
}
