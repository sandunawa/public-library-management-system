# LibraryOS UI/UX Redesign Audit & Strategic Plan

## 1. Executive Summary & Baseline Results

A comprehensive audit was performed on the existing **LibraryOS** (National Standards Library Services Platform).
This document captures the baseline state, surface structures, design system facts, flagged architectural/logic issues, and the exact redesign phases to be executed without changing any business or service logic.

### Baseline Status (Pre-Redesign)
- **Git Branch**: Initialized `main` commit and branched to `ui-redesign`.
- **Package Manager**: npm on Windows (Node environment).
- **Unit Tests (`npm test`)**: **PASSED** (7 tests passed in `tests/unit/policy-and-state.test.ts` via Vitest in 2.01s).
- **Build (`npm run build`)**: **PASSED** (`tsc -b && vite build` built production bundle in 25.68s, 2805 modules transformed).
- **Linter (`npm run lint`)**: `eslint` config is targeted at root scripts; requires network/local packages. Baseline build and test suites pass completely.

---

## 2. Surfaces & Page Inventory

### Surface 1: Public OPAC (`/`)
- **Layout**: `PublicLayout.tsx` (Sticky header with search bar, logo, language/theme switchers, dynamic account/login links, footer).
- **Pages**:
  - `HomePage.tsx` (`/`): Public discovery catalog, keyword & category search, language & availability filters, book card results. Reads `CatalogRepository.searchBooks()`.

### Surface 2: Unified Auth Hub (`/login`, `/register`)
- **Layout**: `AuthLayout.tsx` (Split desktop / responsive container for authentication).
- **Pages**:
  - `AuthPage.tsx` (`/login`, `/register`): Dual tab mode. Sign in via email/password or membership ID. Register features a 4-step stepper (Identity, Personal, Contact, Security). Reads/writes `LocalAuthService`.

### Surface 3: Member Portal (`/account/*`)
- **Layout**: `MemberLayout.tsx` (Top header with Member Portal chip, 5-item sidebar navigation).
- **Pages**:
  - `MemberDashboardPage.tsx` (`/account`, `/account/loans`, `/account/holds`, `/account/fines`, `/account/profile`): Reads active member profile, current loans, reservations/holds, accrued fines, and generates digital membership barcode card with print/download capability. Reads `LocalAuthService` & `CirculationRepository`.

### Surface 4: Staff Console (`/staff/*`)
- **Layout**: `StaffLayout.tsx` (Left 64-width sidebar, top bar with branch info and staff workspace tag, runs background scheduled Telegram backup check).
- **Pages**:
  - `StaffDashboardPage.tsx` (`/staff`): Key metrics (total titles, members, active loans, pending approvals), sample circulation analytics chart, one-click Firebase sync status widget. Reads `CatalogRepository`, `CirculationRepository`, `LocalAuthService`, `FirebaseSyncService`.
  - `CirculationDeskPage.tsx` (`/staff/circulation`): Issue and return desk with keyboard scan input, barcode scanner simulation, active loans display, loan policies, and fine calculation.
  - `IssuedBooksPage.tsx` (`/staff/issued-books`): Live table of currently issued copies with due dates, patron contacts, and return actions.
  - `OverdueFinesPage.tsx` (`/staff/fines`): List of overdue items, accrued fines, payment collection, and waiving flows.
  - `SuspendedMembersPage.tsx` (`/staff/suspended`): Management of patrons with suspended borrowing privileges due to excessive overdues or policy breaches.
  - `CatalogManagementPage.tsx` (`/staff/catalog`): Book inventory management, addition, editing, barcode allocation, and deletion.
  - `StaffMembersPage.tsx` (`/staff/members`, `/staff/requests`): Member directory with search, filtering, patron status modification, and registration approval/rejection.
  - `StaffApprovalQueuePage.tsx` (Unrouted standalone component): Dedicated patron verification queue.
  - `InventoryStocktakePage.tsx` (`/staff/inventory`): Shelf scanning, discrepancy reconciliation, and stocktake verification.
  - `MissingBooksPage.tsx` (`/staff/missing-books`): Reported missing copies tracker, search, and status transitions.
  - `ShelfAuditSecurityPage.tsx` (`/staff/audit`): Misplaced items audit logs and shelf location tracking.
  - `ReportsCenterPage.tsx` (`/staff/reports`): Export center for patrons, catalog, circulation, and overdue reports (CSV, Excel XLSX, PDF).
  - `PolicySettingsPage.tsx` (`/staff/settings`): Circulation limits, loan periods, fine rates per day, and grace periods.

### System & Error Pages
- `NotFoundPage.tsx` (`*`): 404 error page.
- `ErrorBoundaryPage.tsx`: Catch-all React error boundary page.

---

## 3. Design System Audit & Token Facts

1. **Tokens in `index.css` & `tailwind.config.ts`**:
   - Currently uses HSL variables: `--background`, `--foreground`, `--card`, `--primary` (navy `215 57% 19%`), `--accent`, `--border`, etc.
   - 4 existing themes: `:root` (light), `.dark`, `.theme-high-contrast`, `.theme-warm-paper`.
