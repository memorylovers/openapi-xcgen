import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:gap/gap.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart';

import '../../common/extentions/widget_extension.dart';
import '../buttons/primary_button.dart';
import '../buttons/scondary_button.dart';

typedef OnConfirm = FutureOr<void> Function(ValueNotifier<bool> isLoading);

/// 確認ダイアログ
///
/// タイトル/メッセージを表示
/// OKとCancelのボタンがある
/// シンプルなダイアログ
class ConfirmDialog extends HookWidget {
  const ConfirmDialog({
    super.key,
    required this.title,
    required this.messages,
    required this.onConfirm,
  });
  final String title;
  final List<String> messages;
  final OnConfirm onConfirm;

  static show(
    BuildContext ctx, {
    required String title,
    required List<String> messages,
    required OnConfirm onConfirm,
  }) {
    showDialog(
      context: ctx,
      builder:
          (ctx) => ConfirmDialog(
            title: title,
            messages: messages,
            onConfirm: onConfirm,
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = useState(false);

    void onClose() {
      Navigator.of(context).pop();
    }

    return Dialog(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: Container(
        padding: EdgeInsets.all(16),
        constraints: BoxConstraints(maxWidth: 600),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              title,
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),

            const Gap(16),

            for (final message in messages)
              Text(message, style: TextStyle(fontSize: 16)),

            const Gap(24),

            // Buttons
            Row(
              spacing: 16,
              children: [
                SecondaryButton(
                  borderColor: Colors.grey,
                  textColor: Colors.grey,
                  isLoading: isLoading.value,
                  text: "Close",
                  onPressed: onClose,
                ).expand(),
                PrimaryButton(
                  isLoading: isLoading.value,
                  text: "OK",
                  onPressed: () async {
                    await onConfirm(isLoading);

                    onClose();
                  },
                ).expand(),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

@UseCase(name: "Default", type: ConfirmDialog, path: "components/dialog")
Widget usecaseConfirmDialog(BuildContext context) {
  return Scaffold(
    body: SafeArea(
      child: PrimaryButton(
        text: "ボタン",
        onPressed: () {
          ConfirmDialog.show(
            context,
            title: "たいとる",
            messages: ["めっせーじ１", "めっせーじ２"],
            onConfirm: (isLoading) async {
              isLoading.value = true;
              await Future.delayed(Duration(seconds: 1));
              isLoading.value = false;
            },
          );
        },
      ),
    ),
  );
}
