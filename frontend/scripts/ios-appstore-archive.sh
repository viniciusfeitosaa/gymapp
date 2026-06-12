#!/usr/bin/env bash
# Archive + export IPA para App Store Connect (Gym Code iOS).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS_DIR="$ROOT/ios/App"
WORKSPACE="$IOS_DIR/App.xcworkspace"
SCHEME="App"
ARCHIVE_PATH="$ROOT/../releases/GymCode.xcarchive"
EXPORT_DIR="$ROOT/../releases/ios-export"
EXPORT_OPTIONS="$ROOT/../releases/ExportOptions.plist"

cd "$IOS_DIR"

echo "→ Archive Release (generic iOS)..."
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" \
  clean archive

echo "→ Export + upload App Store Connect..."
rm -rf "$EXPORT_DIR"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -exportPath "$EXPORT_DIR" \
  -allowProvisioningUpdates

echo ""
echo "✓ Build enviado para App Store Connect."
echo "  Archive: $ARCHIVE_PATH"
echo "  Próximo passo: App Store Connect → versão 1.0.6 → selecionar build 13"
