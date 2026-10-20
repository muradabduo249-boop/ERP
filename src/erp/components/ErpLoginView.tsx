import React, { useState } from 'react';
import { Logo } from '../../components/Logo';
import { useErpAuth } from '../context/ErpAuthContext';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

interface ErpLoginViewProps {
  onLoginSuccess?: () => void;
}

export const ErpLoginView: React.FC<ErpLoginViewProps> = ({ onLoginSuccess }) => {
  const { login } = useErpAuth();

  const [username, setUsername] = useState('admin');
  const [pin, setPin] = useState('1234');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login(username, pin);
      setIsLoading(false);
      if (res.success) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setError(res.error || 'اسم المستخدم أو رمز PIN غير صحيح');
      }
    } catch {
      setIsLoading(false);
      setError('حدث خطأ أثناء محاولة تسجيل الدخول');
    }
  };

  const quickAccounts = [
    { label: 'عبد الهادي (المدير العام)', id: 'admin' },
    { label: 'عمر (مكتب الصين والتوريد)', id: 'omar' },
    { label: 'مقداد (التنسيق الميداني)', id: 'miqdad' },
    { label: 'أحمد (العمليات والمتابعة)', id: 'ahmed' },
    { label: 'هشام (التوزيع والتوصيل)', id: 'hisham' },
    { label: 'راجي (المبيعات وCRM)', id: 'raji' },
    { label: 'تيسير (خدمة العملاء والدعم)', id: 'tayseer' },
    { label: 'تسابيح (المشتريات والتوريد)', id: 'tasabeeh' },
  ];

  const handleQuickSelect = async (accId: string) => {
    setUsername(accId);
    setPin('1234');
    setError(null);
    setIsLoading(true);
    try {
      const res = await login(accId, '1234');
      setIsLoading(false);
      if (res.success) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setError(res.error || 'اسم المستخدم أو رمز PIN غير صحيح');
      }
    } catch {
      setIsLoading(false);
      setError('حدث خطأ أثناء محاولة تسجيل الدخول');
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F5F8FC] flex items-center justify-center p-4 selection:bg-[#2563EB]/20 selection:text-[#172033] font-sans"
      dir="rtl"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-blue-500/5 p-6 sm:p-8 space-y-6 text-right">
        {/* Brand & Header */}
        <div className="space-y-3">
          <div className="inline-block">
            <Logo size="md" variant="light" showSubtitle={false} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#172033]">تسجيل الدخول</h1>
            <p className="text-xs text-[#64748B] mt-0.5">أدخل بيانات حسابك للمتابعة</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#172033]">اسم المستخدم</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin, customs, finance..."
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 border border-[#E2E8F0] text-[#172033] placeholder-[#64748B]/60 text-xs font-mono font-medium focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-hidden transition-all text-left"
                dir="ltr"
              />
              <User className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* PIN */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#172033]">رمز PIN</label>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-[11px] text-[#64748B] hover:text-[#2563EB] flex items-center gap-1 cursor-pointer transition-colors"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPin ? 'إخفاء' : 'إظهار'}</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                maxLength={10}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 border border-[#E2E8F0] text-[#172033] placeholder-[#64748B]/60 text-sm font-mono tracking-widest focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 outline-hidden transition-all text-center"
                dir="ltr"
              />
              <Lock className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            {isLoading ? (
              <span>جارٍ التحقق...</span>
            ) : (
              <>
                <span>دخول</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Accounts */}
        <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
          <div className="text-[11px] font-semibold text-[#64748B]">حسابات سريعة:</div>
          <div className="grid grid-cols-2 gap-1.5">
            {quickAccounts.map((acc) => {
              const active = username === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleQuickSelect(acc.id)}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                    active
                      ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-bold shadow-xs'
                      : 'bg-slate-50 border-[#E2E8F0] text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
                  }`}
                >
                  {acc.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
