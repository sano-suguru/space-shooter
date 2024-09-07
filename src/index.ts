import { Game } from './game/Game';
import { ScoreManager } from './game/ScoreManager';
import { UIManager } from './managers/UIManager';
import { Player } from './objects/Player';
import { EventEmitter } from './utils/EventEmitter';

let game: Game;

function initGame(): void {
    const eventEmitter = new EventEmitter();
    const scoreElement = getElementOrThrow<HTMLElement>('scoreValue');
    const levelElement = getElementOrThrow<HTMLElement>('levelValue');
    const healthElement = getElementOrThrow<HTMLElement>('healthValue');
    const healthBarElement = getElementOrThrow<HTMLElement>('healthBarFill');
    const gameOverElement = getElementOrThrow<HTMLElement>('gameOver')
    new UIManager(eventEmitter, scoreElement, levelElement, healthElement, healthBarElement, gameOverElement);
    const scoreManager = new ScoreManager(eventEmitter);
    const player = new Player(eventEmitter);
    game = new Game(eventEmitter, scoreManager, player);
    game.start();
}

document.addEventListener('DOMContentLoaded', initGame);

function getElementOrThrow<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Element with id "${id}" not found`);
    }
    return element as T;
}