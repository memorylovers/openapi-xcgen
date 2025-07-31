// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'profile.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

AccountProfile _$AccountProfileFromJson(Map<String, dynamic> json) {
  return _AccountProfile.fromJson(json);
}

/// @nodoc
mixin _$AccountProfile {
  String get uid => throw _privateConstructorUsedError;

  /// 表示名
  String get displayName => throw _privateConstructorUsedError;

  /// アバター画像のURL
  String? get avatarUrl => throw _privateConstructorUsedError;
  @DateTimeConverter()
  DateTime get createdAt => throw _privateConstructorUsedError;
  @DateTimeConverter()
  DateTime get updatedAt => throw _privateConstructorUsedError;

  /// Serializes this AccountProfile to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of AccountProfile
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AccountProfileCopyWith<AccountProfile> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AccountProfileCopyWith<$Res> {
  factory $AccountProfileCopyWith(
    AccountProfile value,
    $Res Function(AccountProfile) then,
  ) = _$AccountProfileCopyWithImpl<$Res, AccountProfile>;
  @useResult
  $Res call({
    String uid,
    String displayName,
    String? avatarUrl,
    @DateTimeConverter() DateTime createdAt,
    @DateTimeConverter() DateTime updatedAt,
  });
}

/// @nodoc
class _$AccountProfileCopyWithImpl<$Res, $Val extends AccountProfile>
    implements $AccountProfileCopyWith<$Res> {
  _$AccountProfileCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of AccountProfile
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? uid = null,
    Object? displayName = null,
    Object? avatarUrl = freezed,
    Object? createdAt = null,
    Object? updatedAt = null,
  }) {
    return _then(
      _value.copyWith(
            uid:
                null == uid
                    ? _value.uid
                    : uid // ignore: cast_nullable_to_non_nullable
                        as String,
            displayName:
                null == displayName
                    ? _value.displayName
                    : displayName // ignore: cast_nullable_to_non_nullable
                        as String,
            avatarUrl:
                freezed == avatarUrl
                    ? _value.avatarUrl
                    : avatarUrl // ignore: cast_nullable_to_non_nullable
                        as String?,
            createdAt:
                null == createdAt
                    ? _value.createdAt
                    : createdAt // ignore: cast_nullable_to_non_nullable
                        as DateTime,
            updatedAt:
                null == updatedAt
                    ? _value.updatedAt
                    : updatedAt // ignore: cast_nullable_to_non_nullable
                        as DateTime,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$AccountProfileImplCopyWith<$Res>
    implements $AccountProfileCopyWith<$Res> {
  factory _$$AccountProfileImplCopyWith(
    _$AccountProfileImpl value,
    $Res Function(_$AccountProfileImpl) then,
  ) = __$$AccountProfileImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String uid,
    String displayName,
    String? avatarUrl,
    @DateTimeConverter() DateTime createdAt,
    @DateTimeConverter() DateTime updatedAt,
  });
}

/// @nodoc
class __$$AccountProfileImplCopyWithImpl<$Res>
    extends _$AccountProfileCopyWithImpl<$Res, _$AccountProfileImpl>
    implements _$$AccountProfileImplCopyWith<$Res> {
  __$$AccountProfileImplCopyWithImpl(
    _$AccountProfileImpl _value,
    $Res Function(_$AccountProfileImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of AccountProfile
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? uid = null,
    Object? displayName = null,
    Object? avatarUrl = freezed,
    Object? createdAt = null,
    Object? updatedAt = null,
  }) {
    return _then(
      _$AccountProfileImpl(
        uid:
            null == uid
                ? _value.uid
                : uid // ignore: cast_nullable_to_non_nullable
                    as String,
        displayName:
            null == displayName
                ? _value.displayName
                : displayName // ignore: cast_nullable_to_non_nullable
                    as String,
        avatarUrl:
            freezed == avatarUrl
                ? _value.avatarUrl
                : avatarUrl // ignore: cast_nullable_to_non_nullable
                    as String?,
        createdAt:
            null == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                    as DateTime,
        updatedAt:
            null == updatedAt
                ? _value.updatedAt
                : updatedAt // ignore: cast_nullable_to_non_nullable
                    as DateTime,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$AccountProfileImpl implements _AccountProfile {
  const _$AccountProfileImpl({
    required this.uid,
    this.displayName = "",
    this.avatarUrl,
    @DateTimeConverter() required this.createdAt,
    @DateTimeConverter() required this.updatedAt,
  });

  factory _$AccountProfileImpl.fromJson(Map<String, dynamic> json) =>
      _$$AccountProfileImplFromJson(json);

  @override
  final String uid;

  /// 表示名
  @override
  @JsonKey()
  final String displayName;

  /// アバター画像のURL
  @override
  final String? avatarUrl;
  @override
  @DateTimeConverter()
  final DateTime createdAt;
  @override
  @DateTimeConverter()
  final DateTime updatedAt;

  @override
  String toString() {
    return 'AccountProfile(uid: $uid, displayName: $displayName, avatarUrl: $avatarUrl, createdAt: $createdAt, updatedAt: $updatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AccountProfileImpl &&
            (identical(other.uid, uid) || other.uid == uid) &&
            (identical(other.displayName, displayName) ||
                other.displayName == displayName) &&
            (identical(other.avatarUrl, avatarUrl) ||
                other.avatarUrl == avatarUrl) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    uid,
    displayName,
    avatarUrl,
    createdAt,
    updatedAt,
  );

  /// Create a copy of AccountProfile
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AccountProfileImplCopyWith<_$AccountProfileImpl> get copyWith =>
      __$$AccountProfileImplCopyWithImpl<_$AccountProfileImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$AccountProfileImplToJson(this);
  }
}

abstract class _AccountProfile implements AccountProfile {
  const factory _AccountProfile({
    required final String uid,
    final String displayName,
    final String? avatarUrl,
    @DateTimeConverter() required final DateTime createdAt,
    @DateTimeConverter() required final DateTime updatedAt,
  }) = _$AccountProfileImpl;

  factory _AccountProfile.fromJson(Map<String, dynamic> json) =
      _$AccountProfileImpl.fromJson;

  @override
  String get uid;

  /// 表示名
  @override
  String get displayName;

  /// アバター画像のURL
  @override
  String? get avatarUrl;
  @override
  @DateTimeConverter()
  DateTime get createdAt;
  @override
  @DateTimeConverter()
  DateTime get updatedAt;

  /// Create a copy of AccountProfile
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AccountProfileImplCopyWith<_$AccountProfileImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
