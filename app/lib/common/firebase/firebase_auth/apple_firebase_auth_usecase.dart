import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

import 'firebase_auth_usecase.dart';

/// Firebase AuthのApple認証
class AppleFirebaseAuthUseCase extends IFirebaseAuthUseCase {
  final provider =
      AppleAuthProvider()
        ..scopes.add("email")
        ..scopes.add("name");

  // sign-in apple
  // - https://firebase.google.com/docs/auth/flutter/federated-auth?hl=ja#apple
  @override
  Future<void> signIn() async {
    if (kIsWeb) {
      await FirebaseAuth.instance.signInWithPopup(provider);
    } else {
      await FirebaseAuth.instance.signInWithProvider(provider);
    }
  }

  @override
  Future<void> linkAccount() async {
    final currentUser = FirebaseAuth.instance.currentUser;
    if (currentUser == null) return;

    if (kIsWeb) {
      await currentUser.linkWithPopup(provider);
    } else {
      await currentUser.linkWithProvider(provider);
    }
  }

  @override
  Future<void> reauth() async {
    final currentUser = FirebaseAuth.instance.currentUser;
    if (currentUser == null) return;

    if (kIsWeb) {
      await currentUser.reauthenticateWithPopup(provider);
    } else {
      await currentUser.reauthenticateWithProvider(provider);
    }
  }
}
