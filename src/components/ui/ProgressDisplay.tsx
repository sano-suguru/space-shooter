import React from 'react';

import { ProgressDisplayProps } from '../../types/react/index';

import { ExperienceBar } from './ExperienceBar';
import { ProgressHeader } from './ProgressHeader';
import { QuickStats } from './QuickStats';

/**
 * プログレス表示コンポーネント
 * プレイヤーの進行状況（レベル、経験値、コイン、統計）を表示
 */
export const ProgressDisplay: React.FC<ProgressDisplayProps> = ({
  isVisible,
  playerProfile,
  className = '',
  style,
  testId,
  ...props
}) => {
  if (!isVisible) {
    return null;
  }

  // 経験値関連の計算
  const nextLevelXP = playerProfile.level * 1000; // 簡易的なレベル計算

  return (
    <div
      className={`progress-display ${className}`.trim()}
      style={style}
      data-testid={testId}
      {...props}
      id='progress-display'
    >
      {/* プログレスヘッダー（レベル・コイン） */}
      <ProgressHeader level={playerProfile.level} coins={playerProfile.coins} />

      {/* 経験値バー */}
      <ExperienceBar
        currentExperience={playerProfile.experience}
        currentLevel={playerProfile.level}
        nextLevelXP={nextLevelXP}
      />

      {/* クイック統計 */}
      <QuickStats
        highScore={playerProfile.highScore}
        totalGamesPlayed={playerProfile.totalGamesPlayed}
        enemiesDestroyed={playerProfile.stats.enemiesDestroyed}
      />
    </div>
  );
};

ProgressDisplay.displayName = 'ProgressDisplay';

export default ProgressDisplay;
