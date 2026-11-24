# Architectural Decision Records (ADR) — LibraryOS

## ADR-001: Monorepo Structure with Shared Domain Package
- **Status**: Accepted
- **Context**: Code sharing is required between Vite React frontend, Cloud Functions backend, and administrative CLI scripts to avoid schema drift.
- **Decision**: Use `npm workspaces` structure:
  - `packages/shared`: Domain types, Zod schemas, policy calculations, permission matrix.
  - `functions`: Cloud Functions 2nd Gen (TypeScript).
  - Root: Vite + React 18 + Tailwind CSS frontend application.
- **Consequences**: Zero schema divergence, single source of truth for business logic.

## ADR-002: Backend and Database — Firebase Native
- **Status**: Accepted
- **Context**: Modern serverless infrastructure required without external relational databases.
- **Decision**: Firestore modular SDK v9+, Cloud Functions gen 2, Storage, App Check.
- **Consequences**: Fast real-time sync, horizontal scalability, strict Firestore Security Rules.

## ADR-003: Immutable Financial and Audit Ledgers
- **Status**: Accepted
- **Context**: Financial integrity and tamper-evident audit trails are mission-critical.
- **Decision**: `ledgerEntries` and `auditLogs` are append-only. No updates or deletes allowed in Security Rules. Corrective actions issue new compensating entries.
- **Consequences**: Complete auditability, tamper resilience, compliance with public sector standards.

## ADR-004: Sinhala and Tamil Complex Script Rendering in PDFs
- **Status**: Accepted
- **Context**: Standard jsPDF does not shape Brahmic complex scripts (Sinhala and Tamil vowels/conjuncts) accurately out of the box with standard Type1/basic TTF embedding.
- **Decision**: Utilize embedded Noto Sans Sinhala & Tamil Unicode fonts with canvas-assisted glyph rendering where necessary (`html2canvas` / rasterized vector canvas) to guarantee 100% correct typography on member cards, receipts, and reports.
- **Consequences**: Perfect visual rendering for all Sri Lankan national languages.
