import { EventEmitter } from "../events/EventEmitter";
import { EventMap } from "../events/EventType";

export class ScoreManager {
    private score: number = 0;

    constructor(
        private eventEmitter: EventEmitter<EventMap>
    ) { }

    getScore(): number {
        return this.score;
    }

    addScore(points: number): void {
        this.score += points;
        this.eventEmitter.emit('scoreUpdated', this.score)
    }
}
