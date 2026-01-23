# Caesar Forum

## Overview

Caesar Forum is an internal session registration platform for Caesar.nl, designed for monthly internal events (talks, workshops, discussions). Employees can browse upcoming forum sessions, register for sessions, and manage their registrations. The application integrates with Microsoft Outlook via the Graph API to fetch events from a shared calendar, with sessions displayed in Dutch throughout.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state caching, React Context for user authentication state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite with HMR support

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript using ESM modules
- **API Pattern**: RESTful JSON API at `/api/*` endpoints
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **Authentication**: Azure AD OAuth with MSAL for user login; client credentials flow for calendar access

### Data Layer
- **ORM**: Drizzle ORM configured for PostgreSQL dialect
- **Schema Validation**: Zod with drizzle-zod integration
- **Primary Data Source**: Microsoft Graph API (shared Outlook calendar)
- **Schema Location**: `shared/schema.ts` contains all type definitions shared between client and server

### Key Design Decisions

1. **Microsoft Graph as Primary Data Source**: Sessions are fetched live from a shared Outlook calendar rather than stored in a local database. This ensures the calendar remains the single source of truth.

2. **Session Slugs**: User-friendly URLs using auto-generated slugs (title + hash suffix). Custom slugs can be set via YAML-style back-matter in Outlook event descriptions.

3. **Speaker Detection**: Required attendees on calendar events are treated as speakers. Falls back to organizer if no required attendees exist.

4. **Dutch Language UI**: All user-facing text is in Dutch to match the internal corporate audience.

5. **Graceful Degradation**: When Graph API is unavailable, displays user-friendly Dutch error messages rather than fallback mock data.

## External Dependencies

### Microsoft Graph API
- **Purpose**: Primary data source for forum sessions (shared calendar events)
- **Authentication**: Azure AD application with client credentials flow
- **Library**: @azure/msal-node for token acquisition, @microsoft/microsoft-graph-client for API calls
- **Required Environment Variables**:
  - `AZURE_CLIENT_ID`: Azure AD application client ID
  - `AZURE_CLIENT_SECRET`: Application secret
  - `AZURE_TENANT_ID`: Azure AD tenant ID

### PostgreSQL Database
- **Purpose**: Session storage for user authentication, not primary data storage
- **ORM**: Drizzle ORM
- **Required Environment Variables**:
  - `DATABASE_URL`: PostgreSQL connection string
  - `SESSION_SECRET`: Secret for express-session

### Azure Active Directory
- **Purpose**: User authentication via OAuth 2.0 PKCE flow
- **Scope**: User login and profile photo retrieval from Microsoft 365