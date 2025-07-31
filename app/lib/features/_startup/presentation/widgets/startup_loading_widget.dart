import 'package:flutter/material.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart';

import '../../../../common/theme/app_colors.dart';

/// startup中のローディングWidget
class StartupLoadingWidget extends StatelessWidget {
  const StartupLoadingWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
    );
  }
}

@UseCase(name: "Default", type: StartupLoadingWidget, path: "features/startup")
Widget usecaseStartupLoadingWidget(BuildContext context) {
  return StartupLoadingWidget();
}
