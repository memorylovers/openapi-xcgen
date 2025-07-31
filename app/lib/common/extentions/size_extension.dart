import 'package:flutter/material.dart';

extension SizeEx on Size {
  Size mul(double val) {
    return Size(width * val, height * val);
  }

  static Size of(double val) {
    return Size(val, val);
  }
}
