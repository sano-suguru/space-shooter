import { GameConfig, createGameConfig } from '../config/GameConfigFactory';
import { DebugInputHandler } from '../debug/DebugInputHandler';
import { DebugManager } from '../debug/DebugManager';
import { Boss } from '../entities/Boss';
import { BossBullet } from '../entities/BossBullet';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { PowerUp } from '../entities/PowerUp';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';
import { GameObjectFactory } from '../factories/GameObjectFactory';
import { IGame } from '../interfaces/IGame';
import { IInputManager } from '../interfaces/IInputManager';
import { IMessageManager } from '../interfaces/IMessageManager';
import { GameObjectManager } from '../managers/GameObjectManager';
import { GameStateManager } from '../managers/GameStateManager';
import { ScoreManager } from '../managers/ScoreManager';
import { WaveManager } from '../managers/WaveManager';
import { WeaponComparisonManager } from '../managers/WeaponComparisonManager';
import { PlayerProfile } from '../progression/types/PlayerProfile';
import { IRandomProvider } from '../providers/IRandomProvider';
import { BackgroundRenderer } from '../rendering/BackgroundRenderer';
import { GameRenderer } from '../rendering/GameRenderer';
import { PowerUpEffectService } from '../services/PowerUpEffectService';
import { CollisionSystem } from '../systems/CollisionSystem';
import { EnemyType } from '../types';
import { WeaponManager } from '../weapons/managers/WeaponManager';
import type { EquippedWeapon } from '../weapons/types/WeaponTypes';

import { GameEngine } from './GameEngine';

export class Game implements IGame {
  private ctx: CanvasRenderingContext2D;
  private level = 1;
  private bossSpawnScore: number = 1000;
  private currentScore: number = 0;
  private difficultyFactor: number = 0;
  private currentBossHealth: number;
  private gameEngine!: GameEngine;
  private gameObjectManager!: GameObjectManager;
  private collisionSystem!: CollisionSystem;
  private waveManager!: WaveManager;
  private backgroundRenderer!: BackgroundRenderer;
  private gameRenderer!: GameRenderer;
  private lastDrawTime: number = 0;
  private debugManager?: DebugManager;
  private debugInputHandler?: DebugInputHandler;
  private weaponComparisonManager!: WeaponComparisonManager;

  constructor(
    private canvas: HTMLCanvasElement,
    private eventEmitter: EventEmitter<EventMap>,
    private scoreManager: ScoreManager,
    private player: Player,
    private gameObjectFactory: GameObjectFactory,
    private stateManager: GameStateManager,
    private inputManager: IInputManager,
    private randomProvider: IRandomProvider,
    private messageManager: IMessageManager,
    private config: GameConfig = createGameConfig(),
    private powerUpEffectService: PowerUpEffectService = new PowerUpEffectService(
      createGameConfig()
    )
  ) {
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    // キャンバスサイズを固定サイズに設定
    this.canvas.width = this.config.canvas.width;
    this.canvas.height = this.config.canvas.height;

    this.currentBossHealth = this.config.boss.initialHealth;
    this.initializeGameObjects();
    this.initializeCollisionSystem();
    this.initializeWeaponComparisonSystem();
    this.setupEventListeners();

    // PlayerにGameインスタンスを設定（循環依存回避）
    this.player.setGame(this);

    // 武器システムの初期化
    this.initializeWeaponSystem();

    // 武器システムの初期化状況をログ出力
    console.log('🔫 ゲーム初期化時の武器システム状況:', {
      hasWeaponManager: !!this.player.getWeaponManager(),
      weaponSystemEnabled: this.player.isWeaponSystemEnabled(),
      equippedWeapons: this.player.getEquippedWeapons().length,
    });

    // 動的敵生成システムを有効化
    this.gameObjectFactory.setDynamicEnemyEnabled(true);

    // WaveManagerを初期化（設定を渡す）
    this.waveManager = new WaveManager(
      this.eventEmitter,
      this.gameObjectFactory,
      this,
      this.config
    );

    // WaveManagerで動的敵生成を有効化し、プレイヤーレベルを設定
    this.waveManager.setUseDynamicEnemies(true);
    this.waveManager.setPlayerLevel(this.level);

    // BackgroundRendererを初期化（設定を渡す）
    this.backgroundRenderer = new BackgroundRenderer(this.config);

    // GameRendererを初期化
    this.gameRenderer = new GameRenderer(this.ctx, this.backgroundRenderer);

    // GameEngineを初期化
    this.gameEngine = new GameEngine(
      (deltaTime: number) => this.updateWithDeltaTime(deltaTime),
      () => this.draw()
    );

    this.stateManager.setState('STARTING', this);

    // デバッグモードの初期化（WaveManager初期化後）
    this.initializeDebugMode();
  }

