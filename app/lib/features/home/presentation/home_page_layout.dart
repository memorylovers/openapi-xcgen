import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../../_gen/i18n/strings.g.dart';
import '../../../common/theme/app_colors.dart';

final homePageScaffoldKey = GlobalKey(debugLabel: "HomePageLayout");

class HomePageLayout extends HookConsumerWidget {
  const HomePageLayout({super.key, required this.navigationShell});
  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bottomNavItems = [
      BottomNavigationBarItem(icon: const Icon(Icons.home), label: "Home"),
      BottomNavigationBarItem(
        icon: const Icon(Icons.person),
        label: i18n.settings.title,
      ),
    ];

    return Scaffold(
      key: homePageScaffoldKey,
      backgroundColor: AppColors.primary,
      body: SafeArea(
        child: Container(color: Colors.white, child: navigationShell),
      ),
      bottomNavigationBar: BottomNavigationBar(
        backgroundColor: Colors.white,
        selectedItemColor: AppColors.primary,
        currentIndex: navigationShell.currentIndex,
        onTap: (index) => navigationShell.goBranch(index),
        items: bottomNavItems,
      ),
    );
  }
}
