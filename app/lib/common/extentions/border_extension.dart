import 'package:flutter/material.dart';

enum BorderPos {
  t,
  b,
  l,
  r,
  ;

  static get all => [t, b, l, r];
  static get th => [t, l, r];
  static get bh => [b, l, r];
  static get h => [l, r];
  static get v => [t, b];
}

extension BorderSideEx on BorderSide {
  Border on(Iterable<BorderPos> pos) {
    return Border(
      top: pos.contains(BorderPos.t) ? this : BorderSide.none,
      bottom: pos.contains(BorderPos.b) ? this : BorderSide.none,
      left: pos.contains(BorderPos.l) ? this : BorderSide.none,
      right: pos.contains(BorderPos.r) ? this : BorderSide.none,
    );
  }

  Border all() {
    return on(BorderPos.all);
  }
}

enum RadiusPos {
  tl,
  tr,
  bl,
  br;

  static get top => [tl, tr];
  static get bottom => [bl, br];
  static get left => [tl, bl];
  static get right => [tr, br];
}

extension RadiusEx on Radius {
  BorderRadius on(Iterable<RadiusPos> pos) {
    return BorderRadius.only(
      topLeft: pos.contains(RadiusPos.tl) ? this : Radius.zero,
      topRight: pos.contains(RadiusPos.tr) ? this : Radius.zero,
      bottomLeft: pos.contains(RadiusPos.bl) ? this : Radius.zero,
      bottomRight: pos.contains(RadiusPos.br) ? this : Radius.zero,
    );
  }
}
