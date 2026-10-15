# SAHLA ERP — AI HANDOVER SPECIFICATION

**Target Audience:** Succeeding AI Engineers and Engineering Team  
**Handover Date:** October 2026  
**System Name:** SAHLA Standalone ERP (نظام سهلا لإدارة سلاسل الإمداد والتجارة الدولية)  
**Handover Status:** Verified Phase 4 Task Management & Event Notifications Checkpoint (144/144 Tests Passing)  

---

## 1. PROJECT ARCHITECTURE

SAHLA ERP is built as an enterprise-grade full-stack system on PostgreSQL, Drizzle ORM, Express backend, and a Vite React frontend.

```
┌─────────────────────────────────────────────────────────────┐
│                    React SPA (Vite / RTL)                   │
│   ErpLayout ── ErpSidebar ── RequestBackbone ── TaskMgmt    │
│   ErpNotificationBell ── MasterData (Customers/Suppliers)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON / HTTP Bearer Session
┌──────────────────────────────▼──────────────────────────────┐
│                    Express Backend API                      │
│   Security Headers │ Rate Limiter │ Session Auth │ RBAC     │
└──────────────────────────────┬──────────────────────────────┘
                               │ TypeScript Service Layer
┌──────────────────────────────▼──────────────────────────────┐
│   TaskService     │ NotificationService │ RequestService    │
│   CustomerService │ SupplierService     │ SequenceService   │
│   AuditService    │ ContactService      │ DocumentService   │
│   AuthService     │                     │                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Drizzle ORM Type-Safe Queries
┌──────────────────────────────▼──────────────────────────────┐
│            PostgreSQL Database (Cloud SQL)                  │
│   16 Relational Tables │ Immutable Triggers │ Indexes       │
└─────────────────────────────────────────────────────────────┘
```

- **Runtime Mode**: Full-stack dev & prod running via `server.ts` (`tsx server.ts`). Express handles `/api/*` and proxies Vite middlewares during development.
- **Port**: 3000.
- **Database**: PostgreSQL Developer Edition managed via Cloud SQL.
- **ORM**: Drizzle ORM (`drizzle-orm` + `drizzle-kit`).
- **Authentication**: Stateful session tokens stored in `auth_sessions` with bcrypt password hashing (`bcryptjs`).
- **Authorization**: Multi-role and granular permission matrix enforced server-side via `requirePermission(...)` and `requireRole(...)`.

---

## 2. CURRENT RECONCILED PHASE
**Phase 4 — Task Management & Event Notifications**

---

## 3. COMPLETED PHASES
- **Phase 1 — Technical & Security Foundation**: Complete & Live-Verified (27/27 tests).
- **Phase 2 — Master Data Foundation**: Complete & Live-Verified (31/31 tests).
- **Phase 3 — Request Core / Backbone**: Complete & Live-Verified (38/38 tests).
- **Phase 4 — Task Management & Event Notifications**: Complete & Live-Verified (48/48 tests).
- **Total Tests Passing**: **144/144 (0 Failures)**.

---

## 4. VERIFICATION EVIDENCE SUMMARY
1. **Automated Live DB Tests**: All 144 tests run against active Cloud SQL PostgreSQL pass with 0 failures (`npm test`).
   - Phase 1: 27/27 PASS
   - Phase 2: 31/31 PASS
   - Phase 3: 38/38 PASS
   - Phase 4: 48/48 PASS
2. **TypeScript Static Analysis**: `npm run lint` (`tsc --noEmit`) passes with 0 errors.
3. **Production Build**: `npm run build` completes in <1s with 0 errors.
4. **Applet Compilation**: `compile_applet` succeeds cleanly.
5. **Backend Health Check**: `GET /api/health` returns HTTP 200 OK with security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`).
6. **Live Data Integrity**: Existing Cloud SQL instance holds 19 users, 6 departments, 7 roles, 36 permissions, 13 customers, 234 suppliers, 27 contacts, 13 party documents, central requests, timeline events, task assignments (`request_assignments`), event notifications (`notifications`), and immutable audit logs (`audit_logs`).

---

## 5. DUAL-MODE RESILIENCE (LEGACY CODE & erpEngine.ts)
- `erpEngine.ts` is preserved in `src/erp/engine/erpEngine.ts` (2,375 lines) and has NOT been deleted or refactored.
- The UI layer communicates with the PostgreSQL REST API as the authoritative source, and seamlessly falls back to `erpEngine` in offline development sessions.

---

## 6. NEXT EXACT TASK
**Phase 5 — International Procurement & Supplier Quoting (RFQ / PO)**
- RFQ generation and multi-supplier price comparison.
- Commercial purchase orders (`PO-2026-XXXXXX`) with multi-currency tracking (USD, CNY, SDG, AED).
- Await user review and instructions before starting Phase 5.
