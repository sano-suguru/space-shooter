import React from 'react';

import { StatItemProps } from '../../types/react/index';

/**
 * 統計アイテムコンポーネント
 * アイコン、ラベル、値を表示する統計項目
 */
export const StatItem: React.FC<StatItemProps> = ({
  icon,
  label,
  value,
  id,
  className = '',
  style,
  testId,
  ...props
}) => {
  const formattedValue =
    typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <div
      className={`stat-item ${className}`.trim()}
      style={style}
      data-testid={testId}
      {...props}
    >
      <span className='stat-icon'>{icon}</span>
      <div className='stat-info'>
        <span className='stat-label'>{label}</span>
        <span className='stat-value' id={id}>
          {formattedValue}
        </span>
      </div>
    </div>
  );
};

StatItem.displayName = 'StatItem';

export default StatItem;
