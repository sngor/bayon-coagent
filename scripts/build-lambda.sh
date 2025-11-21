#!/bin/bash

# Build script for Lambda functions
# This script prepares Lambda functions for deployment

set -e

echo "Preparing Lambda functions..."

# Navigate to lambda directory
cd src/lambda

# Install dependencies if package-lock.json doesn't exist
if [ ! -f "package-lock.json" ]; then
    echo "Installing Lambda dependencies..."
    npm install
fi

echo "Lambda functions prepared successfully!"
echo "Note: SAM will handle TypeScript compilation and bundling during deployment"