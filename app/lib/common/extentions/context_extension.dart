import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

extension ContextEx on BuildContext {
  Future<T?> show<T>({
    required WidgetBuilder builder,
    bool barrierDismissible = true,
    Color? barrierColor,
    String? barrierLabel,
    bool useSafeArea = true,
    bool useRootNavigator = false,
    RouteSettings? routeSettings,
    Offset? anchorPoint,
    TraversalEdgeBehavior? traversalEdgeBehavior,
  }) {
    return showDialog<T>(
      context: this,
      useRootNavigator: useRootNavigator,
      builder: builder,
      barrierColor: barrierColor,
      barrierLabel: barrierLabel,
      useSafeArea: useSafeArea,
      routeSettings: routeSettings,
      anchorPoint: anchorPoint,
      traversalEdgeBehavior: traversalEdgeBehavior,
    );
  }

  currentRoute() {
    final router = GoRouter.of(this);
    final RouteMatch last = router.routerDelegate.currentConfiguration.last;
    final RouteMatchList matchList = last is ImperativeRouteMatch
        ? last.matches
        : router.routerDelegate.currentConfiguration;
    final String location = matchList.uri.toString();
    return location;
  }
}
