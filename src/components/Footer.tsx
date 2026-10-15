import React from 'react';
import { Logo } from './Logo';
import { ShieldCheck, PhoneCall, ArrowUpLeft, MapPin, LayoutGrid } from 'lucide-react';
import { getWhatsAppLink } from '../lib/whatsapp';

interface FooterProps {
  onNavigate: (view: string) => void;
  whatsappNumber?: string;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, whatsappNumber }) => {
  const waLink = getWhatsAppLink('مرحباً سهلا، أود الاستفسار عن الشحن والتوريد.', whatsappNumber);

  return (
    <footer className="bg-[#0F172A] text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          {/* Col 1: Brand & Core Promise */}
          <div className="lg:col-span-2 space-y-4 text-right">
            <Logo variant="dark" size="lg" />
            <p className="text-sm text-slate-300 leading-relaxed max-w-md pt-2">
              شركة سهلا لخدمات الشحن والتوريد المحدودة. الشريك اللوجستي السوداني الموثوق لربط تجارتكم مع كبرى مصانع الصين، الإمارات، والسعودية عبر أحدث خطوط النقل البحري والجوي وإجراءات التخليص بميناء بورتسودان.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-2.5 py-1 text-xs rounded bg-slate-800 text-slate-300 border border-slate-700">
                تسجيل تجاري معتمد
              </span>
              <span className="px-2.5 py-1 text-xs rounded bg-slate-800 text-slate-300 border border-slate-700">
                تأمين بضائع شامل
              </span>
              <span className="px-2.5 py-1 text-xs rounded bg-slate-800 text-slate-300 border border-slate-700">
                عضوية الوكلاء الملاحيين
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3 text-right">
            <h4 className="text-white font-bold text-sm tracking-wide">روابط سريعة</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-[#F5B800] transition-colors">
                  الرئيسية
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('routes')} className="hover:text-[#F5B800] transition-colors">
                  مسارات الشحن والموانئ
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-[#F5B800] transition-colors">
                  خدمات الشحن (LCL & FCL)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-[#F5B800] transition-colors">
                  خطوات العمل
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('startup')} className="hover:text-[#F5B800] transition-colors">
                  باقة Start-Up لرواد الأعمال
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-[#F5B800] transition-colors">
                  الأسئلة الشائعة
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Services */}
          <div className="space-y-3 text-right">
            <h4 className="text-white font-bold text-sm tracking-wide">خدماتنا اللوجستية</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>شحن مجدول LCL</li>
              <li>شحن حاويات FCL</li>
              <li>شحن جوي سريع</li>
              <li>فحص جودة بالمصنع</li>
              <li>تخليص جمركي بورتسودان</li>
              <li>توزيع ونقل داخلي</li>
            </ul>
          </div>

          {/* Col 4: Action & Direct WhatsApp */}
          <div className="space-y-4 text-right">
            <h4 className="text-white font-bold text-sm tracking-wide">العمليات والخدمات</h4>
            <p className="text-xs text-slate-400 leading-normal">
              تابع شحنتك لحظياً أو اطلب عرض سعر فوري مخصص لحجم بضاعتك.
            </p>
            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('track')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all"
              >
                <span>تتبع شحنتك المباشرة</span>
              </button>
              <button
                onClick={() => onNavigate('request')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#F5B800] hover:bg-[#E0A600] text-slate-950 text-xs font-black transition-all shadow-md shadow-[#F5B800]/20"
              >
                <span>طلب عرض سعر فوري</span>
                <ArrowUpLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('erp')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#F5B800] text-xs font-bold border border-slate-700 transition-all"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>دخول الموظفين لنظام ERP</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 text-right">
          <div className="flex items-center gap-2 text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-[#F5B800]" />
            <span>بورتسودan، ولاية البحر الأحمر، جمهورية السودان.</span>
          </div>
          <div className="flex items-center gap-6">
            <span>جميع الحقوق محفوظة © {new Date().getFullYear()} شركة سهلا للخدمات اللوجستية المحدودة.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
