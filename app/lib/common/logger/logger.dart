import 'package:flutter/foundation.dart';
import '../../constants.dart';
import 'package:talker_flutter/talker_flutter.dart';
import 'package:talker_riverpod_logger/talker_riverpod_logger.dart';

import '../../flavors.dart';
import 'crashlytics_talker_observer.dart';

/// logger in app
final logger = TalkerFlutter.init(
  observer: () {
    // Releaseモードのみ有効
    if (!kReleaseMode) return null;

    // Web版は、Crashlyticsが未対応
    if (kIsWeb) return null;

    return CrashlyticsTalkerObserver();
  }(),
);

/// go_router用のTalkerObserver
final talkerGoRouterObserver = TalkerRouteObserver(logger);

/// Riverpod用のTalkerObserver
final talkerRiverpodObserver = TalkerRiverpodObserver(
  talker: logger,
  settings: TalkerRiverpodLoggerSettings(
    providerFilter: (provider) {
      if (kIsProd) return false;

      // 対象のProviderのみ表示
      return kLoggerTargetProviders.contains(provider.name);
    },
  ),
);
