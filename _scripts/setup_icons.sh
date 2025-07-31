#!/bin/bash

# generate by [IconKitchen](https://icon.kitchen/)

ASSET_DIR="./_assets/icons"
APP_DIR="./app"

# Android icon and splash
cp -fr "${ASSET_DIR}"/dev/android/res/ "${APP_DIR}/android/app/src/dev/res"
cp -fr "${ASSET_DIR}"/stag/android/res/ "${APP_DIR}/android/app/src/stag/res"
cp -fr "${ASSET_DIR}"/prod/android/res/ "${APP_DIR}/android/app/src/prod/res"
cp -fr "${ASSET_DIR}"/prod/android/res/ "${APP_DIR}/android/app/src/main/res"

# iOS icon
cp -f "${ASSET_DIR}"/dev/ios/* "${APP_DIR}/ios/Runner/Assets.xcassets/AppIcon-dev.appiconset"
cp -f "${ASSET_DIR}"/stag/ios/* "${APP_DIR}/ios/Runner/Assets.xcassets/AppIcon-stag.appiconset"
cp -f "${ASSET_DIR}"/prod/ios/* "${APP_DIR}/ios/Runner/Assets.xcassets/AppIcon-prod.appiconset"
cp -f "${ASSET_DIR}"/prod/ios/* "${APP_DIR}/ios/Runner/Assets.xcassets/AppIcon.appiconset"

# iOS splash
sips -Z 256 ${ASSET_DIR}/prod/web/icon-512.png -o ${APP_DIR}/ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage.png 
sips -Z 512 ${ASSET_DIR}/prod/web/icon-512.png -o ${APP_DIR}/ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage@2x.png
sips -Z 768 ${ASSET_DIR}/prod/web/icon-512.png -o ${APP_DIR}/ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage@3x.png 

# Web
cp -f ${ASSET_DIR}/prod/web/*.{png,ico} ${APP_DIR}/web/

# Flutter assets
cp -f "${ASSET_DIR}"/prod/android/play_store_512.png "${APP_DIR}/assets/icons/icon_square_512.png"
cp -f "${ASSET_DIR}"/prod/web/icon-512.png "${APP_DIR}/assets/icons/icon_circle_512.png"
