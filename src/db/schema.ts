import { pgTable, text, varchar, integer, boolean, timestamp, uuid, jsonb, primaryKey, index, uniqueIndex, numeric } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// =========================================================================
// 1. DEPARTMENTS TABLE
// =========================================================================
export const departments = pgTable('departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  descriptionAr: text('description_ar'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// =========================================================================
// 2. ROLES TABLE
// =========================================================================
export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  descriptionAr: text('description_ar'),
  isSystem: boolean('is_system').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// =========================================================================
// 3. PERMISSIONS TABLE
// =========================================================================
export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 80 }).notNull().unique(),
  nameAr: text('name_ar').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  descriptionAr: text('description_ar'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// =========================================================================
// 4. ROLE_PERMISSIONS JOIN TABLE
// =========================================================================
export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionCode: varchar('permission_code', { length: 80 }).notNull().references(() => permissions.code, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionCode] }),
}));

// =========================================================================
// 5. USERS TABLE
// =========================================================================
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 120 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  phone: varchar('phone', { length: 30 }),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 20 }).default('active').notNull(), // active, inactive, suspended
  failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  firebaseUid: text('firebase_uid').unique(),
  allowedModules: jsonb('allowed_modules').$type<string[]>().default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('users_department_id_idx').on(table.departmentId),
  index('users_role_id_idx').on(table.roleId),
  index('users_status_idx').on(table.status),
]);

// =========================================================================
// 6. AUTH SESSIONS TABLE
// =========================================================================
export const authSessions = pgTable('auth_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('auth_sessions_user_id_idx').on(table.userId),
  index('auth_sessions_token_idx').on(table.token),
  index('auth_sessions_expires_at_idx').on(table.expiresAt),
]);

