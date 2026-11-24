# Security Documentation & Threat Model — LibraryOS

## 1. Overview and Security Principles

LibraryOS adheres strictly to:
1. **Deny-By-Default**: All Firestore and Storage paths default to `allow read, write: if false;`.
2. **Untrusted Client Boundary**: Clients cannot update roles, membership status, loan status, or financial balances directly.
3. **App Check & Rate Limiting**: All callable endpoints enforce reCAPTCHA Enterprise / App Check tokens.
4. **Patron Privacy**: Borrowing history is opt-in, encrypted, and subject to automatic retention pruning.
5. **Immutable Financial & Audit Ledgers**: Append-only collections; no document modifications or deletions permitted.

## 2. Threat Modeling (STRIDE-Lite)

| Threat Category | Potential Attack Vector | LibraryOS Mitigation |
| :--- | :--- | :--- |
| **Spoofing** | Forged patron QR codes or stolen barcodes | QR/Barcodes contain opaque identifiers only; circulation actions require authenticated staff terminal session. |
| **Tampering** | Modifying fine balances or deleting loan history | Firestore Security Rules reject client updates on `/fines` and `/loans`. Ledgers are append-only. |
| **Repudiation** | Staff denying having waived a fine or issued an item | Every state change generates an append-only `auditLogs` and `ledgerEntries` record with operator UID and timestamp. |
| **Information Disclosure** | Scraping member PII or patron borrowing habits | Member documents are strictly restricted to the member owner (`isOwner`) and authorized staff (`isStaff`). |
| **Denial of Service** | Flooding member registration or search queries | Rate limiting on Cloud Functions, cursor pagination, and de-duplication checks. |
| **Elevation of Privilege** | Patron tampering with Firebase custom claims | Custom claims (`role`, `branchIds`) are exclusively assigned via trusted Admin SDK Cloud Functions. |
