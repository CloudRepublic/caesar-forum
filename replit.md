# Caesar Forum

## Overview

Caesar Forum is an internal session registration platform for Caesar.nl, designed for monthly internal events (talks, workshops, discussions). Employees can browse upcoming forum sessions, register/unregister for sessions, and view their registrations. The application integrates with Microsoft Outlook calendars as the primary data source - an all-day event determines the Forum date, and individual calendar events within that date become browsable sessions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **React 18 with TypeScript** using Vite for builds and HMR
- **Wouter** for lightweight client-side routing (routes: `/`, `/sessies/:slug`, `/mijn-sessies`)
- **TanStack React Query** for server state management with React Context for user authentication state
- **shadcn/ui** component library built on Radix UI primitives with Tailwind CSS
- **Dutch language** throughout the UI

### Backend
- **Node.js with Express** serving RESTful JSON API at `/api/*` endpoints
- **TypeScript with ESM modules**
- In development: Vite middleware integration; in production: static file serving from `dist/public`

### Data Layer
- **Primary storage: Microsoft Graph API** - reads/writes to a shared Outlook calendar
- **Drizzle ORM with PostgreSQL** - used for session storage (connect-pg-simple)
- **Zod** for schema validation with drizzle-zod integration
- Schema definitions in `shared/schema.ts` are shared between client and server

### Authentication
- **Azure AD with MSAL** - client credentials flow for Graph API access, user authentication via OAuth
- Session management using express-session with PostgreSQL store
- Required environment variables: `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`, `SESSION_SECRET`, `DATABASE_URL`

### Key Design Decisions
- **Outlook as source of truth**: Sessions come from calendar events; categories, attendees, and metadata are all derived from Outlook data
- **User-friendly URLs**: Sessions use slugs (e.g., `/sessies/angular-signal-forms-99v7g9`) auto-generated from title + hash, with custom slug support via YAML back-matter in event descriptions
- **Speaker photos**: Fetched from Microsoft 365 via `/api/users/{email}/photo`
- **No mock data fallback**: When Graph API is unavailable, displays user-friendly Dutch error messages
- **Multi-domain email handling**: Compares email local parts only to handle company domain aliases

## External Dependencies

### Microsoft Graph API
- **Purpose**: Primary data source for forum sessions (calendar events) and user photos
- **Authentication**: Azure AD application with client credentials flow using @azure/msal-node
- **Client**: @microsoft/microsoft-graph-client for API calls
- **Scope**: Calendars.ReadWrite on shared mailbox
- **Service location**: `server/microsoft-graph.ts`

### PostgreSQL Database
- **Purpose**: Session storage for user authentication sessions
- **Connection**: Via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Session store**: connect-pg-simple for express-session

### External Services
- **Google Fonts CDN**: Inter font family for typography
- **Azure AD**: User authentication and Graph API access tokens