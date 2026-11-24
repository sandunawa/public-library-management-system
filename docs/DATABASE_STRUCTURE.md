# Database Structure & Access Patterns — LibraryOS

## 1. Collections Hierarchy

| Collection | Path | Description | Access Pattern |
| :--- | :--- | :--- | :--- |
| **librarySettings** | `/librarySettings/{id}` | Global library configuration, branding, and registration modes | Read: Public; Write: Super Admin |
| **branches** | `/branches/{branchId}` | Library branches, opening hours, coordinates | Read: Public; Write: Staff |
| **books** | `/books/{bookId}` | Bibliographic title records | Read: Public; Write: Staff |
| **bookCopies** | `/bookCopies/{copyId}` | Physical and digital item copies, barcodes, statuses | Read: Public; Write: Staff |
| **members** | `/members/{memberId}` | Member profiles, card IDs, membership status | Read: Owner + Staff; Write: Functions |
| **registrationRequests** | `/registrationRequests/{reqId}`| Pending self-registration queue for staff approval | Read: Staff; Write: Functions |
| **loans** | `/loans/{loanId}` | Active and past borrowing records | Read: Patron + Staff; Write: Functions |
| **reservations** | `/reservations/{resId}` | Hold queue requests and allocations | Read: Patron + Staff; Write: Functions |
| **fines** | `/fines/{fineId}` | Outstanding and settled fines | Read: Patron + Staff; Write: Functions |
| **ledgerEntries** | `/ledgerEntries/{entryId}` | Immutable financial event journal | Read: Staff; Write: Functions (Append-only) |
| **auditLogs** | `/auditLogs/{logId}` | Tamper-evident operational audit logs | Read: Auditor + Super Admin; Write: Functions |
| **loanPolicies** | `/loanPolicies/{policyId}` | Configurable loan durations, renewal limits, fines | Read: Staff; Write: Super Admin |
