import React, { useState } from 'react';
import { useErpAuth } from '../../context/ErpAuthContext';
import { erpEngine } from '../../engine/erpEngine';
import { MasterDataItem } from '../../../types';
import {
  Database,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  X,
  Layers,
  DollarSign,
  MapPin,
  Box,
  Scale
} from 'lucide-react';

export const MasterDataView: React.FC = () => {
  const { currentUser, refreshData } = useErpAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New item form
  const [newCategory, setNewCategory] = useState<MasterDataItem['category']>('request_type');
  const [newCode, setNewCode] = useState('');
  const [newNameAr, setNewNameAr] = useState('');
  const [newNameEn, setNewNameEn] = useState('');

  const allItems = erpEngine.getMasterData();

  const filteredItems = allItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameAr.includes(searchQuery) ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newNameAr.trim()) return;

    erpEngine.addMasterDataItem(
      {
        category: newCategory,
        code: newCode.trim().toUpperCase(),
        nameAr: newNameAr.trim(),
        nameEn: newNameEn.trim() || newCode.trim(),
        sortOrder: allItems.length + 1,
        isActive: true,
      },
      currentUser
    );

    setShowAddModal(false);
    setNewCode('');
    setNewNameAr('');
    setNewNameEn('');
    refreshData();
  };

  const categories = [
    { id: 'all', label: 'كافة التصنيفات المرجعية' },
    { id: 'request_type', label: 'أنواع طلبات الخدمة' },
    { id: 'currency', label: 'العملات والرموز' },
    { id: 'port_code', label: 'الموانئ والمحطات' },
    { id: 'container_size', label: 'أحجام الحاويات' },
  ];

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-5 h-5 text-[#D99B00]" />
            <h2 className="text-xl font-bold text-slate-900">البيانات المرجعية والأساسية (Master Data)</h2>
          </div>
          <p className="text-xs text-slate-500">
            جداول الإسناد الموحدة تمنع إدخال نصوص حرة مكررة وتضمن اتساق الحسابات والعمليات.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#F5B800]" />
          <span>إضافة بند مرجعي جديد</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="بحث بالرمز أو الاسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[#E2E8F0] text-xs text-[#172033] bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
          />
          <Search className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-slate-100 text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="py-4 px-5">التصنيف</th>
                <th className="py-4 px-5">الكود المرجعي (Code)</th>
                <th className="py-4 px-5">الاسم بالعربية</th>
                <th className="py-4 px-5">الاسم بالإنجليزية</th>
                <th className="py-4 px-5">بيانات إضافية (Metadata)</th>
                <th className="py-4 px-5 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    لا توجد بنود تطابق معايير البحث الحالية.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-500">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-mono">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold text-[#0F172A]">
                      {item.code}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      {item.nameAr}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-600 font-sans" dir="ltr">
                      {item.nameEn}
                    </td>
                    <td className="py-3.5 px-5 text-[11px] text-slate-500 font-mono">
                      {item.metadata ? JSON.stringify(item.metadata) : '-'}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>نشط</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-right space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-base font-bold text-slate-900">إضافة بند بيانات أساسية جديد</h3>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">التصنيف المرجعي</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                >
                  <option value="request_type">نوع طلب خدمة (Request Type)</option>
                  <option value="currency">عملة مالية (Currency)</option>
                  <option value="port_code">ميناء أو محطة (Port)</option>
                  <option value="container_size">حجم حاوية (Container Size)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الكود الثابت (Code)</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: AIR_CARGO أو EUR أو CN_SHANGHAI"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم بالعربية</label>
                <input
                  type="text"
                  required
                  placeholder="الاسم العربي للبند..."
                  value={newNameAr}
                  onChange={(e) => setNewNameAr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم بالإنجليزية</label>
                <input
                  type="text"
                  placeholder="English Name..."
                  value={newNameEn}
                  onChange={(e) => setNewNameEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-sans"
                  dir="ltr"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  حفظ البند المرجعي
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
