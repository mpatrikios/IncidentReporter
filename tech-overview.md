# Technical Overview - Incident Reporter

## Project Summary

The Incident Reporter is a comprehensive **fullstack TypeScript web application** designed for civil engineering firms to generate professional property inspection reports. The application streamlines the report creation process through a guided 6-step wizard interface and provides automated document generation capabilities with AI enhancement options.

---

## Core Functionality

### Primary Features

1. **Multi-Step Report Wizard**
   - 6-step guided form process for comprehensive data collection
   - Real-time auto-save functionality to prevent data loss
   - Step-by-step validation with progress tracking
   - Navigation between steps while preserving partial data

2. **Document Generation**
   - **Google Docs Integration**: Professional report generation using templated documents
   - **Microsoft Word Export**: Client-side and server-side generation options
   - **AI Text Enhancement**: OpenAI integration for converting bullet points to professional paragraphs
   - **Photo Management**: AWS S3 cloud storage with secure upload, inline embedding or reference-based inclusion

3. **User Management & Authentication**
   - Google OAuth2 authentication with Drive integration
   - User profile management with engineering credentials
   - Session-based authentication with secure token handling

4. **Report Management**
   - Dashboard for viewing, editing, and managing reports
   - Report status tracking and completion indicators
   - Delete functionality with confirmation workflows
   - Direct links to generated documents

5. **Image & File Management**
   - **AWS S3 Integration**: Secure cloud storage for report images and documents
   - **File Upload System**: Drag-and-drop interface with progress tracking
   - **Image Optimization**: Automatic compression and format conversion
   - **Secure Access**: Pre-signed URLs for controlled file access
   - **Metadata Storage**: Image descriptions and organization

### Report Wizard Steps

1. **Project Information**: Client details, file numbers, dates, engineering team
2. **Assignment Scope**: Methodology, interviewees, documents reviewed
3. **Building & Site Observations**: System descriptions, exterior/interior observations
4. **Research**: Weather data, CoreLogic analysis summaries
5. **Discussion & Analysis**: Technical analysis and engineering conclusions
6. **Conclusions**: Final determinations and professional conclusions

---

## Complete Technology Stack

### Frontend Technologies

**Core Framework & Libraries**
- **React 18** - Modern functional components with hooks
- **TypeScript** - Full type safety across the application
- **Vite** - Fast development server and build tool
- **Wouter** - Lightweight client-side routing

**UI Framework & Design**
- **Material-UI (MUI v5)** - Component library with custom theming
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible primitive components
- **CSS-in-JS** - Styled components with MUI's sx prop system

**Form Management & Validation**
- **React Hook Form** - Performant form library with minimal re-renders
- **Zod** - Runtime schema validation and TypeScript inference
- **@hookform/resolvers** - Integration between React Hook Form and Zod

**State Management & Data Fetching**
- **TanStack Query (React Query)** - Server state management and caching
- **React Context** - Global state for authentication
- **Custom Hooks** - Reusable logic for auto-save, form persistence

**Document Generation (Client-Side)**
- **docx** - Microsoft Word document creation
- **file-saver** - File download functionality
- **Canvas API** - Image processing and optimization

### Backend Technologies

**Runtime & Framework**
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server-side development
- **tsx** - TypeScript execution for development

**Database & Storage**
- **MongoDB** - Document-based database
- **Mongoose** - MongoDB ODM with schema validation
- **MongoDB Atlas** - Cloud database hosting
- **AWS S3** - Cloud object storage for images and files
- **Multer** - Multipart form data handling for file uploads

**Authentication & Security**
- **Passport.js** - Authentication middleware
- **passport-google-oauth20** - Google OAuth2 strategy
- **express-session** - Session management
- **Google Auth Library** - OAuth2 client management

**External API Integrations**
- **Google APIs**:
  - Google Docs API (v1) - Document creation and formatting
  - Google Drive API (v3) - File management and permissions
