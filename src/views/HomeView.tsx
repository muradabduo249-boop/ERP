import React, { useState } from 'react';
import {
  ArrowLeft,
  Ship,
  Plane,
  ShieldCheck,
  PackageCheck,
  Scale,
  Clock,
  Warehouse,
  Search,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  MessageCircle,
  HelpCircle,
  MapPin,
  Building2,
  LayoutGrid
} from 'lucide-react';
import { HeroSection } from '../components/HeroSection';
import { getWhatsAppLink } from '../lib/whatsapp';

export interface HomeViewProps {
  onNavigate?: (view: string) => void;
  onStartRequest?: () => void;
  onTrack?: () => void;
  onSelectRoute?: (route: string) => void;
  onStartRequestWithOrigin?: (origin: string) => void;
  whatsappNumber?: string;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate = (_view?: string) => {},
  onStartRequest = () => {},
  onTrack = () => {},
  onStartRequestWithOrigin,
  whatsappNumber,
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const handleRouteOrder = (origin: string) => {
    if (onStartRequestWithOrigin) {
      onStartRequestWithOrigin(origin);
    } else {
      onStartRequest();
    }
  };

  const waGeneralLink = getWhatsAppLink(
    'مرحباً سهلا، أود الاستفسار عن الشحن والتوريد للسودان.',
    whatsappNumber
  );

