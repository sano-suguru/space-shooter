import React from 'react';
import { QuickStatsProps } from '../../types/react/index';
import { StatItem } from './StatItem';

/**
 * クイック統計コンポーネント
 * ハイスコア、総ゲーム数、敵撃破数を表示
 */
export const QuickStats: React.FC<QuickStatsProps> = ({
  highScore,
  totalGamesPlayed,
  enemiesDestroyed,
  className = '',
  style,
  testId,
  ...props
}) => {
  return (
    <div
      className={`quick-stats ${className}`.trim()}
      style={style}
      data-testid={testId}
      {...props}
      id='quick-stats'
    >
      <StatItem
        icon='🎯'
        label='ハイスコア'
        value={highScore}
        id='high-score'
      />

      <StatItem
        icon='🎮'
        label='総ゲーム数'
        value={totalGamesPlayed}
        id='total-games'
      />

      <StatItem
        icon='💥'
        label='敵撃破数'
        value={enemiesDestroyed}
        id='enemies-destroyed'
      />
    </div>
  );
};

QuickStats.displayName = 'QuickStats';

export default QuickStats;
