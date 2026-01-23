# Caesar Forum

## Overview

Caesar Forum is an internal session registration platform for Caesar.nl, designed for monthly internal events (talks, workshops, discussions). Employees can browse upcoming forum sessions, register for sessions, and manage their registrations. The platform integrates directly with Microsoft Outlook shared calendars via Microsoft Graph API to fetch event data, with the Dutch language used throughout the UI.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React Context for user authentication state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite with HMR support

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful JSON API at `/api/*` endpoints
- **Session Management**: express-session with PostgreSQL session store (connect-pg-simple)
- **Authentication**: Azure AD OAuth2 via MSAL for user login

### Data Layer
- **ORM**: Drizzle ORM configured for PostgreSQL dialect
- **Schema Validation**: Zod with drizzle-zod integration
- **Schema Location**: `shared/schema.ts` contains all type definitions shared between client and server
- **Primary Data Source**: Microsoft Graph API reads from a shared Outlook calendar - no local database storage for forum/session data

### Key Design Patterns
- **Shared Types**: TypeScript schemas in `shared/schema.ts` are used by both frontend and backend
- **API Error Handling**: GraphApiUnavailableError class provides user-friendly Dutch error messages when Microsoft services are unavailable
- **Session Slugs**: URL-friendly slugs auto-generated from session titles with hash suffixes for uniqueness
- **Email Matching**: Local part comparison (before @) handles multi-domain email aliases

## External Dependencies

### Microsoft Graph API Integration
- **Purpose**: Primary data source for forum editions and sessions (reads from shared Outlook calendar)
- **Authentication**: Azure AD application with client credentials flow
- **Libraries**: @azure/msal-node for token acquisition, @microsoft/microsoft-graph-client for API calls
- **Required Environment Variables**:
  - `AZURE_CLIENT_ID`: Azure AD application client ID
  - `AZURE_CLIENT_SECRET`: Application secret
  - `AZURE_TENANT_ID`: Azure AD tenant ID
- **Features**:
  - All-day events determine Forum date and title
  - Required attendees are treated as session speakers
  - Speaker photos fetched via `/api/users/{email}/photo` endpoint
  - Categories from Outlook displayed as-is (Talk, Workshop, Demo, etc.)

### Database
- **PostgreSQL**: Used for session storage (express-session) via connect-pg-simple
- **Required Environment Variable**: `DATABASE_URL`
- **Note**: Drizzle ORM is configured but forum data comes from Microsoft Graph, not the database

### Other Required Environment Variables
- `SESSION_SECRET`: Required for express-session encryption
- `APP_URL` or `REPLIT_DEV_DOMAIN`: Used for OAuth redirect URIs