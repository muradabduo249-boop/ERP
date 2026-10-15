import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Receipt,
  FileText,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Wallet,
  ShieldCheck,
  ShieldAlert,
  Printer,
  Download,
  Percent,
  Search,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  X,
  FileSpreadsheet,
  ArrowRightLeft,
  Scale,
  Calendar,
  Layers,
  Send,
  Eye,
  Check,
  Ban,
} from 'lucide-react';
import { useErpAuth } from '../../context/ErpAuthContext';
import { ErpDocumentPrintModal, PrintableDocType } from '../../components/ErpDocumentPrintModal';
import { ErpWhatsAppModal } from '../../components/ErpWhatsAppModal';
import { exportToCsv } from '../../../lib/exportUtils';

type FinanceSubTab =
  | 'treasury'
  | 'payments'
  | 'receipts'
  | 'supplier_invoices'
  | 'customer_invoices'
  | 'ledger'
  | 'reconciliations'
  | 'exchange_rates'
  | 'profitability';

export const FinanceView: React.FC = () => {
  const { currentUser, refreshData } = useErpAuth();
  const [activeSubTab, setActiveSubTab] = useState<FinanceSubTab>('treasury');

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Live Database States
  const [treasuryAccounts, setTreasuryAccounts] = useState<any[]>([]);
  const [paymentVouchers, setPaymentVouchers] = useState<any[]>([]);
  const [receiptVouchers, setReceiptVouchers] = useState<any[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<any[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);

  // Modals
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);
  const [showNewReceiptModal, setShowNewReceiptModal] = useState(false);
  const [showNewSupplierInvoiceModal, setShowNewSupplierInvoiceModal] = useState(false);
  const [showNewCustomerInvoiceModal, setShowNewCustomerInvoiceModal] = useState(false);
  const [showNewRateModal, setShowNewRateModal] = useState(false);

  // Print & WhatsApp Modals
  const [printableDoc, setPrintableDoc] = useState<{ type: PrintableDocType; data: any } | null>(null);
  const [whatsappModalData, setWhatsappModalData] = useState<{
    data: any;
    phone: string;
    type: any;
  } | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTreasuryFilter, setSelectedTreasuryFilter] = useState('all');

  // ----------------------------------------------------
  // FORM STATES
  // ----------------------------------------------------
  // Treasury Account Form
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<'cash' | 'bank'>('bank');
  const [accCurrency, setAccCurrency] = useState('USD');
  const [accNumber, setAccNumber] = useState('');
  const [accBankName, setAccBankName] = useState('');
  const [accInitialBal, setAccInitialBal] = useState('0');
  const [accNotes, setAccNotes] = useState('');

  // Transfer Form
  const [trFromId, setTrFromId] = useState('');
  const [trToId, setTrToId] = useState('');
  const [trAmount, setTrAmount] = useState('1000');
  const [trRate, setTrRate] = useState('1.000000');
  const [trNotes, setTrNotes] = useState('');

  // Reconcile Form
  const [reconAccountId, setReconAccountId] = useState('');
  const [reconActualBal, setReconActualBal] = useState('0');
  const [reconNotes, setReconNotes] = useState('');

  // Payment Voucher Form (سند صرف)
  const [pvTreasuryId, setPvTreasuryId] = useState('');
  const [pvSupplierId, setPvSupplierId] = useState('');
  const [pvSupplierInvoiceId, setPvSupplierInvoiceId] = useState('');
  const [pvAmount, setPvAmount] = useState('500');
  const [pvCurrency, setPvCurrency] = useState('USD');
  const [pvRate, setPvRate] = useState('1.000000');
  const [pvMethod, setPvMethod] = useState<'cash' | 'bank_transfer' | 'cheque'>('bank_transfer');
  const [pvRefDoc, setPvRefDoc] = useState('');
  const [pvNotes, setPvNotes] = useState('');

  // Receipt Voucher Form (سند قبض)
  const [rvTreasuryId, setRvTreasuryId] = useState('');
  const [rvCustomerId, setRvCustomerId] = useState('');
  const [rvCustomerInvoiceId, setRvCustomerInvoiceId] = useState('');
  const [rvAmount, setRvAmount] = useState('1000');
  const [rvCurrency, setRvCurrency] = useState('USD');
  const [rvRate, setRvRate] = useState('1.000000');
  const [rvMethod, setRvMethod] = useState<'cash' | 'bank_transfer' | 'cheque'>('bank_transfer');
  const [rvRefDoc, setRvRefDoc] = useState('');
  const [rvNotes, setRvNotes] = useState('');

  // Supplier Invoice Form
  const [siSupplierId, setSiSupplierId] = useState('');
  const [siPurchaseOrderId, setSiPurchaseOrderId] = useState('');
  const [siInvoiceNumber, setSiInvoiceNumber] = useState('');
  const [siSubtotal, setSiSubtotal] = useState('1000');
  const [siTaxAmount, setSiTaxAmount] = useState('0');
  const [siCurrency, setSiCurrency] = useState('USD');
  const [siDueDate, setSiDueDate] = useState('');
  const [siNotes, setSiNotes] = useState('');

  // Customer Invoice Form
  const [ciCustomerId, setCiCustomerId] = useState('');
  const [ciCurrency, setCiCurrency] = useState('USD');
  const [ciDueDate, setCiDueDate] = useState('');
  const [ciPaymentTerms, setCiPaymentTerms] = useState('دفع عند الاستلام (COD)');
  const [ciNotes, setCiNotes] = useState('');
  const [ciItems, setCiItems] = useState([
    { description: 'تكلفة مشتريات وتوريد بضائع من الصين', quantity: 1, unitPrice: 2500 },
    { description: 'نولون شحن بحري وتخليص ميناء بورتسودان', quantity: 1, unitPrice: 750 },
  ]);

  // Rate Form
  const [rateBase, setRateBase] = useState('USD');
  const [rateTarget, setRateTarget] = useState('SDG');
  const [rateValue, setRateValue] = useState('2650.000000');

  // ----------------------------------------------------
  // DATA FETCHING
  // ----------------------------------------------------
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const [
        accountsRes,
        pvRes,
        rvRes,
        siRes,
        ciRes,
        txRes,
        reconRes,
        ratesRes,
        supRes,
        custRes,
        posRes,
      ] = await Promise.all([
        fetch('/api/finance/treasury/accounts', { credentials: 'include' }),
        fetch('/api/finance/payment-vouchers', { credentials: 'include' }),
        fetch('/api/finance/receipt-vouchers', { credentials: 'include' }),
        fetch('/api/finance/supplier-invoices', { credentials: 'include' }),
        fetch('/api/finance/customer-invoices', { credentials: 'include' }),
        fetch('/api/finance/treasury/transactions', { credentials: 'include' }),
        fetch('/api/finance/treasury/reconciliations', { credentials: 'include' }),
        fetch('/api/finance/exchange-rates', { credentials: 'include' }),
        fetch('/api/suppliers', { credentials: 'include' }),
        fetch('/api/customers', { credentials: 'include' }),
        fetch('/api/procurement/pos', { credentials: 'include' }),
      ]);

      const [
        accountsData,
        pvData,
        rvData,
        siData,
        ciData,
        txData,
        reconData,
        ratesData,
        supData,
        custData,
        posData,
      ] = await Promise.all([
        accountsRes.json(),
        pvRes.json(),
        rvRes.json(),
        siRes.json(),
        ciRes.json(),
        txRes.json(),
        reconRes.json(),
        ratesRes.json(),
        supRes.json(),
        custRes.json(),
        posRes.json(),
      ]);

      if (accountsData.success) {
        setTreasuryAccounts(accountsData.data || []);
        if (accountsData.data?.length > 0 && !pvTreasuryId) {
          setPvTreasuryId(accountsData.data[0].id);
          setRvTreasuryId(accountsData.data[0].id);
          setTrFromId(accountsData.data[0].id);
          if (accountsData.data.length > 1) {
            setTrToId(accountsData.data[1].id);
          }
          setReconAccountId(accountsData.data[0].id);
          setReconActualBal(accountsData.data[0].balance);
        }
      }
      if (pvData.success) setPaymentVouchers(pvData.data || []);
      if (rvData.success) setReceiptVouchers(rvData.data || []);
      if (siData.success) setSupplierInvoices(siData.data || []);
      if (ciData.success) setCustomerInvoices(ciData.data || []);
      if (txData.success) setTransactions(txData.data || []);
      if (reconData.success) setReconciliations(reconData.data || []);
      if (ratesData.success) setExchangeRates(ratesData.data || []);
      if (supData.success) {
        setSuppliers(supData.data?.suppliers || supData.data || []);
        if (supData.data?.length > 0 && !pvSupplierId) {
          setPvSupplierId(supData.data[0].id);
          setSiSupplierId(supData.data[0].id);
        }
      }
      if (custData.success) {
        setCustomers(custData.data?.customers || custData.data || []);
        if (custData.data?.length > 0 && !rvCustomerId) {
          setRvCustomerId(custData.data[0].id);
          setCiCustomerId(custData.data[0].id);
        }
      }
      if (posData.success) setPurchaseOrders(posData.data || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل في جلب البيانات المالية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const triggerToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // ----------------------------------------------------
  // ACTIONS & SUBMISSIONS
  // ----------------------------------------------------

  // Create Treasury Account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/finance/treasury/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: accName,
          type: accType,
          currency: accCurrency,
          accountNumber: accNumber,
          bankName: accBankName,
          initialBalance: parseFloat(accInitialBal) || 0,
          notes: accNotes,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'فشل في إنشاء الحساب');

      setShowNewAccountModal(false);
      setAccName('');
      setAccNumber('');
      setAccBankName('');
      setAccInitialBal('0');
      triggerToast('تم إنشاء حساب الخزينة بنجاح');
      fetchAllData();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Transfer Funds
  const handleTransferFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trFromId === trToId) {
      alert('لا يمكن التحويل لنفس الحساب');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/finance/treasury/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fromAccountId: trFromId,
          toAccountId: trToId,
          amount: parseFloat(trAmount) || 0,
          exchangeRate: parseFloat(trRate) || 1.0,
          notes: trNotes,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'فشل في تنفيذ التحويل');

      setShowTransferModal(false);
      setTrNotes('');
      triggerToast('تم إجراء التحويل الذري بين الخزائن وتسجيل القيد في السجل المالي بنجاح');
      fetchAllData();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Reconcile Account
  const handleCreateReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/finance/treasury/reconciliations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          accountId: reconAccountId,
          reconciledBalance: parseFloat(reconActualBal) || 0,
          notes: reconNotes,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'فشل في تسجيل طلب التسوية');

      setShowReconcileModal(false);
      setReconNotes('');
      triggerToast('تم تسجيل طلب المطابقة بنجاح بانتظار الاعتماد الإداري');
      fetchAllData();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Approve Reconciliation
  const handleApproveReconciliation = async (id: string, approved: boolean) => {
    try {
      setLoading(true);
      const notes = prompt(approved ? 'ملاحظات الاعتماد (اختياري):' : 'سبب الرفض:');
      if (notes === null && !approved) return;

      const res = await fetch(`/api/finance/treasury/reconciliations/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ approved, notes: notes || undefined }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'فشل في معالجة طلب التسوية');

      triggerToast(approved ? 'تم اعتماد التسوية وتحديث رصيد الخزينة بنجاح' : 'تم رفض طلب التسوية');
      fetchAllData();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create Payment Voucher (سند صرف)
  const handleCreatePaymentVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/finance/payment-vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          treasuryAccountId: pvTreasuryId,
          supplierId: pvSupplierId,
          supplierInvoiceId: pvSupplierInvoiceId || undefined,
          amount: parseFloat(pvAmount) || 0,
          currency: pvCurrency,
          exchangeRate: parseFloat(pvRate) || 1.0,
          paymentMethod: pvMethod,
          referenceDoc: pvRefDoc,
          notes: pvNotes,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'فشل في إنشاء سند الصرف');

      setShowNewPaymentModal(false);
      setPvRefDoc('');
      setPvNotes('');
      triggerToast('تم إنشاء مسودة سند الصرف بنجاح (يلزم الاعتماد بالرقابة الثنائية قبل الترحيل)');
      fetchAllData();
    } catch (err: any) {
      alert(`خطأ في إنشاء سند الصرف: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Approve Payment Voucher (اعتماد سند الصرف مع الرقابة الثنائية)
  const handleApprovePaymentVoucher = async (voucher: any) => {
    // Client-side check before API call
    if (voucher.requestedBy === currentUser.id) {
      alert(
        'مخالفة ضوابط الرقابة الثنائية (Dual Control):\nلا يجوز لمُنشئ سند الصرف اعتماده بنفسه إطلاقاً، حتى لو كان مديراً عاماً (super_admin).\nيجب أن يعتمده محاسب أو مسؤول مالي آخر.'
      );
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/finance/payment-vouchers/${voucher.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'فشل في اعتماد السند');

      triggerToast(`تم اعتماد سند الصرف ${voucher.voucherNumber} بنجاح، وهو جاهز للترحيل المالي`);
      fetchAllData();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Post Payment Voucher (ترحيل وخصم من الخزينة)
  const handlePostPaymentVoucher = async (voucher: any) => {
    if (!confirm(`هل أنت متأكد من ترحيل سند الصرف ${voucher.voucherNumber} وخصم المبلغ من الخزينة؟ القيد المالي سيكون محمياً وغير قابل للحذف.`)) {
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/finance/payment-vouchers/${voucher.id}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'فشل في ترحيل السند');

      triggerToast(`تم ترحيل سند الصرف ${voucher.voucherNumber} وخصم المبلغ من الخزينة بنجاح`);
      fetchAllData();
    } catch (err: any) {
      alert(`خطأ في الترحيل: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create Receipt Voucher (سند قبض)
  const handleCreateReceiptVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/finance/receipt-vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          treasuryAccountId: rvTreasuryId,
          customerId: rvCustomerId,
          customerInvoiceId: rvCustomerInvoiceId || undefined,
          amount: parseFloat(rvAmount) || 0,
          currency: rvCurrency,
          exchangeRate: parseFloat(rvRate) || 1.0,
          paymentMethod: rvMethod,
          referenceDoc: rvRefDoc,
          notes: rvNotes,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'فشل في تسجيل سند القبض');

      setShowNewReceiptModal(false);
      setRvRefDoc('');
      setRvNotes('');
      triggerToast('تم تسجيل وترحيل سند القبض وتحديث رصيد الخزينة فورياً');
      fetchAllData();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create Supplier Invoice
  const handleCreateSupplierInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/finance/supplier-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          supplierId: siSupplierId,
          purchaseOrderId: siPurchaseOrderId || undefined,
          invoiceNumber: siInvoiceNumber || undefined,
          subtotal: parseFloat(siSubtotal) || 0,
          taxAmount: parseFloat(siTaxAmount) || 0,
          currency: siCurrency,
          dueDate: siDueDate || undefined,
          notes: siNotes,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'فشل في تسجيل فاتورة المورد');

      setShowNewSupplierInvoiceModal(false);
      setSiInvoiceNumber('');
      setSiNotes('');
      triggerToast('تم تسجيل فاتورة المورد بنجاح');
      fetchAllData();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create Customer Invoice
  const handleCreateCustomerInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/finance/customer-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          customerId: ciCustomerId,
          currency: ciCurrency,
          dueDate: ciDueDate || undefined,
          paymentTerms: ciPaymentTerms,
          notes: ciNotes,
          items: ciItems,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'فشل في إصدار فاتورة العميل');

      setShowNewCustomerInvoiceModal(false);
      setCiNotes('');
      triggerToast('تم إصدار فاتورة العميل بنجاح');
      fetchAllData();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Set Exchange Rate
  const handleSetExchangeRate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/finance/exchange-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          baseCurrency: rateBase,
          targetCurrency: rateTarget,
          rate: parseFloat(rateValue) || 1.0,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'فشل في تحديث سعر الصرف');

      setShowNewRateModal(false);
      triggerToast(`تم تحديث سعر صرف الزوج ${rateBase}/${rateTarget} بنجاح`);
      fetchAllData();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // TOTALS & KPIS
  // ----------------------------------------------------
  const totalTreasuryUSD = treasuryAccounts.reduce((acc, a) => {
    const bal = parseFloat(a.balance) || 0;
    if (a.currency === 'USD') return acc + bal;
    if (a.currency === 'SDG') return acc + bal / 2650;
    if (a.currency === 'AED') return acc + bal / 3.6725;
    if (a.currency === 'CNY') return acc + bal / 7.23;
    if (a.currency === 'SAR') return acc + bal / 3.75;
    return acc + bal;
  }, 0);

  const totalReceiptsUSD = receiptVouchers.reduce((acc, r) => {
    const amt = parseFloat(r.amount) || 0;
    if (r.currency === 'USD') return acc + amt;
    if (r.currency === 'SDG') return acc + amt / 2650;
    return acc + amt;
  }, 0);

  const totalPaymentsUSD = paymentVouchers
    .filter((p) => p.status === 'posted')
    .reduce((acc, p) => {
      const amt = parseFloat(p.amount) || 0;
      if (p.currency === 'USD') return acc + amt;
      if (p.currency === 'SDG') return acc + amt / 2650;
      return acc + amt;
    }, 0);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Toast Notification */}
      {successMessage && (
        <div className="fixed top-5 left-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                الإدارة المالية والخزينة ومطابقات الحسابات
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                سندات الصرف والقبض، مطابقة بنكك والنقد الأجنبي، الخزائن المتعددة، والرقابة الثنائية الصارمة
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowNewPaymentModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>سند صرف جديد</span>
          </button>

          <button
            onClick={() => setShowNewReceiptModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>سند قبض جديد</span>
          </button>

          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>تحويل خزائن</span>
          </button>

          <button
            onClick={fetchAllData}
            title="تحديث البيانات"
            className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Financial Health KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">إجمالي سيولة الخزائن (تقديري)</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              ${totalTreasuryUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
              USD Equiv.
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            عبر {treasuryAccounts.length} حسابات وخزائن نقدية
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">إجمالي التحصيلات (سندات القبض)</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-600">
              ${totalReceiptsUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
              {receiptVouchers.length} سند
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            تحصيلات بنكك والنقد الأجنبي
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">إجمالي الصرف والمدفوعات</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-rose-600">
              ${totalPaymentsUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-medium">
              مرحلة
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {paymentVouchers.filter((p) => p.status === 'draft').length} سندات بانتظار الاعتماد
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">فواتير الموردين غير المسددة</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold font-mono text-amber-600">
              {supplierInvoices.filter((s) => s.status !== 'paid').length}
            </span>
            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
              مستحقة
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            تخضع لرقابة منع الصرف الزائد
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveSubTab('treasury')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'treasury'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>الخزائن والحسابات ({treasuryAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('payments')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'payments'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>سندات الصرف ({paymentVouchers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('receipts')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'receipts'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>سندات القبض ({receiptVouchers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('supplier_invoices')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'supplier_invoices'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>فواتير الموردين ({supplierInvoices.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('customer_invoices')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'customer_invoices'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>فواتير العملاء ({customerInvoices.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ledger')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'ledger'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>سجل الخزينة المحمي ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reconciliations')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'reconciliations'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>مطابقات وتسويات ({reconciliations.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('exchange_rates')}
          className={`flex items-center gap-1.5 px-4 py-2.5 font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'exchange_rates'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>أسعار الصرف ({exchangeRates.length})</span>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. TREASURY ACCOUNTS TAB */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'treasury' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">حسابات الخزائن والبنوك المعتمدة</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReconcileModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>تسوية مطابقة رصيد</span>
              </button>
              <button
                onClick={() => setShowNewAccountModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة حساب خزينة</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {treasuryAccounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {acc.accountCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        acc.type === 'cash'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {acc.type === 'cash' ? 'خزينة نقدية (Cash)' : 'حساب بنكي (Bank)'}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mt-2">{acc.name}</h4>
                  {acc.bankName && (
                    <p className="text-xs text-slate-500 mt-0.5">{acc.bankName}</p>
                  )}
                  {acc.accountNumber && (
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      رقم الحساب: {acc.accountNumber}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">الرصيد الدفتري الحالي</span>
                    <span className="text-xl font-black font-mono text-emerald-600">
                      {parseFloat(acc.balance).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      <span className="text-xs font-sans text-slate-700">{acc.currency}</span>
                    </span>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                      acc.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {acc.status === 'active' ? 'نشط' : 'مجمد'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. PAYMENT VOUCHERS (سندات الصرف) TAB */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                سندات الصرف للموردين ومصانع الصين والجمارك
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تطبيق مبدأ الرقابة الثنائية: لا يمكن لمنشئ السند اعتماده، ويتم الخصم الذري من الخزينة عند الترحيل فقط
              </p>
            </div>
            <button
              onClick={() => setShowNewPaymentModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إصدار سند صرف</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">رقم السند</th>
                    <th className="py-3 px-4">المستفيد (المورد / الجهة)</th>
                    <th className="py-3 px-4">حساب الخزينة المسحوب منه</th>
                    <th className="py-3 px-4">المبلغ والعملة</th>
                    <th className="py-3 px-4">طريقة الدفع والمرجع</th>
                    <th className="py-3 px-4">الحالة والرقابة الثنائية</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paymentVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        لا توجد سندات صرف مسجلة حالياً
                      </td>
                    </tr>
                  ) : (
                    paymentVouchers.map((pv) => {
                      const isCreator = pv.requestedBy === currentUser.id;
                      return (
                        <tr key={pv.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-rose-700">
                            {pv.voucherNumber}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{pv.supplierName}</div>
                            {pv.invoiceNumber && (
                              <div className="text-[11px] text-slate-500 font-mono">
                                فاتورة: {pv.invoiceNumber}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-800 font-medium">{pv.treasuryName}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              ({pv.treasuryCurrency})
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {parseFloat(pv.amount).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            {pv.currency}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-800">
                              {pv.paymentMethod === 'bank_transfer'
                                ? 'تحويل بنكي'
                                : pv.paymentMethod === 'cash'
                                ? 'نقداً (كاش)'
                                : 'شيك مصرفي'}
                            </span>
                            {pv.referenceDoc && (
                              <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                                مرجع: {pv.referenceDoc}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  pv.status === 'posted'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : pv.status === 'approved'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {pv.status === 'posted'
                                  ? 'مرحل ومخصوم من الخزينة'
                                  : pv.status === 'approved'
                                  ? 'معتمد - جاهز للترحيل'
                                  : 'مسودة - بانتظار الاعتماد'}
                              </span>

                              {pv.status === 'draft' && isCreator && (
                                <span className="text-[10px] text-amber-600 font-medium">
                                  ⚠️ أنشأته أنت: يلزم اعتماد زميل
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {pv.status === 'draft' && (
                                <button
                                  onClick={() => handleApprovePaymentVoucher(pv)}
                                  disabled={isCreator}
                                  title={
                                    isCreator
                                      ? 'ممنوع الاعتماد الذاتي (مبدأ الرقابة الثنائية)'
                                      : 'اعتماد سند الصرف'
                                  }
                                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                                    isCreator
                                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                                  }`}
                                >
                                  اعتماد السند
                                </button>
                              )}

                              {pv.status === 'approved' && (
                                <button
                                  onClick={() => handlePostPaymentVoucher(pv)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                  ترحيل للخزينة
                                </button>
                              )}

                              <button
                                onClick={() => setPrintableDoc({ type: 'payment', data: pv })}
                                title="طباعة سند الصرف"
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. RECEIPT VOUCHERS (سندات القبض) TAB */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'receipts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                سندات القبض والتحصيل المالي (تطبيق بنكك، نقداً، حوالات دبي)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تُرحل سندات القبض وتُضاف للأرصدة النقدية فورياً مع تسجيل قيد محاسبي محمي
              </p>
            </div>
            <button
              onClick={() => setShowNewReceiptModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل سند قبض</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">رقم السند</th>
                    <th className="py-3 px-4">العميل المُسدد</th>
                    <th className="py-3 px-4">حساب الخزينة المودع فيه</th>
                    <th className="py-3 px-4">المبلغ والعملة</th>
                    <th className="py-3 px-4">طريقة التحصيل والمرجع</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {receiptVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        لا توجد سندات قبض مسجلة حالياً
                      </td>
                    </tr>
                  ) : (
                    receiptVouchers.map((rv) => (
                      <tr key={rv.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          {rv.voucherNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{rv.customerName}</div>
                          {rv.invoiceNumber && (
                            <div className="text-[11px] text-slate-500 font-mono">
                              فاتورة: {rv.invoiceNumber}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {rv.treasuryName}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                          {parseFloat(rv.amount).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}{' '}
                          {rv.currency}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-800">
                            {rv.paymentMethod === 'bank_transfer'
                              ? 'تطبيق بنكك / تحويل مصرفي'
                              : rv.paymentMethod === 'cash'
                              ? 'نقداً (كاش)'
                              : 'شيك'}
                          </span>
                          {rv.referenceDoc && (
                            <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                              مرجع: {rv.referenceDoc}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            مرحل ومودع بالخزينة
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setPrintableDoc({ type: 'receipt', data: rv })}
                            title="طباعة سند القبض"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. SUPPLIER INVOICES TAB */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'supplier_invoices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                فواتير ومطالبات الموردين (المصانع العالمية وخطوط الملاحة)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تتبع المدفوع والمتبقي بدقة متناهية مع حماية ضد السداد الزائد
              </p>
            </div>
            <button
              onClick={() => setShowNewSupplierInvoiceModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل فاتورة مورد</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">رقم الفاتورة</th>
                    <th className="py-3 px-4">المورد / المصنع</th>
                    <th className="py-3 px-4">أمر الشراء المرتبط</th>
                    <th className="py-3 px-4">الإجمالي</th>
                    <th className="py-3 px-4">المسدد</th>
                    <th className="py-3 px-4">المتبقي المطلوب</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {supplierInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        لا توجد فواتير موردين مسجلة
                      </td>
                    </tr>
                  ) : (
                    supplierInvoices.map((si) => {
                      const total = parseFloat(si.totalAmount) || 0;
                      const paid = parseFloat(si.paidAmount) || 0;
                      const rem = parseFloat(si.remainingAmount) || 0;

                      return (
                        <tr key={si.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {si.invoiceNumber}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {si.supplierName}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">
                            {si.poCode || 'مشتريات مباشرة'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                            {si.currency}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-600">
                            {paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                            {si.currency}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-rose-600">
                            {rem.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                            {si.currency}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                si.status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : si.status === 'partially_paid'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {si.status === 'paid'
                                ? 'مسددة بالكامل'
                                : si.status === 'partially_paid'
                                ? 'مسددة جزئياً'
                                : 'مستحقة السداد'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {rem > 0 && (
                              <button
                                onClick={() => {
                                  setPvSupplierId(si.supplierId);
                                  setPvSupplierInvoiceId(si.id);
                                  setPvAmount(rem.toFixed(2));
                                  setPvCurrency(si.currency);
                                  setShowNewPaymentModal(true);
                                }}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] cursor-pointer"
                              >
                                سداد المتبقي
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. CUSTOMER INVOICES TAB */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'customer_invoices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">فواتير المطالبة الصادرة للعملاء</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                إصدار الفواتير الرسمية، تتبع التحصيلات، وربطها بسندات القبض
              </p>
            </div>
            <button
              onClick={() => setShowNewCustomerInvoiceModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إصدار فاتورة عميل</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">رقم الفاتورة</th>
                    <th className="py-3 px-4">اسم العميل والشركة</th>
                    <th className="py-3 px-4">إجمالي المطالبة</th>
                    <th className="py-3 px-4">المحصل</th>
                    <th className="py-3 px-4">المتبقي المطلوب</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {customerInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        لا توجد فواتير عملاء صادرة حالياً
                      </td>
                    </tr>
                  ) : (
                    customerInvoices.map((ci) => {
                      const total = parseFloat(ci.totalAmount) || 0;
                      const paid = parseFloat(ci.paidAmount) || 0;
                      const rem = parseFloat(ci.remainingAmount) || 0;

                      return (
                        <tr key={ci.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                            {ci.invoiceNumber}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{ci.customerName}</div>
                            {ci.customerCompany && (
                              <div className="text-[11px] text-slate-400">{ci.customerCompany}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                            {ci.currency}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-600">
                            {paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                            {ci.currency}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-rose-600">
                            {rem.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                            {ci.currency}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ci.status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : ci.status === 'partially_paid'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {ci.status === 'paid'
                                ? 'محصلة بالكامل'
                                : ci.status === 'partially_paid'
                                ? 'محصلة جزئياً'
                                : 'صادرة - بانتظار التحصيل'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {rem > 0 && (
                                <button
                                  onClick={() => {
                                    setRvCustomerId(ci.customerId);
                                    setRvCustomerInvoiceId(ci.id);
                                    setRvAmount(rem.toFixed(2));
                                    setRvCurrency(ci.currency);
                                    setShowNewReceiptModal(true);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px] cursor-pointer"
                                >
                                  تحصيل دفعة
                                </button>
                              )}
                              <button
                                onClick={() => setPrintableDoc({ type: 'invoice', data: ci })}
                                title="طباعة الفاتورة"
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. PROTECTED TREASURY LEDGER TAB */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-emerald-950 text-xs">
                  سجل الخزينة المحمي والمحصن ضد التعديل أو الحذف (PostgreSQL Engine Immutability)
                </h4>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  كافة الحركات المالية المسجلة هنا محمية بتريجر قاعدة بيانات يمنع أي أمر UPDATE أو DELETE لمنع التلاعب المالي وضمان الشفافية المطلقة.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-xl border border-emerald-200">
              {transactions.length} قيد مالي محصن
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">رقم القيد (Code)</th>
                    <th className="py-3 px-4">حساب الخزينة</th>
                    <th className="py-3 px-4">نوع الحركة</th>
                    <th className="py-3 px-4">المبلغ والعملة</th>
                    <th className="py-3 px-4">البيان والتفاصيل</th>
                    <th className="py-3 px-4">الرصيد بعد الحركة</th>
                    <th className="py-3 px-4">التاريخ والوقت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        لا توجد قيود مسجلة في دفتر الأستاذ حتى الآن
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isNegative =
                        tx.transactionType === 'payment' ||
                        tx.transactionType === 'withdrawal' ||
                        tx.transactionType === 'transfer_out';

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {tx.transactionCode}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {tx.accountName}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isNegative
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {isNegative ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : (
                                <ArrowDownLeft className="w-3 h-3" />
                              )}
                              {tx.transactionType === 'payment'
                                ? 'سداد سند صرف'
                                : tx.transactionType === 'receipt'
                                ? 'تحصيل سند قبض'
                                : tx.transactionType === 'transfer_out'
                                ? 'تحويل صادر'
                                : tx.transactionType === 'transfer_in'
                                ? 'تحويل وارد'
                                : tx.transactionType === 'adjustment'
                                ? 'تسوية معتمدة'
                                : 'إيداع نقدي'}
                            </span>
                          </td>
                          <td
                            className={`py-3 px-4 font-mono font-bold ${
                              isNegative ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {isNegative ? '-' : '+'}
                            {parseFloat(tx.amount).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            {tx.currency}
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-sm truncate" title={tx.description}>
                            {tx.description}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {parseFloat(tx.runningBalance).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            {tx.accountCurrency}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                            {new Date(tx.createdAt).toLocaleString('ar-SD')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 7. RECONCILIATIONS TAB */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'reconciliations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                تسويات ومطابقات أرصدة الخزائن والبنوك
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                مقارنة الرصيد الدفتري مع الرصيد الفعلي (كشف حساب بنكك / الجرد الفعلي) مع اعتماد الإدارة قبل تعديل الأرصدة
              </p>
            </div>
            <button
              onClick={() => setShowReconcileModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>طلب مطابقة وتسوية</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">كود المطابقة</th>
                    <th className="py-3 px-4">حساب الخزينة</th>
                    <th className="py-3 px-4">الرصيد الدفتري</th>
                    <th className="py-3 px-4">الرصيد الفعلي بعد الجرد</th>
                    <th className="py-3 px-4">الفارق المالي (العجز / الفائض)</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reconciliations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        لا توجد طلبات تسوية مسجلة
                      </td>
                    </tr>
                  ) : (
                    reconciliations.map((rec) => {
                      const diff = parseFloat(rec.difference) || 0;
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {rec.reconciliationCode}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {rec.accountName}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {parseFloat(rec.bookBalance).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            {rec.currency}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {parseFloat(rec.reconciledBalance).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            {rec.currency}
                          </td>
                          <td
                            className={`py-3 px-4 font-mono font-bold ${
                              diff === 0
                                ? 'text-slate-600'
                                : diff > 0
                                ? 'text-emerald-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {diff > 0 ? `+${diff}` : diff} {rec.currency}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rec.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : rec.status === 'rejected'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {rec.status === 'approved'
                                ? 'معتمدة ومرحلة'
                                : rec.status === 'rejected'
                                ? 'مرفوضة'
                                : 'مسودة - بانتظار الاعتماد'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {rec.status === 'draft' && (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleApproveReconciliation(rec.id, true)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                                >
                                  اعتماد وتحديث الرصيد
                                </button>
                                <button
                                  onClick={() => handleApproveReconciliation(rec.id, false)}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[11px] cursor-pointer"
                                >
                                  رفض
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 8. EXCHANGE RATES TAB */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'exchange_rates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                سجل أسعار صرف العملات المعتمدة (Historical Currency Pairs)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تُستخدم الأسعار للتحويلات البينية وإصدار تقارير الربحية التحليلية (USD / SDG / AED / CNY / SAR)
              </p>
            </div>
            <button
              onClick={() => setShowNewRateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تحديث سعر صرف</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exchangeRates.map((rate) => (
              <div
                key={rate.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-bold font-mono text-slate-900 text-base">
                    1 {rate.baseCurrency} =
                  </span>
                  <div className="text-2xl font-black font-mono text-indigo-600 mt-1">
                    {parseFloat(rate.rate).toLocaleString('en-US', {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 6,
                    })}{' '}
                    <span className="text-xs font-sans text-slate-600">{rate.targetCurrency}</span>
                  </div>
                </div>
                <div className="text-left text-[11px] text-slate-400 font-mono">
                  {new Date(rate.effectiveDate).toLocaleDateString('ar-SD')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: NEW TREASURY ACCOUNT */}
      {/* ---------------------------------------------------- */}
      {showNewAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">إضافة حساب خزينة جديد</h3>
              <button
                onClick={() => setShowNewAccountModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">اسم الحساب أو الخزينة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حساب بنكك الرئيسي - بورتسودان"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">النوع</label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="bank">حساب بنكي (Bank)</option>
                    <option value="cash">خزينة نقدية (Cashbox)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">العملة الأساسية</label>
                  <select
                    value={accCurrency}
                    onChange={(e) => setAccCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="SDG">جنيه سوداني (SDG)</option>
                    <option value="AED">درهم إماراتي (AED)</option>
                    <option value="CNY">يوان صيني (CNY)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">اسم البنك / الجهة</label>
                <input
                  type="text"
                  placeholder="مثال: بنك الخرطوم (Bank of Khartoum)"
                  value={accBankName}
                  onChange={(e) => setAccBankName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">رقم الحساب / الآيبان</label>
                <input
                  type="text"
                  placeholder="e.g. 2490018823"
                  value={accNumber}
                  onChange={(e) => setAccNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:border-slate-800 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">الرصيد الافتتاحي</label>
                <input
                  type="number"
                  step="0.01"
                  value={accInitialBal}
                  onChange={(e) => setAccInitialBal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:border-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewAccountModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  حفظ الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: TREASURY TRANSFER */}
      {/* ---------------------------------------------------- */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600">
                <ArrowRightLeft className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">تحويل ذري بين الخزائن</h3>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransferFunds} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">من حساب الخزينة (المصدر) *</label>
                <select
                  value={trFromId}
                  onChange={(e) => setTrFromId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden cursor-pointer"
                >
                  {treasuryAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.balance} {a.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">إلى حساب الخزينة (المستلم) *</label>
                <select
                  value={trToId}
                  onChange={(e) => setTrToId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden cursor-pointer"
                >
                  {treasuryAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">المبلغ المحول</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={trAmount}
                    onChange={(e) => setTrAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">سعر الصرف (إذا اختلفت العملة)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={trRate}
                    onChange={(e) => setTrRate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">ملاحظات التحويل</label>
                <input
                  type="text"
                  placeholder="سبب التحويل، رقم الإشعار..."
                  value={trNotes}
                  onChange={(e) => setTrNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  تنفيذ التحويل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: NEW PAYMENT VOUCHER (سند صرف) */}
      {/* ---------------------------------------------------- */}
      {showNewPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <ArrowUpRight className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">إنشاء سند صرف مالي (Payment Voucher)</h3>
              </div>
              <button
                onClick={() => setShowNewPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePaymentVoucher} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">حساب الخزينة المسحوب منه *</label>
                  <select
                    value={pvTreasuryId}
                    onChange={(e) => setPvTreasuryId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden cursor-pointer"
                  >
                    {treasuryAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.balance} {a.currency})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">المورد / المستفيد *</label>
                  <select
                    value={pvSupplierId}
                    onChange={(e) => setPvSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden cursor-pointer"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.tradeName || s.tradeNameEn || s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">
                  فاتورة المورد المرتبطة (اختياري - لتطبيق منع الصرف الزائد)
                </label>
                <select
                  value={pvSupplierInvoiceId}
                  onChange={(e) => {
                    setPvSupplierInvoiceId(e.target.value);
                    const selected = supplierInvoices.find((si) => si.id === e.target.value);
                    if (selected) {
                      setPvAmount(selected.remainingAmount);
                      setPvCurrency(selected.currency);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden cursor-pointer font-mono"
                >
                  <option value="">-- بدون ربط بفاتورة محددة (صرف مباشر) --</option>
                  {supplierInvoices
                    .filter((si) => si.status !== 'paid' && (!pvSupplierId || si.supplierId === pvSupplierId))
                    .map((si) => (
                      <option key={si.id} value={si.id}>
                        {si.invoiceNumber} | المتبقي: {si.remainingAmount} {si.currency}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-600 mb-1 font-medium">المبلغ المطلوب صرفه *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={pvAmount}
                    onChange={(e) => setPvAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">العملة</label>
                  <select
                    value={pvCurrency}
                    onChange={(e) => setPvCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="USD">USD</option>
                    <option value="CNY">CNY</option>
                    <option value="AED">AED</option>
                    <option value="SDG">SDG</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">طريقة الصرف</label>
                  <select
                    value={pvMethod}
                    onChange={(e) => setPvMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="bank_transfer">تحويل مصرفي (Bank Wire)</option>
                    <option value="cash">نقداً (Cash)</option>
                    <option value="cheque">شيك مصرفي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">رقم المرجع / الإشعار</label>
                  <input
                    type="text"
                    placeholder="رقم الحوالة، الشيك..."
                    value={pvRefDoc}
                    onChange={(e) => setPvRefDoc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">البيان والملاحظات</label>
                <textarea
                  rows={2}
                  placeholder="بيان سبب الصرف أو أرقام الحاويات والمشتريات..."
                  value={pvNotes}
                  onChange={(e) => setPvNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center gap-2 text-[11px] text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  تنبيه رقابة: سيتم إنشاء السند كـ "مسودة"، ويلزم اعتماده من مسؤول مالي آخر قبل ترحيله وخصم الرصيد.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewPaymentModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  إنشاء سند الصرف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: NEW RECEIPT VOUCHER (سند قبض) */}
      {/* ---------------------------------------------------- */}
      {showNewReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-600">
                <ArrowDownLeft className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">تسجيل سند قبض وتحصيل (Receipt Voucher)</h3>
              </div>
              <button
                onClick={() => setShowNewReceiptModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReceiptVoucher} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">حساب الخزينة المودع فيه *</label>
                  <select
                    value={rvTreasuryId}
                    onChange={(e) => setRvTreasuryId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden cursor-pointer"
                  >
                    {treasuryAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.currency})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">العميل المُسدد *</label>
                  <select
                    value={rvCustomerId}
                    onChange={(e) => setRvCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden cursor-pointer"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.tradeName || c.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">فاتورة العميل المرتبطة (اختياري)</label>
                <select
                  value={rvCustomerInvoiceId}
                  onChange={(e) => {
                    setRvCustomerInvoiceId(e.target.value);
                    const selected = customerInvoices.find((ci) => ci.id === e.target.value);
                    if (selected) {
                      setRvAmount(selected.remainingAmount);
                      setRvCurrency(selected.currency);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden cursor-pointer font-mono"
                >
                  <option value="">-- بدون ربط بفاتورة محددة (دفعة مقدمة / مباشرة) --</option>
                  {customerInvoices
                    .filter((ci) => ci.status !== 'paid' && (!rvCustomerId || ci.customerId === rvCustomerId))
                    .map((ci) => (
                      <option key={ci.id} value={ci.id}>
                        {ci.invoiceNumber} | المتبقي: {ci.remainingAmount} {ci.currency}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-600 mb-1 font-medium">المبلغ المحصل *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={rvAmount}
                    onChange={(e) => setRvAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">العملة</label>
                  <select
                    value={rvCurrency}
                    onChange={(e) => setRvCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="USD">USD</option>
                    <option value="SDG">SDG</option>
                    <option value="AED">AED</option>
                    <option value="SAR">SAR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">طريقة التحصيل</label>
                  <select
                    value={rvMethod}
                    onChange={(e) => setRvMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="bank_transfer">تطبيق بنكك / إشعار تحويل</option>
                    <option value="cash">نقداً (كاش بالخزينة)</option>
                    <option value="cheque">شيك مصرفي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">رقم إشعار بنكك / المرجع</label>
                  <input
                    type="text"
                    placeholder="رقم المعاملة في تطبيق بنكك..."
                    value={rvRefDoc}
                    onChange={(e) => setRvRefDoc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">البيان والملاحظات</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات التحصيل، اسم المودع..."
                  value={rvNotes}
                  onChange={(e) => setRvNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewReceiptModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  تسجيل وترحيل القبض
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: NEW SUPPLIER INVOICE */}
      {/* ---------------------------------------------------- */}
      {showNewSupplierInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">تسجيل فاتورة مورد / مصنع</h3>
              <button
                onClick={() => setShowNewSupplierInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplierInvoice} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">المورد / المصنع *</label>
                <select
                  value={siSupplierId}
                  onChange={(e) => setSiSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden cursor-pointer"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.tradeName || s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">أمر الشراء المرتبط (PO)</label>
                <select
                  value={siPurchaseOrderId}
                  onChange={(e) => setSiPurchaseOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono focus:outline-hidden cursor-pointer"
                >
                  <option value="">-- بدون أمر شراء --</option>
                  {purchaseOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poCode} | {po.totalAmount} {po.currency}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">رقم فاتورة المورد (اختياري)</label>
                <input
                  type="text"
                  placeholder="تلقائي (SINV-2026-XXXX) أو رقم مستند المصنع"
                  value={siInvoiceNumber}
                  onChange={(e) => setSiInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">المبلغ الإجمالي *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={siSubtotal}
                    onChange={(e) => setSiSubtotal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">العملة</label>
                  <select
                    value={siCurrency}
                    onChange={(e) => setSiCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="USD">USD</option>
                    <option value="CNY">CNY</option>
                    <option value="AED">AED</option>
                    <option value="SDG">SDG</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">ملاحظات الفاتورة</label>
                <textarea
                  rows={2}
                  value={siNotes}
                  onChange={(e) => setSiNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewSupplierInvoiceModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  تسجيل الفاتورة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: NEW CUSTOMER INVOICE */}
      {/* ---------------------------------------------------- */}
      {showNewCustomerInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">إصدار فاتورة مطالبة جديدة للعميل</h3>
              <button
                onClick={() => setShowNewCustomerInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerInvoice} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">العميل *</label>
                  <select
                    value={ciCustomerId}
                    onChange={(e) => setCiCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden cursor-pointer"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.tradeName || c.companyName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">العملة</label>
                  <select
                    value={ciCurrency}
                    onChange={(e) => setCiCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="USD">USD</option>
                    <option value="SDG">SDG</option>
                    <option value="AED">AED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">شروط الدفع</label>
                <input
                  type="text"
                  value={ciPaymentTerms}
                  onChange={(e) => setCiPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-2">بنود الفاتورة</label>
                <div className="space-y-2">
                  {ciItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl">
                      <input
                        type="text"
                        placeholder="بيان البند"
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...ciItems];
                          updated[idx].description = e.target.value;
                          setCiItems(updated);
                        }}
                        className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                      />
                      <input
                        type="number"
                        placeholder="السعر"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const updated = [...ciItems];
                          updated[idx].unitPrice = parseFloat(e.target.value) || 0;
                          setCiItems(updated);
                        }}
                        className="w-24 px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerInvoiceModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  إصدار الفاتورة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: NEW RECONCILIATION */}
      {/* ---------------------------------------------------- */}
      {showReconcileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600">
                <Scale className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">تسوية ومطابقة رصيد خزينة</h3>
              </div>
              <button
                onClick={() => setShowReconcileModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReconciliation} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">حساب الخزينة المراد مطابقته *</label>
                <select
                  value={reconAccountId}
                  onChange={(e) => {
                    setReconAccountId(e.target.value);
                    const acc = treasuryAccounts.find((a) => a.id === e.target.value);
                    if (acc) setReconActualBal(acc.balance);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden cursor-pointer"
                >
                  {treasuryAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (الرصيد الدفتري: {a.balance} {a.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">
                  الرصيد الفعلي بعد الجرد (أو كشف حساب بنكك) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={reconActualBal}
                  onChange={(e) => setReconActualBal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">سبب الفارق والملاحظات</label>
                <textarea
                  rows={2}
                  placeholder="عمولات بنكية معلقة، فروقات تسليم كاش..."
                  value={reconNotes}
                  onChange={(e) => setReconNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReconcileModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  حفظ طلب التسوية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: NEW EXCHANGE RATE */}
      {/* ---------------------------------------------------- */}
      {showNewRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">تحديث سعر صرف</h3>
              <button
                onClick={() => setShowNewRateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSetExchangeRate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">عملة الأساس</label>
                  <input
                    type="text"
                    value={rateBase}
                    onChange={(e) => setRateBase(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">العملة المستهدفة</label>
                  <input
                    type="text"
                    value={rateTarget}
                    onChange={(e) => setRateTarget(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">سعر الصرف المعتمد *</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={rateValue}
                  onChange={(e) => setRateValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewRateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  حفظ السعر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT MODAL */}
      {printableDoc && (
        <ErpDocumentPrintModal
          isOpen={true}
          onClose={() => setPrintableDoc(null)}
          docType={printableDoc.type}
          data={printableDoc.data}
        />
      )}
    </div>
  );
};
