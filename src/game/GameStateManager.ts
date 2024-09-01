export class GameStateManager {
    private currentState: GameState = GameState.STARTING;

    setState(newState: GameState): void {
        this.currentState = newState;
    }

    getState(): GameState {
        return this.currentState;
    }

    isPlaying(): boolean {
        return this.currentState === GameState.PLAYING;
    }
}

export enum GameState {
    STARTING,
    PLAYING,
    PAUSED,
    GAME_OVER
}