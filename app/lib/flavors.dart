import 'dart:io';

import 'package:flutter/services.dart';

import '_gen/firebase/firebase_options_dev.dart' as dev;
import '_gen/firebase/firebase_options_prod.dart' as prod;
import '_gen/firebase/firebase_options_stag.dart' as stag;

enum AppEnv { dev, stag, prod }

final kFlavor = switch (appFlavor) {
  'stag' => AppEnv.stag,
  'prod' => AppEnv.prod,
  _ => AppEnv.dev,
};

final kIsDev = kFlavor == AppEnv.dev;
final kIsStag = kFlavor == AppEnv.stag;
final kIsProd = kFlavor == AppEnv.prod;

final kFirebaseConfig = switch (kFlavor) {
  AppEnv.prod => prod.DefaultFirebaseOptions.currentPlatform,
  AppEnv.stag => stag.DefaultFirebaseOptions.currentPlatform,
  AppEnv.dev => dev.DefaultFirebaseOptions.currentPlatform,
};

/// 画面上部のバナー広告
String get kAdMobBannerTop {
  switch (kFlavor) {
    case AppEnv.dev:
    case AppEnv.stag:
      if (Platform.isAndroid) return "ca-app-pub-3940256099942544/6300978111";
      if (Platform.isIOS) return "ca-app-pub-3940256099942544/2934735716";
    case AppEnv.prod:
      // TODO: setup kAdMobBannerTop prod
      if (Platform.isAndroid) return "TODO";
      if (Platform.isIOS) return "TODO";
  }
  throw Error();
}

/// 結果画面のバナー広告
String get kAdMobBannerResult {
  switch (kFlavor) {
    case AppEnv.dev:
    case AppEnv.stag:
      if (Platform.isAndroid) return "ca-app-pub-3940256099942544/6300978111";
      if (Platform.isIOS) return "ca-app-pub-3940256099942544/2934735716";
    case AppEnv.prod:
      // TODO: setup kAdMobBannerResult prod
      if (Platform.isAndroid) return "TODO";
      if (Platform.isIOS) return "TODO";
  }
  throw Error();
}

/// リワード広告
String get kAdMobReward {
  switch (kFlavor) {
    case AppEnv.dev:
    case AppEnv.stag:
      if (Platform.isAndroid) return "ca-app-pub-3940256099942544/5224354917";
      if (Platform.isIOS) return "ca-app-pub-3940256099942544/1712485313";
    case AppEnv.prod:
      // TODO: setup kAdMobReward prod
      if (Platform.isAndroid) return "TODO";
      if (Platform.isIOS) return "TODO";
  }
  throw Error();
}

/// RevenueCat APIKey
String get kRevenueCatApiKey {
  switch (kFlavor) {
    case AppEnv.dev:
    case AppEnv.stag:
    case AppEnv.prod:
      // TODO: setup kRevenueCatApiKey prod
      if (Platform.isAndroid) return "TODO";
      if (Platform.isIOS) return "TODO";
  }
  throw Error();
}
