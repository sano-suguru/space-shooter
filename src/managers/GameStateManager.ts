import { Game } from '../core/Game';
import { DroppedWeapon } from '../entities/DroppedWeapon';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';

export type GameStateKey =
  | 'STARTING'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAME_OVER'
  | 'WEAPON_SELECTION';

export interface GameState {
  enter(game: Game): void;
  update(game: Game): void;
  exit(game: Game): void;
  handleInput(game: Game, input: string): void;
}

class StartingState implements GameState {
  enter(game: Game): void {
    console.log('Entering Starting state');
    game.resetGame();
    game.showMessage(
      'Press SPACE or any movement key (Arrow keys/WASD) to start the game'
    );
  }

  update(_game: Game): void {
    // Starting state doesn't need update logic
  }

  exit(game: Game): void {
    console.log('Exiting Starting state');
    game.hideMessage();
  }

  handleInput(game: Game, input: string): void {
    if (input === ' ' || this.isMovementKey(input)) {
      game.getStateManager().setState('PLAYING', game);
    }
  }

  /**
   * 移動キー（矢印キーまたはWASDキー）かどうかをチェック
   */
  private isMovementKey(key: string): boolean {
    return [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'w',
      'W',
      'a',
      'A',
      's',
      'S',
      'd',
      'D',
    ].includes(key);
  }
}

class PlayingState implements GameState {
  enter(game: Game): void {
    console.log('Entering Playing state');
    game.resumeGameLoop();
    game.startWaveSystem();
  }

  update(game: Game): void {
    // ゲームオブジェクトの更新はGameEngineで行われるため、ここではUI更新のみ
    game.updateUI();
  }

  exit(_game: Game): void {
    console.log('Exiting Playing state');
  }

  handleInput(game: Game, input: string): void {
    if (input === 'Escape') {
      game.getStateManager().setState('PAUSED', game);
    } else if (this.isWeaponSwitchKey(input)) {
      // 武器切り替え処理
      const weaponSlot = this.getWeaponSlotFromKey(input);
      game.switchWeapon(weaponSlot);
    }
  }

  /**
   * 武器切り替えキー（1, 2, 3）かどうかをチェック
   */
  private isWeaponSwitchKey(key: string): boolean {
    return ['1', '2', '3'].includes(key);
  }

  /**
   * キーから武器スロット番号を取得
   */
  private getWeaponSlotFromKey(key: string): number {
    return parseInt(key) - 1; // 1-3 → 0-2
  }
}

class PausedState implements GameState {
  enter(game: Game): void {
    console.log('Entering Paused state');
    game.pauseGameLoop();
    game.showMessage('Game Paused. Press SPACE to resume');
  }

  update(_game: Game): void {
    // Paused state doesn't need update logic
  }

  exit(game: Game): void {
    console.log('Exiting Paused state');
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
    console.log('Entering Game Over state');
    game.pauseGameLoop();
    game.showGameOverScreen();
  }

  update(_game: Game): void {
    // Game Over state doesn't need update logic
  }

  exit(game: Game): void {
    console.log('Exiting Game Over state');
    game.hideGameOverScreen();
  }

  handleInput(game: Game, input: string): void {
    if (input === 'r') {
      game.getStateManager().setState('STARTING', game);
    }
  }
}

class WeaponSelectionState implements GameState {
  private selectedWeaponIndex: number = 0;
  private availableWeapons: DroppedWeapon[] = [];

  constructor(private eventEmitter: EventEmitter<EventMap>) {}

  enter(game: Game): void {
    console.log('Entering Weapon Selection state');
    game.pauseGameLoop();

    // 武器選択開始イベントを発行
    this.eventEmitter.emit('weaponSelectionStarted', {
      availableWeapons: this.availableWeapons,
      playerPosition: { x: 0, y: 0 }, // プレイヤー位置は後で実装
    });

    game.showMessage(
      'Select a weapon: Use Arrow Keys and press SPACE to confirm'
    );
  }

  update(_game: Game): void {
    // 武器選択状態では時間が完全に停止するため、更新処理は行わない
  }

  exit(game: Game): void {
    console.log('Exiting Weapon Selection state');
    game.hideMessage();

    // 武器選択完了イベントを発行
    if (this.availableWeapons[this.selectedWeaponIndex]) {
      this.eventEmitter.emit('weaponSelectionCompleted', {
        selectedWeaponIndex: this.selectedWeaponIndex,
        selectedWeapon: this.availableWeapons[this.selectedWeaponIndex],
      });
    }
  }

  handleInput(game: Game, input: string): void {
    switch (input) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.selectedWeaponIndex = Math.max(0, this.selectedWeaponIndex - 1);
        this.updateSelectionDisplay(game);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.selectedWeaponIndex = Math.min(
          this.availableWeapons.length - 1,
          this.selectedWeaponIndex + 1
        );
        this.updateSelectionDisplay(game);
        break;
      case ' ':
        // 武器選択を確定してゲームを再開
        this.confirmSelection(game);
        break;
      case 'Escape':
        // 選択をキャンセルしてゲームを再開
        this.cancelSelection(game);
        break;
    }
  }

  setAvailableWeapons(weapons: DroppedWeapon[]): void {
    this.availableWeapons = weapons;
    this.selectedWeaponIndex = 0;
  }

  private updateSelectionDisplay(game: Game): void {
    const selectedWeapon = this.availableWeapons[this.selectedWeaponIndex];
    if (selectedWeapon) {
      const enchantedWeapon = selectedWeapon.getEnchantedWeapon();
      game.showMessage(
        `Select weapon: ${enchantedWeapon.displayName} (${
          this.selectedWeaponIndex + 1
        }/${
          this.availableWeapons.length
        })\nPress SPACE to confirm, ESC to cancel`
      );
    }
  }

  private confirmSelection(game: Game): void {
    const selectedWeapon = this.availableWeapons[this.selectedWeaponIndex];
    if (selectedWeapon) {
      // 選択された武器の収集処理（後で実装）
      console.log(
        '武器選択確定:',
        selectedWeapon.getEnchantedWeapon().displayName
      );
    }

    // ゲームを再開
    game.getStateManager().setState('PLAYING', game);
  }

  private cancelSelection(game: Game): void {
    // 選択をキャンセルしてゲームを再開
    game.getStateManager().setState('PLAYING', game);
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
      GAME_OVER: new GameOverState(),
      WEAPON_SELECTION: new WeaponSelectionState(this.eventEmitter),
    };
    this.currentState = this.states.STARTING;
  }

  setState(newState: GameStateKey, game: Game): void {
    const currentStateKey = this.getCurrentState();

    // 同一状態への遷移時は処理をスキップ
    if (currentStateKey === newState) {
      console.log(
        `🔄 GameStateManager: 同一状態への遷移をスキップ (${newState})`
      );
      return;
    }

    console.log(
      `🔄 GameStateManager: 状態遷移 ${currentStateKey} → ${newState}`
    );

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

  /**
   * 武器選択状態を開始
   */
  startWeaponSelection(game: Game, availableWeapons: DroppedWeapon[]): void {
    const weaponSelectionState = this.states
      .WEAPON_SELECTION as WeaponSelectionState;
    weaponSelectionState.setAvailableWeapons(availableWeapons);
    this.setState('WEAPON_SELECTION', game);
  }

  /**
   * 武器選択状態かどうかを判定
   */
  isWeaponSelecting(): boolean {
    return this.currentState === this.states.WEAPON_SELECTION;
  }
}
