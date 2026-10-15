export type ShipmentOrigin = 'الصين' | 'الإمارات' | 'السعودية' | 'الأسواق العالمية';
export type ShipmentType = 'LCL (شحن جزئي)' | 'FCL (حاوية كاملة)' | 'شحن جوي';

export type ShipmentStatusKey =
  | 'Order Received'
  | 'Purchasing'
  | 'Purchased'
  | 'China Warehouse'
  | 'Preparing'
  | 'Shipped'
  | 'In Transit'
  | 'Sudan'
  | 'Customs'
  | 'Delivered';

// ==========================================
// SAHLA ERP FOUNDATION TYPES (PHASE 1)
// ==========================================

export type DepartmentCode =
  | 'MANAGEMENT'
  | 'SALES_CRM'
  | 'PROCUREMENT'
  | 'FINANCE'
  | 'OPERATIONS'
  | 'CUSTOMS'
  | 'IT_ADMIN';

export type RoleCode =
  | 'super_admin'
  | 'admin'
  | 'procurement'
  | 'procurement_specialist'
  | 'finance'
  | 'finance_accountant'
  | 'customs'
  | 'operations_officer'
  | 'sales'
  | 'sales_crm_officer'
  | 'department_manager'
  | 'viewer';

export type PermissionCode =
  | 'requests:view'
  | 'requests:create'
  | 'requests:edit'
  | 'requests:assign'
  | 'requests:approve'
  | 'requests:delete'
  | 'crm:view'
  | 'crm:create'
  | 'crm:edit'
  | 'crm:convert'
  | 'procurement:view'
  | 'procurement:create_rfq'
  | 'procurement:compare'
  | 'procurement:create_po'
  | 'finance:view'
  | 'finance:receipts'
  | 'finance:payables'
  | 'finance:treasury'
  | 'finance:approve_payment'
  | 'operations:view'
  | 'operations:milestones'
  | 'operations:customs'
  | 'operations:pod'
  | 'audit:view'
  | 'settings:manage'
  | 'export:data';

export interface User {
  id: string; // Stable UUID
  email: string;
  username?: string;
  pin?: string;
  name: string;
  phone: string;
  departmentId: string;
  roleId: string;
  roleCode: RoleCode;
  roleNameAr: string;
  departmentCode: DepartmentCode;
  departmentNameAr: string;
  status: 'active' | 'inactive';
  allowedModules?: string[];
  avatarUrl?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  code: DepartmentCode;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  managerUserId?: string;
  activeEmployeesCount: number;
}

export interface Role {
  id: string;
  code: RoleCode;
  nameAr: string;
  descriptionAr: string;
  permissions: PermissionCode[];
}

export interface MasterDataItem {
  id: string;
  category:
    | 'request_type'
    | 'priority'
    | 'currency'
    | 'shipping_term'
    | 'port_code'
    | 'container_size'
    | 'customs_status';
  code: string;
  nameAr: string;
  nameEn: string;
  metadata?: Record<string, any>;
  sortOrder: number;
  isActive: boolean;
}

export interface SequenceRecord {
  id: string;
  sequenceKey:
    | 'CUSTOMER'
    | 'REQUEST'
    | 'PO'
    | 'SHIPMENT'
    | 'RECEIPT'
    | 'PAYMENT'
    | 'EXPENSE'
    | 'PURCHASE_INVOICE'
    | 'TRUCKING';
  prefix: string;
  currentValue: number;
  padding: number;
  sampleFormatted: string;
  description: string;
  updatedAt: string;
}

