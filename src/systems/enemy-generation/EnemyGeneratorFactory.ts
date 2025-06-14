import {
  DynamicEnemyConfig,
  EnemyGenerationRequest,
} from '../types/EnemyGeneration';
import { AppearanceComponent } from './components/AppearanceComponent';
import { StatsComponent } from './components/StatsComponent';
import { BehaviorComponent } from './components/BehaviorComponent';
import { AttackAbilityComponent } from './components/AttackAbilityComponent';
import { DifficultyAdjustmentSystem } from './DifficultyAdjustmentSystem';
import { ENEMY_BASE_TEMPLATES } from '../../data/EnemyTemplates';
import { IRandomProvider } from '../../providers/IRandomProvider';
import { EnemyType } from '../../types';

export class EnemyGeneratorFactory {
  private appearanceComponent: AppearanceComponent;
  private statsComponent: StatsComponent;
  private behaviorComponent: BehaviorComponent;
  private attackComponent: AttackAbilityComponent;
  private difficultySystem: DifficultyAdjustmentSystem;
  private randomProvider: IRandomProvider;

  constructor(randomProvider: IRandomProvider) {
    this.randomProvider = randomProvider;
    this.appearanceComponent = new AppearanceComponent(randomProvider);
    this.statsComponent = new StatsComponent(randomProvider);
    this.behaviorComponent = new BehaviorComponent(randomProvider);
    this.attackComponent = new AttackAbilityComponent(randomProvider);
    this.difficultySystem = new DifficultyAdjustmentSystem(randomProvider);
  }

  /**
   * 動的敵設定を生成
   */
  public generateDynamicEnemy(
    request: EnemyGenerationRequest
  ): DynamicEnemyConfig {
    // 難易度修正値を計算
    const difficultyModifiers =
      this.difficultySystem.calculateSmoothDifficultyModifiers(
        request.difficultyFactors
      );

    // エリート敵かどうかを判定
    const isElite = this.randomProvider.randomChance(
      difficultyModifiers.eliteEnemyChance
    );

    // 基本設定を取得
    const baseTemplate = ENEMY_BASE_TEMPLATES[request.baseType];

    // 各コンポーネントを生成
    let appearance = this.appearanceComponent.generateRandomAppearance(
      baseTemplate.appearance
    );
    let stats = this.statsComponent.generateBaseStats(request.baseType);
    let behavior = this.behaviorComponent.generateRandomBehavior(
      request.baseType
    );
    let attack = this.attackComponent.generateRandomAttackAbility(
      request.baseType,
      request.difficultyFactors.playerLevel
    );

    // 難易度調整を適用
    stats = this.statsComponent.generateAdjustedStats(
      stats,
      request.difficultyFactors
    );

    // エリート敵の場合は強化
    if (isElite) {
      appearance = this.appearanceComponent.generateEliteAppearance(appearance);
      stats = this.statsComponent.generateEliteStats(stats);
      behavior = this.behaviorComponent.generateEliteBehavior(behavior);
      attack = this.attackComponent.generateEliteAttackAbility(attack);
    }

    // 環境効果を適用
    const environmentalEffects = this.generateEnvironmentalEffects(request);
    if (environmentalEffects.length > 0) {
      environmentalEffects.forEach(effect => {
        stats = this.statsComponent.applyEnvironmentalEffects(
          stats,
          effect.effectType,
          effect.intensity
        );
        behavior = this.behaviorComponent.adjustForEnvironment(
          behavior,
          effect.triggerZone
        );
      });
    }

    // 群れ行動の設定
    const flockInfo = this.generateFlockInfo(request, behavior);

    // 妥当性チェック
    stats = this.statsComponent.validateStats(stats);
    behavior = this.behaviorComponent.validateBehavior(behavior);
    attack = this.attackComponent.validateAttackAbility(attack);

    return {
      baseType: request.baseType,
      position: request.position,
      appearance,
      stats,
      behavior,
      attack,
      difficultyFactors: request.difficultyFactors,
      environmentalEffects,
      isElite,
      flockId: flockInfo.flockId,
      leaderId: flockInfo.leaderId,
    };
  }

