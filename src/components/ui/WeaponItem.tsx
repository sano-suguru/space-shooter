/**
 * 武器アイテムコンポーネント
 *
 * 武器ショップで表示される個別の武器アイテム
 */

import React from 'react';

import { PlayerProfile } from '../../progression/types/PlayerProfile';
import {
  WeaponConfig,
  WEAPON_RARITY_CONFIG,
} from '../../weapons/types/WeaponTypes';

import { Button } from './Button';
import { Card } from './Card';

export interface WeaponItemProps {
  weapon: WeaponConfig;
  playerProfile: PlayerProfile;
  isOwned: boolean;
  isEquipped: boolean;
  equippedSlot?: number;
  onPurchase: (weaponId: string) => void;
  onEquip: (weaponId: string, slot: number) => void;
  onUnequip: (weaponId: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * 武器アイテムコンポーネント
 */
export const WeaponItem: React.FC<WeaponItemProps> = ({
  weapon,
  playerProfile,
  isOwned,
  isEquipped,
  equippedSlot,
  onPurchase,
  onEquip,
  onUnequip,
  disabled = false,
  className = '',
}) => {
  const rarityConfig = WEAPON_RARITY_CONFIG[weapon.rarity];
  const canAfford = playerProfile.coins >= weapon.cost;
  const isUnlocked = weapon.unlockCondition(playerProfile);

  const handlePurchase = () => {
    if (!disabled && !isOwned && canAfford && isUnlocked) {
      onPurchase(weapon.id);
    }
  };

  const handleEquip = () => {
    if (!disabled && isOwned && !isEquipped) {
      // 空いているスロットを探す（簡単な実装）
      const availableSlot = 0; // 実際にはスロット管理が必要
      onEquip(weapon.id, availableSlot);
    }
  };

  const handleUnequip = () => {
    if (!disabled && isEquipped) {
      onUnequip(weapon.id);
    }
  };

  const getActionButton = () => {
    if (!isUnlocked) {
      return (
        <Button variant='secondary' size='small' disabled>
          🔒 未解除
        </Button>
      );
    }

    if (!isOwned) {
      return (
        <Button
          variant={canAfford ? 'primary' : 'secondary'}
          size='small'
          onClick={handlePurchase}
          disabled={disabled || !canAfford}
        >
          {canAfford ? `💰 ${weapon.cost}` : `💸 ${weapon.cost}`}
        </Button>
      );
    }

    if (isEquipped) {
      return (
        <Button
          variant='secondary'
          size='small'
          onClick={handleUnequip}
          disabled={disabled}
        >
          ✅ 装備中 (スロット {equippedSlot})
        </Button>
      );
    }

    return (
      <Button
        variant='primary'
        size='small'
        onClick={handleEquip}
        disabled={disabled}
      >
        🎯 装備
      </Button>
    );
  };

  return (
    <Card
      className={`weapon-item ${className}`}
      style={{
        borderColor: rarityConfig.color,
        boxShadow: `0 0 10px ${rarityConfig.glowColor}33`,
      }}
    >
      <div className='weapon-item-header'>
        <div className='weapon-icon-container'>
          <span className='weapon-icon' style={{ fontSize: '2rem' }}>
            {weapon.icon}
          </span>
          <div
            className='weapon-rarity-badge'
            style={{
              backgroundColor: rarityConfig.color,
              color: '#000',
            }}
          >
            {rarityConfig.name}
          </div>
        </div>
        <div className='weapon-info'>
          <h3 className='weapon-name' style={{ color: rarityConfig.color }}>
            {weapon.name}
          </h3>
          <p className='weapon-description'>{weapon.description}</p>
        </div>
      </div>

      <div className='weapon-stats'>
        <div className='weapon-stat'>
          <span className='stat-label'>💥 ダメージ:</span>
          <span className='stat-value'>{weapon.damage}</span>
        </div>
        <div className='weapon-stat'>
          <span className='stat-label'>⚡ 発射間隔:</span>
          <span className='stat-value'>{weapon.fireRate}ms</span>
        </div>
        <div className='weapon-stat'>
          <span className='stat-label'>🚀 弾速:</span>
          <span className='stat-value'>{weapon.bulletSpeed}</span>
        </div>
        <div className='weapon-stat'>
          <span className='stat-label'>🎯 弾数:</span>
          <span className='stat-value'>{weapon.bulletCount}</span>
        </div>
        {weapon.specialEffect && (
          <div className='weapon-stat special-effect'>
            <span className='stat-label'>✨ 特殊効果:</span>
            <span className='stat-value'>
              {getSpecialEffectName(weapon.specialEffect.type)}
            </span>
          </div>
        )}
      </div>

      <div className='weapon-item-footer'>
        {getActionButton()}
        {!isUnlocked && (
          <div className='unlock-condition'>
            <small>解除条件: {getUnlockConditionText(weapon)}</small>
          </div>
        )}
      </div>
    </Card>
  );
};

/**
 * 特殊効果名を取得
 */
function getSpecialEffectName(effectType: string): string {
  switch (effectType) {
    case 'explosive':
      return '💥 爆発';
    case 'homing':
      return '🎯 追尾';
    case 'split':
      return '🎆 分裂';
    case 'piercing':
      return '⚡ 貫通';
    case 'freeze':
      return '❄️ 凍結';
    case 'chain':
      return '⚡ 連鎖';
    case 'bounce':
      return '🏀 反射';
    default:
      return '✨ 特殊';
  }
}

/**
 * 解除条件テキストを取得
 */
function getUnlockConditionText(weapon: WeaponConfig): string {
  // 簡単な実装（実際にはより詳細な条件表示が必要）
  switch (weapon.id) {
    case 'plasma_cannon':
      return 'レベル3到達';
    case 'rapid_fire':
      return 'レベル2到達';
    case 'energy_beam':
      return 'レベル5到達';
    case 'explosive_rounds':
      return '敵100体撃破';
    case 'homing_missiles':
      return 'ボス3体撃破';
    case 'split_shot':
      return 'ウェーブ10到達';
    case 'missile_launcher':
      return 'レベル7到達';
    case 'omega_destroyer':
      return 'ボス10体撃破 & スコア50,000';
    case 'quantum_rifle':
      return 'ウェーブ20到達 & レベル15';
    default:
      return '条件を満たす';
  }
}

export default WeaponItem;
