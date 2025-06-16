#!/bin/bash

echo "📦 Creating distribution package..."

# Create distribution directory
mkdir -p dist-package
cd dist-package

# Copy all necessary files
cp -r ../client .
cp -r ../server .
cp -r ../shared .
cp ../package.json .
cp ../package-lock.json .
cp ../tsconfig.json .
cp ../vite.config.ts .
cp ../tailwind.config.js .
cp ../postcss.config.js .
cp ../.env.example .

# Create pre-configured files
mkdir -p server/config

# Create default credentials template
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

# Create template config
cat > server/config/template.json << 'EOF'
{
  "templateId": "1IjvUMSDrN9J9btOgE3tv6B0bdhfpou_h"
}
EOF

# Create simple setup script
cat > SETUP.md << 'EOF'
# Quick Setup Guide

## 1. Install Node.js
Download and install Node.js 18+ from: https://nodejs.org/

## 2. Install Dependencies
```bash
npm install
```

## 3. Configure Database
1. Create free MongoDB Atlas account: https://www.mongodb.com/atlas
2. Create cluster and get connection string
3. Copy `.env.example` to `.env`
4. Edit `.env` and add your MongoDB connection string

## 4. Setup Google OAuth (Optional)
1. Go to: https://console.cloud.google.com/
2. Create project and enable Google Docs API
3. Create OAuth credentials
4. Edit `server/config/credentials.json` with your credentials

## 5. Run Application
```bash
npm start
```

Visit: http://localhost:5000
EOF

# Create simple start script
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Incident Reporter..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your MongoDB connection string"
    echo "⚠️  Then run this script again"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start application
echo "🚀 Starting application on http://localhost:5000"
npm start
EOF

# Create Windows start script
cat > start.bat << 'EOF'
@echo off
echo 🚀 Starting Incident Reporter...

if not exist ".env" (
    echo ⚠️  Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please edit .env file with your MongoDB connection string
    echo ⚠️  Then run this script again
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
)

echo 🚀 Starting application on http://localhost:5000
call npm start
pause
EOF

chmod +x start.sh

echo ""
echo "✅ Distribution package created in dist-package/"
echo ""
echo "📋 To share with others:"
echo "1. Zip the 'dist-package' folder"
echo "2. Share the zip file"
echo "3. Recipients just need to:"
echo "   - Unzip"
echo "   - Run start.sh (Mac/Linux) or start.bat (Windows)"
echo "   - Edit .env with their MongoDB connection"
EOF