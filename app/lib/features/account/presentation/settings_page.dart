import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../../_gen/i18n/strings.g.dart';
import '../../../routing/router_routes.dart';
import '../../_authentication/application/auth_providers.dart';

/// 設定画面
class SettingsPage extends HookConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLoading = useState(false);

    return Scaffold(
      appBar: AppBar(title: Text(i18n.settings.title)),
      body: SafeArea(
        child: ListView(
          children: [
            // アカウント情報セクション
            _buildSection(
              context,
              title: i18n.settings.account,
              icon: Icons.person,
              children: [_buildAccountInfo(context)],
            ),
            const Divider(),
            // 課金セクション
            _buildSection(
              context,
              title: i18n.settings.payment,
              icon: Icons.payment,
              children: [
                ListTile(
                  title: Text(i18n.settings.payment),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () => const PaymentPageRoute().go(context),
                ),
              ],
            ),
            const Divider(),
            // その他セクション
            _buildSection(
              context,
              title: i18n.settings.contact,
              icon: Icons.help_outline,
              children: [
                ListTile(
                  title: Text(i18n.settings.contact),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () {
                    // TODO: お問い合わせ処理
                  },
                ),
              ],
            ),
            const Divider(),
            // ログアウトボタン
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: ElevatedButton(
                onPressed:
                    isLoading.value
                        ? null
                        : () async {
                          try {
                            isLoading.value = true;
                            await Future.delayed(Duration(seconds: 2));
                            await ref
                                .read(authStoreProvider.notifier)
                                .signOut();
                          } catch (e) {
                            // TODO: エラー処理
                          } finally {
                            isLoading.value = false;
                          }
                        },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                ),
                child: const Text('ログアウト'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(
    BuildContext context, {
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Icon(icon, color: Theme.of(context).primaryColor),
              const SizedBox(width: 8),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Theme.of(context).primaryColor,
                ),
              ),
            ],
          ),
        ),
        ...children,
      ],
    );
  }

  Widget _buildAccountInfo(BuildContext context) {
    // TODO: 実際のユーザー情報を表示
    return const ListTile(
      title: Text('ユーザー名'),
      subtitle: Text('user@example.com'),
      leading: CircleAvatar(child: Icon(Icons.person)),
    );
  }
}
