import React, { useState, useMemo, useCallback } from 'react';

import { PlayerProfile } from '../../progression/types/PlayerProfile';
import { UpgradeConfig } from '../../progression/types/Upgrade';
import { UpgradeShopProps, UpgradeCategory } from '../../types/react/index';

import { Button } from './Button';
import { Card } from './Card';
import { CategoryTabs } from './CategoryTabs';
import { PlayerStats } from './PlayerStats';
import { UpgradeItem } from './UpgradeItem';
import { WeaponShopSection } from './WeaponShopSection';

/**
 * アップグレードショップメインコンポーネント
 * プレイヤーがアップグレードを購入できるショップUI
 */
export const UpgradeShop: React.FC<UpgradeShopProps> = props => {
  const {
    isVisible,
    playerProfile,
    availableUpgrades,
    onClose,
    onPurchase,
    onCategoryChange,
    weaponManager,
    className = '',
    style,
    testId = 'upgrade-shop',
    ...restProps
  } = props;

  const [currentCategory, setCurrentCategory] =
    useState<UpgradeCategory>('weapon');
  const [purchaseInProgress, setPurchaseInProgress] = useState<string | null>(
    null
  );

  const { categories, filteredUpgrades, handleCategoryChange, handlePurchase } =
    useUpgradeShopLogic(
      availableUpgrades,
      currentCategory,
      setCurrentCategory,
      onCategoryChange,
      onPurchase,
      purchaseInProgress,
      setPurchaseInProgress
    );

  if (!isVisible) {
    console.log('🛒 UpgradeShop not visible, returning null');
    return null;
  }

  console.log('🛒 UpgradeShop rendering with:', {
    isVisible,
    currentCategory,
    filteredUpgrades: filteredUpgrades.length,
    availableUpgrades: availableUpgrades.length,
    playerProfile: { coins: playerProfile.coins, level: playerProfile.level },
  });

  return (
    <div
      className={`upgrade-shop ${className}`}
      style={style}
      data-testid={testId}
      {...restProps}
    >
      <Card className='upgrade-shop-container' size='large'>
        <UpgradeShopHeader playerProfile={playerProfile} onClose={onClose} />
        <CategoryTabs
          currentCategory={currentCategory}
          onCategoryChange={handleCategoryChange}
          categories={categories}
          className='shop-categories'
        />
        {currentCategory === 'weapon' && weaponManager ? (
          <WeaponShopSection
            playerProfile={playerProfile}
            availableWeapons={weaponManager.getAvailableWeapons()}
            ownedWeapons={weaponManager.getOwnedWeapons()}
            equippedWeapons={weaponManager.getEquippedWeapons()}
            onPurchase={async (weaponId: string) => {
              const result = await weaponManager.purchaseWeapon(weaponId);
              return result.success;
            }}
            onEquip={(weaponId: string, slot: number) => {
              const result = weaponManager.equipWeapon(weaponId, slot);
              return Promise.resolve(result.success);
            }}
            onUnequip={(weaponId: string) => {
              // weaponIdから対応するslotを見つける
              const equippedWeapons = weaponManager.getEquippedWeapons();
              const weapon = equippedWeapons.find(w => w.weaponId === weaponId);
              if (!weapon) return Promise.resolve(false);

              const result = weaponManager.unequipWeapon(weapon.slot);
              return Promise.resolve(result.success);
            }}
          />
        ) : (
          <UpgradeList
            filteredUpgrades={filteredUpgrades}
            playerProfile={playerProfile}
            handlePurchase={handlePurchase}
            purchaseInProgress={purchaseInProgress}
          />
        )}
        <UpgradeShopFooter />
      </Card>
    </div>
  );
};

/**
 * アップグレードショップのロジックを管理するカスタムフック
 */
