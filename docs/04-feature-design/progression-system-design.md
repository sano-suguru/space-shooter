# Space Shooter プログレッションシステム 全体設計書

## 📋 概要
既存の優秀なSpace Shooterアーキテクチャを完全保護しながら、リプレイアビリティを劇的に向上させるプログレッションシステムの詳細設計書。

## 🏗️ アーキテクチャ統合戦略

### 既存システム完全保護
- 現在の361テスト全て維持
- Clean Architecture パターン継続
- 既存のManager群を拡張（置換なし）
- EventEmitterベースの疎結合維持

### 新規システム統合ポイント
```typescript
// 1. ProgressManager - ScoreManagerを拡張
class ProgressManager extends ScoreManager {
    // 既存機能完全保持 + プログレッション機能追加
}

// 2. GameStateManager - 新しい状態追加
type GameStateKey = 'STARTING' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' 
                  | 'UPGRADE_SHOP' | 'ACHIEVEMENTS' | 'STATISTICS';

// 3. EventMap - 新しいイベント追加
type EventMap = {
    // 既存イベント全て保持
    'playerLevelUp': (newLevel: number, coinsEarned: number) => void;
    'achievementUnlocked': (achievement: Achievement) => void;
    'upgradeApplied': (upgradeType: string, newLevel: number) => void;
    // ...
}
```

## 🎯 段階的実装計画

### Phase 1: データ基盤 (1週間)
**目標**: 永続化システム構築、既存コード無変更

```typescript
// 1.1 PlayerProfile データ構造定義
interface PlayerProfile {
    // 基本統計
    totalGamesPlayed: number;
    totalScore: number;
    highScore: number;
    totalPlayTime: number;
    lastPlayDate: string;
    
    // 永続通貨システム
    coins: number;              // メイン通貨
    experience: number;         // 経験値
    level: number;             // プレイヤーレベル
    
    // プログレッション状態
    unlockedUpgrades: string[];
    equippedUpgrades: { [key: string]: number };
    completedAchievements: string[];
    
    // 詳細統計
    stats: {
        enemiesDestroyed: number;
        bossesDefeated: number;
        maxWaveReached: number;
        powerupsCollected: number;
        bulletsShot: number;
        damageDealt: number;
        damageTaken: number;
        playStreakDays: number;
    };
}

// 1.2 PersistenceManager - LocalStorage管理
class PersistenceManager {
    private static readonly STORAGE_KEY = 'space_shooter_profile';
    
    static saveProfile(profile: PlayerProfile): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
    }
    
    static loadProfile(): PlayerProfile {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        return saved ? JSON.parse(saved) : this.createDefaultProfile();
    }
    
    private static createDefaultProfile(): PlayerProfile {
        return {
            totalGamesPlayed: 0,
            totalScore: 0,
            highScore: 0,
            totalPlayTime: 0,
            lastPlayDate: new Date().toISOString(),
            coins: 0,
            experience: 0,
            level: 1,
            unlockedUpgrades: [],
            equippedUpgrades: {},
            completedAchievements: [],
            stats: {
                enemiesDestroyed: 0,
                bossesDefeated: 0,
                maxWaveReached: 0,
                powerupsCollected: 0,
                bulletsShot: 0,
                damageDealt: 0,
                damageTaken: 0,
                playStreakDays: 1
            }
        };
    }
}
```

### Phase 2: アップグレードシステム (1週間)
**目標**: 段階的強化要素、既存バランス保持

