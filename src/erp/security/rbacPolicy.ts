import { User, RoleCode, PermissionCode } from '../../types';

export type CoreRoleKey = 'admin' | 'procurement' | 'finance' | 'customs' | 'sales';

export interface RoleConfig {
  key: CoreRoleKey;
  code: RoleCode;
  nameAr: string;
  nameEn: string;
  departmentNameAr: string;
  descriptionAr: string;
  allowedModules: string[];
  allowedRequestTabs: ('overview' | 'procurement' | 'finance' | 'operations' | 'attachments' | 'audit')[];
  canViewFinancials: boolean;
  canViewCustoms: boolean;
  canViewProcurement: boolean;
  canManageUsers: boolean;
  permissions: PermissionCode[];
}

export const RBAC_ROLES: Record<CoreRoleKey, RoleConfig> = {
  admin: {
    key: 'admin',
    code: 'super_admin',
    nameAr: 'المدير العام (Admin)',
    nameEn: 'Super Admin',
    departmentNameAr: 'الإدارة العامة والمتابعة',
    descriptionAr: 'صلاحيات كاملة وغير مقيدة على كافة أقسام العمليات، المالية، الجمارك، والموظفين.',
    allowedModules: [
      'dashboard',
      'requests_backbone',
      'tasks_management',
      'customers_master',
      'suppliers_master',
      'crm_leads',
      'procurement',
      'products_catalog',
      'finance',
      'operations',
      'audit_trail',
      'rbac_matrix',
    ],
    allowedRequestTabs: ['overview', 'procurement', 'finance', 'operations', 'attachments', 'audit'],
    canViewFinancials: true,
    canViewCustoms: true,
    canViewProcurement: true,
    canManageUsers: true,
    permissions: [
      'requests:view',
      'requests:create',
      'requests:edit',
      'requests:assign',
      'requests:approve',
      'requests:delete',
      'crm:view',
      'crm:create',
      'crm:edit',
      'crm:convert',
      'procurement:view',
      'procurement:create_rfq',
      'procurement:compare',
      'procurement:create_po',
      'finance:view',
      'finance:receipts',
      'finance:payables',
      'finance:treasury',
      'finance:approve_payment',
      'operations:view',
      'operations:milestones',
      'operations:customs',
      'operations:pod',
      'audit:view',
      'settings:manage',
      'export:data',
    ],
  },

  procurement: {
    key: 'procurement',
    code: 'procurement_specialist',
    nameAr: 'مسؤول المشتريات والتوريد (Procurement)',
    nameEn: 'Procurement Specialist',
    departmentNameAr: 'المشتريات والتوريد الدولي',
    descriptionAr: 'إدارة مصانع الصين، طلبات عروض الأسعار (RFQ)، ومتابعة أوامر الشراء (PO). محجوب عن المالية والجمارك.',
    allowedModules: ['dashboard', 'procurement', 'suppliers_master', 'products_catalog', 'requests_backbone', 'tasks_management'],
    allowedRequestTabs: ['overview', 'procurement', 'attachments', 'audit'],
    canViewFinancials: false,
    canViewCustoms: false,
    canViewProcurement: true,
    canManageUsers: false,
    permissions: [
      'requests:view',
      'procurement:view',
      'procurement:create_rfq',
      'procurement:compare',
      'procurement:create_po',
      'audit:view',
    ],
  },

  finance: {
    key: 'finance',
    code: 'finance_accountant',
    nameAr: 'مسؤول المالية والخزينة (Finance)',
    nameEn: 'Finance Officer & Accountant',
    departmentNameAr: 'المالية والخزينة والمطابقات',
    descriptionAr: 'قيد سندات القبض، فواتير المشتريات، إدارة الخزائن والصناديق النقدية. محجوب عن التخليص والجمارك والعمليات.',
    allowedModules: ['dashboard', 'finance', 'customers_master', 'suppliers_master', 'products_catalog', 'requests_backbone', 'tasks_management'],
    allowedRequestTabs: ['overview', 'finance', 'attachments', 'audit'],
    canViewFinancials: true,
    canViewCustoms: false,
    canViewProcurement: false,
    canManageUsers: false,
    permissions: [
      'requests:view',
      'finance:view',
      'finance:receipts',
      'finance:payables',
      'finance:treasury',
      'audit:view',
      'export:data',
    ],
  },

  customs: {
    key: 'customs',
    code: 'operations_officer',
    nameAr: 'مسؤول الجمارك والعمليات (Customs)',
    nameEn: 'Customs & Logistics Officer',
    departmentNameAr: 'التخليص الجمركي - ميناء بورتسودان',
    descriptionAr: 'متابعة بوالص الشحن، التخليص بميناء بورتسودان، وإثبات التسليم (POD). محجوب تماماً عن سجلات المالية والخزينة.',
    allowedModules: ['dashboard', 'operations', 'requests_backbone', 'tasks_management'],
    allowedRequestTabs: ['overview', 'operations', 'attachments', 'audit'],
    canViewFinancials: false,
    canViewCustoms: true,
    canViewProcurement: false,
    canManageUsers: false,
    permissions: [
      'requests:view',
      'requests:edit',
      'operations:view',
      'operations:milestones',
      'operations:customs',
      'operations:pod',
      'audit:view',
    ],
  },

  sales: {
    key: 'sales',
    code: 'sales_crm_officer',
    nameAr: 'مسؤول المبيعات والعملاء (Sales / CRM)',
    nameEn: 'Sales & CRM Specialist',
    departmentNameAr: 'المبيعات وخدمة العملاء (CRM)',
    descriptionAr: 'تسجيل العملاء والفرص التسويقية واستقبال الاستفسارات الأولية.',
    allowedModules: ['dashboard', 'customers_master', 'crm_leads', 'requests_backbone', 'tasks_management'],
    allowedRequestTabs: ['overview', 'attachments', 'audit'],
    canViewFinancials: false,
    canViewCustoms: false,
    canViewProcurement: false,
    canManageUsers: false,
    permissions: ['requests:view', 'crm:view', 'crm:create', 'crm:edit', 'crm:convert', 'audit:view'],
  },
};

