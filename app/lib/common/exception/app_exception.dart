import 'app_error_code.dart';

class AppException implements Exception {
  final AppErrorCode code;
  final Object? cause;
  final StackTrace? stackTrace;

  const AppException({
    this.code = AppErrorCode.unknown,
    this.cause,
    this.stackTrace,
  });

  // String message(L10n l10n) => code.toMessage(l10n);

  @override
  String toString() {
    return "Error: $code";
  }
}
