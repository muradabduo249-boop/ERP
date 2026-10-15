import React from 'react';
import {
  Printer,
  X,
  FileCheck2,
  Download,
  Building2,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Logo } from '../../components/Logo';

export type PrintableDocType =
  | 'purchase_order'
  | 'purchase_invoice'
  | 'payment'
  | 'receipt'
  | 'invoice'
  | 'delivery_pod'
  | 'inspection_report'
  | 'shipping_waybill';

interface ErpDocumentPrintModalProps {
  docType: PrintableDocType;
  data: any;
  onClose: () => void;
  isOpen?: boolean;
}

export const ErpDocumentPrintModal: React.FC<ErpDocumentPrintModalProps> = ({
  docType,
  data,
  onClose,
  isOpen,
}) => {
  if (isOpen === false) return null;
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in-50">
      <div className="bg-white rounded-3xl max-w-3xl w-full text-right shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Top Action Bar (hidden in print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#F5B800] hover:bg-[#E0A600] text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة المستند الرسمي (Print / PDF)</span>
            </button>
            <span className="text-xs text-slate-400 hidden sm:inline">
              معاينة الطباعة بالترويسة الرسمية المعتمدة لشركة سهلا
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Document Paper */}
        <div className="p-6 sm:p-10 overflow-y-auto font-['IBM_Plex_Sans_Arabic',sans-serif] text-slate-900 bg-white print:p-0 print:m-0 space-y-6">
          {/* Official Letterhead Header */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Logo size="md" variant="light" />
              <div className="text-xs font-bold text-slate-700 mt-2">
                شركة سهلا للتجارة الدولية والخدمات اللوجستية المحدودة
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                SAHLA International Trade & Logistics Co. Ltd.
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                بورتسودان - السودان | دبي - الإمارات | كوانزو / فوشان - الصين
              </div>
            </div>

            <div className="text-left sm:text-left self-end sm:self-auto">
              <div className="inline-block px-3 py-1 rounded-lg bg-slate-100 border border-slate-300 font-mono font-black text-sm text-slate-900">
                {docType === 'purchase_order' && `PO: ${data.poCode || 'PO-2026-0001'}`}
                {docType === 'purchase_invoice' && `PINV: ${data.invoiceCode || 'PINV-2026-0101'}`}
                {docType === 'receipt' && `REC: ${data.receiptCode || 'REC-2026-0001'}`}
                {docType === 'invoice' && `INV: ${data.invoiceCode || 'INV-2026-0001'}`}
                {docType === 'delivery_pod' && `POD: ${data.podCode || 'POD-2026-0001'}`}
                {docType === 'inspection_report' && `QC: ${data.inspectionCode || 'QC-2026-0001'}`}
                {docType === 'shipping_waybill' && `SHP: ${data.shipmentCode || 'SHP-2026-0001'}`}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                التاريخ: {new Date(data.createdAt || Date.now()).toLocaleDateString('ar-SD')}
              </div>
              <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>مستند إلكتروني معتمد رسمياً</span>
              </div>
            </div>
          </div>

          {/* Document Title Banner */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              {docType === 'purchase_order' && 'أمر شراء وتوريد رسمي للمصنع (Purchase Order)'}
              {docType === 'purchase_invoice' && 'فاتورة ومطالبة مشتريات مورد (Vendor Purchase Bill)'}
              {docType === 'payment' && 'سند صرف ودفع مالي معتمد (Official Payment Voucher)'}
              {docType === 'receipt' && 'سند قبض وتحصيل مالي رسمي (Official Payment Receipt)'}
              {docType === 'invoice' && 'فاتورة ومطالبة خدمات تجارية (Commercial Invoice)'}
              {docType === 'delivery_pod' && 'سند تسليم نهائي للبضاعة (Proof of Delivery POD)'}
              {docType === 'inspection_report' && 'تقرير فحص الجودة والمطابقة الفنية بالصين (QC Inspection Report)'}
              {docType === 'shipping_waybill' && 'بيان الشحن ومانيفست البوليصة البحرية (Shipping Manifest)'}
            </h2>
            <span className="font-mono text-slate-500 text-[11px]">
              الطلب: {data.requestCode || 'REQ-CENTRAL'}
            </span>
          </div>

          {/* Case 1: Purchase Order Body */}
          {docType === 'purchase_order' && (
            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div>
                  <div className="text-slate-400 font-bold mb-1">بيانات المورد / المصنع:</div>
                  <div className="font-bold text-slate-900 text-sm">{data.supplierName}</div>
                  <div className="text-slate-600 mt-0.5">المورد المعتمد لدى سهلا</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold mb-1">الجهة الطالبة (المشتري):</div>
                  <div className="font-bold text-slate-900 text-sm">شركة سهلا للتجارة الدولية المحدودة</div>
                  <div className="text-slate-600 mt-0.5">المقر: السودان / دبي</div>
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-700 mb-2">بيان وتفاصيل المواد المطلوبة:</div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="font-bold text-slate-900">{data.itemsSummary}</div>
                  <div className="text-slate-500 text-[11px]">
                    المواصفات معتمدة حسب الكتالوج الفني وتقارير الجودة المتفق عليها.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div>
                  <div className="text-slate-400 font-bold mb-1">شروط الدفع المتفق عليها:</div>
                  <div className="font-medium text-slate-800">{data.paymentTerms || '30% مقدم، 70% عند صدور B/L'}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold mb-1">تاريخ التسليم بالمصنع:</div>
                  <div className="font-mono font-bold text-slate-800">{data.deliveryDate || 'خلال 20 يوم عمل'}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                <span className="font-bold text-sm">إجمالي قيمة أمر الشراء (Total Amount):</span>
                <span className="font-mono font-black text-xl text-[#F5B800]">
                  {Number(data.totalAmount).toLocaleString()} {data.currency || 'USD'}
                </span>
              </div>
            </div>
          )}

          {/* Case 1.5: Purchase Invoice Body (Vendor Bill) */}
          {docType === 'purchase_invoice' && (
            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div>
                  <div className="text-slate-400 font-bold mb-1">المورد / المصنع:</div>
                  <div className="font-bold text-slate-900 text-sm">{data.supplierName}</div>
                  <div className="font-mono text-slate-500 text-[11px] mt-0.5">{data.supplierCode}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold mb-1">رقم فاتورة المورد الأصلية:</div>
                  <div className="font-mono font-black text-amber-700 text-sm">
                    {data.vendorInvoiceNumber || 'BILL-DIRECT'}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    أمر الشراء: {data.poCode || 'بدون PO مباشر'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold mb-1">تاريخ الاستحقاق:</div>
                  <div className="font-mono font-bold text-slate-900 text-sm">{data.dueDate || 'عند الاستلام'}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    شروط السداد: {data.paymentTerms}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">بيان الصنف والمواصفات</th>
                      <th className="p-2.5 text-center">الكمية</th>
                      <th className="p-2.5 text-left">سعر الوحدة</th>
                      <th className="p-2.5 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.items && data.items.length > 0 ? (
                      data.items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2.5 font-medium text-slate-800">{item.description}</td>
                          <td className="p-2.5 text-center font-mono font-bold">{item.quantity} {item.unit || ''}</td>
                          <td className="p-2.5 text-left font-mono font-medium">{Number(item.unitPrice).toLocaleString()} {data.currency}</td>
                          <td className="p-2.5 text-left font-mono font-bold text-slate-900">{Number(item.totalPrice).toLocaleString()} {data.currency}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">
                          توريد بضاعة بموجب الفاتورة الرسمية الصادرة من المورد
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>المبلغ الإجمالي للفاتورة (Total Invoiced):</span>
                  <span className="font-mono font-bold text-base text-white">
                    {Number(data.totalAmount).toLocaleString()} {data.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>المبالغ المسددة للمورد (Paid Amount):</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {Number(data.paidAmount || 0).toLocaleString()} {data.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-700 text-sm font-black">
                  <span className="text-[#F5B800]">المتبقي للدفع (Remaining Balance):</span>
                  <span className="font-mono text-xl text-[#F5B800]">
                    {Number(data.remainingAmount !== undefined ? data.remainingAmount : (data.totalAmount - (data.paidAmount || 0))).toLocaleString()} {data.currency}
                  </span>
                </div>
              </div>

              {/* Recorded Payments History */}
              {data.payments && data.payments.length > 0 && (
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                  <div className="font-bold text-emerald-950 flex items-center justify-between">
                    <span>سجل الدفعات وسندات الصرف المسددة للمورد:</span>
                    <span className="text-[11px] font-mono font-normal">عدد الدفعات: {data.payments.length}</span>
                  </div>
                  <div className="divide-y divide-emerald-200/60">
                    {data.payments.map((p: any) => (
                      <div key={p.id} className="py-1.5 flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-emerald-800">{p.paymentCode} • {p.referenceNumber}</span>
                        <span className="font-mono font-black text-emerald-900">{Number(p.amount).toLocaleString()} {p.currency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Case: Payment Voucher Body */}
          {docType === 'payment' && (
            <div className="space-y-5 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">تم صرف ودفع مبلغ للمستفيد:</span>
                  <span className="font-black text-slate-900 text-sm">{data.supplierName || data.beneficiaryName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">المبلغ المصروف:</span>
                  <span className="font-mono font-black text-rose-700 text-base">
                    {Number(data.amount).toLocaleString()} {data.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">طريقة الدفع والحساب:</span>
                  <span className="font-bold text-slate-800">{data.paymentMethod || 'تحويل بنكي'} ({data.accountName || 'الخزينة المعتمدة'})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">رقم الفاتورة / المستند المرتبط:</span>
                  <span className="font-mono font-bold text-slate-900">{data.invoiceNumber || data.referenceDoc || 'سند مباشر'}</span>
                </div>
                {data.notes && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">البيان والملاحظات:</span>
                    <span className="font-medium text-slate-700">{data.notes}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-white">
                <div>
                  <span className="text-slate-400 font-bold block mb-1">المنشئ والمحاسب:</span>
                  <span className="font-bold text-slate-800">{data.creatorName || 'المحاسب المسؤول'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-1">الاعتماد والرقابة الثنائية:</span>
                  <span className="font-bold text-emerald-700">{data.approverName || 'معتمد إدارياً'}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  هذا السند صادر وفق سياسة الرقابة الثنائية ولا يُصرف إلا بعد اعتماد المسؤول المفوض.
                </span>
              </div>
            </div>
          )}

          {/* Case 2: Payment Receipt Body */}
          {docType === 'receipt' && (
            <div className="space-y-5 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">استلمنا من السيد / السادة:</span>
                  <span className="font-black text-slate-900 text-sm">{data.customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">مبلغ وقدره:</span>
                  <span className="font-mono font-black text-emerald-700 text-base">
                    {Number(data.amount).toLocaleString()} {data.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">طريقة التحصيل / الدفع:</span>
                  <span className="font-bold text-slate-800">{data.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">رقم الإشعار أو المرجع البنكي:</span>
                  <span className="font-mono font-bold text-slate-900">{data.referenceNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">وذلك مقابل:</span>
                  <span className="font-medium text-slate-700">
                    رسوم خدمات توريد وشحن وتخليص جمركي للطلب [{data.requestCode}]
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  هذا السند إلكتروني رسمي ومسجل بقاعدة بيانات خزينة شركة سهلا المعتمدة.
                </span>
              </div>
            </div>
          )}

          {/* Case 3: Commercial Invoice Body */}
          {docType === 'invoice' && (
            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div>
                  <div className="text-slate-400 font-bold mb-1">المطالبة موجهة إلى:</div>
                  <div className="font-bold text-slate-900 text-sm">{data.customerName}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold mb-1">تاريخ الاستحقاق:</div>
                  <div className="font-mono font-bold text-slate-900">{data.dueDate || 'عند الاستلام'}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="font-bold text-slate-900 mb-1">{data.description}</div>
                <div className="text-slate-500 text-[11px]">
                  الخدمات تشمل التعاقد مع المصنع، الفحص الميداني، الشحن حتى بورتسودان، والتخليص الجمركي.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                <span className="font-bold text-sm">صافي المبلغ المطلوب سداده:</span>
                <span className="font-mono font-black text-xl text-[#F5B800]">
                  {Number(data.totalAmount).toLocaleString()} {data.currency}
                </span>
              </div>
            </div>
          )}

          {/* Case 4: Delivery POD Body */}
          {docType === 'delivery_pod' && (
            <div className="space-y-5 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">اسم المستلم:</span>
                  <span className="font-bold text-slate-900">{data.recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">هاتف المستلم:</span>
                  <span className="font-mono font-bold text-slate-900">{data.recipientPhone || 'غير مسجل'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">مدينة وموقع التسليم:</span>
                  <span className="font-bold text-slate-900">
                    {data.deliveryAddress} - {data.deliveryCity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">حالة الصناديق والبضاعة:</span>
                  <span className="font-bold text-emerald-700">سليمة ومطابقة للمواصفات المعينة ✓</span>
                </div>
              </div>
            </div>
          )}

          {/* Case 5: Inspection Report Body */}
          {docType === 'inspection_report' && (
            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div>
                  <div className="text-slate-400 font-bold mb-1">اسم المفتش الميداني:</div>
                  <div className="font-bold text-slate-900 text-sm">{data.inspectorName}</div>
                  <div className="text-slate-600 mt-0.5">فريق فحص سهلا بالصين</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold mb-1">موقع المصنع / المدينة:</div>
                  <div className="font-bold text-slate-900 text-sm">{data.factoryLocation}</div>
                  <div className="text-slate-600 mt-0.5">جمهورية الصين الشعبية</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 text-sm">نتيجة الفحص الفني والكمي:</span>
                  <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-xs">
                    {data.result === 'passed' ? 'مطابق ومجاز رسمياً (PASSED)' : data.result}
                  </span>
                </div>
                <div className="text-slate-700 text-xs pt-1">{data.notes}</div>
                <div className="text-[11px] text-emerald-800 font-medium">
                  تم التثبت من الأبعاد، التغليف، البطاريات / الألواح، والباركود للمصنع.
                </div>
              </div>
            </div>
          )}

          {/* Case 6: Shipping Waybill / Manifest Body */}
          {docType === 'shipping_waybill' && (
            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div>
                  <div className="text-slate-400 font-bold mb-1">بوليصة الشحن (B/L):</div>
                  <div className="font-mono font-black text-blue-700 text-sm">{data.blNumber}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold mb-1">رقم الحاوية:</div>
                  <div className="font-mono font-bold text-slate-900">{data.containerNumber}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold mb-1">الخط الملاحي:</div>
                  <div className="font-bold text-slate-900">{data.shippingLineOrCarrier}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block mb-0.5">ميناء الشحن (POL):</span>
                    <span className="font-bold text-slate-900">{data.originPort}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">ميناء الوصول (POD):</span>
                    <span className="font-bold text-slate-900">{data.destinationPort}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500">وصف الشحنة: <b>{data.cargoDescription}</b></span>
                  <span className="text-slate-500">الوزن التقديري: <b>{data.weightKg ? `${data.weightKg.toLocaleString()} كجم` : '12,500 كجم'}</b></span>
                </div>
              </div>
            </div>
          )}

          {/* Official Signatures & Stamp Footer */}
          <div className="pt-8 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="font-bold text-slate-700 mb-1">الموظف المسؤول / المحاسب</div>
              <div className="text-slate-500 text-[11px]">{data.receivedBy || data.approvedBy || 'فريق عمليات سهلا'}</div>
              <div className="mt-8 border-b border-dashed border-slate-300 w-36 mx-auto" />
              <div className="text-[10px] text-slate-400 mt-1">التوقيع والاعتماد</div>
            </div>

            <div>
              <div className="font-bold text-slate-700 mb-1">خاتم شركة سهلا المعتمد</div>
              <div className="w-20 h-20 mx-auto mt-2 rounded-full border-2 border-slate-900/30 flex items-center justify-center text-[10px] font-bold text-slate-400 rotate-[-12deg]">
                ختم سهلا الرسمي
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
