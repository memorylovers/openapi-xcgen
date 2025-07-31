// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'router_routes.dart';

// **************************************************************************
// GoRouterGenerator
// **************************************************************************

List<RouteBase> get $appRoutes => [
  $startupPageRoute,
  $loginPageRoute,
  $homePageLaytoutRoute,
];

RouteBase get $startupPageRoute => GoRouteData.$route(
  path: '/',

  factory: $StartupPageRouteExtension._fromState,
);

extension $StartupPageRouteExtension on StartupPageRoute {
  static StartupPageRoute _fromState(GoRouterState state) =>
      const StartupPageRoute();

  String get location => GoRouteData.$location('/');

  void go(BuildContext context) => context.go(location);

  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $loginPageRoute => GoRouteData.$route(
  path: '/login',

  factory: $LoginPageRouteExtension._fromState,
);

extension $LoginPageRouteExtension on LoginPageRoute {
  static LoginPageRoute _fromState(GoRouterState state) =>
      const LoginPageRoute();

  String get location => GoRouteData.$location('/login');

  void go(BuildContext context) => context.go(location);

  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  void replace(BuildContext context) => context.replace(location);
}

RouteBase get $homePageLaytoutRoute => StatefulShellRouteData.$route(
  parentNavigatorKey: HomePageLaytoutRoute.$parentNavigatorKey,
  restorationScopeId: HomePageLaytoutRoute.$restorationScopeId,
  factory: $HomePageLaytoutRouteExtension._fromState,
  branches: [
    StatefulShellBranchData.$branch(
      navigatorKey: FooPageBranch.$navigatorKey,
      restorationScopeId: FooPageBranch.$restorationScopeId,

      routes: [
        GoRouteData.$route(
          path: '/foo',

          factory: $FooPageRouteExtension._fromState,
        ),
      ],
    ),
    StatefulShellBranchData.$branch(
      navigatorKey: SettingsPageBranch.$navigatorKey,
      restorationScopeId: SettingsPageBranch.$restorationScopeId,

      routes: [
        GoRouteData.$route(
          path: '/settings',

          factory: $SettingsPageRouteExtension._fromState,
          routes: [
            GoRouteData.$route(
              path: 'payment',

              factory: $PaymentPageRouteExtension._fromState,
            ),
          ],
        ),
      ],
    ),
  ],
);

extension $HomePageLaytoutRouteExtension on HomePageLaytoutRoute {
  static HomePageLaytoutRoute _fromState(GoRouterState state) =>
      const HomePageLaytoutRoute();
}

extension $FooPageRouteExtension on FooPageRoute {
  static FooPageRoute _fromState(GoRouterState state) => const FooPageRoute();

  String get location => GoRouteData.$location('/foo');

  void go(BuildContext context) => context.go(location);

  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  void replace(BuildContext context) => context.replace(location);
}

extension $SettingsPageRouteExtension on SettingsPageRoute {
  static SettingsPageRoute _fromState(GoRouterState state) =>
      const SettingsPageRoute();

  String get location => GoRouteData.$location('/settings');

  void go(BuildContext context) => context.go(location);

  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  void replace(BuildContext context) => context.replace(location);
}

extension $PaymentPageRouteExtension on PaymentPageRoute {
  static PaymentPageRoute _fromState(GoRouterState state) =>
      const PaymentPageRoute();

  String get location => GoRouteData.$location('/settings/payment');

  void go(BuildContext context) => context.go(location);

  Future<T?> push<T>(BuildContext context) => context.push<T>(location);

  void pushReplacement(BuildContext context) =>
      context.pushReplacement(location);

  void replace(BuildContext context) => context.replace(location);
}
