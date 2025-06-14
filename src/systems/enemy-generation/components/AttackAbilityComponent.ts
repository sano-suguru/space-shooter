import {
  ENEMY_BASE_TEMPLATES,
  SPECIAL_ABILITY_CHANCES,
  ATTACK_PATTERNS,
} from '../../../data/EnemyTemplates';
import { IRandomProvider } from '../../../providers/IRandomProvider';
import { EnemyType, Vector2D } from '../../../types';
import { AttackAbility, SpecialEffect } from '../../types/EnemyGeneration';

export class AttackAbilityComponent {
  private randomProvider: IRandomProvider;

  constructor(randomProvider: IRandomProvider) {
    this.randomProvider = randomProvider;
  }

  /**
   * ランダムな攻撃能力を生成
   */
  public generateRandomAttackAbility(
    enemyType: EnemyType,
    playerLevel: number = 1
  ): AttackAbility {
    const template = ENEMY_BASE_TEMPLATES[enemyType];
    const baseAttack = template.attack;

    // 攻撃タイプをランダム選択（レベルに応じて高度な攻撃が出現）
    const availableTypes: AttackAbility['bulletType'][] = ['single'];

    if (playerLevel >= 3) availableTypes.push('spread');
    if (playerLevel >= 5) availableTypes.push('burst');
    if (playerLevel >= 8) availableTypes.push('homing');

    const bulletType = this.randomProvider.randomChoice(availableTypes);

    // 攻撃タイプに応じた設定
    let bulletCount = baseAttack.bulletCount;
    let bulletSpeed = baseAttack.bulletSpeed;

    switch (bulletType) {
      case 'spread':
        bulletCount = this.randomProvider.randomInt(3, 5);
        bulletSpeed *= this.randomProvider.randomRange(0.8, 1.2);
        break;
      case 'burst':
        bulletCount = this.randomProvider.randomInt(2, 4);
        bulletSpeed *= this.randomProvider.randomRange(0.9, 1.3);
        break;
      case 'homing':
        bulletCount = 1;
        bulletSpeed *= this.randomProvider.randomRange(0.6, 0.9); // ホーミング弾は少し遅め
        break;
      default:
        bulletSpeed *= this.randomProvider.randomRange(0.8, 1.4);
        break;
    }

    // 特殊効果の生成
    const specialEffects = this.generateSpecialEffects(playerLevel);

    return {
      bulletType,
      bulletCount,
      bulletSpeed: Math.round(bulletSpeed),
      specialEffects,
    };
  }

  /**
   * エリート敵の攻撃能力を生成
   */
  public generateEliteAttackAbility(baseAttack: AttackAbility): AttackAbility {
    return {
      bulletType:
        baseAttack.bulletType === 'single' ? 'spread' : baseAttack.bulletType,
      bulletCount: Math.min(7, baseAttack.bulletCount + 2),
      bulletSpeed: Math.round(baseAttack.bulletSpeed * 1.3),
      specialEffects: [
        ...baseAttack.specialEffects,
        this.randomProvider.randomChoice([
          'piercing',
          'explosive',
        ] as SpecialEffect[]),
      ],
    };
  }

