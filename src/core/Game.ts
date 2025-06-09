import { GAME_CONSTANTS } from '../constants/GameConstants';
import { Boss } from '../entities/Boss';
import { BossBullet } from '../entities/BossBullet';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { PowerUp } from '../entities/PowerUp';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';
import { GameObjectFactory } from '../factories/GameObjectFactory';
import { GameObjectManager } from '../managers/GameObjectManager';
import { GameStateManager } from '../managers/GameStateManager';
import { ScoreManager } from '../managers/ScoreManager';
import { WaveManager } from '../managers/WaveManager';
import { EnemyType } from '../types';
import { CollisionSystem } from '../systems/CollisionSystem';
import { GameEngine } from './GameEngine';
import { BackgroundRenderer } from '../rendering/BackgroundRenderer';
import { GameRenderer } from '../rendering/GameRenderer';
import { IInputManager } from '../interfaces/IInputManager';
import { IRandomProvider } from '../providers/IRandomProvider';
import { IMessageManager } from '../interfaces/IMessageManager';

export class Game {
    private ctx: CanvasRenderingContext2D;
    private level = 1;
    private bossSpawnScore: number = 1000;
    private currentScore: number = 0;
    private difficultyFactor: number = 0;
    private currentBossHealth: number = GAME_CONSTANTS.BOSS.INITIAL_HEALTH;
    private gameEngine!: GameEngine;
    private gameObjectManager!: GameObjectManager;
    private collisionSystem!: CollisionSystem;
    private waveManager!: WaveManager;
    private backgroundRenderer!: BackgroundRenderer;
    private gameRenderer!: GameRenderer;

    constructor(
        private canvas: HTMLCanvasElement,
        private eventEmitter: EventEmitter<EventMap>,
        private scoreManager: ScoreManager,
        private player: Player,
        private gameObjectFactory: GameObjectFactory,
        private stateManager: GameStateManager,
        private inputManager: IInputManager,
        private randomProvider: IRandomProvider,
        private messageManager: IMessageManager
    ) {
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.canvas.width = GAME_CONSTANTS.CANVAS.WIDTH;
        this.canvas.height = GAME_CONSTANTS.CANVAS.HEIGHT;
        this.initializeGameObjects();
        this.initializeCollisionSystem();
        this.setupEventListeners();

        // PlayerにGameインスタンスを設定（循環依存回避）
        this.player.setGame(this);

        // WaveManagerを初期化
        this.waveManager = new WaveManager(this.eventEmitter, this.gameObjectFactory, this);

        // BackgroundRendererを初期化
        this.backgroundRenderer = new BackgroundRenderer();

        // GameRendererを初期化
        this.gameRenderer = new GameRenderer(this.ctx, this.backgroundRenderer);

        // GameEngineを初期化
        this.gameEngine = new GameEngine(
            (deltaTime: number) => this.updateWithDeltaTime(deltaTime),
            () => this.draw()
        );

        this.stateManager.setState('STARTING', this);
    }

    private initializeGameObjects(): void {
        // GameObjectManagerを初期化
        this.gameObjectManager = new GameObjectManager(this.eventEmitter);

        // 従来の背景オブジェクトを作成
        const stars = Array.from({ length: GAME_CONSTANTS.BACKGROUND.STAR_COUNT }, () => this.gameObjectFactory.createStar());
        const planets = Array.from({ length: GAME_CONSTANTS.BACKGROUND.PLANET_COUNT }, () => this.gameObjectFactory.createPlanet());
        const nebulas = Array.from({ length: GAME_CONSTANTS.BACKGROUND.NEBULA_COUNT }, () => this.gameObjectFactory.createNebula());
        const auroras = Array.from({ length: 2 }, () => this.gameObjectFactory.createAurora());

        // 新しい幻想的なエンティティを作成
        const comets = Array.from({ length: 3 }, () => this.gameObjectFactory.createComet());
        const meteorShowers = Array.from({ length: 2 }, () => this.gameObjectFactory.createMeteorShower());
        const spaceDusts = Array.from({ length: 4 }, () => this.gameObjectFactory.createSpaceDust());

        // 背景オブジェクトを設定
        this.gameObjectManager.setBackgroundObjects(stars, planets, nebulas, auroras);
        this.gameObjectManager.setEnhancedBackgroundObjects(comets, meteorShowers, spaceDusts);
    }

    /**
     * 衝突システムを初期化
     */
    private initializeCollisionSystem(): void {
        this.collisionSystem = new CollisionSystem(this.eventEmitter, this.gameObjectManager);
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
        this.player.setKeyState(e.key, true);
    }

    private handleKeyUp = (e: KeyboardEvent): void => {
        this.player.setKeyState(e.key, false);
    }

    private handleEnemyDestroyed = (enemy: Enemy): void => {
        this.scoreManager.addScore(enemy.getScore());
    }

