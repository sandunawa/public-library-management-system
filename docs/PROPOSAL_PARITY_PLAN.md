# LibraryOS Proposal Parity Plan & Architecture Specification

**Author**: Senior Product Designer & Frontend Architect  
**Branch**: `feature/proposal-parity`  
**Status**: Proposal Parity Phase 0 Plan  
**Target Completion**: Waves A, B, C, D, E  

---

## 1. Executive Summary & Architecture Overview

The purpose of this project is to implement all missing client features outlined in the "Smart Library Management System" (Enivac International) proposal into the existing LibraryOS codebase, while ensuring zero regression of existing functionality, zero breaking changes to data models, and strict adherence to the existing visual design system and repository patterns.

### Technical Stack & Constraints
- **Core**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS with shadcn HSL design tokens, Plus Jakarta Sans, and Noto Sans Sinhala/Tamil
- **Animation**: Framer Motion (`framer-motion`) & CSS keyframes
- **State & Data**: Local-first repository pattern with localStorage snapshotting, IndexedDB for images (`idb`), Firebase Firestore synchronization, and `@libraryos/shared` schemas
- **Rules of Engagement**: Zero breaking changes to existing endpoints or data signatures; all additions are optional and additive.

---

## 2. Proposal Feature Mapping Matrix

| Proposal Feature | Current Status | Files to Touch | Data Additions | Risk Level |
| :--- | :--- | :--- | :--- | :--- |
| **A1. Shared UI Infrastructure & Role Navigation** | Partial | `src/components/ui/*`, `StaffLayout.tsx`, `router.tsx` | Extended `Permission` & `UserRole` mapping | Low |
| **A2. Data Foundations & Snapshot Migrations** | Partial | `packages/shared/src/*`, `src/services/repositories/*` | Optional fields in `MemberProfile`, `AttendanceEntry`, `TimetableSlot`, `AuditLogEntry`, `LibrarySettings` | Low |
| **B1. Desk Operations: Fast Scan, Staged Queue, Renew, Thermal Print** | Partial | `CirculationDeskPage.tsx`, `CirculationRepository.ts`, `PrintService.ts`, `SoundService.ts` | `renewLoan()` method, thermal print templates (80mm/58mm) | Medium |
| **B2. Fines Ledger & Waiver Approvals** | Partial | `OverdueFinesPage.tsx`, `CirculationRepository.ts` | `LedgerEntry` type `FINE_WAIVED`, `PAYMENT_RECEIVED` | Low |
| **B3. Queue-based Reservations** | Missing | `src/features/circulation/ReservationsPage.tsx`, `router.tsx`, `CatalogManagementPage.tsx` | FIFO queue positioning, `readyAt`, `expiresAt` | Medium |
| **C1. Smart Entrance Kiosk & Attendance** | Missing | `src/features/kiosk/KioskPage.tsx`, `router.tsx`, `AttendanceRepository.ts` | `AttendanceEntry` model, business-day rollover, occupancy counter | Medium |
| **D1. Member Profiles, WebCam Capture & ID Cards** | Partial | `StaffMembersPage.tsx`, `PhotoStore.ts`, `PrintService.ts` | Photo capture (IndexedDB), CR80 duplex PDF, A4 8-up layout | Medium |
| **D2. Bulk Class Registration & Batch Exporter** | Missing | `src/features/members/BulkRegistrationPage.tsx`, `router.tsx` | Excel/CSV parser, ZIP photo matcher, atomic transaction rollback | High |
| **E1. Weekly Timetable & Live Scheduler** | Missing | `src/features/timetable/TimetablePage.tsx`, `router.tsx`, `ClockService.ts` | 5x8 period matrix, live clock highlighting | Medium |
| **E2. Staff Catalog & Inventory Barcode Sheets** | Partial | `CatalogManagementPage.tsx`, `ExportService.ts` | Accession number indexing, A4 multi-column barcode sheet PDF | Medium |
| **E3. Executive Dashboard & Audit Log Viewer** | Partial | `StaffDashboardPage.tsx`, `ShelfAuditSecurityPage.tsx`, `AuditLogService.ts` | Real loan aggregation chart, system audit log viewer | Low |
| **E4. White-Label Settings & Localization Pass** | Partial | `PolicySettingsPage.tsx`, `locales/en.json`, `locales/si.json` | Dynamic institution name, logo, custom theme CSS variables | Low |

