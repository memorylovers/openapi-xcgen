import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../common/json_converter/datetime_converter.dart';
import '../../../common/json_converter/firestore_timestamp_converter.dart';

part 'account.freezed.dart';
part 'account.g.dart';

/// アカウント設定を含むユーザ情報。他のユーザには非公開
@freezed
class Account with _$Account {
  const factory Account({
    required String uid,
    @DateTimeConverter() required DateTime createdAt,
    @DateTimeConverter() required DateTime updatedAt,
  }) = _Account;

  factory Account.fromJson(Json json) => _$AccountFromJson(json);

  /// firestoreのcollection path
  static String get collectionPath => "accounts";

  static FromFirestore<Account> get fromFirestore =>
      (snapshot, _) => Account.fromJson(snapshot.data() ?? {});

  static ToFirestore<Account> get toFirestore => (data, _) => data.toJson();
}
