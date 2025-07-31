import 'package:flutter/material.dart';

// opacity 60 = 9A
class AppColors {
  static final MaterialColor primary = Colors.teal;

  static const Color white = Color(0xFFE9ECF0);
  static const Color white_60A = Color(0x9AE9ECF0);
  static const Color black = Color(0xFF141414);
  static const Color black_60A = Color(0x9A141414);
  static const Color black_40A = Color(0x65141414);
}

final colorSchemeLight = ColorScheme.fromSeed(seedColor: AppColors.primary);
