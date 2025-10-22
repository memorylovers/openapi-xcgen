#!/usr/bin/env bash
set -e

echo "🔍 Checking GitHub Actions workflows with actionlint..."
echo ""

# Check if actionlint is installed
if ! command -v actionlint &> /dev/null; then
  echo "❌ Error: actionlint is not installed"
  echo ""
  echo "Install actionlint:"
  echo "  macOS:  brew install actionlint"
  echo "  Linux:  https://github.com/rhysd/actionlint#install"
  echo ""
  exit 1
fi

# Run actionlint on all workflow files
if actionlint .github/workflows/*.yml; then
  echo ""
  echo "✅ All GitHub Actions workflows passed actionlint checks!"
else
  echo ""
  echo "❌ actionlint found issues in GitHub Actions workflows"
  exit 1
fi
