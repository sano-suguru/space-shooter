import { AppearanceConfig } from "../../types/EnemyGeneration";
import { COLOR_PALETTES, BASE_SHAPES, VARIATION_RANGES } from "../../../data/EnemyTemplates";
import { IRandomProvider } from "../../../providers/IRandomProvider";

export class AppearanceComponent {
    private randomProvider: IRandomProvider;

    constructor(randomProvider: IRandomProvider) {
        this.randomProvider = randomProvider;
    }

    /**
     * ランダムな外見設定を生成
     */
    public generateRandomAppearance(baseConfig?: Partial<AppearanceConfig>): AppearanceConfig {
        const config: AppearanceConfig = {
            baseShape: baseConfig?.baseShape || this.randomProvider.randomChoice(BASE_SHAPES),
            primaryColor: baseConfig?.primaryColor || this.randomProvider.randomChoice(COLOR_PALETTES.BASIC),
            secondaryColor: baseConfig?.secondaryColor || this.randomProvider.randomChoice(COLOR_PALETTES.SECONDARY),
            accentColor: baseConfig?.accentColor || this.randomProvider.randomChoice(COLOR_PALETTES.ACCENT),
            size: this.generateVariation(baseConfig?.size || 1.0, VARIATION_RANGES.appearance.size),
            glowIntensity: this.generateVariation(baseConfig?.glowIntensity || 0.7, VARIATION_RANGES.appearance.glowIntensity),
            animationSpeed: this.generateVariation(baseConfig?.animationSpeed || 1.0, VARIATION_RANGES.appearance.animationSpeed),
            trailEffect: baseConfig?.trailEffect ?? this.randomProvider.randomChance(0.3)
        };

        return config;
    }

    /**
     * エリート敵用の強化された外見を生成
     */
    public generateEliteAppearance(baseConfig: AppearanceConfig): AppearanceConfig {
        return {
            ...baseConfig,
            size: baseConfig.size * 1.4,
            glowIntensity: Math.min(1.0, baseConfig.glowIntensity + 0.3),
            animationSpeed: baseConfig.animationSpeed * 0.8, // よりゆっくりとした威厳のある動き
            primaryColor: this.enhanceColor(baseConfig.primaryColor),
            accentColor: '#ffffff', // エリートは白いアクセント
            trailEffect: true // エリートは常にトレイル効果
        };
    }

    /**
     * 外見設定に基づいて敵を描画
     */
    public drawEnemy(
        ctx: CanvasRenderingContext2D, 
        config: AppearanceConfig, 
        x: number, 
        y: number, 
        width: number, 
        height: number,
        animationPhase: number
    ): void {
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);

        const actualSize = Math.min(width, height) / 2 * config.size;
        
        // アニメーション効果
        const pulse = Math.sin(animationPhase * config.animationSpeed) * 0.1 + 0.9;
        const glowPulse = Math.sin(animationPhase * config.animationSpeed * 2) * 0.3 + 0.7;

        // トレイル効果の描画
        if (config.trailEffect) {
            this.drawTrailEffect(ctx, config, actualSize, animationPhase);
        }

        // メイン形状の描画
        this.drawMainShape(ctx, config, actualSize * pulse, glowPulse);

        // グロー効果の描画
        this.drawGlowEffect(ctx, config, actualSize, config.glowIntensity * glowPulse);

