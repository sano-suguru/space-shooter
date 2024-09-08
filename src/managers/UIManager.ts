import { GAME_CONSTANTS } from "../constants/GameConstants";
import { EventEmitter, EventMap } from "../utils/EventEmitter";

export class UIManager {
    constructor(
        private eventEmitter: EventEmitter<EventMap>,
        private scoreElement: HTMLElement,
        private levelElement: HTMLElement,
        private healthElement: HTMLElement,
        private healthBarElement: HTMLElement,
        private gameOverElement: HTMLElement
    ) {
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.eventEmitter.on('scoreUpdated', (score: number) => this.updateScoreDisplay(score));
        this.eventEmitter.on('healthChanged', (health: number) => this.updateHealthDisplay(health));
        this.eventEmitter.on('levelUpdated', (level: number) => this.updateLevelDisplay(level));
        this.eventEmitter.on('gameOver', () => this.showGameOver());
    }


    updateScoreDisplay(score: number): void {
        this.scoreElement.textContent = score.toString();
    }

    updateLevelDisplay(level: number): void {
        this.levelElement.textContent = level.toString();
    }

    updateHealthDisplay(health: number): void {
        this.healthElement.textContent = health.toString();
        const healthPercentage = (health / GAME_CONSTANTS.PLAYER.MAX_HEALTH) * 100;
        this.healthBarElement.style.width = `${healthPercentage}%`;
    }

    showGameOver(): void {
        this.gameOverElement.classList.remove('hidden');
    }
}
