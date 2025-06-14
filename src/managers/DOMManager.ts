import { IDOMManager } from '../interfaces/IDOMManager';

/**
 * 本番環境用のDOM管理クラス
 * 実際のDOM APIを使用してDOM操作を実行
 */
export class DOMManager implements IDOMManager {
  // 要素取得
  public getElementById(id: string): HTMLElement | null {
    return document.getElementById(id);
  }

  public querySelector(selector: string): HTMLElement | null {
    return document.querySelector(selector);
  }

  // 要素作成・操作
  public createElement(tagName: string): HTMLElement {
    return document.createElement(tagName);
  }

  public appendChild(parent: HTMLElement | Document, child: HTMLElement): void {
    parent.appendChild(child);
  }

  public removeChild(parent: HTMLElement | Document, child: HTMLElement): void {
    parent.removeChild(child);
  }

  // 内容・スタイル操作
  public setTextContent(element: HTMLElement, text: string): void {
    element.textContent = text;
  }

  public getTextContent(element: HTMLElement): string {
    return element.textContent || '';
  }

  // CSS クラス操作
  public addClass(element: HTMLElement, className: string): void {
    element.classList.add(className);
  }

  public removeClass(element: HTMLElement, className: string): void {
    element.classList.remove(className);
  }

  public hasClass(element: HTMLElement, className: string): boolean {
    return element.classList.contains(className);
  }

  // スタイル操作
  public setStyle(element: HTMLElement, property: string, value: string): void {
    (element.style as any)[property] = value;
  }

  public getStyle(element: HTMLElement, property: string): string {
    return getComputedStyle(element).getPropertyValue(property);
  }

  // 属性操作
  public setAttribute(element: HTMLElement, name: string, value: string): void {
    element.setAttribute(name, value);
  }

  public getAttribute(element: HTMLElement, name: string): string | null {
    return element.getAttribute(name);
  }

  // イベント操作
  public addEventListener(
    element: HTMLElement | Document,
    type: string,
    listener: EventListener
  ): void {
    element.addEventListener(type, listener);
  }

  public removeEventListener(
    element: HTMLElement | Document,
    type: string,
    listener: EventListener
  ): void {
    element.removeEventListener(type, listener);
  }

  // DOM ツリー操作
  public contains(parent: HTMLElement | Document, child: HTMLElement): boolean {
    if (parent === document) {
      return document.contains(child);
    }
    return (parent as HTMLElement).contains(child);
  }

  // 特殊操作（ゲーム用）
  public getBody(): HTMLElement {
    return document.body;
  }

  public createCanvas(): HTMLCanvasElement {
    return document.createElement('canvas') as HTMLCanvasElement;
  }

  // リソース管理
  public dispose(): void {
    // 本番環境では特に何もしない
    // 必要に応じて登録されたイベントリスナーのクリーンアップなどを行う
  }
}
