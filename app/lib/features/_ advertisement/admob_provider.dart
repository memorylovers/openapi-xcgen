import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../flavors.dart';
import '../../common/logger/logger.dart';

part 'admob_provider.freezed.dart';
part 'admob_provider.g.dart';

@freezed
class BannerAdWithSize with _$BannerAdWithSize {
  const BannerAdWithSize._();
  const factory BannerAdWithSize({
    required BannerAd bannerAd,
    required AdSize adSize,
  }) = _BannerAdWithSize;

  dispose() {
    bannerAd.dispose();
  }

  SizedBox get widget {
    return SizedBox(
      width: adSize.width.toDouble(),
      height: adSize.height.toDouble(),
      child: bannerAd.widget,
    );
  }
}

@freezed
class AdBannerStoreState with _$AdBannerStoreState {
  const AdBannerStoreState._();
  const factory AdBannerStoreState({
    required bool loading,
    required BannerAd? bannerTop,
    required BannerAd? bannerResult,
    required AsyncValue<RewardedAd?> rewardedAd,
  }) = _AdBannerStoreState;
}

@riverpod
class AdBannerStore extends _$AdBannerStore {
  @override
  AdBannerStoreState build() {
    createTop();
    createResult();

    ref.onDispose(() {
      state.bannerTop?.dispose();
      state.bannerResult?.dispose();
    });

    return const AdBannerStoreState(
      loading: false,
      bannerTop: null,
      bannerResult: null,
      rewardedAd: AsyncValue.data(null),
    );
  }

  // ********************************************************
  // * private
  // ********************************************************
  void createTop() {
    // ネットワークエラー時に、少し待って再試行
    createAdBanner(
      kAdMobBannerTop,
      label: "AdBannerTop",
      adSize: AdSize.banner,
      onAdLoaded: (ad) {
        state = state.copyWith(bannerTop: ad as BannerAd);
      },
      onAdFailedToLoad: (ad, error) {
        state = state.copyWith(bannerTop: null);
        ad.dispose();
        // recreate
        Future.delayed(10.seconds).then((_) => createTop());
      },
    ).load();
  }

  void createResult() {
    // ネットワークエラー時に、少し待って再試行
    createAdBanner(
      kAdMobBannerResult,
      label: "AdBannerResult",
      adSize: AdSize.mediumRectangle,
      onAdLoaded: (ad) async {
        state = state.copyWith(bannerResult: ad as BannerAd);
      },
      onAdFailedToLoad: (ad, error) async {
        state = state.copyWith(bannerResult: null);
        await ad.dispose();
        // recreate
        Future.delayed(10.seconds).then((_) => createResult());
      },
    ).load();
  }

  void loadReward() {
    state = state.copyWith(rewardedAd: const AsyncValue.loading());
    loadAdReward(
      kAdMobReward,
      label: "AdReward",
      onAdLoaded: (ad) async {
        state = state.copyWith(rewardedAd: AsyncValue.data(ad));
      },
      onAdFailedToLoad: (error) async {
        state = state.copyWith(
          rewardedAd: AsyncValue.error(error, StackTrace.current),
        );
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        state = state.copyWith(
          rewardedAd: AsyncValue.error(error, StackTrace.current),
        );
        ad.dispose();
      },
      onAdDismissedFullScreenContent: (ad) {
        state = state.copyWith(rewardedAd: const AsyncValue.data(null));
        ad.dispose();
      },
    );
  }
}

// ********************************************************
// * private
// ********************************************************
extension AdSizeEx on AdSize {
  double get aspect {
    return width / height;
  }
}

extension BannerAdEx on BannerAd {
  AdWidget get widget {
    return AdWidget(ad: this);
  }
}

