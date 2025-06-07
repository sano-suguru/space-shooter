/**
 * DOMBuilderを使用した改善版UpgradeShopUI実装例
 * 文字列HTML生成からタイプセーフなDOM構築への移行例
 */

import { IDOMManager } from '../../../interfaces/IDOMManager.js';
import { UpgradeManager } from '../../managers/UpgradeManager.js';
import { ProgressManager } from '../../managers/ProgressManager.js';
import { UpgradeConfig } from '../../types/Upgrade.js';
import { EventEmitter } from '../../../events/EventEmitter.js';
import { EventMap } from '../../../events/EventType.js';
import { DOMBuilder, DOM } from '../../../utils/DOMBuilder.js';

type UpgradeCategory = 'weapon' | 'defense' | 'utility';

export class ImprovedUpgradeShopUI {
    private container: HTMLElement;
    private upgradeListElement: HTMLElement;
    private playerStatsElement: HTMLElement;
    private currentCategory: UpgradeCategory = 'weapon';

    constructor(
        private domManager: IDOMManager,
        private upgradeManager: UpgradeManager,
        private progressManager: ProgressManager,
        private eventEmitter: EventEmitter<EventMap>
    ) {
        this.container = this.createShopUI();
        this.upgradeListElement = this.container.querySelector('#upgrade-list')!;
        this.playerStatsElement = this.container.querySelector('#player-stats')!;
        this.setupEventListeners();
        this.updateDisplay();
    }

    private createShopUI(): HTMLElement {
        // メインコンテナ
        const shop = DOM.div('upgrade-shop hidden');
        shop.id = 'upgrade-shop';

        // ヘッダー部分の構築
        const header = this.createHeader();
        const categories = this.createCategoryTabs();
        const upgradeList = DOM.div('upgrade-list');
        upgradeList.id = 'upgrade-list';

        shop.appendChild(header);
        shop.appendChild(categories);
        shop.appendChild(upgradeList);

        return shop;
    }

    private createHeader(): HTMLElement {
        const header = DOM.div('shop-header');

        // タイトル部分
        const titleSection = DOM.div('shop-title', [
            DOM.h2('🛠️ アップグレードショップ'),
            DOM.button('close-button', '×', () => this.hide())
        ]);

        // プレイヤー統計部分
        const statsSection = DOM.div('player-stats');
        statsSection.id = 'player-stats';

        header.appendChild(titleSection);
        header.appendChild(statsSection);

        return header;
    }

    private createCategoryTabs(): HTMLElement {
        const categoriesContainer = DOM.div('shop-categories');

        const categories = [
            { id: 'weapon', label: '⚔️ 武器' },
            { id: 'defense', label: '🛡️ 防御' },
            { id: 'utility', label: '⚡ 特殊' }
        ];

        categories.forEach((category, index) => {
            const tab = DOM.button(
                `category-tab ${index === 0 ? 'active' : ''}`,
                category.label,
                () => this.switchCategory(category.id as UpgradeCategory)
            );
            tab.setAttribute('data-category', category.id);
            categoriesContainer.appendChild(tab);
        });

        return categoriesContainer;
    }

    private createUpgradeElement(upgrade: UpgradeConfig): HTMLElement {
        const profile = this.progressManager.getProfile();
        const currentLevel = profile.equippedUpgrades[upgrade.id] || 0;
        const currentCost = this.calculateUpgradeCost(upgrade, currentLevel);
        const canAfford = profile.coins >= currentCost;
        const isMaxLevel = currentLevel >= upgrade.maxLevel;

        const upgradeDiv = DOM.div(`upgrade-item ${!canAfford || isMaxLevel ? 'disabled' : ''}`);

        // ヘッダー部分
        const header = this.createUpgradeHeader(upgrade, currentLevel);
        
        // フッター部分（購入ボタンとコスト）
        const footer = this.createUpgradeFooter(upgrade, currentCost, canAfford, isMaxLevel);

        upgradeDiv.appendChild(header);
        upgradeDiv.appendChild(footer);

        return upgradeDiv;
    }

    private createUpgradeHeader(upgrade: UpgradeConfig, currentLevel: number): HTMLElement {
        const header = DOM.div('upgrade-header');

        // アップグレード情報
        const info = DOM.div('upgrade-info', [
            DOM.h3(upgrade.name, 'upgrade-name'),
            DOM.p(upgrade.description, 'upgrade-description'),
            DOM.div('upgrade-effect', [
                DOM.span(undefined, this.getEffectText(upgrade, currentLevel))
            ])
        ]);

        // 統計情報
        const stats = DOM.div('upgrade-stats', [
            DOM.div('upgrade-level', [
                DOM.span(undefined, `Lv.${currentLevel}/${upgrade.maxLevel}`)
            ]),
            this.createProgressBarElement(currentLevel, upgrade.maxLevel)
        ]);

        header.appendChild(info);
        header.appendChild(stats);

        return header;
    }

