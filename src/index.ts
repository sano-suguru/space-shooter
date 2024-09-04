import { Game } from './game/Game';
import { UIManager } from './managers/UIManager';
import { Player } from './objects/Player';
import { EventEmitter } from './utils/EventEmitter';

let game: Game;

function initGame(): void {
    const eventEmitter = new EventEmitter();
    const uiManager = new UIManager(eventEmitter);
    const player = new Player(eventEmitter);
    game = new Game(eventEmitter, uiManager, player);
    game.start();
}

document.addEventListener('DOMContentLoaded', initGame);
