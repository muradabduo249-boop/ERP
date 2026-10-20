import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { erpEngine } from '../../engine/erpEngine';
import { useErpAuth } from '../../context/ErpAuthContext';
import { SearchableSelector, SearchOption } from '../../components/SearchableSelector';
import {
  GitBranch,
  Plus,
  Search,
  Filter,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ArrowLeft,
  ChevronRight,
  Eye,
  History,
  Paperclip,
  Check,
  Ban,
  HelpCircle,
  ShieldCheck,
  User,
  ShoppingBag,
  DollarSign,
  Ship,
  FileCheck2,
  Printer,
  Upload,
  Receipt,
  Scale,
  PackageCheck,
  MessageSquare,
  Download,
  Database,
} from 'lucide-react';
import { RequestHeader, RequestPriority, RequestStatus, RequestApprovalStatus, UniversalAttachment } from '../../../types';
import { ErpDocumentPrintModal, PrintableDocType } from '../../components/ErpDocumentPrintModal';
import { ErpWhatsAppModal } from '../../components/ErpWhatsAppModal';
import { ErpMigrationModal } from '../../components/ErpMigrationModal';
import { exportToCsv } from '../../../lib/exportUtils';

export const RequestBackboneView: React.FC = () => {
  const {
    currentUser,
    users,
    hasPermission,
    refreshData,
    isRequestSubTabAllowed,
    canViewFinancials,
    sessionToken,
  } = useErpAuth();
  const [selectedQueue, setSelectedQueue] = useState<
    'all' | 'my_requests' | 'my_assigned' | 'department' | 'ready' | 'pending_approval'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<RequestHeader | null>(null);
  const [detailedRequest, setDetailedRequest] = useState<any | null>(null);
  const [serverRequests, setServerRequests] = useState<any[]>([]);
  const [serverCustomers, setServerCustomers] = useState<any[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newTimelineNote, setNewTimelineNote] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  const [showNewModal, setShowNewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [whatsappModalData, setWhatsappModalData] = useState<{
    type: any;
    data: any;
    phone: string;
  } | null>(null);

  // Drawer Tab & Print State
  const [drawerSubTab, setDrawerSubTab] = useState<'overview' | 'procurement' | 'finance' | 'operations' | 'attachments' | 'audit'>('overview');
  const [printableDoc, setPrintableDoc] = useState<{ type: PrintableDocType; data: any } | null>(null);

  // Attachment upload state inside drawer
  const [newAttName, setNewAttName] = useState('');
  const [newAttCategory, setNewAttCategory] = useState<UniversalAttachment['category']>('commercial_invoice');
  const [newAttVisibility, setNewAttVisibility] = useState<UniversalAttachment['visibility']>('public_tracking');

  // Status transition state
  const [targetStatus, setTargetStatus] = useState<RequestStatus>('in_progress');
  const [statusNotes, setStatusNotes] = useState('');

  // Assign state
  const [targetUserId, setTargetUserId] = useState('');

  // Approval state
  const [approvalDecision, setApprovalDecision] = useState<RequestApprovalStatus>('approved');
  const [approvalNotes, setApprovalNotes] = useState('');

  // Create Request State
  const engineCustomers = erpEngine.getCustomers();
  const customers = serverCustomers.length > 0 ? serverCustomers : engineCustomers;
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [reqTitle, setReqTitle] = useState('');
  const [reqType, setReqType] = useState('PURCHASE_AND_SHIP');
  const [reqPriority, setReqPriority] = useState<RequestPriority>('normal');
  const [reqNotes, setReqNotes] = useState('');

  const customerOptions: SearchOption[] = useMemo(() => {
    return customers.map((c: any) => ({
      id: c.id,
      title: c.companyName || c.tradeName || c.contactName || 'عميل',
      code: c.customerCode || '',
      subtitle: `${c.primaryPhone || c.phone || ''} | ${c.city || ''} (${c.country || 'السودان'})`,
      badge: c.customerCode || 'عميل',
      meta: c,
    }));
  }, [customers]);

  // Initialize selectedCustomerId when customers load
  useEffect(() => {
    if (!selectedCustomerId && customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  const fetchServerRequests = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const params = new URLSearchParams({
        queue: selectedQueue,
        search: searchQuery,
        limit: '100',
      });
      const res = await fetch(`/api/requests?${params.toString()}`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setServerRequests(data.data);
      }
    } catch {}
  }, [sessionToken, selectedQueue, searchQuery]);

  const fetchServerCustomers = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const res = await fetch('/api/customers?limit=100', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setServerCustomers(data.data);
      }
    } catch {}
  }, [sessionToken]);

  useEffect(() => {
    fetchServerRequests();
  }, [fetchServerRequests]);

  useEffect(() => {
    fetchServerCustomers();
  }, [fetchServerCustomers]);

  const handleSelectRequest = async (req: RequestHeader) => {
    setSelectedRequest(req);
    setActionError(null);
    if (!sessionToken) return;
    try {
      const res = await fetch(`/api/requests/${req.id}`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setDetailedRequest(data.data);
      }
    } catch {}
  };

  const engineRequests = erpEngine.getRequests();
  const requests: RequestHeader[] = serverRequests.length > 0
    ? serverRequests.map((r: any) => ({
        id: r.id,
        requestCode: r.requestCode,
        customerId: r.customerId,
        customerCode: r.customer?.customerCode || 'SH-C',
        customerName: r.customer?.companyName || 'عميل',
        customerPhone: r.customer?.primaryPhone || '',
        requestTypeCode: r.requestType,
        departmentCode: r.department?.code || 'COMMERCIAL',
        title: r.title,
        priority: r.priority,
        status: r.status,
        approvalStatus: r.approvalStatus,
        assignedToUserId: r.assignedUserId || undefined,
        assignedToUserName: r.assignedUser?.name || undefined,
        assignedAt: r.assignedAt || undefined,
        notes: r.notes || undefined,
        readyForProcessingAt: r.readyForProcessingAt || undefined,
        completedAt: r.completedAt || undefined,
        createdBy: r.createdBy || '',
        createdByName: '',
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }))
    : engineRequests;

  // Filter queues
  const filtered = requests.filter((r) => {
    let matchQueue = true;
    if (selectedQueue === 'my_requests') {
      matchQueue = r.createdBy === currentUser.id;
    } else if (selectedQueue === 'my_assigned') {
      matchQueue = r.assignedToUserId === currentUser.id;
    } else if (selectedQueue === 'department') {
      matchQueue = r.departmentCode === currentUser.departmentCode;
    } else if (selectedQueue === 'ready') {
      matchQueue = r.status === 'ready_for_processing';
    } else if (selectedQueue === 'pending_approval') {
      matchQueue = r.approvalStatus === 'pending_approval';
    }

    const matchSearch =
      r.requestCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerCode.toLowerCase().includes(searchQuery.toLowerCase());

    return matchQueue && matchSearch;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim() || !selectedCustomerId) return;
    setSubmitting(true);
    setActionError(null);

    if (sessionToken) {
      try {
        const res = await fetch('/api/requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            customerId: selectedCustomerId,
            title: reqTitle.trim(),
            requestType: reqType,
            priority: reqPriority,
            notes: reqNotes.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowNewModal(false);
          setReqTitle('');
          setReqNotes('');
          setSubmitting(false);
          fetchServerRequests();
          handleSelectRequest(data.data);
          return;
        } else {
          setActionError(data.error?.message || 'فشل إنشاء الطلب');
          setSubmitting(false);
          return;
        }
      } catch (err: any) {
        setActionError(err.message || 'حدث خطأ في الاتصال بالخادم');
        setSubmitting(false);
        return;
      }
    }

    const created = erpEngine.createRequest(
      {
        customerId: selectedCustomerId,
        requestTypeCode: reqType,
        title: reqTitle.trim(),
        priority: reqPriority,
        notes: reqNotes.trim() || undefined,
      },
      currentUser
    );

    setShowNewModal(false);
    setReqTitle('');
    setReqNotes('');
    refreshData();
    setSelectedRequest(created);
    setSubmitting(false);
  };

  const handleExecuteStatusTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setSubmitting(true);
    setActionError(null);

    if (sessionToken) {
      try {
        const res = await fetch(`/api/requests/${selectedRequest.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            targetStatus,
            notes: statusNotes.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowStatusModal(false);
          setStatusNotes('');
          setSubmitting(false);
          fetchServerRequests();
          handleSelectRequest(data.data);
          return;
        } else {
          setActionError(data.error?.message || 'فشل تغيير حالة الطلب');
          setSubmitting(false);
          return;
        }
      } catch (err: any) {
        setActionError(err.message || 'فشل الاتصال بالخادم');
        setSubmitting(false);
        return;
      }
    }

    const updated = erpEngine.transitionRequestStatus(
      selectedRequest.id,
      targetStatus,
      statusNotes,
      currentUser
    );

    setSelectedRequest(updated);
    setShowStatusModal(false);
    setStatusNotes('');
    refreshData();
    setSubmitting(false);
  };

  const handleExecuteAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !targetUserId) return;
    setSubmitting(true);
    setActionError(null);

    if (sessionToken) {
      try {
        const res = await fetch(`/api/requests/${selectedRequest.id}/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            assignedUserId: targetUserId,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowAssignModal(false);
          setSubmitting(false);
          fetchServerRequests();
          handleSelectRequest(data.data);
          return;
        } else {
          setActionError(data.error?.message || 'فشل إسناد الطلب');
          setSubmitting(false);
          return;
        }
      } catch (err: any) {
        setActionError(err.message || 'فشل الاتصال بالخادم');
        setSubmitting(false);
        return;
      }
    }

    const updated = erpEngine.assignRequest(selectedRequest.id, targetUserId, currentUser);
    setSelectedRequest(updated);
    setShowAssignModal(false);
    refreshData();
    setSubmitting(false);
  };

  const handleExecuteApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setSubmitting(true);
    setActionError(null);

    if (sessionToken) {
      try {
        const res = await fetch(`/api/requests/${selectedRequest.id}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            decision: approvalDecision,
            notes: approvalNotes.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowApprovalModal(false);
          setApprovalNotes('');
          setSubmitting(false);
          fetchServerRequests();
          handleSelectRequest(data.data);
          return;
        } else {
          setActionError(data.error?.message || 'فشل تسجيل قرار الاعتماد');
          setSubmitting(false);
          return;
        }
      } catch (err: any) {
        setActionError(err.message || 'فشل الاتصال بالخادم');
        setSubmitting(false);
        return;
      }
    }

    const updated = erpEngine.recordApprovalDecision(
      selectedRequest.id,
      approvalDecision,
      approvalNotes,
      currentUser
    );
    setSelectedRequest(updated);
    setShowApprovalModal(false);
    setApprovalNotes('');
    refreshData();
    setSubmitting(false);
  };

  const handleAddTimelineNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !newTimelineNote.trim() || !sessionToken) return;
    try {
      const res = await fetch(`/api/requests/${selectedRequest.id}/timeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ notes: newTimelineNote.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewTimelineNote('');
        handleSelectRequest(selectedRequest);
      }
    } catch {}
  };

  const queues = [
    { id: 'all', label: 'كافة الطلبات' },
    { id: 'my_requests', label: 'طلباتي المنشأة' },
    { id: 'my_assigned', label: 'المهام المسندة لي' },
    { id: 'department', label: `مهام قسم ${currentUser.departmentNameAr}` },
    { id: 'ready', label: 'جاهز للمعالجة (Ready)' },
    { id: 'pending_approval', label: 'بانتظار الاعتماد' },
  ];

  const handleExportRequests = () => {
    const headers = [
      'كود الطلب',
      'كود العميل',
      'اسم العميل',
      'عنوان المعاملة',
      'النوع',
      'الأولوية',
      'الحالة',
      'الموظف المسؤول',
      'الاعتماد',
      'تاريخ الإنشاء',
    ];
    const rows = requests.map((r) => [
      r.requestCode,
      r.customerCode,
      r.customerName,
      r.title,
      r.requestTypeCode,
      r.priority,
      r.status,
      r.assignedToUserName || 'غير معين',
      r.approvalStatus,
      r.createdAt.split('T')[0],
    ]);
    exportToCsv('SAHLA_Requests_Master_Register', headers, rows);
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="w-5 h-5 text-[#D99B00]" />
            <h2 className="text-xl font-bold text-slate-900">
              سجل الطلبات التشغيلية المركزية
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            يربط كيان الطلب (Request ID) العميل بالقسم التشغيلي، ويتفرع منه التوريد والمالية والشحن والتخليص دون تكديس.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowMigrationModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs transition-all shadow-xs"
            title="أداة ترحيل البيانات التاريخية من Google Sheets و AppSheet"
          >
            <Database className="w-3.5 h-3.5 text-purple-700" />
            <span>ترحيل من Sheets</span>
          </button>

          <button
            onClick={handleExportRequests}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all border border-slate-200"
            title="تصدير سجل الطلبات إلى Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F5B800]" />
            <span>إنشاء طلب جديد +</span>
          </button>
        </div>
      </div>

      {/* Queues Selector & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative w-full lg:w-80">
          <input
            type="text"
            placeholder="بحث برقم الطلب، اسم العميل، العنوان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#172033] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none"
          />
          <Search className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full lg:w-auto">
          {queues.map((q) => (
            <button
              key={q.id}
              onClick={() => setSelectedQueue(q.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedQueue === q.id
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-slate-100 text-[#172033] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="py-4 px-5">كود الطلب (Request Code)</th>
                <th className="py-4 px-5">العميل (Customer Code)</th>
                <th className="py-4 px-5">عنوان الطلب ونوعه</th>
                <th className="py-4 px-5">القسم الموجه إليه</th>
                <th className="py-4 px-5">الموظف المعين</th>
                <th className="py-4 px-5 text-center">الأولوية</th>
                <th className="py-4 px-5 text-center">الحالة التشغيلية</th>
                <th className="py-4 px-5 text-center">الاعتماد</th>
                <th className="py-4 px-5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    لا توجد طلبات في هذا الطابور تطابق معايير البحث.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => handleSelectRequest(req)}
                    className="hover:bg-[#EFF6FF]/50 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-5 font-mono font-black text-[#2563EB]">
                      {req.requestCode}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-[#172033]">{req.customerName}</div>
                      <div className="text-[11px] font-mono text-amber-700 font-bold">
                        {req.customerCode}
                      </div>
                    </td>
                    <td className="py-4 px-5 max-w-xs">
                      <div className="font-semibold text-[#172033] truncate">{req.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{req.requestTypeCode}</div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                        {req.departmentCode}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-medium text-slate-700">
                        {req.assignedToUserName || 'غير معين'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : req.priority === 'high'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {req.priority === 'urgent'
                          ? 'عاجل جداً'
                          : req.priority === 'high'
                          ? 'مرتفع'
                          : req.priority === 'normal'
                          ? 'عادي'
                          : 'منخفض'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          req.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : req.status === 'ready_for_processing'
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : req.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {req.status === 'new'
                          ? 'جديد'
                          : req.status === 'assigned'
                          ? 'تم الإسناد'
                          : req.status === 'ready_for_processing'
                          ? 'جاهز للمعالجة'
                          : req.status === 'in_progress'
                          ? 'قيد التنفيذ'
                          : req.status === 'completed'
                          ? 'مكتمل'
                          : req.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.approvalStatus === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.approvalStatus === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : req.approvalStatus === 'changes_requested'
                            ? 'bg-amber-100 text-amber-900'
                            : 'text-slate-400'
                        }`}
                      >
                        {req.approvalStatus === 'approved'
                          ? 'معتمد'
                          : req.approvalStatus === 'rejected'
                          ? 'مرفوض'
                          : req.approvalStatus === 'changes_requested'
                          ? 'تعديل مطلوب'
                          : 'لا يتطلب'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setWhatsappModalData({
                              type: 'order_received',
                              data: {
                                customerName: req.customerName,
                                requestCode: req.requestCode,
                              },
                              phone: '',
                            });
                          }}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                          title="إرسال تحديث للعميل عبر واتساب"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRequest(req);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#2563EB] hover:text-white text-[#172033] transition-colors cursor-pointer"
                          title="استعراض التفاصيل وسجل التدقيق"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= DETAIL & JOURNEY DRAWER ================= */}
      {selectedRequest && !showStatusModal && !showAssignModal && !showApprovalModal && (() => {
        const linked = erpEngine.getLinkedEntitiesForRequest(selectedRequest.id);
        const reqAttachments = erpEngine.getAttachments({ requestId: selectedRequest.id });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-8 text-right space-y-6 shadow-2xl border border-slate-200">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
                <div>
                  <div className="text-xs text-slate-400 font-mono">
                    Technical UUID: {selectedRequest.id}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20">
                      {selectedRequest.requestTypeCode}
                    </span>
                    <h3 className="text-2xl font-black text-[#2563EB] font-mono">
                      {selectedRequest.requestCode}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Sub-tabs Navigation inside Drawer */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#E2E8F0] text-xs font-bold scrollbar-none">
                <button
                  onClick={() => setDrawerSubTab('overview')}
                  className={`px-3 py-2 rounded-xl shrink-0 transition-all cursor-pointer ${
                    drawerSubTab === 'overview'
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'bg-slate-100 text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
                  }`}
                >
                  المسار التشغيلي العام
                </button>
                {isRequestSubTabAllowed('procurement') && (
                  <button
                    onClick={() => setDrawerSubTab('procurement')}
                    className={`px-3 py-2 rounded-xl shrink-0 flex items-center gap-1.5 transition-all ${
                      drawerSubTab === 'procurement'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>المشتريات والتوريد ({linked.purchaseOrders.length + linked.rfqs.length})</span>
                  </button>
                )}
                {isRequestSubTabAllowed('finance') && (
                  <button
                    onClick={() => setDrawerSubTab('finance')}
                    className={`px-3 py-2 rounded-xl shrink-0 flex items-center gap-1.5 transition-all ${
                      drawerSubTab === 'finance'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>المالية والتحصيل ({linked.invoices.length + linked.receipts.length})</span>
                  </button>
                )}
                {isRequestSubTabAllowed('operations') && (
                  <button
                    onClick={() => setDrawerSubTab('operations')}
                    className={`px-3 py-2 rounded-xl shrink-0 flex items-center gap-1.5 transition-all ${
                      drawerSubTab === 'operations'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Ship className="w-3.5 h-3.5" />
                    <span>الشحن واللوجستيات ({linked.shipments.length + linked.inspections.length + linked.customs.length})</span>
                  </button>
                )}
                <button
                  onClick={() => setDrawerSubTab('attachments')}
                  className={`px-3 py-2 rounded-xl shrink-0 flex items-center gap-1.5 transition-all ${
                    drawerSubTab === 'attachments'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>المرفقات ({reqAttachments.length})</span>
                </button>
                <button
                  onClick={() => setDrawerSubTab('audit')}
                  className={`px-3 py-2 rounded-xl shrink-0 flex items-center gap-1.5 transition-all ${
                    drawerSubTab === 'audit'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>سجل التدقيق</span>
                </button>
              </div>

              {/* TAB 1: OVERVIEW */}
              {drawerSubTab === 'overview' && (
                <div className="space-y-5 animate-in fade-in-50">
                  {/* Quick Meta Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">العميل:</span>
                      <span className="font-bold text-slate-900">{selectedRequest.customerName}</span>
                      <div className="font-mono text-[#D99B00] font-bold">{selectedRequest.customerCode}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">القسم المعني:</span>
                      <span className="font-bold text-slate-900 font-mono">{selectedRequest.departmentCode}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">الموظف المسؤول:</span>
                      <span className="font-bold text-slate-900">
                        {selectedRequest.assignedToUserName || 'لم يعين بعد'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">الحالة التشغيلية:</span>
                      <span className="font-bold text-blue-700">{selectedRequest.status}</span>
                    </div>
                  </div>

                  {/* Title & Notes */}
                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold text-slate-700">عنوان الطلب وتفاصيله:</h4>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-800 text-sm">
                      {selectedRequest.title}
                    </div>
                    {selectedRequest.notes && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-slate-700">
                        <b>ملاحظات الإدارة: </b> {selectedRequest.notes}
                      </div>
                    )}
                  </div>

                  {/* Operational Actions Strip */}
                  <div className="p-4 rounded-2xl bg-gradient-to-l from-[#2563EB] to-[#3478B8] text-white flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs border border-[#2563EB]/40">
                    <div className="font-bold text-[#F5B800]">إجراءات الحوكمة وانتقال الحالات:</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setShowStatusModal(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold transition-all border border-white/20 cursor-pointer"
                      >
                        تغيير الحالة التشغيلية ➔
                      </button>
                      <button
                        onClick={() => setShowAssignModal(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold transition-all border border-white/20 cursor-pointer"
                      >
                        إسناد لموظف 👤
                      </button>
                      <button
                        onClick={() => setShowApprovalModal(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F5B800] text-slate-950 font-black hover:bg-[#E0A600] transition-all shadow-xs cursor-pointer active:scale-95"
                      >
                        قرار الاعتماد الإداري ✓
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PROCUREMENT */}
              {drawerSubTab === 'procurement' && isRequestSubTabAllowed('procurement') && (
                <div className="space-y-4 animate-in fade-in-50 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">أوامر الشراء وطلبات التسعير المرتبطة بهذا الطلب:</h4>
                  </div>

                  {linked.purchaseOrders.length === 0 && linked.rfqs.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                      <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                      <div className="font-bold text-slate-700">لا توجد أوامر شراء أو طلبات تسعير بعد</div>
                      <p className="text-slate-500 text-xs">
                        يمكن إصدار طلب تسعير للمصانع بالصين أو إصدار أمر شراء PO من تبويب المشتريات.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {linked.purchaseOrders.map((po) => (
                        <div key={po.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                              {po.poCode}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              معتمد رسمياً
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-bold text-slate-900">{po.supplierName}</div>
                              <div className="text-slate-500 text-[11px]">{po.itemsSummary}</div>
                            </div>
                            <div className="text-left font-mono font-black text-base text-slate-900">
                              {po.totalAmount.toLocaleString()} {po.currency}
                            </div>
                          </div>
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">شروط الدفع: {po.paymentTerms}</span>
                            <button
                              onClick={() => setPrintableDoc({ type: 'purchase_order', data: po })}
                              className="px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold flex items-center gap-1 transition-all"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>طباعة أمر الشراء PO</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {linked.rfqs.map((rfq) => (
                        <div key={rfq.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-mono font-bold text-slate-700 ml-2">{rfq.rfqCode}</span>
                            <span className="font-medium text-slate-900">{rfq.title}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-100 text-blue-800">
                            {rfq.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: FINANCE */}
              {drawerSubTab === 'finance' && isRequestSubTabAllowed('finance') && (
                <div className="space-y-4 animate-in fade-in-50 text-xs">
                  <h4 className="font-bold text-slate-900 text-sm">المطالبات المالية وسندات التحصيل المرتبطة:</h4>

                  {linked.invoices.length === 0 && linked.receipts.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                      <DollarSign className="w-10 h-10 text-slate-300 mx-auto" />
                      <div className="font-bold text-slate-700">لا توجد حركات مالية مسجلة بعد لهذا الطلب</div>
                      <p className="text-slate-500 text-xs">
                        يمكن إصدار فواتير مطالبة وسندات قبض من وحدة الإدارة المالية.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Invoices */}
                      <div className="space-y-2">
                        <div className="font-bold text-slate-700 text-xs">فواتير المطالبة (Invoices):</div>
                        {linked.invoices.map((inv) => (
                          <div key={inv.id} className="p-3 rounded-2xl border border-slate-200 bg-white space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                {inv.invoiceCode}
                              </span>
                              <span className="font-mono font-bold text-emerald-700">
                                {inv.totalAmount.toLocaleString()} {inv.currency}
                              </span>
                            </div>
                            <div className="text-slate-600 text-[11px]">{inv.description}</div>
                            <div className="pt-2 border-t border-slate-100 flex justify-end">
                              <button
                                onClick={() => setPrintableDoc({ type: 'invoice', data: inv })}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center gap-1"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>طباعة الفاتورة</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Receipts */}
                      <div className="space-y-2">
                        <div className="font-bold text-slate-700 text-xs">سندات القبض والتحصيل (Receipts):</div>
                        {linked.receipts.map((rec) => (
                          <div key={rec.id} className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                                {rec.receiptCode}
                              </span>
                              <span className="font-mono font-bold text-emerald-800">
                                {rec.amount.toLocaleString()} {rec.currency}
                              </span>
                            </div>
                            <div className="text-slate-600 text-[11px]">طريقة السداد: {rec.paymentMethod}</div>
                            <div className="pt-2 border-t border-emerald-100 flex justify-end">
                              <button
                                onClick={() => setPrintableDoc({ type: 'receipt', data: rec })}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>طباعة السند</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: OPERATIONS & LOGISTICS */}
              {drawerSubTab === 'operations' && isRequestSubTabAllowed('operations') && (
                <div className="space-y-4 animate-in fade-in-50 text-xs">
                  <h4 className="font-bold text-slate-900 text-sm">مراحل التنفيذ الميداني واللوجستي:</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Shipments */}
                    <div className="space-y-2">
                      <div className="font-bold text-slate-700 text-xs">إرساليات الشحن الدولي:</div>
                      {linked.shipments.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-50 text-slate-400 text-center">لا توجد إرساليات شحن</div>
                      ) : (
                        linked.shipments.map((shp) => (
                          <div key={shp.id} className="p-3 rounded-2xl border border-slate-200 bg-white space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-mono font-bold text-blue-700">{shp.shipmentCode}</span>
                              <span className="text-[10px] text-slate-500 font-mono">B/L: {shp.blNumber}</span>
                            </div>
                            <div className="text-slate-800 font-bold">{shp.originPort} ➔ {shp.destinationPort}</div>
                            <div className="text-[11px] text-slate-500">حاوية: <b className="font-mono">{shp.containerNumber}</b></div>
                            <div className="pt-2 border-t border-slate-100 flex justify-end">
                              <button
                                onClick={() => setPrintableDoc({ type: 'shipping_waybill', data: shp })}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center gap-1"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>طباعة المانيفست</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* QC Inspections */}
                    <div className="space-y-2">
                      <div className="font-bold text-slate-700 text-xs">فحص الجودة والمصانع (QC):</div>
                      {linked.inspections.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-50 text-slate-400 text-center">لا توجد تقارير فحص مسجلة</div>
                      ) : (
                        linked.inspections.map((ins) => (
                          <div key={ins.id} className="p-3 rounded-2xl border border-purple-200 bg-purple-50/50 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-mono font-bold text-purple-700">{ins.inspectionCode}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                مجاز (Passed)
                              </span>
                            </div>
                            <div className="text-slate-800 font-medium">{ins.factoryLocation}</div>
                            <div className="text-[11px] text-slate-500">المفتش: {ins.inspectorName}</div>
                            <div className="pt-2 border-t border-purple-100 flex justify-end">
                              <button
                                onClick={() => setPrintableDoc({ type: 'inspection_report', data: ins })}
                                className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-bold text-[11px] flex items-center gap-1"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>طباعة تقرير الفحص</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Proof of Delivery (POD) if exists */}
                  {linked.proofsOfDelivery.length > 0 && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-950">سند التسليم النهائي للعميل (POD):</span>
                        <button
                          onClick={() => setPrintableDoc({ type: 'delivery_pod', data: linked.proofsOfDelivery[0] })}
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>طباعة سند الاستلام POD</span>
                        </button>
                      </div>
                      <div className="text-emerald-900 text-xs">
                        المستلم: <b>{linked.proofsOfDelivery[0].recipientName}</b> - {linked.proofsOfDelivery[0].deliveryCity}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: ATTACHMENTS */}
              {drawerSubTab === 'attachments' && (
                <div className="space-y-4 animate-in fade-in-50 text-xs">
                  {/* Upload Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!selectedRequest || !newAttName.trim()) return;
                      erpEngine.uploadAttachment(
                        {
                          relatedEntity: 'request',
                          relatedEntityId: selectedRequest.id,
                          requestId: selectedRequest.id,
                          fileName: newAttName.trim(),
                          fileType: 'application/pdf',
                          fileSizeBytes: Math.floor(Math.random() * 800000) + 150000,
                          fileUrl: '#',
                          category: newAttCategory,
                          visibility: newAttVisibility,
                          uploadedBy: currentUser.id,
                          uploadedByName: currentUser.name,
                        },
                        currentUser
                      );
                      setNewAttName('');
                      refreshData();
                    }}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3"
                  >
                    <div className="font-bold text-slate-800 text-xs">رفع وثيقة أو مستند جديد للطلب:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم المستند:</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: بوليصة_شحن_معتمدة.pdf"
                          value={newAttName}
                          onChange={(e) => setNewAttName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">تصنيف المستند:</label>
                        <select
                          value={newAttCategory}
                          onChange={(e) => setNewAttCategory(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                        >
                          <option value="commercial_invoice">فاتورة تجارية (Invoice)</option>
                          <option value="packing_list">بيان العبوة (Packing List)</option>
                          <option value="bill_of_lading">بوليصة شحن (B/L)</option>
                          <option value="customs_declaration">شهادة جمركية (Customs)</option>
                          <option value="inspection_report">تقرير فحص جودة (QC)</option>
                          <option value="payment_proof">إشعار تحويل بنكي / سداد</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">صلاحية الظهور:</label>
                        <select
                          value={newAttVisibility}
                          onChange={(e) => setNewAttVisibility(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                        >
                          <option value="public_tracking">متاح للعميل والإدارة (Public Tracking)</option>
                          <option value="private_internal">سري للإدارة والموظفين فقط (Private Internal)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        <Upload className="w-4 h-4" />
                        <span>إرفاق المستند وتوثيقه</span>
                      </button>
                    </div>
                  </form>

                  {/* List of Attachments */}
                  {reqAttachments.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white border border-dashed border-slate-200 text-center text-slate-400">
                      لا توجد مرفقات مسجلة بعد لهذا الطلب.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {reqAttachments.map((att) => (
                        <div key={att.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-indigo-600" />
                            <div>
                              <div className="font-bold text-slate-900">{att.fileName}</div>
                              <div className="text-[10px] text-slate-400">
                                {Math.round(att.fileSizeBytes / 1024)} KB • رُفعت بواسطة: {att.uploadedByName || att.uploadedBy} • {new Date(att.uploadedAt).toLocaleDateString('ar-SD')}
                              </div>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            att.visibility === 'private_internal'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {att.visibility === 'private_internal' ? 'إداري سري' : 'مشترك مع العميل'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: AUDIT TRAIL */}
              {drawerSubTab === 'audit' && (
                <div className="space-y-3 pt-2 animate-in fade-in-50 text-xs">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-[#D99B00]" />
                    <span>سجل التدقيق والمحطات الزمنية غير القابل للتعديل:</span>
                  </h4>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-h-72 overflow-y-auto space-y-3">
                    {detailedRequest?.timeline && detailedRequest.timeline.length > 0 ? (
                      detailedRequest.timeline.map((event: any) => (
                        <div
                          key={event.id}
                          className="p-3 rounded-xl bg-white border border-slate-200 space-y-1 text-right"
                        >
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span className="font-bold text-slate-700">
                              {event.actorName} ({event.actorRole})
                            </span>
                            <span className="font-mono">{new Date(event.timestamp).toLocaleString('ar-EG')}</span>
                          </div>
                          <div className="text-slate-800 font-medium flex items-center gap-2">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-mono">
                              {event.eventType}
                            </span>
                            <span>{event.notes}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      erpEngine
                        .getAuditLogs({ requestId: selectedRequest.id })
                        .map((log) => (
                          <div
                            key={log.id}
                            className="p-3 rounded-xl bg-white border border-slate-200 space-y-1 text-right"
                          >
                            <div className="flex justify-between items-center text-[10px] text-slate-400">
                              <span className="font-bold text-slate-700">
                                {log.actorName} ({log.actorRole})
                              </span>
                              <span className="font-mono">{new Date(log.timestamp).toLocaleString('ar-EG')}</span>
                            </div>
                            <div className="text-slate-800 font-medium">{log.notes}</div>
                          </div>
                        ))
                    )}
                  </div>

                  {/* Add Timeline Note Form */}
                  <form onSubmit={handleAddTimelineNote} className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="إضافة ملاحظة توثيقية في سجل الأحداث الزمني..."
                      value={newTimelineNote}
                      onChange={(e) => setNewTimelineNote(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                    <button
                      type="submit"
                      disabled={!newTimelineNote.trim()}
                      className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                    >
                      إضافة ملاحظة +
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ================= NEW REQUEST MODAL ================= */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-right space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={() => setShowNewModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-base font-bold text-slate-900">إنشاء طلب خدمة مركزي جديد</h3>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <SearchableSelector
                  label="اختيار العميل (بحث بالاسم أو الكود أو الهاتف)"
                  required
                  options={customerOptions}
                  value={selectedCustomerId}
                  onChange={(val) => setSelectedCustomerId(val)}
                  placeholder="ابحث باسم العميل التجاري أو الكود (SH-C-XXXX) أو رقم الهاتف..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع الخدمة والمسار التشغيلي *</label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:border-blue-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="PURCHASE_AND_SHIP">شراء وتوريد وشحن متكامل من المصانع (Procurement & Shipping)</option>
                  <option value="SHIPPING_LCL">شحن بحري مجدول جزئي LCL (تجميع طرود ومستودعات)</option>
                  <option value="SHIPPING_FCL">شحن بحري حاويات كاملة FCL (خطوط ملاحية)</option>
                  <option value="AIR_FREIGHT">شحن جوي سريع (Air Cargo)</option>
                  <option value="CUSTOMS_CLEARANCE">تخليص جمركي ومواصفات بميناء بورتسودان (Customs Clearance)</option>
                  <option value="INSPECTION_ONLY">فحص جودة ومعاينة المصنع والتحقق من المورد (Inspection)</option>
                  <option value="LOCAL_DELIVERY">توصيل وتوزيع داخلي وتسليم POD (Local Delivery)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان الطلب ووصفه *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: توريد 40 بطارية شمسية من مصنع فوشان..."
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">درجة الأولوية</label>
                  <select
                    value={reqPriority}
                    onChange={(e) => setReqPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="normal">عادي</option>
                    <option value="high">مرتفع</option>
                    <option value="urgent">عاجل جداً</option>
                    <option value="low">منخفض</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات توجيهية</label>
                <textarea
                  rows={2}
                  placeholder="أي تعليمات خاصة بالقسم المعني..."
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  حفظ وتوجيه الطلب
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-[#EFF6FF] text-[#172033] font-bold text-xs cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= STATUS MODAL ================= */}
      {showStatusModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-right space-y-5 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              تغيير الحالة التشغيلية للطلب [{selectedRequest.requestCode}]
            </h3>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteStatusTransition} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الحالة الجديدة *</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                >
                  <option value="new">جديد (New)</option>
                  <option value="assigned">مسند لموظف (Assigned)</option>
                  <option value="ready_for_processing">جاهز للمعالجة (Ready for Processing)</option>
                  <option value="in_progress">قيد التنفيذ (In Progress)</option>
                  <option value="on_hold">معلق (On Hold)</option>
                  <option value="completed">مكتمل ومغلق (Completed)</option>
                  <option value="cancelled">ملغي (Cancelled)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات التغيير والسبب *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="سبب الانتقال والملاحظات للمستند..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  اعتماد انتقال الحالة
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-[#EFF6FF] text-[#172033] font-bold text-xs cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ASSIGN MODAL ================= */}
      {showAssignModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-right space-y-5 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              إسناد الطلب [{selectedRequest.requestCode}] لموظف بالقسم
            </h3>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteAssign} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الموظف المعين *</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                >
                  <option value="">-- اختر موظفاً من القائمة --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.roleNameAr} - {u.departmentNameAr})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={!targetUserId}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs disabled:opacity-50 shadow-xs transition-colors cursor-pointer"
                >
                  تأكيد الإسناد
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-[#EFF6FF] text-[#172033] font-bold text-xs cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= APPROVAL MODAL ================= */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172033]/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-right space-y-5 shadow-2xl border border-[#E2E8F0]">
            <h3 className="text-base font-bold text-[#172033]">
              قرار الاعتماد الإداري للطلب [{selectedRequest.requestCode}]
            </h3>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteApproval} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#172033] mb-1">القرار الإداري *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('approved')}
                    className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer transition-colors ${
                      approvalDecision === 'approved'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-[#172033] border-[#E2E8F0] hover:bg-slate-100'
                    }`}
                  >
                    اعتماد ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('changes_requested')}
                    className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer transition-colors ${
                      approvalDecision === 'changes_requested'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-[#172033] border-[#E2E8F0] hover:bg-slate-100'
                    }`}
                  >
                    طلب تعديل
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalDecision('rejected')}
                    className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer transition-colors ${
                      approvalDecision === 'rejected'
                        ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                        : 'bg-slate-50 text-[#172033] border-[#E2E8F0] hover:bg-slate-100'
                    }`}
                  >
                    رفض ✗
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-1">ملاحظات وتوجيهات القرار</label>
                <textarea
                  rows={3}
                  placeholder="سبب القرار وتوجيهات المتابعة للموظف..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  تسجيل القرار في سجل التدقيق
                </button>
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-[#EFF6FF] text-[#172033] font-bold text-xs cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Document Modal */}
      {printableDoc && (
        <ErpDocumentPrintModal
          docType={printableDoc.type}
          data={printableDoc.data}
          onClose={() => setPrintableDoc(null)}
        />
      )}
    </div>
  );
};