// =========================================================================
// 7. BUSINESS SEQUENCES TABLE (Concurrency-Safe Row-Level Locked)
// =========================================================================
export const businessSequences = pgTable('business_sequences', {
  id: uuid('id').defaultRandom().primaryKey(),
  sequenceKey: varchar('sequence_key', { length: 50 }).notNull().unique(),
  prefix: varchar('prefix', { length: 20 }).notNull(),
  currentValue: integer('current_value').default(1000).notNull(),
  padding: integer('padding').default(4).notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// =========================================================================
// 8. AUDIT LOGS TABLE (Server-Side Append-Only)
// =========================================================================
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  auditCode: varchar('audit_code', { length: 40 }).notNull().unique(),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  actorName: text('actor_name').notNull(),
  actorRole: varchar('actor_role', { length: 50 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: text('entity_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  beforeState: jsonb('before_state'),
  afterState: jsonb('after_state'),
  notes: text('notes'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('audit_logs_timestamp_idx').on(table.timestamp),
  index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  index('audit_logs_actor_id_idx').on(table.actorId),
]);

// =========================================================================
// 9. CUSTOMERS TABLE (Authoritative Master Data Foundation)
// =========================================================================
export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerCode: varchar('customer_code', { length: 50 }).notNull().unique(), // e.g. SH-C-1001
  companyName: text('company_name').notNull(),
  tradeName: text('trade_name'),
  customerType: varchar('customer_type', { length: 50 }).default('commercial').notNull(), // commercial, industrial, startup, individual, government
  status: varchar('status', { length: 30 }).default('active').notNull(), // active, lead, suspended, blacklisted, inactive
  primaryPhone: varchar('phone', { length: 40 }).notNull(),
  secondaryPhone: varchar('secondary_phone', { length: 40 }),
  whatsapp: varchar('whatsapp', { length: 40 }),
  email: varchar('email', { length: 120 }),
  website: text('website'),
  taxNumber: varchar('tax_number', { length: 60 }),
  commercialRegister: varchar('commercial_register', { length: 60 }),
  nationalIdOrPassport: varchar('national_id_or_passport', { length: 60 }),
  country: varchar('country', { length: 80 }).default('السودان').notNull(),
  city: varchar('city', { length: 80 }).default('بورتسودان').notNull(),
  address: text('address'),
  deliveryAddress: text('delivery_address'),
  paymentTerms: text('payment_terms'),
  creditLimit: integer('credit_limit').default(0),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  assignedSalesRepId: uuid('assigned_sales_rep_id').references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('customers_code_idx').on(table.customerCode),
  index('customers_company_name_idx').on(table.companyName),
  index('customers_phone_idx').on(table.primaryPhone),
  index('customers_status_idx').on(table.status),
  index('customers_type_idx').on(table.customerType),
  index('customers_city_idx').on(table.city),
  index('customers_sales_rep_idx').on(table.assignedSalesRepId),
  index('customers_created_at_idx').on(table.createdAt),
]);

// =========================================================================
// 10. SUPPLIERS TABLE (Scalable for 200+ and Thousands of Global Vendors)
// =========================================================================
export const suppliers = pgTable('suppliers', {
  id: uuid('id').defaultRandom().primaryKey(),
  supplierCode: varchar('supplier_code', { length: 50 }).notNull().unique(), // e.g. SH-SUP-1001
  name: text('name').notNull(), // Company / Factory Name
  tradeNameEn: text('trade_name_en'), // English / International Name
  supplierType: varchar('supplier_type', { length: 50 }).default('manufacturer').notNull(), // manufacturer, trading_company, shipping_line, customs_broker, inland_transporter, warehouse, inspection_agency, packaging, other
  status: varchar('status', { length: 30 }).default('active').notNull(), // active, pending_approval, verified, suspended, blacklisted, inactive
  country: varchar('country', { length: 80 }).default('الصين').notNull(),
  city: varchar('city', { length: 80 }).notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 40 }).notNull(),
  secondaryPhone: varchar('secondary_phone', { length: 40 }),
  whatsapp: varchar('whatsapp', { length: 40 }),
  wechat: varchar('wechat', { length: 60 }), // WeChat ID (China procurement crucial)
  email: varchar('email', { length: 120 }),
  website: text('website'),
  taxNumber: varchar('tax_number', { length: 60 }),
  businessLicense: varchar('business_license', { length: 80 }), // CR or Chinese Social Credit Code
  categories: jsonb('categories').$type<string[]>().default([]).notNull(),
  paymentTerms: text('payment_terms'),
  defaultCurrency: varchar('default_currency', { length: 10 }).default('USD').notNull(), // USD, CNY, AED, SDG
  bankName: text('bank_name'),
  bankAccountName: text('bank_account_name'),
  bankAccountNumber: text('bank_account_number'),
  bankIbanSwift: text('bank_iban_swift'),
  bankBranch: text('bank_branch'),
  rating: integer('rating').default(5).notNull(), // 1 - 5
  tier: varchar('tier', { length: 10 }).default('B').notNull(), // A, B, C, D
  leadTimeDays: integer('lead_time_days').default(15),
  notes: text('notes'),
  complianceNotes: text('compliance_notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('suppliers_code_idx').on(table.supplierCode),
  index('suppliers_name_idx').on(table.name),
  index('suppliers_type_idx').on(table.supplierType),
  index('suppliers_country_idx').on(table.country),
  index('suppliers_city_idx').on(table.city),
  index('suppliers_phone_idx').on(table.phone),
  index('suppliers_wechat_idx').on(table.wechat),
  index('suppliers_status_idx').on(table.status),
  index('suppliers_rating_idx').on(table.rating),
  index('suppliers_tier_idx').on(table.tier),
  index('suppliers_created_at_idx').on(table.createdAt),
]);

// =========================================================================
// 11. CONTACTS TABLE (Multiple Contacts per Customer / Supplier)
// =========================================================================
export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  contactCode: varchar('contact_code', { length: 50 }),
  entityType: varchar('entity_type', { length: 20 }).notNull(), // 'customer' | 'supplier'
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  nameEn: text('name_en'),
  jobTitle: text('job_title'), // e.g. 'مدير المبيعات والتصدير', 'المسؤول المالي', 'مدير المصنع'
  department: varchar('department', { length: 60 }), // 'sales', 'procurement', 'logistics', 'accounting', 'management', 'factory'
  phone: varchar('phone', { length: 40 }).notNull(),
  mobile: varchar('mobile', { length: 40 }),
  whatsapp: varchar('whatsapp', { length: 40 }),
  wechat: varchar('wechat', { length: 60 }),
  email: varchar('email', { length: 120 }),
  isPrimary: boolean('is_primary').default(false).notNull(),
  active: boolean('active').default(true).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('contacts_entity_idx').on(table.entityType, table.customerId, table.supplierId),
  index('contacts_customer_id_idx').on(table.customerId),
  index('contacts_supplier_id_idx').on(table.supplierId),
  index('contacts_phone_idx').on(table.phone),
  index('contacts_is_primary_idx').on(table.isPrimary),
]);

// =========================================================================
// 12. PARTY DOCUMENTS TABLE (KYC, Licenses, Contracts, Certifications, Universal Attachments)
// =========================================================================
export const partyDocuments = pgTable('party_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: varchar('entity_type', { length: 30 }).notNull(), // 'customer' | 'supplier' | 'request'
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'cascade' }),
  requestId: uuid('request_id'), // Linked to request when entityType = 'request'
  title: text('title').notNull(),
  documentType: varchar('document_type', { length: 50 }).notNull(), // 'commercial_register', 'tax_certificate', 'business_license', 'commercial_invoice', 'packing_list', 'bill_of_lading', 'contract', 'other'
  documentNumber: varchar('document_number', { length: 80 }),
  expiryDate: timestamp('expiry_date', { withTimezone: true }),
  fileUrl: text('file_url'),
  fileName: text('file_name'),
  fileSize: integer('file_size'),
  uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('party_docs_entity_idx').on(table.entityType, table.customerId, table.supplierId),
  index('party_docs_customer_idx').on(table.customerId),
  index('party_docs_supplier_idx').on(table.supplierId),
  index('party_docs_request_idx').on(table.requestId),
  index('party_docs_type_idx').on(table.documentType),
]);

