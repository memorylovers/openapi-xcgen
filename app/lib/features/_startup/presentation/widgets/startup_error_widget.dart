import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart';

import '../../../../_gen/i18n/strings.g.dart';

/// startup時のエラーWidget
class StartupErrorWidget extends StatelessWidget {
  const StartupErrorWidget({this.error, required this.onRetry, super.key});

  final Object? error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(i18n.error.unexpected),
            const Gap(16),
            ElevatedButton(onPressed: onRetry, child: Text(i18n.common.retry)),
          ],
        ),
      ),
    );
  }
}

@UseCase(name: "Default", type: StartupErrorWidget, path: "features/startup")
Widget usecaseStartupErrorWidget(BuildContext context) {
  return StartupErrorWidget(onRetry: () {});
}
