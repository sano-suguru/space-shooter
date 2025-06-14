import React, { useState } from 'react';

import { GameMode } from '../../progression/types/GameMode';
import { PlayerProfile } from '../../progression/types/PlayerProfile';
import { GameModeSelectorProps } from '../../types/react/index';

import { Button } from './Button';
import { GameModeItem } from './GameModeItem';

/**
 * ゲームモードセレクターコンポーネント
 */
export const GameModeSelector: React.FC<GameModeSelectorProps> = props => {
  const {
    isVisible,
    gameModes,
    currentMode,
    playerProfile,
    onClose,
    onModeSelect,
    onModeUnlock,
    className = '',
    style,
    testId,
    ...rest
  } = props;

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'unlock';
    message: string;
    isVisible: boolean;
  } | null>(null);

  const {
    getIndividualModeStats,
    isGameModeUnlocked,
    handleModeSelect,
    handleModeUnlock,
  } = useGameModeLogic(
    playerProfile,
    onModeSelect,
    onModeUnlock,
    setNotification
  );

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <GameModeSelectorContent
        className={className}
        style={style}
        testId={testId}
        currentMode={currentMode}
        gameModes={gameModes}
        onClose={onClose}
        getIndividualModeStats={getIndividualModeStats}
        isGameModeUnlocked={isGameModeUnlocked}
        handleModeSelect={handleModeSelect}
        handleModeUnlock={handleModeUnlock}
        {...rest}
      />
      <NotificationDisplay notification={notification} />
    </>
  );
};

/**
 * ゲームモードロジックのカスタムフック
 */
const useGameModeLogic = (
  playerProfile: PlayerProfile,
  onModeSelect: (mode: GameMode) => void,
  onModeUnlock: ((mode: GameMode) => void) | undefined,
  setNotification: React.Dispatch<
    React.SetStateAction<{
      type: 'success' | 'error' | 'unlock';
      message: string;
      isVisible: boolean;
    } | null>
  >
): {
  getIndividualModeStats: (modeId: string) => {
    gamesPlayed: number;
    highScore: number;
  };
  isGameModeUnlocked: (modeId: string) => boolean;
  handleModeSelect: (mode: GameMode) => void;
  handleModeUnlock: (mode: GameMode) => void;
  showNotification: (
    type: 'success' | 'error' | 'unlock',
    message: string
  ) => void;
} => {
  const getIndividualModeStats = createModeStatsGetter(playerProfile);
  const isGameModeUnlocked = createModeUnlockChecker(playerProfile);
  const showNotification = createNotificationHandler(setNotification);
  const handleModeSelect = createModeSelectHandler(
    onModeSelect,
    showNotification
  );
  const handleModeUnlock = createModeUnlockHandler(
    onModeUnlock,
    showNotification
  );

  return {
    getIndividualModeStats,
    isGameModeUnlocked,
    handleModeSelect,
    handleModeUnlock,
    showNotification,
  };
};

const createModeStatsGetter = (playerProfile: PlayerProfile) => {
  return (modeId: string): { gamesPlayed: number; highScore: number } => {
    const gameModeStats = playerProfile.gameModeStats ?? {
      gamesPlayedByMode: {},
      highScoresByMode: {},
    };

    return {
      gamesPlayed: gameModeStats.gamesPlayedByMode[modeId] ?? 0,
      highScore: gameModeStats.highScoresByMode[modeId] ?? 0,
    };
  };
};

const createModeUnlockChecker = (playerProfile: PlayerProfile) => {
  return (modeId: string): boolean => {
    if (modeId === 'normal') return true;

    const level = playerProfile.level ?? 1;

    switch (modeId) {
      case 'hardcore':
        return level >= 5;
      case 'survival':
        return level >= 10;
      default:
        return false;
    }
  };
};

const createNotificationHandler = (
  setNotification: React.Dispatch<
    React.SetStateAction<{
      type: 'success' | 'error' | 'unlock';
      message: string;
      isVisible: boolean;
    } | null>
  >
) => {
  return (type: 'success' | 'error' | 'unlock', message: string): void => {
    setNotification({ type, message, isVisible: true });

    setTimeout(() => {
      setNotification(prev => (prev ? { ...prev, isVisible: false } : null));

      setTimeout(() => {
        setNotification(null);
      }, 500);
    }, 3000);
  };
};

const createModeSelectHandler = (
  onModeSelect: (mode: GameMode) => void,
  showNotification: (
    type: 'success' | 'error' | 'unlock',
    message: string
  ) => void
) => {
  return (mode: GameMode): void => {
    try {
      onModeSelect(mode);
      showNotification('success', `${mode.name}を選択しました！`);
    } catch {
      showNotification('error', 'モード変更に失敗しました');
    }
  };
};

