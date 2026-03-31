# HYP-34 Sprint 1 UI Design Spec

Issue source: [HYP-34](/HYP/issues/HYP-34)
Related direction: [HYP-31](/HYP/issues/HYP-31)

## Goal
Deliver implementable Sprint 1 UI guidance for:
- 5 tool surfaces (Catalog template + JSON Formatter, Base64, UUID Generator, JWT Decoder, Regex Tester)
- Auth screens (login, register, logout/session-expired)
- Admin dashboard (users, tools, stats)

This document is the "equivalent asset" handoff in place of Figma frames.

## Scope Deliverables
- Route-level wireframe guidance (desktop/tablet/mobile)
- Interaction behavior and state handling
- Component usage and naming alignment for FE
- Accessibility and responsive constraints

## Information Architecture
- Public routes:
  - `/login`
  - `/register`
  - `/session-expired` (also usable as logout confirmation state)
- Authenticated routes:
  - `/tools` (catalog)
  - `/tools/[toolSlug]` (detail)
  - `/tools/[toolSlug]/execute` (run tool)
- Admin routes (`admin` role):
  - `/admin` (dashboard summary)
  - `/admin/users`
  - `/admin/tools`

Top navigation:
- Primary: Catalog, Admin (only when role is `admin`)
- Session zone: email, role badge, `Sign out`
- On mobile: nav collapses into one row with horizontal scroll, never hidden behind an unlabeled icon

## Shared Tool Page Template
Template applies to all 5 tools and keeps behavior consistent.

Desktop (>=1200px):
- Header row: tool name, status badge, primary CTA (`Run tool`)
- Body split: `Input panel (left, 7/12)` and `Output panel (right, 5/12)`
- Right panel sticky with max height and internal scroll

Tablet (768-1199px):
- Header unchanged
- Two-column remains but right panel is non-sticky

Mobile (<=767px):
- Single column
- Output panel follows input panel
- Primary CTA stays visible at end of input form

Required states on each tool page:
- Loading: skeleton blocks for header + panel fields
- Empty output: neutral helper text and example hint
- Success: summary row + copy button + optional raw output collapse
- Error: inline alert at top of output panel with retry affordance

## Tool-Specific Layout Guidance

### JSON Formatter
- Inputs:
  - `JSON input` textarea (required)
  - `Indent size` select (2, 4)
  - `Sort keys` checkbox
- Output:
  - formatted JSON block
  - `Copy output` button
- Error behavior:
  - show parse location (line/column) if provided by API

### Base64
- Inputs:
  - Mode segmented control: `Encode` / `Decode`
  - `Text` or `Base64` textarea (label changes with mode)
- Output:
  - transformed content block
  - `Copy output`
- Validation:
  - decode mode flags invalid Base64 before submit when possible

### UUID Generator
- Inputs:
  - `Version` select (`v4` default)
  - `Count` number input (1-100)
  - optional `Uppercase` checkbox
- Output:
  - list/table of UUID values
  - row-level copy + copy all

### JWT Decoder
- Inputs:
  - `JWT token` textarea (required)
- Output sections:
  - token validity state badge
  - header JSON, payload JSON, signature meta
  - expiry row with relative time
- Error behavior:
  - invalid token alert with plain-language reason

### Regex Tester
- Inputs:
  - `Pattern` input
  - `Flags` multi-select/checkbox group (`g`, `i`, `m`, `s`, `u`, `y`)
  - `Test string` textarea
- Output:
  - match count
  - match list with index ranges
  - highlighted preview area

## Auth Page Specs

### Login (`/login`)
- Centered auth panel with heading + short trust message
- Fields: email, password
- CTA: `Sign in`
- Secondary link: `Create account`
- Error pattern: inline error block above CTA
- Helper block for local seed credentials in muted panel

### Register (`/register`)
- Centered panel matching login visual structure
- Fields: full name, email, password
- Inline validation:
  - name required
  - email format
  - password length minimum
- CTA: `Create account`
- Secondary link: `Already have an account? Sign in`

### Logout Confirmation / Session Expired (`/session-expired`)
- Simple state page card:
  - title (`Session expired` or `Signed out`)
  - short reason text
  - primary CTA `Sign in again`
  - secondary CTA `Back to tools catalog`

## Admin Dashboard Specs

### Admin Home (`/admin`)
- Top summary cards:
  - total users
  - active users (7d)
  - tool executions (24h)
  - enabled tools
- Below summary: quick links to Users and Tools tables

### User Management (`/admin/users`)
- Table columns:
  - name
  - email
  - role
  - status (active/inactive)
  - last login
  - actions
- Row actions:
  - activate/deactivate with confirm step for deactivate
- Table states:
  - loading skeleton rows
  - empty state with guidance text

### Tool Management (`/admin/tools`)
- Table columns:
  - tool name
  - slug
  - category
  - enabled status
  - last updated
  - actions
- Actions:
  - enable/disable (disable requires confirm)
  - reorder (up/down or drag handle in later phase)
- Behavior note:
  - optimistic UI can be used, but failures must rollback and show toast/inline error

## Interaction and Component Notes
Use current FE component naming for implementation clarity:
- Layout shell: `AppShell`
- Surface containers: `Card` (`solid`, `glass` variants)
- Inputs: `Field`, `Input`, `Select`, `Textarea`
- Actions: `Button` (`primary`, `ghost`, `danger`)
- Status labels: `Badge` (`neutral`, `success`, `danger`, `warning`, `info`)

Behavior requirements:
- Primary actions are always left-to-right first in tab order
- Destructive actions require confirmation prompt
- All async actions expose loading and disabled states
- Result panels keep previous success visible until next run starts

## Accessibility Requirements
- Contrast:
  - body text >= 4.5:1
  - control boundaries/focus >= 3:1
- Keyboard:
  - no trapped focus
  - visible focus ring on every interactive element
- Forms:
  - labels bound to controls
  - errors linked via `aria-describedby`
- Live regions:
  - execution status updates announced with `aria-live="polite"`
- Motion:
  - transitions 150-220ms
  - honor `prefers-reduced-motion`

## Responsive Rules
- Mobile: <=767px
- Tablet: 768-1199px
- Desktop: >=1200px

Layout constraints:
- No horizontal scroll at 360px width
- Buttons min height 40px
- Tool metadata grids collapse to single column under 768px

## Wireframe Guidance (Text)

```text
[Desktop Execute]
+---------------------------------------------------------------+
| Tool Name   [Enabled]                           [Run tool CTA] |
+-------------------------------+-------------------------------+
| Input panel                   | Output panel (sticky)         |
| - dynamic fields              | - status                      |
| - hints + validation          | - result summary              |
| - submit                      | - raw output + copy           |
+-------------------------------+-------------------------------+
```

```text
[Mobile Execute]
+----------------------------------+
| Tool Name [Enabled]              |
| Run tool CTA                     |
+----------------------------------+
| Input panel                      |
+----------------------------------+
| Output panel                     |
+----------------------------------+
```

## FE Handoff Checklist
- Implement routes and layouts in this spec before visual polish iterations
- Keep component names and variants as listed in this document
- Implement full states for loading/empty/error/success per route
- Validate keyboard flow on login and execute pages before merge

## QA Acceptance Checklist
- User can complete login and run a tool via keyboard only
- All 5 tools follow the same page template and state model
- Admin tables have clear loading/empty/error states
- Mobile layouts are usable at 360x800 without clipped controls
