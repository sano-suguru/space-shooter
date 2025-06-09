import { GAME_CONSTANTS } from "../constants/GameConstants";
import { IRandomProvider } from "../providers";

type StarType = 'main-sequence' | 'giant' | 'supergiant' | 'white-dwarf' | 'binary' | 'variable';

interface StarProperties {
    color: string;
    glowColor: string;
    size: number;
    brightness: number;
    twinkleIntensity: number;
    pulseSpeed?: number;
}

export class Star {
    private x: number;
    private y: number;
    private baseSize: number;
    private speed: number;
    private twinkleSpeed: number;
    private twinkleOffset: number;
    private randomProvider: IRandomProvider;
    private starType: StarType;
    private properties: StarProperties;
    private pulsePhase: number;
    private secondarySize?: number; // バイナリ星用
    private secondaryPhase?: number; // バイナリ星用

    constructor(randomProvider: IRandomProvider) {
        this.randomProvider = randomProvider;
        this.x = this.randomProvider.random() * GAME_CONSTANTS.CANVAS.WIDTH;
        this.y = this.randomProvider.random() * GAME_CONSTANTS.CANVAS.HEIGHT;
        this.speed = this.randomProvider.random() * 10 + 5;
        this.twinkleSpeed = this.randomProvider.random() * 0.05 + 0.01;
        this.twinkleOffset = this.randomProvider.random() * Math.PI * 2;
        this.pulsePhase = this.randomProvider.random() * Math.PI * 2;
        
        // 星のタイプをランダムに決定（重み付き）
        this.starType = this.determineStarType();
        this.properties = this.getStarProperties(this.starType);
        this.baseSize = this.properties.size;
        
        // バイナリ星の場合の設定
        if (this.starType === 'binary') {
            this.secondarySize = this.baseSize * (0.5 + this.randomProvider.random() * 0.5);
            this.secondaryPhase = this.randomProvider.random() * Math.PI * 2;
        }
    }

    private determineStarType(): StarType {
        const rand = this.randomProvider.random();
        if (rand < 0.6) return 'main-sequence';
        if (rand < 0.75) return 'giant';
        if (rand < 0.85) return 'white-dwarf';
        if (rand < 0.92) return 'variable';
        if (rand < 0.97) return 'binary';
        return 'supergiant';
    }

    private getStarProperties(type: StarType): StarProperties {
        const baseSize = this.randomProvider.random() * 2 + 1;
        
        switch (type) {
            case 'main-sequence':
                const tempClass = this.randomProvider.random();
                if (tempClass < 0.3) { // O, B類星 - 青白い
                    return {
                        color: '#B0E0E6',
                        glowColor: '#87CEEB',
                        size: baseSize * 1.2,
                        brightness: 0.9,
                        twinkleIntensity: 0.8
                    };
                } else if (tempClass < 0.6) { // A, F類星 - 白い
                    return {
                        color: '#FFFFFF',
                        glowColor: '#E6E6FA',
                        size: baseSize,
                        brightness: 0.8,
                        twinkleIntensity: 0.7
                    };
                } else if (tempClass < 0.8) { // G類星 - 黄色（太陽類似）
                    return {
                        color: '#FFFF99',
                        glowColor: '#FFFACD',
                        size: baseSize,
                        brightness: 0.7,
                        twinkleIntensity: 0.6
                    };
                } else { // K, M類星 - 赤い
                    return {
                        color: '#FFB6C1',
                        glowColor: '#FFA07A',
                        size: baseSize * 0.8,
                        brightness: 0.6,
                        twinkleIntensity: 0.9
                    };
                }
            
            case 'giant':
                return {
                    color: '#FF6347',
                    glowColor: '#FF4500',
                    size: baseSize * 2.5,
                    brightness: 1.0,
                    twinkleIntensity: 0.5
                };
            
            case 'supergiant':
                return {
                    color: '#FF0000',
                    glowColor: '#DC143C',
                    size: baseSize * 4,
                    brightness: 1.2,
                    twinkleIntensity: 0.3
                };
            
            case 'white-dwarf':
                return {
                    color: '#E0E0E0',
                    glowColor: '#D3D3D3',
                    size: baseSize * 0.5,
                    brightness: 0.9,
                    twinkleIntensity: 1.2
                };
            
            case 'variable':
                return {
                    color: '#DA70D6',
                    glowColor: '#DDA0DD',
                    size: baseSize * 1.5,
                    brightness: 0.8,
                    twinkleIntensity: 0.4,
                    pulseSpeed: 0.02 + this.randomProvider.random() * 0.03
                };
            
            case 'binary':
                return {
                    color: '#FFD700',
                    glowColor: '#FFA500',
                    size: baseSize * 1.3,
                    brightness: 0.9,
                    twinkleIntensity: 0.6
                };
            
            default:
                return {
                    color: '#FFFFFF',
                    glowColor: '#E6E6FA',
                    size: baseSize,
                    brightness: 0.7,
                    twinkleIntensity: 0.7
                };
        }
    }

