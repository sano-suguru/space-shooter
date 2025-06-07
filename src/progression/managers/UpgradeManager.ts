import { EventEmitter } from '../../events/EventEmitter';
import { EventMap } from '../../events/EventType';
import { PlayerProfile } from '../types/PlayerProfile';
import { UpgradeConfig, UpgradeEffect, EquippedUpgrade, UpgradePurchaseResult } from '../types/Upgrade';
import { 
    UPGRADE_CONFIGS, 
    getUpgradeConfig, 
    getUpgradesByCategory, 
    getAvailableUpgrades,
    calculateUpgradeCost,
    isUpgradeUnlocked 
} from '../data/upgrades';

/**
 * アップグレードシステムを管理するマネージャークラス
 * プレイヤーのアップグレード購入、装備、効果適用を担当
 */
export class UpgradeManager {
    private currentProfile: PlayerProfile;
    private equippedUpgrades: Map<string, EquippedUpgrade> = new Map();
    private totalEffect: UpgradeEffect = {};

    constructor(
        private eventEmitter: EventEmitter<EventMap>,
        initialProfile: PlayerProfile
    ) {
        this.currentProfile = initialProfile;
        this.recalculateEquippedUpgrades();
    }

    /**
     * プレイヤープロフィールを更新
     */
    updateProfile(profile: PlayerProfile): void {
        this.currentProfile = profile;
        this.recalculateEquippedUpgrades();
    }

    /**
     * アップグレードを購入する
     */
    purchaseUpgrade(upgradeId: string): UpgradePurchaseResult {
        const config = getUpgradeConfig(upgradeId);
        if (!config) {
            return {
                success: false,
                reason: 'unknown_upgrade'
            };
        }

        // 解除条件チェック
        if (!isUpgradeUnlocked(upgradeId, this.currentProfile)) {
            return {
                success: false,
                reason: 'not_unlocked'
            };
        }

        // 現在のレベルを取得
        const currentLevel = this.currentProfile.equippedUpgrades[upgradeId] || 0;

        // 最大レベルチェック
        if (currentLevel >= config.maxLevel) {
            return {
                success: false,
                reason: 'max_level_reached'
            };
        }

        // コスト計算
        const cost = calculateUpgradeCost(config, currentLevel);

        // 所持コインチェック
        if (this.currentProfile.coins < cost) {
            return {
                success: false,
                reason: 'insufficient_funds'
            };
        }

        // 購入処理実行
        const newLevel = currentLevel + 1;
        this.currentProfile.equippedUpgrades[upgradeId] = newLevel;
        this.currentProfile.coins -= cost;

        // アップグレードが初回解除の場合、解除リストに追加
        if (currentLevel === 0) {
            this.currentProfile.unlockedUpgrades.push(upgradeId);
        }

        // 装備中アップグレードの再計算
        this.recalculateEquippedUpgrades();

        // イベント発火
        this.eventEmitter.emit('upgradeApplied', upgradeId, newLevel);
        this.eventEmitter.emit('profileUpdated');

        return {
            success: true,
            newLevel,
            costPaid: cost,
            remainingCoins: this.currentProfile.coins
        };
    }

    /**
     * 装備中のアップグレードを再計算
     */
    private recalculateEquippedUpgrades(): void {
        this.equippedUpgrades.clear();
        this.totalEffect = {};

        // 装備中の各アップグレードを処理
        for (const [upgradeId, level] of Object.entries(this.currentProfile.equippedUpgrades)) {
            if (level > 0) {
                const config = getUpgradeConfig(upgradeId);
                if (config) {
                    const effect = config.effect(level);
                    const equippedUpgrade: EquippedUpgrade = {
                        upgradeId,
                        level,
                        effect
                    };
                    this.equippedUpgrades.set(upgradeId, equippedUpgrade);
                    
                    // 総合効果に加算
                    this.addEffectToTotal(effect);
                }
            }
        }
    }

    /**
     * 効果を総合効果に加算
     */
    private addEffectToTotal(effect: UpgradeEffect): void {
        for (const [key, value] of Object.entries(effect)) {
            if (typeof value === 'number') {
                const currentValue = (this.totalEffect as any)[key] || (
                    key.endsWith('Multiplier') ? 1 : 0
                );
                
                if (key.endsWith('Multiplier')) {
                    // 倍率系は乗算
                    (this.totalEffect as any)[key] = currentValue * value;
                } else {
                    // その他は加算
                    (this.totalEffect as any)[key] = currentValue + value;
                }
            }
        }
    }

