import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart';

import '_gen/i18n/strings.g.dart';
import 'common/theme/app_theme.dart';
import 'widgetbook.directories.g.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // ignore: missing_provider_scope
  runApp(const WidgetbookApp());
}

@App()
class WidgetbookApp extends StatelessWidget {
  const WidgetbookApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Widgetbook.material(
      directories: directories,
      // addon
      addons: [
        DeviceFrameAddon(
          devices: [
            Devices.ios.iPhone13ProMax,
            Devices.ios.iPad,
            Devices.ios.iPadAir4,
            Devices.android.samsungGalaxyNote20Ultra,
            Devices.android.pixel4,
            Devices.android.sonyXperia1II,
          ],
          initialDevice: Devices.ios.iPhone13ProMax,
        ),
        TextScaleAddon(),
        // TimeDilationAddon(),
        LocalizationAddon(
          locales: AppLocaleUtils.supportedLocales,
          localizationsDelegates: [
            GlobalCupertinoLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            // RelativeTimeLocalizations.delegate,
          ],
        ),
        MaterialThemeAddon(
          themes: [
            WidgetbookTheme(name: 'Light', data: appTheme),
            WidgetbookTheme(name: 'Dark', data: ThemeData.dark()),
          ],
        ),
      ],
    );
  }
}