  /**
   * 攻撃パターンに基づいて弾丸の発射方向を計算
   */
  public calculateBulletDirections(
    attackAbility: AttackAbility,
    enemyPos: Vector2D,
    playerPos: Vector2D
  ): Array<{ angle: number; speed: number }> {
    const directions: Array<{ angle: number; speed: number }> = [];

    // プレイヤーへの基本角度を計算
    const dx = playerPos.x - enemyPos.x;
    const dy = playerPos.y - enemyPos.y;
    const baseAngle = Math.atan2(dy, dx);

    switch (attackAbility.bulletType) {
      case 'single':
        directions.push({
          angle: baseAngle,
          speed: attackAbility.bulletSpeed,
        });
        break;

      case 'spread': {
        const spreadConfig = ATTACK_PATTERNS.spread;
        const angleStep =
          spreadConfig.angleSpread / (attackAbility.bulletCount - 1);
        const startAngle = baseAngle - spreadConfig.angleSpread / 2;

        for (let i = 0; i < attackAbility.bulletCount; i++) {
          directions.push({
            angle: startAngle + angleStep * i,
            speed: attackAbility.bulletSpeed,
          });
        }
        break;
      }

      case 'burst': {
        const burstConfig = ATTACK_PATTERNS.burst;
        const burstAngleStep =
          burstConfig.burstSpread / (attackAbility.bulletCount - 1);
        const burstStartAngle = baseAngle - burstConfig.burstSpread / 2;

        for (let i = 0; i < attackAbility.bulletCount; i++) {
          directions.push({
            angle: burstStartAngle + burstAngleStep * i,
            speed:
              attackAbility.bulletSpeed *
              this.randomProvider.randomRange(0.9, 1.1),
          });
        }
        break;
      }

      case 'homing':
        directions.push({
          angle: baseAngle + this.randomProvider.randomRange(-0.5, 0.5), // 少しランダム性を追加
          speed: attackAbility.bulletSpeed,
        });
        break;
    }

    return directions;
  }

  /**
   * 特殊効果を生成
   */
  private generateSpecialEffects(playerLevel: number): SpecialEffect[] {
    const effects: SpecialEffect[] = [];
    const levelMultiplier = Math.min(3.0, 1.0 + (playerLevel - 1) * 0.2);

    // 各特殊効果の出現判定
    Object.entries(SPECIAL_ABILITY_CHANCES).forEach(([effect, baseChance]) => {
      const adjustedChance = baseChance * levelMultiplier;
      if (this.randomProvider.randomChance(adjustedChance)) {
        effects.push(effect as SpecialEffect);
      }
    });

    // 最大2つまでの特殊効果
    return effects.slice(0, 2);
  }

  /**
   * 攻撃の威力を計算
   */
  public calculateAttackPower(
    baseAttackPower: number,
    attackAbility: AttackAbility
  ): number {
    let totalPower = baseAttackPower;

    // 攻撃タイプによる補正
    switch (attackAbility.bulletType) {
      case 'spread':
        totalPower *= 0.8; // 拡散攻撃は単発威力が下がる
        break;
      case 'burst':
        totalPower *= 0.9; // バースト攻撃は少し威力が下がる
        break;
      case 'homing':
        totalPower *= 1.1; // ホーミング弾は威力が上がる
        break;
    }

    // 特殊効果による補正
    attackAbility.specialEffects.forEach(effect => {
      switch (effect) {
        case 'piercing':
          totalPower *= 1.2;
          break;
        case 'explosive':
          totalPower *= 1.5;
          break;
        case 'slowing':
          totalPower *= 0.9; // 減速効果は威力が少し下がる
          break;
        case 'splitting':
          totalPower *= 1.3;
          break;
      }
    });

    return Math.round(totalPower);
  }

  /**
   * 攻撃の命中率を計算
   */
  public calculateAccuracy(
    baseAccuracy: number,
    attackAbility: AttackAbility,
    distance: number
  ): number {
    let accuracy = baseAccuracy;

    // 攻撃タイプによる補正
    switch (attackAbility.bulletType) {
      case 'spread':
        accuracy *= 0.9; // 拡散攻撃は命中率が下がる
        break;
      case 'homing':
        accuracy *= 1.3; // ホーミング弾は命中率が上がる
        break;
    }

    // 距離による補正
    const distanceFactor = Math.max(0.3, 1.0 - distance / 300);
    accuracy *= distanceFactor;

    // 特殊効果による補正
    if (attackAbility.specialEffects.includes('explosive')) {
      accuracy *= 1.1; // 爆発効果は範囲攻撃なので命中率が上がる
    }

    return Math.max(0.1, Math.min(0.98, accuracy));
  }

