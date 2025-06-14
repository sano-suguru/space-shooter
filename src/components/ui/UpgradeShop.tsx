import React, { useState, useMemo, useCallback } from 'react';

import { UpgradeShopProps, UpgradeCategory } from '../../types/react/index';

import { Button } from './Button';
import { Card } from './Card';
import { CategoryTabs } from './CategoryTabs';
import { PlayerStats } from './PlayerStats';
import { UpgradeItem } from './UpgradeItem';

/**
 * アップグレードショップメインコンポーネント
 * プレイヤーがアップグレードを購入できるショップUI
 */
export const UpgradeShop: React.FC<UpgradeShopProps> = ({
  isVisible,
  playerProfile,
  availableUpgrades,
  onClose,
  onPurchase,
  onCategoryChange,
  className = '',
  style,
  testId = 'upgrade-shop',
  ...props
}) => {
  const [currentCategory, setCurrentCategory] =
    useState<UpgradeCategory>('weapon');
  const [purchaseInProgress, setPurchaseInProgress] = useState<string | null>(
    null
  );

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
    [onCategoryChange]
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
    [onPurchase, purchaseInProgress]
  );

  // ショップが非表示の場合は何も表示しない
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
      {...props}
    >
      <Card className='upgrade-shop-container' size='large'>
        {/* ショップヘッダー */}
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

          {/* プレイヤー統計 */}
          <PlayerStats profile={playerProfile} className='shop-player-stats' />
        </div>

        {/* カテゴリータブ */}
        <CategoryTabs
          currentCategory={currentCategory}
          onCategoryChange={handleCategoryChange}
          categories={categories}
          className='shop-categories'
        />

        {/* アップグレードリスト */}
        <div className='upgrade-list' data-testid='upgrade-list'>
          {filteredUpgrades.length === 0 ? (
            <div className='no-upgrades'>
              <p>このカテゴリーには利用可能なアップグレードがありません</p>
            </div>
          ) : (
            filteredUpgrades.map(upgrade => {
              const currentLevel =
                playerProfile.equippedUpgrades[upgrade.id] || 0;
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

        {/* フッター（必要に応じて） */}
        <div className='upgrade-shop-footer'>
          <p className='shop-hint'>
            💡 アップグレードはゲーム中に即座に適用されます
          </p>
        </div>
      </Card>
    </div>
  );
};

export default UpgradeShop;
