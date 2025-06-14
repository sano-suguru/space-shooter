/**
 * DOM操作の抽象化インターフェース
 * テスト時にDOM操作をモック可能にし、決定論的テストを実現
 */
export interface IDOMManager {
  // 要素取得
  getElementById(id: string): HTMLElement | null;
  querySelector(selector: string): HTMLElement | null;

  // 要素作成・操作
  createElement(tagName: string): HTMLElement;
  appendChild(parent: HTMLElement | Document, child: HTMLElement): void;
  removeChild(parent: HTMLElement | Document, child: HTMLElement): void;

  // 内容・スタイル操作
  setTextContent(element: HTMLElement, text: string): void;
  getTextContent(element: HTMLElement): string;

  // CSS クラス操作
  addClass(element: HTMLElement, className: string): void;
  removeClass(element: HTMLElement, className: string): void;
  hasClass(element: HTMLElement, className: string): boolean;

  // スタイル操作
  setStyle(element: HTMLElement, property: string, value: string): void;
  getStyle(element: HTMLElement, property: string): string;

  // 属性操作
  setAttribute(element: HTMLElement, name: string, value: string): void;
  getAttribute(element: HTMLElement, name: string): string | null;

  // イベント操作
  addEventListener(
    element: HTMLElement | Document,
    type: string,
    listener: EventListener
  ): void;
  removeEventListener(
    element: HTMLElement | Document,
    type: string,
    listener: EventListener
  ): void;

  // DOM ツリー操作
  contains(parent: HTMLElement | Document, child: HTMLElement): boolean;

  // 特殊操作（ゲーム用）
  getBody(): HTMLElement;
  createCanvas(): HTMLCanvasElement;

  // リソース管理
  dispose(): void;
}
