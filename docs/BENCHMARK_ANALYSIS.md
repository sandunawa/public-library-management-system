# Benchmark Analysis — International Public Library Systems & Modern Standards (2026)

## 1. Executive Summary

To achieve "international-standard" status, LibraryOS benchmarks against leading Integrated Library Systems (ILS), Library Services Platforms (LSP), and modern Discovery Layers:
- **Koha & Evergreen**: Open-source ILS standard-bearers, robust in circulation rules, cataloging, and offline circulation.
- **FOLIO & Ex Libris Alma**: Modular, API-first LSPs with multi-branch tenancy, fine-grained RBAC, electronic resource management (ERM), and standards compliance.
- **BiblioCommons & Aspen Discovery & Vega Discover**: Benchmark discovery layers with patron engagement, faceted browsing, catalog enrichment, "readers also borrowed", and modern accessibility.
- **Bibliotheca cloudLibrary & OverDrive/Libby**: Standards for digital asset checkout and hold shelf lockers.

## 2. Capabilities Mapping & Architecture Scope

| Capability / Benchmark Feature | Reference Systems | LibraryOS Module | Classification | Implementation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **API-First & Cloud-Native** | FOLIO, Alma | Architecture, M30 | Core | Pure TypeScript, modular Firebase Cloud Functions gen 2, callable endpoints + typed SDK. |
| **Unified Print & Digital Catalogue** | Vega Discover, Alma | M03, M20 | Core | Shared bibliographic records with multiple physical/digital item attachments and digital access leases. |
| **Faceted OPAC & Smart Discovery** | BiblioCommons, Aspen | M11, M26 | Core | Firestore prefix/token queries + normalized search index with adapter interface for Algolia/Typesense. Collaborative signals for recommendations. |
| **Self-Service Kiosk & Digital Card** | Bibliotheca, Aspen LiDA | M05, M28 | Core | Full-screen touch kiosk with session timer, Code 128 / QR digital member card, USB/camera scanner. |
| **Circulation Desk & Offline Mode** | Koha, Evergreen | M07, M31 | Core | Fast keyboard-first desk mode with sound/visual signals, IndexedDB local action queue with server idempotency. |
| **Fine-Grained RBAC & Branch Scoping** | FOLIO | M17, M18, M19 | Core | Firebase Auth custom claims, granular permission bits, Firestore branch security rules. |
| **Patron Privacy & Security** | Modern EU/ALA Standards | M01, M05, M22 | Core | Privacy-by-default, opt-in loan history, immutable ledger/audit logs, App Check, rate limiting. |
| **Events & Space/Asset Booking** | LibCal, Aspen | M23, M24 | Core | Full conflict-checked reservation engine with capacity controls and QR check-in. |
| **MARC21 / MARCXML / Dublin Core** | Koha, Alma | M03 | Core / Adapter | MARC21 parser & generator, CSV bulk mapping with rollback, OpenLibrary / Google Books lookup. |
| **SIP2 / RFID Hardware Adapter** | 3M SIP2 Standard | M07, M14, M28 | Adapter-only | Standardized SIP2 protocol parser and RFID wedge message specification interfaces. |
| **NCIP & Z39.50 / SRU** | ISO 2146 / ANSI Z39.50 | M30 | Adapter-only | Typed adapter contracts and mock provider harness for external inter-library loan / federated search. |
| **Payment Gateways (PayHere / Stripe)** | Commercial standards | M10 | Core / Adapter | Sandbox-first PayHere (Sri Lanka LKR) & Stripe adapter with webhook cryptographic verification. |
| **Multi-Language (Sinhala, Tamil, English)** | Sri Lankan National Standards | M13, M16 | Core | i18next across client, server notifications, and Unicode-correct PDF generation with embedded Noto fonts. |
| **WCAG 2.2 AA Accessibility** | EU Accessibility Act 2025 | UI/UX, M28 | Core | Radix primitives, focus management, high-contrast & dyslexia fonts, automated axe checks. |
