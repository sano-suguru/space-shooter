import React, { useState } from 'react';

import { GameMode } from '../../progression/types/GameMode';
import { GameModeSelectorProps } from '../../types/react/index';

import { Button } from './Button';
import { GameModeItem } from './GameModeItem';

/**
 * ゲームモードセレクターコンポーネント
 */
export const GameModeSelector: React.FC<GameModeSelectorProps> = ({
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
}) => {
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'unlock';
    message: string;
    isVisible: boolean;
  } | null>(null);

  // 個別モードの統計を取得
  const getIndividualModeStats = (
    modeId: string
  ): { gamesPlayed: number; highScore: number } => {
    const gameModeStats = playerProfile.gameModeStats || {
      gamesPlayedByMode: {},
      highScoresByMode: {},
    };

    return {
      gamesPlayed: gameModeStats.gamesPlayedByMode[modeId] || 0,
      highScore: gameModeStats.highScoresByMode[modeId] || 0,
    };
  };

  // モードが解除されているかチェック（簡易実装）
  const isGameModeUnlocked = (modeId: string): boolean => {
    // ノーマルモードは常に解除済み
    if (modeId === 'normal') return true;

    // TODO: 実際の解除条件チェックロジックを実装
    // 現在は簡易実装として、レベルベースの解除を行う
    const level = playerProfile.level || 1;

    switch (modeId) {
      case 'hardcore':
        return level >= 5;
      case 'survival':
        return level >= 10;
      default:
        return false;
    }
  };

  // モード選択ハンドラー
  const handleModeSelect = (mode: GameMode) => {
    try {
      onModeSelect(mode);
      showNotification('success', `${mode.name}を選択しました！`);
    } catch (error) {
      showNotification('error', 'モード変更に失敗しました');
    }
  };

  // モード解除ハンドラー
  const handleModeUnlock = (mode: GameMode) => {
    if (onModeUnlock) {
      try {
        onModeUnlock(mode);
        showNotification('unlock', `${mode.name}が利用可能になりました！`);
      } catch (error) {
        showNotification('error', 'モード解除に失敗しました');
      }
    }
  };

  // 通知表示
  const showNotification = (
    type: 'success' | 'error' | 'unlock',
    message: string
  ) => {
    setNotification({ type, message, isVisible: true });

    // 3秒後に通知を非表示
    setTimeout(() => {
      setNotification(prev => (prev ? { ...prev, isVisible: false } : null));

      // フェードアウト後に通知を削除
      setTimeout(() => {
        setNotification(null);
      }, 500);
    }, 3000);
  };

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

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div
        className={`game-mode-selector ${className}`}
        style={style}
        data-testid={testId}
        {...rest}
      >
        {/* セレクターヘッダー */}
        <div className='selector-header'>
          <div className='selector-title'>
            <h2>🎮 ゲームモード選択</h2>
            <Button onClick={onClose} className='close-button'>
              ×
            </Button>
          </div>

          {/* 現在のモード表示 */}
          <div className='current-mode' id='current-mode'>
            <span className='mode-label'>現在のモード:</span>
            <span className='mode-name'>{currentMode.name}</span>
          </div>
        </div>

        {/* モードリスト */}
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
      </div>

      {/* 通知表示 */}
      {notification && (
        <div
          className={`mode-notification ${notification.type} ${notification.isVisible ? '' : 'fade-out'}`}
        >
          <div className='notification-content'>
            <div className='notification-icon'>
              {getNotificationIcon(notification.type)}
            </div>
            <div className='notification-text'>
              <h4>
                {notification.type === 'success' && 'ゲームモード変更'}
                {notification.type === 'unlock' && '新モード解除！'}
                {notification.type === 'error' && 'エラー'}
              </h4>
              <p>{notification.message}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameModeSelector;
