#!/bin/bash

# Google AI API Key Setup Script
# This script helps you configure your Google AI API key

echo "🔧 Google AI API Key Setup"
echo "=========================="
echo ""
echo "📝 Instructions:"
echo "1. Go to https://aistudio.google.com/apikey"
echo "2. Sign in with your Google account"
echo "3. Click 'Create API Key' or use an existing one"
echo "4. Copy the API key"
echo ""
read -p "Paste your Google AI API key here: " GOOGLE_AI_KEY

if [ -z "$GOOGLE_AI_KEY" ]; then
    echo "❌ No API key provided. Exiting."
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

# Check if GOOGLE_AI_API_KEY already exists in .env.local
if grep -q "GOOGLE_AI_API_KEY=" .env.local; then
    echo "⚠️  GOOGLE_AI_API_KEY already exists in .env.local"
    read -p "Do you want to replace it? (y/n): " REPLACE
    if [ "$REPLACE" != "y" ]; then
        echo "❌ Cancelled."
        exit 0
    fi
    # Remove old key
    sed -i.bak '/GOOGLE_AI_API_KEY=/d' .env.local
fi

# Add the new key
echo "" >> .env.local
echo "# Google AI / Gemini Configuration" >> .env.local
echo "GOOGLE_AI_API_KEY=$GOOGLE_AI_KEY" >> .env.local

echo "✅ Google AI API key has been added to .env.local"
echo ""
echo "🚀 Next steps:"
echo "1. Restart your development server (npm run dev)"
echo "2. Navigate to /studio/holiday-cards"
echo "3. Start generating holiday cards with Gemini 3.0 Pro!"
echo ""
echo "📚 Model capabilities:"
echo "   - Up to 4K resolution"
echo "   - Advanced thinking mode"
echo "   - Text rendering in images"
echo "   - Grounding with Google Search"
