import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Vector2D } from '../../types';
import { HapticFeedback } from '../../utils/HapticFeedback';

interface VirtualJoystickProps {
  onMove: (movement: Vector2D) => void;
  onStart?: () => void;
  onEnd?: () => void;
  maxDistance?: number;
  deadZone?: number;
  className?: string;
  style?: React.CSSProperties;
}

interface TouchPoint {
  id: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface UseVirtualJoystickReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  knobRef: React.RefObject<HTMLDivElement | null>;
  isActive: boolean;
  knobPosition: Vector2D;
}

// ヘルパー関数：タッチポイント作成
const createTouchPoint = (touch: Touch, containerRect: DOMRect): TouchPoint => {
  const centerX = containerRect.left + containerRect.width / 2;
  const centerY = containerRect.top + containerRect.height / 2;

  return {
    id: touch.identifier,
    startX: centerX,
    startY: centerY,
    currentX: touch.clientX,
    currentY: touch.clientY,
  };
};

// ヘルパー関数：ジョイスティック位置計算
const calculateJoystickPosition = (
  touchPoint: TouchPoint,
  maxDistance: number
): Vector2D => {
  const deltaX = touchPoint.currentX - touchPoint.startX;
  const deltaY = touchPoint.currentY - touchPoint.startY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  let knobX = deltaX;
  let knobY = deltaY;

  // 最大距離で制限
  if (distance > maxDistance) {
    const angle = Math.atan2(deltaY, deltaX);
    knobX = Math.cos(angle) * maxDistance;
    knobY = Math.sin(angle) * maxDistance;
  }

  return { x: knobX, y: knobY };
};

// ヘルパー関数：正規化された移動ベクトル計算
const calculateNormalizedMovement = (
  knobPosition: Vector2D,
  maxDistance: number,
  deadZone: number
): Vector2D => {
  let normalizedX = knobPosition.x / maxDistance;
  let normalizedY = knobPosition.y / maxDistance;

  // デッドゾーン適用
  if (Math.abs(normalizedX) < deadZone) normalizedX = 0;
  if (Math.abs(normalizedY) < deadZone) normalizedY = 0;

  return { x: normalizedX, y: normalizedY };
};

// タッチ開始ハンドラー作成
const useTouchStartHandler = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  touchPoint: TouchPoint | null,
  setTouchPoint: React.Dispatch<React.SetStateAction<TouchPoint | null>>,
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>,
  onStart?: () => void
): ((event: TouchEvent) => void) => {
  return useCallback(
    (event: TouchEvent): void => {
      event.preventDefault();

      if (!containerRef.current || touchPoint) return;

      const touch = event.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const newTouchPoint = createTouchPoint(touch, rect);

      setTouchPoint(newTouchPoint);
      setIsActive(true);

      // 触覚フィードバック
      HapticFeedback.vibrate(10);

      onStart?.();
    },
    [containerRef, touchPoint, setTouchPoint, setIsActive, onStart]
  );
};

// タッチ移動ハンドラー作成
const useTouchMoveHandler = (
  touchPoint: TouchPoint | null,
  setTouchPoint: React.Dispatch<React.SetStateAction<TouchPoint | null>>,
  setKnobPosition: React.Dispatch<React.SetStateAction<Vector2D>>,
  maxDistance: number,
  deadZone: number,
  onMove: (movement: Vector2D) => void
): ((event: TouchEvent) => void) => {
  return useCallback(
    (event: TouchEvent): void => {
      event.preventDefault();

      if (!touchPoint) return;

      const touch = Array.from(event.touches).find(
        t => t.identifier === touchPoint.id
      );
      if (!touch) return;

      const updatedTouchPoint = {
        ...touchPoint,
        currentX: touch.clientX,
        currentY: touch.clientY,
      };

      setTouchPoint(updatedTouchPoint);

      const knobPos = calculateJoystickPosition(updatedTouchPoint, maxDistance);
      setKnobPosition(knobPos);

      const normalizedMovement = calculateNormalizedMovement(
        knobPos,
        maxDistance,
        deadZone
      );
      onMove(normalizedMovement);
    },
    [touchPoint, setTouchPoint, maxDistance, setKnobPosition, deadZone, onMove]
  );
};

