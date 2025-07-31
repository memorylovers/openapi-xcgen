// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'auth_providers.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$AuthStateImpl _$$AuthStateImplFromJson(Map<String, dynamic> json) =>
    _$AuthStateImpl(uid: json['uid'] as String);

Map<String, dynamic> _$$AuthStateImplToJson(_$AuthStateImpl instance) =>
    <String, dynamic>{'uid': instance.uid};

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$authUidHash() => r'98f80398b2e05179f138ade3dc2a0fa8cddb48fa';

/// UIDの取得
///
/// Copied from [authUid].
@ProviderFor(authUid)
final authUidProvider = AutoDisposeFutureProvider<String?>.internal(
  authUid,
  name: r'authUidProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$authUidHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef AuthUidRef = AutoDisposeFutureProviderRef<String?>;
String _$authSignOutWhenFirstRunHash() =>
    r'4a410d91777a74d0efa024bb26be5fa69c910534';

/// See also [authSignOutWhenFirstRun].
@ProviderFor(authSignOutWhenFirstRun)
final authSignOutWhenFirstRunProvider =
    AutoDisposeFutureProvider<void>.internal(
      authSignOutWhenFirstRun,
      name: r'authSignOutWhenFirstRunProvider',
      debugGetCreateSourceHash:
          const bool.fromEnvironment('dart.vm.product')
              ? null
              : _$authSignOutWhenFirstRunHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef AuthSignOutWhenFirstRunRef = AutoDisposeFutureProviderRef<void>;
String _$authStoreHash() => r'6b4dd723e1313b704cceb445a09cd9ff2f195860';

/// 認証状態
///
/// Copied from [AuthStore].
@ProviderFor(AuthStore)
final authStoreProvider = AsyncNotifierProvider<AuthStore, AuthState?>.internal(
  AuthStore.new,
  name: r'authStoreProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$authStoreHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$AuthStore = AsyncNotifier<AuthState?>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
