# IncidentReporter Project - Complete File Analysis Report

## Project Overview
IncidentReporter is a fullstack TypeScript application for civil engineering report generation with Google Docs integration, AI-powered text generation, and a multi-step wizard interface.

## Root-Level Files

### Documentation Files
- **CLAUDE.md** - Instructions for Claude AI assistant working with this codebase
- **README.md** - Main project documentation and setup guide
- **QUICKSTART.md** - Quick setup instructions for new developers
- **FuturePlan.md** - Roadmap and planned features
- **INTEGRATION_GUIDE.md** - Guide for integrating various services
- **MUI_MIGRATION_GUIDE.md** - Material-UI migration documentation
- **tech-overview.md** - Technical architecture overview

### Configuration Files
- **package.json** - Node.js dependencies and scripts
- **package-lock.json** - Locked dependency versions
- **tsconfig.json** - TypeScript compiler configuration
- **vite.config.ts** - Vite bundler configuration
- **tailwind.config.ts** - Tailwind CSS configuration
- **postcss.config.js** - PostCSS configuration for Tailwind
- **components.json** - UI component library configuration

### Docker & Deployment
- **Dockerfile** - Container image definition
- **docker-compose.yml** - Multi-container Docker setup
- **package-for-distribution.sh** - Script to package app for distribution

### Setup Scripts
- **install.sh** - Unix/Linux installation script
- **setup.sh** - Unix/Linux setup script
- **setup.bat** - Windows setup script

### Other Files
- **create-working-template.js** - Script to create Word document templates
- **s3-bucket-policy.json** - AWS S3 bucket permissions
- **server.log** - Server runtime logs
- **generated-icon.png** - Application icon

## Client Directory (/client)

### Entry Points
- **index.html** - Main HTML template
- **src/main.tsx** - React application entry point
- **src/App.tsx** - Main React component with routing
- **src/index.css** - Global CSS styles

### Pages (/client/src/pages)
- **landing.tsx** - Public landing page
- **home.tsx** - Home page (original version)
- **home-mui.tsx** - Home page (Material-UI version)
- **login.tsx** - Login page (original version)
- **login-mui.tsx** - Login page (Material-UI version)
- **login-turbotax.tsx** - Login page (TurboTax-styled version)
- **dashboard-turbotax.tsx** - Main dashboard for viewing/managing reports
- **report-wizard.tsx** - Multi-step report creation wizard (original)
- **report-wizard-turbotax.tsx** - Multi-step report creation wizard (TurboTax-styled)
- **not-found.tsx** - 404 error page

### Wizard Components (/client/src/components/wizard)
- **TurboTaxWizardLayout.tsx** - Layout wrapper for wizard steps
- **project-information-turbotax.tsx** - Step 1: Project details form
- **assignment-scope.tsx** - Step 2: Assignment scope form
- **building-and-site-turbotax.tsx** - Step 3: Building observations form
- **research-turbotax.tsx** - Step 4: Weather/research data form
- **discussion-and-analysis-turbotax.tsx** - Step 5: Technical analysis form
- **conclusions-turbotax.tsx** - Step 6: Conclusions form
- **submit-report.tsx** - Final submission component
- **step-navigation.tsx** - Navigation between wizard steps

### UI Components (/client/src/components/ui)
A complete set of Radix UI-based components:
- **button.tsx**, **input.tsx**, **textarea.tsx** - Form inputs
- **dialog.tsx**, **alert-dialog.tsx** - Modal dialogs
- **select.tsx**, **checkbox.tsx**, **radio-group.tsx** - Selection inputs
- **card.tsx**, **accordion.tsx**, **tabs.tsx** - Layout components
- **toast.tsx**, **toaster.tsx** - Notification system
- **table.tsx**, **pagination.tsx** - Data display
- **form.tsx**, **label.tsx** - Form utilities
- And 40+ more UI components...

### Feature Components (/client/src/components)
- **DocumentGeneration.tsx** - Google Docs generation interface
- **UnifiedDocumentGeneration.tsx** - Unified document generation with progress
- **ImageUpload.tsx** - Image upload with S3 integration
- **ReportCompletionStatus.tsx** - Report completion progress tracker
- **AIProgressIndicator.tsx** - AI text generation progress display
- **ReportTemplateDialog.tsx** - Template selection dialog
- **ReportGenerationExample.tsx** - Example report generation

