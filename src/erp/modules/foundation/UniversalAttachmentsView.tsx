import React, { useState } from 'react';
import { erpEngine } from '../../engine/erpEngine';
import { useErpAuth } from '../../context/ErpAuthContext';
import {
  Paperclip,
  Upload,
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  Search,
  Plus,
  X,
  FileText,
  Clock,
  User
} from 'lucide-react';
import { UniversalAttachment } from '../../../types';

export const UniversalAttachmentsView: React.FC = () => {
  const { currentUser, refreshData } = useErpAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public_tracking' | 'private_internal'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload form state
  const [fileName, setFileName] = useState('');
  const [category, setCategory] = useState<UniversalAttachment['category']>('commercial_invoice');
  const [relatedEntity, setRelatedEntity] = useState<UniversalAttachment['relatedEntity']>('request');
  const [relatedEntityId, setRelatedEntityId] = useState('');
  const [visibility, setVisibility] = useState<UniversalAttachment['visibility']>('private_internal');
  const [description, setDescription] = useState('');

  const attachments = erpEngine.getAttachments();

  const filtered = attachments.filter((att) => {
    const matchesVis = filterVisibility === 'all' || att.visibility === filterVisibility;
    const matchesSearch =
      att.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (att.description && att.description.includes(searchQuery));
    return matchesVis && matchesSearch;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    erpEngine.addAttachment(
      {
        fileName: fileName.trim(),
        fileType: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        fileSizeBytes: Math.floor(100000 + Math.random() * 500000),
        fileUrl: '#',
        relatedEntity,
        relatedEntityId: relatedEntityId.trim() || 'req-uuid-001',
        requestId: relatedEntityId.trim() || 'req-uuid-001',
        category,
        visibility,
        description: description.trim() || undefined,
        uploadedBy: currentUser.id,
        uploadedByName: currentUser.name,
        requestStage: 'Operational Flow',
      },
      currentUser
    );

    setShowUploadModal(false);
    setFileName('');
    setDescription('');
    refreshData();
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Paperclip className="w-5 h-5 text-[#D99B00]" />
            <h2 className="text-xl font-bold text-slate-900">
              خدمة المرفقات والوثائق الموحدة (Universal Attachments Service)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            تخزين مركزي موحد لكافة المستندات دون تكرار حقول الملفات في جداول الأقسام، مع حماية الوثائق الحساسة.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Upload className="w-4 h-4 text-[#F5B800]" />
          <span>إرفاق مستند جديد للنظام</span>
        </button>
      </div>

      {/* Filter and Privacy Gating Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="بحث باسم الملف أو الوصف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#172033] bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
          />
          <Search className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterVisibility('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterVisibility === 'all'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-slate-100 text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
            }`}
          >
            كافة المرفقات ({attachments.length})
          </button>
          <button
            onClick={() => setFilterVisibility('public_tracking')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterVisibility === 'public_tracking'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>متاحة للعميل بالتتبع العام</span>
          </button>
          <button
            onClick={() => setFilterVisibility('private_internal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterVisibility === 'private_internal'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>خاصة وسرية للموظفين فقط</span>
          </button>
        </div>
      </div>

      {/* Attachments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((att) => {
          const isPublic = att.visibility === 'public_tracking';
          return (
            <div
              key={att.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 text-right flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {att.category}
                  </span>
                  {isPublic ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>متاح بالتتبع العام</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      <ShieldAlert className="w-3 h-3 text-slate-500" />
                      <span>داخلي خاص بالشركة</span>
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm break-all">{att.fileName}</h4>
                  {att.description && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{att.description}</p>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">الكيان المرتبط:</span>
                    <span className="font-bold text-slate-800">{att.relatedEntity} ({att.relatedEntityId})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الحجم والنوع:</span>
                    <span className="font-mono text-slate-600">
                      {(att.fileSizeBytes / 1024).toFixed(1)} KB • {att.fileType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>{att.uploadedByName}</span>
                </div>
                <div className="font-mono text-[11px]">
                  {new Date(att.uploadedAt).toLocaleDateString('ar-EG')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-right space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-base font-bold text-slate-900">إرفاق مستند بالنظام الموحد</h3>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الملف *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: Port_Sudan_Customs_Declaration_IM4.pdf"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع المستند</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="commercial_invoice">فاتورة تجارية (Invoice)</option>
                    <option value="packing_list">قائمة تعبئة (Packing List)</option>
                    <option value="bill_of_lading">بوليصة شحن (Bill of Lading)</option>
                    <option value="inspection_report">تقرير فحص الجودة بالمصنع</option>
                    <option value="payment_proof">سند تحويل أو إيصال بنكي</option>
                    <option value="customs_declaration">إقرار جمركي ومواصفات</option>
                    <option value="pod_signature">إثبات تسليم واستلام (POD)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">مستوى السرية والظهور</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                  >
                    <option value="private_internal">خاص وسري (موظفي الشركة فقط)</option>
                    <option value="public_tracking">عام (يظهر للعميل في شاشة التتبع)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">معرف الطلب أو الكيان المرتبط (Entity ID)</label>
                <input
                  type="text"
                  placeholder="مثال: req-uuid-001 أو كود الطلب"
                  value={relatedEntityId}
                  onChange={(e) => setRelatedEntityId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">وصف المستند وملاحظاته</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات توضيحية حول المستند..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  حفظ المستند
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
