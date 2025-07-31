import 'package:flutter/material.dart';

import '../../common/theme/app_colors.dart';

/// FABのFactoryクラス
class FloatingActionButtonFactory {
  static FloatingActionButton extended({
    Widget? icon,
    required Widget label,
    Function()? onPressed,
  }) => FloatingActionButton.extended(
    backgroundColor: AppColors.primary,
    foregroundColor: Colors.white,
    onPressed: onPressed,
    icon: icon,
    label: label,
  );
}
