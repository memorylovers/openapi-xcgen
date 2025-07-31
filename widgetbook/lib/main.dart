import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:myapp/_gen/i18n/strings.g.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

import 'main.directories.g.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(const WidgetbookApp());
}

@widgetbook.App()
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
            WidgetbookTheme(name: 'Light', data: ThemeData.light()),
            WidgetbookTheme(name: 'Dark', data: ThemeData.dark()),
          ],
        ),
      ],
    );
  }
}
