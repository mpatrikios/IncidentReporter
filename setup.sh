#!/bin/bash

echo "🏗️  Setting up Incident Reporter..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your configuration:"
    echo "   - MongoDB connection string"
    echo "   - Session secret"
    echo "   - NOAA API key (optional)"
    echo ""
fi

# Check if Google credentials exist
if [ ! -f "server/config/credentials.json" ]; then
    echo "📝 Creating Google credentials template..."
    mkdir -p server/config
    cat > server/config/credentials.json << 'EOF'
{
  "web": {
    "client_id": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    "project_id": "your-project-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "YOUR_GOOGLE_CLIENT_SECRET",
    "redirect_uris": [
      "http://localhost:5000/auth/google/callback"
    ]
  }
}
EOF
    echo ""
    echo "⚠️  IMPORTANT: Edit server/config/credentials.json with your Google OAuth credentials"
    echo ""
fi

# Check if template config exists
if [ ! -f "server/config/template.json" ]; then
    echo "📝 Creating Google Docs template config..."
    cat > server/config/template.json << 'EOF'
{
  "templateId": "1IjvUMSDrN9J9btOgE3tv6B0bdhfpou_h"
}
EOF
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your MongoDB connection and other settings"
echo "2. Edit server/config/credentials.json with your Google OAuth credentials"
echo "3. Run: npm start"
echo ""
echo "📚 See README.md for detailed setup instructions"