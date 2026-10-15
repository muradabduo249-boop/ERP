# START HERE — INSTRUCTIONS FOR INCOMING AI ENGINEER

Welcome to the **SAHLA ERP** development workspace.  
You are continuing work on an enterprise-grade ERP system tailored for international supply chains, global procurement (China, UAE, Sudan), logistics, customs clearance, and treasury management.

---

## 1. FIRST PRINCIPLES (NEVER VIOLATE)

1. **ONE INTEGRATED ERP (NOT MINI-PROJECTS)**:
   - The central concept is **REQUEST = THE BACKBONE OF THE ERP**.
   - One unified Request record (`REQ-2026-XXXXXX`) tracks the customer journey across Customer Service, CRM, Procurement, Quotations, Approvals, Finance, Operations, Customs, Shipping, and Local Delivery.
   - Do NOT duplicate request records across separate departments.
2. **DATABASE INTEGRITY**:
   - PostgreSQL + Drizzle ORM is the authoritative system of record.
   - Do NOT reset, recreate, drop, truncate, or overwrite the PostgreSQL database.
   - Do NOT replace PostgreSQL with Firebase, localStorage, or any other datastore.
3. **PRESERVE WORKING FOUNDATIONS**:
   - Phase 1 (Auth, RBAC, Sessions, Sequences, Audit Immutability) is active and verified (27/27 tests).
   - Phase 2 (Customer & Supplier Master Data, Multi-Contact, Party Documents) is active and verified (31/31 tests).
   - Phase 3 (Central Request Core, Timeline, State Machine, Assignments) is active and verified (38/38 tests).
   - Phase 4 (Task Management, Queues, Overdue Engine, In-App Notifications) is active and verified (48/48 tests).
   - Total automated tests: **144/144 PASSING**.
   - `erpEngine.ts` is preserved as a dual-mode offline fallback for client-side state. Do NOT delete it.
4. **NO UNSOLICITED AI**:
   - Unless explicitly requested by the user, do not add chatbots, assistant panels, or unsolicited LLM calls.

---

## 2. PROJECT RECONCILIATION STATUS

- **Current Phase**: **Phase 4 — Task Management & Event Notifications**
- **Status**: **Complete & Live-Verified (144/144 tests passing against Cloud SQL)**
- **TypeScript**: 0 errors (`npm run lint` / `tsc --noEmit` passes).
- **Production Build**: Clean production bundle created (`npm run build` passes in <1s).
- **Express Backend**: Running on port 3000 with `/api/health` returning HTTP 200 OK.
- **Database Status**: Cloud SQL PostgreSQL is connected, active, and holding production records, 234 suppliers, 13 customers, central requests, timeline events, task assignments (`request_assignments`), in-app notifications (`notifications`), and 640+ immutable audit logs.

---

## 3. VERIFICATION COMMANDS

Run these commands immediately to confirm your environment is 100% operational:

```bash
# 1. Run all automated live tests (Phase 1 + Phase 2 + Phase 3 + Phase 4)
npm test

# 2. Verify TypeScript static types
npm run lint

# 3. Verify production compilation
npm run build

# 4. Check API health
curl -s http://localhost:3000/api/health
```

---

## 4. NEXT STEP

- **Phase 5 — International Procurement & Supplier Quoting (RFQ / PO)**:
  - RFQ generation and multi-supplier price comparison.
  - Commercial purchase orders (`PO-2026-XXXXXX`) with multi-currency tracking (USD, CNY, SDG, AED).
  - Await user approval and design review before starting Phase 5.