// タッチ終了ハンドラー作成
const useTouchEndHandler = (
  touchPoint: TouchPoint | null,
  setTouchPoint: React.Dispatch<React.SetStateAction<TouchPoint | null>>,
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>,
  setKnobPosition: React.Dispatch<React.SetStateAction<Vector2D>>,
  onMove: (movement: Vector2D) => void,
  onEnd?: () => void
): ((event: TouchEvent) => void) => {
  return useCallback(
    (event: TouchEvent): void => {
      event.preventDefault();

      if (!touchPoint) return;

      const touch = Array.from(event.changedTouches).find(
        t => t.identifier === touchPoint.id
      );
      if (!touch) return;

      setTouchPoint(null);
      setIsActive(false);
      setKnobPosition({ x: 0, y: 0 });

      // 触覚フィードバック
      HapticFeedback.vibrate(5);

      onMove({ x: 0, y: 0 });
      onEnd?.();
    },
    [touchPoint, setTouchPoint, setIsActive, setKnobPosition, onMove, onEnd]
  );
};

// イベントリスナー設定フック
const useEventListeners = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  handleTouchStart: (event: TouchEvent) => void,
  handleTouchMove: (event: TouchEvent) => void,
  handleTouchEnd: (event: TouchEvent) => void
): void => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    document.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    });
    document.addEventListener('touchend', handleTouchEnd, {
      passive: false,
    });
    document.addEventListener('touchcancel', handleTouchEnd, {
      passive: false,
    });

    return (): void => {
      container.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, containerRef]);
};

// カスタムフック：VirtualJoystickロジック
const useVirtualJoystick = ({
  onMove,
  onStart,
  onEnd,
  maxDistance,
  deadZone,
}: {
  onMove: (movement: Vector2D) => void;
  onStart?: () => void;
  onEnd?: () => void;
  maxDistance: number;
  deadZone: number;
}): UseVirtualJoystickReturn => {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [touchPoint, setTouchPoint] = useState<TouchPoint | null>(null);
  const [knobPosition, setKnobPosition] = useState<Vector2D>({ x: 0, y: 0 });

  const handleTouchStart = useTouchStartHandler(
    containerRef,
    touchPoint,
    setTouchPoint,
    setIsActive,
    onStart
  );

  const handleTouchMove = useTouchMoveHandler(
    touchPoint,
    setTouchPoint,
    setKnobPosition,
    maxDistance,
    deadZone,
    onMove
  );

  const handleTouchEnd = useTouchEndHandler(
    touchPoint,
    setTouchPoint,
    setIsActive,
    setKnobPosition,
    onMove,
    onEnd
  );

  useEventListeners(
    containerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  );

  return {
    containerRef,
    knobRef,
    isActive,
    knobPosition,
  };
};

// スタイル生成関数
const createContainerStyle = (
  isActive: boolean,
  style: React.CSSProperties
): React.CSSProperties => ({
  position: 'relative',
  width: '120px',
  height: '120px',
  background:
    'radial-gradient(circle, rgba(0,255,170,0.3), rgba(0,255,170,0.1))',
  border: '2px solid rgba(0,255,170,0.6)',
  borderRadius: '50%',
  backdropFilter: 'blur(5px)',
  touchAction: 'none',
  userSelect: 'none',
  transition: 'all 0.1s ease',
  transform: isActive ? 'scale(1.05)' : 'scale(1)',
  boxShadow: isActive
    ? '0 0 20px rgba(0,255,170,0.5)'
    : '0 0 10px rgba(0,255,170,0.2)',
  ...style,
});

const createKnobStyle = (
  isActive: boolean,
  knobPosition: Vector2D
): React.CSSProperties => ({
  position: 'absolute',
  width: '40px',
  height: '40px',
  background: 'rgba(0,255,170,0.8)',
  borderRadius: '50%',
  boxShadow: '0 0 15px rgba(0,255,170,0.5)',
  transform: `translate(-50%, -50%) translate(${knobPosition.x}px, ${knobPosition.y}px)`,
  left: '50%',
  top: '50%',
  transition: isActive ? 'none' : 'all 0.2s ease',
  pointerEvents: 'none',
});

export const VirtualJoystick = ({
  onMove,
  onStart,
  onEnd,
  maxDistance = 50,
  deadZone = 0.1,
  className = '',
  style = {},
}: VirtualJoystickProps): React.ReactElement => {
  const { containerRef, knobRef, isActive, knobPosition } = useVirtualJoystick({
    onMove,
    onStart,
    onEnd,
    maxDistance,
    deadZone,
  });

  const containerStyle = createContainerStyle(isActive, style);
  const knobStyle = createKnobStyle(isActive, knobPosition);

  return (
    <div
      ref={containerRef}
      className={`virtual-joystick ${className} ${isActive ? 'active' : ''}`}
      style={containerStyle}
    >
      <div ref={knobRef} className='joystick-knob' style={knobStyle} />
    </div>
  );
};

export default VirtualJoystick;
