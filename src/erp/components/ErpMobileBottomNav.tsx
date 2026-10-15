import React from 'react';
import {
  LayoutDashboard,
  GitBranch,
  Users,
  ShoppingBag,
  Ship,
  Menu,
} from 'lucide-react';
import { ErpActiveTab } from './ErpSidebar';
import { useErpAuth } from '../context/ErpAuthContext';

interface ErpMobileBottomNavProps {
  activeTab: ErpActiveTab;
  onSelectTab: (tab: ErpActiveTab) => void;
  onToggleDrawer: () => void;
  requestsCount?: number;
  customersCount?: number;
}

export const ErpMobileBottomNav: React.FC<ErpMobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onToggleDrawer,
  requestsCount = 0,
  customersCount = 0,
}) => {
  const { isModuleAllowed } = useErpAuth();

  const allTabs = [
    {
      id: 'dashboard' as ErpActiveTab,
      label: 'الرئيسية',
      icon: LayoutDashboard,
    },
    {
      id: 'requests_backbone' as ErpActiveTab,
      label: 'الطلبات',
      icon: GitBranch,
      badge: requestsCount ? String(requestsCount) : undefined,
    },
    {
      id: 'customers_master' as ErpActiveTab,
      label: 'العملاء',
      icon: Users,
      badge: customersCount ? String(customersCount) : undefined,
    },
    {
      id: 'procurement' as ErpActiveTab,
      label: 'المشتريات',
      icon: ShoppingBag,
    },
    {
      id: 'operations' as ErpActiveTab,
      label: 'العمليات',
      icon: Ship,
    },
  ];

  const tabs = allTabs.filter((t) => isModuleAllowed(t.id));

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white text-[#172033] border-t border-[#E2E8F0] z-40 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-bold transition-all relative min-w-[52px] ${
                isActive
                  ? 'text-[#2563EB] bg-[#EFF6FF]'
                  : 'text-[#64748B] hover:text-[#172033] hover:bg-slate-50'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -left-2 bg-[#F5B800] text-slate-950 font-mono text-[8px] font-black rounded-full px-1 py-0.2 shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="leading-tight">{tab.label}</span>
            </button>
          );
        })}

        {/* More / Menu Drawer Toggle */}
        <button
          onClick={onToggleDrawer}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-bold text-[#64748B] hover:text-[#2563EB] hover:bg-slate-50 min-w-[52px]"
          title="عرض باقي الأقسام والحسابات والضبط"
        >
          <Menu className="w-4 h-4 mb-0.5 text-[#64748B]" />
          <span className="leading-tight">المزيد</span>
        </button>
      </div>
    </nav>
  );
};
