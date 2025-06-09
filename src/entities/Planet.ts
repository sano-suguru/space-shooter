import { GAME_CONSTANTS } from "../constants/GameConstants";

type PlanetType = 'rocky' | 'gas-giant' | 'ice-world' | 'lava-world' | 'desert' | 'ocean-world';

interface Ring {
    innerRadius: number;
    outerRadius: number;
    color: string;
    opacity: number;
    particles: number;
    rotationSpeed: number;
    rotation: number;
}

interface Moon {
    distance: number;
    size: number;
    color: string;
    angle: number;
    orbitSpeed: number;
    glowIntensity: number;
}

interface AtmosphereLayer {
    radius: number;
    color: string;
    opacity: number;
}

export class Planet {
    private x: number;
    private y: number;
    private radius: number;
    private baseColor!: string;
    private secondaryColor!: string;
    private planetType: PlanetType;
    private craters: Array<{ x: number; y: number; radius: number }>;
    private rotation: number;
    private rotationSpeed: number;
    private hasRings: boolean;
    private rings: Ring[];
    private hasMoons: boolean;
    private moons: Moon[];
    private atmosphereLayers: AtmosphereLayer[];
    private cloudRotation: number;
    private cloudSpeed: number;
    private glowIntensity: number;

    constructor() {
        this.x = Math.random() * GAME_CONSTANTS.CANVAS.WIDTH;
        this.y = Math.random() * GAME_CONSTANTS.CANVAS.HEIGHT;
        this.radius = Math.random() * 40 + 25;
        this.planetType = this.generatePlanetType();
        this.generatePlanetColors();
        this.craters = this.generateCraters();
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.005;
        this.cloudRotation = Math.random() * Math.PI * 2;
        this.cloudSpeed = this.rotationSpeed * 1.2;
        this.glowIntensity = Math.random() * 0.5 + 0.3;

        // リングシステムの生成
        this.hasRings = Math.random() < 0.4; // 40%の確率でリングを持つ
        this.rings = this.hasRings ? this.generateRings() : [];

        // 衛星システムの生成
        this.hasMoons = Math.random() < 0.6; // 60%の確率で衛星を持つ
        this.moons = this.hasMoons ? this.generateMoons() : [];

        // 大気レイヤーの生成
        this.atmosphereLayers = this.generateAtmosphere();
    }

    private generatePlanetType(): PlanetType {
        const types: PlanetType[] = ['rocky', 'gas-giant', 'ice-world', 'lava-world', 'desert', 'ocean-world'];
        return types[Math.floor(Math.random() * types.length)];
    }

    private generatePlanetColors(): void {
        switch (this.planetType) {
            case 'rocky':
                this.baseColor = `hsl(${Math.random() * 60 + 15}, 60%, 40%)`; // 茶色系
                this.secondaryColor = `hsl(${Math.random() * 60 + 15}, 40%, 60%)`;
                break;
            case 'gas-giant':
                this.baseColor = `hsl(${Math.random() * 60 + 200}, 70%, 50%)`; // 青系
                this.secondaryColor = `hsl(${Math.random() * 60 + 160}, 60%, 70%)`;
                this.radius *= 1.5; // ガス巨星は大きい
                break;
            case 'ice-world':
                this.baseColor = `hsl(${Math.random() * 60 + 180}, 80%, 80%)`; // 青白系
                this.secondaryColor = `hsl(${Math.random() * 60 + 200}, 60%, 90%)`;
                break;
            case 'lava-world':
                this.baseColor = `hsl(${Math.random() * 30 + 0}, 100%, 50%)`; // 赤系
                this.secondaryColor = `hsl(${Math.random() * 30 + 20}, 80%, 60%)`;
                break;
            case 'desert':
                this.baseColor = `hsl(${Math.random() * 40 + 30}, 70%, 60%)`; // 黄色系
                this.secondaryColor = `hsl(${Math.random() * 40 + 40}, 50%, 80%)`;
                break;
            case 'ocean-world':
                this.baseColor = `hsl(${Math.random() * 60 + 200}, 90%, 60%)`; // 青系
                this.secondaryColor = `hsl(${Math.random() * 60 + 160}, 70%, 80%)`;
                break;
        }
    }

    private generateCraters(): Array<{ x: number; y: number; radius: number }> {
        if (this.planetType === 'gas-giant' || this.planetType === 'ocean-world') {
            return []; // ガス巨星と海洋世界にはクレーターなし
        }
        const craterCount = Math.floor(Math.random() * 8) + 2;
        return Array(craterCount).fill(null).map(() => ({
            x: (Math.random() - 0.5) * this.radius * 1.2,
            y: (Math.random() - 0.5) * this.radius * 1.2,
            radius: Math.random() * (this.radius * 0.2) + (this.radius * 0.05)
        }));
    }