2. **Hardcoded Palette Usages**:
   - Exactly **198 occurrences** of raw Tailwind color utilities (`text-amber-*`, `bg-rose-*`, `text-emerald-*`, `bg-blue-*`, etc.) throughout `src/features` and layouts.
   - These bypass CSS variables and will be converted to semantic design tokens (`success`, `warning`, `danger`, `info` with `DEFAULT`, `foreground`, and `soft` variations).
3. **Typography**:
   - **66 instances** of `text-[11px]` and many `text-xs uppercase tracking-wider` applied onto Sinhala/Tamil script strings (`(ණයට දුන් පොත්)`, `(ප්‍රමාද දඩ මුදල්)`).
   - Letter-spacing on Brahmic/Indic scripts breaks ligatures and conjunct consonants.
   - Needs: Plus Jakarta Sans for headings, Inter for body, clean font hierarchy, minimum 13px captions, 14px body/inputs, and `tabular-nums` for dates/currencies.
4. **Missing UI Primitives**:
   - Only `button.tsx`, `card.tsx`, `input.tsx` currently exist in `src/components/ui/`.
   - Need to build 20+ accessible primitives leveraging installed `@radix-ui/*` packages.

---

## 4. Verified & Flagged Issues (Rule 0.G / 1.3)

| Issue | Details | Action Taken |
| :--- | :--- | :--- |
| **Hardcoded Staff Active Nav** | In `StaffLayout.tsx`, the Desk Scan Mode link was hardcoded with active classes (`bg-primary text-primary-foreground`) while all other links were static. | Fixed visually using `NavLink` with active states matching current route. No logic changed. |
| **No Mobile Navigation** | `StaffLayout` and `MemberLayout` collapsed horizontally or broke on mobile screen widths (< 1024px / < 768px). | Added responsive off-canvas mobile drawer with accessible triggers. |
| **StaffDashboard Chart Data** | `StaffDashboardPage.tsx` charts render a static hardcoded `circulationData` array. | Labeled chart clearly with `"Sample data"` badge in the UI; left data logic untouched and flagged here. |
| **Hardcoded Branch & Firebase ID** | `"Colombo Central (HQ)"` and Firebase Project ID `"libraryos-app-9fc34"` are hardcoded in the header & sync card. | Restyled with calm, clean UI badges. Preserved copy and flagged. |
| **Staff Sign-Out Navigation** | Staff sign out calls `navigate('/login')` instead of `signOut()` from `AuthContext`, whereas `PublicLayout` calls `signOut()`. | Kept behavior identical to preserve existing authorization flow; flagged. |
| **Public Footer Dead Links** | Footer anchors (`#privacy`, `#terms`, `#a11y`, `#status`) point to empty anchor hashes. | Styled cleanly as accessible muted informational links without faking new routes. Flagged. |
| **Unrouted `/kiosk`** | Mentioned in README and locales but has no component or route. | Flagged; no route or fake logic created. |
| **Unrouted `StaffApprovalQueuePage`** | Imported in `router.tsx` but unrouted (`/staff/members` and `/staff/requests` route to `StaffMembersPage`). | Redesigned component cleanly; left routing untouched and flagged. |
| **Member Subroutes Reusing Same Component** | `/account/loans`, `/holds`, `/fines`, `/profile` all render `MemberDashboardPage`. | Handled visual tab activation and dynamic page headers based on URL path without modifying routes. |

---

## 5. Implementation Roadmap

- **Phase 1: Tokens & Foundations**: Redesign `index.css` (Deep Indigo `#4338CA`, Teal `#0F766E`, Soft Slate `#F8FAFC`, semantic success/warning/danger/info tokens across all 4 themes), update `tailwind.config.ts`, load Plus Jakarta Sans in `index.html`, and add `favicon.svg`.
- **Phase 2: UI Primitives**: Create 20+ Radix/cva components in `src/components/ui/`, create `BookCover.tsx`, `EmptyState.tsx`, `PageHeader.tsx`, and `ui-status.ts` badge mapper.
- **Phase 3: Layouts & Navigation**: Upgrade `StaffLayout`, `MemberLayout`, `PublicLayout`, `AuthLayout` with mobile drawers, skip links, and sonner toaster styling.
- **Phase 4: Public OPAC & Auth**: Overhaul `HomePage.tsx` and `AuthPage.tsx` with responsive filters, hero banners, and 4-step registration stepper.
- **Phase 5: Staff Core Features**: Redesign `StaffDashboardPage`, `CirculationDeskPage`, `IssuedBooksPage`, `OverdueFinesPage`, `SuspendedMembersPage`.
- **Phase 6: Staff Management Features**: Redesign `CatalogManagementPage`, `StaffMembersPage`, `StaffApprovalQueuePage`, `InventoryStocktakePage`, `MissingBooksPage`, `ShelfAuditSecurityPage`, `ReportsCenterPage`, `PolicySettingsPage`.
- **Phase 7: Member Portal & Errors**: Polish `MemberDashboardPage`, `MemberIdCard`, `BarcodeLabel`, `NotFoundPage`, `ErrorBoundaryPage`.
- **Phase 8: Generated Images & Motion**: Generate 8 WebP assets in `public/images/`, wire into components, and add reduced-motion CSS guards.
- **Phase 9: Comprehensive QA**: Full build, test suite execution, responsive verification across breakpoints, theme contrast validation, and final report.
