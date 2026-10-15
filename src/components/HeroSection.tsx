import React from 'react';
import { ArrowLeft, Search, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface HeroSectionProps {
  onStartRequest: () => void;
  onTrack: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartRequest,
  onTrack,
}) => {
  return (
    <section className="relative min-h-[580px] lg:min-h-[640px] flex items-center justify-center text-white overflow-hidden bg-[#0A0F1D]">
      {/* Background Graphic / Cargo Vessel Atmosphere */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F1D]/95 via-[#0F172A]/85 to-[#0F172A]/70" />
        <div className="absolute inset-0 bg-[radial-gradient(#F5B800_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
        <div className="max-w-3xl text-right space-y-6">
          {/* Brand Identity Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-[#F5B800] animate-pulse" />
            <ShieldCheck className="w-4 h-4 text-[#F5B800]" />
            <span>الناقل والوسيط اللوجستي الأول في السودان</span>
          </div>

          {/* Main Headline with Brand Gold Accent */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.25]">
            شحن بحري وجوي آمن
            <span className="block mt-2 text-[#F5B800]">
              من الصين والإمارات إلى كافة مدن السودان
            </span>
          </h1>

          {/* Rich Corporate Description */}
          <p className="text-base sm:text-lg lg:text-xl text-slate-200 font-normal leading-relaxed max-w-2xl text-justify sm:text-right">
            نقدم حلولاً متكاملة تبدأ من تأكيد الشراء بالمصانع، والتجميع بمستودعاتنا في قوانغتشو ودبي، مروراً بالتخليص الجمركي بميناء بورتسودان، وحتى التسليم الآمن لباب متجرك أو مصنعك.
          </p>

          {/* Pure Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onStartRequest}
              className="flex items-center gap-3 px-8 py-4 rounded-xl text-base font-bold text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] shadow-lg shadow-[#F5B800]/25 transition-all hover:shadow-xl active:scale-95 group"
            >
              <span>طلب عرض سعر فوري</span>
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onTrack}
              className="flex items-center gap-2.5 px-7 py-4 rounded-xl text-base font-bold text-white bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur-md transition-all active:scale-95"
            >
              <Search className="w-5 h-5 text-[#F5B800]" />
              <span>تتبع شحنتك المباشرة</span>
            </button>
          </div>

          {/* Core Pillars Strip */}
          <div className="pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#F5B800] shrink-0" />
              <span>شحن جزئي (LCL) وحاويات (FCL)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#F5B800] shrink-0" />
              <span>فحص جودة ومطابقة بالمصنع</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#F5B800] shrink-0" />
              <span>تخليص جمركي معتمد ببورتسودان</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#F5B800] shrink-0" />
              <span>توصيل لكافة الولايات السودانية</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