  /**
   * 攻撃間隔を計算
   */
  public calculateFireRate(
    baseFireRate: number,
    attackAbility: AttackAbility
  ): number {
    let fireRate = baseFireRate;

    // 攻撃タイプによる補正
    switch (attackAbility.bulletType) {
      case 'spread':
        fireRate *= 1.3; // 拡散攻撃は発射間隔が長い
        break;
      case 'burst':
        fireRate *= 0.8; // バースト攻撃は発射間隔が短い
        break;
      case 'homing':
        fireRate *= 1.5; // ホーミング弾は発射間隔が長い
        break;
    }

    // 弾数による補正
    if (attackAbility.bulletCount > 3) {
      fireRate *= 1.2;
    }

    return Math.round(fireRate);
  }

  /**
   * 攻撃能力の妥当性をチェック
   */
  public validateAttackAbility(ability: AttackAbility): AttackAbility {
    return {
      bulletType: ability.bulletType,
      bulletCount: Math.max(1, Math.min(7, ability.bulletCount)),
      bulletSpeed: Math.max(50, Math.min(400, ability.bulletSpeed)),
      specialEffects: ability.specialEffects.slice(0, 2), // 最大2つまで
    };
  }

  /**
   * 攻撃能力の説明を取得（デバッグ用）
   */
  public getAttackDescription(ability: AttackAbility): string {
    const typeDescriptions = {
      single: '単発攻撃',
      spread: '拡散攻撃',
      burst: 'バースト攻撃',
      homing: 'ホーミング攻撃',
    };

    const effectDescriptions = {
      piercing: '貫通',
      explosive: '爆発',
      slowing: '減速',
      splitting: '分裂',
    };

    let description = `${typeDescriptions[ability.bulletType]}`;

    if (ability.bulletCount > 1) {
      description += ` (${ability.bulletCount}発)`;
    }

    if (ability.specialEffects.length > 0) {
      const effects = ability.specialEffects
        .map(effect => effectDescriptions[effect])
        .join(', ');
      description += ` [${effects}]`;
    }

    return description;
  }

  /**
   * 攻撃の脅威レベルを計算
   */
  public calculateThreatLevel(
    ability: AttackAbility,
    attackPower: number
  ): number {
    let threatLevel = attackPower;

    // 攻撃タイプによる脅威度補正
    switch (ability.bulletType) {
      case 'spread':
        threatLevel *= 1.2;
        break;
      case 'burst':
        threatLevel *= 1.1;
        break;
      case 'homing':
        threatLevel *= 1.4;
        break;
    }

    // 弾数による補正
    threatLevel *= 1 + (ability.bulletCount - 1) * 0.3;

    // 特殊効果による補正
    ability.specialEffects.forEach(effect => {
      switch (effect) {
        case 'piercing':
          threatLevel *= 1.3;
          break;
        case 'explosive':
          threatLevel *= 1.6;
          break;
        case 'slowing':
          threatLevel *= 1.2;
          break;
        case 'splitting':
          threatLevel *= 1.4;
          break;
      }
    });

    return Math.round(threatLevel);
  }

  /**
   * 攻撃パターンの詳細情報を取得
   */
  public getAttackInfo(
    ability: AttackAbility,
    baseAttackPower: number
  ): {
    ability: AttackAbility;
    description: string;
    actualPower: number;
    threatLevel: number;
    estimatedDPS: number; // 秒間ダメージ
  } {
    const actualPower = this.calculateAttackPower(baseAttackPower, ability);
    const threatLevel = this.calculateThreatLevel(ability, actualPower);

    // 推定DPS計算（発射間隔を1000msと仮定）
    const baseFireRate = 1000;
    const actualFireRate = this.calculateFireRate(baseFireRate, ability);
    const estimatedDPS =
      (actualPower * ability.bulletCount) / (actualFireRate / 1000);

    return {
      ability,
      description: this.getAttackDescription(ability),
      actualPower,
      threatLevel,
      estimatedDPS: Math.round(estimatedDPS * 10) / 10,
    };
  }
}
