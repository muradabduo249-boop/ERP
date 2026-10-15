import React from 'react';
import { Logo } from '../components/Logo';
import {
  ShieldCheck,
  Anchor,
  Building2,
  Warehouse,
  CheckCircle2
} from 'lucide-react';

interface AboutViewProps {
  onStartRequest: () => void;
  onNavigateContact: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({
  onStartRequest,
  onNavigateContact,
}) => {
  return (
    <div className="bg-[#F8FAFC] min-h-screen py-12 sm:py-16 text-right">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="space-y-6">
          <div className="inline-block">
            <Logo size="lg" variant="light" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#0B1F3A] tracking-tight leading-tight">
            عن شركة سهلا للشحن والخدمات اللوجستية المحدودة
          </h1>
          <p className="text-lg sm:text-2xl text-[#D99B00] font-bold leading-relaxed">
            الشريك اللوجستي الأول لربط التجارة السودانية بالأسواق العالمية
          </p>
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-3xl">
            تأسست شركة سهلا برؤية وطنية طموحة لإعادة صياغة تجربة الشحن والتوريد والتخليص الجمركي في جمهورية السودان. نرتكز على إدارة متخصصة بميناء بورتسودان وفريق عمل ميداني في كبرى المراكز التجارية بالصين والإمارات والسعودية.
          </p>
        </div>

        {/* Operational Hubs Around the Globe */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-[#0B1F3A]">مقراتنا ومستودعاتنا الميدانية</h2>
            <p className="text-xs sm:text-sm text-slate-500">حضور تنفيذي في أهم الموانئ والمحطات التجارية</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#0B1F3A]">
                <Anchor className="w-5 h-5 text-[#D99B00]" />
              </div>
              <h3 className="text-base font-bold text-[#0B1F3A]">المقر الرئيسي - ميناء بورتسودان</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                إدارة العمليات المركزية، تخليص جمركي مباشر بالميناء الجنوبي والشمالي، وشاحنات توزيع لكافة الولايات.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#0B1F3A]">
                <Warehouse className="w-5 h-5 text-[#D99B00]" />
              </div>
              <h3 className="text-base font-bold text-[#0B1F3A]">مستودعات الصين (قوانغتشو وإيوو)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                استلام وتجميع شحنات LCL، فحص الجودة بمصانع فوشان وشنجن، وتربيط وتأمين الحاويات.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#0B1F3A]">
                <Building2 className="w-5 h-5 text-[#D99B00]" />
              </div>
              <h3 className="text-base font-bold text-[#0B1F3A]">محطة دبي (المنطقة الحرة جبل علي)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                شحن بحري وجوي سريع لأسواق الخليج، إعادة تصدير، ومطابقة وثائق المنشأ والتحويلات.
              </p>
            </div>
          </div>
        </div>

        {/* Corporate Values */}
        <div className="bg-slate-100 p-8 sm:p-10 rounded-3xl space-y-6">
          <h2 className="text-2xl font-black text-[#0B1F3A]">قيمنا التشغيلية</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-slate-700">
            <div className="space-y-1">
              <h3 className="font-bold text-[#0B1F3A]">الأمانة والشفافية:</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                أسعار معلنة وتكاليف واضحة دون أي رسوم خفية أو مفاجآت عند وصول البضاعة للميناء.
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-[#0B1F3A]">الالتزام بالمواعيد:</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                جداول إبحار أسبوعية منتظمة ومتابعة حثيثة لتقليل أي زمن انتظار للشحنات.
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-[#0B1F3A]">سلامة البضائع:</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                فحص ومعاينة مهنية وتأمين كامل ومسؤولية قانونية عن كافة الطرود المشحونة.
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-[#0B1F3A]">الابتكار التقني (ERP):</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                نظام ERP داخلي متطور يربط المورد بالعميل ويسجل كافة المراحل في سجل تدقيق لا يمكن التلاعب به.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-[#0B1F3A] text-white p-10 rounded-3xl space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black">نسعد بشراكتكم وتنمية تجارتكم</h2>
          <p className="text-slate-300 text-sm max-w-2xl mx-auto">
            انضم إلى مئات الشركات والمستوردين الذين يعتمدون على سهلا يومياً لتوريد بضائعهم بأمان.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onStartRequest}
              className="px-8 py-3.5 rounded-xl text-sm font-black text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] transition-all"
            >
              طلب عرض سعر شحن
            </button>
            <button
              onClick={onNavigateContact}
              className="px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
            >
              تواصل مع الإدارة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
