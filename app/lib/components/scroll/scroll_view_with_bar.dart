import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

class ScrollViewWithBar extends HookWidget {
  const ScrollViewWithBar({
    super.key,
    required this.child,
    this.thickness = 12,
    this.thumbColor,
  });
  final Widget child;
  final double thickness;
  final Color? thumbColor;

  @override
  Widget build(BuildContext context) {
    final scrollController = useScrollController();

    return RawScrollbar(
      controller: scrollController,
      thumbVisibility: true,
      thumbColor: thumbColor,
      thickness: thickness,
      radius: Radius.circular(thickness),
      padding: EdgeInsets.all(thickness),
      child: SingleChildScrollView(controller: scrollController, child: child),
    );
  }
}
