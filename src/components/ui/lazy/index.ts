/**
 * Lazy Loading Components Entry Point
 * 動的インポート専用のコンポーネントエクスポート
 *
 * このファイルは純粋に動的インポートで使用され、
 * 静的インポートからは除外されます。
 */

// React関連の動的インポートヘルパー
export const loadReactDependencies = async (): Promise<{
  createElement: typeof import('react').createElement;
  Component: typeof import('react').Component;
  useState: typeof import('react').useState;
  useEffect: typeof import('react').useEffect;
  useCallback: typeof import('react').useCallback;
  useMemo: typeof import('react').useMemo;
  createRoot: typeof import('react-dom/client').createRoot;
}> => {
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
export const loadAchievementPanel = async (): Promise<
  typeof import('../AchievementPanel.js').AchievementPanel
> => {
  const { AchievementPanel } = await import('../AchievementPanel.js');
  return AchievementPanel;
};

export const loadGameModeSelector = async (): Promise<
  typeof import('../GameModeSelector.js').GameModeSelector
> => {
  const { GameModeSelector } = await import('../GameModeSelector.js');
  return GameModeSelector;
};

export const loadProgressDisplay = async (): Promise<
  typeof import('../ProgressDisplay.js').ProgressDisplay
> => {
  const { ProgressDisplay } = await import('../ProgressDisplay.js');
  return ProgressDisplay;
};

export const loadUpgradeShop = async (): Promise<
  typeof import('../UpgradeShop.js').UpgradeShop
> => {
  const { UpgradeShop } = await import('../UpgradeShop.js');
  return UpgradeShop;
};

// 全コンポーネントの一括ロード（必要に応じて）
export const loadAllUIComponents = async (): Promise<{
  AchievementPanel: Awaited<ReturnType<typeof loadAchievementPanel>>;
  GameModeSelector: Awaited<ReturnType<typeof loadGameModeSelector>>;
  ProgressDisplay: Awaited<ReturnType<typeof loadProgressDisplay>>;
  UpgradeShop: Awaited<ReturnType<typeof loadUpgradeShop>>;
}> => {
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
