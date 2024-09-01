import { Game } from "../game/Game";
import { Enemy } from "../objects/Enemy";
import { PowerUp } from "../objects/PowerUp";
import { EnemyType } from "../types";
import { GAME_CONSTANTS } from "../utils/Constants";
import { randomRange } from "../utils/MathUtils";

export class GameObjectFactory {
    static createEnemy(type: EnemyType, game: Game): Enemy {
        const enemyData = GAME_CONSTANTS.ENEMY.TYPES[type];
        const x = randomRange(0, GAME_CONSTANTS.CANVAS.WIDTH - enemyData.width);
        return new Enemy(type, x, -enemyData.height, game);
    }

    static createPowerUp(): PowerUp {
        const x = randomRange(0, GAME_CONSTANTS.CANVAS.WIDTH - GAME_CONSTANTS.POWERUP.WIDTH);
        return new PowerUp(x, -GAME_CONSTANTS.POWERUP.HEIGHT);
    }
}