```typescript
// 2.1 アップグレード定義
interface UpgradeConfig {
    id: string;
    name: string;
    description: string;
    category: 'weapon' | 'defense' | 'utility';
    maxLevel: number;
    baseCost: number;
    costMultiplier: number;
    unlockCondition: (profile: PlayerProfile) => boolean;
    effect: (level: number) => UpgradeEffect;
}

interface UpgradeEffect {
    fireRateMultiplier?: number;
    bulletDamageMultiplier?: number;
    bulletCountMultiplier?: number;
    healthMultiplier?: number;
    shieldDurationMultiplier?: number;
    moveSpeedMultiplier?: number;
    magnetRangeBonus?: number;
    experienceBonusMultiplier?: number;
    coinBonusMultiplier?: number;
}

const UPGRADE_CONFIGS: UpgradeConfig[] = [
    {
        id: 'rapid_fire',
        name: '速射改良',
        description: '射撃速度を向上させる',
        category: 'weapon',
        maxLevel: 10,
        baseCost: 100,
        costMultiplier: 1.5,
        unlockCondition: () => true,
        effect: (level) => ({ fireRateMultiplier: 1 + (level * 0.15) })
    },
    {
        id: 'power_shot',
        name: '威力強化',
        description: '弾丸の威力を向上させる',
        category: 'weapon',
        maxLevel: 10,
        baseCost: 150,
        costMultiplier: 1.6,
        unlockCondition: (profile) => profile.level >= 3,
        effect: (level) => ({ bulletDamageMultiplier: 1 + (level * 0.2) })
    },
    {
        id: 'multi_shot',
        name: '多重射撃',
        description: '同時発射数を増加',
        category: 'weapon',
        maxLevel: 5,
        baseCost: 500,
        costMultiplier: 2.0,
        unlockCondition: (profile) => profile.stats.enemiesDestroyed >= 100,
        effect: (level) => ({ bulletCountMultiplier: 1 + (level * 0.5) })
    }
    // ... 他のアップグレード
];
```

### Phase 3: アチーブメントシステム (1週間)
**目標**: 達成感・目標設定、長期モチベーション

```typescript
// 3.1 アチーブメント定義
interface Achievement {
    id: string;
    name: string;
    description: string;
    category: 'combat' | 'survival' | 'collection' | 'mastery' | 'special';
    difficulty: 'bronze' | 'silver' | 'gold' | 'platinum';
    condition: (profile: PlayerProfile, gameStats?: GameSession) => boolean;
    reward: {
        coins: number;
        experience: number;
        unlockUpgrade?: string;
        unlockGameMode?: string;
    };
    hidden: boolean;
    progressTracker?: (profile: PlayerProfile) => { current: number; required: number };
}

const ACHIEVEMENTS: Achievement[] = [
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
        id: 'wave_master',
        name: 'ウェーブマスター',
        description: 'ウェーブ10まで到達する',
        category: 'survival',
        difficulty: 'gold',
        condition: (profile) => profile.stats.maxWaveReached >= 10,
        reward: { coins: 1000, experience: 500, unlockGameMode: 'hardcore' },
        hidden: false,
        progressTracker: (profile) => ({ current: profile.stats.maxWaveReached, required: 10 })
    },
    {
        id: 'perfectionist',
        name: '完璧主義者',
        description: '完璧なゲームを達成（全ウェーブノーダメージ）',
        category: 'mastery',
        difficulty: 'platinum',
        condition: (profile, session) => session?.perfectWaves >= 15,
        reward: { coins: 5000, experience: 2500 },
        hidden: true
    }
    // ... 他のアチーブメント
];
```

### Phase 4: ゲームモード拡張 (1週間)
**目標**: プレイ体験の多様化、リプレイ価値向上

