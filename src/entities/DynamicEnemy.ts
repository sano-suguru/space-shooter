import { Enemy } from "./Enemy";
import { DynamicEnemyConfig, AppearanceConfig, BehaviorConfig, AttackAbility } from "../systems/types/EnemyGeneration";
import { AppearanceComponent } from "../systems/enemy-generation/components/AppearanceComponent";
import { BehaviorComponent } from "../systems/enemy-generation/components/BehaviorComponent";
import { AttackAbilityComponent } from "../systems/enemy-generation/components/AttackAbilityComponent";
import { IGameEngine } from "../interfaces/IGameEngine";
import { Vector2D } from "../types";
import { RealRandomProvider } from "../providers/RealRandomProvider";

export class DynamicEnemy extends Enemy {
    private dynamicConfig: DynamicEnemyConfig;
    private appearanceComponent: AppearanceComponent;
    private behaviorComponent: BehaviorComponent;
    private attackComponent: AttackAbilityComponent;
    private lastAttackTime: number = 0;
    private dynamicAnimationPhase: number = 0;
    private flockCenter?: Vector2D;
    private nearbyEnemies: Vector2D[] = [];

    constructor(config: DynamicEnemyConfig, game?: IGameEngine) {
        // 基本的なEnemyクラスの初期化
        super(config.position.x, config.position.y, config.baseType, game);
        
        this.dynamicConfig = config;
        
        // コンポーネントの初期化
        const randomProvider = new RealRandomProvider();
        this.appearanceComponent = new AppearanceComponent(randomProvider);
        this.behaviorComponent = new BehaviorComponent(randomProvider);
        this.attackComponent = new AttackAbilityComponent(randomProvider);
        
        // 動的設定を適用
        this.applyDynamicConfiguration();
    }

    /**
     * 動的設定を適用
     */
    private applyDynamicConfiguration(): void {
        // 能力値を上書き
        this.setHealth(this.dynamicConfig.stats.health);
        this.setSpeed(this.dynamicConfig.stats.speed);
        
        // サイズを調整
        this.width *= this.dynamicConfig.appearance.size;
        this.height *= this.dynamicConfig.appearance.size;
    }

    /**
     * 更新処理をオーバーライド
     */
    public update(deltaTime: number): void {
        this.dynamicAnimationPhase += deltaTime * this.dynamicConfig.appearance.animationSpeed;

        // プレイヤー位置を取得（ゲームエンジンから）
        const playerPos = this.getPlayerPosition();
        
        // 動的行動パターンで位置を更新
        const newPos = this.behaviorComponent.updatePosition(
            { x: this.x, y: this.y },
            this.dynamicConfig.behavior,
            deltaTime,
            this.dynamicConfig.stats.speed,
            this.dynamicAnimationPhase,
            playerPos,
            this.flockCenter,
            this.nearbyEnemies
        );

        this.x = newPos.x;
        this.y = newPos.y;

        // 攻撃判定
        if (playerPos && this.behaviorComponent.shouldAttack(
            { x: this.x, y: this.y },
            this.dynamicConfig.behavior,
            playerPos,
            this.lastAttackTime,
            this.dynamicConfig.stats.fireRate
        )) {
            this.performDynamicAttack(playerPos);
        }
    }

    /**
     * 描画処理をオーバーライド
     */
    public draw(ctx: CanvasRenderingContext2D): void {
        this.appearanceComponent.drawEnemy(
            ctx,
            this.dynamicConfig.appearance,
            this.x,
            this.y,
            this.width,
            this.height,
            this.dynamicAnimationPhase
        );

        // エリート敵の場合は追加エフェクト
        if (this.dynamicConfig.isElite) {
            this.drawEliteEffects(ctx);
        }

        // デバッグ情報の表示（開発時のみ）
        // process.envの代わりに簡単な条件を使用
        if (typeof window !== 'undefined' && (window as any).DEBUG_MODE) {
            this.drawDebugInfo(ctx);
        }
    }

    /**
     * 動的攻撃を実行
     */
    private performDynamicAttack(playerPos: Vector2D): void {
        const directions = this.attackComponent.calculateBulletDirections(
            this.dynamicConfig.attack,
            { x: this.x, y: this.y },
            playerPos
        );

        // 各方向に弾丸を発射
        directions.forEach(({ angle, speed }) => {
            const bulletX = this.x + this.width / 2 + Math.cos(angle) * 20;
            const bulletY = this.y + this.height / 2 + Math.sin(angle) * 20;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;

            // ゲームエンジンに弾丸を追加
            this.addBulletToGame(bulletX, bulletY, velocityX, velocityY);
        });

        this.lastAttackTime = Date.now();
    }

