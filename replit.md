# Caesar Forum

## Overview

Caesar Forum is an internal session registration platform for Caesar.nl, designed for monthly internal events (talks, workshops, discussions). The application allows employees to browse upcoming forum sessions, register/unregister for sessions, and view their registered sessions. The interface is in Dutch and follows a professional corporate aesthetic with Fluent Design principles.

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

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful JSON API at `/api/*` endpoints
- **Development**: Vite middleware integration for HMR
- **Production**: Static file serving from built assets

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod with drizzle-zod integration
- **Primary Storage**: Microsoft Graph API (forum@caesar.nl calendar)
- **Fallback Storage**: In-memory mock data when Graph API unavailable
- **Schema Location**: `shared/schema.ts` contains all type definitions

### Microsoft Graph Integration
- **Authentication**: Azure AD application with client credentials flow
- **Library**: @azure/msal-node for token acquisition, @microsoft/microsoft-graph-client for API calls
- **Scope**: Calendars.ReadWrite on forum@caesar.nl mailbox only
- **Service Location**: `server/microsoft-graph.ts`
- **Environment Variables Required**:
  - `AZURE_CLIENT_ID`: Azure AD application client ID
  - `AZURE_CLIENT_SECRET`: Application secret (expires Jan 8, 2027)
  - `AZURE_TENANT_ID`: Caesar M365 tenant ID
- **Categories from Outlook**: Events can have multiple categories from Outlook (e.g., "Talk", "Workshop", "Demo", "Brainstorm", "Hackathon", "Promotion"). All categories are shown as-is with no mapping. Filters only appear for categories that have events.
- **Speaker Detection**: The first "required" attendee is used as the speaker. If no required attendee exists, falls back to the event organizer. Users who register via the app are added as "optional" attendees so they don't interfere with speaker detection.
- **Speaker Photos**: Fetched automatically from Microsoft 365 via `/api/users/{email}/photo` endpoint. Uses the speaker's email to retrieve their M365 profile photo.
- **All-day Event**: An all-day event determines the Forum date, but is not shown as a session

### User Authentication (Entra ID)
- **Provider**: Microsoft Entra ID (Azure AD) with OAuth 2.0 authorization code flow + PKCE
- **Library**: @azure/msal-node for server-side authentication
- **Session Store**: connect-pg-simple (PostgreSQL-backed session store)
- **Routes**:
  - `GET /auth/login` - Initiates OAuth flow with PKCE
  - `GET /auth/redirect` - Handles OAuth callback, stores user in session
  - `GET /auth/logout` - Clears session and redirects to Entra logout
  - `GET /api/me` - Returns authenticated user from session (401 if not logged in)
- **Environment Variables Required**:
  - `SESSION_SECRET`: Secret for signing session cookies
  - Same Azure credentials as Graph API (AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID)
- **Frontend Integration**: UserContext fetches /api/me on mount and provides login/logout functions
- **Registration Protection**: All registration APIs require authenticated session (returns 401 otherwise)

### Key Design Decisions

1. **Monorepo Structure**: Client (`client/`), server (`server/`), and shared code (`shared/`) in single repository with path aliases (`@/`, `@shared/`)

2. **Type Safety**: Zod schemas in shared directory ensure runtime validation matches TypeScript types across frontend and backend

3. **Component Library**: shadcn/ui provides accessible, customizable components without external dependencies - components are copied into the codebase rather than imported from npm

4. **Outlook is Leading**: All session categories come directly from Outlook calendar events. The app only shows filters for categories that have events. No hardcoded category mappings.

## External Dependencies

### Database
- **PostgreSQL**: Primary database (configured via `DATABASE_URL` environment variable)
- **Drizzle Kit**: Database migrations and schema push (`db:push` script)

### Third-Party Services
- **Microsoft Graph API**: Calendar integration with forum@caesar.nl shared mailbox
- **Google Fonts**: Inter font family loaded via CDN
- **connect-pg-simple**: PostgreSQL session store (available but not currently active)

### Key NPM Packages
- `@tanstack/react-query`: Server state management
- `@azure/msal-node`: Microsoft identity platform authentication
- `@microsoft/microsoft-graph-client`: Microsoft Graph API client
- `drizzle-orm` / `drizzle-zod`: Database ORM and validation
- `express`: HTTP server framework
- `zod`: Schema validation
- `wouter`: Client-side routing
- `date-fns`: Date formatting utilities
- `lucide-react`: Icon library