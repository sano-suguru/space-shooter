import React from 'react';
import { AchievementCategoryTabsProps } from '../../types/react';

/**
 * アチーブメントカテゴリータブコンポーネント
 */
export const AchievementCategoryTabs: React.FC<
  AchievementCategoryTabsProps
> = ({
  currentCategory,
  onCategoryChange,
  categories,
  className = '',
  ...props
}) => {
  const handleCategoryClick = (categoryId: any) => {
    onCategoryChange(categoryId);
  };

  return (
    <div className={`achievement-categories ${className}`} {...props}>
      {categories.map(category => (
        <button
          key={category.id}
          className={`category-tab ${currentCategory === category.id ? 'active' : ''}`}
          onClick={() => handleCategoryClick(category.id)}
          data-category={category.id}
        >
          {category.icon} {category.name}
        </button>
      ))}
    </div>
  );
};

export default AchievementCategoryTabs;
