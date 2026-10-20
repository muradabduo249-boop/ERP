import React, { useState } from 'react';
import { useErpAuth } from '../../context/ErpAuthContext';
import {
  Lock,
  Users,
  ShieldCheck,
  Check,
  X,
  UserCheck,
  Building2,
  KeyRound,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  Save,
} from 'lucide-react';
import { DepartmentCode, PermissionCode, RoleCode, User } from '../../../types';

export const SYSTEM_MODULES = [
  { id: 'dashboard', label: 'لوحة التحكم والقيادة', desc: 'مؤشرات الأداء والإحصائيات العامة' },
  { id: 'requests_backbone', label: 'الطلبات المركزية', desc: 'سجل الطلبات والربط بين الأقسام' },
  { id: 'tasks_management', label: 'إدارة المهام والواجبات', desc: 'طوابير المهام ومواعيد الاستحقاق' },
  { id: 'customers_master', label: 'سجل العملاء', desc: 'إدارة وتوثيق بيانات العملاء والشركات' },
  { id: 'suppliers_master', label: 'سجل الموردين والمصانع', desc: 'دليل المصانع المعتمدة بالصين والعالم' },
  { id: 'crm_leads', label: 'المبيعات والفرص (CRM)', desc: 'متابعة العملاء المحتملين والطلبات التسويقية' },
  { id: 'procurement', label: 'المشتريات والتوريد', desc: 'أوامر الشراء (PO) والمصانع ومطالبات الموردين' },
  { id: 'products_catalog', label: 'كتالوج المنتجات والسلع', desc: 'إدارة الأصناف، الأسعار، والمواصفات' },
  { id: 'finance', label: 'المالية والخزينة', desc: 'سندات القبض، المدفوعات، والخزائن البنكية والنقدية' },
  { id: 'operations', label: 'العمليات والتخليص', desc: 'الشحن البحري، التخليص بميناء بورتسودان، والتفويج' },
  { id: 'audit_trail', label: 'سجل التدقيق والمراقبة', desc: 'متابعة كافة تحركات وسجلات النظام' },
  { id: 'rbac_matrix', label: 'إدارة الموظفين والصلاحيات', desc: 'إضافة وتعديل وحذف الموظفين وتخصيص صلاحياتهم' },
];

