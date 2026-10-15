import React from 'react';
import {
  Rocket,
  ArrowLeft,
  Package,
  Layers,
  SearchCheck,
  Scale,
  PhoneCall
} from 'lucide-react';
import { getWhatsAppLink } from '../lib/whatsapp';

interface StartupDetailViewProps {
  onStartRequest: () => void;
  whatsappNumber?: string;
}

export const StartupDetailView: React.FC<StartupDetailViewProps> = ({
  onStartRequest,
  whatsappNumber,
}) => {
  const waStartupLink = getWhatsAppLink(
    'مرحباً سهلا، أود الاستفسار عن باقة رواد الأعمال والمستوردين الجدد (Start-Up Package).',
    whatsappNumber
  );

  const startupFeatures = [
    {
      icon: Package,
      title: 'شحن جزئي بحري ابتداءً من 0.5 CBM',
      desc: 'لا حاجة لرأس مال ضخم لاستئجار حاوية كاملة؛ يمكنك استيراد كميات تجريبية واختبار السوق السوداني بأمان.',
    },
    {
      icon: SearchCheck,
      title: 'فحص عينات المصانع والتأكد من الجودة',
      desc: 'فريقنا في الصين يتأكد من مطابقة السلع للعينات المعتمدة قبل دفع المتبقي للمصنع وقبل الشحن.',
    },
    {
      icon: Layers,
      title: 'تجميع مشتريات متعددة في شحنة واحدة',
      desc: 'اشترِ من 3 أو 4 مصانع مختلفة في الصين واجمعها في بوليصة شحن واحدة لتوفير تكاليف الشحن والتخليص.',
    },
    {
      icon: Scale,
      title: 'استشارات جمركية مجانية لتجنب المفاجآت',
      desc: 'نعلمك بدقة بالرسوم الجمركية المطلوبة قبل الشحن حتى تحسب تكلفة وصول السلعة (Landed Cost) وتضمن أرباحك.',
    },
  ];

  return (
    <div className="py-12 sm:py-16 bg-[#F8FAFC] min-h-screen text-right">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Hero */}
        <div className="rounded-3xl bg-[#0B1F3A] text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-xl border border-slate-800">
          <div className="relative max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-[#F5B800]">
              <Rocket className="w-4 h-4" />
              <span>باقة رواد الأعمال والمستوردين الجدد Start-Up</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              ابدأ مشروعك الاستيرادي الأول بثقة وأقل مخاطرة
            </h1>
            <p className="text-base sm:text-xl text-slate-200 leading-relaxed max-w-2xl">
              صممنا هذه الباقة خصيصاً للتجار المبتدئين ورواد الأعمال وأصحاب المتاجر الإلكترونية في السودان للوصول المباشر إلى مصانع الصين ودبي دون وسطاء معقدين.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onStartRequest}
                className="flex items-center gap-2 px-8 py-4 rounded-xl text-base font-black text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] shadow-lg shadow-[#F5B800]/30 transition-all active:scale-95"
              >
                <span>طلب تسعيرة باقة رواد الأعمال</span>
                <ArrowLeft className="w-5 h-5" />
              </button>
              <a
                href={waStartupLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-4 rounded-xl text-base font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
              >
                <PhoneCall className="w-5 h-5 text-[#F5B800]" />
                <span>استشارة مجانية مع خبير</span>
              </a>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B1F3A]">
              لماذا باقة Start-Up من سهلا هي خيارك الأمثل؟
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              نزيل عن كاهلك التعقيدات اللوجستية والجمركية لتتفرغ لتسويق وتنمية مبيعاتك.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {startupFeatures.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4 text-right"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#0B1F3A] text-[#F5B800] flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0B1F3A]">{f.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
