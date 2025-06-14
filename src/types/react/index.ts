/**
 * React コンポーネント用共通型定義
 */

import React from 'react';
import { UpgradeConfig } from '../../progression/types/Upgrade';
import { Achievement } from '../../progression/types/Achievement';
import { GameMode } from '../../progression/types/GameMode';
import { PlayerProfile } from '../../progression/types/PlayerProfile';

// ====================
// 基本React Props型
// ====================

/**
 * 基本的なReactコンポーネントProps
 */
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  testId?: string;
}

/**
 * クリック可能な要素のProps
 */
export interface ClickableProps extends BaseComponentProps {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * フォーム要素のProps
 */
export interface FormElementProps extends BaseComponentProps {
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
}

// ====================
// ゲーム固有Props型
// ====================

/**
 * アップグレードカテゴリー型
 */
export type UpgradeCategory = 'weapon' | 'defense' | 'utility';

/**
 * アチーブメントカテゴリー型
 */
export type AchievementCategory =
  | 'combat'
  | 'survival'
  | 'collection'
  | 'mastery'
  | 'special';

/**
 * アップグレードショップProps
 */
export interface UpgradeShopProps extends BaseComponentProps {
  isVisible: boolean;
  playerProfile: PlayerProfile;
  availableUpgrades: UpgradeConfig[];
  onClose: () => void;
  onPurchase: (upgradeId: string) => Promise<boolean>;
  onCategoryChange?: (category: UpgradeCategory) => void;
}

/**
 * アップグレードアイテムProps
 */
export interface UpgradeItemProps extends BaseComponentProps {
  upgrade: UpgradeConfig;
  currentLevel: number;
  playerProfile: PlayerProfile;
  onPurchase: (upgradeId: string) => void;
  disabled?: boolean;
}

/**
 * プレイヤー統計Props
 */
export interface PlayerStatsProps extends BaseComponentProps {
  profile: PlayerProfile;
  showLevel?: boolean;
  showExperience?: boolean;
  showCoins?: boolean;
}

/**
 * カテゴリータブProps
 */
export interface CategoryTabsProps extends BaseComponentProps {
  currentCategory: UpgradeCategory;
  onCategoryChange: (category: UpgradeCategory) => void;
  categories: Array<{
    id: UpgradeCategory;
    name: string;
    icon: string;
  }>;
}

/**
 * プログレスバーProps
 */
export interface ProgressBarProps extends BaseComponentProps {
  current: number;
  max: number;
  label?: string;
  color?: string;
  showPercentage?: boolean;
}

/**
 * アチーブメントパネルProps
 */
export interface AchievementPanelProps extends BaseComponentProps {
  isVisible: boolean;
  achievements: Achievement[];
  playerProfile: PlayerProfile;
  onClose: () => void;
  onCategoryChange?: (category: AchievementCategory) => void;
  onAchievementSelect?: (achievement: Achievement) => void;
}

/**
 * アチーブメントアイテムProps
 */
export interface AchievementItemProps extends BaseComponentProps {
  achievement: Achievement;
  isCompleted: boolean;
  progress?: {
    current: number;
    required: number;
  };
  onSelect?: (achievement: Achievement) => void;
}

/**
 * アチーブメントカテゴリータブProps
 */
export interface AchievementCategoryTabsProps extends BaseComponentProps {
  currentCategory: AchievementCategory;
  onCategoryChange: (category: AchievementCategory) => void;
  categories: Array<{
    id: AchievementCategory;
    name: string;
    icon: string;
  }>;
}

/**
 * アチーブメント統計Props
 */
export interface AchievementStatsProps extends BaseComponentProps {
  completedCount: number;
  totalCount: number;
  completionPercentage: number;
}

/**
 * ゲームモードセレクターProps
 */
export interface GameModeSelectorProps extends BaseComponentProps {
  isVisible: boolean;
  gameModes: GameMode[];
  currentMode: GameMode;
  playerProfile: PlayerProfile;
  onClose: () => void;
  onModeSelect: (mode: GameMode) => void;
  onModeUnlock?: (mode: GameMode) => void;
}

/**
 * ゲームモードアイテムProps
 */
export interface GameModeItemProps extends BaseComponentProps {
  mode: GameMode;
  isUnlocked: boolean;
  isCurrent: boolean;
  stats: {
    gamesPlayed: number;
    highScore: number;
  };
  onSelect: (mode: GameMode) => void;
  onUnlock?: (mode: GameMode) => void;
}

/**
 * ゲームモード統計Props
 */
export interface GameModeStatsProps extends BaseComponentProps {
  gamesPlayed: number;
  highScore: number;
}

/**
 * ゲームモード修飾子表示Props
 */
export interface GameModeModifiersProps extends BaseComponentProps {
  modifiers: GameMode['modifiers'];
}

/**
 * プログレス表示Props
 */
export interface ProgressDisplayProps extends BaseComponentProps {
  isVisible: boolean;
  playerProfile: PlayerProfile;
  onClose: () => void;
  onNotificationShow?: (notification: NotificationData) => void;
}

/**
 * プログレスヘッダーProps
 */
export interface ProgressHeaderProps extends BaseComponentProps {
  level: number;
  coins: number;
}

/**
 * 経験値バーProps
 */
export interface ExperienceBarProps extends BaseComponentProps {
  currentExperience: number;
  currentLevel: number;
  nextLevelXP: number;
}

/**
 * クイック統計Props
 */
export interface QuickStatsProps extends BaseComponentProps {
  highScore: number;
  totalGamesPlayed: number;
  enemiesDestroyed: number;
}

/**
 * 統計アイテムProps
 */
export interface StatItemProps extends BaseComponentProps {
  icon: string;
  label: string;
  value: string | number;
  id?: string;
}

/**
 * 通知データ型
 */
export interface NotificationData {
  type: 'levelUp' | 'highScore' | 'experienceGain' | 'coinsEarned';
  title: string;
  message: string;
  icon: string;
  duration?: number;
  data?: {
    level?: number;
    coinsEarned?: number;
    experienceGained?: number;
    newScore?: number;
  };
}

/**
 * アップグレード関連コンポーネントProps（旧型、互換性維持）
 */
export interface UpgradeComponentProps extends BaseComponentProps {
  upgrades: UpgradeConfig[];
  currentLevel?: number;
  coins?: number;
  onPurchase?: (upgrade: UpgradeConfig) => void;
  onPreview?: (upgrade: UpgradeConfig) => void;
}

/**
 * 実績関連コンポーネントProps
 */
export interface AchievementComponentProps extends BaseComponentProps {
  achievements: Achievement[];
  unlockedAchievements?: string[];
  onAchievementSelect?: (achievement: Achievement) => void;
}

/**
 * ゲームモード関連コンポーネントProps
 */
export interface GameModeComponentProps extends BaseComponentProps {
  gameModes: GameMode[];
  currentMode?: string;
  unlockedModes?: string[];
  onModeSelect?: (mode: GameMode) => void;
}

/**
 * プレイヤープロフィール関連コンポーネントProps
 */
export interface ProfileComponentProps extends BaseComponentProps {
  profile: PlayerProfile;
  onProfileUpdate?: (profile: Partial<PlayerProfile>) => void;
}

// ====================
// UI状態管理型
// ====================

/**
 * ローディング状態
 */
export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  progress?: number;
}

