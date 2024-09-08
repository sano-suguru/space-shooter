import { Game } from "../core/Game";
import { EventEmitter } from "../events/EventEmitter";
import { EventMap } from "../events/EventType";

export type GameStateKey = 'STARTING' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface GameState {
    enter(game: Game): void;
    update(game: Game): void;
    exit(game: Game): void;
    handleInput(game: Game, input: string): void;
}

class StartingState implements GameState {
    enter(game: Game): void {
        console.log("Entering Starting state");
        game.resetGame();
        game.showMessage("Press SPACE to start the game");
    }

    update(_game: Game): void {
        // Starting state doesn't need update logic
    }

    exit(game: Game): void {
        console.log("Exiting Starting state");
        game.hideMessage();
    }

    handleInput(game: Game, input: string): void {
        if (input === ' ') {
            game.getStateManager().setState('PLAYING', game);
        }
    }
}

class PlayingState implements GameState {
    enter(game: Game): void {
        console.log("Entering Playing state");
        game.resumeGameLoop();
    }

    update(game: Game): void {
        game.updateGameObjects();
        game.checkCollisions();
        game.removeOffscreenObjects();
        game.updateUI();
    }

    exit(_game: Game): void {
        console.log("Exiting Playing state");
    }

    handleInput(game: Game, input: string): void {
        if (input === 'Escape') {
            game.getStateManager().setState('PAUSED', game);
        }
    }
}

class PausedState implements GameState {
    enter(game: Game): void {
        console.log("Entering Paused state");
        game.pauseGameLoop();
        game.showMessage("Game Paused. Press SPACE to resume");
    }

    update(_game: Game): void {
        // Paused state doesn't need update logic
    }

    exit(game: Game): void {
        console.log("Exiting Paused state");
        game.hideMessage();
    }

    handleInput(game: Game, input: string): void {
        if (input === ' ') {
            game.getStateManager().setState('PLAYING', game);
        }
    }
}

class GameOverState implements GameState {
    enter(game: Game): void {
        console.log("Entering Game Over state");
        game.pauseGameLoop();
        game.showGameOverScreen();
    }

    update(_game: Game): void {
        // Game Over state doesn't need update logic
    }

    exit(game: Game): void {
        console.log("Exiting Game Over state");
        game.hideGameOverScreen();
    }

    handleInput(game: Game, input: string): void {
        if (input === 'r') {
            game.getStateManager().setState('STARTING', game);
        }
    }
}

export class GameStateManager {
    private currentState: GameState;
    private states: Record<GameStateKey, GameState>;

    constructor(private eventEmitter: EventEmitter<EventMap>) {
        this.states = {
            STARTING: new StartingState(),
            PLAYING: new PlayingState(),
            PAUSED: new PausedState(),
            GAME_OVER: new GameOverState()
        };
        this.currentState = this.states.STARTING;
    }

    setState(newState: GameStateKey, game: Game): void {
        this.currentState.exit(game);
        this.currentState = this.states[newState];
        this.currentState.enter(game);
        this.eventEmitter.emit('stateChanged', newState);
    }

    update(game: Game): void {
        this.currentState.update(game);
    }

    handleInput(game: Game, input: string): void {
        this.currentState.handleInput(game, input);
    }

    isPlaying(): boolean {
        return this.currentState === this.states.PLAYING;
    }

    getCurrentState(): GameStateKey {
        return Object.keys(this.states).find(
            key => this.states[key as GameStateKey] === this.currentState
        ) as GameStateKey;
    }
}
