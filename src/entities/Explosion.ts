import { Vector2D } from "../types";
import { GAME_CONSTANTS } from "../constants/GameConstants";
import { GameConfig } from "../config/GameConfigFactory";

interface Particle {
    x: number;
    y: number;
    radius: number;
    speed: number;
    angle: number;
    color: string;
    initialRadius: number;
    initialSpeed: number;
    type: 'core' | 'spark' | 'smoke' | 'ember';
    velocity: { x: number; y: number };
    life: number;
    maxLife: number;
    rotation: number;
    rotationSpeed: number;
}

interface ShockWave {
    radius: number;
    maxRadius: number;
    alpha: number;
    x: number;
    y: number;
}

export class Explosion {
    private x: number = 0;
    private y: number = 0;
    private particles: Particle[] = [];
    private shockWaves: ShockWave[] = [];
    private duration: number;
    private currentFrame: number = 0;
    private active: boolean = false;
    private size: number = 1;
    private config: GameConfig;

    constructor(config?: GameConfig) {
        // 設定注入対応（後方互換性を保持）
        this.config = config || {
            explosion: { duration: GAME_CONSTANTS.EXPLOSION.DURATION }
        } as GameConfig;
        this.duration = this.config.explosion.duration;
    }

    /**
     * 爆発エフェクトを初期化（オブジェクトプール用）
     */
    public initialize({ x, y }: Vector2D, size: number = 1): void {
        this.x = x;
        this.y = y;
        this.size = size;
        this.duration = this.config.explosion.duration;
        this.currentFrame = 0;
        this.active = true;
        this.generateParticles();
    }

    /**
     * 爆発エフェクトをリセット（オブジェクトプール用）
     */
    public reset(): void {
        this.x = 0;
        this.y = 0;
        this.particles = [];
        this.currentFrame = 0;
        this.active = false;
        this.size = 1;
    }

