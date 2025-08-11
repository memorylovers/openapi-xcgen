# タスク002: Turbo設定

## 概要

Turboを使用してモノレポのビルド、テスト、リントなどのタスクを効率的に管理します。

## ステータス

- 状態: 完了
- 完了日: 2025-08-06

## 前提条件

- タスク001（プロジェクトルート設定）が完了していること
- turboがdevDependenciesにインストールされていること

## 実行手順

### 1. turbo.jsonの作成

プロジェクトルートに`turbo.json`を作成：

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"],
      "cache": true
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "typecheck": {
      "dependsOn": ["^typecheck"],
      "cache": true
    },
    "lint": {
      "dependsOn": ["^lint"],
      "cache": true
    },
    "format": {
      "cache": false
    },
    "clean": {
      "cache": false
    }
  }
}
```

### 2. .turboディレクトリの設定

Turboのキャッシュディレクトリを.gitignoreに追加（タスク001で既に追加済みの場合はスキップ）：

```bash
echo ".turbo" >> .gitignore
```

### 3. パイプライン説明

各タスクの説明：

- **build**: パッケージのビルド
  - `^build`: 依存パッケージのビルドを先に実行
  - 出力はdistディレクトリ
  - キャッシュ有効

- **dev**: 開発サーバー
  - `persistent`: 長時間実行されるタスク
  - キャッシュ無効（常に最新の状態で実行）

- **test**: テスト実行
  - buildタスクに依存
  - カバレッジレポートを出力
  - キャッシュ有効

- **typecheck**: TypeScript型チェック
  - 依存パッケージの型チェックも実行
  - キャッシュ有効

- **lint**: Lintチェック
  - 依存パッケージのLintも実行
  - キャッシュ有効

- **format**: コードフォーマット
  - キャッシュ無効（常に実行）

### 4. 環境変数の設定（オプション）

必要に応じて`.env`ファイルを作成：

```bash
# .env
TURBO_TEAM=your-team-name
TURBO_TOKEN=your-remote-cache-token
```

### 5. 動作確認

以下のコマンドでTurboが正しく設定されているか確認：

```bash
# Turboのバージョン確認
pnpm turbo --version

# ドライラン（実行せずにタスクグラフを表示）
pnpm turbo build --dry-run

# タスクグラフの可視化
pnpm turbo build --graph
```

### 6. リモートキャッシュ設定（オプション）

チーム開発の場合、Vercelのリモートキャッシュを設定：

```bash
# Turbo CLIでログイン
pnpm turbo login

# リンク設定
pnpm turbo link
```

## トラブルシューティング

### キャッシュが効かない場合

```bash
# キャッシュをクリア
pnpm turbo clean
```

### 依存関係の問題

```bash
# 依存グラフを確認
pnpm turbo build --graph
```

## 次のステップ

このタスクが完了したら、次は`003_core_package.md`に進んでcoreパッケージを作成します。

## 注意事項

- Turboは自動的にパッケージ間の依存関係を検出します
- `package.json`の`name`フィールドを正しく設定することが重要です
- キャッシュは`.turbo`ディレクトリに保存されます
