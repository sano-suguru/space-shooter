import { BossType, WaveConfig, FormationType } from '../types';

/**
 * ウェーブ設定データを管理するクラス
 * WaveManager.tsから設定関連の責務を分離
 */
export class WaveConfiguration {
  private static readonly waveConfigs: WaveConfig[] = [
    // Wave 1: 小敵の基本フォーメーション
    {
      id: 1,
      name: '偵察隊',
      enemies: [{ type: 'SMALL', count: 3, formation: 'line', delay: 200 }],
      bonusScore: 50,
      nextWaveDelay: 1000,
    },
    // Wave 2: V字フォーメーション
    {
      id: 2,
      name: 'V編隊',
      enemies: [
        { type: 'SMALL', count: 4, formation: 'vformation', delay: 200 },
      ],
      bonusScore: 75,
      nextWaveDelay: 1000,
    },
    // Wave 3: 通常ウェーブ（ボス出現をWave 5に変更）
    {
      id: 3,
      name: '迎撃部隊',
      enemies: [
        { type: 'SMALL', count: 5, formation: 'circle', delay: 180 },
        {
          type: 'MEDIUM',
          count: 2,
          formation: 'line',
          delay: 300,
          offsetY: 60,
        },
      ],
      bonusScore: 100,
      nextWaveDelay: 2000,
    },
    // Wave 4: ダイヤモンドフォーメーション
    {
      id: 4,
      name: 'ダイヤモンド編隊',
      enemies: [{ type: 'MEDIUM', count: 5, formation: 'diamond', delay: 350 }],
      bonusScore: 125,
      nextWaveDelay: 3000,
    },
    // Wave 5: 基本ボス戦（Wave 3から移動）
    {
      id: 5,
      name: 'ボス戦準備',
      enemies: [],
      bonusScore: 150,
      nextWaveDelay: 1000,
    },
    // Wave 6: 大規模攻撃（旧Wave 5から移動・調整）
    {
      id: 6,
      name: '大侵攻',
      enemies: [
        { type: 'SMALL', count: 6, formation: 'arrow', delay: 150 },
        {
          type: 'MEDIUM',
          count: 3,
          formation: 'line',
          delay: 300,
          offsetY: 60,
        },
        {
          type: 'LARGE',
          count: 1,
          formation: 'circle',
          delay: 500,
          offsetY: 120,
        },
      ],
      bonusScore: 200,
      nextWaveDelay: 3500,
    },
    // Wave 7: 強化編隊
    {
      id: 7,
      name: '強化編隊',
      enemies: [
        { type: 'MEDIUM', count: 4, formation: 'vformation', delay: 250 },
        {
          type: 'LARGE',
          count: 2,
          formation: 'line',
          delay: 400,
          offsetY: 80,
        },
      ],
      bonusScore: 175,
      nextWaveDelay: 3000,
    },
    // Wave 8: アサルト・クルーザー戦準備
    {
      id: 8,
      name: 'アサルト・クルーザー戦準備',
      enemies: [],
      bonusScore: 200,
      nextWaveDelay: 1000,
    },
    // Wave 9: 混合攻撃
    {
      id: 9,
      name: '混合攻撃',
      enemies: [
        { type: 'SMALL', count: 8, formation: 'circle', delay: 120 },
        {
          type: 'MEDIUM',
          count: 4,
          formation: 'diamond',
          delay: 300,
          offsetY: 60,
        },
      ],
      bonusScore: 200,
      nextWaveDelay: 3500,
    },
    // Wave 10: 精鋭部隊
    {
      id: 10,
      name: '精鋭部隊',
      enemies: [
        { type: 'LARGE', count: 2, formation: 'line', delay: 500 },
        {
          type: 'MEDIUM',
          count: 4,
          formation: 'arrow',
          delay: 300,
          offsetY: 100,
        },
      ],
      bonusScore: 250,
      nextWaveDelay: 4000,
    },
    // Wave 11: 最終防衛線
    {
      id: 11,
      name: '最終防衛線',
      enemies: [
        { type: 'SMALL', count: 10, formation: 'vformation', delay: 100 },
        {
          type: 'MEDIUM',
          count: 5,
          formation: 'diamond',
          delay: 250,
          offsetY: 80,
        },
        {
          type: 'LARGE',
          count: 2,
          formation: 'circle',
          delay: 600,
          offsetY: 140,
        },
      ],
      bonusScore: 300,
      nextWaveDelay: 4500,
    },
    // Wave 12: シールド・ガーディアン戦準備
    {
      id: 12,
      name: 'シールド・ガーディアン戦準備',
      enemies: [],
      bonusScore: 300,
      nextWaveDelay: 1000,
    },
    // Wave 13: 反撃開始
    {
      id: 13,
      name: '反撃開始',
      enemies: [
        { type: 'SMALL', count: 8, formation: 'arrow', delay: 120 },
        {
          type: 'MEDIUM',
          count: 4,
          formation: 'vformation',
          delay: 280,
          offsetY: 70,
        },
      ],
      bonusScore: 350,
      nextWaveDelay: 3500,
    },
    // Wave 14: 猛攻撃
    {
      id: 14,
      name: '猛攻撃',
      enemies: [
        { type: 'MEDIUM', count: 6, formation: 'diamond', delay: 200 },
        {
          type: 'LARGE',
          count: 3,
          formation: 'line',
          delay: 450,
          offsetY: 100,
        },
      ],
      bonusScore: 400,
      nextWaveDelay: 4000,
    },
    // Wave 15: 最終決戦前
    {
      id: 15,
      name: '最終決戦前',
      enemies: [
        { type: 'SMALL', count: 12, formation: 'circle', delay: 100 },
        {
          type: 'MEDIUM',
          count: 6,
          formation: 'arrow',
          delay: 250,
          offsetY: 80,
        },
        {
          type: 'LARGE',
          count: 2,
          formation: 'diamond',
          delay: 500,
          offsetY: 140,
        },
      ],
      bonusScore: 450,
      nextWaveDelay: 5000,
    },
    // Wave 16: ストーム・インターセプター戦準備
    {
      id: 16,
      name: 'ストーム・インターセプター戦準備',
      enemies: [],
      bonusScore: 500,
      nextWaveDelay: 1000,
    },
  ];

