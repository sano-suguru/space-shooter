import { GameObject } from '../entities/GameObject';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { Explosion } from '../entities/Explosion';
import { PowerUp } from '../entities/PowerUp';
import { BossBullet } from '../entities/BossBullet';
import { Boss } from '../entities/Boss';
import { Star } from '../entities/Star';
import { Planet } from '../entities/Planet';
import { Nebula } from '../entities/Nebula';
import { Aurora } from '../entities/Aurora';
import { EventEmitter } from '../events/EventEmitter';
import { EventMap } from '../events/EventType';
import { ObjectPool, PoolManager } from '../utils/ObjectPool';

/**
 * ゲームオブジェクトの管理を担当するクラス
 * オブジェクトプールとの統合、ライフサイクル管理、配列操作を一元化
 */
export class GameObjectManager {
    // ゲームオブジェクト配列
    private bullets: Bullet[] = [];
    private enemies: Enemy[] = [];
    private explosions: Explosion[] = [];
    private powerups: PowerUp[] = [];
    private bossBullets: BossBullet[] = [];
    private boss: Boss | null = null;
    private player: any = null;

    // 背景オブジェクト配列
    private stars: Star[] = [];
    private planets: Planet[] = [];
    private nebulas: Nebula[] = [];
    private auroras: Aurora[] = [];

    // オブジェクトプール管理
    private poolManager: PoolManager;

    constructor(
        private eventEmitter: EventEmitter<EventMap>
    ) {
        this.poolManager = new PoolManager();
        this.initializeObjectPools();
        this.setupEventListeners();
    }

    private initializeObjectPools(): void {
        // Bulletプール
        const bulletPool = new ObjectPool<Bullet>(
            () => new Bullet(),
            (bullet) => bullet.reset(),
            20, // 初期サイズ
            50  // 最大サイズ
        );
        this.poolManager.register('bullet', bulletPool);

        // Explosionプール
        const explosionPool = new ObjectPool<Explosion>(
            () => new Explosion(),
            (explosion) => explosion.reset(),
            10, // 初期サイズ
            30  // 最大サイズ
        );
        this.poolManager.register('explosion', explosionPool);
    }

    private setupEventListeners(): void {
        this.eventEmitter.on('enemyDestroyed', this.handleEnemyDestroyed);
        this.eventEmitter.on('playerShot', this.handlePlayerShot);
        this.eventEmitter.on('createExplosion', this.createExplosion);
        this.eventEmitter.on('cleanupOffscreenObjects', this.removeOffscreenObjects);
    }

    private handleEnemyDestroyed = (enemy: Enemy): void => {
        const enemyPosition = enemy.getPosition();
        const explosionPosition = {
            x: enemyPosition.x + enemy.getWidth() / 2,
            y: enemyPosition.y + enemy.getHeight() / 2
        };
        this.createExplosion(explosionPosition.x, explosionPosition.y);
    };

    private handlePlayerShot = (bullet: Bullet): void => {
        this.bullets.push(bullet);
    };

    /**
     * 全ゲームオブジェクトを更新
     */
    public updateAllObjects(deltaTime: number): void {
        // 動的オブジェクトの更新
        this.bullets.forEach(bullet => bullet.update(deltaTime));
        this.enemies.forEach(enemy => enemy.update(deltaTime));
        this.powerups.forEach(powerup => powerup.update(deltaTime));
        this.explosions.forEach(explosion => explosion.update(deltaTime));
        this.bossBullets.forEach(bossBullet => bossBullet.update(deltaTime));

        if (this.boss) {
            this.boss.update(deltaTime);
        }

        // 背景オブジェクトの更新
        this.stars.forEach(star => star.update(deltaTime));
        this.planets.forEach(planet => planet.update(deltaTime));
        this.auroras.forEach(aurora => aurora.update(deltaTime));
    }

    /**
     * 画面外のオブジェクトを削除
     */
    public removeOffscreenObjects = (): void => {
        // 弾丸をプールに戻す
        const bulletPool = this.poolManager.getPool<Bullet>('bullet');
        this.bullets = this.bullets.filter(bullet => {
            if (!bullet.isOnScreen() || !bullet.isActive()) {
                if (bulletPool) {
                    bulletPool.release(bullet);
                }
                return false;
            }
            return true;
        });

        // 爆発エフェクトをプールに戻す
        const explosionPool = this.poolManager.getPool<Explosion>('explosion');
        this.explosions = this.explosions.filter(explosion => {
            if (explosion.isFinished()) {
                if (explosionPool) {
                    explosionPool.release(explosion);
                }
                return false;
            }
            return true;
        });

        // その他のオブジェクト（プール未対応）
        this.enemies = this.enemies.filter(enemy => enemy.isOnScreen());
        this.powerups = this.powerups.filter(powerup => powerup.isOnScreen());
        this.bossBullets = this.bossBullets.filter(bullet => bullet.isOnScreen());
    };

