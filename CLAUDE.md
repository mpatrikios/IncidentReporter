# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev       # Start development server (Express + Vite)
npm run build     # Build for production (client + server)
npm run start     # Start production server
npm run check     # TypeScript type checking
```

### Local Development Server
The development server runs on port 5000 and serves both the API and the Vite dev server. The frontend is accessible at the same port with Vite middleware handling client-side routing.

### Database Setup
```bash
# MongoDB Atlas connection (already configured as fallback)
export MONGODB_URI="mongodb+srv://miapatrikios:Kefalonia2004@cluster0.yimatbm.mongodb.net/incident_reporter"

# Or use local MongoDB for development:
# export MONGODB_URI="mongodb://localhost:27017/incident_reporter"

# No schema migration needed - Mongoose handles schema automatically
```

### Authentication Setup
The application uses Google OAuth2 for user authentication with Drive integration:

```bash
# 1. Create Google OAuth credentials and save to server/config/credentials.json
# 2. User login via Google OAuth: http://localhost:5000/auth/google
# 3. Users grant permissions for: profile, email, Google Docs, Google Drive
# 4. Check authentication status: GET /api/auth/user
# 5. Logout: POST /api/auth/logout
```

### Google Docs Setup
```bash
# 1. Update template ID in server/config/template.json
# Current template: 1CBu2TR8Qcbb5NvACWyw8hc6Fo53_yGEIySnQ7rAHVSA

# 2. Documents are automatically generated in user's Google Drive
# No separate authentication needed - uses user's OAuth tokens
```

### Killing Stuck Processes
```bash
pkill -f "tsx server/index.ts"    # Kill development server
lsof -ti:5000 | xargs kill        # Kill anything on port 5000
```

## Architecture Overview

### Project Structure
This is a **fullstack TypeScript application** for civil engineering report generation with the following key architectural decisions:

#### Shared Schema System
- **`shared/schema.ts`** defines all MongoDB models, validation schemas, and TypeScript types
- Uses **Mongoose** for MongoDB schema + **Zod** for runtime validation
- All forms, API endpoints, and database operations share the same type definitions
- Schema changes are handled automatically by Mongoose - no manual migrations needed

#### Multi-Step Wizard Architecture
The core feature is a **6-step report wizard** with auto-save functionality:

1. **Project Information** - Insured details, file numbers, client info, dates, engineering team
2. **Assignment Scope** - Assignment details, site contacts, documents reviewed, weather research  
3. **Building & Site Observations** - Building description, exterior/interior/site observations
4. **Research** - Weather data and CoreLogic research summaries
5. **Discussion & Analysis** - Technical analysis and engineering discussion
6. **Conclusions** - Final conclusions with report saving

Each step:
- Has its own React component in `client/src/components/wizard/`
- Maps to a Zod schema in `shared/schema.ts`
- Auto-saves data via `useAutoSave` hook
- Supports navigation between steps without losing data
- Validates on completion but allows partial data during navigation

#### Data Flow Architecture
```
Form Component → useAutoSave hook → API endpoint → Storage layer → Database
     ↑                                                                ↓
