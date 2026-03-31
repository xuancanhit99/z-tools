# HYP-31 UI Refresh Spec

## Context
Current web UI is functional but still looks like an early scaffold:
- Visual hierarchy is weak (many cards/sections have similar emphasis)
- Navigation and actions do not guide the user to the primary task quickly
- Inputs/states (loading, error, empty, success) are text-only and visually flat
- The app branding and tone do not feel modern for a tools product

Issue source: [HYP-31](/HYP/issues/HYP-31)

## Design Goal
Create a modern, clean interface with subtle glass-style surfaces that keeps the product practical and fast to use.

Success criteria:
- User reaches "find tool -> view detail -> execute" with minimal friction
- Core actions are visually obvious on every screen
- Visual style is consistent across Login, Catalog, Detail, Execute, Admin
- States are accessible and clear for keyboard and screen-reader users

## Visual Direction

### Style keywords
- Clean
- Calm contrast
- Glass accents (not heavy blur everywhere)
- Utility-first clarity

### Token direction
- Background: layered gradient + soft noise optional
- Surfaces: semi-opaque cards for primary shells only
- Borders: light, cool-tone strokes to separate layers
- Shadows: soft, large-radius elevation (avoid harsh dark shadows)
- Accent color: a single blue-cyan family for primary action
- Semantic colors: success/warn/error must remain high contrast

### Typography
- Keep Space Grotesk for headings and use a neutral readable body fallback
- Stronger type scale:
  - Page title: 32/700 desktop, 28/700 tablet, 24/700 mobile
  - Section title: 20/600
  - Body: 15-16/400
  - Meta labels: 12-13/500

## UX Flow Specs

### 1) Login flow
- Centered auth panel with concise trust message
- Keep default credentials hint in a secondary helper block (not mixed with form labels)
- Primary CTA: "Sign in"
- Secondary path: "Back to catalog preview" (if product policy allows)
- Error pattern: inline error block above CTA with icon + plain language

### 2) Tool Catalog flow
- Header area includes:
  - Page title
  - Search input (primary control)
  - One compact status/filter row (enabled/disabled/category)
- Tool cards should show:
  - Name + one-line description
  - Category chip
  - Enabled state chip
  - Two actions: "View" (secondary) and "Run" (primary)
- Empty state: guidance text + "Clear filters" action
- Loading state: skeleton cards (not plain text only)

### 3) Tool Detail flow
- Hero section with tool identity and quick status
- Structured metadata block using 2-column key-value desktop, 1-column mobile
- Schema section rendered as a readable field table/list with required markers
- Primary CTA persistent near top: "Run tool"
- Back navigation: "Back to catalog"

### 4) Execute flow
- Split layout desktop:
  - Left: dynamic form
  - Right: execution hints + result status (sticky panel)
- Mobile layout: single column with result section below form
- Form controls:
  - Required marker in label
  - Input hint below control
  - Validation shown inline per field where possible
- Submission states:
  - Idle: "Run tool"
  - Running: loading indicator + disabled form
  - Success: result summary card + expandable raw output
  - Failure: error alert with retry CTA

### 5) Admin tools flow
- Data table/list style (not nested cards inside card)
- Each row: tool name, slug, status, category, last update (if available), action toggle
- Toggle action requires confirm step for disable
- Add note about optimistic update vs real backend state

## Component Behavior Notes
- Top bar
  - Keep sticky behavior
  - Increase separation between brand, nav, and user session controls
  - Active nav uses stronger contrast + subtle fill
- Card
  - Two variants: `solid` and `glass`
  - Glass only for key containers (header panel, auth panel, result panel)
- Buttons
  - Primary (filled accent), secondary (soft outline), danger (high contrast)
  - Minimum hit area: 40px height
- Badges
  - Standardized tones: neutral/success/warning/danger/info
- Form fields
  - Focus ring always visible, 3:1 contrast minimum against surrounding surface

## Accessibility Requirements
- Color contrast target:
  - 4.5:1 for body text
  - 3:1 for large text and UI boundaries where appropriate
- Keyboard:
  - Logical tab order
  - All actions reachable and visible focus state
- Screen readers:
  - Explicit labels for all fields
  - Error messages linked via `aria-describedby`
  - Loading regions announced with `aria-live="polite"`
- Motion:
  - Use subtle transitions (150-220ms)
  - Respect `prefers-reduced-motion`

## Responsive Rules
- Breakpoints:
  - Mobile: <= 767px
  - Tablet: 768-1199px
  - Desktop: >= 1200px
- On mobile:
  - Collapse topbar layout cleanly
  - Keep primary CTA visible without horizontal scrolling
  - Avoid dense metadata grids

## Implementation Handoff (FE)
1. Refactor design tokens and surface variants in global styles/theme layer.
2. Update shell/topbar and page headers for consistent hierarchy.
3. Rework Catalog, Detail, Execute, Admin layouts per flow specs above.
4. Add loading/empty/error/success visual states for each route.
5. Run accessibility pass (contrast + keyboard + labels/aria).

## QA Acceptance Checklist
- Visual consistency between all major routes
- No broken layout at 360px width and 1280px width
- Execute flow clearly communicates running/success/failure
- Keyboard-only user can complete login and execute a tool
- Disabled vs enabled tools are distinguishable without color only
