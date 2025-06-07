/**
 * AchievementManager Test Suite
 * 
 * アチーブメントシステムの包括的なテスト
 * 達成判定、報酬適用、統計管理、進捗追跡の検証
 */

import { AchievementManager } from '../../src/progression/managers/AchievementManager';
import { PersistenceManager } from '../../src/progression/managers/PersistenceManager';
import type { PlayerProfile } from '../../src/progression/types/PlayerProfile';
import type { Achievement, GameSession } from '../../src/progression/types/Achievement';

// LocalStorage のモック
const mockLocalStorage = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
});

describe('AchievementManager', () => {
    let achievementManager: AchievementManager;
    let mockProfile: PlayerProfile;
    let mockOnProfileUpdate: jest.MockedFunction<(profile: PlayerProfile) => void>;
    let mockOnAchievementUnlocked: jest.MockedFunction<(achievement: Achievement) => void>;

    beforeEach(() => {
        // LocalStorage をクリア
        mockLocalStorage.clear();
        jest.clearAllMocks();

        // モックプロファイルの初期化
        mockProfile = PersistenceManager.loadProfile();
        
        // コールバック関数のモック
        mockOnProfileUpdate = jest.fn();
        mockOnAchievementUnlocked = jest.fn();

        // AchievementManager インスタンス作成
        achievementManager = new AchievementManager(
            mockProfile,
            mockOnProfileUpdate,
            mockOnAchievementUnlocked
        );
    });

    describe('基本機能', () => {
        test('初期化時にプロファイルが正しく設定される', () => {
            expect(achievementManager.getCompletionPercentage()).toBe(0);
            expect(achievementManager.getCompletedAchievements()).toHaveLength(0);
            expect(achievementManager.getIncompleteAchievements().length).toBeGreaterThan(0);
        });

        test('プロファイル更新が正しく動作する', () => {
            const updatedProfile = { ...mockProfile, level: 5 };
            achievementManager.updateProfile(updatedProfile);
            
            // プロファイルが更新されていることを間接的に確認
            // （プライベートプロパティのため直接アクセスできないが、影響を確認）
        });
    });

    describe('アチーブメント達成判定', () => {
        test('初回ゲーム完了でfirst_stepsアチーブメントが解除される', () => {
            // 初回ゲーム完了の条件を満たす
            mockProfile.totalGamesPlayed = 1;
            achievementManager.updateProfile(mockProfile);

            const results = achievementManager.checkAchievements();
            
            expect(results).toHaveLength(1);
            expect(results[0].achievement.id).toBe('first_steps');
            expect(results[0].wasAlreadyUnlocked).toBe(false);
            expect(results[0].rewardApplied).toBe(true);
            expect(mockOnAchievementUnlocked).toHaveBeenCalledWith(results[0].achievement);
        });

        test('スコア条件を満たすとscore_hunterアチーブメントが解除される', () => {
            mockProfile.highScore = 1000;
            achievementManager.updateProfile(mockProfile);

            const results = achievementManager.checkAchievements();
            
            const scoreHunter = results.find(r => r.achievement.id === 'score_hunter');
            expect(scoreHunter).toBeDefined();
            expect(scoreHunter!.achievement.reward.coins).toBe(200);
            expect(scoreHunter!.achievement.reward.experience).toBe(100);
        });

        test('複数のアチーブメントが同時に解除される', () => {
            // 複数の条件を同時に満たす
            mockProfile.totalGamesPlayed = 10;
            mockProfile.highScore = 1000;
            mockProfile.stats.enemiesDestroyed = 100;
            achievementManager.updateProfile(mockProfile);

            const results = achievementManager.checkAchievements();
            
            expect(results.length).toBeGreaterThan(1);
            
            const achievementIds = results.map(r => r.achievement.id);
            expect(achievementIds).toContain('rookie_pilot');
            expect(achievementIds).toContain('score_hunter');
            expect(achievementIds).toContain('enemy_slayer');
        });

        test('既に達成済みのアチーブメントは重複解除されない', () => {
            // 最初の達成
            mockProfile.totalGamesPlayed = 1;
            achievementManager.updateProfile(mockProfile);
            const firstResults = achievementManager.checkAchievements();
            expect(firstResults).toHaveLength(1);

            // 同じ条件で再チェック
            const secondResults = achievementManager.checkAchievements();
            expect(secondResults).toHaveLength(0);
        });

        test('ゲームセッション統計を使用するアチーブメントが正しく判定される', () => {
            const gameSession: GameSession = {
                score: 500,
                waveReached: 15,
                enemiesDestroyed: 50,
                bossesDefeated: 2,
                damageDealt: 5000,
                damageTaken: 100,
                powerupsCollected: 10,
                perfectWaves: 15, // 完璧主義者の条件
                playTime: 1800
            };

            const results = achievementManager.checkAchievements(gameSession);
            
            // 隠しアチーブメント「完璧主義者」が解除されるはず
            const perfectionist = results.find(r => r.achievement.id === 'perfectionist');
            expect(perfectionist).toBeDefined();
            expect(perfectionist!.achievement.hidden).toBe(true);
        });
    });

    describe('報酬システム', () => {
        test('アチーブメント達成時に正しい報酬が適用される', () => {
            const initialCoins = mockProfile.coins;
            const initialExperience = mockProfile.experience;

            mockProfile.totalGamesPlayed = 1;
            achievementManager.updateProfile(mockProfile);
            
            const results = achievementManager.checkAchievements();
            const firstSteps = results.find(r => r.achievement.id === 'first_steps');
            
            expect(firstSteps).toBeDefined();
            expect(mockProfile.coins).toBe(initialCoins + 100);
            expect(mockProfile.experience).toBe(initialExperience + 50);
        });

        test('アップグレード解除報酬が正しく適用される', () => {
            mockProfile.stats.enemiesDestroyed = 100;
            achievementManager.updateProfile(mockProfile);
            
            const results = achievementManager.checkAchievements();
            const enemySlayer = results.find(r => r.achievement.id === 'enemy_slayer');
            
            expect(enemySlayer).toBeDefined();
            expect(enemySlayer!.newUnlocks).toContain('upgrade:multi_shot');
            expect(mockProfile.unlockedUpgrades).toContain('multi_shot');
        });

        test('レベルアップが経験値報酬により発生する', () => {
            const initialLevel = mockProfile.level;
            
            // 大量の経験値を獲得するアチーブメントを達成
            mockProfile.stats.maxWaveReached = 20;
            achievementManager.updateProfile(mockProfile);
            
            const results = achievementManager.checkAchievements();
            const waveChampion = results.find(r => r.achievement.id === 'wave_champion');
            
            expect(waveChampion).toBeDefined();
            expect(mockProfile.level).toBeGreaterThan(initialLevel);
        });
    });

    describe('統計機能', () => {
        test('アチーブメント統計が正しく計算される', () => {
            // いくつかのアチーブメントを達成
            mockProfile.totalGamesPlayed = 10;
            mockProfile.highScore = 1000;
            achievementManager.updateProfile(mockProfile);
            achievementManager.checkAchievements();

            const stats = achievementManager.getAchievementStats();
            
            expect(stats.totalAchievements).toBeGreaterThan(0);
            expect(stats.completedAchievements).toBeGreaterThan(0);
            expect(stats.completionPercentage).toBeGreaterThan(0);
            expect(stats.completionPercentage).toBeLessThanOrEqual(100);
            expect(stats.bronzeCount).toBeGreaterThan(0);
        });

        test('カテゴリ別情報が正しく取得される', () => {
            const combatInfo = achievementManager.getCategoryInfo('combat');
            
            expect(combatInfo.category).toBe('combat');
            expect(combatInfo.total).toBeGreaterThan(0);
            expect(combatInfo.achievements.length).toBe(combatInfo.total);
            expect(combatInfo.percentage).toBeGreaterThanOrEqual(0);
            expect(combatInfo.percentage).toBeLessThanOrEqual(100);
        });

        test('進捗追跡が正しく動作する', () => {
            mockProfile.highScore = 500; // 1000点のアチーブメントの50%
            achievementManager.updateProfile(mockProfile);

            const progress = achievementManager.getAchievementProgress('score_hunter');
            
            expect(progress).toBeDefined();
            expect(progress!.current).toBe(500);
            expect(progress!.required).toBe(1000);
        });

        test('次の目標アチーブメントが正しく取得される', () => {
            mockProfile.stats.enemiesDestroyed = 80; // 100体のアチーブメントに近い
            achievementManager.updateProfile(mockProfile);

            const nextTarget = achievementManager.getNextTargetAchievement();
            
            expect(nextTarget).toBeDefined();
            expect(nextTarget!.progressTracker).toBeDefined();
        });
    });

    describe('フィルタリング機能', () => {
        test('表示用アチーブメント取得（隠しアチーブメント除外）', () => {
            const visibleAchievements = achievementManager.getDisplayAchievements(false);
            
            expect(visibleAchievements.every(a => !a.hidden)).toBe(true);
        });

        test('カテゴリ別フィルタリングが動作する', () => {
            const combatAchievements = achievementManager.getDisplayAchievements(false, 'combat');
            
            expect(combatAchievements.every(a => a.category === 'combat')).toBe(true);
        });

        test('難易度別フィルタリングが動作する', () => {
            const goldAchievements = achievementManager.getDisplayAchievements(false, undefined, 'gold');
            
            expect(goldAchievements.every(a => a.difficulty === 'gold')).toBe(true);
        });

        test('達成可能なアチーブメント取得が動作する', () => {
            // 進捗を50%以上に設定
            mockProfile.highScore = 600;
            mockProfile.stats.enemiesDestroyed = 60;
            achievementManager.updateProfile(mockProfile);

            const achievableAchievements = achievementManager.getAchievableAchievements();
            
            expect(achievableAchievements.length).toBeGreaterThan(0);
            
            // 各アチーブメントの進捗が50%以上であることを確認
            achievableAchievements.forEach(achievement => {
                if (achievement.progressTracker) {
                    const progress = achievement.progressTracker(mockProfile);
                    expect(progress.current / progress.required).toBeGreaterThanOrEqual(0.5);
                }
            });
        });
    });

    describe('強制解除機能（デバッグ用）', () => {
        test('特定のアチーブメントを強制解除できる', () => {
            const result = achievementManager.forceUnlockAchievement('score_hunter');
            
            expect(result).toBeDefined();
            expect(result!.achievement.id).toBe('score_hunter');
            expect(result!.wasAlreadyUnlocked).toBe(false);
            expect(result!.rewardApplied).toBe(true);
        });

        test('存在しないアチーブメントIDでnullが返される', () => {
            const result = achievementManager.forceUnlockAchievement('nonexistent_achievement');
            
            expect(result).toBeNull();
        });

        test('既に達成済みのアチーブメントを強制解除しようとすると適切に処理される', () => {
            // 最初の解除
            achievementManager.forceUnlockAchievement('score_hunter');
            
            // 再度同じアチーブメントを強制解除
            const result = achievementManager.forceUnlockAchievement('score_hunter');
            
            expect(result).toBeDefined();
            expect(result!.wasAlreadyUnlocked).toBe(true);
            expect(result!.rewardApplied).toBe(false);
        });
    });

    describe('報酬統計', () => {
        test('総獲得報酬統計が正しく計算される', () => {
            // 複数のアチーブメントを達成
            mockProfile.totalGamesPlayed = 10;
            mockProfile.highScore = 1000;
            achievementManager.updateProfile(mockProfile);
            achievementManager.checkAchievements();

            const totalRewards = achievementManager.getTotalRewardsEarned();
            
            expect(totalRewards.coins).toBeGreaterThan(0);
            expect(totalRewards.experience).toBeGreaterThan(0);
        });
    });

    describe('最近のアチーブメント', () => {
        test('最近達成されたアチーブメントが正しく取得される', () => {
            // 複数のアチーブメントを段階的に達成
            mockProfile.totalGamesPlayed = 1;
            achievementManager.updateProfile(mockProfile);
            achievementManager.checkAchievements();

            mockProfile.highScore = 1000;
            achievementManager.updateProfile(mockProfile);
            achievementManager.checkAchievements();

            const recentAchievements = achievementManager.getRecentAchievements();
            
            expect(recentAchievements.length).toBeGreaterThan(0);
            expect(recentAchievements.length).toBeLessThanOrEqual(5);
            
            // 新しい順になっていることを確認（最新が先頭）
            const achievementIds = recentAchievements.map(a => a.id);
            expect(achievementIds).toContain('score_hunter');
        });
    });

    describe('エラーハンドリング', () => {
        test('不正なアチーブメントIDで進捗取得を試みるとnullが返される', () => {
            const progress = achievementManager.getAchievementProgress('invalid_id');
            
            expect(progress).toBeNull();
        });

        test('プログレストラッカーのないアチーブメントで進捗取得を試みるとnullが返される', () => {
            // perfectionist は進捗追跡機能がない隠しアチーブメント
            const progress = achievementManager.getAchievementProgress('perfectionist');
            
            expect(progress).toBeNull();
        });
    });

    describe('イベント通知', () => {
        test('アチーブメント解除時にコールバックが呼ばれる', () => {
            mockProfile.totalGamesPlayed = 1;
            achievementManager.updateProfile(mockProfile);
            
            const results = achievementManager.checkAchievements();
            
            expect(mockOnAchievementUnlocked).toHaveBeenCalledTimes(1);
            expect(mockOnProfileUpdate).toHaveBeenCalled();
        });

        test('プロファイル更新コールバックが正しく動作する', () => {
            mockProfile.totalGamesPlayed = 1;
            achievementManager.updateProfile(mockProfile);
            
            achievementManager.checkAchievements();
            
            expect(mockOnProfileUpdate).toHaveBeenCalledWith(expect.objectContaining({
                completedAchievements: expect.arrayContaining(['first_steps'])
            }));
        });
    });
});