const useUpgradeShopLogic = (
  availableUpgrades: UpgradeConfig[],
  currentCategory: UpgradeCategory,
  setCurrentCategory: React.Dispatch<React.SetStateAction<UpgradeCategory>>,
  onCategoryChange: ((category: UpgradeCategory) => void) | undefined,
  onPurchase: (upgradeId: string) => Promise<boolean>,
  purchaseInProgress: string | null,
  setPurchaseInProgress: React.Dispatch<React.SetStateAction<string | null>>
): {
  categories: { id: UpgradeCategory; name: string; icon: string }[];
  filteredUpgrades: UpgradeConfig[];
  handleCategoryChange: (category: UpgradeCategory) => void;
  handlePurchase: (upgradeId: string) => Promise<void>;
} => {
  // カテゴリ定義
  const categories = useMemo(
    () => [
      { id: 'weapon' as UpgradeCategory, name: '武器', icon: '⚔️' },
      { id: 'defense' as UpgradeCategory, name: '防御', icon: '🛡️' },
      { id: 'utility' as UpgradeCategory, name: '特殊', icon: '⚡' },
    ],
    []
  );

  // 現在のカテゴリのアップグレードをフィルタリング
  const filteredUpgrades = useMemo(() => {
    return availableUpgrades.filter(
      upgrade => upgrade.category === currentCategory
    );
  }, [availableUpgrades, currentCategory]);

  // カテゴリ変更ハンドラ
  const handleCategoryChange = useCallback(
    (category: UpgradeCategory) => {
      setCurrentCategory(category);
      onCategoryChange?.(category);
    },
    [onCategoryChange, setCurrentCategory]
  );

  // アップグレード購入ハンドラ
  const handlePurchase = useCallback(
    async (upgradeId: string) => {
      if (purchaseInProgress) return;

      setPurchaseInProgress(upgradeId);
      try {
        await onPurchase(upgradeId);
      } finally {
        setPurchaseInProgress(null);
      }
    },
    [onPurchase, purchaseInProgress, setPurchaseInProgress]
  );

  return {
    categories,
    filteredUpgrades,
    handleCategoryChange,
    handlePurchase,
  };
};

/**
 * ショップヘッダーコンポーネント
 */
const UpgradeShopHeader: React.FC<{
  playerProfile: PlayerProfile;
  onClose: () => void;
}> = ({ playerProfile, onClose }) => (
  <div className='upgrade-shop-header'>
    <div className='shop-title'>
      <h2>🛠️ アップグレードショップ</h2>
      <Button
        variant='secondary'
        size='small'
        onClick={onClose}
        className='close-button'
        data-testid='close-shop-button'
      >
        ×
      </Button>
    </div>
    <PlayerStats profile={playerProfile} className='shop-player-stats' />
  </div>
);

/**
 * アップグレードリストコンポーネント
 */
const UpgradeList: React.FC<{
  filteredUpgrades: UpgradeConfig[];
  playerProfile: PlayerProfile;
  handlePurchase: (upgradeId: string) => Promise<void>;
  purchaseInProgress: string | null;
}> = ({
  filteredUpgrades,
  playerProfile,
  handlePurchase,
  purchaseInProgress,
}) => (
  <div className='upgrade-list' data-testid='upgrade-list'>
    {filteredUpgrades.length === 0 ? (
      <div className='no-upgrades'>
        <p>このカテゴリーには利用可能なアップグレードがありません</p>
      </div>
    ) : (
      filteredUpgrades.map(upgrade => {
        const currentLevel = playerProfile.equippedUpgrades[upgrade.id] ?? 0;
        return (
          <UpgradeItem
            key={upgrade.id}
            upgrade={upgrade}
            currentLevel={currentLevel}
            playerProfile={playerProfile}
            onPurchase={(upgradeId: string) => {
              handlePurchase(upgradeId).catch(console.error);
            }}
            disabled={purchaseInProgress === upgrade.id}
            className='shop-upgrade-item'
          />
        );
      })
    )}
  </div>
);

/**
 * ショップフッターコンポーネント
 */
const UpgradeShopFooter: React.FC = () => (
  <div className='upgrade-shop-footer'>
    <p className='shop-hint'>💡 アップグレードはゲーム中に即座に適用されます</p>
  </div>
);

export default UpgradeShop;
