import { GameModeManager } from '../../src/progression/managers/GameModeManager';
import { EventEmitter } from '../../src/events/EventEmitter';
import { EventMap } from '../../src/events/EventType';
import { PlayerProfile } from '../../src/progression/types/PlayerProfile';
import { GameMode } from '../../src/progression/types/GameMode';

// モックのLocalStorage実装
const mockLocalStorage = {
    store: {} as Record<string, string>,
    getItem: jest.fn((key: string) => mockLocalStorage.store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
        mockLocalStorage.store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
        delete mockLocalStorage.store[key];
    }),
    clear: jest.fn(() => {
        mockLocalStorage.store = {};
    })
};

// グローバルのlocalStorageをモック
Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
});

describe('GameModeManager', () => {
    let gameMode: GameModeManager;
    let eventEmitter: EventEmitter<EventMap>;
    let mockProfile: PlayerProfile;

    beforeEach(() => {
        // モックをリセット
        jest.clearAllMocks();
        mockLocalStorage.clear();

        // EventEmitterのモック
        eventEmitter = new EventEmitter<EventMap>();
        jest.spyOn(eventEmitter, 'emit');

        // プレイヤープロファイルのモック
        mockProfile = {
            totalGamesPlayed: 5,
            totalScore: 2500,
            highScore: 1500,
            totalPlayTime: 10000,
            lastPlayDate: '2023-01-01',
            coins: 500,
            experience: 300,
            level: 3,
            unlockedUpgrades: [],
            equippedUpgrades: {},
            completedAchievements: [],
            stats: {
                enemiesDestroyed: 50,
                bossesDefeated: 3,
                maxWaveReached: 8,
                powerupsCollected: 20,
                bulletsShot: 200,
                damageDealt: 1000,
                damageTaken: 300,
                playStreakDays: 1
            }
        };

        gameMode = new GameModeManager(eventEmitter, mockProfile);
    });

    describe('初期化', () => {
        test('デフォルトでノーマルモードが選択される', () => {
            const currentMode = gameMode.getCurrentGameMode();
            expect(currentMode.id).toBe('normal');
            expect(currentMode.name).toBe('ノーマル');
        });

        test('最後に選択されたモードを記憶する', () => {
            // 条件を満たすプロファイルを作成（ハードコアモード用）
            const advancedProfile = {
                ...mockProfile,
                stats: {
                    ...mockProfile.stats,
                    maxWaveReached: 10 // ハードコアモードのアンロック条件
                }
            };

            // localStorageに直接設定
            mockLocalStorage.store['lastSelectedGameMode'] = 'hardcore';
            const manager = new GameModeManager(eventEmitter, advancedProfile);
            const currentMode = manager.getCurrentGameMode();
            expect(currentMode.id).toBe('hardcore');
        });

        test('アンロックされていないモードは自動的にノーマルモードに戻る', () => {
            mockLocalStorage.setItem('lastSelectedGameMode', 'hardcore');
            
            // ハードコアモードの条件を満たさないプロファイル
            const limitedProfile = {
                ...mockProfile,
                stats: {
                    ...mockProfile.stats,
                    maxWaveReached: 5 // 条件不足
                }
            };

            const manager = new GameModeManager(eventEmitter, limitedProfile);
            const currentMode = manager.getCurrentGameMode();
            expect(currentMode.id).toBe('normal');
        });
    });

    describe('ゲームモード選択', () => {
        test('有効なゲームモードを選択できる', () => {
            const result = gameMode.selectGameMode('normal');
            expect(result).toBe(true);
            expect(gameMode.getCurrentGameMode().id).toBe('normal');
        });

        test('無効なゲームモードは選択できない', () => {
            const result = gameMode.selectGameMode('invalid_mode');
            expect(result).toBe(false);
            expect(gameMode.getCurrentGameMode().id).toBe('normal'); // 変更されない
        });

        test('ロックされたゲームモードは選択できない', () => {
            const result = gameMode.selectGameMode('hardcore');
            expect(result).toBe(false);
            expect(gameMode.getCurrentGameMode().id).toBe('normal');
        });

        test('ゲームモード変更時にイベントが発行される', () => {
            // 条件を満たすプロファイルでハードコアモードを解除
            const advancedProfile = {
                ...mockProfile,
                stats: {
                    ...mockProfile.stats,
                    maxWaveReached: 10
                }
            };
            
            gameMode.updatePlayerProfile(advancedProfile);
            const previousMode = gameMode.getCurrentGameMode();
            
            gameMode.selectGameMode('hardcore');
            
            expect(eventEmitter.emit).toHaveBeenCalledWith(
                'gameModeChanged',
                expect.objectContaining({ id: 'hardcore' }),
                previousMode
            );
        });

        test('選択したゲームモードがlocalStorageに保存される', () => {
            // 異なるモードを選択してからテスト対象モードを選択
            const advancedProfile = {
                ...mockProfile,
                stats: {
                    ...mockProfile.stats,
                    maxWaveReached: 10
                }
            };
            gameMode.updatePlayerProfile(advancedProfile);
            gameMode.selectGameMode('hardcore'); // 先に別のモードを選択
            
            // クリアしてからテスト
            jest.clearAllMocks();
            gameMode.selectGameMode('normal');
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('lastSelectedGameMode', 'normal');
        });
    });

    describe('ゲームモードアンロック', () => {
        test('ノーマルモードは常にアンロックされている', () => {
            expect(gameMode.isGameModeUnlocked('normal')).toBe(true);
        });

        test('ハードコアモードはウェーブ10到達でアンロック', () => {
            expect(gameMode.isGameModeUnlocked('hardcore')).toBe(false);
            
            const advancedProfile = {
                ...mockProfile,
                stats: {
                    ...mockProfile.stats,
                    maxWaveReached: 10
                }
            };
            
            gameMode.updatePlayerProfile(advancedProfile);
            expect(gameMode.isGameModeUnlocked('hardcore')).toBe(true);
        });

        test('サバイバルモードはボス5体撃破でアンロック', () => {
            expect(gameMode.isGameModeUnlocked('survival')).toBe(false);
            
            const bossHunterProfile = {
                ...mockProfile,
                stats: {
                    ...mockProfile.stats,
                    bossesDefeated: 5
                }
            };
            
            gameMode.updatePlayerProfile(bossHunterProfile);
            expect(gameMode.isGameModeUnlocked('survival')).toBe(true);
        });

        test('新たにアンロックされたモードでイベントが発行される', () => {
            const advancedProfile = {
                ...mockProfile,
                stats: {
                    ...mockProfile.stats,
                    maxWaveReached: 10
                }
            };
            
            gameMode.updatePlayerProfile(advancedProfile);
            
            expect(eventEmitter.emit).toHaveBeenCalledWith(
                'gameModeUnlocked',
                expect.objectContaining({ id: 'hardcore' })
            );
        });
    });

    describe('ゲームモード情報取得', () => {
        test('全ゲームモードを取得できる', () => {
            const allModes = gameMode.getAllGameModes();
            expect(allModes).toHaveLength(3);
            expect(allModes.map(mode => mode.id)).toEqual(['normal', 'hardcore', 'survival']);
        });

        test('アンロック済みゲームモードのみ取得できる', () => {
            const unlockedModes = gameMode.getUnlockedGameModes();
            expect(unlockedModes).toHaveLength(1);
            expect(unlockedModes[0].id).toBe('normal');
        });

        test('ロック中ゲームモードを取得できる', () => {
            const lockedModes = gameMode.getLockedGameModes();
            expect(lockedModes).toHaveLength(2);
            expect(lockedModes.map(mode => mode.id)).toEqual(['hardcore', 'survival']);
        });

        test('ゲームモードアンロック状況を取得できる', () => {
            const statuses = gameMode.getGameModeUnlockStatuses();
            expect(statuses).toHaveLength(3);
            
            const normalStatus = statuses.find(s => s.mode.id === 'normal');
            expect(normalStatus?.isUnlocked).toBe(true);
            
            const hardcoreStatus = statuses.find(s => s.mode.id === 'hardcore');
            expect(hardcoreStatus?.isUnlocked).toBe(false);
            expect(hardcoreStatus?.unlockRequirement).toBe('ウェーブ10まで到達する');
        });
    });

    describe('統計とゲーム記録', () => {
        test('ゲーム完了を記録できる', () => {
            gameMode.recordGameCompletion(1000);
            
            const stats = gameMode.getGameModeStats();
            expect(stats.gamesPlayedByMode['normal']).toBe(1);
            expect(stats.highScoresByMode['normal']).toBe(1000);
        });

        test('ハイスコア更新時にイベントが発行される', () => {
            gameMode.recordGameCompletion(500);
            gameMode.recordGameCompletion(1000);
            
            expect(eventEmitter.emit).toHaveBeenCalledWith(
                'gameModeHighScore',
                expect.objectContaining({ id: 'normal' }),
                1000
            );
        });

        test('ゲームモード統計を取得できる', () => {
            gameMode.recordGameCompletion(800);
            gameMode.recordGameCompletion(1200);
            
            const stats = gameMode.getGameModeStats();
            expect(stats.totalModes).toBe(3);
            expect(stats.unlockedModes).toBe(1);
            expect(stats.currentMode.id).toBe('normal');
            expect(stats.gamesPlayedByMode['normal']).toBe(2);
            expect(stats.highScoresByMode['normal']).toBe(1200);
        });
    });

    describe('修正子とボーナス計算', () => {
        test('ノーマルモードの修正子を取得できる', () => {
            const modifiers = gameMode.getCurrentModifiers();
            expect(modifiers.enemySpeedMultiplier).toBe(1.0);
            expect(modifiers.enemyHealthMultiplier).toBe(1.0);
            expect(modifiers.scoreMultiplier).toBe(1.0);
        });

        test('報酬計算でモード修正子が適用される', () => {
            const baseReward = { score: 1000, coins: 100, experience: 50 };
            const calculatedReward = gameMode.calculateReward(baseReward);
            
            // ノーマルモードは1.0倍なので変化なし
            expect(calculatedReward.score).toBe(1000);
            expect(calculatedReward.coins).toBe(100);
            expect(calculatedReward.experience).toBe(50);
        });

        test('ハードコアモードで報酬が増加する', () => {
            // ハードコアモード条件を満たす
            const advancedProfile = {
                ...mockProfile,
                stats: {
                    ...mockProfile.stats,
                    maxWaveReached: 10
                }
            };
            
            gameMode.updatePlayerProfile(advancedProfile);
            gameMode.selectGameMode('hardcore');
            
            const baseReward = { score: 1000, coins: 100, experience: 50 };
            const calculatedReward = gameMode.calculateReward(baseReward);
            
            // ハードコアモードの修正子が適用される
            expect(calculatedReward.score).toBe(3000); // 3.0倍
            expect(calculatedReward.coins).toBe(300);  // 3.0倍
            expect(calculatedReward.experience).toBe(125); // 2.5倍
        });

        test('基底値修正子を適用できる', () => {
            const baseValues = {
                enemySpeed: 100,
                enemyHealth: 50,
                spawnRate: 2.0
            };
            
            const modifiedValues = gameMode.applyModifiers(baseValues);
            
            // ノーマルモードは1.0倍なので変化なし
            expect(modifiedValues.enemySpeed).toBe(100);
            expect(modifiedValues.enemyHealth).toBe(50);
            expect(modifiedValues.spawnRate).toBe(2.0);
        });
    });

    describe('プロファイル更新', () => {
        test('プロファイル更新で統計が初期化される', () => {
            const newProfile: PlayerProfile = {
                ...mockProfile,
                gameModeStats: {
                    gamesPlayedByMode: { normal: 5 },
                    highScoresByMode: { normal: 2000 }
                }
            };
            
            gameMode.updatePlayerProfile(newProfile);
            
            const stats = gameMode.getGameModeStats();
            expect(stats.gamesPlayedByMode['normal']).toBe(5);
            expect(stats.highScoresByMode['normal']).toBe(2000);
        });
    });

    describe('エラーハンドリング', () => {
        test('localStorageエラーが適切に処理される', () => {
            // localStorageエラーをシミュレート
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });
            
            // エラーが発生してもアプリケーションは継続動作する
            expect(() => gameMode.selectGameMode('normal')).not.toThrow();
        });

        test('存在しないモードIDでも安全に動作する', () => {
            expect(gameMode.isGameModeUnlocked('nonexistent')).toBe(false);
            expect(gameMode.selectGameMode('nonexistent')).toBe(false);
        });
    });

    describe('複雑なシナリオ', () => {
        test('複数モードのアンロックと切り替え', () => {
            // 全モード解除
            const masterProfile = {
                ...mockProfile,
                stats: {
                    ...mockProfile.stats,
                    maxWaveReached: 15,
                    bossesDefeated: 10
                }
            };
            
            gameMode.updatePlayerProfile(masterProfile);
            
            expect(gameMode.getUnlockedGameModes()).toHaveLength(3);
            
            // 各モードに切り替えてテスト
            expect(gameMode.selectGameMode('hardcore')).toBe(true);
            expect(gameMode.getCurrentGameMode().id).toBe('hardcore');
            
            expect(gameMode.selectGameMode('survival')).toBe(true);
            expect(gameMode.getCurrentGameMode().id).toBe('survival');
            
            expect(gameMode.selectGameMode('normal')).toBe(true);
            expect(gameMode.getCurrentGameMode().id).toBe('normal');
        });

        test('複数ゲームの統計追跡', () => {
            // ノーマルモードで複数ゲーム
            gameMode.recordGameCompletion(500);
            gameMode.recordGameCompletion(800);
            gameMode.recordGameCompletion(600);
            
            // ハードコアモード解除
            const advancedProfile = {
                ...mockProfile,
                stats: {
                    ...mockProfile.stats,
                    maxWaveReached: 10
                }
            };
            gameMode.updatePlayerProfile(advancedProfile);
            gameMode.selectGameMode('hardcore');
            
            // ハードコアモードでゲーム
            gameMode.recordGameCompletion(1200);
            gameMode.recordGameCompletion(1500);
            
            const stats = gameMode.getGameModeStats();
            expect(stats.gamesPlayedByMode['normal']).toBe(3);
            expect(stats.highScoresByMode['normal']).toBe(800);
            expect(stats.gamesPlayedByMode['hardcore']).toBe(2);
            expect(stats.highScoresByMode['hardcore']).toBe(1500);
        });
    });
});
