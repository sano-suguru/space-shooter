import { Bullet } from "../objects/Bullet";
import { Enemy } from "../objects/Enemy";
import { PowerUp } from "../objects/PowerUp";

export type EventMap = {
    'enemyDestroyed': (enemy: Enemy) => void;
    'playerShot': (bulltet: Bullet) => void;
    'playerDamaged': (damage: number) => void;
    'bossDamaged': () => void;
    'bossDefeated': () => void;
    'powerUpCollected': (powerUp: PowerUp) => void;
    'scoreUpdated': (newScore: number) => void;
    'levelCompleted': (level: number) => void;
    'healthChanged': (newHealth: number) => void;
    'powerUpActivated': (type: string) => void;
    'powerUpDeactivated': (type: string) => void;
    'gameStarted': () => void;
    'gamePaused': () => void;
    'gameResumed': () => void;
    'gameOver': () => void;
    'bossSpawned': () => void;
    'levelStarted': (level: number) => void;
    'levelUpdated': (level: number) => void;
};

export class EventEmitter<EventMap extends Record<string, any>> {
    private listeners: Partial<{ [K in keyof EventMap]: ((data: EventMap[K]) => void)[] }> = {};

    on<K extends keyof EventMap>(event: K, listener: EventMap[K]): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event]!.push(listener as any);
    }

    emit<K extends keyof EventMap>(event: K, ...data: Parameters<EventMap[K]>): void {
        if (!this.listeners[event]) return;
        this.listeners[event]!.forEach(listener => {
            try {
                (listener as any)(...data);
            } catch (error) {
                console.error(`Error in listener for event ${String(event)}:`, error);
            }
        });
    }
}
