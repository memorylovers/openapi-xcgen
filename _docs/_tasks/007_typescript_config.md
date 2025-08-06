# タスク007: TypeScript設定

## 概要

モノレポ全体のTypeScript設定を整備し、パッケージ間の型定義を適切に管理します。

## ステータス

- 状態: 完了
- 完了日: 2025-08-06
- 備考: 最小限の設定更新のみ実施。既存の設定が適切だったため大きな変更は不要

## 前提条件

- すべてのパッケージが作成されていること
- TypeScript 5.8.3がインストールされていること

## 実行手順

### 1. ルートのtsconfig.base.json作成

プロジェクトルートに`tsconfig.base.json`を作成：

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "exclude": [
    "node_modules",
    "dist",
    "build",
    "coverage"
  ]
}
```

### 2. ルートのtsconfig.json更新

既存の`tsconfig.json`を更新：

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "composite": true
  },
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/generator-typescript" },
    { "path": "./packages/generator-dart" }
  ]
}
```

### 3. 各パッケージのtsconfig.json確認

各パッケージのtsconfig.jsonが以下の形式になっていることを確認：

`packages/core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 4. TypeScript Project References設定

プロジェクト参照を使用してビルド順序を管理：

`packages/generator-typescript/tsconfig.json`を更新：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"],
  "references": [
    { "path": "../core" }
  ]
}
```

`packages/generator-dart/tsconfig.json`を更新：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"],
  "references": [
    { "path": "../core" }
  ]
}
```

### 5. 型定義用ファイル（オプション）

共通の型定義が必要な場合、`types/`ディレクトリを作成：

`types/global.d.ts`:

```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
    }
  }
}

export {};
```

### 6. VSCode設定（推奨）

`.vscode/settings.json`を作成：

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "files.associations": {
    "*.mts": "typescript",
    "*.cts": "typescript"
  }
}
```

### 7. ビルドスクリプトの追加

ルートの`package.json`に以下のスクリプトを追加：

```json
{
  "scripts": {
    "typecheck:all": "tsc --build",
    "typecheck:clean": "tsc --build --clean",
    "typecheck:watch": "tsc --build --watch"
  }
}
```

### 8. 検証

以下のコマンドで設定が正しく機能することを確認：

```bash
# 全体の型チェック
pnpm typecheck:all

# 個別パッケージの型チェック
cd packages/core && pnpm typecheck

# プロジェクト参照のクリーンビルド
pnpm typecheck:clean && pnpm typecheck:all
```

## トラブルシューティング

### ビルド順序の問題

1. Project Referencesが正しく設定されているか確認
2. 循環参照がないか確認
3. `tsc --build --verbose`で詳細ログを確認

## 次のステップ

このタスクが完了したら、次は`008_dev_tools.md`に進んで開発ツールを設定します。

## 注意事項

- `composite: true`はProject Referencesに必要
- strictモードを有効にして型安全性を確保
- ESM/CJS両対応のため、moduleはNodeNextを使用
- パッケージ間の参照はworkspace:*プロトコルとProject Referencesで解決
