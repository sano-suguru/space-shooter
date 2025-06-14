import { BehaviorConfig, BehaviorPattern } from '../../types/EnemyGeneration';
import {
  ENEMY_BASE_TEMPLATES,
  VARIATION_RANGES,
  ADVANCED_BEHAVIOR_PATTERNS,
} from '../../../data/EnemyTemplates';
import { EnemyType, Vector2D } from '../../../types';
import { IRandomProvider } from '../../../providers/IRandomProvider';

export class BehaviorComponent {
  private randomProvider: IRandomProvider;

  constructor(randomProvider: IRandomProvider) {
    this.randomProvider = randomProvider;
  }

  /**
   * ランダムな行動設定を生成
   */
  public generateRandomBehavior(enemyType: EnemyType): BehaviorConfig {
    const template = ENEMY_BASE_TEMPLATES[enemyType];
    const baseBehavior = template.behavior;

    // 基本パターンまたは新しいパターンをランダム選択
    const availablePatterns: BehaviorPattern[] = [
      'straight',
      'zigzag',
      'sine',
      'spiral',
      'aggressive_chase',
    ];
    const selectedPattern = this.randomProvider.randomChoice(availablePatterns);

    return {
      pattern: selectedPattern,
      aggressiveness: this.applyVariation(
        baseBehavior.aggressiveness,
        VARIATION_RANGES.behavior.aggressiveness
      ),
      flockingTendency: this.applyVariation(
        baseBehavior.flockingTendency,
        VARIATION_RANGES.behavior.flockingTendency
      ),
      environmentalAwareness: this.applyVariation(
        baseBehavior.environmentalAwareness,
        VARIATION_RANGES.behavior.environmentalAwareness
      ),
    };
  }

  /**
   * エリート敵の行動設定を生成
   */
  public generateEliteBehavior(baseBehavior: BehaviorConfig): BehaviorConfig {
    return {
      ...baseBehavior,
      aggressiveness: Math.min(1.0, baseBehavior.aggressiveness + 0.3),
      flockingTendency: Math.max(0.8, baseBehavior.flockingTendency), // エリートは群れを率いる
      environmentalAwareness: Math.min(
        1.0,
        baseBehavior.environmentalAwareness + 0.2
      ),
    };
  }

  /**
   * 行動パターンに基づいて位置を更新
   */
  public updatePosition(
    currentPos: Vector2D,
    behavior: BehaviorConfig,
    deltaTime: number,
    speed: number,
    animationPhase: number,
    playerPos?: Vector2D,
    flockCenter?: Vector2D,
    nearbyEnemies?: Vector2D[]
  ): Vector2D {
    let newPos = { ...currentPos };

    // 基本移動パターンの適用
    newPos = this.applyMovementPattern(
      newPos,
      behavior.pattern,
      deltaTime,
      speed,
      animationPhase
    );

    // 群れ行動の適用
    if (behavior.flockingTendency > 0 && (flockCenter || nearbyEnemies)) {
      newPos = this.applyFlockingBehavior(
        newPos,
        behavior,
        flockCenter,
        nearbyEnemies
      );
    }

    // 積極性に基づくプレイヤー追跡
    if (behavior.aggressiveness > 0.5 && playerPos) {
      newPos = this.applyAggressiveBehavior(
        newPos,
        behavior,
        playerPos,
        deltaTime,
        speed
      );
    }

    return newPos;
  }

