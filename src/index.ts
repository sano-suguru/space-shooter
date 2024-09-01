import { Game } from './game/Game';

let game: Game;

function initGame(): void {
    game = new Game();
    game.start();
}

document.addEventListener('DOMContentLoaded', initGame);
