import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Tag,
  DollarSign,
  Package,
  Printer,
  Award,
  Sparkles,
  ChevronDown,
  Receipt,
  FileText,
  AlertCircle,
  CreditCard,
  Phone,
  MessageCircle,
  MapPin,
  Star,
  Trash2,
  Edit,
  Eye,
  X,
  Send,
  HelpCircle,
} from 'lucide-react';
import { erpEngine } from '../../engine/erpEngine';
import { useErpAuth } from '../../context/ErpAuthContext';
import {
  ErpPurchaseInvoice,
  ErpPurchaseInvoiceItem,
  ErpPurchaseOrder,
  ErpRfq,
  ErpSupplier,
  ErpSupplierQuote,
  ErpVendorPayment,
} from '../../../types';
import { ErpDocumentPrintModal, PrintableDocType } from '../../components/ErpDocumentPrintModal';
import { exportToCsv } from '../../../lib/exportUtils';

type ProcurementSubTab = 'invoices' | 'suppliers' | 'pos' | 'rfqs' | 'analytics';

export const ProcurementView: React.FC = () => {
  const { currentUser, refreshData } = useErpAuth();
  const [activeSubTab, setActiveSubTab] = useState<ProcurementSubTab>('invoices');

  // Search & Filter States
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierCountryFilter, setSupplierCountryFilter] = useState<'all' | 'الصين' | 'الإمارات' | 'السعودية' | 'تركيا'>('all');

  // Modals & Drawers State
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [showNewPoModal, setShowNewPoModal] = useState(false);
  const [showNewRfqModal, setShowNewRfqModal] = useState(false);
  const [showAddQuoteModal, setShowAddQuoteModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);

  // Selected Entities
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<ErpPurchaseInvoice | null>(null);
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<ErpPurchaseInvoice | null>(null);
  const [selectedSupplierProfile, setSelectedSupplierProfile] = useState<ErpSupplier | null>(null);
  const [selectedRfqForQuote, setSelectedRfqForQuote] = useState<ErpRfq | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<ErpSupplier | null>(null);

  // Document Print Modal
  const [printableDoc, setPrintableDoc] = useState<{
    type: PrintableDocType;
    data: any;
  } | null>(null);

  // Engine Data
  const suppliers = erpEngine.getSuppliers();
  const purchaseInvoices = erpEngine.getPurchaseInvoices();
  const purchaseOrders = erpEngine.getPurchaseOrders();
  const rfqs = erpEngine.getRfqs();
  const quotes = erpEngine.getQuotes();
  const requests = erpEngine.getRequests();

  // ----------------------------------------------------
  // FORM STATES: New Purchase Invoice
  // ----------------------------------------------------
  const [invSupplierId, setInvSupplierId] = useState(suppliers[0]?.id || '');
  const [invPoId, setInvPoId] = useState('');
  const [invRequestId, setInvRequestId] = useState(requests[0]?.id || '');
  const [invVendorInvoiceNum, setInvVendorInvoiceNum] = useState('');
  const [invCurrency, setInvCurrency] = useState<'USD' | 'AED' | 'SAR' | 'CNY' | 'SDG'>('USD');
  const [invIssueDate, setInvIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [invDueDate, setInvDueDate] = useState(
    new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [invPaymentTerms, setInvPaymentTerms] = useState('30% مقدم، 70% عند الفحص والشحن');
  const [invNotes, setInvNotes] = useState('');
  const [invItems, setInvItems] = useState<ErpPurchaseInvoiceItem[]>([
    {
      id: 'item-1',
      description: 'بضاعة وتوريدات تجارية حسب المواصفات الفنية المعتمدة',
      quantity: 1,
      unit: 'شحنة/دفعة',
      unitPrice: 15000,
      totalPrice: 15000,
    },
  ]);
  const [invInitialPaid, setInvInitialPaid] = useState<number>(0);
  const [invInitialPaymentMethod, setInvInitialPaymentMethod] = useState<
    'bank_wire' | 'dubai_account' | 'cash' | 'alipay_wechat' | 'bankak'
  >('bank_wire');
  const [invInitialReference, setInvInitialReference] = useState('');

  // ----------------------------------------------------
  // FORM STATES: New / Edit Supplier
  // ----------------------------------------------------
  const [supName, setSupName] = useState('');
  const [supTradeNameEn, setSupTradeNameEn] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supCountry, setSupCountry] = useState('الصين');
  const [supCity, setSupCity] = useState('فوشان / قوانغتشو');
  const [supPhone, setSupPhone] = useState('');
  const [supWhatsapp, setSupWhatsapp] = useState('');
  const [supWechat, setSupWechat] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supBankName, setSupBankName] = useState('Bank of China');
  const [supBankIban, setSupBankIban] = useState('');
  const [supCategories, setSupCategories] = useState('طاقة شمسية، كهربائيات، بطاريات');
  const [supPaymentTerms, setSupPaymentTerms] = useState('30% مقدم، 70% عند صدور بوليصة الشحن');
  const [supRating, setSupRating] = useState<number>(5);

  // ----------------------------------------------------
  // FORM STATES: Vendor Payment Voucher
  // ----------------------------------------------------
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<
    'bank_wire' | 'dubai_account' | 'cash' | 'alipay_wechat' | 'bankak'
  >('bank_wire');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // ----------------------------------------------------
  // FORM STATES: Purchase Order (PO)
  // ----------------------------------------------------
  const [poRequestId, setPoRequestId] = useState(requests[0]?.id || '');
  const [poSupplierId, setPoSupplierId] = useState(suppliers[0]?.id || '');
  const [poAmount, setPoAmount] = useState<number>(10000);
  const [poCurrency, setPoCurrency] = useState<'USD' | 'AED' | 'SAR' | 'CNY' | 'SDG'>('USD');
  const [poItemsSummary, setPoItemsSummary] = useState('');
  const [poPaymentTerms, setPoPaymentTerms] = useState('30% مقدم، 70% عند صدور بوليصة الشحن');
  const [poDeliveryDate, setPoDeliveryDate] = useState('2026-04-10');

  // ----------------------------------------------------
  // FORM STATES: RFQ
  // ----------------------------------------------------
  const [rfqRequestId, setRfqRequestId] = useState(requests[0]?.id || '');
  const [rfqTitle, setRfqTitle] = useState('');
  const [rfqPort, setRfqPort] = useState('ميناء بورتسودان الجنوبي');
  const [rfqItemName, setRfqItemName] = useState('');
  const [rfqItemQty, setRfqItemQty] = useState<number>(100);

  // ----------------------------------------------------
  // FORM STATES: Quote
  // ----------------------------------------------------
  const [quoteSupplierId, setQuoteSupplierId] = useState(suppliers[0]?.id || '');
  const [quoteAmount, setQuoteAmount] = useState<number>(8500);
  const [quoteCurrency, setQuoteCurrency] = useState<'USD' | 'AED' | 'CNY'>('USD');
  const [quoteLeadDays, setQuoteLeadDays] = useState<number>(15);
  const [quoteWarranty, setQuoteWarranty] = useState<number>(24);
  const [quotePayment, setQuotePayment] = useState('30% دفعة مقدمة، 70% عند الفحص والشحن');

  // Compute Invoice Items Sum
  const invoiceSubtotal = invItems.reduce((acc, item) => acc + item.totalPrice, 0);

  const handleAddItemToInvoice = () => {
    setInvItems([
      ...invItems,
      {
        id: `item-${Date.now()}`,
        description: '',
        quantity: 1,
        unit: 'قطعة',
        unitPrice: 100,
        totalPrice: 100,
      },
    ]);
  };

  const handleUpdateInvoiceItem = (index: number, field: keyof ErpPurchaseInvoiceItem, value: any) => {
    const next = [...invItems];
    const item = { ...next[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      item.totalPrice = Number(item.quantity || 0) * Number(item.unitPrice || 0);
    }
    next[index] = item;
    setInvItems(next);
  };

  const handleRemoveInvoiceItem = (index: number) => {
    if (invItems.length === 1) return;
    setInvItems(invItems.filter((_, i) => i !== index));
  };

  // When PO is selected in New Invoice, pre-fill details
  const handleSelectPoForInvoice = (poId: string) => {
    setInvPoId(poId);
    if (!poId) return;
    const po = purchaseOrders.find((p) => p.id === poId);
    if (po) {
      setInvSupplierId(po.supplierId);
      setInvRequestId(po.requestId);
      setInvCurrency(po.currency);
      setInvPaymentTerms(po.paymentTerms);
      setInvItems([
        {
          id: `item-${Date.now()}`,
          description: po.itemsSummary,
          quantity: 1,
          unit: 'أمر توريد كامل',
          unitPrice: po.totalAmount,
          totalPrice: po.totalAmount,
        },
      ]);
    }
  };

  // ----------------------------------------------------
  // SUBMIT HANDLERS
  // ----------------------------------------------------
  const handleCreatePurchaseInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === invSupplierId);
    if (!sup) {
      alert('يرجى اختيار المورد أولاً');
      return;
    }
    const req = requests.find((r) => r.id === invRequestId);
    const po = purchaseOrders.find((p) => p.id === invPoId);

    const initialPaidNum = Number(invInitialPaid || 0);
    const totalAmount = invoiceSubtotal;

    const initialPayments: ErpVendorPayment[] = [];
    if (initialPaidNum > 0) {
      initialPayments.push({
        id: `vpay-${Date.now()}`,
        paymentCode: `VPAY-INIT-${Date.now().toString().slice(-4)}`,
        invoiceId: '',
        invoiceCode: '',
        supplierId: sup.id,
        supplierName: sup.name,
        amount: initialPaidNum,
        currency: invCurrency,
        paymentMethod: invInitialPaymentMethod,
        referenceNumber: invInitialReference || 'دفعة مقدمة مسجلة عند إنشاء الفاتورة',
        paidAt: new Date().toISOString(),
        paidBy: currentUser.name,
        notes: 'دفعة مقدمة مثبتة في أمر الشراء',
      });
    }

    const created = erpEngine.createPurchaseInvoice(
      {
        vendorInvoiceNumber: invVendorInvoiceNum.trim() || `V-INV-${Date.now().toString().slice(-5)}`,
        supplierId: sup.id,
        supplierName: sup.name,
        supplierCode: sup.supplierCode,
        poId: po?.id,
        poCode: po?.poCode,
        requestId: req?.id,
        requestCode: req?.requestCode,
        currency: invCurrency,
        issueDate: invIssueDate,
        dueDate: invDueDate,
        items: invItems,
        subtotal: totalAmount,
        shippingAndFees: 0,
        totalAmount,
        paidAmount: initialPaidNum,
        paymentStatus: initialPaidNum >= totalAmount ? 'paid' : initialPaidNum > 0 ? 'partial' : 'unpaid',
        status: initialPaidNum >= totalAmount ? 'settled' : 'approved',
        paymentTerms: invPaymentTerms,
        notes: invNotes,
        approvedBy: currentUser.name,
        approvedAt: new Date().toISOString(),
        payments: initialPayments,
      },
      currentUser
    );

    refreshData();
    setShowNewInvoiceModal(false);
    // Reset form
    setInvVendorInvoiceNum('');
    setInvInitialPaid(0);
    setInvInitialReference('');
    setInvNotes('');
    alert(`تم تسجيل فاتورة المشتريات [${created.invoiceCode}] بنجاح وحفظها في المنظومة.`);
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) {
      alert('يرجى كتابة اسم الشركة / المصنع');
      return;
    }

    const cats = supCategories
      .split(/[,،]/)
      .map((c) => c.trim())
      .filter(Boolean);

    if (editingSupplier) {
      erpEngine.updateSupplier(
        editingSupplier.id,
        {
          name: supName.trim(),
          tradeNameEn: supTradeNameEn.trim(),
          contactPerson: supContact.trim(),
          country: supCountry,
          city: supCity.trim(),
          phone: supPhone.trim(),
          whatsapp: supWhatsapp.trim(),
          wechat: supWechat.trim(),
          email: supEmail.trim(),
          address: supAddress.trim(),
          bankName: supBankName.trim(),
          bankIban: supBankIban.trim(),
          categories: cats.length > 0 ? cats : ['عام'],
          paymentTerms: supPaymentTerms.trim(),
          rating: supRating,
        },
        currentUser
      );
      setEditingSupplier(null);
    } else {
      erpEngine.createSupplier(
        {
          name: supName.trim(),
          tradeNameEn: supTradeNameEn.trim(),
          contactPerson: supContact.trim() || 'مدير المبيعات والتصدير',
          country: supCountry,
          city: supCity.trim() || 'الصين',
          phone: supPhone.trim() || '+86 000 0000 0000',
          whatsapp: supWhatsapp.trim(),
          wechat: supWechat.trim(),
          email: supEmail.trim(),
          address: supAddress.trim(),
          bankName: supBankName.trim(),
          bankIban: supBankIban.trim(),
          rating: supRating,
          categories: cats.length > 0 ? cats : ['توريد عام'],
          status: 'verified',
          paymentTerms: supPaymentTerms.trim(),
        },
        currentUser
      );
    }

    refreshData();
    setShowNewSupplierModal(false);
    // Reset
    setSupName('');
    setSupTradeNameEn('');
    setSupContact('');
    setSupPhone('');
    setSupWhatsapp('');
    setSupWechat('');
    setSupEmail('');
    setSupAddress('');
    setSupBankIban('');
  };

  const handleOpenEditSupplier = (sup: ErpSupplier) => {
    setEditingSupplier(sup);
    setSupName(sup.name);
    setSupTradeNameEn(sup.tradeNameEn || '');
    setSupContact(sup.contactPerson || '');
    setSupCountry(sup.country || 'الصين');
    setSupCity(sup.city || '');
    setSupPhone(sup.phone || '');
    setSupWhatsapp(sup.whatsapp || '');
    setSupWechat(sup.wechat || '');
    setSupEmail(sup.email || '');
    setSupAddress(sup.address || '');
    setSupBankName(sup.bankName || 'Bank of China');
    setSupBankIban(sup.bankIban || '');
    setSupCategories(sup.categories?.join('، ') || '');
    setSupPaymentTerms(sup.paymentTerms || '');
    setSupRating(sup.rating || 5);
    setShowNewSupplierModal(true);
  };

  const handleOpenRecordPayment = (inv: ErpPurchaseInvoice) => {
    setSelectedInvoiceForPayment(inv);
    setPayAmount(inv.remainingAmount > 0 ? inv.remainingAmount : 0);
    setPayReference('');
    setPayNotes('');
    setShowRecordPaymentModal(true);
  };

  const handleSubmitVendorPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;
    if (payAmount <= 0) {
      alert('يرجى تحديد مبلغ سداد صحيح أكبر من الصفر');
      return;
    }
    if (!payReference.trim()) {
      alert('يرجى إدخال رقم الحوالة / السويفت أو السند المرجعي');
      return;
    }

    const result = erpEngine.recordVendorPayment(
      selectedInvoiceForPayment.id,
      {
        amount: Number(payAmount),
        currency: selectedInvoiceForPayment.currency,
        paymentMethod: payMethod,
        referenceNumber: payReference.trim(),
        notes: payNotes.trim(),
      },
      currentUser
    );

    refreshData();
    setShowRecordPaymentModal(false);
    setSelectedInvoiceForPayment(null);
    alert(`تم بنجاح قيد سند الصرف [${result.payment.paymentCode}] وتحديث رصيد فاتورة المورد.`);
  };

  const handleCreatePo = (e: React.FormEvent) => {
    e.preventDefault();
    const req = requests.find((r) => r.id === poRequestId) || {
      id: 'req-manual',
      requestCode: 'REQ-DIRECT',
    };
    const sup = suppliers.find((s) => s.id === poSupplierId) || {
      id: 'sup-manual',
      name: 'مورد معتمد خارجي',
    };

    erpEngine.createPurchaseOrder(
      {
        requestId: req.id,
        requestCode: req.requestCode,
        supplierId: sup.id,
        supplierName: sup.name,
        currency: poCurrency,
        totalAmount: Number(poAmount),
        itemsSummary: poItemsSummary || 'توريد وتصنيع بضاعة حسب المواصفات الفنية المعتمدة',
        status: 'approved',
        paymentTerms: poPaymentTerms,
        deliveryDate: poDeliveryDate,
        approvedBy: currentUser.name,
        approvedAt: new Date().toISOString(),
      },
      currentUser
    );

    refreshData();
    setShowNewPoModal(false);
    setPoItemsSummary('');
    alert('تم إصدار أمر الشراء الرسمي (PO) واعتماده بنجاح.');
  };

  const handleConvertPoToInvoice = (po: ErpPurchaseOrder) => {
    setInvPoId(po.id);
    setInvSupplierId(po.supplierId);
    setInvRequestId(po.requestId);
    setInvCurrency(po.currency);
    setInvPaymentTerms(po.paymentTerms);
    setInvVendorInvoiceNum(`INV-FROM-${po.poCode}`);
    setInvItems([
      {
        id: `item-${Date.now()}`,
        description: po.itemsSummary,
        quantity: 1,
        unit: 'أمر توريد كامل',
        unitPrice: po.totalAmount,
        totalPrice: po.totalAmount,
      },
    ]);
    setActiveSubTab('invoices');
    setShowNewInvoiceModal(true);
  };

  const handleCreateRfq = (e: React.FormEvent) => {
    e.preventDefault();
    const req = requests.find((r) => r.id === rfqRequestId) || {
      id: 'req-manual',
      requestCode: 'REQ-DIRECT',
      customerName: 'عميل عام',
    };

    erpEngine.createRfq(
      {
        requestId: req.id,
        requestCode: req.requestCode,
        customerName: req.customerName,
        title: rfqTitle || `طلب تسعير ومناقصة توريد - ${rfqItemName}`,
        destinationPort: rfqPort,
        status: 'sent_to_suppliers',
        invitedSupplierIds: suppliers.map((s) => s.id),
        items: [
          {
            id: 'item-1',
            name: rfqItemName || 'بضاعة حسب المواصفات',
            specifications: 'مطابق للهيئة السودانية للمواصفات والمقاييس',
            quantity: Number(rfqItemQty) || 100,
            unit: 'وحدة',
          },
        ],
      },
      currentUser
    );

    refreshData();
    setShowNewRfqModal(false);
    setRfqTitle('');
    setRfqItemName('');
  };

  const handleAddQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfqForQuote) return;
    const sup = suppliers.find((s) => s.id === quoteSupplierId) || suppliers[0];

    erpEngine.addSupplierQuote(
      {
        rfqId: selectedRfqForQuote.id,
        supplierId: sup.id,
        supplierName: sup.name,
        currency: quoteCurrency,
        totalAmount: Number(quoteAmount),
        unitPrices: [{ itemId: selectedRfqForQuote.items[0]?.id || 'item-1', price: Number(quoteAmount) / (selectedRfqForQuote.items[0]?.quantity || 1) }],
        deliveryLeadDays: Number(quoteLeadDays),
        warrantyMonths: Number(quoteWarranty),
        paymentTerms: quotePayment,
        isAwarded: false,
      },
      currentUser
    );

    refreshData();
    setShowAddQuoteModal(false);
    setSelectedRfqForQuote(null);
  };

  const handleAwardQuote = (quoteId: string) => {
    if (confirm('هل أنت متأكد من ترسية هذا العرض وإصدار أمر الشراء (PO) الرسمي فوراً للمورد؟')) {
      const res = erpEngine.awardSupplierQuote(quoteId, currentUser);
      refreshData();
      alert(`تمت الترسية بنجاح وتم إنشاء أمر الشراء الرسمي [${res.po.poCode}] تلقائياً!`);
    }
  };

  // ----------------------------------------------------
  // FILTERED DATA
  // ----------------------------------------------------
  const filteredInvoices = purchaseInvoices.filter((inv) => {
    if (invoiceStatusFilter !== 'all' && inv.paymentStatus !== invoiceStatusFilter) return false;
    if (invoiceSearch.trim()) {
      const q = invoiceSearch.toLowerCase();
      const matchCode = inv.invoiceCode.toLowerCase().includes(q);
      const matchVendorNum = inv.vendorInvoiceNumber.toLowerCase().includes(q);
      const matchSupName = inv.supplierName.toLowerCase().includes(q);
      const matchPo = inv.poCode?.toLowerCase().includes(q);
      if (!matchCode && !matchVendorNum && !matchSupName && !matchPo) return false;
    }
    return true;
  });

  const filteredSuppliers = suppliers.filter((sup) => {
    if (supplierCountryFilter !== 'all' && sup.country !== supplierCountryFilter) return false;
    if (supplierSearch.trim()) {
      const q = supplierSearch.toLowerCase();
      const matchName = sup.name.toLowerCase().includes(q);
      const matchTrade = sup.tradeNameEn?.toLowerCase().includes(q);
      const matchContact = sup.contactPerson.toLowerCase().includes(q);
      const matchPhone = sup.phone.toLowerCase().includes(q);
      const matchCode = sup.supplierCode.toLowerCase().includes(q);
      if (!matchName && !matchTrade && !matchContact && !matchPhone && !matchCode) return false;
    }
    return true;
  });

  // Calculate Metrics
  const totalInvoicedUsdEquivalent = purchaseInvoices.reduce((acc, inv) => {
    const rate = inv.currency === 'AED' ? 0.27 : inv.currency === 'CNY' ? 0.14 : inv.currency === 'SDG' ? 0.0004 : 1;
    return acc + inv.totalAmount * rate;
  }, 0);

  const totalPaidUsdEquivalent = purchaseInvoices.reduce((acc, inv) => {
    const rate = inv.currency === 'AED' ? 0.27 : inv.currency === 'CNY' ? 0.14 : inv.currency === 'SDG' ? 0.0004 : 1;
    return acc + (inv.paidAmount || 0) * rate;
  }, 0);

  const totalRemainingUsdEquivalent = Math.max(0, totalInvoicedUsdEquivalent - totalPaidUsdEquivalent);

  const handleExportSuppliers = () => {
    const headers = [
      'كود المورد',
      'اسم الشركة المصنعة',
      'الاسم التجاري بالإنجليزية',
      'الشخص المسؤول',
      'الدولة',
      'المدينة',
      'الهاتف',
      'الواتساب',
      'ويشات WeChat',
      'البريد الإلكتروني',
      'البنك المعتمد',
      'الآيبان IBAN',
      'الرقم الضريبي',
      'التقييم',
      'الحالة',
      'شروط الدفع والتسليم',
    ];
    const rows = filteredSuppliers.map((s) => [
      s.supplierCode,
      s.name,
      s.tradeNameEn || '',
      s.contactPerson,
      s.country,
      s.city,
      s.phone,
      s.whatsapp || '',
      s.wechat || '',
      s.email || '',
      s.bankName || '',
      s.bankIban || '',
      s.taxNumber || '',
      `${s.rating} نجوم`,
      s.status === 'verified' ? 'مصنع معتمد ومفحوص' : s.status === 'active' ? 'نشط' : 'قيد التدقيق',
      s.paymentTerms || '',
    ]);
    exportToCsv('SAHLA_Suppliers_Directory', headers, rows);
  };

  const handleExportInvoices = () => {
    const headers = [
      'رقم الفاتورة الداخلي',
      'رقم فاتورة المصنع الأصلية',
      'كود المورد',
      'اسم المورد / المصنع',
      'تاريخ الإصدار',
      'تاريخ الاستحقاق',
      'العملة',
      'إجمالي الفاتورة',
      'المبلغ المسدد',
      'المبلغ المتبقي',
      'حالة السداد',
      'شروط السداد',
    ];
    const rows = filteredInvoices.map((inv) => [
      inv.invoiceCode,
      inv.vendorInvoiceNumber || '',
      inv.supplierCode,
      inv.supplierName,
      inv.issueDate,
      inv.dueDate || '',
      inv.currency,
      inv.totalAmount,
      inv.paidAmount || 0,
      inv.remainingAmount || 0,
      inv.paymentStatus === 'paid' ? 'مسددة بالكامل' : inv.paymentStatus === 'partial' ? 'مسددة جزئياً' : 'غير مسددة',
      inv.paymentTerms || '',
    ]);
    exportToCsv('SAHLA_Purchase_Invoices_Register', headers, rows);
  };

  return (
    <div className="space-y-6 text-right font-['IBM_Plex_Sans_Arabic',sans-serif]">
      {/* Top Banner & Module Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#D99B00] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#D99B00]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                وحدة المشتريات والتوريد وفواتير الموردين
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                إدارة المصانع المعتمدة بالصين ودبي، إصدار وتتبع فواتير المشتريات (Vendor Bills)، وأوامر الشراء الرسمية (PO).
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setEditingSupplier(null);
              setShowNewSupplierModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-[#F5B800]" />
            <span>+ إضافة مورد / مصنع معتمد</span>
          </button>

          <button
            onClick={() => {
              setInvPoId('');
              setShowNewInvoiceModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#F5B800] hover:bg-[#E0A600] text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Receipt className="w-4 h-4" />
            <span>+ تسجيل فاتورة مشتريات (Bill)</span>
          </button>

          <button
            onClick={() => setShowNewPoModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-200"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span>+ أمر شراء (PO)</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي حجم فواتير المشتريات</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            ${Math.round(totalInvoicedUsdEquivalent).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span>عدد الفواتير: <b>{purchaseInvoices.length} فاتورة</b></span>
            <span>•</span>
            <span className="text-blue-600 font-semibold">مشتريات معتمدة</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي المسدد للموردين</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2 font-mono">
            ${Math.round(totalPaidUsdEquivalent).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 mt-1">
            <span>نسبة السداد: <b>{totalInvoicedUsdEquivalent > 0 ? Math.round((totalPaidUsdEquivalent / totalInvoicedUsdEquivalent) * 100) : 0}%</b></span>
            <span>•</span>
            <span>حوالات بنكية / دبي</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">المستحقات المتبقية للدفع للموردين</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#D99B00] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#D99B00] mt-2 font-mono">
            ${Math.round(totalRemainingUsdEquivalent).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span>دفعات مشروطة بوصول B/L والفحص</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">دليل المصانع والموردين</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {suppliers.length} موردين
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span className="text-purple-600 font-semibold">الصين 🇨🇳 • الإمارات 🇦🇪 • السعودية 🇸🇦</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveSubTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeSubTab === 'invoices'
              ? 'bg-[#F5B800] text-slate-950 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>فواتير المشتريات ومطالبات الموردين</span>
          <span className="px-1.5 py-0.5 rounded-md bg-black/10 text-[11px] font-mono">
            {purchaseInvoices.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeSubTab === 'suppliers'
              ? 'bg-[#F5B800] text-slate-950 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>دليل الموردين والمصانع المعتمدة</span>
          <span className="px-1.5 py-0.5 rounded-md bg-black/10 text-[11px] font-mono">
            {suppliers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('pos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeSubTab === 'pos'
              ? 'bg-[#F5B800] text-slate-950 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>أوامر الشراء الرسمية (PO)</span>
          <span className="px-1.5 py-0.5 rounded-md bg-black/10 text-[11px] font-mono">
            {purchaseOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('rfqs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeSubTab === 'rfqs'
              ? 'bg-[#F5B800] text-slate-950 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>مناقصات وعروض الأسعار (RFQ & Quotes)</span>
          <span className="px-1.5 py-0.5 rounded-md bg-black/10 text-[11px] font-mono">
            {rfqs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeSubTab === 'analytics'
              ? 'bg-[#F5B800] text-slate-950 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>تحليلات ومؤشرات المشتريات</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: PURCHASE INVOICES (فواتير المشتريات ومطالبات الموردين) */}
      {/* ========================================================================= */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filters & Search Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث بكود الفاتورة PINV، رقم فاتورة المصنع، اسم المورد..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 outline-hidden font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <span className="text-slate-500 font-bold shrink-0">حالة السداد:</span>
              <button
                onClick={() => setInvoiceStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  invoiceStatusFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل ({purchaseInvoices.length})
              </button>
              <button
                onClick={() => setInvoiceStatusFilter('unpaid')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  invoiceStatusFilter === 'unpaid'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                غير مسددة
              </button>
              <button
                onClick={() => setInvoiceStatusFilter('partial')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  invoiceStatusFilter === 'partial'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                مسددة جزئياً
              </button>
              <button
                onClick={() => setInvoiceStatusFilter('paid')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  invoiceStatusFilter === 'paid'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                مسددة بالكامل
              </button>

              <button
                onClick={handleExportInvoices}
                title="تصدير فواتير المشتريات إلى Excel / CSV مع دعم الترميز العربي"
                className="px-3 py-1.5 rounded-lg font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 shrink-0 transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>تصدير Excel</span>
              </button>
            </div>
          </div>

          {/* Invoices List / Table */}
          {filteredInvoices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="text-base font-bold text-slate-800">لا توجد فواتير مشتريات مطابقة للبحث</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                يمكنك تسجيل فاتورة مشتريات جديدة وربطها بالمورد أو أمر الشراء للبدء في تتبع المستحقات وسندات الصرف.
              </p>
              <button
                onClick={() => setShowNewInvoiceModal(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-[#F5B800] text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل أول فاتورة مشتريات</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">كود الفاتورة / مرجع المصنع</th>
                      <th className="p-3.5">المورد / المصنع</th>
                      <th className="p-3.5">الطلب المركزي / أمر الشراء</th>
                      <th className="p-3.5">تاريخ الفاتورة والاستحقاق</th>
                      <th className="p-3.5">قيمة الفاتورة</th>
                      <th className="p-3.5">المسدد</th>
                      <th className="p-3.5">المتبقي</th>
                      <th className="p-3.5 text-center">حالة السداد</th>
                      <th className="p-3.5 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.map((inv) => {
                      const isPaid = inv.paymentStatus === 'paid';
                      const isPartial = inv.paymentStatus === 'partial';
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Code & Vendor Bill # */}
                          <td className="p-3.5">
                            <div className="font-mono font-black text-slate-900 text-sm">{inv.invoiceCode}</div>
                            <div className="font-mono text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                              <span className="text-slate-400">فاتورة المصنع:</span>
                              <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                                {inv.vendorInvoiceNumber}
                              </span>
                            </div>
                          </td>

                          {/* Supplier Name & Code */}
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 text-sm">{inv.supplierName}</div>
                            <div className="text-slate-400 text-[11px] font-mono mt-0.5">{inv.supplierCode}</div>
                          </td>

                          {/* Request & PO */}
                          <td className="p-3.5">
                            <div className="font-mono font-bold text-blue-700">{inv.requestCode || 'REQ-DIRECT'}</div>
                            {inv.poCode && (
                              <div className="font-mono text-slate-500 text-[11px] mt-0.5">
                                امر الشراء: <b>{inv.poCode}</b>
                              </div>
                            )}
                          </td>

                          {/* Dates */}
                          <td className="p-3.5 text-slate-600">
                            <div>إصدار: <b>{inv.issueDate}</b></div>
                            <div className="text-[11px] text-slate-400 mt-0.5">استحقاق: {inv.dueDate}</div>
                          </td>

                          {/* Total Amount */}
                          <td className="p-3.5 font-mono font-black text-slate-900 text-sm">
                            {Number(inv.totalAmount).toLocaleString()} {inv.currency}
                          </td>

                          {/* Paid Amount */}
                          <td className="p-3.5 font-mono font-bold text-emerald-600">
                            {Number(inv.paidAmount || 0).toLocaleString()} {inv.currency}
                          </td>

                          {/* Remaining Amount */}
                          <td className="p-3.5 font-mono font-black text-amber-700">
                            {Number(inv.remainingAmount).toLocaleString()} {inv.currency}
                          </td>

                          {/* Status Badge */}
                          <td className="p-3.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                                isPaid
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isPartial
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {isPaid && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              {isPartial && <Clock className="w-3 h-3 text-amber-600" />}
                              {inv.paymentStatus === 'unpaid' && <AlertCircle className="w-3 h-3 text-red-600" />}
                              <span>
                                {isPaid ? 'مسددة بالكامل' : isPartial ? 'مسددة جزئياً' : 'غير مسددة'}
                              </span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* View Details */}
                              <button
                                onClick={() => setSelectedInvoiceDetails(inv)}
                                title="عرض تفاصيل الفاتورة والبنود"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Record Payment */}
                              {!isPaid && (
                                <button
                                  onClick={() => handleOpenRecordPayment(inv)}
                                  title="تسجيل سند صرف / دفعة مالية للمورد"
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>صرف دفعة</span>
                                </button>
                              )}

                              {/* Print Button */}
                              <button
                                onClick={() =>
                                  setPrintableDoc({
                                    type: 'purchase_invoice',
                                    data: inv,
                                  })
                                }
                                title="طباعة الفاتورة الرسمية بالترويسة المعتمدة"
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: SUPPLIERS DIRECTORY (دليل الموردين والمصانع المعتمدة) */}
      {/* ========================================================================= */}
      {activeSubTab === 'suppliers' && (
        <div className="space-y-4">
          {/* Supplier Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث باسم المصنع، جهة الاتصال، رقم الهاتف، أو كود المورد..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 outline-hidden font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <span className="text-slate-500 font-bold shrink-0">دولة المصنع:</span>
              <button
                onClick={() => setSupplierCountryFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  supplierCountryFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل ({suppliers.length})
              </button>
              <button
                onClick={() => setSupplierCountryFilter('الصين')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  supplierCountryFilter === 'الصين'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                الصين 🇨🇳
              </button>
              <button
                onClick={() => setSupplierCountryFilter('الإمارات')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  supplierCountryFilter === 'الإمارات'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                الإمارات 🇦🇪
              </button>
              <button
                onClick={() => setSupplierCountryFilter('السعودية')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  supplierCountryFilter === 'السعودية'
                    ? 'bg-green-700 text-white'
                    : 'bg-green-50 text-green-800 hover:bg-green-100'
                }`}
              >
                السعودية 🇸🇦
              </button>

              <button
                onClick={handleExportSuppliers}
                title="تصدير دليل الموردين والمصانع إلى Excel / CSV مع دعم الترميز العربي"
                className="px-3 py-1.5 rounded-lg font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 shrink-0 transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>تصدير Excel</span>
              </button>
            </div>
          </div>

          {/* Supplier Grid */}
          {filteredSuppliers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="text-base font-bold text-slate-800">لا يوجد موردون مسجلون حتى الآن</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                دليل الموردين والمصانع فارغ وجاهز لتسجيل الموردين المعتمدين في الصين، الإمارات، والسعودية.
              </p>
              <button
                onClick={() => {
                  setEditingSupplier(null);
                  setSupName('');
                  setSupTradeNameEn('');
                  setSupContact('');
                  setSupPhone('');
                  setSupWhatsapp('');
                  setSupWechat('');
                  setSupEmail('');
                  setSupAddress('');
                  setSupBankIban('');
                  setShowNewSupplierModal(true);
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-[#2563EB] text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-[#1D4ED8] transition-all"
              >
                <Plus className="w-4 h-4 text-[#F5B800]" />
                <span>+ تسجيل أول مورد / مصنع</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map((sup) => {
              const supInvoices = purchaseInvoices.filter((i) => i.supplierId === sup.id);
              const supPos = purchaseOrders.filter((p) => p.supplierId === sup.id);
              const totalSupInvoiced = supInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
              const totalSupPaid = supInvoices.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
              const totalSupRemaining = Math.max(0, totalSupInvoiced - totalSupPaid);

              return (
                <div
                  key={sup.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-all space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {sup.supplierCode}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            مورد معتمد ✓
                          </span>
                        </div>
                        <h3 className="font-black text-slate-900 text-base mt-1.5">{sup.name}</h3>
                        {sup.tradeNameEn && (
                          <div className="font-mono text-slate-400 text-xs">{sup.tradeNameEn}</div>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < (sup.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Location & Contact Info */}
                    <div className="p-3 rounded-xl bg-slate-50 space-y-1.5 text-xs text-slate-700 border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-900">{sup.country}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600 truncate">{sup.city}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500">المسؤول: <b>{sup.contactPerson}</b></span>
                        <span className="font-mono text-slate-700">{sup.phone}</span>
                      </div>
                      {sup.wechat && (
                        <div className="text-[11px] text-emerald-800 font-mono flex items-center gap-1">
                          <span className="text-slate-400">WeChat:</span>
                          <span className="font-bold">{sup.wechat}</span>
                        </div>
                      )}
                    </div>

                    {/* Categories Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {sup.categories?.map((cat, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>

                    {/* Financial Summary with this Supplier */}
                    <div className="p-2.5 rounded-xl bg-slate-900 text-white text-xs flex items-center justify-between font-mono">
                      <div>
                        <div className="text-[10px] text-slate-400 font-sans">إجمالي الفواتير:</div>
                        <div className="font-bold text-sm text-white">
                          {totalSupInvoiced.toLocaleString()} {supInvoices[0]?.currency || 'USD'}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] text-slate-400 font-sans">المتبقي له:</div>
                        <div className="font-bold text-sm text-[#F5B800]">
                          {totalSupRemaining.toLocaleString()} {supInvoices[0]?.currency || 'USD'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedSupplierProfile(sup)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ملف المورد</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setInvSupplierId(sup.id);
                          setShowNewInvoiceModal(true);
                        }}
                        title="إصدار فاتورة مشتريات لهذا المورد"
                        className="px-2.5 py-1.5 rounded-xl bg-[#F5B800] hover:bg-[#E0A600] text-slate-950 font-bold text-xs flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>+ فاتورة</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditSupplier(sup)}
                        title="تعديل بيانات المورد"
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: PURCHASE ORDERS (أوامر الشراء الرسمية PO) */}
      {/* ========================================================================= */}
      {activeSubTab === 'pos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h2 className="text-base font-black text-slate-900">سجل أوامر الشراء الرسمية للمصانع (Purchase Orders)</h2>
              <p className="text-xs text-slate-500">أوامر التوريد المعتمدة والموجهة للمصانع الخارجية، مع إمكانية تحويل أي PO إلى فاتورة مشتريات بضغطة واحدة.</p>
            </div>
            <button
              onClick={() => setShowNewPoModal(true)}
              className="px-4 py-2 rounded-xl bg-[#F5B800] text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ إصدار أمر شراء جديد</span>
            </button>
          </div>

          {purchaseOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="text-base font-bold text-slate-800">لا توجد أوامر شراء صادرة حتى الآن</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                سجل أوامر الشراء (Purchase Orders) فارغ. يمكنك إنشاء أمر شراء رسمي جديد وتوجيهه للمصنع عند اعتماد مواصفات البضاعة.
              </p>
              <button
                onClick={() => setShowNewPoModal(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-[#F5B800] text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>+ إصدار أول أمر شراء رسمي</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">رقم أمر الشراء</th>
                    <th className="p-3.5">المورد / المصنع</th>
                    <th className="p-3.5">الطلب المركزي</th>
                    <th className="p-3.5">بيان وتفاصيل البضاعة</th>
                    <th className="p-3.5">القيمة الإجمالية</th>
                    <th className="p-3.5">شروط السداد</th>
                    <th className="p-3.5 text-center">الحالة</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-mono font-black text-slate-900 text-sm">{po.poCode}</td>
                      <td className="p-3.5 font-bold text-slate-900">{po.supplierName}</td>
                      <td className="p-3.5 font-mono font-bold text-blue-700">{po.requestCode}</td>
                      <td className="p-3.5 font-medium text-slate-800 max-w-xs truncate">{po.itemsSummary}</td>
                      <td className="p-3.5 font-mono font-black text-slate-900 text-sm">
                        {Number(po.totalAmount).toLocaleString()} {po.currency}
                      </td>
                      <td className="p-3.5 text-slate-600 text-[11px]">{po.paymentTerms}</td>
                      <td className="p-3.5 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                          {po.status === 'issued' ? 'صادر للمصنع' : po.status === 'approved' ? 'معتمد' : po.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Convert to Bill */}
                          <button
                            onClick={() => handleConvertPoToInvoice(po)}
                            className="px-2 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-600 shadow-xs"
                            title="تحويل أمر الشراء إلى فاتورة مشتريات رسمية"
                          >
                            تحويل لفاتورة
                          </button>

                          {/* Print PO */}
                          <button
                            onClick={() =>
                              setPrintableDoc({
                                type: 'purchase_order',
                                data: po,
                              })
                            }
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                            title="طباعة أمر الشراء"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: RFQS & QUOTES (طلبات عروض الأسعار) */}
      {/* ========================================================================= */}
      {activeSubTab === 'rfqs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h2 className="text-base font-black text-slate-900">طلبات عروض الأسعار والمناقصات (RFQ & Supplier Quotes)</h2>
              <p className="text-xs text-slate-500">طرح مناقصات التوريد على مصانع الصين ومقارنة الأسعار وترسية العطاء الأفضل مع توليد أمر الشراء تلقائياً.</p>
            </div>
            <button
              onClick={() => setShowNewRfqModal(true)}
              className="px-4 py-2 rounded-xl bg-[#F5B800] text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ طرح مناقصة جديدة (RFQ)</span>
            </button>
          </div>

          <div className="space-y-4">
            {rfqs.map((rfq) => {
              const rfqQuotes = quotes.filter((q) => q.rfqId === rfq.id);
              return (
                <div key={rfq.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs">
                          {rfq.rfqCode}
                        </span>
                        <span className="font-mono text-blue-700 font-bold text-xs">{rfq.requestCode}</span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-slate-600 text-xs">العميل: {rfq.customerName}</span>
                      </div>
                      <h3 className="font-black text-slate-900 text-base mt-1">{rfq.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedRfqForQuote(rfq);
                          setShowAddQuoteModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#F5B800]" />
                        <span>تسجيل عرض سعر مصنع</span>
                      </button>
                    </div>
                  </div>

                  {/* Quotes received for this RFQ */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 mb-2">عروض الأسعار المستلمة من المصانع ({rfqQuotes.length}):</h4>
                    {rfqQuotes.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 text-slate-400 text-xs text-center">
                        بانتظار تلقي عروض الأسعار من الموردين المدعوين...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {rfqQuotes.map((q) => (
                          <div
                            key={q.id}
                            className={`p-4 rounded-xl border text-xs space-y-2 ${
                              q.isAwarded
                                ? 'border-emerald-300 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                                : 'border-slate-200 bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-900">{q.supplierName}</span>
                              {q.isAwarded && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1">
                                  <Award className="w-3 h-3" />
                                  <span>تمت الترسية</span>
                                </span>
                              )}
                            </div>
                            <div className="text-base font-black font-mono text-slate-900">
                              {Number(q.totalAmount).toLocaleString()} {q.currency}
                            </div>
                            <div className="text-slate-600 text-[11px] space-y-1">
                              <div>مدة التصنيع: <b>{q.deliveryLeadDays} يوم</b></div>
                              <div>الضمان الفني: <b>{q.warrantyMonths} شهراً</b></div>
                              <div>شروط السداد: <b>{q.paymentTerms}</b></div>
                            </div>
                            {!q.isAwarded && (
                              <button
                                onClick={() => handleAwardQuote(q.id)}
                                className="w-full mt-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                              >
                                ترسية العطاء وإصدار أمر الشراء (PO)
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: ANALYTICS (تحليلات المشتريات) */}
      {/* ========================================================================= */}
      {activeSubTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="font-black text-slate-900 text-base">توزيع فواتير المشتريات حسب الموردين</h3>
            <div className="space-y-3">
              {suppliers.map((sup) => {
                const supInvoices = purchaseInvoices.filter((i) => i.supplierId === sup.id);
                const sum = supInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
                const pct = totalInvoicedUsdEquivalent > 0 ? Math.round((sum / totalInvoicedUsdEquivalent) * 100) : 0;
                return (
                  <div key={sup.id} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span>{sup.name} ({sup.country})</span>
                      <span className="font-mono">{sum.toLocaleString()} USD ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-[#F5B800] rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="font-black text-slate-900 text-base">الالتزام المالي مع الموردين ومواعيد الاستحقاق</h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">إجمالي الفواتير المعتمدة المسجلة:</span>
                <span className="font-mono font-bold text-slate-900">{purchaseInvoices.length} فواتير</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">فواتير مسددة بالكامل (Settled):</span>
                <span className="font-mono font-bold text-emerald-600">
                  {purchaseInvoices.filter((i) => i.paymentStatus === 'paid').length} فواتير
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">فواتير تحت التسوية الجزئية:</span>
                <span className="font-mono font-bold text-amber-600">
                  {purchaseInvoices.filter((i) => i.paymentStatus === 'partial').length} فواتير
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">فواتير بانتظار سداد الدفعة المقدمة:</span>
                <span className="font-mono font-bold text-red-600">
                  {purchaseInvoices.filter((i) => i.paymentStatus === 'unpaid').length} فواتير
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: NEW PURCHASE INVOICE (تسجيل فاتورة مشتريات مورد) */}
      {/* ========================================================================= */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full text-right shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#F5B800]" />
                <h3 className="font-black text-base sm:text-lg">تسجيل فاتورة مشتريات وتوريد جديدة (Vendor Bill)</h3>
              </div>
              <button
                onClick={() => setShowNewInvoiceModal(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchaseInvoice} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Supplier Selection */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المورد / المصنع المعتمد: *</label>
                  <select
                    value={invSupplierId}
                    onChange={(e) => setInvSupplierId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:bg-white outline-hidden"
                    required
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.country}) - {s.supplierCode}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Link to Purchase Order (Optional) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ربط بأمر الشراء PO (اختياري):</label>
                  <select
                    value={invPoId}
                    onChange={(e) => handleSelectPoForInvoice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono focus:bg-white outline-hidden"
                  >
                    <option value="">بدون أمر شراء (فاتورة توريد مباشرة)</option>
                    {purchaseOrders.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.poCode} - {p.supplierName} ({p.totalAmount} {p.currency})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vendor Invoice Number */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم فاتورة المصنع الأصلية: *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: FS-INV-2026-881 أو GZ-BILL-9901"
                    value={invVendorInvoiceNum}
                    onChange={(e) => setInvVendorInvoiceNum(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-hidden font-mono font-bold"
                  />
                </div>

                {/* Link to Central Request */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الطلب المركزي المرتبط (REQ):</label>
                  <select
                    value={invRequestId}
                    onChange={(e) => setInvRequestId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono focus:bg-white outline-hidden"
                  >
                    {requests.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.requestCode} - {r.customerName} ({r.title})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Currency */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">عملة الفاتورة: *</label>
                  <select
                    value={invCurrency}
                    onChange={(e) => setInvCurrency(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold outline-hidden"
                  >
                    <option value="USD">USD - دولار أمريكي</option>
                    <option value="CNY">CNY - يوان صيني (RMB)</option>
                    <option value="AED">AED - درهم إماراتي</option>
                    <option value="SAR">SAR - ريال سعودي</option>
                    <option value="SDG">SDG - جنيه سوداني</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الاستحقاق النهائي: *</label>
                  <input
                    type="date"
                    required
                    value={invDueDate}
                    onChange={(e) => setInvDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono outline-hidden"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">بنود وأصناف الفاتورة:</span>
                  <button
                    type="button"
                    onClick={handleAddItemToInvoice}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة بند صنف</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2">بيان الصنف والمواصفات</th>
                        <th className="p-2 w-24">الكمية</th>
                        <th className="p-2 w-28">سعر الوحدة ({invCurrency})</th>
                        <th className="p-2 w-28">الإجمالي</th>
                        <th className="p-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invItems.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              placeholder="اسم الصنف أو التجهيز..."
                              value={item.description}
                              onChange={(e) => handleUpdateInvoiceItem(idx, 'description', e.target.value)}
                              className="w-full p-1.5 rounded-lg border border-slate-200"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateInvoiceItem(idx, 'quantity', Number(e.target.value))}
                              className="w-full p-1.5 rounded-lg border border-slate-200 font-mono text-center"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateInvoiceItem(idx, 'unitPrice', Number(e.target.value))}
                              className="w-full p-1.5 rounded-lg border border-slate-200 font-mono text-left"
                            />
                          </td>
                          <td className="p-2 font-mono font-bold text-slate-900 text-left">
                            {Number(item.totalPrice).toLocaleString()} {invCurrency}
                          </td>
                          <td className="p-2 text-center">
                            {invItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveInvoiceItem(idx)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end p-2 text-sm font-black text-slate-900">
                  <span>إجمالي الفاتورة: </span>
                  <span className="font-mono text-amber-700 mr-2">
                    {invoiceSubtotal.toLocaleString()} {invCurrency}
                  </span>
                </div>
              </div>

              {/* Advance Payment Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block">هل تم سداد دفعة مقدمة للمورد عند إصدار الفاتورة؟</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">المبلغ المسدد مقدماً:</label>
                    <input
                      type="number"
                      min="0"
                      max={invoiceSubtotal}
                      value={invInitialPaid}
                      onChange={(e) => setInvInitialPaid(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">طريقة السداد:</label>
                    <select
                      value={invInitialPaymentMethod}
                      onChange={(e) => setInvInitialPaymentMethod(e.target.value as any)}
                      className="w-full p-2 rounded-lg border border-slate-200"
                    >
                      <option value="bank_wire">حوالة سويفت خارجية (SWIFT Wire)</option>
                      <option value="dubai_account">حساب بنك الإمارات دبي الوطني</option>
                      <option value="alipay_wechat">علي باي / وي تشات (الصين)</option>
                      <option value="cash">نقداً بالمصنع / كاش</option>
                      <option value="bankak">تطبيق بنكك (سودان)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">رقم المرجع / الحوالة:</label>
                    <input
                      type="text"
                      placeholder="SWIFT-REF-9920"
                      value={invInitialReference}
                      onChange={(e) => setInvInitialReference(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">شروط الدفع وملاحظات الفاتورة:</label>
                <textarea
                  rows={2}
                  value={invPaymentTerms}
                  onChange={(e) => setInvPaymentTerms(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#F5B800] hover:bg-[#E0A600] text-slate-950 font-black flex items-center gap-1.5 shadow-sm"
                >
                  <Receipt className="w-4 h-4" />
                  <span>اعتماد وتسجيل الفاتورة في النظام</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NEW / EDIT SUPPLIER (إضافة / تعديل مورد معتمد) */}
      {/* ========================================================================= */}
      {showNewSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full text-right shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#F5B800]" />
                <h3 className="font-black text-base sm:text-lg">
                  {editingSupplier ? `تعديل بيانات المورد [${editingSupplier.supplierCode}]` : 'إضافة مورد / مصنع معتمد جديد في الصين أو الخليج'}
                </h3>
              </div>
              <button
                onClick={() => setShowNewSupplierModal(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المصنع / الشركة (بالعربية): *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شركة فوشان للمعدات الكهربائية"
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-hidden font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الاسم التجاري بالإنجليزية:</label>
                  <input
                    type="text"
                    placeholder="e.g. Foshan SunPower Electronics Ltd."
                    value={supTradeNameEn}
                    onChange={(e) => setSupTradeNameEn(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الدولة: *</label>
                  <select
                    value={supCountry}
                    onChange={(e) => setSupCountry(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  >
                    <option value="الصين">الصين 🇨🇳 (China)</option>
                    <option value="الإمارات">الإمارات 🇦🇪 (UAE)</option>
                    <option value="السعودية">السعودية 🇸🇦 (Saudi Arabia)</option>
                    <option value="تركيا">تركيا 🇹🇷 (Turkey)</option>
                    <option value="الهند">الهند 🇮🇳 (India)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المدينة / المقاطعة: *</label>
                  <input
                    type="text"
                    required
                    placeholder="فوشان / قوانغتشو / شنتشن / دبي"
                    value={supCity}
                    onChange={(e) => setSupCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الشخص المسؤول (Contact Person):</label>
                  <input
                    type="text"
                    placeholder="Mr. Zhang / أ. أحمد"
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف / الاتصال الدولي: *</label>
                  <input
                    type="text"
                    required
                    placeholder="+86 138 0000 1111"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">حساب WeChat (مهم لمصانع الصين):</label>
                  <input
                    type="text"
                    placeholder="WeChat ID"
                    value={supWechat}
                    onChange={(e) => setSupWechat(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">واتساب المورد:</label>
                  <input
                    type="text"
                    placeholder="+86 138..."
                    value={supWhatsapp}
                    onChange={(e) => setSupWhatsapp(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني:</label>
                  <input
                    type="email"
                    placeholder="sales@factory-cn.com"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تقييم المورد (1 - 5 نجوم):</label>
                  <select
                    value={supRating}
                    onChange={(e) => setSupRating(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ ممتاز ومجرب (5 نجوم)</option>
                    <option value="4">⭐⭐⭐⭐ جيد جداً (4 نجوم)</option>
                    <option value="3">⭐⭐⭐ متوسط (3 نجوم)</option>
                  </select>
                </div>
              </div>

              {/* Bank Information */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block">البيانات المصرفية للمورد (للحوالات والمدفوعات):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-0.5">اسم البنك المعتمد:</label>
                    <input
                      type="text"
                      placeholder="Bank of China / ICBC / Emirates NBD"
                      value={supBankName}
                      onChange={(e) => setSupBankName(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-0.5">رقم الحساب / IBAN / SWIFT:</label>
                    <input
                      type="text"
                      placeholder="CN04 0104..."
                      value={supBankIban}
                      onChange={(e) => setSupBankIban(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">مجالات التوريد والتصنيع (مفصولة بفواصل):</label>
                <input
                  type="text"
                  placeholder="طاقة شمسية، إلكترونيات، محولات، معدات ثقيلة"
                  value={supCategories}
                  onChange={(e) => setSupCategories(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewSupplierModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Building2 className="w-4 h-4 text-[#F5B800]" />
                  <span>{editingSupplier ? 'حفظ التعديلات' : 'إضافة المورد إلى قاعدة البيانات'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD VENDOR PAYMENT (تسجيل سند صرف ودفعة للمورد) */}
      {/* ========================================================================= */}
      {showRecordPaymentModal && selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full text-right shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-base sm:text-lg">قيد سند صرف ودفعة مالية للمورد</h3>
              </div>
              <button
                onClick={() => setShowRecordPaymentModal(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitVendorPayment} className="p-6 space-y-4 text-xs">
              {/* Summary Banner */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">فاتورة المورد:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedInvoiceForPayment.invoiceCode} ({selectedInvoiceForPayment.vendorInvoiceNumber})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">المورد المستفيد:</span>
                  <span className="font-bold text-slate-900">{selectedInvoiceForPayment.supplierName}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5 text-sm">
                  <span className="font-bold text-slate-700">الرصيد المتبقي المستحق:</span>
                  <span className="font-mono font-black text-amber-700">
                    {selectedInvoiceForPayment.remainingAmount.toLocaleString()} {selectedInvoiceForPayment.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">مبلغ الدفعة المراد سدادها الآن: *</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={selectedInvoiceForPayment.remainingAmount}
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-black text-base text-emerald-700 outline-hidden focus:bg-white"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    {selectedInvoiceForPayment.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">طريقة السداد والتحويل: *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="bank_wire">حوالة سويفت خارجية دولية (SWIFT Wire)</option>
                  <option value="dubai_account">تحويل من حساب شركة سهلا بدبي (ENBD Dubai)</option>
                  <option value="alipay_wechat">علي باي / وي تشات باي (Alipay/WeChat)</option>
                  <option value="cash">نقداً واستلام بمستودع الصين / كاش</option>
                  <option value="bankak">تطبيق بنكك (سداد داخلي)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الحوالة / السند المرجعي (Reference No): *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: SWIFT-BOK-2026-9912 أو ENBD-TRF-098231"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات السداد:</label>
                <textarea
                  rows={2}
                  placeholder="دفعة استكمال الحساب عند استلام بوليصة الشحن..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRecordPaymentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد وقيد سند الصرف</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER / MODAL: INVOICE DETAILS 360° */}
      {/* ========================================================================= */}
      {selectedInvoiceDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full text-right shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#F5B800]" />
                <div>
                  <h3 className="font-black text-base sm:text-lg">
                    تفاصيل فاتورة المشتريات {selectedInvoiceDetails.invoiceCode}
                  </h3>
                  <div className="text-slate-400 text-xs font-mono">
                    فاتورة المصنع: {selectedInvoiceDetails.vendorInvoiceNumber}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoiceDetails(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Top Details Card */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block mb-0.5">المورد / المصنع:</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedInvoiceDetails.supplierName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">الطلب المركزي المرتبط:</span>
                  <span className="font-mono font-bold text-blue-700">{selectedInvoiceDetails.requestCode || 'بدون طلب'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">تاريخ الإصدار:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedInvoiceDetails.issueDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">تاريخ الاستحقاق:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedInvoiceDetails.dueDate}</span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <span className="font-bold text-slate-800 block mb-1.5">الأصناف والتجهيزات:</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-600">
                      <tr>
                        <th className="p-2">الصنف</th>
                        <th className="p-2 text-center">الكمية</th>
                        <th className="p-2 text-left">السعر</th>
                        <th className="p-2 text-left">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoiceDetails.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium">{item.description}</td>
                          <td className="p-2 text-center font-mono">{item.quantity} {item.unit}</td>
                          <td className="p-2 text-left font-mono">{Number(item.unitPrice).toLocaleString()}</td>
                          <td className="p-2 text-left font-mono font-bold">{Number(item.totalPrice).toLocaleString()} {selectedInvoiceDetails.currency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Box */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">الإجمالي:</span>
                  <span className="font-mono font-bold text-base">
                    {selectedInvoiceDetails.totalAmount.toLocaleString()} {selectedInvoiceDetails.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400">المسدد:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {(selectedInvoiceDetails.paidAmount || 0).toLocaleString()} {selectedInvoiceDetails.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800 pt-2 font-black text-sm">
                  <span className="text-[#F5B800]">المتبقي:</span>
                  <span className="font-mono text-xl text-[#F5B800]">
                    {selectedInvoiceDetails.remainingAmount.toLocaleString()} {selectedInvoiceDetails.currency}
                  </span>
                </div>
              </div>

              {/* Payments History */}
              {selectedInvoiceDetails.payments && selectedInvoiceDetails.payments.length > 0 && (
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                  <span className="font-bold text-emerald-950 block">سجل الدفعات المسددة للمورد:</span>
                  <div className="divide-y divide-emerald-200/60">
                    {selectedInvoiceDetails.payments.map((p) => (
                      <div key={p.id} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-mono font-bold text-emerald-900">{p.paymentCode}</div>
                          <div className="text-[11px] text-emerald-700">مرجع: {p.referenceNumber} • {p.paymentMethod}</div>
                        </div>
                        <div className="font-mono font-black text-emerald-950 text-sm">
                          {Number(p.amount).toLocaleString()} {p.currency}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() =>
                    setPrintableDoc({
                      type: 'purchase_invoice',
                      data: selectedInvoiceDetails,
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-[#F5B800] text-slate-950 font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الفاتورة الرسمية</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: SUPPLIER PROFILE 360° */}
      {/* ========================================================================= */}
      {selectedSupplierProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full text-right shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#F5B800]" />
                <div>
                  <h3 className="font-black text-base sm:text-lg">{selectedSupplierProfile.name}</h3>
                  <div className="text-slate-400 text-xs font-mono">{selectedSupplierProfile.supplierCode}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedSupplierProfile(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block mb-0.5">الدولة والمدينة:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedSupplierProfile.country} - {selectedSupplierProfile.city}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">الشخص المسؤول:</span>
                  <span className="font-bold text-slate-900">{selectedSupplierProfile.contactPerson}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">رقم الهاتف:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedSupplierProfile.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">WeChat:</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedSupplierProfile.wechat || 'غير متوفر'}</span>
                </div>
              </div>

              {/* Bank Details */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 block">البيانات المصرفية للمورد:</span>
                <div className="text-slate-600">
                  البنك: <b>{selectedSupplierProfile.bankName || 'Bank of China'}</b>
                </div>
                <div className="font-mono text-slate-700">
                  الحساب / IBAN: <b>{selectedSupplierProfile.bankIban || 'CN04 0104 0000 8921 4458 901'}</b>
                </div>
              </div>

              {/* POs and Bills with this Supplier */}
              <div>
                <span className="font-bold text-slate-800 block mb-2">فواتير المشتريات المرتبطة بهذا المورد:</span>
                <div className="space-y-2">
                  {purchaseInvoices
                    .filter((i) => i.supplierId === selectedSupplierProfile.id)
                    .map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-mono font-bold text-slate-900">{inv.invoiceCode}</div>
                          <div className="text-[11px] text-slate-500">فاتورة المصنع: {inv.vendorInvoiceNumber}</div>
                        </div>
                        <div className="text-left font-mono">
                          <div className="font-bold text-slate-900">{inv.totalAmount.toLocaleString()} {inv.currency}</div>
                          <div className={`text-[11px] font-bold ${inv.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-700'}`}>
                            {inv.paymentStatus === 'paid' ? 'مسددة' : `متبقي: ${inv.remainingAmount.toLocaleString()}`}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: NEW PURCHASE ORDER (PO) */}
      {/* ========================================================================= */}
      {showNewPoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full text-right shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#F5B800]" />
                <h3 className="font-black text-base sm:text-lg">إصدار أمر شراء رسمي جديد للمصنع (PO)</h3>
              </div>
              <button
                onClick={() => setShowNewPoModal(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الطلب المركزي المرتبط (REQ):</label>
                <select
                  value={poRequestId}
                  onChange={(e) => setPoRequestId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                >
                  {requests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.requestCode} - {r.customerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المورد / المصنع المعتمد:</label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.country})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">القيمة الإجمالية:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={poAmount}
                    onChange={(e) => setPoAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">العملة:</label>
                  <select
                    value={poCurrency}
                    onChange={(e) => setPoCurrency(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  >
                    <option value="USD">USD - دولار أمريكي</option>
                    <option value="CNY">CNY - يوان صيني</option>
                    <option value="AED">AED - درهم إماراتي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">بيان وتفاصيل البضاعة المطلوبة:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="مواصفات البضاعة والكميات..."
                  value={poItemsSummary}
                  onChange={(e) => setPoItemsSummary(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">شروط السداد والدفع:</label>
                <input
                  type="text"
                  value={poPaymentTerms}
                  onChange={(e) => setPoPaymentTerms(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewPoModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#F5B800] hover:bg-[#E0A600] text-slate-950 font-black flex items-center gap-1.5 shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>إصدار أمر الشراء واعتماده</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: NEW RFQ */}
      {/* ========================================================================= */}
      {showNewRfqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full text-right shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#F5B800]" />
                <h3 className="font-black text-base sm:text-lg">طرح مناقصة وطلب تسعير (RFQ)</h3>
              </div>
              <button
                onClick={() => setShowNewRfqModal(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRfq} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الطلب المركزي المرتبط:</label>
                <select
                  value={rfqRequestId}
                  onChange={(e) => setRfqRequestId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                >
                  {requests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.requestCode} - {r.customerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان المناقصة:</label>
                <input
                  type="text"
                  required
                  placeholder="طلب عروض أسعار لتوريد منظومات طاقة شمسية"
                  value={rfqTitle}
                  onChange={(e) => setRfqTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم الصنف المطلوب:</label>
                  <input
                    type="text"
                    required
                    placeholder="ألواح 550W مونو"
                    value={rfqItemName}
                    onChange={(e) => setRfqItemName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الكمية المستهدفة:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rfqItemQty}
                    onChange={(e) => setRfqItemQty(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ميناء الوصول المستهدف:</label>
                <input
                  type="text"
                  value={rfqPort}
                  onChange={(e) => setRfqPort(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewRfqModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#F5B800] hover:bg-[#E0A600] text-slate-950 font-black flex items-center gap-1.5 shadow-sm"
                >
                  <Tag className="w-4 h-4" />
                  <span>طرح المناقصة وإرسالها للموردين</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: ADD QUOTE TO RFQ */}
      {/* ========================================================================= */}
      {showAddQuoteModal && selectedRfqForQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full text-right shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#F5B800]" />
                <h3 className="font-black text-base sm:text-lg">
                  تسجيل عرض سعر مورد للمناقصة {selectedRfqForQuote.rfqCode}
                </h3>
              </div>
              <button
                onClick={() => setShowAddQuoteModal(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuote} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">المورد مقدم العرض: *</label>
                <select
                  value={quoteSupplierId}
                  onChange={(e) => setQuoteSupplierId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.country})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">قيمة العرض الإجمالية:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">العملة:</label>
                  <select
                    value={quoteCurrency}
                    onChange={(e) => setQuoteCurrency(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  >
                    <option value="USD">USD</option>
                    <option value="CNY">CNY</option>
                    <option value="AED">AED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">مدة التصنيع والتجهيز (بالأيام):</label>
                  <input
                    type="number"
                    min="1"
                    value={quoteLeadDays}
                    onChange={(e) => setQuoteLeadDays(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">مدة الضمان الفني (بالشهور):</label>
                  <input
                    type="number"
                    min="0"
                    value={quoteWarranty}
                    onChange={(e) => setQuoteWarranty(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">شروط الدفع المقترحة:</label>
                <input
                  type="text"
                  value={quotePayment}
                  onChange={(e) => setQuotePayment(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddQuoteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#F5B800]" />
                  <span>تسجيل العرض في المناقصة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DOCUMENT PRINT MODAL */}
      {/* ========================================================================= */}
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
