import 'flavors.dart';

/// Firebase Remote Configの強制アップロードversionのkey
const kFirebaseConfigForceUpdateVersionKey = "force_update_version";

/// Firebase AppCheck
// TODO: setup kReCaptchaV3SiteKey
const kReCaptchaV3SiteKey = "";

/// Firebase Auth
// TODO: setup kKeychainGroup
String kKeychainGroup = switch (kFlavor) {
  // <TEAM_ID>.<BUNDLE_ID>.<GROUP_NAME>
  AppEnv.dev => "95RXYMCL35.com.memorylovers.myapp.dev.keychain-group",
  AppEnv.stag => "95RXYMCL35.com.memorylovers.myapp.stag.keychain-group",
  AppEnv.prod => "95RXYMCL35.com.memorylovers.myapp.keychain-group",
};

/// RevenuCatのOffering ID
const kRevenueCatOfferingId = "default";

/// デフォルトの並び順
const kDescending = true;

/// デフォルトのページサイズ
const kPageSize = 20;

/// [talkerRiverpodObserver]で表示するProvder名の一覧
const kLoggerTargetProviders = {"startupProvider", "routerRedirectProvider"};

/// AdMob用のテストデバイスID一覧
const kTestDeviceIdentifiers = <String>[
  // TODO: setup test deviceIds
];
