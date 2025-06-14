import { PowerUpType } from '../types';
import { IPlayer } from '../interfaces/IPlayer';
import { GameConfig } from '../config/GameConfigFactory';

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
        player.activateShield();
        break;
      default:
        console.warn(`Unknown power-up type: ${type}`);
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
        // シールドの無効化は現在のPlayer実装では自動的に行われる
        // 将来的にdeactivateShieldメソッドが追加された場合はここで呼び出す
        break;
      default:
        console.warn(`Unknown power-up type: ${type}`);
    }
  }
  
  getEffectDuration(_type: PowerUpType): number {
    return this.config.powerup.duration;
  }
  
  /**
   * 設定を更新（テスト時などに使用）
   */
  updateConfig(newConfig: GameConfig): void {
    this.config = newConfig;
  }
}