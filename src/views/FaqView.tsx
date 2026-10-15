import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  PhoneCall
} from 'lucide-react';
import { getWhatsAppLink } from '../lib/whatsapp';

interface FaqViewProps {
  onStartRequest: () => void;
  onNavigateContact: () => void;
  whatsappNumber?: string;
}

export const FaqView: React.FC<FaqViewProps> = ({
  onStartRequest,
  whatsappNumber,
}) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      category: 'الشحن البحري LCL',
      q: 'كيف يتم احتساب تكلفة الشحن الجزئي (LCL) بالمتر المكعب؟',
      a: 'يتم قياس أبعاد كل كرتونة أو طرد (الطول × العرض × الارتفاع بالمتر) لتحديد حجم المتر المكعب (CBM). الحد الأدنى للاستيراد هو 0.5 CBM فقط.',
    },
    {
      category: 'التخليص الجمركي',
      q: 'ما هي المستندات الرسمية المطلوبة لإتمام التخليص الجمركي في بورتسودان؟',
      a: 'المستندات الأساسية هي: 1) الفاتورة التجارية المعتمدة، 2) قائمة التعبئة (Packing List)، 3) شهادة المنشأ، 4) بوليصة الشحن (Bill of Lading). يتولى فريقنا مراجعتها قبل الشحن للتأكد من مطابقتها لهيئة المواصفات السودانية (SSMO).',
    },
    {
      category: 'المدفوعات والتوريد',
      q: 'هل تقدم سهلا خدمة الدفع للمصانع الصينية باليوان أو الدولار؟',
      a: 'نعم، نوفر قنوات دفع رسمية وموثقة للمصانع المعتمدة بالصين مع استلام سندات وسجلات توريد رسمية.',
    },
    {
      category: 'المدد الزمنية',
      q: 'كم يوماً تستغرق الشحنة من الصين حتى الاستلام في السودان؟',
      a: 'يستغرق الإبحار البحري من موانئ الصين إلى ميناء بورتسودان بين 25 إلى 35 يوماً، بالإضافة إلى 3 إلى 5 أيام لإجراءات التخليص الجمركي والفحص بالميناء.',
    },
  ];

  const waLink = getWhatsAppLink('مرحباً سهلا، أود الاستفسار عن تفاصيل الشحن.', whatsappNumber);

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-12 sm:py-16 text-right">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-4 text-center sm:text-right">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B1F3A]/5 border border-[#0B1F3A]/10 text-xs font-bold text-[#0B1F3A]">
            <HelpCircle className="w-3.5 h-3.5 text-[#D99B00]" />
            <span>الأسئلة الشائعة والمساعدة</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#0B1F3A] tracking-tight leading-tight">
            دليل إجابات الشحن والتخليص الجمركي
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
            كل ما تود معرفته عن مسارات الشحن، شروط الاستيراد، حساب الحجوم والأسعار، وبنود الجمارك السودانية.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-sm hover:border-slate-300"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-6 text-right flex items-center justify-between gap-4 focus:outline-none"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[#D99B00] uppercase tracking-wider font-mono">
                      {faq.category}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-[#0B1F3A]">{faq.q}</h2>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-100 text-sm sm:text-base text-slate-700 leading-relaxed bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-[#0B1F3A] rounded-3xl p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-right">
            <h3 className="text-xl font-bold">لم تجد إجابة لسؤالك؟</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              تواصل مع خبرائنا في العمليات الجمركية واللوجستية عبر الواتساب مباشرة.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl text-xs sm:text-sm font-black text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] transition-all flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>محادثة واتساب فورية</span>
            </a>
            <button
              onClick={onStartRequest}
              className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
            >
              طلب عرض سعر
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
