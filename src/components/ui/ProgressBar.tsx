import React from 'react';

import { ProgressBarProps } from '../../types/react/index';

/**
 * プログレスバーコンポーネント
 * アップグレードの進行度や経験値の表示に使用
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  max,
  label,
  color = '#4ade80',
  showPercentage = false,
  className = '',
  style,
  testId = 'progress-bar',
  ...props
}) => {
  const percentage = Math.min((current / max) * 100, 100);
  const formattedPercentage = Math.round(percentage);

  return (
    <div
      className={`progress-bar-container ${className}`}
      style={style}
      data-testid={testId}
      {...props}
    >
      {label && (
        <div className='progress-bar-label'>
          {label}
          {showPercentage && (
            <span className='progress-percentage'>{formattedPercentage}%</span>
          )}
        </div>
      )}
      <div className='progress-bar-track'>
        <div
          className='progress-bar-fill'
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            transition: 'width 0.3s ease-in-out',
          }}
        />
      </div>
      {!label && showPercentage && (
        <div className='progress-percentage-standalone'>
          {formattedPercentage}%
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
