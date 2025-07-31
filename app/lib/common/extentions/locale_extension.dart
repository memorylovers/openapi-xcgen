import 'package:flutter/widgets.dart';

extension LocaleExtension on BuildContext {
  Locale get locale => Localizations.localeOf(this);
  bool get isLocaleJa => locale.languageCode == "ja";
  String get localeName => _toLocaleName(this, locale);
  bool get isLTR => Directionality.of(this) == TextDirection.ltr;
}

String _toLocaleName(BuildContext context, Locale? locale) {
  // https://scrapse.com/language/
  if (locale == null) return "English";
  switch (locale.languageCode) {
    case "ja":
      return "日本語"; // ja_JP
    case "en":
      return "English";
    case "ar": // アラビア語
      return "العربية";
    case "es": // スペイン語
      return "Español";
    case "fr": // フランス語
      return "Français";
    case "ko": // 韓国語
      return "한국어";
    case "ru": // ロシア語
      return "Русский";
    case "th": // タイ語
      return "ไทย";
    case "zh": // 中国語(簡体字)
      if (locale.countryCode == "TW") {
        // 中国語(台湾: 繁体字)
        return "繁體中文";
      }
      return "简体中文";
    default:
      return "English";
  }
}
