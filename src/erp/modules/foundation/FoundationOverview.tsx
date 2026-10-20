import React, { useState } from 'react';
import { useErpAuth } from '../../context/ErpAuthContext';
import { erpEngine } from '../../engine/erpEngine';
import {
  ShieldCheck,
  Database,
  Compass,
  History,
  Lock,
  GitBranch,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowLeft,
  Users
} from 'lucide-react';
import { SequenceRecord } from '../../../types';

export const FoundationOverview: React.FC<{ onNavigateTab: (tab: any) => void }> = ({
  onNavigateTab,
}) => {
  const { currentUser, hasPermission, refreshData } = useErpAuth();

  // Test states for live interactive verification
  const [seqTestKey, setSeqTestKey] = useState<SequenceRecord['sequenceKey']>('CUSTOMER');
  const [lastGeneratedSeq, setLastGeneratedSeq] = useState<string | null>(null);
  const [auditTestNote, setAuditTestNote] = useState('');
  const [auditTestResult, setAuditTestResult] = useState<string | null>(null);

  const handleTestSequence = () => {
    const generated = erpEngine.generateNextSequence(seqTestKey);
    setLastGeneratedSeq(generated);
    refreshData();
  };

  const handleTestAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditTestNote.trim()) return;

    const log = erpEngine.logAudit({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.roleCode,
      entityType: 'setting',
      entityId: 'test-verification',
      action: 'update',
      notes: auditTestNote,
      newState: { verified: true, testedAt: new Date().toISOString() },
    });

    setAuditTestResult(`تم قيد العملية في سجل التدقيق غير القابل للتعديل بنجاح (Audit ID: ${log.id})`);
    setAuditTestNote('');
    refreshData();
    setTimeout(() => setAuditTestResult(null), 5000);
  };

  const foundations = [
    {
      title: 'فصل المعرفات التقنية عن الرموز التجارية',
      desc: 'المعرف التقني الداخلي UUID ثابت لا يتغير، بينما كود العميل (SH-C-1001) وكود الطلب (REQ-2026-001041) يُولدان من السلاسل المركزية.',
      status: 'مكتمل ومطبق',
      icon: Compass,
      tab: 'sequences',
    },
    {
      title: 'السلاسل الرقمية الآمنة ومنع التصادم',
      desc: 'مولد مركزي ذري يمنع توليد أرقام مكررة عند تزامن عدة موظفين في إنشاء طلبات أو بوالص شحن بنفس اللحظة.',
      status: 'مكتمل ومطبق',
      icon: Database,
      tab: 'sequences',
    },
    {
      title: 'سجل التدقيق غير القابل للتعديل (Universal Audit Trail)',
      desc: 'كل حركة، تغيير حالة، أو اعتماد إداري يُسجل مع الفاعل والوقت والحالة السابقة والجديدة دون إمكانية الحذف.',
      status: 'مكتمل ومطبق',
      icon: History,
      tab: 'audit_trail',
    },
    {
      title: 'التحكم بالوصول المبني على الأدوار (RBAC)',
      desc: 'مصفوفة صلاحيات دقيقة تغطي 24 صلاحية مع دعم تعدد الموظفين بالقسم الواحد والفصل الصارم بين الصلاحيات.',
      status: 'مكتمل ومطبق',
      icon: Lock,
      tab: 'rbac_matrix',
    },
    {
      title: 'منظومة المرفقات الموحدة (Universal Attachments)',
      desc: 'نظام تخزين وتصنيف مرفقات مستقل يرتبط بمختلف الكيانات (فواتير، بوالص، شهادات فحص) مع حجب البيانات الحساسة عن التتبع العام.',
      status: 'مكتمل ومطبق',
      icon: Paperclip,
      tab: 'universal_attachments',
    },
    {
      title: 'الطلب التشغيلي المركزي',
      desc: 'كيان الطلب يمثل رأس المعاملة الرابط لكافة الأقسام، دون تكديس حقول التخليص والشراء والمالية في جدول واحد.',
      status: 'مكتمل ومطبق',
      icon: GitBranch,
      tab: 'requests_backbone',
    },
  ];

  return (
    <div className="space-y-8 text-right">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2563EB] to-[#3478B8] text-white rounded-3xl p-6 sm:p-8 border border-[#2563EB]/40 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold border border-white/30 font-mono backdrop-blur-xs">
            <ShieldCheck className="w-4 h-4 text-[#F5B800]" />
            <span>SAHLA ERP • PHASE 1 FOUNDATION ARCHITECTURE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            البنية المعمارية الأساسية وقواعد الحوكمة التقنية
          </h1>
          <p className="text-blue-50 text-xs sm:text-sm leading-relaxed">
            تم تطبيق متطلبات وثيقة التسليم التقني الرسمية (IT Handover) وبناء القواعد المنهجية التي تضمن استقرار وتوسع النظام لأعوام قادمة دون أي اعتماد على أرقام الأسطر العشوائية أو الجداول المكدسة.
          </p>
        </div>
      </div>

      {/* 6 Foundation Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {foundations.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs hover:border-[#2563EB]/40 hover:shadow-md transition-all flex flex-col justify-between text-right"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{item.status}</span>
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#2563EB]" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-[#172033]">{item.title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{item.desc}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <button
                  onClick={() => onNavigateTab(item.tab)}
                  className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>استعراض واختبار</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Interactive Sandbox / Verification Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Test 1: Concurrency-Safe Sequence Generator */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-xs space-y-5 text-right">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
            <Compass className="w-5 h-5 text-[#2563EB]" />
            <h3 className="text-base font-bold text-[#172033]">
              اختبار توليد السلاسل الرقمية (Sequence Generator)
            </h3>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed">
            اختبر توليد المفتاح التسلسلي التجاري التلقائي دون تكرار وفق إعدادات كل فئة:
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={seqTestKey}
              onChange={(e) => setSeqTestKey(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] font-bold bg-white text-[#172033]"
            >
              <option value="CUSTOMER">كود العميل (SH-C-XXXX)</option>
              <option value="REQUEST">كود الطلب (REQ-2026-XXXXXX)</option>
              <option value="PO">أمر الشراء (PO-2026-XXXX)</option>
              <option value="PURCHASE_INVOICE">فاتورة المشتريات (PINV-2026-XXXX)</option>
              <option value="SHIPMENT">رقم التتبع (SHL-2026-XXXXXX)</option>
              <option value="TRUCKING">بوليصة النقل البري والتفويج (TRK-2026-XXXX)</option>
              <option value="RECEIPT">سند القبض (REC-2026-XXXXX)</option>
              <option value="PAYMENT">سند الصرف (PAY-2026-XXXXX)</option>
            </select>

            <button
              onClick={handleTestSequence}
              className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-[#F5B800]" />
              <span>توليد الرقم التالي الذري</span>
            </button>
          </div>

          {lastGeneratedSeq && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-right space-y-1 animate-in fade-in-50">
              <div className="text-[11px] text-amber-900 font-bold">الرقم المتسلسل الصادر بنجاح:</div>
              <div className="text-2xl font-black font-mono text-slate-950 tracking-wide">
                {lastGeneratedSeq}
              </div>
              <div className="text-[10px] text-slate-500">
                تم تحديث قيمة العداد في جدول السلاسل وحفظ القيمة مركزياً.
              </div>
            </div>
          )}
        </div>

        {/* Test 2: Append-Only Audit Trail Injection */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5 text-right">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <History className="w-5 h-5 text-[#D99B00]" />
            <h3 className="text-base font-bold text-slate-900">
              اختبار سجل التدقيق الحي (Append-Only Audit Trail)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            أي نشاط تشغيلي يُسجل فوراً باسم الفاعل الحالي <b>[{currentUser.name}]</b> بصلاحية <b>[{currentUser.roleNameAr}]</b>:
          </p>

          <form onSubmit={handleTestAudit} className="space-y-3">
            <input
              type="text"
              placeholder="اكتب ملاحظة أو قرار تجريبي للاختبار..."
              value={auditTestNote}
              onChange={(e) => setAuditTestNote(e.target.value)}
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#F5B800]/20"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#F5B800] hover:bg-[#E0A600] text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
            >
              <span>تسجيل حركة تدقيق جديدة</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </form>

          {auditTestResult && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{auditTestResult}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
