import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

final borderRed = BoxDecoration(
  border: Border.all(style: BorderStyle.solid, color: Colors.red, width: 1),
);

class DebugBorder extends StatelessWidget {
  const DebugBorder({
    super.key,
    required this.child,
    this.isShow = kDebugMode,
    this.borderColor = Colors.red,
  });
  final Widget child;
  final bool isShow;
  final Color borderColor;

  @override
  Widget build(BuildContext context) {
    if (!isShow) return child;
    return DecoratedBox(
      decoration: BoxDecoration(
        border: Border.all(
          style: BorderStyle.solid,
          color: borderColor,
          width: 1,
        ),
      ),
      child: child,
    );
  }
}
