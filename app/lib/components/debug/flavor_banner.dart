import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../flavors.dart';

class FlavorBanner extends HookConsumerWidget {
  const FlavorBanner({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (kIsProd) return child;

    const color = Colors.red;
    final textColor =
        HSLColor.fromColor(color).lightness < 0.8
            ? Colors.white
            : Colors.black87;
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Banner(
        location: BannerLocation.bottomStart,
        message: kFlavor.name,
        color: color,
        textStyle: TextStyle(
          color: textColor,
          fontSize: 12.0 * 0.85,
          fontWeight: FontWeight.w900,
          height: 1.0,
        ),
        child: child,
      ),
    );
  }
}