  /**
   * 全てのウェーブ設定を取得
   */
  public static getAllWaveConfigs(): WaveConfig[] {
    return [...this.waveConfigs]; // コピーを返してデータ保護
  }

  /**
   * 特定のウェーブ設定を取得
   */
  public static getWaveConfig(waveNumber: number): WaveConfig | null {
    const index = waveNumber - 1;
    return index >= 0 && index < this.waveConfigs.length
      ? { ...this.waveConfigs[index] }
      : null;
  }

  /**
   * ウェーブ設定の総数を取得
   */
  public static getWaveCount(): number {
    return this.waveConfigs.length;
  }

  /**
   * 動的ウェーブを生成（定義済みウェーブを超えた場合）
   */
  public static generateDynamicWave(waveNumber: number): WaveConfig {
    const waveLevel = waveNumber - this.waveConfigs.length;
    const difficulty = Math.min(waveLevel * 0.2, 2.0); // 最大2倍まで

    const dynamicWave: WaveConfig = {
      id: waveNumber,
      name: `猛攻 ${waveLevel}`,
      enemies: [
        {
          type: 'SMALL',
          count: Math.floor(6 + difficulty * 3),
          formation: this.getRandomFormation(['line', 'vformation', 'circle']),
          delay: Math.max(100, 300 - difficulty * 50),
        },
        {
          type: 'MEDIUM',
          count: Math.floor(2 + difficulty),
          formation: this.getRandomFormation(['diamond', 'arrow']),
          delay: Math.max(200, 400 - difficulty * 50),
          offsetY: 80,
        },
      ],
      bonusScore: Math.floor(150 + difficulty * 50),
      nextWaveDelay: 3000,
    };

    // 高難易度では大型敵を追加
    if (waveLevel > 3) {
      dynamicWave.enemies.push({
        type: 'LARGE',
        count: Math.floor(1 + difficulty * 0.5),
        formation: 'circle',
        delay: Math.max(300, 500 - difficulty * 50),
        offsetY: 140,
      });
    }

    return dynamicWave;
  }

