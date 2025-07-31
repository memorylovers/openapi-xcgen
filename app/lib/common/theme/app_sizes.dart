import 'package:flutter/material.dart';

class AppSizes {
  //
}

extension SizeEx on Size {
  Widget toSizedBox(Widget? child) {
    return SizedBox(height: height, width: width, child: child);
  }

  Size keepAspectByWidth(double? baseWidth) {
    final newWidth = baseWidth ?? width;
    final newHeight = baseWidth == null ? height : (baseWidth / aspectRatio);
    return Size(newWidth, newHeight);
  }
}
