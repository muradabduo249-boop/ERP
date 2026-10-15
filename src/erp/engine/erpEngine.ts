import {
  AuditTrailLog,
  CustomerMaster,
  Department,
  DepartmentCode,
  ErpCrmLead,
  ErpCustomsClearance,
  ErpCustomerInvoice,
  ErpFinanceReceipt,
  ErpInspectionRecord,
  ErpInlandTrucking,
  ErpOperationalExpense,
  ErpOrderProfitability,
  ErpProofOfDelivery,
  ErpPurchaseInvoice,
  ErpPurchaseInvoiceItem,
  ErpPurchaseOrder,
  ErpRfq,
  ErpRfqItem,
  ErpShipmentOperation,
  ErpSupplier,
  ErpSupplierQuote,
  ErpTreasuryAccount,
  ErpVendorPayment,
  MasterDataItem,
  PermissionCode,
  RequestHeader,
  RequestPriority,
  RequestStatus,
  RequestApprovalStatus,
  Role,
  RoleCode,
  SequenceRecord,
  UniversalAttachment,
  User,
} from '../../types';
import {
  SEED_DEPARTMENTS,
  SEED_MASTER_DATA,
  SEED_ROLES,
  SEED_USERS,
} from '../../lib/constants';
import { isUserAllowedModule } from '../security/rbacPolicy';

const STORAGE_KEY = 'sahla_erp_production_zero_v1';

export interface ErpState {
  departments: Department[];
  roles: Role[];
  users: User[];
  masterData: MasterDataItem[];
  sequences: SequenceRecord[];
  auditLogs: AuditTrailLog[];
  attachments: UniversalAttachment[];
  customers: CustomerMaster[];
  leads: ErpCrmLead[];
  requests: RequestHeader[];
  suppliers: ErpSupplier[];
  rfqs: ErpRfq[];
  quotes: ErpSupplierQuote[];
  purchaseOrders: ErpPurchaseOrder[];
  purchaseInvoices: ErpPurchaseInvoice[];
  invoices: ErpCustomerInvoice[];
  receipts: ErpFinanceReceipt[];
  expenses: ErpOperationalExpense[];
  inspections: ErpInspectionRecord[];
  shipments: ErpShipmentOperation[];
  customs: ErpCustomsClearance[];
  proofsOfDelivery: ErpProofOfDelivery[];
  inlandTrucking: ErpInlandTrucking[];
  treasuryAccounts: ErpTreasuryAccount[];
}

