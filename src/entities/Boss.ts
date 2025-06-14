import { IGameEngine } from "../interfaces/IGameEngine";
import { Vector2D } from "../types";
import { BossBullet } from "./BossBullet";
import { GameObject } from "./GameObject";
import { GameConfig, createGameConfig } from "../config/GameConfigFactory";
import { PowerUpEffectService } from "../services/PowerUpEffectService";

export class Boss extends GameObject {
    private health: number;
    private moveDirection: number = 1;
    private lastFireTime: number = 0;
    private game: IGameEngine;
    private animationPhase: number = 0;
    private corePulse: number = 0;
    private config: GameConfig;

    // プレイヤーと統一感のある洗練された要素
    private engineGlow: { phase: number; intensity: number } = { phase: 0, intensity: 0 };
    private shieldLayers: Array<{ radius: number; rotation: number; opacity: number; speed: number }> = [];
    private geometricPanels: Array<{ x: number; y: number; size: number; rotation: number; glow: number }> = [];
    private thrusterNodes: Array<{ x: number; y: number; size: number; pulse: number }> = [];
    private energyBeams: Array<{ angle: number; length: number; intensity: number; rotation: number }> = [];

    constructor(game: IGameEngine, config?: GameConfig, _powerUpEffectService?: PowerUpEffectService) {
        // 後方互換性のため、configが未指定の場合はデフォルト設定を使用
        const gameConfig = config || createGameConfig();

        super(
            gameConfig.canvas.width / 2 - gameConfig.boss.width / 2,
            -gameConfig.boss.height,
            gameConfig.boss.width,
            gameConfig.boss.height
        );
        
        this.config = gameConfig;
        this.health = gameConfig.boss.initialHealth;
        this.game = game;

        this.initializeRefinedStructure();
    }

    private initializeRefinedStructure(): void {
        // プレイヤーのような多層シールド
        const shieldCount = 4;
        for (let i = 0; i < shieldCount; i++) {
            this.shieldLayers.push({
                radius: 40 + i * 25,
                rotation: Math.random() * Math.PI * 2,
                opacity: Math.random() * Math.PI * 2,
                speed: 0.3 + i * 0.2
            });
        }

        // 幾何学的パネル - プレイヤーの補助翼のような要素
        const panelCount = 8;
        for (let i = 0; i < panelCount; i++) {
            this.geometricPanels.push({
                x: (Math.random() - 0.5) * this.width * 0.7,
                y: (Math.random() - 0.5) * this.height * 0.7,
                size: 8 + Math.random() * 12,
                rotation: Math.random() * Math.PI * 2,
                glow: Math.random() * Math.PI * 2
            });
        }

        // スラスターノード - プレイヤーのエンジンのような要素
        const nodeCount = 6;
        for (let i = 0; i < nodeCount; i++) {
            this.thrusterNodes.push({
                x: (Math.random() - 0.5) * this.width * 0.5,
                y: (Math.random() - 0.5) * this.height * 0.5,
                size: 6 + Math.random() * 8,
                pulse: Math.random() * Math.PI * 2
            });
        }

        // エネルギービーム
        const beamCount = 12;
        for (let i = 0; i < beamCount; i++) {
            this.energyBeams.push({
                angle: (i / beamCount) * Math.PI * 2,
                length: 25 + Math.random() * 20,
                intensity: Math.random() * Math.PI * 2,
                rotation: (Math.random() - 0.5) * 0.02
            });
        }
    }

    public update(deltaTime: number): void {
        if (this.y < 50) {
            this.y += this.config.boss.initialSpeed * deltaTime;
        } else {
            const nextX = this.x + this.moveDirection * this.config.boss.movementSpeed * deltaTime;

            if (nextX <= 0) {
                this.x = 0;
                this.moveDirection = 1;
            } else if (nextX + this.width >= this.config.canvas.width) {
                this.x = this.config.canvas.width - this.width;
                this.moveDirection = -1;
            } else {
                this.x = nextX;
            }
        }

        // プレイヤーのような洗練されたアニメーション
        this.animationPhase += deltaTime * 1.5;
        this.corePulse += deltaTime * 2.8;

        // エンジンのグロー更新
        this.engineGlow.phase += deltaTime * 8;
        this.engineGlow.intensity += deltaTime * 3;

        // シールドレイヤーの回転
        this.shieldLayers.forEach((shield, index) => {
            shield.rotation += deltaTime * shield.speed;
            shield.opacity += deltaTime * (2 + index * 0.3);
        });

        // 幾何学的パネルの回転と発光
        this.geometricPanels.forEach((panel, index) => {
            panel.rotation += deltaTime * (0.6 + index * 0.1);
            panel.glow += deltaTime * (2.5 + index * 0.2);
        });

        // スラスターノードの脈動
        this.thrusterNodes.forEach((node, index) => {
            node.pulse += deltaTime * (3 + index * 0.4);
        });

        // エネルギービームの回転
        this.energyBeams.forEach((beam, index) => {
            beam.angle += beam.rotation * deltaTime;
            beam.intensity += deltaTime * (2.2 + index * 0.1);
        });

        const currentTime = Date.now();
        if (currentTime - this.lastFireTime > this.config.boss.fireRate) {
            this.shoot();
            this.lastFireTime = currentTime;
        }
    }

