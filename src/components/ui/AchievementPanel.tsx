import React, { useState, useMemo } from 'react';

import { Achievement } from '../../progression/types/Achievement';
import { PlayerProfile } from '../../progression/types/PlayerProfile';
import { AchievementPanelProps, AchievementCategory } from '../../types/react';

import { AchievementCategoryTabs } from './AchievementCategoryTabs';
import { AchievementItem } from './AchievementItem';
import { AchievementStats } from './AchievementStats';

/**
 * アチーブメントパネルコンポーネント
 */
export const AchievementPanel: React.FC<AchievementPanelProps> = props => {
  const {
    isVisible,
    achievements,
    playerProfile,
    onClose,
    onCategoryChange,
    onAchievementSelect,
    className = '',
    ...restProps
  } = props;

  const [currentCategory, setCurrentCategory] =
    useState<AchievementCategory>('combat');

  const {
    categories,
    stats,
    sortedAchievements,
    handleCategoryChange,
    handleAchievementSelect,
    getAchievementProgress,
  } = useAchievementPanelLogic(
    achievements,
    playerProfile,
    currentCategory,
    setCurrentCategory,
    onCategoryChange,
    onAchievementSelect
  );

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`achievement-panel ${className}`}
      id='achievement-panel'
      {...restProps}
    >
      <AchievementPanelHeader stats={stats} onClose={onClose} />
      <AchievementCategoryTabs
        currentCategory={currentCategory}
        onCategoryChange={handleCategoryChange}
        categories={categories}
      />
      <AchievementList
        sortedAchievements={sortedAchievements}
        playerProfile={playerProfile}
        getAchievementProgress={getAchievementProgress}
        handleAchievementSelect={handleAchievementSelect}
      />
    </div>
  );
};

/**
 * アチーブメントパネルのロジックを管理するカスタムフック
 */
const useAchievementPanelLogic = (
  achievements: Achievement[],
  playerProfile: PlayerProfile,
  currentCategory: AchievementCategory,
  setCurrentCategory: React.Dispatch<React.SetStateAction<AchievementCategory>>,
  onCategoryChange: ((category: AchievementCategory) => void) | undefined,
  onAchievementSelect: ((achievement: Achievement) => void) | undefined
): {
  categories: {
    id: AchievementCategory;
    name: string;
    icon: string;
  }[];
  stats: {
    completedCount: number;
    totalCount: number;
    completionPercentage: number;
  };
  sortedAchievements: Achievement[];
  handleCategoryChange: (category: AchievementCategory) => void;
  handleAchievementSelect: (achievement: Achievement) => void;
  getAchievementProgress: () => { current: number; required: number };
} => {
  const categories = getAchievementCategories();
  const stats = useAchievementStats(achievements, playerProfile);
  const filteredAchievements = useFilteredAchievements(
    achievements,
    currentCategory
  );
  const sortedAchievements = useSortedAchievements(
    filteredAchievements,
    playerProfile
  );

  const handleCategoryChange = createCategoryChangeHandler(
    setCurrentCategory,
    onCategoryChange
  );
  const handleAchievementSelect =
    createAchievementSelectHandler(onAchievementSelect);
  const getAchievementProgress = createProgressGetter();

  return {
    categories,
    stats,
    sortedAchievements,
    handleCategoryChange,
    handleAchievementSelect,
    getAchievementProgress,
  };
};

const getAchievementCategories = (): {
  id: AchievementCategory;
  name: string;
  icon: string;
}[] => [
  { id: 'combat' as AchievementCategory, name: '戦闘', icon: '⚔️' },
  { id: 'survival' as AchievementCategory, name: '生存', icon: '🛡️' },
  { id: 'collection' as AchievementCategory, name: '収集', icon: '📦' },
  { id: 'mastery' as AchievementCategory, name: '熟練', icon: '📈' },
  { id: 'special' as AchievementCategory, name: '特別', icon: '⭐' },
];

