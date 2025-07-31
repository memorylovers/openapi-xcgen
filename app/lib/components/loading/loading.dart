import 'package:flutter/material.dart';

import '../../common/theme/app_colors.dart';

/// ローディングのWidget
class LoadingWidget extends StatelessWidget {
  const LoadingWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return CircularProgressIndicator(color: AppColors.primary);
  }
}

/// サイズを指定可能なローディング
class SizedLoading extends StatelessWidget {
  const SizedLoading({super.key, required this.size});
  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(height: size, width: size, child: const LoadingWidget());
  }
}

/// 全画面表示のローディング
class FullScreenLoading extends StatelessWidget {
  const FullScreenLoading({super.key, required this.loadingSize});
  final double loadingSize;

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [SizedLoading(size: loadingSize)],
    );
  }
}