    private generateRings(): Ring[] {
        const ringCount = Math.floor(Math.random() * 4) + 2;
        const rings: Ring[] = [];
        
        for (let i = 0; i < ringCount; i++) {
            const innerRadius = this.radius * (1.3 + i * 0.3);
            const outerRadius = innerRadius + Math.random() * 15 + 8;
            rings.push({
                innerRadius,
                outerRadius,
                color: `hsl(${Math.random() * 60 + 30}, 60%, ${Math.random() * 30 + 40}%)`,
                opacity: Math.random() * 0.4 + 0.3,
                particles: Math.floor(Math.random() * 50) + 30,
                rotationSpeed: (Math.random() - 0.5) * 0.002,
                rotation: Math.random() * Math.PI * 2
            });
        }
        
        return rings;
    }

    private generateMoons(): Moon[] {
        const moonCount = Math.floor(Math.random() * 3) + 1;
        const moons: Moon[] = [];
        
        for (let i = 0; i < moonCount; i++) {
            moons.push({
                distance: this.radius * (2 + i * 0.8) + Math.random() * 20,
                size: Math.random() * 8 + 4,
                color: `hsl(${Math.random() * 60 + 200}, 40%, ${Math.random() * 40 + 50}%)`,
                angle: Math.random() * Math.PI * 2,
                orbitSpeed: (Math.random() * 0.01 + 0.005) / (i + 1),
                glowIntensity: Math.random() * 0.3 + 0.2
            });
        }
        
        return moons;
    }

    private generateAtmosphere(): AtmosphereLayer[] {
        if (this.planetType === 'rocky' || this.planetType === 'desert') {
            return []; // 岩石惑星と砂漠惑星は薄い大気
        }
        
        const layers: AtmosphereLayer[] = [];
        const layerCount = Math.floor(Math.random() * 3) + 2;
        
        for (let i = 0; i < layerCount; i++) {
            layers.push({
                radius: this.radius * (1.1 + i * 0.15),
                color: this.planetType === 'lava-world' 
                    ? `hsl(${Math.random() * 30 + 0}, 100%, 60%)`
                    : `hsl(${Math.random() * 60 + 200}, 60%, 70%)`,
                opacity: (0.4 - i * 0.1) * this.glowIntensity
            });
        }
        
        return layers;
    }

    public update(deltaTime: number): void {
        this.rotation += this.rotationSpeed * deltaTime;
        this.cloudRotation += this.cloudSpeed * deltaTime;
        
        // リングの回転更新
        this.rings.forEach(ring => {
            ring.rotation += ring.rotationSpeed * deltaTime;
        });
        
        // 衛星の軌道更新
        this.moons.forEach(moon => {
            moon.angle += moon.orbitSpeed * deltaTime;
        });
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x, this.y);

        // リングの後ろ部分を先に描画（惑星の後ろ）
        if (this.hasRings) {
            this.drawRingsBack(ctx);
        }

        // 大気層の描画
        this.drawAtmosphere(ctx);

        // 惑星本体の描画
        this.drawPlanetBody(ctx);

        // 雲層の描画（ガス巨星と海洋世界）
        if (this.planetType === 'gas-giant' || this.planetType === 'ocean-world') {
            this.drawClouds(ctx);
        }

        // リングの前部分を描画（惑星の前）
        if (this.hasRings) {
            this.drawRingsFront(ctx);
        }

        // 衛星の描画
        if (this.hasMoons) {
            this.drawMoons(ctx);
        }

