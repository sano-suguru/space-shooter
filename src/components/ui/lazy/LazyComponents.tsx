/**
 * React.lazy() Code Splitting System
 * 基本的なコンポーネント遅延読み込み機能
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Lazy component loading error:', error, errorInfo);
  }

  render(): React.ReactNode {
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
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<P> & React.RefAttributes<HTMLElement>
> => {
  return React.forwardRef<HTMLElement, P>((props, ref) => (
    <LazyComponentErrorBoundary fallback={ErrorFallback}>
      <Suspense fallback={<LazyLoadingSpinner message={loadingMessage} />}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    </LazyComponentErrorBoundary>
  ));
};