// Universal Audit Trail (Append-Only)
export interface AuditTrailLog {
  id: string; // UUID
  actorId: string;
  actorName: string;
  actorRole: string;
  entityType:
    | 'request'
    | 'customer'
    | 'lead'
    | 'purchase_order'
    | 'supplier'
    | 'receipt'
    | 'payment'
    | 'shipment'
    | 'customs'
    | 'setting'
    | 'user';
  entityId: string;
  requestId?: string; // Stable Technical ID to reconstruct entire customer/request journey
  action:
    | 'create'
    | 'update'
    | 'status_change'
    | 'assign'
    | 'approve'
    | 'reject'
    | 'change_request'
    | 'verify_payment'
    | 'cancel';
  previousState?: Record<string, any> | null;
  newState?: Record<string, any> | null;
  notes?: string;
  ipAddress?: string;
  timestamp: string;
}

// Universal Reusable Attachments
export interface UniversalAttachment {
  id: string; // UUID
  relatedEntity:
    | 'customer'
    | 'request'
    | 'purchase_item'
    | 'purchase_order'
    | 'supplier'
    | 'finance_receipt'
    | 'finance_payment'
    | 'inspection'
    | 'shipment'
    | 'customs'
    | 'delivery';
  relatedEntityId: string;
  requestId?: string;
  category:
    | 'commercial_invoice'
    | 'packing_list'
    | 'bill_of_lading'
    | 'certificate_of_origin'
    | 'inspection_report'
    | 'payment_proof'
    | 'customs_declaration'
    | 'pod_signature'
    | 'other';
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  fileUrl: string;
  visibility: 'public_tracking' | 'private_internal';
  description?: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  requestStage?: string;
}

// Core Request Backbone
export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent';

export type RequestStatus =
  | 'new'
  | 'assigned'
  | 'ready_for_processing'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

export type RequestApprovalStatus =
  | 'none'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'changes_requested';

