enum AppErrorCode {
  // ** auth
  noAuth, // ログインが必要です
  // ** UserSetting | selectedLang
  noSupportLocale, // この言語に対応していません
  // ** UserProfile | Nickname
  nicknameDuplicate, // すでに利用されています
  // ** Auth | Link
  authAlreadyLinked, // 別のアカウントに連携済みです
  // ** Common
  networkError, // Network Error
  notFound, // Not Found
  unknown, // エラーが発生しました
}
