import { GameConfig } from '../config/GameConfigFactory';
import { IPlayer } from '../interfaces/IPlayer';
import { PowerUpType } from '../types';

export class PowerUpEffectService {
  constructor(private config: GameConfig) {}

  applyEffect(player: IPlayer, type: PowerUpType): void {
    switch (type) {
      case 'RAPID_FIRE':
        player.setFireRate(this.config.player.fireRate / 2);
        break;
      case 'TRIPLE_SHOT':
        player.setBulletType('triple');
        break;
      case 'SHIELD':
        console.log('🛡️ [PowerUpEffectService] シールド効果を適用中');
        player.activateShield();
        console.log('🛡️ [PowerUpEffectService] シールド効果適用完了:', {
          shieldActive: player.isShieldActive(),
          timestamp: Date.now(),
        });
        break;
      default:
        console.warn(`Unknown power-up type: ${String(type)}`);
    }
  }

  removeEffect(player: IPlayer, type: PowerUpType): void {
    switch (type) {
      case 'RAPID_FIRE':
        player.setFireRate(this.config.player.fireRate);
        break;
      case 'TRIPLE_SHOT':
        player.setBulletType('single');
        break;
      case 'SHIELD':
        console.log('🛡️ [PowerUpEffectService] シールド効果を除去中');
        console.log('🛡️ [PowerUpEffectService] シールド除去前の状態:', {
          shieldActive: player.isShieldActive(),
          timestamp: Date.now(),
        });

        // シールドを無効化
        if (player.deactivateShield) {
          player.deactivateShield();
          console.log('✅ [PowerUpEffectService] シールドを無効化しました');
        } else {
          console.warn(
            '⚠️ [PowerUpEffectService] deactivateShieldメソッドが利用できません'
          );
        }

        console.log('🛡️ [PowerUpEffectService] シールド除去後の状態:', {
          shieldActive: player.isShieldActive(),
          timestamp: Date.now(),
        });
        break;
      default:
        console.warn(`Unknown power-up type: ${String(type)}`);
    }
  }

  getEffectDuration(): number {
    return this.config.powerup.duration;
  }

  /**
   * 設定を更新（テスト時などに使用）
   */
  updateConfig(newConfig: GameConfig): void {
    this.config = newConfig;
  }
}
