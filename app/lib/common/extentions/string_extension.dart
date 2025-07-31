import 'package:flutter/material.dart';
// import 'package:twemoji_v2/twemoji_v2.dart';

extension StringEx on String {
  // bool get isEmoji {
  //   return TwemojiUtils.emojiRegex.hasMatch(this);
  // }

  bool get isValidStageChar {
    return characters.length == 1;
  }
}
