@echo off
echo 🏗️  Setting up Incident Reporter...

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found
node -v

:: Install dependencies
echo 📦 Installing dependencies...
call npm install

:: Check if .env exists
if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo.
    echo ⚠️  IMPORTANT: Edit .env file with your configuration:
    echo    - MongoDB connection string
    echo    - Session secret
    echo    - NOAA API key (optional)
    echo.
)

:: Check if Google credentials exist
if not exist "server\config\credentials.json" (
    echo 📝 Creating Google credentials template...
    if not exist "server\config" mkdir server\config
    
    (
    echo {
    echo   "web": {
    echo     "client_id": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    echo     "project_id": "your-project-id", 
    echo     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    echo     "token_uri": "https://oauth2.googleapis.com/token",
    echo     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    echo     "client_secret": "YOUR_GOOGLE_CLIENT_SECRET",
    echo     "redirect_uris": [
    echo       "http://localhost:5000/auth/google/callback"
    echo     ]
    echo   }
    echo }
    ) > server\config\credentials.json
    
    echo.
    echo ⚠️  IMPORTANT: Edit server\config\credentials.json with your Google OAuth credentials
    echo.
)

:: Check if template config exists
if not exist "server\config\template.json" (
    echo 📝 Creating Google Docs template config...
    (
    echo {
    echo   "templateId": "1IjvUMSDrN9J9btOgE3tv6B0bdhfpou_h"
    echo }
    ) > server\config\template.json
)

echo.
echo 🎉 Setup complete!
echo.
echo 📋 Next steps:
echo 1. Edit .env file with your MongoDB connection and other settings
echo 2. Edit server\config\credentials.json with your Google OAuth credentials  
echo 3. Run: npm start
echo.
echo 📚 See README.md for detailed setup instructions
pause