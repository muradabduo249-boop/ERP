import React, { useState } from 'react';
import { erpEngine } from '../../engine/erpEngine';
import { useErpAuth } from '../../context/ErpAuthContext';
import {
  Compass,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
  Settings,
  ShieldAlert
} from 'lucide-react';
import { SequenceRecord } from '../../../types';

export const SequencesView: React.FC = () => {
  const { refreshData } = useErpAuth();
  const sequences = erpEngine.getSequences();

  const [activeSeqKey, setActiveSeqKey] = useState<SequenceRecord['sequenceKey']>('CUSTOMER');
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [history, setHistory] = useState<{ key: string; code: string; time: string }[]>([]);

  const handleGenerate = (key: SequenceRecord['sequenceKey']) => {
    const code = erpEngine.generateNextSequence(key);
    setLastGenerated(code);
    setHistory((prev) => [
      { key, code, time: new Date().toLocaleTimeString('ar-EG') },
      ...prev.slice(0, 7),
    ]);
    refreshData();
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-5 h-5 text-[#D99B00]" />
            <h2 className="text-xl font-bold text-slate-900">
              السلاسل الرقمية والأكواد الآمنة (Central Sequence Engine)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            توليد الأكواد التجارية المعتمدة بضمان منع التصادم (Zero Collision) واستقلال تام عن المعرفات التقنية الداخلية.
          </p>
        </div>
      </div>

      {/* Engineering Guardrail Warning Card */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-slate-950">
          <ShieldAlert className="w-4 h-4 text-[#D99B00]" />
          <span>القاعدة الهندسية المعتمدة في وثيقة التسليم (Page 20):</span>
        </div>
        <p className="text-slate-700 leading-relaxed">
          "يُمنع منعاً باتاً استخدام أرقام الأسطر العشوائية (Row Numbers) كمفاتيح دائمة. كود العميل التجاري (Customer Code: SH-C-1001) وكود الطلب ينبغي توليدهما عبر خدمة سلاسل مركزية آمنة تزامنياً (Concurrency-Safe Sequence Service)."
        </p>
      </div>

      {/* Sequences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sequences.map((seq: SequenceRecord) => {
          return (
            <div
              key={seq.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 text-right flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#D99B00] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {seq.sequenceKey}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Padding: {seq.padding}
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900">{seq.description}</div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[11px] text-slate-500">الصيغة الحالية:</div>
                  <div className="text-xl font-black font-mono text-slate-900">
                    {seq.sampleFormatted}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    القيمة العددية الحالية: {seq.currentValue}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleGenerate(seq.sequenceKey)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-[#F5B800]" />
                  <span>توليد الرقم التالي (Increment)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Generations Live Log */}
      {history.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D99B00]" />
            <span>سجل الأكواد الصادرة في الجلسة الحالية (Live Generated):</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {history.map((h, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between font-mono"
              >
                <span className="font-bold text-[#D99B00]">{h.code}</span>
                <span className="text-[10px] text-slate-400">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
