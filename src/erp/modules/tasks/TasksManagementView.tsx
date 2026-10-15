import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  UserCheck,
  Building2,
  Search,
  Plus,
  RefreshCw,
  Filter,
  CheckCircle2,
  Check,
  Calendar,
  ArrowRight,
  UserPlus,
  GitBranch,
  X,
  ChevronLeft,
  ChevronRight,
  BellRing,
} from 'lucide-react';
import { useErpAuth } from '../../context/ErpAuthContext';

interface TaskRecord {
  id: string;
  requestId: string;
  title: string;
  departmentId: string | null;
  assignedUserId: string | null;
  assignedByUserId: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  dueDate: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  request: {
    id: string;
    requestCode: string;
    title: string;
    status: string;
    priority: string;
  };
  customer: {
    id: string;
    customerCode: string;
    companyName: string;
    primaryPhone: string;
  };
  department: {
    id: string;
    code: string;
    nameAr: string;
  } | null;
  assignedUser: {
    id: string;
    name: string;
    username: string;
  } | null;
}

interface TasksResponseCounts {
  total: number;
  myTasksCount: number;
  deptTasksCount: number;
  overdueCount: number;
}

interface SelectOption {
  id: string;
  name: string;
}

export const TasksManagementView: React.FC = () => {
  const { currentUser, sessionToken } = useErpAuth();
  const token = sessionToken;

  // State
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [counts, setCounts] = useState<TasksResponseCounts>({
    total: 0,
    myTasksCount: 0,
    deptTasksCount: 0,
    overdueCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [queue, setQueue] = useState<'all' | 'my_tasks' | 'department' | 'unassigned' | 'overdue'>('my_tasks');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);

  // Form Data for Create
  const [createForm, setCreateForm] = useState({
    requestId: '',
    title: '',
    departmentId: '',
    assignedUserId: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    dueDate: '',
    notes: '',
  });

  // Form Data for Reassign
  const [reassignForm, setReassignForm] = useState({
    assignedUserId: '',
    departmentId: '',
    notes: '',
  });

  // Reference lookups (users, departments, requests)
  const [usersList, setUsersList] = useState<SelectOption[]>([]);
  const [deptsList, setDeptsList] = useState<SelectOption[]>([]);
  const [requestsList, setRequestsList] = useState<{ id: string; requestCode: string; title: string }[]>([]);

  const fetchTasks = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const authToken = token || localStorage.getItem('sahla_auth_token') || sessionStorage.getItem('sahla_auth_token');
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        queue,
        status: statusFilter,
        priority: priorityFilter,
        search,
      });

      const res = await fetch(`/api/tasks?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();

      if (data.success) {
        setTasks(data.data || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        }
        if (data.counts) {
          setCounts(data.counts);
        }
      } else {
        setErrorMsg(data.error?.message || 'تعذر تحميل قائمة المهام');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLookups = async () => {
    const authToken = token || localStorage.getItem('sahla_auth_token') || sessionStorage.getItem('sahla_auth_token');
    try {
      // Load users
      const uRes = await fetch('/api/foundation/users', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (uRes.ok) {
        const uData = await uRes.json();
        if (uData.success && Array.isArray(uData.data)) {
          setUsersList(
            uData.data
              .filter((u: any) => u.status === 'active')
              .map((u: any) => ({ id: u.id, name: u.name }))
          );
        }
      }

      // Load departments
      const dRes = await fetch('/api/foundation/departments', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (dRes.ok) {
        const dData = await dRes.json();
        if (dData.success && Array.isArray(dData.data)) {
          setDeptsList(
            dData.data.map((d: any) => ({ id: d.id, name: d.nameAr }))
          );
        }
      }

      // Load active requests for task assignment
      const rRes = await fetch('/api/requests?limit=50', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (rRes.ok) {
        const rData = await rRes.json();
        if (rData.success && Array.isArray(rData.data)) {
          setRequestsList(
            rData.data.map((r: any) => ({
              id: r.id,
              requestCode: r.requestCode,
              title: r.title,
            }))
          );
        }
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page, queue, statusFilter, priorityFilter]);

  useEffect(() => {
    loadLookups();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTasks();
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskRecord['status']) => {
    try {
      const authToken = token || localStorage.getItem('sahla_auth_token') || sessionStorage.getItem('sahla_auth_token');
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('تم تحديث حالة المهمة بنجاح');
        fetchTasks();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(data.error?.message || 'تعذر تحديث الحالة');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء تحديث الحالة');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.requestId || !createForm.title) {
      setErrorMsg('يرجى تحديد الطلب وإدخال عنوان المهمة');
      return;
    }

    try {
      const authToken = token || localStorage.getItem('sahla_auth_token') || sessionStorage.getItem('sahla_auth_token');
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          requestId: createForm.requestId,
          title: createForm.title,
          departmentId: createForm.departmentId || undefined,
          assignedUserId: createForm.assignedUserId || undefined,
          priority: createForm.priority,
          dueDate: createForm.dueDate || undefined,
          notes: createForm.notes || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCreateModalOpen(false);
        setCreateForm({
          requestId: '',
          title: '',
          departmentId: '',
          assignedUserId: '',
          priority: 'normal',
          dueDate: '',
          notes: '',
        });
        setSuccessMsg('تم إنشاء المهمة وإشعار المكلف بها بنجاح');
        fetchTasks();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(data.error?.message || 'تعذر إنشاء المهمة');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطأ أثناء إنشاء المهمة');
    }
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      const authToken = token || localStorage.getItem('sahla_auth_token') || sessionStorage.getItem('sahla_auth_token');
      const res = await fetch(`/api/tasks/${selectedTask.id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          assignedUserId: reassignForm.assignedUserId || null,
          departmentId: reassignForm.departmentId || null,
          notes: reassignForm.notes || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsReassignModalOpen(false);
        setSelectedTask(null);
        setReassignForm({ assignedUserId: '', departmentId: '', notes: '' });
        setSuccessMsg('تمت إعادة إسناد المهمة وإشعار المكلف الجديد');
        fetchTasks();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(data.error?.message || 'تعذر إعادة الإسناد');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطأ أثناء إعادة الإسناد');
    }
  };

  const handleCheckDeadlines = async () => {
    try {
      const authToken = token || localStorage.getItem('sahla_auth_token') || sessionStorage.getItem('sahla_auth_token');
      const res = await fetch('/api/tasks/check-deadlines', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`تم فحص المواعيد وإرسال ${data.data.sentCount} إشعار للمهام القريبة أو المتأخرة`);
        fetchTasks();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setErrorMsg('تعذر تشغيل فحص المواعيد');
    }
  };

  const openReassignModal = (task: TaskRecord) => {
    setSelectedTask(task);
    setReassignForm({
      assignedUserId: task.assignedUserId || '',
      departmentId: task.departmentId || '',
      notes: '',
    });
    setIsReassignModalOpen(true);
  };

  const getPriorityBadge = (priority: TaskRecord['priority']) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">عاجلة</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">عالية</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">منخفضة</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-800">عادية</span>;
    }
  };

  const getStatusBadge = (status: TaskRecord['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>مكتملة</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>قيد التنفيذ</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
            ملغاة
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
            <Clock className="w-3 h-3" />
            <span>قيد الانتظار</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4.5 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#2563EB] text-white font-bold shadow-xs">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#172033]">
                إدارة المهام والواجبات التشغيلية
              </h2>
              <p className="text-xs text-[#64748B]">
                طوابير العمل المركزية، تكليفات الموظفين، مواعيد الاستحقاق، والإشعارات الفورية
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleCheckDeadlines}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-[#EFF6FF] text-[#172033] hover:text-[#2563EB] border border-[#E2E8F0] font-bold text-xs transition-colors cursor-pointer"
            title="فحص مواعيد الاستحقاق وتوليد تنبيهات للمتأخرة"
          >
            <BellRing className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>فحص المواعيد</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>مهمة جديدة</span>
          </button>
        </div>
      </div>

      {/* Notifications / Alerts Banner */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-rose-100 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="p-1 hover:bg-emerald-100 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick Metrics Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => { setQueue('all'); setPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            queue === 'all'
              ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md'
              : 'bg-white text-[#172033] border-[#E2E8F0] hover:border-[#2563EB]/40 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${queue === 'all' ? 'text-blue-100' : 'text-[#64748B]'}`}>
              إجمالي المهام
            </span>
            <CheckSquare className={`w-4 h-4 ${queue === 'all' ? 'text-white' : 'text-[#64748B]'}`} />
          </div>
          <div className="text-2xl font-black mt-2 font-mono">{counts.total}</div>
          <div className={`text-[10px] mt-0.5 ${queue === 'all' ? 'text-blue-100' : 'text-[#64748B]'}`}>
            كل المهام النشطة والمؤرشفة
          </div>
        </div>

        <div
          onClick={() => { setQueue('my_tasks'); setPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            queue === 'my_tasks'
              ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md font-bold'
              : 'bg-white text-[#172033] border-[#E2E8F0] hover:border-[#2563EB]/40 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${queue === 'my_tasks' ? 'text-blue-100' : 'text-[#64748B]'}`}>
              مهامي المباشرة
            </span>
            <UserCheck className={`w-4 h-4 ${queue === 'my_tasks' ? 'text-[#F5B800]' : 'text-[#2563EB]'}`} />
          </div>
          <div className="text-2xl font-black mt-2 font-mono">{counts.myTasksCount}</div>
          <div className={`text-[10px] mt-0.5 ${queue === 'my_tasks' ? 'text-blue-100' : 'text-[#64748B]'}`}>
            المسندة إليك ومطلوب تنفيذها
          </div>
        </div>

        <div
          onClick={() => { setQueue('department'); setPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            queue === 'department'
              ? 'bg-[#3478B8] text-white border-[#3478B8] shadow-md'
              : 'bg-white text-[#172033] border-[#E2E8F0] hover:border-[#3478B8]/40 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${queue === 'department' ? 'text-blue-100' : 'text-[#64748B]'}`}>
              طابور قسمي
            </span>
            <Building2 className={`w-4 h-4 ${queue === 'department' ? 'text-blue-100' : 'text-[#3478B8]'}`} />
          </div>
          <div className="text-2xl font-black mt-2 font-mono">{counts.deptTasksCount}</div>
          <div className={`text-[10px] mt-0.5 ${queue === 'department' ? 'text-blue-100' : 'text-[#64748B]'}`}>
            {currentUser?.departmentNameAr || 'مهام القسم'}
          </div>
        </div>

        <div
          onClick={() => { setQueue('overdue'); setPage(1); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            queue === 'overdue'
              ? 'bg-rose-600 text-white border-rose-700 shadow-md'
              : 'bg-white text-[#172033] border-[#E2E8F0] hover:border-rose-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${queue === 'overdue' ? 'text-rose-100' : 'text-[#64748B]'}`}>
              مهام متأخرة
            </span>
            <AlertTriangle className={`w-4 h-4 ${queue === 'overdue' ? 'text-rose-100' : 'text-rose-500'}`} />
          </div>
          <div className="text-2xl font-black mt-2 font-mono">{counts.overdueCount}</div>
          <div className={`text-[10px] mt-0.5 ${queue === 'overdue' ? 'text-rose-100' : 'text-[#64748B]'}`}>
            تجاوزت تاريخ الاستحقاق المحدد
          </div>
        </div>
      </div>

      {/* Filter and Queue Navigation Controls */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
        {/* Queues selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'my_tasks', label: `مهامي المباشرة (${counts.myTasksCount})` },
            { id: 'department', label: `طابور قسمي (${counts.deptTasksCount})` },
            { id: 'overdue', label: `متأخرة عن الموعد (${counts.overdueCount})` },
            { id: 'unassigned', label: 'غير مسندة' },
            { id: 'all', label: `جميع المهام (${counts.total})` },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setQueue(item.id as any); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-all ${
                queue === item.id
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-slate-100 text-[#172033] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search & Select dropdowns */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث في نص المهمة، رقم الطلب، اسم العميل..."
              className="w-full pr-9 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
            />
          </form>

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">كل الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="in_progress">جاري التنفيذ</option>
            <option value="completed">مكتملة</option>
            <option value="cancelled">ملغاة</option>
          </select>

          {/* Priority selector */}
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">كل الأولويات</option>
            <option value="urgent">عاجلة</option>
            <option value="high">عالية</option>
            <option value="normal">عادية</option>
            <option value="low">منخفضة</option>
          </select>

          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); setPriorityFilter('all'); setPage(1); fetchTasks(); }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="إعادة تعيين الفلاتر"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tasks Table / Card List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
            <p>جاري تحميل المهام من قاعدة البيانات...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckSquare className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-sm text-slate-700">لا توجد مهام تطابق المعايير</h3>
            <p className="text-xs text-slate-400">
              {queue === 'my_tasks'
                ? 'ليس لديك مهام قيد التنفيذ حالياً. عمل رائع!'
                : 'جرب تعديل خيارات البحث أو تصفية الحالات أعلاه.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-3.5">المهمة والطلب التابع</th>
                  <th className="p-3.5">العميل</th>
                  <th className="p-3.5">المكلف بالمهمة</th>
                  <th className="p-3.5">الأولوية</th>
                  <th className="p-3.5">تاريخ الاستحقاق</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      task.isOverdue ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    {/* Task Title & Request */}
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{task.title}</span>
                          {task.isOverdue && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-800">
                              متأخرة!
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                            {task.request.requestCode}
                          </span>
                          <span className="truncate max-w-xs">{task.request.title}</span>
                        </div>
                        {task.notes && (
                          <p className="text-[10px] text-slate-400 line-clamp-1">{task.notes}</p>
                        )}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800">{task.customer.companyName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{task.customer.customerCode}</div>
                    </td>

                    {/* Assignee & Department */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {task.assignedUser ? task.assignedUser.name.slice(0, 1) : '?'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-[11px]">
                            {task.assignedUser ? task.assignedUser.name : (
                              <span className="text-slate-400 italic">غير معين</span>
                            )}
                          </div>
                          {task.department && (
                            <div className="text-[9px] text-slate-500">{task.department.nameAr}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="p-3.5">{getPriorityBadge(task.priority)}</td>

                    {/* Due Date */}
                    <td className="p-3.5">
                      {task.dueDate ? (
                        <div className={`font-mono text-[11px] flex items-center gap-1 ${
                          task.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(task.dueDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">غير محدد</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <div className="space-y-1">
                        {getStatusBadge(task.status)}
                        {task.completedAt && (
                          <div className="text-[9px] text-emerald-700 font-mono">
                            تم في {new Date(task.completedAt).toLocaleDateString('ar-EG')}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Quick Status toggle buttons */}
                        {task.status !== 'completed' ? (
                          <button
                            onClick={() => handleUpdateStatus(task.id, 'completed')}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition-colors cursor-pointer"
                            title="إنجاز المهمة"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold transition-colors cursor-pointer"
                            title="إعادة فتح المهمة"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {task.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition-colors cursor-pointer"
                            title="بدء تنفيذ المهمة"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Reassign button */}
                        <button
                          onClick={() => openReassignModal(task)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="إعادة إسناد المهمة"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              الصفحة {page} من {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE TASK MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 text-right space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-black text-[#172033] text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#2563EB]" />
                <span>إنشاء مهمة عمل جديدة</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-[#64748B] hover:text-[#172033] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              {/* Request selector */}
              <div>
                <label className="block font-bold text-[#172033] mb-1">الطلب التجاري التابع *</label>
                <select
                  required
                  value={createForm.requestId}
                  onChange={(e) => setCreateForm({ ...createForm, requestId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                >
                  <option value="">-- اختر الطلب --</option>
                  {requestsList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.requestCode} - {r.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Task title */}
              <div>
                <label className="block font-bold text-[#172033] mb-1">عنوان المهمة المطلوب تنفيذها *</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="مثال: فحص شهادة الجودة من المصنع في فوشان"
                  className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              {/* Assignee & Department */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-[#172033] mb-1">الموظف المكلف</label>
                  <select
                    value={createForm.assignedUserId}
                    onChange={(e) => setCreateForm({ ...createForm, assignedUserId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                  >
                    <option value="">-- اختياري (غير مسند) --</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">القسم التشغيلي</label>
                  <select
                    value={createForm.departmentId}
                    onChange={(e) => setCreateForm({ ...createForm, departmentId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                  >
                    <option value="">-- نفس قسم الطلب --</option>
                    {deptsList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority & Due Date */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-[#172033] mb-1">الأولوية</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                  >
                    <option value="normal">عادية</option>
                    <option value="high">عالية</option>
                    <option value="urgent">عاجلة</option>
                    <option value="low">منخفضة</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#172033] mb-1">تاريخ وموعد الاستحقاق</label>
                  <input
                    type="date"
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-[#172033] mb-1">ملاحظات وتعليمات المهمة</label>
                <textarea
                  rows={2}
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  placeholder="أي توجيهات إضافية للموظف..."
                  className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-[#EFF6FF] text-[#172033] font-bold cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  حفظ وتكليف المهمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN TASK MODAL */}
      {isReassignModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172033]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-[#E2E8F0] text-right space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-black text-[#172033] text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#2563EB]" />
                <span>إعادة إسناد المهمة</span>
              </h3>
              <button
                onClick={() => setIsReassignModalOpen(false)}
                className="p-1 text-[#64748B] hover:text-[#172033] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-[#E2E8F0] text-xs space-y-1">
              <div className="font-bold text-[#172033]">{selectedTask.title}</div>
              <div className="text-[#64748B]">الطلب: {selectedTask.request.requestCode}</div>
              <div className="text-[11px] text-[#64748B]">
                المكلف الحالي: {selectedTask.assignedUser?.name || 'غير معين'}
              </div>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#172033] mb-1">الموظف الجديد المستلم *</label>
                <select
                  value={reassignForm.assignedUserId}
                  onChange={(e) => setReassignForm({ ...reassignForm, assignedUserId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                >
                  <option value="">-- إلغاء التكليف (غير مسند) --</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-1">القسم التشغيلي</label>
                <select
                  value={reassignForm.departmentId}
                  onChange={(e) => setReassignForm({ ...reassignForm, departmentId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                >
                  <option value="">-- بدون تغيير --</option>
                  {deptsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#172033] mb-1">سبب أو ملاحظات إعادة الإسناد</label>
                <textarea
                  rows={2}
                  value={reassignForm.notes}
                  onChange={(e) => setReassignForm({ ...reassignForm, notes: e.target.value })}
                  placeholder="سبب التحويل إلى موظف آخر..."
                  className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsReassignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-[#EFF6FF] text-[#172033] font-bold cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  تأكيد إعادة الإسناد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
