import React from 'react';
import { GameModeModifiersProps } from '../../types/react/index';

/**
 * ゲームモード修飾子表示コンポーネント
 */
export const GameModeModifiers: React.FC<GameModeModifiersProps> = ({
  modifiers,
  className = '',
  style,
  testId,
  ...rest
}) => {
  const modifiersList = React.useMemo(() => {
    const list: string[] = [];

    if (modifiers.enemyHealthMultiplier !== 1) {
      const percentage = Math.round(modifiers.enemyHealthMultiplier * 100);
      list.push(`敵体力: ${percentage}%`);
    }

    if (modifiers.enemySpeedMultiplier !== 1) {
      const percentage = Math.round(modifiers.enemySpeedMultiplier * 100);
      list.push(`敵速度: ${percentage}%`);
    }

    if (modifiers.enemySpawnRateMultiplier !== 1) {
      const percentage = Math.round(modifiers.enemySpawnRateMultiplier * 100);
      list.push(`敵出現率: ${percentage}%`);
    }

    if (modifiers.scoreMultiplier !== 1) {
      const percentage = Math.round(modifiers.scoreMultiplier * 100);
      list.push(`スコア: ${percentage}%`);
    }

    if (modifiers.coinMultiplier !== 1) {
      const percentage = Math.round(modifiers.coinMultiplier * 100);
      list.push(`コイン: ${percentage}%`);
    }

    if (modifiers.experienceMultiplier !== 1) {
      const percentage = Math.round(modifiers.experienceMultiplier * 100);
      list.push(`経験値: ${percentage}%`);
    }

    return list;
  }, [modifiers]);

  return (
    <div
      className={`mode-modifiers ${className}`}
      style={style}
      data-testid={testId}
      {...rest}
    >
      <h4>モード効果:</h4>
      {modifiersList.length > 0 ? (
        <ul>
          {modifiersList.map((modifier, index) => (
            <li key={index}>{modifier}</li>
          ))}
        </ul>
      ) : (
        <p>標準設定</p>
      )}
    </div>
  );
};

export default GameModeModifiers;
