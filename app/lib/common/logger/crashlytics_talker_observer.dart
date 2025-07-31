import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:talker/talker.dart';

/// errorログなどをCrashlyticsに送信するTalkerのObserver
class CrashlyticsTalkerObserver extends TalkerObserver {
  @override
  void onError(TalkerError err) {
    FirebaseCrashlytics.instance.recordError(
      err.error,
      err.stackTrace,
      reason: err.message,
    );

    super.onError(err);
  }

  @override
  void onException(TalkerException err) {
    FirebaseCrashlytics.instance.recordError(
      err.exception,
      err.stackTrace,
      reason: err.message,
    );

    super.onException(err);
  }

  @override
  void onLog(TalkerData log) {
    final data = log.generateTextMessage();

    FirebaseCrashlytics.instance.log(data);
    super.onLog(log);
  }
}
