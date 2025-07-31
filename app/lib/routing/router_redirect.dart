import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../common/logger/logger.dart';
import 'router_listenable.dart';
import 'router_routes.dart';

part 'router_redirect.g.dart';

typedef GoRouterRedirectFunc = //
    FutureOr<String?> Function(BuildContext, GoRouterState);

@riverpod
GoRouterRedirectFunc routerRedirect(Ref ref) {
  return (context, state) async {
    final refreshListenable = ref.watch(refreshListenableProvider).value;

    final startupState = refreshListenable.startupState ?? const AsyncLoading();

    logger.info(
      "routerRedirect: startupState=$startupState, state.matchedLocation=${state.matchedLocation}, signedIn=${refreshListenable.signedIn}",
    );

    // 初期化が完了するのを待つ
    if (startupState.isLoading || startupState.hasError) {
      // 初期表示の画面へ
      return state.matchedLocation != initialPath ? initialPath : null;
    }

    // サインイン済みかの判定
    final signedIn = refreshListenable.signedIn;

    // 未ログインならログイン画面へ
    if (!signedIn && state.matchedLocation != loginPath) return loginPath;
    // ログイン済み、かつ、ログイン画面、ならホーム画面へ
    if (signedIn &&
        (state.matchedLocation == loginPath ||
            state.matchedLocation == initialPath)) {
      return homePath;
    }

    logger.info("routerRedirect: signedIn=${refreshListenable.signedIn}");

    // それ以外は、リダイレクトなし
    return null;
  };
}
