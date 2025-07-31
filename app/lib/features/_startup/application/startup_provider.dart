import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:timezone/data/latest.dart';
import 'package:timezone/timezone.dart';

import '../../../_gen/i18n/strings.g.dart';
import '../../../common/firebase/firebase_providers.dart';
import '../../../common/utils/system_providers.dart';
import '../../../constants.dart';
import '../../../flavors.dart';
import '../../_authentication/application/auth_providers.dart';
import '../../_force_update/force_update_provider.dart';

part 'startup_provider.g.dart';

/// アプリ起動時に非同期で初期化が必要な処理を行う
@riverpod
Future<void> startup(Ref ref) async {
  ref.onDispose(() {
    ref
      ..invalidate(packageInfoProvider)
      ..invalidate(deviceInfoProvider);
  });

  // setup Error Handling
  if (kIsWeb) {
    // DO NOTHING
  } else {
    // モバイルの場合はCrashlyticsに送る
    FlutterError.onError =
        ref.watch(firebaseCrashlyticsProvider).recordFlutterFatalError;
    PlatformDispatcher.instance.onError = (error, stack) {
      ref
          .watch(firebaseCrashlyticsProvider)
          .recordError(error, stack, fatal: true);
      return true;
    };
  }

  /// initialize AppCheck
  await Future.wait([
    if (kIsStag)
      FirebaseAppCheck.instance.activate(
        androidProvider: AndroidProvider.debug,
        appleProvider: AppleProvider.debug,
        webProvider: ReCaptchaEnterpriseProvider(kReCaptchaV3SiteKey),
      ),
    if (kIsProd)
      FirebaseAppCheck.instance.activate(
        androidProvider: AndroidProvider.playIntegrity,
        appleProvider: AppleProvider.appAttest,
        webProvider: ReCaptchaEnterpriseProvider(kReCaptchaV3SiteKey),
      ),
  ]);

  // timezoneの初期化
  initializeTimeZones();

  // 日付関連の初期化
  final (locale, locationName) = (
    await LocaleSettings.useDeviceLocale(),
    await FlutterTimezone.getLocalTimezone(),
  );

  // Localeの設定
  Intl.defaultLocale = locale.languageCode;
  setLocalLocation(getLocation(locationName));

  /// initialize
  await Future.wait([
    // Crashlytics: web以外、かつ、releaseモードのみ
    if (!kIsWeb)
      ref
          .watch(firebaseCrashlyticsProvider)
          .setCrashlyticsCollectionEnabled(kReleaseMode),
    // Analytics: releaseモードのみ
    ref
        .watch(firebaseAnalyticsProvider)
        .setAnalyticsCollectionEnabled(kReleaseMode),

    // SystemInfo関連
    ref.watch(packageInfoProvider.future),
    ref.watch(deviceInfoProvider.future),

    // Firebase Auth
    ref.read(firebaseAuthProvider).setSettings(userAccessGroup: kKeychainGroup),

    // ステータスバー/ナビゲーションバーを非表示
    // SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky),
  ]);

  await Future.wait([
    // 初回起動時の認証チェック処理
    ref.watch(authSignOutWhenFirstRunProvider.future),
  ]);

  final [uid] = await Future.wait([
    // authStoreが初期化できたら、起動時の認証チェック完了とする
    ref.read(authStoreProvider.future),

    // 強制アップデートのチェック開始
    ref.read(forceUpdateProvider.future),
  ]);

  if (uid == null) return;

  // TODO: 初期データの読み込み
  // await Future.wait([]);
}
