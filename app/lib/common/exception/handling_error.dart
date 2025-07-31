import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/services.dart';
import 'package:purchases_flutter/errors.dart';
import 'package:purchases_flutter/models/purchases_error.dart';

import '../logger/logger.dart';
import 'app_error_code.dart';
import 'app_exception.dart';

/// 例外のハンドリング
///
/// - 例外をAppExceptionにwrap
void handleError(Object error) {
  logger.debug("** handleError=$error");

  // AppExceptionの場合は、rethrowする
  if (error is AppException) {
    throw error;
  } else if (error is FirebaseException) {
    // FirebaseExceptionは変換する
    _convertFirebaseException(error);
  } else if (error is PurchasesError) {
    // RevenueCatの例外は変換する
    _convertPurchasesErrorCodeToException(error.code, error);
  } else if (error is PlatformException) {
    switch (error.code) {
      // ネットワークエラー
      case "network_error":
        throw AppException(code: AppErrorCode.networkError, cause: error);
    }
    // RevenueCat
    final code = PurchasesErrorHelper.getErrorCode(error);
    _convertPurchasesErrorCodeToException(code, error);
  } else {
    throw AppException(code: AppErrorCode.unknown, cause: error);
  }
}

/// Firebase関連のエラーハンドリング
_convertFirebaseException(FirebaseException error) {
  logger.debug("** handleError@Firebase: ${error.code}, ${error.message}");
  switch (error.code) {
    case "credential-already-in-use":
      throw AppException(code: AppErrorCode.authAlreadyLinked, cause: error);
    case "web-context-canceled": // AndroidでApple認証のキャンセル
    case "canceled": // iOSでApple認証のキャンセル
      return;
    case "network-request-failed":
    case "unavailable":
      throw AppException(code: AppErrorCode.networkError, cause: error);
  }

  throw AppException(code: AppErrorCode.unknown, cause: error);
}

/// 購入関連のエラーハンドリング
_convertPurchasesErrorCodeToException(PurchasesErrorCode code, Object error) {
  logger.debug("** _convertPurchasesErrorCodeToException: $code / $error");
  switch (code) {
    case PurchasesErrorCode.purchaseCancelledError:
      // 購入画面を開いて、キャンセルした時 / DO NOTHING
      break;
    case PurchasesErrorCode.operationAlreadyInProgressError:
      // すでに実行中の操作
      break;
    // ********************************************************
    // * ネットワークエラー
    // ********************************************************
    case PurchasesErrorCode.networkError: // ネットワークエラー
    case PurchasesErrorCode.offlineConnectionError: // ネットワークエラー
      throw AppException(code: AppErrorCode.networkError, cause: error);
    // ********************************************************
    // * その他のエラー
    // ********************************************************
    case PurchasesErrorCode.purchaseNotAllowedError: // 購入が許可されていないデバイス or ユーザ
    case PurchasesErrorCode.insufficientPermissionsError: // ユーザに購入する権利がない
      // 購入できないユーザです
      throw AppException(code: AppErrorCode.unknown, cause: error);
    case PurchasesErrorCode.productNotAvailableForPurchaseError:
      // 購入できない商品
      throw AppException(code: AppErrorCode.unknown, cause: error);
    case PurchasesErrorCode.productAlreadyPurchasedError:
      // 購入済みの商品
      return;
    case PurchasesErrorCode.receiptAlreadyInUseError:
    case PurchasesErrorCode.receiptInUseByOtherSubscriberError:
      // 購入履歴がすでに他のアカウントで使用済み
      throw AppException(code: AppErrorCode.unknown, cause: error);
    case PurchasesErrorCode.ineligibleError:
      // ユーザに実行する権限がない
      throw AppException(code: AppErrorCode.unknown, cause: error);
    case PurchasesErrorCode.paymentPendingError:
      // 支払いが保留中
      throw AppException(code: AppErrorCode.unknown, cause: error);

    // ********************************************************
    // * 予期せぬエラー
    // ********************************************************
    case PurchasesErrorCode.unknownError: // 予期せぬエラー
    case PurchasesErrorCode.storeProblemError: // ストア側のエラー
    case PurchasesErrorCode.purchaseInvalidError: // 購入時の引数が不正
    case PurchasesErrorCode.invalidReceiptError: // 不正なレシート
    case PurchasesErrorCode.missingReceiptFileError: // レシートが見つからない
    case PurchasesErrorCode.invalidCredentialsError: // 不正な資格情報
    case PurchasesErrorCode.unexpectedBackendResponseError: // バックエンドから不正なレスポンス
    case PurchasesErrorCode.invalidAppUserIdError: // 不正なApp User Id
    case PurchasesErrorCode.unknownBackendError: // バックエンドでの予期せぬエラー
    case PurchasesErrorCode.invalidAppleSubscriptionKeyError: // Appleサブスクのキーが不正
    case PurchasesErrorCode.invalidSubscriberAttributesError: // 属性の保存に失敗
    case PurchasesErrorCode.unknownNonNativeError: // 予期せぬエラー
    case PurchasesErrorCode.logOutWithAnonymousUserError: // 匿名ユーザでのログアウトの実行エラー
    case PurchasesErrorCode.configurationError: // 構成/設定のエラー
    case PurchasesErrorCode.unsupportedError: // サポートされていない操作
    case PurchasesErrorCode.emptySubscriberAttributesError: // 属性をリクエストしたが、空の属性
    case PurchasesErrorCode
        .productDiscountMissingIdentifierError: // 必須プロパティの欠落。AppStore側が原因？
    case PurchasesErrorCode
        .productDiscountMissingSubscriptionGroupIdentifierError: // 割引Offerの作成失敗。Subscription GroupにIdがない
    case PurchasesErrorCode.customerInfoError: // 顧客情報に関してのエラー
    case PurchasesErrorCode.systemInfoError: // システム情報に関するエラー
    case PurchasesErrorCode.beginRefundRequestError: // 返金リクエストの開始時のエラー
    case PurchasesErrorCode.productRequestTimeout: // SKProductsRequestのタイムアウト
    case PurchasesErrorCode.apiEndpointBlocked: // ブロックされているRevenueCat側のエンドポイント
    case PurchasesErrorCode
        .invalidPromotionalOfferError: // PromotionalOfferに関連付けられた情報が不正
  }

  throw AppException(code: AppErrorCode.unknown, cause: error);
}

// // エラーメッセージの取得
// String getErrorMessage(L10n l10n, Object? error) {
//   logger.debug("** getErrorMessage=$error");
//   if (error is AppException) {
//     return error.message(l10n);
//   } else {
//     return l10n.errorUnknown;
//   }
// }
