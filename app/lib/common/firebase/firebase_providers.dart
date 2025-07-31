import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'firebase_providers.g.dart';

// ********************************************************
// * Auth
// ********************************************************
@Riverpod(keepAlive: true)
FirebaseAuth firebaseAuth(Ref ref) => FirebaseAuth.instance;

/// [fb_auth.User]を取得する
///
/// 機密情報が含まれるため、[kIsProd]の場合はログを抑制している
/// Providerの名称を変える場合は、[talkerRiverpodObserver] も変更すること
@riverpod
Stream<User?> firebaseUser(Ref ref) {
  // リスナーの登録直後
  // ユーザーがログインしたとき
  // 現在のユーザーがログアウトしたとき
  // 現在のユーザーのトークンが変更されたとき
  // currentUserの以下のメソッドを呼び出し時
  //   reload() / unlink() / updateEmail() / updatePassword() / updatePhoneNumber() / updateProfile()
  // ※ Firebase Admin SDKで更新した場合
  // Firebase Admin SDKなどでの変更・削除後でも呼び出されない。
  // FirebaseAuth.instance.currentUser.reload() を使用して強制的に再読み込みする必要がある
  // その際、user-disabled または user-not-found 例外が発生する
  return ref.watch(firebaseAuthProvider).userChanges();
}

/// UIDを取得する
///
/// サインインしていない場合はnullを返す
@riverpod
Future<String?> firebaseUserUid(Ref ref) {
  return ref.watch(firebaseUserProvider.selectAsync((value) => value?.uid));
}

/// idTokenの取得
@Riverpod(keepAlive: true)
Future<String?> firebaseIdToken(Ref ref) async {
  final user = await ref.watch(firebaseUserProvider.future);
  final token = await user?.getIdToken();
  return token;
}

// ********************************************************
// * Firestore
// ********************************************************
@Riverpod(keepAlive: true)
FirebaseFirestore firebaseFirestore(Ref ref) => FirebaseFirestore.instance;

// ********************************************************
// * Crashlytics
// ********************************************************
@Riverpod(keepAlive: true)
FirebaseCrashlytics firebaseCrashlytics(Ref ref) =>
    FirebaseCrashlytics.instance;

// ********************************************************
// * Analytics
// ********************************************************
@riverpod
FirebaseAnalytics firebaseAnalytics(Ref ref) => FirebaseAnalytics.instance;

// ********************************************************
// * Functions
// ********************************************************
// @Riverpod(keepAlive: true)
// FirebaseFunctions firebaseFunctions(Ref ref) => FirebaseFunctions.instanceFor(
//       region: 'asia-northeast1',
//     );

// ********************************************************
// * Storage
// ********************************************************
// @Riverpod(keepAlive: true)
// FirebaseStorage firebaseStorage(Ref ref) => FirebaseStorage.instance;

// @riverpod
// Future<String> firebaseStorageGsFileDownloadUrl(
//   Ref ref, {
//   required String fileUri,
// }) async {
//   ref.cacheFor(const Duration(minutes: 5));

//   if (fileUri.startsWith('gs://')) {
//     return ref
//         .watch(firebaseStorageProvider)
//         .refFromURL(fileUri)
//         .getDownloadURL();
//   } else {
//     return fileUri;
//   }
// }
