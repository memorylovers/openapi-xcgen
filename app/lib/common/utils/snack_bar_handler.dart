import 'package:flutter/material.dart';

/// SnackBarを扱うクラス
class SnackBarHandler {
  /// エラーを表示
  static showError(BuildContext context, {required String message}) {
    if (!context.mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: Colors.red[700],
        content: Text(message, style: TextStyle(color: Colors.white)),
      ),
    );
  }
}
