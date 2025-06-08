import React from 'react';
import { AchievementStatsProps } from '../../types/react';

/**
 * アチーブメント統計表示コンポーネント
 */
export const AchievementStats: React.FC<AchievementStatsProps & React.HTMLAttributes<HTMLDivElement>> = ({
  completedCount,
  totalCount,
  completionPercentage,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`achievement-stats ${className}`}
      {...props}
    >
      <span className="completed">
        完了: {completedCount}/{totalCount}
      </span>
      <span className="completion-rate">
        達成率: {completionPercentage}%
      </span>
    </div>
  );
};

export default AchievementStats;
