# Caesar Forum - Design Guidelines

## Design Approach

**Selected Approach:** Design System - Fluent Design + Linear aesthetics
**Justification:** Internal productivity tool requiring clarity, efficiency, and seamless Microsoft ecosystem integration. Clean, functional design prioritizing usability over visual experimentation.

**Core Principles:**
- Information clarity over decoration
- Efficient task completion (register/unregister in minimal clicks)
- Professional corporate aesthetic
- Seamless Outlook integration visibility

---

## Typography

**Font Family:** Inter (via Google Fonts CDN)

**Hierarchy:**
- Page Title: text-3xl, font-bold (Caesar Forum - Month Year)
- Section Headers: text-xl, font-semibold
- Session Titles: text-lg, font-medium
- Body Text: text-base, font-normal
- Metadata/Time: text-sm, text-gray-600
- Button Text: text-sm, font-medium

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, and 8 exclusively
- Component padding: p-4, p-6
- Section spacing: py-8, py-12
- Gap between elements: gap-4, gap-6
- Margins: m-2, m-4, m-6

**Container Strategy:**
- Max width: max-w-6xl mx-auto
- Page padding: px-4 md:px-6
- Card spacing: space-y-6

---

## Component Library

### Navigation
- Top bar with Caesar Forum branding (left)
- User profile indicator with email (right)
- Logout button (subtle, right-aligned)
- Height: h-16
- Sticky positioning for desktop

### Event Header Card
- Prominent display of current edition (Caesar Forum - Month Year)
- Event date clearly visible
- Total sessions count
- Contained card with subtle border
- Padding: p-6

### Session Cards
**Layout:** Grid on desktop (2 columns), stack on mobile
- Session title (prominent, font-medium)
- Time range with clock icon
- Registered attendees count with user icon
- Registration status indicator (Registered/Available)
- Primary action button (Register/Unregister)
- Card style: border, rounded corners (rounded-lg), hover shadow transition
- Padding: p-6

**Button States:**
- Register: Solid primary button
- Unregister: Outlined secondary button
- Disabled (full): Muted with attendee count indicator

### Status Indicators
- Registered: Badge with checkmark icon
- Spots Available: Subtle text indicator
- Full: Warning badge

### Empty States
- When no upcoming events: Centered message with calendar icon
- When no sessions: Clear messaging with supportive icon

---

## Page Structure

**Dashboard Layout:**
1. Navigation bar (sticky)
2. Event header section (py-8)
3. Session grid (py-12)
   - 2-column grid on desktop (grid-cols-1 md:grid-cols-2)
   - gap-6 between cards
4. Footer with simple metadata (py-8)

**Responsive Behavior:**
- Mobile: Single column, full-width cards
- Tablet/Desktop: 2-column grid, increased spacing

---

## Interactions

**Minimal Animations:**
- Card hover: subtle shadow increase (transition-shadow duration-200)
- Button hover: background opacity shift
- NO complex transitions or loading spinners
- Instant feedback on registration actions

---

## Images

**No hero image required** - This is a utility application. Focus on clear information presentation.

**Icons:** Use Heroicons (via CDN)
- Calendar icon for dates
- Clock icon for times
- User/Users icon for attendee counts
- CheckCircle for registered status
- XCircle for unregister action

---

## Accessibility

- All interactive elements minimum touch target: 44px
- Clear focus states on all buttons and cards
- High contrast text (maintain WCAG AA minimum)
- Semantic HTML structure (nav, main, article for sessions)
- Screen reader labels for status indicators

---

## Key Differentiators

- **Calendar Integration:** Subtle Outlook logo/mention showing sync status
- **Real-time Feel:** Registration reflects immediately in UI
- **Information Density:** All critical info visible without scrolling per session
- **Corporate Polish:** Professional without being sterile - clean, modern internal tool aesthetic