    public update(deltaTime: number): void {
        this.y += this.speed * deltaTime;
        if (this.y > GAME_CONSTANTS.CANVAS.HEIGHT) {
            this.y = 0;
            this.x = this.randomProvider.random() * GAME_CONSTANTS.CANVAS.WIDTH;
        }
        
        this.twinkleOffset += this.twinkleSpeed;
        this.pulsePhase += (this.properties.pulseSpeed || 0.01);
        
        if (this.secondaryPhase !== undefined) {
            this.secondaryPhase += 0.03; // バイナリ星の軌道運動
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        
        const twinkle = Math.sin(this.twinkleOffset) * 0.5 + 0.5;
        const twinkleEffect = this.properties.twinkleIntensity * twinkle;
        
        if (this.starType === 'binary' && this.secondarySize && this.secondaryPhase !== undefined) {
            // バイナリ星の描画
            this.drawBinaryStar(ctx, twinkleEffect);
        } else if (this.starType === 'variable') {
            // 変光星の描画
            this.drawVariableStar(ctx, twinkleEffect);
        } else {
            // 通常の星の描画
            this.drawRegularStar(ctx, twinkleEffect);
        }
        
        ctx.restore();
    }

    private drawRegularStar(ctx: CanvasRenderingContext2D, twinkleEffect: number): void {
        const currentSize = this.baseSize * (0.8 + twinkleEffect * 0.4);
        const alpha = this.properties.brightness * (0.6 + twinkleEffect * 0.4);
        
        // グロー効果
        ctx.globalCompositeOperation = 'screen';
        const glowSize = currentSize * 3;
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, glowSize
        );
        
        const rgb = this.hexToRgb(this.properties.glowColor);
        glowGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.8})`);
        glowGradient.addColorStop(0.7, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.3})`);
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 星の本体
        ctx.globalCompositeOperation = 'source-over';
        const coreRgb = this.hexToRgb(this.properties.color);
        ctx.fillStyle = `rgba(${coreRgb.r}, ${coreRgb.g}, ${coreRgb.b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawVariableStar(ctx: CanvasRenderingContext2D, twinkleEffect: number): void {
        const pulse = Math.sin(this.pulsePhase) * 0.5 + 0.5;
        const currentSize = this.baseSize * (0.5 + pulse * 0.8 + twinkleEffect * 0.3);
        const alpha = this.properties.brightness * (0.4 + pulse * 0.6 + twinkleEffect * 0.2);
        
        // パルスする星の描画
        this.drawStarWithEffect(ctx, currentSize, alpha, pulse);
    }

    private drawBinaryStar(ctx: CanvasRenderingContext2D, twinkleEffect: number): void {
        const orbitRadius = this.baseSize * 2;
        const primarySize = this.baseSize * (0.8 + twinkleEffect * 0.3);
        const secondarySize = this.secondarySize! * (0.8 + twinkleEffect * 0.3);
        
        // 主星の位置
        const primary = {
            x: this.x + Math.cos(this.secondaryPhase!) * orbitRadius * 0.6,
            y: this.y + Math.sin(this.secondaryPhase!) * orbitRadius * 0.3
        };
        
        // 伴星の位置
        const secondary = {
            x: this.x - Math.cos(this.secondaryPhase!) * orbitRadius * 0.4,
            y: this.y - Math.sin(this.secondaryPhase!) * orbitRadius * 0.2
        };
        
        // 主星を描画
        this.drawStarAt(ctx, primary.x, primary.y, primarySize, this.properties.brightness * (0.7 + twinkleEffect * 0.3));
        
        // 伴星を描画（少し暗く）
        this.drawStarAt(ctx, secondary.x, secondary.y, secondarySize, this.properties.brightness * (0.5 + twinkleEffect * 0.2));
    }

    private drawStarWithEffect(ctx: CanvasRenderingContext2D, size: number, alpha: number, effect: number): void {
        this.drawStarAt(ctx, this.x, this.y, size, alpha, effect);
    }

    private drawStarAt(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, effect: number = 0.5): void {
        // グロー効果
        ctx.globalCompositeOperation = 'screen';
        const glowSize = size * (2 + effect);
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        
        const rgb = this.hexToRgb(this.properties.glowColor);
        glowGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.8})`);
        glowGradient.addColorStop(0.7, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.3})`);
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 星の本体
        ctx.globalCompositeOperation = 'source-over';
        const coreRgb = this.hexToRgb(this.properties.color);
        ctx.fillStyle = `rgba(${coreRgb.r}, ${coreRgb.g}, ${coreRgb.b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    private hexToRgb(hex: string): { r: number; g: number; b: number } {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    public getStarType(): StarType {
        return this.starType;
    }

    public getPosition(): { x: number; y: number } {
        return { x: this.x, y: this.y };
    }
}
