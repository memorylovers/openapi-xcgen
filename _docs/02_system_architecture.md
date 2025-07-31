# システムアーキテクチャ

## フロントエンド（アプリ）

- 使用フレームワーク：Flutter
- 対応OS：iOS / Android 両対応
- UI構築：Flutter標準Widget＋Riverpodで状態管理
- データ保存（ローカル）：SharedPreferences（設定など）

## バックエンド

- Firebase Authentication（匿名ログイン / Google / Apple対応）
- Cloud Firestore（データの保存）
- Cloudflare R2（画像アップロード）
- RevenueCat（サブスクリプション管理）

## その他

- アナリティクス：Firebase Analytics
- エラートラッキング：Firebase Crashlytics
- 多言語対応：slang（<https://pub.dev/packages/slang）を使用し、アプリ内で言語切替対応>

### 補足：APIサーバの必要性について

- 現時点の要件では Firebase（Authentication, Firestore）＋Cloudflare R2＋RevenueCat で完結可能
- 高度な集計処理や外部連携などが必要になった場合は、以下の選択肢を検討
  - Firebase Functions による処理の自動化・API化
  - 独自のAPIサーバ（Node.js / Go など）の導入による拡張性確保
- 今後のスケーラビリティや管理機能の拡張を見据えて柔軟に対応予定
