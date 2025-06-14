import { PowerUpType } from "../types";
import { GAME_CONSTANTS } from "../constants/GameConstants";
import { GameObject } from "./GameObject";
import { GameConfig, createGameConfig } from "../config/GameConfigFactory";
import { PowerUpEffectService } from "../services/PowerUpEffectService";

export class PowerUp extends GameObject {
    private type: PowerUpType;
    private color: string;
    private rotation: number = 0;
    private rotationSpeed: number;
    private glowIntensity: number = 0;
    private glowDirection: number = 1;
    private trail: Array<{ x: number; y: number; alpha: number }> = [];
    private trailUpdateCounter: number = 0;
    private config: GameConfig;
    private effectService?: PowerUpEffectService;

    constructor(
        x: number,
        y: number,
        config?: GameConfig,
        effectService?: PowerUpEffectService
    ) {
        // 後方互換性のため、configが未指定の場合はデフォルト設定を使用
        const gameConfig = config || createGameConfig();
        
        super(x, y, gameConfig.powerup.width, gameConfig.powerup.height);
        
        this.config = gameConfig;
        this.effectService = effectService;
        this.type = this.getRandomPowerUpType();
        this.color = this.getPowerUpColor(this.type);
        this.rotationSpeed = Math.random() * 0.1 + 0.05;
    }

    private getRandomPowerUpType(): PowerUpType {
        // 後方互換性のため、GAME_CONSTANTSからタイプを取得
        const types = Object.keys(GAME_CONSTANTS.POWERUP.TYPES) as PowerUpType[];
        return types[Math.floor(Math.random() * types.length)];
    }

    private getPowerUpColor(type: PowerUpType): string {
        // 後方互換性のため、GAME_CONSTANTSから色を取得
        return GAME_CONSTANTS.POWERUP.TYPES[type].color;
    }

    public update(deltaTime: number): void {
        this.y += this.config.powerup.speed * deltaTime;
        this.rotation += this.rotationSpeed * deltaTime;

        // Update glow effect
        this.glowIntensity += 0.05 * this.glowDirection;
        if (this.glowIntensity >= 1 || this.glowIntensity <= 0) {
            this.glowDirection *= -1;
        }

        // Update trail
        this.trailUpdateCounter += deltaTime;
        if (this.trailUpdateCounter >= 0.05) { // Add a new trail point every 50ms
            this.trail.unshift({ x: this.x, y: this.y, alpha: 1 });
            this.trailUpdateCounter = 0;
        }

        if (this.trail.length > 30) {  // Significantly increased trail length
            this.trail.pop();
        }
        this.trail.forEach(point => point.alpha -= 0.02);  // Even slower fade-out
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        // Draw trail
        this.drawTrail(ctx);

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        // Draw glow effect
        const glowSize = this.width / 2 + 5 + this.glowIntensity * 3;
        const gradient = ctx.createRadialGradient(0, 0, this.width / 2, 0, 0, glowSize);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Draw outer circle
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();

        // Draw inner colored circle
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Draw power-up type symbol
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let symbol: string;
        switch (this.type) {
            case 'RAPID_FIRE':
                symbol = 'R';
                break;
            case 'TRIPLE_SHOT':
                symbol = 'T';
                break;
            case 'SHIELD':
                symbol = 'S';
                break;
        }
        ctx.fillText(symbol, 0, 0);

        ctx.restore();
    }

    private drawTrail(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        for (let i = this.trail.length - 1; i >= 0; i--) {
            const point = this.trail[i];
            const size = (this.width / 2) * (1 - i / this.trail.length) * 0.8;  // Slightly reduced max size
            ctx.fillStyle = `rgba(${parseInt(this.color.slice(1, 3), 16)}, ${parseInt(this.color.slice(3, 5), 16)}, ${parseInt(this.color.slice(5, 7), 16)}, ${point.alpha * 0.8})`;  // Further increased base alpha
            ctx.beginPath();
            ctx.arc(point.x + this.width / 2, point.y + this.height / 2, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    public isOnScreen(): boolean {
        return this.y < this.config.canvas.height;
    }

    public getType(): PowerUpType {
        return this.type;
    }

    /**
     * PowerUp効果を適用する（PowerUpEffectServiceを使用）
     */
    public applyEffect(player: any): void {
        if (this.effectService) {
            this.effectService.applyEffect(player, this.type);
        } else {
            // 後方互換性のため、直接効果を適用
            const effect = GAME_CONSTANTS.POWERUP.TYPES[this.type].effect;
            if (effect) {
                effect(player);
            }
        }
    }
}
