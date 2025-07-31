import 'package:collection/collection.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../../types/types.dart';
import 'anonymous_firebase_auth_usecase.dart';
import 'apple_firebase_auth_usecase.dart';
import 'google_firebase_auth_usecase.dart';

/// FirebaseAuthのユースケースのインターフェース
abstract class IFirebaseAuthUseCase {
  /// サインイン
  Future<void> signIn();

  /// サインアウト
  Future<void> signOut() async {
    await FirebaseAuth.instance.signOut();
  }

  /// アカウントのリンク
  Future<void> linkAccount();

  /// アカウントの再認証
  Future<void> reauth();

  /// アカウントの削除
  Future<void> delete() async {
    final currentUser = FirebaseAuth.instance.currentUser;
    if (currentUser == null) return;

    try {
      await currentUser.delete();
    } catch (error) {
      if (error is FirebaseException && error.code == "requires-recent-login") {
        // 再認証が必要な場合は、再認証したあとに、削除する
        await reauth();
        await currentUser.delete();
      } else {
        rethrow;
      }
    }
  }
}

/// FirebaseAuthUseCaseのfactory
IFirebaseAuthUseCase getFirebaseAuthUseCase(AuthType type) {
  if (type == AuthType.anonymous) {
    return AnonymousFirebaseAuthUseCase();
  } else if (type == AuthType.google) {
    return GoogleFirebaseAuthUseCase();
  } else if (type == AuthType.apple) {
    return AppleFirebaseAuthUseCase();
  } else {
    throw Exception("not support type: $type");
  }
}

/// FirebaseAuthUserのextensions
extension FirebaseAuthUserEx on User {
  UserInfo? get google {
    return providerData.firstWhereOrNull((v) => v.providerId == "google.com");
  }

  UserInfo? get apple {
    return providerData.firstWhereOrNull((v) => v.providerId == "apple.com");
  }
}
