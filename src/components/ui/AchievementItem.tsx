import React from 'react';
import { AchievementItemProps } from '../../types/react';
import { ProgressBar } from './ProgressBar';

/**
 * アチーブメントアイテムコンポーネント
 */
export const AchievementItem: React.FC<AchievementItemProps> = ({
  achievement,
  isCompleted,
  progress,
  onSelect,
  className = '',
  ...props
}) => {
  const handleClick = () => {
    onSelect?.(achievement);
  };

  const createRewardText = () => {
    const rewards = [];
    
    if (achievement.reward.coins > 0) {
      rewards.push(`💰 ${achievement.reward.coins}`);
    }
    
    if (achievement.reward.experience > 0) {
      rewards.push(`✨ ${achievement.reward.experience} XP`);
    }

    return rewards.length > 0 ? `報酬: ${rewards.join(', ')}` : null;
  };

  const getProgressText = () => {
    if (isCompleted) return '完了！';
    if (progress) return `${progress.current}/${progress.required}`;
    return '進捗なし';
  };

  const rewardText = createRewardText();

  return (
    <div 
      className={`achievement-item ${isCompleted ? 'completed' : 'incomplete'} ${className}`}
      data-achievement-id={achievement.id}
      onClick={handleClick}
      {...props}
    >
      {/* アチーブメントアイコン */}
      <div className="achievement-icon">
        {isCompleted ? '🏆' : '⭐'}
      </div>

      {/* アチーブメントコンテンツ */}
      <div className="achievement-content">
        {/* アチーブメント情報 */}
        <div className="achievement-info">
          <h3 className="achievement-name">{achievement.name}</h3>
          <p className="achievement-description">{achievement.description}</p>
          {rewardText && (
            <div className="achievement-rewards">
              {rewardText}
            </div>
          )}
        </div>

        {/* アチーブメント進捗 */}
        <div className="achievement-progress">
          <div className="progress-text">
            {getProgressText()}
          </div>
          {!isCompleted && progress && (
            <ProgressBar
              current={progress.current}
              max={progress.required}
              className="achievement-progress-bar"
            />
          )}
        </div>
      </div>

      {/* アチーブメントステータス */}
      <div className="achievement-status">
        <span className={`status-badge ${isCompleted ? 'completed' : 'incomplete'}`}>
          {isCompleted ? '完了' : '未完了'}
        </span>
      </div>
    </div>
  );
};

export default AchievementItem;