    /**
     * 現在の総合アップグレード効果を取得
     */
    getTotalEffect(): UpgradeEffect {
        return { ...this.totalEffect };
    }

    /**
     * 特定のアップグレードの現在レベルを取得
     */
    getUpgradeLevel(upgradeId: string): number {
        return this.currentProfile.equippedUpgrades[upgradeId] || 0;
    }

    /**
     * 特定のアップグレードの次レベルコストを取得
     */
    getUpgradeCost(upgradeId: string): number {
        const config = getUpgradeConfig(upgradeId);
        if (!config) return 0;
        
        const currentLevel = this.getUpgradeLevel(upgradeId);
        return calculateUpgradeCost(config, currentLevel);
    }

    /**
     * プレイヤーが利用可能なアップグレード一覧を取得
     */
    getAvailableUpgrades(): UpgradeConfig[] {
        return getAvailableUpgrades(this.currentProfile);
    }

    /**
     * カテゴリ別の利用可能なアップグレードを取得
     */
    getAvailableUpgradesByCategory(category: 'weapon' | 'defense' | 'utility'): UpgradeConfig[] {
        const categoryUpgrades = getUpgradesByCategory(category);
        return categoryUpgrades.filter(config => 
            isUpgradeUnlocked(config.id, this.currentProfile)
        );
    }

    /**
     * 装備中のアップグレード一覧を取得
     */
    getEquippedUpgrades(): EquippedUpgrade[] {
        return Array.from(this.equippedUpgrades.values());
    }

    /**
     * アップグレードが購入可能かチェック
     */
    canPurchaseUpgrade(upgradeId: string): boolean {
        const config = getUpgradeConfig(upgradeId);
        if (!config) return false;

        const currentLevel = this.getUpgradeLevel(upgradeId);
        const cost = calculateUpgradeCost(config, currentLevel);

        return isUpgradeUnlocked(upgradeId, this.currentProfile) &&
               currentLevel < config.maxLevel &&
               this.currentProfile.coins >= cost;
    }

    /**
     * 全アップグレード設定を取得
     */
    getAllUpgradeConfigs(): UpgradeConfig[] {
        return [...UPGRADE_CONFIGS];
    }

    /**
     * アップグレード統計情報を取得
     */
    getUpgradeStats(): {
        totalUpgradesOwned: number;
        totalUpgradesAvailable: number;
        totalCoinsSpent: number;
        averageUpgradeLevel: number;
    } {
        const ownedUpgrades = Object.values(this.currentProfile.equippedUpgrades);
        const totalUpgradesOwned = ownedUpgrades.filter(level => level > 0).length;
        const totalUpgradesAvailable = this.getAvailableUpgrades().length;
        
        // 総コスト計算（概算）
        let totalCoinsSpent = 0;
        for (const [upgradeId, level] of Object.entries(this.currentProfile.equippedUpgrades)) {
            if (level > 0) {
                const config = getUpgradeConfig(upgradeId);
                if (config) {
                    for (let i = 0; i < level; i++) {
                        totalCoinsSpent += calculateUpgradeCost(config, i);
                    }
                }
            }
        }

        const totalLevels = ownedUpgrades.reduce((sum, level) => sum + level, 0);
        const averageUpgradeLevel = totalUpgradesOwned > 0 ? totalLevels / totalUpgradesOwned : 0;

        return {
            totalUpgradesOwned,
            totalUpgradesAvailable,
            totalCoinsSpent,
            averageUpgradeLevel: Math.round(averageUpgradeLevel * 100) / 100
        };
    }

    /**
     * 特定のアップグレード効果値を取得（デバッグ用）
     */
    getEffectValue<K extends keyof UpgradeEffect>(effectType: K): UpgradeEffect[K] | undefined {
        return this.totalEffect[effectType];
    }

    /**
     * アップグレードシステムをリセット（テスト用）
     */
    reset(): void {
        this.equippedUpgrades.clear();
        this.totalEffect = {};
    }
}