/**
 * Resolve user's effective RBAC role configuration
 */
export function getEffectiveRole(user: User): RoleConfig {
  if (user.roleCode === 'super_admin' || user.roleCode === 'admin' || user.departmentCode === 'MANAGEMENT') {
    return RBAC_ROLES.admin;
  }
  if (user.roleCode === 'finance_accountant' || user.departmentCode === 'FINANCE') {
    return RBAC_ROLES.finance;
  }
  if (user.departmentCode === 'CUSTOMS' || (user.roleCode === 'operations_officer' && user.username?.includes('customs'))) {
    return RBAC_ROLES.customs;
  }
  if (user.roleCode === 'operations_officer' || user.departmentCode === 'OPERATIONS') {
    return RBAC_ROLES.customs;
  }
  if (user.roleCode === 'procurement_specialist' || user.departmentCode === 'PROCUREMENT') {
    return RBAC_ROLES.procurement;
  }
  if (user.roleCode === 'sales_crm_officer' || user.departmentCode === 'SALES_CRM') {
    return RBAC_ROLES.sales;
  }
  return RBAC_ROLES.admin;
}

/**
 * Check if user can access a top-level ERP module
 */
export function isUserAllowedModule(user: User, moduleId: string): boolean {
  if (user.roleCode === 'super_admin' || user.roleCode === 'admin') return true;
  if (moduleId === 'tasks_management') return true;

  // Custom allowed modules override set by Super Admin
  if (user.allowedModules && user.allowedModules.length > 0) {
    return user.allowedModules.includes(moduleId);
  }

  const role = getEffectiveRole(user);
  return role.allowedModules.includes(moduleId);
}

/**
 * Check if user can access a sub-tab inside Request Backbone Drawer
 */
export function isUserAllowedRequestSubTab(
  user: User,
  subTabId: 'overview' | 'procurement' | 'finance' | 'operations' | 'attachments' | 'audit'
): boolean {
  if (user.roleCode === 'super_admin' || user.roleCode === 'admin') return true;
  const role = getEffectiveRole(user);
  return role.allowedRequestTabs.includes(subTabId);
}

/**
 * Check if user can view financial balances / figures
 */
export function canUserViewFinancials(user: User): boolean {
  if (user.roleCode === 'super_admin' || user.roleCode === 'admin') return true;
  if (user.allowedModules && user.allowedModules.includes('finance')) return true;
  return getEffectiveRole(user).canViewFinancials;
}

/**
 * Check if user can view customs / shipping logistics
 */
export function canUserViewCustoms(user: User): boolean {
  if (user.roleCode === 'super_admin' || user.roleCode === 'admin') return true;
  if (user.allowedModules && user.allowedModules.includes('operations')) return true;
  return getEffectiveRole(user).canViewCustoms;
}

/**
 * Check if user can view procurement / factory sourcing
 */
export function canUserViewProcurement(user: User): boolean {
  if (user.roleCode === 'super_admin' || user.roleCode === 'admin') return true;
  if (user.allowedModules && user.allowedModules.includes('procurement')) return true;
  return getEffectiveRole(user).canViewProcurement;
}
