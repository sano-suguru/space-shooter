import React from 'react';

import {
  ClickableProps,
  ComponentSize,
  ComponentVariant,
} from '../../types/react';

/**
 * Button コンポーネントのProps
 */
export interface ButtonProps extends ClickableProps {
  /** ボタンのバリアント */
  variant?: ComponentVariant;
  /** ボタンのサイズ */
  size?: ComponentSize;
  /** フルワイドかどうか */
  fullWidth?: boolean;
  /** アイコン */
  icon?: string;
  /** アイコンの位置 */
  iconPosition?: 'left' | 'right';
  /** ローディング状態 */
  loading?: boolean;
  /** HTMLボタンのtype属性 */
  type?: 'button' | 'submit' | 'reset';
}

/**
 * バリアントスタイルを取得
 */
const getVariantStyles = (variant: ComponentVariant): React.CSSProperties => {
  const variants = {
    primary: {
      backgroundColor: '#61dafb',
      color: '#fff',
      border: '2px solid #61dafb',
      boxShadow: '0 0 10px rgba(97, 218, 251, 0.3)',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: '#61dafb',
      border: '2px solid #61dafb',
      boxShadow: '0 0 5px rgba(97, 218, 251, 0.2)',
    },
    success: {
      backgroundColor: '#4caf50',
      color: '#fff',
      border: '2px solid #4caf50',
      boxShadow: '0 0 10px rgba(76, 175, 80, 0.3)',
    },
    warning: {
      backgroundColor: '#ff9800',
      color: '#fff',
      border: '2px solid #ff9800',
      boxShadow: '0 0 10px rgba(255, 152, 0, 0.3)',
    },
    error: {
      backgroundColor: '#f44336',
      color: '#fff',
      border: '2px solid #f44336',
      boxShadow: '0 0 10px rgba(244, 67, 54, 0.3)',
    },
    info: {
      backgroundColor: '#2196f3',
      color: '#fff',
      border: '2px solid #2196f3',
      boxShadow: '0 0 10px rgba(33, 150, 243, 0.3)',
    },
  };
  return variants[variant];
};

/**
 * サイズスタイルを取得
 */
const getSizeStyles = (size: ComponentSize): React.CSSProperties => {
  const sizes = {
    small: {
      padding: '6px 12px',
      fontSize: '12px',
      minHeight: '28px',
    },
    medium: {
      padding: '10px 20px',
      fontSize: '14px',
      minHeight: '36px',
    },
    large: {
      padding: '14px 28px',
      fontSize: '16px',
      minHeight: '44px',
    },
    xlarge: {
      padding: '18px 36px',
      fontSize: '18px',
      minHeight: '52px',
    },
  };
  return sizes[size];
};

/**
 * ボタンスタイルを構築
 */
const buildButtonStyles = (
  variant: ComponentVariant,
  size: ComponentSize,
  fullWidth: boolean,
  disabled: boolean,
  loading: boolean,
  customStyle?: React.CSSProperties
): React.CSSProperties => {
  const baseStyles: React.CSSProperties = {
    fontFamily: 'inherit',
    fontWeight: 'bold',
    borderRadius: '6px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease-in-out',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    position: 'relative',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
    ...getVariantStyles(variant),
    ...getSizeStyles(size),
  };

  return {
    ...baseStyles,
    ...customStyle,
  };
};

/**
 * ローディングスピナーをレンダリング
 */
const renderLoadingSpinner = (): React.ReactElement => (
  <span
    style={{
      display: 'inline-block',
      width: '16px',
      height: '16px',
      border: '2px solid transparent',
      borderTop: '2px solid currentColor',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }}
  />
);

/**
 * アイコンをレンダリング
 */
const renderIcon = (icon: string): React.ReactElement => (
  <span style={{ fontSize: '1.2em' }}>{icon}</span>
);

/**
 * マウスイベントハンドラーを作成
 */
const createMouseHandlers = (
  disabled: boolean,
  loading: boolean,
  buttonStyles: React.CSSProperties,
  hoverStyles: React.CSSProperties
): {
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => void;
} => ({
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>): void => {
    if (!disabled && !loading) {
      Object.assign(e.currentTarget.style, hoverStyles);
    }
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>): void => {
    if (!disabled && !loading) {
      Object.assign(e.currentTarget.style, buttonStyles);
    }
  },
});

/**
 * ボタンコンテンツをレンダリング
 */
const renderButtonContent = (
  loading: boolean,
  icon?: string,
  iconPosition?: 'left' | 'right',
  children?: React.ReactNode
): React.ReactNode => {
  if (loading) {
    return renderLoadingSpinner();
  }

  return (
    <>
      {icon && iconPosition === 'left' && renderIcon(icon)}
      {children && <span>{children}</span>}
      {icon && iconPosition === 'right' && renderIcon(icon)}
    </>
  );
};

/**
 * ゲーム風スタイルのButtonコンポーネント
 * Space Shooterゲームのデザインに最適化
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  style,
  onClick,
  testId,
  ...props
}) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    if (disabled || loading) return;
    onClick?.(event);
  };

  const buttonStyles = buildButtonStyles(
    variant,
    size,
    fullWidth,
    disabled,
    loading,
    style
  );

  const hoverStyles: React.CSSProperties = {
    transform: 'translateY(-2px)',
    filter: 'brightness(1.1)',
  };

  const mouseHandlers = createMouseHandlers(
    disabled,
    loading,
    buttonStyles,
    hoverStyles
  );

  return (
    <button
      type={type}
      className={`space-shooter-button ${className}`}
      style={buttonStyles}
      onClick={handleClick}
      disabled={disabled || loading}
      data-testid={testId}
      {...mouseHandlers}
      {...props}
    >
      {renderButtonContent(loading, icon, iconPosition, children)}

      {/* CSS-in-JSでアニメーション定義 */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </button>
  );
};

export default Button;
