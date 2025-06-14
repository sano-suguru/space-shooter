import { GameConfig, createGameConfig } from '../config/GameConfigFactory';

/**
 * プレイヤーの描画処理を専門に扱うクラス
 * Player.tsから描画関連の責務を分離
 * 美しさを重視した高品質レンダリング
 */
export class PlayerRenderer {
    private animationTime = 0;

    constructor(private config: GameConfig = createGameConfig()) {}

    /**
     * プレイヤー全体の描画処理
     */
    public render(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        invincible: boolean,
        shieldActive: boolean,
        engineAnimationPhase: number,
        thrusterParticles: Array<{ x: number; y: number; speed: number; life: number }>
    ): void {
        this.animationTime += 0.1;
        
        this.drawThrusterParticles(ctx, thrusterParticles);
        this.drawEngineTrail(ctx, x, y, width, height);
        this.drawShip(ctx, x, y, width, height, invincible, engineAnimationPhase);
        this.drawShield(ctx, x, y, width, height, shieldActive);
        this.drawWeaponSystems(ctx, x, y, width, height);
    }

    /**
     * 宇宙船本体の描画
     */
    private drawShip(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        invincible: boolean,
        engineAnimationPhase: number
    ): void {
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);

        // メインボディ
        ctx.fillStyle = invincible ? 'rgba(255, 0, 0, 0.5)' : this.config.player.colors.primary;
        ctx.beginPath();
        ctx.moveTo(0, -height / 2);
        ctx.lineTo(-width / 2, height / 2);
        ctx.lineTo(width / 2, height / 2);
        ctx.closePath();
        ctx.fill();

        // 補助翼
        this.drawWings(ctx, width, height);

        // コックピット
        this.drawCockpit(ctx, width, height);

        // エンジンの輝き
        this.drawEngineGlow(ctx, height, engineAnimationPhase);

