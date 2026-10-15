import React from 'react';
import {
  FileText,
  Search,
  Receipt,
  Warehouse,
  Ship,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Clock
} from 'lucide-react';

interface HowItWorksViewProps {
  onStartRequest: () => void;
  onNavigateTrack: () => void;
}

export const HowItWorksView: React.FC<HowItWorksViewProps> = ({
  onStartRequest,
  onNavigateTrack,
}) => {
  const steps = [
    {
      num: '01',
      title: 'طلب عرض السعر وتحديد البضاعة',
      subtitle: 'الاستفسار والمواصفات الأولية',
      desc: 'يقوم العميل بملء نموذج الطلب وتحديد نوع البضائع والكمية أو المتر المكعب (CBM) ومسار الشحن المفضل.',
      duration: 'أقل من 30 دقيقة',
      icon: FileText,
    },
    {
      num: '02',
      title: 'دراسة التكلفة وفحص بنود التعريفة الجمركية',
      subtitle: 'فحص الـ HS Code وتفاصيل الـ SSMO',
      desc: 'فريق العمليات يدرس متطلبات الاستيراد وفق القوانين السودانية، ويحدد نسبة الرسوم الجمركية ومتطلبات الفحص.',
      duration: 'خلال 4 - 12 ساعة',
      icon: Search,
    },
    {
      num: '03',
      title: 'إصدار التسعيرة الشاملة والموافقة',
      subtitle: 'تكلفة متكاملة دون رسوم مخفية',
      desc: 'تزويد العميل بعرض سعر تفصيلي يوضح تكلفة الشحن، الفحص، والتخليص، مع جدول زمني للوصول.',
      duration: 'نفس اليوم',
      icon: Receipt,
    },
    {
      num: '04',
      title: 'استلام البضائع وفحص الجودة بالمستودع',
      subtitle: 'مستودعات قوانغتشو ودبي',
      desc: 'استلام الشحنة بمستودعنا بالصين، فحص التغليف والباركود، والتأكد من سلامة الطرود والوزن الفعلي.',
      duration: '1 - 2 يوم عمل',
      icon: Warehouse,
    },
    {
      num: '05',
      title: 'شحن الحاوية وإصدار بوليصة الشحن (B/L)',
      subtitle: 'إبحار السفينة وتفعيل كود التتبع',
      desc: 'تحميل البضاعة وإبحار السفينة نحو البحر الأحمر مع تزويد العميل بكود التتبع الحي لمتابعة خط السير.',
      duration: 'بحري: 25-35 يوماً',
      icon: Ship,
    },
    {
      num: '06',
      title: 'التخليص الجمركي بميناء بورتسودان',
      subtitle: 'إجراء IM4 وفحص المواصفات SSMO',
      desc: 'وصول السفينة للميناء وإتمام المعاينة، سداد الرسوم والعوائد وإصدار الإفراج الجمركي الرسمي.',
      duration: '3 - 5 أيام عمل',
      icon: ShieldCheck,
    },
    {
      num: '07',
      title: 'النقل الداخلي والتسليم النهائي (POD)',
      subtitle: 'توصيل لباب المتجر أو المخزن',
      desc: 'نقل البضائع عبر أسطول الشاحنات إلى وجهة العميل في أي مدينة سودانية وتوقيع بوليصة الاستلام.',
      duration: '1 - 3 أيام عمل',
      icon: Truck,
    },
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-12 sm:py-16 text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B1F3A]/5 border border-[#0B1F3A]/10 text-xs font-bold text-[#0B1F3A]">
            <Clock className="w-3.5 h-3.5 text-[#D99B00]" />
            <span>آلية العمل الاحترافية المعتمدة</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#0B1F3A] tracking-tight leading-tight">
            دورة الشحن والتوريد خطوة بخطوة
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            منهجية دقيقة تضمن لك الشفافية التامة وتفادي الغرامات أو تأخير الشحنات.
          </p>
        </div>

        <div className="space-y-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="flex items-center gap-4 sm:flex-col sm:items-center shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-[#0B1F3A] text-[#F5B800] flex items-center justify-center font-mono font-black text-xl shadow-md">
                      {step.num}
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-100 text-[#D99B00]">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F3A]">{step.title}</h2>
                        <div className="text-xs font-semibold text-[#D99B00] mt-0.5">{step.subtitle}</div>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono font-semibold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{step.duration}</span>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-4xl">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center bg-[#0B1F3A] text-white p-10 rounded-3xl space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black">ابدأ شحنتك الأولى مع سهلا اليوم</h2>
          <p className="text-slate-300 text-sm max-w-2xl mx-auto">
            فريقنا بانتظارك لمساعدتك في خطوات الشراء أو استلام البضائع من مورديك بالخارج.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onStartRequest}
              className="px-8 py-3.5 rounded-xl text-sm font-black text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] transition-all"
            >
              ابدأ بالخطوة 01 الآن
            </button>
            <button
              onClick={onNavigateTrack}
              className="px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
            >
              تتبع شحنة جارية
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
