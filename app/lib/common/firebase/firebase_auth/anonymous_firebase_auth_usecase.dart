import 'package:firebase_auth/firebase_auth.dart';

import 'firebase_auth_usecase.dart';

/// Firebase Authの匿名
class AnonymousFirebaseAuthUseCase extends IFirebaseAuthUseCase {
  @override
  Future<void> signIn() async {
    await FirebaseAuth.instance.signInAnonymously();
  }

  @override
  Future<void> linkAccount() async {
    // DO NOTHING
  }

  @override
  Future<void> reauth() async {
    // DO NOTHING
  }
}