  /**
   * 武器システムの初期化
   */
  private initializeWeaponSystem(): void {
    // プレイヤープロファイルを作成（基本的な初期値）
    const playerProfile: PlayerProfile = {
      totalGamesPlayed: 0,
      totalScore: 0,
      highScore: 0,
      totalPlayTime: 0,
      lastPlayDate: new Date().toISOString(),
      coins: 1000, // 初期コイン
      experience: 0,
      level: this.level,
      unlockedUpgrades: ['basic_laser'], // 基本武器は最初から解除
      equippedUpgrades: {},
      completedAchievements: [],
      stats: {
        enemiesDestroyed: 0,
        bossesDefeated: 0,
        maxWaveReached: 1,
        powerupsCollected: 0,
        bulletsShot: 0,
        damageDealt: 0,
        damageTaken: 0,
        playStreakDays: 0,
      },
    };

    // WeaponManagerを作成
    const weaponManager = new WeaponManager(
      this.eventEmitter,
      playerProfile,
      this.randomProvider
    );

    // PlayerにWeaponManagerを設定
    this.player.setWeaponManager(weaponManager);

    // 武器システムを有効化
    this.player.enableWeaponSystem(true);

    console.log('🔫 武器システムを初期化しました:', {
      weaponManager: !!weaponManager,
      playerProfile: playerProfile,
      weaponDropSystem: !!weaponManager.getWeaponDropSystem(),
    });
  }

  /**
   * デバッグモードの初期化
   */
  private initializeDebugMode(): void {
    // デバッグモードかどうかをチェック（後で実装）
    // 現在は常に初期化（開発中のため）
    this.debugManager = new DebugManager(this, this.player, this.eventEmitter);
    this.debugInputHandler = new DebugInputHandler(
      this.debugManager,
      this.inputManager
    );

    // WaveManagerが初期化された後にDebugManagerに設定
    if (this.waveManager) {
      this.debugManager.setWaveManager(this.waveManager);
    }

    console.log('🔧 デバッグモードを初期化しました');
  }

  private initializeGameObjects(): void {
    // GameObjectManagerを初期化
    this.gameObjectManager = new GameObjectManager(this.eventEmitter);

    // プレイヤーをGameObjectManagerに設定
    this.gameObjectManager.setPlayer(this.player);

    // 従来の背景オブジェクトを作成（設定を使用）
    const stars = Array.from({ length: this.config.background.starCount }, () =>
      this.gameObjectFactory.createStar()
    );
    const planets = Array.from(
      { length: this.config.background.planetCount },
      () => this.gameObjectFactory.createPlanet()
    );
    const nebulas = Array.from(
      { length: this.config.background.nebulaCount },
      () => this.gameObjectFactory.createNebula()
    );
    const auroras = Array.from({ length: 2 }, () =>
      this.gameObjectFactory.createAurora()
    );

    // 新しい幻想的なエンティティを作成
    const comets = Array.from({ length: 3 }, () =>
      this.gameObjectFactory.createComet()
    );
    const meteorShowers = Array.from({ length: 2 }, () =>
      this.gameObjectFactory.createMeteorShower()
    );
    const spaceDusts = Array.from({ length: 4 }, () =>
      this.gameObjectFactory.createSpaceDust()
    );

    // 背景オブジェクトを設定
    this.gameObjectManager.setBackgroundObjects(
      stars,
      planets,
      nebulas,
      auroras
    );
    this.gameObjectManager.setEnhancedBackgroundObjects(
      comets,
      meteorShowers,
      spaceDusts
    );
  }

  /**
   * 衝突システムを初期化
   */
  private initializeCollisionSystem(): void {
    this.collisionSystem = new CollisionSystem(
      this.eventEmitter,
      this.gameObjectManager
    );
  }

