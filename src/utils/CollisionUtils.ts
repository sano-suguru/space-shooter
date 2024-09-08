import { GameObject } from "../entities/GameObject";

export function checkCollision(obj1: GameObject, obj2: GameObject): boolean {
    return obj1.getX() < obj2.getX() + obj2.getWidth() &&
        obj1.getX() + obj1.getWidth() > obj2.getX() &&
        obj1.getY() < obj2.getY() + obj2.getHeight() &&
        obj1.getY() + obj1.getHeight() > obj2.getY();
}