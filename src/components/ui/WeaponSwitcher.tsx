/**
 * 武器切り替えコンポーネント
 *
 * ゲーム中に武器を切り替えるためのモバイル対応UI
 */

import React, { useState, useCallback } from 'react';

import { EquippedWeapon } from '../../weapons/types/WeaponTypes';

import { Button } from './Button';

export interface WeaponSwitcherProps {
  equippedWeapons: EquippedWeapon[];
  activeWeaponSlot: number;
  onWeaponSwitch: (slot: number) => void;
  isVisible?: boolean;
  className?: string;
  isMobile?: boolean;
}

/**
 * 武器切り替えコンポーネント
 */
export const WeaponSwitcher: React.FC<WeaponSwitcherProps> = ({
  equippedWeapons,
  activeWeaponSlot,
  onWeaponSwitch,
  isVisible = true,
  className = '',
  isMobile = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 武器切り替えハンドラ
  const handleWeaponSwitch = useCallback(
    (slot: number) => {
      onWeaponSwitch(slot);
      if (isMobile) {
        setIsExpanded(false);
      }
    },
    [onWeaponSwitch, isMobile]
  );

  // 次の武器に切り替え
  const handleNextWeapon = useCallback(() => {
    const availableSlots = equippedWeapons.map(w => w.slot).sort();
    if (availableSlots.length === 0) return;

    const currentIndex = availableSlots.indexOf(activeWeaponSlot);
    const nextIndex = (currentIndex + 1) % availableSlots.length;
    handleWeaponSwitch(availableSlots[nextIndex]);
  }, [equippedWeapons, activeWeaponSlot, handleWeaponSwitch]);

  // 前の武器に切り替え
  const handlePrevWeapon = useCallback(() => {
    const availableSlots = equippedWeapons.map(w => w.slot).sort();
    if (availableSlots.length === 0) return;

    const currentIndex = availableSlots.indexOf(activeWeaponSlot);
    const prevIndex =
      currentIndex === 0 ? availableSlots.length - 1 : currentIndex - 1;
    handleWeaponSwitch(availableSlots[prevIndex]);
  }, [equippedWeapons, activeWeaponSlot, handleWeaponSwitch]);

  if (!isVisible || equippedWeapons.length === 0) {
    return null;
  }

  const activeWeapon = equippedWeapons.find(w => w.slot === activeWeaponSlot);

  return (
    <div className={`weapon-switcher ${className} ${isMobile ? 'mobile' : ''}`}>
      {isMobile ? (
        // モバイル版: コンパクトな表示
        <div className='mobile-weapon-switcher'>
          {/* 現在の武器表示 */}
          <div
            className='current-weapon-display'
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className='weapon-icon'>
              {activeWeapon ? activeWeapon.config.icon : '❓'}
            </div>
            <div className='weapon-info'>
              <div className='weapon-name'>
                {activeWeapon ? activeWeapon.config.name : '武器なし'}
              </div>
              <div className='weapon-level'>
                {activeWeapon ? `Lv.${activeWeapon.level}` : ''}
              </div>
            </div>
            <div className='expand-icon'>{isExpanded ? '▲' : '▼'}</div>
          </div>

          {/* 展開時の武器一覧 */}
          {isExpanded && (
            <div className='weapon-list-expanded'>
              {equippedWeapons.map(weapon => (
                <div
                  key={weapon.slot}
                  className={`weapon-option ${
                    weapon.slot === activeWeaponSlot ? 'active' : ''
                  }`}
                  onClick={() => handleWeaponSwitch(weapon.slot)}
                >
                  <div className='weapon-icon'>{weapon.config.icon}</div>
                  <div className='weapon-info'>
                    <div className='weapon-name'>{weapon.config.name}</div>
                    <div className='weapon-level'>Lv.{weapon.level}</div>
                  </div>
                  <div className='slot-number'>#{weapon.slot + 1}</div>
                </div>
              ))}
            </div>
          )}

          {/* クイック切り替えボタン */}
          <div className='quick-switch-buttons'>
            <Button
              variant='secondary'
              size='small'
              onClick={handlePrevWeapon}
              disabled={equippedWeapons.length <= 1}
              className='prev-weapon-btn'
            >
              ◀
            </Button>
            <Button
              variant='secondary'
              size='small'
              onClick={handleNextWeapon}
              disabled={equippedWeapons.length <= 1}
              className='next-weapon-btn'
            >
              ▶
            </Button>
          </div>
        </div>
      ) : (
        // デスクトップ版: 横並び表示
        <div className='desktop-weapon-switcher'>
          <div className='weapon-slots'>
            {[0, 1, 2].map(slot => {
              const weapon = equippedWeapons.find(w => w.slot === slot);
              const isActive = slot === activeWeaponSlot;

              return (
                <div
                  key={slot}
                  className={`weapon-slot ${isActive ? 'active' : ''} ${
                    weapon ? 'equipped' : 'empty'
                  }`}
                  onClick={() => weapon && handleWeaponSwitch(slot)}
                >
                  <div className='slot-number'>{slot + 1}</div>
                  {weapon ? (
                    <div className='weapon-content'>
                      <div className='weapon-icon'>{weapon.config.icon}</div>
                      <div className='weapon-name'>{weapon.config.name}</div>
                      <div className='weapon-level'>Lv.{weapon.level}</div>
                      {weapon.config.specialEffect && (
                        <div className='special-effect-indicator'>✨</div>
                      )}
                    </div>
                  ) : (
                    <div className='empty-slot-content'>
                      <div className='empty-icon'>➕</div>
                      <div className='empty-text'>空き</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* キーボードショートカット表示 */}
          <div className='keyboard-shortcuts'>
            <div className='shortcut-hint'>
              <kbd>1</kbd>
              <kbd>2</kbd>
              <kbd>3</kbd> で武器切り替え
            </div>
          </div>
        </div>
      )}

      {/* 武器統計表示（オプション） */}
      {activeWeapon && (
        <div className='weapon-stats-mini'>
          <div className='stat-item'>
            <span className='stat-icon'>💥</span>
            <span className='stat-value'>{activeWeapon.config.damage}</span>
          </div>
          <div className='stat-item'>
            <span className='stat-icon'>⚡</span>
            <span className='stat-value'>
              {Math.round(1000 / activeWeapon.config.fireRate)}
            </span>
          </div>
          {activeWeapon.config.specialEffect && (
            <div className='stat-item'>
              <span className='stat-icon'>🎯</span>
              <span className='stat-value'>
                {activeWeapon.config.specialEffect.type}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeaponSwitcher;
