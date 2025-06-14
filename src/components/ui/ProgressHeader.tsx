import React from 'react';

import { ProgressHeaderProps } from '../../types/react/index';

/**
 * プログレスヘッダーコンポーネント
 * プレイヤーのレベルとコインを表示
 */
export const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  level,
  coins,
  className = '',
  style,
  testId,
  ...props
}) => {
  return (
    <div
      className={`progress-header ${className}`.trim()}
      style={style}
      data-testid={testId}
      {...props}
    >
      {/* プレイヤーレベル */}
      <div className='player-level' id='player-level'>
        <span className='level-label'>Lv.</span>
        <span className='level-number'>{level}</span>
      </div>

      {/* プレイヤーコイン */}
      <div className='player-coins' id='player-coins'>
        <span className='coins-icon'>💰</span>
        <span className='coins-amount'>{coins.toLocaleString()}</span>
      </div>
    </div>
  );
};

ProgressHeader.displayName = 'ProgressHeader';

export default ProgressHeader;