// =========================================================================
// 13. REQUESTS MASTER TABLE (The Central Operational Backbone of SAHLA ERP)
// =========================================================================
export const requests = pgTable('requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestCode: varchar('request_code', { length: 50 }).notNull().unique(), // e.g. REQ-2026-000101 (from SequenceService)
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'restrict' }).notNull(),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
  requestType: varchar('request_type', { length: 60 }).notNull(), // 'PURCHASE_AND_SHIP', 'SHIPPING_ONLY', 'PURCHASE_ONLY', 'CUSTOMS_CLEARANCE', 'INSPECTION_VERIFICATION', 'CONSULTING_LOGISTICS'
  title: text('title').notNull(),
  priority: varchar('priority', { length: 20 }).default('normal').notNull(), // 'low', 'normal', 'high', 'urgent'
  status: varchar('status', { length: 40 }).default('new').notNull(), // 'new', 'assigned', 'ready_for_processing', 'in_progress', 'on_hold', 'completed', 'cancelled'
  approvalStatus: varchar('approval_status', { length: 40 }).default('none').notNull(), // 'none', 'pending_approval', 'approved', 'rejected', 'changes_requested'
  assignedUserId: uuid('assigned_user_id').references(() => users.id, { onDelete: 'set null' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  readyForProcessingAt: timestamp('ready_for_processing_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  originCountry: varchar('country_origin', { length: 80 }).default('الصين').notNull(),
  destinationCountry: varchar('country_destination', { length: 80 }).default('السودان').notNull(),
  destinationCity: varchar('city_destination', { length: 80 }).default('بورتسودان').notNull(),
  estimatedBudget: integer('estimated_budget').default(0),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  metadata: jsonb('metadata'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('requests_code_idx').on(table.requestCode),
  index('requests_customer_idx').on(table.customerId),
  index('requests_dept_idx').on(table.departmentId),
  index('requests_status_idx').on(table.status),
  index('requests_approval_idx').on(table.approvalStatus),
  index('requests_priority_idx').on(table.priority),
  index('requests_type_idx').on(table.requestType),
  index('requests_assigned_idx').on(table.assignedUserId),
  index('requests_created_at_idx').on(table.createdAt),
]);

// =========================================================================
// 14. REQUEST TIMELINE (Append-Only Event & Lifecycle State Machine Ledger)
// =========================================================================
export const requestTimeline = pgTable('request_timeline', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id').references(() => requests.id, { onDelete: 'cascade' }).notNull(),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  actorName: text('actor_name').notNull(),
  actorRole: varchar('actor_role', { length: 50 }).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'created', 'assigned', 'reassigned', 'status_changed', 'ready_for_processing', 'started', 'on_hold', 'resumed', 'completed', 'cancelled', 'approval_requested', 'approved', 'rejected', 'changes_requested', 'note_added', 'attachment_added', 'task_created', 'task_completed'
  fromStatus: varchar('from_status', { length: 40 }),
  toStatus: varchar('to_status', { length: 40 }),
  fromUserId: uuid('from_user_id').references(() => users.id, { onDelete: 'set null' }),
  toUserId: uuid('to_user_id').references(() => users.id, { onDelete: 'set null' }),
  decision: varchar('decision', { length: 40 }), // 'approved', 'rejected', 'changes_requested'
  notes: text('notes'),
  metadata: jsonb('metadata'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('request_timeline_req_idx').on(table.requestId),
  index('request_timeline_actor_idx').on(table.actorId),
  index('request_timeline_event_idx').on(table.eventType),
  index('request_timeline_timestamp_idx').on(table.timestamp),
]);

// =========================================================================
// 15. REQUEST ASSIGNMENTS / TASKS (Department & Multi-Employee Task Engine)
// =========================================================================
export const requestAssignments = pgTable('request_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id').references(() => requests.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
  assignedUserId: uuid('assigned_user_id').references(() => users.id, { onDelete: 'set null' }),
  assignedByUserId: uuid('assigned_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 30 }).default('pending').notNull(), // 'pending', 'in_progress', 'completed', 'cancelled'
  priority: varchar('priority', { length: 20 }).default('normal').notNull(), // 'low', 'normal', 'high', 'urgent'
  dueDate: timestamp('due_date', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('req_assignments_req_idx').on(table.requestId),
  index('req_assignments_user_idx').on(table.assignedUserId),
  index('req_assignments_dept_idx').on(table.departmentId),
  index('req_assignments_status_idx').on(table.status),
]);

// =========================================================================
// 16. NOTIFICATIONS TABLE (In-App Event & Alert Inbox for Employees)
// =========================================================================
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 40 }).notNull(), // 'assignment', 'status_change', 'approval', 'task_deadline', 'system'
  entityType: varchar('entity_type', { length: 40 }).notNull(), // 'request', 'task'
  entityId: text('entity_id').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('notifications_user_idx').on(table.userId),
  index('notifications_user_unread_idx').on(table.userId, table.isRead),
  index('notifications_created_at_idx').on(table.createdAt),
  uniqueIndex('notifications_task_deadline_dedup_idx')
    .on(table.entityId, sql`((metadata ->> 'windowKey'))`)
    .where(sql`"type" = 'task_deadline' AND "entity_type" = 'task' AND (metadata ->> 'windowKey') IS NOT NULL`),
]);

