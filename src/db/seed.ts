import bcrypt from 'bcryptjs';
import { db } from './index.ts';
import {
  departments,
  roles,
  permissions,
  rolePermissions,
  users,
  businessSequences,
  auditLogs,
  treasuryAccounts,
  exchangeRates,
  productCategories,
  products,
} from './schema.ts';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  console.log('--- Starting Database Seed ---');

  // 1. SEED DEPARTMENTS
  const defaultDepts = [
    { code: 'MANAGEMENT', nameAr: 'الإدارة العامة والمتابعة', nameEn: 'General Management', descriptionAr: 'إدارة العمليات الشاملة والحوكمة المؤسسية والسياسات العامة' },
    { code: 'PROCUREMENT', nameAr: 'المشتريات والتوريد الدولي', nameEn: 'International Procurement', descriptionAr: 'التفاوض مع مصانع الصين، فحص عروض الأسعار، وإصدار أوامر الشراء' },
    { code: 'FINANCE', nameAr: 'المالية والخزينة والمطابقات', nameEn: 'Finance & Treasury', descriptionAr: 'سندات القبض والصرف، مطابقة تطبيق بنكك، وإدارة الخزائن المتعددة' },
    { code: 'OPERATIONS', nameAr: 'العمليات اللوجستية والشحن', nameEn: 'Logistics & Ocean Freight', descriptionAr: 'متابعة بوالص الشحن، الحاويات، والتنسيق الميداني الملاحي' },
    { code: 'CUSTOMS', nameAr: 'التخليص الجمركي - ميناء بورتسودان', nameEn: 'Port Sudan Customs Clearance', descriptionAr: 'شهادات الإجراء الجمركي (Asycuda)، بنود التعريفة، وسداد الرسوم' },
    { code: 'IT_ADMIN', nameAr: 'نظم المعلومات والحوكمة التقنية', nameEn: 'IT Systems & Governance', descriptionAr: 'إدارة المستخدمين والصلاحيات والنسخ الاحتياطي وأمن البيانات' },
  ];

  const deptMap: Record<string, string> = {};
  for (const dept of defaultDepts) {
    const existing = await db.select().from(departments).where(eq(departments.code, dept.code));
    if (existing.length === 0) {
      const [inserted] = await db.insert(departments).values(dept).returning();
      deptMap[dept.code] = inserted.id;
    } else {
      deptMap[dept.code] = existing[0].id;
    }
  }

  // 2. SEED PERMISSIONS
  const defaultPermissions = [
    { code: 'requests:view', nameAr: 'استعراض الطلبات', category: 'requests', descriptionAr: 'رؤية قائمة الطلبات وتفاصيلها' },
    { code: 'requests:create', nameAr: 'إنشاء طلب جديد', category: 'requests', descriptionAr: 'تسجيل طلب مركزي جديد' },
    { code: 'requests:edit', nameAr: 'تعديل الطلبات', category: 'requests', descriptionAr: 'تعديل بيانات وحالة الطلب' },
    { code: 'requests:assign', nameAr: 'تعيين الطلبات', category: 'requests', descriptionAr: 'تعيين الموظف المسؤول عن الطلب' },
    { code: 'requests:approve', nameAr: 'اعتماد الطلبات', category: 'requests', descriptionAr: 'الموافقة الإدارية الرسمية على الطلب' },
    { code: 'requests:delete', nameAr: 'أرشفة الطلبات', category: 'requests', descriptionAr: 'أرشفة أو إلغاء الطلب' },
    { code: 'crm:view', nameAr: 'استعراض العملاء والفرص', category: 'crm', descriptionAr: 'رؤية قاعدة بيانات العملاء والـ CRM' },
    { code: 'crm:create', nameAr: 'تسجيل عميل جديد', category: 'crm', descriptionAr: 'إضافة عميل أو فرصة جديدة' },
    { code: 'crm:edit', nameAr: 'تعديل العملاء', category: 'crm', descriptionAr: 'تعديل بيانات العميل والفرص' },
    { code: 'crm:convert', nameAr: 'تحويل الفرص لطلبات', category: 'crm', descriptionAr: 'تحويل عميل محتمل إلى طلب تجاري' },
    { code: 'customers:view', nameAr: 'استعراض بيانات العملاء', category: 'customers', descriptionAr: 'استعراض سجل العملاء وجهات الاتصال' },
    { code: 'customers:create', nameAr: 'إضافة عميل جديد', category: 'customers', descriptionAr: 'تسجيل عميل جديد والتحقق من عدم التكرار' },
    { code: 'customers:edit', nameAr: 'تعديل بيانات العميل', category: 'customers', descriptionAr: 'تعديل البيانات الأساسية والتجارية للعميل' },
    { code: 'customers:delete', nameAr: 'تعطيل / أرشفة العميل', category: 'customers', descriptionAr: 'تعطيل أو أرشفة سجل العميل' },
    { code: 'customers:export', nameAr: 'تصدير كشف العملاء', category: 'customers', descriptionAr: 'تصدير قاعدة بيانات العملاء إلى ملفات' },
    { code: 'suppliers:view', nameAr: 'استعراض الموردين والمصانع', category: 'suppliers', descriptionAr: 'استعراض قاعدة بيانات الموردين والمصانع العالمية' },
    { code: 'suppliers:create', nameAr: 'إضافة مورد / مصنع جديد', category: 'suppliers', descriptionAr: 'تسجيل مورد جديد مع جهات الاتصال والحسابات' },
    { code: 'suppliers:edit', nameAr: 'تعديل بيانات المورد', category: 'suppliers', descriptionAr: 'تعديل شروط الدفع والتقييم ومعلومات المصنع' },
    { code: 'suppliers:delete', nameAr: 'تعطيل / أرشفة المورد', category: 'suppliers', descriptionAr: 'تعطيل أو أرشفة سجل المورد' },
    { code: 'suppliers:export', nameAr: 'تصدير كشف الموردين', category: 'suppliers', descriptionAr: 'تصدير كشف الموردين والمصانع إلى Excel/CSV' },
    { code: 'suppliers:import', nameAr: 'استيراد كشف الموردين', category: 'suppliers', descriptionAr: 'استيراد دفعة مجمعة من الموردين (200+ مورد)' },
    { code: 'contacts:manage', nameAr: 'إدارة جهات الاتصال للشركات', category: 'contacts', descriptionAr: 'إضافة وتعديل جهات الاتصال للموردين والعملاء' },
    { code: 'procurement:view', nameAr: 'استعراض المشتريات', category: 'procurement', descriptionAr: 'رؤية أوامر الشراء والموردين' },
    { code: 'procurement:create_po', nameAr: 'إصدار أمر شراء (PO)', category: 'procurement', descriptionAr: 'إصدار أوامر الشراء لمصانع الصين' },
    { code: 'procurement:compare', nameAr: 'مقارنة عروض الأسعار', category: 'procurement', descriptionAr: 'مقارنة عروض المصانع (RFQ)' },
    { code: 'finance:view', nameAr: 'استعراض المالية', category: 'finance', descriptionAr: 'رؤية الحسابات والسجلات المالية' },
    { code: 'finance:receipts', nameAr: 'إصدار سندات القبض', category: 'finance', descriptionAr: 'تسجيل تحصيلات بنكك والنقد' },
    { code: 'finance:payables', nameAr: 'إصدار سندات الصرف', category: 'finance', descriptionAr: 'تسجيل مدفوعات الموردين والجمارك' },
    { code: 'finance:treasury', nameAr: 'إدارة الخزائن', category: 'finance', descriptionAr: 'مطابقة أرصدة الخزائن والبنوك' },
    { code: 'finance:approve_payment', nameAr: 'اعتماد المدفوعات', category: 'finance', descriptionAr: 'الموافقة على الصرف المالي' },
    { code: 'finance:create_voucher', nameAr: 'إنشاء سند صرف / قبض', category: 'finance', descriptionAr: 'تسجيل مقترح سند مالي جديد' },
    { code: 'finance:approve_voucher', nameAr: 'اعتماد سند صرف', category: 'finance', descriptionAr: 'الموافقة الإدارية على سند الصرف بالرقابة الثنائية' },
    { code: 'finance:post_voucher', nameAr: 'ترحيل السندات المالية للخزينة', category: 'finance', descriptionAr: 'ترحيل السند المعتمد وتحديث رصيد الخزينة فوريًا' },
    { code: 'finance:reconcile', nameAr: 'تسوية ومطابقة الخزائن', category: 'finance', descriptionAr: 'مطابقة الرصيد الدفتري مع الفعلي وإجراء التسويات' },
    { code: 'finance:transfer', nameAr: 'تحويل بين الخزائن', category: 'finance', descriptionAr: 'إجراء تحويلات نقدية ومصرفية ذرية بين الحسابات' },
    { code: 'finance:invoicing', nameAr: 'إصدار وإدارة الفواتير', category: 'finance', descriptionAr: 'فواتير العملاء وفواتير الموردين' },
    { code: 'finance:rates', nameAr: 'إدارة أسعار الصرف', category: 'finance', descriptionAr: 'تحديث أسعار صرف العملات المعتمدة' },
    { code: 'products:view', nameAr: 'استعراض كتالوج المنتجات', category: 'catalog', descriptionAr: 'استعراض قائمة السلع والخدمات وتكلفتها' },
    { code: 'products:manage', nameAr: 'إدارة كتالوج المنتجات والأسعار', category: 'catalog', descriptionAr: 'إضافة وتعديل المنتجات وأسعار البيع والتكلفة' },
    { code: 'operations:view', nameAr: 'استعراض العمليات', category: 'operations', descriptionAr: 'رؤية الشحنات والتخليص والتفويج' },
    { code: 'operations:customs', nameAr: 'إجراءات التخليص الجمركي', category: 'operations', descriptionAr: 'تسجيل بيانات جمارك بورتسودان' },
    { code: 'operations:pod', nameAr: 'إثبات التسليم (POD)', category: 'operations', descriptionAr: 'توثيق تسليم البضاعة وإغلاق المعاملة' },
    { code: 'audit:view', nameAr: 'استعراض سجل التدقيق', category: 'system', descriptionAr: 'رؤية سجل العمليات والرقابة' },
    { code: 'settings:manage', nameAr: 'إدارة إعدادات النظام', category: 'system', descriptionAr: 'التحكم في المستخدمين والصلاحيات' },
    { code: 'export:data', nameAr: 'تصدير البيانات', category: 'system', descriptionAr: 'تصدير الكشوفات لملفات Excel/CSV' },
  ];

  for (const perm of defaultPermissions) {
    const existing = await db.select().from(permissions).where(eq(permissions.code, perm.code));
    if (existing.length === 0) {
      await db.insert(permissions).values(perm);
    }
  }

  // 3. SEED ROLES
  const defaultRoles = [
    { code: 'super_admin', nameAr: 'مدير عام النظام (Super Admin)', nameEn: 'Super Admin', descriptionAr: 'صلاحيات كاملة وغير مقيدة على كافة أقسام المنظومة', isSystem: true },
    { code: 'department_manager', nameAr: 'مدير قسم (Department Manager)', nameEn: 'Department Manager', descriptionAr: 'إدارة مهام القسم والاعتمادات المرحلية وتعيين الطلبات', isSystem: true },
    { code: 'procurement_specialist', nameAr: 'أخصائي مشتريات وتوريد دولي', nameEn: 'Procurement Specialist', descriptionAr: 'إدارة عروض المصانع وأوامر الشراء بالصين', isSystem: false },
    { code: 'finance_accountant', nameAr: 'رئيس قسم المالية والخزينة', nameEn: 'Finance & Treasury Lead', descriptionAr: 'إدارة الفواتير والتحصيل وسندات القبض ومطابقات بنكك', isSystem: false },
    { code: 'operations_officer', nameAr: 'ضابط عمليات وشحن وتخليص', nameEn: 'Operations & Logistics Officer', descriptionAr: 'متابعة الشحن والتخليص الجمركي ببورتسودان وتفويج الشاحنات', isSystem: false },
    { code: 'sales_crm_officer', nameAr: 'مسؤول مبيعات وخدمة عملاء (CRM)', nameEn: 'Sales & CRM Specialist', descriptionAr: 'استقبال طلبات العملاء وتأهيل الفرص التجارية', isSystem: false },
    { code: 'viewer', nameAr: 'مستعرض تدقيق ومراقبة (Read-Only)', nameEn: 'Auditor & Read-Only Viewer', descriptionAr: 'صلاحية استعراض ومطالعة دون إمكانية التعديل', isSystem: true },
  ];

  const roleMap: Record<string, string> = {};
  for (const r of defaultRoles) {
    const existing = await db.select().from(roles).where(eq(roles.code, r.code));
    if (existing.length === 0) {
      const [inserted] = await db.insert(roles).values(r).returning();
      roleMap[r.code] = inserted.id;
    } else {
      roleMap[r.code] = existing[0].id;
    }
  }

  // 4. MAP ROLE PERMISSIONS
  const rolePermMapping: Record<string, string[]> = {
    super_admin: defaultPermissions.map(p => p.code),
    department_manager: [
      'requests:view', 'requests:create', 'requests:edit', 'requests:assign', 'requests:approve',
      'crm:view', 'crm:create', 'crm:edit', 'crm:convert',
      'customers:view', 'customers:create', 'customers:edit', 'customers:export',
      'suppliers:view', 'suppliers:create', 'suppliers:edit', 'suppliers:export', 'suppliers:import',
      'contacts:manage',
      'procurement:view', 'procurement:create_po', 'procurement:compare',
      'finance:view', 'finance:approve_payment', 'finance:approve_voucher', 'finance:invoicing',
      'products:view', 'products:manage',
      'operations:view', 'operations:customs', 'operations:pod',
      'audit:view', 'export:data'
    ],
    procurement_specialist: [
      'requests:view', 'requests:edit',
      'suppliers:view', 'suppliers:create', 'suppliers:edit', 'suppliers:export', 'suppliers:import',
      'contacts:manage',
      'customers:view',
      'procurement:view', 'procurement:create_po', 'procurement:compare',
      'finance:view',
      'products:view', 'products:manage',
      'operations:view', 'export:data'
    ],
    finance_accountant: [
      'requests:view',
      'customers:view', 'suppliers:view',
      'finance:view', 'finance:receipts', 'finance:payables', 'finance:treasury', 'finance:approve_payment',
      'finance:create_voucher', 'finance:approve_voucher', 'finance:post_voucher', 'finance:reconcile', 'finance:transfer',
      'finance:invoicing', 'finance:rates',
      'products:view',
      'audit:view', 'export:data'
    ],
    operations_officer: [
      'requests:view', 'requests:edit',
      'customers:view', 'suppliers:view',
      'operations:view', 'operations:customs', 'operations:pod',
      'products:view',
      'export:data'
    ],
    sales_crm_officer: [
      'requests:view', 'requests:create',
      'crm:view', 'crm:create', 'crm:edit', 'crm:convert',
      'customers:view', 'customers:create', 'customers:edit', 'customers:export',
      'contacts:manage',
      'suppliers:view',
      'products:view'
    ],
    viewer: ['requests:view', 'crm:view', 'customers:view', 'suppliers:view', 'operations:view', 'audit:view', 'finance:view', 'products:view']
  };

  for (const [roleCode, permCodes] of Object.entries(rolePermMapping)) {
    const roleId = roleMap[roleCode];
    if (!roleId) continue;
    for (const permCode of permCodes) {
      try {
        await db.insert(rolePermissions).values({ roleId, permissionCode: permCode }).onConflictDoNothing();
      } catch {}
    }
  }

  // 5. SEED BUSINESS SEQUENCES
  const defaultSequences = [
    { sequenceKey: 'CUSTOMER', prefix: 'SH-C-', currentValue: 1000, padding: 4, description: 'كود العميل التجاري الفريد لشركة سهلا' },
    { sequenceKey: 'SUPPLIER', prefix: 'SH-SUP-', currentValue: 1000, padding: 4, description: 'كود المورد المعتمد والمصنع لشركة سهلا' },
    { sequenceKey: 'CONTACT', prefix: 'SH-CON-', currentValue: 1000, padding: 4, description: 'كود جهة الاتصال والمسؤول التجاري لشركة سهلا' },
    { sequenceKey: 'LEAD', prefix: 'SH-LD-', currentValue: 2000, padding: 4, description: 'كود الفرصة التجارية والعملاء المحتملين' },
    { sequenceKey: 'REQUEST', prefix: 'REQ-2026-', currentValue: 100, padding: 6, description: 'كود الطلب المركزي عبر كافة الأقسام' },
    { sequenceKey: 'PO', prefix: 'PO-2026-', currentValue: 100, padding: 4, description: 'أمر الشراء المعتمد للموردين والمصانع' },
    { sequenceKey: 'RFQ', prefix: 'RFQ-2026-', currentValue: 100, padding: 4, description: 'طلب عروض الأسعار الدولي لمصانع الصين' },
    { sequenceKey: 'SHIPMENT', prefix: 'SHL-2026-', currentValue: 100, padding: 6, description: 'رقم تتبع الشحنة والعمليات اللوجستية' },
    { sequenceKey: 'RECEIPT', prefix: 'REC-2026-', currentValue: 100, padding: 4, description: 'سندات التحصيل والقبض المالي (بنكك / كاش)' },
    { sequenceKey: 'PAYMENT', prefix: 'PAY-2026-', currentValue: 100, padding: 4, description: 'سندات الصرف والدفع للموردين والجمارك' },
    { sequenceKey: 'EXPENSE', prefix: 'EXP-2026-', currentValue: 100, padding: 4, description: 'مصروفات العمليات التشغيلية والنولون' },
    { sequenceKey: 'INVOICE', prefix: 'INV-2026-', currentValue: 100, padding: 4, description: 'فواتير المطالبة الصادرة للعملاء' },
    { sequenceKey: 'SINV', prefix: 'SINV-2026-', currentValue: 100, padding: 4, description: 'فواتير ومطالبات الموردين المعتمدة' },
    { sequenceKey: 'TREASURY', prefix: 'TR-', currentValue: 1000, padding: 4, description: 'أكواد الخزائن والحسابات البنكية' },
    { sequenceKey: 'TX', prefix: 'TX-2026-', currentValue: 100, padding: 6, description: 'قيود وحركات الخزينة المحمية' },
    { sequenceKey: 'TRF', prefix: 'TRF-2026-', currentValue: 100, padding: 4, description: 'تحويلات الخزائن البينية' },
    { sequenceKey: 'RECON', prefix: 'REC-ADJ-', currentValue: 100, padding: 4, description: 'تسويات ومطابقات أرصدة الخزائن' },
    { sequenceKey: 'PROD', prefix: 'PRD-', currentValue: 1010, padding: 4, description: 'كتالوج المنتجات والسلع العالمية' },
    { sequenceKey: 'TRUCKING', prefix: 'TRK-2026-', currentValue: 100, padding: 4, description: 'تفويج وبوالص الشحن البري الداخلي' },
    { sequenceKey: 'POD', prefix: 'POD-2026-', currentValue: 100, padding: 4, description: 'إثباتات التسليم النهائي وبراءة الذمة' },
    { sequenceKey: 'AUDIT', prefix: 'AUD-', currentValue: 1000, padding: 6, description: 'أرقام التدقيق والرقابة الأمنية' },
  ];

  for (const seq of defaultSequences) {
    const existing = await db.select().from(businessSequences).where(eq(businessSequences.sequenceKey, seq.sequenceKey));
    if (existing.length === 0) {
      await db.insert(businessSequences).values(seq);
    }
  }

  // 6. SEED CANONICAL INITIAL USERS (WITH SECURE BCRYPT HASHES)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('1234', salt);

  const initialUsers = [
    {
      username: 'admin',
      email: 'ceo@sahla.sd',
      passwordHash,
      name: 'أحمد النور البشير',
      phone: '+249912000001',
      departmentCode: 'MANAGEMENT',
      roleCode: 'super_admin',
      allowedModules: ['dashboard', 'requests_backbone', 'customers_master', 'suppliers_master', 'crm_leads', 'procurement', 'finance', 'operations', 'audit_trail', 'rbac_matrix', 'products_catalog'],
    },
    {
      username: 'procurement',
      email: 'procurement.lead@sahla.sd',
      passwordHash,
      name: 'م. طارق عبد الرحمن',
      phone: '+249912000002',
      departmentCode: 'PROCUREMENT',
      roleCode: 'procurement_specialist',
      allowedModules: ['dashboard', 'procurement', 'suppliers_master', 'requests_backbone', 'products_catalog'],
    },
    {
      username: 'finance',
      email: 'finance.lead@sahla.sd',
      passwordHash,
      name: 'عثمان عبد الله يوسف',
      phone: '+249912000003',
      departmentCode: 'FINANCE',
      roleCode: 'finance_accountant',
      allowedModules: ['dashboard', 'finance', 'requests_backbone', 'products_catalog'],
    },
    {
      username: 'operations',
      email: 'operations.lead@sahla.sd',
      passwordHash,
      name: 'كابتن محمد صلاح',
      phone: '+249912000004',
      departmentCode: 'OPERATIONS',
      roleCode: 'operations_officer',
      allowedModules: ['dashboard', 'operations', 'requests_backbone', 'products_catalog'],
    },
    {
      username: 'customs',
      email: 'customs.lead@sahla.sd',
      passwordHash,
      name: 'إبراهيم مصطفى حمزة',
      phone: '+249912000005',
      departmentCode: 'CUSTOMS',
      roleCode: 'operations_officer',
      allowedModules: ['dashboard', 'operations', 'requests_backbone'],
    },
  ];

  for (const u of initialUsers) {
    const existing = await db.select().from(users).where(eq(users.username, u.username));
    if (existing.length === 0) {
      await db.insert(users).values({
        username: u.username,
        email: u.email,
        passwordHash: u.passwordHash,
        name: u.name,
        phone: u.phone,
        departmentId: deptMap[u.departmentCode] || null,
        roleId: roleMap[u.roleCode] || null,
        status: 'active',
        allowedModules: u.allowedModules,
      });
    }
  }

  // 7. SEED TREASURY ACCOUNTS
  const defaultTreasuries = [
    {
      accountCode: 'TR-1001',
      name: 'خزينة الفرع الرئيسي - نقد بورتسودان',
      type: 'cash',
      currency: 'SDG',
      bankName: 'الخزينة النقدية الرئيسية',
      accountNumber: 'CASH-SDG-01',
      balance: '5000000.00',
      status: 'active',
      notes: 'الخزينة النقدية لمصروفات الميناء والعمليات المحلية',
    },
    {
      accountCode: 'TR-1002',
      name: 'حساب بنكك الرئيسي - بنك الخرطوم',
      type: 'bank',
      currency: 'SDG',
      bankName: 'بنك الخرطوم (Bank of Khartoum - Bankak)',
      accountNumber: '2490018823',
      balance: '25000000.00',
      status: 'active',
      notes: 'الحساب الرئيسي لتحصيلات وسندات قبض عملاء السودان عبر تطبيق بنكك',
    },
    {
      accountCode: 'TR-1003',
      name: 'خزينة الدولار النقدية - الإدارة المركزية',
      type: 'cash',
      currency: 'USD',
      bankName: 'خزينة النقد الأجنبي',
      accountNumber: 'CASH-USD-01',
      balance: '50000.00',
      status: 'active',
      notes: 'خزينة العملات الأجنبية للتعاملات الفورية وسداد نولون الشحن البحري',
    },
    {
      accountCode: 'TR-1004',
      name: 'حساب بنك دبي الإسلامي (DIB) - درهم إماراتي',
      type: 'bank',
      currency: 'AED',
      bankName: 'Dubai Islamic Bank (DIB)',
      accountNumber: 'AE049100223910001',
      balance: '100000.00',
      status: 'active',
      notes: 'حساب تحويلات الموردين وخطوط الشحن بدولة الإمارات',
    },
    {
      accountCode: 'TR-1005',
      name: 'حساب بنك الصين الصناعي التجاري (ICBC) - يوان صيني',
      type: 'bank',
      currency: 'CNY',
      bankName: 'Industrial and Commercial Bank of China (ICBC)',
      accountNumber: '6222021001928834',
      balance: '200000.00',
      status: 'active',
      notes: 'حساب المشتريات المباشرة لمصانع الصين والتحويلات البنكية (CNY)',
    },
  ];

  for (const tr of defaultTreasuries) {
    const existing = await db.select().from(treasuryAccounts).where(eq(treasuryAccounts.accountCode, tr.accountCode));
    if (existing.length === 0) {
      await db.insert(treasuryAccounts).values(tr);
    }
  }

  // 8. SEED EXCHANGE RATES
  const defaultRates = [
    { baseCurrency: 'USD', targetCurrency: 'SDG', rate: '2650.000000' },
    { baseCurrency: 'USD', targetCurrency: 'AED', rate: '3.672500' },
    { baseCurrency: 'USD', targetCurrency: 'CNY', rate: '7.230000' },
    { baseCurrency: 'USD', targetCurrency: 'SAR', rate: '3.750000' },
    { baseCurrency: 'AED', targetCurrency: 'SDG', rate: '721.500000' },
  ];

  for (const r of defaultRates) {
    const existing = await db.select().from(exchangeRates).where(
      eq(exchangeRates.baseCurrency, r.baseCurrency)
    );
    const pair = existing.find(e => e.targetCurrency === r.targetCurrency);
    if (!pair) {
      await db.insert(exchangeRates).values(r);
    }
  }

  // 9. SEED PRODUCT CATEGORIES & CATALOG
  const defaultCategories = [
    { code: 'CAT-BUILD', nameAr: 'مواد بناء وتشطيبات وسيراميك', nameEn: 'Building & Construction Materials', description: 'بورسلين، سيراميك، أدوات صحية، إضاءة وإنارة معمارية من مصانع فوشان بالصين' },
    { code: 'CAT-ELEC', nameAr: 'إلكترونيات وأجهزة كهربائية وطاقة شمسية', nameEn: 'Electronics & Solar Power', description: 'ألواح طاقة شمسية، محولات Inverters، بطاريات ليثيوم، وأجهزة كهرومنزيلية' },
    { code: 'CAT-SPARE', nameAr: 'قطع غيار ومعدات صناعية وماكينات', nameEn: 'Industrial Machinery & Spare Parts', description: 'خطوط إنتاج، قوالب حقن، ومعدات وقطع غيار الشاحنات والمحركات' },
    { code: 'CAT-TEXTILE', nameAr: 'منسوجات وأقمشة وملابس جاهزة', nameEn: 'Textiles & Ready-Made Garments', description: 'أقمشة مفروشات، ملابس جاهزة، ومستلزمات خياطة بالجملة' },
  ];

  const catMap: Record<string, string> = {};
  for (const cat of defaultCategories) {
    const existing = await db.select().from(productCategories).where(eq(productCategories.code, cat.code));
    if (existing.length === 0) {
      const [inserted] = await db.insert(productCategories).values(cat).returning();
      catMap[cat.code] = inserted.id;
    } else {
      catMap[cat.code] = existing[0].id;
    }
  }

  const defaultProducts = [
    {
      sku: 'PRD-1001',
      nameAr: 'بلاط بورسلين فوشان 60×120 سم نخب أول',
      nameEn: 'Foshan Glazed Porcelain Tile 60x120cm Grade A',
      categoryId: catMap['CAT-BUILD'],
      unit: 'carton',
      defaultCurrency: 'USD',
      costPrice: '9.50',
      sellingPrice: '14.50',
      minOrderQty: 100,
      description: 'بورسلين عالي المقاومة ومقاوم للانزلاق، كرتونة تحتوي 2 قطعة بمساحة 1.44 متر مربع',
    },
    {
      sku: 'PRD-1002',
      nameAr: 'إنفرتر طاقة شمسية هجين 5.5 كيلو واط (Deye/Growatt)',
      nameEn: 'Hybrid Solar Inverter 5.5kW Off-Grid',
      categoryId: catMap['CAT-ELEC'],
      unit: 'pcs',
      defaultCurrency: 'USD',
      costPrice: '380.00',
      sellingPrice: '520.00',
      minOrderQty: 5,
      description: 'إنفرتر هجين نقي مع شاحن MPPT يدعم العمل مع شبكة وبدون بطاريات',
    },
    {
      sku: 'PRD-1003',
      nameAr: 'بطارية ليثيوم فوسفات الحديد 48V 100Ah خادم مثبت',
      nameEn: 'LiFePO4 Server Rack Battery 48V 100Ah 5.12kWh',
      categoryId: catMap['CAT-ELEC'],
      unit: 'pcs',
      defaultCurrency: 'USD',
      costPrice: '620.00',
      sellingPrice: '850.00',
      minOrderQty: 2,
      description: 'عمر افتراضي 6000 دورة تفريغ، نظام حماية ذكي BMS مع شاشة رقمية وتوافق مع كافة المحولات',
    },
  ];

  for (const prd of defaultProducts) {
    const existing = await db.select().from(products).where(eq(products.sku, prd.sku));
    if (existing.length === 0) {
      await db.insert(products).values(prd);
    }
  }

  // 10. RECORD INITIAL AUDIT LOG
  const existingAudit = await db.select().from(auditLogs).limit(1);
  if (existingAudit.length === 0) {
    await db.insert(auditLogs).values({
      auditCode: 'AUD-001001',
      actorName: 'نظام سهلا ERP (Database Bootstrapper)',
      actorRole: 'system',
      entityType: 'system',
      entityId: 'db-init',
      action: 'create',
      notes: 'تمت تهيئة وتأسيس قاعدة بيانات PostgreSQL بنجاح لمؤسسة سهلا (Phase 1-6 Foundation)',
    });
  }

  console.log('--- Database Seed Completed Successfully ---');
}

