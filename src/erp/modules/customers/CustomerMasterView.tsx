import React, { useState, useEffect, useCallback } from 'react';
import { erpEngine } from '../../engine/erpEngine';
import { useErpAuth } from '../../context/ErpAuthContext';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Building2,
  ShieldCheck,
  X,
  FileText,
  UserCheck,
  GitBranch,
  DollarSign,
  Ship,
  Printer,
  ShoppingBag,
  ArrowUpRight,
  Receipt,
  PlusCircle,
  ExternalLink,
  Clock,
  FileSpreadsheet,
  Edit2,
} from 'lucide-react';
import { CustomerMaster, RequestPriority } from '../../../types';
import { ErpDocumentPrintModal, PrintableDocType } from '../../components/ErpDocumentPrintModal';
import { exportToCsv } from '../../../lib/exportUtils';

export const CustomerMasterView: React.FC = () => {
  const { currentUser, refreshData, sessionToken } = useErpAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerMaster | null>(null);
  const [customerSubTab, setCustomerSubTab] = useState<'overview' | 'contacts' | 'requests' | 'shipments' | 'finance'>('overview');
  const [serverCustomers, setServerCustomers] = useState<CustomerMaster[]>([]);
  const [customerContactsList, setCustomerContactsList] = useState<any[]>([]);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactTitle, setNewContactTitle] = useState('');
  const [newContactWechat, setNewContactWechat] = useState('');
  const [newContactIsPrimary, setNewContactIsPrimary] = useState(false);

  // Quick Action Modals inside Customer Profile
  const [showCreateReqModal, setShowCreateReqModal] = useState(false);
  const [showRecordRecModal, setShowRecordRecModal] = useState(false);
  const [printableDoc, setPrintableDoc] = useState<{ type: PrintableDocType; data: any } | null>(null);

  // Quick Request Form State
  const [reqTitle, setReqTitle] = useState('');
  const [reqType, setReqType] = useState('PURCHASE_AND_SHIP');
  const [reqPriority, setReqPriority] = useState<RequestPriority>('normal');
  const [reqNotes, setReqNotes] = useState('');

  // Quick Receipt Form State
  const [recAmount, setRecAmount] = useState<number>(1000);
  const [recCurrency, setRecCurrency] = useState<'USD' | 'SDG' | 'AED'>('USD');
  const [recMethod, setRecMethod] = useState<'wire_transfer' | 'bankak' | 'cash_usd' | 'dubai_account'>('wire_transfer');
  const [recRef, setRecRef] = useState('');

  // New Customer Form State
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [businessType, setBusinessType] = useState<CustomerMaster['businessType']>('commercial');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('السودان');
  const [customCountry, setCustomCountry] = useState('');
  const [city, setCity] = useState('بورتسودان');
  const [address, setAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [notes, setNotes] = useState('');

  // Edit Customer Form State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editContactName, setEditContactName] = useState('');
  const [editBusinessType, setEditBusinessType] = useState<CustomerMaster['businessType']>('commercial');
  const [editPhone, setEditPhone] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCountry, setEditCountry] = useState('السودان');
  const [editCustomCountry, setEditCustomCountry] = useState('');
  const [editCity, setEditCity] = useState('بورتسودان');
  const [editAddress, setEditAddress] = useState('');
  const [editTaxNumber, setEditTaxNumber] = useState('');
  const [editNationalId, setEditNationalId] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Duplicate check alert
  const [dupWarning, setDupWarning] = useState<CustomerMaster[] | null>(null);

  const fetchServerCustomers = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const res = await fetch('/api/customers?limit=100', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const mapped: CustomerMaster[] = data.data.map((c: any) => ({
          id: c.id,
          customerCode: c.customerCode,
          companyName: c.companyName,
          contactName: c.tradeName || c.companyName,
          businessType: c.customerType || 'commercial',
          primaryPhone: c.primaryPhone,
          whatsapp: c.whatsapp || c.primaryPhone,
          email: c.email || undefined,
          country: c.country || 'السودان',
          city: c.city || 'بورتسودان',
          address: c.address || undefined,
          taxNumber: c.taxNumber || undefined,
          nationalIdOrPassport: c.nationalIdOrPassport || undefined,
          status: c.status || 'active',
          totalRequestsCount: 0,
          activeShipmentsCount: 0,
          notes: c.notes || undefined,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));
        setServerCustomers(mapped);
      }
    } catch {}
  }, [sessionToken]);

  useEffect(() => {
    fetchServerCustomers();
  }, [fetchServerCustomers]);

  const loadCustomerContacts = async (cust: CustomerMaster) => {
    setSelectedCustomer(cust);
    if (!sessionToken) return;
    try {
      const res = await fetch(`/api/contacts?entityType=customer&entityId=${cust.id}`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setCustomerContactsList(data.data || []);
      }
    } catch {}
  };

  const engineCustomers = erpEngine.getCustomers();
  const customers = serverCustomers.length > 0 ? serverCustomers : engineCustomers;

  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.customerCode.toLowerCase().includes(q) ||
      c.companyName.toLowerCase().includes(q) ||
      c.contactName.toLowerCase().includes(q) ||
      c.primaryPhone.includes(q) ||
      c.whatsapp.includes(q)
    );
  });

  // Search before create / duplicate check
  const handleCheckDuplicates = async () => {
    if (!phone && !companyName) return;
    if (sessionToken) {
      try {
        const params = new URLSearchParams({ phone, companyName, taxNumber });
        const res = await fetch(`/api/customers/check-duplicate?${params.toString()}`, {
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
        const data = await res.json();
        if (data.success && data.data.hasDuplicate) {
          setDupWarning(data.data.matches);
          return;
        }
      } catch {}
    }
    const check = erpEngine.checkCustomerDuplicates(phone, companyName);
    if (check.hasDuplicate) {
      setDupWarning(check.matches);
    } else {
      setDupWarning(null);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !phone.trim()) return;

    const finalCountry = country === 'أخرى' ? (customCountry.trim() || 'دولة أخرى') : country;

    // Check duplicate first
    if (sessionToken) {
      try {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            companyName: companyName.trim(),
            primaryContactName: contactName.trim() || companyName.trim(),
            customerType: businessType,
            phone: phone.trim(),
            whatsapp: whatsapp.trim() || phone.trim(),
            email: email.trim() || undefined,
            country: finalCountry,
            city: city.trim() || 'بورتسودان',
            address: address.trim() || undefined,
            taxNumber: taxNumber.trim() || undefined,
            nationalIdOrPassport: nationalId.trim() || undefined,
            notes: notes.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          alert(data.error?.message || 'فشل حفظ العميل');
          return;
        }
        fetchServerCustomers();
      } catch {}
    }

    const created = erpEngine.createCustomer(
      {
        companyName: companyName.trim(),
        contactName: contactName.trim() || companyName.trim(),
        businessType,
        primaryPhone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        email: email.trim() || undefined,
        country: finalCountry,
        city: city.trim() || 'بورتسودان',
        address: address.trim() || undefined,
        taxNumber: taxNumber.trim() || undefined,
        nationalIdOrPassport: nationalId.trim() || undefined,
        status: 'active',
        assignedSalesRepId: currentUser.id,
        assignedSalesRepName: currentUser.name,
        notes: notes.trim() || undefined,
      },
      currentUser
    );

    setShowAddModal(false);
    setCompanyName('');
    setContactName('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setCountry('السودان');
    setCustomCountry('');
    setCity('بورتسودان');
    setTaxNumber('');
    setNotes('');
    setDupWarning(null);
    refreshData();
    setSelectedCustomer(created);
  };

  const handleOpenEditCustomer = (cust: CustomerMaster) => {
    setEditCompanyName(cust.companyName || '');
    setEditContactName(cust.contactName || '');
    setEditBusinessType(cust.businessType || 'commercial');
    setEditPhone(cust.primaryPhone || '');
    setEditWhatsapp(cust.whatsapp || '');
    setEditEmail(cust.email || '');
    const standardCountries = [
      'السودان',
      'الإمارات العربية المتحدة',
      'الصين',
      'المملكة العربية السعودية',
      'مصر',
      'تركيا',
      'قطر',
      'سلطنة عمان',
    ];
    if (standardCountries.includes(cust.country)) {
      setEditCountry(cust.country);
      setEditCustomCountry('');
    } else {
      setEditCountry('أخرى');
      setEditCustomCountry(cust.country || '');
    }
    setEditCity(cust.city || 'بورتسودان');
    setEditAddress(cust.address || '');
    setEditTaxNumber(cust.taxNumber || '');
    setEditNationalId(cust.nationalIdOrPassport || '');
    setEditNotes(cust.notes || '');
    setShowEditModal(true);
  };

  const handleSaveEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!editCompanyName.trim() || !editPhone.trim()) {
      alert('يرجى ملء اسم الشركة ورقم الهاتف');
      return;
    }

    const finalCountry = editCountry === 'أخرى' ? (editCustomCountry.trim() || 'دولة أخرى') : editCountry;
    setIsSavingEdit(true);

    try {
      if (sessionToken) {
        await fetch(`/api/customers/${selectedCustomer.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            companyName: editCompanyName.trim(),
            primaryContactName: editContactName.trim() || editCompanyName.trim(),
            customerType: editBusinessType,
            phone: editPhone.trim(),
            whatsapp: editWhatsapp.trim() || editPhone.trim(),
            email: editEmail.trim() || undefined,
            country: finalCountry,
            city: editCity.trim() || 'بورتسودان',
            address: editAddress.trim() || undefined,
            taxNumber: editTaxNumber.trim() || undefined,
            nationalIdOrPassport: editNationalId.trim() || undefined,
            notes: editNotes.trim() || undefined,
          }),
        });
      }

      const updated = erpEngine.updateCustomer(
        selectedCustomer.id,
        {
          companyName: editCompanyName.trim(),
          contactName: editContactName.trim() || editCompanyName.trim(),
          businessType: editBusinessType,
          primaryPhone: editPhone.trim(),
          whatsapp: editWhatsapp.trim() || editPhone.trim(),
          email: editEmail.trim() || undefined,
          country: finalCountry,
          city: editCity.trim() || 'بورتسودان',
          address: editAddress.trim() || undefined,
          taxNumber: editTaxNumber.trim() || undefined,
          nationalIdOrPassport: editNationalId.trim() || undefined,
          notes: editNotes.trim() || undefined,
        },
        currentUser
      );

      setSelectedCustomer(updated);
      setShowEditModal(false);
      refreshData();
      fetchServerCustomers();
    } catch (err: any) {
      alert(err.message || 'فشل تحديث بيانات العميل');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleQuickCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !reqTitle.trim()) return;

    erpEngine.createRequest(
      {
        customerId: selectedCustomer.id,
        requestTypeCode: reqType,
        title: reqTitle.trim(),
        priority: reqPriority,
        notes: reqNotes.trim() || undefined,
      },
      currentUser
    );

    setShowCreateReqModal(false);
    setReqTitle('');
    setReqNotes('');
    refreshData();
  };

  const handleQuickRecordReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const custRequests = erpEngine.getRequests().filter((r) => r.customerId === selectedCustomer.id);
    const primaryReq = custRequests[0] || { id: 'req-direct', requestCode: 'REQ-GENERAL' };

    erpEngine.recordReceipt(
      {
        requestId: primaryReq.id,
        requestCode: primaryReq.requestCode,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.companyName,
        amount: Number(recAmount),
        currency: recCurrency,
        paymentMethod: recMethod,
        referenceNumber: recRef || `REC-${Date.now().toString().slice(-6)}`,
        receivedBy: currentUser.name,
        notes: `تحصيل مباشر لحساب العميل [${selectedCustomer.customerCode}]`,
      },
      currentUser
    );

    setShowRecordRecModal(false);
    setRecRef('');
    refreshData();
  };

  // Helper data for selected customer
  const customerRequests = selectedCustomer
    ? erpEngine.getRequests().filter((r) => r.customerId === selectedCustomer.id)
    : [];
  const customerRequestIds = customerRequests.map((r) => r.id);

  const customerShipments = selectedCustomer
    ? erpEngine
        .getShipments()
        .filter((s) => s.customerName === selectedCustomer.companyName || customerRequestIds.includes(s.requestId))
    : [];

  const customerInvoices = selectedCustomer
    ? erpEngine.getInvoices().filter((inv) => inv.customerId === selectedCustomer.id)
    : [];

  const customerReceipts = selectedCustomer
    ? erpEngine.getReceipts().filter((rec) => rec.customerId === selectedCustomer.id)
    : [];

  const totalInvoiced = customerInvoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
  const totalCollected = customerReceipts.reduce((acc, rec) => acc + (rec.amount || 0), 0);
  const totalBalanceDue = customerInvoices.reduce((acc, inv) => acc + (inv.balanceAmount || 0), 0);

  const handleExportCustomers = () => {
    const headers = [
      'الكود التجاري',
      'اسم الشركة / التاجر',
      'الشخص المسؤول',
      'نوع النشاط',
      'رقم الهاتف الأساسي',
      'رقم الواتساب',
      'البريد الإلكتروني',
      'المدينة',
      'العنوان',
      'الرقم الضريبي',
      'الرقم الوطني / السجل',
      'تاريخ التسجيل',
    ];

    const rows = filtered.map((c) => [
      c.customerCode,
      c.companyName,
      c.contactName,
      c.businessType === 'commercial' ? 'تجاري / شركات' : c.businessType === 'individual' ? 'أفراد' : 'حكومي',
      c.primaryPhone,
      c.whatsapp,
      c.email || '',
      c.city,
      c.address,
      c.taxNumber || '',
      c.nationalIdOrPassport || '',
      c.createdAt.split('T')[0],
    ]);

    exportToCsv('SAHLA_Customer_Master_Database', headers, rows);
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-[#D99B00]" />
            <h2 className="text-xl font-bold text-slate-900">
              سجل العملاء الموحد (Customer Master)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            المصدر المركزي المعتمد لبيانات العملاء مع فصل الرمز التجاري (SH-C-1001) عن المعرف الداخلي وتطبيق منع التكرار.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCustomers}
            title="تصدير قاعدة بيانات العملاء إلى Excel / CSV مع دعم الحروف العربية UTF-8"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all border border-slate-200"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={() => {
              setDupWarning(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F5B800]" />
            <span>تسجيل عميل جديد (كود تجاري)</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="بحث بالكود التجاري (SH-C)، اسم الشركة، الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-[#F5B800]/20"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          إجمالي العملاء المسجلين: <b className="text-slate-900">{customers.length}</b> عميل
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="py-4 px-5">الكود التجاري (Code)</th>
                <th className="py-4 px-5">اسم الشركة والعميل</th>
                <th className="py-4 px-5">نوع النشاط</th>
                <th className="py-4 px-5">الهاتف وواتساب</th>
                <th className="py-4 px-5">المدينة</th>
                <th className="py-4 px-5 text-center">الطلبات</th>
                <th className="py-4 px-5 text-center">الشحنات النشطة</th>
                <th className="py-4 px-5 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    لا يوجد عملاء يطابقون معايير البحث.
                  </td>
                </tr>
              ) : (
                filtered.map((cust) => (
                  <tr
                    key={cust.id}
                    onClick={() => setSelectedCustomer(cust)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-5 font-mono font-black text-[#D99B00] text-sm">
                      {cust.customerCode}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 text-sm">{cust.companyName}</div>
                      <div className="text-[11px] text-slate-500">المسؤول: {cust.contactName}</div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {cust.businessType === 'commercial'
                          ? 'مستورد تجاري'
                          : cust.businessType === 'industrial'
                          ? 'مصنع / قطاع صناعي'
                          : cust.businessType === 'startup'
                          ? 'رائد أعمال Start-Up'
                          : 'فرد'}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono" dir="ltr">
                      <div className="font-bold text-slate-800">{cust.primaryPhone}</div>
                      <div className="text-[10px] text-emerald-700">WA: {cust.whatsapp}</div>
                    </td>
                    <td className="py-4 px-5 font-medium">{cust.city}</td>
                    <td className="py-4 px-5 text-center font-bold font-mono">
                      {cust.totalRequestsCount}
                    </td>
                    <td className="py-4 px-5 text-center font-mono font-bold text-blue-700">
                      {cust.activeShipmentsCount}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>نشط</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= CUSTOMER PROFILE 360° DRAWER ================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-8 text-right space-y-5 shadow-2xl border border-slate-200 flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
                <div>
                  <div className="text-xs text-slate-400 font-mono">
                    الكود التجاري المعتمد لدى سهلا
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#D99B00] font-mono">
                    {selectedCustomer.customerCode}
                  </h3>
                </div>
              </div>

              {/* Quick Customer Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowCreateReqModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ فتح طلب جديد</span>
                </button>
                <button
                  onClick={() => setShowRecordRecModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>+ قبض دفعة مالية</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-400 block text-[11px]">الطلبات المركزية:</span>
                <span className="font-mono font-black text-slate-900 text-base">{customerRequests.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-400 block text-[11px]">الشحنات اللوجستية:</span>
                <span className="font-mono font-black text-sky-700 text-base">{customerShipments.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-400 block text-[11px]">المحصل الإجمالي:</span>
                <span className="font-mono font-black text-emerald-600 text-sm">
                  ${totalCollected.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-400 block text-[11px]">الرصيد المستحق:</span>
                <span className={`font-mono font-black text-sm ${totalBalanceDue > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  ${totalBalanceDue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Sub Tabs Navigation */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                onClick={() => setCustomerSubTab('overview')}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  customerSubTab === 'overview'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>الملف التعريفي</span>
              </button>
              <button
                onClick={() => setCustomerSubTab('requests')}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  customerSubTab === 'requests'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5 text-amber-600" />
                <span>الطلبات ({customerRequests.length})</span>
              </button>
              <button
                onClick={() => setCustomerSubTab('shipments')}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  customerSubTab === 'shipments'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Ship className="w-3.5 h-3.5 text-sky-600" />
                <span>الشحنات ({customerShipments.length})</span>
              </button>
              <button
                onClick={() => setCustomerSubTab('finance')}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  customerSubTab === 'finance'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>الحسابات والمالية</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {customerSubTab === 'overview' && (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-base font-bold text-slate-900">{selectedCustomer.companyName}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        كود العميل: {selectedCustomer.customerCode} | {selectedCustomer.country} - {selectedCustomer.city}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenEditCustomer(selectedCustomer)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>تعديل بيانات العميل</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <span className="text-slate-400 block mb-0.5">الشخص المسؤول:</span>
                      <b>{selectedCustomer.contactName}</b>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">الهاتف الأساسي:</span>
                      <b dir="ltr" className="font-mono">{selectedCustomer.primaryPhone}</b>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">رقم WhatsApp:</span>
                      <b dir="ltr" className="font-mono text-emerald-700">{selectedCustomer.whatsapp}</b>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">نوع النشاط:</span>
                      <span className="font-bold">
                        {selectedCustomer.businessType === 'commercial' ? 'مستورد تجاري' : 'قطاع صناعي'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">المدينة والعنوان بالسودان:</span>
                      <b>{selectedCustomer.city} {selectedCustomer.address ? ` - ${selectedCustomer.address}` : ''}</b>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">الرقم الضريبي / السجل:</span>
                      <b className="font-mono">{selectedCustomer.taxNumber || 'غير مسجل'}</b>
                    </div>
                  </div>

                  {selectedCustomer.notes && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 mt-2 text-slate-600">
                      <b>ملاحظات الحساب: </b> {selectedCustomer.notes}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: REQUESTS */}
            {customerSubTab === 'requests' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">سجل طلبات العميل:</span>
                  <button
                    onClick={() => setShowCreateReqModal(true)}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-colors"
                  >
                    + طلب جديد
                  </button>
                </div>

                {customerRequests.length === 0 ? (
                  <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                    لا توجد طلبات مسجلة لهذا العميل حتى الآن.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerRequests.map((r) => (
                      <div
                        key={r.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-mono font-bold text-slate-900">{r.requestCode}</div>
                          <div className="text-[11px] text-slate-600 mt-0.5">{r.title}</div>
                        </div>
                        <div className="text-left font-mono">
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                            {r.status}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {new Date(r.createdAt).toLocaleDateString('ar-SD')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SHIPMENTS */}
            {customerSubTab === 'shipments' && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 block">شحنات وعمليات العميل:</span>
                {customerShipments.length === 0 ? (
                  <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                    لا توجد شحنات لوجستية مسجلة لهذا العميل حتى الآن.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerShipments.map((s) => (
                      <div
                        key={s.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{s.shipmentCode}</span>
                            <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
                              {s.transitStatus}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1">
                            {s.originPort} ➔ {s.destinationPort} | {s.shippingLineOrCarrier}
                          </div>
                        </div>
                        <div className="text-left font-mono">
                          <button
                            onClick={() => setPrintableDoc({ type: 'shipping_waybill', data: s })}
                            className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5 text-sky-700" />
                            <span>بوليصة</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: FINANCE & LEDGER */}
            {customerSubTab === 'finance' && (
              <div className="space-y-4 text-xs">
                {/* Invoices List */}
                <div>
                  <div className="font-bold text-slate-800 mb-2 flex items-center justify-between">
                    <span>فواتير ومطالبات الخدمات:</span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      إجمالي: ${totalInvoiced.toLocaleString()}
                    </span>
                  </div>
                  {customerInvoices.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
                      لا توجد فواتير مسجلة
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {customerInvoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono font-bold text-slate-900">{inv.invoiceCode}</span>
                            <span className="text-slate-500 text-[11px] mr-2">{inv.description}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-slate-900">
                              {inv.totalAmount.toLocaleString()} {inv.currency}
                            </span>
                            <button
                              onClick={() => setPrintableDoc({ type: 'invoice', data: inv })}
                              className="p-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                              title="طباعة الفاتورة"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Receipts List */}
                <div>
                  <div className="font-bold text-slate-800 mb-2 flex items-center justify-between">
                    <span>سندات القبض والتحصيل:</span>
                    <span className="font-mono text-emerald-700 text-[11px]">
                      المحصل: ${totalCollected.toLocaleString()}
                    </span>
                  </div>
                  {customerReceipts.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
                      لا توجد سندات قبض مسجلة
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {customerReceipts.map((rec) => (
                        <div
                          key={rec.id}
                          className="p-2.5 rounded-xl border border-slate-200 bg-emerald-50/40 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono font-bold text-emerald-900">{rec.receiptCode}</span>
                            <span className="text-slate-500 text-[11px] mr-2">طريقة: {rec.paymentMethod}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-emerald-700">
                              {rec.amount.toLocaleString()} {rec.currency}
                            </span>
                            <button
                              onClick={() => setPrintableDoc({ type: 'receipt', data: rec })}
                              className="p-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              title="طباعة سند القبض"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK MODAL 1: CREATE REQUEST FOR CUSTOMER */}
      {showCreateReqModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-right space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={() => setShowCreateReqModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">فتح طلب مركزي جديد للعميل</h4>
                <div className="text-[11px] text-slate-500 font-mono">{selectedCustomer.companyName}</div>
              </div>
            </div>

            <form onSubmit={handleQuickCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان / ملخص الطلب *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: توريد 500 كرتونة بضائع من كوانزو إلى بورتسودان"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع الطلب</label>
                  <select
                    value={reqType}
                    onChange={(e) => setReqType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="PURCHASE_AND_SHIP">شراء وتوريد وشحن</option>
                    <option value="SHIPPING_LCL">شحن بحري مجزأ LCL</option>
                    <option value="SHIPPING_FCL">شحن بحري حاوية FCL</option>
                    <option value="CUSTOMS_ONLY">تخليص جمركي فقط</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الأولوية</label>
                  <select
                    value={reqPriority}
                    onChange={(e) => setReqPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="normal">عادية (Normal)</option>
                    <option value="high">مرتفعة (High)</option>
                    <option value="urgent">عاجلة جداً (Urgent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات ومواصفات البضاعة</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات تشغيلية..."
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                >
                  حفظ الطلب بالعمود الفقري
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateReqModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK MODAL 2: RECORD RECEIPT FOR CUSTOMER */}
      {showRecordRecModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-right space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={() => setShowRecordRecModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">تسجيل سند تحصيل / قبض مالي</h4>
                <div className="text-[11px] text-slate-500 font-mono">{selectedCustomer.companyName}</div>
              </div>
            </div>

            <form onSubmit={handleQuickRecordReceipt} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المبلغ المحصل *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={recAmount}
                    onChange={(e) => setRecAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">العملة</label>
                  <select
                    value={recCurrency}
                    onChange={(e) => setRecCurrency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="SDG">SDG (جنيه سوداني)</option>
                    <option value="AED">AED (درهم إماراتي)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">طريقة السداد</label>
                  <select
                    value={recMethod}
                    onChange={(e) => setRecMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="wire_transfer">تحويل بنكي خارجي</option>
                    <option value="bankak">تطبيق بنكك (سودان)</option>
                    <option value="dubai_account">إيداع حساب دبي</option>
                    <option value="cash_usd">نقداً دولار</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم المرجع / الإشعار</label>
                  <input
                    type="text"
                    placeholder="TX-XXXX..."
                    value={recRef}
                    onChange={(e) => setRecRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  تأكيد وقيد سند القبض
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecordRecModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT MODAL IF INVOKED */}
      {printableDoc && (
        <ErpDocumentPrintModal
          docType={printableDoc.type}
          data={printableDoc.data}
          onClose={() => setPrintableDoc(null)}
        />
      )}


      {/* ================= ADD CUSTOMER MODAL WITH DEDUPLICATION ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-right space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-base font-bold text-slate-900">تسجيل عميل جديد بالسجل الموحد</h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  سيتم توليد كود تجاري تسلسلي: SH-C-XXXX تلقائياً
                </span>
              </div>
            </div>

            {/* Duplicate warning alert if detected */}
            {dupWarning && dupWarning.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span>تنبيه: تم العثور على عميل مشابه مسجل مسبقاً!</span>
                </div>
                {dupWarning.map((m) => (
                  <div key={m.id} className="p-2 bg-white rounded-lg border border-rose-200 mt-1">
                    <b>{m.companyName}</b> ({m.customerCode}) - هاتف: {m.primaryPhone}
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  اسم الشركة أو الاسم التجاري *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة النيل الأزرق للاستيراد"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  onBlur={handleCheckDuplicates}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الشخص المسؤول *</label>
                  <input
                    type="text"
                    required
                    placeholder="اسم المسؤول..."
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع النشاط</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="commercial">مستورد تجاري</option>
                    <option value="industrial">قطاع صناعي / مصنع</option>
                    <option value="startup">رائد أعمال Start-Up</option>
                    <option value="individual">فرد</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف الأساسي *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+249..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={handleCheckDuplicates}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-right"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="+249..."
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-right"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الدولة *</label>
                  <select
                    value={country}
                    onChange={(e) => {
                      const newCountry = e.target.value;
                      setCountry(newCountry);
                      if (newCountry === 'السودان') setCity('بورتسودان');
                      else if (newCountry === 'الإمارات العربية المتحدة') setCity('دبي');
                      else if (newCountry === 'الصين') setCity('كوانزو (Guangzhou)');
                      else if (newCountry === 'المملكة العربية السعودية') setCity('الرياض');
                      else if (newCountry === 'مصر') setCity('القاهرة');
                      else if (newCountry === 'تركيا') setCity('إسطنبول');
                      else setCity('');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="السودان">السودان (Sudan)</option>
                    <option value="الإمارات العربية المتحدة">الإمارات العربية المتحدة (UAE)</option>
                    <option value="الصين">الصين (China)</option>
                    <option value="المملكة العربية السعودية">المملكة العربية السعودية (KSA)</option>
                    <option value="مصر">مصر (Egypt)</option>
                    <option value="تركيا">تركيا (Turkey)</option>
                    <option value="قطر">قطر (Qatar)</option>
                    <option value="سلطنة عمان">سلطنة عمان (Oman)</option>
                    <option value="أخرى">دولة أخرى (International)</option>
                  </select>
                  {country === 'أخرى' && (
                    <div className="mt-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم الدولة / البلد: *</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: تشاد، أوغندا، كندا، ألمانيا..."
                        value={customCountry}
                        onChange={(e) => setCustomCountry(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/40 text-xs font-bold"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المدينة / المقر *</label>
                  <input
                    type="text"
                    required
                    list="city-suggestions"
                    placeholder="اسم المدينة..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                  <datalist id="city-suggestions">
                    {country === 'السودان' && (
                      <>
                        <option value="بورتسودان" />
                        <option value="الخرطوم" />
                        <option value="أم درمان" />
                        <option value="بحري" />
                        <option value="عطبرة" />
                        <option value="ود مدني" />
                        <option value="كسلا" />
                        <option value="القضارف" />
                        <option value="كوستي" />
                        <option value="دنقلا" />
                      </>
                    )}
                    {country === 'الإمارات العربية المتحدة' && (
                      <>
                        <option value="دبي" />
                        <option value="الشارقة" />
                        <option value="أبوظبي" />
                        <option value="عجمان" />
                      </>
                    )}
                    {country === 'الصين' && (
                      <>
                        <option value="كوانزو (Guangzhou)" />
                        <option value="فوشان (Foshan)" />
                        <option value="شنتشن (Shenzhen)" />
                        <option value="إيوو (Yiwu)" />
                        <option value="تشينغداو (Qingdao)" />
                        <option value="شنغهاي (Shanghai)" />
                        <option value="نينغبو (Ningbo)" />
                      </>
                    )}
                    {country === 'المملكة العربية السعودية' && (
                      <>
                        <option value="الرياض" />
                        <option value="جدة" />
                        <option value="الدمام" />
                      </>
                    )}
                    {country === 'مصر' && (
                      <>
                        <option value="القاهرة" />
                        <option value="الإسكندرية" />
                      </>
                    )}
                    {country === 'تركيا' && (
                      <>
                        <option value="إسطنبول" />
                        <option value="أنقرة" />
                        <option value="مرسين" />
                      </>
                    )}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني (إن وجد)</label>
                  <input
                    type="email"
                    placeholder="info@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الرقم الضريبي / السجل التجاري</label>
                  <input
                    type="text"
                    placeholder="TX-SD-XXXX أو رقم السجل"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات الحساب</label>
                <textarea
                  rows={2}
                  placeholder="طبيعة السلع، المصانع المتعامل معها..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  حفظ وتوليد الكود التجاري
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-[#EFF6FF] text-[#172033] font-bold text-xs cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#172033]/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 text-right space-y-4 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-[#2563EB] rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">تعديل وتحديث بيانات العميل</h3>
                  <p className="text-[11px] text-slate-500 font-mono">الكود التجاري: {selectedCustomer.customerCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">اسم الشركة / التاجر الرسمي *</label>
                  <input
                    type="text"
                    required
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الشخص المسؤول / المفوض *</label>
                  <input
                    type="text"
                    required
                    value={editContactName}
                    onChange={(e) => setEditContactName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع النشاط التجاري</label>
                  <select
                    value={editBusinessType}
                    onChange={(e) => setEditBusinessType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="commercial">مستورد تجاري (Commercial Importer)</option>
                    <option value="industrial">قطاع صناعي / مصنع (Industrial Factory)</option>
                    <option value="individual">تاجر فردي / شخصي (Individual Trader)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف الأساسي *</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم WhatsApp للتواصل *</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-left"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-left font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الدولة / الإقليم *</label>
                  <select
                    value={editCountry}
                    onChange={(e) => {
                      const newC = e.target.value;
                      setEditCountry(newC);
                      if (newC === 'السودان') setEditCity('بورتسودان');
                      else if (newC === 'الإمارات العربية المتحدة') setEditCity('دبي');
                      else if (newC === 'الصين') setEditCity('كوانزو (Guangzhou)');
                      else if (newC === 'المملكة العربية السعودية') setEditCity('الرياض');
                      else if (newC === 'مصر') setEditCity('القاهرة');
                      else if (newC === 'تركيا') setEditCity('إسطنبول');
                      else setEditCity('');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="السودان">السودان (Sudan)</option>
                    <option value="الإمارات العربية المتحدة">الإمارات العربية المتحدة (UAE)</option>
                    <option value="الصين">الصين (China)</option>
                    <option value="المملكة العربية السعودية">المملكة العربية السعودية (KSA)</option>
                    <option value="مصر">مصر (Egypt)</option>
                    <option value="تركيا">تركيا (Turkey)</option>
                    <option value="قطر">قطر (Qatar)</option>
                    <option value="سلطنة عمان">سلطنة عمان (Oman)</option>
                    <option value="أخرى">دولة أخرى (International)</option>
                  </select>
                  {editCountry === 'أخرى' && (
                    <div className="mt-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم الدولة / البلد: *</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: تشاد، أوغندا، كندا، ألمانيا..."
                        value={editCustomCountry}
                        onChange={(e) => setEditCustomCountry(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/40 text-xs font-bold"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المدينة / المقر *</label>
                  <input
                    type="text"
                    required
                    list="edit-city-suggestions"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                  <datalist id="edit-city-suggestions">
                    <option value="بورتسودان" />
                    <option value="الخرطوم" />
                    <option value="أم درمان" />
                    <option value="بحري" />
                    <option value="عطبرة" />
                    <option value="ود مدني" />
                    <option value="كسلا" />
                    <option value="القضارف" />
                    <option value="كوستي" />
                    <option value="دنقلا" />
                    <option value="دبي" />
                    <option value="الشارقة" />
                    <option value="الرياض" />
                    <option value="جدة" />
                    <option value="القاهرة" />
                  </datalist>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">العنوان التفصيلي / المستودع بالسودان</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الرقم الضريبي (TIN)</label>
                  <input
                    type="text"
                    value={editTaxNumber}
                    onChange={(e) => setEditTaxNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الرقم الوطني / السجل التجاري</label>
                  <input
                    type="text"
                    value={editNationalId}
                    onChange={(e) => setEditNationalId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">ملاحظات الحساب</label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#172033] font-bold text-xs cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? 'جاري حفظ التعديلات...' : 'تأكيد وحفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