// create BannerAd
BannerAd createAdBanner(
  String adUnitId, {
  AdEventCallback? onAdLoaded,
  AdLoadErrorCallback? onAdFailedToLoad,
  AdEventCallback? onAdClosed,
  AdEventCallback? onAdOpened,
  AdEventCallback? onAdWillDismissScreen,
  AdEventCallback? onAdClicked,
  AdEventCallback? onAdImpression,
  OnPaidEventCallback? onPaidEvent,
  String label = "AdListener",
  AdSize adSize = AdSize.fluid,
  AdRequest adRequest = const AdRequest(),
}) {
  return BannerAd(
    adUnitId: adUnitId,
    request: adRequest,
    size: adSize,
    listener: BannerAdListener(
      onAdLoaded: (ad) {
        logger.debug('** $label@onAdLoaded: ad=${ad.adUnitId}');
        onAdLoaded?.call(ad);
      },
      onAdFailedToLoad: (ad, error) {
        logger.debug(
          '** $label@onAdFailedToLoad: ad=${ad.adUnitId}, err=${error.message}',
        );
        onAdFailedToLoad?.call(ad, error);
      },
      onAdClosed: (ad) {
        logger.debug('** $label@onAdClosed: ad=${ad.adUnitId}');
        onAdClosed?.call(ad);
      },
      onAdWillDismissScreen: (ad) {
        logger.debug('** $label@onAdWillDismissScreen: ad=${ad.adUnitId}');
        onAdWillDismissScreen?.call(ad);
      },
      onAdClicked: (ad) {
        logger.debug('** $label@onAdClicked: ad=${ad.adUnitId}');
        onAdClicked?.call(ad);
      },
      onAdImpression: (ad) {
        logger.debug('** $label@onAdImpression: ad=${ad.adUnitId}');
        onAdImpression?.call(ad);
      },
      onAdOpened: (ad) {
        logger.debug('** $label@onAdOpened: ad=${ad.adUnitId}');
        onAdOpened?.call(ad);
      },
      onPaidEvent: (ad, valueMicros, precision, currencyCode) {
        logger.debug('** $label@onPaidEvent: ad=${ad.adUnitId}');
        onPaidEvent?.call(ad, valueMicros, precision, currencyCode);
      },
    ),
  );
}

/// create and load RewardAd
Future<void> loadAdReward(
  String adUnitId, {
  // RewardedAdLoadCallback
  GenericAdEventCallback<RewardedAd>? onAdLoaded,
  FullScreenAdLoadErrorCallback? onAdFailedToLoad,
  // FullScreenContentCallback
  GenericAdEventCallback<RewardedAd>? onAdShowedFullScreenContent,
  GenericAdEventCallback<RewardedAd>? onAdImpression,
  Function(RewardedAd ad, AdError error)? onAdFailedToShowFullScreenContent,
  GenericAdEventCallback<RewardedAd>? onAdWillDismissFullScreenContent,
  GenericAdEventCallback<RewardedAd>? onAdDismissedFullScreenContent,
  GenericAdEventCallback<RewardedAd>? onAdClicked,
  //
  String label = "AdListener",
  AdRequest adRequest = const AdRequest(),
}) {
  final callback = FullScreenContentCallback<RewardedAd>(
    onAdShowedFullScreenContent: (ad) {
      logger.debug('** $label@onAdShowedFullScreenContent: ad=${ad.adUnitId}');
      onAdShowedFullScreenContent?.call(ad);
    },
    onAdImpression: (ad) {
      logger.debug('** $label@onAdImpression: ad=${ad.adUnitId}');
      onAdImpression?.call(ad);
    },
    onAdFailedToShowFullScreenContent: (ad, error) {
      logger.debug(
        '** $label@onAdFailedToShowFullScreenContent: ad=${ad.adUnitId}',
      );
      onAdFailedToShowFullScreenContent?.call(ad, error);
    },
    onAdWillDismissFullScreenContent: (ad) {
      logger.debug(
        '** $label@onAdWillDismissFullScreenContent: ad=${ad.adUnitId}',
      );
      onAdWillDismissFullScreenContent?.call(ad);
    },
    onAdDismissedFullScreenContent: (ad) {
      logger.debug(
        '** $label@onAdDismissedFullScreenContent: ad=${ad.adUnitId}',
      );
      onAdDismissedFullScreenContent?.call(ad);
    },
    onAdClicked: (ad) {
      logger.debug('** $label@onAdClicked: ad=${ad.adUnitId}');
      onAdClicked?.call(ad);
    },
  );

  return RewardedAd.load(
    adUnitId: adUnitId,
    request: adRequest,
    rewardedAdLoadCallback: RewardedAdLoadCallback(
      onAdLoaded: (ad) {
        logger.debug('** $label@onAdLoaded: ad=${ad.adUnitId}');
        ad.fullScreenContentCallback = callback;
        onAdLoaded?.call(ad);
      },
      onAdFailedToLoad: (error) {
        logger.debug('** $label@onAdFailedToLoad: err=${error.message}');
        onAdFailedToLoad?.call(error);
      },
    ),
  );
}
