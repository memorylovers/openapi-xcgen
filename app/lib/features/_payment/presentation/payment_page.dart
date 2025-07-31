import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../_gen/i18n/strings.g.dart';

/// 課金画面
class PaymentPage extends HookConsumerWidget {
  const PaymentPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: Text(i18n.payment.title)),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 説明テキスト
              Text(
                i18n.payment.description,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 32),
              // プラン一覧
              Expanded(
                child: ListView(
                  children: [
                    _buildPlanCard(
                      context,
                      title: 'フリープラン',
                      price: '無料',
                      features: ['基本機能の利用', '最大10個の商品登録', '1つの買い物リスト'],
                      isSelected: true,
                    ),
                    const SizedBox(height: 16),
                    _buildPlanCard(
                      context,
                      title: 'スタンダードプラン',
                      price: '¥480/月',
                      features: [
                        'すべての基本機能',
                        '無制限の商品登録',
                        '最大5つの買い物リスト',
                        'カテゴリ分類機能',
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildPlanCard(
                      context,
                      title: 'プレミアムプラン',
                      price: '¥980/月',
                      features: [
                        'すべての機能',
                        '無制限の商品登録',
                        '無制限の買い物リスト',
                        '高度な分析機能',
                        '優先サポート',
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlanCard(
    BuildContext context, {
    required String title,
    required String price,
    required List<String> features,
    bool isSelected = false,
  }) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side:
            isSelected
                ? BorderSide(color: Theme.of(context).primaryColor, width: 2)
                : BorderSide.none,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleLarge),
                if (isSelected)
                  Icon(
                    Icons.check_circle,
                    color: Theme.of(context).primaryColor,
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              price,
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ...features.map(
              (feature) => Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  children: [
                    const Icon(Icons.check, size: 16),
                    const SizedBox(width: 8),
                    Text(feature),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            if (!isSelected)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    // TODO: 課金処理
                  },
                  child: const Text('選択する'),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
