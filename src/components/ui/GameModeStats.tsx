import React from 'react';
import { GameModeStatsProps } from '../../types/react/index';

/**
 * ゲームモード統計表示コンポーネント
 */
export const GameModeStats: React.FC<GameModeStatsProps> = ({
  gamesPlayed,
  highScore,
  className = '',
  style,
  testId,
  ...rest
}) => {
  return (
    <div
      className={`mode-stats ${className}`}
      style={style}
      data-testid={testId}
      {...rest}
    >
      <div className='stat-item'>
        <span className='stat-label'>プレイ回数</span>
        <span className='stat-value'>{gamesPlayed.toString()}</span>
      </div>
      <div className='stat-item'>
        <span className='stat-label'>最高スコア</span>
        <span className='stat-value'>{highScore.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default GameModeStats;
