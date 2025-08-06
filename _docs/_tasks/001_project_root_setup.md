# タスク001: プロジェクトルート設定

## 概要

openapi-xcgenプロジェクトをモノレポ構造に変換するための基本設定を行います。

## ステータス

- 状態: 完了
- 完了日: 2025-08-06

## 前提条件

- Node.js v20またはv22がインストールされていること
- pnpm v10.13.1がインストールされていること

## 実行手順

### 1. package.jsonの更新

現在の`package.json`を以下のように更新します：

```json
{
  "name": "openapi-xcgen",
  "version": "0.0.0",
  "description": "Cross-language code generator for OpenAPI specifications",
  "author": "Memory Lovers, LLC<https://github.com/memorylovers>",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "typecheck": "turbo typecheck",
    "lint": "turbo lint",
    "format": "turbo format"
  },
  "devDependencies": {
    "turbo": "^2.3.3",
    "@types/node": "^24.1.0",
    "typescript": "^5.8.3",
    "prettier": "^3.6.2",
    "markdownlint-cli2": "^0.18.1"
  },
  "packageManager": "pnpm@10.13.1",
  "engines": {
    "node": ">=20"
  },
  "license": "MIT",
  "funding": "https://github.com/sponsors/memory-lovers",
  "homepage": "https://github.com/memorylovers/openapi-xcgen",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/memorylovers/openapi-xcgen.git"
  },
  "bugs": {
    "url": "https://github.com/memorylovers/openapi-xcgen/issues"
  },
  "keywords": [
    "openapi",
    "codegen",
    "typescript",
    "dart",
    "generator",
    "cross-language"
  ]
}
```

### 2. pnpm-workspace.yamlの作成

プロジェクトルートに`pnpm-workspace.yaml`を作成：

```yaml
packages:
  - "packages/*"
```

### 3. .gitignoreの更新

以下の内容を`.gitignore`に追加（まだ存在しない場合）：

```
# Turbo
.turbo

# Build outputs
dist/
*.tsbuildinfo

# Dependencies
node_modules/

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/*
!.vscode/extensions.json
.idea/
*.swp
*.swo

# Environment
.env
.env.local
.env.*.local

# Coverage
coverage/
.nyc_output/
```

### 4. 依存関係のインストール

```bash
# 既存のnode_modulesを削除
rm -rf node_modules
rm -f pnpm-lock.yaml

# 依存関係を再インストール
pnpm install
```

### 5. 既存ファイルの整理

統合CLIは作成しないため、既存のCLI関連ファイルは削除可能：

- src/ディレクトリは削除（または別途保管）
- bin/ディレクトリは削除（または別途保管）
- build.config.mtsは削除（または別途保管）

※これらのファイルの一部の機能はpackages/coreに移植済み

## 検証

以下のコマンドで設定が正しく行われたことを確認：

```bash
# pnpm workspaceが認識されているか確認
pnpm ls -r

# turboがインストールされているか確認
pnpm turbo --version
```

## 次のステップ

このタスクが完了したら、次は`002_turbo_setup.md`に進んでTurboの設定を行います。

## 注意事項

- `private: true`を設定することで、誤ってルートパッケージを公開することを防ぎます
- 既存のファイルは段階的に移動するため、この時点では削除しません
- node_modulesとpnpm-lock.yamlは再生成されます
