import 'package:animations/animations.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

samePageTransitions(PageTransitionsBuilder builder) {
  return PageTransitionsTheme(
    builders: {
      TargetPlatform.android: builder,
      TargetPlatform.fuchsia: builder,
      TargetPlatform.iOS: builder,
      TargetPlatform.macOS: builder,
      TargetPlatform.linux: builder,
      TargetPlatform.windows: builder,
    },
  );
}

/// アプリのテーマデータ
final appTheme = ThemeData(
  useMaterial3: true,
  colorScheme: colorSchemeLight,
  scaffoldBackgroundColor: Colors.white,

  // フォント
  textTheme: GoogleFonts.notoSansJpTextTheme(),
  visualDensity: VisualDensity.adaptivePlatformDensity,

  // ページ切替時のアニメーション
  pageTransitionsTheme: samePageTransitions(
    const SharedAxisPageTransitionsBuilder(
      transitionType: SharedAxisTransitionType.horizontal,
      fillColor: Colors.white,
    ),
  ),

  // Widget
  tabBarTheme: TabBarThemeData(dividerColor: Colors.transparent),
);