    /**
     * エリートエフェクトを描画
     */
    private drawEliteEffects(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // 回転するオーラ
        const auraRadius = Math.max(this.width, this.height) * 0.8;
        const auraIntensity = Math.sin(this.dynamicAnimationPhase * 2) * 0.3 + 0.7;
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, auraRadius);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${auraIntensity * 0.1})`);
        gradient.addColorStop(0.7, `rgba(255, 215, 0, ${auraIntensity * 0.3})`);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        // 回転する光線
        ctx.strokeStyle = `rgba(255, 255, 255, ${auraIntensity * 0.8})`;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + this.dynamicAnimationPhase * 0.5;
            const innerRadius = auraRadius * 0.6;
            const outerRadius = auraRadius * 1.2;
            
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
            ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * デバッグ情報を描画
     */
    private drawDebugInfo(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '10px Arial';
        
        const info = [
            `Type: ${this.dynamicConfig.baseType}${this.dynamicConfig.isElite ? ' (Elite)' : ''}`,
            `HP: ${this.getHealth()}/${this.dynamicConfig.stats.health}`,
            `Behavior: ${this.dynamicConfig.behavior.pattern}`,
            `Attack: ${this.dynamicConfig.attack.bulletType}`
        ];

        info.forEach((text, index) => {
            ctx.fillText(text, this.x, this.y - 20 + (index * 12));
        });

        // 群れ情報
        if (this.dynamicConfig.flockId) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.fillText(`Flock: ${this.dynamicConfig.flockId.slice(-8)}`, this.x, this.y + this.height + 15);
        }

        ctx.restore();
    }

    /**
     * プレイヤー位置を取得（ゲームエンジンから）
     */
    private getPlayerPosition(): Vector2D | undefined {
        // 実際の実装では、ゲームエンジンからプレイヤー位置を取得
        // ここでは簡略化
        return undefined;
    }

    /**
     * 弾丸をゲームに追加（ゲームエンジン経由）
     */
    private addBulletToGame(x: number, y: number, velocityX: number, velocityY: number): void {
        // 実際の実装では、ゲームエンジンに弾丸を追加
        // ここでは簡略化
    }

    /**
     * 群れ中心位置を設定
     */
    public setFlockCenter(center: Vector2D): void {
        this.flockCenter = center;
    }

    /**
     * 近くの敵の位置を設定
     */
    public setNearbyEnemies(enemies: Vector2D[]): void {
        this.nearbyEnemies = enemies;
    }

    /**
     * 動的設定を取得
     */
    public getDynamicConfig(): DynamicEnemyConfig {
        return this.dynamicConfig;
    }

    /**
     * エリート敵かどうかを判定
     */
    public isElite(): boolean {
        return this.dynamicConfig.isElite || false;
    }

    /**
     * 群れIDを取得
     */
    public getFlockId(): string | undefined {
        return this.dynamicConfig.flockId;
    }

    /**
     * リーダーIDを取得
     */
    public getLeaderId(): string | undefined {
        return this.dynamicConfig.leaderId;
    }

    /**
     * 群れのリーダーかどうかを判定
     */
    public isFlockLeader(): boolean {
        return !!this.dynamicConfig.flockId && !this.dynamicConfig.leaderId;
    }

    /**
     * 攻撃力を取得（動的設定を考慮）
     */
    public getAttackPower(): number {
        return this.attackComponent.calculateAttackPower(
            this.dynamicConfig.stats.attackPower,
            this.dynamicConfig.attack
        );
    }

    /**
     * 脅威レベルを取得
     */
    public getThreatLevel(): number {
        return this.attackComponent.calculateThreatLevel(
            this.dynamicConfig.attack,
            this.getAttackPower()
        );
    }

    /**
     * 環境効果を適用
     */
    public applyEnvironmentalEffect(effectType: 'speed_boost' | 'damage_boost' | 'shield_regen' | 'stealth'): void {
        // 一時的な効果を適用
        switch (effectType) {
            case 'speed_boost':
                // 速度を一時的に上昇
                break;
            case 'damage_boost':
                // 攻撃力を一時的に上昇
                break;
            case 'shield_regen':
                // 体力を少し回復
                break;
            case 'stealth':
                // 透明度を上げる（視覚効果）
                break;
        }
    }

    /**
     * 動的敵の詳細情報を取得
     */
    public getDetailedInfo(): {
        config: DynamicEnemyConfig;
        currentState: {
            position: Vector2D;
            health: number;
            animationPhase: number;
            lastAttackTime: number;
        };
        flockInfo: {
            flockId?: string;
            leaderId?: string;
            isLeader: boolean;
            flockCenter?: Vector2D;
            nearbyCount: number;
        };
    } {
        return {
            config: this.dynamicConfig,
            currentState: {
                position: { x: this.x, y: this.y },
                health: this.getHealth(),
                animationPhase: this.dynamicAnimationPhase,
                lastAttackTime: this.lastAttackTime
            },
            flockInfo: {
                flockId: this.dynamicConfig.flockId,
                leaderId: this.dynamicConfig.leaderId,
                isLeader: this.isFlockLeader(),
                flockCenter: this.flockCenter,
                nearbyCount: this.nearbyEnemies.length
            }
        };
    }

    /**
     * 設定をリセット（オブジェクトプール用）
     */
    public resetDynamicConfiguration(config: DynamicEnemyConfig): void {
        this.dynamicConfig = config;
        this.x = config.position.x;
        this.y = config.position.y;
        this.dynamicAnimationPhase = 0;
        this.lastAttackTime = 0;
        this.flockCenter = undefined;
        this.nearbyEnemies = [];
        
        this.applyDynamicConfiguration();
    }

    // 既存のEnemyクラスのメソッドで必要に応じてオーバーライド
    private setHealth(health: number): void {
        // 実際の実装では、Enemyクラスの体力設定メソッドを呼び出し
    }

    private setSpeed(speed: number): void {
        // 実際の実装では、Enemyクラスの速度設定メソッドを呼び出し
    }

    private getHealth(): number {
        // 実際の実装では、Enemyクラスの体力取得メソッドを呼び出し
        return this.dynamicConfig.stats.health;
    }
}