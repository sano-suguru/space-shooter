import { IDOMManager } from "../interfaces/IDOMManager";

/**
 * モック要素クラス
 * テスト用のHTMLElement代替
 */
export class MockElement {
  public tagName: string;
  public id: string = '';
  public className: string = '';
  public textContent: string = '';
  public style: { [key: string]: string } = {};
  public attributes: { [key: string]: string } = {};
  public children: MockElement[] = [];
  public parent: MockElement | null = null;
  public classList: {
    add: (className: string) => void;
    remove: (className: string) => void;
    contains: (className: string) => boolean;
  };

  constructor(tagName: string) {
    this.tagName = tagName.toLowerCase();
    this.classList = {
      add: (className: string) => {
        const classes = this.className.split(' ').filter(c => c);
        if (!classes.includes(className)) {
          classes.push(className);
          this.className = classes.join(' ');
        }
      },
      remove: (className: string) => {
        const classes = this.className.split(' ').filter(c => c && c !== className);
        this.className = classes.join(' ');
      },
      contains: (className: string) => {
        return this.className.split(' ').includes(className);
      }
    };
  }

  public setAttribute(name: string, value: string): void {
    this.attributes[name] = value;
    if (name === 'id') this.id = value;
    if (name === 'class') this.className = value;
  }

  public getAttribute(name: string): string | null {
    return this.attributes[name] || null;
  }

  public appendChild(child: MockElement): void {
    this.children.push(child);
    child.parent = this;
  }

  public removeChild(child: MockElement): void {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
      child.parent = null;
    }
  }

  public contains(element: MockElement): boolean {
    if (element === this) return true;
    return this.children.some(child => child.contains(element));
  }
}

/**
 * テスト用のDOM管理クラス
 * DOM操作をモック化し、決定論的テストを可能にする
 */
export class MockDOMManager implements IDOMManager {
  private elements = new Map<string, MockElement>();
  private body: MockElement;
  private eventListeners = new Map<string, EventListener[]>();

  constructor() {
    this.body = new MockElement('body');
    this.body.id = 'body';
    this.elements.set('body', this.body);
  }

  // 要素取得
  public getElementById(id: string): HTMLElement | null {
    const element = this.elements.get(id);
    return element ? (element as any) : null;
  }

  public querySelector(selector: string): HTMLElement | null {
    // 簡単なセレクタサポート（id, class, tagName）
    if (selector.startsWith('#')) {
      return this.getElementById(selector.substring(1));
    }
    
    if (selector.startsWith('.')) {
      const className = selector.substring(1);
      for (const element of this.elements.values()) {
        if (element.classList.contains(className)) {
          return element as any;
        }
      }
    }

    // tagName での検索
    for (const element of this.elements.values()) {
      if (element.tagName === selector.toLowerCase()) {
        return element as any;
      }
    }

    return null;
  }

  // 要素作成・操作
  public createElement(tagName: string): HTMLElement {
    const element = new MockElement(tagName);
    return element as any;
  }

  public appendChild(parent: HTMLElement | Document, child: HTMLElement): void {
    const parentElement = parent === document ? this.body : (parent as any);
    const childElement = child as any;
    
    parentElement.appendChild(childElement);
  }

  public removeChild(parent: HTMLElement | Document, child: HTMLElement): void {
    const parentElement = parent === document ? this.body : (parent as any);
    const childElement = child as any;
    
    parentElement.removeChild(childElement);
  }

  // 内容・スタイル操作
  public setTextContent(element: HTMLElement, text: string): void {
    (element as any).textContent = text;
  }

  public getTextContent(element: HTMLElement): string {
    return (element as any).textContent || '';
  }

  // CSS クラス操作
  public addClass(element: HTMLElement, className: string): void {
    (element as any).classList.add(className);
  }

  public removeClass(element: HTMLElement, className: string): void {
    (element as any).classList.remove(className);
  }

  public hasClass(element: HTMLElement, className: string): boolean {
    return (element as any).classList.contains(className);
  }

  // スタイル操作
  public setStyle(element: HTMLElement, property: string, value: string): void {
    (element as any).style[property] = value;
  }

  public getStyle(element: HTMLElement, property: string): string {
    return (element as any).style[property] || '';
  }

  // 属性操作
  public setAttribute(element: HTMLElement, name: string, value: string): void {
    (element as any).setAttribute(name, value);
    
    // IDが設定された場合、要素マップに登録
    if (name === 'id') {
      this.elements.set(value, element as any);
    }
  }

  public getAttribute(element: HTMLElement, name: string): string | null {
    return (element as any).getAttribute(name);
  }

  // イベント操作
  public addEventListener(element: HTMLElement | Document, type: string, listener: EventListener): void {
    const key = `${element === document ? 'document' : (element as any).id || 'unknown'}_${type}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    this.eventListeners.get(key)!.push(listener);
  }

  public removeEventListener(element: HTMLElement | Document, type: string, listener: EventListener): void {
    const key = `${element === document ? 'document' : (element as any).id || 'unknown'}_${type}`;
    const listeners = this.eventListeners.get(key);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // DOM ツリー操作
  public contains(parent: HTMLElement | Document, child: HTMLElement): boolean {
    const parentElement = parent === document ? this.body : (parent as any);
    return parentElement.contains(child);
  }

  // 特殊操作（ゲーム用）
  public getBody(): HTMLElement {
    return this.body as any;
  }

  public createCanvas(): HTMLCanvasElement {
    const canvas = new MockElement('canvas');
    // Canvas特有のプロパティを追加
    (canvas as any).width = 400;
    (canvas as any).height = 600;
    (canvas as any).getContext = jest.fn(() => ({
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      clearRect: jest.fn(),
      // ... 他のCanvas APIメソッド
    }));
    return canvas as any;
  }

  // リソース管理
  public dispose(): void {
    this.elements.clear();
    this.eventListeners.clear();
  }

  // テスト用ヘルパーメソッド

  /**
   * 要素を手動で登録（テスト初期化用）
   */
  public registerElement(id: string, element: MockElement): void {
    element.id = id;
    this.elements.set(id, element);
  }

  /**
   * 登録されている要素一覧を取得（デバッグ用）
   */
  public getRegisteredElements(): Map<string, MockElement> {
    return new Map(this.elements);
  }

  /**
   * イベントリスナーの数を取得（テスト用）
   */
  public getEventListenerCount(): number {
    let count = 0;
    for (const listeners of this.eventListeners.values()) {
      count += listeners.length;
    }
    return count;
  }

  /**
   * 特定のイベントタイプのリスナー数を取得
   */
  public getEventListenerCountByType(elementId: string, type: string): number {
    const key = `${elementId}_${type}`;
    const listeners = this.eventListeners.get(key);
    return listeners ? listeners.length : 0;
  }

  /**
   * 状態をリセット（テスト間のクリーンアップ用）
   */
  public reset(): void {
    this.elements.clear();
    this.eventListeners.clear();
    this.body = new MockElement('body');
    this.body.id = 'body';
    this.elements.set('body', this.body);
  }
}
