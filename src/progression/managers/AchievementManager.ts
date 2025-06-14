/**
 * Achievement Management System
 *
 * アチーブメントの達成判定、報酬適用、統計管理を担当
 * ProgressManagerと連携してプレイヤー進捗を管理
 */

import {
  ACHIEVEMENTS,
  getAchievementById,
  getAchievementsByCategory,
  getAchievementsByDifficulty,
  getVisibleAchievements,
  getHiddenAchievements,
} from '../data/achievements';
import type {
  Achievement,
  GameSession,
  AchievementUnlockResult,
  AchievementStats,
  CategoryInfo,
  ProgressInfo,
} from '../types/Achievement.js';
import type { PlayerProfile } from '../types/PlayerProfile.js';

/**
 * アチーブメント管理クラス
 *
 * 責任:
 * - アチーブメント達成判定とイベント処理
 * - 報酬計算と適用
 * - 統計情報とカテゴリ分析
 * - 進捗追跡とプレイヤーフィードバック
 */
export class AchievementManager {
  private playerProfile: PlayerProfile;
  private onProfileUpdate: (profile: PlayerProfile) => void;
  private onAchievementUnlocked: (achievement: Achievement) => void;

  constructor(
    playerProfile: PlayerProfile,
    onProfileUpdate: (profile: PlayerProfile) => void,
    onAchievementUnlocked: (achievement: Achievement) => void = () => {}
  ) {
    this.playerProfile = playerProfile;
    this.onProfileUpdate = onProfileUpdate;
    this.onAchievementUnlocked = onAchievementUnlocked;
  }

  /**
   * プレイヤープロファイルを更新
   */
  updateProfile(profile: PlayerProfile): void {
    this.playerProfile = profile;
  }

  /**
   * ゲーム終了時のアチーブメント判定
   * @param gameSession 今回のゲームセッション統計
   * @returns 新たに達成されたアチーブメント一覧
   */
  checkAchievements(gameSession?: GameSession): AchievementUnlockResult[] {
    const results: AchievementUnlockResult[] = [];

    for (const achievement of ACHIEVEMENTS) {
      // 既に達成済みならスキップ
      if (this.isAchievementCompleted(achievement.id)) {
        continue;
      }

      // 達成条件を判定
      const isUnlocked = achievement.condition(this.playerProfile, gameSession);

      if (isUnlocked) {
        const result = this.unlockAchievement(achievement);
        results.push(result);
      }
    }

    // プロファイル更新が必要な場合
    if (results.length > 0) {
      this.onProfileUpdate(this.playerProfile);
    }

    return results;
  }

  /**
   * 特定のアチーブメントを強制解除（デバッグ・テスト用）
   */
  forceUnlockAchievement(
    achievementId: string
  ): AchievementUnlockResult | null {
    const achievement = getAchievementById(achievementId);
    if (!achievement) {
      return null;
    }

    if (this.isAchievementCompleted(achievementId)) {
      return {
        achievement,
        wasAlreadyUnlocked: true,
        rewardApplied: false,
        newUnlocks: [],
      };
    }

    return this.unlockAchievement(achievement);
  }

  /**
   * アチーブメント解除処理の実行
   */
  private unlockAchievement(achievement: Achievement): AchievementUnlockResult {
    // アチーブメントを達成済みリストに追加
    this.playerProfile.completedAchievements.push(achievement.id);

    // 報酬を適用
    const newUnlocks: string[] = [];

    // コインと経験値の報酬
    this.playerProfile.coins += achievement.reward.coins;
    this.playerProfile.experience += achievement.reward.experience;

    // アップグレード解除
    if (achievement.reward.unlockUpgrade) {
      if (
        !this.playerProfile.unlockedUpgrades.includes(
          achievement.reward.unlockUpgrade
        )
      ) {
        this.playerProfile.unlockedUpgrades.push(
          achievement.reward.unlockUpgrade
        );
        newUnlocks.push(`upgrade:${achievement.reward.unlockUpgrade}`);
      }
    }

    // ゲームモード解除（将来の実装のための準備）
    if (achievement.reward.unlockGameMode) {
      newUnlocks.push(`gamemode:${achievement.reward.unlockGameMode}`);
    }

    // レベルアップ判定（経験値追加による）
    this.checkLevelUp();

    // イベント通知
    this.onAchievementUnlocked(achievement);

    return {
      achievement,
      wasAlreadyUnlocked: false,
      rewardApplied: true,
      newUnlocks,
    };
  }

  /**
   * 経験値によるレベルアップ判定
   */
  private checkLevelUp(): void {
    const newLevel = Math.floor(this.playerProfile.experience / 1000) + 1;
    if (newLevel > this.playerProfile.level) {
      this.playerProfile.level = newLevel;
    }
  }

  /**
   * アチーブメント達成状況確認
   */
  isAchievementCompleted(achievementId: string): boolean {
    return this.playerProfile.completedAchievements.includes(achievementId);
  }

  /**
   * アチーブメント進捗情報取得
   */
  getAchievementProgress(achievementId: string): ProgressInfo | null {
    const achievement = getAchievementById(achievementId);
    if (!achievement?.progressTracker) {
      return null;
    }

    return achievement.progressTracker(this.playerProfile);
  }

