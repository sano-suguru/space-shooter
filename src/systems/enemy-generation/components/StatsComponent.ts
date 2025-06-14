import {
  ENEMY_BASE_TEMPLATES,
  VARIATION_RANGES,
  ELITE_MODIFIERS,
} from '../../../data/EnemyTemplates';
import { IRandomProvider } from '../../../providers/IRandomProvider';
import { EnemyType } from '../../../types';
import {
  EnemyStats,
  DifficultyFactors,
  DifficultyModifiers,
} from '../../types/EnemyGeneration';

export class StatsComponent {
  private randomProvider: IRandomProvider;

  constructor(randomProvider: IRandomProvider) {
    this.randomProvider = randomProvider;
  }

  /**
   * 基本能力値を生成
   */
  public generateBaseStats(enemyType: EnemyType): EnemyStats {
    const template = ENEMY_BASE_TEMPLATES[enemyType];
    const baseStats = template.stats;

    return {
      health: this.applyVariation(
        baseStats.health,
        VARIATION_RANGES.stats.health
      ),
      speed: this.applyVariation(baseStats.speed, VARIATION_RANGES.stats.speed),
      attackPower: this.applyVariation(
        baseStats.attackPower,
        VARIATION_RANGES.stats.attackPower
      ),
      defense: this.applyVariation(
        baseStats.defense,
        VARIATION_RANGES.stats.defense
      ),
      fireRate: this.applyVariation(
        baseStats.fireRate,
        VARIATION_RANGES.stats.fireRate
      ),
      accuracy: this.applyVariation(
        baseStats.accuracy,
        VARIATION_RANGES.stats.accuracy
      ),
      experienceReward: this.applyVariation(
        baseStats.experienceReward,
        VARIATION_RANGES.stats.experienceReward
      ),
      scoreValue: this.applyVariation(
        baseStats.scoreValue,
        VARIATION_RANGES.stats.scoreValue
      ),
    };
  }

  /**
   * 難易度調整を適用した能力値を生成
   */
  public generateAdjustedStats(
    baseStats: EnemyStats,
    difficultyFactors: DifficultyFactors
  ): EnemyStats {
    const modifiers = this.calculateDifficultyModifiers(difficultyFactors);

    return {
      health: Math.round(baseStats.health * modifiers.healthMultiplier),
      speed: Math.round(baseStats.speed * modifiers.speedMultiplier),
      attackPower: Math.round(
        baseStats.attackPower * modifiers.attackMultiplier
      ),
      defense: Math.round(baseStats.defense * modifiers.healthMultiplier * 0.5), // 防御力は体力の半分の倍率
      fireRate: Math.round(baseStats.fireRate / modifiers.attackMultiplier), // 攻撃力が上がると発射間隔が短くなる
      accuracy: Math.min(
        0.95,
        baseStats.accuracy * (1 + (modifiers.attackMultiplier - 1) * 0.3)
      ), // 精度も少し向上
      experienceReward: Math.round(
        baseStats.experienceReward * modifiers.healthMultiplier
      ),
      scoreValue: Math.round(baseStats.scoreValue * modifiers.healthMultiplier),
    };
  }

  /**
   * エリート敵の能力値を生成
   */
  public generateEliteStats(baseStats: EnemyStats): EnemyStats {
    const modifiers = ELITE_MODIFIERS.stats;

    return {
      health: Math.round(baseStats.health * modifiers.healthMultiplier),
      speed: Math.round(baseStats.speed * modifiers.speedMultiplier),
      attackPower: Math.round(
        baseStats.attackPower * modifiers.attackMultiplier
      ),
      defense: Math.round(baseStats.defense * modifiers.defenseMultiplier),
      fireRate: Math.round(baseStats.fireRate * 0.7), // エリートは攻撃が早い
      accuracy: Math.min(0.98, baseStats.accuracy * 1.2), // エリートは精度が高い
      experienceReward: Math.round(
        baseStats.experienceReward * modifiers.experienceMultiplier
      ),
      scoreValue: Math.round(baseStats.scoreValue * modifiers.scoreMultiplier),
    };
  }

  /**
   * 環境効果を適用した能力値を生成
   */
  public applyEnvironmentalEffects(
    baseStats: EnemyStats,
    effectType: 'speed_boost' | 'damage_boost' | 'shield_regen' | 'stealth',
    intensity: number
  ): EnemyStats {
    const modifiedStats = { ...baseStats };

    switch (effectType) {
      case 'speed_boost':
        modifiedStats.speed = Math.round(
          baseStats.speed * (1 + intensity * 0.2)
        );
        break;
      case 'damage_boost':
        modifiedStats.attackPower = Math.round(
          baseStats.attackPower * (1 + intensity * 0.15)
        );
        break;
      case 'shield_regen':
        modifiedStats.defense = Math.round(
          baseStats.defense * (1 + intensity * 0.1)
        );
        modifiedStats.health = Math.round(
          baseStats.health * (1 + intensity * 0.05)
        );
        break;
      case 'stealth':
        // ステルス効果は視覚的なもので、能力値には直接影響しない
        // ただし、少し速度を上げて回避能力を向上
        modifiedStats.speed = Math.round(
          baseStats.speed * (1 + intensity * 0.1)
        );
        break;
    }

    return modifiedStats;
  }

