# TODO

## サンプルアプリ

- applicationId: com.memorylovers.myapp
- appName: My App / マイアプリ
- flavor: dev/stag/prod

## Summary

- [ ] アプリ名の設定
- [ ] applicationIdの設定
- [ ] iconの設定
- [ ] Firebaseプロジェクトの作成
- [ ] Firebaseプロジェクトの設定
- [ ] 認証
  - [ ] 匿名認証
  - [ ] Google認証
  - [ ] Apple認証
- リリース用証明書:
  - Android
  - iOS
- [ ] FCM
- [ ] AppCheck
- [ ] RevenueCat
- [ ] AdMob
- [ ] GoogleAnalytics

### 未対応

- [ ] 強制アップデート
- [ ] ローカルプッシュ通知
- [ ] FCM
- [ ] 課金
- [ ] AppCheck
- [ ] 広告

## applicationIdの設定

- Android: android/app/build.gradle.kts
  - flavorごとに`applicationId`を設定
- iOS: ios/Flutter/{dev,stag,prod}.xcconfig
  - flavorごとに`BUNDLE_IDENTIFIER`

## アプリ名の設定

- Android: android/src/main/res/{values,values-ja}/strings.xml
  - 言語ごとに`app_name`を設定
- iOS:
  - ios/Flutter/{dev,stag,prod}.xcconfig
  - ios/{en,ja}.lproj/InfoPlist.strings
  - 言語ごとに、`CFBundleDisplayName` / `CFBundleName`を設定

## iconの設定

- [IconKitchen](https://icon.kitchen/)で、dev/stag/prodのアイコンを作成
- _assets/icons配下に配置
- _scripts/setup_icons.shを実行

## Firebaseプロジェクトの作成

- stag/prodのそれぞれのプロジェクトを作成
- 以下を有効化
  - Auth(匿名)
  - Auth(Google)
  - Auth(Apple)
  - FCM
  - AppCheck
- その際、プロジェクトの公開名やサポートメールを設定
- 合わせて、オーナーメンバを追加
- 細かい設定は、後々していく

## Apple Developerの設定

- Identifiersの作成
  - AppID: com.memorylovers.myapp{.stag}
  - Sign In with Apple
    - "Sign In with Apple: App ID Configuration": Enable as a primary App ID
    - "Server-to-Server Notification Endpoint": (空欄)
  - Push Notifications
    - Broadcast Capability: チェックなし
- Service IDの作成
  - Identifier: `memorylovers-myapp-stag.firebase.app`
  - Sign in with Appleの設定
    - Primary App ID: 選択したAppID
    - Domains and Subdomains(カンマ区切り)
      - memorylovers-myapp-stag.firebaseapp.com
      - memorylovers-myapp-stag.web.app
      `<project-id>.{firebaseapp.com,web.app}`
    - Retuern URLs
      - <https://memorylovers-myapp-stag.firebaseapp.com/__/auth/handler>
      - Firebase Authに記載されているもの
    - IdentifierをFirebaseAuthに設定
- 秘密鍵の作成
  - Key Name: `MyApp Stag Firebase`
  - Apple Push Notifications service (APNs):
    - Environment: Sandbox
    - Key Restriction: Team Scoped(All Topics)
  - Sign in with Apple: Primary App IDを設定
  - 秘密鍵(`.p8`)をダウンロードし、安全な場所に保存
- Certificates(証明書)の作成(いらないかも？)
  - XCodeから作成できる
  - SettingsのAccountsタブを開く
  - 該当アカウントのManage Certificatesを開く
  - 「＋」ボタンからDistribution証明書を作成
- Profileの作成(いらないかも？)
  - iOS App / AdHoc
  - 作成したDistribution証明書を選択
- Firebase Authの設定
  - AuthenticationでAppleを有効化
  - チームID/KeyID/秘密鍵を設定
  - 秘密鍵は`cat AuthKey_<KEYID>.p8 | pbcopy`を貼り付ければOK
- Firebase Messagingの設定
  - プロジェクトの設定 / Cloud Messagingを開く
  - APNs認証キー(`AuthKey_<KEYID>.p8`)をアップロード
- XCodeでの設定
  - Capabilityを追加
  - Sign in with Apple
  - Keychain Sharing:
    - `<TEAM_ID>.<APP_NAME>.<GROUP_NAME>`
    - `lib/constant.dart`の`kKeychainGroup`にも同じものを設定する
  - Push Notifications
  - Background Modes:
    - Background fetch
    - Remote notifications

## Firebaseのconfigを生成

- `app/`直下に移動し、
- `./_scripts/setup_firebase.sh`を実行

## Firebase Remote Configでの強制アップデート

- key: `force_update_version`(in `lib/constants.dart`)
- 強制アップデートは、以下のタイミングでチェックする
  - アプリ起動時
  - ホーム画面

## Androidのアップロードキー

- [アプリに署名  |  Android Studio  |  Android Developers](https://developer.android.com/studio/publish/app-signing?hl=ja)
- Android Studioを利用して作成
