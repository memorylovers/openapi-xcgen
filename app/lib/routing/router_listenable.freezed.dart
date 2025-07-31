// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'router_listenable.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

/// @nodoc
mixin _$RouterListenable {
  bool get signedIn => throw _privateConstructorUsedError;
  AsyncValue<void>? get startupState => throw _privateConstructorUsedError;

  /// Create a copy of RouterListenable
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $RouterListenableCopyWith<RouterListenable> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $RouterListenableCopyWith<$Res> {
  factory $RouterListenableCopyWith(
    RouterListenable value,
    $Res Function(RouterListenable) then,
  ) = _$RouterListenableCopyWithImpl<$Res, RouterListenable>;
  @useResult
  $Res call({bool signedIn, AsyncValue<void>? startupState});
}

/// @nodoc
class _$RouterListenableCopyWithImpl<$Res, $Val extends RouterListenable>
    implements $RouterListenableCopyWith<$Res> {
  _$RouterListenableCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of RouterListenable
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? signedIn = null, Object? startupState = freezed}) {
    return _then(
      _value.copyWith(
            signedIn:
                null == signedIn
                    ? _value.signedIn
                    : signedIn // ignore: cast_nullable_to_non_nullable
                        as bool,
            startupState:
                freezed == startupState
                    ? _value.startupState
                    : startupState // ignore: cast_nullable_to_non_nullable
                        as AsyncValue<void>?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$RouterListenableImplCopyWith<$Res>
    implements $RouterListenableCopyWith<$Res> {
  factory _$$RouterListenableImplCopyWith(
    _$RouterListenableImpl value,
    $Res Function(_$RouterListenableImpl) then,
  ) = __$$RouterListenableImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({bool signedIn, AsyncValue<void>? startupState});
}

/// @nodoc
class __$$RouterListenableImplCopyWithImpl<$Res>
    extends _$RouterListenableCopyWithImpl<$Res, _$RouterListenableImpl>
    implements _$$RouterListenableImplCopyWith<$Res> {
  __$$RouterListenableImplCopyWithImpl(
    _$RouterListenableImpl _value,
    $Res Function(_$RouterListenableImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of RouterListenable
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({Object? signedIn = null, Object? startupState = freezed}) {
    return _then(
      _$RouterListenableImpl(
        signedIn:
            null == signedIn
                ? _value.signedIn
                : signedIn // ignore: cast_nullable_to_non_nullable
                    as bool,
        startupState:
            freezed == startupState
                ? _value.startupState
                : startupState // ignore: cast_nullable_to_non_nullable
                    as AsyncValue<void>?,
      ),
    );
  }
}

/// @nodoc

class _$RouterListenableImpl
    with DiagnosticableTreeMixin
    implements _RouterListenable {
  const _$RouterListenableImpl({this.signedIn = false, this.startupState});

  @override
  @JsonKey()
  final bool signedIn;
  @override
  final AsyncValue<void>? startupState;

  @override
  String toString({DiagnosticLevel minLevel = DiagnosticLevel.info}) {
    return 'RouterListenable(signedIn: $signedIn, startupState: $startupState)';
  }

  @override
  void debugFillProperties(DiagnosticPropertiesBuilder properties) {
    super.debugFillProperties(properties);
    properties
      ..add(DiagnosticsProperty('type', 'RouterListenable'))
      ..add(DiagnosticsProperty('signedIn', signedIn))
      ..add(DiagnosticsProperty('startupState', startupState));
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$RouterListenableImpl &&
            (identical(other.signedIn, signedIn) ||
                other.signedIn == signedIn) &&
            (identical(other.startupState, startupState) ||
                other.startupState == startupState));
  }

  @override
  int get hashCode => Object.hash(runtimeType, signedIn, startupState);

  /// Create a copy of RouterListenable
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$RouterListenableImplCopyWith<_$RouterListenableImpl> get copyWith =>
      __$$RouterListenableImplCopyWithImpl<_$RouterListenableImpl>(
        this,
        _$identity,
      );
}

abstract class _RouterListenable implements RouterListenable {
  const factory _RouterListenable({
    final bool signedIn,
    final AsyncValue<void>? startupState,
  }) = _$RouterListenableImpl;

  @override
  bool get signedIn;
  @override
  AsyncValue<void>? get startupState;

  /// Create a copy of RouterListenable
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$RouterListenableImplCopyWith<_$RouterListenableImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
