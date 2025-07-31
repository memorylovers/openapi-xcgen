// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'profile_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$accountProfileCollectionReferenceHash() =>
    r'3e9f015bebeca281977a987ba5894ed1eec836d8';

/// AccountProfile: collectionのreference
///
/// Copied from [accountProfileCollectionReference].
@ProviderFor(accountProfileCollectionReference)
final accountProfileCollectionReferenceProvider =
    Provider<CollectionReference<AccountProfile>>.internal(
      accountProfileCollectionReference,
      name: r'accountProfileCollectionReferenceProvider',
      debugGetCreateSourceHash:
          const bool.fromEnvironment('dart.vm.product')
              ? null
              : _$accountProfileCollectionReferenceHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef AccountProfileCollectionReferenceRef =
    ProviderRef<CollectionReference<AccountProfile>>;
String _$accountProfileDocumentSnapshotHash() =>
    r'76f8101c427b654d9853f8ee5a1d1271cb852da2';

/// Copied from Dart SDK
class _SystemHash {
  _SystemHash._();

  static int combine(int hash, int value) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + value);
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x0007ffff & hash) << 10));
    return hash ^ (hash >> 6);
  }

  static int finish(int hash) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x03ffffff & hash) << 3));
    // ignore: parameter_assignments
    hash = hash ^ (hash >> 11);
    return 0x1fffffff & (hash + ((0x00003fff & hash) << 15));
  }
}

/// AccountProfile: docのreference
///
/// Copied from [accountProfileDocumentSnapshot].
@ProviderFor(accountProfileDocumentSnapshot)
const accountProfileDocumentSnapshotProvider =
    AccountProfileDocumentSnapshotFamily();

