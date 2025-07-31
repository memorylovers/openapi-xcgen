import 'package:flutter/material.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart';

/// Primary Button
///
/// 最も重要なアクションに利用
/// 「購入」「送信」「保存」など、ユーザーに最も実行してほしい操作に使う
class PrimaryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final Color? backgroundColor;
  final Color? textColor;
  final double? width;
  final double height;
  final bool isLoading;
  final IconData? icon;

  const PrimaryButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.backgroundColor,
    this.textColor,
    this.width,
    this.height = 48.0,
    this.isLoading = false,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final bgColor = backgroundColor ?? Theme.of(context).primaryColor;

    final style = ElevatedButton.styleFrom(
      backgroundColor: bgColor,
      foregroundColor: textColor ?? Colors.white,
      textStyle: const TextStyle(fontSize: 16),
      elevation: 2,
      shadowColor: bgColor.withValues(alpha: 0.3),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.0)),
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      iconSize: 18,
    );

    final loading = SizedBox(
      width: 20,
      height: 20,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        valueColor: AlwaysStoppedAnimation<Color>(textColor ?? Colors.white),
      ),
    );

    final child = Row(
      mainAxisSize: MainAxisSize.min,
      spacing: 8,
      children: [if (icon != null) Icon(icon, size: 18), Text(text)],
    );

    return SizedBox(
      width: width,
      height: height,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: style,
        child: Stack(
          alignment: Alignment.center,
          children: [
            if (isLoading) loading,

            //
            Opacity(opacity: isLoading ? 0 : 1, child: child),
          ],
        ),
      ),
    );
  }
}

@UseCase(name: "Default", type: PrimaryButton, path: "components/buttons")
Widget usecasePrimaryButton(BuildContext context) {
  return Scaffold(
    body: SafeArea(
      child: Center(
        child: Column(
          spacing: 20,
          children: [
            //
            PrimaryButton(text: "Button", onPressed: () {}),
            //
            PrimaryButton(text: "Disabled", onPressed: null),
            //
            PrimaryButton(text: "Loading", onPressed: () {}, isLoading: true),
            //
            PrimaryButton(text: "Button", icon: Icons.home, onPressed: () {}),
            //
            PrimaryButton(text: "Disabled", icon: Icons.home, onPressed: null),
            //
            PrimaryButton(
              text: "Loading",
              icon: Icons.home,
              onPressed: () {},
              isLoading: true,
            ),
          ],
        ),
      ),
    ),
  );
}