  /**
   * ランダムなフォーメーションを選択
   */
  private static getRandomFormation(
    formations: FormationType[]
  ): FormationType {
    return formations[Math.floor(Math.random() * formations.length)];
  }

  /**
   * 難易度に基づいてウェーブをカスタマイズ
   */
  public static customizeWaveForDifficulty(
    baseWave: WaveConfig,
    difficultyMultiplier: number
  ): WaveConfig {
    const customizedWave: WaveConfig = {
      ...baseWave,
      enemies: baseWave.enemies.map(enemy => ({
        ...enemy,
        count: Math.floor(enemy.count * difficultyMultiplier),
        delay: Math.max(50, Math.floor(enemy.delay / difficultyMultiplier)),
      })),
      bonusScore: Math.floor(baseWave.bonusScore * difficultyMultiplier),
    };

    return customizedWave;
  }

  /**
   * ウェーブ番号に基づいてボスが出現するかチェック
   */
  public static shouldSpawnBoss(waveNumber: number): boolean {
    // プレイヤーが慣れるまで時間を与える調整
    if (waveNumber === 5) return true; // 基本ボス（Wave 5に変更）
    if (waveNumber === 8) return true; // アサルト・クルーザー
    if (waveNumber === 12) return true; // シールド・ガーディアン
    if (waveNumber === 16) return true; // ストーム・インターセプター
    if (waveNumber >= 20 && waveNumber % 4 === 0) return true; // 以降は4ウェーブごと
    return false;
  }

  /**
   * ウェーブ番号に基づいてボスタイプを決定
   */
  public static getBossTypeForWave(waveNumber: number): BossType {
    if (waveNumber === 5) {
      return 'BASIC';
    } else if (waveNumber === 8) {
      return 'ASSAULT_CRUISER';
    } else if (waveNumber === 12) {
      return 'SHIELD_GUARDIAN';
    } else if (waveNumber === 16) {
      return 'STORM_INTERCEPTOR';
    } else if (waveNumber >= 20) {
      // 20以降はランダムに選択
      const bossTypes: BossType[] = [
        'ASSAULT_CRUISER',
        'SHIELD_GUARDIAN',
        'STORM_INTERCEPTOR',
      ];
      return bossTypes[waveNumber % 3];
    } else {
      return 'BASIC';
    }
  }

  /**
   * ボス出現ウェーブの設定を取得
   */
  public static getBossWaveConfig(waveNumber: number): WaveConfig | null {
    if (!this.shouldSpawnBoss(waveNumber)) {
      return null;
    }

    const bossType = this.getBossTypeForWave(waveNumber);
    let bossName = '';
    let bonusScore = 500;

    switch (bossType) {
      case 'BASIC':
        bossName = '基本ボス';
        bonusScore = 500;
        break;
      case 'ASSAULT_CRUISER':
        bossName = 'アサルト・クルーザー';
        bonusScore = 1000;
        break;
      case 'SHIELD_GUARDIAN':
        bossName = 'シールド・ガーディアン';
        bonusScore = 1500;
        break;
      case 'STORM_INTERCEPTOR':
        bossName = 'ストーム・インターセプター';
        bonusScore = 2000;
        break;
    }

    return {
      id: waveNumber,
      name: `${bossName}戦`,
      enemies: [], // ボス戦では通常の敵は出現しない
      bonusScore,
      nextWaveDelay: 5000, // ボス戦後は長めの休憩
    };
  }
}