/// AccountProfile: docのreference
///
/// Copied from [accountProfileDocumentSnapshot].
class AccountProfileDocumentSnapshotFamily
    extends Family<AsyncValue<DocumentSnapshot<AccountProfile>>> {
  /// AccountProfile: docのreference
  ///
  /// Copied from [accountProfileDocumentSnapshot].
  const AccountProfileDocumentSnapshotFamily();

  /// AccountProfile: docのreference
  ///
  /// Copied from [accountProfileDocumentSnapshot].
  AccountProfileDocumentSnapshotProvider call(String uid) {
    return AccountProfileDocumentSnapshotProvider(uid);
  }

  @override
  AccountProfileDocumentSnapshotProvider getProviderOverride(
    covariant AccountProfileDocumentSnapshotProvider provider,
  ) {
    return call(provider.uid);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'accountProfileDocumentSnapshotProvider';
}

/// AccountProfile: docのreference
///
/// Copied from [accountProfileDocumentSnapshot].
class AccountProfileDocumentSnapshotProvider
    extends AutoDisposeStreamProvider<DocumentSnapshot<AccountProfile>> {
  /// AccountProfile: docのreference
  ///
  /// Copied from [accountProfileDocumentSnapshot].
  AccountProfileDocumentSnapshotProvider(String uid)
    : this._internal(
        (ref) => accountProfileDocumentSnapshot(
          ref as AccountProfileDocumentSnapshotRef,
          uid,
        ),
        from: accountProfileDocumentSnapshotProvider,
        name: r'accountProfileDocumentSnapshotProvider',
        debugGetCreateSourceHash:
            const bool.fromEnvironment('dart.vm.product')
                ? null
                : _$accountProfileDocumentSnapshotHash,
        dependencies: AccountProfileDocumentSnapshotFamily._dependencies,
        allTransitiveDependencies:
            AccountProfileDocumentSnapshotFamily._allTransitiveDependencies,
        uid: uid,
      );

  AccountProfileDocumentSnapshotProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.uid,
  }) : super.internal();

  final String uid;

  @override
  Override overrideWith(
    Stream<DocumentSnapshot<AccountProfile>> Function(
      AccountProfileDocumentSnapshotRef provider,
    )
    create,
  ) {
    return ProviderOverride(
      origin: this,
      override: AccountProfileDocumentSnapshotProvider._internal(
        (ref) => create(ref as AccountProfileDocumentSnapshotRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        uid: uid,
      ),
    );
  }

  @override
  AutoDisposeStreamProviderElement<DocumentSnapshot<AccountProfile>>
  createElement() {
    return _AccountProfileDocumentSnapshotProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is AccountProfileDocumentSnapshotProvider && other.uid == uid;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, uid.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin AccountProfileDocumentSnapshotRef
    on AutoDisposeStreamProviderRef<DocumentSnapshot<AccountProfile>> {
  /// The parameter `uid` of this provider.
  String get uid;
}

class _AccountProfileDocumentSnapshotProviderElement
    extends AutoDisposeStreamProviderElement<DocumentSnapshot<AccountProfile>>
    with AccountProfileDocumentSnapshotRef {
  _AccountProfileDocumentSnapshotProviderElement(super.provider);

  @override
  String get uid => (origin as AccountProfileDocumentSnapshotProvider).uid;
}

String _$accountProfileHash() => r'd8476e79122a4e37d1079ae8318f9ba203a1f4bb';

/// AccountProfile: 特定のプロフィールのdoc stream
///
/// Copied from [accountProfile].
@ProviderFor(accountProfile)
const accountProfileProvider = AccountProfileFamily();

/// AccountProfile: 特定のプロフィールのdoc stream
///
/// Copied from [accountProfile].
class AccountProfileFamily
    extends Family<AsyncValue<DocumentPair<AccountProfile>?>> {
  /// AccountProfile: 特定のプロフィールのdoc stream
  ///
  /// Copied from [accountProfile].
  const AccountProfileFamily();

  /// AccountProfile: 特定のプロフィールのdoc stream
  ///
  /// Copied from [accountProfile].
  AccountProfileProvider call(String uid) {
    return AccountProfileProvider(uid);
  }

  @override
  AccountProfileProvider getProviderOverride(
    covariant AccountProfileProvider provider,
  ) {
    return call(provider.uid);
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'accountProfileProvider';
}

/// AccountProfile: 特定のプロフィールのdoc stream
///
/// Copied from [accountProfile].
class AccountProfileProvider
    extends AutoDisposeStreamProvider<DocumentPair<AccountProfile>?> {
  /// AccountProfile: 特定のプロフィールのdoc stream
  ///
  /// Copied from [accountProfile].
  AccountProfileProvider(String uid)
    : this._internal(
        (ref) => accountProfile(ref as AccountProfileRef, uid),
        from: accountProfileProvider,
        name: r'accountProfileProvider',
        debugGetCreateSourceHash:
            const bool.fromEnvironment('dart.vm.product')
                ? null
                : _$accountProfileHash,
        dependencies: AccountProfileFamily._dependencies,
        allTransitiveDependencies:
            AccountProfileFamily._allTransitiveDependencies,
        uid: uid,
      );

  AccountProfileProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.uid,
  }) : super.internal();

  final String uid;

  @override
  Override overrideWith(
    Stream<DocumentPair<AccountProfile>?> Function(AccountProfileRef provider)
    create,
  ) {
    return ProviderOverride(
      origin: this,
      override: AccountProfileProvider._internal(
        (ref) => create(ref as AccountProfileRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        uid: uid,
      ),
    );
  }

  @override
  AutoDisposeStreamProviderElement<DocumentPair<AccountProfile>?>
  createElement() {
    return _AccountProfileProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is AccountProfileProvider && other.uid == uid;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, uid.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin AccountProfileRef
    on AutoDisposeStreamProviderRef<DocumentPair<AccountProfile>?> {
  /// The parameter `uid` of this provider.
  String get uid;
}

class _AccountProfileProviderElement
    extends AutoDisposeStreamProviderElement<DocumentPair<AccountProfile>?>
    with AccountProfileRef {
  _AccountProfileProviderElement(super.provider);

  @override
  String get uid => (origin as AccountProfileProvider).uid;
}

String _$myAccountProfileHash() => r'abbe213f1ff279fc72b06df399bf850bed925918';

/// AccountProfile: ログインアカウントのプロフィールのdoc stream
///
/// Copied from [myAccountProfile].
@ProviderFor(myAccountProfile)
final myAccountProfileProvider =
    AutoDisposeStreamProvider<DocumentPair<AccountProfile>?>.internal(
      myAccountProfile,
      name: r'myAccountProfileProvider',
      debugGetCreateSourceHash:
          const bool.fromEnvironment('dart.vm.product')
              ? null
              : _$myAccountProfileHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef MyAccountProfileRef =
    AutoDisposeStreamProviderRef<DocumentPair<AccountProfile>?>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
