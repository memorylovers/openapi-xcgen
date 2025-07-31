import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'types.freezed.dart';

/// FirestoreのDocumentReferenceとそのdataのpair
typedef DocumentPair<T> = ({DocumentReference<T> reference, T data});

/// 認証のタイプ
enum AuthType {
  /// Google認証
  google,

  /// Apple認証
  apple,

  /// 匿名認証
  anonymous,
}

/// ページング用のレスポンスデータ
@freezed
class PageResponse<T> with _$PageResponse<T> {
  const PageResponse._();
  const factory PageResponse({
    required List<T> items,
    required int perPage,
    required bool hasNext,
  }) = _PageResponse<T>;
}
