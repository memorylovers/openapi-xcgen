import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart';

/// 大きいボタンのスタイル
final buttonStyleLarge = ElevatedButton.styleFrom(
  iconSize: 28,
  textStyle: TextStyle(fontSize: 18),
  padding: EdgeInsets.symmetric(vertical: 8, horizontal: 8),
);

class Button extends StatelessWidget {
  const Button({
    super.key,
    this.isLoading = false,
    this.icon,
    required this.label,
    this.onPressed,
    this.labelWidth,
    this.style,
  });

  final bool isLoading;
  final IconData? icon;
  final String label;
  final VoidCallback? onPressed;
  final double? labelWidth;
  final ButtonStyle? style;

  @override
  Widget build(BuildContext context) {
    return MaterialButton(
      onPressed: isLoading ? null : onPressed,
      // style: style ?? buttonStyleLarge,
      elevation: 20,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        spacing: 8,
        children: [
          // iconがある場合
          if (icon != null)
            // loading icon
            if (isLoading)
              Icon(Icons.refresh)
                  .animate(onPlay: (controller) => controller.repeat())
                  .rotate(duration: 2.seconds)
            else
              Icon(icon),

          // fixed text with
          if (labelWidth != null)
            SizedBox(
              width: labelWidth,
              child: Text(label, textAlign: TextAlign.center),
            )
          else
            Text(label, textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

@UseCase(name: "Default", type: Button, path: "components/buttons")
Widget usecaseButton(BuildContext context) {
  final style = ElevatedButton.styleFrom(
    iconSize: 28,
    textStyle: TextStyle(fontSize: 18),
    padding: EdgeInsets.symmetric(vertical: 8, horizontal: 8),
  );

  return Scaffold(
    body: SafeArea(
      child: Column(
        spacing: 20,
        children: [
          //
          Button(label: "Button", onPressed: () {}),
          //
          Button(label: "Disabled", onPressed: null),
          //
          Button(label: "Loading", onPressed: () {}, isLoading: true),

          //
          Button(label: "With Icon", icon: Icons.home, onPressed: () {}),
          //
          Button(label: "Disabled", icon: Icons.home, onPressed: null),
          //
          Button(
            label: "Loading",
            icon: Icons.home,
            onPressed: () {},
            isLoading: true,
          ),

          //
          Button(
            label: "With Styled",
            icon: Icons.home,
            style: style,
            onPressed: () {},
          ),
          //
          Button(
            label: "Disabled",
            icon: Icons.home,
            style: style,
            onPressed: null,
          ),
          //
          Button(
            label: "Loading",
            icon: Icons.home,
            style: style,
            onPressed: () {},
            isLoading: true,
          ),
        ],
      ),
    ),
  );
}
