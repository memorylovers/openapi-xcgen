import 'package:hooks_riverpod/hooks_riverpod.dart';

extension AsyncValueEx<T> on AsyncValue<T> {
  AsyncValue<T> dataWithPrevious(T data) {
    return AsyncData(data).copyWithPrevious(this);
  }

  AsyncValue<T> loadingWithPrevious() {
    return AsyncLoading<T>().copyWithPrevious(this);
  }

  AsyncValue<T> errorWithPrevious(Object e, StackTrace st) {
    return AsyncError<T>(e, st).copyWithPrevious(this);
  }
}
