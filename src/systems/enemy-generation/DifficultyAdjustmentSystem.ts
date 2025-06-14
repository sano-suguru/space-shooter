import { IRandomProvider } from '../../providers/IRandomProvider';
import {
  DifficultyFactors,
  DifficultyModifiers,
} from '../types/EnemyGeneration';

export class DifficultyAdjustmentSystem {
  private randomProvider: IRandomProvider;

  constructor(randomProvider: IRandomProvider) {
    this.randomProvider = randomProvider;
  }

  /**
   * 難易度要因から修正値を計算
   */
  public calculateDifficultyModifiers(
    factors: DifficultyFactors
  ): DifficultyModifiers {
    // 基本倍率の計算
    const baseMultiplier =
      factors.baseMultiplier +
      factors.playerLevel * factors.levelScaling +
      factors.currentWave * factors.waveScaling;

    // プレイヤーレベルによる特殊能力出現率の調整
    const specialAbilityChance = Math.min(
      0.3,
      0.1 + factors.playerLevel * 0.02
    );

    // ウェーブ数によるエリート敵出現率の調整
    const eliteEnemyChance = Math.min(0.2, 0.05 + factors.currentWave * 0.01);

    // ランダム要素を追加（±15%の変動）
    const randomVariation = this.randomProvider.randomRange(0.85, 1.15);
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
      specialAbilityChance,
      eliteEnemyChance,
    };
  }

  /**
   * 段階的難易度調整（スムーズな難易度カーブ）
   */
  public calculateSmoothDifficultyModifiers(
    factors: DifficultyFactors
  ): DifficultyModifiers {
    // より滑らかな難易度カーブを作成
    const levelFactor = this.calculateLevelFactor(factors.playerLevel);
    const waveFactor = this.calculateWaveFactor(factors.currentWave);
    const combinedFactor = (levelFactor + waveFactor) / 2;

    // 指数関数的な成長を抑制
    const smoothedMultiplier =
      factors.baseMultiplier + Math.log(1 + combinedFactor) * 0.5;

    return {
      healthMultiplier: Math.max(
        1.0,
        smoothedMultiplier * this.randomProvider.randomRange(0.95, 1.2)
      ),
      speedMultiplier: Math.max(
        0.6,
        smoothedMultiplier * this.randomProvider.randomRange(0.85, 1.3)
      ),
      attackMultiplier: Math.max(
        1.0,
        smoothedMultiplier * this.randomProvider.randomRange(0.95, 1.15)
      ),
      specialAbilityChance: this.calculateSpecialAbilityChance(
        factors.playerLevel,
        factors.currentWave
      ),
      eliteEnemyChance: this.calculateEliteChance(
        factors.currentWave,
        factors.playerLevel
      ),
    };
  }

  /**
   * 適応的難易度調整（プレイヤーのパフォーマンスに基づく）
   */
  public calculateAdaptiveDifficultyModifiers(
    factors: DifficultyFactors,
    playerPerformance: {
      recentDeaths: number;
      averageSurvivalTime: number;
      accuracyRate: number;
      recentScore: number;
    }
  ): DifficultyModifiers {
    const baseDifficulty = this.calculateSmoothDifficultyModifiers(factors);

    // プレイヤーパフォーマンスに基づく調整
    let performanceMultiplier = 1.0;

    // 最近の死亡回数による調整
    if (playerPerformance.recentDeaths > 3) {
      performanceMultiplier *= 0.8; // 難易度を下げる
    } else if (playerPerformance.recentDeaths === 0) {
      performanceMultiplier *= 1.2; // 難易度を上げる
    }

    // 生存時間による調整
    const expectedSurvivalTime = 60 + factors.playerLevel * 30; // 秒
    if (playerPerformance.averageSurvivalTime < expectedSurvivalTime * 0.5) {
      performanceMultiplier *= 0.9;
    } else if (
      playerPerformance.averageSurvivalTime >
      expectedSurvivalTime * 1.5
    ) {
      performanceMultiplier *= 1.1;
    }

    // 命中率による調整
    if (playerPerformance.accuracyRate < 0.3) {
      performanceMultiplier *= 0.9;
    } else if (playerPerformance.accuracyRate > 0.7) {
      performanceMultiplier *= 1.1;
    }

    return {
      healthMultiplier: baseDifficulty.healthMultiplier * performanceMultiplier,
      speedMultiplier: baseDifficulty.speedMultiplier * performanceMultiplier,
      attackMultiplier: baseDifficulty.attackMultiplier * performanceMultiplier,
      specialAbilityChance:
        baseDifficulty.specialAbilityChance *
        Math.min(1.5, performanceMultiplier),
      eliteEnemyChance:
        baseDifficulty.eliteEnemyChance * Math.min(1.3, performanceMultiplier),
    };
  }

  /**
   * レベル要因を計算
   */
  private calculateLevelFactor(playerLevel: number): number {
    // レベル1-10: 線形成長
    // レベル10以上: 対数的成長で成長率を抑制
    if (playerLevel <= 10) {
      return playerLevel * 0.1;
    } else {
      return 1.0 + Math.log(playerLevel - 9) * 0.3;
    }
  }

  /**
   * ウェーブ要因を計算
   */
  private calculateWaveFactor(currentWave: number): number {
    // ウェーブ1-20: 線形成長
    // ウェーブ20以上: 平方根的成長で成長率を抑制
    if (currentWave <= 20) {
      return currentWave * 0.05;
    } else {
      return 1.0 + Math.sqrt(currentWave - 20) * 0.1;
    }
  }

  /**
   * 特殊能力出現確率を計算
   */
  private calculateSpecialAbilityChance(
    playerLevel: number,
    currentWave: number
  ): number {
    const baseChance = 0.1;
    const levelBonus = Math.min(0.15, playerLevel * 0.015);
    const waveBonus = Math.min(0.05, currentWave * 0.002);

    return Math.min(0.3, baseChance + levelBonus + waveBonus);
  }

  /**
   * エリート敵出現確率を計算
   */
  private calculateEliteChance(
    currentWave: number,
    playerLevel: number
  ): number {
    const baseChance = 0.05;
    const waveBonus = Math.min(0.1, currentWave * 0.008);
    const levelBonus = Math.min(0.05, playerLevel * 0.003);

    return Math.min(0.2, baseChance + waveBonus + levelBonus);
  }

  /**
   * 難易度スパイクを防ぐための調整
   */
  public smoothDifficultySpikes(
    currentModifiers: DifficultyModifiers,
    previousModifiers?: DifficultyModifiers
  ): DifficultyModifiers {
    if (!previousModifiers) {
      return currentModifiers;
    }

    const maxChangeRate = 0.3; // 最大30%の変化まで許可

    return {
      healthMultiplier: this.limitChange(
        currentModifiers.healthMultiplier,
        previousModifiers.healthMultiplier,
        maxChangeRate
      ),
      speedMultiplier: this.limitChange(
        currentModifiers.speedMultiplier,
        previousModifiers.speedMultiplier,
        maxChangeRate
      ),
      attackMultiplier: this.limitChange(
        currentModifiers.attackMultiplier,
        previousModifiers.attackMultiplier,
        maxChangeRate
      ),
      specialAbilityChance: this.limitChange(
        currentModifiers.specialAbilityChance,
        previousModifiers.specialAbilityChance,
        maxChangeRate
      ),
      eliteEnemyChance: this.limitChange(
        currentModifiers.eliteEnemyChance,
        previousModifiers.eliteEnemyChance,
        maxChangeRate
      ),
    };
  }

  /**
   * 変化量を制限
   */
  private limitChange(
    current: number,
    previous: number,
    maxChangeRate: number
  ): number {
    const change = current - previous;
    const maxChange = previous * maxChangeRate;

    if (Math.abs(change) > maxChange) {
      return previous + (change > 0 ? maxChange : -maxChange);
    }

    return current;
  }

  /**
   * 難易度レベルを文字列で取得
   */
  public getDifficultyLevel(modifiers: DifficultyModifiers): string {
    const averageMultiplier =
      (modifiers.healthMultiplier +
        modifiers.speedMultiplier +
        modifiers.attackMultiplier) /
      3;

    if (averageMultiplier < 1.2) return 'Easy';
    if (averageMultiplier < 1.5) return 'Normal';
    if (averageMultiplier < 2.0) return 'Hard';
    if (averageMultiplier < 3.0) return 'Very Hard';
    return 'Extreme';
  }

  /**
   * 難易度情報の詳細を取得
   */
  public getDifficultyInfo(
    factors: DifficultyFactors,
    modifiers: DifficultyModifiers
  ): {
    level: string;
    factors: DifficultyFactors;
    modifiers: DifficultyModifiers;
    estimatedChallengeRating: number;
    recommendations: string[];
  } {
    const level = this.getDifficultyLevel(modifiers);
    const challengeRating = this.calculateChallengeRating(modifiers);
    const recommendations = this.generateRecommendations(factors, modifiers);

    return {
      level,
      factors,
      modifiers,
      estimatedChallengeRating: challengeRating,
      recommendations,
    };
  }

  /**
   * チャレンジレーティングを計算
   */
  private calculateChallengeRating(modifiers: DifficultyModifiers): number {
    const baseRating = 100;
    const healthFactor = modifiers.healthMultiplier * 30;
    const speedFactor = modifiers.speedMultiplier * 20;
    const attackFactor = modifiers.attackMultiplier * 40;
    const specialFactor = modifiers.specialAbilityChance * 50;
    const eliteFactor = modifiers.eliteEnemyChance * 100;

    return Math.round(
      baseRating +
        healthFactor +
        speedFactor +
        attackFactor +
        specialFactor +
        eliteFactor
    );
  }

  /**
   * 推奨事項を生成
   */
  private generateRecommendations(
    factors: DifficultyFactors,
    modifiers: DifficultyModifiers
  ): string[] {
    const recommendations: string[] = [];

    if (modifiers.healthMultiplier > 2.0) {
      recommendations.push('敵の体力が高いため、攻撃力アップグレードを推奨');
    }

    if (modifiers.speedMultiplier > 1.5) {
      recommendations.push('敵の速度が速いため、機動性向上を推奨');
    }

    if (modifiers.attackMultiplier > 1.8) {
      recommendations.push('敵の攻撃力が高いため、防御力強化を推奨');
    }

    if (modifiers.specialAbilityChance > 0.2) {
      recommendations.push('特殊能力持ちの敵が多いため、注意深い戦術を推奨');
    }

    if (modifiers.eliteEnemyChance > 0.15) {
      recommendations.push('エリート敵の出現率が高いため、強力な武器を準備');
    }

    if (factors.playerLevel > 10 && factors.currentWave > 20) {
      recommendations.push(
        '高レベル・高ウェーブのため、全体的な戦略見直しを推奨'
      );
    }

    return recommendations;
  }

  /**
   * 難易度の妥当性をチェック
   */
  public validateDifficultyModifiers(
    modifiers: DifficultyModifiers
  ): DifficultyModifiers {
    return {
      healthMultiplier: Math.max(
        0.5,
        Math.min(5.0, modifiers.healthMultiplier)
      ),
      speedMultiplier: Math.max(0.3, Math.min(3.0, modifiers.speedMultiplier)),
      attackMultiplier: Math.max(
        0.5,
        Math.min(4.0, modifiers.attackMultiplier)
      ),
      specialAbilityChance: Math.max(
        0.0,
        Math.min(0.5, modifiers.specialAbilityChance)
      ),
      eliteEnemyChance: Math.max(
        0.0,
        Math.min(0.3, modifiers.eliteEnemyChance)
      ),
    };
  }
}
