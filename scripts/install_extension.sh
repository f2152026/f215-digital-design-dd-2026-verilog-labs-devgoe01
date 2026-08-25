#!/usr/bin/env bash
# Scripts to install the Classroom 50 Helper extension at the command and filesystem levels.
# This ensures it works seamlessly in browser-based GitHub Codespaces and Desktop VS Code.

set -e

# Find the packaged VSIX file
VSIX_FILE=$(ls classroom50-helper-extension/*.vsix 2>/dev/null | head -n 1)

if [ -z "$VSIX_FILE" ]; then
  echo "⚠️ Warning: No VSIX file found under classroom50-helper-extension/."
  exit 0
fi

echo "Installing extension from: $VSIX_FILE"

# 1. Standard CLI Installation (If VS Code Server CLI is ready and in PATH)
if command -v code &> /dev/null; then
  echo "Installing via 'code' CLI..."
  code --install-extension "$VSIX_FILE" --force || true
fi

if command -v code-insiders &> /dev/null; then
  echo "Installing via 'code-insiders' CLI..."
  code-insiders --install-extension "$VSIX_FILE" --force || true
fi

# 2. Filesystem-Level Extraction (Guarantees load in browser Codespaces)
EXT_DIR_NAME="bits-pilani.classroom50-helper-0.0.1"

# We check both vscode-remote and vscode-server extensions directories
for EXT_DIR in "/home/vscode/.vscode-remote/extensions" "/home/vscode/.vscode-server/extensions"; do
  mkdir -p "$EXT_DIR"
  TARGET_PATH="$EXT_DIR/$EXT_DIR_NAME"
  
  echo "Extracting VSIX to target: $TARGET_PATH"
  rm -rf "$TARGET_PATH"
  mkdir -p "$TARGET_PATH"
  
  # Extract VSIX contents (VSIX is a standard ZIP file containing an 'extension' folder)
  TMP_EXTRACT="/tmp/vsix-extract-$$"
  mkdir -p "$TMP_EXTRACT"
  
  if command -v unzip &> /dev/null; then
    unzip -q "$VSIX_FILE" -d "$TMP_EXTRACT"
    cp -r "$TMP_EXTRACT/extension/"* "$TARGET_PATH/"
  else
    echo "❌ Error: 'unzip' utility is not installed in the container."
    rm -rf "$TMP_EXTRACT"
    exit 1
  fi
  
  rm -rf "$TMP_EXTRACT"
  echo "✔ Successfully extracted to $TARGET_PATH"
done

echo "🎉 Extension installation completed successfully!"
