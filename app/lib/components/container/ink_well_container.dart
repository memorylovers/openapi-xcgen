import 'package:flutter/material.dart';

class InkWellContainer extends StatelessWidget {
  const InkWellContainer({
    super.key,
    this.color,
    this.borderRadius,
    this.padding,
    this.child,
    this.onTap,
    this.width,
    this.height,
    this.constraints,
    this.margin,
  });

  // Material
  final Color? color;
  final BorderRadiusGeometry? borderRadius;

  // InkWell
  final Function()? onTap;

  // Container
  final EdgeInsetsGeometry? padding;
  final double? width;
  final double? height;
  final BoxConstraints? constraints;
  final EdgeInsetsGeometry? margin;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return Material(
      clipBehavior: Clip.hardEdge,
      color: color,
      borderRadius: borderRadius,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: padding,
          width: width,
          height: height,
          constraints: constraints,
          margin: margin,
          child: child,
        ),
      ),
    );
  }
}
