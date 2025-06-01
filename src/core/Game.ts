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
import { IGameEngine } from '../interfaces/IGameEngine';
import { GameEngine } from './GameEngine';
import { BackgroundRenderer } from '../rendering/BackgroundRenderer';
import { IInputManager } from '../interfaces/IInputManager';
import { IRandomProvider } from '../providers/IRandomProvider';
import { IDOMManager } from '../interfaces/IDOMManager';
import { IMessageManager } from '../interfaces/IMessageManager';
import { ITimeProvider } from '../providers/ITimeProvider';

export class Game implements IGameEngine {
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

    // 背景レンダリング最適化フラグ
    private useOptimizedBackground = true;

    constructor(
        private canvas: HTMLCanvasElement,
        private eventEmitter: EventEmitter<EventMap>,
        private scoreManager: ScoreManager,
        private player: Player,
        private gameObjectFactory: GameObjectFactory,
        private stateManager: GameStateManager,
        private inputManager: IInputManager,
        private randomProvider: IRandomProvider,
        private _domManager: IDOMManager, // TODO: Phase 4 - DOM操作抽象化で使用予定
        private messageManager: IMessageManager,
        private _timeProvider: ITimeProvider
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

        // GameEngineを初期化
        this.gameEngine = new GameEngine(
            (deltaTime: number) => this.updateWithDeltaTime(deltaTime),
            () => this.draw()
        );

        this.stateManager.setState('STARTING', this);

        // Phase 4 テスタビリティ改善: 将来のDOM操作抽象化のために保持
        void this._domManager;    }

    private initializeGameObjects(): void {
        // GameObjectManagerを初期化
        this.gameObjectManager = new GameObjectManager(this.eventEmitter);

        // 背景オブジェクトを作成してGameObjectManagerに設定
        const stars = Array.from({ length: GAME_CONSTANTS.BACKGROUND.STAR_COUNT }, () => this.gameObjectFactory.createStar());
        const planets = Array.from({ length: GAME_CONSTANTS.BACKGROUND.PLANET_COUNT }, () => this.gameObjectFactory.createPlanet());
        const nebulas = Array.from({ length: GAME_CONSTANTS.BACKGROUND.NEBULA_COUNT }, () => this.gameObjectFactory.createNebula());
        const auroras = Array.from({ length: 2 }, () => this.gameObjectFactory.createAurora());

        this.gameObjectManager.setBackgroundObjects(stars, planets, nebulas, auroras);
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
        this._timeProvider.setInterval(this.spawnEnemy, GAME_CONSTANTS.ENEMY.SPAWN_INTERVAL);
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
        this.showMessage("ボスが出現しました！");
    }

    /**
     * 衝突判定をCollisionSystemに委譲
     */
    public checkCollisions(): void {
        this.collisionSystem.checkAllCollisions(this.player);
    }

    /**
     * 最適化された背景描画
     */
    private drawBackground(): void {
        const stars = this.gameObjectManager.getStars();
        const planets = this.gameObjectManager.getPlanets();
        const nebulas = this.gameObjectManager.getNebulas();
        const auroras = this.gameObjectManager.getAuroras();

        if (this.useOptimizedBackground) {
            // 最適化された背景描画を使用
            this.backgroundRenderer.drawOptimizedBackground(
                this.ctx,
                stars,
                planets,
                nebulas,
                auroras
            );
        } else {
            // 従来の背景描画を使用（比較・デバッグ用）
            this.backgroundRenderer.drawTraditionalBackground(
                this.ctx,
                stars,
                planets,
                nebulas,
                auroras
            );
        }
    }

    private draw(): void {
        this.drawBackground();
        this.player.draw(this.ctx);

        // GameObjectManagerから各オブジェクトを取得して描画
        this.gameObjectManager.getBullets().forEach(bullet => bullet.draw(this.ctx));
        this.gameObjectManager.getEnemies().forEach(enemy => enemy.draw(this.ctx));
        this.gameObjectManager.getPowerups().forEach(powerup => powerup.draw(this.ctx));
        this.gameObjectManager.getExplosions().forEach(explosion => explosion.draw(this.ctx));

        const boss = this.gameObjectManager.getBoss();
        if (boss) {
            boss.draw(this.ctx);
            this.gameObjectManager.getBossBullets().forEach(bullet => bullet.draw(this.ctx));
        }
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

        this.showMessage(`レベル ${this.level} クリア！次のレベルが始まります。`);

        this.level++;
        this.eventEmitter.emit('levelUpdated', this.level);

        this._timeProvider.setTimeout(() => {
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
        this.showMessage(`レベル ${this.level} 開始！`);
    }

    public showMessage(text: string): void {
        this.messageManager.showMessage(text);
    }

    public showMessageOld(text: string): void {
        const messageElement = document.createElement('div');
        messageElement.textContent = text;

        // 基本的な位置設定
        messageElement.style.position = 'absolute';
        messageElement.style.top = '50%';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translate(-50%, -50%)';
        messageElement.style.textAlign = 'center';
        messageElement.style.zIndex = '1000';

        // フォントスタイリング
        messageElement.style.color = '#ffffff';
        messageElement.style.fontSize = '32px';
        messageElement.style.fontWeight = 'bold';
        messageElement.style.fontFamily = 'Arial, sans-serif';

        // テキストエフェクト（視認性向上）
        messageElement.style.textShadow = `
            0 0 10px #00ffff,
            0 0 20px #00ffff,
            0 0 30px #00ffff,
            2px 2px 4px rgba(0, 0, 0, 0.8)
        `;

        // 背景スタイリング
        messageElement.style.backgroundColor = 'rgba(0, 20, 40, 0.9)';
        messageElement.style.padding = '20px 40px';
        messageElement.style.borderRadius = '15px';
        messageElement.style.border = '2px solid #00ffff';
        messageElement.style.boxShadow = `
            0 0 20px rgba(0, 255, 255, 0.5),
            inset 0 0 20px rgba(0, 255, 255, 0.1)
        `;

        // アニメーション設定
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translate(-50%, -50%) scale(0.5)';
        messageElement.style.transition = 'all 0.3s ease-out';

        document.body.appendChild(messageElement);

        // フェードイン効果
        requestAnimationFrame(() => {
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        // フェードアウトして削除
        this._timeProvider.setTimeout(() => {
            messageElement.style.transition = 'all 0.5s ease-in';
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translate(-50%, -50%) scale(0.8)';

            this._timeProvider.setTimeout(() => {
                if (document.body.contains(messageElement)) {
                    document.body.removeChild(messageElement);
                }
            }, 500);
        }, 2500);
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
        this.useOptimizedBackground = !this.useOptimizedBackground;
        console.log(`Background optimization: ${this.useOptimizedBackground ? 'ON' : 'OFF'}`);
    }

    /**
     * 背景レンダリングパフォーマンス統計を取得
     */
    public getBackgroundPerformanceStats() {
        return this.backgroundRenderer.getPerformanceStats();
    }

    /**
     * 背景レンダリングパフォーマンス情報をコンソールに出力
     */
    public logBackgroundPerformance(): void {
        this.backgroundRenderer.logPerformanceInfo();
    }

    /**
     * リソースクリーンアップ
     */
    public dispose(): void {
        if (this.backgroundRenderer) {
            this.backgroundRenderer.dispose();
        }
    }
}
