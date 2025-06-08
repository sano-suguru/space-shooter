import React, { useState } from 'react';
import { Button, Card, UpgradeShop, ProgressBar, PlayerStats, AchievementPanel, GameModeSelector } from '../ui';
import { Achievement } from '../../progression/types/Achievement';
import { GameMode } from '../../progression/types/GameMode';

/**
 * React環境動作確認用のテストコンポーネント
 * Phase 3: UpgradeShop統合テスト追加
 */
export const TestComponent: React.FC = () => {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('React + TypeScript 環境が正常に動作しています！');
  const [loading, setLoading] = useState(false);
  const [showUpgradeShop, setShowUpgradeShop] = useState(false);
  const [showAchievementPanel, setShowAchievementPanel] = useState(false);
  const [showGameModeSelector, setShowGameModeSelector] = useState(false);
  const [currentGameMode, setCurrentGameMode] = useState('normal');

  // モックデータ
  const mockPlayerProfile = {
    totalGamesPlayed: 15,
    totalScore: 12500,
    highScore: 2100,
    totalPlayTime: 3600,
    lastPlayDate: new Date().toISOString(),
    coins: 500,
    experience: 250,
    level: 5,
    unlockedUpgrades: ['rapid-fire', 'bullet-damage', 'shield-boost'],
    equippedUpgrades: {
      'rapid-fire': 2,
      'bullet-damage': 1
    },
    completedAchievements: ['first-kill', 'wave-10'],
    stats: {
      enemiesDestroyed: 150,
      bossesDefeated: 3,
      maxWaveReached: 12,
      powerupsCollected: 25,
      bulletsShot: 1200,
      damageDealt: 5000,
      damageTaken: 800,
      playStreakDays: 7
    },
    gameModeStats: {
      gamesPlayedByMode: {
        'normal': 12,
        'hard': 3
      },
      highScoresByMode: {
        'normal': 1800,
        'hard': 2100
      }
    }
  };

  const mockUpgrades = [
    {
      id: 'rapid-fire',
      name: '高速射撃',
      description: '射撃速度を向上させます',
      category: 'weapon' as const,
      maxLevel: 5,
      baseCost: 100,
      costMultiplier: 1.5,
      unlockCondition: () => true,
      effect: (level: number) => ({
        fireRateMultiplier: 1 + (level * 0.2)
      }),
      icon: '⚡'
    },
    {
      id: 'bullet-damage',
      name: '弾丸強化',
      description: '弾丸のダメージを増加させます',
      category: 'weapon' as const,
      maxLevel: 3,
      baseCost: 150,
      costMultiplier: 1.8,
      unlockCondition: () => true,
      effect: (level: number) => ({
        bulletDamageMultiplier: 1 + (level * 0.5)
      }),
      icon: '💥'
    },
    {
      id: 'shield-boost',
      name: 'シールド強化',
      description: 'シールドの持続時間を延長します',
      category: 'defense' as const,
      maxLevel: 4,
      baseCost: 120,
      costMultiplier: 1.6,
      unlockCondition: () => true,
      effect: (level: number) => ({
        shieldDurationMultiplier: 1 + (level * 0.3)
      }),
      icon: '🛡️'
    }
  ];

  const handleIncrement = () => {
    setCount(prev => prev + 1);
    setMessage(`カウンターが ${count + 1} になりました！`);
  };

  const handleReset = () => {
    setCount(0);
    setMessage('カウンターがリセットされました');
  };

  const handleAsyncTest = async () => {
    setLoading(true);
    setMessage('非同期処理をテスト中...');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLoading(false);
    setMessage('非同期処理が完了しました！');
  };

  const handleUpgradeShopToggle = () => {
    setShowUpgradeShop(!showUpgradeShop);
  };

  const handleUpgradePurchase = async (upgradeId: string): Promise<boolean> => {
    console.log(`アップグレード購入: ${upgradeId}`);
    setMessage(`アップグレード "${upgradeId}" の購入を試行しました`);
    // モック購入処理
    return Promise.resolve(true);
  };

  // モックアチーブメントデータ
  const mockAchievements: Achievement[] = [
    {
      id: 'first-kill',
      name: '初撃破',
      description: '初めて敵を撃破する',
      category: 'combat',
      difficulty: 'bronze',
      condition: (profile) => profile.stats.enemiesDestroyed >= 1,
      reward: { coins: 50, experience: 25 },
      hidden: false
    },
    {
      id: 'wave-10',
      name: 'ウェーブ10到達',
      description: 'ウェーブ10に到達する',
      category: 'survival',
      difficulty: 'silver',
      condition: (profile) => profile.stats.maxWaveReached >= 10,
      reward: { coins: 100, experience: 50 },
      hidden: false
    },
    {
      id: 'damage-1000',
      name: 'ダメージディーラー',
      description: '累計1000ダメージを与える',
      category: 'combat',
      difficulty: 'silver',
      condition: (profile) => profile.stats.damageDealt >= 1000,
      reward: { coins: 75, experience: 40 },
      hidden: false
    },
    {
      id: 'powerup-collector',
      name: 'コレクター',
      description: 'パワーアップを20個収集する',
      category: 'collection',
      difficulty: 'bronze',
      condition: (profile) => profile.stats.powerupsCollected >= 20,
      reward: { coins: 60, experience: 30 },
      hidden: false
    },
    {
      id: 'marksman',
      name: 'マークスマン',
      description: '500発の弾丸を発射する',
      category: 'mastery',
      difficulty: 'gold',
      condition: (profile) => profile.stats.bulletsShot >= 500,
      reward: { coins: 80, experience: 35 },
      hidden: false
    }
  ];

  const handleAchievementPanelToggle = () => {
    setShowAchievementPanel(!showAchievementPanel);
  };

  const handleAchievementSelect = (achievement: Achievement) => {
    console.log('アチーブメント選択:', achievement);
    setMessage(`アチーブメント "${achievement.name}" が選択されました`);
  };

  // モックゲームモードデータ
  const mockGameModes: GameMode[] = [
    {
      id: 'normal',
      name: 'ノーマル',
      description: '標準的な難易度で楽しめます',
      modifiers: {
        enemyHealthMultiplier: 1.0,
        enemySpeedMultiplier: 1.0,
        enemySpawnRateMultiplier: 1.0,
        scoreMultiplier: 1.0,
        coinMultiplier: 1.0,
        experienceMultiplier: 1.0
      },
      rewardMultiplier: 1.0,
      unlockCondition: () => true
    },
    {
      id: 'hardcore',
      name: 'ハードコア',
      description: '敵が強く、緊張感のあるバトル',
      modifiers: {
        enemyHealthMultiplier: 1.5,
        enemySpeedMultiplier: 1.2,
        enemySpawnRateMultiplier: 1.3,
        scoreMultiplier: 1.5,
        coinMultiplier: 1.3,
        experienceMultiplier: 1.4
      },
      rewardMultiplier: 1.5,
      unlockCondition: (profile) => profile.level >= 5
    },
    {
      id: 'survival',
      name: 'サバイバル',
      description: '無限に続く敵の波に耐え抜け',
      modifiers: {
        enemyHealthMultiplier: 1.2,
        enemySpeedMultiplier: 1.1,
        enemySpawnRateMultiplier: 2.0,
        scoreMultiplier: 2.0,
        coinMultiplier: 1.8,
        experienceMultiplier: 1.6
      },
      rewardMultiplier: 2.0,
      unlockCondition: (profile) => profile.level >= 10
    }
  ];

  const handleGameModeSelectorToggle = () => {
    setShowGameModeSelector(!showGameModeSelector);
  };

  const handleGameModeSelect = (mode: GameMode) => {
    console.log('ゲームモード選択:', mode);
    setCurrentGameMode(mode.id);
    setMessage(`ゲームモード "${mode.name}" が選択されました`);
  };

  const handleGameModeUnlock = (mode: GameMode) => {
    console.log('ゲームモード解除:', mode);
    setMessage(`ゲームモード "${mode.name}" の解除が試行されました`);
  };

  // 現在のゲームモードを取得
  const getCurrentMode = (): GameMode => {
    return mockGameModes.find(mode => mode.id === currentGameMode) || mockGameModes[0];
  };

  return (
    <>
      {/* 既存の基本テスト */}
      <Card
        title="🚀 React 基本動作テスト"
        headerIcon="⚡"
        size="medium"
        hoverable
        style={{ margin: '10px', maxWidth: '600px' }}
      >
        <p style={{ marginBottom: '16px', color: '#ccc' }}>{message}</p>
        
        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#61dafb' }}>
            {count}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button 
            variant="primary"
            icon="➕"
            onClick={handleIncrement}
            size="medium"
          >
            カウントアップ
          </Button>
          
          <Button 
            variant="error"
            icon="🔄"
            onClick={handleReset}
            size="medium"
          >
            リセット
          </Button>
          
          <Button 
            variant="info"
            icon="⚙️"
            onClick={handleAsyncTest}
            loading={loading}
            disabled={loading}
            size="medium"
          >
            {loading ? '処理中...' : '非同期テスト'}
          </Button>
        </div>
        
        <p style={{ 
          marginTop: '20px', 
          fontSize: '12px', 
          color: '#888',
          fontStyle: 'italic',
          textAlign: 'center'
        }}>
          React {React.version} + TypeScript + Vite + pnpm
        </p>
      </Card>

      {/* プレイヤー統計テスト */}
      <Card
        title="📊 プレイヤー統計テスト"
        headerIcon="👤"
        size="medium"
        style={{ margin: '10px', maxWidth: '600px' }}
      >
        <PlayerStats 
          profile={mockPlayerProfile}
          showLevel={true}
          showExperience={true}
          showCoins={true}
        />
      </Card>

      {/* プログレスバーテスト */}
      <Card
        title="📈 プログレスバーテスト"
        headerIcon="📶"
        size="medium"
        style={{ margin: '10px', maxWidth: '600px' }}
      >
        <div style={{ display: 'grid', gap: '12px' }}>
          <ProgressBar 
            current={3} 
            max={5} 
            label="武器レベル" 
            showPercentage={true}
            color="#ff6b6b"
          />
          <ProgressBar 
            current={250} 
            max={500} 
            label="経験値" 
            showPercentage={true}
            color="#4ecdc4"
          />
          <ProgressBar 
            current={7} 
            max={10} 
            label="達成度" 
            showPercentage={true}
            color="#45b7d1"
          />
        </div>
      </Card>

      {/* UpgradeShopテスト */}
      <Card
        title="🛠️ アップグレードショップテスト"
        headerIcon="🛒"
        size="medium"
        style={{ margin: '10px', maxWidth: '600px' }}
      >
        <p style={{ marginBottom: '16px', color: '#ccc' }}>
          Phase 3の主要コンポーネント - UpgradeShopの動作テスト
        </p>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button 
            variant="success"
            icon="🛒"
            onClick={handleUpgradeShopToggle}
            size="medium"
          >
            {showUpgradeShop ? 'ショップを閉じる' : 'ショップを開く'}
          </Button>
        </div>

        {showUpgradeShop && (
          <div style={{ marginTop: '20px', border: '1px solid #333', borderRadius: '8px', padding: '10px' }}>
            <UpgradeShop
              isVisible={true}
              playerProfile={mockPlayerProfile}
              availableUpgrades={mockUpgrades}
              onClose={handleUpgradeShopToggle}
              onPurchase={handleUpgradePurchase}
              onCategoryChange={(category) => console.log('カテゴリ変更:', category)}
            />
          </div>
        )}
      </Card>

      {/* UIコンポーネントテスト */}
      <Card
        title="🎨 UIコンポーネントテスト"
        headerIcon="🧩"
        size="medium"
        hoverable
        style={{ margin: '10px', maxWidth: '600px' }}
      >
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <h4 style={{ color: '#61dafb', marginBottom: '8px' }}>ボタンバリアント</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button variant="primary" size="small">Primary</Button>
              <Button variant="secondary" size="small">Secondary</Button>
              <Button variant="success" size="small">Success</Button>
              <Button variant="warning" size="small">Warning</Button>
              <Button variant="error" size="small">Error</Button>
              <Button variant="info" size="small">Info</Button>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#61dafb', marginBottom: '8px' }}>ボタンサイズ</h4>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Button variant="primary" size="small">Small</Button>
              <Button variant="primary" size="medium">Medium</Button>
              <Button variant="primary" size="large">Large</Button>
              <Button variant="primary" size="xlarge">XLarge</Button>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#61dafb', marginBottom: '8px' }}>アイコン付きボタン</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button variant="success" icon="🛒" iconPosition="left">ショップ</Button>
              <Button variant="warning" icon="🏆" iconPosition="left">実績</Button>
              <Button variant="info" icon="🎮" iconPosition="left">ゲームモード</Button>
              <Button variant="secondary" icon="📊" iconPosition="right">進行状況</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* AchievementPanelテスト */}
      <Card
        title="🏆 アチーブメントパネルテスト"
        headerIcon="🎖️"
        size="medium"
        style={{ margin: '10px', maxWidth: '600px' }}
      >
        <p style={{ marginBottom: '16px', color: '#ccc' }}>
          Phase 3の次のターゲット - AchievementPanelの動作テスト
        </p>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button 
            variant="warning"
            icon="🏆"
            onClick={handleAchievementPanelToggle}
            size="medium"
          >
            {showAchievementPanel ? 'パネルを閉じる' : 'アチーブメントを開く'}
          </Button>
        </div>

        {showAchievementPanel && (
          <div style={{ marginTop: '20px', border: '1px solid #333', borderRadius: '8px', padding: '10px' }}>
            <AchievementPanel
              isVisible={true}
              achievements={mockAchievements}
              playerProfile={mockPlayerProfile}
              onClose={handleAchievementPanelToggle}
              onAchievementSelect={handleAchievementSelect}
              onCategoryChange={(category) => console.log('アチーブメントカテゴリ変更:', category)}
            />
          </div>
        )}
      </Card>

      {/* GameModeSelectorテスト */}
      <Card
        title="🎮 ゲームモードセレクターテスト"
        headerIcon="🕹️"
        size="medium"
        style={{ margin: '10px', maxWidth: '600px' }}
      >
        <p style={{ marginBottom: '16px', color: '#ccc' }}>
          Phase 3の第3ターゲット - GameModeSelectorの動作テスト
        </p>
        
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#1a1a1a', borderRadius: '6px' }}>
          <p style={{ color: '#61dafb', fontSize: '14px', margin: '0' }}>
            現在のモード: <strong>{getCurrentMode().name}</strong>
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button 
            variant="info"
            icon="🎮"
            onClick={handleGameModeSelectorToggle}
            size="medium"
          >
            {showGameModeSelector ? 'セレクターを閉じる' : 'モード選択を開く'}
          </Button>
        </div>

        {showGameModeSelector && (
          <div style={{ marginTop: '20px', border: '1px solid #333', borderRadius: '8px', padding: '10px' }}>
            <GameModeSelector
              isVisible={true}
              gameModes={mockGameModes}
              currentMode={getCurrentMode()}
              playerProfile={mockPlayerProfile}
              onClose={handleGameModeSelectorToggle}
              onModeSelect={handleGameModeSelect}
              onModeUnlock={handleGameModeUnlock}
            />
          </div>
        )}
      </Card>

      {/* Phase 3 完了ステータス */}
      <Card
        title="✅ Phase 3: コンポーネント段階移行"
        headerIcon="🚀"
        size="medium"
        style={{ margin: '10px', maxWidth: '600px', backgroundColor: '#0f4c3a' }}
      >
        <div style={{ display: 'grid', gap: '8px', color: '#4ade80' }}>
          <p>✅ UpgradeShop → React化（完了）</p>
          <p>✅ AchievementPanel → React化（完了）</p>
          <p>🔄 GameModeSelector → React化（進行中）</p>
          <p>✅ 段階的共存アプローチ実装</p>
          <p>✅ 型安全なコンポーネント設計</p>
          <p>✅ HMR対応・開発効率向上</p>
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#ccc' }}>
            次のステップ: ProgressDisplayUIの移行
          </p>
        </div>
      </Card>
    </>
  );
};

export default TestComponent;
