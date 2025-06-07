/**
 * Achievement System Types
 * 
 * アチーブメントシステムのためのデータ型定義
 * プレイヤーの達成目標と報酬を管理
 */

import type { PlayerProfile } from './PlayerProfile.js';

/**
 * ゲームセッション統計（アチーブメント判定用）
 */
export interface GameSession {
    score: number;
    waveReached: number;
    enemiesDestroyed: number;
    bossesDefeated: number;
    damageDealt: number;
    damageTaken: number;
    powerupsCollected: number;
    perfectWaves: number;  // ノーダメージウェーブ数
    playTime: number;      // プレイ時間（秒）
}

/**
 * アチーブメント報酬定義
 */
export interface AchievementReward {
    coins: number;
    experience: number;
    unlockUpgrade?: string;     // 解除されるアップグレードID
    unlockGameMode?: string;    // 解除されるゲームモードID
}

/**
 * 進捗追跡情報
 */
export interface ProgressInfo {
    current: number;    // 現在値
    required: number;   // 必要値
}

/**
 * アチーブメント定義
 */
export interface Achievement {
    id: string;
    name: string;
    description: string;
    category: 'combat' | 'survival' | 'collection' | 'mastery' | 'special';
    difficulty: 'bronze' | 'silver' | 'gold' | 'platinum';
    condition: (profile: PlayerProfile, gameStats?: GameSession) => boolean;
    reward: AchievementReward;
    hidden: boolean;
    progressTracker?: (profile: PlayerProfile) => ProgressInfo;
}

/**
 * アチーブメント達成結果
 */
export interface AchievementUnlockResult {
    achievement: Achievement;
    wasAlreadyUnlocked: boolean;
    rewardApplied: boolean;
    newUnlocks: string[];  // 新たに解除されたアップグレード・モードID
}

/**
 * アチーブメント統計情報
 */
export interface AchievementStats {
    totalAchievements: number;
    completedAchievements: number;
    completionPercentage: number;
    bronzeCount: number;
    silverCount: number;
    goldCount: number;
    platinumCount: number;
    hiddenFound: number;
}

/**
 * カテゴリ別アチーブメント情報
 */
export interface CategoryInfo {
    category: Achievement['category'];
    total: number;
    completed: number;
    percentage: number;
    achievements: Achievement[];
}
