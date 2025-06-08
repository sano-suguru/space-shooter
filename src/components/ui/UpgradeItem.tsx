import React, { useMemo } from 'react';
import { UpgradeItemProps } from '../../types/react/index';
import { Card } from './Card';
import { Button } from './Button';
import { ProgressBar } from './ProgressBar';

/**
 * アップグレードアイテムコンポーネント
 * 個々のアップグレードの詳細情報と購入機能を提供
 */
export const UpgradeItem: React.FC<UpgradeItemProps> = ({
  upgrade,
  currentLevel,
  playerProfile,
  onPurchase,
  disabled = false,
  className = '',
  style,
  testId = 'upgrade-item',
  ...props
}) => {
  // アップグレードコストを計算
  const upgradeCost = useMemo(() => {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
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
    if (isMaxLevel) return 'info';
    if (!canAfford) return 'error';
    return 'success';
  }, [isMaxLevel, canAfford]);

  const handlePurchase = () => {
    if (canPurchase) {
      onPurchase(upgrade.id);
    }
  };

  return (
    <Card
      className={`upgrade-item ${!canPurchase ? 'disabled' : ''} ${className}`}
      style={style}
      data-testid={testId}
      hoverable={canPurchase}
      {...props}
    >
      <div className="upgrade-header">
        {/* アップグレード情報セクション */}
        <div className="upgrade-info">
          <div className="upgrade-title">
            {upgrade.icon && (
              <span className="upgrade-icon">{upgrade.icon}</span>
            )}
            <h3 className="upgrade-name">{upgrade.name}</h3>
          </div>
          <p className="upgrade-description">{upgrade.description}</p>
          <div className="upgrade-effect">{effectText}</div>
        </div>

        {/* アップグレード統計セクション */}
        <div className="upgrade-stats">
          <div className="upgrade-level">
            Lv.{currentLevel}/{upgrade.maxLevel}
          </div>
          <ProgressBar
            current={currentLevel}
            max={upgrade.maxLevel}
            color={isMaxLevel ? '#10b981' : '#3b82f6'}
            className="upgrade-progress"
            showPercentage={false}
          />
        </div>
      </div>

      {/* アップグレードフッター */}
      <div className="upgrade-footer">
        <div className="upgrade-cost">
          <span className="cost-icon">💰</span>
          <span className="cost-value">{upgradeCost.toLocaleString()}</span>
        </div>
        
        <Button
          variant={purchaseButtonVariant}
          size="medium"
          onClick={handlePurchase}
          disabled={!canPurchase}
          loading={false}
          className="purchase-button"
          data-testid={`purchase-button-${upgrade.id}`}
        >
          {purchaseButtonText}
        </Button>
      </div>
    </Card>
  );
};

export default UpgradeItem;
