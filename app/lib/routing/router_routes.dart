import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/_authentication/presentation/login_page.dart';
import '../features/_payment/presentation/payment_page.dart';
import '../features/_startup/presentation/startup_page.dart';
import '../features/account/presentation/settings_page.dart';
import '../features/foo/presentation/foo_page.dart';
import '../features/home/presentation/home_page_layout.dart';
import 'router_provider.dart';

part 'router_routes.g.dart';

/// 初期表示の画面
final initialPath = StartupPageRoute.path;

/// 未ログインの画面(ログイン画面)
final loginPath = LoginPageRoute.path;

/// ログイン済みの画面
final homePath = FooPageRoute.path;

/// /startup: Startup
@TypedGoRoute<StartupPageRoute>(path: StartupPageRoute.path)
class StartupPageRoute extends GoRouteData {
  const StartupPageRoute();

  static const path = "/";

  @override
  Page<void> buildPage(BuildContext context, GoRouterState state) {
    return MaterialPage(child: StartupPage(), name: path);
  }
}

/// /login: ログイン画面
@TypedGoRoute<LoginPageRoute>(path: LoginPageRoute.path)
class LoginPageRoute extends GoRouteData {
  const LoginPageRoute();

  static const path = "/login";

  @override
  Page<void> buildPage(BuildContext context, GoRouterState state) {
    return MaterialPage(child: LoginPage(), name: path);
  }
}

/// ホーム画面のレイアウト
@TypedStatefulShellRoute<HomePageLaytoutRoute>(
  branches: [
    TypedStatefulShellBranch<FooPageBranch>(
      routes: [TypedGoRoute<FooPageRoute>(path: FooPageRoute.path)],
    ),
    // TypedStatefulShellBranch<MemoListPageBranch>(
    //   routes: [TypedGoRoute<MemoListPageRoute>(path: MemoListPageRoute.path)],
    // ),
    TypedStatefulShellBranch<SettingsPageBranch>(
      routes: [
        TypedGoRoute<SettingsPageRoute>(
          path: SettingsPageRoute.path,
          routes: [TypedGoRoute<PaymentPageRoute>(path: PaymentPageRoute.path)],
        ),
      ],
    ),
  ],
)
class HomePageLaytoutRoute extends StatefulShellRouteData {
  const HomePageLaytoutRoute();

  static GlobalKey<NavigatorState> $parentNavigatorKey = rootNavigatorKey;
  static const String $restorationScopeId = 'restorationScopeId';

  @override
  Widget builder(
    BuildContext context,
    GoRouterState state,
    StatefulNavigationShell navigationShell,
  ) {
    return HomePageLayout(navigationShell: navigationShell);
  }
}

/// /foo: サンプル画面
class FooPageRoute extends GoRouteData {
  const FooPageRoute();

  static const path = '/foo';

  @override
  Page<void> buildPage(BuildContext context, GoRouterState state) {
    return const MaterialPage(child: FooPage(), name: path);
  }
}

class FooPageBranch extends StatefulShellBranchData {
  static final GlobalKey<NavigatorState> $navigatorKey = fooTabKey;
  static const String $restorationScopeId = 'restorationScopeId';
}

/// /settings: 設定画面
class SettingsPageRoute extends GoRouteData {
  const SettingsPageRoute();

  static const path = '/settings';

  @override
  Page<void> buildPage(BuildContext context, GoRouterState state) {
    return const MaterialPage(child: SettingsPage(), name: path);
  }
}

class SettingsPageBranch extends StatefulShellBranchData {
  static final GlobalKey<NavigatorState> $navigatorKey = settingTabKey;
  static const String $restorationScopeId = 'restorationScopeId';
}

/// /settings/payment: 課金画面
class PaymentPageRoute extends GoRouteData {
  const PaymentPageRoute();

  static const path = 'payment';

  @override
  Page<void> buildPage(BuildContext context, GoRouterState state) {
    return const MaterialPage(child: PaymentPage(), name: path);
  }
}