/**
 * エラー状態
 */
export interface ErrorState {
  hasError: boolean;
  errorMessage?: string;
  errorCode?: string;
}

/**
 * モーダル状態
 */
export interface ModalState {
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  onClose?: () => void;
  onConfirm?: () => void;
}

/**
 * 通知状態
 */
export interface NotificationState {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  isVisible: boolean;
}

// ====================
// イベントハンドラー型
// ====================

/**
 * ゲーム関連イベントハンドラー
 */
export interface GameEventHandlers {
  onGameStart?: () => void;
  onGamePause?: () => void;
  onGameResume?: () => void;
  onGameReset?: () => void;
  onGameOver?: (score: number) => void;
}

/**
 * UI関連イベントハンドラー
 */
export interface UIEventHandlers {
  onMenuOpen?: (menuType: string) => void;
  onMenuClose?: (menuType: string) => void;
  onSettingsChange?: (key: string, value: string | number | boolean) => void;
  onThemeChange?: (theme: string) => void;
}

// ====================
// カスタムフック型
// ====================

/**
 * ゲーム状態フック戻り値
 */
export interface UseGameStateReturn {
  gameState: 'starting' | 'playing' | 'paused' | 'gameOver';
  score: number;
  level: number;
  health: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * プログレッション状態フック戻り値
 */
export interface UseProgressionReturn {
  profile: PlayerProfile | null;
  upgrades: UpgradeConfig[];
  achievements: Achievement[];
  gameModes: GameMode[];
  isLoading: boolean;
  error: string | null;
  purchaseUpgrade: (upgradeId: string) => Promise<boolean>;
  selectGameMode: (modeId: string) => void;
}

// ====================
// コンポーネント識別型
// ====================

/**
 * UIコンポーネントのタイプ識別
 */
export type UIComponentType =
  | 'upgrade-shop'
  | 'achievement-panel'
  | 'game-mode-selector'
  | 'progress-display'
  | 'settings-menu'
  | 'notification'
  | 'modal';

/**
 * コンポーネントサイズ
 */
export type ComponentSize = 'small' | 'medium' | 'large' | 'xlarge';

/**
 * コンポーネントバリアント
 */
export type ComponentVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

// ====================
// ユーティリティ型
// ====================

/**
 * オプショナルなkey-valueオブジェクト
 */
export type OptionalRecord<K extends string | number | symbol, V> = {
  [P in K]?: V;
};

/**
 * 部分的に必須なオブジェクト
 */
export type PartiallyRequired<T, K extends keyof T> = Partial<T> &
  Required<Pick<T, K>>;

/**
 * React ref型のエイリアス
 */
export type ReactRef<T> = React.RefObject<T>;

// ====================
// コンポーネント共通インターフェース
// ====================

/**
 * Space Shooter UI コンポーネント共通インターフェース
 */
export interface SpaceShooterUIComponent extends BaseComponentProps {
  componentType: UIComponentType;
  size?: ComponentSize;
  variant?: ComponentVariant;
  isVisible?: boolean;
  isDisabled?: boolean;
  onVisibilityChange?: (isVisible: boolean) => void;
}

// ====================
// エクスポート
// ====================

export type {
  // React基本型の再エクスポート
  React,
};

// デフォルトエクスポート用の型集約
export interface ReactTypes {
  BaseComponentProps: BaseComponentProps;
  ClickableProps: ClickableProps;
  FormElementProps: FormElementProps;
  UpgradeComponentProps: UpgradeComponentProps;
  AchievementComponentProps: AchievementComponentProps;
  GameModeComponentProps: GameModeComponentProps;
  ProfileComponentProps: ProfileComponentProps;
  LoadingState: LoadingState;
  ErrorState: ErrorState;
  ModalState: ModalState;
  NotificationState: NotificationState;
  GameEventHandlers: GameEventHandlers;
  UIEventHandlers: UIEventHandlers;
  UseGameStateReturn: UseGameStateReturn;
  UseProgressionReturn: UseProgressionReturn;
  UIComponentType: UIComponentType;
  ComponentSize: ComponentSize;
  ComponentVariant: ComponentVariant;
  SpaceShooterUIComponent: SpaceShooterUIComponent;
}
