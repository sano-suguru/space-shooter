/**
 * Achievement Data Definitions
 * 
 * 全アチーブメントの定義データ
 * カテゴリ別・難易度別に整理
 */

import type { Achievement } from '../types/Achievement.js';

/**
 * 全アチーブメント定義
 * 設計書仕様に基づく包括的なアチーブメントセット
 */
export const ACHIEVEMENTS: Achievement[] = [
    // =============================================================================
    // SPECIAL CATEGORY - 特別なアチーブメント
    // =============================================================================
    {
        id: 'first_steps',
        name: '初めの一歩',
        description: '最初のゲームを完了する',
        category: 'special',
        difficulty: 'bronze',
        condition: (profile) => profile.totalGamesPlayed >= 1,
        reward: { coins: 100, experience: 50 },
        hidden: false
    },
    {
        id: 'rookie_pilot',
        name: '新米パイロット',
        description: '10回ゲームをプレイする',
        category: 'special',
        difficulty: 'bronze',
        condition: (profile) => profile.totalGamesPlayed >= 10,
        reward: { coins: 250, experience: 150 },
        hidden: false,
        progressTracker: (profile) => ({ current: profile.totalGamesPlayed, required: 10 })
    },
    {
        id: 'veteran_pilot',
        name: 'ベテランパイロット',
        description: '100回ゲームをプレイする',
        category: 'special',
        difficulty: 'gold',
        condition: (profile) => profile.totalGamesPlayed >= 100,
        reward: { coins: 2000, experience: 1000, unlockGameMode: 'hardcore' },
        hidden: false,
        progressTracker: (profile) => ({ current: profile.totalGamesPlayed, required: 100 })
    },

    // =============================================================================
    // COMBAT CATEGORY - 戦闘系アチーブメント
    // =============================================================================
    {
        id: 'score_hunter',
        name: 'スコアハンター',
        description: '1000点を獲得する',
        category: 'combat',
        difficulty: 'bronze',
        condition: (profile) => profile.highScore >= 1000,
        reward: { coins: 200, experience: 100 },
        hidden: false,
        progressTracker: (profile) => ({ current: profile.highScore, required: 1000 })
    },
    {
        id: 'score_master',
        name: 'スコアマスター',
        description: '10000点を獲得する',
        category: 'combat',
        difficulty: 'silver',
        condition: (profile) => profile.highScore >= 10000,
        reward: { coins: 750, experience: 400 },
        hidden: false,
        progressTracker: (profile) => ({ current: profile.highScore, required: 10000 })
    },
    {
        id: 'score_legend',
        name: 'スコアレジェンド',
        description: '50000点を獲得する',
        category: 'combat',
        difficulty: 'gold',
        condition: (profile) => profile.highScore >= 50000,
        reward: { coins: 3000, experience: 1500 },
        hidden: false,
        progressTracker: (profile) => ({ current: profile.highScore, required: 50000 })
    },
    {
        id: 'enemy_slayer',
        name: '敵の殲滅者',
        description: '100体の敵を倒す',
        category: 'combat',
        difficulty: 'silver',
        condition: (profile) => profile.stats.enemiesDestroyed >= 100,
        reward: { coins: 500, experience: 250, unlockUpgrade: 'multi_shot' },
        hidden: false,
        progressTracker: (profile) => ({ current: profile.stats.enemiesDestroyed, required: 100 })
    },
    {
        id: 'exterminator',
        name: '駆除専門家',
        description: '500体の敵を倒す',
        category: 'combat',
        difficulty: 'gold',
        condition: (profile) => profile.stats.enemiesDestroyed >= 500,
        reward: { coins: 2000, experience: 1000 },
        hidden: false,
        progressTracker: (profile) => ({ current: profile.stats.enemiesDestroyed, required: 500 })
    },
    {
        id: 'boss_hunter',
        name: 'ボスハンター',
        description: '初めてボスを倒す',
        category: 'combat',
        difficulty: 'silver',
        condition: (profile) => profile.stats.bossesDefeated >= 1,
        reward: { coins: 800, experience: 500 },
        hidden: false,
        progressTracker: (profile) => ({ current: profile.stats.bossesDefeated, required: 1 })
    },
    {
        id: 'boss_slayer',
        name: 'ボススレイヤー',
        description: '10体のボスを倒す',
        category: 'combat',
        difficulty: 'gold',
        condition: (profile) => profile.stats.bossesDefeated >= 10,
        reward: { coins: 4000, experience: 2000, unlockGameMode: 'survival' },
        hidden: false,
        progressTracker: (profile) => ({ current: profile.stats.bossesDefeated, required: 10 })
    },

    // =============================================================================
    // SURVIVAL CATEGORY - 生存系アチーブメント
    // =============================================================================
    {
        id: 'wave_survivor',
        name: 'ウェーブサバイバー',
        description: 'ウェーブ5まで到達する',
        category: 'survival',
        difficulty: 'bronze',
        condition: (profile) => profile.stats.maxWaveReached >= 5,
        reward: { coins: 300, experience: 200 },
        hidden: false,
        progressTracker: (profile) => ({ current: profile.stats.maxWaveReached, required: 5 })
    },
    {
        id: 'wave_master',
        name: 'ウェーブマスター',
        description: 'ウェーブ10まで到達する',
        category: 'survival',
        difficulty: 'gold',
        condition: (profile) => profile.stats.maxWaveReached >= 10,
        reward: { coins: 1000, experience: 500 },
        hidden: false,
        progressTracker: (profile) => ({ current: profile.stats.maxWaveReached, required: 10 })
    },
    {
        id: 'wave_champion',
        name: 'ウェーブチャンピオン',
        description: 'ウェーブ20まで到達する',
        category: 'survival',
        difficulty: 'platinum',
        condition: (profile) => profile.stats.maxWaveReached >= 20,
        reward: { coins: 10000, experience: 5000 },
        hidden: false,
        progressTracker: (profile) => ({ current: profile.stats.maxWaveReached, required: 20 })
    },
    {
        id: 'damage_sponge',
        name: 'ダメージスポンジ',
        description: '累計10000ダメージを受ける',
        category: 'survival',
        difficulty: 'silver',
        condition: (profile) => profile.stats.damageTaken >= 10000,
        reward: { coins: 500, experience: 300, unlockUpgrade: 'reinforced_hull' },
        hidden: false,
        progressTracker: (profile) => ({ current: profile.stats.damageTaken, required: 10000 })
    },

    // =============================================================================
    // COLLECTION CATEGORY - 収集系アチーブメント
    // =============================================================================
    {
        id: 'powerup_collector',
        name: 'パワーアップコレクター',
        description: '50個のパワーアップを収集する',
        category: 'collection',
        difficulty: 'bronze',
        condition: (profile) => profile.stats.powerupsCollected >= 50,
        reward: { coins: 400, experience: 200 },
        hidden: false,
        progressTracker: (profile) => ({ current: profile.stats.powerupsCollected, required: 50 })
    },
    {
        id: 'powerup_addict',
        name: 'パワーアップ中毒',
        description: '200個のパワーアップを収集する',
        category: 'collection',
        difficulty: 'silver',
        condition: (profile) => profile.stats.powerupsCollected >= 200,
        reward: { coins: 1200, experience: 600, unlockUpgrade: 'coin_magnet' },
        hidden: false,
        progressTracker: (profile) => ({ current: profile.stats.powerupsCollected, required: 200 })
    },
    {
        id: 'coin_collector',
        name: 'コインコレクター',
        description: '累計10000コインを獲得する',
        category: 'collection',
        difficulty: 'gold',
        condition: (profile) => profile.totalScore >= 100000, // スコアベースでコイン獲得を近似
        reward: { coins: 2500, experience: 1200 },
        hidden: false,
        progressTracker: (profile) => ({ current: Math.floor(profile.totalScore / 10), required: 10000 })
    },

    // =============================================================================
    // MASTERY CATEGORY - 熟練度アチーブメント
    // =============================================================================
    {
        id: 'marksman',
        name: '射撃の名手',
        description: '累計50000発の弾丸を発射する',
        category: 'mastery',
        difficulty: 'silver',
        condition: (profile) => profile.stats.bulletsShot >= 50000,
        reward: { coins: 1000, experience: 500, unlockUpgrade: 'bullet_speed' },
        hidden: false,
        progressTracker: (profile) => ({ current: profile.stats.bulletsShot, required: 50000 })
    },
    {
        id: 'damage_dealer',
        name: 'ダメージディーラー',
        description: '累計100000ダメージを与える',
        category: 'mastery',
        difficulty: 'gold',
        condition: (profile) => profile.stats.damageDealt >= 100000,
        reward: { coins: 3000, experience: 1500, unlockUpgrade: 'power_shot' },
        hidden: false,
        progressTracker: (profile) => ({ current: profile.stats.damageDealt, required: 100000 })
    },
    {
        id: 'perfectionist',
        name: '完璧主義者',
        description: '完璧なゲームを達成（15ウェーブノーダメージ）',
        category: 'mastery',
        difficulty: 'platinum',
        condition: (_profile, session) => session ? session.perfectWaves >= 15 : false,
        reward: { coins: 5000, experience: 2500 },
        hidden: true
    },
    {
        id: 'speed_demon',
        name: 'スピードデーモン',
        description: '1時間以内でウェーブ10に到達する',
        category: 'mastery',
        difficulty: 'platinum',
        condition: (_profile, session) => {
            return session ? (session.waveReached >= 10 && session.playTime <= 3600) : false;
        },
        reward: { coins: 7500, experience: 3000 },
        hidden: true
    },
    {
        id: 'consistency_king',
        name: '安定の王',
        description: '5回連続でウェーブ8以上に到達する',
        category: 'mastery',
        difficulty: 'gold',
        condition: (profile) => profile.level >= 15 && profile.stats.maxWaveReached >= 8,
        reward: { coins: 2500, experience: 1500 },
        hidden: false
    },

    // =============================================================================
    // HIDDEN SPECIAL ACHIEVEMENTS - 隠れアチーブメント
    // =============================================================================
    {
        id: 'secret_hunter',
        name: '秘密の狩人',
        description: '???',
        category: 'special',
        difficulty: 'platinum',
        condition: (profile) => {
            // 全ての非隠しアチーブメントを達成
            return profile.completedAchievements.length >= 20;
        },
        reward: { coins: 10000, experience: 5000 },
        hidden: true
    },
    {
        id: 'dedication',
        name: '献身',
        description: '???',
        category: 'special',
        difficulty: 'platinum',
        condition: (profile) => profile.stats.playStreakDays >= 7,
        reward: { coins: 15000, experience: 7500 },
        hidden: true
    }
];

/**
 * カテゴリ別アチーブメント取得
 */
export function getAchievementsByCategory(category: Achievement['category']): Achievement[] {
    return ACHIEVEMENTS.filter(achievement => achievement.category === category);
}

/**
 * 難易度別アチーブメント取得
 */
export function getAchievementsByDifficulty(difficulty: Achievement['difficulty']): Achievement[] {
    return ACHIEVEMENTS.filter(achievement => achievement.difficulty === difficulty);
}

/**
 * 表示可能アチーブメント取得（隠しアチーブメント除外）
 */
export function getVisibleAchievements(): Achievement[] {
    return ACHIEVEMENTS.filter(achievement => !achievement.hidden);
}

/**
 * 隠しアチーブメント取得
 */
export function getHiddenAchievements(): Achievement[] {
    return ACHIEVEMENTS.filter(achievement => achievement.hidden);
}

/**
 * アチーブメントIDで検索
 */
export function getAchievementById(id: string): Achievement | undefined {
    return ACHIEVEMENTS.find(achievement => achievement.id === id);
}
