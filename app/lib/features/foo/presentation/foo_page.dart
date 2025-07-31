import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// サンプル画面
class FooPage extends HookConsumerWidget {
  const FooPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: Text("Foo")),
      body: SafeArea(child: Container()),
    );
  }
}
