#!/usr/bin/env bash
set -e

echo "🚀 Testing GitHub Actions workflows with act..."
echo ""

# Check if act is installed
if ! command -v act &> /dev/null; then
  echo "❌ Error: act is not installed"
  echo ""
  echo "Install act:"
  echo "  macOS:  brew install act"
  echo "  Linux:  https://github.com/nektos/act#installation"
  echo ""
  exit 1
fi

# Auto-generate .secrets if not exists
if [ ! -f .secrets ]; then
  if [ -f .secrets.example ]; then
    echo "📝 Creating .secrets from .secrets.example..."
    cp .secrets.example .secrets
    echo "✅ .secrets created successfully"
    echo ""
  else
    echo "⚠️  Warning: .secrets.example not found"
    echo "Creating empty .secrets file..."
    touch .secrets
    echo ""
  fi
fi

# Parse workflow argument
WORKFLOW="${1:-all}"

case "$WORKFLOW" in
  release-latest)
    echo "🧪 Testing release-latest workflow with dry-run mode..."
    echo ""
    act workflow_dispatch \
      --workflows .github/workflows/release-latest.yml \
      -j release \
      --input dry_run=true
    ;;
  release-canary)
    echo "🧪 Testing release-canary workflow with dry-run mode..."
    echo ""
    act workflow_dispatch \
      --workflows .github/workflows/release-canary.yml \
      -j release-canary \
      --input dry_run=true
    ;;
  all)
    echo "🧪 Testing all release workflows with dry-run mode..."
    echo ""
    act workflow_dispatch \
      --workflows .github/workflows/release-latest.yml \
      --workflows .github/workflows/release-canary.yml \
      --input dry_run=true
    ;;
  *)
    echo "❌ Error: Unknown workflow: $WORKFLOW"
    echo ""
    echo "Usage: $0 [release-latest|release-canary|all]"
    echo ""
    echo "Examples:"
    echo "  $0 all                 # Test all workflows"
    echo "  $0 release-latest      # Test release-latest only"
    echo "  $0 release-canary      # Test release-canary only"
    echo ""
    exit 1
    ;;
esac

echo ""
echo "✅ Test completed successfully!"
