extension DurationEx on Duration {
  fmtSS() {
    String twoDigits(int n) =>
        n.isNaN ? "00" : n.toString().padLeft(2, "0").substring(0, 2);
    int sec = inSeconds.remainder(60).abs();
    int millSeconds = inMilliseconds.remainder(1000).abs();
    String twoDigitSeconds = twoDigits(sec);
    String twoDigitMillSeconds = twoDigits(millSeconds);
    return "$twoDigitSeconds.$twoDigitMillSeconds";
  }

  max(Duration other) => this >= other ? this : other;
  orZero() => max(Duration.zero);
  ceilInSec() {
    final rest = inMilliseconds / Duration.millisecondsPerSecond;
    return rest <= 0 ? Duration.zero : Duration(seconds: rest.ceil());
  }
}