```typescript
// 4.1 ゲームモード定義
interface GameMode {
    id: string;
    name: string;
    description: string;
    unlockCondition: (profile: PlayerProfile) => boolean;
    modifiers: GameModeModifiers;
    specialRules?: string[];
    rewardMultiplier: number;
}

interface GameModeModifiers {
    enemySpeedMultiplier: number;
    enemyHealthMultiplier: number;
    enemySpawnRateMultiplier: number;
    scoreMultiplier: number;
    coinMultiplier: number;
    experienceMultiplier: number;
}

const GAME_MODES: GameMode[] = [
    {
        id: 'normal',
        name: 'ノーマル',
        description: '標準的な難易度でSpace Shooterを楽しめます',
        unlockCondition: () => true,
        modifiers: {
            enemySpeedMultiplier: 1.0,
            enemyHealthMultiplier: 1.0,
            enemySpawnRateMultiplier: 1.0,
            scoreMultiplier: 1.0,
            coinMultiplier: 1.0,
            experienceMultiplier: 1.0
        },
        rewardMultiplier: 1.0
    },
    {
        id: 'hardcore',
        name: 'ハードコア',
        description: '敵が強力になる代わりに報酬が大幅に増加',
        unlockCondition: (profile) => profile.stats.maxWaveReached >= 10,
        modifiers: {
            enemySpeedMultiplier: 1.5,
            enemyHealthMultiplier: 2.0,
            enemySpawnRateMultiplier: 1.3,
            scoreMultiplier: 3.0,
            coinMultiplier: 3.0,
            experienceMultiplier: 2.5
        },
        specialRules: ['パワーアップ出現率低下', '敵の攻撃力1.5倍'],
        rewardMultiplier: 3.0
    },
    {
        id: 'survival',
        name: 'サバイバル',
        description: '体力1、パワーアップなしの究極のチャレンジ',
        unlockCondition: (profile) => profile.stats.bossesDefeated >= 5,
        modifiers: {
            enemySpeedMultiplier: 1.0,
            enemyHealthMultiplier: 1.0,
            enemySpawnRateMultiplier: 1.0,
            scoreMultiplier: 5.0,
            coinMultiplier: 4.0,
            experienceMultiplier: 3.0
        },
        specialRules: ['体力1', 'パワーアップなし', '一撃死'],
        rewardMultiplier: 5.0
    }
];
```

### Phase 5: UI/UX統合 (1週間)
**目標**: 直感的なプログレッション体験

```typescript
// 5.1 UpgradeShopUI
class UpgradeShopUI {
    private container: HTMLElement;
    
    constructor(
        private domManager: IDOMManager,
        private upgradeManager: UpgradeManager,
        private progressManager: ProgressManager
    ) {
        this.container = this.createShopUI();
    }
    
    private createShopUI(): HTMLElement {
        const shop = this.domManager.createElement('div', {
            id: 'upgrade-shop',
            className: 'upgrade-shop'
        });
        
        shop.innerHTML = `
            <div class="shop-header">
                <h2>アップグレードショップ</h2>
                <div class="player-stats">
                    <span class="coins">💰 ${this.progressManager.getProfile().coins}</span>
                    <span class="level">Lv.${this.progressManager.getProfile().level}</span>
                </div>
            </div>
            <div class="shop-categories">
                <button class="category-tab active" data-category="weapon">武器</button>
                <button class="category-tab" data-category="defense">防御</button>
                <button class="category-tab" data-category="utility">特殊</button>
            </div>
            <div class="upgrade-list"></div>
        `;
        
        this.setupEventListeners();
        return shop;
    }
    
    private setupEventListeners(): void {
        this.container.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const category = target.dataset.category!;
                this.updateUpgradeList(category);
            });
        });
    }
    
    show(): void {
        this.container.style.display = 'block';
    }
    
    hide(): void {
        this.container.style.display = 'none';
    }
}

// 5.2 AchievementPanel
class AchievementPanel {
    private container: HTMLElement;
    
    constructor(
        private domManager: IDOMManager,
        private achievementManager: AchievementManager
    ) {
        this.container = this.createAchievementPanel();
    }
    
    private createAchievementPanel(): HTMLElement {
        const panel = this.domManager.createElement('div', {
            id: 'achievement-panel',
            className: 'achievement-panel'
        });
        
        panel.innerHTML = `
            <div class="achievement-header">
                <h2>アチーブメント</h2>
                <div class="completion-rate">
                    達成率: ${this.achievementManager.getCompletionPercentage()}%
                </div>
            </div>
            <div class="achievement-filters">
                <button class="filter-tab active" data-filter="all">全て</button>
                <button class="filter-tab" data-filter="completed">達成済み</button>
                <button class="filter-tab" data-filter="available">未達成</button>
            </div>
            <div class="achievement-list"></div>
        `;
        
        return panel;
    }
    
    show(): void {
        this.container.style.display = 'block';
    }
    
    hide(): void {
        this.container.style.display = 'none';
    }
}
```

## 📊 リプレイアビリティ設計原則

### 短期目標 (毎ゲーム)
- **即座の報酬**: ゲーム終了時にコイン・経験値獲得
- **視覚的フィードバック**: レベルアップ、アチーブメント解除通知
- **次回への動機**: 「あと少しで新しいアップグレード解除」

