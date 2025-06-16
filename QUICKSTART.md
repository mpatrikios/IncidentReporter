# 🚀 Quick Start - Get Running in 5 Minutes

## For Someone New to This Project

### Step 1: Get the Code
```bash
# Option A: Download from GitHub
# Go to: https://github.com/your-repo/incident-reporter
# Click "Code" → "Download ZIP"
# Extract the ZIP file

# Option B: Clone with Git
git clone https://github.com/your-repo/incident-reporter.git
cd incident-reporter
```

### Step 2: One-Command Setup
```bash
# Mac/Linux:
curl -fsSL https://raw.githubusercontent.com/your-repo/incident-reporter/main/install.sh | bash

# Or if you downloaded the code:
./install.sh
```

### Step 3: Get MongoDB (Free)
1. Go to: [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Click "Try Free"
3. Create account → Create cluster (choose FREE tier)
4. Create database user (username/password)
5. Copy connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/`)

### Step 4: Configure Database
```bash
# Edit the .env file (created by install script)
nano .env

# Replace this line:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/incidentreporter
# With your actual connection string
```

### Step 5: Run It!
```bash
npm start
```

Visit: **http://localhost:5000**

---

## That's It! 🎉

**The app is now running locally on your laptop.**

### What You Get:
- ✅ Full report wizard with 6 steps
- ✅ Auto-save functionality  
- ✅ NOAA weather data integration
- ✅ Professional report generation
- ✅ Data persistence with MongoDB

### Optional: Enable Google Docs Export
If you want to generate Google Docs:
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project → Enable Google Docs API
3. Create OAuth credentials
4. Edit `server/config/credentials.json`

### Need Help?
- Check terminal for error messages
- Ensure MongoDB connection string is correct
- Verify Node.js 18+ is installed: `node -v`

---

## Sharing with Others

To let others run this:

1. **Share the GitHub repo link**
2. **They run the one-command install**
3. **They get their own MongoDB connection**
4. **Done!**

Each person needs their own MongoDB database (free tier is fine).

---

**Total time: ~5 minutes** ⏱️