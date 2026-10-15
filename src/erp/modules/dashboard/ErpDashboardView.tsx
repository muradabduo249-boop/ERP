import React from 'react';
import {
  Users,
  GitBranch,
  ShoppingBag,
  Ship,
  FileCheck2,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Layers,
  Clock,
  CheckCircle2,
  PackageCheck,
  Building2,
} from 'lucide-react';
import { erpEngine } from '../../engine/erpEngine';
import { useErpAuth } from '../../context/ErpAuthContext';
import { ErpActiveTab } from '../../components/ErpSidebar';

interface ErpDashboardViewProps {
  onNavigateTab: (tab: ErpActiveTab) => void;
}

export const ErpDashboardView: React.FC<ErpDashboardViewProps> = ({ onNavigateTab }) => {
  const {
    currentUser,
    isModuleAllowed,
    canViewFinancials,
    canViewCustoms,
    canViewProcurement,
  } = useErpAuth();

  const customers = erpEngine.getCustomers();
  const requests = erpEngine.getRequests();
  const suppliers = erpEngine.getSuppliers();
  const purchaseOrders = erpEngine.getPurchaseOrders();
  const shipments = erpEngine.getShipments();
  const inspections = erpEngine.getInspections();
  const receipts = erpEngine.getReceipts();
  const auditLogs = erpEngine.getAuditLogs();

  const isCleanSlate = customers.length === 0 && requests.length === 0;

  const totalReceiptsAmount = receipts.reduce((acc, r) => acc + (r.amount || 0), 0);
  const totalPoAmount = purchaseOrders.reduce((acc, p) => acc + (p.totalAmount || 0), 0);

  return (
    <div className="space-y-6 text-right">
      {/* Top Banner: Standalone ERP Status & Clean Slate Controls */}
      <div className="bg-gradient-to-l from-[#2563EB] to-[#3478B8] text-white p-5 sm:p-6 rounded-3xl shadow-md border border-[#2563EB]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F5B800] text-slate-950 shadow-xs">
              نظام إدارة العمليات والتجارة الدولية SAHLA ERP
            </span>
            {isCleanSlate ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white border border-white/30 flex items-center gap-1 backdrop-blur-xs">
                <CheckCircle2 className="w-3 h-3 text-[#F5B800]" />
                النظام نظيف من الصفر (جاهز للتشغيل الفعلي)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white border border-white/30 flex items-center gap-1 backdrop-blur-xs">
                <Sparkles className="w-3 h-3 text-[#F5B800]" />
                بيانات عمليات نشطة ({requests.length} طلب)
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            مرحباً، {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-blue-50 mt-1 max-w-2xl leading-relaxed">
            منصة سهلا التشغيلية المتكاملة: ربط رحلة العميل من الطلب عبر المشتريات، المالية، فحص الجودة، الشحن، التخليص، وحتى التسليم والإغلاق.
          </p>
        </div>

        {/* Quick Operational Shortcuts */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          {isModuleAllowed('requests_backbone') && (
            <button
              onClick={() => onNavigateTab('requests_backbone')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#F5B800] hover:bg-[#E0A600] text-slate-950 font-black text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-950" />
              <span>تسجيل طلب جديد</span>
            </button>
          )}
          {isModuleAllowed('customers_master') && (
            <button
              onClick={() => onNavigateTab('customers_master')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-all border border-white/30 backdrop-blur-xs cursor-pointer active:scale-95"
            >
              <Users className="w-3.5 h-3.5 text-blue-100" />
              <span>إضافة عميل</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Operational Metric Cards (Filtered by RBAC Scope) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Customers (Sales / Admin only) */}
        {isModuleAllowed('customers_master') && (
          <div
            onClick={() => onNavigateTab('customers_master')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#F5B800] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {customers.length}
            </div>
            <div className="text-xs text-slate-500 font-bold mt-1">العملاء والشركات</div>
            <div className="text-[11px] text-blue-600 font-medium mt-1">سجل العملاء الرئيسي SH-C</div>
          </div>
        )}

        {/* Requests Backbone (All relevant roles) */}
        {isModuleAllowed('requests_backbone') && (
          <div
            onClick={() => onNavigateTab('requests_backbone')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#F5B800] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <GitBranch className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {requests.length}
            </div>
            <div className="text-xs text-slate-500 font-bold mt-1">الطلبات التشغيلية</div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">العمود الفقري REQ</div>
          </div>
        )}

        {/* Procurement / POs (Procurement / Admin only) */}
        {isModuleAllowed('procurement') && (
          <div
            onClick={() => onNavigateTab('procurement')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#F5B800] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {purchaseOrders.length}
            </div>
            <div className="text-xs text-slate-500 font-bold mt-1">أوامر الشراء والتوريد</div>
            <div className="text-[11px] text-purple-600 font-medium mt-1">
              {suppliers.length} موردين معتمدين
            </div>
          </div>
        )}

        {/* Operations / Customs (Operations / Customs / Admin only) */}
        {isModuleAllowed('operations') && (
          <div
            onClick={() => onNavigateTab('operations')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#F5B800] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Ship className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {shipments.length}
            </div>
            <div className="text-xs text-slate-500 font-bold mt-1">الشحنات والجمارك</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              {inspections.length} فحص جودة مكتمل
            </div>
          </div>
        )}

        {/* Finance / Treasury (Finance / Admin only) */}
        {isModuleAllowed('finance') && (
          <div
            onClick={() => onNavigateTab('finance')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {receipts.length}
            </div>
            <div className="text-xs text-slate-500 font-bold mt-1">المالية والمقبوضات</div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">
              {totalReceiptsAmount.toLocaleString()} SDG متحصلات
            </div>
          </div>
        )}
      </div>

      {/* Architecture & Flow Workflow (As per IT Handover Document) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              مسار التدفق التشغيلي لنظام سهلا (Workflow Architecture)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ترابط رحلة المعاملة من العميل والطلب المركزي عبر كافة الإدارات التنفيذية
            </p>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-mono font-bold">
            IT Handover Spec
          </span>
        </div>

        {/* Horizontal Flow Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
          <div
            onClick={() => onNavigateTab('customers_master')}
            className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all"
          >
            <div className="w-7 h-7 mx-auto rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-1.5 font-bold">
              1
            </div>
            <div className="font-bold text-slate-900">العميل</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Customer Master</div>
          </div>

          <div
            onClick={() => onNavigateTab('requests_backbone')}
            className="p-3 rounded-xl bg-amber-50/60 border border-amber-300 hover:bg-amber-100/60 cursor-pointer transition-all"
          >
            <div className="w-7 h-7 mx-auto rounded-lg bg-[#F5B800] text-slate-950 flex items-center justify-center mb-1.5 font-bold">
              2
            </div>
            <div className="font-bold text-slate-900">الطلب المركزي</div>
            <div className="text-[10px] text-amber-700 font-mono mt-0.5">Request Backbone</div>
          </div>

          <div
            onClick={() => onNavigateTab('procurement')}
            className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 cursor-pointer transition-all"
          >
            <div className="w-7 h-7 mx-auto rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-1.5 font-bold">
              3
            </div>
            <div className="font-bold text-slate-900">المشتريات</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">RFQ & PO</div>
          </div>

          <div
            onClick={() => onNavigateTab('finance')}
            className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 cursor-pointer transition-all"
          >
            <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5 font-bold">
              4
            </div>
            <div className="font-bold text-slate-900">المالية والحسابات</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Receipts & Invoices</div>
          </div>

          <div
            onClick={() => onNavigateTab('operations')}
            className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 cursor-pointer transition-all"
          >
            <div className="w-7 h-7 mx-auto rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center mb-1.5 font-bold">
              5
            </div>
            <div className="font-bold text-slate-900">فحص الجودة QC</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Factory Inspection</div>
          </div>

          <div
            onClick={() => onNavigateTab('operations')}
            className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition-all"
          >
            <div className="w-7 h-7 mx-auto rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-1.5 font-bold">
              6
            </div>
            <div className="font-bold text-slate-900">الشحن والتخليص</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Port Sudan Customs</div>
          </div>

          <div
            onClick={() => onNavigateTab('operations')}
            className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 cursor-pointer transition-all"
          >
            <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5 font-bold">
              7
            </div>
            <div className="font-bold text-slate-900">التسليم والإغلاق</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">POD & Close</div>
          </div>
        </div>
      </div>

      {/* Quick Launch & Active Operations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Requests & Recent Operational Flow */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#D99B00]" />
                <h3 className="font-bold text-slate-900 text-sm">أحدث الطلبات التشغيلية المركزية</h3>
              </div>
              <button
                onClick={() => onNavigateTab('requests_backbone')}
                className="text-xs font-bold text-[#D99B00] hover:underline"
              >
                عرض كافة الطلبات ({requests.length})
              </button>
            </div>

            {requests.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <PackageCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <div className="text-sm font-bold text-slate-700">لا توجد طلبات تشغيلية مسجلة بعد</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  النظام مهيأ من الصفر (Clean Slate) جاهز لاستقبال وتسجيل أول طلب خدمة تجاري.
                </p>
                <div className="mt-4 flex items-center justify-center">
                  <button
                    onClick={() => onNavigateTab('requests_backbone')}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] transition-colors shadow-xs cursor-pointer"
                  >
                    + تسجيل أول طلب تشغيلي
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {requests.slice(0, 4).map((req) => (
                  <div
                    key={req.id}
                    onClick={() => onNavigateTab('requests_backbone')}
                    className="p-3.5 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB]/40 bg-slate-50/50 hover:bg-[#EFF6FF]/40 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#2563EB] bg-white px-2 py-0.5 rounded-lg border border-[#E2E8F0] shadow-2xs">
                          {req.requestCode}
                        </span>
                        <span className="font-bold text-[#172033]">{req.title}</span>
                      </div>
                      <div className="text-[#64748B] text-[11px] mt-1 flex items-center gap-2">
                        <span>العميل: <strong className="text-[#172033]">{req.customerName}</strong></span>
                        <span>•</span>
                        <span>القسم: <strong className="text-[#172033]">{req.departmentCode}</strong></span>
                        <span>•</span>
                        <span>المسؤول: {req.assignedToUserName || 'غير معين'}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {req.status === 'in_progress' ? 'قيد التنفيذ' : req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Audit Trail & System Security Highlights */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                <h3 className="font-bold text-[#172033] text-sm">سجل التدقيق الفوري</h3>
              </div>
              <button
                onClick={() => onNavigateTab('audit_trail')}
                className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer"
              >
                عرض السجل
              </button>
            </div>

            <div className="space-y-3">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="text-xs border-b border-[#E2E8F0] pb-2.5 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-1">
                    <span className="font-bold text-[#172033]">{log.actorName}</span>
                    <span className="font-mono text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[#64748B] text-[11px] leading-relaxed line-clamp-2">
                    {log.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts to Core Operations */}
          <div className="bg-white text-[#172033] p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
            <div className="text-xs font-bold text-[#2563EB] uppercase tracking-wider flex items-center justify-between">
              <span>إجراءات سريعة فورية</span>
              <span className="w-2 h-2 rounded-full bg-[#F5B800]"></span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {isModuleAllowed('customers_master') && (
                <button
                  onClick={() => onNavigateTab('customers_master')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#EFF6FF] text-[#172033] hover:text-[#2563EB] border border-[#E2E8F0] font-medium text-right flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>+ عميل جديد</span>
                  <Users className="w-3.5 h-3.5 text-[#2563EB]" />
                </button>
              )}
              {isModuleAllowed('requests_backbone') && (
                <button
                  onClick={() => onNavigateTab('requests_backbone')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#EFF6FF] text-[#172033] hover:text-[#2563EB] border border-[#E2E8F0] font-medium text-right flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>+ طلب جديد</span>
                  <GitBranch className="w-3.5 h-3.5 text-[#2563EB]" />
                </button>
              )}
              {isModuleAllowed('procurement') && (
                <button
                  onClick={() => onNavigateTab('procurement')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#EFF6FF] text-[#172033] hover:text-[#2563EB] border border-[#E2E8F0] font-medium text-right flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>+ أمر شراء PO</span>
                  <ShoppingBag className="w-3.5 h-3.5 text-[#2563EB]" />
                </button>
              )}
              {isModuleAllowed('finance') && (
                <button
                  onClick={() => onNavigateTab('finance')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#EFF6FF] text-[#172033] hover:text-[#2563EB] border border-[#E2E8F0] font-medium text-right flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>+ سند قبض مالي</span>
                  <DollarSign className="w-3.5 h-3.5 text-[#2563EB]" />
                </button>
              )}
              {isModuleAllowed('operations') && (
                <button
                  onClick={() => onNavigateTab('operations')}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-[#EFF6FF] text-[#172033] hover:text-[#2563EB] border border-[#E2E8F0] font-medium text-right flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>+ إجراءات الجمارك</span>
                  <Ship className="w-3.5 h-3.5 text-[#2563EB]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
