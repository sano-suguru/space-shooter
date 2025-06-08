import React, { useState } from 'react';
import { Button, Card } from '../ui';

/**
 * React環境動作確認用のテストコンポーネント
 * Phase 2: 基本UIコンポーネントのテスト追加
 */
export const TestComponent: React.FC = () => {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('React + TypeScript 環境が正常に動作しています！');
  const [loading, setLoading] = useState(false);

  const handleIncrement = () => {
    setCount(prev => prev + 1);
    setMessage(`カウンターが ${count + 1} になりました！`);
  };

  const handleReset = () => {
    setCount(0);
    setMessage('カウンターがリセットされました');
  };

  const handleAsyncTest = async () => {
    setLoading(true);
    setMessage('非同期処理をテスト中...');
    
    // 2秒間のローディングシミュレーション
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLoading(false);
    setMessage('非同期処理が完了しました！');
  };

  return (
    <>
      {/* 既存の基本テスト */}
      <Card
        title="🚀 React 基本動作テスト"
        headerIcon="⚡"
        size="medium"
        hoverable
        style={{ margin: '10px', maxWidth: '600px' }}
      >
        <p style={{ marginBottom: '16px', color: '#ccc' }}>{message}</p>
        
        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#61dafb' }}>
            {count}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button 
            variant="primary"
            icon="➕"
            onClick={handleIncrement}
            size="medium"
          >
            カウントアップ
          </Button>
          
          <Button 
            variant="error"
            icon="🔄"
            onClick={handleReset}
            size="medium"
          >
            リセット
          </Button>
          
          <Button 
            variant="info"
            icon="⚙️"
            onClick={handleAsyncTest}
            loading={loading}
            disabled={loading}
            size="medium"
          >
            {loading ? '処理中...' : '非同期テスト'}
          </Button>
        </div>
        
        <p style={{ 
          marginTop: '20px', 
          fontSize: '12px', 
          color: '#888',
          fontStyle: 'italic',
          textAlign: 'center'
        }}>
          React {React.version} + TypeScript + Vite + pnpm
        </p>
      </Card>

      {/* UIコンポーネントテスト */}
      <Card
        title="🎨 UIコンポーネントテスト"
        headerIcon="🧩"
        size="medium"
        hoverable
        style={{ margin: '10px', maxWidth: '600px' }}
      >
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <h4 style={{ color: '#61dafb', marginBottom: '8px' }}>ボタンバリアント</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button variant="primary" size="small">Primary</Button>
              <Button variant="secondary" size="small">Secondary</Button>
              <Button variant="success" size="small">Success</Button>
              <Button variant="warning" size="small">Warning</Button>
              <Button variant="error" size="small">Error</Button>
              <Button variant="info" size="small">Info</Button>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#61dafb', marginBottom: '8px' }}>ボタンサイズ</h4>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Button variant="primary" size="small">Small</Button>
              <Button variant="primary" size="medium">Medium</Button>
              <Button variant="primary" size="large">Large</Button>
              <Button variant="primary" size="xlarge">XLarge</Button>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#61dafb', marginBottom: '8px' }}>アイコン付きボタン</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button variant="success" icon="🛒" iconPosition="left">ショップ</Button>
              <Button variant="warning" icon="🏆" iconPosition="left">実績</Button>
              <Button variant="info" icon="🎮" iconPosition="left">ゲームモード</Button>
              <Button variant="secondary" icon="📊" iconPosition="right">進行状況</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* カードバリエーションテスト */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', margin: '10px' }}>
        <Card 
          title="小さなカード" 
          headerIcon="📋"
          size="small"
          clickable
          onClick={() => alert('小さなカードがクリックされました！')}
        >
          <p style={{ fontSize: '14px', color: '#ccc' }}>
            これは小さなサイズのカードです。クリック可能です。
          </p>
        </Card>

        <Card 
          title="中くらいのカード" 
          headerIcon="📄"
          size="medium"
          shadowLevel="high"
        >
          <p style={{ fontSize: '14px', color: '#ccc' }}>
            これは中サイズのカードで、高い影効果があります。
          </p>
        </Card>

        <Card 
          title="大きなカード" 
          headerIcon="📃"
          size="large"
          hoverable
          footer={
            <Button variant="primary" size="small" fullWidth>
              アクション
            </Button>
          }
        >
          <p style={{ fontSize: '14px', color: '#ccc' }}>
            これは大きなサイズのカードで、フッターにボタンがあります。
          </p>
        </Card>
      </div>
    </>
  );
};

export default TestComponent;
