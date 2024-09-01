import { Player } from "../objects/Player";

export type GameConstants = {
    readonly CANVAS: {
        readonly WIDTH: number;
        readonly HEIGHT: number;
    };
    readonly PLAYER: {
        readonly WIDTH: number;
        readonly HEIGHT: number;
        readonly MAX_SPEED: number;
        readonly ACCELERATION: number;
        readonly DECELERATION: number;
        readonly MAX_HEALTH: number;
        readonly INVINCIBILITY_TIME: number;
        readonly FIRE_RATE: number;
        readonly COLORS: {
            readonly PRIMARY: string;
            readonly SECONDARY: string
            readonly ACCENT: string
            readonly ENGINE: string
        }
    };
    readonly BULLET: {
        readonly WIDTH: number;
        readonly HEIGHT: number;
        readonly SPEED: number;
    };
    readonly ENEMY: {
        readonly SPAWN_INTERVAL: number;
        readonly TYPES: {
            readonly [key in EnemyType]: {
                readonly width: number;
                readonly height: number;
                readonly speed: number;
                readonly health: number;
                readonly score: number;
                readonly color: string;
            };
        };
    };
    readonly BOSS: {
        readonly WIDTH: number;
        readonly HEIGHT: number;
        readonly BULLET_SPEED: number;
        readonly FIRE_RATE: number;
        readonly INITIAL_HEALTH: number;
        readonly INITIAL_SPEED: number;
        readonly MOVEMENT_SPEED: number;
    };
    readonly POWERUP: {
        readonly WIDTH: number;
        readonly HEIGHT: number;
        readonly SPEED: number;
        readonly DURATION: number;
        readonly SPAWN_CHANCE: number;
        readonly TYPES: {
            readonly [key in PowerUpType]: {
                readonly color: string;
                readonly effect: (player: Player) => void;
            };
        };
    };
    readonly EXPLOSION: {
        readonly DURATION: number;
    };
    readonly BACKGROUND: {
        readonly STAR_COUNT: number;
        readonly PLANET_COUNT: number;
        readonly NEBULA_COUNT: number;
    };
};

export type EnemyType = 'SMALL' | 'MEDIUM' | 'LARGE';
export type PowerUpType = 'RAPID_FIRE' | 'TRIPLE_SHOT' | 'SHIELD';
export type MovementPattern = 'straight' | 'zigzag' | 'sine';
export type Vector2D = {
    x: number;
    y: number;
};
