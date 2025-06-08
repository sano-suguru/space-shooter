import { IDOMManager } from '../../interfaces/IDOMManager.js';
import { UpgradeManager } from '../managers/UpgradeManager.js';
import { ProgressManager } from '../managers/ProgressManager.js';
import { UpgradeConfig } from '../types/Upgrade.js';
import { EventEmitter } from '../../events/EventEmitter.js';
import { EventMap } from '../../events/EventType.js';
import { DOMBuilder, DOM } from '../../utils/DOMBuilder.js';

// React関連のインポート（動的インポート）
declare const React: any;
declare const ReactDOM: any;

type UpgradeCategory = 'weapon' | 'defense' | 'utility';

export class UpgradeShopUI {
    private container: HTMLElement;
    private upgradeListElement: HTMLElement | null = null;
    private currentCategory: UpgradeCategory = 'weapon';
    private playerStatsElement: HTMLElement | null = null;
    
    // React統合フラグ
    private useReact: boolean = true; // デフォルトでReactを使用
    private reactRoot: any = null;

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
        const shop = DOMBuilder.createElement({
            tag: 'div',
            id: 'upgrade-shop',
            className: 'upgrade-shop hidden'
        });

        // ショップヘッダー
        const shopHeader = this.createShopHeader();
        
        // カテゴリータブ
        const shopCategories = this.createCategoryTabs();
        
        // アップグレードリスト
        this.upgradeListElement = DOMBuilder.createElement({
            tag: 'div',
            className: 'upgrade-list',
            id: 'upgrade-list'
        });

        shop.appendChild(shopHeader);
        shop.appendChild(shopCategories);
        shop.appendChild(this.upgradeListElement);