  /**
   * バッチで複数の敵を生成
   */
  public generateEnemyBatch(
    requests: EnemyGenerationRequest[]
  ): DynamicEnemyConfig[] {
    const enemies: DynamicEnemyConfig[] = [];
    const flockGroups = new Map<string, DynamicEnemyConfig[]>();

    // 各敵を生成
    requests.forEach(request => {
      const enemy = this.generateDynamicEnemy(request);
      enemies.push(enemy);

      // 群れグループに追加
      if (enemy.flockId) {
        if (!flockGroups.has(enemy.flockId)) {
          flockGroups.set(enemy.flockId, []);
        }
        flockGroups.get(enemy.flockId)!.push(enemy);
      }
    });

    // 群れのリーダーを設定
    flockGroups.forEach((flockMembers, _flockId) => {
      if (flockMembers.length > 1) {
        this.assignFlockLeader(flockMembers);
      }
    });

    return enemies;
  }

  /**
   * 特定タイプの敵を大量生成
   */
  public generateEnemyWave(
    baseType: EnemyType,
    count: number,
    request: Omit<EnemyGenerationRequest, 'baseType' | 'position'>
  ): DynamicEnemyConfig[] {
    const enemies: DynamicEnemyConfig[] = [];

    for (let i = 0; i < count; i++) {
      // 位置をランダムに生成
      const position = {
        x: this.randomProvider.randomRange(50, 350), // キャンバス幅内
        y: this.randomProvider.randomRange(-100, -50), // 画面上部
      };

      const enemyRequest: EnemyGenerationRequest = {
        ...request,
        baseType,
        position,
      };

      enemies.push(this.generateDynamicEnemy(enemyRequest));
    }

    return enemies;
  }

  /**
   * 環境効果を生成
   */
  private generateEnvironmentalEffects(request: EnemyGenerationRequest) {
    const effects = [];

    if (request.environmentalContext?.activeEffects) {
      effects.push(...request.environmentalContext.activeEffects);
    }

    // 近くのオブジェクトに基づいて効果を追加
    if (request.environmentalContext?.nearbyObjects) {
      request.environmentalContext.nearbyObjects.forEach(objectType => {
        switch (objectType) {
          case 'nebula':
            if (this.randomProvider.randomChance(0.7)) {
              effects.push({
                triggerZone: 'nebula' as const,
                effectType: 'stealth' as const,
                intensity: this.randomProvider.randomRange(0.3, 0.8),
                duration: 5000,
              });
            }
            break;
          case 'planet':
            if (this.randomProvider.randomChance(0.6)) {
              effects.push({
                triggerZone: 'planet' as const,
                effectType: 'damage_boost' as const,
                intensity: this.randomProvider.randomRange(0.2, 0.6),
                duration: 3000,
              });
            }
            break;
        }
      });
    }

    return effects;
  }

