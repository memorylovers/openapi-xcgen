import 'package:collection/collection.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import '../../../../common/exception/handling_error.dart';
import '../../../../common/firebase/firebase_providers.dart';
import '../../../../common/logger/logger.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../constants.dart';
import '../../../../flavors.dart';

part 'payment_provider.freezed.dart';
part 'payment_provider.g.dart';

const logTag = "payment";

/// ユーザの購入状態
@freezed
class PaymentState with _$PaymentState {
  const PaymentState._();

  const factory PaymentState({
    CustomerInfo? customer,
    Offerings? offerings,
    required bool isLoading,
    required bool isConfigured,
    Object? error,
  }) = _PaymentState;

  /// 課金済み(プレミアムプラン)かどうかのフラグ
  bool get isPremium {
    return (customer?.entitlements.active.isNotEmpty ?? false);
  }

  /// 課金アイテムの一覧取得
  List<Package> get planItems {
    return offerings?.getOffering(kRevenueCatOfferingId)?.availablePackages ??
        [];
  }

  /// 商品が購入済みかどうかの判定
  bool isPurchased(Package package) {
    return customer?.activeSubscriptions.firstWhereOrNull(
          (v) => v == package.storeProduct.identifier,
        ) !=
        null;
  }
}

// ********************************************************
// * providers
// ********************************************************
@Riverpod(keepAlive: true)
class Payment extends _$Payment {
  @override
  PaymentState build() {
    updateCustomer(CustomerInfo customer) {
      logger.debug("** $logTag:updateCustomer: ${customer.toJson()}");
      state = state.copyWith(customer: customer);
    }

    // set listener
    Purchases.addCustomerInfoUpdateListener(updateCustomer);
    ref.onDispose(() {
      Purchases.removeCustomerInfoUpdateListener(updateCustomer);
    });

    // ログイン状態を監視
    ref.listen(firebaseUserProvider, (prev, next) {
      if (next.value == null) {
        // 未ログインの場合は、ログアウトし、uidとemailをクリアする
        logout();
      } else {
        // ログイン済みの場合は、uidとemailを設定
        setAppUserId(next.value!.uid, next.value?.email);
      }
    });

    // init load
    Future.delayed(500.ms, _setup);
    return const PaymentState(isLoading: false, isConfigured: false);
  }

  // ********************************************************
  // * Actions
  // ********************************************************

  /// 購入状態の最新化
  Future<void> refresh() async {
    logger.debug("** $logTag:refresh: isConfigured=${state.isConfigured}");
    if (!state.isConfigured) {
      final authUser = await ref.read(firebaseUserProvider.future);
      if (authUser == null) return;
      await setAppUserId(authUser.uid, authUser.email);
      if (!state.isConfigured) return;
    }
    // fetch Customer Info
    logger.debug("** $logTag:refresh: getCustomerInfo: START");
    final customerInfo = await Purchases.getCustomerInfo();
    state = state.copyWith(customer: customerInfo, error: null);
    logger.debug("** $logTag:refresh: getCustomerInfo: DONE");
  }

  /// ユーザIDの設定
  Future<void> setAppUserId(String uid, String? email) async {
    final isConfigured = await Purchases.isConfigured;
    logger.debug(
      "** $logTag:setAppUserId: uid=$uid isConfigured=$isConfigured",
    );
    if (!isConfigured) {
      await _configure(uid, email);
    } else {
      await _login(uid, email);
    }
  }

  /// 購入
  Future<void> purchasePlan(Package package) async {
    await _withLoading("purchasePlan", () async {
      CustomerInfo customerInfo = await Purchases.purchasePackage(package);
      logger.debug(
        "** $logTag:purchasePlan: uid=${customerInfo.originalAppUserId}, isPremium=${customerInfo.entitlements.active.isNotEmpty}",
      );
      state = state.copyWith(customer: customerInfo);
    });
  }

  /// 復元
  Future<void> restorePlan() async {
    await _withLoading("restorePlan", () async {
      CustomerInfo customerInfo = await Purchases.restorePurchases();
      logger.debug("** $logTag:restorePlan: customerInfo=$customerInfo");
      state = state.copyWith(customer: customerInfo);
    });
  }

  // ********************************************************
  // * private
  // ********************************************************
  /// 初期設定
  Future<void> _setup() async {
    await _withLoading("_setup", () async {
      try {
        // check isConfigured
        if (!state.isConfigured) {
          final isConfigured = await Purchases.isConfigured;
          state = state.copyWith(isConfigured: isConfigured);
          // 未初期化の場合は何もしない
          if (!isConfigured) return;
        }

        // fetch Offerings
        if (state.planItems.isEmpty) {
          final offerings = await Purchases.getOfferings();
          state = state.copyWith(offerings: offerings);
        }

        // fetch Customer Info
        final customerInfo = await Purchases.getCustomerInfo();
        state = state.copyWith(customer: customerInfo);
      } catch (error) {
        state = state.copyWith(error: error);
      }
    });
  }

  /// 初期化ありのログイン
  Future<void> _configure(String uid, String? email) async {
    await _withLoading("_configure", () async {
      // 初期化
      final configuration = PurchasesConfiguration(kRevenueCatApiKey);
      configuration.appUserID = uid;
      await Purchases.configure(configuration);
      state = state.copyWith(isConfigured: true);
      if (email != null && email.isNotEmpty) {
        await Purchases.setEmail(email);
      }

      // ステートの初期化
      await _setup();
    });
  }

  /// 初期化なしのログイン
  Future<void> _login(String uid, String? email) async {
    await _withLoading("_login", () async {
      // ログイン
      final current = await Purchases.getCustomerInfo();
      // appUserIdが同じなら何もしない
      if (current.originalAppUserId == uid) return;
      final result = await Purchases.logIn(uid);
      if (email != null && email.isNotEmpty) {
        await Purchases.setEmail(email);
      }
      logger.debug("** $logTag:_login: result=$result");

      // ステートの初期化
      await _setup();
    });
  }

  /// ログアウト
  Future<void> logout() async {
    await _withLoading("_logout", () async {
      final result = await Purchases.logOut();
      logger.debug("** $logTag:_logout: result=$result");
    });
  }

  /// loadingつきの共通処理
  FutureOr<void> _withLoading(
    String debugLabel,
    FutureOr<void> Function() func,
  ) async {
    try {
      state = state.copyWith(isLoading: true, error: null);
      await func();
    } catch (e) {
      handleError(e);
    } finally {
      state = state.copyWith(isLoading: false);
    }
  }
}
