import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Copy,
  Check,
  Building2,
  Ship,
  Truck,
  CheckCircle2,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';
import {
  generateMilestoneWhatsAppMessage,
  getWhatsAppLink,
  WhatsAppMilestoneData,
  WhatsAppMilestoneType,
} from '../../lib/whatsapp';

interface ErpWhatsAppModalProps {
  initialType?: WhatsAppMilestoneType;
  data: WhatsAppMilestoneData;
  recipientPhone?: string;
  onClose: () => void;
}

export const ErpWhatsAppModal: React.FC<ErpWhatsAppModalProps> = ({
  initialType = 'shipped_sailing',
  data,
  recipientPhone = '',
  onClose,
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<WhatsAppMilestoneType>(initialType);
  const [phone, setPhone] = useState(recipientPhone || '+249 91 234 5678');
  const [message, setMessage] = useState(() =>
    generateMilestoneWhatsAppMessage(initialType, data)
  );
  const [copied, setCopied] = useState(false);

  const handleTypeChange = (type: WhatsAppMilestoneType) => {
    setSelectedMilestone(type);
    setMessage(generateMilestoneWhatsAppMessage(type, data));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSend = () => {
    const link = getWhatsAppLink(message, phone);
    window.open(link, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto font-['IBM_Plex_Sans_Arabic',sans-serif]">
      <div className="bg-white rounded-3xl max-w-xl w-full text-right shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in-50">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white text-[#172033] flex items-center justify-between border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[#172033]">إرسال إشعار رسمي للعميل عبر الواتساب</h3>
              <p className="text-[11px] text-[#64748B]">
                العميل: {data.customerName} • الطلب: {data.requestCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
          {/* Milestone Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">اختر المرحلة وحالة الإشعار:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('order_received')}
                className={`p-2 rounded-xl border text-right font-bold transition-all ${
                  selectedMilestone === 'order_received'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                1. تأكيد الطلب
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('inspection_passed')}
                className={`p-2 rounded-xl border text-right font-bold transition-all ${
                  selectedMilestone === 'inspection_passed'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                2. فحص المصنع بالصين
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('shipped_sailing')}
                className={`p-2 rounded-xl border text-right font-bold transition-all ${
                  selectedMilestone === 'shipped_sailing'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                3. إبحار الباخرة (B/L)
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('arrived_port_sudan')}
                className={`p-2 rounded-xl border text-right font-bold transition-all ${
                  selectedMilestone === 'arrived_port_sudan'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                4. وصول بورتسودان
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('customs_cleared')}
                className={`p-2 rounded-xl border text-right font-bold transition-all ${
                  selectedMilestone === 'customs_cleared'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                5. الإفراج الجمركي
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('trucking_dispatched')}
                className={`p-2 rounded-xl border text-right font-bold transition-all ${
                  selectedMilestone === 'trucking_dispatched'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                6. تفويج الشاحنة
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('delivered_pod')}
                className={`p-2 rounded-xl border text-right font-bold transition-all col-span-2 sm:col-span-1 ${
                  selectedMilestone === 'delivered_pod'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                7. التسليم النهائي POD
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('payment_receipt')}
                className={`p-2 rounded-xl border text-right font-bold transition-all col-span-2 sm:col-span-2 ${
                  selectedMilestone === 'payment_receipt'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                سند قبض وتحصيل مالي
              </button>
            </div>
          </div>

          {/* Recipient Phone */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">رقم واتساب العميل (مع المفتاح الدولي):</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+249 91 234 5678"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono focus:bg-white outline-hidden font-bold"
            />
          </div>

          {/* Message Preview & Editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">نص الرسالة المولد (يمكنك التعديل والإضافة):</label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px] font-bold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
              </button>
            </div>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white outline-hidden leading-relaxed font-sans text-xs whitespace-pre-line"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSend}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center gap-2 shadow-sm transition-all"
            >
              <Send className="w-4 h-4" />
              <span>فتح وإرسال فوراً عبر واتساب</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
