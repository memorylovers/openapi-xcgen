import 'package:shared_preferences/shared_preferences.dart';

import '../../common/logger/logger.dart';

const String prefKeyInstallDate = "android_rate_install_date";
const String prefKeyLaunchTimes = "android_rate_launch_times";
const String prefKeyIsAgreeShowDialog = "android_rate_is_agree_show_dialog";
const String prefKeyRemindInterval = "android_rate_remind_interval";

/// AppRate
class AppRate {
  const AppRate({
    required this.pref,
    this.installDate = 10, // days
    this.launchTimes = 10, // times
    this.remindInterval = 1, // days
    this.isDebug = false,
  });
  final SharedPreferences pref;
  final int installDate;
  final int launchTimes;
  final int remindInterval;
  final bool isDebug;

  // アプリ起動時に呼び出す。起動回数の更新
  Future<void> monitor() async {
    // 初回起動の場合は、インストール日時を保存
    if (_isFirstLaunch()) await _setInstallDate();

    // 起動回数をインクリメント
    await _setLaunchTimes(_getLaunchTimes() + 1);

    debugLog();
  }

  // 表示可能かのチェック
  bool showRateDialogIfMeetsConditions() {
    logger.debug("** appRate:showRateDialogIfMeetsConditions: START");
    bool isMeetsConditions = shouldShowRateDialog();
    debugLog(appends: ["isMeetsConditions=$isMeetsConditions"]);
    return isMeetsConditions;
  }

  // レビューするを選択
  Future<void> selectOk() async {
    logger.debug("** appRate: selectOk");
    await _setAgreeShowDialog(false);
    debugLog();
  }

  // あとでを選択
  Future<void> selectLater() async {
    logger.debug("** appRate: selectLater");
    await _setRemindInterval();
    debugLog();
  }

  // しないを選択
  Future<void> selectNever() async {
    logger.debug("** appRate: selectNever");
    await _setAgreeShowDialog(false);
    debugLog();
  }

  // 表示するかの判定
  bool shouldShowRateDialog() =>
      _getIsAgreeShowDialog() &&
      isOverLaunchTimes() &&
      isOverInstallDate() &&
      isOverRemindDate();
  bool isOverLaunchTimes() => _getLaunchTimes() >= launchTimes;
  bool isOverInstallDate() => _isOverDate(_getInstallDate(), installDate);
  bool isOverRemindDate() => _isOverDate(_getRemindInterval(), remindInterval);

  // ********************************************************
  // * private
  // ********************************************************
  // 初回起動のフラグ
  bool _isFirstLaunch() {
    return pref.getInt(prefKeyInstallDate) == null;
  }

  // 保存: インストール日時
  Future<void> _setInstallDate() async {
    await pref.setInt(prefKeyInstallDate, _getTime());
  }

  // 取得: インストール日時
  int _getInstallDate() => pref.getInt(prefKeyInstallDate) ?? 0;

  // 取得: 起動回数
  int _getLaunchTimes() => pref.getInt(prefKeyLaunchTimes) ?? 0;

  // 保存: 起動回数
  Future<void> _setLaunchTimes(int times) async {
    await pref.setInt(prefKeyLaunchTimes, times);
  }

  // 取得: あとでのインターバル時間
  int _getRemindInterval() => pref.getInt(prefKeyRemindInterval) ?? 0;

  // 保存: あとでのインターバル時間
  Future<void> _setRemindInterval() async {
    await pref.remove(prefKeyRemindInterval);
    await pref.setInt(prefKeyRemindInterval, _getTime());
  }

  // 取得: 表示を許可するかのフラグ
  bool _getIsAgreeShowDialog() =>
      pref.getBool(prefKeyIsAgreeShowDialog) ?? true;

  // 保存: 表示を許可するかのフラグ
  Future<void> _setAgreeShowDialog(bool isAgree) async {
    await pref.setBool(prefKeyIsAgreeShowDialog, isAgree);
  }

  // ********************************************************
  // * private utils
  // ********************************************************
  int _getTime() => DateTime.now().millisecondsSinceEpoch;

  bool _isOverDate(int targetDate, int threshold) {
    return _getTime() - targetDate >= threshold * 24 * 60 * 60 * 1000;
  }

  void debugLog({List<String> appends = const []}) {
    if (!isDebug) return;
    final msgs = [
      "installDate: $installDate <= ${_getInstallDate()}, ${isOverInstallDate()}",
      "isAgreeShowDialog: ${_getIsAgreeShowDialog()}",
      "launchTimes: $launchTimes <= ${_getLaunchTimes()}, ${isOverLaunchTimes()}",
      "remindInterval: $remindInterval <= ${_getRemindInterval()}, ${isOverRemindDate()}",
      ...appends,
    ];
    for (final msg in msgs) {
      logger.debug("** appRate: $msg");
    }
  }
}
