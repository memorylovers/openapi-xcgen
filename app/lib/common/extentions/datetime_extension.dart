import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
// import 'package:relative_time/relative_time.dart';

extension DateTimeEx on DateTime {
  String yMEdHmLocal(BuildContext context) {
    final locale = Localizations.localeOf(context);
    final format = DateFormat.yMEd(locale.languageCode).add_Hm();
    return format.format(toLocal());
  }

  String yMdHmLocal(BuildContext context) {
    final locale = Localizations.localeOf(context);
    final format = DateFormat.yMd(locale.languageCode).add_Hm();
    return format.format(toLocal());
  }

  // String relative(BuildContext context) {
  //   return RelativeTime(
  //     context,
  //     numeric: true,
  //     timeUnits: const <TimeUnit>[
  //       TimeUnit.year,
  //       TimeUnit.month,
  //       TimeUnit.week,
  //       TimeUnit.day,
  //     ],
  //   ).format(toLocal());
  // }
}
