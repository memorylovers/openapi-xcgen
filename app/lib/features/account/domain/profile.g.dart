// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'profile.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$AccountProfileImpl _$$AccountProfileImplFromJson(
  Map<String, dynamic> json,
) => _$AccountProfileImpl(
  uid: json['uid'] as String,
  displayName: json['displayName'] as String? ?? "",
  avatarUrl: json['avatarUrl'] as String?,
  createdAt: const DateTimeConverter().fromJson(json['createdAt'] as String),
  updatedAt: const DateTimeConverter().fromJson(json['updatedAt'] as String),
);

Map<String, dynamic> _$$AccountProfileImplToJson(
  _$AccountProfileImpl instance,
) => <String, dynamic>{
  'uid': instance.uid,
  'displayName': instance.displayName,
  'avatarUrl': instance.avatarUrl,
  'createdAt': const DateTimeConverter().toJson(instance.createdAt),
  'updatedAt': const DateTimeConverter().toJson(instance.updatedAt),
};
