import React from 'react';
import { PlayerStatsProps } from '../../types/react/index';

/**
 * プレイヤー統計表示コンポーネント
 * コイン、レベル、経験値などの情報を表示
 */
export const PlayerStats: React.FC<PlayerStatsProps> = ({
  profile,
  showLevel = true,
  showExperience = true,
  showCoins = true,
  className = '',
  style,
  testId = 'player-stats',
  ...props
}) => {
  return (
    <div
      className={`player-stats ${className}`}
      style={style}
      data-testid={testId}
      {...props}
    >
      {showCoins && (
        <div className='stat-item coins'>
          <span className='stat-icon'>💰</span>
          <span className='stat-value'>{profile.coins.toLocaleString()}</span>
        </div>
      )}

      {showLevel && (
        <div className='stat-item level'>
          <span className='stat-label'>Lv.</span>
          <span className='stat-value'>{profile.level}</span>
        </div>
      )}

      {showExperience && (
        <div className='stat-item experience'>
          <span className='stat-label'>XP:</span>
          <span className='stat-value'>
            {profile.experience.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default PlayerStats;
