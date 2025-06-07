/**
 * Type-safe DOM builder utility for creating HTML elements
 * XSS防止とタイプセーフティを提供
 */

export interface ElementConfig {
    tag: string;
    className?: string;
    id?: string;
    textContent?: string;
    attributes?: Record<string, string>;
    children?: (HTMLElement | string)[];
    onClick?: (event: MouseEvent) => void;
}

export class DOMBuilder {
    /**
     * Create HTML element with type safety and XSS protection
     */
    static createElement(config: ElementConfig): HTMLElement {
        const element = document.createElement(config.tag);
        
        if (config.className) {
            element.className = config.className;
        }
        
        if (config.id) {
            element.id = config.id;
        }
        
        if (config.textContent) {
            element.textContent = config.textContent; // XSS safe
        }
        
        if (config.attributes) {
            Object.entries(config.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        
        if (config.children) {
            config.children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else {
                    element.appendChild(child);
                }
            });
        }
        
        if (config.onClick) {
            element.addEventListener('click', config.onClick);
        }
        
        return element;
    }
    
    /**
     * Create multiple elements with common parent
     */
    static createContainer(
        containerConfig: ElementConfig,
        childrenConfigs: ElementConfig[]
    ): HTMLElement {
        const container = this.createElement(containerConfig);
        
        childrenConfigs.forEach(childConfig => {
            const child = this.createElement(childConfig);
            container.appendChild(child);
        });
        
        return container;
    }
    
    /**
     * Template for common UI patterns
     */
    static createButton(
        text: string,
        className: string,
        onClick: (event: MouseEvent) => void
    ): HTMLElement {
        return this.createElement({
            tag: 'button',
            className,
            textContent: text,
            onClick
        });
    }
    
    static createStatDisplay(
        icon: string,
        label: string,
        value: string,
        className: string = 'stat-item'
    ): HTMLElement {
        return this.createElement({
            tag: 'div',
            className,
            children: [
                this.createElement({
                    tag: 'span',
                    className: 'stat-icon',
                    textContent: icon
                }),
                this.createElement({
                    tag: 'div',
                    className: 'stat-info',
                    children: [
                        this.createElement({
                            tag: 'span',
                            className: 'stat-label',
                            textContent: label
                        }),
                        this.createElement({
                            tag: 'span',
                            className: 'stat-value',
                            textContent: value
                        })
                    ]
                })
            ]
        });
    }
}

/**
 * Helper functions for common patterns
 */
export const DOM = {
    div: (className?: string, children?: (HTMLElement | string)[]) => 
        DOMBuilder.createElement({ tag: 'div', className, children }),
    
    span: (className?: string, text?: string) => 
        DOMBuilder.createElement({ tag: 'span', className, textContent: text }),
    
    button: (className: string, text: string, onClick: (e: MouseEvent) => void) =>
        DOMBuilder.createButton(text, className, onClick),
    
    h2: (text: string, className?: string) =>
        DOMBuilder.createElement({ tag: 'h2', className, textContent: text }),
    
    h3: (text: string, className?: string) =>
        DOMBuilder.createElement({ tag: 'h3', className, textContent: text }),
    
    p: (text: string, className?: string) =>
        DOMBuilder.createElement({ tag: 'p', className, textContent: text })
};