    private shoot(): void {
        const angleSpread = Math.PI / 6;
        for (let i = -2; i <= 2; i++) {
            const angle = i * (angleSpread / 4);
            const speedX = Math.sin(angle) * this.config.boss.bulletSpeed;
            const speedY = Math.cos(angle) * this.config.boss.bulletSpeed;
            this.game.addBossBullet(new BossBullet(
                this.x + this.width / 2,
                this.y + this.height,
                speedX,
                speedY
            ));
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // プレイヤーと統一感のある描画順序
        this.drawShieldLayers(ctx);
        this.drawMainBody(ctx);
        this.drawGeometricPanels(ctx);
        this.drawThrusterNodes(ctx);
        this.drawEnergyBeams(ctx);
        this.drawCore(ctx);

        ctx.restore();
        this.drawHealthBar(ctx);
    }

    private drawMainBody(ctx: CanvasRenderingContext2D): void {
        const baseRadius = this.width / 2.8;

        // プレイヤーと同様の深い青系グラデーション
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 1.4);
        gradient.addColorStop(0, this.config.player.colors.accent); // シアン
        gradient.addColorStop(0.4, this.config.player.colors.secondary); // 紺碧
        gradient.addColorStop(1, this.config.player.colors.primary); // 濃紺

        ctx.fillStyle = gradient;
        ctx.strokeStyle = this.config.player.colors.accent;
        ctx.lineWidth = 3;

        // プレイヤーのような幾何学的形状（複雑な多角形）
        const vertices = 16;
        ctx.beginPath();
        for (let i = 0; i < vertices; i++) {
            const angle = (i / vertices) * Math.PI * 2;
            const wave1 = Math.sin(this.animationPhase * 0.7 + angle * 3) * (baseRadius * 0.15);
            const wave2 = Math.cos(this.animationPhase * 1.1 + angle * 5) * (baseRadius * 0.08);
            const radius = baseRadius + wave1 + wave2;

            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius * 0.9;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    private drawShieldLayers(ctx: CanvasRenderingContext2D): void {
        this.shieldLayers.forEach((shield, index) => {
            const opacity = Math.sin(shield.opacity) * 0.3 + 0.4;
            const alpha = Math.floor(opacity * 255).toString(16).padStart(2, '0');

            // プレイヤーのシールドと同様の色
            ctx.strokeStyle = `${this.config.player.colors.accent}${alpha}`;
            ctx.lineWidth = 2 - index * 0.3;

            // 波打つシールドリング
            ctx.beginPath();
            const segments = 32;
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2 + shield.rotation;
                const wave = Math.sin(angle * 4 + shield.opacity) * 6;
                const radius = shield.radius + wave;

                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        });
    }

    private drawGeometricPanels(ctx: CanvasRenderingContext2D): void {
        this.geometricPanels.forEach((panel) => {
            ctx.save();
            ctx.translate(panel.x, panel.y);
            ctx.rotate(panel.rotation);

            const glowIntensity = Math.sin(panel.glow) * 0.5 + 0.5;
            const alpha = Math.floor(glowIntensity * 255).toString(16).padStart(2, '0');

            // プレイヤーの補助翼のような幾何学的形状
            ctx.fillStyle = `${this.config.player.colors.secondary}${alpha}`;
            ctx.strokeStyle = `${this.config.player.colors.accent}${alpha}`;
            ctx.lineWidth = 1.5;

            const size = panel.size;
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.lineTo(-size * 0.6, size * 0.4);
            ctx.lineTo(0, size * 0.7);
            ctx.lineTo(size * 0.6, size * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 内部の発光
            ctx.fillStyle = `rgba(255, 255, 255, ${glowIntensity * 0.6})`;
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    private drawThrusterNodes(ctx: CanvasRenderingContext2D): void {
        this.thrusterNodes.forEach((node) => {
            const pulseSize = Math.sin(node.pulse) * 3;
            const size = node.size + pulseSize;
            const intensity = Math.sin(node.pulse * 1.5) * 0.4 + 0.6;

            // プレイヤーのエンジンのようなグラデーション
            const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 3);
            gradient.addColorStop(0, this.config.player.colors.engine); // オレンジ
            gradient.addColorStop(0.4, `${this.config.player.colors.engine}80`);
            gradient.addColorStop(1, `${this.config.player.colors.engine}00`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(node.x, node.y, size * 3, 0, Math.PI * 2);
            ctx.fill();

            // 中心の明るいコア
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.globalAlpha = intensity;
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    }

    private drawEnergyBeams(ctx: CanvasRenderingContext2D): void {
        this.energyBeams.forEach((beam) => {
            const intensity = Math.sin(beam.intensity) * 0.5 + 0.5;
            const alpha = Math.floor(intensity * 150).toString(16).padStart(2, '0');

            ctx.strokeStyle = `${this.config.player.colors.accent}${alpha}`;
            ctx.lineWidth = 2;

            const startRadius = this.width / 4;
            const endRadius = startRadius + beam.length;

            ctx.beginPath();
            ctx.moveTo(Math.cos(beam.angle) * startRadius, Math.sin(beam.angle) * startRadius);
            ctx.lineTo(Math.cos(beam.angle) * endRadius, Math.sin(beam.angle) * endRadius);
            ctx.stroke();

            // ビームの先端の光点
            const lightX = Math.cos(beam.angle) * endRadius;
            const lightY = Math.sin(beam.angle) * endRadius;

            ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.9})`;
            ctx.beginPath();
            ctx.arc(lightX, lightY, 2.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    private drawCore(ctx: CanvasRenderingContext2D): void {
        const coreSize = 15 + Math.sin(this.corePulse) * 5;
        const engineGlowSize = 8 + Math.sin(this.engineGlow.phase) * 3;

        // プレイヤーのコックピットのような中央コア
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize * 2);
        coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        coreGradient.addColorStop(0.5, `${this.config.player.colors.accent}CC`);
        coreGradient.addColorStop(1, `${this.config.player.colors.primary}80`);

        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(0, 0, coreSize * 2, 0, Math.PI * 2);
        ctx.fill();

        // メインコア
        ctx.fillStyle = this.config.player.colors.accent;
        ctx.beginPath();
        ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
        ctx.fill();

        // プレイヤーのエンジンのような輝き
        const engineGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, engineGlowSize);
        engineGradient.addColorStop(0, this.config.player.colors.engine);
        engineGradient.addColorStop(0.5, `${this.config.player.colors.engine}80`);
        engineGradient.addColorStop(1, `${this.config.player.colors.engine}00`);

        ctx.fillStyle = engineGradient;
        ctx.beginPath();
        ctx.arc(0, 0, engineGlowSize, 0, Math.PI * 2);
        ctx.fill();

        // 放射状のエネルギー線
        ctx.strokeStyle = `rgba(255, 255, 255, 0.8)`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + this.corePulse * 0.4;
            const innerLength = coreSize * 0.8;
            const outerLength = coreSize + Math.sin(this.corePulse + i * 0.5) * 10;

            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * innerLength, Math.sin(angle) * innerLength);
            ctx.lineTo(Math.cos(angle) * outerLength, Math.sin(angle) * outerLength);
            ctx.stroke();
        }
    }

    private drawHealthBar(ctx: CanvasRenderingContext2D): void {
        const healthPercentage = this.health / this.config.boss.initialHealth;
        const barWidth = this.width + 20;
        const barHeight = 8;

        // 体力バーの背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(this.x - 10, this.y - 35, barWidth, barHeight + 4);

        // プレイヤーの色と統一感のあるグラデーション
        const gradient = ctx.createLinearGradient(this.x - 8, 0, this.x - 8 + barWidth - 4, 0);
        if (healthPercentage > 0.6) {
            gradient.addColorStop(0, this.config.player.colors.accent);
            gradient.addColorStop(1, '#88ffff');
        } else if (healthPercentage > 0.3) {
            gradient.addColorStop(0, this.config.player.colors.engine);
            gradient.addColorStop(1, '#ffcc88');
        } else {
            gradient.addColorStop(0, '#ff4444');
            gradient.addColorStop(1, '#ffaaaa');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - 8, this.y - 33, (barWidth - 4) * healthPercentage, barHeight);

        // 体力バーの枠
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - 8, this.y - 33, barWidth - 4, barHeight);

        // 低体力時のフリッカーエフェクト
        if (healthPercentage < 0.3) {
            const flicker = Math.sin(this.animationPhase * 8) * 0.4 + 0.6;
            ctx.globalAlpha = flicker;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(this.x - 8, this.y - 33, (barWidth - 4) * healthPercentage, barHeight);
            ctx.globalAlpha = 1;
        }
    }

    public takeDamage(): boolean {
        this.health--;
        return this.health <= 0;
    }

    public getPosition(): Vector2D {
        return { x: this.x, y: this.y };
    }
}
