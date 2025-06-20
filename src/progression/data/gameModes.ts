/**
 * Game mode definitions and configurations
 */

import { GameMode } from '../types/GameMode.js';
import { PlayerProfile } from '../types/PlayerProfile.js';

/**
 * All available game modes
 */
export const GAME_MODES: GameMode[] = [
  {
    id: 'normal',
    name: 'ノーマル',
    description:
      '標準的な難易度でSpace Shooterを楽しめます。初心者から上級者まで、誰でも楽しめるバランスの取れた設定です。',
    unlockCondition: () => true, // Always unlocked
    modifiers: {
      enemySpeedMultiplier: 1.0,
      enemyHealthMultiplier: 1.0,
      enemySpawnRateMultiplier: 1.0,
      scoreMultiplier: 1.0,
      coinMultiplier: 1.0,
      experienceMultiplier: 1.0,
    },
    rewardMultiplier: 1.0,
  },
  {
    id: 'hardcore',
    name: 'ハードコア',
    description:
      '敵が強力になる代わりに報酬が大幅に増加します。高い難易度に挑戦して、より多くのコインと経験値を獲得しましょう。',
    unlockCondition: (profile: PlayerProfile) =>
      profile.stats.maxWaveReached >= 10,
    modifiers: {
      enemySpeedMultiplier: 1.5,
      enemyHealthMultiplier: 2.0,
      enemySpawnRateMultiplier: 1.3,
      scoreMultiplier: 3.0,
      coinMultiplier: 3.0,
      experienceMultiplier: 2.5,
    },
    specialRules: ['パワーアップ出現率低下', '敵の攻撃力1.5倍', 'ボスのHP2倍'],
    rewardMultiplier: 3.0,
  },
  {
    id: 'survival',
    name: 'サバイバル',
    description:
      '体力1、パワーアップなしの究極のチャレンジ。一撃でも当たれば即ゲームオーバーの極限状態で、真のパイロットスキルを試しましょう。',
    unlockCondition: (profile: PlayerProfile) =>
      profile.stats.bossesDefeated >= 5,
    modifiers: {
      enemySpeedMultiplier: 1.0,
      enemyHealthMultiplier: 1.0,
      enemySpawnRateMultiplier: 1.0,
      scoreMultiplier: 5.0,
      coinMultiplier: 4.0,
      experienceMultiplier: 3.0,
    },
    specialRules: [
      '体力1固定',
      'パワーアップ出現なし',
      '一撃死',
      'ダメージ無効化スキル使用不可',
    ],
    rewardMultiplier: 5.0,
  },
  {
    id: 'debug',
    name: 'デバッグモード',
    description:
      '開発者向けの動作確認モード。各種テスト機能が利用可能です。自機無敵、ウェーブ選択、敵生成、シナリオ再現などの機能を使用してゲームの動作を詳細に確認できます。',
    unlockCondition: () => true, // 常に利用可能
    modifiers: {
      enemySpeedMultiplier: 1.0,
      enemyHealthMultiplier: 1.0,
      enemySpawnRateMultiplier: 1.0,
      scoreMultiplier: 0.0, // デバッグモードではスコア無効
      coinMultiplier: 0.0,
      experienceMultiplier: 0.0,
    },
    specialRules: [
      'デバッグUI表示',
      'キーボードショートカット有効',
      'シナリオ再現機能',
      '各種テスト支援機能',
      'スコア・報酬無効',
    ],
    rewardMultiplier: 0.0, // デバッグモードでは報酬なし
  },
];

/**
 * Get a game mode by its ID
 */
export function getGameModeById(id: string): GameMode | undefined {
  return GAME_MODES.find(mode => mode.id === id);
}

/**
 * Get all unlocked game modes for a player profile
 */
export function getUnlockedGameModes(profile: PlayerProfile): GameMode[] {
  return GAME_MODES.filter(mode => mode.unlockCondition(profile));
}

/**
 * Get all locked game modes for a player profile
 */
export function getLockedGameModes(profile: PlayerProfile): GameMode[] {
  return GAME_MODES.filter(mode => !mode.unlockCondition(profile));
}

/**
 * Check if a specific game mode is unlocked
 */
export function isGameModeUnlocked(
  modeId: string,
  profile: PlayerProfile
): boolean {
  const mode = getGameModeById(modeId);
  return mode ? mode.unlockCondition(profile) : false;
}

/**
 * Get unlock requirement description for a game mode
 */
export function getGameModeUnlockRequirement(modeId: string): string {
  switch (modeId) {
    case 'hardcore':
      return 'ウェーブ10まで到達する';
    case 'survival':
      return 'ボスを5体倒す';
    case 'debug':
      return '条件なし（開発者向け）';
    default:
      return '条件なし';
  }
}

/**
 * Default game mode configuration
 */
export const DEFAULT_GAME_MODE_CONFIG = {
  defaultMode: 'normal',
  rememberLastSelection: true,
};

/**
 * Get the default game mode
 */
export function getDefaultGameMode(): GameMode {
  return GAME_MODES[0]; // Normal mode
}