const useAchievementStats = (
  achievements: Achievement[],
  playerProfile: PlayerProfile
): {
  completedCount: number;
  totalCount: number;
  completionPercentage: number;
} => {
  return useMemo(() => {
    const completedCount = playerProfile.completedAchievements.length;
    const totalCount = achievements.length;
    const completionPercentage =
      totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      completedCount,
      totalCount,
      completionPercentage,
    };
  }, [achievements, playerProfile.completedAchievements]);
};

const useFilteredAchievements = (
  achievements: Achievement[],
  currentCategory: AchievementCategory
): Achievement[] => {
  return useMemo(() => {
    return achievements.filter(
      achievement => achievement.category === currentCategory
    );
  }, [achievements, currentCategory]);
};

const useSortedAchievements = (
  filteredAchievements: Achievement[],
  playerProfile: PlayerProfile
): Achievement[] => {
  return useMemo(() => {
    return [...filteredAchievements].sort((a: Achievement, b: Achievement) => {
      const aCompleted = playerProfile.completedAchievements.includes(a.id);
      const bCompleted = playerProfile.completedAchievements.includes(b.id);

      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      return 0;
    });
  }, [filteredAchievements, playerProfile.completedAchievements]);
};

const createCategoryChangeHandler = (
  setCurrentCategory: React.Dispatch<React.SetStateAction<AchievementCategory>>,
  onCategoryChange: ((category: AchievementCategory) => void) | undefined
) => {
  return (category: AchievementCategory): void => {
    setCurrentCategory(category);
    onCategoryChange?.(category);
  };
};

const createAchievementSelectHandler = (
  onAchievementSelect: ((achievement: Achievement) => void) | undefined
) => {
  return (achievement: Achievement): void => {
    onAchievementSelect?.(achievement);
  };
};

const createProgressGetter = () => {
  return (): { current: number; required: number } => {
    // TODO: 実際のプログレスマネージャーからプログレス情報を取得
    const mockProgress = {
      current: Math.floor(Math.random() * 100),
      required: 100,
    };
    return mockProgress;
  };
};

/**
 * アチーブメントパネルヘッダーコンポーネント
 */
const AchievementPanelHeader: React.FC<{
  stats: {
    completedCount: number;
    totalCount: number;
    completionPercentage: number;
  };
  onClose: () => void;
}> = ({ stats, onClose }) => (
  <div className='achievement-header'>
    <div className='achievement-title'>
      <h2>🏆 アチーブメント</h2>
      <button
        className='close-button'
        onClick={onClose}
        id='close-achievements'
      >
        ×
      </button>
    </div>
    <AchievementStats
      completedCount={stats.completedCount}
      totalCount={stats.totalCount}
      completionPercentage={stats.completionPercentage}
      id='achievement-stats'
    />
  </div>
);

/**
 * アチーブメントリストコンポーネント
 */
const AchievementList: React.FC<{
  sortedAchievements: Achievement[];
  playerProfile: PlayerProfile;
  getAchievementProgress: () => { current: number; required: number };
  handleAchievementSelect: (achievement: Achievement) => void;
}> = ({
  sortedAchievements,
  playerProfile,
  getAchievementProgress,
  handleAchievementSelect,
}) => (
  <div className='achievement-list' id='achievement-list'>
    {sortedAchievements.length === 0 ? (
      <div className='no-achievements'>
        <p>このカテゴリーにはアチーブメントがありません</p>
      </div>
    ) : (
      sortedAchievements.map(achievement => {
        const isCompleted = playerProfile.completedAchievements.includes(
          achievement.id
        );
        const progress = isCompleted ? undefined : getAchievementProgress();

        return (
          <AchievementItem
            key={achievement.id}
            achievement={achievement}
            isCompleted={isCompleted}
            progress={progress}
            onSelect={handleAchievementSelect}
          />
        );
      })
    )}
  </div>
);

export default AchievementPanel;
