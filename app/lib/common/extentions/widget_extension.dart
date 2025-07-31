import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../../components/debug/borders.dart';

extension WidgetEx on Widget {
  Expanded expand() {
    return Expanded(child: this);
  }

  Center center() {
    return Center(child: this);
  }

  Padding pad(EdgeInsets padding) {
    return Padding(padding: padding, child: this);
  }

  FittedBox fit({
    BoxFit fit = BoxFit.scaleDown,
    AlignmentGeometry alignment = Alignment.center,
  }) {
    return FittedBox(fit: fit, alignment: alignment, child: this);
  }

  SizedBox size({double? width, double? height}) {
    return SizedBox(width: width, height: height, child: this);
  }

  Transform scale(double scaleValue) {
    return Transform.scale(
      scale: scaleValue,
      alignment: Alignment.topLeft,
      child: this,
    );
  }

  GestureDetector setOnClick(
    Function()? onClick, {
    HitTestBehavior behavior = HitTestBehavior.opaque,
  }) {
    return GestureDetector(onTap: onClick, behavior: behavior, child: this);
  }

  Widget debug({Color? color, bool enable = true}) {
    if (!kDebugMode || !enable) return this;
    return DebugBorder(borderColor: color ?? Colors.red, child: this);
  }

  Flexible flexible({FlexFit fit = FlexFit.loose, int flex = 1}) {
    return Flexible(fit: fit, flex: flex, child: this);
  }

  DecoratedBox decorate(Decoration decoration) {
    return DecoratedBox(decoration: decoration, child: this);
  }

  DecoratedBox border({required Color color, double width = 1}) {
    return DecoratedBox(
      decoration: BoxDecoration(border: Border.all(color: color, width: width)),
      child: this,
    );
  }

  Opacity opacity({required double opacity}) {
    return Opacity(opacity: opacity, child: this);
  }

  IgnorePointer ignore() {
    return IgnorePointer(child: this);
  }

  Semantics semantics(String semanticId) {
    return Semantics(identifier: semanticId, child: this);
  }
}