// =========================================================================
// 17. RFQS TABLE (Request for Quotations & Multi-Supplier Tendering)
// =========================================================================
export const rfqs = pgTable('rfqs', {
  id: uuid('id').defaultRandom().primaryKey(),
  rfqCode: varchar('rfq_code', { length: 50 }).notNull().unique(), // e.g. RFQ-2026-000001
  requestId: uuid('request_id').references(() => requests.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  destinationPort: varchar('destination_port', { length: 120 }).default('ميناء بورتسودان الجنوبي').notNull(),
  status: varchar('status', { length: 30 }).default('draft').notNull(), // 'draft', 'sent_to_suppliers', 'quotes_received', 'awarded', 'closed'
  invitedSupplierIds: jsonb('invited_supplier_ids').$type<string[]>().default([]).notNull(),
  items: jsonb('items').$type<Array<{
    id: string;
    name: string;
    specifications: string;
    quantity: number;
    unit: string;
    targetPrice?: number;
  }>>().default([]).notNull(),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('rfqs_code_idx').on(table.rfqCode),
  index('rfqs_request_idx').on(table.requestId),
  index('rfqs_status_idx').on(table.status),
  index('rfqs_created_at_idx').on(table.createdAt),
]);

// =========================================================================
// 18. SUPPLIER QUOTES TABLE (Factory Pricing, Lead Times, Warranties)
// =========================================================================
export const supplierQuotes = pgTable('supplier_quotes', {
  id: uuid('id').defaultRandom().primaryKey(),
  rfqId: uuid('rfq_id').references(() => rfqs.id, { onDelete: 'cascade' }).notNull(),
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'cascade' }).notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(), // 'USD', 'CNY', 'AED', 'SAR', 'SDG'
  totalAmount: integer('total_amount').notNull(), // Stored as integer (units or cents depending on business scale)
  unitPrices: jsonb('unit_prices').$type<Array<{ itemId: string; price: number }>>().default([]).notNull(),
  deliveryLeadDays: integer('delivery_lead_days').default(15).notNull(),
  warrantyMonths: integer('warranty_months').default(12).notNull(),
  paymentTerms: text('payment_terms').notNull(),
  notes: text('notes'),
  isAwarded: boolean('is_awarded').default(false).notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('quotes_rfq_idx').on(table.rfqId),
  index('quotes_supplier_idx').on(table.supplierId),
  index('quotes_awarded_idx').on(table.isAwarded),
]);

// =========================================================================
// 19. PURCHASE ORDERS TABLE (Official Commercial POs with Chinese & Global Vendors)
// =========================================================================
export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  poCode: varchar('po_code', { length: 50 }).notNull().unique(), // e.g. PO-2026-000001
  requestId: uuid('request_id').references(() => requests.id, { onDelete: 'cascade' }).notNull(),
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'restrict' }).notNull(),
  quoteId: uuid('quote_id').references(() => supplierQuotes.id, { onDelete: 'set null' }),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  totalAmount: integer('total_amount').notNull(),
  itemsSummary: text('items_summary').notNull(),
  status: varchar('status', { length: 30 }).default('draft').notNull(), // 'draft', 'pending_approval', 'approved', 'issued', 'paid', 'received', 'cancelled'
  paymentTerms: text('payment_terms').notNull(),
  deliveryDate: timestamp('delivery_date', { withTimezone: true }),
  approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('pos_code_idx').on(table.poCode),
  index('pos_request_idx').on(table.requestId),
  index('pos_supplier_idx').on(table.supplierId),
  index('pos_quote_idx').on(table.quoteId),
  index('pos_status_idx').on(table.status),
  index('pos_created_at_idx').on(table.createdAt),
]);

// =========================================================================
// RELATIONS DEFINITIONS
// =========================================================================
export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
  requests: many(requests),
  assignments: many(requestAssignments),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionCode],
    references: [permissions.code],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  sessions: many(authSessions),
  auditLogs: many(auditLogs),
  assignedCustomers: many(customers),
  assignedRequests: many(requests),
  assignments: many(requestAssignments),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  assignedSalesRep: one(users, {
    fields: [customers.assignedSalesRepId],
    references: [users.id],
  }),
  contacts: many(contacts),
  documents: many(partyDocuments),
  requests: many(requests),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  contacts: many(contacts),
  documents: many(partyDocuments),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  customer: one(customers, {
    fields: [contacts.customerId],
    references: [customers.id],
  }),
  supplier: one(suppliers, {
    fields: [contacts.supplierId],
    references: [suppliers.id],
  }),
}));

export const partyDocumentsRelations = relations(partyDocuments, ({ one }) => ({
  customer: one(customers, {
    fields: [partyDocuments.customerId],
    references: [customers.id],
  }),
  supplier: one(suppliers, {
    fields: [partyDocuments.supplierId],
    references: [suppliers.id],
  }),
  request: one(requests, {
    fields: [partyDocuments.requestId],
    references: [requests.id],
  }),
  uploader: one(users, {
    fields: [partyDocuments.uploadedBy],
    references: [users.id],
  }),
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  customer: one(customers, {
    fields: [requests.customerId],
    references: [customers.id],
  }),
  department: one(departments, {
    fields: [requests.departmentId],
    references: [departments.id],
  }),
  assignedUser: one(users, {
    fields: [requests.assignedUserId],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [requests.createdBy],
    references: [users.id],
  }),
  timeline: many(requestTimeline),
  assignments: many(requestAssignments),
  documents: many(partyDocuments),
}));

export const requestTimelineRelations = relations(requestTimeline, ({ one }) => ({
  request: one(requests, {
    fields: [requestTimeline.requestId],
    references: [requests.id],
  }),
  actor: one(users, {
    fields: [requestTimeline.actorId],
    references: [users.id],
  }),
}));

