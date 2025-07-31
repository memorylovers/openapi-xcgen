import 'package:flutter/material.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart';

/// Secondary Button
///
/// 補助的なアクションに使用
/// 「キャンセル」「戻る」「編集」など
class SecondaryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final Color? borderColor;
  final Color? textColor;
  final double? width;
  final double height;
  final bool isLoading;
  final IconData? icon;

  const SecondaryButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.borderColor,
    this.textColor,
    this.width,
    this.height = 48.0,
    this.isLoading = false,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final isDisabled = onPressed == null || isLoading;
    final effectiveBorderColor = borderColor ?? Theme.of(context).primaryColor;
    final effectiveTextColor = textColor ?? Theme.of(context).primaryColor;
    final disabledColor = Colors.grey;

    final style = OutlinedButton.styleFrom(
      foregroundColor: effectiveTextColor,
      side: BorderSide(
        color: isDisabled ? disabledColor : effectiveBorderColor,
        width: 1.4,
      ),
      textStyle: const TextStyle(fontSize: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.0)),
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
    );

    final loading = SizedBox(
      width: 20,
      height: 20,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        valueColor: AlwaysStoppedAnimation<Color>(disabledColor),
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
      child: OutlinedButton(
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

@UseCase(name: "Default", type: SecondaryButton, path: "components/buttons")
Widget usecaseSecondaryButton(BuildContext context) {
  return Scaffold(
    body: SafeArea(
      child: Center(
        child: Column(
          spacing: 20,
          children: [
            //
            SecondaryButton(text: "Button", onPressed: () {}),
            //
            SecondaryButton(text: "Disabled", onPressed: null),
            //
            SecondaryButton(text: "Loading", onPressed: () {}, isLoading: true),
            //
            SecondaryButton(text: "Button", icon: Icons.home, onPressed: () {}),
            //
            SecondaryButton(
              text: "Disabled",
              icon: Icons.home,
              onPressed: null,
            ),
            //
            SecondaryButton(
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
