import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../common/firebase/firebase_providers.dart';
import '../../../../common/types/types.dart';
import '../../domain/profile.dart';

part 'profile_providers.g.dart';

/// AccountProfile: collectionのreference
@Riverpod(keepAlive: true)
CollectionReference<AccountProfile> accountProfileCollectionReference(Ref ref) {
  return ref
      .watch(firebaseFirestoreProvider)
      .collection(AccountProfile.collectionPath)
      .withConverter(
        fromFirestore: AccountProfile.fromFirestore,
        toFirestore: AccountProfile.toFirestore,
      );
}

/// AccountProfile: docのreference
@riverpod
Stream<DocumentSnapshot<AccountProfile>> accountProfileDocumentSnapshot(
  Ref ref,
  String uid,
) {
  return ref
      .watch(accountProfileCollectionReferenceProvider)
      .doc(uid)
      .snapshots();
}

/// AccountProfile: 特定のプロフィールのdoc stream
@riverpod
Stream<DocumentPair<AccountProfile>?> accountProfile(
  Ref ref,
  String uid,
) async* {
  if (uid.isEmpty) {
    yield null;
    return;
  }

  final snapshot = await ref.watch(
    accountProfileDocumentSnapshotProvider(uid).future,
  );
  final profile = snapshot.data();

  if (profile == null) {
    yield null;
  } else {
    yield (data: profile, reference: snapshot.reference);
  }
}

/// AccountProfile: ログインアカウントのプロフィールのdoc stream
@riverpod
Stream<DocumentPair<AccountProfile>?> myAccountProfile(Ref ref) async* {
  final uid = await ref.watch(firebaseUserUidProvider.future);
  if (uid == null) {
    yield null;
  } else {
    yield await ref.watch(accountProfileProvider(uid).future);
  }
}
