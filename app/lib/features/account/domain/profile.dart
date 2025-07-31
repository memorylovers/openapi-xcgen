import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../common/json_converter/datetime_converter.dart';
import '../../../common/json_converter/firestore_timestamp_converter.dart';

part 'profile.freezed.dart';
part 'profile.g.dart';

/// アカウントのプロフィール。他のユーザに公開可
@freezed
class AccountProfile with _$AccountProfile {
  const factory AccountProfile({
    required String uid,

    /// 表示名
    @Default("") String displayName,

    /// アバター画像のURL
    String? avatarUrl,
    @DateTimeConverter() required DateTime createdAt,
    @DateTimeConverter() required DateTime updatedAt,
  }) = _AccountProfile;

  factory AccountProfile.fromJson(Json json) => _$AccountProfileFromJson(json);

  /// firestoreのcollection path
  static String get collectionPath => "account_profiles";

  static FromFirestore<AccountProfile> get fromFirestore =>
      (snapshot, _) => AccountProfile.fromJson(snapshot.data() ?? {});

  static ToFirestore<AccountProfile> get toFirestore =>
      (data, _) => data.toJson();
}
