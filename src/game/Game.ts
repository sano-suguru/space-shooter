import { GameObjectFactory } from "../factories/GameObjectFactory";
import { Aurora } from "../objects/Aurora";
import { Boss } from "../objects/Boss";
import { BossBullet } from "../objects/BossBullet";
import { Bullet } from "../objects/Bullet";
import { Enemy } from "../objects/Enemy";
import { Explosion } from "../objects/Explosion";
import { GameObject } from "../objects/GameObject";
import { Nebula } from "../objects/Nebula";
import { Planet } from "../objects/Planet";
import { Player } from "../objects/Player";
import { PowerUp } from "../objects/PowerUp";
import { Star } from "../objects/Star";
import { EnemyType } from "../types";
import { GAME_CONSTANTS } from "../utils/Constants";
import { EventEmitter, EventMap } from "../utils/EventEmitter";
import { GameState, GameStateManager } from "./GameStateManager";
import { ScoreManager } from "./ScoreManager";

export class Game {
    private ctx: CanvasRenderingContext2D;
    private bullets: Bullet[] = [];
    private enemies: Enemy[] = [];
    private stars: Star[] = [];
    private explosions: Explosion[] = [];
    private planets: Planet[] = [];
    private nebulas: Nebula[] = [];
    private auroras: Aurora[] = [];
    private powerups: PowerUp[] = [];
    private boss: Boss | null = null;
    private bossBullets: BossBullet[] = [];
    private level = 1;
    private bossSpawnScore: number = 1000;
    private currentScore: number = 0;
    private lastTime = 0;
    private deltaTime = 0;
    private difficultyFactor: number = 0;
    private currentBossHealth: number = GAME_CONSTANTS.BOSS.INITIAL_HEALTH;


    constructor(
        private canvas: HTMLCanvasElement,
        private eventEmitter: EventEmitter<EventMap>,
        private scoreManager: ScoreManager,
        private player: Player,
        private gameObjectFactory: GameObjectFactory,
        private stateManager: GameStateManager,

    ) {
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.canvas.width = GAME_CONSTANTS.CANVAS.WIDTH;
        this.canvas.height = GAME_CONSTANTS.CANVAS.HEIGHT;
        this.initializeGameObjects();
        this.setupEventListeners();
        this.stateManager.setState(GameState.PLAYING);
    }

    private initializeGameObjects(): void {
        this.stars = Array.from({ length: GAME_CONSTANTS.BACKGROUND.STAR_COUNT }, () => this.gameObjectFactory.createStar());
        this.planets = Array.from({ length: GAME_CONSTANTS.BACKGROUND.PLANET_COUNT }, () => this.gameObjectFactory.createPlanet());
        this.nebulas = Array.from({ length: GAME_CONSTANTS.BACKGROUND.NEBULA_COUNT }, () => this.gameObjectFactory.createNebula());
        this.auroras = Array.from({ length: 2 }, () => this.gameObjectFactory.createAurora());
    }