    /**
     * パーティクルを生成（美しい爆発エフェクト）
     */
    private generateParticles(): void {
        this.particles = [];
        this.shockWaves = [];
        
        // 衝撃波を生成
        for (let i = 0; i < 3; i++) {
            this.shockWaves.push({
                x: this.x,
                y: this.y,  
                radius: 0,
                maxRadius: (50 + i * 30) * this.size,
                alpha: 0.8 - i * 0.2
            });
        }

        const particleCount = Math.floor(80 * this.size);

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const initialRadius = Math.random() * 6 + 2;
            const initialSpeed = Math.random() * 150 + 50;
            const maxLife = Math.random() * 60 + 30;
            
            // パーティクルタイプを決定
            let type: 'core' | 'spark' | 'smoke' | 'ember';
            const rand = Math.random();
            if (rand < 0.3) type = 'core';
            else if (rand < 0.6) type = 'spark'; 
            else if (rand < 0.8) type = 'smoke';
            else type = 'ember';

            this.particles.push({
                x: this.x + (Math.random() - 0.5) * 10,
                y: this.y + (Math.random() - 0.5) * 10,
                radius: initialRadius,
                speed: initialSpeed,
                angle: angle,
                color: this.getExplosionColor(type),
                initialRadius: initialRadius,
                initialSpeed: initialSpeed,
                type: type,
                velocity: {
                    x: Math.cos(angle) * initialSpeed,
                    y: Math.sin(angle) * initialSpeed
                },
                life: maxLife,
                maxLife: maxLife,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }

    private getExplosionColor(type: 'core' | 'spark' | 'smoke' | 'ember' = 'core'): string {
        switch (type) {
            case 'core':
                return `hsl(${Math.random() * 30 + 10}, 100%, ${70 + Math.random() * 20}%)`;
            case 'spark':
                return `hsl(${Math.random() * 60 + 40}, 90%, ${80 + Math.random() * 15}%)`;
            case 'smoke':
                return `hsl(0, 0%, ${20 + Math.random() * 40}%)`;
            case 'ember':
                return `hsl(${Math.random() * 20}, 80%, ${60 + Math.random() * 25}%)`;
            default:
                return `hsl(${Math.random() * 60 + 10}, 100%, ${50 + Math.random() * 30}%)`;
        }
    }

    public update(deltaTime: number): void {
        this.currentFrame++;
        
        // 衝撃波の更新（負の値を防ぐ）
        this.shockWaves.forEach(shockWave => {
            shockWave.radius = Math.max(0, shockWave.radius + (shockWave.maxRadius / this.duration) * 2);
            shockWave.alpha = Math.max(0, 0.8 - (Math.max(0, shockWave.radius) / Math.max(1, shockWave.maxRadius)));
        });

        // パーティクルの更新
        this.particles.forEach(particle => {
            particle.life--;
            const lifeRatio = particle.life / particle.maxLife;
            
            // 重力効果（煙とエンバーに適用）
            if (particle.type === 'smoke' || particle.type === 'ember') {
                particle.velocity.y += 20 * deltaTime;
            }
            
            // 摩擦効果
            particle.velocity.x *= 0.995;
            particle.velocity.y *= 0.995;
            
            // 位置更新
            particle.x += particle.velocity.x * deltaTime;
            particle.y += particle.velocity.y * deltaTime;
            
            // 回転更新
            particle.rotation += particle.rotationSpeed;
            
            // サイズ変化（負の値を防ぐ）
            switch (particle.type) {
                case 'core':
                    particle.radius = Math.max(0, particle.initialRadius * Math.max(0, lifeRatio));
                    break;
                case 'spark':
                    particle.radius = Math.max(0, particle.initialRadius * Math.max(0, lifeRatio * 0.5 + 0.5));
                    break;
                case 'smoke':
                    particle.radius = Math.max(0, particle.initialRadius * Math.max(0, 2 - lifeRatio));
                    break;
                case 'ember':
                    particle.radius = Math.max(0, particle.initialRadius * Math.max(0.2, lifeRatio));
                    break;
            }
        });
        
        // 寿命切れのパーティクルを削除
        this.particles = this.particles.filter(p => p.life > 0);
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        const progress = this.currentFrame / this.duration;
        
        ctx.save();
        
        // 衝撃波の描画
        this.shockWaves.forEach(shockWave => {
            if (shockWave.alpha > 0 && shockWave.radius > 0) {
                // 安全な半径値を確保
                const safeOuterRadius = Math.max(0.1, shockWave.radius);
                const safeInnerRadius = Math.max(0.1, shockWave.radius - 2);
                
                ctx.strokeStyle = `rgba(255, 200, 100, ${shockWave.alpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(shockWave.x, shockWave.y, safeOuterRadius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 内側の光輪（半径が十分大きい場合のみ描画）
                if (shockWave.radius > 3) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${shockWave.alpha * 0.5})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(shockWave.x, shockWave.y, safeInnerRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        });
        
        // コア爆発の光
        if (progress < 0.3) {
            const flashAlpha = (0.3 - progress) / 0.3;
            const flashRadius = 80 * this.size * (1 - progress);
            
            const flashGradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, flashRadius
            );
            flashGradient.addColorStop(0, `rgba(255, 255, 200, ${flashAlpha * 0.8})`);
            flashGradient.addColorStop(0.5, `rgba(255, 150, 50, ${flashAlpha * 0.4})`);
            flashGradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
            
            ctx.fillStyle = flashGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, flashRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // パーティクルの描画
        this.particles.forEach(particle => {
            // 安全ガード：負の半径やNaN値をチェック
            if (particle.radius <= 0 || !isFinite(particle.radius)) {
                return; // 無効なパーティクルをスキップ
            }
            
            const lifeRatio = particle.life / particle.maxLife;
            let alpha = lifeRatio;
            
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.rotation);
            
            // 半径を再度安全な値に正規化
            const safeRadius = Math.max(0.1, particle.radius);
            
            switch (particle.type) {
                case 'core':
                    // コアパーティクル（明るい中心部）
                    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, safeRadius);
                    coreGradient.addColorStop(0, particle.color);
                    coreGradient.addColorStop(0.7, particle.color.replace(/[\d\.]+\)/, `${alpha * 0.6})`));
                    coreGradient.addColorStop(1, particle.color.replace(/[\d\.]+\)/, '0)'));
                    
                    ctx.fillStyle = coreGradient;
                    ctx.beginPath();
                    ctx.arc(0, 0, safeRadius, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'spark':
                    // 火花（線状）
                    ctx.strokeStyle = particle.color.replace(/[\d\.]+\)/, `${alpha})`);
                    ctx.lineWidth = Math.max(0.1, safeRadius * 0.3);
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(-safeRadius, 0);
                    ctx.lineTo(safeRadius, 0);
                    ctx.stroke();
                    break;
                    
                case 'smoke':
                    // 煙（半透明の円）
                    alpha *= 0.4;
                    ctx.fillStyle = particle.color.replace(/[\d\.]+\)/, `${alpha})`);
                    ctx.beginPath();
                    ctx.arc(0, 0, safeRadius, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'ember':
                    // 燃えかす（小さな明るい点）
                    const emberGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, safeRadius);
                    emberGradient.addColorStop(0, `rgba(255, 100, 0, ${alpha})`);
                    emberGradient.addColorStop(0.5, particle.color.replace(/[\d\.]+\)/, `${alpha * 0.7})`));
                    emberGradient.addColorStop(1, particle.color.replace(/[\d\.]+\)/, '0)'));
                    
                    ctx.fillStyle = emberGradient;
                    ctx.beginPath();
                    ctx.arc(0, 0, safeRadius, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
            
            ctx.restore();
        });
        
        ctx.restore();
    }

    public isFinished(): boolean {
        return !this.active || this.currentFrame >= this.duration;
    }

    /**
     * 爆発の位置を取得
     */
    public getPosition(): { x: number; y: number } {
        return { x: this.x, y: this.y };
    }
}
