/**
 * UI Components Index
 * Space Shooter用基本UIコンポーネントのエクスポート
 */

// 基本的な型定義のみ残す
export interface NotificationData {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}