export const requestAssignmentsRelations = relations(requestAssignments, ({ one }) => ({
  request: one(requests, {
    fields: [requestAssignments.requestId],
    references: [requests.id],
  }),
  department: one(departments, {
    fields: [requestAssignments.departmentId],
    references: [departments.id],
  }),
  assignedUser: one(users, {
    fields: [requestAssignments.assignedUserId],
    references: [users.id],
  }),
  assignedByUser: one(users, {
    fields: [requestAssignments.assignedByUserId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const rfqsRelations = relations(rfqs, ({ one, many }) => ({
  request: one(requests, {
    fields: [rfqs.requestId],
    references: [requests.id],
  }),
  creator: one(users, {
    fields: [rfqs.createdBy],
    references: [users.id],
  }),
  quotes: many(supplierQuotes),
}));

export const supplierQuotesRelations = relations(supplierQuotes, ({ one, many }) => ({
  rfq: one(rfqs, {
    fields: [supplierQuotes.rfqId],
    references: [rfqs.id],
  }),
  supplier: one(suppliers, {
    fields: [supplierQuotes.supplierId],
    references: [suppliers.id],
  }),
  purchaseOrders: many(purchaseOrders),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one }) => ({
  request: one(requests, {
    fields: [purchaseOrders.requestId],
    references: [requests.id],
  }),
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  quote: one(supplierQuotes, {
    fields: [purchaseOrders.quoteId],
    references: [supplierQuotes.id],
  }),
  approver: one(users, {
    fields: [purchaseOrders.approvedBy],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [purchaseOrders.createdBy],
    references: [users.id],
  }),
}));

// =========================================================================
// 21. TREASURY ACCOUNTS TABLE (Cash Boxes & Bank Accounts)
// =========================================================================
export const treasuryAccounts = pgTable('treasury_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountCode: varchar('account_code', { length: 50 }).notNull().unique(), // e.g. TR-1001
  name: text('name').notNull(),
  type: varchar('type', { length: 30 }).notNull().default('bank'), // 'cash', 'bank'
  currency: varchar('currency', { length: 10 }).notNull().default('USD'), // 'USD', 'SDG', 'AED', 'CNY', 'SAR'
  accountNumber: varchar('account_number', { length: 100 }),
  bankName: text('bank_name'),
  balance: numeric('balance', { precision: 15, scale: 2 }).notNull().default('0.00'),
  status: varchar('status', { length: 20 }).notNull().default('active'), // 'active', 'frozen', 'closed'
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('treasury_accounts_code_idx').on(table.accountCode),
  index('treasury_accounts_type_idx').on(table.type),
  index('treasury_accounts_currency_idx').on(table.currency),
  index('treasury_accounts_status_idx').on(table.status),
]);

// =========================================================================
// 22. TREASURY TRANSACTIONS TABLE (Protected Financial Ledger)
// =========================================================================
export const treasuryTransactions = pgTable('treasury_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  transactionCode: varchar('transaction_code', { length: 50 }).notNull().unique(), // e.g. TX-2026-000001
  accountId: uuid('account_id').references(() => treasuryAccounts.id, { onDelete: 'restrict' }).notNull(),
  transactionType: varchar('transaction_type', { length: 30 }).notNull(), // 'deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'payment', 'receipt', 'adjustment'
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }).notNull().default('1.000000'),
  amountInTreasuryCurrency: numeric('amount_in_treasury_currency', { precision: 15, scale: 2 }).notNull(),
  runningBalance: numeric('running_balance', { precision: 15, scale: 2 }).notNull(),
  referenceType: varchar('reference_type', { length: 50 }), // 'payment_voucher', 'receipt_voucher', 'treasury_transfer', 'reconciliation_adjustment', 'supplier_refund'
  referenceId: varchar('reference_id', { length: 100 }),
  description: text('description').notNull(),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('treasury_tx_account_idx').on(table.accountId),
  index('treasury_tx_code_idx').on(table.transactionCode),
  index('treasury_tx_type_idx').on(table.transactionType),
  index('treasury_tx_ref_idx').on(table.referenceType, table.referenceId),
  index('treasury_tx_created_at_idx').on(table.createdAt),
]);

// =========================================================================
// 23. TREASURY TRANSFERS TABLE (Atomic Internal Fund Movements)
// =========================================================================
export const treasuryTransfers = pgTable('treasury_transfers', {
  id: uuid('id').defaultRandom().primaryKey(),
  transferCode: varchar('transfer_code', { length: 50 }).notNull().unique(), // e.g. TRF-2026-000001
  fromAccountId: uuid('from_account_id').references(() => treasuryAccounts.id, { onDelete: 'restrict' }).notNull(),
  toAccountId: uuid('to_account_id').references(() => treasuryAccounts.id, { onDelete: 'restrict' }).notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }).notNull().default('1.000000'),
  convertedAmount: numeric('converted_amount', { precision: 15, scale: 2 }).notNull(),
  notes: text('notes'),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('treasury_transfers_from_idx').on(table.fromAccountId),
  index('treasury_transfers_to_idx').on(table.toAccountId),
  index('treasury_transfers_code_idx').on(table.transferCode),
]);

