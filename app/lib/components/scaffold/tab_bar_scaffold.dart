import 'package:flutter/material.dart';

import '../../common/theme/app_colors.dart';

/// TabBarのScaffold
class TabBarScaffold extends StatelessWidget {
  const TabBarScaffold({
    super.key,
    required this.tabs,
    required this.children,
    this.floatingActionButton,
  });

  final List<Tab> tabs;
  final List<Widget> children;
  final FloatingActionButton? floatingActionButton;

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: tabs.length,
      child: Scaffold(
        backgroundColor: AppColors.primary[100],
        appBar: AppBar(
          toolbarHeight: 0,
          backgroundColor: Colors.white,
          elevation: 0,
          bottom: TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            indicatorColor: AppColors.primary,
            dividerColor: Colors.transparent,
            labelColor: AppColors.primary,
            tabs: tabs,
          ),
        ),
        body: TabBarView(children: children),
        floatingActionButton: floatingActionButton,
      ),
    );
  }
}
