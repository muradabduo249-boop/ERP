import React from 'react';
import { useErpAuth } from '../context/ErpAuthContext';
import {
  Users,
  Building2,
  ShieldCheck,
  History,
  Lock,
  GitBranch,
  DollarSign,
  ShoppingBag,
  Ship,
  Target,
  LayoutDashboard,
  CheckSquare,
  Package,
  X,
} from 'lucide-react';

export type ErpActiveTab =
  | 'dashboard'
  | 'requests_backbone'
  | 'tasks_management'
  | 'customers_master'
  | 'suppliers_master'
  | 'crm_leads'
  | 'procurement'
  | 'products_catalog'
  | 'finance'
  | 'operations'
  | 'client_tracking'
  | 'universal_attachments'
  | 'audit_trail'
  | 'master_data'
  | 'sequences'
  | 'rbac_matrix'
  | 'foundation_overview';

interface ErpSidebarProps {
  activeTab: ErpActiveTab;
  onSelectTab: (tab: ErpActiveTab) => void;
  requestsCount?: number;
  tasksCount?: number;
  customersCount?: number;
  suppliersCount?: number;
  leadsCount?: number;
  posCount?: number;
  shipmentsCount?: number;
  receiptsCount?: number;
  auditLogsCount?: number;
  attachmentsCount?: number;
  onCloseMobileDrawer?: () => void;
}

export const ErpSidebar: React.FC<ErpSidebarProps> = ({
  activeTab,
  onSelectTab,
  requestsCount = 0,
  tasksCount = 0,
  customersCount = 0,
  suppliersCount = 0,
  leadsCount = 0,
  posCount = 0,
  shipmentsCount = 0,
  receiptsCount = 0,
  auditLogsCount = 0,
  attachmentsCount = 0,
  onCloseMobileDrawer,
}) => {
  const { currentUser, isModuleAllowed } = useErpAuth();

  const navSections = [
    {
      title: 'العمليات الأساسية',
      items: [
        {
          id: 'dashboard' as ErpActiveTab,
          label: 'لوحة التحكم والقيادة',
          icon: LayoutDashboard,
        },
        {
          id: 'requests_backbone' as ErpActiveTab,
          label: 'الطلبات المركزية',
          icon: GitBranch,
          badge: requestsCount ? String(requestsCount) : undefined,
          badgeColor: 'bg-amber-100 text-amber-900',
        },
        {
          id: 'tasks_management' as ErpActiveTab,
          label: 'إدارة المهام والواجبات',
          icon: CheckSquare,
          badge: tasksCount ? String(tasksCount) : undefined,
          badgeColor: 'bg-emerald-100 text-emerald-900',
        },
        {
          id: 'customers_master' as ErpActiveTab,
          label: 'سجل العملاء',
          icon: Users,
          badge: customersCount ? String(customersCount) : undefined,
          badgeColor: 'bg-blue-100 text-blue-900',
        },
        {
          id: 'suppliers_master' as ErpActiveTab,
          label: 'سجل الموردين (المصانع العالمية)',
          icon: Building2,
          badge: suppliersCount ? String(suppliersCount) : undefined,
          badgeColor: 'bg-indigo-100 text-indigo-900',
        },
        {
          id: 'crm_leads' as ErpActiveTab,
          label: 'المبيعات والفرص (CRM)',
          icon: Target,
          badge: leadsCount ? String(leadsCount) : undefined,
        },
        {
          id: 'procurement' as ErpActiveTab,
          label: 'المشتريات والتوريد',
          icon: ShoppingBag,
          badge: posCount ? String(posCount) : undefined,
          badgeColor: 'bg-purple-100 text-purple-900',
        },
        {
          id: 'products_catalog' as ErpActiveTab,
          label: 'كتالوج المنتجات والسلع',
          icon: Package,
          badgeColor: 'bg-teal-100 text-teal-900',
        },
        {
          id: 'finance' as ErpActiveTab,
          label: 'المالية والخزينة',
          icon: DollarSign,
          badge: receiptsCount ? String(receiptsCount) : undefined,
          badgeColor: 'bg-emerald-100 text-emerald-900',
        },
        {
          id: 'operations' as ErpActiveTab,
          label: 'العمليات والتخليص',
          icon: Ship,
          badge: shipmentsCount ? String(shipmentsCount) : undefined,
          badgeColor: 'bg-sky-100 text-sky-900',
        },
      ],
    },
    {
      title: 'الحوكمة والأمان',
      items: [
        {
          id: 'audit_trail' as ErpActiveTab,
          label: 'سجل التدقيق العام (Audit Trail)',
          icon: History,
          badge: auditLogsCount ? String(auditLogsCount) : undefined,
        },
        {
          id: 'rbac_matrix' as ErpActiveTab,
          label: 'إدارة الموظفين والصلاحيات',
          icon: Lock,
        },
      ],
    },
  ];

  // Filter items by current user permissions
  const filteredSections = navSections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => isModuleAllowed(item.id)),
    }))
    .filter((sec) => sec.items.length > 0);

  const handleSelect = (tab: ErpActiveTab) => {
    onSelectTab(tab);
    if (onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  return (
    <aside className="w-full lg:w-60 bg-white border-l border-[#E2E8F0] flex flex-col justify-between shrink-0 p-3 text-right">
      <div className="space-y-3.5">
        {/* Mobile Header with Close Button */}
        {onCloseMobileDrawer && (
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E8F0] lg:hidden">
            <span className="font-bold text-[#172033] text-xs">قائمة أقسام ERP</span>
            <button
              onClick={onCloseMobileDrawer}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#EFF6FF] text-[#172033] hover:text-[#2563EB] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Active Department & Queue indicator */}
        {currentUser && (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-[#E2E8F0] text-xs space-y-1">
            <div className="text-[10px] text-[#64748B] font-medium">القسم التشغيلي النشط:</div>
            <div className="font-bold text-[#172033] flex items-center justify-between text-xs">
              <span>{currentUser.departmentNameAr}</span>
              <span className="text-[9px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80">
                {currentUser.departmentCode}
              </span>
            </div>
            <div className="text-[10px] text-[#64748B] pt-1 border-t border-[#E2E8F0] flex items-center justify-between">
              <span>الدور الوظيفي:</span>
              <span className="font-semibold text-[#172033]">{currentUser.roleNameAr}</span>
            </div>
          </div>
        )}

        {/* Navigation Sections (Filtered strictly by User Permissions) */}
        {filteredSections.map((sec, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-2 text-[9px] font-bold text-[#64748B] uppercase tracking-wider">
              {sec.title}
            </div>
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
                      isActive
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'text-[#172033] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-[#64748B]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                          isActive
                            ? 'bg-[#F5B800] text-slate-950 shadow-xs'
                            : (item as any).badgeColor || 'bg-slate-100 text-[#64748B]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer: Architecture Note */}
      <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 text-[10px] text-[#172033] space-y-0.5 mt-3">
        <div className="font-bold flex items-center gap-1 text-[#2563EB]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>مبدأ المعمارية الأساسي:</span>
        </div>
        <p className="text-[9px] text-[#64748B] leading-relaxed">
          الطلب يربط كافة الإدارات. لا يتم دمج حقول كل قسم في جدول الطلب المركزي.
        </p>
      </div>
    </aside>
  );
};