// =========================================================================
// 24. TREASURY RECONCILIATIONS TABLE (Audited Balance Reconciliation)
// =========================================================================
export const treasuryReconciliations = pgTable('treasury_reconciliations', {
  id: uuid('id').defaultRandom().primaryKey(),
  reconciliationCode: varchar('reconciliation_code', { length: 50 }).notNull().unique(), // e.g. REC-ADJ-0001
  accountId: uuid('account_id').references(() => treasuryAccounts.id, { onDelete: 'restrict' }).notNull(),
  bookBalance: numeric('book_balance', { precision: 15, scale: 2 }).notNull(),
  reconciledBalance: numeric('reconciled_balance', { precision: 15, scale: 2 }).notNull(),
  difference: numeric('difference', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // 'draft', 'approved', 'rejected'
  notes: text('notes'),
  requestedBy: uuid('requested_by').references(() => users.id, { onDelete: 'restrict' }).notNull(),
  approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('treasury_reconcile_account_idx').on(table.accountId),
  index('treasury_reconcile_status_idx').on(table.status),
]);

// =========================================================================
// 25. EXCHANGE RATES TABLE (Historical Currency Pairs)
// =========================================================================
export const exchangeRates = pgTable('exchange_rates', {
  id: uuid('id').defaultRandom().primaryKey(),
  baseCurrency: varchar('base_currency', { length: 10 }).notNull(),
  targetCurrency: varchar('target_currency', { length: 10 }).notNull(),
  rate: numeric('rate', { precision: 12, scale: 6 }).notNull(),
  effectiveDate: timestamp('effective_date', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('exchange_rates_pair_idx').on(table.baseCurrency, table.targetCurrency),
  index('exchange_rates_date_idx').on(table.effectiveDate),
]);

// =========================================================================
// 26. PRODUCT CATEGORIES TABLE
// =========================================================================
export const productCategories = pgTable('product_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(), // e.g. CAT-ELEC
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  description: text('description'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('product_categories_code_idx').on(table.code),
]);

// =========================================================================
// 27. PRODUCTS TABLE (Global Product Catalog)
// =========================================================================
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  sku: varchar('sku', { length: 50 }).notNull().unique(), // e.g. PRD-1001
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en'),
  categoryId: uuid('category_id').references(() => productCategories.id, { onDelete: 'set null' }),
  description: text('description'),
  unit: varchar('unit', { length: 20 }).notNull().default('pcs'), // 'pcs', 'kg', 'carton', 'cbm', 'set'
  defaultCurrency: varchar('default_currency', { length: 10 }).notNull().default('USD'),
  costPrice: numeric('cost_price', { precision: 15, scale: 2 }).notNull().default('0.00'),
  sellingPrice: numeric('selling_price', { precision: 15, scale: 2 }).notNull().default('0.00'),
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  minOrderQty: integer('min_order_qty').notNull().default(1),
  status: varchar('status', { length: 20 }).notNull().default('active'), // 'active', 'inactive'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('products_sku_idx').on(table.sku),
  index('products_category_idx').on(table.categoryId),
  index('products_supplier_idx').on(table.supplierId),
  index('products_status_idx').on(table.status),
]);

// =========================================================================
// 27b. SUPPLIER PRODUCTS TABLE (Many-to-Many: 1 Supplier -> 100s of Items, 1 Item -> Multiple Suppliers)
// =========================================================================
export const supplierProducts = pgTable('supplier_products', {
  id: uuid('id').defaultRandom().primaryKey(),
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  supplierItemCode: varchar('supplier_item_code', { length: 100 }), // كود الصنف لدى المورد
  purchasePrice: numeric('purchase_price', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('USD'),
  moq: integer('moq').default(1).notNull(),
  leadTimeDays: integer('lead_time_days'),
  quotationRef: text('quotation_ref'),
  notes: text('notes'),
  isPrimary: boolean('is_primary').default(false).notNull(),
  priceUpdatedAt: timestamp('price_updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('supplier_products_uniq_idx').on(table.supplierId, table.productId),
  index('supplier_products_supp_idx').on(table.supplierId),
  index('supplier_products_prod_idx').on(table.productId),
  index('supplier_products_item_code_idx').on(table.supplierItemCode),
]);

// =========================================================================
// 28. SUPPLIER INVOICES TABLE (Official Vendor Bills & Overpayment Guard)
// =========================================================================
export const supplierInvoices = pgTable('supplier_invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull().unique(), // e.g. SINV-2026-000001
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'restrict' }).notNull(),
  purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id, { onDelete: 'set null' }),
  requestId: uuid('request_id').references(() => requests.id, { onDelete: 'set null' }),
  issueDate: timestamp('issue_date', { withTimezone: true }).defaultNow().notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  currency: varchar('currency', { length: 10 }).notNull().default('USD'),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 2 }).notNull().default('0.00'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 15, scale: 2 }).notNull().default('0.00'),
  remainingAmount: numeric('remaining_amount', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('approved'), // 'draft', 'approved', 'partially_paid', 'paid', 'cancelled'
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'restrict' }).notNull(),
  approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('supplier_invoices_number_idx').on(table.invoiceNumber),
  index('supplier_invoices_supplier_idx').on(table.supplierId),
  index('supplier_invoices_po_idx').on(table.purchaseOrderId),
  index('supplier_invoices_request_idx').on(table.requestId),
  index('supplier_invoices_status_idx').on(table.status),
]);