    /**
     * 爆発エフェクトを作成
     */
    public createExplosion = (x: number, y: number, scale?: number): void => {
        const explosionPool = this.poolManager.getPool<Explosion>('explosion');
        if (explosionPool) {
            const explosion = explosionPool.get();
            explosion.initialize({ x, y }, scale);
            this.explosions.push(explosion);
        }
    };

    /**
     * プール付きBulletを作成
     */
    public createBullet(x: number, y: number, speed?: number, color?: string): Bullet | null {
        const bulletPool = this.poolManager.getPool<Bullet>('bullet');
        if (bulletPool) {
            const bullet = bulletPool.get();
            bullet.initialize(x, y, speed, color);
            this.bullets.push(bullet); // 弾丸を配列に自動追加
            return bullet;
        }
        return null;
    }

    /**
     * 背景オブジェクトを設定
     */
    public setBackgroundObjects(
        stars: Star[],
        planets: Planet[],
        nebulas: Nebula[],
        auroras: Aurora[]
    ): void {
        this.stars = stars;
        this.planets = planets;
        this.nebulas = nebulas;
        this.auroras = auroras;
    }

    /**
     * ゲームをリセット
     */
    public reset(): void {
        // プールオブジェクトを適切に返却
        const bulletPool = this.poolManager.getPool<Bullet>('bullet');
        const explosionPool = this.poolManager.getPool<Explosion>('explosion');

        this.bullets.forEach(bullet => {
            if (bulletPool) bulletPool.release(bullet);
        });
        this.explosions.forEach(explosion => {
            if (explosionPool) explosionPool.release(explosion);
        });

        // 配列をクリア
        this.bullets = [];
        this.enemies = [];
        this.explosions = [];
        this.powerups = [];
        this.bossBullets = [];
        this.boss = null;
    }

    // ========================================
    // Getter/Setter メソッド
    // ========================================

    public getBullets(): Bullet[] {
        return this.bullets;
    }

    public getEnemies(): Enemy[] {
        return this.enemies;
    }

    public getExplosions(): Explosion[] {
        return this.explosions;
    }

    public getPowerups(): PowerUp[] {
        return this.powerups;
    }

    public getBossBullets(): BossBullet[] {
        return this.bossBullets;
    }

    public getBoss(): Boss | null {
        return this.boss;
    }

    public setBoss(boss: Boss | null): void {
        this.boss = boss;
    }

    public getStars(): Star[] {
        return this.stars;
    }

    public getPlanets(): Planet[] {
        return this.planets;
    }

    public getNebulas(): Nebula[] {
        return this.nebulas;
    }

    public getAuroras(): Aurora[] {
        return this.auroras;
    }

    public addEnemy(enemy: Enemy): void {
        this.enemies.push(enemy);
    }

    public removeEnemy(enemy: Enemy): void {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
    }

    public addPowerUp(powerup: PowerUp): void {
        this.powerups.push(powerup);
    }

    public removePowerUp(powerup: PowerUp): void {
        const index = this.powerups.indexOf(powerup);
        if (index > -1) {
            this.powerups.splice(index, 1);
        }
    }

    public addBossBullet(bullet: BossBullet): void {
        this.bossBullets.push(bullet);
    }

    /**
     * プレイヤーを設定（テスト用）
     */
    public setPlayer(player: any): void {
        this.player = player;
    }

    /**
     * プレイヤーを取得（テスト用）
     */
    public getPlayer(): any {
        return this.player;
    }

    /**
     * 弾丸をゲームに追加（テスト用）
     */
    public addBullet(bullet: Bullet): void {
        this.bullets.push(bullet);
    }

    /**
     * 弾丸をゲームから削除（テスト用）
     */
    public removeBullet(bullet: Bullet): void {
        const index = this.bullets.indexOf(bullet);
        if (index > -1) {
            this.bullets.splice(index, 1);
        }
    }

    /**
     * プールの統計情報を取得（デバッグ用）
     */
    public getPoolStats(): { [key: string]: number } {
        return this.poolManager.getStats();
    }

    /**
     * 衝突判定用の全オブジェクトを取得
     */
    public getAllCollidableObjects(): GameObject[] {
        const objects: GameObject[] = [
            ...this.bullets,
            ...this.enemies,
            ...this.powerups,
            ...this.bossBullets
        ];

        if (this.boss) {
            objects.push(this.boss);
        }

        return objects;
    }
}