User Input ← React Hook Form ← Step validation ← Zod schemas ← Shared types
```

#### API Endpoint Patterns
- **`/api/reports/:id/steps/:stepNumber`** - PATCH for auto-saving step data
- **`/api/reports/:id/save`** - POST for final report saving (compiles all steps)
- **`/api/reports/:id/generate-doc`** - POST for Google Docs generation
- **`/api/reports/:id`** - DELETE for removing reports and associated data
- **Two validation modes**: strict for completed steps, lenient for auto-save

### Key Technical Patterns

#### Form Step Auto-Save
- Each wizard step uses `useAutoSave(reportId, stepNumber, formData)`
- Automatically debounces and saves form data as users type
- Uses `useFormPersistence` hook for API communication
- Step numbers are critical: they map to database records and validation schemas

#### Schema-Form Mapping
When adding new form fields:
1. Update the Zod schema in `shared/schema.ts`
2. Update the form component default values and reset logic
3. Update the validation switch statement in `server/routes.ts`
4. Update the data compilation logic in save/submit endpoints

#### Component Reference Pattern
Wizard steps use `forwardRef` with `useImperativeHandle` to expose:
- `save()` method for programmatic saving
- `getValues()` method for accessing form data
- This allows the parent wizard to save current step data before navigation

### Google API Integration
- **User-Based Authentication**: Each user's Google tokens stored securely in MongoDB
- **Template-based Generation**: Configured template ID in `server/config/template.json` (currently: `1CBu2TR8Qcbb5NvACWyw8hc6Fo53_yGEIySnQ7rAHVSA`)
- **Document Service**: `server/services/googleDocsService.ts` handles API interactions
- **OAuth Scopes**: `profile`, `email`, `docs`, `drive.file` permissions
- **Template Placeholders**: Form data maps to `{{field_name}}` placeholders in Google Docs
- **User Drive Integration**: Documents created directly in each user's Google Drive
- **Automatic Permission Management**: Users own their generated documents

### Database Layer
- **Storage interface** (`IStorage`) abstracts data access
- **MongoStorage** class provides MongoDB implementation with Mongoose
- **MongoDB** with automatic connection pooling and reconnection
- Form steps stored as MongoDB documents with ObjectId references
- Automatic indexing for optimal query performance

### Authentication & Session Management
- Uses **Google OAuth2** with **Passport.js** for authentication
- **Passport Google OAuth2 Strategy** handles user login flow
- User profiles include Google account data and engineer licensing status
- Session-based authentication for API endpoints
- All report routes require authentication via `requireAuth` middleware
- Users are automatically created/updated on first Google login

## Important Implementation Notes

### Form Step Numbers
Step numbers (1-6) are hardcoded throughout the system and must remain consistent across:
- `FORM_STEPS` configuration in `client/src/lib/types.ts`
- `useAutoSave` calls in each form component
- Validation switch statements in `server/routes.ts`
- Data compilation logic in save endpoints

### Auto-Save vs Manual Save
- **Auto-save**: Lenient validation, partial data allowed, happens on form input
- **Manual save**: Strict validation, complete data required, happens on step completion
- This pattern allows users to navigate freely while ensuring data integrity on completion

### Google Docs Template Integration
- **Template Configuration**: Template ID stored in `server/config/template.json`
- **Field Mapping**: Form fields must match template placeholders exactly:
  - Project Info: `{{insured_name}}`, `{{claim_number}}`, `{{client_company}}`, etc.
  - Assignment: `{{assignment_scope}}`, `{{site_contact}}`, `{{interviewees}}`, etc.
  - Building: `{{building_description}}`, `{{exterior_observations}}`, etc.
  - Research: `{{weather_data_summary}}`, `{{corelogic_data_summary}}`
  - Analysis: `{{discussion_and_analysis}}`
  - Conclusions: `{{conclusions}}`
- **Data Flow**: Report steps → Compiled data → Template placeholders → Generated document
- **Authentication Required**: Users must authenticate via `/auth/google` before generating documents

### Report Management Features
- **Edit Reports**: Navigate via `/reports/:id` route to edit existing reports with preserved data
- **Save and Redirect**: Successful saves redirect users back to dashboard after 1-second delay
- **Delete Reports**: Confirmation dialog prevents accidental deletion, removes report and form steps
- **View Generated Docs**: Dashboard "View Doc" button opens Google Docs when `googleDocId` exists
- **Smart Button States**: 
  - Edit (blue) - Always available for report editing
  - View Doc (green) - Enabled when Google Doc exists, disabled with "No Doc" when not generated
  - Delete (red) - Always available with confirmation dialog

### Path Aliases
- `@/` maps to `client/src/`
- `@shared/` maps to `shared/`
- `@assets/` maps to `attached_assets/`

### CSS Framework
Uses **Tailwind CSS** with custom color variables (`grey-*`, `primary-*`) and **Radix UI** components for consistent design system.

### Testing & Quality
- **TypeScript**: Full type coverage across frontend and backend
- **Zod**: Runtime validation for all API inputs and form data
- **Error Handling**: User-friendly error messages and comprehensive error boundaries
- Use `npm run check` to verify TypeScript types before committing