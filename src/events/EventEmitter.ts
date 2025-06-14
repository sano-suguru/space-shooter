export class EventEmitter<EventMap extends Record<string, (...args: any[]) => void>> {
    private listeners: Partial<{ [K in keyof EventMap]: EventMap[K][] }> = {};

    on<K extends keyof EventMap>(event: K, listener: EventMap[K]): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event]!.push(listener);
    }

    emit<K extends keyof EventMap>(event: K, ...data: Parameters<EventMap[K]>): void {
        if (!this.listeners[event]) return;
        this.listeners[event]!.forEach(listener => {
            try {
                listener(...data);
            } catch (error) {
                console.error(`Error in listener for event ${String(event)}:`, error);
            }
        });
    }
}
