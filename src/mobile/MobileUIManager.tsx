import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { VirtualJoystick } from '../components/ui/VirtualJoystick';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';
import { Vector2D } from '../types';
import { DeviceDetector } from '../utils/DeviceDetector';

interface MobileUIManagerProps {
  eventEmitter: EventEmitter<EventMap>;
  canvas: HTMLCanvasElement;
}

/**
 * ジョイスティックの位置を更新する関数
 */
const updateJoystickPosition = (
  setJoystickPosition: React.Dispatch<React.SetStateAction<Vector2D>>
): void => {
  setJoystickPosition({
    x: 100,
    y: window.innerHeight - 150,
  });
};

/**
 * 仮想ジョイスティックコンポーネント
 */
const VirtualJoystickComponent: React.FC<{
  joystickPosition: Vector2D;
  onMove: (movement: Vector2D) => void;
  onStart: () => void;
  onEnd: () => void;
}> = ({ joystickPosition, onMove, onStart, onEnd }) => (
  <div className='mobile-controls active'>
    <VirtualJoystick
      onMove={onMove}
      onStart={onStart}
      onEnd={onEnd}
      style={{
        position: 'fixed',
        left: `${joystickPosition.x}px`,
        top: `${joystickPosition.y}px`,
        zIndex: 1500,
      }}
    />
  </div>
);

/**
 * タッチアクションボタンコンポーネント
 */
const TouchActionButtons: React.FC<{
  eventEmitter: EventEmitter<EventMap>;
}> = ({ eventEmitter }) => (
  <div className='touch-action-buttons'>
    <button
      className='touch-action-btn shoot'
      onTouchStart={e => {
        e.preventDefault();
        eventEmitter.emit('mobileShootStart');
      }}
      onTouchEnd={e => {
        e.preventDefault();
        eventEmitter.emit('mobileShootEnd');
      }}
      aria-label='射撃'
    >
      🔥
    </button>
    <button
      className='touch-action-btn special'
      onTouchStart={e => {
        e.preventDefault();
        eventEmitter.emit('mobileSpecialStart');
      }}
      onTouchEnd={e => {
        e.preventDefault();
        eventEmitter.emit('mobileSpecialEnd');
      }}
      aria-label='特殊攻撃'
    >
      ⚡
    </button>
  </div>
);

/**
 * モバイルUI統合管理コンポーネント
 */
export const MobileUIManager: React.FC<MobileUIManagerProps> = ({
  eventEmitter,
  canvas: _canvas,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState<Vector2D>({
    x: 100,
    y: window.innerHeight - 150,
  });

  useEffect(() => {
    // モバイルデバイスの場合のみ表示
    setIsVisible(DeviceDetector.isMobile());

    // 画面サイズ変更時の処理
    const handleResize = (): void => {
      updateJoystickPosition(setJoystickPosition);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return (): void => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const handleJoystickMove = (movement: Vector2D): void => {
    eventEmitter.emit('mobileJoystickMove', movement);
  };

  const handleJoystickStart = (): void => {
    // ジョイスティック開始時の処理
  };

  const handleJoystickEnd = (): void => {
    // ジョイスティック終了時の処理
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <VirtualJoystickComponent
        joystickPosition={joystickPosition}
        onMove={handleJoystickMove}
        onStart={handleJoystickStart}
        onEnd={handleJoystickEnd}
      />
      <TouchActionButtons eventEmitter={eventEmitter} />
    </>
  );
};

/**
 * モバイルUI統合システム
 */
export class MobileUIIntegration {
  private root: ReturnType<typeof createRoot> | null = null;
  private container: HTMLElement | null = null;

  constructor(
    private eventEmitter: EventEmitter<EventMap>,
    private canvas: HTMLCanvasElement
  ) {}

  /**
   * モバイルUIを初期化
   */
  public initialize(): void {
    if (!DeviceDetector.isMobile()) {
      return;
    }

    // コンテナを作成
    this.container = document.createElement('div');
    this.container.id = 'mobile-ui-container';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    `;

    document.body.appendChild(this.container);

    // Reactルートを作成
    this.root = createRoot(this.container);
    this.root.render(
      <MobileUIManager eventEmitter={this.eventEmitter} canvas={this.canvas} />
    );
  }

  /**
   * モバイルUIを破棄
   */
  public dispose(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }

    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }

  /**
   * モバイルUIの表示/非表示を切り替え
   */
  public setVisible(visible: boolean): void {
    if (this.container) {
      this.container.style.display = visible ? 'block' : 'none';
    }
  }
}

export default MobileUIIntegration;
