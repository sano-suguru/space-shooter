import { WaveConfig, FormationType } from '../types';

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
      enemies: [{ type: 'SMALL', count: 5, formation: 'line', delay: 300 }],
      bonusScore: 50,
      nextWaveDelay: 2000,
    },
    // Wave 2: V字フォーメーション
    {
      id: 2,
      name: 'V編隊',
      enemies: [
        { type: 'SMALL', count: 7, formation: 'vformation', delay: 250 },
      ],
      bonusScore: 75,
      nextWaveDelay: 2500,
    },
    // Wave 3: 混合フォーメーション
    {
      id: 3,
      name: '混合部隊',
      enemies: [
        { type: 'SMALL', count: 4, formation: 'line', delay: 200 },
        {
          type: 'MEDIUM',
          count: 2,
          formation: 'circle',
          delay: 400,
          offsetY: 80,
        },
      ],
      bonusScore: 100,
      nextWaveDelay: 3000,
    },
    // Wave 4: ダイヤモンドフォーメーション
    {
      id: 4,
      name: 'ダイヤモンド編隊',
      enemies: [{ type: 'MEDIUM', count: 5, formation: 'diamond', delay: 350 }],
      bonusScore: 125,
      nextWaveDelay: 3000,
    },
    // Wave 5: 大規模攻撃
    {
      id: 5,
      name: '大侵攻',
      enemies: [
        { type: 'SMALL', count: 8, formation: 'arrow', delay: 150 },
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
      nextWaveDelay: 4000,
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
}
