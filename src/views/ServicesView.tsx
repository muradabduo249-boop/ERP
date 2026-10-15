import React from 'react';
import {
  Globe2,
  ShieldCheck,
  Truck,
  Anchor,
  Layers,
  Plane,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';

interface ServicesViewProps {
  onStartRequest: () => void;
  onNavigateContact: () => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  onStartRequest,
  onNavigateContact,
}) => {
  return (
    <div className="bg-[#F8FAFC] min-h-screen py-12 sm:py-16 text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Page Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B1F3A]/5 border border-[#0B1F3A]/10 text-xs font-bold text-[#0B1F3A]">
            <Layers className="w-3.5 h-3.5 text-[#D99B00]" />
            <span>خدمات سهلا اللوجستية والتجارية</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#0B1F3A] tracking-tight leading-tight">
            حلول متكاملة تغطي سلاسل الإمداد من المصنع إلى المستودع
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            صممنا باقة خدماتنا لتلبي تطلعات كبار المستوردين، المصانع، والشركات الناشئة في السودان بأعلى معايير الأمان والشفافية.
          </p>
        </div>

        {/* Detailed Services Grid */}
        <div className="space-y-12">
          {/* Service 1: Sourcing & Factory Procurement */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0B1F3A] text-[#F5B800] flex items-center justify-center shrink-0">
                    <Globe2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#D99B00] uppercase font-mono">Service 01</span>
                    <h2 className="text-2xl font-black text-[#0B1F3A]">التوريد والبحث عن المصانع المعتمدة</h2>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  نساعدكم في الوصول إلى المصانع الأصلية المعتمدة في الصين (قوانغتشو، إيوو، فوشان، شنجن) لضمان أسعار المصنع الحقيقية وفحص عينات الإنتاج والتفاوض بالنيابة عنكم.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>فحص السجل الصناعي والتراخيص</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>تحويلات مالية آمنة للموردين</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-[#0B1F3A]">المنصات والمصادر المدعومة:</h3>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-center justify-between">
                    <span>مصانع فوشان للمعدات ومواد البناء</span>
                    <span className="font-semibold text-slate-900">مباشر</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>سوق إيوو للسلع العامة والإلكترونيات</span>
                    <span className="font-semibold text-slate-900">مباشر</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>منصات 1688 و Alibaba</span>
                    <span className="font-semibold text-slate-900">فحص واعتماد</span>
                  </li>
                </ul>
                <button
                  onClick={onStartRequest}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] transition-colors"
                >
                  طلب خدمة توريد
                </button>
              </div>
            </div>
          </div>

          {/* Service 2: LCL Consolidation */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0B1F3A] text-[#F5B800] flex items-center justify-center shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#D99B00] uppercase font-mono">Service 02</span>
                    <h2 className="text-2xl font-black text-[#0B1F3A]">الشحن الجزئي المجمع LCL (Consolidation)</h2>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  الحل الأمثل للتجار ورواد الأعمال. اجمع بضائعك من مصانع متعددة في شحنة واحدة داخل مستودعاتنا المركزية، وادفع فقط مقابل الحجم الفعلي بالمتر المكعب (CBM).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>الحد الأدنى 0.5 CBM فقط</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>إعادة تغليف وتربيط احترافي</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-[#0B1F3A]">معادلة حساب الحجم (CBM):</h3>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-mono text-center text-slate-700">
                  الطول × العرض × الارتفاع (متر) = CBM
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  كل متر مكعب يعادل ما يقارب 1000 كجم كحد أقصى للوزن الحجمي في الشحن البحري.
                </p>
                <button
                  onClick={onStartRequest}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] transition-colors"
                >
                  طلب تسعير شحن جزئي
                </button>
              </div>
            </div>
          </div>

          {/* Service 3: FCL Full Container Load */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0B1F3A] text-[#F5B800] flex items-center justify-center shrink-0">
                    <Anchor className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#D99B00] uppercase font-mono">Service 03</span>
                    <h2 className="text-2xl font-black text-[#0B1F3A]">شحن الحاويات الكاملة FCL (Full Container)</h2>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  حجز مباشر على خطوط الملاحة العالمية (COSCO, Maersk, CMA CGM) لحاويات 20 قدم و40 قدم عادية ومبردة مع فترات سماح أرضيات ممتازة في ميناء بورتسودان (حتى 21 يوماً).
                </p>
              </div>
              <div className="lg:col-span-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <button
                  onClick={onStartRequest}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] transition-colors"
                >
                  طلب حجز حاوية FCL
                </button>
              </div>
            </div>
          </div>

          {/* Service 4: Customs Clearance */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0B1F3A] text-[#F5B800] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#D99B00] uppercase font-mono">Service 04</span>
                    <h2 className="text-2xl font-black text-[#0B1F3A]">التخليص الجمركي بميناء بورتسودان</h2>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  إجراءات فورية للإقرار الجمركي IM4 وفحص عينات الهيئة السودانية للمواصفات والمقاييس (SSMO) مع سداد الرسوم والعوائد واستخراج إذن التسليم في أقل من 72 ساعة من وصول الباخرة.
                </p>
              </div>
              <div className="lg:col-span-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <button
                  onClick={onStartRequest}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] transition-colors"
                >
                  استشارة تخليص جمركي
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="text-center bg-[#0B1F3A] text-white p-10 rounded-3xl space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black">هل تحتاج إلى استشارة لوجستية متخصصة؟</h2>
          <p className="text-slate-300 text-sm max-w-2xl mx-auto">
            تواصل مع خبرائنا في بورتسودان لمراجعة بوالص الشحن وبنود التعريفة الجمركية قبل شحن بضاعتك من المصدر.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onStartRequest}
              className="px-8 py-3.5 rounded-xl text-sm font-black text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] transition-all"
            >
              طلب عرض سعر فوري
            </button>
            <button
              onClick={onNavigateContact}
              className="px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
            >
              مراسلة إدارة العمليات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
