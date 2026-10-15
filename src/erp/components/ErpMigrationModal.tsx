import React, { useState } from 'react';
import {
  Database,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  X,
  Play,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { erpEngine } from '../engine/erpEngine';
import { useErpAuth } from '../context/ErpAuthContext';

interface ErpMigrationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const ErpMigrationModal: React.FC<ErpMigrationModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useErpAuth();
  const [activeStep, setActiveStep] = useState<'input' | 'preview' | 'complete'>('input');
  const [rawText, setRawText] = useState('');
  const [parsedCustomers, setParsedCustomers] = useState<any[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sample data to make testing instant
  const handleLoadSample = () => {
    const sample = `[
  {
    "companyName": "شركة الفجر للتجهيزات الزراعية المحدودة",
    "contactName": "م. عمار الصديق",
    "phone": "+249912003344",
    "city": "القضارف",
    "country": "السودان",
    "businessType": "commercial_importer",
    "notes": "مستورد قديم من شيتات Google Sheets - استيراد مضخات من الصين"
  },
  {
    "companyName": "مؤسسة طارق للكهرباء والطاقة البديلة",
    "contactName": "أ. طارق الفاتح",
    "phone": "0912334455",
    "city": "أم درمان",
    "country": "السودان",
    "businessType": "commercial_importer",
    "notes": "تم الترحيل من نظام AppSheet السابق"
  },
  {
    "companyName": "شركة النيل الأزرق للاستيراد والتصدير",
    "contactName": "محمد عبد الرحمن النيل",
    "phone": "+249 91 234 5678",
    "city": "الخرطوم",
    "country": "السودان",
    "businessType": "commercial_importer",
    "notes": "عميل موجود مسبقاً لاختبار منع التكرار"
  }
]`;
    setRawText(sample);
  };

  const handleDryRun = () => {
    setValidationErrors([]);
    try {
      let data: any[] = [];
      const trimmed = rawText.trim();
      if (trimmed.startsWith('[')) {
        data = JSON.parse(trimmed);
      } else {
        // Simple CSV parse
        const lines = trimmed.split('\n');
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          const obj: any = {};
          headers.forEach((h, idx) => {
            obj[h] = cols[idx];
          });
          data.push(obj);
        }
      }

      if (!Array.isArray(data) || data.length === 0) {
        setValidationErrors(['لم يتم العثور على أي سجلات صالحة في النص المدخل.']);
        return;
      }

      const existingCustomers = erpEngine.getCustomers();
      let dupes = 0;
      const normalizedData = data.map((item, idx) => {
        const phoneClean = (item.phone || item.primaryPhone || '')
          .toString()
          .replace(/[^0-9]/g, '');
        const name = (item.companyName || item.name || `عميل مرحل ${idx + 1}`).trim();

        // Deduplication check
        const match = existingCustomers.find((c) => {
          const cPhoneClean = c.primaryPhone.replace(/[^0-9]/g, '');
          if (phoneClean && cPhoneClean && (phoneClean.includes(cPhoneClean) || cPhoneClean.includes(phoneClean))) {
            return true;
          }
          if (c.companyName.toLowerCase() === name.toLowerCase()) {
            return true;
          }
          return false;
        });

        if (match) {
          dupes++;
          return { ...item, isDuplicate: true, matchedCode: match.customerCode };
        }
        return { ...item, isDuplicate: false, phoneClean, name };
      });

      setDuplicateCount(dupes);
      setParsedCustomers(normalizedData);
      setActiveStep('preview');
    } catch (e: any) {
      setValidationErrors([`خطأ في قراءة وتفسير البيانات: ${e.message}`]);
    }
  };

  const handleCommitMigration = () => {
    setIsProcessing(true);
    let imported = 0;

    for (const item of parsedCustomers) {
      if (item.isDuplicate) continue; // skip duplicates

      erpEngine.createCustomer(
        {
          companyName: item.name || item.companyName,
          contactName: item.contactName || 'المسؤول التجاري',
          primaryPhone: item.phoneClean ? `+${item.phoneClean}` : '+249 90 000 0000',
          whatsapp: item.whatsapp || (item.phoneClean ? `+${item.phoneClean}` : ''),
          email: item.email || '',
          city: item.city || 'الخرطوم',
          country: item.country || 'السودان',
          businessType: 'commercial',
          status: 'active',
          address: item.addressDetails || 'سجل مرحل من شيتات Google Sheets',
          notes: item.notes || 'تم الاستيراد والترحيل الآلي بنجاح',
        },
        currentUser
      );
      imported++;
    }

    setIsProcessing(false);
    setActiveStep('complete');
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto font-['IBM_Plex_Sans_Arabic',sans-serif]">
      <div className="bg-white rounded-3xl max-w-2xl w-full text-right shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in-50">
        {/* Header */}
        <div className="p-5 bg-white text-[#172033] flex items-center justify-between border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100">
              <Database className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[#172033]">
                أداة ترحيل واستيراد البيانات التاريخية (AppSheet / Google Sheets Migration)
              </h3>
              <p className="text-[11px] text-[#64748B]">
                المرحلة 10 من خطة الإطلاق: استيراد وتطهير بيانات العملاء والطلبات السابقة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
          {/* STEP 1: INPUT */}
          {activeStep === 'input' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 block text-sm">
                  الصق بيانات الـ JSON أو الـ CSV المصدرة من Google Sheets / AppSheet:
                </label>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-amber-800 hover:text-amber-950 font-bold text-xs bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-lg border border-amber-200 flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>تعبئة بيانات تجريبية جاهزة</span>
                </button>
              </div>

              <textarea
                rows={10}
                required
                placeholder="ألصق كود JSON أو أسطر CSV هنا..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-[11px] focus:bg-white outline-hidden"
              />

              {validationErrors.length > 0 && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 space-y-1">
                  {validationErrors.map((err, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleDryRun}
                  disabled={!rawText.trim()}
                  className="px-6 py-2.5 rounded-xl bg-[#F5B800] hover:bg-[#E0A600] disabled:opacity-50 text-slate-950 font-black flex items-center gap-1.5 shadow-sm"
                >
                  <Play className="w-4 h-4" />
                  <span>بدء الفحص ومنع التكرار (Dry-Run Verification)</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & DRY-RUN REPORT */}
          {activeStep === 'preview' && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                  <div className="text-[10px] text-blue-600 font-bold">إجمالي السجلات المفحوصة:</div>
                  <div className="text-xl font-black font-mono mt-0.5">{parsedCustomers.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <div className="text-[10px] text-emerald-600 font-bold">عملاء جدد سيتم إدخالهم:</div>
                  <div className="text-xl font-black font-mono mt-0.5">
                    {parsedCustomers.length - duplicateCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                  <div className="text-[10px] text-amber-600 font-bold">مكررين تم حجبهم:</div>
                  <div className="text-xl font-black font-mono mt-0.5">{duplicateCount}</div>
                </div>
              </div>

              {/* Records List */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5">اسم العميل / الشركة</th>
                      <th className="p-2.5">رقم الهاتف</th>
                      <th className="p-2.5">المدينة</th>
                      <th className="p-2.5 text-center">حالة الفحص</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedCustomers.map((item, idx) => (
                      <tr key={idx} className={item.isDuplicate ? 'bg-amber-50/50' : ''}>
                        <td className="p-2.5 font-bold text-slate-900">{item.name || item.companyName}</td>
                        <td className="p-2.5 font-mono text-slate-600">{item.phone || item.primaryPhone}</td>
                        <td className="p-2.5 text-slate-600">{item.city}</td>
                        <td className="p-2.5 text-center">
                          {item.isDuplicate ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                              مكرر (يطابق {item.matchedCode})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              صالح للاستيراد ✓
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveStep('input')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  رجوع للتعديل
                </button>
                <button
                  type="button"
                  onClick={handleCommitMigration}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#F5B800]" />
                  <span>
                    {isProcessing
                      ? 'جارٍ الحفظ والترحيل...'
                      : `تأكيد ترحيل (${parsedCustomers.length - duplicateCount}) عميل إلى المنظومة`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: COMPLETE */}
          {activeStep === 'complete' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-slate-900">تم ترحيل البيانات التاريخية بنجاح تام!</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                تم إنشاء حسابات العملاء الجدد وتوليد الأكواد التسلسلية (SH-C-XXXX) وتوثيق الترحيل بالكامل في سجل التدقيق العام (Audit Trail).
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#F5B800] text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow-sm"
              >
                <span>العودة لإدارة النظام</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