export const RbacManagementView: React.FC = () => {
  const { currentUser, users, roles, departments, addUser, updateUser, deleteUser } = useErpAuth();

  const [activeTab, setActiveTab] = useState<'employees' | 'permissions_matrix'>('employees');
  const [selectedRoleCode, setSelectedRoleCode] = useState<RoleCode>('super_admin');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form States for Add / Edit
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('1234');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [departmentCode, setDepartmentCode] = useState<DepartmentCode>('OPERATIONS');
  const [roleCode, setRoleCode] = useState<RoleCode>('operations_officer');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [selectedModules, setSelectedModules] = useState<string[]>([
    'dashboard',
    'operations',
    'requests_backbone',
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedRole = roles.find((r) => r.code === selectedRoleCode) || roles[0];

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setPin('1234');
    setPhone('+2499');
    setEmail('');
    setDepartmentCode('OPERATIONS');
    setRoleCode('operations_officer');
    setStatus('active');
    setSelectedModules(['dashboard', 'operations', 'requests_backbone']);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username || '');
    setPin(''); // Leave empty so existing password hash is preserved unless explicitly changed
    setPhone(user.phone || '');
    setEmail(user.email || '');
    setDepartmentCode(user.departmentCode);
    setRoleCode(user.roleCode);
    setStatus(user.status || 'active');
    setSelectedModules(user.allowedModules || ['dashboard']);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const toggleModule = (moduleId: string) => {
    if (selectedModules.includes(moduleId)) {
      setSelectedModules(selectedModules.filter((m) => m !== moduleId));
    } else {
      setSelectedModules([...selectedModules, moduleId]);
    }
  };

  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('يرجى إدخال اسم الموظف بالكامل');
      return;
    }
    if (!username.trim()) {
      setFormError('يرجى تحديد اسم المستخدم لتسجيل الدخول');
      return;
    }
    if (!editingUser && (!pin.trim() || pin.trim().length < 3)) {
      setFormError('رمز التحقق / PIN يجب أن يتكون من 3 أرقام على الأقل للحساب الجديد');
      return;
    }
    if (editingUser && pin.trim() && pin.trim().length < 3) {
      setFormError('رمز التحقق الجديد يجب ألا يقل عن 3 أرقام إذا رغبت في تغييره');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    // Check username uniqueness
    const exists = users.find(
      (u) =>
        (u.username || '').toLowerCase() === cleanUsername &&
        (!editingUser || u.id !== editingUser.id)
    );
    if (exists) {
      setFormError('اسم المستخدم هذا مستخدم بالفعل من قبل موظف آخر');
      return;
    }

    const dept = departments.find((d) => d.code === departmentCode);
    const role = roles.find((r) => r.code === roleCode);

    try {
      setIsSaving(true);
      if (editingUser) {
        // Update
        const updates: Partial<User> = {
          name: name.trim(),
          username: cleanUsername,
          phone: phone.trim(),
          email: email.trim(),
          departmentCode,
          departmentNameAr: dept?.nameAr || editingUser.departmentNameAr,
          departmentId: dept?.id || editingUser.departmentId,
          roleCode,
          roleNameAr: role?.nameAr || editingUser.roleNameAr,
          roleId: role?.id || editingUser.roleId,
          status,
          allowedModules: selectedModules,
        };
        if (pin.trim()) {
          updates.pin = pin.trim();
        }
        await updateUser(editingUser.id, updates);
        setSuccessBanner(`تم تحديث بيانات الموظف [${name.trim()}] بنجاح وحفظها بقاعدة البيانات`);
      } else {
        // Create new
        const newUser: User = {
          id: `user-${Date.now().toString().slice(-4)}`,
          name: name.trim(),
          username: cleanUsername,
          pin: pin.trim(),
          phone: phone.trim(),
          email: email.trim() || `${cleanUsername}@sahla.sd`,
          departmentCode,
          departmentNameAr: dept?.nameAr || 'العمليات',
          departmentId: dept?.id || 'dept-ops-005',
          roleCode,
          roleNameAr: role?.nameAr || 'موظف عمليات',
          roleId: role?.id || 'role-operations',
          status,
          allowedModules: selectedModules,
          createdAt: new Date().toISOString(),
        };
        await addUser(newUser, pin.trim());
        setSuccessBanner(`تم إنشاء وتفعيل حساب الموظف [${name.trim()}] في قاعدة البيانات بنجاح.`);
      }

      setIsAddModalOpen(false);
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء حفظ الموظف');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      alert('لا يمكنك حذف الحساب النشط الحالي للمدير العام');
      return;
    }
    if (window.confirm(`تأكيد أمني: هل أنت متأكد من حذف الموظف [${userName}] نهائياً من النظام؟ لن يتمكن من تسجيل الدخول بعد ذلك.`)) {
      try {
        await deleteUser(userId);
        setSuccessBanner(`تم حذف الموظف [${userName}] بنجاح`);
        setTimeout(() => setSuccessBanner(null), 4000);
      } catch (err: any) {
        alert(err.message || 'حدث خطأ أثناء محاولة حذف الموظف');
      }
    }
  };

  const allPermissions: { code: PermissionCode; labelAr: string; category: string }[] = [
    { code: 'requests:view', labelAr: 'استعراض الطلبات المركزية', category: 'الطلبات' },
    { code: 'requests:create', labelAr: 'إنشاء طلب خدمة جديد', category: 'الطلبات' },
    { code: 'requests:edit', labelAr: 'تعديل تفاصيل الطلبات', category: 'الطلبات' },
    { code: 'requests:assign', labelAr: 'إسناد وتعيين الطلبات للموظفين', category: 'الطلبات' },
    { code: 'requests:approve', labelAr: 'اعتماد الموافقات الإدارية للطلبات', category: 'الطلبات' },
    { code: 'crm:view', labelAr: 'استعراض سجل العملاء والفرص', category: 'إدارة العملاء' },
    { code: 'crm:create', labelAr: 'تسجيل عميل جديد بالرمز التجاري', category: 'إدارة العملاء' },
    { code: 'procurement:view', labelAr: 'استعراض أوامر التوريد ومصانع الصين', category: 'المشتريات' },
    { code: 'procurement:create_po', labelAr: 'إصدار أوامر الشراء الرسمية (PO)', category: 'المشتريات' },
    { code: 'finance:view', labelAr: 'استعراض السجلات المالية والخزينة', category: 'المالية' },
    { code: 'finance:receipts', labelAr: 'إصدار وتوثيق سندات القبض', category: 'المالية' },
    { code: 'finance:payables', labelAr: 'قيد ومطابقة فواتير الموردين', category: 'المالية' },
    { code: 'finance:treasury', labelAr: 'إدارة الخزائن والصناديق النقدية', category: 'المالية' },
    { code: 'operations:view', labelAr: 'استعراض الشحنات والحاويات', category: 'العمليات' },
    { code: 'operations:customs', labelAr: 'إجراءات التخليص الجمركي بميناء بورتسودان', category: 'العمليات' },
    { code: 'operations:pod', labelAr: 'توثيق إثبات التسليم النهائي (POD)', category: 'العمليات' },
    { code: 'audit:view', labelAr: 'استعراض سجل التدقيق الشامل', category: 'الحوكمة' },
    { code: 'settings:manage', labelAr: 'إدارة الموظفين وتخصيص الصلاحيات', category: 'الحوكمة' },
  ];

  return (
    <div className="space-y-6 text-right">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-5 h-5 text-[#D99B00]" />
            <h2 className="text-xl font-black text-slate-900">إدارة الموظفين والتحكم في الصلاحيات (RBAC)</h2>
          </div>
          <p className="text-xs text-slate-500">
            عزل كامل وصارم للأقسام: يمكن للمدير العام إضافة وحذف الموظفين، وتحديد الأقسام المسموح لكل شخص بفتحها فقط.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleOpenAddModal}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#F5B800] hover:bg-[#E0A600] text-slate-950 font-black text-xs transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ إضافة موظف جديد</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'employees'
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
          }`}
        >
          سجل الموظفين وتخصيص الأقسام ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('permissions_matrix')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'permissions_matrix'
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
          }`}
        >
          مصفوفة أذونات الأدوار
        </button>
      </div>

      {successBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* TAB 1: EMPLOYEES DIRECTORY WITH CUSTOM PERMISSIONS */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((u) => {
              const isCurrent = currentUser?.id === u.id;
              const isSuperAdmin = u.roleCode === 'super_admin';
              const userModules = u.allowedModules || ['dashboard'];

              return (
                <div
                  key={u.id}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-all space-y-4 ${
                    isCurrent ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Status & Role */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {u.roleCode}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {u.status === 'active' ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            نشط
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            معطل
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            أنت
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Name & Credentials */}
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">{u.name}</h3>
                      <div className="text-xs text-slate-600 mt-0.5">{u.roleNameAr}</div>
                      <div className="text-[11px] text-[#D99B00] font-bold mt-0.5">
                        {u.departmentNameAr}
                      </div>
                    </div>

                    {/* Login & PIN Info */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1 font-mono">
                      <div className="flex items-center justify-between text-slate-600 text-[11px]">
                        <span>اسم الدخول:</span>
                        <b className="text-slate-900">{u.username || u.email}</b>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 text-[11px]">
                        <span>رمز PIN:</span>
                        <b className="text-[#D99B00] tracking-widest">{u.pin || '••••'}</b>
                      </div>
                      {u.phone && (
                        <div className="flex items-center justify-between text-slate-600 text-[11px]">
                          <span>الهاتف:</span>
                          <span className="text-slate-700" dir="ltr">{u.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Allowed Modules Badges */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-400">الأقسام المصرح له بفتحها:</div>
                      <div className="flex flex-wrap gap-1">
                        {isSuperAdmin ? (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-950 px-2 py-0.5 rounded border border-amber-200">
                            كافة الأقسام والعمليات (كامل الصلاحيات)
                          </span>
                        ) : (
                          userModules.map((modId) => {
                            const modObj = SYSTEM_MODULES.find((m) => m.id === modId);
                            return (
                              <span
                                key={modId}
                                className="text-[9px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200"
                              >
                                {modObj?.label || modId}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenEditModal(u)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>تعديل الصلاحيات</span>
                    </button>

                    {!isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center justify-center transition-all cursor-pointer"
                        title="حذف هذا الموظف نهائياً"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PERMISSIONS MATRIX */}
      {activeTab === 'permissions_matrix' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">مصفوفة الصلاحيات حسب الدور (Permissions Matrix)</h3>
              <p className="text-xs text-slate-500">استعراض الأذونات الممنوحة لكل مسمى وظيفي في قاعدة بيانات النظام:</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {roles.map((r) => (
                <button
                  key={r.code}
                  onClick={() => setSelectedRoleCode(r.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedRoleCode === r.code
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'bg-slate-100 text-[#172033] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
                  }`}
                >
                  {r.nameAr}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-slate-900">{selectedRole.nameAr} ({selectedRole.code}):</div>
            <p className="text-slate-600">{selectedRole.descriptionAr}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allPermissions.map((perm) => {
              const isGranted =
                selectedRole.code === 'super_admin' || selectedRole.permissions.includes(perm.code);
              return (
                <div
                  key={perm.code}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    isGranted
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 font-semibold'
                      : 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold">{perm.labelAr}</div>
                    <div className="text-[10px] font-mono opacity-80" dir="ltr">{perm.code}</div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      isGranted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {isGranted ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT EMPLOYEE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-right space-y-4 my-8 animate-in fade-in-50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#D99B00]" />
                <h3 className="font-black text-slate-900 text-base">
                  {editingUser ? `تعديل بيانات وصلاحيات الموظف: [${editingUser.name}]` : 'إضافة موظف جديد للنظام'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">الاسم بالكامل:</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: محمد أحمد علي"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-medium focus:border-amber-400 outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">اسم المستخدم (لتسجيل الدخول):</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: customs2 أو accountant"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold focus:border-amber-400 outline-hidden text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">رمز التحقق السري (PIN / Password):</label>
                    {editingUser && (
                      <span className="text-[10px] text-amber-700 font-medium">اختياري عند التعديل</span>
                    )}
                  </div>
                  <input
                    type="text"
                    required={!editingUser}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder={editingUser ? 'اتركه فارغاً للاحتفاظ بكلمة المرور الحالية' : '1234'}
                    maxLength={10}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-black text-center tracking-widest focus:border-amber-400 outline-hidden text-amber-900 bg-amber-50/50"
                  />
                  {editingUser && (
                    <p className="text-[10px] text-slate-400">إذا تُرك فارغاً فلن يتم تغيير كلمة المرور الحالية للحساب.</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">رقم الهاتف / الواتساب:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+249912000000"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-medium focus:border-amber-400 outline-hidden text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">القسم التشغيلي:</label>
                  <select
                    value={departmentCode}
                    onChange={(e) => setDepartmentCode(e.target.value as DepartmentCode)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-medium focus:border-amber-400 outline-hidden bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.code}>
                        {d.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">الدور الوظيفي:</label>
                  <select
                    value={roleCode}
                    onChange={(e) => setRoleCode(e.target.value as RoleCode)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-medium focus:border-amber-400 outline-hidden bg-white"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.code}>
                        {r.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Allowed Modules Selection (Strict RBAC Feature) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    تخصيص الأقسام والشاشات المسموح لهذا الموظف برؤيتها:
                  </span>
                  <span className="text-[10px] text-amber-700 font-medium">
                    (الأقسام غير المحددة ستختفي تماماً من شاشته)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                  {SYSTEM_MODULES.map((mod) => {
                    const isChecked = selectedModules.includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        className={`flex items-start gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-amber-50/80 border-amber-300 text-amber-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleModule(mod.id)}
                          className="mt-0.5 rounded text-[#D99B00] focus:ring-amber-400"
                        />
                        <div className="text-[11px] leading-tight">
                          <div>{mod.label}</div>
                          <div className="text-[9px] text-slate-400 font-normal mt-0.5">{mod.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4 text-[#F5B800]" />
                  <span>{editingUser ? 'حفظ التعديلات' : 'إضافة الموظف الآن'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
