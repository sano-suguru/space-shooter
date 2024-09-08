import { Game } from "./Game";

export type GameStateKey = 'STARTING' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface GameState {
    enter(game: Game): void;
    update(game: Game): void;
    exit(game: Game): void;
}

class StartingState implements GameState {
    enter(_game: Game): void {
        console.log("Entering Starting state");
    }

    update(_game: Game): void {
        // Starting state logic
    }

    exit(_game: Game): void {
        console.log("Exiting Starting state");
    }
}

class PlayingState implements GameState {
    enter(_game: Game): void {
        console.log("Entering Playing state");
    }

    update(_game: Game): void {
        // Playing state logic
    }

    exit(_game: Game): void {
        console.log("Exiting Playing state");
    }
}

class PausedState implements GameState {
    enter(_game: Game): void {
        console.log("Entering Paused state");
    }

    update(_game: Game): void {
        // Paused state logic
    }

    exit(_game: Game): void {
        console.log("Exiting Paused state");
    }
}

class GameOverState implements GameState {
    enter(_game: Game): void {
        console.log("Entering Game Over state");
    }

    update(_game: Game): void {
        // Game Over state logic
    }

    exit(_game: Game): void {
        console.log("Exiting Game Over state");
    }
}

export class GameStateManager {
    private currentState: GameState;
    private states: Record<GameStateKey, GameState>;

    constructor() {
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
    }

    update(game: Game): void {
        this.currentState.update(game);
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
