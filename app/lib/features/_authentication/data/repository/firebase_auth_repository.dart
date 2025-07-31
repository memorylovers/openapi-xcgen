import '../../../../common/exception/handling_error.dart';
import '../../../../common/firebase/firebase_auth/firebase_auth_usecase.dart';
import '../../../../common/types/types.dart';
import 'auth_repository.dart';

/// AuthRepositoryのFirebase Auth実装
class FirebaseAuthRepository implements IAuthRepository {
  @override
  Future<void> signIn(AuthType type) async {
    try {
      await getFirebaseAuthUseCase(type).signIn();
    } catch (error) {
      handleError(error);
    }
  }

  @override
  Future<void> signOut() async {
    try {
      await getFirebaseAuthUseCase(AuthType.anonymous).signOut();
    } catch (error) {
      handleError(error);
    }
  }

  @override
  Future<void> linkAccount(AuthType type) async {
    try {
      await getFirebaseAuthUseCase(type).linkAccount();
    } catch (error) {
      handleError(error);
    }
  }

  @override
  Future<void> delete() async {
    try {
      await getFirebaseAuthUseCase(AuthType.anonymous).delete();
    } catch (error) {
      handleError(error);
    }
  }
}