  /**
   * 基本移動パターンを適用
   */
  private applyMovementPattern(
    pos: Vector2D,
    pattern: BehaviorPattern,
    deltaTime: number,
    speed: number,
    animationPhase: number
  ): Vector2D {
    const newPos = { ...pos };

    switch (pattern) {
      case 'straight':
        newPos.y += speed * deltaTime;
        break;

      case 'zigzag':
        newPos.y += speed * deltaTime;
        newPos.x += Math.sin(pos.y * 0.01) * 50 * deltaTime;
        break;

      case 'sine':
        newPos.y += speed * deltaTime;
        newPos.x += Math.sin(animationPhase) * 30 * deltaTime;
        break;

      case 'spiral':
        const spiralConfig = ADVANCED_BEHAVIOR_PATTERNS.spiral;
        const spiralAngle = animationPhase * spiralConfig.spiralSpeed;
        const spiralRadius =
          spiralConfig.spiralRadius * Math.sin(animationPhase * 0.5);

        newPos.y += speed * deltaTime;
        newPos.x += Math.cos(spiralAngle) * spiralRadius * deltaTime;
        break;

      case 'aggressive_chase':
        // この場合は基本的に直進し、積極的行動で調整
        newPos.y += speed * deltaTime * 0.8; // 少し遅めに下降
        break;
    }

    return newPos;
  }

  /**
   * 群れ行動を適用
   */
  private applyFlockingBehavior(
    pos: Vector2D,
    behavior: BehaviorConfig,
    flockCenter?: Vector2D,
    nearbyEnemies?: Vector2D[]
  ): Vector2D {
    const newPos = { ...pos };
    const flockingStrength = behavior.flockingTendency * 0.3;

    // 群れの中心に向かう力（結束）
    if (flockCenter) {
      const toCenterX = flockCenter.x - pos.x;
      const toCenterY = flockCenter.y - pos.y;
      const distance = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);

      if (distance > 0) {
        newPos.x += (toCenterX / distance) * flockingStrength;
        newPos.y += (toCenterY / distance) * flockingStrength * 0.5; // Y方向は弱めに
      }
    }

    // 近くの敵との分離
    if (nearbyEnemies && nearbyEnemies.length > 0) {
      let separationX = 0;
      let separationY = 0;
      let separationCount = 0;

      nearbyEnemies.forEach(enemyPos => {
        const dx = pos.x - enemyPos.x;
        const dy = pos.y - enemyPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0 && distance < 50) {
          // 50ピクセル以内で分離
          separationX += dx / distance;
          separationY += dy / distance;
          separationCount++;
        }
      });

