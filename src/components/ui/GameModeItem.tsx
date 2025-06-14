import React from 'react';

import { GameMode } from '../../progression/types/GameMode';
import { GameModeItemProps } from '../../types/react/index';

import { Button } from './Button';
import { GameModeModifiers } from './GameModeModifiers';
import { GameModeStats } from './GameModeStats';

/**
 * ゲームモードアイテムコンポーネント
 */
export const GameModeItem: React.FC<GameModeItemProps> = props => {
  const {
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
  } = props;

  const { handleSelect, handleUnlock } = useGameModeItemLogic(
    mode,
    isUnlocked,
    isCurrent,
    onSelect,
    onUnlock
  );

  const difficultyIcon = getDifficultyIcon(mode.id);

  return (
    <div
      className={`mode-item ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''} ${className}`}
      style={style}
      data-testid={testId}
      data-mode-id={mode.id}
      {...rest}
    >
      <GameModeHeader
        mode={mode}
        isCurrent={isCurrent}
        isUnlocked={isUnlocked}
        stats={stats}
        difficultyIcon={difficultyIcon}
      />
      <GameModeDetails mode={mode} />
      <GameModeFooter
        mode={mode}
        isUnlocked={isUnlocked}
        isCurrent={isCurrent}
        handleSelect={handleSelect}
        handleUnlock={handleUnlock}
      />
    </div>
  );
};

/**
 * 難易度アイコンを取得
 */
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

/**
 * 解除条件テキストを取得
 */
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

/**
 * ゲームモードアイテムのロジックを管理するカスタムフック
 */
const useGameModeItemLogic = (
  mode: GameMode,
  isUnlocked: boolean,
  isCurrent: boolean,
  onSelect: (mode: GameMode) => void,
  onUnlock?: (mode: GameMode) => void
): {
  handleSelect: () => void;
  handleUnlock: () => void;
} => {
  const handleSelect = (): void => {
    if (isUnlocked && !isCurrent) {
      onSelect(mode);
    }
  };

  const handleUnlock = (): void => {
    if (onUnlock && !isUnlocked) {
      onUnlock(mode);
    }
  };

  return { handleSelect, handleUnlock };
};

/**
 * ゲームモードヘッダーコンポーネント
 */
const GameModeHeader: React.FC<{
  mode: GameMode;
  isCurrent: boolean;
  isUnlocked: boolean;
  stats: { gamesPlayed: number; highScore: number };
  difficultyIcon: string;
}> = ({ mode, isCurrent, isUnlocked, stats, difficultyIcon }) => (
  <div className='mode-header'>
    <div className='mode-info'>
      <div className='mode-title'>
        <span className='mode-icon'>{difficultyIcon}</span>
        <h3 className='mode-name'>{mode.name}</h3>
        {isCurrent && <span className='current-badge'>選択中</span>}
        {!isUnlocked && <span className='locked-badge'>🔒</span>}
      </div>
      <p className='mode-description'>{mode.description}</p>
    </div>
    <GameModeStats
      gamesPlayed={stats.gamesPlayed}
      highScore={stats.highScore}
    />
  </div>
);

/**
 * ゲームモード詳細コンポーネント
 */
const GameModeDetails: React.FC<{
  mode: GameMode;
}> = ({ mode }) => (
  <div className='mode-details'>
    <GameModeModifiers modifiers={mode.modifiers} />
    <div className='mode-reward'>
      <span className='reward-multiplier'>
        報酬倍率: ×{mode.rewardMultiplier}
      </span>
    </div>
  </div>
);

/**
 * ゲームモードフッターコンポーネント
 */
const GameModeFooter: React.FC<{
  mode: GameMode;
  isUnlocked: boolean;
  isCurrent: boolean;
  handleSelect: () => void;
  handleUnlock: () => void;
}> = ({ mode, isUnlocked, isCurrent, handleSelect, handleUnlock }) => (
  <div className='mode-footer'>
    <ActionButton
      mode={mode}
      isUnlocked={isUnlocked}
      isCurrent={isCurrent}
      handleSelect={handleSelect}
      handleUnlock={handleUnlock}
    />
  </div>
);

/**
 * アクションボタンコンポーネント
 */
const ActionButton: React.FC<{
  mode: GameMode;
  isUnlocked: boolean;
  isCurrent: boolean;
  handleSelect: () => void;
  handleUnlock: () => void;
}> = ({ mode, isUnlocked, isCurrent, handleSelect, handleUnlock }) => {
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

export default GameModeItem;
