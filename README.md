# Civil Engineering Report System

A modern web application for creating, managing, and generating professional civil engineering reports with Google Docs integration.

## 🏗️ Features

- **Multi-Step Report Wizard**: Guided form creation with 6 comprehensive sections
- **Auto-Save Functionality**: Automatic saving of progress as you work
- **Google Docs Integration**: Generate professional reports from templates
- **Report Management**: Save, view, and edit reports from a centralized dashboard
- **User Authentication**: Secure login system with engineer profiles
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Hook Form** with Zod validation
- **TanStack Query** for data management
- **Wouter** for routing

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Drizzle ORM** with PostgreSQL
- **Google APIs** for document generation

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- **PostgreSQL** database
- **Google Cloud Console** account (for Google Docs API)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd IncidentReporter
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

1. Create a PostgreSQL database
2. Update the database connection in your environment or configuration files

### 4. Google API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Docs API and Google Drive API
4. Create credentials (OAuth 2.0 Client ID)
5. Create the credentials file:

```bash
cp server/config/credentials.json.example server/config/credentials.json
```

6. Update `server/config/credentials.json` with your Google API credentials:

```json
{
  "web": {
    "client_id": "your-client-id.apps.googleusercontent.com",
    "project_id": "your-project-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "your-client-secret",
    "redirect_uris": ["http://localhost:5000/auth/google/callback", "http://localhost"]
  }
}
```

### 5. Environment Variables

Create environment variables as needed for your database connection and other configurations.

### 6. Run the Application

```bash
npm run dev
```

The application will start on:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:5000 (Express server)

## 📁 Project Structure

```
IncidentReporter/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/        # Base UI components
│   │   │   └── wizard/    # Report wizard step components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and configurations
│   │   ├── pages/         # Main page components
│   │   └── index.css      # Global styles
│   ├── index.html
│   └── package.json
├── server/                 # Backend Express application
│   ├── config/            # Configuration files
│   │   └── credentials.json # Google API credentials (not in git)
│   ├── services/          # Business logic services
│   ├── db.ts             # Database configuration
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data access layer
│   └── index.ts          # Server entry point
├── shared/                # Shared types and schemas
│   └── schema.ts         # Zod schemas and TypeScript types
└── README.md
```

## 📝 Report Structure

The application generates civil engineering reports with the following sections:

1. **Project Information**
   - Insured details and contact information
   - File and claim numbers
   - Client company and contacts
   - Important dates
   - Engineering team information

2. **Assignment Scope**
   - Assignment description and scope
   - Site contacts and interviewees
   - Documents reviewed
   - Weather research summary

3. **Building & Site Observations**
   - Building description and specifications
   - Exterior, interior, and site observations
   - Structural details

4. **Research**
   - Weather data analysis
   - CoreLogic data summary

5. **Discussion & Analysis**
   - Technical analysis and findings
   - Engineering assessment

6. **Conclusions**
   - Final conclusions and recommendations
   - Professional engineering opinion

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests (when available)
npm test

# Lint code
npm run lint

# Type check
npm run typecheck
```

### Key Development Notes

- **Auto-save**: Form data is automatically saved as users type
- **Validation**: Both client-side (Zod) and server-side validation
- **Type Safety**: Full TypeScript coverage across frontend and backend
- **Error Handling**: Comprehensive error handling with user-friendly messages

## 🔐 Security Considerations

- **Credentials**: Never commit `server/config/credentials.json` to version control
- **Environment Variables**: Use environment variables for sensitive data in production
- **Authentication**: Implement proper session management for production use
- **API Security**: Add rate limiting and input validation for production

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill processes on port 5000
   pkill -f "tsx server/index.ts"
   lsof -ti:5000 | xargs kill
   ```

2. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check database credentials
   - Ensure database exists

3. **Google API Issues**
   - Verify API credentials are correct
   - Check that APIs are enabled in Google Cloud Console
   - Ensure redirect URIs match your development setup

4. **Build Issues**
   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `GET /api/auth/user` - Get current user

### Report Endpoints
- `GET /api/reports` - Get user's reports
- `POST /api/reports` - Create new report
- `GET /api/reports/:id` - Get specific report
- `PATCH /api/reports/:id` - Update report
- `POST /api/reports/:id/save` - Save completed report
- `POST /api/reports/:id/generate-doc` - Generate Google Doc

### Form Step Endpoints
- `GET /api/reports/:id/steps` - Get report form steps
- `PATCH /api/reports/:reportId/steps/:stepNumber` - Update form step

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support or questions:
1. Check the troubleshooting section above
2. Review the GitHub issues
3. Create a new issue with detailed information about your problem

---

**Note**: This application is designed for professional civil engineering report generation. Ensure all generated reports are reviewed by licensed engineers before use in official capacity.