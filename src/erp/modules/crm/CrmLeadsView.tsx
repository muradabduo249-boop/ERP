import React, { useState } from 'react';
import {
  UserPlus,
  Plus,
  Search,
  Phone,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Building,
  Target,
  UserCheck,
  X,
  ArrowLeft,
} from 'lucide-react';
import { erpEngine } from '../../engine/erpEngine';
import { useErpAuth } from '../../context/ErpAuthContext';
import { CustomerMaster, ErpCrmLead } from '../../../types';

export const CrmLeadsView: React.FC<{ onNavigateToCustomers?: () => void }> = ({
  onNavigateToCustomers,
}) => {
  const { currentUser, refreshData } = useErpAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [leadToConvert, setLeadToConvert] = useState<ErpCrmLead | null>(null);
  const [conversionSuccessCustomer, setConversionSuccessCustomer] = useState<CustomerMaster | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [interest, setInterest] = useState<ErpCrmLead['interestCategory']>('import_turnkey');
  const [estimatedValue, setEstimatedValue] = useState<number>(10000);
  const [notes, setNotes] = useState('');

  const leads = erpEngine.getLeads();

  const filtered = leads.filter(
    (l) =>
      l.companyOrClientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm) ||
      l.leadCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !phone.trim()) return;

    erpEngine.createLead(
      {
        companyOrClientName: companyName.trim(),
        contactPerson: contactPerson.trim() || companyName.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        interestCategory: interest,
        estimatedValueUSD: Number(estimatedValue),
        status: 'new',
        assignedTo: currentUser.name,
        notes: notes.trim() || undefined,
      },
      currentUser
    );

    setShowAddModal(false);
    setCompanyName('');
    setContactPerson('');
    setPhone('');
    refreshData();
  };

  const executeConvertLead = () => {
    if (!leadToConvert) return;
    try {
      const customer = erpEngine.convertLeadToCustomer(leadToConvert.id, currentUser);
      refreshData();
      setLeadToConvert(null);
      setConversionSuccessCustomer(customer);
    } catch (err: any) {
      console.error(err);
      setLeadToConvert(null);
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Target className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              إدارة الفرص التسويقية والمبيعات (CRM & Leads)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            متابعة استفسارات المستوردين الجدد، تأهيل الفرص، وتحويل العميل المحتمل إلى عميل رسمي مسجل.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 text-[#F5B800]" />
          <span>+ تسجيل فرصة جديدة (Lead)</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#E2E8F0] flex items-center gap-2 text-xs shadow-xs">
        <Search className="w-4 h-4 text-[#64748B] shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="البحث بالاسم، كود الفرصة، أو رقم الهاتف..."
          className="w-full bg-transparent outline-hidden font-medium text-[#172033]"
        />
      </div>

      {/* Leads Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-dashed border-[#E2E8F0] text-center">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-[#172033] text-sm">لا توجد فرص تسويقية مسجلة حالياً</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1 mb-4">
            سجل أول استفسار من عميل مستورد لمتابعة تحويله لصفقة شراء وشحن.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] transition-colors shadow-xs cursor-pointer"
          >
            + تسجيل فرصة جديدة الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lead) => (
            <div
              key={lead.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded text-xs">
                    {lead.leadCode}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      lead.status === 'converted'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {lead.status === 'converted' ? 'تم التحويل لعميل ✓' : 'فرصة جديدة'}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{lead.companyOrClientName}</h4>
                  <div className="text-xs text-slate-500">جهة الاتصال: {lead.contactPerson}</div>
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">الهاتف:</span>
                    <span className="font-mono font-bold" dir="ltr">{lead.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">الاهتمام:</span>
                    <span className="font-medium text-slate-800">
                      {lead.interestCategory === 'import_turnkey'
                        ? 'استيراد وشحن متكامل'
                        : lead.interestCategory === 'shipping_only'
                        ? 'شحن بحري فقط'
                        : 'تخليص جمركي'}
                    </span>
                  </div>
                  {lead.estimatedValueUSD && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">القيمة التقديرية:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        ${lead.estimatedValueUSD.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {lead.notes && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 line-clamp-2">
                    {lead.notes}
                  </p>
                )}
              </div>

              {lead.status !== 'converted' && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">المسؤول: {lead.assignedTo}</span>
                  <button
                    onClick={() => setLeadToConvert(lead)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>تحويل لعميل رسمي</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: New Lead */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-right border border-slate-200 shadow-2xl animate-in fade-in-50">
            <h3 className="text-base font-black text-slate-900 mb-1">
              تسجيل فرصة تسويقية واستفسار عميل (New CRM Lead)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              تسجيل بيانات العميل المحتمل وتقدير حجم الصفقة لمتابعتها من فريق المبيعات.
            </p>

            <form onSubmit={handleCreateLead} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم العميل / الشركة:</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder="مثال: شركة البركة للمقاولات"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الشخص المسؤول:</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الهاتف / واتساب:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+249 912 000 000"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع الخدمة المطلوبة:</label>
                  <select
                    value={interest}
                    onChange={(e) => setInterest(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="import_turnkey">استيراد وشحن متكامل</option>
                    <option value="shipping_only">شحن بحري / جوي فقط</option>
                    <option value="customs_only">تخليص جمركي بورتسودان</option>
                    <option value="inspection_only">فحص ومطابقة جودة بالصين</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">القيمة التقديرية (USD):</label>
                  <input
                    type="number"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تفاصيل الاستفسار / ملاحظات:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="نوع البضاعة، الكمية المطلوبة، بلد المنشأ..."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  حفظ الفرصة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Lead Conversion to Official Customer */}
      {leadToConvert && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-right border border-slate-200 shadow-2xl animate-in fade-in-50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    تحويل الفرصة إلى عميل رسمي
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {leadToConvert.leadCode}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setLeadToConvert(null)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">اسم العميل / الشركة:</span>
                <span className="font-bold text-slate-900">{leadToConvert.companyOrClientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">الشخص المسؤول:</span>
                <span className="font-bold text-slate-900">{leadToConvert.contactPerson}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">رقم الهاتف / الواتساب:</span>
                <span className="font-mono font-bold text-slate-900" dir="ltr">{leadToConvert.phone}</span>
              </div>
              {leadToConvert.estimatedValueUSD && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">القيمة التقديرية:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    ${leadToConvert.estimatedValueUSD.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
              💡 <b>ملاحظة إدارية:</b> سيتم إنشاء بطاقة عميل رسمية جديدة في <b>سجل العملاء الموحد (Customer Master)</b> وتوليد كود تجاري تسلسلي فريد تلقائياً (مثل <b>SH-C-100X</b>) وتوثيق العملية في سجل التدقيق.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={executeConvertLead}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>تأكيد التحويل الآن</span>
              </button>
              <button
                type="button"
                onClick={() => setLeadToConvert(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Conversion Success */}
      {conversionSuccessCustomer && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-right border border-emerald-200 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                تم تحويل الفرصة إلى عميل رسمي بنجاح!
              </h3>
              <p className="text-xs text-slate-500">
                تم إدراج العميل في سجل العملاء الموحد (Customer Master) وتخصيص الكود التجاري المعتمد.
              </p>
            </div>

            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">الكود التجاري المولد:</span>
                <span className="font-mono font-black text-emerald-800 text-sm bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                  {conversionSuccessCustomer.customerCode}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">اسم العميل / الشركة:</span>
                <span className="font-bold text-slate-900">{conversionSuccessCustomer.companyName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">الشخص المسؤول:</span>
                <span className="font-bold text-slate-900">{conversionSuccessCustomer.contactName}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {onNavigateToCustomers && (
                <button
                  type="button"
                  onClick={() => {
                    setConversionSuccessCustomer(null);
                    onNavigateToCustomers();
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>الانتقال إلى سجل العملاء (Customer Master)</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setConversionSuccessCustomer(null)}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                البقاء في إدارة الفرص التسويقية
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
