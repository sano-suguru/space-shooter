/**
 * 武器ショップセクションコンポーネント
 *
 * アップグレードショップ内の武器専用セクション
 */

import React, { useState, useMemo } from 'react';

import { PlayerProfile } from '../../progression/types/PlayerProfile';
import { WEAPON_CATEGORIES } from '../../weapons/data/weaponConfigs';
import { WeaponConfig, EquippedWeapon } from '../../weapons/types/WeaponTypes';

import { Button } from './Button';
import { Card } from './Card';
import { WeaponItem } from './WeaponItem';

export interface WeaponShopSectionProps {
  playerProfile: PlayerProfile;
  availableWeapons: WeaponConfig[];
  ownedWeapons: string[];
  equippedWeapons: EquippedWeapon[];
  onPurchase: (weaponId: string) => Promise<boolean>;
  onEquip: (weaponId: string, slot: number) => Promise<boolean>;
  onUnequip: (weaponId: string) => Promise<boolean>;
  className?: string;
}

/**
 * 武器ショップセクションコンポーネント
 */
export const WeaponShopSection: React.FC<WeaponShopSectionProps> = ({
  playerProfile,
  availableWeapons,
  ownedWeapons,
  equippedWeapons,
  onPurchase,
  onEquip,
  onUnequip,
  className = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('basic');
  const [purchaseInProgress, setPurchaseInProgress] = useState<string | null>(
    null
  );

  // カテゴリ別武器フィルタリング
  const filteredWeapons = useMemo(() => {
    const category = WEAPON_CATEGORIES.find(cat => cat.id === selectedCategory);
    return category ? category.weapons : [];
  }, [selectedCategory]);

  // 武器の状態を取得
  const getWeaponStatus = (weaponId: string) => {
    const isOwned = ownedWeapons.includes(weaponId);
    const equippedWeapon = equippedWeapons.find(w => w.weaponId === weaponId);
    const isEquipped = !!equippedWeapon;
    const equippedSlot = equippedWeapon?.slot;

    return { isOwned, isEquipped, equippedSlot };
  };

  // 武器購入ハンドラ
  const handlePurchase = async (weaponId: string) => {
    if (purchaseInProgress) return;

    setPurchaseInProgress(weaponId);
    try {
      await onPurchase(weaponId);
    } finally {
      setPurchaseInProgress(null);
    }
  };

  // 武器装備ハンドラ
  const handleEquip = async (weaponId: string, slot: number) => {
    if (purchaseInProgress) return;

    setPurchaseInProgress(weaponId);
    try {
      await onEquip(weaponId, slot);
    } finally {
      setPurchaseInProgress(null);
    }
  };

  // 武器取り外しハンドラ
  const handleUnequip = async (weaponId: string) => {
    if (purchaseInProgress) return;

    setPurchaseInProgress(weaponId);
    try {
      await onUnequip(weaponId);
    } finally {
      setPurchaseInProgress(null);
    }
  };

  return (
    <div className={`weapon-shop-section ${className}`}>
      {/* 装備中武器表示 */}
      <Card className='equipped-weapons-display'>
        <h3>🎯 装備中の武器</h3>
        <div className='equipped-weapons-grid'>
          {[0, 1, 2].map(slot => {
            const equippedWeapon = equippedWeapons.find(w => w.slot === slot);
            return (
              <div key={slot} className='weapon-slot'>
                <div className='slot-header'>スロット {slot + 1}</div>
                {equippedWeapon ? (
                  <div className='equipped-weapon-info'>
                    <span className='weapon-icon'>
                      {equippedWeapon.config.icon}
                    </span>
                    <div className='weapon-details'>
                      <div className='weapon-name'>
                        {equippedWeapon.config.name}
                      </div>
                      <div className='weapon-level'>
                        Lv.{equippedWeapon.level}
                      </div>
                    </div>
                    <Button
                      variant='secondary'
                      size='small'
                      onClick={() => {
                        handleUnequip(equippedWeapon.weaponId).catch(
                          console.error
                        );
                      }}
                      disabled={purchaseInProgress === equippedWeapon.weaponId}
                    >
                      取り外し
                    </Button>
                  </div>
                ) : (
                  <div className='empty-slot'>
                    <span className='empty-icon'>➕</span>
                    <div className='empty-text'>空きスロット</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* 武器カテゴリタブ */}
      <div className='weapon-category-tabs'>
        {WEAPON_CATEGORIES.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'primary' : 'secondary'}
            onClick={() => setSelectedCategory(category.id)}
            className='category-tab'
          >
            {category.icon} {category.name}
          </Button>
        ))}
      </div>

      {/* 武器一覧 */}
      <div className='weapons-grid'>
        {filteredWeapons.length === 0 ? (
          <div className='no-weapons'>
            <p>このカテゴリには武器がありません</p>
          </div>
        ) : (
          filteredWeapons.map(weapon => {
            const { isOwned, isEquipped, equippedSlot } = getWeaponStatus(
              weapon.id
            );
            return (
              <WeaponItem
                key={weapon.id}
                weapon={weapon}
                playerProfile={playerProfile}
                isOwned={isOwned}
                isEquipped={isEquipped}
                equippedSlot={equippedSlot}
                onPurchase={(weaponId: string) => {
                  handlePurchase(weaponId).catch(console.error);
                }}
                onEquip={(weaponId: string, slot: number) => {
                  handleEquip(weaponId, slot).catch(console.error);
                }}
                onUnequip={(weaponId: string) => {
                  handleUnequip(weaponId).catch(console.error);
                }}
                disabled={purchaseInProgress === weapon.id}
                className='shop-weapon-item'
              />
            );
          })
        )}
      </div>

      {/* 武器ショップフッター */}
      <div className='weapon-shop-footer'>
        <div className='shop-stats'>
          <div className='stat-item'>
            <span className='stat-label'>所有武器:</span>
            <span className='stat-value'>{ownedWeapons.length}</span>
          </div>
          <div className='stat-item'>
            <span className='stat-label'>装備中:</span>
            <span className='stat-value'>{equippedWeapons.length}/3</span>
          </div>
          <div className='stat-item'>
            <span className='stat-label'>利用可能:</span>
            <span className='stat-value'>{availableWeapons.length}</span>
          </div>
        </div>
        <div className='shop-hint'>
          <p>💡 武器は最大3つまで同時に装備できます</p>
          <p>🎯 装備した武器は自動的に射撃に使用されます</p>
        </div>
      </div>
    </div>
  );
};

export default WeaponShopSection;
