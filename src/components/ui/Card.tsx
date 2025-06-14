import React from 'react';
import { BaseComponentProps, ComponentSize } from '../../types/react';

/**
 * Card コンポーネントのProps
 */
export interface CardProps extends BaseComponentProps {
  /** カードのサイズ */
  size?: ComponentSize;
  /** ヘッダータイトル */
  title?: string;
  /** ヘッダーアイコン */
  headerIcon?: string;
  /** フッター要素 */
  footer?: React.ReactNode;
  /** ホバー効果の有無 */
  hoverable?: boolean;
  /** クリック可能かどうか */
  clickable?: boolean;
  /** クリックハンドラー */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  /** 境界線の有無 */
  bordered?: boolean;
  /** 影の深さ */
  shadowLevel?: 'none' | 'low' | 'medium' | 'high';
}

/**
 * ゲーム風スタイルのCardコンポーネント
 * Space Shooterゲームのデザインに最適化
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  style,
  size = 'medium',
  title,
  headerIcon,
  footer,
  hoverable = false,
  clickable = false,
  onClick,
  bordered = true,
  shadowLevel = 'medium',
  testId,
  ...props
}) => {
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (onClick && clickable) {
      onClick(event);
    }
  };

  const getSizeStyles = (size: ComponentSize): React.CSSProperties => {
    const sizes = {
      small: {
        padding: '12px',
        borderRadius: '6px',
      },
      medium: {
        padding: '16px',
        borderRadius: '8px',
      },
      large: {
        padding: '24px',
        borderRadius: '12px',
      },
      xlarge: {
        padding: '32px',
        borderRadius: '16px',
      },
    };
    return sizes[size];
  };

  const getShadowStyles = (
    level: CardProps['shadowLevel']
  ): React.CSSProperties => {
    const shadows = {
      none: { boxShadow: 'none' },
      low: { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)' },
      medium: { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' },
      high: { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)' },
    };
    return shadows[level || 'medium'];
  };

  const baseStyles: React.CSSProperties = {
    backgroundColor: 'rgba(30, 30, 60, 0.9)',
    backdropFilter: 'blur(10px)',
    border: bordered ? '1px solid rgba(97, 218, 251, 0.3)' : 'none',
    color: '#fff',
    cursor: clickable ? 'pointer' : 'default',
    transition: 'all 0.3s ease-in-out',
    position: 'relative',
    overflow: 'hidden',
    ...getSizeStyles(size),
    ...getShadowStyles(shadowLevel),
  };

  const cardStyles: React.CSSProperties = {
    ...baseStyles,
    ...style,
  };

  const hoverStyles: React.CSSProperties = {
    transform: 'translateY(-4px)',
    boxShadow:
      '0 8px 25px rgba(97, 218, 251, 0.2), 0 4px 10px rgba(0, 0, 0, 0.3)',
    borderColor: 'rgba(97, 218, 251, 0.6)',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(97, 218, 251, 0.2)',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#61dafb',
  };

  const footerStyles: React.CSSProperties = {
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(97, 218, 251, 0.2)',
  };

  const glowEffectStyles: React.CSSProperties = {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    background:
      'linear-gradient(45deg, transparent 30%, rgba(97, 218, 251, 0.1) 50%, transparent 70%)',
    transform: 'translateX(-100%)',
    transition: 'transform 0.6s ease-in-out',
    pointerEvents: 'none',
  };

  return (
    <div
      className={`space-shooter-card ${className}`}
      style={cardStyles}
      onClick={handleClick}
      data-testid={testId}
      onMouseEnter={e => {
        if (hoverable || clickable) {
          Object.assign(e.currentTarget.style, hoverStyles);
          // グロー効果
          const glowElement = e.currentTarget.querySelector(
            '.card-glow'
          ) as HTMLElement;
          if (glowElement) {
            glowElement.style.transform = 'translateX(100%)';
          }
        }
      }}
      onMouseLeave={e => {
        if (hoverable || clickable) {
          Object.assign(e.currentTarget.style, cardStyles);
          // グロー効果リセット
          const glowElement = e.currentTarget.querySelector(
            '.card-glow'
          ) as HTMLElement;
          if (glowElement) {
            glowElement.style.transform = 'translateX(-100%)';
          }
        }
      }}
      {...props}
    >
      {/* グロー効果 */}
      {(hoverable || clickable) && (
        <div className='card-glow' style={glowEffectStyles} />
      )}

      {/* ヘッダー */}
      {(title || headerIcon) && (
        <div style={headerStyles}>
          {headerIcon && (
            <span style={{ fontSize: '1.2em' }}>{headerIcon}</span>
          )}
          {title && <span>{title}</span>}
        </div>
      )}

      {/* メインコンテンツ */}
      <div className='card-content'>{children}</div>

      {/* フッター */}
      {footer && <div style={footerStyles}>{footer}</div>}
    </div>
  );
};

export default Card;
