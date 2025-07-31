import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../common/firebase/firebase_providers.dart';
import '../../../common/types/types.dart';
import '../../../common/utils/system_providers.dart';
import '../data/repository/auth_repository.dart';
import '../data/repository/firebase_auth_repository.dart';

part 'auth_providers.freezed.dart';
part 'auth_providers.g.dart';

@freezed
class AuthState with _$AuthState {
  const AuthState._();

  const factory AuthState({required String uid}) = _AuthState;

  factory AuthState.fromJson(Map<String, dynamic> json) =>
      _$AuthStateFromJson(json);
}

// repositories
final IAuthRepository authRepository = FirebaseAuthRepository();

/// 認証状態
@Riverpod(keepAlive: true)
class AuthStore extends _$AuthStore {
  @override
  Future<AuthState?> build() async {
    // FirebaseAuthが認証済みなら、認証済みとする
    final user = await ref.watch(firebaseUserProvider.future);
    return user != null ? AuthState(uid: user.uid) : null;
  }

  /// ログイン
  Future<void> signIn(AuthType type) async {
    await authRepository.signIn(type);
  }

  /// ログアウト
  Future<void> signOut() async {
    await authRepository.signOut();
  }

  /// 退会
  Future<void> delete() async {
    await authRepository.delete();
  }

  /// アカウントの連携
  Future<void> linkAccount(AuthType type) async {
    await authRepository.linkAccount(type);
  }
}

/// UIDの取得
@riverpod
Future<String?> authUid(Ref ref) {
  return ref.watch(authStoreProvider.selectAsync((value) => value?.uid));
}

// アプリが初回起動かチェックして、初回起動の場合はサインアウトする
@riverpod
Future<void> authSignOutWhenFirstRun(Ref ref) async {
  final preferences = ref.watch(sharedPreferencesProvider);
  const key = 'isFirstRun';

  final firstRun = await preferences.getBool(key).then((e) => e ?? true);

  if (firstRun) {
    await ref.watch(firebaseAuthProvider).signOut();
    await preferences.setBool(key, false);
  }
}
