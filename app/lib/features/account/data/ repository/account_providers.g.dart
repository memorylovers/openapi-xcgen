// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'account_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$accountCollectionReferenceHash() =>
    r'21b6586200088249c4082ba5fb8cb70cfa41a20c';

/// Account: collectionのreference
///
/// Copied from [accountCollectionReference].
@ProviderFor(accountCollectionReference)
final accountCollectionReferenceProvider =
    Provider<CollectionReference<Account>>.internal(
      accountCollectionReference,
      name: r'accountCollectionReferenceProvider',
      debugGetCreateSourceHash:
          const bool.fromEnvironment('dart.vm.product')
              ? null
              : _$accountCollectionReferenceHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef AccountCollectionReferenceRef =
    ProviderRef<CollectionReference<Account>>;
String _$accountDocumentSnapshotHash() =>
    r'e2316fdb978c21eafa9b8a8925f2b260c22f3321';

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

/// Account: docのreference
///
/// Copied from [accountDocumentSnapshot].
@ProviderFor(accountDocumentSnapshot)
const accountDocumentSnapshotProvider = AccountDocumentSnapshotFamily();

/// Account: docのreference
///
/// Copied from [accountDocumentSnapshot].
class AccountDocumentSnapshotFamily
    extends Family<AsyncValue<DocumentSnapshot<Account>>> {
  /// Account: docのreference
  ///
  /// Copied from [accountDocumentSnapshot].
  const AccountDocumentSnapshotFamily();

  /// Account: docのreference
  ///
  /// Copied from [accountDocumentSnapshot].
  AccountDocumentSnapshotProvider call(String uid) {
    return AccountDocumentSnapshotProvider(uid);
  }

  @override
  AccountDocumentSnapshotProvider getProviderOverride(
    covariant AccountDocumentSnapshotProvider provider,
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
  String? get name => r'accountDocumentSnapshotProvider';
}

/// Account: docのreference
///
/// Copied from [accountDocumentSnapshot].
class AccountDocumentSnapshotProvider
    extends AutoDisposeStreamProvider<DocumentSnapshot<Account>> {
  /// Account: docのreference
  ///
  /// Copied from [accountDocumentSnapshot].
  AccountDocumentSnapshotProvider(String uid)
    : this._internal(
        (ref) =>
            accountDocumentSnapshot(ref as AccountDocumentSnapshotRef, uid),
        from: accountDocumentSnapshotProvider,
        name: r'accountDocumentSnapshotProvider',
        debugGetCreateSourceHash:
            const bool.fromEnvironment('dart.vm.product')
                ? null
                : _$accountDocumentSnapshotHash,
        dependencies: AccountDocumentSnapshotFamily._dependencies,
        allTransitiveDependencies:
            AccountDocumentSnapshotFamily._allTransitiveDependencies,
        uid: uid,
      );

  AccountDocumentSnapshotProvider._internal(
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
    Stream<DocumentSnapshot<Account>> Function(
      AccountDocumentSnapshotRef provider,
    )
    create,
  ) {
    return ProviderOverride(
      origin: this,
      override: AccountDocumentSnapshotProvider._internal(
        (ref) => create(ref as AccountDocumentSnapshotRef),
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
  AutoDisposeStreamProviderElement<DocumentSnapshot<Account>> createElement() {
    return _AccountDocumentSnapshotProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is AccountDocumentSnapshotProvider && other.uid == uid;
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
mixin AccountDocumentSnapshotRef
    on AutoDisposeStreamProviderRef<DocumentSnapshot<Account>> {
  /// The parameter `uid` of this provider.
  String get uid;
}

class _AccountDocumentSnapshotProviderElement
    extends AutoDisposeStreamProviderElement<DocumentSnapshot<Account>>
    with AccountDocumentSnapshotRef {
  _AccountDocumentSnapshotProviderElement(super.provider);

  @override
  String get uid => (origin as AccountDocumentSnapshotProvider).uid;
}

String _$myAccountHash() => r'fef227e00291983d356b87b8908d9fd5453337aa';

/// Account: ログインアカウントのdoc stream
///
/// Copied from [myAccount].
@ProviderFor(myAccount)
final myAccountProvider =
    AutoDisposeStreamProvider<DocumentPair<Account>?>.internal(
      myAccount,
      name: r'myAccountProvider',
      debugGetCreateSourceHash:
          const bool.fromEnvironment('dart.vm.product')
              ? null
              : _$myAccountHash,
      dependencies: null,
      allTransitiveDependencies: null,
    );

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef MyAccountRef = AutoDisposeStreamProviderRef<DocumentPair<Account>?>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