// =========================================================================
// 29. CUSTOMER INVOICES TABLE (Customer Billing & Revenue)
// =========================================================================
export const customerInvoices = pgTable('customer_invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(), // e.g. INV-2026-000001
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'restrict' }).notNull(),
  requestId: uuid('request_id').references(() => requests.id, { onDelete: 'set null' }),
  issueDate: timestamp('issue_date', { withTimezone: true }).defaultNow().notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  currency: varchar('currency', { length: 10 }).notNull().default('USD'),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 15, scale: 2 }).notNull().default('0.00'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 15, scale: 2 }).notNull().default('0.00'),
  remainingAmount: numeric('remaining_amount', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('issued'), // 'draft', 'issued', 'partially_paid', 'paid', 'cancelled'
  paymentTerms: text('payment_terms'),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'restrict' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('customer_invoices_num_idx').on(table.invoiceNumber),
  index('customer_invoices_cust_idx').on(table.customerId),
  index('customer_invoices_req_idx').on(table.requestId),
  index('customer_invoices_status_idx').on(table.status),
]);

// =========================================================================
// 30. CUSTOMER INVOICE ITEMS TABLE
// =========================================================================
export const customerInvoiceItems = pgTable('customer_invoice_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').references(() => customerInvoices.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  itemCode: varchar('item_code', { length: 50 }), // Historical Item Code snapshot
  description: text('description').notNull(),
  unit: varchar('unit', { length: 30 }).default('pcs'),
  quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull().default('1.00'),
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),
  totalPrice: numeric('total_price', { precision: 15, scale: 2 }).notNull(),
}, (table) => [
  index('customer_inv_items_inv_idx').on(table.invoiceId),
  index('customer_inv_items_prod_idx').on(table.productId),
  index('customer_inv_items_code_idx').on(table.itemCode),
]);

// =========================================================================
// 31. PAYMENT VOUCHERS TABLE (سندات الصرف مع الرقابة الثنائية الصارمة)
// =========================================================================
export const paymentVouchers = pgTable('payment_vouchers', {
  id: uuid('id').defaultRandom().primaryKey(),
  voucherNumber: varchar('voucher_number', { length: 50 }).notNull().unique(), // e.g. PAY-2026-000001
  treasuryAccountId: uuid('treasury_account_id').references(() => treasuryAccounts.id, { onDelete: 'restrict' }).notNull(),
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'restrict' }).notNull(),
  supplierInvoiceId: uuid('supplier_invoice_id').references(() => supplierInvoices.id, { onDelete: 'set null' }),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }).notNull().default('1.000000'),
  amountInTreasuryCurrency: numeric('amount_in_treasury_currency', { precision: 15, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 30 }).notNull().default('bank_transfer'), // 'cash', 'bank_transfer', 'cheque'
  referenceDoc: text('reference_doc'),
  status: varchar('status', { length: 30 }).notNull().default('draft'), // 'draft', 'approved', 'posted', 'cancelled'
  requestedBy: uuid('requested_by').references(() => users.id, { onDelete: 'restrict' }).notNull(),
  approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  postedBy: uuid('posted_by').references(() => users.id, { onDelete: 'set null' }),
  postedAt: timestamp('posted_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('payment_vouchers_num_idx').on(table.voucherNumber),
  index('payment_vouchers_treasury_idx').on(table.treasuryAccountId),
  index('payment_vouchers_supplier_idx').on(table.supplierId),
  index('payment_vouchers_sinv_idx').on(table.supplierInvoiceId),
  index('payment_vouchers_status_idx').on(table.status),
]);

// =========================================================================
// 32. RECEIPT VOUCHERS TABLE (سندات القبض والتحصيل)
// =========================================================================
export const receiptVouchers = pgTable('receipt_vouchers', {
  id: uuid('id').defaultRandom().primaryKey(),
  voucherNumber: varchar('voucher_number', { length: 50 }).notNull().unique(), // e.g. REC-2026-000001
  treasuryAccountId: uuid('treasury_account_id').references(() => treasuryAccounts.id, { onDelete: 'restrict' }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'restrict' }).notNull(),
  customerInvoiceId: uuid('customer_invoice_id').references(() => customerInvoices.id, { onDelete: 'set null' }),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }).notNull().default('1.000000'),
  amountInTreasuryCurrency: numeric('amount_in_treasury_currency', { precision: 15, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 30 }).notNull().default('bank_transfer'), // 'cash', 'bank_transfer', 'cheque'
  referenceDoc: text('reference_doc'),
  status: varchar('status', { length: 30 }).notNull().default('posted'), // 'draft', 'posted', 'cancelled'
  receivedBy: uuid('received_by').references(() => users.id, { onDelete: 'restrict' }).notNull(),
  postedBy: uuid('posted_by').references(() => users.id, { onDelete: 'set null' }),
  postedAt: timestamp('posted_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('receipt_vouchers_num_idx').on(table.voucherNumber),
  index('receipt_vouchers_treasury_idx').on(table.treasuryAccountId),
  index('receipt_vouchers_customer_idx').on(table.customerId),
  index('receipt_vouchers_cinv_idx').on(table.customerInvoiceId),
  index('receipt_vouchers_status_idx').on(table.status),
]);