### 中期目標 (数回プレイ)
- **段階的な強化**: アップグレードによる確実な成長実感
- **新コンテンツ解放**: ゲームモード、アチーブメント解除
- **選択の多様性**: 複数のアップグレード戦略

### 長期目標 (継続プレイ)
- **マスタリー追求**: 全アップグレード最大化
- **チャレンジ要素**: 高難易度モード、秘密アチーブメント
- **コンプリート目標**: 全要素100%達成

## 🛠️ 実装優先順位 & ロードマップ

### 週1: データ基盤
- [ ] PlayerProfile インターフェース定義
- [ ] PersistenceManager 実装
- [ ] ProgressManager 基本機能
- [ ] 既存システムとの統合テスト

### 週2: アップグレードシステム
- [ ] UpgradeConfig & UpgradeEffect 定義
- [ ] UpgradeManager 実装
- [ ] Player.ts へのアップグレード効果適用
- [ ] 基本的なアップグレードShop UI

### 週3: アチーブメントシステム
- [ ] Achievement インターフェース & データ定義
- [ ] AchievementManager 実装
- [ ] ゲーム内アチーブメント判定統合
- [ ] アチーブメントパネル UI

### 週4: ゲームモード拡張
- [ ] GameMode システム実装
- [ ] 各モードのバランス調整
- [ ] モード選択UI
- [ ] 特殊ルール実装

### 週5: UI/UX統合
- [ ] 各パネルのスタイリング
- [ ] アニメーション効果追加
- [ ] レスポンシブ対応
- [ ] ユーザビリティテスト

## 📈 成功指標 (KPI)

### エンゲージメント指標
- **セッション長**: 平均プレイ時間 +50%
- **リテンション**: 7日リテンション率 +30%
- **セッション頻度**: 日次プレイ率 +40%

### プログレッション指標
- **アップグレード使用率**: 90%以上のプレイヤーがアップグレード購入
- **アチーブメント達成率**: 平均達成率 60%以上
- **モード利用率**: 複数モードプレイ率 70%以上

### ゲームプレイ指標
- **平均スコア**: ベースライン比 +25%
- **最高到達ウェーブ**: ベースライン比 +35%
- **プレイヤースキル向上**: 継続プレイヤーの上達曲線

## 🔒 リスク管理

### 技術的リスク
- **パフォーマンス**: LocalStorage容量制限対策
- **互換性**: 既存セーブデータとの互換性保持
- **バランス**: アップグレードによるゲームバランス崩壊防止

### ユーザー体験リスク
- **複雑化**: システム複雑化によるユーザー混乱
- **グラインド化**: 過度な反復プレイ要求
- **パワークリープ**: アップグレードによる難易度インフレ

### 対策
- **段階的リリース**: フィーチャーフラグによる段階導入
- **A/Bテスト**: 複数バージョンでの効果測定
- **フィードバック収集**: ユーザーテストとイテレーション

## 🎯 実装開始準備

### 開発環境準備
```bash
# プログレッション機能用ブランチ作成
git checkout -b feature/progression-system

# 新しいディレクトリ構造準備
mkdir -p src/progression/{managers,ui,types}
mkdir -p src/progression/data
```

### ファイル構成
```
src/progression/
├── managers/
│   ├── ProgressManager.ts
│   ├── UpgradeManager.ts 
│   ├── AchievementManager.ts
│   └── GameModeManager.ts
├── ui/
│   ├── UpgradeShopUI.ts
│   ├── AchievementPanel.ts
│   └── ProgressDisplay.ts
├── types/
│   ├── PlayerProfile.ts
│   ├── Achievement.ts
│   └── GameMode.ts
└── data/
    ├── upgrades.ts
    ├── achievements.ts
    └── gameModes.ts
```

このプログレッションシステムにより、Space Shooterは単発のアーケードゲームから、長期間楽しめる成長型ゲーム体験へと進化します。既存の優秀なアーキテクチャを完全に保護しながら、プレイヤーの継続的なエンゲージメントを実現する設計となっています。
