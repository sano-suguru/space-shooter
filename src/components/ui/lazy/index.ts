/**
 * Lazy Loading Components Entry Point
 * 動的インポート専用のコンポーネントエクスポート
 *
 * このファイルは純粋に動的インポートで使用され、
 * 静的インポートからは除外されます。
 */

// React関連の動的インポートヘルパー
export const loadReactDependencies = async () => {
  const [
    { createElement, Component, useState, useEffect, useCallback, useMemo },
    { createRoot },
  ] = await Promise.all([import('react'), import('react-dom/client')]);

  return {
    createElement,
    Component,
    useState,
    useEffect,
    useCallback,
    useMemo,
    createRoot,
  };
};

// 個別コンポーネントの動的ロード
export const loadAchievementPanel = async () => {
  const { AchievementPanel } = await import('../AchievementPanel.js');
  return AchievementPanel;
};

export const loadGameModeSelector = async () => {
  const { GameModeSelector } = await import('../GameModeSelector.js');
  return GameModeSelector;
};

export const loadProgressDisplay = async () => {
  const { ProgressDisplay } = await import('../ProgressDisplay.js');
  return ProgressDisplay;
};

export const loadUpgradeShop = async () => {
  const { UpgradeShop } = await import('../UpgradeShop.js');
  return UpgradeShop;
};

// 全コンポーネントの一括ロード（必要に応じて）
export const loadAllUIComponents = async () => {
  const [AchievementPanel, GameModeSelector, ProgressDisplay, UpgradeShop] =
    await Promise.all([
      loadAchievementPanel(),
      loadGameModeSelector(),
      loadProgressDisplay(),
      loadUpgradeShop(),
    ]);

  return {
    AchievementPanel,
    GameModeSelector,
    ProgressDisplay,
    UpgradeShop,
  };
};
