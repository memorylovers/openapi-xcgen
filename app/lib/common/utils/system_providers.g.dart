// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'system_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$connectivityHash() => r'59a63c90973f1e1b35f3d22e08aa91406cbfa045';

/// See also [connectivity].
@ProviderFor(connectivity)
final connectivityProvider =
    AutoDisposeStreamProvider<List<ConnectivityResult>>.internal(
      connectivity,
      name: r'connectivityProvider',
      debugGetCreateSourceHash:
          const bool.fromEnvironment('dart.vm.product')
              ? null
              : _$connectivityHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef ConnectivityRef =
    AutoDisposeStreamProviderRef<List<ConnectivityResult>>;
String _$deviceInfoHash() => r'acaefb8c0f9643335014b9cef13786637bccde66';

/// See also [deviceInfo].
@ProviderFor(deviceInfo)
final deviceInfoProvider = FutureProvider<BaseDeviceInfo>.internal(
  deviceInfo,
  name: r'deviceInfoProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$deviceInfoHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef DeviceInfoRef = FutureProviderRef<BaseDeviceInfo>;
String _$deviceInfoSystemNameHash() =>
    r'de51263d74967c6a63d83d4494d983a32013f437';

/// See also [deviceInfoSystemName].
@ProviderFor(deviceInfoSystemName)
final deviceInfoSystemNameProvider = AutoDisposeProvider<String>.internal(
  deviceInfoSystemName,
  name: r'deviceInfoSystemNameProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$deviceInfoSystemNameHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef DeviceInfoSystemNameRef = AutoDisposeProviderRef<String>;
String _$deviceInfoSystemVersionHash() =>
    r'851be8e60b6f8f9aac3cc3e2bc93e42c6a4f5bed';

/// See also [deviceInfoSystemVersion].
@ProviderFor(deviceInfoSystemVersion)
final deviceInfoSystemVersionProvider = AutoDisposeProvider<String>.internal(
  deviceInfoSystemVersion,
  name: r'deviceInfoSystemVersionProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$deviceInfoSystemVersionHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef DeviceInfoSystemVersionRef = AutoDisposeProviderRef<String>;
String _$packageInfoHash() => r'854bbb0e381edfdddbd736229351d6cc918a2ad1';

/// See also [packageInfo].
@ProviderFor(packageInfo)
final packageInfoProvider = FutureProvider<PackageInfo>.internal(
  packageInfo,
  name: r'packageInfoProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$packageInfoHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef PackageInfoRef = FutureProviderRef<PackageInfo>;
String _$packageInfoBuildNumberHash() =>
    r'7639a8503222a4978556762e25cb40acff4b8fdf';

/// See also [packageInfoBuildNumber].
@ProviderFor(packageInfoBuildNumber)
final packageInfoBuildNumberProvider = AutoDisposeProvider<int>.internal(
  packageInfoBuildNumber,
  name: r'packageInfoBuildNumberProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$packageInfoBuildNumberHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef PackageInfoBuildNumberRef = AutoDisposeProviderRef<int>;
String _$packageInfoVersionHash() =>
    r'e17443e2b6924e5b99072fb73f2a5fa26d9291b9';

/// See also [packageInfoVersion].
@ProviderFor(packageInfoVersion)
final packageInfoVersionProvider = Provider<String>.internal(
  packageInfoVersion,
  name: r'packageInfoVersionProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$packageInfoVersionHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef PackageInfoVersionRef = ProviderRef<String>;
String _$packageInfoAppNameHash() =>
    r'06ce5b04ace30069d593233a04c066c901f39319';

/// See also [packageInfoAppName].
@ProviderFor(packageInfoAppName)
final packageInfoAppNameProvider = AutoDisposeProvider<String>.internal(
  packageInfoAppName,
  name: r'packageInfoAppNameProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$packageInfoAppNameHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef PackageInfoAppNameRef = AutoDisposeProviderRef<String>;
String _$sharedPreferencesHash() => r'4e2baac92647a5914c46b38ec3c662805cada4cb';

/// See also [sharedPreferences].
@ProviderFor(sharedPreferences)
final sharedPreferencesProvider = Provider<SharedPreferencesAsync>.internal(
  sharedPreferences,
  name: r'sharedPreferencesProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product')
          ? null
          : _$sharedPreferencesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef SharedPreferencesRef = ProviderRef<SharedPreferencesAsync>;
String _$appLifecycleHash() => r'035e6ec92055ed4ee12f1b24312072cf01012390';

/// See also [AppLifecycle].
@ProviderFor(AppLifecycle)
final appLifecycleProvider =
    NotifierProvider<AppLifecycle, AppLifecycleState>.internal(
      AppLifecycle.new,
      name: r'appLifecycleProvider',
      debugGetCreateSourceHash:
          const bool.fromEnvironment('dart.vm.product')
              ? null
              : _$appLifecycleHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

typedef _$AppLifecycle = Notifier<AppLifecycleState>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