        ctx.restore();
    }

    private drawPlanetBody(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.rotate(this.rotation);

        // 惑星のグラデーション
        const gradient = ctx.createRadialGradient(-this.radius * 0.3, -this.radius * 0.3, 0, 0, 0, this.radius);
        gradient.addColorStop(0, this.secondaryColor);
        gradient.addColorStop(0.7, this.baseColor);
        gradient.addColorStop(1, `hsl(0, 0%, 10%)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 表面のバリエーション
        this.drawSurfaceDetails(ctx);

        // クレーターの描画
        if (this.craters.length > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.craters.forEach(crater => {
                ctx.beginPath();
                ctx.arc(crater.x, crater.y, crater.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // クレーターのリム
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        }

        ctx.restore();
    }

    private drawSurfaceDetails(ctx: CanvasRenderingContext2D): void {
        // 惑星タイプに応じた表面詳細
        switch (this.planetType) {
            case 'lava-world':
                this.drawLavaStreams(ctx);
                break;
            case 'ice-world':
                this.drawIceCracks(ctx);
                break;
            case 'desert':
                this.drawDesertDunes(ctx);
                break;
        }
    }

    private drawLavaStreams(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = `hsl(${Math.random() * 30 + 0}, 100%, 70%)`;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            const startX = (Math.random() - 0.5) * this.radius;
            const startY = (Math.random() - 0.5) * this.radius;
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(
                startX + (Math.random() - 0.5) * 20,
                startY + (Math.random() - 0.5) * 20,
                startX + (Math.random() - 0.5) * 40,
                startY + (Math.random() - 0.5) * 40
            );
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
    }

    private drawIceCracks(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            const startX = (Math.random() - 0.5) * this.radius * 1.5;
            const startY = (Math.random() - 0.5) * this.radius * 1.5;
            const endX = startX + (Math.random() - 0.5) * 30;
            const endY = startY + (Math.random() - 0.5) * 30;
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }

    private drawDesertDunes(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            const y = (Math.random() - 0.5) * this.radius;
            const startX = -this.radius * 0.8;
            const endX = this.radius * 0.8;
            ctx.moveTo(startX, y);
            ctx.quadraticCurveTo(0, y - 10, endX, y);
            ctx.stroke();
        }
    }

    private drawClouds(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.rotate(this.cloudRotation);
        ctx.globalAlpha = 0.6;

        const cloudColor = this.planetType === 'gas-giant' 
            ? 'rgba(255, 255, 255, 0.3)'
            : 'rgba(200, 220, 255, 0.4)';

        // 雲のバンド
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = cloudColor;
            ctx.beginPath();
            const y = (i - 2) * this.radius * 0.4;
            ctx.ellipse(0, y, this.radius * 0.9, this.radius * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    private drawAtmosphere(ctx: CanvasRenderingContext2D): void {
        this.atmosphereLayers.forEach(layer => {
            ctx.save();
            ctx.globalAlpha = layer.opacity;
            
            const gradient = ctx.createRadialGradient(0, 0, this.radius, 0, 0, layer.radius);
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(0.8, layer.color);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, layer.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    private drawRingsBack(ctx: CanvasRenderingContext2D): void {
        this.rings.forEach(ring => {
            ctx.save();
            ctx.rotate(ring.rotation);
            ctx.globalAlpha = ring.opacity * 0.6; // 後ろ部分は少し暗く

            // リングの後ろ半分（下半分）のみ描画
            ctx.beginPath();
            ctx.arc(0, 0, (ring.innerRadius + ring.outerRadius) / 2, 0, Math.PI);
            ctx.strokeStyle = ring.color;
            ctx.lineWidth = ring.outerRadius - ring.innerRadius;
            ctx.stroke();

            ctx.restore();
        });
    }

    private drawRingsFront(ctx: CanvasRenderingContext2D): void {
        this.rings.forEach(ring => {
            ctx.save();
            ctx.rotate(ring.rotation);
            ctx.globalAlpha = ring.opacity;

            // リングの前半分（上半分）を描画
            ctx.beginPath();
            ctx.arc(0, 0, (ring.innerRadius + ring.outerRadius) / 2, Math.PI, Math.PI * 2);
            ctx.strokeStyle = ring.color;
            ctx.lineWidth = ring.outerRadius - ring.innerRadius;
            ctx.stroke();

            // リングのパーティクル効果
            this.drawRingParticles(ctx, ring);

            ctx.restore();
        });
    }

    private drawRingParticles(ctx: CanvasRenderingContext2D, ring: Ring): void {
        ctx.globalAlpha = ring.opacity * 0.8;
        
        for (let i = 0; i < ring.particles; i++) {
            const angle = (i / ring.particles) * Math.PI * 2;
            const radius = ring.innerRadius + Math.random() * (ring.outerRadius - ring.innerRadius);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (y > -5) { // 前半分のパーティクルのみ
                ctx.fillStyle = ring.color;
                ctx.beginPath();
                ctx.arc(x, y, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    private drawMoons(ctx: CanvasRenderingContext2D): void {
        this.moons.forEach(moon => {
            const x = Math.cos(moon.angle) * moon.distance;
            const y = Math.sin(moon.angle) * moon.distance;

            ctx.save();
            ctx.translate(x, y);

            // 衛星のグロー効果
            const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, moon.size * 2);
            glowGradient.addColorStop(0, moon.color);
            glowGradient.addColorStop(0.5, `rgba(255, 255, 255, ${moon.glowIntensity * 0.3})`);
            glowGradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(0, 0, moon.size * 2, 0, Math.PI * 2);
            ctx.fill();

            // 衛星本体
            ctx.fillStyle = moon.color;
            ctx.beginPath();
            ctx.arc(0, 0, moon.size, 0, Math.PI * 2);
            ctx.fill();

            // 衛星の影
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(moon.size * 0.3, moon.size * 0.3, moon.size * 0.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }
}