        return shop;
    }

    private createShopHeader(): HTMLElement {
        const closeButton = DOMBuilder.createElement({
            tag: 'button',
            className: 'close-button',
            id: 'close-shop',
            textContent: '×'
        });

        const shopTitle = DOMBuilder.createElement({
            tag: 'div',
            className: 'shop-title',
            children: [
                DOM.h2('🛠️ アップグレードショップ'),
                closeButton
            ]
        });

        // プレイヤー統計情報の初期表示
        this.playerStatsElement = DOMBuilder.createElement({
            tag: 'div',
            className: 'player-stats',
            id: 'player-stats',
            children: [
                DOM.span('coins', '💰 0'),
                DOM.span('level', 'Lv.1'),
                DOM.span('xp', 'XP: 0/100')
            ]
        });

        return DOMBuilder.createElement({
            tag: 'div',
            className: 'shop-header',
            children: [shopTitle, this.playerStatsElement]
        });
    }

    private createCategoryTabs(): HTMLElement {
        const weaponTab = DOMBuilder.createElement({
            tag: 'button',
            className: 'category-tab active',
            textContent: '⚔️ 武器',
            attributes: { 'data-category': 'weapon' }
        });

        const defenseTab = DOMBuilder.createElement({
            tag: 'button',
            className: 'category-tab',
            textContent: '🛡️ 防御',
            attributes: { 'data-category': 'defense' }
        });

        const utilityTab = DOMBuilder.createElement({
            tag: 'button',
            className: 'category-tab',
            textContent: '⚡ 特殊',
            attributes: { 'data-category': 'utility' }
        });

        return DOMBuilder.createElement({
            tag: 'div',
            className: 'shop-categories',
            children: [weaponTab, defenseTab, utilityTab]
        });
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
            // 既存の子要素をクリア
            this.playerStatsElement.innerHTML = '';
            
            // 安全なDOM構築で統計情報を再作成
            const coinsSpan = DOM.span('coins', `💰 ${profile.coins}`);
            const levelSpan = DOM.span('level', `Lv.${profile.level}`);
            const xpSpan = DOM.span('xp', `XP: ${profile.experience}`);
            
            this.playerStatsElement.appendChild(coinsSpan);
            this.playerStatsElement.appendChild(levelSpan);
            this.playerStatsElement.appendChild(xpSpan);
        }
    }

    private updateUpgradeList(): void {
        const availableUpgrades = this.upgradeManager.getAvailableUpgrades()
            .filter(upgrade => upgrade.category === this.currentCategory);

        if (!this.upgradeListElement) return;

        this.upgradeListElement.innerHTML = '';

        if (availableUpgrades.length === 0) {
            const noUpgradesDiv = DOMBuilder.createElement({
                tag: 'div',
                className: 'no-upgrades',
                children: [
                    DOM.p('このカテゴリーには利用可能なアップグレードがありません')
                ]
            });
            this.upgradeListElement.appendChild(noUpgradesDiv);
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

        // アップグレード情報セクション
        const upgradeInfo = this.createUpgradeInfo(upgrade, currentLevel);
        
        // アップグレード統計セクション  
        const upgradeStats = this.createUpgradeStats(currentLevel, upgrade.maxLevel);
        
        // アップグレードヘッダー
        const upgradeHeader = DOMBuilder.createElement({
            tag: 'div',
            className: 'upgrade-header',
            children: [upgradeInfo, upgradeStats]
        });

        // アップグレードフッター
        const upgradeFooter = this.createUpgradeFooter(upgrade.id, currentCost, canAfford, isMaxLevel);

        const upgradeDiv = DOMBuilder.createElement({
            tag: 'div',
            className: `upgrade-item ${!canAfford || isMaxLevel ? 'disabled' : ''}`,
            children: [upgradeHeader, upgradeFooter]
        });

        return upgradeDiv;
    }

    private createUpgradeInfo(upgrade: UpgradeConfig, currentLevel: number): HTMLElement {
        const effectText = this.getEffectText(upgrade, currentLevel);
        
        return DOMBuilder.createElement({
            tag: 'div',
            className: 'upgrade-info',
            children: [
                DOM.h3(upgrade.name, 'upgrade-name'),
                DOM.p(upgrade.description, 'upgrade-description'),
                DOMBuilder.createElement({
                    tag: 'div',
                    className: 'upgrade-effect',
                    textContent: effectText
                })
            ]
        });
    }

    private createUpgradeStats(currentLevel: number, maxLevel: number): HTMLElement {
        const progressBar = this.createProgressBar(currentLevel, maxLevel);
        
        return DOMBuilder.createElement({
            tag: 'div',
            className: 'upgrade-stats',
            children: [
                DOMBuilder.createElement({
                    tag: 'div',
                    className: 'upgrade-level',
                    textContent: `Lv.${currentLevel}/${maxLevel}`
                }),
                progressBar
            ]
        });
    }

    private createUpgradeFooter(upgradeId: string, cost: number, canAfford: boolean, isMaxLevel: boolean): HTMLElement {
        const costDiv = DOMBuilder.createElement({
            tag: 'div',
            className: 'upgrade-cost',
            textContent: `💰 ${cost}`
        });

        const purchaseButton = DOMBuilder.createElement({
            tag: 'button',
            className: `purchase-button ${!canAfford || isMaxLevel ? 'disabled' : ''}`,
            textContent: isMaxLevel ? '最大レベル' : '購入',
            attributes: { 
                'data-upgrade-id': upgradeId,
                ...((!canAfford || isMaxLevel) && { 'disabled': 'true' })
            },
            onClick: !canAfford || isMaxLevel ? undefined : () => {
                this.purchaseUpgrade(upgradeId);
            }
        });

        return DOMBuilder.createElement({
            tag: 'div',
            className: 'upgrade-footer',
            children: [costDiv, purchaseButton]
        });
    }

    private createProgressBar(current: number, max: number): HTMLElement {
        const percentage = (current / max) * 100;
        
        const progressFill = DOMBuilder.createElement({
            tag: 'div',
            className: 'progress-fill',
            attributes: { style: `width: ${percentage}%` }
        });
        
        return DOMBuilder.createElement({
            tag: 'div',
            className: 'progress-bar',
            children: [progressFill]
        });
    }

    private calculateUpgradeCost(upgrade: UpgradeConfig, currentLevel: number): number {
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
    }

    private getEffectText(upgrade: UpgradeConfig, currentLevel: number): string {
        const nextLevel = currentLevel + 1;
        if (nextLevel > upgrade.maxLevel) {
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

    // React統合メソッド
    private async renderReactComponent(): Promise<void> {
        try {
            // 動的インポートでReactコンポーネントを読み込み
            const { UpgradeShop } = await import('../../components/ui/index.js');
            const { createRoot } = await import('react-dom/client');
            const React = await import('react');

            // React用のコンテナを作成
            if (!this.reactRoot) {
                const reactContainer = document.createElement('div');
                reactContainer.id = 'upgrade-shop-react';
                reactContainer.className = 'upgrade-shop-react';
                
                // 既存のコンテナと置き換え
                this.container.parentNode?.insertBefore(reactContainer, this.container);
                this.container.style.display = 'none'; // DOMBuilder版を非表示
                
                this.reactRoot = createRoot(reactContainer);
            }

            // Reactコンポーネントをレンダリング
            const upgradeShopProps = {
                isVisible: this.isVisible(),
                playerProfile: this.progressManager.getProfile(),
                availableUpgrades: this.upgradeManager.getAvailableUpgrades(),
                onClose: () => this.hide(),
                onPurchase: async (upgradeId: string): Promise<boolean> => {
                    try {
                        const result = this.upgradeManager.purchaseUpgrade(upgradeId);
                        const success = typeof result === 'boolean' ? result : result.success;
                        
                        if (success) {
                            this.showPurchaseSuccess();
                        } else {
                            this.showPurchaseError();
                        }
                        return success;
                    } catch (error) {
                        console.error('Purchase failed:', error);
                        this.showPurchaseError();
                        return false;
                    }
                },
                onCategoryChange: (category: any) => {
                    this.currentCategory = category;
                }
            };

            this.reactRoot.render(React.createElement(UpgradeShop, upgradeShopProps));
        } catch (error) {
            console.warn('React rendering failed, falling back to DOMBuilder:', error);
            this.useReact = false;
            this.renderWithDOMBuilder();
        }
    }

    private renderWithDOMBuilder(): void {
        if (this.container.style.display === 'none') {
            this.container.style.display = '';
        }
        this.updateDisplay();
    }

    public show(): void {
        this.container.classList.remove('hidden');
        
        if (this.useReact) {
            this.renderReactComponent();
        } else {
            this.renderWithDOMBuilder();
        }
    }

    public hide(): void {
        this.container.classList.add('hidden');
        
        // React版も非表示にする
        if (this.reactRoot) {
            const reactContainer = document.getElementById('upgrade-shop-react');
            if (reactContainer) {
                reactContainer.classList.add('hidden');
            }
        }
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