- **OpenAI API** - GPT-based text enhancement and generation

**Document Processing**
- **docx** - Server-side Word document generation
- **Image Processing** - Canvas-based optimization for large files

**Cloud Services**
- **AWS SDK** - JavaScript SDK for AWS services integration
- **AWS S3** - Object storage service for images and files
- **Multer-S3** - Direct file upload to S3 with Multer integration

### Development & Build Tools

**Package Management & Build**
- **npm** - Package manager
- **Vite** - Frontend build tool and dev server
- **TypeScript Compiler** - Type checking and compilation

**Code Quality**
- **ESLint** - Code linting and style enforcement
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

**Development Experience**
- **Hot Module Replacement** - Instant development updates
- **Source Maps** - Debug support
- **Path Aliases** - Clean import statements (`@/`, `@shared/`)

---

## Architecture & Data Flow

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React/Vite)  │    │   (Express/TS)  │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • React Components │  │ • Express Routes│    │ • MongoDB Atlas │
│ • Material-UI    │    │ • Middleware    │    │ • Google APIs   │
│ • React Query    │    │ • Auth Services │    │ • OpenAI API    │
│ • Form Management│    │ • Document Gen  │    │ • OAuth2        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                        ┌─────────────────┐
                        │   Data Layer    │
                        │   (Mongoose)    │
                        └─────────────────┘
```

### Data Flow Patterns

#### 1. Form Data Auto-Save Flow
```
User Input → React Hook Form → useAutoSave Hook → API Request → 
MongoDB Update → Real-time UI Feedback
```

#### 2. Document Generation Flow
```
User Triggers Generation → Progress Tracking (SSE) → Template Processing → 
AI Enhancement (Optional) → Document Creation → File Delivery
```

#### 3. Authentication Flow
```
User Login → Google OAuth2 → Token Exchange → Session Creation → 
User Profile Storage → Protected Route Access
```

#### 4. Image Upload & Storage Flow
```
User File Selection → Client-side Validation → Multer Upload Middleware → 
AWS S3 Storage → Database Metadata Recording → Pre-signed URL Generation → 
Secure Image Access
```

#### 5. Document Image Integration Flow
```
Report Generation → Database Image Query → S3 Pre-signed URL Fetch → 
Image Download & Processing → Document Embedding (Inline/Reference)
```

### Database Schema Design

**Core Collections:**

1. **Users Collection**
   ```typescript
   {
     _id: ObjectId,
     googleId: string,
     email: string,
     fullName: string,
     avatar?: string,
     googleAccessToken: string,
     googleRefreshToken: string,
     createdAt: Date,
     updatedAt: Date
   }
   ```

2. **Reports Collection**
   ```typescript
   {
     _id: ObjectId,
     userId: ObjectId,
     title: string,
     status: 'draft' | 'completed',
     googleDocId?: string,
     createdAt: Date,
     updatedAt: Date,
     lastSaved?: Date
   }
   ```

3. **FormSteps Collection**
   ```typescript
   {
     _id: ObjectId,
     reportId: ObjectId,
     stepNumber: number (1-6),
     data: Record<string, any>, // Flexible schema per step
     lastUpdated: Date
   }
   ```

4. **Images Collection**
   ```typescript
   {
     _id: ObjectId,
     reportId: ObjectId,
     originalFilename: string,
     s3Key: string,           // S3 object key
     s3Url: string,           // S3 object URL
     publicUrl?: string,      // CDN or public URL
     fileSize: number,        // File size in bytes
     mimeType: string,        // Image MIME type
     description?: string,    // User-provided description
     uploadedAt: Date,
     stepNumber?: number      // Associated form step
   }
   ```

### API Architecture

**RESTful Endpoint Structure:**

```
Authentication:
GET  /auth/google              - Initiate OAuth flow
GET  /auth/google/callback     - OAuth callback handler
GET  /api/auth/user           - Get current user
POST /api/auth/logout         - User logout

