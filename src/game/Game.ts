import { GameObjectFactory } from "../factories/GameObjectFactory";
import { Updateable } from "../interfaces/Updateable";
import { UIManager } from "../managers/UIManager";
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
import { EventEmitter, GameEventMap } from "../utils/EventEmitter";
import { GameState, GameStateManager } from "./GameStateManager";
import { ScoreManager } from "./ScoreManager";

export class Game extends EventEmitter<GameEventMap> {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private player: Player;
    private bullets: Bullet[] = [];
    private enemies: Enemy[] = [];
    private stars: Star[] = [];
    private explosions: Explosion[] = [];
    private planets: Planet[] = [];
    private nebulas: Nebula[] = [];
    private powerups: PowerUp[] = [];
    private boss: Boss | null = null;
    private bossBullets: BossBullet[] = [];
    private level = 1;
    private bossSpawnScore: number = 1000;
    private currentScore: number = 0;
    private lastTime = 0;
    private deltaTime = 0;
    private stateManager: GameStateManager = new GameStateManager();
    private scoreManager: ScoreManager = new ScoreManager();
    private uiManager: UIManager = new UIManager();
    private difficultyFactor: number = 0;
    private currentBossHealth: number = GAME_CONSTANTS.BOSS.INITIAL_HEALTH;


    constructor() {
        super()
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.canvas.width = GAME_CONSTANTS.CANVAS.WIDTH;
        this.canvas.height = GAME_CONSTANTS.CANVAS.HEIGHT;

        this.player = new Player(this);
        this.initializeGameObjects();
        this.setupEventListeners();
        this.scoreManager.attach(this.uiManager);
        this.stateManager.setState(GameState.PLAYING);
    }



    private initializeGameObjects(): void {
        this.stars = Array.from({ length: GAME_CONSTANTS.BACKGROUND.STAR_COUNT }, () => new Star());
        this.planets = Array.from({ length: GAME_CONSTANTS.BACKGROUND.PLANET_COUNT }, () => new Planet());
        this.nebulas = Array.from({ length: GAME_CONSTANTS.BACKGROUND.NEBULA_COUNT }, () => new Nebula());
    }

    private setupEventListeners(): void {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.addEventListener('click', this.restartGame);
        }
        this.on('enemyDestroyed', this.handleEnemyDestroyed);
        this.on('playerDamaged', this.handlePlayerDamaged);
        this.on('bossDamaged', this.handleBossDamaged);
        this.on('bossDefeated', this.handleBossDefeated);
        this.on('powerUpCollected', this.handlePowerUpCollected);
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

    private handlePlayerDamaged = (damage: number): void => {
        this.player.takeDamage(damage);
        if (this.player.getHealth() <= 0) {
            this.gameOver();
        }
    }

    private handleBossDamaged = (): void => {
        if (this.boss && this.boss.takeDamage()) {
            this.emit('bossDefeated');
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
        this.uiManager.updateHealthDisplay(this.player.getHealth());
        this.uiManager.updateLevelDisplay(this.level);
    }

    private updateGameObjects(): void {
        const updateables: Updateable[] = [
            ...this.bullets,
            ...this.enemies,
            ...this.powerups,
            ...this.explosions,
            ...this.stars,
            ...this.planets,
            ...this.bossBullets
        ];

        if (this.boss) {
            updateables.push(this.boss);
        }

        updateables.forEach(obj => obj.update(this.deltaTime));

        this.currentScore = this.scoreManager.getScore();
        if (this.currentScore >= this.bossSpawnScore && !this.boss) {
            this.spawnBoss();
        }
    }

    private spawnBoss(): void {
        this.boss = new Boss(this);
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
                        this.emit('enemyDestroyed', this.enemies[j])
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
                this.emit('playerDamaged', 20);
                this.emit('enemyDestroyed', this.enemies[i]);
                this.enemies.splice(i, 1);
            }
        }
    }

    private checkPlayerPowerupCollisions(): void {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            if (this.checkCollision(this.player, this.powerups[i])) {
                this.emit('powerUpCollected', this.powerups[i]);
                this.powerups.splice(i, 1);
            }
        }
    }

    private checkBossBattleCollisions(): void {
        if (this.boss && this.checkCollision(this.player, this.boss)) {
            this.emit('playerDamaged', 20);
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            if (this.boss && this.checkCollision(this.bullets[i], this.boss)) {
                this.bullets.splice(i, 1);
                this.emit('bossDamaged');
            }
        }

        for (let i = this.bossBullets.length - 1; i >= 0; i--) {
            if (this.checkCollision(this.player, this.bossBullets[i])) {
                this.emit('playerDamaged', 20);
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
        // Create a gradient for the background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, GAME_CONSTANTS.CANVAS.HEIGHT);
        gradient.addColorStop(0, '#000033');
        gradient.addColorStop(1, '#000066');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, GAME_CONSTANTS.CANVAS.WIDTH, GAME_CONSTANTS.CANVAS.HEIGHT);

        this.nebulas.forEach(nebula => nebula.draw(this.ctx));
        this.planets.forEach(planet => planet.draw(this.ctx));
        this.stars.forEach(star => star.draw(this.ctx));

        // 星座の線を描画
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(50, 50);
        this.ctx.lineTo(100, 100);
        this.ctx.lineTo(150, 75);
        this.ctx.lineTo(200, 150);
        this.ctx.stroke();
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
            this.enemies.push(GameObjectFactory.createEnemy(randomType, this));  // thisを追加

            if (Math.random() < GAME_CONSTANTS.POWERUP.SPAWN_CHANCE) {
                this.powerups.push(GameObjectFactory.createPowerUp());
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
        this.player = new Player(this);
        this.bullets = [];
        this.enemies = [];
        this.powerups = [];
        this.explosions = [];
        this.boss = null;
        this.bossBullets = [];
        this.level = 1;
        this.bossSpawnScore = 1000;
        this.scoreManager = new ScoreManager();
        this.scoreManager.attach(this.uiManager);
        this.stateManager.setState(GameState.PLAYING);
    }

    private handleBossDefeat(): void {
        this.scoreManager.addScore(500);

        this.showMessage(`レベル ${this.level} クリア！次のレベルが始まります。`);

        this.level++;
        this.uiManager.updateLevelDisplay(this.level);

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

    public addBullet(bullet: Bullet): void {
        this.bullets.push(bullet);
    }

    public addBossBullet(bullet: BossBullet): void {
        this.bossBullets.push(bullet);
    }

    public pauseGame(): void {
        this.stateManager.setState(GameState.PAUSED);
    }

    public resumeGame(): void {
        this.stateManager.setState(GameState.PLAYING);
    }

    public getDifficultyFactor(): number {
        return this.difficultyFactor;
    }

    public getCurrentBossHealth(): number {
        return this.currentBossHealth;
    }
}
