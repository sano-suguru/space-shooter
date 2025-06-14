import { GameConfig, createGameConfig } from '../config/GameConfigFactory';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';

export class UIManager {
  private config: GameConfig;

  constructor(
    private eventEmitter: EventEmitter<EventMap>,
    private scoreElement: HTMLElement,
    private levelElement: HTMLElement,
    private healthElement: HTMLElement,
    private healthBarElement: HTMLElement,
    private gameOverElement: HTMLElement,
    config?: GameConfig
  ) {
    // 設定注入対応（後方互換性を保持）
    this.config = config ?? createGameConfig();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventEmitter.on('scoreUpdated', (score: number) =>
      this.updateScoreDisplay(score)
    );
    this.eventEmitter.on('healthChanged', (health: number) =>
      this.updateHealthDisplay(health)
    );
    this.eventEmitter.on('levelUpdated', (level: number) =>
      this.updateLevelDisplay(level)
    );
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
    const healthPercentage = (health / this.config.player.maxHealth) * 100;
    this.healthBarElement.style.width = `${healthPercentage}%`;
  }

  showGameOver(): void {
    this.gameOverElement.classList.remove('hidden');
  }

  /**
   * 設定を取得（テスト用）
   */
  public getConfig(): GameConfig {
    return this.config;
  }
}
