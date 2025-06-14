import { Drawable } from '../types/Drawable';
import { Updateable } from '../types/Updateable';

export abstract class GameObject implements Drawable, Updateable {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number
  ) {}

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
