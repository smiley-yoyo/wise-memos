#!/bin/bash

# Wise Memos - Chrome Extension Packaging Script
# Usage: ./scripts/package.sh [version]
# If version is not provided, it reads from manifest.json

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Get version from argument or manifest.json
if [ -n "$1" ]; then
    VERSION="$1"
    # Update version in manifest.json
    echo -e "${YELLOW}Updating manifest.json version to $VERSION...${NC}"
    sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" manifest.json
else
    VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)
fi

echo -e "${GREEN}Packaging Wise Memos v$VERSION...${NC}"

# Create dist directory
DIST_DIR="dist"
mkdir -p "$DIST_DIR"

# Define output filename
OUTPUT_FILE="$DIST_DIR/wise-memos-v$VERSION.zip"

# Remove old package if exists
rm -f "$OUTPUT_FILE"

# Files to include in the package
FILES=(
    "manifest.json"
    "popup.html"
    "popup.js"
    "styles.css"
    "icons/icon48.png"
    "icons/icon128.png"
)

# Check if all files exist
echo -e "${YELLOW}Checking required files...${NC}"
for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: Required file '$file' not found!${NC}"
        exit 1
    fi
done

# Create zip package
echo -e "${YELLOW}Creating package...${NC}"
zip -r "$OUTPUT_FILE" "${FILES[@]}"

# Show package info
echo -e "${GREEN}✓ Package created successfully!${NC}"
echo -e "  Output: ${YELLOW}$OUTPUT_FILE${NC}"
echo -e "  Size: $(du -h "$OUTPUT_FILE" | cut -f1)"

# List package contents
echo -e "\n${YELLOW}Package contents:${NC}"
unzip -l "$OUTPUT_FILE"
