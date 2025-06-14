import React from 'react';

import { ExperienceBarProps } from '../../types/react/index';

/**
 * 経験値バーコンポーネント
 * 現在の経験値とレベル進行状況を表示
 */
export const ExperienceBar: React.FC<ExperienceBarProps> = ({
  currentExperience,
  currentLevel,
  nextLevelXP,
  className = '',
  style,
  testId,
  ...props
}) => {
  // 簡易的なレベル計算（1000 XPごとにレベルアップ）
  const xpForCurrentLevel = (currentLevel - 1) * 1000;
  const xpForNextLevel = currentLevel * 1000;
  const currentLevelXP = currentExperience - xpForCurrentLevel;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;

  const percentage = Math.min((currentLevelXP / xpNeededForNext) * 100, 100);

  return (
    <div
      className={`experience-bar ${className}`.trim()}
      style={style}
      data-testid={testId}
      {...props}
      id='experience-bar'
    >
      {/* XPラベル */}
      <div className='xp-label'>
        <span>経験値</span>
        <span className='xp-text' id='xp-text'>
          {currentLevelXP} / {xpNeededForNext}
        </span>
      </div>

      {/* XPバーコンテナ */}
      <div className='xp-bar-container'>
        <div
          className='xp-bar-fill'
          id='xp-bar-fill'
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

ExperienceBar.displayName = 'ExperienceBar';

export default ExperienceBar;
