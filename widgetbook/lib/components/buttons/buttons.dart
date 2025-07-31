import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

@widgetbook.UseCase(
  name: 'Default',
  type: ElevatedButton,
  path: "components/buttons",
)
Widget elevatedDefault(BuildContext context) {
  return ElevatedButton(
    child: Text(
      context.knobs.string(label: "Button Label", initialValue: "Button"),
    ),
    onPressed: () {},
  );
}
