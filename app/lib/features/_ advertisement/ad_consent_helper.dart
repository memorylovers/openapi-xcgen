import 'dart:async';

import 'package:google_mobile_ads/google_mobile_ads.dart';

import '../../common/logger/logger.dart';
import '../../constants.dart';

const logTag = "adconsent";

final consentDebugSettings = ConsentDebugSettings(
  debugGeography: DebugGeography.debugGeographyEea,
  testIdentifiers: kTestDeviceIdentifiers,
);

/// 同意のチェックとリクエスト
Future<void> checkAndRequestAdConsent({
  ConsentDebugSettings? debugSettings,
}) async {
  try {
    // 同意ステータスの取得
    final status = await ConsentInformation.instance.getConsentStatus();
    logger.debug("** $logTag:checkAndRequestAdConsent: status=$status");

    // リクエストパラメタの作成
    final params = ConsentRequestParameters(
      consentDebugSettings: debugSettings,
    );

    // 同意情報のリクエスト
    await _requestConsentInfoUpdate(params);

    // 現在の同意ステータスの読み込み完了後、
    // 必要に応じて同意フォームの読み込み＆同意メッセージを表示
    final error = await _loadAndShowConsentFormIfRequired();
    if (error != null) {
      // 同意ステータスが取得できなかったとき
      logger.debug("** $logTag:checkAndRequestAdConsent:SHOW_ERROR: $error");
    }
    // 広告の初期化
    _initAdSDK();
  } catch (error) {
    logger.debug("** $logTag:checkAndRequestAdConsent:ERROR: $error");
  }
}

/// 広告の初期化
void _initAdSDK() async {
  // 広告をリクエストできる同意ステータス化の確認
  final canRequestAds = await ConsentInformation.instance.canRequestAds();
  logger.debug("** $logTag:_initAdSDK: canRequestAds=$canRequestAds");
  if (!canRequestAds) return;
  // AdMobの初期化
  MobileAds.instance.initialize();
}

/// 同意のリセット
void resetConsent() {
  ConsentInformation.instance.reset();
}

Future<bool> isPrivacyOptionsRequired() async {
  final status = await ConsentInformation.instance.getConsentStatus();
  return status == ConsentStatus.obtained;
}

Future<void> showPrivacyOptionsForm() async {
  // 同意ステータスの取得
  final status = await ConsentInformation.instance.getConsentStatus();
  logger.debug("** $logTag:showPrivacyOptionsForm: status=$status");

  final error = await _showPrivacyOptionsForm();
  if (error != null) {
    // 同意ステータスが取得できなかったとき
    logger.debug("** $logTag:showPrivacyOptionsForm:SHOW_ERROR: $error");
  }
}

// ********************************************************
// *
// ********************************************************

/// Async requestConsentInfoUpdate
Future<void> _requestConsentInfoUpdate(ConsentRequestParameters params) {
  logger.debug("** $logTag:_requestConsentInfoUpdate: START");
  final completer = Completer();

  // 同意情報のリクエスト
  ConsentInformation.instance.requestConsentInfoUpdate(
    params,
    () async {
      logger.debug("** $logTag:_requestConsentInfoUpdate: END");
      // 現在の同意ステータスの読み込み完了時
      completer.complete();
    },
    (FormError error) {
      logger.debug("** $logTag:_requestConsentInfoUpdate: ERROR: $error");
      // Handle the error.
      completer.completeError(error);
    },
  );

  return completer.future;
}

/// Async loadAndShowConsentFormIfRequired
Future<FormError?> _loadAndShowConsentFormIfRequired() {
  logger.debug("** $logTag:_loadAndShowConsentFormIfRequired: START");
  final completer = Completer<FormError?>();

  // 必要に応じて同意フォームの読み込み＆同意メッセージを表示
  ConsentForm.loadAndShowConsentFormIfRequired((error) {
    logger.debug("** $logTag:_loadAndShowConsentFormIfRequired: END: $error");
    completer.complete(error);
  });
  return completer.future;
}

/// Async showPrivacyOptionsForm
Future<FormError?> _showPrivacyOptionsForm() {
  logger.debug("** $logTag:_showPrivacyOptionsForm: START");
  final completer = Completer<FormError?>();

  // プライバシーオプションフォームの表示
  ConsentForm.showPrivacyOptionsForm((formError) {
    logger.debug(
      "** $logTag:_showPrivacyOptionsForm: END: formError=$formError",
    );
    completer.complete(formError);
  });
  return completer.future;
}
