import React from 'react';

import { CategoryTabsProps } from '../../types/react/index';

import { Button } from './Button';

/**
 * カテゴリータブコンポーネント
 * アップグレードのカテゴリー切り替えに使用
 */
export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  currentCategory,
  onCategoryChange,
  categories,
  className = '',
  style,
  testId = 'category-tabs',
  ...props
}) => {
  return (
    <div
      className={`category-tabs ${className}`}
      style={style}
      data-testid={testId}
      {...props}
    >
      {categories.map(category => (
        <Button
          key={category.id}
          variant={currentCategory === category.id ? 'primary' : 'secondary'}
          size='medium'
          onClick={() => onCategoryChange(category.id)}
          className={`category-tab ${currentCategory === category.id ? 'active' : ''}`}
          data-testid={`category-tab-${category.id}`}
        >
          <span className='category-icon'>{category.icon}</span>
          <span className='category-name'>{category.name}</span>
        </Button>
      ))}
    </div>
  );
};

export default CategoryTabs;
