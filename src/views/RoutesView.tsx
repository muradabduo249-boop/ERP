import React, { useState } from 'react';
import {
  Globe2,
  Anchor,
  Clock,
  Warehouse,
  Calendar,
  ArrowLeft
} from 'lucide-react';

interface RoutesViewProps {
  onStartRequestWithOrigin: (origin: string) => void;
  onNavigateContact: () => void;
}

export const RoutesView: React.FC<RoutesViewProps> = ({
  onStartRequestWithOrigin,
  onNavigateContact,
}) => {
  const [selectedRoute, setSelectedRoute] = useState<'china' | 'uae' | 'ksa' | 'global'>('china');

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-12 sm:py-16 text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Page Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B1F3A]/5 border border-[#0B1F3A]/10 text-xs font-bold text-[#0B1F3A]">
            <Globe2 className="w-3.5 h-3.5 text-[#D99B00]" />
            <span>المسارات الملاحية والجوية المباشرة</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#0B1F3A] tracking-tight leading-tight">
            موانئ ومستودعات التجميع العالمية إلى السودان
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            محطات لوجستية متخصصة ومستودعات مركزية مجهزة لاستلام البضائع وفحصها قبل شحنها لميناء بورتسودان.
          </p>
        </div>

        {/* Route Selector Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/70 rounded-2xl max-w-2xl">
          <button
            onClick={() => setSelectedRoute('china')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              selectedRoute === 'china'
                ? 'bg-white text-[#0B1F3A] shadow-sm'
                : 'text-slate-600 hover:text-[#0B1F3A]'
            }`}
          >
            <span>🇨🇳</span>
            <span>مسار الصين</span>
          </button>
          <button
            onClick={() => setSelectedRoute('uae')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              selectedRoute === 'uae'
                ? 'bg-white text-[#0B1F3A] shadow-sm'
                : 'text-slate-600 hover:text-[#0B1F3A]'
            }`}
          >
            <span>🇦🇪</span>
            <span>مسار دبي</span>
          </button>
          <button
            onClick={() => setSelectedRoute('ksa')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              selectedRoute === 'ksa'
                ? 'bg-white text-[#0B1F3A] shadow-sm'
                : 'text-slate-600 hover:text-[#0B1F3A]'
            }`}
          >
            <span>🇸🇦</span>
            <span>مسار السعودية</span>
          </button>
          <button
            onClick={() => setSelectedRoute('global')}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              selectedRoute === 'global'
                ? 'bg-white text-[#0B1F3A] shadow-sm'
                : 'text-slate-600 hover:text-[#0B1F3A]'
            }`}
          >
            <span>🌐</span>
            <span>المواقع العالمية</span>
          </button>
        </div>

        {/* Detailed Route View Container */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-12">
          {selectedRoute === 'china' && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">🇨🇳</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#0B1F3A]">
                      مسار الصين (قوانغتشو، إيوو، فوشان) ➔ بورتسودان
                    </h2>
                  </div>
                  <p className="text-sm text-slate-600">
                    الخط البحري الأكبر للاستيراد التجاري والصناعي من كبرى مصانع وشركات الصين.
                  </p>
                </div>
                <button
                  onClick={() => onStartRequestWithOrigin('الصين')}
                  className="px-6 py-3.5 rounded-xl text-sm font-black text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] transition-all self-start md:self-auto shrink-0 flex items-center gap-2"
                >
                  <span>شحن من الصين الآن</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-[#F5B800] flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0B1F3A]">زمن الإبحار المتوقع</h3>
                  <div className="text-2xl font-black text-slate-900 font-mono">25 - 35 يوماً</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    من تاريخ إبحار السفينة من ميناء نانشا أو شنجن حتى الرسو ببورتسودان.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-[#F5B800] flex items-center justify-center">
                    <Warehouse className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0B1F3A]">المستودع الرئيسي في الصين</h3>
                  <div className="text-sm font-bold text-slate-900">قوانغتشو (Guangzhou - Baiyun)</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    مستودع مجهز لاستقبال شحنات المصانع، إعادة التغليف، وتجميع الحاويات LCL.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-[#F5B800] flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0B1F3A]">جدول الرحلات</h3>
                  <div className="text-sm font-bold text-slate-900">إبحار أسبوعي منتظم</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    إغلاق الحاوية كل أسبوع لضمان عدم تأخر بضائع العملاء في المستودعات.
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedRoute === 'uae' && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">🇦🇪</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#0B1F3A]">
                      مسار الإمارات (دبي - جبل علي) ➔ بورتسودان
                    </h2>
                  </div>
                  <p className="text-sm text-slate-600">
                    شحن سريع للآليات، المحركات، والسلع الاستهلاكية من موانئ وأسواق دبي.
                  </p>
                </div>
                <button
                  onClick={() => onStartRequestWithOrigin('الإمارات')}
                  className="px-6 py-3.5 rounded-xl text-sm font-black text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] transition-all self-start md:self-auto shrink-0 flex items-center gap-2"
                >
                  <span>شحن من دبي الآن</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-[#F5B800] flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0B1F3A]">مدة الشحن البحري</h3>
                  <div className="text-2xl font-black text-slate-900 font-mono">7 - 12 يوماً</div>
                  <div className="text-xs text-slate-500">الجوي: 2-3 أيام فقط</div>
                </div>
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-[#F5B800] flex items-center justify-center">
                    <Anchor className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0B1F3A]">الميناء الرئيسي</h3>
                  <div className="text-sm font-bold text-slate-900">ميناء جبل علي (Jebel Ali)</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    ربط بحري مباشر دون إعادة تفريغ لتقليل مخاطر التلف وضمان سرعة التسليم.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-[#F5B800] flex items-center justify-center">
                    <Warehouse className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0B1F3A]">نقطة الاستلام في دبي</h3>
                  <div className="text-sm font-bold text-slate-900">المنطقة الحرة / القوز</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    استلام الشحنات من محلات وتجار دبي وتجهيز مستندات إعادة التصدير.
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedRoute === 'ksa' && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">🇸🇦</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#0B1F3A]">
                      مسار السعودية (ميناء جدة الإسلامي) ➔ بورتسودان
                    </h2>
                  </div>
                  <p className="text-sm text-slate-600">
                    أقصر رحلة بحرية مباشرة عبر البحر الأحمر (عبور مباشر في 48 إلى 96 ساعة).
                  </p>
                </div>
                <button
                  onClick={() => onStartRequestWithOrigin('السعودية')}
                  className="px-6 py-3.5 rounded-xl text-sm font-black text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] transition-all self-start md:self-auto shrink-0 flex items-center gap-2"
                >
                  <span>شحن من السعودية</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-[#F5B800] flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0B1F3A]">زمن العبور البحري</h3>
                  <div className="text-2xl font-black text-emerald-700 font-mono">2 - 4 أيام</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    رحلات رورو (Ro-Ro) وشاحنات مبردة وحاويات من رصيف جدة إلى رصيف بورتسودان.
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedRoute === 'global' && (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">🌐</span>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#0B1F3A]">
                      مسار المواقع العالمية (Alibaba, Taobao, 1688, Amazon) ➔ السودان
                    </h2>
                  </div>
                  <p className="text-sm text-slate-600">
                    اشترِ من أي موقع تجاري في العالم واستخدم عناوين مستودعات سهلا كوجهة شحن داخلية.
                  </p>
                </div>
                <button
                  onClick={() => onStartRequestWithOrigin('الأسواق العالمية')}
                  className="px-6 py-3.5 rounded-xl text-sm font-black text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] transition-all self-start md:self-auto shrink-0 flex items-center gap-2"
                >
                  <span>شحن مشتريات إلكترونية</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
