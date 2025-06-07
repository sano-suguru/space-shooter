import { IDOMManager } from '../../interfaces/IDOMManager.js';
import { UpgradeManager } from '../managers/UpgradeManager.js';
import { ProgressManager } from '../managers/ProgressManager.js';
import { UpgradeConfig } from '../types/Upgrade.js';
import { EventEmitter } from '../../events/EventEmitter.js';
import { EventMap } from '../../events/EventType.js';

type UpgradeCategory = 'weapon' | 'defense' | 'utility';

export class UpgradeShopUI {
    private container: HTMLElement;
    private upgradeListElement: HTMLElement | null = null;
    private currentCategory: UpgradeCategory = 'weapon';
    private playerStatsElement: HTMLElement | null = null;

    constructor(
        private domManager: IDOMManager,
        private upgradeManager: UpgradeManager,
        private progressManager: ProgressManager,
        private eventEmitter: EventEmitter<EventMap>
    ) {
        this.container = this.createShopUI();
        this.setupEventListeners();
        this.updateDisplay();
    }

    private createShopUI(): HTMLElement {
        const shop = this.domManager.createElement('div');
        shop.id = 'upgrade-shop';
        shop.className = 'upgrade-shop hidden';

        shop.innerHTML = `
            <div class="shop-header">
                <div class="shop-title">
                    <h2>🛠️ アップグレードショップ</h2>
                    <button class="close-button" id="close-shop">×</button>
                </div>
                <div class="player-stats" id="player-stats">
                    <span class="coins">💰 0</span>
                    <span class="level">Lv.1</span>
                    <span class="xp">XP: 0/100</span>
                </div>
            </div>
            <div class="shop-categories">
                <button class="category-tab active" data-category="weapon">⚔️ 武器</button>
                <button class="category-tab" data-category="defense">🛡️ 防御</button>
                <button class="category-tab" data-category="utility">⚡ 特殊</button>
            </div>
            <div class="upgrade-list" id="upgrade-list"></div>
        `;

        this.upgradeListElement = shop.querySelector('#upgrade-list') as HTMLElement;
        this.playerStatsElement = shop.querySelector('#player-stats') as HTMLElement;

        return shop;
    }

