import React, { useState } from 'react';
import { Logo } from '../../components/Logo';
import { useErpAuth } from '../context/ErpAuthContext';
import { ErpNotificationBell } from './ErpNotificationBell';
import { UserProfileModal } from './UserProfileModal';
import {
  UserCheck,
  Menu,
  LogOut,
} from 'lucide-react';

interface ErpHeaderProps {
  onToggleMobileDrawer?: () => void;
}

export const ErpHeader: React.FC<ErpHeaderProps> = ({
  onToggleMobileDrawer,
}) => {
  const { currentUser, logout } = useErpAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <header className="bg-white text-[#172033] border-b border-[#E2E8F0] sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-5">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Right: SAHLA Logo & Brand ERP Title */}
          <div className="flex items-center gap-2.5">
            {/* Mobile Hamburger Drawer Button */}
            {onToggleMobileDrawer && (
              <button
                onClick={onToggleMobileDrawer}
                className="lg:hidden p-2 rounded-xl bg-slate-50 hover:bg-[#EFF6FF] text-[#172033] hover:text-[#2563EB] border border-[#E2E8F0] transition-colors cursor-pointer"
                title="فتح القائمة الجانبية"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            <Logo size="sm" variant="light" />
            <div className="hidden sm:flex items-center gap-2.5 pr-3 border-r border-[#E2E8F0]">
              <span className="text-[11px] font-black text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-lg border border-[#2563EB]/25 font-mono">
                SAHLA ERP
              </span>
              <span className="text-[11px] text-[#64748B] font-medium">إدارة العمليات والتجارة الدولية</span>
            </div>
          </div>

          {/* Left Controls: Current Authenticated User & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser && (
              <>
                {/* Real-time In-App Notifications Feed */}
                <ErpNotificationBell />

                {/* Profile Badge Button */}
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-[#E2E8F0] hover:border-blue-300 text-xs text-right cursor-pointer transition-all"
                  title="فتح إعدادات الملف الشخصي وكلمة المرور"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#2563EB] text-white font-black flex items-center justify-center text-[11px] shrink-0 shadow-xs">
                    {currentUser.name.slice(0, 1)}
                  </div>
                  <div className="hidden sm:block text-right">
                    <div className="font-bold text-[#172033] text-[11px] leading-tight flex items-center gap-1.5">
                      <span>{currentUser.name}</span>
                      <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/80 font-mono font-bold">
                        [{currentUser.roleCode}]
                      </span>
                    </div>
                    <div className="text-[9px] text-[#64748B] font-medium">{currentUser.departmentNameAr}</div>
                  </div>
                  <UserCheck className="w-3.5 h-3.5 text-[#2563EB] mr-0.5 shrink-0 hidden sm:block" />
                </button>

                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                  title="تسجيل الخروج من الجلسة"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">تسجيل خروج</span>
                </button>

                {/* Personal Profile & Password Settings Modal */}
                <UserProfileModal
                  isOpen={isProfileModalOpen}
                  onClose={() => setIsProfileModalOpen(false)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