    private handlePlayerShot = (_bullet: Bullet): void => {
        // GameObjectManagerは内部でイベントを処理
    }

    private handlePlayerDamaged = (damage: number): void => {
        this.player.takeDamage(damage);
        if (this.player.getHealth() <= 0) {
            this.gameOver();
        }
    }

    private handleBossDamaged = (): void => {
        const boss = this.gameObjectManager.getBoss();
        if (boss && boss.takeDamage()) {
            this.eventEmitter.emit('bossDefeated');
        }
    }

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
    }

    private handlePowerUpCollected = (powerUp: PowerUp): void => {
        this.player.activatePowerup(powerUp.getType());
    }

    private handleWaveCompleted = (_waveNumber: number, bonusScore: number): void => {
        this.scoreManager.addScore(bonusScore);
    }

    public start(): void {
        this.eventEmitter.emit('gameStarted');
        this.gameEngine.start();
        setInterval(this.spawnEnemy, GAME_CONSTANTS.ENEMY.SPAWN_INTERVAL);
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
        if (GAME_CONSTANTS.WAVE.SYSTEM_ENABLED) {
            this.waveManager.update();
        }

        this.currentScore = this.scoreManager.getScore();
        if (this.currentScore >= this.bossSpawnScore && !this.gameObjectManager.getBoss()) {
            this.spawnBoss();
        }
    }

    private spawnBoss(): void {
        const boss = new Boss(this);
        this.gameObjectManager.setBoss(boss);
        this.eventEmitter.emit('bossSpawned');
        this.showMessage("ボスが出現しました！", 3000, 'important');
    }

    /**
     * 衝突判定をCollisionSystemに委譲
     */
    public checkCollisions(): void {
        this.collisionSystem.checkAllCollisions(this.player);
    }

    private draw(): void {
        this.gameRenderer.render(this.player, this.gameObjectManager);
    }

    private spawnEnemy = (): void => {
        if (this.stateManager.isPlaying() && !this.gameObjectManager.getBoss()) {
            const enemyTypes = Object.keys(GAME_CONSTANTS.ENEMY.TYPES) as EnemyType[];
            const randomType = enemyTypes[Math.floor(this.randomProvider.random() * enemyTypes.length)];
            const enemy = this.gameObjectFactory.createEnemy(randomType, this);
            this.gameObjectManager.addEnemy(enemy);

            if (this.randomProvider.random() < GAME_CONSTANTS.POWERUP.SPAWN_CHANCE) {
                const powerup = this.gameObjectFactory.createPowerUp();
                this.gameObjectManager.addPowerUp(powerup);
            }
        }
    }

    public gameOver(): void {
        this.stateManager.setState('GAME_OVER', this);
    }

    private restartGame = (): void => {
        this.resetGame();
        this.stateManager.setState('PLAYING', this);
    }

    public resetGame(): void {
        this.player = new Player(this.eventEmitter, this.inputManager, this.randomProvider);
        this.player.setGame(this);
        this.gameObjectManager.reset();
        this.level = 1;
        this.bossSpawnScore = 1000;
        this.scoreManager = new ScoreManager(this.eventEmitter);
        this.difficultyFactor = 0;
        this.currentBossHealth = GAME_CONSTANTS.BOSS.INITIAL_HEALTH;
    }

    private handleBossDefeat(): void {
        this.scoreManager.addScore(500);

        this.showMessage(`レベル ${this.level} クリア！次のレベルが始まります。`, 3000, 'important');

        this.level++;
        this.eventEmitter.emit('levelUpdated', this.level);

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

        this.currentBossHealth = GAME_CONSTANTS.BOSS.INITIAL_HEALTH + (this.level - 1) * 10;

        this.bossSpawnScore = this.scoreManager.getScore() + 1000;

        this.eventEmitter.emit('levelStarted', this.level);
        this.showMessage(`レベル ${this.level} 開始！`, 3000, 'important');
    }

    public showMessage(text: string, duration?: number, priority?: 'critical' | 'important' | 'info' | 'minimal'): void {
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
    public createBullet(x: number, y: number, speed?: number, color?: string): Bullet | null {
        return this.gameObjectManager.createBullet(x, y, speed, color);
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
        if (GAME_CONSTANTS.WAVE.SYSTEM_ENABLED && this.waveManager) {
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
     * 背景レンダリングパフォーマンス統計を取得
     */
    public getBackgroundPerformanceStats() {
        return this.gameRenderer.getBackgroundPerformanceStats();
    }

    /**
     * 背景レンダリングパフォーマンス情報をコンソールに出力
     */
    public logBackgroundPerformance(): void {
        this.gameRenderer.logBackgroundPerformance();
    }

    /**
     * リソースクリーンアップ
     */
    public dispose(): void {
        if (this.gameRenderer) {
            this.gameRenderer.dispose();
        }
    }
}
