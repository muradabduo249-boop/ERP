import React, { useState } from 'react';
import { useErpAuth } from '../context/ErpAuthContext';
import {
  User,
  Shield,
  KeyRound,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile, changePassword } = useErpAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile fields
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status indicators
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!name.trim()) {
      setStatusMessage({ type: 'error', text: 'الاسم الكامل مطلوب' });
      return;
    }

    try {
      setIsSubmitting(true);
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      setStatusMessage({ type: 'success', text: 'تم تحديث بيانات ملفك الشخصي بنجاح' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'فشل تحديث البيانات' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!currentPassword) {
      setStatusMessage({ type: 'error', text: 'يرجى إدخال كلمة المرور الحالية' });
      return;
    }
    if (newPassword.length < 4) {
      setStatusMessage({ type: 'error', text: 'كلمة المرور الجديدة يجب ألا تقل عن 4 خانات' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقين' });
      return;
    }

    try {
      setIsSubmitting(true);
      await changePassword(currentPassword, newPassword);
      setStatusMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح. يرجى استخدامها في المرات القادمة.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'فشل تغيير كلمة المرور' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 text-right space-y-4 shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div>
            <h3 className="font-bold text-slate-900 text-base">الملف الشخصي وإعدادات الحساب</h3>
            <span className="text-[11px] text-slate-500 font-mono">
              المستخدم: {currentUser.username} | {currentUser.departmentNameAr}
            </span>
          </div>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            onClick={() => { setActiveTab('profile'); setStatusMessage(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            البيانات الشخصية
          </button>
          <button
            onClick={() => { setActiveTab('password'); setStatusMessage(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'password'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تغيير كلمة المرور
          </button>
        </div>

        {/* Tab 1: Profile Details */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
            {/* Read-only System Metadata */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>الدور والصلاحية:</span>
                </span>
                <span className="font-bold text-slate-900">{currentUser.roleNameAr}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>القسم المعتمد:</span>
                </span>
                <span className="font-bold text-slate-900">{currentUser.departmentNameAr}</span>
              </div>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                * الصلاحيات والأقسام يتم تعديلها من قبل المدير العام فقط لحماية حوكمة المنظومة.
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الاسم الكامل *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">رقم الهاتف</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+249..."
                  className="w-full px-3 py-2 pl-9 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs font-mono text-right"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@sahla.sd"
                  className="w-full px-3 py-2 pl-9 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs font-mono text-right"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                إغلاق
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Change Password */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">كلمة المرور الحالية *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pl-9 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs font-mono text-right"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">كلمة المرور الجديدة *</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={4}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="لا تقل عن 4 خانات"
                  className="w-full px-3 py-2 pl-9 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs font-mono text-right"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">تأكيد كلمة المرور الجديدة *</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={4}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="إعادة كتابة كلمة المرور الجديدة"
                  className="w-full px-3 py-2 pl-9 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs font-mono text-right"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                إغلاق
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
