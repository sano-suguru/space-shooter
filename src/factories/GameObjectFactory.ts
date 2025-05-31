import { IGameEngine } from "../interfaces/IGameEngine";
import { Aurora } from "../entities/Aurora";
import { Enemy } from "../entities/Enemy";
import { Nebula } from "../entities/Nebula";
import { Planet } from "../entities/Planet";
import { PowerUp } from "../entities/PowerUp";
import { Star } from "../entities/Star";
import { EnemyType } from "../types";
import { GAME_CONSTANTS } from "../constants/GameConstants";
import { randomRange } from "../utils/RandomUtils";

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

    createEnemy(type: EnemyType, game: IGameEngine): Enemy {
        const enemyData = GAME_CONSTANTS.ENEMY.TYPES[type];
        const x = randomRange(0, GAME_CONSTANTS.CANVAS.WIDTH - enemyData.width);
        return new Enemy(x, -enemyData.height, type, game);
    }

    createEnemyAtPosition(type: EnemyType, x: number, y: number, game: IGameEngine): Enemy {
        return new Enemy(x, y, type, game);
    }

    createPowerUp(): PowerUp {
        const x = randomRange(0, GAME_CONSTANTS.CANVAS.WIDTH - GAME_CONSTANTS.POWERUP.WIDTH);
        return new PowerUp(x, -GAME_CONSTANTS.POWERUP.HEIGHT);
    }
}
