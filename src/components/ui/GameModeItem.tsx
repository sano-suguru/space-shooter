import React from 'react';

import { GameModeItemProps } from '../../types/react/index';

import { Button } from './Button';
import { GameModeModifiers } from './GameModeModifiers';
import { GameModeStats } from './GameModeStats';

/**
 * ゲームモードアイテムコンポーネント
 */
export const GameModeItem: React.FC<GameModeItemProps> = ({
  mode,
  isUnlocked,
  isCurrent,
  stats,
  onSelect,
  onUnlock,
  className = '',
  style,
  testId,
  ...rest
}) => {
  const getDifficultyIcon = (modeId: string): string => {
    switch (modeId) {
      case 'normal':
        return '⚪';
      case 'hardcore':
        return '🔴';
      case 'survival':
        return '🟡';
      default:
        return '❓';
    }
  };

  const getUnlockRequirementText = (modeId: string): string => {
    switch (modeId) {
      case 'hardcore':
        return 'レベル5達成とノーマルモードでスコア5000達成';
      case 'survival':
        return 'レベル10達成とハードコアモードでウェーブ10到達';
      default:
        return '条件不明';
    }
  };

  const handleSelect = () => {
    if (isUnlocked && !isCurrent) {
      onSelect(mode);
    }
  };

  const handleUnlock = () => {
    if (onUnlock && !isUnlocked) {
      onUnlock(mode);
    }
  };

  const renderActionButton = () => {
    if (!isUnlocked) {
      // TODO: 実際の解除条件チェックロジックが必要
      // 現在は簡易実装として常にfalseを返す
      const canUnlock = false;

      if (canUnlock) {
        return (
          <Button
            onClick={handleUnlock}
            className='unlock-button'
            data-mode-id={mode.id}
          >
            解除する
          </Button>
        );
      } else {
        return (
          <div className='unlock-requirement'>
            解除条件: {getUnlockRequirementText(mode.id)}
          </div>
        );
      }
    }

    if (isCurrent) {
      return (
        <Button className='select-button current' disabled={true}>
          選択中
        </Button>
      );
    }

    return (
      <Button
        onClick={handleSelect}
        className='select-button'
        data-mode-id={mode.id}
      >
        選択する
      </Button>
    );
  };

  const difficultyIcon = getDifficultyIcon(mode.id);

  return (
    <div
      className={`mode-item ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''} ${className}`}
      style={style}
      data-testid={testId}
      data-mode-id={mode.id}
      {...rest}
    >
      {/* Mode Header */}
      <div className='mode-header'>
        {/* Mode Info Section */}
        <div className='mode-info'>
          <div className='mode-title'>
            <span className='mode-icon'>{difficultyIcon}</span>
            <h3 className='mode-name'>{mode.name}</h3>
            {isCurrent && <span className='current-badge'>選択中</span>}
            {!isUnlocked && <span className='locked-badge'>🔒</span>}
          </div>
          <p className='mode-description'>{mode.description}</p>
        </div>

        {/* Mode Stats Section */}
        <GameModeStats
          gamesPlayed={stats.gamesPlayed}
          highScore={stats.highScore}
        />
      </div>

      {/* Mode Details Section */}
      <div className='mode-details'>
        <GameModeModifiers modifiers={mode.modifiers} />

        <div className='mode-reward'>
          <span className='reward-multiplier'>
            報酬倍率: ×{mode.rewardMultiplier}
          </span>
        </div>
      </div>

      {/* Mode Footer Section */}
      <div className='mode-footer'>{renderActionButton()}</div>
    </div>
  );
};

export default GameModeItem;
