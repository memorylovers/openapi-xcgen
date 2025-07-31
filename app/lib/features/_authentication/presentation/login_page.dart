import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:gap/gap.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../../_gen/assets/assets.gen.dart';
import '../../../_gen/i18n/strings.g.dart';
import '../../../common/theme/app_colors.dart';
import '../../../common/types/types.dart';
import '../../../common/utils/snack_bar_handler.dart';
import '../../../components/buttons/buttons.dart';
import '../application/auth_providers.dart';

/// ログインボタンの要素
typedef LoginButtonItem = ({String label, IconData icon, AuthType type});

final List<LoginButtonItem> loginButtons = [
  (label: i18n.login.googleSignIn, icon: Icons.login, type: AuthType.google),
  (label: i18n.login.appleSignIn, icon: Icons.apple, type: AuthType.apple),
  (
    label: i18n.login.anonymousSignIn,
    icon: Icons.person_outline,
    type: AuthType.anonymous,
  ),
];

/// ログイン画面
class LoginPage extends HookConsumerWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLoading = useState(false);

    /// ログイン押下時の処理
    onClickLogin(LoginButtonItem v) async {
      try {
        isLoading.value = true;

        // await Future.delayed(3.seconds);

        // throw AppException();
        await ref.read(authStoreProvider.notifier).signIn(v.type);
      } catch (e) {
        if (!context.mounted) return;

        // TODO: エラーメッセージをいい感じにする
        SnackBarHandler.showError(context, message: "$e");
        isLoading.value = false;
      }
    }

    return Scaffold(
      backgroundColor: AppColors.primary,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Assets.icons.iconCircle512.image(width: 160, height: 160),
              Text(
                i18n.app.name,
                style: Theme.of(
                  context,
                ).textTheme.headlineSmall?.copyWith(color: Colors.white),
                textAlign: TextAlign.center,
              ),
              const Gap(48),

              // buttons
              Stack(
                children: [
                  // ローディング中は、サイズを維持して非表示にする
                  Visibility(
                    visible: !isLoading.value,
                    maintainSize: true,
                    maintainAnimation: true,
                    maintainState: true,
                    maintainInteractivity: false,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        for (final v in loginButtons)
                          Button(
                            onPressed:
                                isLoading.value ? null : () => onClickLogin(v),
                            icon: v.icon,
                            label: v.label,
                            labelWidth: 200,
                          ),
                      ],
                    ),
                  ),

                  // ローディングを表示
                  if (isLoading.value)
                    Positioned.fill(
                      child: Align(
                        alignment: Alignment.center,
                        child: CircularProgressIndicator(color: Colors.white),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