  /**
   * 全体統計情報取得
   */
  getAchievementStats(): AchievementStats {
    const totalAchievements = ACHIEVEMENTS.length;
    const completedAchievements =
      this.playerProfile.completedAchievements.length;
    const completionPercentage = Math.round(
      (completedAchievements / totalAchievements) * 100
    );

    // 難易度別カウント
    const completedIds = new Set(this.playerProfile.completedAchievements);
    const bronzeCount = getAchievementsByDifficulty('bronze').filter(a =>
      completedIds.has(a.id)
    ).length;
    const silverCount = getAchievementsByDifficulty('silver').filter(a =>
      completedIds.has(a.id)
    ).length;
    const goldCount = getAchievementsByDifficulty('gold').filter(a =>
      completedIds.has(a.id)
    ).length;
    const platinumCount = getAchievementsByDifficulty('platinum').filter(a =>
      completedIds.has(a.id)
    ).length;

    // 隠しアチーブメント発見数
    const hiddenFound = getHiddenAchievements().filter(a =>
      completedIds.has(a.id)
    ).length;

    return {
      totalAchievements,
      completedAchievements,
      completionPercentage,
      bronzeCount,
      silverCount,
      goldCount,
      platinumCount,
      hiddenFound,
    };
  }

  /**
   * カテゴリ別アチーブメント情報取得
   */
  getCategoryInfo(category: Achievement['category']): CategoryInfo {
    const achievements = getAchievementsByCategory(category);
    const completedIds = new Set(this.playerProfile.completedAchievements);
    const completed = achievements.filter(a => completedIds.has(a.id)).length;
    const total = achievements.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      category,
      total,
      completed,
      percentage,
      achievements,
    };
  }

  /**
   * 表示用アチーブメント一覧取得
   * @param includeHidden 隠しアチーブメントを含むかどうか
   * @param category 特定カテゴリのみ取得（オプション）
   * @param difficulty 特定難易度のみ取得（オプション）
   */
  getDisplayAchievements(
    includeHidden: boolean = false,
    category?: Achievement['category'],
    difficulty?: Achievement['difficulty']
  ): Achievement[] {
    let achievements = includeHidden ? ACHIEVEMENTS : getVisibleAchievements();

    if (category) {
      achievements = achievements.filter(a => a.category === category);
    }

    if (difficulty) {
      achievements = achievements.filter(a => a.difficulty === difficulty);
    }

    return achievements;
  }

  /**
   * 達成済みアチーブメント一覧取得
   */
  getCompletedAchievements(): Achievement[] {
    const completedIds = new Set(this.playerProfile.completedAchievements);
    return ACHIEVEMENTS.filter(achievement => completedIds.has(achievement.id));
  }

  /**
   * 未達成アチーブメント一覧取得
   */
  getIncompleteAchievements(): Achievement[] {
    const completedIds = new Set(this.playerProfile.completedAchievements);
    return ACHIEVEMENTS.filter(
      achievement => !completedIds.has(achievement.id)
    );
  }

  /**
   * 達成可能なアチーブメント一覧取得（進捗50%以上）
   */
  getAchievableAchievements(): Achievement[] {
    return this.getIncompleteAchievements().filter(achievement => {
      if (!achievement.progressTracker) return false;

      const progress = achievement.progressTracker(this.playerProfile);
      return progress.current / progress.required >= 0.5;
    });
  }

  /**
   * 最近達成されたアチーブメント取得（最新5件）
   */
  getRecentAchievements(): Achievement[] {
    const recentIds = this.playerProfile.completedAchievements.slice(-5);
    return recentIds
      .map(id => getAchievementById(id))
      .filter(
        (achievement): achievement is Achievement => achievement !== undefined
      )
      .reverse(); // 新しい順
  }

  /**
   * アチーブメント完了率取得
   */
  getCompletionPercentage(): number {
    const total = ACHIEVEMENTS.length;
    const completed = this.playerProfile.completedAchievements.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  /**
   * 次の目標アチーブメント取得（進捗が最も進んでいるもの）
   */
  getNextTargetAchievement(): Achievement | null {
    const incomplete = this.getIncompleteAchievements().filter(
      achievement => achievement.progressTracker && !achievement.hidden
    );

    if (incomplete.length === 0) return null;

    // 進捗率でソート
    const withProgress = incomplete
      .map(achievement => {
        const progress = achievement.progressTracker!(this.playerProfile);
        const progressRatio = progress.current / progress.required;
        return { achievement, progressRatio };
      })
      .sort((a, b) => b.progressRatio - a.progressRatio);

    return withProgress[0]?.achievement || null;
  }

  /**
   * 総獲得報酬統計
   */
  getTotalRewardsEarned(): { coins: number; experience: number } {
    const completedAchievements = this.getCompletedAchievements();

    return completedAchievements.reduce(
      (total, achievement) => {
        total.coins += achievement.reward.coins;
        total.experience += achievement.reward.experience;
        return total;
      },
      { coins: 0, experience: 0 }
    );
  }
}
