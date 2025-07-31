import 'dart:io';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

import 'firebase_auth_usecase.dart';

/// Firebase AuthのGoogle認証
class GoogleFirebaseAuthUseCase extends IFirebaseAuthUseCase {
  // sign-in google
  // - https://firebase.google.com/docs/auth/flutter/federated-auth?hl=ja
  @override
  Future<void> signIn() async {
    if (kIsWeb) {
      GoogleAuthProvider googleProvider = GoogleAuthProvider();

      await FirebaseAuth.instance.signInWithPopup(googleProvider);
    } else if ((Platform.isAndroid || Platform.isIOS)) {
      final credential = await _googleOAuth();
      if (credential == null) return;

      await FirebaseAuth.instance.signInWithCredential(credential);
    } else {
      throw Exception("not support platform");
    }
  }

  // sign-in google
  // - https://firebase.google.com/docs/auth/flutter/federated-auth?hl=ja
  @override
  Future<void> linkAccount() async {
    if (kIsWeb) {
      GoogleAuthProvider googleProvider = GoogleAuthProvider();

      await FirebaseAuth.instance.signInWithPopup(googleProvider);
    } else if ((Platform.isAndroid || Platform.isIOS)) {
      final credential = await _googleOAuth();
      if (credential == null) return;

      await FirebaseAuth.instance.signInWithCredential(credential);
    } else {
      throw Exception("not support platform");
    }
  }

  // reauth google
  // - https://firebase.google.com/docs/auth/flutter/federated-auth?hl=ja
  @override
  Future<void> reauth() async {
    final currentUser = FirebaseAuth.instance.currentUser;
    if (currentUser == null) return;

    if (kIsWeb) {
      GoogleAuthProvider googleProvider = GoogleAuthProvider();

      await currentUser.reauthenticateWithProvider(googleProvider);
    } else if ((Platform.isAndroid || Platform.isIOS)) {
      final credential = await _googleOAuth();
      if (credential == null) return;

      await currentUser.reauthenticateWithCredential(credential);
    } else {
      throw Exception("not support platform");
    }
  }

  /// Google認証(Android/iOSのみ)
  Future<OAuthCredential?> _googleOAuth() async {
    // Trigger the authentication flow
    final googleSignIn = GoogleSignIn();
    final GoogleSignInAccount? googleUser = await googleSignIn.signIn();
    if (googleUser == null) return null;

    // Obtain the auth details from the request
    final GoogleSignInAuthentication googleAuth =
        await googleUser.authentication;

    // Create a new credential
    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );
    await googleSignIn.signOut();
    return credential;
  }
}