      if (separationCount > 0) {
        newPos.x += (separationX / separationCount) * flockingStrength * 2;
        newPos.y += (separationY / separationCount) * flockingStrength;
      }
    }

    return newPos;
  }

  /**
   * 積極的行動を適用
   */
  private applyAggressiveBehavior(
    pos: Vector2D,
    behavior: BehaviorConfig,
    playerPos: Vector2D,
    deltaTime: number,
    speed: number
  ): Vector2D {
    const newPos = { ...pos };
    const aggressiveConfig = ADVANCED_BEHAVIOR_PATTERNS.aggressive_chase;
    const aggressiveness = behavior.aggressiveness;

    // プレイヤーとの距離を計算
    const dx = playerPos.x - pos.x;
    const dy = playerPos.y - pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0 && distance < aggressiveConfig.attackRange) {
      // 攻撃範囲内でプレイヤーに向かう
      const chaseStrength =
        aggressiveness * aggressiveConfig.chaseSpeed * deltaTime;
      newPos.x += (dx / distance) * chaseStrength * speed * 0.3;
      newPos.y += (dy / distance) * chaseStrength * speed * 0.2; // Y方向は控えめに
    }

    return newPos;
  }

  /**
   * 攻撃判定
   */
  public shouldAttack(
    pos: Vector2D,
    behavior: BehaviorConfig,
    playerPos: Vector2D,
    lastAttackTime: number,
    fireRate: number
  ): boolean {
    const currentTime = Date.now();
    if (currentTime - lastAttackTime < fireRate) {
      return false;
    }

    // プレイヤーとの距離を計算
    const dx = playerPos.x - pos.x;
    const dy = playerPos.y - pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 攻撃範囲内かつ積極性に基づく確率判定
    const attackRange = 200 + behavior.aggressiveness * 100;
    if (distance > attackRange) {
      return false;
    }

    // 積極性に基づく攻撃確率
    const attackChance = 0.3 + behavior.aggressiveness * 0.4;
    return this.randomProvider.randomChance(attackChance);
  }

  /**
   * 環境認識に基づく行動調整
   */
  public adjustForEnvironment(
    behavior: BehaviorConfig,
    environmentType: 'nebula' | 'planet' | 'asteroid_field'
  ): BehaviorConfig {
    if (behavior.environmentalAwareness < 0.3) {
      return behavior; // 環境認識が低い場合は変化なし
    }

    const adjustedBehavior = { ...behavior };

    switch (environmentType) {
      case 'nebula':
        // 星雲では隠密性が向上
        adjustedBehavior.aggressiveness *= 0.8;
        adjustedBehavior.flockingTendency *= 1.2;
        break;

      case 'planet':
        // 惑星近くでは攻撃性が向上
        adjustedBehavior.aggressiveness *= 1.3;
        adjustedBehavior.flockingTendency *= 0.9;
        break;

      case 'asteroid_field':
        // 小惑星帯では防御的になる
        adjustedBehavior.aggressiveness *= 0.9;
        adjustedBehavior.flockingTendency *= 1.1;
        break;
    }

    return adjustedBehavior;
  }

  /**
   * リーダー行動の生成
   */
  public generateLeaderBehavior(baseBehavior: BehaviorConfig): BehaviorConfig {
    return {
      ...baseBehavior,
      aggressiveness: Math.min(1.0, baseBehavior.aggressiveness + 0.2),
      flockingTendency: 0.9, // リーダーは強い群れ意識を持つ
      environmentalAwareness: Math.min(
        1.0,
        baseBehavior.environmentalAwareness + 0.3
      ),
    };
  }

  /**
   * フォロワー行動の生成
   */
  public generateFollowerBehavior(
    baseBehavior: BehaviorConfig
  ): BehaviorConfig {
    return {
      ...baseBehavior,
      aggressiveness: baseBehavior.aggressiveness * 0.8,
      flockingTendency: Math.min(1.0, baseBehavior.flockingTendency + 0.4),
      environmentalAwareness: baseBehavior.environmentalAwareness * 0.9,
    };
  }

  /**
   * 行動の妥当性をチェック
   */
  public validateBehavior(behavior: BehaviorConfig): BehaviorConfig {
    return {
      pattern: behavior.pattern,
      aggressiveness: Math.max(0, Math.min(1, behavior.aggressiveness)),
      flockingTendency: Math.max(0, Math.min(1, behavior.flockingTendency)),
      environmentalAwareness: Math.max(
        0,
        Math.min(1, behavior.environmentalAwareness)
      ),
    };
  }

  /**
   * 行動パターンの説明を取得（デバッグ用）
   */
  public getBehaviorDescription(behavior: BehaviorConfig): string {
    const patternDescriptions = {
      straight: '直進',
      zigzag: 'ジグザグ移動',
      sine: 'サイン波移動',
      spiral: '螺旋移動',
      aggressive_chase: '積極的追跡',
    };

    const aggressivenessLevel =
      behavior.aggressiveness > 0.7
        ? '高'
        : behavior.aggressiveness > 0.4
          ? '中'
          : '低';
    const flockingLevel =
      behavior.flockingTendency > 0.7
        ? '高'
        : behavior.flockingTendency > 0.4
          ? '中'
          : '低';

    return `${patternDescriptions[behavior.pattern]} (積極性: ${aggressivenessLevel}, 群れ傾向: ${flockingLevel})`;
  }

  /**
   * 値の変動を適用
   */
  private applyVariation(
    baseValue: number,
    range: { min: number; max: number }
  ): number {
    const multiplier = this.randomProvider.randomRange(range.min, range.max);
    return Math.max(0, Math.min(1, baseValue * multiplier));
  }
}
