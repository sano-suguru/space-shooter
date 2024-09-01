export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}