    private setupEventListeners(): void {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.addEventListener('click', this.restartGame);
        }
        this.eventEmitter.on('enemyDestroyed', this.handleEnemyDestroyed);
        this.eventEmitter.on('playerShot', this.handlePlayerShot)
        this.eventEmitter.on('playerDamaged', this.handlePlayerDamaged);
        this.eventEmitter.on('bossDamaged', this.handleBossDamaged);
        this.eventEmitter.on('bossDefeated', this.handleBossDefeated);
        this.eventEmitter.on('powerUpCollected', this.handlePowerUpCollected);
    }

    private handleKeyDown = (e: KeyboardEvent): void => {
        this.player.setKeyState(e.key, true);
    }

    private handleKeyUp = (e: KeyboardEvent): void => {
        this.player.setKeyState(e.key, false);
    }

    private handleEnemyDestroyed = (enemy: Enemy): void => {
        const enemyPosition = enemy.getPosition();
        const explosionPosition = {
            x: enemyPosition.x + enemy.getWidth() / 2,
            y: enemyPosition.y + enemy.getHeight() / 2
        };
        this.explosions.push(new Explosion(explosionPosition));
        this.scoreManager.addScore(enemy.getScore());
    }

    private handlePlayerShot = (bullet: Bullet): void => {
        this.bullets.push(bullet);
    }

    private handlePlayerDamaged = (damage: number): void => {
        this.player.takeDamage(damage);
        if (this.player.getHealth() <= 0) {
            this.gameOver();
        }
    }

    private handleBossDamaged = (): void => {
        if (this.boss && this.boss.takeDamage()) {
            this.eventEmitter.emit('bossDefeated');
        }
    }

    private handleBossDefeated = (): void => {
        if (this.boss) {
            this.explosions.push(new Explosion(this.boss.getPosition()));
            this.boss = null;
            this.handleBossDefeat();
        }
    }

    private handlePowerUpCollected = (powerUp: PowerUp): void => {
        this.player.activatePowerup(powerUp.getType());
    }

    public start(): void {
        this.eventEmitter.emit('gameStarted');
        this.gameLoop(0);
        setInterval(this.spawnEnemy, GAME_CONSTANTS.ENEMY.SPAWN_INTERVAL);
    }

    private gameLoop = (currentTime: number): void => {
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (this.stateManager.isPlaying()) {
            this.update();
            this.draw();
        }

        requestAnimationFrame(this.gameLoop);
    }

    private update(): void {
        this.player.update(this.deltaTime);
        this.updateGameObjects();
        this.checkCollisions();
        this.removeOffscreenObjects();
        this.eventEmitter.emit('healthChanged', this.player.getHealth());
        this.eventEmitter.emit('levelUpdated', this.level);
        this.eventEmitter.emit('scoreUpdated', this.scoreManager.getScore());
    }

    private updateGameObjects(): void {
        this.bullets.forEach(bullet => bullet.update(this.deltaTime));
        this.enemies.forEach(enemy => enemy.update(this.deltaTime));
        this.powerups.forEach(powerup => powerup.update(this.deltaTime));
        this.explosions.forEach(explosion => explosion.update(this.deltaTime));
        this.stars.forEach(star => star.update(this.deltaTime));
        this.planets.forEach(planet => planet.update(this.deltaTime));
        this.auroras.forEach(aurora => aurora.update(this.deltaTime));
        this.bossBullets.forEach(bossBullet => bossBullet.update(this.deltaTime));

        if (this.boss) {
            this.boss.update(this.deltaTime);
        }

        this.currentScore = this.scoreManager.getScore();
        if (this.currentScore >= this.bossSpawnScore && !this.boss) {
            this.spawnBoss();
        }
    }

    private spawnBoss(): void {
        this.boss = new Boss(this);
        this.eventEmitter.emit('bossSpawned');
        this.showMessage("ボスが出現しました！");
    }

    private checkCollisions(): void {
        this.checkBulletEnemyCollisions();
        this.checkPlayerEnemyCollisions();
        this.checkPlayerPowerupCollisions();
        if (this.boss) {
            this.checkBossBattleCollisions();
        }
    }

    private checkBulletEnemyCollisions(): void {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                if (this.checkCollision(this.bullets[i], this.enemies[j])) {
                    this.bullets.splice(i, 1);
                    if (this.enemies[j].takeDamage()) {
                        this.eventEmitter.emit('enemyDestroyed', this.enemies[j])
                        this.enemies.splice(j, 1);
                    }
                    break;
                }
            }
        }
    }

    private checkPlayerEnemyCollisions(): void {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.checkCollision(this.player, this.enemies[i])) {
                this.eventEmitter.emit('playerDamaged', 20);
                this.eventEmitter.emit('enemyDestroyed', this.enemies[i]);
                this.enemies.splice(i, 1);
            }
        }
    }

    private checkPlayerPowerupCollisions(): void {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            if (this.checkCollision(this.player, this.powerups[i])) {
                this.eventEmitter.emit('powerUpCollected', this.powerups[i]);
                this.powerups.splice(i, 1);
            }
        }
    }

    private checkBossBattleCollisions(): void {
        if (this.boss && this.checkCollision(this.player, this.boss)) {
            this.eventEmitter.emit('playerDamaged', 20);
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            if (this.boss && this.checkCollision(this.bullets[i], this.boss)) {
                this.bullets.splice(i, 1);
                this.eventEmitter.emit('bossDamaged');
            }
        }

        for (let i = this.bossBullets.length - 1; i >= 0; i--) {
            if (this.checkCollision(this.player, this.bossBullets[i])) {
                this.eventEmitter.emit('playerDamaged', 20);
                this.bossBullets.splice(i, 1);
            }
        }
    }

    private removeOffscreenObjects(): void {
        this.bullets = this.bullets.filter(bullet => bullet.isOnScreen());
        this.enemies = this.enemies.filter(enemy => enemy.isOnScreen());
        this.powerups = this.powerups.filter(powerup => powerup.isOnScreen());
        this.explosions = this.explosions.filter(explosion => !explosion.isFinished());
        this.bossBullets = this.bossBullets.filter(bullet => bullet.isOnScreen());
    }

    private drawBackground(): void {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, GAME_CONSTANTS.CANVAS.HEIGHT);
        gradient.addColorStop(0, 'rgba(10, 10, 35, 1)');
        gradient.addColorStop(0.5, 'rgba(20, 20, 50, 1)');
        gradient.addColorStop(1, 'rgba(30, 30, 70, 1)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, GAME_CONSTANTS.CANVAS.WIDTH, GAME_CONSTANTS.CANVAS.HEIGHT);

        this.nebulas.forEach(nebula => nebula.draw(this.ctx));
        this.planets.forEach(planet => planet.draw(this.ctx));
        this.stars.forEach(star => star.draw(this.ctx));
        this.auroras.forEach(aurora => aurora.draw(this.ctx));
    }

    private draw(): void {
        this.drawBackground();
        this.player.draw(this.ctx);
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.powerups.forEach(powerup => powerup.draw(this.ctx));
        this.explosions.forEach(explosion => explosion.draw(this.ctx));
        if (this.boss) {
            this.boss.draw(this.ctx);
            this.bossBullets.forEach(bullet => bullet.draw(this.ctx));
        }
    }

    private spawnEnemy = (): void => {
        if (this.stateManager.isPlaying() && !this.boss) {
            const enemyTypes = Object.keys(GAME_CONSTANTS.ENEMY.TYPES) as EnemyType[];
            const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            this.enemies.push(this.gameObjectFactory.createEnemy(randomType, this));  // thisを追加

            if (Math.random() < GAME_CONSTANTS.POWERUP.SPAWN_CHANCE) {
                this.powerups.push(this.gameObjectFactory.createPowerUp());
            }
        }
    }

    private checkCollision(obj1: GameObject, obj2: GameObject): boolean {
        return obj1.getX() < obj2.getX() + obj2.getWidth() &&
            obj1.getX() + obj1.getWidth() > obj2.getX() &&
            obj1.getY() < obj2.getY() + obj2.getHeight() &&
            obj1.getY() + obj1.getHeight() > obj2.getY();
    }

    public gameOver(): void {
        this.stateManager.setState(GameState.GAME_OVER);
        this.eventEmitter.emit('gameOver');
        const gameOverElement = document.getElementById('gameOver');
        if (gameOverElement) {
            gameOverElement.classList.remove('hidden');
        }
        const finalScoreElement = document.getElementById('finalScore');
        if (finalScoreElement) {
            finalScoreElement.textContent = this.scoreManager.getScore().toString();
        }
    }

    private restartGame = (): void => {
        const gameOverElement = document.getElementById('gameOver');
        if (gameOverElement) {
            gameOverElement.classList.add('hidden');
        }
        this.resetGame();
        this.start();
    }

    private resetGame(): void {
        this.player = new Player(this.eventEmitter);
        this.bullets = [];
        this.enemies = [];
        this.powerups = [];
        this.explosions = [];
        this.boss = null;
        this.bossBullets = [];
        this.level = 1;
        this.bossSpawnScore = 1000;
        this.scoreManager = new ScoreManager(this.eventEmitter);
        this.stateManager.setState(GameState.PLAYING);
    }

    private handleBossDefeat(): void {
        this.scoreManager.addScore(500);

        this.showMessage(`レベル ${this.level} クリア！次のレベルが始まります。`);

        this.level++;
        this.eventEmitter.emit('levelUpdated', this.level);

        setTimeout(() => {
            this.startNextLevel();
        }, 3000);
        this.bossSpawnScore = this.currentScore + 1000;
    }

    private startNextLevel(): void {
        this.enemies = [];
        this.bossBullets = [];
        this.powerups = [];

        this.difficultyFactor = this.level * 0.1;

        this.currentBossHealth = GAME_CONSTANTS.BOSS.INITIAL_HEALTH + (this.level - 1) * 10;

        this.bossSpawnScore = this.scoreManager.getScore() + 1000;

        this.eventEmitter.emit('levelStarted', this.level);
        this.showMessage(`レベル ${this.level} 開始！`);
    }

    private showMessage(text: string): void {
        const messageElement = document.createElement('div');
        messageElement.textContent = text;
        messageElement.style.position = 'absolute';
        messageElement.style.top = '50%';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translate(-50%, -50%)';
        messageElement.style.color = 'white';
        messageElement.style.fontSize = '24px';
        messageElement.style.textAlign = 'center';
        document.body.appendChild(messageElement);

        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, 3000);
    }

    public addBossBullet(bullet: BossBullet): void {
        this.bossBullets.push(bullet);
    }

    public pauseGame(): void {
        this.stateManager.setState(GameState.PAUSED);
        this.eventEmitter.emit('gamePaused');
    }

    public resumeGame(): void {
        this.stateManager.setState(GameState.PLAYING);
        this.eventEmitter.emit('gameResumed');
    }

    public getDifficultyFactor(): number {
        return this.difficultyFactor;
    }

    public getCurrentBossHealth(): number {
        return this.currentBossHealth;
    }
}