    private setupEventListeners(): void {
        // カテゴリタブのクリック処理
        const categoryTabs = this.container.querySelectorAll('.category-tab');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                const category = target.getAttribute('data-category') as UpgradeCategory;
                this.switchCategory(category);
            });
        });

        // ショップ閉じるボタン
        const closeButton = this.container.querySelector('#close-shop');
        closeButton?.addEventListener('click', () => {
            this.hide();
        });

        // プログレッション関連イベントの監視
        this.eventEmitter.on('upgradeApplied', () => {
            this.updateDisplay();
        });

        this.eventEmitter.on('coinsEarned', () => {
            this.updatePlayerStats();
        });

        this.eventEmitter.on('playerLevelUp', () => {
            this.updatePlayerStats();
            this.updateUpgradeList(); // レベルアップで新しいアップグレードが解除される可能性
        });
    }

    private switchCategory(category: UpgradeCategory): void {
        this.currentCategory = category;
        
        // タブの表示状態を更新
        const tabs = this.container.querySelectorAll('.category-tab');
        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-category') === category) {
                tab.classList.add('active');
            }
        });

        this.updateUpgradeList();
    }

    private updateDisplay(): void {
        this.updatePlayerStats();
        this.updateUpgradeList();
    }

    private updatePlayerStats(): void {
        const profile = this.progressManager.getProfile();
        
        if (this.playerStatsElement) {
            this.playerStatsElement.innerHTML = `
                <span class="coins">💰 ${profile.coins}</span>
                <span class="level">Lv.${profile.level}</span>
                <span class="xp">XP: ${profile.experience}</span>
            `;
        }
    }

    private updateUpgradeList(): void {
        const availableUpgrades = this.upgradeManager.getAvailableUpgrades()
            .filter(upgrade => upgrade.category === this.currentCategory);

        if (!this.upgradeListElement) return;

        this.upgradeListElement.innerHTML = '';

        if (availableUpgrades.length === 0) {
            this.upgradeListElement.innerHTML = `
                <div class="no-upgrades">
                    <p>このカテゴリーには利用可能なアップグレードがありません</p>
                </div>
            `;
            return;
        }

        availableUpgrades.forEach(upgrade => {
            const upgradeElement = this.createUpgradeElement(upgrade);
            this.upgradeListElement!.appendChild(upgradeElement);
        });
    }

    private createUpgradeElement(upgrade: UpgradeConfig): HTMLElement {
        const profile = this.progressManager.getProfile();
        const currentLevel = profile.equippedUpgrades[upgrade.id] || 0;
        const currentCost = this.calculateUpgradeCost(upgrade, currentLevel);
        const canAfford = profile.coins >= currentCost;
        const isMaxLevel = currentLevel >= upgrade.maxLevel;

        const upgradeDiv = this.domManager.createElement('div');
        upgradeDiv.className = `upgrade-item ${!canAfford || isMaxLevel ? 'disabled' : ''}`;

        const progressBar = this.createProgressBar(currentLevel, upgrade.maxLevel);
        const effectText = this.getEffectText(upgrade, currentLevel);

        upgradeDiv.innerHTML = `
            <div class="upgrade-header">
                <div class="upgrade-info">
                    <h3 class="upgrade-name">${upgrade.name}</h3>
                    <p class="upgrade-description">${upgrade.description}</p>
                    <div class="upgrade-effect">${effectText}</div>
                </div>
                <div class="upgrade-stats">
                    <div class="upgrade-level">Lv.${currentLevel}/${upgrade.maxLevel}</div>
                    ${progressBar}
                </div>
            </div>
            <div class="upgrade-footer">
                <div class="upgrade-cost">💰 ${currentCost}</div>
                <button class="purchase-button ${!canAfford || isMaxLevel ? 'disabled' : ''}" 
                        data-upgrade-id="${upgrade.id}"
                        ${!canAfford || isMaxLevel ? 'disabled' : ''}>
                    ${isMaxLevel ? '最大レベル' : '購入'}
                </button>
            </div>
        `;

        // 購入ボタンのイベントリスナー
        const purchaseButton = upgradeDiv.querySelector('.purchase-button') as HTMLButtonElement;
        if (!purchaseButton.disabled) {
            purchaseButton.addEventListener('click', () => {
                this.purchaseUpgrade(upgrade.id);
            });
        }

        return upgradeDiv;
    }

    private createProgressBar(current: number, max: number): string {
        const percentage = (current / max) * 100;
        return `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
        `;
    }

    private calculateUpgradeCost(upgrade: UpgradeConfig, currentLevel: number): number {
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
    }

    private getEffectText(upgrade: UpgradeConfig, currentLevel: number): string {
        const nextLevel = currentLevel + 1;
        if (nextLevel > upgrade.maxLevel) {
            const currentEffect = upgrade.effect(currentLevel);
            return `現在の効果: 適用済み`;
        }
        
        return `レベル ${currentLevel} → ${nextLevel}`;
    }

    private purchaseUpgrade(upgradeId: string): void {
        const success = this.upgradeManager.purchaseUpgrade(upgradeId);
        
        if (success) {
            // 購入成功のフィードバック
            this.showPurchaseSuccess();
            this.updateDisplay();
        } else {
            // 購入失敗のフィードバック
            this.showPurchaseError();
        }
    }

    private showPurchaseSuccess(): void {
        // 簡単な成功フィードバック（アニメーション効果）
        const successMessage = this.domManager.createElement('div');
        successMessage.className = 'purchase-feedback success';
        successMessage.textContent = '購入完了！';
        
        this.container.appendChild(successMessage);
        
        setTimeout(() => {
            successMessage.remove();
        }, 2000);
    }

    private showPurchaseError(): void {
        // エラーフィードバック
        const errorMessage = this.domManager.createElement('div');
        errorMessage.className = 'purchase-feedback error';
        errorMessage.textContent = '購入に失敗しました';
        
        this.container.appendChild(errorMessage);
        
        setTimeout(() => {
            errorMessage.remove();
        }, 2000);
    }

    public show(): void {
        this.container.classList.remove('hidden');
        this.updateDisplay();
    }

    public hide(): void {
        this.container.classList.add('hidden');
    }

    public toggle(): void {
        if (this.container.classList.contains('hidden')) {
            this.show();
        } else {
            this.hide();
        }
    }

    public getElement(): HTMLElement {
        return this.container;
    }

    public isVisible(): boolean {
        return !this.container.classList.contains('hidden');
    }
}
