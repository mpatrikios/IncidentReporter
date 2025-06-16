#!/bin/bash

echo "🏗️ One-Command Incident Reporter Setup"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing Node.js..."
    
    # Detect OS and install Node.js
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install node
        else
            echo "Please install Homebrew first: https://brew.sh/"
            echo "Or install Node.js manually: https://nodejs.org/"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo "Please install Node.js 18+ from: https://nodejs.org/"
        exit 1
    fi
fi

echo "✅ Node.js $(node -v) found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup configuration
echo "⚙️ Setting up configuration..."

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    
    # Generate a random session secret
    SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 32)
    
    # Update .env with generated secret
    sed -i.bak "s/your-super-secret-session-key-minimum-32-characters/$SESSION_SECRET/" .env
    rm .env.bak 2>/dev/null || true
    
    echo "✅ Created .env with generated session secret"
fi

# Create config directory
mkdir -p server/config

# Create Google credentials template
if [ ! -f "server/config/credentials.json" ]; then
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
    echo "✅ Created Google credentials template"
fi

# Create template config
if [ ! -f "server/config/template.json" ]; then
    cat > server/config/template.json << 'EOF'
{
  "templateId": "1IjvUMSDrN9J9btOgE3tv6B0bdhfpou_h"
}
EOF
    echo "✅ Created Google Docs template config"
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📋 Final Steps:"
echo "1. Get MongoDB connection string:"
echo "   → Go to https://www.mongodb.com/atlas"
echo "   → Create free account and cluster"
echo "   → Get connection string"
echo "   → Edit .env file and replace MONGODB_URI"
echo ""
echo "2. Optional - Setup Google OAuth:"
echo "   → Go to https://console.cloud.google.com/"
echo "   → Create project and enable Google Docs API"
echo "   → Create OAuth credentials" 
echo "   → Edit server/config/credentials.json"
echo ""
echo "3. Run the application:"
echo "   npm start"
echo ""
echo "4. Visit: http://localhost:5000"
echo ""
echo "💡 Tip: The app will work with just MongoDB configured!"
echo "    Google OAuth is only needed for document generation."