Reports Management:
GET    /api/reports           - List user reports
POST   /api/reports           - Create new report
GET    /api/reports/:id       - Get specific report
PATCH  /api/reports/:id       - Update report metadata
DELETE /api/reports/:id       - Delete report

Form Steps:
GET    /api/reports/:id/steps           - Get all form steps
GET    /api/reports/:id/steps/:step     - Get specific step
PATCH  /api/reports/:id/steps/:step     - Auto-save step data
POST   /api/reports/:id/save            - Final report compilation

Image Management:
POST   /api/reports/:id/images          - Upload images to S3
GET    /api/reports/:id/images          - List report images
DELETE /api/reports/:id/images/:imageId - Delete image from S3
PATCH  /api/reports/:id/images/:imageId - Update image metadata

Document Generation:
POST /api/reports/:id/generate-doc      - Google Docs generation
POST /api/reports/:id/generate-word     - Word document generation
GET  /api/reports/:id/generation-progress - SSE progress tracking

AI Services:
POST /api/ai/generate-text              - Text enhancement via OpenAI
```

---

## Key Technical Patterns & Implementations

### 1. Shared Schema System
- **Single Source of Truth**: `shared/schema.ts` defines all data structures
- **Zod Schemas**: Runtime validation with TypeScript type inference
- **Mongoose Integration**: Database schemas derived from Zod definitions
- **Form Validation**: Same schemas used for client-side validation

### 2. Auto-Save Architecture
```typescript
// Custom hook for automatic form persistence
const useAutoSave = (reportId: string, stepNumber: number, formData: any) => {
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      await apiRequest('PATCH', `/api/reports/${reportId}/steps/${stepNumber}`, formData);
    }, 2000); // 2-second debounce
    
    return () => clearTimeout(timeoutId);
  }, [formData]);
};
```

### 3. Real-Time Progress Tracking
```typescript
// Server-Sent Events for document generation progress
app.get('/api/reports/:id/generation-progress', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  // Send progress updates during document generation
  const sendProgress = (progress: number, message: string) => {
    res.write(`data: ${JSON.stringify({ progress, message })}\n\n`);
  };
});
```

### 4. Template-Based Document Generation
- **Google Docs Templates**: Predefined templates with `{{placeholder}}` syntax
- **Dynamic Content Injection**: Form data mapped to template placeholders
- **AI Text Enhancement**: Optional OpenAI integration for content improvement
- **Batch API Operations**: Efficient document formatting via Google Docs API

### 5. AWS S3 Image Storage Integration
```typescript
// S3 upload configuration with Multer
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET,
    key: (req, file, cb) => {
      const reportId = req.params.id;
      const timestamp = Date.now();
      const key = `reports/${reportId}/images/${timestamp}-${file.originalname}`;
      cb(null, key);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'), false);
    }
  }
});

