import { Drawable } from "../interfaces/Drawable";
import { Updateable } from "../interfaces/Updateable";

export abstract class GameObject implements Drawable, Updateable {
    constructor(
        protected x: number,
        protected y: number,
        protected width: number,
        protected height: number
    ) { }

    abstract update(deltaTime: number): void;
    abstract draw(ctx: CanvasRenderingContext2D): void;

    public getX(): number {
        return this.x;
    }

    public getY(): number {
        return this.y;
    }

    public getWidth(): number {
        return this.width;
    }

    public getHeight(): number {
        return this.height;
    }
}