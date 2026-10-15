import React, { useState } from 'react';
import { Logo } from './Logo';
import { Menu, X, Search, ShieldCheck, PhoneCall, ArrowLeft, LayoutGrid } from 'lucide-react';
import { getWhatsAppLink } from '../lib/whatsapp';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  whatsappNumber?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  whatsappNumber,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'routes', label: 'مسارات الشحن' },
    { id: 'services', label: 'الخدمات' },
    { id: 'how-it-works', label: 'كيف نعمل' },
    { id: 'startup', label: 'باقة رواد الأعمال Start-Up' },
    { id: 'faq', label: 'الأسئلة الشائعة' },
    { id: 'contact', label: 'تواصل معنا' },
  ];

  const handleNavClick = (viewId: string) => {
    setMobileMenuOpen(false);
    onNavigate(viewId);
  };

  const waLink = getWhatsAppLink('مرحباً سهلا، أود الاستفسار عن الشحن والتوريد.', whatsappNumber);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all text-right">
      {/* Top corporate bar */}
      <div className="bg-[#0F172A] text-slate-200 text-xs py-2 px-4 hidden md:block border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-slate-300">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F5B800] animate-pulse"></span>
              المقر الرئيسي: ميناء بورتسودان - جمهورية السودان
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-[#F5B800] font-semibold">مستودعاتنا: قوانغتشو • دبي • جدة</span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#F5B800]" />
              <span>محادثة واتساب فورية</span>
            </a>
            <button
              onClick={() => onNavigate('erp')}
              className="flex items-center gap-1.5 text-[#F5B800] hover:text-amber-300 transition-colors border-r border-slate-700 pr-3 mr-1 font-bold"
              title="الدخول إلى منصة إدارة الموارد والعمليات"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>منصة سهلا ERP الداخلية</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo with Golden Yellow (#F5B800) badge mark */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center text-right focus:outline-none"
          >
            <Logo size="md" variant="light" />
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-3 py-2 text-xs xl:text-sm font-semibold rounded-xl transition-colors ${
                  currentView === item.id
                    ? 'text-slate-950 bg-amber-50 font-bold text-[#D99B00]'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/80'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Action Buttons: Tracking, Request, and ERP Entry */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('track')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                currentView === 'track'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-300 text-slate-900 hover:border-slate-900 hover:bg-slate-50'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-[#D99B00]" />
              <span>تتبع الشحنة</span>
            </button>

            <button
              onClick={() => onNavigate('request')}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-black text-slate-950 rounded-xl bg-[#F5B800] hover:bg-[#E0A600] shadow-sm shadow-[#F5B800]/25 transition-all hover:shadow-md active:scale-95"
            >
              <span>طلب عرض سعر</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onNavigate('erp')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-white bg-[#0F172A] hover:bg-slate-800 rounded-xl shadow-sm transition-all border border-slate-700"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#F5B800]" />
              <span>نظام الـ ERP</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => onNavigate('erp')}
              className="px-2.5 py-1.5 text-xs font-bold text-slate-950 bg-[#F5B800] rounded-lg flex items-center gap-1"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>ERP</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-950 focus:outline-none rounded-lg hover:bg-slate-100"
              aria-label="القائمة الرئيسية"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2 text-right">
          <div className="grid grid-cols-2 gap-2 pt-2 pb-3">
            <button
              onClick={() => {
                onNavigate('request');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-4 text-xs font-bold text-slate-950 bg-[#F5B800] rounded-xl text-center shadow-sm"
            >
              طلب عرض سعر شحن
            </button>
            <button
              onClick={() => {
                onNavigate('track');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-4 text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 rounded-xl text-center"
            >
              تتبع الشحنة
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="w-full text-right py-3 px-2 text-sm font-semibold flex items-center justify-between text-slate-700 hover:text-slate-950"
              >
                <span>{item.label}</span>
              </button>
            ))}
            <button
              onClick={() => {
                onNavigate('erp');
                setMobileMenuOpen(false);
              }}
              className="w-full text-right py-3 px-2 text-xs font-bold text-[#D99B00] flex items-center gap-2 pt-3"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>الدخول لمنصة سهلا ERP (إدارة العمليات)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