// Image access with pre-signed URLs for security
const getSignedImageUrl = (s3Key: string, expiresIn: number = 3600) => {
  return s3Client.getSignedUrl('getObject', {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: s3Key,
    Expires: expiresIn
  });
};
```

### 6. Dual Document Generation Strategy
```typescript
// Client-side vs Server-side decision logic
const canGenerateClientSide = (images: Image[], complexity: number) => {
  const totalSize = images.reduce((sum, img) => sum + img.fileSize, 0);
  const deviceMemory = navigator.deviceMemory || 4;
  
  return totalSize < 40 * 1024 * 1024 && // Under 40MB
         images.length < 20 &&            // Fewer than 20 images
         deviceMemory >= 4;               // At least 4GB RAM
};
```

---

## Security Implementation

### Authentication Security
- **OAuth2 Flow**: Secure token exchange with Google
- **Session Management**: Express-session with secure cookies
- **Token Refresh**: Automatic refresh token handling
- **Route Protection**: Middleware-based authentication checks

### Data Security
- **Input Validation**: Zod schemas prevent malformed data
- **MongoDB Injection Prevention**: Mongoose query sanitization
- **Environment Variables**: Sensitive data in environment configuration
- **CORS Configuration**: Restricted cross-origin requests

### API Security
- **Rate Limiting**: Built into OpenAI service integration
- **Error Handling**: Sanitized error responses
- **Authentication Middleware**: Protected route enforcement

### File Storage Security
- **S3 Bucket Configuration**: Private buckets with restricted public access
- **Pre-signed URLs**: Time-limited access to images (default 1 hour expiry)
- **File Type Validation**: Server-side MIME type checking and file extension validation
- **Size Limits**: 10MB maximum file size for uploads
- **Access Control**: User-specific file access through report ownership validation
- **Secure Upload**: Direct S3 upload with AWS SDK, no temporary server storage

---

## Performance Optimizations

### Frontend Performance
- **Code Splitting**: Lazy loading of wizard step components
- **React Query Caching**: Intelligent server state management
- **Debounced Auto-Save**: Prevents excessive API calls
- **Image Optimization**: Client-side compression before upload
- **Memoization**: React.memo and useMemo for expensive operations

### Backend Performance
- **Database Indexing**: Optimized queries on user and report relationships
- **Connection Pooling**: MongoDB connection management
- **Streaming Responses**: Large file downloads and SSE
- **Batch Operations**: Google Docs API request batching

### Document Generation Performance
- **Hybrid Generation Strategy**: Client-side for small docs, server-side for large
- **Progress Tracking**: Real-time user feedback during long operations
- **Error Recovery**: Graceful fallbacks and retry mechanisms
- **Memory Management**: Garbage collection for large document processing

---

## Deployment & Infrastructure

### Development Environment
- **Local Development**: Vite dev server with Express backend
- **Hot Reload**: Instant feedback during development
- **Environment Configuration**: `.env` files for local setup
- **Database**: MongoDB Atlas cloud connection

### Production Considerations
- **Build Process**: `npm run build` for optimized production bundle
- **Static Asset Serving**: Express static file serving
- **Environment Variables**: Production configuration management
- **Error Monitoring**: Comprehensive error logging and handling

---

## Future Extensibility

### Planned Enhancements
- **Offline Support**: Progressive Web App capabilities
- **Advanced Templates**: Multiple report template options
- **Collaboration Features**: Multi-user report editing
- **Analytics Dashboard**: Report generation metrics
- **Mobile Optimization**: Responsive design improvements

### Architectural Flexibility
- **Microservices Ready**: Service-oriented architecture potential
- **Database Agnostic**: Abstract storage interface allows database switching
- **API Versioning**: RESTful design supports version management
- **Plugin System**: Modular document generation pipeline

---

## Development Guidelines

### Code Organization
```
/client/                 # Frontend React application
  /src/
    /components/         # Reusable UI components
    /pages/             # Route-level components
    /hooks/             # Custom React hooks
    /lib/               # Utility functions and configurations
    /services/          # API service layers

/server/                # Backend Express application
  /routes/              # API route handlers
  /services/            # Business logic services
  /middleware/          # Express middleware
  /config/              # Configuration files

/shared/                # Shared TypeScript definitions
  schema.ts             # Zod schemas and TypeScript types

/attached_assets/       # Static assets and templates
```

### Development Commands
```bash
# Development
npm run dev           # Start development servers
npm run check         # TypeScript type checking
npm run build         # Production build
npm run start         # Production server

# Database
# MongoDB connection automatic via Mongoose
# No manual migrations required

# Authentication
# Google OAuth setup required in /server/config/credentials.json
```

This technical overview provides a comprehensive understanding of the Incident Reporter application's architecture, technologies, and implementation patterns. The system is designed for scalability, maintainability, and user experience while handling complex document generation workflows in a professional engineering context.