    private createUpgradeFooter(
        upgrade: UpgradeConfig, 
        cost: number, 
        canAfford: boolean, 
        isMaxLevel: boolean
    ): HTMLElement {
        const footer = DOM.div('upgrade-footer');

        // コスト表示
        const costDisplay = DOM.div('upgrade-cost', [
            DOM.span(undefined, `💰 ${cost}`)
        ]);

        // 購入ボタン
        const buttonText = isMaxLevel ? '最大レベル' : '購入';
        const buttonClass = `purchase-button ${!canAfford || isMaxLevel ? 'disabled' : ''}`;
        
        const purchaseButton = DOM.button(
            buttonClass,
            buttonText,
            () => this.purchaseUpgrade(upgrade.id)
        );

        if (!canAfford || isMaxLevel) {
            (purchaseButton as HTMLButtonElement).disabled = true;
        }

        footer.appendChild(costDisplay);
        footer.appendChild(purchaseButton);

        return footer;
    }

    private createProgressBarElement(current: number, max: number): HTMLElement {
        const percentage = (current / max) * 100;
        
        const progressBar = DOM.div('progress-bar');
        const progressFill = DOM.div('progress-fill');
        progressFill.style.width = `${percentage}%`;
        
        progressBar.appendChild(progressFill);
        return progressBar;
    }

    private updatePlayerStats(): void {
        const profile = this.progressManager.getProfile();
        
        // 既存の要素をクリア
        this.playerStatsElement.innerHTML = '';
        
        // 新しい統計情報要素を作成
        const coinsElement = DOM.span('coins', `💰 ${profile.coins}`);
        const levelElement = DOM.span('level', `Lv.${profile.level}`);
        const xpElement = DOM.span('xp', `XP: ${profile.experience}`);
        
        this.playerStatsElement.appendChild(coinsElement);
        this.playerStatsElement.appendChild(levelElement);
        this.playerStatsElement.appendChild(xpElement);
    }

    private updateUpgradeList(): void {
        const availableUpgrades = this.upgradeManager.getAvailableUpgrades()
            .filter(upgrade => upgrade.category === this.currentCategory);

        // リストをクリア
        this.upgradeListElement.innerHTML = '';

        if (availableUpgrades.length === 0) {
            const noUpgrades = DOM.div('no-upgrades', [
                DOM.p('このカテゴリーには利用可能なアップグレードがありません')
            ]);
            this.upgradeListElement.appendChild(noUpgrades);
            return;
        }

        availableUpgrades.forEach(upgrade => {
            const upgradeElement = this.createUpgradeElement(upgrade);
            this.upgradeListElement.appendChild(upgradeElement);
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

    private setupEventListeners(): void {
        // プログレッション関連イベントの監視
        this.eventEmitter.on('upgradeApplied', () => {
            this.updateDisplay();
        });

        this.eventEmitter.on('coinsEarned', () => {
            this.updatePlayerStats();
        });

        this.eventEmitter.on('playerLevelUp', () => {
            this.updatePlayerStats();
            this.updateUpgradeList();
        });
    }

    private updateDisplay(): void {
        this.updatePlayerStats();
        this.updateUpgradeList();
    }

    private calculateUpgradeCost(upgrade: UpgradeConfig, currentLevel: number): number {
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
    }

    private getEffectText(upgrade: UpgradeConfig, currentLevel: number): string {
        const nextLevel = currentLevel + 1;
        if (nextLevel > upgrade.maxLevel) {
            return '現在の効果: 適用済み';
        }
        return `レベル ${currentLevel} → ${nextLevel}`;
    }

    private purchaseUpgrade(upgradeId: string): void {
        const success = this.upgradeManager.purchaseUpgrade(upgradeId);
        
        if (success) {
            this.showPurchaseSuccess();
            this.updateDisplay();
        } else {
            this.showPurchaseError();
        }
    }

    private showPurchaseSuccess(): void {
        const successMessage = DOM.div('purchase-feedback success', [
            DOM.span(undefined, '購入完了！')
        ]);
        
        this.container.appendChild(successMessage);
        
        setTimeout(() => {
            successMessage.remove();
        }, 2000);
    }

    private showPurchaseError(): void {
        const errorMessage = DOM.div('purchase-feedback error', [
            DOM.span(undefined, '購入に失敗しました')
        ]);
        
        this.container.appendChild(errorMessage);
        
        setTimeout(() => {
            errorMessage.remove();
        }, 2000);
    }

    // Public API
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