### Hooks (/client/src/hooks)
- **useAuth.ts** - Authentication state management
- **use-auto-save.ts** - Auto-save form data functionality
- **use-form-persistence.ts** - Form data persistence to backend
- **useAIGeneration.ts** - AI text generation hook
- **useReportCompletion.ts** - Report completion tracking
- **use-toast.ts** - Toast notification hook
- **use-mobile.tsx** - Mobile device detection

### Services (/client/src/services)
- **wordDocumentService.ts** - Word document generation service

### Library Files (/client/src/lib)
- **queryClient.ts** - React Query setup and API request utilities
- **types.ts** - TypeScript type definitions
- **utils.ts** - Utility functions (classNames helper)

### Providers & Context (/client/src/providers, /client/src/contexts)
- **ThemeProvider.tsx** - Theme context provider
- **MuiProvider.tsx** - Material-UI theme provider
- **AIProgressContext.tsx** - AI progress state management

### Theme (/client/src/theme)
- **muiTheme.ts** - Material-UI theme configuration
- **turboTaxTheme.ts** - TurboTax-style theme configuration

## Server Directory (/server)

### Core Files
- **index.ts** - Express server entry point
- **routes.ts** - Main API route definitions
- **auth.ts** - Passport.js authentication setup
- **db.ts** - MongoDB database connection
- **storage.ts** - Storage interface implementation
- **vite.ts** - Vite dev server integration

### Routes (/server/routes)
- **imageRoutes.ts** - Image upload/management endpoints
- **wordRoutes.ts** - Word document generation endpoints

### Services (/server/services)
- **googleDocsService.ts** - Google Docs API integration
- **googleDriveService.ts** - Google Drive API integration
- **wordGenerationService.ts** - Word document generation logic
- **aiTextService.ts** - AI text generation service
- **s3Service.ts** - AWS S3 file storage
- **noaaService.ts** - NOAA weather data API
- **aerialPhotoService.ts** - Aerial photo management
- **weatherTablesService.ts** - Weather data table generation

### Configuration (/server/config)
- **credentials.json** - Google OAuth2 credentials
- **template.json** - Google Docs template configuration

### Templates (/server/templates)
Multiple Word document templates:
- **MJSolutionsTemplate.docx** - Main report template
- Various cleaned and test versions of the template
- **README.md** - Template documentation

### Utilities (/server/utils)
- **reportCompletion.ts** - Report completion calculation
- **cleanWordTemplate.js** - Template cleaning utility
- **comprehensiveTemplateClean.js** - Advanced template cleaner
- **createCleanTemplate.js** - Template creation utility
- **finalTemplateClean.js** - Final template processing

### Types (/server/types)
- **officegen.d.ts** - TypeScript definitions for officegen library

### Migrations (/server/migrations)
- **dropGoogleDriveIndex.ts** - Database migration script

## Shared Directory (/shared)
- **schema.ts** - Shared Zod schemas and TypeScript types for:
  - User model
  - Report model
  - Form step models (6 steps)
  - Validation schemas
  - Database models

## Key Features & Functionality

### 1. Authentication System
- Google OAuth2 login
- Session-based authentication
- User profile storage in MongoDB

### 2. Multi-Step Report Wizard
- 6-step form with validation
- Auto-save functionality
- Progress tracking
- Data persistence between sessions

### 3. Document Generation
- Google Docs generation from templates
- Word document generation
- Template placeholder replacement
- Image insertion support

### 4. AI Integration
- OpenAI-powered text generation
- Progress tracking for AI operations
- Context-aware content generation

### 5. File Management
- S3 integration for image storage
- Local file uploads
- Google Drive integration

### 6. External Data Integration
- NOAA weather data fetching
- CoreLogic data integration
- Aerial photo services

### 7. UI/UX Features
- TurboTax-style interface option
- Material-UI components
- Responsive design
- Toast notifications
- Dark mode support

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Material-UI, Radix UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: Passport.js with Google OAuth2
- **File Storage**: AWS S3, Google Drive
- **Document Generation**: Google Docs API, officegen
- **AI**: OpenAI API
- **Build Tools**: Vite, Docker
- **State Management**: React Query, Context API