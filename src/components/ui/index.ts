/**
 * UI Components Index
 * Space Shooter用基本UIコンポーネントのエクスポート
 */

export { Button, type ButtonProps } from './Button';
export { Card, type CardProps } from './Card';
export { ProgressBar } from './ProgressBar';
export { PlayerStats } from './PlayerStats';
export { CategoryTabs } from './CategoryTabs';
export { UpgradeItem } from './UpgradeItem';
// export { UpgradeShop } from './UpgradeShop'; // React.lazy()で動的インポートするためコメントアウト
// export { AchievementPanel } from './AchievementPanel'; // React.lazy()で動的インポートするためコメントアウト
export { AchievementItem } from './AchievementItem';
export { AchievementStats } from './AchievementStats';
export { AchievementCategoryTabs } from './AchievementCategoryTabs';
// export { GameModeSelector } from './GameModeSelector'; // React.lazy()で動的インポートするためコメントアウト
export { GameModeItem } from './GameModeItem';
export { GameModeStats } from './GameModeStats';
export { GameModeModifiers } from './GameModeModifiers';
// export { ProgressDisplay } from './ProgressDisplay'; // React.lazy()で動的インポートするためコメントアウト
export { ProgressHeader } from './ProgressHeader';
export { ExperienceBar } from './ExperienceBar';
export { QuickStats } from './QuickStats';
export { StatItem } from './StatItem';
export { WeaponItem } from './WeaponItem';
export { WeaponShopSection } from './WeaponShopSection';
export { WeaponSwitcher } from './WeaponSwitcher';

// 型定義のエクスポート
export type {
  ProgressBarProps,
  PlayerStatsProps,
  CategoryTabsProps,
  UpgradeItemProps,
  UpgradeShopProps,
  UpgradeCategory,
  AchievementPanelProps,
  AchievementItemProps,
  AchievementStatsProps,
  AchievementCategoryTabsProps,
  AchievementCategory,
  GameModeSelectorProps,
  GameModeItemProps,
  GameModeStatsProps,
  GameModeModifiersProps,
  ProgressDisplayProps,
  ProgressHeaderProps,
  ExperienceBarProps,
  QuickStatsProps,
  StatItemProps,
  NotificationData,
} from '../../types/react/index';
