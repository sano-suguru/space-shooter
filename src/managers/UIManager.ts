import { ScoreManager } from "../game/ScoreManager";
import { Observer } from "../interfaces/Observer";
import { Subject } from "../interfaces/Subject";
import { GAME_CONSTANTS } from "../utils/Constants";
import { EventEmitter, EventMap } from "../utils/EventEmitter";

export class UIManager implements Observer {
    private scoreElement: HTMLElement | null;
    private levelElement: HTMLElement | null;
    private healthElement: HTMLElement | null;
    private healthBarElement: HTMLElement | null;

    constructor(
        private eventEmitter: EventEmitter<EventMap>
    ) {
        this.scoreElement = document.getElementById('scoreValue');
        this.levelElement = document.getElementById('levelValue');
        this.healthElement = document.getElementById('healthValue');
        this.healthBarElement = document.getElementById('healthBarFill');

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.eventEmitter.on('scoreUpdated', (score: number) => this.updateScoreDisplay(score));
        this.eventEmitter.on('healthChanged', (health: number) => this.updateHealthDisplay(health));
        this.eventEmitter.on('levelUpdated', (level: number) => this.updateLevelDisplay(level));
        this.eventEmitter.on('gameOver', () => this.showGameOver());
    }

    update(subject: Subject): void {
        if (subject instanceof ScoreManager) {
            this.updateScoreDisplay(subject.getScore());
        }
    }

    updateScoreDisplay(score: number): void {
        if (this.scoreElement) {
            this.scoreElement.textContent = score.toString();
        }
    }

    updateLevelDisplay(level: number): void {
        if (this.levelElement) {
            this.levelElement.textContent = level.toString();
        }
    }

    updateHealthDisplay(health: number): void {
        if (this.healthElement) {
            this.healthElement.textContent = health.toString();
        }
        if (this.healthBarElement) {
            const healthPercentage = (health / GAME_CONSTANTS.PLAYER.MAX_HEALTH) * 100;
            this.healthBarElement.style.width = `${healthPercentage}%`;
        }
    }

    showGameOver(): void {
        const gameOverElement = document.getElementById('gameOver');
        if (gameOverElement) {
            gameOverElement.classList.remove('hidden');
        }
    }
}
