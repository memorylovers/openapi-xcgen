// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'types.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

/// @nodoc
mixin _$PageResponse<T> {
  List<T> get items => throw _privateConstructorUsedError;
  int get perPage => throw _privateConstructorUsedError;
  bool get hasNext => throw _privateConstructorUsedError;

  /// Create a copy of PageResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $PageResponseCopyWith<T, PageResponse<T>> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PageResponseCopyWith<T, $Res> {
  factory $PageResponseCopyWith(
    PageResponse<T> value,
    $Res Function(PageResponse<T>) then,
  ) = _$PageResponseCopyWithImpl<T, $Res, PageResponse<T>>;
  @useResult
  $Res call({List<T> items, int perPage, bool hasNext});
}

/// @nodoc
class _$PageResponseCopyWithImpl<T, $Res, $Val extends PageResponse<T>>
    implements $PageResponseCopyWith<T, $Res> {
  _$PageResponseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of PageResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? items = null,
    Object? perPage = null,
    Object? hasNext = null,
  }) {
    return _then(
      _value.copyWith(
            items:
                null == items
                    ? _value.items
                    : items // ignore: cast_nullable_to_non_nullable
                        as List<T>,
            perPage:
                null == perPage
                    ? _value.perPage
                    : perPage // ignore: cast_nullable_to_non_nullable
                        as int,
            hasNext:
                null == hasNext
                    ? _value.hasNext
                    : hasNext // ignore: cast_nullable_to_non_nullable
                        as bool,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$PageResponseImplCopyWith<T, $Res>
    implements $PageResponseCopyWith<T, $Res> {
  factory _$$PageResponseImplCopyWith(
    _$PageResponseImpl<T> value,
    $Res Function(_$PageResponseImpl<T>) then,
  ) = __$$PageResponseImplCopyWithImpl<T, $Res>;
  @override
  @useResult
  $Res call({List<T> items, int perPage, bool hasNext});
}

/// @nodoc
class __$$PageResponseImplCopyWithImpl<T, $Res>
    extends _$PageResponseCopyWithImpl<T, $Res, _$PageResponseImpl<T>>
    implements _$$PageResponseImplCopyWith<T, $Res> {
  __$$PageResponseImplCopyWithImpl(
    _$PageResponseImpl<T> _value,
    $Res Function(_$PageResponseImpl<T>) _then,
  ) : super(_value, _then);

  /// Create a copy of PageResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? items = null,
    Object? perPage = null,
    Object? hasNext = null,
  }) {
    return _then(
      _$PageResponseImpl<T>(
        items:
            null == items
                ? _value._items
                : items // ignore: cast_nullable_to_non_nullable
                    as List<T>,
        perPage:
            null == perPage
                ? _value.perPage
                : perPage // ignore: cast_nullable_to_non_nullable
                    as int,
        hasNext:
            null == hasNext
                ? _value.hasNext
                : hasNext // ignore: cast_nullable_to_non_nullable
                    as bool,
      ),
    );
  }
}

/// @nodoc

class _$PageResponseImpl<T> extends _PageResponse<T> {
  const _$PageResponseImpl({
    required final List<T> items,
    required this.perPage,
    required this.hasNext,
  }) : _items = items,
       super._();

  final List<T> _items;
  @override
  List<T> get items {
    if (_items is EqualUnmodifiableListView) return _items;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_items);
  }

  @override
  final int perPage;
  @override
  final bool hasNext;

  @override
  String toString() {
    return 'PageResponse<$T>(items: $items, perPage: $perPage, hasNext: $hasNext)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PageResponseImpl<T> &&
            const DeepCollectionEquality().equals(other._items, _items) &&
            (identical(other.perPage, perPage) || other.perPage == perPage) &&
            (identical(other.hasNext, hasNext) || other.hasNext == hasNext));
  }

  @override
  int get hashCode => Object.hash(
    runtimeType,
    const DeepCollectionEquality().hash(_items),
    perPage,
    hasNext,
  );

  /// Create a copy of PageResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$PageResponseImplCopyWith<T, _$PageResponseImpl<T>> get copyWith =>
      __$$PageResponseImplCopyWithImpl<T, _$PageResponseImpl<T>>(
        this,
        _$identity,
      );
}

abstract class _PageResponse<T> extends PageResponse<T> {
  const factory _PageResponse({
    required final List<T> items,
    required final int perPage,
    required final bool hasNext,
  }) = _$PageResponseImpl<T>;
  const _PageResponse._() : super._();

  @override
  List<T> get items;
  @override
  int get perPage;
  @override
  bool get hasNext;

  /// Create a copy of PageResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$PageResponseImplCopyWith<T, _$PageResponseImpl<T>> get copyWith =>
      throw _privateConstructorUsedError;
}