  /**
   * 武器比較システムを初期化
   */
  private initializeWeaponComparisonSystem(): void {
    this.weaponComparisonManager = new WeaponComparisonManager(
      this.eventEmitter,
      this.gameObjectManager
    );
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    const restartButton = document.getElementById('restartButton');
    if (restartButton) {
      restartButton.addEventListener('click', this.restartGame);
    }
    this.eventEmitter.on('enemyDestroyed', this.handleEnemyDestroyed);
    this.eventEmitter.on('playerShot', this.handlePlayerShot);
    this.eventEmitter.on('playerDamaged', this.handlePlayerDamaged);
    this.eventEmitter.on('bossDamaged', this.handleBossDamaged);
    this.eventEmitter.on('bossDefeated', this.handleBossDefeated);
    this.eventEmitter.on('powerUpCollected', this.handlePowerUpCollected);
    this.eventEmitter.on('waveCompleted', this.handleWaveCompleted);
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      this.handleInput(e.key);
    });
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    // キー状態の管理はInputManagerが直接処理
    // setKeyStateメソッドは非推奨のため削除
    void e; // ESLintエラー回避
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    // キー状態の管理はInputManagerが直接処理
    // setKeyStateメソッドは非推奨のため削除
    void e; // ESLintエラー回避
  };

  private handleEnemyDestroyed = (enemy: Enemy): void => {
    this.scoreManager.addScore(enemy.getScore());

    // エンチャント済み武器ドロップの判定
    this.handleWeaponDrop(enemy);
  };

  private handlePlayerShot = (): void => {
    // GameObjectManagerは内部でイベントを処理
  };

  private handlePlayerDamaged = (damage: number): void => {
    this.player.takeDamage(damage);
    if (this.player.getHealth() <= 0) {
      this.gameOver();
    }
  };

  private handleBossDamaged = (): void => {
    const boss = this.gameObjectManager.getBoss();
    if (boss?.takeDamage()) {
      this.eventEmitter.emit('bossDefeated');
    }
  };

  private handleBossDefeated = (): void => {
    const boss = this.gameObjectManager.getBoss();
    if (boss) {
      this.gameObjectManager.createExplosion(
        boss.getPosition().x + boss.getWidth() / 2,
        boss.getPosition().y + boss.getHeight() / 2,
        2 // ボス爆発は大きく
      );
      this.gameObjectManager.setBoss(null);
      this.handleBossDefeat();
    }
  };

  private handlePowerUpCollected = (powerUp: PowerUp): void => {
    this.player.activatePowerup(powerUp.getType());
  };

  private handleWaveCompleted = (
    _waveNumber: number,
    bonusScore: number
  ): void => {
    this.scoreManager.addScore(bonusScore);
  };

  public start(): void {
    this.eventEmitter.emit('gameStarted');

    this.gameEngine.start();
    setInterval(this.spawnEnemy, this.config.enemy.spawnInterval);

    // ウェーブシステムを開始
    this.startWaveSystem();
  }

  /**
   * GameEngineから呼び出される更新メソッド
   */
  private updateWithDeltaTime(deltaTime: number): void {
    this.stateManager.update(this);

    // ゲームがプレイ中の場合のみオブジェクトを更新
    if (this.stateManager.isPlaying()) {
      this.updateGameObjects(deltaTime);
      this.checkCollisions();
      this.gameObjectManager.removeOffscreenObjects();
    }
  }

  public updateGameObjects(deltaTime: number): void {
    this.player.update(deltaTime);
    this.gameObjectManager.updateAllObjects(deltaTime);

    // ウェーブシステムのアップデート
    if (this.config.wave.systemEnabled) {
      this.waveManager.update();
    }

    this.currentScore = this.scoreManager.getScore();
    // 既存のボス生成処理を無効化（新しいウェーブシステムを使用）
    // if (
    //   this.currentScore >= this.bossSpawnScore &&
    //   !this.gameObjectManager.getBoss()
    // ) {
    //   this.spawnBoss();
    // }
  }

  private spawnBoss(): void {
    const boss = new Boss(this, this.config);
    this.gameObjectManager.setBoss(boss);
    this.eventEmitter.emit('bossSpawned');
    this.showMessage('ボスが出現しました！', 3000, 'important');
  }

  /**
   * 衝突判定をCollisionSystemに委譲
   */
  public checkCollisions(): void {
    this.collisionSystem.checkAllCollisions(this.player);
  }

  private draw(): void {
    const now = performance.now();
    const deltaTime = now - (this.lastDrawTime || now);
    this.lastDrawTime = now;

    this.gameRenderer.render(this.player, this.gameObjectManager, deltaTime);
  }

  private spawnEnemy = (): void => {
    if (this.stateManager.isPlaying() && !this.gameObjectManager.getBoss()) {
      const enemyTypes = Object.keys(this.config.enemy.types) as EnemyType[];
      const randomType =
        enemyTypes[
          Math.floor(this.randomProvider.random() * enemyTypes.length)
        ];

      // 動的敵生成を使用（フォールバック機能付き）
      const difficultyFactors = {
        playerLevel: this.level,
        currentWave: this.waveManager?.getCurrentWave() ?? 1,
        baseMultiplier: 1.0,
        levelScaling: 0.1,
        waveScaling: 0.05,
      };

      const enemy = this.gameObjectFactory.createDynamicEnemySafe(
        randomType,
        this,
        difficultyFactors
      );
      this.gameObjectManager.addEnemy(enemy);

      if (this.randomProvider.random() < this.config.powerup.spawnChance) {
        const powerup = this.gameObjectFactory.createPowerUp();
        this.gameObjectManager.addPowerUp(powerup);
      }
    }
  };

  public gameOver(): void {
    this.stateManager.setState('GAME_OVER', this);
  }

  private restartGame = (): void => {
    this.resetGame();
    this.stateManager.setState('PLAYING', this);
  };

  public resetGame(): void {
    this.player = new Player(
      this.eventEmitter,
      this.inputManager,
      this.randomProvider,
      this.config,
      this.powerUpEffectService
    );
    this.player.setGame(this);

    // 武器システムを再初期化
    this.initializeWeaponSystem();

    this.gameObjectManager.reset();

    // リセット後に新しいプレイヤーをGameObjectManagerに設定
    this.gameObjectManager.setPlayer(this.player);

    this.level = 1;
    this.bossSpawnScore = 1000;
    this.scoreManager = new ScoreManager(this.eventEmitter);
    this.difficultyFactor = 0;
    this.currentBossHealth = this.config.boss.initialHealth;

    console.log('🔄 ゲームリセット完了 - 武器システム再初期化済み:', {
      hasWeaponManager: !!this.player.getWeaponManager(),
      weaponSystemEnabled: this.player.isWeaponSystemEnabled(),
      playerSetInGameObjectManager: !!this.gameObjectManager.getPlayer(),
    });
  }

  private handleBossDefeat(): void {
    this.scoreManager.addScore(500);

    this.showMessage(
      `レベル ${this.level} クリア！次のレベルが始まります。`,
      3000,
      'important'
    );

    this.level++;
    this.eventEmitter.emit('levelUpdated', this.level);

    // WaveManagerのプレイヤーレベルを更新
    this.waveManager.setPlayerLevel(this.level);

    setTimeout(() => {
      this.startNextLevel();
    }, 3000);
    this.bossSpawnScore = this.currentScore + 1000;
  }

  private startNextLevel(): void {
    // GameObjectManagerを使用してオブジェクトをクリア
    this.gameObjectManager.getEnemies().length = 0;
    this.gameObjectManager.getBossBullets().length = 0;
    this.gameObjectManager.getPowerups().length = 0;

    this.difficultyFactor = this.level * 0.1;

    this.currentBossHealth =
      this.config.boss.initialHealth + (this.level - 1) * 10;

    this.bossSpawnScore = this.scoreManager.getScore() + 1000;

    this.eventEmitter.emit('levelStarted', this.level);
    this.showMessage(`レベル ${this.level} 開始！`, 3000, 'important');
  }

  public showMessage(
    text: string,
    duration?: number,
    priority?: 'critical' | 'important' | 'info' | 'minimal'
  ): void {
    this.messageManager.showMessage(text, duration, priority);
  }

  public showWaveMessage(text: string): void {
    this.messageManager.showWaveMessage(text);
  }

  public hideMessage(): void {
    this.messageManager.hideMessage();
  }

  public addBossBullet(bullet: BossBullet): void {
    this.gameObjectManager.addBossBullet(bullet);
  }

  /**
   * ボスを設定（WaveManager用）
   */
  public setBoss(boss: Boss | null): void {
    this.gameObjectManager.setBoss(boss);
  }

  /**
   * 現在のボスを取得
   */
  public getBoss(): Boss | null {
    return this.gameObjectManager.getBoss();
  }

  public resumeGameLoop(): void {
    this.gameEngine.resume();
  }

  public pauseGameLoop(): void {
    this.gameEngine.pause();
  }

  public showGameOverScreen(): void {
    this.messageManager.showGameOverScreen(this.scoreManager.getScore());
  }

  public hideGameOverScreen(): void {
    this.messageManager.hideGameOverScreen();
  }

  public getStateManager(): GameStateManager {
    return this.stateManager;
  }

  public handleInput(input: string): void {
    this.stateManager.handleInput(this, input);
  }

  public updateUI(): void {
    this.eventEmitter.emit('healthChanged', this.player.getHealth());
    this.eventEmitter.emit('levelUpdated', this.level);
    this.eventEmitter.emit('scoreUpdated', this.scoreManager.getScore());
  }

  public getDifficultyFactor(): number {
    return this.difficultyFactor;
  }

  public getCurrentBossHealth(): number {
    return this.currentBossHealth;
  }

  /**
   * GameObjectManagerを通して弾丸を取得して初期化
   */
  public createBullet(
    x: number,
    y: number,
    speed?: number,
    color?: string,
    owner?: 'player' | 'enemy' | 'boss'
  ): Bullet | null {
    return this.gameObjectManager.createBullet(x, y, speed, color, owner);
  }

  /**
   * プールの統計情報を取得（デバッグ用）
   */
  public getPoolStats(): { [key: string]: number } {
    return this.gameObjectManager.getPoolStats();
  }

  /**
   * 敵をゲームに追加（WaveManager用）
   */
  public addEnemy(enemy: Enemy): void {
    this.gameObjectManager.addEnemy(enemy);
  }

  /**
   * ゲームの開始時にウェーブシステムを開始
   */
  public startWaveSystem(): void {
    if (this.config.wave.systemEnabled && this.waveManager) {
      this.waveManager.startNextWave();
    }
  }

  /**
   * 背景レンダリング最適化の切り替え
   */
  public toggleBackgroundOptimization(): void {
    this.gameRenderer.toggleBackgroundOptimization();
  }

  /**
   * 背景レンダリングパフォーマンス統計を取得（レガシー）
   */
  public getBackgroundPerformanceStats(): ReturnType<
    GameRenderer['getBackgroundPerformanceStats']
  > {
    return this.gameRenderer.getBackgroundPerformanceStats();
  }

  /**
   * 詳細な背景レンダリングパフォーマンス統計を取得
   */
  public getDetailedBackgroundPerformanceStats(): ReturnType<
    GameRenderer['getDetailedBackgroundPerformanceStats']
  > {
    return this.gameRenderer.getDetailedBackgroundPerformanceStats();
  }

  /**
   * パフォーマンス監視システムへのアクセス
   */
  public getPerformanceMonitor(): ReturnType<
    GameRenderer['getPerformanceMonitor']
  > {
    return this.gameRenderer.getPerformanceMonitor();
  }

  /**
   * LOD管理システムへのアクセス
   */
  public getLODManager(): ReturnType<GameRenderer['getLODManager']> {
    return this.gameRenderer.getLODManager();
  }

  /**
   * 背景レンダリングパフォーマンス情報をコンソールに出力
   */
  public logBackgroundPerformance(): void {
    this.gameRenderer.logBackgroundPerformance();
  }

  /**
   * 全パフォーマンス統計を取得（統合）
   */
  public getAllPerformanceStats(): {
    background: ReturnType<Game['getDetailedBackgroundPerformanceStats']>;
    pools: ReturnType<GameObjectManager['getAllPoolStats']>;
    performance: ReturnType<
      ReturnType<Game['getPerformanceMonitor']>['getDetailedStats']
    >;
    lod: ReturnType<ReturnType<Game['getLODManager']>['getLODStats']>;
  } {
    return {
      background: this.getDetailedBackgroundPerformanceStats(),
      pools: this.gameObjectManager.getAllPoolStats(),
      performance: this.getPerformanceMonitor().getDetailedStats(),
      lod: this.getLODManager().getLODStats(),
    };
  }

  /**
   * パフォーマンス最適化を実行
   */
  public optimizePerformance(): void {
    // パーティクルプールの最適化
    this.gameObjectManager.optimizeParticlePools();

    // 背景レンダリングの設定更新
    this.backgroundRenderer.updatePerformanceBasedSettings();

    console.log('🚀 パフォーマンス最適化を実行しました');
  }

  /**
   * リソースクリーンアップ
   */
  public dispose(): void {
    if (this.gameRenderer) {
      this.gameRenderer.dispose();
    }

    if (this.debugManager) {
      this.debugManager.dispose();
    }

    if (this.debugInputHandler) {
      this.debugInputHandler.dispose();
    }
  }

  /**
   * DebugManagerを取得（デバッグ用）
   */
  public getDebugManager(): DebugManager | undefined {
    return this.debugManager;
  }

  /**
   * デバッグモードが有効かどうか
   */
  public isDebugModeActive(): boolean {
    return this.debugManager?.isActive() ?? false;
  }

  /**
   * 武器切り替え処理
   */
  public switchWeapon(slot: number): void {
    const weaponManager = this.player?.getWeaponManager();
    if (weaponManager) {
      const equippedWeapons = weaponManager.getEquippedWeapons();
      const weapon = equippedWeapons.find(w => w.slot === slot);
      if (weapon) {
        // 武器切り替えイベントを発火
        this.eventEmitter.emit('weaponSwitched', {
          weaponId: weapon.weaponId,
          slot: slot,
          weaponName: weapon.config.name,
        });

        // プレイヤーのアクティブ武器スロットを更新
        this.player.setActiveWeaponSlot(slot);

        // UI更新のためのメッセージ表示
        this.showMessage(
          `${weapon.config.icon} ${weapon.config.name} に切り替えました`,
          1000,
          'info'
        );
      }
    }
  }

  /**
   * 現在のアクティブ武器スロットを取得
   */
  public getActiveWeaponSlot(): number {
    return this.player?.getActiveWeaponSlot() ?? 0;
  }

  /**
   * 装備中の武器一覧を取得
   */
  public getEquippedWeapons(): EquippedWeapon[] {
    const weaponManager = this.player?.getWeaponManager();
    return weaponManager?.getEquippedWeapons() ?? [];
  }

  /**
   * 敵撃破時の武器ドロップ処理
   */
  private handleWeaponDrop(enemy: Enemy): void {
    console.log('🔫 武器ドロップ処理開始:', {
      enemyType: enemy.getEnemyType(),
      enemyPosition: enemy.getPosition(),
      hasPlayer: !!this.player,
    });

    const weaponManager = this.player?.getWeaponManager();
    if (!weaponManager) {
      console.log('❌ WeaponManagerが見つかりません - 武器ドロップをスキップ');
      return;
    }

    console.log('✅ WeaponManagerが見つかりました');

    const weaponDropSystem = weaponManager.getWeaponDropSystem();
    const enemyPosition = enemy.getPosition();
    const enemyType = enemy.getEnemyType();

    // 敵情報を作成
    const enemyInfo = {
      type: this.mapEnemyTypeToDropType(enemyType),
      level: this.level,
      position: enemyPosition,
    };

    console.log('🎯 ドロップ判定実行:', {
      enemyInfo,
      weaponDropSystem: !!weaponDropSystem,
    });

    // 武器ドロップの判定
    const dropResult = weaponDropSystem.attemptDrop(enemyInfo);

    console.log('🎲 ドロップ結果:', {
      success: dropResult.success,
      actualDropRate: dropResult.actualDropRate,
      dropReason: dropResult.dropReason,
    });

    if (dropResult.success && dropResult.droppedWeapon) {
      // ゲームオブジェクトマネージャーに追加
      this.gameObjectManager.addDroppedWeapon(dropResult.droppedWeapon);

      // ドロップメッセージを表示
      const rarityText = this.getRarityDisplayText(
        dropResult.enchantedWeapon?.rarity ?? 'common'
      );
      this.showMessage(`${rarityText}武器がドロップしました！`, 2000, 'info');

      console.log('🎁 武器ドロップ成功:', {
        weaponName: dropResult.enchantedWeapon?.displayName,
        rarity: dropResult.enchantedWeapon?.rarity,
        position: enemyPosition,
        dropReason: dropResult.dropReason,
      });
    } else {
      console.log('💨 武器ドロップなし:', dropResult.dropReason);
    }
  }

  /**
   * 敵タイプをドロップシステム用にマッピング
   */
  private mapEnemyTypeToDropType(
    enemyType: string
  ): 'normal' | 'elite' | 'boss' {
    switch (enemyType) {
      case 'LARGE':
        return 'elite';
      case 'BOSS':
        return 'boss';
      default:
        return 'normal';
    }
  }

  /**
   * レアリティの表示テキストを取得
   */
  private getRarityDisplayText(rarity: string): string {
    switch (rarity) {
      case 'common':
        return 'コモン';
      case 'uncommon':
        return 'アンコモン';
      case 'rare':
        return 'レア';
      case 'epic':
        return 'エピック';
      case 'legendary':
        return 'レジェンダリー';
      default:
        return '';
    }
  }
}