        ctx.restore();
    }

    /**
     * メイン形状を描画
     */
    private drawMainShape(
        ctx: CanvasRenderingContext2D, 
        config: AppearanceConfig, 
        size: number,
        glowPulse: number
    ): void {
        // グラデーション作成
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, this.addAlpha(config.accentColor, 0.8));
        gradient.addColorStop(0.3, config.primaryColor);
        gradient.addColorStop(1, this.addAlpha(config.secondaryColor, 0.8));

        ctx.fillStyle = gradient;
        ctx.strokeStyle = config.accentColor;
        ctx.lineWidth = 2;

        // 形状に応じた描画
        ctx.beginPath();
        switch (config.baseShape) {
            case 'hexagon':
                this.drawPolygon(ctx, 6, size);
                break;
            case 'triangle':
                this.drawPolygon(ctx, 3, size);
                break;
            case 'octagon':
                this.drawPolygon(ctx, 8, size);
                break;
            case 'star':
                this.drawStar(ctx, 5, size, size * 0.5);
                break;
            case 'diamond':
                this.drawDiamond(ctx, size);
                break;
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 内部の装飾
        this.drawInnerDecoration(ctx, config, size * 0.6, glowPulse);
    }

    /**
     * 多角形を描画
     */
    private drawPolygon(ctx: CanvasRenderingContext2D, sides: number, radius: number): void {
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
    }

    /**
     * 星形を描画
     */
    private drawStar(ctx: CanvasRenderingContext2D, points: number, outerRadius: number, innerRadius: number): void {
        for (let i = 0; i < points * 2; i++) {
            const angle = (i / (points * 2)) * Math.PI * 2;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
    }

    /**
     * ダイヤモンド形を描画
     */
    private drawDiamond(ctx: CanvasRenderingContext2D, size: number): void {
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.7, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size * 0.7, 0);
    }

    /**
     * 内部装飾を描画
     */
    private drawInnerDecoration(
        ctx: CanvasRenderingContext2D, 
        config: AppearanceConfig, 
        size: number,
        glowPulse: number
    ): void {
        ctx.fillStyle = this.addAlpha(config.accentColor, 0.6 * glowPulse);
        
        // 中央のコア
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // 放射状のライン
        ctx.strokeStyle = this.addAlpha(config.accentColor, 0.4 * glowPulse);
        ctx.lineWidth = 1;
        
        const lineCount = config.baseShape === 'star' ? 5 : 4;
        for (let i = 0; i < lineCount; i++) {
            const angle = (i / lineCount) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * size * 0.4, Math.sin(angle) * size * 0.4);
            ctx.lineTo(Math.cos(angle) * size * 0.8, Math.sin(angle) * size * 0.8);
            ctx.stroke();
        }
    }

    /**
     * グロー効果を描画
     */
    private drawGlowEffect(
        ctx: CanvasRenderingContext2D, 
        config: AppearanceConfig, 
        size: number,
        intensity: number
    ): void {
        if (intensity <= 0) return;

        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2);
        glowGradient.addColorStop(0, this.addAlpha(config.primaryColor, intensity * 0.3));
        glowGradient.addColorStop(0.5, this.addAlpha(config.primaryColor, intensity * 0.1));
        glowGradient.addColorStop(1, this.addAlpha(config.primaryColor, 0));

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, size * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * トレイル効果を描画
     */
    private drawTrailEffect(
        ctx: CanvasRenderingContext2D, 
        config: AppearanceConfig, 
        size: number,
        animationPhase: number
    ): void {
        const trailLength = 3;
        const trailSpacing = 8;

        for (let i = 1; i <= trailLength; i++) {
            const alpha = (1 - i / trailLength) * 0.5;
            const trailSize = size * (1 - i * 0.2);
            const offset = i * trailSpacing;

            ctx.fillStyle = this.addAlpha(config.primaryColor, alpha);
            ctx.beginPath();
            
            switch (config.baseShape) {
                case 'triangle':
                    ctx.moveTo(0, -trailSize + offset);
                    ctx.lineTo(-trailSize * 0.6, trailSize * 0.8 + offset);
                    ctx.lineTo(trailSize * 0.6, trailSize * 0.8 + offset);
                    break;
                default:
                    ctx.arc(0, offset, trailSize, 0, Math.PI * 2);
                    break;
            }
            
            ctx.closePath();
            ctx.fill();
        }
    }

    /**
     * 色を強化（エリート用）
     */
    private enhanceColor(color: string): string {
        // 基本的な色の強化ロジック
        const colorMap: Record<string, string> = {
            '#7c4dff': '#9c27b0', // 紫 -> より鮮やかな紫
            '#26c6da': '#00bcd4', // シアン -> より鮮やかなシアン
            '#66bb6a': '#4caf50', // グリーン -> より鮮やかなグリーン
            '#ff7043': '#ff5722', // オレンジ -> より鮮やかなオレンジ
            '#42a5f5': '#2196f3'  // ブルー -> より鮮やかなブルー
        };
        
        return colorMap[color] || color;
    }

    /**
     * 色にアルファ値を追加
     */
    private addAlpha(color: string, alpha: number): string {
        if (color.startsWith('#')) {
            const alphaHex = Math.floor(alpha * 255).toString(16).padStart(2, '0');
            return color + alphaHex;
        }
        return color;
    }

    /**
     * 値の変動を生成
     */
    private generateVariation(baseValue: number, range: { min: number; max: number }): number {
        const multiplier = this.randomProvider.randomRange(range.min, range.max);
        return baseValue * multiplier;
    }
}