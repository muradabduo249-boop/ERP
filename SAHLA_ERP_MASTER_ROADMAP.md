# SAHLA ERP — MASTER DEVELOPMENT ROADMAP

## CURRENT PROJECT STATUS

- **Current Phase:** Phase 4 — Task Management & Event Notifications
- **Status:** Complete & Live-Verified
- **Verification Score:** 144/144 Automated Tests Passing (Phase 1: 27/27, Phase 2: 31/31, Phase 3: 38/38, Phase 4: 48/48)
- **Database Status:** Cloud SQL PostgreSQL fully connected, holding active production master data, task assignments, in-app notifications, and immutable audit logs.
- **Next Phase:** Phase 5 — International Procurement & Supplier Quoting (RFQ / PO)
- **Next Task:** Await user approval and instructions before starting Phase 5.

---

## MULTI-PHASE ROADMAP OVERVIEW

### Phase 1: Technical & Security Foundation (COMPLETE)
- [x] Cloud SQL PostgreSQL provisioning & connection pooling (`src/db/index.ts`)
- [x] Drizzle ORM schema, entities, indexes, and relations (`src/db/schema.ts`)
- [x] Server-side session authentication with bcrypt hashing (`src/server/services/authService.ts`)
- [x] Server-side RBAC (Users, Departments, Roles, Granular Permissions)
- [x] Concurrency-safe atomic business sequence generator (`SequenceService.ts`)
- [x] Append-only audit logging with database immutability trigger
- [x] Security middleware, rate limiting, and centralized error handling
- [x] Express backend health endpoint (`/api/health`) verified online
- [x] Phase 1 automated test suite (27/27 Passed)

### Phase 2: Master Data Foundation (COMPLETE)
- [x] Customer Master (PostgreSQL source of truth, `SH-C-` code, duplicate prevention, search, filter, pagination, soft-archive)
- [x] Supplier Master (PostgreSQL source of truth, `SH-SUP-` code, 200+ vendor scalability, China WeChat channels, banking details)
- [x] Multi-Contact System (`SH-CON-` code, unlimited contacts per entity, transactional primary contact switching)
- [x] Party Documents relationship foundation (KYC, business licenses, commercial registers)
- [x] Granular RBAC permissions for master data
- [x] Scalable batch import API for 200+ suppliers
- [x] Export to CSV/Excel functionality
- [x] Phase 2 automated test suite (31/31 Passed)

### Phase 3: Central Request Core & Workflow Engine (COMPLETE)
- [x] Central Request backbone (`requests`, `request_timeline`, `request_assignments` tables)
- [x] Concurrency-safe sequence generation (`REQ-2026-XXXXXX`)
- [x] Strict business-rule state machine (new → assigned → ready_for_processing → in_progress → on_hold → completed / cancelled)
- [x] Separation of operational status from managerial `approval_status`
- [x] Department handover protocols and timeline event logging
- [x] Request assignment and priority flags
- [x] Server-side REST APIs with RBAC and validation (`/api/requests`)
- [x] Drizzle migrations committed (`0000_sleepy_eternals.sql`, `0001_dapper_pandemic.sql`)
- [x] UI integration: `RequestBackboneView.tsx` with resilient dual-mode architecture
- [x] Phase 3 automated test suite (38/38 Passed)

### Phase 4: Task Management & Event Notifications (COMPLETE)
- [x] Task management engine extending `request_assignments` (`TaskService.ts`)
- [x] Global task listing API (`GET /api/tasks`) with multi-column filtering
- [x] "My Tasks" queue (`GET /api/tasks/my-tasks`) with strict user isolation
- [x] Department task queues (`GET /api/tasks/department`) for authorized teams
- [x] Due dates and dynamic overdue calculation engine (`isOverdue`)
- [x] Task lifecycle transitions (`pending` → `in_progress` → `completed` → `reopened`) with completion timestamps
- [x] Task reassignment API (`PATCH /api/tasks/:id/assign`) with active user checks
- [x] Timeline and immutable audit logging for all task operations
- [x] Authoritative in-app notifications engine (`notifications` table & `NotificationService.ts`)
- [x] Automated event notification triggers (task assignment, reassignment, request assignment, status transitions, approvals, completions)
- [x] Proactive deadline scanner (`POST /api/tasks/check-deadlines`) dispatching alert notifications
- [x] In-app notification feed (`GET /api/notifications`) with strict recipient isolation and unread badge API
- [x] Read/unread state management (`PATCH /api/notifications/:id/read`, `POST /api/notifications/mark-all-read`)
- [x] UI Modules: `TasksManagementView.tsx` workspace & `ErpNotificationBell.tsx` interactive dropdown
- [x] Phase 4 automated test suite (48/48 Passed)

### Phase 5: Procurement & Supplier Execution (NEXT)
- [ ] Quotation requests (RFQ) sent to registered suppliers
- [ ] Supplier quotation comparisons (Comparison Sheets)
- [ ] Purchase Order (PO) lifecycle (`PO-2026-XXXX`) with approval matrix
- [ ] Factory inspection and cargo verification records
- [ ] Phase 5 verification tests

### Phase 6: Finance, Treasury & Cash Reconciliation
- [ ] Customer payment receipts (`REC-2026-XXXX`)
- [ ] Bankak (Sudan), Dubai Account (AED), and USD Wire transfer reconciliations
- [ ] Supplier payments & disbursements (`PAY-2026-XXXX`)
- [ ] Customer invoicing and profitability calculation
- [ ] Phase 6 verification tests

### Phase 7: Operations, Customs & Shipping
- [ ] Ocean freight container tracking (LCL / FCL)
- [ ] Port Sudan South Port & Khartoum Airport customs declaration records
- [ ] Trucking and Proof of Delivery (POD) signatures
- [ ] Customer public tracking portal integration
- [ ] Phase 7 verification tests

### Phase 8: Automation, AI & Document Processing
- [ ] Document OCR for commercial invoices & packing lists
- [ ] AI-powered supplier quote comparison summaries
- [ ] Automated shipping ETA milestone calculators

### Phase 9: Executive Analytics & Business Intelligence
- [ ] Executive KPI dashboards
- [ ] Profitability analytics by route, customer, and department
- [ ] SLA and bottleneck reporting
