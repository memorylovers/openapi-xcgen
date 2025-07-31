import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:shared_preferences/shared_preferences.dart';

part 'system_providers.g.dart';

@riverpod
Stream<List<ConnectivityResult>> connectivity(Ref ref) =>
    Connectivity().onConnectivityChanged;

@Riverpod(keepAlive: true)
class AppLifecycle extends _$AppLifecycle {
  @override
  AppLifecycleState build() {
    final appLifecycleObserver = _AppLifecycleObserver(
      (appLifecycleState) => state = appLifecycleState,
    );

    final widgetsBinding = WidgetsBinding.instance;
    widgetsBinding.addObserver(appLifecycleObserver);
    ref.onDispose(() => widgetsBinding.removeObserver(appLifecycleObserver));

    return AppLifecycleState.resumed;
  }
}

/// implements WidgetsBindingObserver
class _AppLifecycleObserver extends WidgetsBindingObserver {
  final ValueChanged<AppLifecycleState> _didChangeAppLifecycle;

  _AppLifecycleObserver(this._didChangeAppLifecycle);

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _didChangeAppLifecycle(state);
    super.didChangeAppLifecycleState(state);
  }
}

@Riverpod(keepAlive: true)
Future<BaseDeviceInfo> deviceInfo(Ref ref) => DeviceInfoPlugin().deviceInfo;

@riverpod
String deviceInfoSystemName(Ref ref) {
  return switch (ref.watch(deviceInfoProvider).requireValue) {
    IosDeviceInfo(:final systemName) => systemName,
    MacOsDeviceInfo(:final osRelease) => osRelease,
    WebBrowserInfo(:final browserName) => browserName.name,
    _ => 'unknown',
  };
}

@riverpod
String deviceInfoSystemVersion(Ref ref) {
  return switch (ref.watch(deviceInfoProvider).requireValue) {
    IosDeviceInfo(:final systemVersion) => systemVersion,
    MacOsDeviceInfo(
      :final majorVersion,
      :final minorVersion,
      :final patchVersion,
    ) =>
      '$majorVersion.$minorVersion.$patchVersion',
    _ => '',
  };
}

@Riverpod(keepAlive: true)
Future<PackageInfo> packageInfo(Ref ref) => PackageInfo.fromPlatform();

@riverpod
int packageInfoBuildNumber(Ref ref) =>
    int.tryParse(ref.watch(packageInfoProvider).requireValue.buildNumber) ?? 0;

@Riverpod(keepAlive: true)
String packageInfoVersion(Ref ref) =>
    ref.watch(packageInfoProvider).requireValue.version;

@riverpod
String packageInfoAppName(Ref ref) =>
    ref.watch(packageInfoProvider).requireValue.appName;

@Riverpod(keepAlive: true)
SharedPreferencesAsync sharedPreferences(Ref ref) => SharedPreferencesAsync();