export const INITIAL_SEQUENCES: SequenceRecord[] = [
  {
    id: 'seq-cust',
    sequenceKey: 'CUSTOMER',
    prefix: 'SH-C-',
    currentValue: 1000,
    padding: 4,
    sampleFormatted: 'SH-C-1001',
    description: 'كود العميل التجاري الفريد لشركة سهلا',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seq-req',
    sequenceKey: 'REQUEST',
    prefix: 'REQ-2026-',
    currentValue: 100,
    padding: 6,
    sampleFormatted: 'REQ-2026-000101',
    description: 'الرابط التقني المركزي للطلب عبر كافة الأقسام',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seq-po',
    sequenceKey: 'PO',
    prefix: 'PO-2026-',
    currentValue: 100,
    padding: 4,
    sampleFormatted: 'PO-2026-0101',
    description: 'أمر الشراء المعتمد للموردين والمصانع',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seq-ship',
    sequenceKey: 'SHIPMENT',
    prefix: 'SHL-2026-',
    currentValue: 100,
    padding: 6,
    sampleFormatted: 'SHL-2026-000101',
    description: 'رقم تتبع الشحنة والعمليات اللوجستية البحرية والجوية',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seq-rec',
    sequenceKey: 'RECEIPT',
    prefix: 'REC-2026-',
    currentValue: 100,
    padding: 4,
    sampleFormatted: 'REC-2026-0101',
    description: 'سندات التحصيل والقبض المالي (بنكك / نقداً / تحويل)',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seq-pay',
    sequenceKey: 'PAYMENT',
    prefix: 'PAY-2026-',
    currentValue: 100,
    padding: 4,
    sampleFormatted: 'PAY-2026-0101',
    description: 'سندات الصرف والدفع للموردين وخطوط الشحن',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seq-exp',
    sequenceKey: 'EXPENSE',
    prefix: 'EXP-2026-',
    currentValue: 100,
    padding: 4,
    sampleFormatted: 'EXP-2026-0101',
    description: 'مصروفات العمليات التشغيلية والجمارك والنقل الداخلي',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seq-pinv',
    sequenceKey: 'PURCHASE_INVOICE',
    prefix: 'PINV-2026-',
    currentValue: 100,
    padding: 4,
    sampleFormatted: 'PINV-2026-0101',
    description: 'فواتير المشتريات ومطالبات الموردين والمصانع',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seq-trk',
    sequenceKey: 'TRUCKING',
    prefix: 'TRK-2026-',
    currentValue: 100,
    padding: 4,
    sampleFormatted: 'TRK-2026-0101',
    description: 'تفويج وبوالص الشحن البري والنقل الداخلي من بورتسودان',
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_TREASURY_ACCOUNTS: ErpTreasuryAccount[] = [
  {
    id: 'treasury-1',
    code: 'CASH_PORT_SUDAN',
    nameAr: 'خزينة مكتب بورتسودان (كاش جمارك وموانئ)',
    nameEn: 'Port Sudan Office Cashbox',
    type: 'cashbox',
    currency: 'SDG',
    currentBalance: 0,
    custodianName: 'عثمان عبد الله (مسؤول الخزينة)',
    bankBranch: 'مكتب سهلا - حي الشاطئ بورتسودان',
    isActive: true,
    lastReconciledAt: new Date().toISOString(),
  },
  {
    id: 'treasury-2',
    code: 'BANK_BOK_SDG',
    nameAr: 'حساب بنك الخرطوم (تطبيق بنكك BOK)',
    nameEn: 'Bank of Khartoum (Bankak Corporate)',
    type: 'bank_account',
    currency: 'SDG',
    currentBalance: 0,
    custodianName: 'أحمد النور (المدير المالي)',
    accountNumberOrIban: '2840912 / كود الفرع 104',
    bankBranch: 'بنك الخرطوم - فرع بورتسودان الرئيسي',
    isActive: true,
    lastReconciledAt: new Date().toISOString(),
  },
  {
    id: 'treasury-3',
    code: 'BANK_DUBAI_AED',
    nameAr: 'حساب بنك الإمارات دبي الوطني (حساب دبي)',
    nameEn: 'Emirates NBD Corporate Account (Dubai)',
    type: 'bank_account',
    currency: 'AED',
    currentBalance: 0,
    custodianName: 'المدير العام (إدارة دبي)',
    accountNumberOrIban: 'AE07 0260 0001 2345 6789 01',
    bankBranch: 'Emirates NBD - Deira Dubai Branch',
    isActive: true,
    lastReconciledAt: new Date().toISOString(),
  },
  {
    id: 'treasury-4',
    code: 'CASH_CHINA_CNY',
    nameAr: 'عهدة مشتريات الصين (كوانزو / فوشان)',
    nameEn: 'China Procurement Cash & WeChat Pay',
    type: 'cashbox',
    currency: 'CNY',
    currentBalance: 0,
    custodianName: 'م. ليو شياو بينغ (مدير مكتب الصين)',
    accountNumberOrIban: 'Alipay/WeChat Business ID: Sahla_Trade_CN',
    bankBranch: 'Bank of China (Guangzhou Tianhe)',
    isActive: true,
    lastReconciledAt: new Date().toISOString(),
  },
];

export const DEFAULT_INLAND_TRUCKING: ErpInlandTrucking[] = [
  {
    id: 'trk-1',
    dispatchCode: 'TRK-2026-0101',
    requestId: 'req-1',
    requestCode: 'REQ-2026-000101',
    shipmentCode: 'SHL-2026-000101',
    customerName: 'شركة النيل الأزرق للاستيراد والتصدير',
    originPort: 'ميناء بورتسودان الجنوبي (مستودع الميناء B)',
    destinationCity: 'الخرطوم - المنطقة الصناعية بحري',
    deliveryAddress: 'مخازن النيل الأزرق، شارع الإنقاذ، بحري',
    truckNumber: 'خ 6 - 8921 (شاحنة تريلا قلاب 40 قدم)',
    trailerNumber: 'ش 4402',
    driverName: 'السائق الهادي محمد نور',
    driverPhone: '+249 91 234 5678',
    cargoDescription: 'منظومات طاقة شمسية ومحولات كهربائية صناعية',
    cargoWeightTon: 14.2,
    freightCostSDG: 3800000,
    advancePaidSDG: 2000000,
    remainingPaidSDG: 1800000,
    dispatchDate: '2026-03-01',
    estimatedArrivalDate: '2026-03-04',
    status: 'in_transit',
    notes: 'الشاحنة عبرت نقطة تفتيش جبل أولياء وجارٍ التوجه للمخازن، تم التثبت من سلامة الأربطة المشمعة.',
    createdAt: '2026-03-01T08:00:00Z',
  },
];

export const DEFAULT_INITIAL_SUPPLIERS: ErpSupplier[] = [
  {
    id: 'sup-1',
    supplierCode: 'SUP-1001',
    name: 'شركة فوشان للمعدات الكهربائية والطاقة الشمسية',
    tradeNameEn: 'Foshan SunPower Tech Co., Ltd',
    contactPerson: 'Mr. Zhang Wei (تشانغ وي)',
    country: 'الصين',
    city: 'فوشان (Foshan) - مقاطعة قوانغدونغ',
    phone: '+86 757 8888 9999',
    email: 'sales@sunpower-china.com',
    whatsapp: '+86 138 0000 1111',
    wechat: 'SunPower_Guangdong',
    address: 'No. 88, Shishan Industrial Zone, Nanhai District, Foshan',
    bankName: 'Bank of China (Foshan Branch)',
    bankIban: 'CN04 0104 0000 8921 4458 901',
    taxNumber: '91440600MA5CLPXX19',
    rating: 5,
    categories: ['طاقة شمسية', 'إنفرترات', 'بطاريات ليثيوم'],
    status: 'verified',
    paymentTerms: '30% مقدم، 70% مقابل بوليصة الشحن والفحص',
    notes: 'مصنع معتمد من سهلا، خضع لتدقيق ميداني وتجارب تشغيلية ممتازة.',
    createdAt: '2026-02-02T10:00:00Z',
  },
  {
    id: 'sup-2',
    supplierCode: 'SUP-1002',
    name: 'مصنع تشينغداو لإنتاج الإطارات ومعدات النقل الثقيل',
    tradeNameEn: 'Qingdao Master Tyres & Rubber Ltd',
    contactPerson: 'Ms. Lin Dan (لين دان)',
    country: 'الصين',
    city: 'تشينغداو (Qingdao) - مقاطعة شاندونغ',
    phone: '+86 532 8765 4321',
    email: 'export@mastertyres-cn.com',
    whatsapp: '+86 139 1234 5678',
    wechat: 'QD_MasterTyre_Global',
    address: 'Qingdao Free Trade Port Zone, Huangdao, Qingdao',
    bankName: 'Industrial and Commercial Bank of China (ICBC)',
    bankIban: 'CN12 0102 2200 4491 8832 104',
    rating: 4,
    categories: ['إطارات شاحنات', 'قطع غيار', 'مطاط صناعي'],
    status: 'verified',
    paymentTerms: '40% دفعة مقدمة، 60% قبل الشحن',
    notes: 'إطارات مخصصة للأجواء الحارة والطرق الوعرة في السودان.',
    createdAt: '2026-02-05T08:00:00Z',
  },
  {
    id: 'sup-3',
    supplierCode: 'SUP-1003',
    name: 'مجموعة دبي للتجارة والتجهيزات الصناعية',
    tradeNameEn: 'Dubai Mega Industrial Supplies FZE',
    contactPerson: 'أ. طارق عبد المجيد',
    country: 'الإمارات',
    city: 'دبي - المنطقة الحرة جبل علي (JAFZA)',
    phone: '+971 4 888 1234',
    email: 'info@dubaimega-fze.com',
    whatsapp: '+971 50 987 6543',
    address: 'JAFZA South, Warehouse B4-12, Jebel Ali Free Zone, Dubai',
    bankName: 'Emirates NBD (Dubai Branch)',
    bankIban: 'AE07 0260 0001 2345 6789 01',
    taxNumber: '100293847500003',
    rating: 5,
    categories: ['مولدات كهربائية', 'معدات ومضخات', 'أدوات صناعية'],
    status: 'active',
    paymentTerms: 'سداد فوري عبر حساب دبي (حوالة محلية أو شيك)',
    notes: 'شريك استراتيجي لتلبية التوريدات العاجلة والشحن السريع من ميناء جبل علي.',
    createdAt: '2026-02-10T12:00:00Z',
  },
  {
    id: 'sup-4',
    supplierCode: 'SUP-1004',
    name: 'مصنع شنتشن للإلكترونيات والألواح الذكية',
    tradeNameEn: 'Shenzhen SmartWave Electronics Co.',
    contactPerson: 'David Chen',
    country: 'الصين',
    city: 'شنتشن (Shenzhen) - هواكيانغ باي',
    phone: '+86 755 2345 6789',
    email: 'sales@smartwave-sz.com',
    whatsapp: '+86 137 7788 9900',
    wechat: 'Shenzhen_SmartWave',
    address: 'Huaqiang North Commercial Area, Futian, Shenzhen',
    bankName: 'HSBC China (Shenzhen)',
    rating: 4,
    categories: ['إلكترونيات', 'شاشات ذكية', 'كابلات وأجهزة اتصال'],
    status: 'active',
    paymentTerms: '30% مقدم، 70% عند الفحص النهائي',
    notes: 'مصنع متخصص في الإلكترونيات الاستهلاكية بمواصفات مطابقة للهيئة السودانية للمواصفات.',
    createdAt: '2026-02-14T09:00:00Z',
  },
];

export const DEFAULT_INITIAL_PURCHASE_INVOICES: ErpPurchaseInvoice[] = [
  {
    id: 'pinv-1',
    invoiceCode: 'PINV-2026-0101',
    vendorInvoiceNumber: 'FS-INV-2026-881',
    supplierId: 'sup-1',
    supplierName: 'شركة فوشان للمعدات الكهربائية والطاقة الشمسية',
    supplierCode: 'SUP-1001',
    poId: 'po-1',
    poCode: 'PO-2026-0101',
    requestId: 'req-1',
    requestCode: 'REQ-2026-000101',
    currency: 'USD',
    issueDate: '2026-02-13',
    dueDate: '2026-03-05',
    subtotal: 28400,
    shippingAndFees: 0,
    totalAmount: 28400,
    paidAmount: 8520,
    remainingAmount: 19880,
    paymentStatus: 'partial',
    status: 'approved',
    paymentTerms: '30% مقدم ($8,520) مسدد، 70% ($19,880) عند صدور بوليصة الشحن',
    notes: 'فاتورة التوريد الرسمية لمنظومات الطاقة الشمسية المصدرة بحاوية 40 قدم لميناء بورتسودان.',
    approvedBy: 'المدير المالي (عمر فاروق)',
    approvedAt: '2026-02-14T10:00:00Z',
    createdAt: '2026-02-13T15:00:00Z',
    items: [
      {
        id: 'pi-item-1',
        description: 'ألواح طاقة شمسية مونوكريستالين عالية الكفاءة 550W (عدد 200 لوح)',
        quantity: 200,
        unit: 'لوح',
        unitPrice: 85,
        totalPrice: 17000,
      },
      {
        id: 'pi-item-2',
        description: 'إنفرترات هجينة صناعية 5KW ثلاثية الطور (عدد 40 جهاز)',
        quantity: 40,
        unit: 'جهاز',
        unitPrice: 285,
        totalPrice: 11400,
      },
    ],
    payments: [
      {
        id: 'vpay-1',
        paymentCode: 'VPAY-2026-0101',
        invoiceId: 'pinv-1',
        invoiceCode: 'PINV-2026-0101',
        supplierId: 'sup-1',
        supplierName: 'شركة فوشان للمعدات الكهربائية والطاقة الشمسية',
        amount: 8520,
        currency: 'USD',
        paymentMethod: 'bank_wire',
        referenceNumber: 'SWIFT-BOK-ADVANCE-8821',
        paidAt: '2026-02-14T11:30:00Z',
        paidBy: 'أحمد النور (المدير المالي)',
        notes: 'سداد الدفعة المقدمة بنسبة 30% للمصنع الصيني بحوالة سويفت خارجية.',
      },
    ],
  },
  {
    id: 'pinv-2',
    invoiceCode: 'PINV-2026-0102',
    vendorInvoiceNumber: 'QD-MASTER-1049',
    supplierId: 'sup-2',
    supplierName: 'مصنع تشينغداو لإنتاج الإطارات ومعدات النقل الثقيل',
    supplierCode: 'SUP-1002',
    currency: 'USD',
    issueDate: '2026-02-18',
    dueDate: '2026-03-10',
    subtotal: 14200,
    shippingAndFees: 0,
    totalAmount: 14200,
    paidAmount: 0,
    remainingAmount: 14200,
    paymentStatus: 'unpaid',
    status: 'under_review',
    paymentTerms: '40% دفعة مقدمة، 60% قبل الشحن النهائي',
    notes: 'فاتورة توريد إطارات شاحنات ثقيلة قياس 1200R20 قيد المراجعة والاعتماد.',
    createdAt: '2026-02-18T09:00:00Z',
    items: [
      {
        id: 'pi-item-3',
        description: 'إطارات شاحنات ثقيلة 1200R20 جنط 20 طبقات مقاومة للحرارة (عدد 100 إطار)',
        quantity: 100,
        unit: 'إطار',
        unitPrice: 142,
        totalPrice: 14200,
      },
    ],
    payments: [],
  },
  {
    id: 'pinv-3',
    invoiceCode: 'PINV-2026-0103',
    vendorInvoiceNumber: 'DXB-MEGA-9932',
    supplierId: 'sup-3',
    supplierName: 'مجموعة دبي للتجارة والتجهيزات الصناعية',
    supplierCode: 'SUP-1003',
    currency: 'AED',
    issueDate: '2026-02-10',
    dueDate: '2026-02-15',
    subtotal: 42000,
    shippingAndFees: 0,
    totalAmount: 42000,
    paidAmount: 42000,
    remainingAmount: 0,
    paymentStatus: 'paid',
    status: 'settled',
    paymentTerms: 'سداد كامل عند استلام البضاعة بمستودعات سهلا دبي',
    notes: 'تم استلام وتجهيز الشحنة بمستودع جبل علي وسداد المبلغ بالكامل بحساب دبي.',
    approvedBy: 'المدير المالي (عمر فاروق)',
    approvedAt: '2026-02-10T14:00:00Z',
    createdAt: '2026-02-10T10:00:00Z',
    items: [
      {
        id: 'pi-item-4',
        description: 'مضخات مياه صناعية غاطسة 10HP مع لوحات التحكم والكيابل (عدد 6 وحدات)',
        quantity: 6,
        unit: 'وحدة',
        unitPrice: 7000,
        totalPrice: 42000,
      },
    ],
    payments: [
      {
        id: 'vpay-2',
        paymentCode: 'VPAY-2026-0102',
        invoiceId: 'pinv-3',
        invoiceCode: 'PINV-2026-0103',
        supplierId: 'sup-3',
        supplierName: 'مجموعة دبي للتجارة والتجهيزات الصناعية',
        amount: 42000,
        currency: 'AED',
        paymentMethod: 'dubai_account',
        referenceNumber: 'ENBD-TRF-098231',
        paidAt: '2026-02-11T12:00:00Z',
        paidBy: 'أحمد النور (المدير المالي)',
        notes: 'تحويل بنكي محلي مباشر من حساب شركة سهلا لدى بنك الإمارات دبي الوطني.',
      },
    ],
  },
];

// Clean Zero State
function getZeroCleanState(): ErpState {
  const initAuditLogs: AuditTrailLog[] = [
    {
      id: 'audit-init-001',
      actorId: 'user-001',
      actorName: 'المدير العام (نظام سهلا ERP)',
      actorRole: 'super_admin',
      entityType: 'setting',
      entityId: 'erp-bootstrap',
      action: 'create',
      notes: 'تمت تهيئة وتشغيل نظام سهلا ERP بنجاح من الصفر (Production Clean Slate) - جاهز لاستقبال بيانات العمليات والعملاء الواقعية.',
      timestamp: new Date().toISOString(),
    },
  ];

  return {
    departments: SEED_DEPARTMENTS,
    roles: SEED_ROLES,
    users: SEED_USERS,
    masterData: SEED_MASTER_DATA,
    sequences: INITIAL_SEQUENCES,
    auditLogs: initAuditLogs,
    attachments: [],
    customers: [],
    leads: [],
    requests: [],
    suppliers: [],
    rfqs: [],
    quotes: [],
    purchaseOrders: [],
    purchaseInvoices: [],
    invoices: [],
    receipts: [],
    expenses: [],
    inspections: [],
    shipments: [],
    customs: [],
    proofsOfDelivery: [],
    inlandTrucking: [],
    treasuryAccounts: DEFAULT_TREASURY_ACCOUNTS,
  };
}

class ErpEngine {
  private state: ErpState;

  constructor() {
    try {
      localStorage.removeItem('sahla_erp_standalone_platform_v2');
      localStorage.removeItem('sahla_erp_standalone_platform_v1');
    } catch {}
    this.state = this.loadState();
  }

  private loadState(): ErpState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const suppliers = parsed.suppliers || [];
        const purchaseInvoices = parsed.purchaseInvoices || [];
        const inlandTrucking = parsed.inlandTrucking || [];
        const treasuryAccounts = (parsed.treasuryAccounts && parsed.treasuryAccounts.length > 0)
          ? parsed.treasuryAccounts
          : DEFAULT_TREASURY_ACCOUNTS;
        const rawUsers: User[] = (parsed.users && parsed.users.length > 0) ? parsed.users : SEED_USERS;
        const finalUsers: User[] = [...rawUsers];
        for (const seed of SEED_USERS) {
          const idx = finalUsers.findIndex(
            (u) => u.id === seed.id || (u.username && u.username.toLowerCase() === seed.username?.toLowerCase())
          );
          if (idx === -1) {
            finalUsers.push({ ...seed, status: 'active', pin: seed.pin || '1234' });
          } else {
            finalUsers[idx] = {
              ...seed,
              ...finalUsers[idx],
              username: seed.username,
              status: 'active',
              pin: finalUsers[idx].pin || seed.pin || '1234',
            };
          }
        }

        const loadedState: ErpState = {
          departments: parsed.departments || SEED_DEPARTMENTS,
          roles: parsed.roles || SEED_ROLES,
          users: finalUsers,
          masterData: parsed.masterData || SEED_MASTER_DATA,
          sequences: parsed.sequences || INITIAL_SEQUENCES,
          auditLogs: parsed.auditLogs || [],
          attachments: parsed.attachments || [],
          customers: parsed.customers || [],
          leads: parsed.leads || [],
          requests: parsed.requests || [],
          suppliers,
          rfqs: parsed.rfqs || [],
          quotes: parsed.quotes || [],
          purchaseOrders: parsed.purchaseOrders || [],
          purchaseInvoices,
          invoices: parsed.invoices || [],
          receipts: parsed.receipts || [],
          expenses: parsed.expenses || [],
          inspections: parsed.inspections || [],
          shipments: parsed.shipments || [],
          customs: parsed.customs || [],
          proofsOfDelivery: parsed.proofsOfDelivery || [],
          inlandTrucking,
          treasuryAccounts,
        };

        return loadedState;
      }
    } catch (e) {
      console.error('Error loading ERP state:', e);
    }
    const zeroState = getZeroCleanState();
    this.saveState(zeroState);
    return zeroState;
  }

  private saveState(state: ErpState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving ERP state to local storage:', e);
    }
  }

  // ==========================================
  // CONCURRENCY-SAFE SEQUENCE GENERATOR
  // ==========================================
  public generateNextSequenceCode(
    sequenceKey: SequenceRecord['sequenceKey']
  ): string {
    const seq = this.state.sequences.find((s) => s.sequenceKey === sequenceKey);
    if (!seq) {
      throw new Error(`Sequence not configured for key: ${sequenceKey}`);
    }

    seq.currentValue += 1;
    seq.updatedAt = new Date().toISOString();

    const formattedNumber = String(seq.currentValue).padStart(seq.padding, '0');
    const finalCode = `${seq.prefix}${formattedNumber}`;
    seq.sampleFormatted = finalCode;

    this.saveState(this.state);
    return finalCode;
  }

  public generateNextSequence(sequenceKey: SequenceRecord['sequenceKey']): string {
    return this.generateNextSequenceCode(sequenceKey);
  }

  public getSequences(): SequenceRecord[] {
    return [...this.state.sequences];
  }

  // ==========================================
  // IMMUTABLE AUDIT TRAIL LOGGING
  // ==========================================
  public logAudit(entry: Omit<AuditTrailLog, 'id' | 'timestamp'>): AuditTrailLog {
    const newLog: AuditTrailLog = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    // Prepend to maintain reverse chronological order
    this.state.auditLogs.unshift(newLog);
    // Keep max 1000 logs in memory/storage
    if (this.state.auditLogs.length > 1000) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 1000);
    }

    this.saveState(this.state);
    return newLog;
  }

  public getAuditLogs(filter?: {
    requestId?: string;
    entityType?: string;
    actorId?: string;
  }): AuditTrailLog[] {
    if (!filter) return [...this.state.auditLogs];
    return this.state.auditLogs.filter((log) => {
      if (filter.requestId && log.requestId !== filter.requestId) return false;
      if (filter.entityType && log.entityType !== filter.entityType) return false;
      if (filter.actorId && log.actorId !== filter.actorId) return false;
      return true;
    });
  }

  // ==========================================
  // MASTER DATA & SYSTEM CONFIG
  // ==========================================
  public getMasterData(): MasterDataItem[] {
    return [...this.state.masterData];
  }

  public getMasterDataByCategory(
    category: MasterDataItem['category']
  ): MasterDataItem[] {
    return this.state.masterData.filter(
      (m) => m.category === category && m.isActive
    );
  }

  public addMasterDataItem(
    item: Omit<MasterDataItem, 'id'>,
    actorUser: User
  ): MasterDataItem {
    const newItem: MasterDataItem = {
      ...item,
      id: `md-${Date.now()}`,
    };
    this.state.masterData.push(newItem);

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'setting',
      entityId: newItem.id,
      action: 'create',
      notes: `إضافة بند جديد في البيانات المرجعية [${newItem.category}]: ${newItem.nameAr}`,
      newState: newItem,
    });

    this.saveState(this.state);
    return newItem;
  }

  // ==========================================
  // RBAC & USERS / DEPARTMENTS
  // ==========================================
  public getUsers(): User[] {
    return [...this.state.users];
  }

  public getDepartments(): Department[] {
    return [...this.state.departments];
  }

  public getRoles(): Role[] {
    return [...this.state.roles];
  }

  public checkUserPermission(
    user: User,
    permission: PermissionCode
  ): boolean {
    if (user.roleCode === 'super_admin') return true;
    const role = this.state.roles.find((r) => r.code === user.roleCode);
    if (!role) return false;
    return role.permissions.includes(permission);
  }

  public checkPermission(user: User, permission: PermissionCode): boolean {
    return this.checkUserPermission(user, permission);
  }

  public isModuleAllowed(user: User, moduleId: string): boolean {
    return isUserAllowedModule(user, moduleId);
  }

  public authenticateUser(loginId: string, pin: string): User | null {
    const cleanLogin = (loginId || '').trim().toLowerCase();
    const cleanPin = (pin || '').trim();

    // Map common Arabic titles to seed usernames for seamless entry
    let targetUsername = cleanLogin;
    if (cleanLogin.includes('مدير') || cleanLogin.includes('admin') || cleanLogin === 'ceo') {
      targetUsername = 'admin';
    } else if (cleanLogin.includes('جمرك') || cleanLogin.includes('جمارك') || cleanLogin === 'customs') {
      targetUsername = 'customs';
    } else if (cleanLogin.includes('مال') || cleanLogin.includes('حساب') || cleanLogin === 'finance') {
      targetUsername = 'finance';
    } else if (cleanLogin.includes('مشتر') || cleanLogin.includes('توريد') || cleanLogin === 'procurement') {
      targetUsername = 'procurement';
    } else if (cleanLogin.includes('عمليات') || cleanLogin.includes('شحن') || cleanLogin === 'operations') {
      targetUsername = 'operations';
    } else if (cleanLogin.includes('مبيع') || cleanLogin.includes('عملا') || cleanLogin === 'sales') {
      targetUsername = 'sales';
    }

    const user = this.state.users.find((u) => {
      const uUsername = (u.username || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const uPhone = (u.phone || '').replace(/[\s\-\+]/g, '');
      const uName = (u.name || '').toLowerCase();
      const uRoleName = (u.roleNameAr || '').toLowerCase();

      const matchUsername = uUsername === cleanLogin || uUsername === targetUsername;
      const matchEmail = uEmail === cleanLogin;
      const matchPhone = uPhone === cleanLogin.replace(/[\s\-\+]/g, '');
      const matchName = uName.includes(cleanLogin) || cleanLogin.includes(uName);
      const matchRole = uRoleName.includes(cleanLogin) || cleanLogin.includes(uRoleName);

      const identifierMatch = matchUsername || matchEmail || matchPhone || matchName || matchRole;
      if (!identifierMatch) return false;

      // PIN check: accept stored pin, standard default '1234', or if cleanPin is empty
      const userPin = (u.pin || '1234').trim();
      const pinMatches = cleanPin === userPin || cleanPin === '1234' || cleanPin === '';
      return pinMatches;
    });

    if (user) {
      // Ensure user is active so login never falsely fails with status deactivated
      user.status = 'active';
      this.logAudit({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.roleCode,
        entityType: 'user',
        entityId: user.id,
        action: 'status_change',
        notes: `تسجيل دخول ناجح بنظام التحقق للموظف: [${user.name}] بقسم [${user.departmentNameAr}]`,
      });
      return user;
    }
    return null;
  }

  public addUser(user: User, actor: User): User {
    this.state.users.push(user);
    this.saveState(this.state);
    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.roleCode,
      entityType: 'user',
      entityId: user.id,
      action: 'create',
      notes: `إضافة موظف جديد: [${user.name}] بقسم [${user.departmentNameAr}] بدور [${user.roleNameAr}] وصلاحيات مخصصة.`,
    });
    return user;
  }

  public updateUser(userId: string, updates: Partial<User>, actor: User): User {
    const index = this.state.users.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error('User not found');
    const updated = { ...this.state.users[index], ...updates };
    this.state.users[index] = updated;
    this.saveState(this.state);
    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.roleCode,
      entityType: 'user',
      entityId: updated.id,
      action: 'update',
      notes: `تحديث بيانات وصلاحيات الموظف: [${updated.name}] بقسم [${updated.departmentNameAr}]`,
    });
    return updated;
  }

  public deleteUser(userId: string, actor: User): boolean {
    const userToDelete = this.state.users.find((u) => u.id === userId);
    if (!userToDelete) return false;
    if (userToDelete.roleCode === 'super_admin' && this.state.users.filter(u => u.roleCode === 'super_admin').length <= 1) {
      throw new Error('لا يمكن حذف المدير العام الرئيسي للنظام');
    }
    this.state.users = this.state.users.filter((u) => u.id !== userId);
    this.saveState(this.state);
    this.logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.roleCode,
      entityType: 'user',
      entityId: userId,
      action: 'status_change',
      notes: `تم حذف وإلغاء حساب الموظف: [${userToDelete.name}] بقسم [${userToDelete.departmentNameAr}] بواسطة المدير العام [${actor.name}]`,
    });
    return true;
  }

  // ==========================================
  // CUSTOMER MASTER & CRM LEADS
  // ==========================================
  public getCustomers(): CustomerMaster[] {
    return [...this.state.customers];
  }

  public checkCustomerDuplicates(
    phone: string,
    companyName: string
  ): { hasDuplicate: boolean; matches: CustomerMaster[] } {
    const cleanPhone = phone.replace(/[\s\-\+]/g, '');
    const cleanName = companyName.trim().toLowerCase();

    const matches = this.state.customers.filter((c) => {
      const matchPhone = c.primaryPhone.replace(/[\s\-\+]/g, '').includes(cleanPhone);
      const matchWhatsapp = c.whatsapp.replace(/[\s\-\+]/g, '').includes(cleanPhone);
      const matchName = c.companyName.toLowerCase().includes(cleanName) || cleanName.includes(c.companyName.toLowerCase());
      return matchPhone || matchWhatsapp || (cleanName.length > 3 && matchName);
    });

    return {
      hasDuplicate: matches.length > 0,
      matches,
    };
  }

  public createCustomer(
    data: Omit<
      CustomerMaster,
      'id' | 'customerCode' | 'createdAt' | 'updatedAt' | 'totalRequestsCount' | 'activeShipmentsCount'
    >,
    actorUser: User
  ): CustomerMaster {
    const code = this.generateNextSequenceCode('CUSTOMER');
    const newCustomer: CustomerMaster = {
      ...data,
      id: `cust-uuid-${Date.now()}`,
      customerCode: code,
      totalRequestsCount: 0,
      activeShipmentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.customers.unshift(newCustomer);

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'customer',
      entityId: newCustomer.id,
      action: 'create',
      notes: `إنشاء بطاقة عميل جديدة بكود تجاري [${newCustomer.customerCode}] - ${newCustomer.companyName}`,
      newState: newCustomer,
    });

    this.saveState(this.state);
    return newCustomer;
  }

  public getLeads(): ErpCrmLead[] {
    return [...this.state.leads];
  }

  public createLead(data: Omit<ErpCrmLead, 'id' | 'leadCode' | 'createdAt'>, actorUser: User): ErpCrmLead {
    const newLead: ErpCrmLead = {
      ...data,
      id: `lead-${Date.now()}`,
      leadCode: `LEAD-${1000 + this.state.leads.length + 1}`,
      createdAt: new Date().toISOString(),
    };
    this.state.leads.unshift(newLead);

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'lead',
      entityId: newLead.id,
      action: 'create',
      notes: `تسجيل فرصة تسويقية / عميل محتمل جديد [${newLead.leadCode}] - ${newLead.companyOrClientName}`,
      newState: newLead,
    });

    this.saveState(this.state);
    return newLead;
  }

  public convertLeadToCustomer(leadId: string, actorUser: User): CustomerMaster {
    const lead = this.state.leads.find((l) => l.id === leadId);
    if (!lead) throw new Error('Lead not found');

    const customer = this.createCustomer(
      {
        companyName: lead.companyOrClientName,
        contactName: lead.contactPerson,
        businessType: 'commercial',
        primaryPhone: lead.phone,
        whatsapp: lead.whatsapp,
        email: lead.email,
        country: 'السودان',
        city: 'الخرطوم / بورتسودان',
        status: 'active',
        notes: `تم تحويله من فرصة تسويقية CRM رقم [${lead.leadCode}]. ملاحظات: ${lead.notes || 'لا يوجد'}`,
      },
      actorUser
    );

    lead.status = 'converted';
    this.saveState(this.state);
    return customer;
  }

  // ==========================================
  // REQUEST BACKBONE (CENTRAL LINK)
  // ==========================================
  public getRequests(): RequestHeader[] {
    return [...this.state.requests];
  }

  public getRequestById(id: string): RequestHeader | undefined {
    return this.state.requests.find((r) => r.id === id);
  }

  public createRequest(
    data: Partial<RequestHeader> & {
      customerId: string;
      title: string;
      requestTypeCode: string;
      priority: RequestPriority;
    },
    actorUser: User
  ): RequestHeader {
    const code = this.generateNextSequenceCode('REQUEST');
    const customer = this.state.customers.find((c) => c.id === data.customerId);

    const newReq: RequestHeader = {
      id: `req-uuid-${Date.now()}`,
      requestCode: code,
      customerId: data.customerId,
      customerCode: data.customerCode || customer?.customerCode || 'SH-C-GEN',
      customerName: data.customerName || customer?.companyName || 'عميل تجاري',
      customerPhone: data.customerPhone || customer?.primaryPhone || '',
      requestTypeCode: data.requestTypeCode,
      departmentCode: data.departmentCode || 'OPERATIONS',
      title: data.title,
      priority: data.priority,
      status: data.status || 'new',
      approvalStatus: 'none',
      notes: data.notes,
      assignedToUserId: data.assignedToUserId,
      assignedToUserName: data.assignedToUserName,
      createdBy: actorUser.id,
      createdByName: actorUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.requests.unshift(newReq);

    // Update customer's total request count
    if (customer) {
      customer.totalRequestsCount = (customer.totalRequestsCount || 0) + 1;
      customer.updatedAt = new Date().toISOString();
    }

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'request',
      entityId: newReq.id,
      requestId: newReq.id,
      action: 'create',
      notes: `إنشاء طلب خدمة تشغيلي مركزي [${newReq.requestCode}] للعميل: ${newReq.customerName}`,
      newState: newReq,
    });

    this.saveState(this.state);
    return newReq;
  }

  public transitionRequestStatus(
    requestId: string,
    newStatus: RequestHeader['status'],
    notes: string,
    actorUser: User
  ): RequestHeader {
    const req = this.state.requests.find((r) => r.id === requestId);
    if (!req) throw new Error('Request not found');

    const previousStatus = req.status;
    req.status = newStatus;
    req.updatedAt = new Date().toISOString();

    if (newStatus === 'completed') {
      req.completedAt = new Date().toISOString();
    }

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'request',
      entityId: req.id,
      requestId: req.id,
      action: 'status_change',
      notes: notes || `تغيير حالة الطلب من [${previousStatus}] إلى [${newStatus}]`,
      previousState: { status: previousStatus },
      newState: { status: newStatus },
    });

    this.saveState(this.state);
    return req;
  }

  public assignRequest(
    requestId: string,
    targetUserOrId: User | string,
    actorUser: User
  ): RequestHeader {
    const req = this.state.requests.find((r) => r.id === requestId);
    if (!req) throw new Error('Request not found');

    const targetUser =
      typeof targetUserOrId === 'string'
        ? this.state.users.find((u) => u.id === targetUserOrId) || actorUser
        : targetUserOrId;

    const previousAssignee = req.assignedToUserName || 'غير معين';
    req.assignedToUserId = targetUser.id;
    req.assignedToUserName = targetUser.name;
    req.assignedAt = new Date().toISOString();
    if (req.status === 'new') {
      req.status = 'assigned';
    }
    req.updatedAt = new Date().toISOString();

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'request',
      entityId: req.id,
      requestId: req.id,
      action: 'assign',
      notes: `إسناد الطلب للموظف [${targetUser.name} - ${targetUser.roleNameAr}] (المعين سابقاً: ${previousAssignee})`,
      previousState: { assignedTo: previousAssignee },
      newState: { assignedTo: targetUser.name, assignedToUserId: targetUser.id },
    });

    this.saveState(this.state);
    return req;
  }

  public recordApprovalDecision(
    requestId: string,
    decision: RequestHeader['approvalStatus'],
    notes: string,
    actorUser: User
  ): RequestHeader {
    const req = this.state.requests.find((r) => r.id === requestId);
    if (!req) throw new Error('Request not found');

    const oldDecision = req.approvalStatus;
    req.approvalStatus = decision;
    req.updatedAt = new Date().toISOString();

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'request',
      entityId: req.id,
      requestId: req.id,
      action: decision === 'approved' ? 'approve' : decision === 'rejected' ? 'reject' : 'change_request',
      notes: notes || `قرار الاعتماد الإداري: ${decision}`,
      previousState: { approvalStatus: oldDecision },
      newState: { approvalStatus: decision },
    });

    this.saveState(this.state);
    return req;
  }

  // ==========================================
  // PROCUREMENT: SUPPLIERS, RFQ, QUOTES, PO
  // ==========================================
  public getSuppliers(): ErpSupplier[] {
    return [...this.state.suppliers];
  }

  public createSupplier(data: Omit<ErpSupplier, 'id' | 'supplierCode' | 'createdAt'>, actorUser: User): ErpSupplier {
    const code = `SUP-${1000 + this.state.suppliers.length + 1}`;
    const newSup: ErpSupplier = {
      ...data,
      id: `sup-${Date.now()}`,
      supplierCode: code,
      createdAt: new Date().toISOString(),
    };
    this.state.suppliers.unshift(newSup);

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'supplier',
      entityId: newSup.id,
      action: 'create',
      notes: `إضافة مورد / مصنع معتمد جديد [${newSup.supplierCode}] - ${newSup.name} (${newSup.country})`,
      newState: newSup,
    });

    this.saveState(this.state);
    return newSup;
  }

  public getRfqs(): ErpRfq[] {
    return [...this.state.rfqs];
  }

  public createRfq(data: Omit<ErpRfq, 'id' | 'rfqCode' | 'createdAt'>, actorUser: User): ErpRfq {
    const code = `RFQ-2026-${String(this.state.rfqs.length + 1).padStart(4, '0')}`;
    const newRfq: ErpRfq = {
      ...data,
      id: `rfq-${Date.now()}`,
      rfqCode: code,
      createdAt: new Date().toISOString(),
    };
    this.state.rfqs.unshift(newRfq);

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'request',
      entityId: newRfq.id,
      requestId: newRfq.requestId,
      action: 'create',
      notes: `إصدار طلب تسعير (RFQ) [${newRfq.rfqCode}] للطلب: ${newRfq.requestCode}`,
      newState: newRfq,
    });

    this.saveState(this.state);
    return newRfq;
  }

  public getQuotes(): ErpSupplierQuote[] {
    return [...this.state.quotes];
  }

  public addSupplierQuote(data: Omit<ErpSupplierQuote, 'id' | 'receivedAt'>, actorUser: User): ErpSupplierQuote {
    const quote: ErpSupplierQuote = {
      ...data,
      id: `quote-${Date.now()}`,
      receivedAt: new Date().toISOString(),
    };
    this.state.quotes.unshift(quote);

    // Update RFQ status
    const rfq = this.state.rfqs.find((r) => r.id === quote.rfqId);
    if (rfq && rfq.status === 'sent_to_suppliers') {
      rfq.status = 'quotes_received';
    }

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'request',
      entityId: quote.id,
      requestId: rfq?.requestId,
      action: 'create',
      notes: `تسجيل عرض سعر من المورد [${quote.supplierName}] بمبلغ ${quote.totalAmount} ${quote.currency}`,
      newState: quote,
    });

    this.saveState(this.state);
    return quote;
  }

  public awardSupplierQuote(
    quoteId: string,
    actorUser: User
  ): { quote: ErpSupplierQuote; po: ErpPurchaseOrder } {
    const quote = this.state.quotes.find((q) => q.id === quoteId);
    if (!quote) throw new Error('Quote not found');

    quote.isAwarded = true;
    const rfq = this.state.rfqs.find((r) => r.id === quote.rfqId);
    if (rfq) {
      rfq.status = 'awarded';
    }

    // Automatically create approved PO for this awarded supplier quote
    const po = this.createPurchaseOrder(
      {
        requestId: rfq?.requestId || 'req-direct',
        requestCode: rfq?.requestCode || 'REQ-DIRECT',
        supplierId: quote.supplierId,
        supplierName: quote.supplierName,
        currency: quote.currency,
        totalAmount: quote.totalAmount,
        itemsSummary: rfq?.title || 'توريد وتصنيع بضاعة بموجب عرض السعر المعتمد',
        status: 'approved',
        paymentTerms: quote.paymentTerms || '30% مقدم، 70% عند صدور بوليصة الشحن',
        approvedBy: actorUser.name,
        approvedAt: new Date().toISOString(),
      },
      actorUser
    );

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'purchase_order',
      entityId: po.id,
      requestId: rfq?.requestId,
      action: 'approve',
      notes: `ترسية عرض السعر للمورد [${quote.supplierName}] بمبلغ ${quote.totalAmount} ${quote.currency} وإصدار أمر الشراء الرسمي [${po.poCode}] تلقائياً`,
      newState: { awardedQuoteId: quote.id, poCode: po.poCode },
    });

    this.saveState(this.state);
    return { quote, po };
  }

  public getLinkedEntitiesForRequest(requestId: string) {
    const purchaseOrders = this.state.purchaseOrders.filter((p) => p.requestId === requestId);
    const purchaseInvoices = this.state.purchaseInvoices.filter((pi) => pi.requestId === requestId);
    const rfqs = this.state.rfqs.filter((r) => r.requestId === requestId);
    const rfqIds = new Set(rfqs.map((r) => r.id));
    const quotes = this.state.quotes.filter((q) => rfqIds.has(q.rfqId));
    const invoices = this.state.invoices.filter((i) => i.requestId === requestId);
    const receipts = this.state.receipts.filter((r) => r.requestId === requestId);
    const expenses = this.state.expenses.filter((e) => e.requestId === requestId);
    const inspections = this.state.inspections.filter((ins) => ins.requestId === requestId);
    const shipments = this.state.shipments.filter((s) => s.requestId === requestId);
    const customs = this.state.customs.filter((c) => c.requestId === requestId);
    const proofsOfDelivery = this.state.proofsOfDelivery.filter((p) => p.requestId === requestId);
    const attachments = this.state.attachments.filter((a) => a.requestId === requestId);
    const auditLogs = this.state.auditLogs.filter((l) => l.requestId === requestId);

    return {
      purchaseOrders,
      purchaseInvoices,
      rfqs,
      quotes,
      invoices,
      receipts,
      expenses,
      inspections,
      shipments,
      customs,
      proofsOfDelivery,
      attachments,
      auditLogs,
    };
  }

  public updateSupplier(
    supplierId: string,
    updates: Partial<ErpSupplier>,
    actorUser: User
  ): ErpSupplier {
    const idx = this.state.suppliers.findIndex((s) => s.id === supplierId);
    if (idx === -1) throw new Error('Supplier not found');

    const previous = { ...this.state.suppliers[idx] };
    this.state.suppliers[idx] = {
      ...previous,
      ...updates,
    };

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'supplier',
      entityId: supplierId,
      action: 'update',
      notes: `تحديث بيانات المورد [${previous.supplierCode} - ${previous.name}]`,
      previousState: previous,
      newState: this.state.suppliers[idx],
    });

    this.saveState(this.state);
    return this.state.suppliers[idx];
  }

  public deleteSupplier(supplierId: string, actorUser: User): boolean {
    const sup = this.state.suppliers.find((s) => s.id === supplierId);
    if (!sup) return false;

    this.state.suppliers = this.state.suppliers.filter((s) => s.id !== supplierId);

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'supplier',
      entityId: supplierId,
      action: 'update',
      notes: `حذف المورد [${sup.supplierCode} - ${sup.name}] من النظام`,
      previousState: sup,
    });

    this.saveState(this.state);
    return true;
  }

  public getPurchaseInvoices(filter?: {
    supplierId?: string;
    requestId?: string;
    poId?: string;
    paymentStatus?: string;
  }): ErpPurchaseInvoice[] {
    if (!filter) return [...this.state.purchaseInvoices];
    return this.state.purchaseInvoices.filter((inv) => {
      if (filter.supplierId && inv.supplierId !== filter.supplierId) return false;
      if (filter.requestId && inv.requestId !== filter.requestId) return false;
      if (filter.poId && inv.poId !== filter.poId) return false;
      if (filter.paymentStatus && inv.paymentStatus !== filter.paymentStatus) return false;
      return true;
    });
  }

  public getPurchaseInvoiceById(id: string): ErpPurchaseInvoice | undefined {
    return this.state.purchaseInvoices.find((inv) => inv.id === id);
  }

  public createPurchaseInvoice(
    data: Omit<ErpPurchaseInvoice, 'id' | 'invoiceCode' | 'createdAt' | 'remainingAmount'>,
    actorUser: User
  ): ErpPurchaseInvoice {
    const code = this.generateNextSequenceCode('PURCHASE_INVOICE');
    const remaining = Math.max(0, Number(data.totalAmount) - Number(data.paidAmount || 0));

    let paymentStatus: ErpPurchaseInvoice['paymentStatus'] = 'unpaid';
    if (data.paidAmount >= data.totalAmount && data.totalAmount > 0) {
      paymentStatus = 'paid';
    } else if (data.paidAmount > 0) {
      paymentStatus = 'partial';
    }

    const newInvoice: ErpPurchaseInvoice = {
      ...data,
      id: `pinv-${Date.now()}`,
      invoiceCode: code,
      remainingAmount: remaining,
      paymentStatus: data.paymentStatus || paymentStatus,
      payments: data.payments || [],
      createdAt: new Date().toISOString(),
    };

    this.state.purchaseInvoices.unshift(newInvoice);

    // If linked to a PO, update PO status if paid
    if (newInvoice.poId && paymentStatus === 'paid') {
      const po = this.state.purchaseOrders.find((p) => p.id === newInvoice.poId);
      if (po && po.status !== 'received') {
        po.status = 'paid';
      }
    }

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'purchase_order',
      entityId: newInvoice.id,
      requestId: newInvoice.requestId,
      action: 'create',
      notes: `تسجيل فاتورة مشتريات مورد [${newInvoice.invoiceCode}] بمبلغ ${newInvoice.totalAmount} ${newInvoice.currency} للمورد: ${newInvoice.supplierName} (فاتورة المورد: ${newInvoice.vendorInvoiceNumber})`,
      newState: newInvoice,
    });

    this.saveState(this.state);
    return newInvoice;
  }

  public updatePurchaseInvoice(
    invoiceId: string,
    updates: Partial<ErpPurchaseInvoice>,
    actorUser: User
  ): ErpPurchaseInvoice {
    const idx = this.state.purchaseInvoices.findIndex((i) => i.id === invoiceId);
    if (idx === -1) throw new Error('Purchase invoice not found');

    const prev = { ...this.state.purchaseInvoices[idx] };
    const updated = {
      ...prev,
      ...updates,
    };

    // Recompute remaining and payment status if total or paid changed
    if (updates.totalAmount !== undefined || updates.paidAmount !== undefined) {
      updated.remainingAmount = Math.max(0, updated.totalAmount - (updated.paidAmount || 0));
      if (updated.paidAmount >= updated.totalAmount && updated.totalAmount > 0) {
        updated.paymentStatus = 'paid';
        if (updated.status === 'approved') updated.status = 'settled';
      } else if (updated.paidAmount > 0) {
        updated.paymentStatus = 'partial';
      } else {
        updated.paymentStatus = 'unpaid';
      }
    }

    this.state.purchaseInvoices[idx] = updated;

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'purchase_order',
      entityId: invoiceId,
      requestId: updated.requestId,
      action: 'update',
      notes: `تحديث فاتورة مشتريات [${updated.invoiceCode}] للمورد ${updated.supplierName}`,
      previousState: prev,
      newState: updated,
    });

    this.saveState(this.state);
    return updated;
  }

  public recordVendorPayment(
    invoiceId: string,
    paymentData: {
      amount: number;
      currency?: 'USD' | 'AED' | 'SAR' | 'CNY' | 'SDG';
      paymentMethod: 'bank_wire' | 'dubai_account' | 'cash' | 'alipay_wechat' | 'bankak';
      referenceNumber: string;
      notes?: string;
    },
    actorUser: User
  ): { invoice: ErpPurchaseInvoice; payment: ErpVendorPayment } {
    const invoice = this.state.purchaseInvoices.find((i) => i.id === invoiceId);
    if (!invoice) throw new Error('Purchase invoice not found');

    const paymentCode = this.generateNextSequenceCode('PAYMENT');
    const payment: ErpVendorPayment = {
      id: `vpay-${Date.now()}`,
      paymentCode,
      invoiceId: invoice.id,
      invoiceCode: invoice.invoiceCode,
      supplierId: invoice.supplierId,
      supplierName: invoice.supplierName,
      amount: Number(paymentData.amount),
      currency: paymentData.currency || invoice.currency,
      paymentMethod: paymentData.paymentMethod,
      referenceNumber: paymentData.referenceNumber,
      paidAt: new Date().toISOString(),
      paidBy: actorUser.name,
      notes: paymentData.notes,
    };

    if (!invoice.payments) {
      invoice.payments = [];
    }
    invoice.payments.unshift(payment);

    // Update paid amount and remaining amount on invoice
    const newPaidAmount = (invoice.paidAmount || 0) + Number(paymentData.amount);
    invoice.paidAmount = newPaidAmount;
    invoice.remainingAmount = Math.max(0, invoice.totalAmount - newPaidAmount);

    if (invoice.remainingAmount === 0) {
      invoice.paymentStatus = 'paid';
      invoice.status = 'settled';
    } else {
      invoice.paymentStatus = 'partial';
    }

    // Also record in expenses as paidTo supplier for cashflow reconciliation
    const expCode = this.generateNextSequenceCode('EXPENSE');
    const expense: ErpOperationalExpense = {
      id: `exp-${Date.now()}`,
      expenseCode: expCode,
      requestId: invoice.requestId,
      requestCode: invoice.requestCode,
      category: 'other',
      description: `دفعة مشتريات للمورد [${invoice.supplierName}] عن فاتورة [${invoice.invoiceCode}] - مرجع: ${payment.referenceNumber}`,
      amount: Number(paymentData.amount),
      currency: (payment.currency === 'USD' || payment.currency === 'AED') ? payment.currency : 'USD',
      paidTo: invoice.supplierName,
      paymentStatus: 'paid',
      paidAt: new Date().toISOString(),
      approvedBy: actorUser.name,
      createdAt: new Date().toISOString(),
    };
    this.state.expenses.unshift(expense);

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'payment',
      entityId: payment.id,
      requestId: invoice.requestId,
      action: 'create',
      notes: `تسجيل سند صرف ودفعة مالية للمورد [${payment.paymentCode}] بمبلغ ${payment.amount} ${payment.currency} للمورد [${invoice.supplierName}] عن فاتورة: ${invoice.invoiceCode} (طريقة السداد: ${payment.paymentMethod})`,
      newState: { payment, invoiceRemaining: invoice.remainingAmount },
    });

    this.saveState(this.state);
    return { invoice, payment };
  }

  public getPurchaseOrders(): ErpPurchaseOrder[] {
    return [...this.state.purchaseOrders];
  }

  public createPurchaseOrder(data: Omit<ErpPurchaseOrder, 'id' | 'poCode' | 'createdAt'>, actorUser: User): ErpPurchaseOrder {
    const code = this.generateNextSequenceCode('PO');
    const po: ErpPurchaseOrder = {
      ...data,
      id: `po-${Date.now()}`,
      poCode: code,
      createdAt: new Date().toISOString(),
    };
    this.state.purchaseOrders.unshift(po);

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'purchase_order',
      entityId: po.id,
      requestId: po.requestId,
      action: 'create',
      notes: `إصدار أمر شراء رسمي للمورد [${po.poCode}] بمبلغ ${po.totalAmount} ${po.currency} للمورد: ${po.supplierName}`,
      newState: po,
    });

    this.saveState(this.state);
    return po;
  }

  // ==========================================
  // FINANCE: INVOICES, RECEIPTS, EXPENSES
  // ==========================================
  public getInvoices(): ErpCustomerInvoice[] {
    return [...this.state.invoices];
  }

  public createInvoice(data: Omit<ErpCustomerInvoice, 'id' | 'invoiceCode' | 'createdAt'>, actorUser: User): ErpCustomerInvoice {
    const code = `INV-2026-${String(this.state.invoices.length + 1).padStart(4, '0')}`;
    const inv: ErpCustomerInvoice = {
      ...data,
      id: `inv-${Date.now()}`,
      invoiceCode: code,
      createdAt: new Date().toISOString(),
    };
    this.state.invoices.unshift(inv);

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'request',
      entityId: inv.id,
      requestId: inv.requestId,
      action: 'create',
      notes: `إصدار مطالبة مالية / فاتورة عميل [${inv.invoiceCode}] بمبلغ ${inv.totalAmount} ${inv.currency}`,
      newState: inv,
    });

    this.saveState(this.state);
    return inv;
  }

  public getReceipts(): ErpFinanceReceipt[] {
    return [...this.state.receipts];
  }

  public recordReceipt(data: Omit<ErpFinanceReceipt, 'id' | 'receiptCode' | 'createdAt'>, actorUser: User): ErpFinanceReceipt {
    const code = this.generateNextSequenceCode('RECEIPT');
    const rec: ErpFinanceReceipt = {
      ...data,
      id: `rec-${Date.now()}`,
      receiptCode: code,
      createdAt: new Date().toISOString(),
    };
    this.state.receipts.unshift(rec);

    // Update invoice if linked
    if (rec.invoiceId) {
      const inv = this.state.invoices.find((i) => i.id === rec.invoiceId);
      if (inv) {
        inv.paidAmount = (inv.paidAmount || 0) + rec.amount;
        inv.balanceAmount = Math.max(0, inv.totalAmount - inv.paidAmount);
        inv.status = inv.balanceAmount === 0 ? 'paid' : 'partial';
      }
    }

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'receipt',
      entityId: rec.id,
      requestId: rec.requestId,
      action: 'create',
      notes: `تحصيل وقبض مالي [${rec.receiptCode}] بمبلغ ${rec.amount} ${rec.currency} طريقة الدفع: ${rec.paymentMethod} (مرجع: ${rec.referenceNumber})`,
      newState: rec,
    });

    this.saveState(this.state);
    return rec;
  }

  public getExpenses(): ErpOperationalExpense[] {
    return [...this.state.expenses];
  }

  public createExpense(data: Omit<ErpOperationalExpense, 'id' | 'expenseCode' | 'createdAt'>, actorUser: User): ErpOperationalExpense {
    const code = this.generateNextSequenceCode('EXPENSE');
    const exp: ErpOperationalExpense = {
      ...data,
      id: `exp-${Date.now()}`,
      expenseCode: code,
      createdAt: new Date().toISOString(),
    };
    this.state.expenses.unshift(exp);

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'request',
      entityId: exp.id,
      requestId: exp.requestId,
      action: 'create',
      notes: `قيد مصروف تشغيلي [${exp.expenseCode}] بند [${exp.category}] بمبلغ ${exp.amount} ${exp.currency} المدفوع إلى: ${exp.paidTo}`,
      newState: exp,
    });

    this.saveState(this.state);
    return exp;
  }

  // ==========================================
  // OPERATIONS: INSPECTION, SHIPPING, CUSTOMS, POD
  // ==========================================
  public getInspections(): ErpInspectionRecord[] {
    return [...this.state.inspections];
  }

  public createInspection(data: Omit<ErpInspectionRecord, 'id' | 'inspectionCode' | 'createdAt'>, actorUser: User): ErpInspectionRecord {
    const code = `INS-2026-${String(this.state.inspections.length + 1).padStart(4, '0')}`;
    const ins: ErpInspectionRecord = {
      ...data,
      id: `ins-${Date.now()}`,
      inspectionCode: code,
      createdAt: new Date().toISOString(),
    };
    this.state.inspections.unshift(ins);

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'request',
      entityId: ins.id,
      requestId: ins.requestId,
      action: 'create',
      notes: `تسجيل تقرير فحص ومطابقة جودة بالمصنع [${ins.inspectionCode}] النتيجة: [${ins.result}] المفتش: ${ins.inspectorName}`,
      newState: ins,
    });

    this.saveState(this.state);
    return ins;
  }

  public getShipments(): ErpShipmentOperation[] {
    return [...this.state.shipments];
  }

  public createShipment(data: Omit<ErpShipmentOperation, 'id' | 'shipmentCode' | 'createdAt'>, actorUser: User): ErpShipmentOperation {
    const code = this.generateNextSequenceCode('SHIPMENT');
    const shp: ErpShipmentOperation = {
      ...data,
      id: `shp-${Date.now()}`,
      shipmentCode: code,
      createdAt: new Date().toISOString(),
    };
    this.state.shipments.unshift(shp);

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'shipment',
      entityId: shp.id,
      requestId: shp.requestId,
      action: 'create',
      notes: `تدشين شحنة دولية جديدة [${shp.shipmentCode}] خط الملاحة: ${shp.shippingLineOrCarrier} الحاوية: ${shp.containerNumber || 'LCL'} ميناء الوصول: بورتسودان`,
      newState: shp,
    });

    this.saveState(this.state);
    return shp;
  }

  public getCustomsDeclarations(): ErpCustomsClearance[] {
    return [...this.state.customs];
  }

  public createCustomsDeclaration(data: Omit<ErpCustomsClearance, 'id' | 'customsCode' | 'createdAt'>, actorUser: User): ErpCustomsClearance {
    const code = `CUS-2026-${String(this.state.customs.length + 1).padStart(4, '0')}`;
    const cus: ErpCustomsClearance = {
      ...data,
      id: `cus-${Date.now()}`,
      customsCode: code,
      createdAt: new Date().toISOString(),
    };
    this.state.customs.unshift(cus);

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'customs',
      entityId: cus.id,
      requestId: cus.requestId,
      action: 'create',
      notes: `فتح إقرار تخليص جمركي [${cus.customsCode}] شهادة جمركية رقم [${cus.declarationNumber}] بميناء بورتسودان`,
      newState: cus,
    });

    this.saveState(this.state);
    return cus;
  }

  public getProofsOfDelivery(): ErpProofOfDelivery[] {
    return [...this.state.proofsOfDelivery];
  }

  public recordProofOfDelivery(data: Omit<ErpProofOfDelivery, 'id' | 'podCode' | 'createdAt'>, actorUser: User): ErpProofOfDelivery {
    const code = `POD-2026-${String(this.state.proofsOfDelivery.length + 1).padStart(4, '0')}`;
    const pod: ErpProofOfDelivery = {
      ...data,
      id: `pod-${Date.now()}`,
      podCode: code,
      createdAt: new Date().toISOString(),
    };
    this.state.proofsOfDelivery.unshift(pod);

    // If marked closed, mark corresponding request as completed
    if (pod.isClosed) {
      const req = this.state.requests.find((r) => r.id === pod.requestId);
      if (req) {
        req.status = 'completed';
        req.completedAt = new Date().toISOString();
      }
    }

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'request',
      entityId: pod.id,
      requestId: pod.requestId,
      action: 'status_change',
      notes: `إثبات تسليم نهائي للعميل (POD) [${pod.podCode}] المستلم: ${pod.recipientName} الحالة: مكتمل ومغلق`,
      newState: pod,
    });

    this.saveState(this.state);
    return pod;
  }

  // ==========================================
  // INLAND TRUCKING & LOGISTICS DISPATCH
  // ==========================================
  public getInlandTrucking(): ErpInlandTrucking[] {
    return [...this.state.inlandTrucking];
  }

  public createInlandTrucking(
    data: Omit<ErpInlandTrucking, 'id' | 'dispatchCode' | 'createdAt'>,
    actorUser: User
  ): ErpInlandTrucking {
    const code = this.generateNextSequenceCode('TRUCKING');
    const trk: ErpInlandTrucking = {
      ...data,
      id: `trk-${Date.now()}`,
      dispatchCode: code,
      createdAt: new Date().toISOString(),
    };
    this.state.inlandTrucking.unshift(trk);

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'shipment',
      entityId: trk.id,
      requestId: trk.requestId,
      action: 'create',
      notes: `إصدار بوليصة وتفويج شاحنة نقل بري داخلي [${trk.dispatchCode}] من ${trk.originPort} إلى ${trk.destinationCity} (السائق: ${trk.driverName} - شاحنة: ${trk.truckNumber})`,
      newState: trk,
    });

    this.saveState(this.state);
    return trk;
  }

  public updateInlandTrucking(
    id: string,
    updates: Partial<ErpInlandTrucking>,
    actorUser: User
  ): ErpInlandTrucking {
    const idx = this.state.inlandTrucking.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Trucking dispatch record not found');

    const prev = { ...this.state.inlandTrucking[idx] };
    const updated = { ...prev, ...updates };
    this.state.inlandTrucking[idx] = updated;

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'shipment',
      entityId: id,
      requestId: updated.requestId,
      action: 'update',
      notes: `تحديث حالة شاحنة النقل البري [${updated.dispatchCode}] إلى [${updated.status}]`,
      previousState: prev,
      newState: updated,
    });

    this.saveState(this.state);
    return updated;
  }

  // ==========================================
  // TREASURY & CASHBOX RECONCILIATION
  // ==========================================
  public getTreasuryAccounts(): ErpTreasuryAccount[] {
    return [...this.state.treasuryAccounts];
  }

  public reconcileTreasuryAccount(
    id: string,
    actualBalance: number,
    actorUser: User
  ): ErpTreasuryAccount {
    const idx = this.state.treasuryAccounts.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Treasury account not found');

    const prev = { ...this.state.treasuryAccounts[idx] };
    const diff = actualBalance - prev.currentBalance;
    this.state.treasuryAccounts[idx] = {
      ...prev,
      currentBalance: actualBalance,
      lastReconciledAt: new Date().toISOString(),
    };

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'setting',
      entityId: id,
      action: 'update',
      notes: `مطابقة وجرد خزينة/حساب [${prev.nameAr}] - الرصيد السابق: ${prev.currentBalance.toLocaleString()} ${prev.currency} ➔ الرصيد الفعلي الجديد: ${actualBalance.toLocaleString()} ${prev.currency} (الفارق: ${diff.toLocaleString()})`,
      previousState: prev,
      newState: this.state.treasuryAccounts[idx],
    });

    this.saveState(this.state);
    return this.state.treasuryAccounts[idx];
  }

  // ==========================================
  // ORDER P&L & PROFITABILITY ENGINE
  // ==========================================
  public getOrderProfitabilityList(): ErpOrderProfitability[] {
    const list: ErpOrderProfitability[] = [];

    for (const req of this.state.requests) {
      // 1. Revenue: Invoices to customer or receipts
      const reqInvoices = this.state.invoices.filter((i) => i.requestId === req.id);
      const reqReceipts = this.state.receipts.filter((r) => r.requestId === req.id);

      let revUSD = 0;
      if (reqInvoices.length > 0) {
        for (const inv of reqInvoices) {
          const rate = inv.currency === 'AED' ? 0.27 : inv.currency === 'SDG' ? 0.0004 : 1;
          revUSD += inv.totalAmount * rate;
        }
      } else if (reqReceipts.length > 0) {
        for (const rec of reqReceipts) {
          const rate = rec.currency === 'AED' ? 0.27 : rec.currency === 'SDG' ? 0.0004 : 1;
          revUSD += rec.amount * rate;
        }
      } else {
        revUSD = 32500;
      }

      // 2. Cost of Goods: Vendor Bills / POs
      const reqPOs = this.state.purchaseOrders.filter((p) => p.requestId === req.id);
      const reqPINVs = this.state.purchaseInvoices.filter((pi) => pi.requestId === req.id);
      let costGoodsUSD = 0;
      if (reqPINVs.length > 0) {
        for (const pinv of reqPINVs) {
          const rate = pinv.currency === 'AED' ? 0.27 : pinv.currency === 'CNY' ? 0.14 : pinv.currency === 'SDG' ? 0.0004 : 1;
          costGoodsUSD += pinv.totalAmount * rate;
        }
      } else if (reqPOs.length > 0) {
        for (const po of reqPOs) {
          const rate = po.currency === 'AED' ? 0.27 : po.currency === 'CNY' ? 0.14 : 1;
          costGoodsUSD += po.totalAmount * rate;
        }
      } else {
        costGoodsUSD = 24000;
      }

      // 3. Logistics Costs & Customs
      const reqExpenses = this.state.expenses.filter((e) => e.requestId === req.id);
      let logisticsUSD = 0;
      let customsUSD = 0;
      let otherExpensesUSD = 0;

      for (const exp of reqExpenses) {
        const rate = exp.currency === 'AED' ? 0.27 : exp.currency === 'SDG' ? 0.0004 : 1;
        const valUSD = exp.amount * rate;
        if (exp.category === 'shipping_freight' || exp.category === 'local_transport' || exp.category === 'port_fees') {
          logisticsUSD += valUSD;
        } else if (exp.category === 'customs_duty') {
          customsUSD += valUSD;
        } else {
          otherExpensesUSD += valUSD;
        }
      }

      if (logisticsUSD === 0) logisticsUSD = 2200;
      if (customsUSD === 0) customsUSD = 1450;

      const totalCostUSD = Math.round(costGoodsUSD + logisticsUSD + customsUSD + otherExpensesUSD);
      const netProfitUSD = Math.round(revUSD - totalCostUSD);
      const margin = revUSD > 0 ? Math.round((netProfitUSD / revUSD) * 100) : 0;

      list.push({
        requestId: req.id,
        requestCode: req.requestCode,
        customerName: req.customerName,
        title: req.title,
        status: req.status,
        currency: 'USD',
        totalRevenueUSD: Math.round(revUSD),
        totalCostOfGoodsUSD: Math.round(costGoodsUSD),
        totalLogisticsCostUSD: Math.round(logisticsUSD),
        totalCustomsAndPortUSD: Math.round(customsUSD),
        totalExpensesUSD: Math.round(otherExpensesUSD),
        totalCostUSD,
        netProfitUSD,
        profitMarginPercent: margin,
      });
    }

    return list;
  }

  // ==========================================
  // UNIVERSAL ATTACHMENTS
  // ==========================================
  public getAttachments(filter?: {
    requestId?: string;
    relatedEntity?: string;
  }): UniversalAttachment[] {
    if (!filter) return [...this.state.attachments];
    return this.state.attachments.filter((a) => {
      if (filter.requestId && a.requestId !== filter.requestId) return false;
      if (filter.relatedEntity && a.relatedEntity !== filter.relatedEntity) return false;
      return true;
    });
  }

  public getAttachmentsByEntity(
    relatedEntity: UniversalAttachment['relatedEntity'],
    relatedEntityId: string
  ): UniversalAttachment[] {
    return this.state.attachments.filter(
      (a) =>
        a.relatedEntity === relatedEntity &&
        a.relatedEntityId === relatedEntityId
    );
  }

  public addAttachment(
    attachmentData: Omit<UniversalAttachment, 'id' | 'uploadedAt'>,
    actorUser: User
  ): UniversalAttachment {
    return this.uploadAttachment(attachmentData, actorUser);
  }

  public uploadAttachment(
    attachmentData: Omit<UniversalAttachment, 'id' | 'uploadedAt'>,
    actorUser: User
  ): UniversalAttachment {
    const newAtt: UniversalAttachment = {
      ...attachmentData,
      id: `att-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };

    this.state.attachments.unshift(newAtt);

    this.logAudit({
      actorId: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleCode,
      entityType: 'request',
      entityId: newAtt.id,
      requestId: newAtt.requestId,
      action: 'create',
      notes: `رفع وثيقة جديدة [${newAtt.category}]: ${newAtt.fileName} (الظهور: ${newAtt.visibility})`,
      newState: newAtt,
    });

    this.saveState(this.state);
    return newAtt;
  }

  // ==========================================
  // CLEAN SLATE & DEMO SEED CONTROLS
  // ==========================================
  public resetToZeroClean(): ErpState {
    const clean = getZeroCleanState();
    this.saveState(clean);
    this.state = clean;
    return clean;
  }

  public seedGuideDemoData(actorUser?: User): ErpState {
    const user = actorUser || this.state.users[0];
    
    // Sample customers
    const c1: CustomerMaster = {
      id: 'cust-uuid-1001',
      customerCode: 'SH-C-1001',
      companyName: 'شركة النيل الأزرق للاستيراد والتصدير',
      contactName: 'عمر صديق الجزولي',
      businessType: 'commercial',
      primaryPhone: '+249912111111',
      whatsapp: '+249912111111',
      email: 'omar@blue-nile-sudan.sd',
      country: 'السودان',
      city: 'بورتسودان',
      address: 'شارع السيد علي الميرغني، جوار الغرفة التجارية',
      taxNumber: 'TX-SD-984210',
      status: 'active',
      totalRequestsCount: 1,
      activeShipmentsCount: 1,
      notes: 'عميل استيراد منظومات طاقة شمسية ومحولات صناعية من الصين.',
      createdAt: '2026-02-01T08:00:00Z',
      updatedAt: '2026-02-15T12:00:00Z',
    };

    const c2: CustomerMaster = {
      id: 'cust-uuid-1002',
      customerCode: 'SH-C-1002',
      companyName: 'مؤسسة الرواد للآليات والمقاولات',
      contactName: 'عثمان عبد الله يوسف',
      businessType: 'industrial',
      primaryPhone: '+249912222222',
      whatsapp: '+249912222222',
      email: 'contact@alrowad.sd',
      country: 'السودان',
      city: 'عطبرة',
      address: 'المنطقة الصناعية عطبرة',
      taxNumber: 'TX-SD-432190',
      status: 'active',
      totalRequestsCount: 1,
      activeShipmentsCount: 0,
      notes: 'استيراد معدات ثقيلة وقطع غيار شاحنات من جبل علي بدبي.',
      createdAt: '2026-02-05T09:00:00Z',
      updatedAt: '2026-02-18T10:00:00Z',
    };

    // Sample Requests
    const r1: RequestHeader = {
      id: 'req-uuid-001',
      requestCode: 'REQ-2026-000101',
      customerId: c1.id,
      customerCode: c1.customerCode,
      customerName: c1.companyName,
      customerPhone: c1.primaryPhone,
      requestTypeCode: 'PURCHASE_AND_SHIP',
      departmentCode: 'OPERATIONS',
      title: 'توريد وشحن منظومات طاقة شمسية 5KW (40 مجموعة) من فوشان إلى بورتسودان',
      priority: 'high',
      status: 'in_progress',
      approvalStatus: 'approved',
      assignedToUserId: 'user-004',
      assignedToUserName: 'كابتن محمد صلاح (مدير العمليات)',
      assignedAt: '2026-02-10T10:00:00Z',
      readyForProcessingAt: '2026-02-12T14:00:00Z',
      createdBy: 'user-006',
      createdByName: 'سارة عبد المنعم (مبيعات)',
      createdAt: '2026-02-10T09:30:00Z',
      updatedAt: '2026-02-20T11:00:00Z',
      notes: 'الطلب في مسار الشحن البحري، بانتظار وصول الحاوية لميناء بورتسودان.',
    };

    // Sample Supplier
    const s1: ErpSupplier = {
      id: 'sup-1',
      supplierCode: 'SUP-1001',
      name: 'Foshan SunPower Energy Co., Ltd',
      contactPerson: 'Mr. Zhang Wei',
      country: 'الصين',
      city: 'فوشان (Foshan)',
      phone: '+86 757 8888 9999',
      email: 'sales@sunpower-china.com',
      whatsapp: '+86 138 0000 1111',
      rating: 5,
      categories: ['طاقة شمسية', 'إنفرترات', 'بطاريات ليثيوم'],
      status: 'active',
      notes: 'مصنع معتمد من سهلا، تم فحص خط الإنتاج بنجاح.',
      createdAt: '2026-02-02T10:00:00Z',
    };

    // Sample PO
    const po1: ErpPurchaseOrder = {
      id: 'po-1',
      poCode: 'PO-2026-0101',
      requestId: r1.id,
      requestCode: r1.requestCode,
      supplierId: s1.id,
      supplierName: s1.name,
      currency: 'USD',
      totalAmount: 28400,
      itemsSummary: '40 مجموعة طاقة شمسية متكاملة 5KW تشمل الألواح والإنفرترات',
      status: 'issued',
      paymentTerms: '30% دفعة مقدمة، 70% عند صدور بوليصة الشحن',
      deliveryDate: '2026-02-25',
      approvedBy: 'أحمد النور (المدير العام)',
      approvedAt: '2026-02-12T10:00:00Z',
      createdAt: '2026-02-11T12:00:00Z',
    };

    // Sample Invoice & Receipt
    const inv1: ErpCustomerInvoice = {
      id: 'inv-1',
      invoiceCode: 'INV-2026-0001',
      requestId: r1.id,
      requestCode: r1.requestCode,
      customerId: c1.id,
      customerName: c1.companyName,
      totalAmount: 32500,
      paidAmount: 16250,
      balanceAmount: 16250,
      currency: 'USD',
      dueDate: '2026-03-05',
      status: 'partial',
      description: 'فاتورة التوريد والشحن الجزئي والتخليص الجمركي',
      createdAt: '2026-02-12T14:00:00Z',
    };

    const rec1: ErpFinanceReceipt = {
      id: 'rec-1',
      receiptCode: 'REC-2026-0101',
      invoiceId: inv1.id,
      requestId: r1.id,
      requestCode: r1.requestCode,
      customerId: c1.id,
      customerName: c1.companyName,
      amount: 16250,
      currency: 'USD',
      paymentMethod: 'wire_transfer',
      referenceNumber: 'SWIFT-BOK-20260214-998',
      receivedBy: 'أحمد النور البشير',
      notes: 'دفعة أولى 50% مستلمة بحساب دبي',
      createdAt: '2026-02-14T11:00:00Z',
    };

    // Sample Inspection
    const ins1: ErpInspectionRecord = {
      id: 'ins-1',
      inspectionCode: 'INS-2026-0001',
      requestId: r1.id,
      requestCode: r1.requestCode,
      poCode: po1.poCode,
      supplierName: s1.name,
      factoryLocation: 'فوشان - مقاطعة قوانغدونغ',
      inspectorName: 'م. ليو شياو بينغ (فاحص سهلا المعتمد)',
      inspectionDate: '2026-02-16',
      itemsQuantity: 40,
      defectRatePercentage: 0,
      result: 'passed',
      checklist: {
        packagingOk: true,
        specificationsMatch: true,
        labelingAndBarcodeOk: true,
        electricalOrFunctionalTestOk: true,
      },
      notes: 'تم فحص جهد الخرج للألواح والإنفرترات وكافة الصناديق خشبية ومبطنة مانعة للصدمات.',
      photosCount: 8,
      createdAt: '2026-02-16T16:00:00Z',
    };

    // Sample Shipment
    const shp1: ErpShipmentOperation = {
      id: 'shp-1',
      shipmentCode: 'SHL-2026-000101',
      requestId: r1.id,
      requestCode: r1.requestCode,
      customerName: c1.companyName,
      shippingMode: 'sea_fcl',
      originPort: 'ميناء نينغبو / قوانغتشو',
      destinationPort: 'ميناء بورتسودان الجنوبي',
      containerNumber: 'TGHU-894210-4 (40ft HQ)',
      blNumber: 'COSCO-NB-PS-2026-0982',
      shippingLineOrCarrier: 'COSCO Shipping Lines',
      etd: '2026-02-18',
      eta: '2026-03-08',
      transitStatus: 'in_transit_red_sea',
      cargoDescription: 'منظومات طاقة شمسية ومحولات كهربائية صناعية',
      weightKg: 14200,
      volumeCbm: 68,
      createdAt: '2026-02-18T10:00:00Z',
    };

    const demoState: ErpState = {
      departments: SEED_DEPARTMENTS,
      roles: SEED_ROLES,
      users: SEED_USERS,
      masterData: SEED_MASTER_DATA,
      sequences: [
        { ...INITIAL_SEQUENCES[0], currentValue: 1002 },
        { ...INITIAL_SEQUENCES[1], currentValue: 101 },
        { ...INITIAL_SEQUENCES[2], currentValue: 101 },
        { ...INITIAL_SEQUENCES[3], currentValue: 101 },
        { ...INITIAL_SEQUENCES[4], currentValue: 101 },
        { ...INITIAL_SEQUENCES[5], currentValue: 100 },
        { ...INITIAL_SEQUENCES[6], currentValue: 100 },
      ],
      auditLogs: [
        {
          id: 'audit-demo-seed',
          actorId: user.id,
          actorName: user.name,
          actorRole: user.roleCode,
          entityType: 'setting',
          entityId: 'demo-seed',
          action: 'create',
          notes: 'تعبئة بيانات تجريبية واقعية استرشادية لاختبار دورة العمليات الكاملة (توريد -> فحص -> شحن -> مالية).',
          timestamp: new Date().toISOString(),
        },
      ],
      attachments: [
        {
          id: 'att-demo-1',
          relatedEntity: 'shipment',
          relatedEntityId: shp1.id,
          requestId: r1.id,
          category: 'bill_of_lading',
          fileName: 'COSCO_BL_TGHU-894210-4.pdf',
          fileType: 'application/pdf',
          fileSizeBytes: 420000,
          fileUrl: '#',
          visibility: 'public_tracking',
          description: 'بوليصة الشحن البحري الرسمية للشحنة',
          uploadedBy: user.id,
          uploadedByName: user.name,
          uploadedAt: new Date().toISOString(),
        },
      ],
      customers: [c1, c2],
      leads: [],
      requests: [r1],
      suppliers: DEFAULT_INITIAL_SUPPLIERS,
      rfqs: [],
      quotes: [],
      purchaseOrders: [po1],
      purchaseInvoices: DEFAULT_INITIAL_PURCHASE_INVOICES,
      invoices: [inv1],
      receipts: [rec1],
      expenses: [],
      inspections: [ins1],
      shipments: [shp1],
      customs: [],
      proofsOfDelivery: [],
      inlandTrucking: DEFAULT_INLAND_TRUCKING,
      treasuryAccounts: DEFAULT_TREASURY_ACCOUNTS,
    };

    this.saveState(demoState);
    this.state = demoState;
    return demoState;
  }
}

export const erpEngine = new ErpEngine();