---

## 3. Data Model Additions & Safe Migration Strategy

All data model modifications are **strictly optional and backward-compatible**:

1. **`MemberProfile` Additions**:
   ```typescript
   photoKey?: string;         // IndexedDB key or Firebase storage URL
   admissionNo?: string;      // School admission number
   grade?: string;            // e.g. "Grade 10"
   section?: string;          // e.g. "10-A"
   department?: string;       // Staff / Faculty department
   classId?: string;          // Unique class identifier
   gender?: 'MALE' | 'FEMALE' | 'OTHER';
   medium?: 'si' | 'ta' | 'en';
   ```

2. **New Entities**:
   - `AttendanceEntry`: `{ id, memberId, type: 'IN' | 'OUT', timestamp, branchId, method: 'SCAN' | 'MANUAL', operatorId, businessDay }`
   - `TimetableSlot`: `{ id, day: 'MON'..'FRI', periodId, className, teacher, note?, branchId }`
   - `TimetableConfig`: `{ periods: Period[], intervals: Interval[] }`
   - `AuditLogEntry`: `{ id, timestamp, actorId, actorName, actorRole, action, entityType, entityId, summary, metadata }`
   - `LibrarySettings`: `{ institutionName, logoUrl, primaryColor, showPoweredBy, occupancyCapacity, kioskReturnSeconds, maxFineLimit, receiptFooterText, soundEnabled, volume }`

### Safe Snapshotting & Local Migration Plan
- Before running any bulk migration, grade promotion, or bulk registration, an automatic snapshot is saved to `libraryos_snapshot_<timestamp>` in localStorage.
- If an operation fails mid-way, the snapshot is automatically restored, ensuring 100% data integrity with zero data loss.

---

## 4. Role-Based Access Control (RBAC) Plan

### Role Hierarchy
1. **SUPER_ADMIN**: Unrestricted system administration, settings, audits, staff management.
2. **HEAD_LIBRARIAN**: Circulation overrides, fine waivers, policy changes, book procurement.
3. **LIBRARIAN**: Desk checkouts, returns, cataloging, reservations, attendance kiosk.
4. **TEACHER**: Timetable viewing/reserving, class loans, catalog search.
5. **MEMBER**: Public OPAC, personal loans, personal holds, digital library.

### Backward-Compatible Demo Authentication
- The current local demo users (`admin@library.lk` with `SUPER_ADMIN`, and student members) will retain their current permissions without lock-out.
- New roles (`TEACHER`) and fine-grained permissions (`KIOSK_OPERATE`, `TIMETABLE_EDIT`, `FINES_WAIVE`, `MEMBERS_BULK_IMPORT`) are layered gracefully with fallback to `SUPER_ADMIN` / `LIBRARIAN`.

---

## 5. Wave-by-Wave Execution Plan

- **Wave A: Foundations** (Phase A1: Missing UI components & role navigation; Phase A2: Data models, audit service, snapshot service; Phase A3: Shared infrastructure: `SoundService`, `PrintService`, `PhotoStore`, `ClockService`, `useScanInput`).
- **Wave B: Desk Operations & Fines** (Phase B1: Fast 4s keyboard-first circulation desk with thermal receipts; Phase B2: Fines ledger, receipt printing & waiver dialogs; Phase B3: Queue-based reservations & hold pickup).
- **Wave C: Smart Entrance Kiosk & Attendance** (Phase C1: Fullscreen kiosk mode, wake lock, auto-reset, attendance logging, live occupancy meter).
- **Wave D: Member Services, Cards & Bulk Registration** (Phase D1: Member directory, webcam photo capture, CR80 & A4 duplex card printing, annual grade promotion; Phase D2: 4-step bulk registration wizard, ZIP photo matching, atomic rollback).
- **Wave E: Scheduler, Executive Dashboard, Settings & Localization** (Phase E1: 5x8 timetable grid with live period highlight; Phase E2: Staff catalog search & A4 barcode sheet export; Phase E3: Executive dashboard & audit log viewer; Phase E4: White-label branding & bilingual pass; Phase E5: Comprehensive QA & Report).
