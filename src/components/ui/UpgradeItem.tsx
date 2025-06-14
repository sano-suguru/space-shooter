import React, { useMemo } from 'react';

import { PlayerProfile } from '../../progression/types/PlayerProfile';
import { UpgradeConfig } from '../../progression/types/Upgrade';
import { UpgradeItemProps } from '../../types/react/index';

import { Button } from './Button';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';

/**
 * アップグレードアイテムコンポーネント
 * 個々のアップグレードの詳細情報と購入機能を提供
 */
export const UpgradeItem: React.FC<UpgradeItemProps> = props => {
  const {
    upgrade,
    currentLevel,
    playerProfile,
    onPurchase,
    disabled = false,
    className = '',
    style,
    testId = 'upgrade-item',
    ...restProps
  } = props;

  const {
    upgradeCost,
    canPurchase,
    isMaxLevel,
    effectText,
    purchaseButtonText,
    purchaseButtonVariant,
    handlePurchase,
  } = useUpgradeItemLogic(
    upgrade,
    currentLevel,
    playerProfile,
    onPurchase,
    disabled
  );

  return (
    <Card
      className={`upgrade-item ${!canPurchase ? 'disabled' : ''} ${className}`}
      style={style}
      data-testid={testId}
      hoverable={canPurchase}
      {...restProps}
    >
      <UpgradeHeader
        upgrade={upgrade}
        currentLevel={currentLevel}
        effectText={effectText}
        isMaxLevel={isMaxLevel}
      />
      <UpgradeFooter
        upgradeCost={upgradeCost}
        purchaseButtonText={purchaseButtonText}
        purchaseButtonVariant={purchaseButtonVariant}
        canPurchase={canPurchase}
        handlePurchase={handlePurchase}
        upgradeId={upgrade.id}
      />
    </Card>
  );
};

/**
 * アップグレードアイテムのロジックを管理するカスタムフック
 */
const useUpgradeItemLogic = (
  upgrade: UpgradeConfig,
  currentLevel: number,
  playerProfile: PlayerProfile,
  onPurchase: (upgradeId: string) => void,
  disabled: boolean
): {
  upgradeCost: number;
  canPurchase: boolean;
  isMaxLevel: boolean;
  effectText: string;
  purchaseButtonText: string;
  purchaseButtonVariant: 'info' | 'error' | 'success';
  handlePurchase: () => void;
} => {
  // アップグレードコストを計算
  const upgradeCost = useMemo(() => {
    return Math.floor(
      upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel)
    );
  }, [upgrade.baseCost, upgrade.costMultiplier, currentLevel]);

  // 購入可能かチェック
  const canAfford = playerProfile.coins >= upgradeCost;
  const isMaxLevel = currentLevel >= upgrade.maxLevel;
  const canPurchase = canAfford && !isMaxLevel && !disabled;

  // 効果テキストを生成
  const effectText = useMemo(() => {
    const nextLevel = currentLevel + 1;
    if (nextLevel > upgrade.maxLevel) {
      return '最大レベル到達';
    }
    return `レベル ${currentLevel} → ${nextLevel}`;
  }, [currentLevel, upgrade.maxLevel]);

  // 購入ボタンのテキストを決定
  const purchaseButtonText = useMemo(() => {
    if (isMaxLevel) return '最大レベル';
    if (!canAfford) return '資金不足';
    return '購入';
  }, [isMaxLevel, canAfford]);

  // 購入ボタンのバリアントを決定
  const purchaseButtonVariant = useMemo(() => {
    if (isMaxLevel) return 'info' as const;
    if (!canAfford) return 'error' as const;
    return 'success' as const;
  }, [isMaxLevel, canAfford]);

  const handlePurchase = (): void => {
    if (canPurchase) {
      onPurchase(upgrade.id);
    }
  };

  return {
    upgradeCost,
    canPurchase,
    isMaxLevel,
    effectText,
    purchaseButtonText,
    purchaseButtonVariant,
    handlePurchase,
  };
};

/**
 * アップグレードヘッダーコンポーネント
 */
const UpgradeHeader: React.FC<{
  upgrade: UpgradeConfig;
  currentLevel: number;
  effectText: string;
  isMaxLevel: boolean;
}> = ({ upgrade, currentLevel, effectText, isMaxLevel }) => (
  <div className='upgrade-header'>
    <div className='upgrade-info'>
      <div className='upgrade-title'>
        {upgrade.icon && <span className='upgrade-icon'>{upgrade.icon}</span>}
        <h3 className='upgrade-name'>{upgrade.name}</h3>
      </div>
      <p className='upgrade-description'>{upgrade.description}</p>
      <div className='upgrade-effect'>{effectText}</div>
    </div>
    <div className='upgrade-stats'>
      <div className='upgrade-level'>
        Lv.{currentLevel}/{upgrade.maxLevel}
      </div>
      <ProgressBar
        current={currentLevel}
        max={upgrade.maxLevel}
        color={isMaxLevel ? '#10b981' : '#3b82f6'}
        className='upgrade-progress'
        showPercentage={false}
      />
    </div>
  </div>
);

/**
 * アップグレードフッターコンポーネント
 */
const UpgradeFooter: React.FC<{
  upgradeCost: number;
  purchaseButtonText: string;
  purchaseButtonVariant: string;
  canPurchase: boolean;
  handlePurchase: () => void;
  upgradeId: string;
}> = ({
  upgradeCost,
  purchaseButtonText,
  purchaseButtonVariant: _purchaseButtonVariant,
  canPurchase,
  handlePurchase,
  upgradeId,
}) => (
  <div className='upgrade-footer'>
    <div className='upgrade-cost'>
      <span className='cost-icon'>💰</span>
      <span className='cost-value'>{upgradeCost.toLocaleString()}</span>
    </div>
    <Button
      // variant={purchaseButtonVariant}
      size='medium'
      onClick={handlePurchase}
      disabled={!canPurchase}
      loading={false}
      className='purchase-button'
      data-testid={`purchase-button-${upgradeId}`}
    >
      {purchaseButtonText}
    </Button>
  </div>
);

export default UpgradeItem;
