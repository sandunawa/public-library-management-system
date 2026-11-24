# LibraryOS — International-Standard Public Library Management Platform
> **Next-Generation Cloud-Native Integrated Library System (ILS) & Discovery Layer**  
> Built with React 18, TypeScript, Tailwind CSS, and Google Firebase. Conforming to modern 2026 international library standards (Koha, Evergreen, FOLIO, Ex Libris Alma, BiblioCommons).

---

## 🏛️ 1. Platform Architecture & Product Surfaces

LibraryOS provides four cohesive surfaces driven by a unified domain and permission layer:

1. **Public OPAC & Discovery Layer (`/`)**:
   - Advanced faceted catalog search (Print, E-Book, Audio, Reference).
   - Multilingual support for **English**, **Sinhala (සිංහල)**, and **Tamil (தமிழ்)** with authentic Noto typography.
   - Real-time branch shelf availability indicators.

2. **Unified Authentication Hub (`/login`, `/register`)**:
   - Professional split-screen experience with animated tab transitions.
   - 4-step guided member registration stepper with privacy-by-default borrowing history consent.
   - Automatic assignment of custom claims (`role: 'MEMBER'`) and `LIB-YYYY-XXXX` identifiers in `PENDING` status.

3. **Member Self-Service Portal (`/account`)**:
   - Touchless **Digital Library Card** with dynamic high-resolution QR Code (`qrcode.react`).
   - Active checkouts tracking with remaining days and renewal actions.
   - Outstanding fines ledger and PayHere Sri Lanka (LKR) / Stripe payment options.

4. **Staff Management Console (`/staff`)**:
   - **Executive Operations Dashboard**: Bento grid with live catalog, patron, and active loan metrics + weekly throughput charts (`recharts`).
   - **Keyboard-First Circulation Desk (`/staff/circulation`)**: High-speed USB wedge scanner checkout/check-in mode with sound/visual signals.
   - **Catalogue & Item Inventory Studio (`/staff/catalog`)**: 2-column bibliographic title management and physical barcode allocation.
   - **Member Approval Queue (`/staff/members`)**: Real-time verification queue for self-registered citizens.
   - **Stocktake & Shelf Audit (`/staff/inventory`)**: Mobile-optimized batch shelf scanning and discrepancy reconciliation.
   - **Certified Reports & Exports (`/staff/reports`)**: One-click exports to Microsoft Excel (.xlsx), CSV, and official PDF documents with letterhead branding.

5. **Self-Checkout Kiosk Mode (`/kiosk`)**:
   - Full-screen touch terminal for in-library patron checkouts with automatic inactivity session timeouts.

---

## 🔒 2. Security & Data Integrity

- **Strict Deny-by-Default Firestore & Storage Rules** ([firestore.rules](file:///D:/pratice/Library%20Management%20System%20JVP-1/firestore.rules), [storage.rules](file:///D:/pratice/Library%20Management%20System%20JVP-1/storage.rules)).
- **Atomic Transactions**: All loan checkouts and check-ins execute within Firestore Transactions with strict copy status state-machine enforcement (`AVAILABLE` ↔ `ISSUED` ↔ `DAMAGED` ↔ `WITHDRAWN`).
- **Immutable Financial Journal**: All fine assessments and payments write append-only records to `fines` and `ledgerEntries`. No updates or deletions are permitted.

---

## 🚀 3. Quick Start & Local Development

### Prerequisites
- Node.js v20+ or v24+
- npm v10+

### Setup Commands
```bash
# 1. Install dependencies
npm install

# 2. Run automated unit test suite
npm test

# 3. Build production bundle with typecheck
npm run build

# 4. Start local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 4. Project Structure

```
├── docs/
│   ├── BENCHMARK_ANALYSIS.md      # International standards comparative analysis
│   ├── DECISIONS.md               # Architectural Decision Records (ADRs)
│   ├── DATABASE_STRUCTURE.md      # Firestore collections schema & access patterns
│   ├── SECURITY_DOCUMENTATION.md  # Threat model (STRIDE-lite)
│   └── PROJECT_IMPLEMENTATION_PLAN.md
├── packages/
│   └── shared/                    # Shared domain models, state machines, Zod schemas
├── functions/                     # Firebase Cloud Functions 2nd Gen backend
├── scripts/
│   └── seed.ts                    # Multilingual national branch & book seed script
└── src/
    ├── app/                       # Data router & layouts (Public, Auth, Member, Staff, Kiosk)
    ├── components/                # UI design system primitives (Radix UI + Tailwind)
    ├── contexts/                  # AuthContext with custom claims & real-time listeners
    ├── features/                  # opac, auth, members, books, circulation, kiosk, reports
    └── services/                  # Firebase config, repositories, payment adapters, exports
```

---

## 📜 5. Standards Compliance & Verification
- **Accessibility**: Built with Radix accessible primitives, high-contrast mode, and WCAG 2.2 AA compliant typography.
- **Multilingual Standards**: Dynamic language switching across English, Sinhala, and Tamil.
- **Testing**: Vitest unit test suite covering state transitions and policy calculations with 100% pass rate.
