# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev       # Start development server (Express + Vite)
npm run build     # Build for production (client + server)
npm run start     # Start production server
npm run check     # TypeScript type checking
npm run db:push   # Push database schema changes
```

### Local Development Server
The development server runs on port 5000 and serves both the API and the Vite dev server. The frontend is accessible at the same port with Vite middleware handling client-side routing.

### Google Docs Setup
```bash
# 1. Authenticate with Google (required before generating docs)
# Visit: http://localhost:5000/auth/google

# 2. Check authentication status
curl http://localhost:5000/api/google/auth-status

# 3. Update template ID in server/config/template.json
# Current template: 1CBu2TR8Qcbb5NvACWyw8hc6Fo53_yGEIySnQ7rAHVSA
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
- **`shared/schema.ts`** defines all database tables, validation schemas, and TypeScript types
- Uses **Drizzle ORM** for database schema + **Zod** for runtime validation
- All forms, API endpoints, and database operations share the same type definitions
- Schema changes require updating both the database (`npm run db:push`) and potentially the form components

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
- **OAuth2 Authentication**: Uses `server/config/credentials.json` for Google API access
- **Template-based Generation**: Configured template ID in `server/config/template.json` (currently: `1CBu2TR8Qcbb5NvACWyw8hc6Fo53_yGEIySnQ7rAHVSA`)
- **Document Service**: `server/services/googleDocsService.ts` handles API interactions
- **Authentication Flow**: 
  - Visit `/auth/google` to authenticate
  - Callback at `/auth/google/callback` sets tokens
  - Check status at `/api/google/auth-status`
- **Template Placeholders**: Form data maps to `{{field_name}}` placeholders in Google Docs
- **Automatic Document Creation**: Copies template, fills placeholders, returns document URL

### Database Layer
- **Storage interface** (`IStorage`) abstracts data access
- **MemStorage** class provides in-memory implementation for development
- **Drizzle ORM** for type-safe database operations
- Form steps stored as JSONB with step numbers for ordering

### Authentication & Session Management
- Uses **Express sessions** with **Passport.js**
- User profiles include engineer licensing status
- Session-based authentication for API endpoints
- Mock users created in memory storage for development

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

### Path Aliases
- `@/` maps to `client/src/`
- `@shared/` maps to `shared/`
- `@assets/` maps to `attached_assets/`

### CSS Framework
Uses **Tailwind CSS** with custom color variables (`grey-*`, `primary-*`) and **Radix UI** components for consistent design system.