import React, { useState, useEffect } from 'react';
import { ErpHeader } from './ErpHeader';
import { ErpSidebar, ErpActiveTab } from './ErpSidebar';
import { ErpMobileBottomNav } from './ErpMobileBottomNav';
import { ErpDashboardView } from '../modules/dashboard/ErpDashboardView';
import { RequestBackboneView } from '../modules/requests/RequestBackboneView';
import { TasksManagementView } from '../modules/tasks/TasksManagementView';
import { CustomerMasterView } from '../modules/customers/CustomerMasterView';
import { SupplierMasterView } from '../modules/procurement/SupplierMasterView';
import { CrmLeadsView } from '../modules/crm/CrmLeadsView';
import { ProcurementView } from '../modules/procurement/ProcurementView';
import { ProductCatalogView } from '../modules/products/ProductCatalogView';
import { FinanceView } from '../modules/finance/FinanceView';
import { OperationsLogisticsView } from '../modules/operations/OperationsLogisticsView';
import { AuditTrailView } from '../modules/foundation/AuditTrailView';
import { RbacManagementView } from '../modules/foundation/RbacManagementView';
import { ErpLoginView } from './ErpLoginView';
import { erpEngine } from '../engine/erpEngine';
import { useErpAuth } from '../context/ErpAuthContext';
import { ShieldAlert } from 'lucide-react';

export const ErpLayout: React.FC = () => {
  const { currentUser, isAuthenticated, isModuleAllowed, refreshData } = useErpAuth();
  const [activeTab, setActiveTab] = useState<ErpActiveTab>('dashboard');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Ensure activeTab is strictly allowed for current user
  useEffect(() => {
    if (isAuthenticated && currentUser && !isModuleAllowed(activeTab)) {
      const preferred: ErpActiveTab[] = [
        'dashboard',
        'requests_backbone',
        'tasks_management',
        'operations',
        'finance',
        'procurement',
        'suppliers_master',
        'customers_master',
        'crm_leads',
      ];
      const firstAllowed = preferred.find((m) => isModuleAllowed(m)) || 'dashboard';
      setActiveTab(firstAllowed);
    }
  }, [isAuthenticated, currentUser, activeTab, isModuleAllowed]);

  // If user is not authenticated, show secure verification login screen
  if (!isAuthenticated) {
    return <ErpLoginView onLoginSuccess={() => refreshData()} />;
  }

  const requests = erpEngine.getRequests();
  const customers = erpEngine.getCustomers();
  const leads = erpEngine.getLeads();
  const purchaseOrders = erpEngine.getPurchaseOrders();
  const shipments = erpEngine.getShipments();
  const receipts = erpEngine.getReceipts();
  const auditLogs = erpEngine.getAuditLogs();

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex flex-col font-['IBM_Plex_Sans_Arabic',sans-serif] text-[#172033] antialiased selection:bg-[#2563EB]/20 selection:text-[#172033] pb-16 lg:pb-0" dir="rtl">
      {/* Top Bar Header with User Profile and Sign Out */}
      <ErpHeader
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch min-h-[calc(100vh-4rem)]">
        {/* Desktop Sticky Sidebar (Strictly Filtered, Full Height, Persistent) */}
        <aside className="hidden lg:block lg:sticky lg:top-14 sm:lg:top-16 lg:h-[calc(100vh-3.5rem)] sm:lg:h-[calc(100vh-4rem)] lg:self-start lg:overflow-y-auto shrink-0 z-30 w-64 bg-white border-l border-[#E2E8F0] shadow-xs">
          <ErpSidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            requestsCount={requests.length}
            customersCount={customers.length}
            leadsCount={leads.length}
            posCount={purchaseOrders.length}
            shipmentsCount={shipments.length}
            receiptsCount={receipts.length}
            auditLogsCount={auditLogs.length}
          />
        </aside>

        {/* Mobile Slide-Over Drawer */}
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 bg-[#172033]/50 backdrop-blur-xs transition-opacity cursor-pointer"
            />
            {/* Sliding Drawer Content */}
            <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl z-50 overflow-y-auto">
              <ErpSidebar
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                requestsCount={requests.length}
                customersCount={customers.length}
                leadsCount={leads.length}
                posCount={purchaseOrders.length}
                shipmentsCount={shipments.length}
                receiptsCount={receipts.length}
                auditLogsCount={auditLogs.length}
                onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Workspace (RBAC Protected) */}
        <main className="flex-1 p-3 sm:p-4.5 lg:p-5 max-w-7xl mx-auto w-full min-w-0">
          {!isModuleAllowed(activeTab) ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E2E8F0] shadow-xs space-y-3">
              <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="text-base font-black text-[#172033]">غير مصرح لك بالوصول لهذا القسم</h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                تم تقييد الوصول لهذه الشاشة وفق سياسة عزل الأقسام وصلاحيات حسابك المعتمدة من المدير العام.
              </p>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="mt-2 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs cursor-pointer transition-colors shadow-xs"
              >
                العودة للوحة القيادة المسموحة
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <ErpDashboardView onNavigateTab={setActiveTab} />
              )}
              {activeTab === 'requests_backbone' && <RequestBackboneView />}
              {activeTab === 'tasks_management' && <TasksManagementView />}
              {activeTab === 'customers_master' && <CustomerMasterView />}
              {activeTab === 'suppliers_master' && <SupplierMasterView />}
              {activeTab === 'crm_leads' && (
                <CrmLeadsView onNavigateToCustomers={() => setActiveTab('customers_master')} />
              )}
              {activeTab === 'procurement' && <ProcurementView />}
              {activeTab === 'products_catalog' && <ProductCatalogView />}
              {activeTab === 'finance' && <FinanceView />}
              {activeTab === 'operations' && <OperationsLogisticsView />}
              {activeTab === 'audit_trail' && <AuditTrailView />}
              {activeTab === 'rbac_matrix' && <RbacManagementView />}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Smartphones - Filtered) */}
      <ErpMobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onToggleDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        requestsCount={requests.length}
        customersCount={customers.length}
      />
    </div>
  );
};
