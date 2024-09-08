import { GameObjectFactory } from './factories/GameObjectFactory';
import { Game } from './game/Game';
import { GameStateManager } from './game/GameStateManager';
import { ScoreManager } from './game/ScoreManager';
import { UIManager } from './managers/UIManager';
import { Player } from './objects/Player';
import { EventEmitter } from './utils/EventEmitter';
import { getElementOrThrow } from './utils/HtmlUtils';

function initGame(): void {
    const canvas = getElementOrThrow<HTMLCanvasElement>('gameCanvas');
    const eventEmitter = new EventEmitter();
    const player = new Player(eventEmitter);
    const gameObjectFactory = new GameObjectFactory();
    const scoreManager = new ScoreManager(eventEmitter);
    const stateManager = new GameStateManager(eventEmitter);

    const levelElement = getElementOrThrow<HTMLElement>('levelValue');
    const healthElement = getElementOrThrow<HTMLElement>('healthValue');
    const healthBarElement = getElementOrThrow<HTMLElement>('healthBarFill');
    const gameOverElement = getElementOrThrow<HTMLElement>('gameOver')
    const scoreElement = getElementOrThrow<HTMLElement>('scoreValue');
    new UIManager(eventEmitter, scoreElement, levelElement, healthElement, healthBarElement, gameOverElement);

    const game = new Game(
        canvas,
        eventEmitter,
        scoreManager,
        player,
        gameObjectFactory,
        stateManager
    );

    game.start();
}

document.addEventListener('DOMContentLoaded', initGame);