  /**
   * 群れ情報を生成
   */
  private generateFlockInfo(
    request: EnemyGenerationRequest,
    behavior: { flockingTendency: number; [key: string]: any }
  ): { flockId?: string; leaderId?: string } {
    if (behavior.flockingTendency < 0.3) {
      return {}; // 群れ傾向が低い場合は単独行動
    }

    // 既存の群れに参加するかチェック
    if (
      request.flockingContext?.existingFlocks &&
      request.flockingContext.existingFlocks.length > 0
    ) {
      const joinChance = behavior.flockingTendency * 0.8;
      if (this.randomProvider.randomChance(joinChance)) {
        const flockId = this.randomProvider.randomChoice(
          request.flockingContext.existingFlocks
        );
        return { flockId };
      }
    }

    // 新しい群れを作成
    const flockId = `flock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { flockId };
  }

  /**
   * 群れのリーダーを指定
   */
  private assignFlockLeader(flockMembers: DynamicEnemyConfig[]): void {
    // エリート敵がいる場合は優先的にリーダーに
    let leader = flockMembers.find(enemy => enemy.isElite);

    // エリート敵がいない場合は最も強い敵をリーダーに
    if (!leader) {
      leader = flockMembers.reduce((strongest, current) => {
        const strongestPower = this.statsComponent.calculateOverallPower(
          strongest.stats
        );
        const currentPower = this.statsComponent.calculateOverallPower(
          current.stats
        );
        return currentPower > strongestPower ? current : strongest;
      });
    }

    // リーダーの行動を調整
    leader.behavior = this.behaviorComponent.generateLeaderBehavior(
      leader.behavior
    );

    // 他のメンバーをフォロワーに設定
    flockMembers.forEach(member => {
      if (member !== leader) {
        member.leaderId = `${leader.position.x}_${leader.position.y}_${Date.now()}`;
        member.behavior = this.behaviorComponent.generateFollowerBehavior(
          member.behavior
        );
      }
    });
  }

  /**
   * 敵生成の統計情報を取得
   */
  public getGenerationStats(enemies: DynamicEnemyConfig[]): {
    totalCount: number;
    typeDistribution: Record<EnemyType, number>;
    eliteCount: number;
    averagePower: number;
    flockCount: number;
    specialAbilityCount: number;
    difficultyLevel: string;
  } {
    const typeDistribution: Record<EnemyType, number> = {
      SMALL: 0,
      MEDIUM: 0,
      LARGE: 0,
    };

    let eliteCount = 0;
    let totalPower = 0;
    let specialAbilityCount = 0;
    const flockIds = new Set<string>();

    enemies.forEach(enemy => {
      typeDistribution[enemy.baseType]++;
      if (enemy.isElite) eliteCount++;
      totalPower += this.statsComponent.calculateOverallPower(enemy.stats);
      if (enemy.attack.specialEffects.length > 0) specialAbilityCount++;
      if (enemy.flockId) flockIds.add(enemy.flockId);
    });

    const averagePower = enemies.length > 0 ? totalPower / enemies.length : 0;

    // 平均的な難易度修正値を計算
    const sampleDifficulty =
      enemies.length > 0
        ? this.difficultySystem.calculateSmoothDifficultyModifiers(
            enemies[0].difficultyFactors!
          )
        : {
            healthMultiplier: 1,
            speedMultiplier: 1,
            attackMultiplier: 1,
            specialAbilityChance: 0,
            eliteEnemyChance: 0,
          };

    const difficultyLevel =
      this.difficultySystem.getDifficultyLevel(sampleDifficulty);

    return {
      totalCount: enemies.length,
      typeDistribution,
      eliteCount,
      averagePower: Math.round(averagePower),
      flockCount: flockIds.size,
      specialAbilityCount,
      difficultyLevel,
    };
  }

  /**
   * デバッグ用の詳細情報を取得
   */
  public getDetailedEnemyInfo(enemy: DynamicEnemyConfig): {
    basicInfo: {
      type: EnemyType;
      isElite: boolean;
      position: { x: number; y: number };
    };
    appearance: string;
    stats: ReturnType<StatsComponent['getStatsInfo']>;
    behavior: string;
    attack: ReturnType<AttackAbilityComponent['getAttackInfo']>;
    flockInfo: {
      flockId?: string;
      leaderId?: string;
      isLeader: boolean;
    };
    environmentalEffects: number;
  } {
    return {
      basicInfo: {
        type: enemy.baseType,
        isElite: enemy.isElite || false,
        position: enemy.position,
      },
      appearance: `${enemy.appearance.baseShape} (${enemy.appearance.primaryColor})`,
      stats: this.statsComponent.getStatsInfo(enemy.stats),
      behavior: this.behaviorComponent.getBehaviorDescription(enemy.behavior),
      attack: this.attackComponent.getAttackInfo(
        enemy.attack,
        enemy.stats.attackPower
      ),
      flockInfo: {
        flockId: enemy.flockId,
        leaderId: enemy.leaderId,
        isLeader: !!enemy.flockId && !enemy.leaderId,
      },
      environmentalEffects: enemy.environmentalEffects?.length || 0,
    };
  }
}
