import { GameConstants } from "../types";

export const GAME_CONSTANTS: GameConstants = {
    CANVAS: {
        WIDTH: 400,
        HEIGHT: 600
    },
    PLAYER: {
        WIDTH: 50,
        HEIGHT: 50,
        MAX_SPEED: 8,
        ACCELERATION: 1.2,
        DECELERATION: 0.6,
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
            SMALL: { width: 30, height: 30, speed: 180, health: 1, score: 10, color: '#7c4dff' }, // 洗練された紫
            MEDIUM: { width: 50, height: 50, speed: 120, health: 2, score: 20, color: '#26c6da' }, // 洗練されたシアン
            LARGE: { width: 70, height: 70, speed: 60, health: 3, score: 30, color: '#66bb6a' }  // 洗練されたグリーン
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
                color: '#66bb6a', // 洗練されたグリーン
                effect: null // 循環依存を回避するため、effectは外部で定義
            },
            TRIPLE_SHOT: {
                color: '#7c4dff', // 洗練された紫
                effect: null // 循環依存を回避するため、effectは外部で定義
            },
            SHIELD: {
                color: '#26c6da', // 洗練されたシアン
                effect: null // 循環依存を回避するため、effectは外部で定義
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
    },
    WAVE: {
        SYSTEM_ENABLED: true,
        CLEAR_BONUS_MULTIPLIER: 2,
        FORMATION_SPACING: 40,
        SPAWN_DELAY_BASE: 200,
        WAVE_CLEAR_DELAY: 2000
    }
};
