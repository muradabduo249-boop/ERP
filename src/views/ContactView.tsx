import React, { useState } from 'react';
import { PhoneCall, Send, CheckCircle2, MessageSquare, Mail, Clock, Building2 } from 'lucide-react';
import { getWhatsAppLink } from '../lib/whatsapp';

interface ContactViewProps {
  whatsappNumber?: string;
  onNavigateRequest: () => void;
}

export const ContactView: React.FC<ContactViewProps> = ({
  whatsappNumber,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('استفسار شحن بحري');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const waLink = getWhatsAppLink(
    `مرحباً سهلا، اسمي ${name || 'عميل'}، أود الاستفسار بخصوص ${subject}.`,
    whatsappNumber
  );

  return (
    <div className="py-12 sm:py-16 bg-[#F8FAFC] min-h-screen text-right">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4 text-center sm:text-right">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B1F3A]/5 border border-[#0B1F3A]/10 text-xs font-bold text-[#0B1F3A]">
            <MessageSquare className="w-3.5 h-3.5 text-[#D99B00]" />
            <span>قنوات الاتصال المباشرة</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#0B1F3A] tracking-tight">
            تواصل مع فريق شركة سهلا
          </h1>
          <p className="text-base text-slate-600 max-w-2xl">
            مكاتبنا التنفيذية وفرق العمليات في بورتسودان وقوانغتشو ودبي في خدمتكم دائماً.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Direct WhatsApp & Channels (5 cols) */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-[#0B1F3A] mb-2">الدعم الفني السريع</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  للحصول على رد فوري وتحديثات فورية لحركة الشاحنات والبواخر عبر WhatsApp.
                </p>
              </div>

              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-[#F5B800] hover:bg-[#E0A600] text-slate-950 font-black text-sm shadow-md transition-all active:scale-95"
              >
                <PhoneCall className="w-4 h-4" />
                <span>محادثة واتساب مباشرة</span>
              </a>

              <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#D99B00] shrink-0" />
                  <span>ساعات العمل الميداني: 8:00 صباحاً - 8:00 مساءً</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#D99B00] shrink-0" />
                  <span>البريد الإلكتروني: operations@sahla.sd</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-[#0B1F3A] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#D99B00]" />
                <span>عناوين المكاتب والمستودعات:</span>
              </h2>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-[#0B1F3A]">المقر الرئيسي (السودان):</div>
                  <div>بورتسودان، ولاية البحر الأحمر، بالقرب من المنطقة الجمركية.</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-[#0B1F3A]">مستودع الصين (Guangzhou):</div>
                  <div>منطقة بايون (Baiyun District)، مدينة قوانغتشو، جمهورية الصين الشعبية.</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-[#0B1F3A]">مكتب الإمارات (Dubai):</div>
                  <div>المنطقة الحرة جبل علي (JAFZA)، دبي، دولة الإمارات العربية المتحدة.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Message Form (7 cols) */}
          <div className="md:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-[#0B1F3A]">تم إرسال رسالتكم بنجاح</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  شكراً لتواصلكم مع شركة سهلا. سيقوم ضابط العمليات المختص بالرد عليكم خلال أقرب وقت.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-[#0B1F3A] bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    إرسال رسالة أخرى
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-lg font-bold text-[#0B1F3A]">نموذج الاستفسار والمراسلة</h2>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="أدخل اسمك الكريم"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800] bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: +249 91 234 5678"
                    dir="ltr"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800] bg-slate-50 text-right"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">موضوع الرسالة</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800] bg-slate-50"
                  >
                    <option value="استفسار شحن بحري جزئي LCL">استفسار شحن بحري جزئي LCL</option>
                    <option value="استفسار حاويات FCL كاملة">استفسار حاويات FCL كاملة</option>
                    <option value="استفسار تخليص جمركي بورتسودان">استفسار تخليص جمركي بورتسودان</option>
                    <option value="استفسار توريد ودفع مصانع">استفسار توريد ودفع مصانع</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تفاصيل الرسالة *</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب استفسارك بالتفصيل..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5B800] bg-slate-50"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-[#0B1F3A] hover:bg-[#163A6B] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 text-[#F5B800]" />
                  <span>إرسال الرسالة</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
