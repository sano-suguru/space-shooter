import { Enemy } from "../objects/Enemy";
import { PowerUp } from "../objects/PowerUp";

export type GameEventMap = {
    'enemyDestroyed': (enemy: Enemy) => void;
    'playerDamaged': (damage: number) => void;
    'bossDamaged': () => void;
    'bossDefeated': () => void;
    'powerUpCollected': (powerUp: PowerUp) => void;
    'scoreUpdated': (newScore: number) => void;
    'levelCompleted': (level: number) => void;
    // 他のイベントをここに追加
};

export type GameEventName = keyof GameEventMap;

export class EventEmitter<T extends Record<string, any> = GameEventMap> {
    private events: { [K in keyof T]?: T[K][] } = {};

    on<K extends keyof T>(eventName: K, callback: T[K]): void {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName]!.push(callback);
    }

    off<K extends keyof T>(eventName: K, callback: T[K]): void {
        if (!this.events[eventName]) return;
        this.events[eventName] = this.events[eventName]!.filter(cb => cb !== callback);
    }

    emit<K extends keyof T>(eventName: K, ...args: Parameters<T[K]>): void {
        if (!this.events[eventName]) return;
        this.events[eventName]!.forEach(callback => callback(...args));
    }
}