        ctx.restore();
    }

    /**
     * 補助翼の描画
     */
    private drawWings(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        ctx.fillStyle = this.config.player.colors.secondary;
        
        // 左翼
        ctx.beginPath();
        ctx.moveTo(-width / 4, 0);
        ctx.lineTo(-width / 2, height / 2);
        ctx.lineTo(0, height / 4);
        ctx.closePath();
        ctx.fill();

        // 右翼
        ctx.beginPath();
        ctx.moveTo(width / 4, 0);
        ctx.lineTo(width / 2, height / 2);
        ctx.lineTo(0, height / 4);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * コックピットの描画
     */
    private drawCockpit(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        ctx.fillStyle = this.config.player.colors.accent;
        ctx.beginPath();
        ctx.ellipse(0, -height / 6, width / 6, height / 6, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * エンジンの輝きの描画
     */
    private drawEngineGlow(ctx: CanvasRenderingContext2D, height: number, animationPhase: number): void {
        const engineGlowSize = 10 + Math.sin(animationPhase) * 3;
        const gradient = ctx.createRadialGradient(
            0, height / 2,
            0, 0, height / 2, engineGlowSize
        );
        gradient.addColorStop(0, this.config.player.colors.engine);
        gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, height / 2, engineGlowSize, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * スラスターパーティクルの描画
     */
    private drawThrusterParticles(
        ctx: CanvasRenderingContext2D,
        particles: Array<{ x: number; y: number; speed: number; life: number }>
    ): void {
        ctx.save();
        for (const particle of particles) {
            const alpha = particle.life;
            const size = 5 * particle.life;
            ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * シールドの描画（改良版）
     */
    private drawShield(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        shieldActive: boolean
    ): void {
        if (!shieldActive) return;

        ctx.save();
        
        // シールドの脈動効果
        const pulse = Math.sin(this.animationTime * 3) * 0.3 + 0.7;
        const radius = width / 2 + 10;
        
        // 外側のシールドリング
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.6 * pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, radius, 0, Math.PI * 2);
        ctx.stroke();

        // 内側のシールドリング
        ctx.strokeStyle = `rgba(100, 255, 255, ${0.4 * pulse})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, radius - 5, 0, Math.PI * 2);
        ctx.stroke();

        // シールドのエネルギーフィールド
        const gradient = ctx.createRadialGradient(
            x + width / 2, y + height / 2, width / 2,
            x + width / 2, y + height / 2, radius + 5
        );
        gradient.addColorStop(0, `rgba(0, 255, 255, ${0.05 * pulse})`);
        gradient.addColorStop(0.7, `rgba(50, 255, 255, ${0.1 * pulse})`);
        gradient.addColorStop(1, `rgba(0, 255, 255, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, radius + 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * エンジントレイルの描画
     */
    private drawEngineTrail(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number
    ): void {
        ctx.save();
        
        const centerX = x + width / 2;
        const engineY = y + height;
        
        // メインエンジントレイル
        const trailLength = 40;
        const trailWidth = 8;
        
        const gradient = ctx.createLinearGradient(
            centerX, engineY,
            centerX, engineY + trailLength
        );
        gradient.addColorStop(0, `rgba(100, 150, 255, ${0.8 + Math.sin(this.animationTime * 5) * 0.2})`);
        gradient.addColorStop(0.3, 'rgba(50, 100, 255, 0.6)');
        gradient.addColorStop(0.7, 'rgba(0, 50, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(centerX - trailWidth / 2, engineY);
        ctx.lineTo(centerX + trailWidth / 2, engineY);
        ctx.lineTo(centerX + trailWidth / 4, engineY + trailLength);
        ctx.lineTo(centerX - trailWidth / 4, engineY + trailLength);
        ctx.closePath();
        ctx.fill();

        // サイドエンジントレイル
        const sideTrailLength = 25;
        const sideTrailWidth = 4;
        
        [-width / 3, width / 3].forEach(offset => {
            const sideGradient = ctx.createLinearGradient(
                centerX + offset, engineY - 5,
                centerX + offset, engineY + sideTrailLength
            );
            sideGradient.addColorStop(0, `rgba(255, 100, 0, ${0.6 + Math.sin(this.animationTime * 4) * 0.2})`);
            sideGradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.4)');
            sideGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = sideGradient;
            ctx.beginPath();
            ctx.moveTo(centerX + offset - sideTrailWidth / 2, engineY - 5);
            ctx.lineTo(centerX + offset + sideTrailWidth / 2, engineY - 5);
            ctx.lineTo(centerX + offset + sideTrailWidth / 4, engineY + sideTrailLength);
            ctx.lineTo(centerX + offset - sideTrailWidth / 4, engineY + sideTrailLength);
            ctx.closePath();
            ctx.fill();
        });

        ctx.restore();
    }

    /**
     * 武器システムの描画
     */
    private drawWeaponSystems(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number
    ): void {
        ctx.save();
        
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        // 武器マウントの描画
        ctx.fillStyle = 'rgba(150, 150, 200, 0.8)';
        
        // 左武器マウント
        ctx.beginPath();
        ctx.rect(x + width * 0.2 - 2, y + height * 0.3, 4, height * 0.4);
        ctx.fill();
        
        // 右武器マウント
        ctx.beginPath();
        ctx.rect(x + width * 0.8 - 2, y + height * 0.3, 4, height * 0.4);
        ctx.fill();

        // エネルギーコアの描画
        const coreSize = 3 + Math.sin(this.animationTime * 4) * 1;
        const coreGlow = ctx.createRadialGradient(
            centerX, centerY - height * 0.1, 0,
            centerX, centerY - height * 0.1, coreSize * 2
        );
        coreGlow.addColorStop(0, `rgba(255, 255, 100, ${0.8 + Math.sin(this.animationTime * 6) * 0.2})`);
        coreGlow.addColorStop(0.5, 'rgba(255, 200, 0, 0.5)');
        coreGlow.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY - height * 0.1, coreSize * 2, 0, Math.PI * 2);
        ctx.fill();

        // コア本体
        ctx.fillStyle = 'rgba(255, 255, 150, 0.9)';
        ctx.beginPath();
        ctx.arc(centerX, centerY - height * 0.1, coreSize, 0, Math.PI * 2);
        ctx.fill();

        // ナビゲーションライト
        const navLightAlpha = Math.sin(this.animationTime * 2) * 0.5 + 0.5;
        
        // 左ナビライト（赤）
        ctx.fillStyle = `rgba(255, 0, 0, ${navLightAlpha})`;
        ctx.beginPath();
        ctx.arc(x + width * 0.15, y + height * 0.2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 右ナビライト（緑）
        ctx.fillStyle = `rgba(0, 255, 0, ${navLightAlpha})`;
        ctx.beginPath();
        ctx.arc(x + width * 0.85, y + height * 0.2, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