  /**
   * 難易度修正値を計算
   */
  private calculateDifficultyModifiers(
    factors: DifficultyFactors
  ): DifficultyModifiers {
    // 基本倍率の計算
    const baseMultiplier =
      factors.baseMultiplier +
      factors.playerLevel * factors.levelScaling +
      factors.currentWave * factors.waveScaling;

    // ランダム要素を追加（±20%の変動）
    const randomVariation = this.randomProvider.randomRange(0.8, 1.2);
    const adjustedMultiplier = baseMultiplier * randomVariation;

    return {
      healthMultiplier: Math.max(
        1.0,
        adjustedMultiplier * this.randomProvider.randomRange(0.9, 1.3)
      ),
      speedMultiplier: Math.max(
        0.5,
        adjustedMultiplier * this.randomProvider.randomRange(0.8, 1.4)
      ),
      attackMultiplier: Math.max(
        1.0,
        adjustedMultiplier * this.randomProvider.randomRange(0.9, 1.2)
      ),
      specialAbilityChance: Math.min(0.3, 0.1 + factors.playerLevel * 0.02),
      eliteEnemyChance: Math.min(0.2, 0.05 + factors.currentWave * 0.01),
    };
  }

  /**
   * 能力値に変動を適用
   */
  private applyVariation(
    baseValue: number,
    range: { min: number; max: number }
  ): number {
    const multiplier = this.randomProvider.randomRange(range.min, range.max);
    return Math.round(baseValue * multiplier);
  }

  /**
   * 能力値の妥当性をチェック
   */
  public validateStats(stats: EnemyStats): EnemyStats {
    return {
      health: Math.max(1, stats.health),
      speed: Math.max(10, Math.min(500, stats.speed)),
      attackPower: Math.max(1, stats.attackPower),
      defense: Math.max(0, stats.defense),
      fireRate: Math.max(100, Math.min(5000, stats.fireRate)),
      accuracy: Math.max(0.1, Math.min(0.98, stats.accuracy)),
      experienceReward: Math.max(1, stats.experienceReward),
      scoreValue: Math.max(1, stats.scoreValue),
    };
  }

  /**
   * 能力値の比較（デバッグ用）
   */
  public compareStats(
    stats1: EnemyStats,
    stats2: EnemyStats
  ): {
    healthRatio: number;
    speedRatio: number;
    attackRatio: number;
    defenseRatio: number;
    overallPowerRatio: number;
  } {
    return {
      healthRatio: stats1.health / stats2.health,
      speedRatio: stats1.speed / stats2.speed,
      attackRatio: stats1.attackPower / stats2.attackPower,
      defenseRatio: (stats1.defense + 1) / (stats2.defense + 1), // ゼロ除算を避ける
      overallPowerRatio:
        this.calculateOverallPower(stats1) / this.calculateOverallPower(stats2),
    };
  }

  /**
   * 総合戦闘力を計算
   */
  public calculateOverallPower(stats: EnemyStats): number {
    // 各能力値に重み付けして総合力を計算
    const healthWeight = 2.0;
    const speedWeight = 1.0;
    const attackWeight = 2.5;
    const defenseWeight = 1.5;
    const accuracyWeight = 1.2;
    const fireRateWeight = 1.0; // 発射間隔は短いほど強い（逆数を使用）

    return (
      stats.health * healthWeight +
      stats.speed * speedWeight +
      stats.attackPower * attackWeight +
      stats.defense * defenseWeight +
      stats.accuracy * 100 * accuracyWeight +
      (1000 / stats.fireRate) * fireRateWeight // 発射間隔の逆数
    );
  }

  /**
   * レベル推奨値を計算
   */
  public calculateRecommendedLevel(stats: EnemyStats): number {
    const overallPower = this.calculateOverallPower(stats);
    // 基準値（SMALL敵の基本能力）を100として、レベルを計算
    const basePower = 100;
    return Math.max(1, Math.round(overallPower / basePower));
  }

  /**
   * 能力値の詳細情報を取得（デバッグ用）
   */
  public getStatsInfo(stats: EnemyStats): {
    stats: EnemyStats;
    overallPower: number;
    recommendedLevel: number;
    survivalTime: number; // 推定生存時間（秒）
    threatLevel: 'Low' | 'Medium' | 'High' | 'Extreme';
  } {
    const overallPower = this.calculateOverallPower(stats);
    const recommendedLevel = this.calculateRecommendedLevel(stats);

    // 推定生存時間（プレイヤーの基本攻撃力を10として計算）
    const playerBaseDamage = 10;
    const survivalTime =
      stats.health / Math.max(1, playerBaseDamage - stats.defense);

    // 脅威レベルの判定
    let threatLevel: 'Low' | 'Medium' | 'High' | 'Extreme';
    if (overallPower < 150) {
      threatLevel = 'Low';
    } else if (overallPower < 300) {
      threatLevel = 'Medium';
    } else if (overallPower < 500) {
      threatLevel = 'High';
    } else {
      threatLevel = 'Extreme';
    }

    return {
      stats,
      overallPower,
      recommendedLevel,
      survivalTime,
      threatLevel,
    };
  }
}
