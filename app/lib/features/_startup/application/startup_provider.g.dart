// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'startup_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$startupHash() => r'e7e291d09a0f6efbbb540ad36e6e0bceb9793abb';

/// アプリ起動時に非同期で初期化が必要な処理を行う
///
/// Copied from [startup].
@ProviderFor(startup)
final startupProvider = AutoDisposeFutureProvider<void>.internal(
  startup,
  name: r'startupProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$startupHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef StartupRef = AutoDisposeFutureProviderRef<void>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
