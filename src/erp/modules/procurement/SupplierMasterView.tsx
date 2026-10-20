import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Phone,
  MessageCircle,
  Mail,
  Globe,
  MapPin,
  Star,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  X,
  CreditCard,
  FileText,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  ExternalLink,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useErpAuth } from '../../context/ErpAuthContext';

export interface SupplierRecord {
  id: string;
  supplierCode: string;
  name: string;
  tradeNameEn?: string | null;
  supplierType: string;
  status: string;
  country: string;
  city: string;
  address?: string | null;
  phone: string;
  secondaryPhone?: string | null;
  whatsapp?: string | null;
  wechat?: string | null;
  email?: string | null;
  website?: string | null;
  taxNumber?: string | null;
  businessLicense?: string | null;
  categories: string[];
  paymentTerms?: string | null;
  defaultCurrency: string;
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankIbanSwift?: string | null;
  bankBranch?: string | null;
  rating: number;
  tier: string;
  leadTimeDays?: number | null;
  notes?: string | null;
  complianceNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactRecord {
  id: string;
  contactCode?: string | null;
  entityType: string;
  supplierId?: string | null;
  name: string;
  nameEn?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  phone: string;
  mobile?: string | null;
  whatsapp?: string | null;
  wechat?: string | null;
  email?: string | null;
  isPrimary: boolean;
  active: boolean;
  notes?: string | null;
}

export interface PartyDocRecord {
  id: string;
  title: string;
  documentType: string;
  documentNumber?: string | null;
  expiryDate?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  notes?: string | null;
  createdAt: string;
}

const SUPPLIER_TYPE_LABELS: Record<string, string> = {
  manufacturer: 'مصنع مباشر (Direct Factory)',
  trading_company: 'شركة تجارية / وكيل تصدير (Trading Co)',
  shipping_line: 'خط ملاحي / وكيل شحن (Shipping Line)',
  customs_broker: 'مخلص جمركي (Customs Broker)',
  inland_transporter: 'شركة نقل داخلي وشاحنات (Trucking)',
  warehouse: 'مستودعات وتخزين (Warehousing)',
  inspection_agency: 'هيئة فحص وجودة ومعاينة (Inspection)',
  packaging: 'خدمات تعبئة وتغليف (Packaging)',
  other: 'مورد خدمات عامة (Other)',
};

export const SupplierMasterView: React.FC = () => {
  const { sessionToken, currentUser } = useErpAuth();

  // Data states
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');

  // Selected Profile Drawer / Modal
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'contacts' | 'documents'>('overview');
  const [profileContacts, setProfileContacts] = useState<ContactRecord[]>([]);
  const [profileDocs, setProfileDocs] = useState<PartyDocRecord[]>([]);
  const [loadingProfileDetails, setLoadingProfileDetails] = useState(false);

  // Create / Edit Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierRecord | null>(null);
  const [formName, setFormName] = useState('');
  const [formTradeNameEn, setFormTradeNameEn] = useState('');
  const [formSupplierType, setFormSupplierType] = useState('manufacturer');
  const [formCountry, setFormCountry] = useState('الصين');
  const [formCustomCountry, setFormCustomCountry] = useState('');
  const [formCity, setFormCity] = useState('فوشان (Foshan)');
  const [formPhone, setFormPhone] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formWechat, setFormWechat] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCategories, setFormCategories] = useState('');
  const [formPaymentTerms, setFormPaymentTerms] = useState('T/T 30% Deposit / 70% Before Shipment');
  const [formDefaultCurrency, setFormDefaultCurrency] = useState('USD');
  const [formBankName, setFormBankName] = useState('Bank of China');
  const [formBankAccountName, setFormBankAccountName] = useState('');
  const [formBankAccountNumber, setFormBankAccountNumber] = useState('');
  const [formBankIbanSwift, setFormBankIbanSwift] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formTier, setFormTier] = useState('A');
  const [formLicense, setFormLicense] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formContactTitle, setFormContactTitle] = useState('مدير المبيعات والتصدير');
  const [dupWarning, setDupWarning] = useState<SupplierRecord[] | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Add Contact Modal
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWechat, setContactWechat] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactIsPrimary, setContactIsPrimary] = useState(false);

  // Add Document Modal
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('business_license');
  const [docNumber, setDocNumber] = useState('');
  const [docFileUrl, setDocFileUrl] = useState('');

  // Bulk Import Modal
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);

  // Fetch Suppliers from Server
  const fetchSuppliers = useCallback(async () => {
    const token = sessionToken || (typeof window !== 'undefined' ? localStorage.getItem('sahla_erp_auth_token_v1') : null);
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
        search: searchQuery,
        country: countryFilter,
        supplierType: typeFilter,
        status: statusFilter,
        tier: tierFilter,
      });

      const res = await fetch(`/api/suppliers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.data || []);
        setTotalCount(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionToken, currentPage, pageSize, searchQuery, countryFilter, typeFilter, statusFilter, tierFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Load details for selected supplier
  const loadSupplierDetails = async (sup: SupplierRecord) => {
    setSelectedSupplier(sup);
    setLoadingProfileDetails(true);
    try {
      const token = sessionToken || (typeof window !== 'undefined' ? localStorage.getItem('sahla_erp_auth_token_v1') : null);
      const res = await fetch(`/api/suppliers/${sup.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setProfileContacts(data.data.contacts || []);
        setProfileDocs(data.data.documents || []);
      }
    } catch (err) {
      console.error('Failed to load supplier details:', err);
    } finally {
      setLoadingProfileDetails(false);
    }
  };

  // Duplicate Check
  const handleCheckDuplicates = async () => {
    if (!formPhone && !formName) return;
    try {
      const params = new URLSearchParams({
        phone: formPhone,
        name: formName,
        businessLicense: formLicense,
        excludeId: editingSupplier?.id || '',
      });
      const res = await fetch(`/api/suppliers/check-duplicate?${params.toString()}`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await res.json();
      if (data.success && data.data.hasDuplicate) {
        setDupWarning(data.data.matches);
      } else {
        setDupWarning(null);
      }
    } catch {
      setDupWarning(null);
    }
  };

  // Save Supplier (Create or Edit)
  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim() || !formCity.trim()) return;

    setFormSubmitting(true);
    try {
      const cats = formCategories
        .split(/[,،]/)
        .map((c) => c.trim())
        .filter(Boolean);

      const payload = {
        name: formName.trim(),
        tradeNameEn: formTradeNameEn.trim() || undefined,
        supplierType: formSupplierType,
        country: formCountry === 'أخرى' && formCustomCountry.trim() ? formCustomCountry.trim() : formCountry,
        city: formCity.trim(),
        address: formAddress.trim() || undefined,
        phone: formPhone.trim(),
        whatsapp: formWhatsapp.trim() || undefined,
        wechat: formWechat.trim() || undefined,
        email: formEmail.trim() || undefined,
        businessLicense: formLicense.trim() || undefined,
        categories: cats.length > 0 ? cats : ['توريد عام'],
        paymentTerms: formPaymentTerms.trim() || undefined,
        defaultCurrency: formDefaultCurrency,
        bankName: formBankName.trim() || undefined,
        bankAccountName: formBankAccountName.trim() || undefined,
        bankAccountNumber: formBankAccountNumber.trim() || undefined,
        bankIbanSwift: formBankIbanSwift.trim() || undefined,
        rating: formRating,
        tier: formTier,
        primaryContactName: formContactName.trim() || undefined,
        primaryContactJobTitle: formContactTitle.trim() || undefined,
      };

      let res;
      if (editingSupplier) {
        res = await fetch(`/api/suppliers/${editingSupplier.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/suppliers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!data.success) {
        alert(data.error?.message || 'فشل حفظ بيانات المورد');
        return;
      }

      setShowAddModal(false);
      resetSupplierForm();
      fetchSuppliers();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حفظ المورد');
    } finally {
      setFormSubmitting(false);
    }
  };

  const resetSupplierForm = () => {
    setEditingSupplier(null);
    setFormName('');
    setFormTradeNameEn('');
    setFormSupplierType('manufacturer');
    setFormCountry('الصين');
    setFormCity('فوشان (Foshan)');
    setFormPhone('');
    setFormWhatsapp('');
    setFormWechat('');
    setFormEmail('');
    setFormAddress('');
    setFormCategories('');
    setFormPaymentTerms('T/T 30% Deposit / 70% Before Shipment');
    setFormDefaultCurrency('USD');
    setFormBankName('Bank of China');
    setFormBankAccountName('');
    setFormBankAccountNumber('');
    setFormBankIbanSwift('');
    setFormRating(5);
    setFormTier('A');
    setFormLicense('');
    setFormContactName('');
    setDupWarning(null);
  };

  const openEditModal = (sup: SupplierRecord) => {
    setEditingSupplier(sup);
    setFormName(sup.name);
    setFormTradeNameEn(sup.tradeNameEn || '');
    setFormSupplierType(sup.supplierType || 'manufacturer');
    setFormCountry(sup.country || 'الصين');
    setFormCity(sup.city || '');
    setFormPhone(sup.phone || '');
    setFormWhatsapp(sup.whatsapp || '');
    setFormWechat(sup.wechat || '');
    setFormEmail(sup.email || '');
    setFormAddress(sup.address || '');
    setFormCategories(sup.categories?.join('، ') || '');
    setFormPaymentTerms(sup.paymentTerms || '');
    setFormDefaultCurrency(sup.defaultCurrency || 'USD');
    setFormBankName(sup.bankName || '');
    setFormBankAccountName(sup.bankAccountName || '');
    setFormBankAccountNumber(sup.bankAccountNumber || '');
    setFormBankIbanSwift(sup.bankIbanSwift || '');
    setFormRating(sup.rating || 5);
    setFormTier(sup.tier || 'A');
    setFormLicense(sup.businessLicense || '');
    setShowAddModal(true);
  };

  // Add Contact to Selected Supplier
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !contactName.trim() || !contactPhone.trim()) return;

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          entityType: 'supplier',
          supplierId: selectedSupplier.id,
          name: contactName.trim(),
          jobTitle: contactTitle.trim() || 'مندوب المبيعات',
          phone: contactPhone.trim(),
          wechat: contactWechat.trim() || undefined,
          email: contactEmail.trim() || undefined,
          isPrimary: contactIsPrimary,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddContactModal(false);
        setContactName('');
        setContactTitle('');
        setContactPhone('');
        setContactWechat('');
        setContactEmail('');
        setContactIsPrimary(false);
        loadSupplierDetails(selectedSupplier);
      } else {
        alert(data.error?.message || 'فشل حفظ جهة الاتصال');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Set Primary Contact
  const handleSetPrimaryContact = async (contactId: string) => {
    if (!selectedSupplier) return;
    try {
      const res = await fetch(`/api/contacts/${contactId}/primary`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await res.json();
      if (data.success) {
        loadSupplierDetails(selectedSupplier);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Contact
  const handleDeleteContact = async (contactId: string) => {
    if (!selectedSupplier || !confirm('هل أنت متأكد من حذف جهة الاتصال؟')) return;
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await res.json();
      if (data.success) {
        loadSupplierDetails(selectedSupplier);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Party Document
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !docTitle.trim()) return;

    try {
      const res = await fetch('/api/party-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          entityType: 'supplier',
          supplierId: selectedSupplier.id,
          title: docTitle.trim(),
          documentType: docType,
          documentNumber: docNumber.trim() || undefined,
          fileUrl: docFileUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddDocModal(false);
        setDocTitle('');
        setDocNumber('');
        setDocFileUrl('');
        loadSupplierDetails(selectedSupplier);
      } else {
        alert(data.error?.message || 'فشل حفظ الوثيقة');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Document
  const handleDeleteDocument = async (docId: string) => {
    if (!selectedSupplier || !confirm('هل تريد حذف هذا المستند؟')) return;
    try {
      const res = await fetch(`/api/party-documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await res.json();
      if (data.success) {
        loadSupplierDetails(selectedSupplier);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk Import Handler
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    setBulkStatus('جاري معالجة واستيراد السجلات إلى قاعدة البيانات...');
    try {
      // Parse CSV or JSON
      let items: any[] = [];
      const trimmed = bulkText.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        items = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        // Parse CSV lines
        const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
        const headers = lines[0].split(',').map((h) => h.trim());
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim());
          if (cols.length >= 2) {
            items.push({
              name: cols[0] || `مورد ${i}`,
              phone: cols[1] || '+860000000000',
              country: cols[2] || 'الصين',
              city: cols[3] || 'كوانزو',
              wechat: cols[4] || '',
              supplierType: cols[5] || 'manufacturer',
              tier: cols[6] || 'B',
            });
          }
        }
      }

      const res = await fetch('/api/suppliers/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.success) {
        setBulkStatus(`تم بنجاح استيراد ${data.data.importedCount} مورد من أصل ${data.data.total}`);
        fetchSuppliers();
        setTimeout(() => {
          setShowBulkImportModal(false);
          setBulkStatus(null);
          setBulkText('');
        }, 1500);
      } else {
        setBulkStatus(`فشل الاستيراد: ${data.error?.message || 'خطأ غير معروف'}`);
      }
    } catch (err: any) {
      setBulkStatus(`خطأ في صياغة البيانات: ${err.message}`);
    }
  };

  // Export to CSV
  const handleExportCsv = async () => {
    try {
      const res = await fetch('/api/suppliers/export', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data)) return;

      const headers = ['كود المورد', 'اسم المورد/المصنع', 'الاسم الإنجليزي', 'النوع', 'الدولة', 'المدينة', 'الهاتف', 'وي شات', 'التصنيف', 'التقييم'];
      const rows = data.data.map((s: SupplierRecord) => [
        s.supplierCode,
        `"${s.name.replace(/"/g, '""')}"`,
        `"${(s.tradeNameEn || '').replace(/"/g, '""')}"`,
        s.supplierType,
        s.country,
        s.city,
        s.phone,
        s.wechat || '',
        s.tier,
        s.rating,
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sahla_suppliers_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">سجل الموردين والمصانع العالمية</h1>
              <p className="text-xs text-slate-500">
                منظومة مركزية معتمدة لإدارة شبكة الموردين ومصانع الصين (200+ مورد معتمد) وجهات الاتصال الرسمية
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>استيراد كشف مجمع (CSV)</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير Excel/CSV</span>
          </button>

          <button
            onClick={() => {
              resetSupplierForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مورد / مصنع جديد</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
          {/* Search box */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="بحث بالاسم، كود المورد، وي شات، الهاتف، المدينة..."
              className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Country filter */}
          <div>
            <select
              value={countryFilter}
              onChange={(e) => {
                setCountryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">كافة الدول</option>
              <option value="الصين">الصين (China)</option>
              <option value="الإمارات">الإمارات (UAE)</option>
              <option value="السودان">السودان (Sudan)</option>
              <option value="تركيا">تركيا (Turkey)</option>
            </select>
          </div>

          {/* Supplier Type filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">كافة تصنيفات النشاط</option>
              <option value="manufacturer">مصانع مباشرة (Factories)</option>
              <option value="trading_company">شركات تجارية (Trading)</option>
              <option value="shipping_line">خطوط ملاحية وشحن</option>
              <option value="customs_broker">تخليص جمركي</option>
              <option value="inland_transporter">شاحنات ونقل داخلي</option>
              <option value="warehouse">مستودعات وتخزين</option>
              <option value="inspection_agency">فحص ومعاينة وجودة</option>
            </select>
          </div>

          {/* Tier filter */}
          <div>
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">كافة الفئات (Tiers)</option>
              <option value="A">الفئة A (مورد استراتيجي معتمد)</option>
              <option value="B">الفئة B (مورد موثوق)</option>
              <option value="C">الفئة C (مورد تجريبي)</option>
              <option value="D">الفئة D (ضعيف/غير موصى به)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-3.5">كود المورد</th>
                <th className="py-3 px-3.5">اسم المصنع / الشركة</th>
                <th className="py-3 px-3.5">التصنيف والنشاط</th>
                <th className="py-3 px-3.5">الموقع الجغرافي</th>
                <th className="py-3 px-3.5">قنوات التواصل (WeChat / Phone)</th>
                <th className="py-3 px-3.5">التقييم والفئة</th>
                <th className="py-3 px-3.5">الحالة</th>
                <th className="py-3 px-3.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    جاري تحميل بيانات الموردين من قاعدة البيانات...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    لا توجد سجلات موردين مطابقة لبحثك حالياً. يمكنك إضافة مورد جديد أو استيراد كشف الموردين المعتمد.
                  </td>
                </tr>
              ) : (
                suppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Code */}
                    <td className="py-3 px-3.5 font-mono font-bold text-indigo-700">
                      {sup.supplierCode}
                    </td>

                    {/* Name & Trade Name */}
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{sup.name}</div>
                      {sup.tradeNameEn && (
                        <div className="text-[10px] text-slate-400 font-sans">{sup.tradeNameEn}</div>
                      )}
                    </td>

                    {/* Type & Categories */}
                    <td className="py-3 px-3.5">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[10px]">
                        {SUPPLIER_TYPE_LABELS[sup.supplierType] || sup.supplierType}
                      </span>
                      {sup.categories && sup.categories.length > 0 && (
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-40">
                          {sup.categories.slice(0, 2).join('، ')}
                        </div>
                      )}
                    </td>

                    {/* Country & City */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-1 text-slate-700 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{sup.city}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{sup.country}</div>
                    </td>

                    {/* Communication */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-1 font-mono text-slate-700">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{sup.phone}</span>
                      </div>
                      {sup.wechat && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-mono mt-0.5">
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>WeChat: {sup.wechat}</span>
                        </div>
                      )}
                    </td>

                    {/* Rating & Tier */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            sup.tier === 'A'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sup.tier === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          فئة {sup.tier}
                        </span>
                        <div className="flex items-center text-amber-500">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-[11px] font-bold mr-0.5">{sup.rating}</span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sup.status === 'active' || sup.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : sup.status === 'pending_approval'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {sup.status === 'active'
                          ? 'نشط معتمد'
                          : sup.status === 'verified'
                          ? 'موثق'
                          : sup.status === 'pending_approval'
                          ? 'قيد التدقيق'
                          : 'معطل'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => loadSupplierDetails(sup)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          الملف الكامل
                        </button>
                        <button
                          onClick={() => openEditModal(sup)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                          title="تعديل بيانات المورد"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="p-3 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            إجمالي الموردين: <span className="font-bold text-slate-900 font-mono">{totalCount}</span> مورد | الصفحة{' '}
            <span className="font-bold text-slate-900 font-mono">{currentPage}</span> من{' '}
            <span className="font-bold text-slate-900 font-mono">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
            >
              <option value={15}>15 سجل / صفحة</option>
              <option value={25}>25 سجل / صفحة</option>
              <option value={50}>50 سجل / صفحة</option>
              <option value={100}>100 سجل / صفحة</option>
            </select>

            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SELECTED SUPPLIER PROFILE DRAWER / MODAL
          ========================================================================= */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-right">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-900">{selectedSupplier.name}</h2>
                    <span className="font-mono text-xs px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold">
                      {selectedSupplier.supplierCode}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {selectedSupplier.tradeNameEn || ''} • {selectedSupplier.city}، {selectedSupplier.country}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedSupplier(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="flex border-b border-slate-200 px-4 bg-white">
              <button
                onClick={() => setProfileTab('overview')}
                className={`py-3 px-4 font-bold text-xs border-b-2 transition-colors cursor-pointer ${
                  profileTab === 'overview'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                بيانات المصنع والحسابات المالية
              </button>
              <button
                onClick={() => setProfileTab('contacts')}
                className={`py-3 px-4 font-bold text-xs border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  profileTab === 'contacts'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>جهات الاتصال الرسمية</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                  {profileContacts.length}
                </span>
              </button>
              <button
                onClick={() => setProfileTab('documents')}
                className={`py-3 px-4 font-bold text-xs border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  profileTab === 'documents'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>الوثائق ورخصة الأعمال (KYC)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                  {profileDocs.length}
                </span>
              </button>
            </div>

            {/* Content Area */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {profileTab === 'overview' && (
                <div className="space-y-4">
                  {/* General Specs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-[11px] text-slate-500">نوع الكيان التجاري</div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {SUPPLIER_TYPE_LABELS[selectedSupplier.supplierType] || selectedSupplier.supplierType}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-[11px] text-slate-500">شروط الدفع المتفق عليها</div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {selectedSupplier.paymentTerms || 'T/T 30% Deposit / 70% Before Shipment'}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-[11px] text-slate-500">عملة التسعير المعتمدة</div>
                      <div className="font-bold text-slate-900 mt-0.5">{selectedSupplier.defaultCurrency}</div>
                    </div>
                  </div>

                  {/* Contact Channels */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                    <h3 className="font-bold text-xs text-slate-900">قنوات التواصل المباشرة مع المصنع</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">الهاتف الرئيسي:</span>
                        <span className="font-bold text-slate-800 font-mono">{selectedSupplier.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">معرّف وي شات (WeChat):</span>
                        <span className="font-bold text-emerald-700 font-mono">
                          {selectedSupplier.wechat || 'غير مسجل'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">البريد الإلكتروني:</span>
                        <span className="font-bold text-slate-800 font-mono">{selectedSupplier.email || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details (Crucial for China Telegraphic Transfer) */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        <span>بيانات الحساب البنكي لتحويلات T/T و L/C</span>
                      </h3>
                      <span className="text-[10px] text-slate-500">معتمد في خطابات الاعتماد</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">اسم البنك:</span>
                        <span className="font-bold text-slate-800">{selectedSupplier.bankName || 'Bank of China'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">اسم المستفيد (Beneficiary):</span>
                        <span className="font-bold text-slate-800">
                          {selectedSupplier.bankAccountName || selectedSupplier.tradeNameEn || selectedSupplier.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">رقم الحساب البنكي:</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {selectedSupplier.bankAccountNumber || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">كود السويفت / الآيبان (SWIFT):</span>
                        <span className="font-bold text-slate-800 font-mono">{selectedSupplier.bankIbanSwift || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {profileTab === 'contacts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      جهات الاتصال المعتمدة لدى هذا المورد (مدير التصدير، مسؤول الجودة، المحاسب)
                    </p>
                    <button
                      onClick={() => setShowAddContactModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة جهة اتصال</span>
                    </button>
                  </div>

                  {profileContacts.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                      لا توجد جهات اتصال إضافية مسجلة. يمكنك إضافة جهات اتصال جديدة.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {profileContacts.map((c) => (
                        <div
                          key={c.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            c.isPrimary
                              ? 'border-indigo-300 bg-indigo-50/40'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-900">{c.name}</span>
                                {c.isPrimary && (
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-bold">
                                    رئيسي
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">{c.jobTitle || 'مندوب تجاري'}</div>
                            </div>

                            <div className="flex items-center gap-1">
                              {!c.isPrimary && (
                                <button
                                  onClick={() => handleSetPrimaryContact(c.id)}
                                  className="text-[10px] text-indigo-700 hover:underline px-1.5 py-0.5 rounded cursor-pointer"
                                >
                                  تعيين كرئيسي
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteContact(c.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-mono text-slate-700">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{c.phone}</span>
                            </div>
                            {c.wechat && (
                              <div className="flex items-center gap-1.5 font-mono text-emerald-700">
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                                <span>WeChat: {c.wechat}</span>
                              </div>
                            )}
                            {c.email && (
                              <div className="flex items-center gap-1.5 font-mono text-slate-600">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{c.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {profileTab === 'documents' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      مستندات التوثيق ورخص الأعمال الصينية وشهادات الجودة (KYC)
                    </p>
                    <button
                      onClick={() => setShowAddDocModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة وثيقة</span>
                    </button>
                  </div>

                  {profileDocs.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                      لا توجد وثائق مرفوعة لهذا المورد بعد.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {profileDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            <div>
                              <div className="font-bold text-slate-900">{doc.title}</div>
                              <div className="text-[10px] text-slate-400">
                                {doc.documentType} {doc.documentNumber ? `• رقم: ${doc.documentNumber}` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {doc.fileUrl && (
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                              >
                                معاينة
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD / EDIT SUPPLIER MODAL
          ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl my-6 flex flex-col shadow-2xl border border-slate-200 text-right overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h2 className="text-base font-black text-slate-900">
                {editingSupplier ? 'تعديل بيانات المورد / المصنع' : 'تسجيل مورد / مصنع عالمي جديد'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSupplier} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {dupWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>تنبيه: يوجد مورد مسجل مسبقاً بنفس الهاتف أو الاسم:</span>
                  </div>
                  {dupWarning.map((m) => (
                    <div key={m.id} className="text-[11px]">
                      • [{m.supplierCode}] {m.name} - {m.phone} ({m.city})
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المصنع / المورد (بالعربية أو الأصل) *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    onBlur={handleCheckDuplicates}
                    placeholder="مثال: مصنع فوشان للسيراميك"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الاسم التجاري بالإنجليزية (Trade Name)</label>
                  <input
                    type="text"
                    value={formTradeNameEn}
                    onChange={(e) => setFormTradeNameEn(e.target.value)}
                    placeholder="e.g. Foshan Ceramics Co., Ltd"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تصنيف النشاط والخدمة *</label>
                  <select
                    value={formSupplierType}
                    onChange={(e) => setFormSupplierType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="manufacturer">مصنع مباشر (Direct Factory)</option>
                    <option value="trading_company">شركة تجارية وتصدير (Trading Co)</option>
                    <option value="shipping_line">خط ملاحي ووكيل شحن بحري</option>
                    <option value="customs_broker">مخلص جمركي</option>
                    <option value="inland_transporter">شركة نقل داخلي وشاحنات</option>
                    <option value="warehouse">مستودع وتخزين</option>
                    <option value="inspection_agency">مكتب فحص ومعاينة وجودة</option>
                    <option value="packaging">تغليف وتعبئة</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الدولة / بلد المصنع *</label>
                  <select
                    value={formCountry}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormCountry(val);
                      if (val === 'الصين') setFormCity('كوانزو (Guangzhou)');
                      else if (val === 'الإمارات') setFormCity('دبي (Dubai)');
                      else if (val === 'تركيا') setFormCity('إسطنبول (Istanbul)');
                      else if (val === 'السعودية') setFormCity('الرياض (Riyadh)');
                      else if (val === 'مصر') setFormCity('القاهرة (Cairo)');
                      else if (val === 'الهند') setFormCity('مومباي (Mumbai)');
                      else if (val === 'فيتنام') setFormCity('هانوي (Hanoi)');
                      else if (val === 'ألمانيا') setFormCity('فرانكفورت (Frankfurt)');
                      else if (val === 'إيطاليا') setFormCity('ميلانو (Milano)');
                      else if (val === 'الولايات المتحدة') setFormCity('نيويورك (New York)');
                      else if (val === 'المملكة المتحدة') setFormCity('لندن (London)');
                      else if (val === 'السودان') setFormCity('بورتسودان (Port Sudan)');
                      else setFormCity('');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="الصين">الصين (China)</option>
                    <option value="الإمارات">الإمارات (UAE)</option>
                    <option value="تركيا">تركيا (Turkey)</option>
                    <option value="السعودية">السعودية (KSA)</option>
                    <option value="مصر">مصر (Egypt)</option>
                    <option value="الهند">الهند (India)</option>
                    <option value="فيتنام">فيتنام (Vietnam)</option>
                    <option value="ألمانيا">ألمانيا (Germany)</option>
                    <option value="إيطاليا">إيطاليا (Italy)</option>
                    <option value="الولايات المتحدة">الولايات المتحدة (USA)</option>
                    <option value="المملكة المتحدة">المملكة المتحدة (UK)</option>
                    <option value="السودان">السودان (Sudan)</option>
                    <option value="أخرى">دولة أخرى (International Factory)</option>
                  </select>
                  {formCountry === 'أخرى' && (
                    <div className="mt-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم الدولة / البلد: *</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: البرازيل، ماليزيا، إسبانيا، بولندا..."
                        value={formCustomCountry}
                        onChange={(e) => setFormCustomCountry(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-indigo-300 bg-indigo-50/40 text-xs font-bold"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المدينة والمنطقة الصناعية *</label>
                  <input
                    type="text"
                    required
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="مثال: فوشان، كوانزو، دبي، إسطنبول، مومباي..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف الدولي الرئيسي *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    onBlur={handleCheckDuplicates}
                    placeholder="+86 138 0000 0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">معرّف وي شات (WeChat ID - أساسي للصين)</label>
                  <input
                    type="text"
                    value={formWechat}
                    onChange={(e) => setFormWechat(e.target.value)}
                    placeholder="e.g. factory_export_mgr"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني الرسمي</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="sales@factory.cn"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">المنتجات والتخصصات (مفصولة بفواصل)</label>
                  <input
                    type="text"
                    value={formCategories}
                    onChange={(e) => setFormCategories(e.target.value)}
                    placeholder="مثال: بلاط، سيراميك، أدوات صحية، مغاسل"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">فئة المورد (Tier)</label>
                  <select
                    value={formTier}
                    onChange={(e) => setFormTier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="A">الفئة A (مورد استراتيجي معتمد)</option>
                    <option value="B">الفئة B (مورد موثوق)</option>
                    <option value="C">الفئة C (مورد تجريبي)</option>
                    <option value="D">الفئة D (ضعيف / غير موصى به)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">التقييم (1 إلى 5 نجوم)</label>
                  <select
                    value={formRating}
                    onChange={(e) => setFormRating(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 نجوم - ممتاز)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 نجوم - جيد جداً)</option>
                    <option value={3}>⭐⭐⭐ (3 نجوم - جيد)</option>
                    <option value={2}>⭐⭐ (نجمتان - مقبول)</option>
                    <option value={1}>⭐ (نجمة واحدة - ضعيف)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم البنك</label>
                  <input
                    type="text"
                    value={formBankName}
                    onChange={(e) => setFormBankName(e.target.value)}
                    placeholder="Bank of China"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الحساب البنكي / الآيبان</label>
                  <input
                    type="text"
                    value={formBankAccountNumber}
                    onChange={(e) => setFormBankAccountNumber(e.target.value)}
                    placeholder="Bank Account Number / SWIFT"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {!editingSupplier && (
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-2">بيانات جهة الاتصال الرئيسية بالمصنع</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">اسم المسؤول</label>
                      <input
                        type="text"
                        value={formContactName}
                        onChange={(e) => setFormContactName(e.target.value)}
                        placeholder="Mr. Zhang / مدير المبيعات"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">المسمى الوظيفي</label>
                      <input
                        type="text"
                        value={formContactTitle}
                        onChange={(e) => setFormContactTitle(e.target.value)}
                        placeholder="Export Manager"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50 cursor-pointer"
                >
                  {formSubmitting ? 'جاري الحفظ...' : editingSupplier ? 'تحديث البيانات' : 'حفظ وتسجيل المورد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD CONTACT MODAL
          ========================================================================= */}
      {showAddContactModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl border border-slate-200 text-right space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">إضافة جهة اتصال لـ [{selectedSupplier.name}]</h3>
              <button onClick={() => setShowAddContactModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم جهة الاتصال *</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="مثال: Mr. David Lin"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المسمى الوظيفي</label>
                <input
                  type="text"
                  value={contactTitle}
                  onChange={(e) => setContactTitle(e.target.value)}
                  placeholder="Sales Director / Export Specialist"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهاتف *</label>
                <input
                  type="text"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+86 138 0000 0000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">معرّف وي شات (WeChat)</label>
                <input
                  type="text"
                  value={contactWechat}
                  onChange={(e) => setContactWechat(e.target.value)}
                  placeholder="wechat_id"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="david@factory.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="primaryContactCheck"
                  checked={contactIsPrimary}
                  onChange={(e) => setContactIsPrimary(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="primaryContactCheck" className="text-slate-700 font-bold">
                  تعيين كجهة اتصال رئيسية للمورد
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600"
                >
                  إلغاء
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold">
                  حفظ جهة الاتصال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD DOCUMENT MODAL
          ========================================================================= */}
      {showAddDocModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl border border-slate-200 text-right space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">إضافة وثيقة / ترخيص للمورد</h3>
              <button onClick={() => setShowAddDocModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان الوثيقة *</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="مثال: رخصة الأعمال الصينية (Business License)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع المستند</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="business_license">رخصة تجارية / سجل مصنع</option>
                  <option value="tax_certificate">شهادة ضريبية</option>
                  <option value="contract">عقد توريد معتمد</option>
                  <option value="iso_cert">شهادة جودة / ISO</option>
                  <option value="test_report">تقرير فحص ومعاينة</option>
                  <option value="catalog">كتالوج المنتجات</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الترخيص / المستند</label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="91440600MA54D1234X"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رابط الملف / التخزين</label>
                <input
                  type="text"
                  value={docFileUrl}
                  onChange={(e) => setDocFileUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600"
                >
                  إلغاء
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold">
                  حفظ الوثيقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          BULK IMPORT MODAL (200+ SUPPLIERS READY)
          ========================================================================= */}
      {showBulkImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-xl p-5 shadow-2xl border border-slate-200 text-right space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">استيراد دفعة مجمعة من الموردين (CSV / JSON)</h3>
                <p className="text-[11px] text-slate-500">
                  جاهز لاستيعاب واستيراد مئات الموردين دفعة واحدة مع التحقق من عدم التكرار
                </p>
              </div>
              <button onClick={() => setShowBulkImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  الصق أسطر CSV أو كائن JSON هنا (الاسم، الهاتف، الدولة، المدينة، وي شات):
                </label>
                <textarea
                  rows={8}
                  required
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`اسم المورد,رقم الهاتف,الدولة,المدينة,وي شات,النوع,الفئة
Foshan Ceramic Factory,+8613800112233,الصين,فوشان,foshan_ceramics,manufacturer,A
Shenzhen Electronics Co,+8613900223344,الصين,شنزن,sz_export,trading_company,B`}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                />
              </div>

              {bulkStatus && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 font-bold text-xs">
                  {bulkStatus}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    const sample = `اسم المورد,رقم الهاتف,الدولة,المدينة,وي شات,النوع,الفئة\nGuangzhou Lighting Co,+8613800110001,الصين,كوانزو,gz_light,manufacturer,A\nYiwu Wholesale Center,+8613800110002,الصين,ييوو,yiwu_trader,trading_company,B`;
                    setBulkText(sample);
                  }}
                  className="text-xs text-indigo-700 hover:underline cursor-pointer"
                >
                  ملء نموذج تجريبي
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkImportModal(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600"
                  >
                    إلغاء
                  </button>
                  <button type="submit" className="px-5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer">
                    بدء الاستيراد
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
