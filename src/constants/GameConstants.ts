import { Player } from "../entities/Player";
import { GameConstants } from "../types";

export const GAME_CONSTANTS: GameConstants = {
    CANVAS: {
        WIDTH: 400,
        HEIGHT: 600
    },
    PLAYER: {
        WIDTH: 50,
        HEIGHT: 50,
        MAX_SPEED: 6,
        ACCELERATION: 0.8,
        DECELERATION: 0.3,
        MAX_HEALTH: 100,
        INVINCIBILITY_TIME: 1000,
        FIRE_RATE: 200,
        COLORS: {
            PRIMARY: '#1a237e', // 濃紺
            SECONDARY: '#3f51b5', // 紺碧
            ACCENT: '#00bcd4', // シアン
            ENGINE: '#ff9800', // オレンジ
        }
    },
    BULLET: {
        WIDTH: 5,
        HEIGHT: 15,
        SPEED: 600
    },
    ENEMY: {
        SPAWN_INTERVAL: 1000,
        TYPES: {
            SMALL: { width: 30, height: 30, speed: 180, health: 1, score: 10, color: '#ff00ff' },
            MEDIUM: { width: 50, height: 50, speed: 120, health: 2, score: 20, color: '#00ffff' },
            LARGE: { width: 70, height: 70, speed: 60, health: 3, score: 30, color: '#ffff00' }
        }
    },
    BOSS: {
        WIDTH: 150,
        HEIGHT: 150,
        BULLET_SPEED: 200,
        FIRE_RATE: 1000,
        INITIAL_HEALTH: 50,
        INITIAL_SPEED: 50,
        MOVEMENT_SPEED: 50
    },
    POWERUP: {
        WIDTH: 30,
        HEIGHT: 30,
        SPEED: 100,
        DURATION: 10000,
        SPAWN_CHANCE: 0.05,
        TYPES: {
            RAPID_FIRE: {
                color: '#00ff00',
                effect: (player: Player) => { player.setFireRate(GAME_CONSTANTS.PLAYER.FIRE_RATE / 2); }
            },
            TRIPLE_SHOT: {
                color: '#0000ff',
                effect: (player: Player) => { player.setBulletType('triple'); }
            },
            SHIELD: {
                color: '#ffff00',
                effect: (player: Player) => { player.activateShield(); }
            }
        }
    },
    EXPLOSION: {
        DURATION: 30
    },
    BACKGROUND: {
        STAR_COUNT: 100,
        PLANET_COUNT: 2,
        NEBULA_COUNT: 1
    }
};