import React, { useState, useMemo } from 'react';
import { AchievementPanelProps, AchievementCategory } from '../../types/react';
import { Achievement } from '../../progression/types/Achievement';
import { AchievementStats } from './AchievementStats';
import { AchievementCategoryTabs } from './AchievementCategoryTabs';
import { AchievementItem } from './AchievementItem';

/**
 * アチーブメントパネルコンポーネント
 */
export const AchievementPanel: React.FC<AchievementPanelProps> = ({
  isVisible,
  achievements,
  playerProfile,
  onClose,
  onCategoryChange,
  onAchievementSelect,
  className = '',
  ...props
}) => {
  const [currentCategory, setCurrentCategory] =
    useState<AchievementCategory>('combat');

  // カテゴリー定義
  const categories = [
    { id: 'combat' as AchievementCategory, name: '戦闘', icon: '⚔️' },
    { id: 'survival' as AchievementCategory, name: '生存', icon: '🛡️' },
    { id: 'collection' as AchievementCategory, name: '収集', icon: '📦' },
    { id: 'mastery' as AchievementCategory, name: '熟練', icon: '📈' },
    { id: 'special' as AchievementCategory, name: '特別', icon: '⭐' },
  ];

  // 統計計算
  const stats = useMemo(() => {
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

  // カテゴリー別アチーブメントフィルタリング
  const filteredAchievements = useMemo(() => {
    return achievements.filter(
      achievement => achievement.category === currentCategory
    );
  }, [achievements, currentCategory]);

  // アチーブメントを完了済み/未完了でソート
  const sortedAchievements = useMemo(() => {
    return [...filteredAchievements].sort((a: Achievement, b: Achievement) => {
      const aCompleted = playerProfile.completedAchievements.includes(a.id);
      const bCompleted = playerProfile.completedAchievements.includes(b.id);

      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      return 0;
    });
  }, [filteredAchievements, playerProfile.completedAchievements]);

  // カテゴリー変更ハンドラー
  const handleCategoryChange = (category: AchievementCategory) => {
    setCurrentCategory(category);
    onCategoryChange?.(category);
  };

  // アチーブメント選択ハンドラー
  const handleAchievementSelect = (achievement: Achievement) => {
    onAchievementSelect?.(achievement);
  };

  // プログレス情報取得（仮実装 - 実際のプログレスマネージャーから取得）
  const getAchievementProgress = (_achievementId: string) => {
    // TODO: 実際のプログレスマネージャーからプログレス情報を取得
    // 現在は仮のプログレス値を返す
    const mockProgress = {
      current: Math.floor(Math.random() * 100),
      required: 100,
    };
    return mockProgress;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`achievement-panel ${className}`}
      id='achievement-panel'
      {...props}
    >
      {/* アチーブメントヘッダー */}
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

        {/* 統計情報 */}
        <AchievementStats
          completedCount={stats.completedCount}
          totalCount={stats.totalCount}
          completionPercentage={stats.completionPercentage}
          id='achievement-stats'
        />
      </div>

      {/* カテゴリータブ */}
      <AchievementCategoryTabs
        currentCategory={currentCategory}
        onCategoryChange={handleCategoryChange}
        categories={categories}
      />

      {/* アチーブメントリスト */}
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
            const progress = isCompleted
              ? undefined
              : getAchievementProgress(achievement.id);

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
    </div>
  );
};

export default AchievementPanel;
