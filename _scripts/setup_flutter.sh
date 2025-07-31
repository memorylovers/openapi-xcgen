#!/bin/bash

# 使用するFlutterのバージョン: fvm releases
FLUTTER_VERSION="3.29.3"
# 会社名/組織名
ORGANIZATION="com.memorylovers"
# アプリ名
PROJECT_NAME="myapp"
# 対象のプラットフォーム: android,ios,web,macos,linux,windows
PLATFORMS="android,ios,web"
# 出力先フォルダ
OUTPUT_DIR="app"

# スクリプトがエラーで停止するように設定
set -e

# Flutter SDKをインストール
echo "** install Flutter SDK($FLUTTER_VERSION)..."
fvm install $FLUTTER_VERSION

# Flutterのバージョンを固定
echo "** fvm use $FLUTTER_VERSION --force"
fvm use $FLUTTER_VERSION --force


if ! [ -e "${OUTPUT_DIR}" ]; then
  # Flutter環境を確認
  echo "** Flutter環境を確認(flutter doctor)..."
  fvm flutter doctor

  # Flutterプロジェクトの作成
  echo "** Flutterプロジェクトの作成"
  fvm flutter create ${OUTPUT_DIR} \
    --org "${ORGANIZATION}" \
    --project-name "${PROJECT_NAME}" \
    --platforms "${PLATFORMS}" \
    -e
fi

exit 0