export interface RequestHeader {
  id: string; // Stable UUID Technical ID
  requestCode: string; // e.g. REQ-2026-000101
  customerId: string; // References Customer.id
  customerCode: string; // Display commercial code e.g. SH-C-1001
  customerName: string;
  customerPhone: string;
  requestTypeCode: string;
  departmentCode: DepartmentCode;
  title: string;
  priority: RequestPriority;
  status: RequestStatus;
  approvalStatus: RequestApprovalStatus;
  assignedToUserId?: string;
  assignedToUserName?: string;
  assignedAt?: string;
  notes?: string;
  readyForProcessingAt?: string;
  completedAt?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

// Customer Master
export interface CustomerMaster {
  id: string; // Technical UUID
  customerCode: string; // Concurrency-safe commercial code e.g. SH-C-1001
  companyName: string;
  contactName: string;
  businessType: 'commercial' | 'industrial' | 'startup' | 'individual';
  primaryPhone: string;
  whatsapp: string;
  email?: string;
  country: string;
  city: string;
  address?: string;
  taxNumber?: string;
  nationalIdOrPassport?: string;
  assignedSalesRepId?: string;
  assignedSalesRepName?: string;
  status: 'active' | 'lead' | 'blacklisted';
  totalRequestsCount: number;
  activeShipmentsCount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Existing Public Web & Tracking Compatibility
export interface ShipmentEvent {
  id: string;
  status: ShipmentStatusKey;
  statusArabic: string;
  date: string;
  time: string;
  note: string;
  location?: string;
}

export interface ShipmentDocument {
  id: string;
  name: string;
  type: 'Invoice' | 'Packing List' | 'Shipping Document' | 'Customs Document' | 'Other';
  fileUrl?: string;
  fileSize?: string;
  uploadedAt: string;
  visibility: 'private' | 'public';
}

export interface Quote {
  id: string;
  orderId: string;
  productCost: number;
  shippingCost: number;
  customsCost: number;
  deliveryCost: number;
  otherCost: number;
  total: number;
  currency: 'USD' | 'AED' | 'SAR' | 'SDG';
  notes?: string;
  createdAt: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  orderId?: string;
  requestId?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  destinationCity: string;
  origin: ShipmentOrigin | string;
  destination: string;
  shipmentType: ShipmentType | string;
  weight?: string;
  volume?: string;
  pieces?: number;
  description?: string;
  currentStatus: ShipmentStatusKey;
  currentStatusArabic: string;
  lastUpdate: string;
  estimatedDelivery?: string;
  events: ShipmentEvent[];
  documents: ShipmentDocument[];
  isDemo?: boolean;
  createdAt: string;
  updatedAt?: string;
  customerWhatsapp?: string;
}

export interface Order {
  id: string;
  customerName: string;
  whatsapp: string;
  origin: string;
  destinationCity: string;
  productName: string;
  quantity: string | number;
  weightOrVolume?: string;
  description: string;
  imageUrl?: string;
  notes?: string;
  status: 'pending' | 'reviewing' | 'quoted' | 'converted' | 'cancelled';
  quote?: Quote;
  shipmentId?: string;
  trackingNumber?: string;
  createdAt: string;
}

export interface PublicTrackingData {
  trackingNumber: string;
  origin: string;
  destination: string;
  shipmentType?: string;
  currentStatus: ShipmentStatusKey;
  currentStatusArabic: string;
  lastUpdate: string;
  estimatedDelivery?: string;
  cbm?: string;
  shippingType?: string;
  events: {
    id: string;
    status: ShipmentStatusKey;
    statusArabic: string;
    date: string;
    time: string;
    note: string;
    location?: string;
  }[];
  milestones?: {
    date: string;
    location?: string;
    title: string;
    description: string;
  }[];
  publicDocuments?: {
    id: string;
    name: string;
    type: string;
    date: string;
    url?: string;
    category?: string;
  }[];
  vesselName?: string;
  containerNumber?: string;
  blNumber?: string;
  requestCode?: string;
  customerName?: string;
  erpSource?: boolean;
  rawErpData?: any;
}

export interface DashboardStats {
  newOrders: number;
  reviewingOrders: number;
  activeShipments: number;
  inTransit: number;
  arrivedSudan: number;
  delivered: number;
  totalQuotes?: number;
  totalCustomers: number;
}

// ==========================================
// SAHLA ERP OPERATIONAL ENTITY TYPES
// ==========================================

export interface ErpSupplier {
  id: string; // Technical UUID
  supplierCode: string; // e.g. SUP-1001
  name: string;
  tradeNameEn?: string;
  contactPerson: string;
  country: string;
  city: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  wechat?: string; // WeChat ID (China)
  address?: string;
  bankName?: string;
  bankIban?: string;
  taxNumber?: string;
  rating: number; // 1-5
  categories: string[];
  status: 'active' | 'suspended' | 'verified';
  paymentTerms?: string;
  notes?: string;
  createdAt: string;
}

export interface ErpPurchaseInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface ErpVendorPayment {
  id: string;
  paymentCode: string; // e.g. VPAY-2026-0001
  invoiceId: string;
  invoiceCode: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  currency: 'USD' | 'AED' | 'SAR' | 'CNY' | 'SDG';
  paymentMethod: 'bank_wire' | 'dubai_account' | 'cash' | 'alipay_wechat' | 'bankak';
  referenceNumber: string; // SWIFT / Receipt / Transfer reference
  paidAt: string;
  paidBy: string;
  notes?: string;
}

export interface ErpPurchaseInvoice {
  id: string; // Technical UUID
  invoiceCode: string; // e.g. PINV-2026-0101
  vendorInvoiceNumber: string; // Original invoice/bill # from factory e.g. GZ-INV-9921
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  poId?: string;
  poCode?: string;
  requestId?: string;
  requestCode?: string;
  currency: 'USD' | 'AED' | 'SAR' | 'CNY' | 'SDG';
  issueDate: string;
  dueDate: string;
  items: ErpPurchaseInvoiceItem[];
  subtotal: number;
  shippingAndFees?: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overdue';
  status: 'draft' | 'under_review' | 'approved' | 'settled' | 'cancelled';
  paymentTerms: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  payments?: ErpVendorPayment[];
}

export interface ErpRfqItem {
  id: string;
  name: string;
  specifications: string;
  quantity: number;
  unit: string;
  targetPrice?: number;
}

export interface ErpRfq {
  id: string;
  rfqCode: string; // RFQ-2026-0001
  requestId: string;
  requestCode: string;
  customerName: string;
  title: string;
  items: ErpRfqItem[];
  destinationPort: string;
  status: 'draft' | 'sent_to_suppliers' | 'quotes_received' | 'awarded' | 'closed';
  invitedSupplierIds: string[];
  notes?: string;
  createdAt: string;
}

export interface ErpSupplierQuote {
  id: string;
  rfqId: string;
  supplierId: string;
  supplierName: string;
  currency: 'USD' | 'AED' | 'SAR' | 'CNY' | 'SDG';
  totalAmount: number;
  unitPrices: { itemId: string; price: number }[];
  deliveryLeadDays: number;
  warrantyMonths: number;
  paymentTerms: string;
  notes?: string;
  isAwarded: boolean;
  receivedAt: string;
}

export interface ErpPurchaseOrder {
  id: string;
  poCode: string; // PO-2026-0001
  requestId: string;
  requestCode: string;
  supplierId: string;
  supplierName: string;
  currency: 'USD' | 'AED' | 'SAR' | 'CNY' | 'SDG';
  totalAmount: number;
  itemsSummary: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'issued' | 'paid' | 'received' | 'cancelled';
  paymentTerms: string;
  deliveryDate?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface ErpCustomerInvoice {
  id: string;
  invoiceCode: string; // INV-2026-0001
  requestId: string;
  requestCode: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currency: 'USD' | 'AED' | 'SAR' | 'SDG';
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid';
  description: string;
  createdAt: string;
}

export interface ErpFinanceReceipt {
  id: string;
  receiptCode: string; // REC-2026-0001
  invoiceId?: string;
  requestId: string;
  requestCode: string;
  customerId: string;
  customerName: string;
  amount: number;
  currency: 'SDG' | 'USD' | 'AED' | 'SAR';
  exchangeRateToUSD?: number;
  paymentMethod: 'bankak' | 'fawry' | 'cash_sdg' | 'cash_usd' | 'wire_transfer' | 'dubai_account';
  referenceNumber: string; // Bank transaction ID e.g. بنكك 10928374
  receivedBy: string;
  notes?: string;
  createdAt: string;
}

export interface ErpOperationalExpense {
  id: string;
  expenseCode: string; // EXP-2026-0001
  requestId?: string;
  requestCode?: string;
  category:
    | 'port_fees'
    | 'customs_duty'
    | 'shipping_freight'
    | 'inspection_fee'
    | 'storage_demurrage'
    | 'local_transport'
    | 'other';
  description: string;
  amount: number;
  currency: 'SDG' | 'USD' | 'AED';
  paidTo: string;
  paymentStatus: 'pending' | 'paid';
  paidAt?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface ErpInspectionRecord {
  id: string;
  inspectionCode: string; // INS-2026-0001
  requestId: string;
  requestCode: string;
  poCode?: string;
  supplierName: string;
  factoryLocation: string;
  inspectorName: string;
  inspectionDate: string;
  itemsQuantity: number;
  defectRatePercentage: number;
  result: 'passed' | 'failed' | 'conditional_pass';
  checklist: {
    packagingOk: boolean;
    specificationsMatch: boolean;
    labelingAndBarcodeOk: boolean;
    electricalOrFunctionalTestOk: boolean;
  };
  notes: string;
  photosCount: number;
  createdAt: string;
}

export interface ErpShipmentOperation {
  id: string;
  shipmentCode: string; // SHL-2026-0001
  requestId: string;
  requestCode: string;
  customerName: string;
  shippingMode: 'sea_fcl' | 'sea_lcl' | 'air_freight' | 'land';
  originPort: string;
  destinationPort: string;
  containerNumber?: string;
  blNumber?: string;
  shippingLineOrCarrier: string;
  etd: string; // Estimated Time of Departure
  eta: string; // Estimated Time of Arrival (Port Sudan)
  transitStatus:
    | 'booking_confirmed'
    | 'container_loaded'
    | 'vessel_departed'
    | 'in_transit_red_sea'
    | 'arrived_port_sudan'
    | 'under_customs'
    | 'cleared_and_ready'
    | 'delivered';
  cargoDescription: string;
  weightKg?: number;
  volumeCbm?: number;
  createdAt: string;
}

export interface ErpCustomsClearance {
  id: string;
  customsCode: string; // CUS-2026-0001
  requestId: string;
  requestCode: string;
  customerName: string;
  declarationNumber: string; // رقم الشهادة الجمركية بميناء بورتسودان
  hsCodes: string[]; // e.g. 8541.40 (Solar cells), 8471.30 (Laptops)
  assessedValueCustoms: number;
  dutyAmountSDG: number;
  customsBrokerName: string;
  portLocation: 'Port Sudan South Port' | 'Port Sudan North Port' | 'Khartoum Airport' | 'Sawakin';
  status:
    | 'docs_received'
    | 'declaration_filed'
    | 'physical_inspection'
    | 'duty_assessed'
    | 'duty_paid'
    | 'customs_released';
  releaseDate?: string;
  createdAt: string;
}

export interface ErpProofOfDelivery {
  id: string;
  podCode: string; // POD-2026-0001
  requestId: string;
  requestCode: string;
  customerName: string;
  customerPhone: string;
  deliveryCity: string;
  deliveryAddress: string;
  recipientName: string;
  recipientIdNumber: string;
  deliveryDate: string;
  cargoCondition: 'excellent' | 'good' | 'damaged_reported';
  signatureProofTaken: boolean;
  notes?: string;
  isClosed: boolean;
  createdAt: string;
}

export interface ErpCrmLead {
  id: string;
  leadCode: string; // LEAD-1001
  companyOrClientName: string;
  contactPerson: string;
  phone: string;
  whatsapp: string;
  email?: string;
  interestCategory: 'import_turnkey' | 'shipping_only' | 'customs_only' | 'inspection_only';
  estimatedValueUSD?: number;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  assignedTo: string;
  notes?: string;
  createdAt: string;
}

export interface ErpInlandTrucking {
  id: string;
  dispatchCode: string; // TRK-2026-0001
  requestId: string;
  requestCode: string;
  shipmentId?: string;
  shipmentCode?: string;
  customerName: string;
  originPort: string;
  destinationCity: string;
  deliveryAddress: string;
  truckNumber: string;
  trailerNumber?: string;
  driverName: string;
  driverPhone: string;
  cargoDescription: string;
  cargoWeightTon: number;
  freightCostSDG: number;
  advancePaidSDG: number;
  remainingPaidSDG: number;
  dispatchDate: string;
  estimatedArrivalDate: string;
  actualArrivalDate?: string;
  status: 'loading' | 'in_transit' | 'arrived' | 'delivered';
  notes?: string;
  createdAt: string;
}

export interface ErpTreasuryAccount {
  id: string;
  code: string; // CASH_PORT_SUDAN, BANK_BOK_SDG, BANK_DUBAI_AED, CASH_CHINA_CNY
  nameAr: string;
  nameEn: string;
  type: 'cashbox' | 'bank_account';
  currency: 'SDG' | 'USD' | 'AED' | 'CNY' | 'SAR';
  currentBalance: number;
  custodianName: string;
  accountNumberOrIban?: string;
  bankBranch?: string;
  isActive: boolean;
  lastReconciledAt: string;
}

export interface ErpOrderProfitability {
  requestId: string;
  requestCode: string;
  customerName: string;
  title: string;
  status: string;
  currency: string;
  totalRevenueUSD: number;
  totalCostOfGoodsUSD: number;
  totalLogisticsCostUSD: number;
  totalCustomsAndPortUSD: number;
  totalExpensesUSD: number;
  totalCostUSD: number;
  netProfitUSD: number;
  profitMarginPercent: number;
}