const createModeUnlockHandler = (
  onModeUnlock: ((mode: GameMode) => void) | undefined,
  showNotification: (
    type: 'success' | 'error' | 'unlock',
    message: string
  ) => void
) => {
  return (mode: GameMode): void => {
    if (onModeUnlock) {
      try {
        onModeUnlock(mode);
        showNotification('unlock', `${mode.name}が利用可能になりました！`);
      } catch {
        showNotification('error', 'モード解除に失敗しました');
      }
    }
  };
};

/**
 * ゲームモードセレクターのメインコンテンツ
 */
const GameModeSelectorContent: React.FC<{
  className: string;
  style?: React.CSSProperties;
  testId?: string;
  currentMode: GameMode;
  gameModes: GameMode[];
  onClose: () => void;
  getIndividualModeStats: (modeId: string) => {
    gamesPlayed: number;
    highScore: number;
  };
  isGameModeUnlocked: (modeId: string) => boolean;
  handleModeSelect: (mode: GameMode) => void;
  handleModeUnlock: (mode: GameMode) => void;
  [key: string]: unknown;
}> = ({
  className,
  style,
  testId,
  currentMode,
  gameModes,
  onClose,
  getIndividualModeStats,
  isGameModeUnlocked,
  handleModeSelect,
  handleModeUnlock,
  ...rest
}) => (
  <div
    className={`game-mode-selector ${className}`}
    style={style}
    data-testid={testId}
    {...rest}
  >
    <SelectorHeader currentMode={currentMode} onClose={onClose} />
    <ModeList
      gameModes={gameModes}
      currentMode={currentMode}
      getIndividualModeStats={getIndividualModeStats}
      isGameModeUnlocked={isGameModeUnlocked}
      handleModeSelect={handleModeSelect}
      handleModeUnlock={handleModeUnlock}
    />
  </div>
);

/**
 * セレクターヘッダーコンポーネント
 */
const SelectorHeader: React.FC<{
  currentMode: GameMode;
  onClose: () => void;
}> = ({ currentMode, onClose }) => (
  <div className='selector-header'>
    <div className='selector-title'>
      <h2>🎮 ゲームモード選択</h2>
      <Button onClick={onClose} className='close-button'>
        ×
      </Button>
    </div>
    <div className='current-mode' id='current-mode'>
      <span className='mode-label'>現在のモード:</span>
      <span className='mode-name'>{currentMode.name}</span>
    </div>
  </div>
);

/**
 * モードリストコンポーネント
 */
const ModeList: React.FC<{
  gameModes: GameMode[];
  currentMode: GameMode;
  getIndividualModeStats: (modeId: string) => {
    gamesPlayed: number;
    highScore: number;
  };
  isGameModeUnlocked: (modeId: string) => boolean;
  handleModeSelect: (mode: GameMode) => void;
  handleModeUnlock: (mode: GameMode) => void;
}> = ({
  gameModes,
  currentMode,
  getIndividualModeStats,
  isGameModeUnlocked,
  handleModeSelect,
  handleModeUnlock,
}) => (
  <div className='mode-list' id='mode-list'>
    {gameModes.map(mode => {
      const isUnlocked = isGameModeUnlocked(mode.id);
      const isCurrent = mode.id === currentMode.id;
      const stats = getIndividualModeStats(mode.id);

      return (
        <GameModeItem
          key={mode.id}
          mode={mode}
          isUnlocked={isUnlocked}
          isCurrent={isCurrent}
          stats={stats}
          onSelect={handleModeSelect}
          onUnlock={handleModeUnlock}
        />
      );
    })}
  </div>
);

/**
 * 通知表示コンポーネント
 */
const NotificationDisplay: React.FC<{
  notification: {
    type: 'success' | 'error' | 'unlock';
    message: string;
    isVisible: boolean;
  } | null;
}> = ({ notification }) => {
  // 通知アイコンを取得
  const getNotificationIcon = (
    type: 'success' | 'error' | 'unlock'
  ): string => {
    switch (type) {
      case 'success':
        return '🎮';
      case 'unlock':
        return '🔓';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  const getNotificationTitle = (
    type: 'success' | 'error' | 'unlock'
  ): string => {
    switch (type) {
      case 'success':
        return 'ゲームモード変更';
      case 'unlock':
        return '新モード解除！';
      case 'error':
        return 'エラー';
      default:
        return '';
    }
  };

  if (!notification) {
    return null;
  }

  return (
    <div
      className={`mode-notification ${notification.type} ${notification.isVisible ? '' : 'fade-out'}`}
    >
      <div className='notification-content'>
        <div className='notification-icon'>
          {getNotificationIcon(notification.type)}
        </div>
        <div className='notification-text'>
          <h4>{getNotificationTitle(notification.type)}</h4>
          <p>{notification.message}</p>
        </div>
      </div>
    </div>
  );
};

export default GameModeSelector;
