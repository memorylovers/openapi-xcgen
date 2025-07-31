import 'package:collection/collection.dart';
import 'package:firebase_auth/firebase_auth.dart';

extension FirebaseAuthUserEx on User {
  UserInfo? get google {
    return providerData.firstWhereOrNull((v) => v.providerId == "google.com");
  }

  UserInfo? get apple {
    return providerData.firstWhereOrNull((v) => v.providerId == "apple.com");
  }
}
