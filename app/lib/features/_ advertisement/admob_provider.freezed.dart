// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'admob_provider.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

/// @nodoc
mixin _$BannerAdWithSize {
  BannerAd get bannerAd => throw _privateConstructorUsedError;
  AdSize get adSize => throw _privateConstructorUsedError;

  /// Create a copy of BannerAdWithSize
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $BannerAdWithSizeCopyWith<BannerAdWithSize> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $BannerAdWithSizeCopyWith<$Res> {
  factory $BannerAdWithSizeCopyWith(
    BannerAdWithSize value,
    $Res Function(BannerAdWithSize) then,
  ) = _$BannerAdWithSizeCopyWithImpl<$Res, BannerAdWithSize>;
  @useResult
  $Res call({BannerAd bannerAd, AdSize adSize});
}

/// @nodoc
class _$BannerAdWithSizeCopyWithImpl<$Res, $Val extends BannerAdWithSize>
    implements $BannerAdWithSizeCopyWith<$Res> {
  _$BannerAdWithSizeCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of BannerAdWithSize
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? bannerAd = null, Object? adSize = null}) {
    return _then(
      _value.copyWith(
            bannerAd:
                null == bannerAd
                    ? _value.bannerAd
                    : bannerAd // ignore: cast_nullable_to_non_nullable
                        as BannerAd,
            adSize:
                null == adSize
                    ? _value.adSize
                    : adSize // ignore: cast_nullable_to_non_nullable
                        as AdSize,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$BannerAdWithSizeImplCopyWith<$Res>
    implements $BannerAdWithSizeCopyWith<$Res> {
  factory _$$BannerAdWithSizeImplCopyWith(
    _$BannerAdWithSizeImpl value,
    $Res Function(_$BannerAdWithSizeImpl) then,
  ) = __$$BannerAdWithSizeImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({BannerAd bannerAd, AdSize adSize});
}

/// @nodoc
class __$$BannerAdWithSizeImplCopyWithImpl<$Res>
    extends _$BannerAdWithSizeCopyWithImpl<$Res, _$BannerAdWithSizeImpl>
    implements _$$BannerAdWithSizeImplCopyWith<$Res> {
  __$$BannerAdWithSizeImplCopyWithImpl(
    _$BannerAdWithSizeImpl _value,
    $Res Function(_$BannerAdWithSizeImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of BannerAdWithSize
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? bannerAd = null, Object? adSize = null}) {
    return _then(
      _$BannerAdWithSizeImpl(
        bannerAd:
            null == bannerAd
                ? _value.bannerAd
                : bannerAd // ignore: cast_nullable_to_non_nullable
                    as BannerAd,
        adSize:
            null == adSize
                ? _value.adSize
                : adSize // ignore: cast_nullable_to_non_nullable
                    as AdSize,
      ),
    );
  }
}

/// @nodoc

class _$BannerAdWithSizeImpl extends _BannerAdWithSize {
  const _$BannerAdWithSizeImpl({required this.bannerAd, required this.adSize})
    : super._();

  @override
  final BannerAd bannerAd;
  @override
  final AdSize adSize;

  @override
  String toString() {
    return 'BannerAdWithSize(bannerAd: $bannerAd, adSize: $adSize)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$BannerAdWithSizeImpl &&
            (identical(other.bannerAd, bannerAd) ||
                other.bannerAd == bannerAd) &&
            (identical(other.adSize, adSize) || other.adSize == adSize));
  }

  @override
  int get hashCode => Object.hash(runtimeType, bannerAd, adSize);

  /// Create a copy of BannerAdWithSize
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$BannerAdWithSizeImplCopyWith<_$BannerAdWithSizeImpl> get copyWith =>
      __$$BannerAdWithSizeImplCopyWithImpl<_$BannerAdWithSizeImpl>(
        this,
        _$identity,
      );
}

abstract class _BannerAdWithSize extends BannerAdWithSize {
  const factory _BannerAdWithSize({
    required final BannerAd bannerAd,
    required final AdSize adSize,
  }) = _$BannerAdWithSizeImpl;
  const _BannerAdWithSize._() : super._();

  @override
  BannerAd get bannerAd;
  @override
  AdSize get adSize;

  /// Create a copy of BannerAdWithSize
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$BannerAdWithSizeImplCopyWith<_$BannerAdWithSizeImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
mixin _$AdBannerStoreState {
  bool get loading => throw _privateConstructorUsedError;
  BannerAd? get bannerTop => throw _privateConstructorUsedError;
  BannerAd? get bannerResult => throw _privateConstructorUsedError;
  AsyncValue<RewardedAd?> get rewardedAd => throw _privateConstructorUsedError;

  /// Create a copy of AdBannerStoreState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AdBannerStoreStateCopyWith<AdBannerStoreState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AdBannerStoreStateCopyWith<$Res> {
  factory $AdBannerStoreStateCopyWith(
    AdBannerStoreState value,
    $Res Function(AdBannerStoreState) then,
  ) = _$AdBannerStoreStateCopyWithImpl<$Res, AdBannerStoreState>;
  @useResult
  $Res call({
    bool loading,
    BannerAd? bannerTop,
    BannerAd? bannerResult,
    AsyncValue<RewardedAd?> rewardedAd,
  });
}

/// @nodoc
class _$AdBannerStoreStateCopyWithImpl<$Res, $Val extends AdBannerStoreState>
    implements $AdBannerStoreStateCopyWith<$Res> {
  _$AdBannerStoreStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of AdBannerStoreState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? loading = null,
    Object? bannerTop = freezed,
    Object? bannerResult = freezed,
    Object? rewardedAd = null,
  }) {
    return _then(
      _value.copyWith(
            loading:
                null == loading
                    ? _value.loading
                    : loading // ignore: cast_nullable_to_non_nullable
                        as bool,
            bannerTop:
                freezed == bannerTop
                    ? _value.bannerTop
                    : bannerTop // ignore: cast_nullable_to_non_nullable
                        as BannerAd?,
            bannerResult:
                freezed == bannerResult
                    ? _value.bannerResult
                    : bannerResult // ignore: cast_nullable_to_non_nullable
                        as BannerAd?,
            rewardedAd:
                null == rewardedAd
                    ? _value.rewardedAd
                    : rewardedAd // ignore: cast_nullable_to_non_nullable
                        as AsyncValue<RewardedAd?>,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$AdBannerStoreStateImplCopyWith<$Res>
    implements $AdBannerStoreStateCopyWith<$Res> {
  factory _$$AdBannerStoreStateImplCopyWith(
    _$AdBannerStoreStateImpl value,
    $Res Function(_$AdBannerStoreStateImpl) then,
  ) = __$$AdBannerStoreStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    bool loading,
    BannerAd? bannerTop,
    BannerAd? bannerResult,
    AsyncValue<RewardedAd?> rewardedAd,
  });
}

/// @nodoc
class __$$AdBannerStoreStateImplCopyWithImpl<$Res>
    extends _$AdBannerStoreStateCopyWithImpl<$Res, _$AdBannerStoreStateImpl>
    implements _$$AdBannerStoreStateImplCopyWith<$Res> {
  __$$AdBannerStoreStateImplCopyWithImpl(
    _$AdBannerStoreStateImpl _value,
    $Res Function(_$AdBannerStoreStateImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of AdBannerStoreState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? loading = null,
    Object? bannerTop = freezed,
    Object? bannerResult = freezed,
    Object? rewardedAd = null,
  }) {
    return _then(
      _$AdBannerStoreStateImpl(
        loading:
            null == loading
                ? _value.loading
                : loading // ignore: cast_nullable_to_non_nullable
                    as bool,
        bannerTop:
            freezed == bannerTop
                ? _value.bannerTop
                : bannerTop // ignore: cast_nullable_to_non_nullable
                    as BannerAd?,
        bannerResult:
            freezed == bannerResult
                ? _value.bannerResult
                : bannerResult // ignore: cast_nullable_to_non_nullable
                    as BannerAd?,
        rewardedAd:
            null == rewardedAd
                ? _value.rewardedAd
                : rewardedAd // ignore: cast_nullable_to_non_nullable
                    as AsyncValue<RewardedAd?>,
      ),
    );
  }
}

/// @nodoc

class _$AdBannerStoreStateImpl extends _AdBannerStoreState {
  const _$AdBannerStoreStateImpl({
    required this.loading,
    required this.bannerTop,
    required this.bannerResult,
    required this.rewardedAd,
  }) : super._();

  @override
  final bool loading;
  @override
  final BannerAd? bannerTop;
  @override
  final BannerAd? bannerResult;
  @override
  final AsyncValue<RewardedAd?> rewardedAd;

  @override
  String toString() {
    return 'AdBannerStoreState(loading: $loading, bannerTop: $bannerTop, bannerResult: $bannerResult, rewardedAd: $rewardedAd)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AdBannerStoreStateImpl &&
            (identical(other.loading, loading) || other.loading == loading) &&
            (identical(other.bannerTop, bannerTop) ||
                other.bannerTop == bannerTop) &&
            (identical(other.bannerResult, bannerResult) ||
                other.bannerResult == bannerResult) &&
            (identical(other.rewardedAd, rewardedAd) ||
                other.rewardedAd == rewardedAd));
  }

  @override
  int get hashCode =>
      Object.hash(runtimeType, loading, bannerTop, bannerResult, rewardedAd);

  /// Create a copy of AdBannerStoreState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AdBannerStoreStateImplCopyWith<_$AdBannerStoreStateImpl> get copyWith =>
      __$$AdBannerStoreStateImplCopyWithImpl<_$AdBannerStoreStateImpl>(
        this,
        _$identity,
      );
}

abstract class _AdBannerStoreState extends AdBannerStoreState {
  const factory _AdBannerStoreState({
    required final bool loading,
    required final BannerAd? bannerTop,
    required final BannerAd? bannerResult,
    required final AsyncValue<RewardedAd?> rewardedAd,
  }) = _$AdBannerStoreStateImpl;
  const _AdBannerStoreState._() : super._();

  @override
  bool get loading;
  @override
  BannerAd? get bannerTop;
  @override
  BannerAd? get bannerResult;
  @override
  AsyncValue<RewardedAd?> get rewardedAd;

  /// Create a copy of AdBannerStoreState
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AdBannerStoreStateImplCopyWith<_$AdBannerStoreStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
