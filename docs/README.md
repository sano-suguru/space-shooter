# Space Shooter プロジェクトドキュメント 📚

プロジェクトドキュメントが体系的に整理されています。以下のカテゴリから必要な情報をご確認ください。

## 📁 ドキュメント構成

### 01. プロジェクト概要 🎯
- [README.md](01-project-overview/README.md) - プロジェクト基本情報
- [CURRENT_STATUS_SUMMARY.md](01-project-overview/CURRENT_STATUS_SUMMARY.md) - 現在の開発状況

### 02. アーキテクチャ 🏗️
- [dependency-analysis.md](02-architecture/dependency-analysis.md) - 依存関係分析
- [performance-benchmarks.md](02-architecture/performance-benchmarks.md) - パフォーマンス測定結果

### 03. 開発計画 📋
- [TECH_DEBT_PLAN.md](03-planning/TECH_DEBT_PLAN.md) - 技術負債改善計画
- [react-migration-plan.md](03-planning/react-migration-plan.md) - React移行計画
- [refactoring-notes.md](03-planning/refactoring-notes.md) - リファクタリング記録
- [testability-improvement-plan.md](03-planning/testability-improvement-plan.md) - テスタビリティ改善計画

### 04. 機能設計 ⚙️
- [progression-system-design.md](04-feature-design/progression-system-design.md) - プログレッションシステム設計

### 05. UI/UX 🎨
- [ui-library-evaluation.md](05-ui-ux/ui-library-evaluation.md) - UIライブラリ評価

## 🚀 クイックスタート

### 開発者向け
1. **プロジェクト概要** → [01-project-overview](01-project-overview/)
2. **現在の状況確認** → [CURRENT_STATUS_SUMMARY.md](01-project-overview/CURRENT_STATUS_SUMMARY.md)
3. **技術仕様理解** → [02-architecture](02-architecture/)

### プロジェクト管理者向け
1. **開発計画確認** → [03-planning](03-planning/)
2. **技術負債状況** → [TECH_DEBT_PLAN.md](03-planning/TECH_DEBT_PLAN.md)
3. **進捗状況** → [CURRENT_STATUS_SUMMARY.md](01-project-overview/CURRENT_STATUS_SUMMARY.md)

### 新機能開発者向け
1. **機能設計** → [04-feature-design](04-feature-design/)
2. **アーキテクチャ理解** → [02-architecture](02-architecture/)
3. **UI/UX指針** → [05-ui-ux](05-ui-ux/)

## 📊 プロジェクト現状（概要）

- **技術負債**: ✅ 完全解消済み
- **テストカバレッジ**: 60.04%（233テスト全成功）
- **アーキテクチャ**: Clean Architecture適用完了
- **パフォーマンス**: O(n²)→O(n)最適化完了
- **開発状況**: プロダクション品質達成

## 🔍 ドキュメント検索

| 内容 | ファイル | カテゴリ |
|------|----------|----------|
| プロジェクト基本情報 | README.md | 01-project-overview |
| 開発進捗・完了状況 | CURRENT_STATUS_SUMMARY.md | 01-project-overview |
| 技術負債・改善計画 | TECH_DEBT_PLAN.md | 03-planning |
| 依存関係・循環依存 | dependency-analysis.md | 02-architecture |
| パフォーマンス改善 | performance-benchmarks.md | 02-architecture |
| プログレッション機能 | progression-system-design.md | 04-feature-design |
| React移行 | react-migration-plan.md | 03-planning |
| UIライブラリ選定 | ui-library-evaluation.md | 05-ui-ux |
| テスタビリティ改善 | testability-improvement-plan.md | 03-planning |
| リファクタリング記録 | refactoring-notes.md | 03-planning |

## 📝 ドキュメント更新ルール

1. **新規ドキュメント**: 適切なカテゴリフォルダに配置
2. **更新**: 各ドキュメント末尾に更新日記録
3. **カテゴリ横断**: 関連ドキュメントへのリンク追加
4. **索引更新**: このREADME.mdの検索表を更新

---

最終更新: 2025/06/08  
整理者: システム管理  
ドキュメント総数: 10ファイル  
カテゴリ数: 5分類
