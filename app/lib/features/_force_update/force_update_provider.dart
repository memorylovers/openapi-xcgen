import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../common/logger/logger.dart';
import '../../common/utils/system_providers.dart';
import '../../constants.dart';

part "force_update_provider.g.dart";

@Riverpod(keepAlive: true)
class ForceUpdate extends _$ForceUpdate {
  @override
  Future<bool> build() async {
    final packageInfoVersion = ref.watch(packageInfoVersionProvider);
    final fbConfig = FirebaseRemoteConfig.instance;

    // 変更を監視
    fbConfig.onConfigUpdated.listen((e) {
      if (!e.updatedKeys.contains(kFirebaseConfigForceUpdateVersionKey)) return;
      ref.invalidateSelf();
    });

    try {
      // remote configデータの取得
      await fbConfig.fetchAndActivate();
      final confVer = fbConfig.getString(kFirebaseConfigForceUpdateVersionKey);

      // 強制アップデートが必要かどうかのチェック
      return _isNeedUpdate(packageInfoVersion, confVer);
    } catch (error) {
      logger.debug("** forceUpdate:build: $error");
      return false;
    }
  }
}

/// 強制アップデートが必要かどうかのチェック処理
bool _isNeedUpdate(String pkgVer, String confVer) {
  if (confVer.isEmpty) return false;
  final result = pkgVer.compareTo(confVer) < 0;
  logger.debug("** forceUpdate:check: pkg=$pkgVer, conf=$confVer => $result");
  return result;
}

@visibleForTesting
bool isNeedUpdate(String pkgVer, String confVer) {
  return _isNeedUpdate(pkgVer, confVer);
}
