import { Game } from "../game/Game";
import { Aurora } from "../objects/Aurora";
import { Enemy } from "../objects/Enemy";
import { Nebula } from "../objects/Nebula";
import { Planet } from "../objects/Planet";
import { PowerUp } from "../objects/PowerUp";
import { Star } from "../objects/Star";
import { EnemyType } from "../types";
import { GAME_CONSTANTS } from "../utils/Constants";
import { randomRange } from "../utils/MathUtils";

export class GameObjectFactory {
    createStar(): Star {
        return new Star();
    }

    createPlanet(): Planet {
        return new Planet();
    }

    createNebula(): Nebula {
        return new Nebula();
    }

    createAurora(): Aurora {
        return new Aurora();
    }

    createEnemy(type: EnemyType, game: Game): Enemy {
        const enemyData = GAME_CONSTANTS.ENEMY.TYPES[type];
        const x = randomRange(0, GAME_CONSTANTS.CANVAS.WIDTH - enemyData.width);
        return new Enemy(type, x, -enemyData.height, game);
    }

    createPowerUp(): PowerUp {
        const x = randomRange(0, GAME_CONSTANTS.CANVAS.WIDTH - GAME_CONSTANTS.POWERUP.WIDTH);
        return new PowerUp(x, -GAME_CONSTANTS.POWERUP.HEIGHT);
    }
}