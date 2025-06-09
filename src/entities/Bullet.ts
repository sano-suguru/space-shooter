import { GAME_CONSTANTS } from "../constants/GameConstants";
import { GameObject } from "./GameObject";

interface TrailPoint {
    x: number;
    y: number;
    alpha: number;
}

export class Bullet extends GameObject {
    private active: boolean = true;
    private speed: number = GAME_CONSTANTS.BULLET.SPEED;
    private color: string = '#ff0000';
    private animationTime: number = 0;
    private trail: TrailPoint[] = [];
    private maxTrailLength: number = 8;
    private bulletType: 'plasma' | 'laser' | 'energy' | 'missile' = 'plasma';
    private rotation: number = 0;
    private rotationSpeed: number = 0.2;
    private pulsePhase: number = 0;

    constructor(x: number = 0, y: number = 0) {
        super(x, y, GAME_CONSTANTS.BULLET.WIDTH, GAME_CONSTANTS.BULLET.HEIGHT);
    }

    /**
     * 弾丸を初期化（美しいエフェクト付き）
     */
    public initialize(x: number, y: number, speed?: number, color?: string): void {
        this.x = x;
        this.y = y;
        this.active = true;
        this.speed = speed ?? GAME_CONSTANTS.BULLET.SPEED;
        this.color = color ?? '#00aaff';
        this.animationTime = 0;
        this.trail = [];
        this.rotation = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
        
        // 色から弾丸タイプを判定
        if (color?.includes('ff')) this.bulletType = 'energy';
        else if (color?.includes('00')) this.bulletType = 'plasma';
        else if (color?.includes('aa')) this.bulletType = 'laser';
        else this.bulletType = 'missile';
    }

    /**
     * 弾丸をリセット（オブジェクトプール用）
     */
    public reset(): void {
        this.x = 0;
        this.y = 0;
        this.active = false;
        this.speed = GAME_CONSTANTS.BULLET.SPEED;
        this.color = '#00aaff';
        this.animationTime = 0;
        this.trail = [];
        this.rotation = 0;
        this.pulsePhase = 0;
        this.bulletType = 'plasma';
    }

    public update(deltaTime: number): void {
        if (!this.active) return;
        
        // 弾丸の位置更新
        this.y -= this.speed * deltaTime;
        
        // アニメーション更新
        this.animationTime += deltaTime;
        
        // ミサイルタイプ以外は回転する
        if (this.bulletType !== 'missile') {
            this.rotation += this.rotationSpeed;
        }
        
        this.pulsePhase += deltaTime * 4;
        
        // トレイル更新
        this.updateTrail();
    }

