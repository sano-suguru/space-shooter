import { Observer } from "../interfaces/Observer";
import { Subject } from "../interfaces/Subject";

export class ScoreManager implements Subject {
    private observers: Observer[] = [];
    private score: number = 0;

    attach(observer: Observer): void {
        const isExist = this.observers.includes(observer);
        if (!isExist) {
            this.observers.push(observer);
        }
    }

    detach(observer: Observer): void {
        const observerIndex = this.observers.indexOf(observer);
        if (observerIndex !== -1) {
            this.observers.splice(observerIndex, 1);
        }
    }

    notify(): void {
        for (const observer of this.observers) {
            observer.update(this);
        }
    }

    getScore(): number {
        return this.score;
    }

    addScore(points: number): void {
        this.score += points;
        this.notify();
    }
}
