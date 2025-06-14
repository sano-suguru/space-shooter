# ESLint & Prettier 導入実装計画

## 📊 プロジェクト現状分析

### プロジェクト構成
- **言語**: TypeScript + React (v19.1.0)
- **ビルドツール**: Vite
- **テスト**: Jest
- **パッケージマネージャー**: pnpm
- **現在のlinting**: なし

### コードベース特徴
- 大規模なゲームプロジェクト（約100ファイル）
- クラスベースとモジュールベースの混在
- 複雑な依存関係とイベントシステム
- React lazy loading実装済み

## 🎯 導入する設定

### 厳格な設定方針
- TypeScript strict rules
- Airbnb style guide
- import/export順序の自動整理
- React 19対応
- アクセシビリティチェック

## 📦 必要な依存関係

### ESLint関連パッケージ
```json
{
  "devDependencies": {
    "eslint": "^8.57.0",
    "@typescript-eslint/parser": "^6.21.0",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "eslint-config-airbnb": "^19.0.4",
    "eslint-config-airbnb-typescript": "^17.1.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-import": "^2.29.1",
    "eslint-plugin-jsx-a11y": "^6.8.0"
  }
}
```

### Prettier関連パッケージ
```json
{
  "devDependencies": {
    "prettier": "^3.2.5",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3"
  }
}
```

## 🔧 設定ファイル構成

### 1. `.eslintrc.js` - メインESLint設定
```javascript
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'import',
    'jsx-a11y',
    'prettier',
  ],
  rules: {
    // TypeScript厳格ルール
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    
    // Import/Export順序
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    
    // React関連
    'react/jsx-props-no-spreading': 'off',
    'react/require-default-props': 'off',
    'react/jsx-filename-extension': [
      'error',
      { extensions: ['.tsx'] },
    ],
    
    // コード品質
    'no-console': 'warn',
    'complexity': ['error', 10],
    'max-lines-per-function': ['warn', 50],
    
    // Prettier統合
    'prettier/prettier': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
  ],
};
```

### 2. `.prettierrc.js` - Prettierフォーマット設定
```javascript
module.exports = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 80,
  endOfLine: 'lf',
  arrowParens: 'avoid',
  bracketSpacing: true,
  jsxBracketSameLine: false,
  jsxSingleQuote: true,
};
```

### 3. `.eslintignore` - ESLint除外ファイル
```
node_modules/
dist/
coverage/
*.min.js
*.d.ts
vite.config.js
jest.config.js
```

### 4. `.prettierignore` - Prettier除外ファイル
```
node_modules/
dist/
coverage/
package-lock.json
pnpm-lock.yaml
*.min.js
*.d.ts
```

## 🚀 package.json スクリプト追加

```json
{
  "scripts": {
    "lint": "eslint src tests --ext .ts,.tsx",
    "lint:fix": "eslint src tests --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\" \"tests/**/*.{ts,tsx}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx}\" \"tests/**/*.{ts,tsx}\"",
    "type-check": "tsc --noEmit",
    "quality": "npm run type-check && npm run lint && npm run format:check",
    "quality:fix": "npm run type-check && npm run lint:fix && npm run format"
  }
}
```

## 🔍 既存コードへの影響分析

### 予想される主な修正項目

#### 1. Import文の整理
- **現状**: 順序がバラバラ、グループ化なし
- **修正**: 自動整理、グループ化、アルファベット順

#### 2. 型注釈の追加
- **現状**: 一部暗黙的な型推論
- **修正**: 明示的な戻り値型、パラメータ型

#### 3. 未使用変数の削除
- **現状**: デッドコード存在の可能性
- **修正**: 未使用import、変数の削除

#### 4. コンソールログの整理
- **現状**: 開発用console.log多数
- **修正**: 警告表示、本番環境対応

#### 5. 命名規則の統一
- **現状**: 一部不統一の可能性
- **修正**: camelCase/PascalCase統一

#### 6. React要素のアクセシビリティ
- **現状**: a11y対応不十分
- **修正**: aria属性、キーボードナビゲーション

## 📈 段階的導入戦略

### Phase 1: 基本設定導入 (1-2時間)
1. **依存関係インストール**
   ```bash
   pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
   pnpm add -D eslint-config-airbnb eslint-config-airbnb-typescript
   pnpm add -D eslint-plugin-react eslint-plugin-react-hooks
   pnpm add -D eslint-plugin-import eslint-plugin-jsx-a11y
   pnpm add -D prettier eslint-config-prettier eslint-plugin-prettier
   ```

2. **設定ファイル作成**
   - `.eslintrc.js`
   - `.prettierrc.js`
   - `.eslintignore`
   - `.prettierignore`

3. **package.jsonスクリプト追加**

4. **初回linting実行**
   ```bash
   pnpm run lint
   ```

### Phase 2: 自動修正可能な項目の処理 (2-3時間)
1. **Prettier自動フォーマット**
   ```bash
   pnpm run format
   ```

2. **ESLint自動修正**
   ```bash
   pnpm run lint:fix
   ```

3. **Import文の自動整理**
   - 順序とグループ化
   - 未使用importの削除

### Phase 3: 手動修正が必要な項目 (4-6時間)
1. **型注釈の追加**
   - 関数の戻り値型
   - 複雑なオブジェクト型

2. **コード品質改善**
   - 複雑度の高い関数の分割
   - 長すぎる関数の分割

3. **React要素の改善**
   - アクセシビリティ対応
   - Hooks使用法の最適化

### Phase 4: CI/CD統合 (1時間)
1. **pre-commit hook設定**
   ```bash
   pnpm add -D husky lint-staged
   ```

2. **VSCode設定最適化**
   - `.vscode/settings.json`更新
   - 保存時自動フォーマット

## ⚠️ 注意事項とリスク

### 予想される課題
1. **大量の警告・エラー** - 初回実行時に数百件の警告予想
2. **ビルド時間増加** - linting処理による時間増加
3. **学習コスト** - チーム全体での新ルール習得
4. **既存コードの大幅修正** - 一部ファイルで大きな変更が必要

### 対策
1. **段階的修正** - 重要度順に優先順位付け
2. **チーム合意** - ルール変更時の事前相談
3. **継続的改善** - 定期的な設定見直し
4. **ドキュメント整備** - 設定理由と使用方法の明文化

## 🎯 期待される効果

### コード品質向上
- バグの早期発見
- 一貫したコードスタイル
- 保守性の向上
- チーム開発効率化

### 開発体験改善
- 自動フォーマット
- リアルタイムエラー検出
- IDE統合による快適な開発環境

## 📝 実装チェックリスト

- [ ] 依存関係インストール
- [ ] `.eslintrc.js` 作成
- [ ] `.prettierrc.js` 作成
- [ ] `.eslintignore` 作成
- [ ] `.prettierignore` 作成
- [ ] package.json スクリプト追加
- [ ] 初回linting実行
- [ ] 自動修正実行
- [ ] 手動修正項目の特定
- [ ] 重要度別修正実施
- [ ] VSCode設定更新
- [ ] チーム共有・レビュー

---

**作成日**: 2025/6/14  
**対象プロジェクト**: space-shooter  
**実装予定時間**: 8-12時間（段階的実施）