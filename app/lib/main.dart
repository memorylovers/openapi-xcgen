import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '_gen/i18n/strings.g.dart';
import 'common/logger/logger.dart';
import 'common/theme/app_theme.dart';
import 'components/debug/flavor_banner.dart';
import 'features/_ advertisement/ad_consent_helper.dart';
import 'flavors.dart';
import 'routing/router_provider.dart';

FutureOr<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Firebaseの初期化
  await Firebase.initializeApp(options: kFirebaseConfig);

  // runApp
  runApp(
    ProviderScope(observers: [talkerRiverpodObserver], child: const MainApp()),
  );
  return null;
}

class MainApp extends HookConsumerWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    // GDPR/ATTのチェック
    useEffect(() {
      // GDPR/ATTのチェック
      checkAndRequestAdConsent(
        debugSettings: kIsDev ? consentDebugSettings : null,
      );
      return null;
    }, const []);

    return FlavorBanner(
      child: MaterialApp.router(
        theme: appTheme,
        debugShowCheckedModeBanner: kDebugMode,
        supportedLocales: AppLocaleUtils.supportedLocales,
        localizationsDelegates: [
          GlobalCupertinoLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          // RelativeTimeLocalizations.delegate,
        ],
        routerConfig: router,
        builder: (_, child) => child!,
      ),
    );
  }

  void checkAndRequestAdConsent({required debugSettings}) {}
}
