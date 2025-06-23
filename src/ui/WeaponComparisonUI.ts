import { IGame } from '../interfaces/IGame';
import { WeaponComparisonData } from '../interfaces/IWeaponComparison';
import { GameStateManager } from '../managers/GameStateManager';
import { WeaponComparisonSystem } from '../systems/WeaponComparisonSystem';

/**
 * 武器比較UIクラス
 * プレイヤーが現在の武器と新しい武器を比較して選択できるUI
 */
export class WeaponComparisonUI {
  private container: HTMLDivElement | null = null;
  private comparisonSystem: WeaponComparisonSystem;
  private onChoiceCallback: ((equipNew: boolean) => void) | null = null;
  private gameInstance: IGame | null = null;
  private keyboardHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    this.comparisonSystem = new WeaponComparisonSystem();
  }

  /**
   * ゲームインスタンスを設定
   */
  public setGameInstance(game: IGame): void {
    this.gameInstance = game;
  }

  /**
   * GameStateManagerを設定
   */
  public setGameStateManager(_stateManager: GameStateManager): void {}

  /**
   * 武器比較UIを表示
   */
  public show(
    comparisonData: WeaponComparisonData,
    onChoice: (equipNew: boolean) => void
  ): void {
    this.onChoiceCallback = onChoice;
    this.createUI(comparisonData);
    document.body.appendChild(this.container!);

    // キーボードリスナーを設定
    this.setupKeyboardListeners();

    // ゲームを一時停止
    this.pauseGame();
  }

  /**
   * 武器比較UIを非表示
   */
  public hide(): void {
    // キーボードリスナーを削除
    this.removeKeyboardListeners();

    if (this.container) {
      document.body.removeChild(this.container);
      this.container = null;
    }

    // ゲームを再開
    this.resumeGame();
  }

  /**
   * UIを作成
   */
  private createUI(data: WeaponComparisonData): void {
    this.container = document.createElement('div');
    this.container.className = 'weapon-comparison-overlay';

    this.container.innerHTML = `
      <div class="weapon-comparison-modal">
        <div class="weapon-comparison-header">
          <h2>🔫 武器比較</h2>
          <p>新しい武器を装備しますか？</p>
        </div>
        
        <div class="weapon-comparison-content">
          <div class="weapon-comparison-weapons">
            ${this.renderWeaponCard(data.currentWeapon, '現在の武器', 'current')}
            <div class="weapon-comparison-vs">VS</div>
            ${this.renderWeaponCard(data.newWeapon, '新しい武器', 'new')}
          </div>
          
          <div class="weapon-comparison-stats">
            ${this.renderComparisonStats(data)}
          </div>
        </div>
        
        <div class="weapon-comparison-actions">
          <button class="weapon-comparison-btn weapon-comparison-btn-keep" data-action="keep">
            現在の武器を保持 (N)
          </button>
          <button class="weapon-comparison-btn weapon-comparison-btn-equip" data-action="equip">
            新しい武器を装備 (Y)
          </button>
        </div>
        
        <div class="weapon-comparison-help">
          <p>Yキー: 装備 | Nキー: 保持 | Escキー: キャンセル</p>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.applyStyles();
  }

  /**
   * 武器カードをレンダリング
   */
  private renderWeaponCard(
    weapon: import('../weapons/types/EnchantedWeapon').EnchantedWeapon | null,
    title: string,
    type: 'current' | 'new'
  ): string {
    if (!weapon) {
      return `
        <div class="weapon-card weapon-card-${type}">
          <div class="weapon-card-header">
            <h3>${title}</h3>
          </div>
          <div class="weapon-card-content">
            <p class="weapon-no-weapon">武器なし</p>
          </div>
        </div>
      `;
    }

    const rarityColor = this.comparisonSystem.getRarityColor(weapon.rarity);

    return `
      <div class="weapon-card weapon-card-${type}" style="border-color: ${rarityColor}">
        <div class="weapon-card-header">
          <h3>${title}</h3>
          <div class="weapon-name" style="color: ${rarityColor}">
            ${weapon.displayName}
          </div>
          <div class="weapon-rarity">${weapon.rarity.toUpperCase()}</div>
        </div>
        
        <div class="weapon-card-content">
          <div class="weapon-stats">
            <div class="weapon-stat">
              <span class="stat-label">ダメージ:</span>
              <span class="stat-value">${weapon.totalStats.finalDamage}</span>
            </div>
            <div class="weapon-stat">
              <span class="stat-label">連射速度:</span>
              <span class="stat-value">${weapon.totalStats.finalFireRate}ms</span>
            </div>
            <div class="weapon-stat">
              <span class="stat-label">弾数:</span>
              <span class="stat-value">${weapon.totalStats.finalBulletCount}</span>
            </div>
          </div>
          
          <div class="weapon-enchantments">
            <h4>エンチャント (${weapon.enchantments.length})</h4>
            ${weapon.enchantments
              .map(
                (
                  ench: import('../weapons/types/EnchantmentTypes').Enchantment
                ) => `
              <div class="enchantment">
                ${this.comparisonSystem.getEnchantmentDescription(ench)}
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 比較統計をレンダリング
   */
  private renderComparisonStats(data: WeaponComparisonData): string {
    const stats = data.comparisonStats;

    return `
      <div class="comparison-stats">
        <h3>📊 性能比較</h3>
        
        <div class="stat-comparison">
          <div class="stat-comparison-item">
            <span class="stat-name">ダメージ</span>
            <div class="stat-bar">
              <div class="stat-change ${stats.damageComparison.isBetter ? 'positive' : 'negative'}">
                ${stats.damageComparison.isBetter ? '↑' : '↓'} 
                ${Math.abs(stats.damageComparison.percentChange).toFixed(1)}%
              </div>
            </div>
          </div>
          
          <div class="stat-comparison-item">
            <span class="stat-name">連射速度</span>
            <div class="stat-bar">
              <div class="stat-change ${stats.fireRateComparison.isBetter ? 'positive' : 'negative'}">
                ${stats.fireRateComparison.isBetter ? '↑' : '↓'} 
                ${Math.abs(stats.fireRateComparison.percentChange).toFixed(1)}%
              </div>
            </div>
          </div>
          
          <div class="stat-comparison-item">
            <span class="stat-name">エンチャント数</span>
            <div class="stat-bar">
              <div class="stat-change ${stats.enchantmentComparison.newCount > stats.enchantmentComparison.currentCount ? 'positive' : 'negative'}">
                ${stats.enchantmentComparison.currentCount} → ${stats.enchantmentComparison.newCount}
              </div>
            </div>
          </div>
          
          <div class="stat-comparison-item overall-rating">
            <span class="stat-name">総合評価</span>
            <div class="stat-bar">
              <div class="stat-change ${stats.overallRating.isBetter ? 'positive' : 'negative'}">
                ${stats.overallRating.isBetter ? '✓ 推奨' : '△ 現状維持'}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    if (!this.container) return;

    // ボタンクリック
    this.container.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      const action = target.getAttribute('data-action');

      if (action === 'keep') {
        this.handleChoice(false);
      } else if (action === 'equip') {
        this.handleChoice(true);
      }
    });
  }

  /**
   * キーボードリスナーを設定
   */
  private setupKeyboardListeners(): void {
    // 既存のリスナーがある場合は削除
    this.removeKeyboardListeners();

    this.keyboardHandler = (e: KeyboardEvent): void => {
      if (!this.container) return;

      switch (e.key.toLowerCase()) {
        case 'y':
          this.handleChoice(true);
          break;
        case 'n':
          this.handleChoice(false);
          break;
        case 'escape':
          this.handleChoice(false);
          break;
      }
    };

    document.addEventListener('keydown', this.keyboardHandler);
  }

  /**
   * キーボードリスナーを削除
   */
  private removeKeyboardListeners(): void {
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }
  }

  /**
   * プレイヤーの選択を処理
   */
  private handleChoice(equipNew: boolean): void {
    if (this.onChoiceCallback) {
      this.onChoiceCallback(equipNew);
    }
    this.hide();
  }

  /**
   * ゲームを一時停止
   */
  private pauseGame(): void {
    console.log(
      '🔄 武器比較UI: ゲーム一時停止（状態管理はWeaponComparisonManagerで実行）'
    );

    if (this.gameInstance) {
      // ゲームループを一時停止のみ実行
      // 状態変更はWeaponComparisonManagerで一元管理
      this.gameInstance.pauseGameLoop();
    }
  }

  /**
   * ゲームを再開
   */
  private resumeGame(): void {
    // ゲーム状態の復帰はWeaponComparisonManagerで行うため、
    // ここではゲームループの再開のみ実行
    if (this.gameInstance) {
      this.gameInstance.resumeGameLoop();
    }
  }

  /**
   * スタイルを適用
   */
  private applyStyles(): void {
    if (document.getElementById('weapon-comparison-styles')) return;

    const style = document.createElement('style');
    style.id = 'weapon-comparison-styles';
    style.textContent = this.getBaseStyles() + this.getComponentStyles();

    document.head.appendChild(style);
  }

  /**
   * 基本スタイルを取得
   */
  private getBaseStyles(): string {
    return `
      .weapon-comparison-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: 'Courier New', monospace;
      }

      .weapon-comparison-modal {
        background: #1a1a1a;
        border: 2px solid #444;
        border-radius: 10px;
        padding: 20px;
        max-width: 800px;
        width: 90%;
        max-height: 90%;
        overflow-y: auto;
        color: white;
      }

      .weapon-comparison-header {
        text-align: center;
        margin-bottom: 20px;
      }

      .weapon-comparison-header h2 {
        margin: 0 0 10px 0;
        color: #ffd700;
      }

      .weapon-comparison-weapons {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
        align-items: center;
      }
    `;
  }

  /**
   * コンポーネントスタイルを取得
   */
  private getComponentStyles(): string {
    return (
      this.getWeaponCardStyles() +
      this.getComparisonStyles() +
      this.getButtonStyles()
    );
  }

  /**
   * 武器カードスタイルを取得
   */
  private getWeaponCardStyles(): string {
    return `
      .weapon-card {
        flex: 1;
        border: 2px solid #666;
        border-radius: 8px;
        padding: 15px;
        background: #2a2a2a;
      }

      .weapon-card-header {
        margin-bottom: 15px;
      }

      .weapon-card-header h3 {
        margin: 0 0 5px 0;
        color: #ccc;
      }

      .weapon-name {
        font-size: 18px;
        font-weight: bold;
        margin: 5px 0;
      }

      .weapon-rarity {
        font-size: 12px;
        opacity: 0.8;
      }

      .weapon-stats {
        margin-bottom: 15px;
      }

      .weapon-stat {
        display: flex;
        justify-content: space-between;
        margin: 5px 0;
      }

      .stat-label {
        color: #aaa;
      }

      .stat-value {
        color: white;
        font-weight: bold;
      }

      .weapon-enchantments h4 {
        margin: 0 0 10px 0;
        color: #ffd700;
      }

      .enchantment {
        background: #333;
        padding: 5px 8px;
        margin: 3px 0;
        border-radius: 4px;
        font-size: 12px;
      }

      .weapon-comparison-vs {
        font-size: 24px;
        font-weight: bold;
        color: #ffd700;
        text-align: center;
      }

      .weapon-no-weapon {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 20px;
      }
    `;
  }

  /**
   * 比較統計スタイルを取得
   */
  private getComparisonStyles(): string {
    return `
      .comparison-stats {
        background: #333;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
      }

      .comparison-stats h3 {
        margin: 0 0 15px 0;
        color: #ffd700;
      }

      .stat-comparison-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 10px 0;
        padding: 8px;
        background: #2a2a2a;
        border-radius: 4px;
      }

      .stat-name {
        color: #ccc;
      }

      .stat-change {
        font-weight: bold;
        padding: 4px 8px;
        border-radius: 4px;
      }

      .stat-change.positive {
        background: #2d5a2d;
        color: #90ee90;
      }

      .stat-change.negative {
        background: #5a2d2d;
        color: #ff6b6b;
      }

      .overall-rating {
        border: 2px solid #ffd700;
      }
    `;
  }

  /**
   * ボタンスタイルを取得
   */
  private getButtonStyles(): string {
    return `
      .weapon-comparison-actions {
        display: flex;
        gap: 15px;
        justify-content: center;
        margin-bottom: 15px;
      }

      .weapon-comparison-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
      }

      .weapon-comparison-btn-keep {
        background: #666;
        color: white;
      }

      .weapon-comparison-btn-keep:hover {
        background: #777;
      }

      .weapon-comparison-btn-equip {
        background: #4a9eff;
        color: white;
      }

      .weapon-comparison-btn-equip:hover {
        background: #5ba8ff;
      }

      .weapon-comparison-help {
        text-align: center;
        color: #aaa;
        font-size: 14px;
      }
    `;
  }
}