    private updateTrail(): void {
        // 新しいトレイルポイントを追加
        this.trail.unshift({
            x: this.x + this.width / 2,
            y: this.y + this.height,
            alpha: 1.0
        });
        
        // トレイルポイントのアルファ値を減少
        this.trail.forEach((point, index) => {
            point.alpha = Math.max(0, 1 - (index / this.maxTrailLength));
        });
        
        // 古いトレイルポイントを削除
        if (this.trail.length > this.maxTrailLength) {
            this.trail = this.trail.slice(0, this.maxTrailLength);
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        if (!this.active) return;

        ctx.save();
        
        // トレイルの描画
        this.drawTrail(ctx);
        
        // 弾丸本体の描画
        this.drawBulletBody(ctx);
        
        ctx.restore();
    }

    private drawTrail(ctx: CanvasRenderingContext2D): void {
        if (this.trail.length < 2) return;
        
        for (let i = 1; i < this.trail.length; i++) {
            const current = this.trail[i - 1];
            const previous = this.trail[i];
            
            const gradient = ctx.createLinearGradient(
                current.x, current.y,
                previous.x, previous.y
            );
            
            gradient.addColorStop(0, this.color.replace(')', `, ${current.alpha * 0.6})`));
            gradient.addColorStop(1, this.color.replace(')', `, ${previous.alpha * 0.3})`));
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = (this.width * current.alpha * 0.8);
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(current.x, current.y);
            ctx.lineTo(previous.x, previous.y);
            ctx.stroke();
        }
    }

    private drawBulletBody(ctx: CanvasRenderingContext2D): void {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        
        switch (this.bulletType) {
            case 'plasma':
                this.drawPlasmaBullet(ctx);
                break;
            case 'laser':
                this.drawLaserBullet(ctx);
                break;
            case 'energy':
                this.drawEnergyBullet(ctx);
                break;
            case 'missile':
                this.drawMissileBullet(ctx);
                break;
        }
    }

    private drawPlasmaBullet(ctx: CanvasRenderingContext2D): void {
        const pulseSize = 1 + Math.sin(this.pulsePhase) * 0.3;
        const radius = (this.width / 2) * pulseSize;
        
        // 外側の光輪
        const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.5);
        outerGradient.addColorStop(0, this.color);
        outerGradient.addColorStop(0.4, this.color.replace(')', ', 0.6)'));
        outerGradient.addColorStop(1, this.color.replace(')', ', 0)'));
        
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 中心コア
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        coreGradient.addColorStop(0.3, this.color);
        coreGradient.addColorStop(1, this.color.replace(')', ', 0.8)'));
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawLaserBullet(ctx: CanvasRenderingContext2D): void {
        const length = this.height;
        const width = this.width;
        
        // レーザービーム
        const gradient = ctx.createLinearGradient(0, -length/2, 0, length/2);
        gradient.addColorStop(0, this.color.replace(')', ', 0.2)'));
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, this.color.replace(')', ', 0.2)'));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-width/2, -length/2, width, length);
        
        // 中央の明るいライン
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(-width/4, -length/2, width/2, length);
    }

    private drawEnergyBullet(ctx: CanvasRenderingContext2D): void {
        const size = this.width;
        
        // エネルギー球
        for (let i = 0; i < 3; i++) {
            const radius = (size / 2) * (1 - i * 0.2);
            const alpha = 0.8 - i * 0.2;
            
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
            gradient.addColorStop(0, this.color.replace(')', `, ${alpha})`));
            gradient.addColorStop(1, this.color.replace(')', ', 0)'));
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // エネルギーの輝き
        const sparkCount = 6;
        for (let i = 0; i < sparkCount; i++) {
            const angle = (i / sparkCount) * Math.PI * 2 + this.animationTime * 2;
            const sparkLength = size * 0.4;
            
            ctx.strokeStyle = this.color.replace(')', ', 0.7)');
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * size * 0.2, Math.sin(angle) * size * 0.2);
            ctx.lineTo(Math.cos(angle) * sparkLength, Math.sin(angle) * sparkLength);
            ctx.stroke();
        }
    }

    private drawMissileBullet(ctx: CanvasRenderingContext2D): void {
        const length = this.height;
        const width = this.width;
        
        // ミサイル本体
        ctx.fillStyle = '#888888';
        ctx.fillRect(-width/2, -length/2, width, length);
        
        // 先端
        ctx.fillStyle = '#aaaaaa';
        ctx.beginPath();
        ctx.moveTo(0, -length/2);
        ctx.lineTo(-width/3, -length/4);
        ctx.lineTo(width/3, -length/4);
        ctx.closePath();
        ctx.fill();
        
        // 推進炎
        const flameGradient = ctx.createLinearGradient(0, length/2, 0, length);
        flameGradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
        flameGradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.6)');
        flameGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = flameGradient;
        ctx.fillRect(-width/3, length/2, width * 2/3, length/2);
    }

    public isOnScreen(): boolean {
        return this.active && this.y + this.height > 0;
    }

    public isActive(): boolean {
        return this.active;
    }

    public deactivate(): void {
        this.active = false;
    }

    /**
     * 弾丸の種類を設定
     */
    public setType(speed: number, color: string): void {
        this.speed = speed;
        this.color = color;
    }

    /**
     * 弾丸の位置を取得
     */
    public getPosition(): { x: number; y: number } {
        return { x: this.x, y: this.y };
    }
}