  return (
    <div className="bg-[#F8FAFC] text-slate-900 font-sans">
      {/* 1. Master Hero Section */}
      <HeroSection onStartRequest={onStartRequest} onTrack={onTrack} />

      {/* 2. Official Metrics & Trust Strip */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">4 خطوط</div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">ملاحية وجوية مباشرة</p>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-[#D99B00]">0.5 CBM</div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">أقل حجم للشحن الجزئي</p>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">100%</div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">تخليص جمركي موثق ببورتسودان</p>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">0 رسوم خفية</div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">تسعير شفاف وشامل</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Shipping Corridors & International Hubs */}
      <section id="routes" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-right space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5B800]/15 border border-[#F5B800]/30 text-xs font-bold text-slate-900">
            <span>مسارات الشحن المعتمدة</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            بوابتكم اللوجستية من أبرز موانئ العالم إلى السودان
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            شبكة متصلة تنطلق من مراكز التصنيع في آسيا والخليج العربي مع رحلات إبحار أسبوعية مباشرة إلى ميناء بورتسودان.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Route 1: China */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm hover:shadow-md transition-shadow text-right">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🇨🇳</span>
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-md bg-[#F5B800]/20 text-slate-900">
                25 - 35 يوماً
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">خط الصين ➔ بورتسودان</h3>
              <p className="text-xs text-[#D99B00] font-semibold mt-0.5">قوانغتشو • إيوو • فوشان • شنجن</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              تجميع مستودعي LCL وشحن حاويات كاملة FCL مع فحص الجودة بمصانع 1688 وAlibaba.
            </p>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleRouteOrder('الصين')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] px-4 py-2 rounded-lg transition-colors"
              >
                <span>طلب شحن</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Route 2: UAE */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm hover:shadow-md transition-shadow text-right">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🇦🇪</span>
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-md bg-[#F5B800]/20 text-slate-900">
                7 - 12 يوماً
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">خط دبي ➔ بورتسودان</h3>
              <p className="text-xs text-[#D99B00] font-semibold mt-0.5">ميناء جبل علي والمنطقة الحرة</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              شحن بحري دوري منتظم مع خيارات الشحن الجوي السريع في 48-72 ساعة للطرود الحساسة.
            </p>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleRouteOrder('الإمارات')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] px-4 py-2 rounded-lg transition-colors"
              >
                <span>طلب شحن</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Route 3: Saudi Arabia */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm hover:shadow-md transition-shadow text-right">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🇸🇦</span>
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">
                2 - 4 أيام
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">خط السعودية ➔ بورتسودان</h3>
              <p className="text-xs text-[#D99B00] font-semibold mt-0.5">ميناء جدة الإسلامي - خط مباشر</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              أقصر مسار بحري عبر البحر الأحمر؛ مناسب للمعدات والمواد الاستهلاكية وتجارة الترانزيت.
            </p>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleRouteOrder('السعودية')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] px-4 py-2 rounded-lg transition-colors"
              >
                <span>طلب شحن</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Route 4: Global E-Commerce */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm hover:shadow-md transition-shadow text-right">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🌐</span>
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-md bg-[#F5B800]/20 text-slate-900">
                شراء وشحن
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">المواقع العالمية ➔ السودان</h3>
              <p className="text-xs text-[#D99B00] font-semibold mt-0.5">Alibaba • Taobao • 1688 • Amazon</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              نزودكم بعناوين استلام في الصين والإمارات ونقوم بإعادة التغليف والشحن حتى بابك.
            </p>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleRouteOrder('الأسواق العالمية')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] px-4 py-2 rounded-lg transition-colors"
              >
                <span>طلب شحن</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ERP Internal Access Feature Strip */}
      <section className="bg-slate-900 text-white py-12 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 text-right">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5B800]/20 text-[#F5B800] text-xs font-bold">
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>منصة العمليات الداخلية (SAHLA ERP)</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                إدارة مركزية تربط المبيعات بالمشتريات والمالية والعمليات
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                منظومة عمل متكاملة للموظفين والمديرين لمتابعة الطلبات، أوامر الشراء (PO)، الخزائن النقدية، الحاويات، والتخليص الجمركي بميناء بورتسودان مع سجل تدقيق غير قابل للتعديل.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => onNavigate('erp')}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-black text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] shadow-lg shadow-[#F5B800]/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <LayoutGrid className="w-5 h-5 text-slate-950" />
                <span>الدخول لمنصة الـ ERP</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onTrack}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
              >
                <Search className="w-4 h-4 text-[#F5B800]" />
                <span>تتبع شحنة برقم التتبع</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Comprehensive Services */}
      <section id="services" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-right space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5B800]/15 border border-[#F5B800]/30 text-xs font-bold text-slate-900">
            <span>خدماتنا اللوجستية</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            حلول سلاسل إمداد شاملة ومصممة للسوق السوداني
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            نغطي كافة مراحل التجارة الدولية من البحث والتفاوض مع المصانع إلى التسليم بالولايات.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-right shadow-sm hover:border-[#F5B800] transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[#F5B800]/20 text-slate-950 flex items-center justify-center font-bold">
              <Ship className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">الشحن الجزئي المجمع (LCL)</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              ادفع فقط مقابل الحجم الفعلي للبضائع (CBM) دون تحمل تكلفة حاوية كاملة؛ مع رحلات تجميع دورية أسبوعياً.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-right shadow-sm hover:border-[#F5B800] transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[#F5B800]/20 text-slate-950 flex items-center justify-center font-bold">
              <Warehouse className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">حاويات كاملة (FCL 20ft & 40ft)</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              حجز حاويات خاصة للمصانع والشركات مع كبرى خطوط الملاحة العالمية وبأفضل فترات سماح (Free Demurrage).
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-right shadow-sm hover:border-[#F5B800] transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[#F5B800]/20 text-slate-950 flex items-center justify-center font-bold">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">التخليص الجمركي بميناء بورتسودان</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              فريق تخليص خبير بميناء بورتسودان لإتمام الإجراء الجمركي IM4 وفحص هيئة المواصفات والمقاييس (SSMO).
            </p>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section id="faq" className="py-16 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-right">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5B800]/15 border border-[#F5B800]/30 text-xs font-bold text-slate-900">
            <HelpCircle className="w-3.5 h-3.5 text-[#D99B00]" />
            <span>الأسئلة الشائعة</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900">إجابات على أكثر التساؤلات شيوعاً</h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'ما هو الحد الأدنى لحجم الشحن الجزئي (LCL) من الصين؟',
              a: 'الحد الأدنى للشحن الجزئي المجمع هو 0.5 CBM (نصف متر مكعب)، وتُحسب التكلفة بدقة بناءً على الأبعاد والوزن الفعلي.',
            },
            {
              q: 'كم تستغرق الشحنة البحرية للوصول إلى ميناء بورتسودان؟',
              a: 'تستغرق الشحنات من موانئ الصين عادة بين 25 إلى 35 يوماً من تاريخ إبحار السفينة، بينما تستغرق شحنات دبي من 7 إلى 12 يوماً، والشحنات من ميناء جدة من 2 إلى 4 أيام.',
            },
            {
              q: 'هل تقدمون خدمة الدفع للمصانع والموردين في الصين؟',
              a: 'نعم، نوفر خدمة التوريد والتحويل الآمن للمصانع الصينية عبر حساباتنا المعتمدة وبضمان فحص المنتجات ومطابقتها قبل الدفع النهائي.',
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-5 text-right flex items-center justify-between gap-4 font-bold text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform ${
                    activeFaq === idx ? 'rotate-180 text-[#D99B00]' : ''
                  }`}
                />
                <span>{item.q}</span>
              </button>
              {activeFaq === idx && (
                <div className="p-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. Contact Strip */}
      <section id="contact" className="py-16 sm:py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-right">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5B800]/15 border border-[#F5B800]/30 text-xs font-bold text-slate-900">
              <span>تواصل مع سهلا</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900">جاهزون لخدمتكم على مدار الساعة</h2>
            <p className="text-slate-600 text-sm">
              فريقنا في بورتسودان ودبي وقوانغتشو جاهز للإجابة على استفساراتكم وتقديم المشورة الفنية والجمركية مجاناً.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5B800]/20 flex items-center justify-center text-slate-900">
                <MapPin className="w-5 h-5 text-slate-950" />
              </div>
              <h4 className="font-bold text-slate-900">المقر الرئيسي (السودان)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ميناء بورتسودان، ولاية البحر الأحمر، بالقرب من المنطقة الجمركية والغرفة التجارية.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5B800]/20 flex items-center justify-center text-slate-900">
                <Building2 className="w-5 h-5 text-slate-950" />
              </div>
              <h4 className="font-bold text-slate-900">المستودعات الدولية</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                قوانغتشو (منطقة بايون)، الصين • دبي (المنطقة الحرة جبل علي)، الإمارات.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5B800]/20 flex items-center justify-center text-slate-900">
                <MessageCircle className="w-5 h-5 text-slate-950" />
              </div>
              <h4 className="font-bold text-slate-900">خدمة العملاء المباشرة</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                محادثة فورية عبر الواتساب للاستفسارات وتتبع الحاويات.
              </p>
              <a
                href={waGeneralLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 bg-[#F5B800] hover:bg-[#E0A600] px-4 py-2 rounded-lg transition-colors"
              >
                <span>محادثة واتساب</span>
                <ArrowLeft className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
