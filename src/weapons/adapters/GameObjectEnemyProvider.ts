/**
 * GameObjectManagerを敵プロバイダーインターフェースに適合させるアダプター
 */

import { Enemy } from '../../entities/Enemy';
import { GameObjectManager } from '../../managers/GameObjectManager';
import { IEnemyProvider } from '../trajectories/PrecisionTrajectory';

/**
 * GameObjectManager用敵プロバイダーアダプター
 */
export class GameObjectEnemyProvider implements IEnemyProvider {
  constructor(private gameObjectManager: GameObjectManager) {}

  /**
   * 現在のゲーム内の敵リストを取得
   */
  public getEnemies(): Enemy[] {
    return this.gameObjectManager.getEnemies();
  }
}
