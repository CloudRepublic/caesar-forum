# Caesar Forum

## Overview

Caesar Forum is an internal session registration platform for Caesar.nl, designed for monthly internal events (talks, workshops, discussions). The application allows employees to browse upcoming forum sessions, register/unregister for sessions, and view their registered sessions. The platform integrates with Microsoft Outlook calendar as the primary data source and uses Azure AD for authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state, React Context for user state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite with HMR support
- **Design System**: Fluent Design + Linear aesthetics with Inter font family

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful JSON API at `/api/*` endpoints
- **Session Management**: express-session with connect-pg-simple for PostgreSQL session storage
- **Authentication**: Azure AD with MSAL (client credentials flow for Graph API, authorization code flow for user auth)

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect (configured but primary storage is Graph API)
- **Schema Validation**: Zod with drizzle-zod integration
- **Primary Data Source**: Microsoft Graph API (shared Outlook calendar)
- **Session Storage**: PostgreSQL for express-session
- **Schema Location**: `shared/schema.ts` contains all type definitions

### Key Design Decisions

1. **Microsoft Graph as Primary Storage**: Forum sessions are calendar events in a shared Outlook mailbox. This eliminates data duplication and allows organizers to manage sessions directly in Outlook.

2. **Slug-based URLs**: Sessions use URL-friendly slugs (e.g., `/sessies/angular-signal-forms-99v7g9`) auto-generated from title + hash. Custom slugs can be set via YAML back-matter in Outlook descriptions.

3. **Speaker Detection**: All "required" attendees on calendar events are treated as speakers. Falls back to event organizer if no required attendees exist.

4. **Category System**: Session categories (Talk, Workshop, Demo, Brainstorm, Hackathon, etc.) come directly from Outlook categories with no mapping - shown as-is.

5. **Dutch UI**: All user-facing text is in Dutch to match Caesar.nl's internal audience.

6. **Error Handling**: User-friendly Dutch error messages when Graph API is unavailable. No fallback to mock data in production.

## External Dependencies

### Microsoft Azure Services
- **Azure AD**: Authentication for both user login (authorization code flow) and Graph API access (client credentials)
- **Microsoft Graph API**: Primary data source for calendar events, user photos, and user info
- **Environment Variables**:
  - `AZURE_CLIENT_ID`: Azure AD application client ID
  - `AZURE_CLIENT_SECRET`: Application secret
  - `AZURE_TENANT_ID`: Azure AD tenant ID

### Database
- **PostgreSQL**: Session storage for express-session (configured via `DATABASE_URL`)
- **Drizzle ORM**: Database toolkit (schema in `shared/schema.ts`, migrations in `/migrations`)

### Key NPM Packages
- `@azure/msal-node`: Microsoft authentication library
- `@microsoft/microsoft-graph-client`: Graph API client
- `express-session` + `connect-pg-simple`: Session management
- `isomorphic-dompurify`: HTML sanitization for Outlook content