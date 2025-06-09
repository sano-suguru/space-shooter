import { GAME_CONSTANTS } from '../constants/GameConstants';

/**
 * プレイヤーの描画処理を専門に扱うクラス
 * Player.tsから描画関連の責務を分離
 */
export class PlayerRenderer {
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
        this.drawThrusterParticles(ctx, thrusterParticles);
        this.drawShip(ctx, x, y, width, height, invincible, engineAnimationPhase);
        this.drawShield(ctx, x, y, width, height, shieldActive);
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
        ctx.fillStyle = invincible ? 'rgba(255, 0, 0, 0.5)' : GAME_CONSTANTS.PLAYER.COLORS.PRIMARY;
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
        ctx.fillStyle = GAME_CONSTANTS.PLAYER.COLORS.SECONDARY;
        
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
        ctx.fillStyle = GAME_CONSTANTS.PLAYER.COLORS.ACCENT;
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
        gradient.addColorStop(0, GAME_CONSTANTS.PLAYER.COLORS.ENGINE);
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
     * シールドの描画
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
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, width / 2 + 10, 0, Math.PI * 2);
        ctx.stroke();

        const gradient = ctx.createRadialGradient(
            x + width / 2, y + height / 2, width / 2,
            x + width / 2, y + height / 2, width / 2 + 15
        );
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.restore();
    }
}
