// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'payment_provider.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

/// @nodoc
mixin _$PaymentState {
  CustomerInfo? get customer => throw _privateConstructorUsedError;
  Offerings? get offerings => throw _privateConstructorUsedError;
  bool get isLoading => throw _privateConstructorUsedError;
  bool get isConfigured => throw _privateConstructorUsedError;
  Object? get error => throw _privateConstructorUsedError;

  /// Create a copy of PaymentState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $PaymentStateCopyWith<PaymentState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PaymentStateCopyWith<$Res> {
  factory $PaymentStateCopyWith(
    PaymentState value,
    $Res Function(PaymentState) then,
  ) = _$PaymentStateCopyWithImpl<$Res, PaymentState>;
  @useResult
  $Res call({
    CustomerInfo? customer,
    Offerings? offerings,
    bool isLoading,
    bool isConfigured,
    Object? error,
  });

  $CustomerInfoCopyWith<$Res>? get customer;
  $OfferingsCopyWith<$Res>? get offerings;
}

/// @nodoc
class _$PaymentStateCopyWithImpl<$Res, $Val extends PaymentState>
    implements $PaymentStateCopyWith<$Res> {
  _$PaymentStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of PaymentState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? customer = freezed,
    Object? offerings = freezed,
    Object? isLoading = null,
    Object? isConfigured = null,
    Object? error = freezed,
  }) {
    return _then(
      _value.copyWith(
            customer:
                freezed == customer
                    ? _value.customer
                    : customer // ignore: cast_nullable_to_non_nullable
                        as CustomerInfo?,
            offerings:
                freezed == offerings
                    ? _value.offerings
                    : offerings // ignore: cast_nullable_to_non_nullable
                        as Offerings?,
            isLoading:
                null == isLoading
                    ? _value.isLoading
                    : isLoading // ignore: cast_nullable_to_non_nullable
                        as bool,
            isConfigured:
                null == isConfigured
                    ? _value.isConfigured
                    : isConfigured // ignore: cast_nullable_to_non_nullable
                        as bool,
            error: freezed == error ? _value.error : error,
          )
          as $Val,
    );
  }

  /// Create a copy of PaymentState
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $CustomerInfoCopyWith<$Res>? get customer {
    if (_value.customer == null) {
      return null;
    }

    return $CustomerInfoCopyWith<$Res>(_value.customer!, (value) {
      return _then(_value.copyWith(customer: value) as $Val);
    });
  }

  /// Create a copy of PaymentState
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $OfferingsCopyWith<$Res>? get offerings {
    if (_value.offerings == null) {
      return null;
    }

    return $OfferingsCopyWith<$Res>(_value.offerings!, (value) {
      return _then(_value.copyWith(offerings: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$PaymentStateImplCopyWith<$Res>
    implements $PaymentStateCopyWith<$Res> {
  factory _$$PaymentStateImplCopyWith(
    _$PaymentStateImpl value,
    $Res Function(_$PaymentStateImpl) then,
  ) = __$$PaymentStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    CustomerInfo? customer,
    Offerings? offerings,
    bool isLoading,
    bool isConfigured,
    Object? error,
  });

  @override
  $CustomerInfoCopyWith<$Res>? get customer;
  @override
  $OfferingsCopyWith<$Res>? get offerings;
}

/// @nodoc
class __$$PaymentStateImplCopyWithImpl<$Res>
    extends _$PaymentStateCopyWithImpl<$Res, _$PaymentStateImpl>
    implements _$$PaymentStateImplCopyWith<$Res> {
  __$$PaymentStateImplCopyWithImpl(
    _$PaymentStateImpl _value,
    $Res Function(_$PaymentStateImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of PaymentState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? customer = freezed,
    Object? offerings = freezed,
    Object? isLoading = null,
    Object? isConfigured = null,
    Object? error = freezed,
  }) {
    return _then(
      _$PaymentStateImpl(
        customer:
            freezed == customer
                ? _value.customer
                : customer // ignore: cast_nullable_to_non_nullable
                    as CustomerInfo?,
        offerings:
            freezed == offerings
                ? _value.offerings
                : offerings // ignore: cast_nullable_to_non_nullable
                    as Offerings?,
        isLoading:
            null == isLoading
                ? _value.isLoading
                : isLoading // ignore: cast_nullable_to_non_nullable
                    as bool,
        isConfigured:
            null == isConfigured
                ? _value.isConfigured
                : isConfigured // ignore: cast_nullable_to_non_nullable
                    as bool,
        error: freezed == error ? _value.error : error,
      ),
    );
  }
}

/// @nodoc

class _$PaymentStateImpl extends _PaymentState {
  const _$PaymentStateImpl({
    this.customer,
    this.offerings,
    required this.isLoading,
    required this.isConfigured,
    this.error,
  }) : super._();

  @override
  final CustomerInfo? customer;
  @override
  final Offerings? offerings;
  @override
  final bool isLoading;
  @override
  final bool isConfigured;
  @override
  final Object? error;

  @override
  String toString() {
    return 'PaymentState(customer: $customer, offerings: $offerings, isLoading: $isLoading, isConfigured: $isConfigured, error: $error)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PaymentStateImpl &&
            (identical(other.customer, customer) ||
                other.customer == customer) &&
            (identical(other.offerings, offerings) ||
                other.offerings == offerings) &&
            (identical(other.isLoading, isLoading) ||
                other.isLoading == isLoading) &&
            (identical(other.isConfigured, isConfigured) ||
                other.isConfigured == isConfigured) &&
            const DeepCollectionEquality().equals(other.error, error));
  }

  @override
  int get hashCode => Object.hash(
    runtimeType,
    customer,
    offerings,
    isLoading,
    isConfigured,
    const DeepCollectionEquality().hash(error),
  );

  /// Create a copy of PaymentState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$PaymentStateImplCopyWith<_$PaymentStateImpl> get copyWith =>
      __$$PaymentStateImplCopyWithImpl<_$PaymentStateImpl>(this, _$identity);
}

abstract class _PaymentState extends PaymentState {
  const factory _PaymentState({
    final CustomerInfo? customer,
    final Offerings? offerings,
    required final bool isLoading,
    required final bool isConfigured,
    final Object? error,
  }) = _$PaymentStateImpl;
  const _PaymentState._() : super._();

  @override
  CustomerInfo? get customer;
  @override
  Offerings? get offerings;
  @override
  bool get isLoading;
  @override
  bool get isConfigured;
  @override
  Object? get error;

  /// Create a copy of PaymentState
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$PaymentStateImplCopyWith<_$PaymentStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
