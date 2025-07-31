import '../../../../common/types/types.dart';

/// 認証関連のリポジトリのインターフェース
abstract class IAuthRepository {
  /// サインイン
  Future<void> signIn(AuthType type);

  /// サインアウト
  Future<void> signOut();

  /// アカウントのリンク
  Future<void> linkAccount(AuthType type);

  /// アカウントの削除
  Future<void> delete();
}
