/**
 * React.lazy() Code Splitting System
 * Phase 4.3: Advanced Code Splitting with React.lazy() and Suspense
 */

import React, { Suspense, ComponentType } from 'react';

// ローディングコンポーネント
export const LazyLoadingSpinner: React.FC<{ message?: string }> = ({
  message = 'コンポーネントを読み込み中...',
}) => (
  <div className='lazy-loading-container'>
    <div className='loading-spinner'></div>
    <p className='loading-message'>{message}</p>
  </div>
);

// エラーバウンダリ
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class LazyComponentErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ComponentType<{ error: Error }> }>,
  ErrorBoundaryState
> {
  constructor(
    props: React.PropsWithChildren<{
      fallback?: React.ComponentType<{ error: Error }>;
    }>
  ) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback ?? DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} />;
    }

    return this.props.children;
  }
}

// デフォルトエラーフォールバック
const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className='lazy-error-container'>
    <h3>コンポーネントの読み込みに失敗しました</h3>
    <p>{error.message}</p>
    <button onClick={() => window.location.reload()} className='retry-button'>
      再読み込み
    </button>
  </div>
);

// 遅延読み込みコンポーネントのラッパー
export const withLazyLoading = <P extends object>(
  LazyComponent: React.LazyExoticComponent<ComponentType<P>>,
  loadingMessage?: string,
  ErrorFallback?: React.ComponentType<{ error: Error }>
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <LazyComponentErrorBoundary fallback={ErrorFallback}>
      <Suspense fallback={<LazyLoadingSpinner message={loadingMessage} />}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    </LazyComponentErrorBoundary>
  ));
};

// React.lazy()を使用したコンポーネント定義
export const LazyAchievementPanel = React.lazy(() =>
  import('../AchievementPanel.tsx').then(module => ({
    default: module.AchievementPanel,
  }))
);

export const LazyGameModeSelector = React.lazy(() =>
  import('../GameModeSelector.tsx').then(module => ({
    default: module.GameModeSelector,
  }))
);

export const LazyProgressDisplay = React.lazy(() =>
  import('../ProgressDisplay.tsx').then(module => ({
    default: module.ProgressDisplay,
  }))
);

export const LazyUpgradeShop = React.lazy(() =>
  import('../UpgradeShop.tsx').then(module => ({
    default: module.UpgradeShop,
  }))
);

// ラッパー済みコンポーネント（すぐに使用可能）
export const SafeAchievementPanel = withLazyLoading(
  LazyAchievementPanel,
  '実績パネルを読み込み中...'
);

export const SafeGameModeSelector = withLazyLoading(
  LazyGameModeSelector,
  'ゲームモード選択を読み込み中...'
);

export const SafeProgressDisplay = withLazyLoading(
  LazyProgressDisplay,
  '進捗表示を読み込み中...'
);

export const SafeUpgradeShop = withLazyLoading(
  LazyUpgradeShop,
  'アップグレードショップを読み込み中...'
);

// 段階的ロードパターン用のプリローダー
export class ComponentPreloader {
  private static preloadedComponents = new Set<string>();

  // コンポーネントの事前読み込み
  static async preload(
    componentName: 'achievement' | 'gamemode' | 'progress' | 'upgrade'
  ): Promise<void> {
    if (this.preloadedComponents.has(componentName)) {
      return;
    }

    try {
      switch (componentName) {
        case 'achievement':
          await import('../AchievementPanel.tsx');
          break;
        case 'gamemode':
          await import('../GameModeSelector.tsx');
          break;
        case 'progress':
          await import('../ProgressDisplay.tsx');
          break;
        case 'upgrade':
          await import('../UpgradeShop.tsx');
          break;
      }
      this.preloadedComponents.add(componentName);
    } catch (error) {
      console.warn(`Failed to preload component ${componentName}:`, error);
    }
  }

  // 複数コンポーネントの並列事前読み込み
  static async preloadMultiple(
    componentNames: Array<'achievement' | 'gamemode' | 'progress' | 'upgrade'>
  ): Promise<void> {
    await Promise.allSettled(componentNames.map(name => this.preload(name)));
  }

  // 全コンポーネントの事前読み込み
  static async preloadAll(): Promise<void> {
    await this.preloadMultiple([
      'achievement',
      'gamemode',
      'progress',
      'upgrade',
    ]);
  }

  // プリロード状態の確認
  static isPreloaded(componentName: string): boolean {
    return this.preloadedComponents.has(componentName);
  }

  // プリロード状態のリセット（テスト用）
  static reset(): void {
    this.preloadedComponents.clear();
  }
}

// 段階的ロードのフック
export const useProgressiveLoading = () => {
  const [loadingStage, setLoadingStage] = React.useState<
    'initial' | 'core' | 'secondary' | 'complete'
  >('initial');

  const startProgressiveLoad = React.useCallback(async () => {
    setLoadingStage('core');

    // コア機能（進捗表示）を最初にロード
    await ComponentPreloader.preload('progress');

    setLoadingStage('secondary');

    // セカンダリ機能（アップグレードショップ、実績）を並列ロード
    await ComponentPreloader.preloadMultiple(['upgrade', 'achievement']);

    // 最後にゲームモード選択をロード
    await ComponentPreloader.preload('gamemode');

    setLoadingStage('complete');
  }, []);

  return {
    loadingStage,
    startProgressiveLoad,
    isLoading: loadingStage !== 'complete',
  };
};