// =========================================================================
// 33. RELATIONS DEFINITIONS FOR PHASE 6
// =========================================================================

export const treasuryAccountsRelations = relations(treasuryAccounts, ({ many }) => ({
  transactions: many(treasuryTransactions),
  transfersFrom: many(treasuryTransfers, { relationName: 'fromAccount' }),
  transfersTo: many(treasuryTransfers, { relationName: 'toAccount' }),
  reconciliations: many(treasuryReconciliations),
  paymentVouchers: many(paymentVouchers),
  receiptVouchers: many(receiptVouchers),
}));

export const treasuryTransactionsRelations = relations(treasuryTransactions, ({ one }) => ({
  account: one(treasuryAccounts, {
    fields: [treasuryTransactions.accountId],
    references: [treasuryAccounts.id],
  }),
  actor: one(users, {
    fields: [treasuryTransactions.actorId],
    references: [users.id],
  }),
}));

export const treasuryTransfersRelations = relations(treasuryTransfers, ({ one }) => ({
  fromAccount: one(treasuryAccounts, {
    fields: [treasuryTransfers.fromAccountId],
    references: [treasuryAccounts.id],
    relationName: 'fromAccount',
  }),
  toAccount: one(treasuryAccounts, {
    fields: [treasuryTransfers.toAccountId],
    references: [treasuryAccounts.id],
    relationName: 'toAccount',
  }),
  actor: one(users, {
    fields: [treasuryTransfers.actorId],
    references: [users.id],
  }),
}));

export const treasuryReconciliationsRelations = relations(treasuryReconciliations, ({ one }) => ({
  account: one(treasuryAccounts, {
    fields: [treasuryReconciliations.accountId],
    references: [treasuryAccounts.id],
  }),
  requester: one(users, {
    fields: [treasuryReconciliations.requestedBy],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [treasuryReconciliations.approvedBy],
    references: [users.id],
  }),
}));

export const productCategoriesRelations = relations(productCategories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  supplier: one(suppliers, {
    fields: [products.supplierId],
    references: [suppliers.id],
  }),
}));

export const supplierInvoicesRelations = relations(supplierInvoices, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [supplierInvoices.supplierId],
    references: [suppliers.id],
  }),
  purchaseOrder: one(purchaseOrders, {
    fields: [supplierInvoices.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  request: one(requests, {
    fields: [supplierInvoices.requestId],
    references: [requests.id],
  }),
  creator: one(users, {
    fields: [supplierInvoices.createdBy],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [supplierInvoices.approvedBy],
    references: [users.id],
  }),
  paymentVouchers: many(paymentVouchers),
}));

export const customerInvoicesRelations = relations(customerInvoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [customerInvoices.customerId],
    references: [customers.id],
  }),
  request: one(requests, {
    fields: [customerInvoices.requestId],
    references: [requests.id],
  }),
  creator: one(users, {
    fields: [customerInvoices.createdBy],
    references: [users.id],
  }),
  items: many(customerInvoiceItems),
  receiptVouchers: many(receiptVouchers),
}));

export const customerInvoiceItemsRelations = relations(customerInvoiceItems, ({ one }) => ({
  invoice: one(customerInvoices, {
    fields: [customerInvoiceItems.invoiceId],
    references: [customerInvoices.id],
  }),
  product: one(products, {
    fields: [customerInvoiceItems.productId],
    references: [products.id],
  }),
}));

export const paymentVouchersRelations = relations(paymentVouchers, ({ one }) => ({
  treasuryAccount: one(treasuryAccounts, {
    fields: [paymentVouchers.treasuryAccountId],
    references: [treasuryAccounts.id],
  }),
  supplier: one(suppliers, {
    fields: [paymentVouchers.supplierId],
    references: [suppliers.id],
  }),
  supplierInvoice: one(supplierInvoices, {
    fields: [paymentVouchers.supplierInvoiceId],
    references: [supplierInvoices.id],
  }),
  requester: one(users, {
    fields: [paymentVouchers.requestedBy],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [paymentVouchers.approvedBy],
    references: [users.id],
  }),
  poster: one(users, {
    fields: [paymentVouchers.postedBy],
    references: [users.id],
  }),
}));

export const receiptVouchersRelations = relations(receiptVouchers, ({ one }) => ({
  treasuryAccount: one(treasuryAccounts, {
    fields: [receiptVouchers.treasuryAccountId],
    references: [treasuryAccounts.id],
  }),
  customer: one(customers, {
    fields: [receiptVouchers.customerId],
    references: [customers.id],
  }),
  customerInvoice: one(customerInvoices, {
    fields: [receiptVouchers.customerInvoiceId],
    references: [customerInvoices.id],
  }),
  receiver: one(users, {
    fields: [receiptVouchers.receivedBy],
    references: [users.id],
  }),
  poster: one(users, {
    fields: [receiptVouchers.postedBy],
    references: [users.id],
  }),
}));

export const supplierProductsRelations = relations(supplierProducts, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierProducts.supplierId],
    references: [suppliers.id],
  }),
  product: one(products, {
    fields: [supplierProducts.productId],
    references: [products.id],
  }),
}));


