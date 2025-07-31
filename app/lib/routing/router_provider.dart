import 'package:firebase_analytics/observer.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../common/firebase/firebase_providers.dart';
import '../common/logger/logger.dart';
import '../features/_startup/presentation/widgets/startup_loading_widget.dart';
import 'my_navigator_observer.dart';
import 'router_listenable.dart';
import 'router_redirect.dart';
import 'router_routes.dart';

part 'router_provider.g.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: "route");
final fooTabKey = GlobalKey<NavigatorState>(debugLabel: "fooTab");
final settingTabKey = GlobalKey<NavigatorState>(debugLabel: "settingTab");

BuildContext? get rootContext =>
    rootNavigatorKey.currentState?.overlay?.context;

@riverpod
GoRouter router(Ref ref) {
  return GoRouter(
    navigatorKey: rootNavigatorKey,
    restorationScopeId: "restorationScopeId",
    initialLocation: initialPath,
    routes: $appRoutes,
    errorBuilder: (context, state) {
      logger.handle(state.error.toString(), StackTrace.current, {
        'name': state.name,
        'fullPath': state.fullPath,
        'pathParameters': state.pathParameters,
        'queryParameters': state.uri.queryParameters,
        'location': state.uri,
        'queryParametersAll': state.uri.queryParametersAll,
      });

      return const StartupLoadingWidget();
    },
    refreshListenable: ref.watch(refreshListenableProvider),
    redirect: ref.watch(routerRedirectProvider),
    debugLogDiagnostics: kDebugMode,
    observers: [
      MyNavigatorObserver(ref.watch(firebaseCrashlyticsProvider)),
      FirebaseAnalyticsObserver(
        analytics: ref.watch(firebaseAnalyticsProvider),
      ),
    ],
  );
}
