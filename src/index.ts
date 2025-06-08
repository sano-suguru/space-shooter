import { GameObjectFactory } from './factories/GameObjectFactory';
import { Game } from './core/Game';
import { GameStateManager } from './managers/GameStateManager';
import { ScoreManager } from './managers/ScoreManager';
import { UIManager } from './managers/UIManager';
import { ProgressionUIManager } from './managers/ProgressionUIManager';
import { ReactLazyUIManager } from './managers/ReactLazyUIManager';
import { Player } from './entities/Player';
import { EventEmitter } from './events/EventEmitter';
import { getElementOrThrow } from './utils/DOMUtils';
import { RealRandomProvider, RealTimeProvider } from './providers';
import { InputManager, DOMManager, MessageManager } from './managers';
import { ProgressManager } from './progression/managers/ProgressManager';

// React関連のインポート
import React from 'react';
import { createRoot } from 'react-dom/client';
import TestComponent from './components/common/TestComponent';

function initGame(): void {
    const canvas = getElementOrThrow<HTMLCanvasElement>('gameCanvas');
    const eventEmitter = new EventEmitter();
    const randomProvider = new RealRandomProvider();
    const timeProvider = new RealTimeProvider();
    const inputManager = new InputManager(canvas);
    const domManager = new DOMManager();
    const messageManager = new MessageManager(domManager, timeProvider);
    const player = new Player(eventEmitter, inputManager, randomProvider);
    const gameObjectFactory = new GameObjectFactory(randomProvider);
    const scoreManager = new ScoreManager(eventEmitter);
    const stateManager = new GameStateManager(eventEmitter);

    // プログレッションシステムを初期化
    const progressManager = new ProgressManager(eventEmitter);
    
    // 既存UIManagerを初期化
    const levelElement = getElementOrThrow<HTMLElement>('levelValue');
    const healthElement = getElementOrThrow<HTMLElement>('healthValue');
    const healthBarElement = getElementOrThrow<HTMLElement>('healthBarFill');
    const gameOverElement = getElementOrThrow<HTMLElement>('gameOver')
    const scoreElement = getElementOrThrow<HTMLElement>('scoreValue');
    new UIManager(eventEmitter, scoreElement, levelElement, healthElement, healthBarElement, gameOverElement);

    // プログレッションUIManagerを初期化（従来版）
    new ProgressionUIManager(eventEmitter, domManager, progressManager);
    
    // React.lazy()システムを統合したUIManagerを初期化（Phase 4.4テスト）
    const reactLazyUIManager = new ReactLazyUIManager(eventEmitter, progressManager);
    console.log('🚀 ReactLazyUIManager initialized for Phase 4.4 testing');
    console.log('Active UI Manager:', reactLazyUIManager.getActiveUI());

    const game = new Game(
        canvas,
        eventEmitter,
        scoreManager,
        player,
        gameObjectFactory,
        stateManager,
        inputManager,
        randomProvider,
        domManager,
        messageManager,
        timeProvider
    );

    game.start();
}

function initReact(): void {
    // React環境テスト用コンポーネントのレンダリング
    try {
        const reactContainer = document.getElementById('react-test-container');
        if (reactContainer) {
            const root = createRoot(reactContainer);
            root.render(React.createElement(TestComponent));
            console.log('✅ React環境が正常に初期化されました');
        }
    } catch (error) {
        console.error('❌ React初期化エラー:', error);
    }
}

function initApplication(): void {
    initGame();    // 既存のゲーム初期化
    initReact();   // React環境初期化
}

document.addEventListener('DOMContentLoaded', initApplication);
