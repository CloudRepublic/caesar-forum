# Caesar Forum - Design Guidelines

## Design Approach

**Selected Approach:** Design System - Fluent Design + Linear aesthetics
**Justification:** Internal productivity tool for Caesar.nl requiring clarity, efficiency, and seamless Microsoft Outlook integration. Professional corporate aesthetic prioritizing usability and rapid session registration.

**Core Principles:**
- Information clarity with efficient task completion
- Professional corporate aesthetic reflecting Caesar.nl brand
- Seamless Outlook calendar integration
- Dutch language throughout

---

## Typography

**Font Family:** Inter (via Google Fonts CDN)

**Hierarchy:**
- Hero Title: text-4xl md:text-5xl, font-bold
- Page Title: text-3xl, font-bold
- Section Headers: text-2xl, font-semibold
- Session Titles: text-xl, font-semibold
- Speaker Names: text-base, font-medium
- Body/Description: text-base, font-normal
- Metadata (time/room/count): text-sm, font-medium
- Labels: text-xs, font-medium, uppercase, tracking-wide
- Button Text: text-sm, font-medium

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8 exclusively

- Hero padding: py-20 md:py-32
- Section spacing: py-12 md:py-16
- Component padding: p-6, p-8
- Card internal spacing: p-6
- Element gaps: gap-4, gap-6, gap-8
- Margins: m-2, m-4, m-6

**Container Strategy:**
- Max width: max-w-7xl mx-auto
- Page padding: px-4 md:px-8
- Content sections: max-w-6xl mx-auto

---

## Component Library

### Navigation
- Top bar with Caesar Forum logo/branding (left)
- Navigation items: "Dashboard", "Mijn Sessies", "Archief"
- User profile with name and email (right)
- Logout button (text-sm)
- Height: h-16
- Sticky positioning
- Border bottom separator

### Hero Section
- Large background image showing professional Caesar.nl team collaboration
- Centered content overlay with backdrop blur on container
- Hero headline: "Caesar Forum - [Maand Jaar]"
- Subheading: Event date and theme/topic
- Primary CTA: "Bekijk Sessies" (scroll anchor)
- Total sessions and registrations metadata
- Height: min-h-[60vh]

### Event Overview Card
- Prominent edition title
- Event date with calendar icon
- Location/venue information
- Total available sessions count
- Quick stats: total spots, registered attendees
- Border card style with rounded-lg
- Padding: p-8

### Session Cards
**Layout:** 2-column grid on desktop (grid-cols-1 md:grid-cols-2), 3-column on large screens (lg:grid-cols-3)

**Content Structure:**
- Session type badge (Talk/Workshop/Discussie)
- Session title (text-xl, font-semibold)
- Time range with clock icon (e.g., "14:00 - 15:30")
- Room/location with location pin icon (e.g., "Zaal Amsterdam")
- Speaker name with avatar placeholder and user icon
- Description preview (2-line truncate, text-sm)
- Registration count: "X/Y deelnemers" with users icon
- Status indicator: "Ingeschreven" badge or available spots text
- Action button: "Inschrijven" or "Uitschrijven"

**Card Style:**
- Border with rounded-xl
- Hover: elevated shadow transition
- Padding: p-6
- Space-y-4 for internal elements

**Button Placement:**
- Full-width on mobile
- Auto-width on desktop, right-aligned in card footer

### Status Indicators
- Registered: Badge with check icon, "Ingeschreven"
- Available: Text indicator "Nog X plekken beschikbaar"
- Full: Warning badge "Vol - Wachtlijst mogelijk"
- Past session: Muted badge "Afgelopen"

### Filters & Search (Dashboard)
- Search bar: "Zoek sessies..." with search icon
- Filter chips: "Alle", "Talks", "Workshops", "Discussies"
- Sort dropdown: "Sorteer op tijd/populariteit"
- Horizontal layout with gap-4
- Sticky below navigation on scroll

### "Mijn Sessies" Section
- Separate view showing only registered sessions
- Grouped by date/time
- Quick unregister action
- Export to calendar button prominent
- Empty state: "Je bent nog niet ingeschreven voor sessies"

---

## Page Structure

**Homepage Layout:**
1. Navigation (sticky)
2. Hero section with image and overlay
3. Event overview card (py-12)
4. Filters and search bar (sticky on scroll)
5. Session grid (py-8)
   - grid-cols-1 md:grid-cols-2 lg:grid-cols-3
   - gap-6
6. Footer with Caesar.nl branding and links (py-12)

**Responsive Behavior:**
- Mobile: Single column, full-width cards, stacked filters
- Tablet: 2-column grid, horizontal filter bar
- Desktop: 3-column grid, enhanced spacing

---

## Images

**Hero Image:** Required
- Professional, modern office environment showing Caesar.nl team collaboration
- Bright, energetic atmosphere
- Technology/innovation elements visible
- High quality, 1920x1080 minimum
- Placement: Full-width hero section background
- Treatment: Subtle dark overlay (30-40% opacity) for text readability

**Speaker Avatars:** Circular placeholders in session cards (32px diameter)

**Icons:** Heroicons via CDN
- Calendar: event dates
- Clock: session times
- MapPin: room locations
- Users/User: attendee counts and speakers
- CheckCircle: registered status
- Search: search functionality
- Filter: filtering options
- Download: calendar export

---

## Interactions

**Minimal, purposeful animations:**
- Card hover: shadow elevation (transition-shadow duration-200)
- Button hover: subtle scale (scale-105)
- Filter selection: background transition
- Badge appearance: fade-in when status changes
- NO loading spinners or complex transitions
- Instant UI feedback on registration actions

---

## Accessibility

- Minimum touch target: 44px for all interactive elements
- Clear focus states with visible outlines
- High contrast text throughout (WCAG AA minimum)
- Semantic HTML: nav, main, article, section
- Screen reader labels for icons and status badges
- Form inputs with associated labels
- Skip navigation link
- ARIA labels for Dutch language ("Inschrijven" button, etc.)

---

## Key Differentiators

- **Dutch Language:** All UI text in Nederlands
- **Microsoft Integration:** Outlook sync status indicator, "Toevoegen aan agenda" functionality
- **Speaker Visibility:** Prominent speaker information drives engagement
- **Session Context:** Room and description provide full decision-making context
- **Corporate Polish:** Professional Caesar.nl branded experience without sterility
- **Information Density:** Complete session details visible at card level, no modal drilling required