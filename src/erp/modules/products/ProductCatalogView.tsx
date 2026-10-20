import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  DollarSign,
  Tag,
  Building,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit2,
  Layers,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  X,
} from 'lucide-react';
import { useErpAuth } from '../../context/ErpAuthContext';

export interface ProductItem {
  id: string;
  sku: string;
  nameAr: string;
  nameEn?: string;
  categoryId?: string;
  categoryNameAr?: string;
  description?: string;
  unit: string;
  defaultCurrency: string;
  costPrice: string;
  sellingPrice: string;
  supplierId?: string;
  supplierName?: string;
  minOrderQty: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  code: string;
  nameAr: string;
  nameEn?: string;
  description?: string;
  status: string;
}

export const ProductCatalogView: React.FC = () => {
  const { currentUser, sessionToken } = useErpAuth();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string; country?: string; supplierCode?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Product Form State
  const [sku, setSku] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [costPrice, setCostPrice] = useState('0.00');
  const [sellingPrice, setSellingPrice] = useState('0.00');
  const [minOrderQty, setMinOrderQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Category Form State
  const [catCode, setCatCode] = useState('');
  const [catNameAr, setCatNameAr] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const fetchCatalogData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = sessionToken || localStorage.getItem('sahla_erp_auth_token_v1');
      const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const [prodsRes, catsRes, suppsRes] = await Promise.all([
        fetch('/api/products', { headers: authHeader, credentials: 'include' }),
        fetch('/api/products/categories', { headers: authHeader, credentials: 'include' }),
        fetch('/api/suppliers?limit=100', { headers: authHeader, credentials: 'include' }).catch(() => null),
      ]);

      const prodsData = await prodsRes.json();
      const catsData = await catsRes.json();

      if (prodsData.success) {
        setProducts(prodsData.data || []);
      }
      if (catsData.success) {
        setCategories(catsData.data || []);
      }
      if (suppsRes && suppsRes.ok) {
        const suppsData = await suppsRes.json();
        if (suppsData.success) {
          setSuppliers(suppsData.data || []);
        }
      }
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل بيانات كتالوج المنتجات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, [sessionToken]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) return;
    setModalError(null);

    try {
      setSubmitting(true);
      const token = sessionToken || localStorage.getItem('sahla_erp_auth_token_v1');
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          sku: sku.trim() || undefined,
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim() || undefined,
          categoryId: categoryId || undefined,
          supplierId: supplierId || undefined,
          description: description.trim() || undefined,
          unit,
          defaultCurrency,
          costPrice: parseFloat(costPrice) || 0,
          sellingPrice: parseFloat(sellingPrice) || 0,
          minOrderQty: parseInt(String(minOrderQty)) || 1,
        }),
      });

      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.error?.message || 'فشل في إضافة المنتج');
      }

      // Reset form & reload
      setSku('');
      setNameAr('');
      setNameEn('');
      setCategoryId('');
      setSupplierId('');
      setDescription('');
      setCostPrice('0.00');
      setSellingPrice('0.00');
      setMinOrderQty(1);
      setModalError(null);
      setShowAddProductModal(false);
      fetchCatalogData();
    } catch (err: any) {
      setModalError(err.message || 'حدث خطأ أثناء إضافة المنتج');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameAr.trim()) return;

    try {
      setSubmitting(true);
      const token = sessionToken || localStorage.getItem('sahla_erp_auth_token_v1');
      const res = await fetch('/api/products/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          code: catCode.trim() || undefined,
          nameAr: catNameAr.trim(),
          nameEn: catNameEn.trim() || undefined,
          description: catDesc.trim() || undefined,
        }),
      });

      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.error?.message || 'فشل في إضافة التصنيف');
      }

      setCatCode('');
      setCatNameAr('');
      setCatNameEn('');
      setCatDesc('');
      setShowAddCategoryModal(false);
      fetchCatalogData();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      setSubmitting(true);
      const token = sessionToken || localStorage.getItem('sahla_erp_auth_token_v1');
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          nameAr: editingProduct.nameAr,
          nameEn: editingProduct.nameEn,
          categoryId: editingProduct.categoryId,
          supplierId: editingProduct.supplierId || null,
          unit: editingProduct.unit,
          defaultCurrency: editingProduct.defaultCurrency,
          costPrice: parseFloat(editingProduct.costPrice) || 0,
          sellingPrice: parseFloat(editingProduct.sellingPrice) || 0,
          minOrderQty: editingProduct.minOrderQty,
          description: editingProduct.description,
          status: editingProduct.status,
        }),
      });

      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.error?.message || 'فشل في تحديث بيانات المنتج');
      }

      setEditingProduct(null);
      fetchCatalogData();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nameAr.includes(searchTerm) ||
      (p.nameEn && p.nameEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.supplierName && p.supplierName.includes(searchTerm)) ||
      (p.description && p.description.includes(searchTerm));

    const matchesCategory =
      selectedCategory === 'all' || p.categoryId === selectedCategory;

    const matchesSupplier =
      selectedSupplierFilter === 'all' || p.supplierId === selectedSupplierFilter;

    const matchesStatus =
      statusFilter === 'all' || p.status === statusFilter;

    return matchesSearch && matchesCategory && matchesSupplier && matchesStatus;
  });

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">كتالوج المنتجات والسلع العالمية</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                دليل السلع والبضائع ومواصفاتها الفنية وأسعار التكلفة والبيع من مصانع الصين
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>تصنيف جديد</span>
          </button>

          <button
            onClick={() => setShowAddProductModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج</span>
          </button>

          <button
            onClick={fetchCatalogData}
            title="تحديث البيانات"
            className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">إجمالي المنتجات</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900">{products.length}</span>
            <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md font-medium">
              مسجلة
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">التصنيفات المعتمدة</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900">{categories.length}</span>
            <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-medium">
              تصنيف
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">المنتجات النشطة</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-600">
              {products.filter((p) => p.status === 'active').length}
            </span>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
              متاحة للطلب
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">هامش الربح المتوسط</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-blue-600">
              {products.length > 0
                ? (
                    products.reduce((acc, p) => {
                      const cost = parseFloat(p.costPrice) || 0;
                      const sell = parseFloat(p.sellingPrice) || 0;
                      return acc + (cost > 0 ? ((sell - cost) / cost) * 100 : 0);
                    }, 0) / products.length
                  ).toFixed(1) + '%'
                : '0.0%'}
            </span>
            <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-medium">
              تقديري
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالكود (SKU)، اسم المنتج، الوصف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 cursor-pointer focus:outline-hidden focus:border-teal-500"
          >
            <option value="all">كافة التصنيفات ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameAr}
              </option>
            ))}
          </select>

          {/* Supplier Filter */}
          <select
            value={selectedSupplierFilter}
            onChange={(e) => setSelectedSupplierFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 cursor-pointer focus:outline-hidden focus:border-teal-500"
          >
            <option value="all">كافة الموردين ({suppliers.length})</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.supplierCode ? `[${s.supplierCode}] ` : ''}{s.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 cursor-pointer focus:outline-hidden focus:border-teal-500"
          >
            <option value="all">كافة الحالات</option>
            <option value="active">النشطة فقط</option>
            <option value="inactive">المعطلة</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2 text-teal-600" />
            <p className="text-xs">جارِ تحميل كتالوج المنتجات...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">لا توجد منتجات مطابقة لخيارات البحث</p>
            <p className="text-xs text-slate-400 mt-1">
              يمكنك إضافة منتج جديد بالضغط على زر "إضافة منتج" بالأعلى
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">كود المنتج (SKU)</th>
                  <th className="py-3 px-4">اسم المنتج والوصف</th>
                  <th className="py-3 px-4">التصنيف</th>
                  <th className="py-3 px-4">المورد / المصنع</th>
                  <th className="py-3 px-4">الوحدة</th>
                  <th className="py-3 px-4">سعر التكلفة</th>
                  <th className="py-3 px-4">سعر البيع</th>
                  <th className="py-3 px-4">أدنى كمية (MOQ)</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.map((p) => {
                  const cost = parseFloat(p.costPrice) || 0;
                  const sell = parseFloat(p.sellingPrice) || 0;
                  const margin = cost > 0 ? (((sell - cost) / cost) * 100).toFixed(0) : '0';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-teal-700">
                        {p.sku}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900">{p.nameAr}</div>
                        {p.nameEn && <div className="text-[11px] text-slate-400">{p.nameEn}</div>}
                        {p.description && (
                          <div className="text-[11px] text-slate-500 truncate mt-0.5" title={p.description}>
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                          {p.categoryNameAr || 'عام'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {p.supplierName ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                            <Building className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[140px]" title={p.supplierName}>{p.supplierName}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">غير محدد</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.unit === 'pcs' ? 'قطعة' : p.unit === 'carton' ? 'كرتونة' : p.unit === 'kg' ? 'كجم' : p.unit}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">
                        {cost.toFixed(2)} {p.defaultCurrency}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div>
                          {sell.toFixed(2)} {p.defaultCurrency}
                        </div>
                        {cost > 0 && (
                          <span className="text-[10px] text-emerald-600 font-sans">
                            +{margin}% ربح
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {p.minOrderQty}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            p.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {p.status === 'active' ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setEditingProduct({ ...p })}
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          title="تعديل المنتج"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD PRODUCT */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-600">
                <Package className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">إضافة منتج جديد للكتالوج</h3>
              </div>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddProduct} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">كود الصنف (SKU - اختياري)</label>
                  <input
                    type="text"
                    placeholder="تلقائي (PRD-XXXX)"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:border-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">التصنيف</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:border-teal-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="">بدون تصنيف</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">المورد / المصنع المعتمد</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:border-teal-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="">بدون مورد محدد</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.supplierCode ? `[${s.supplierCode}] ` : ''}{s.name} {s.country ? `(${s.country})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">اسم المنتج بالعربية *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: بلاط بورسلين فوشان 60×120 سم"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">اسم المنتج بالإنجليزية (مفيد لمصانع الصين)</label>
                <input
                  type="text"
                  placeholder="e.g. Foshan Porcelain Tile 60x120cm"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-hidden text-left font-mono"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">الوحدة</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:border-teal-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="pcs">قطعة (pcs)</option>
                    <option value="carton">كرتونة (carton)</option>
                    <option value="kg">كيلوجرام (kg)</option>
                    <option value="cbm">متر مكعب (cbm)</option>
                    <option value="set">طقم (set)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">العملة</label>
                  <select
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:border-teal-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="CNY">يوان صيني (CNY)</option>
                    <option value="AED">درهم إماراتي (AED)</option>
                    <option value="SDG">جنيه سوداني (SDG)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">أدنى كمية للطلب</label>
                  <input
                    type="number"
                    min="1"
                    value={minOrderQty}
                    onChange={(e) => setMinOrderQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">سعر التكلفة من المصنع</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:border-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">سعر البيع المقترح للعميل</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:border-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">الوصف والمواصفات الفنية</label>
                <textarea
                  rows={2}
                  placeholder="المواصفات الفنية، القياسات، معايير التغليف، إلخ..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'جارِ الحفظ...' : 'حفظ المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CATEGORY */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600">
                <Layers className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">إضافة تصنيف منتجات جديد</h3>
              </div>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">كود التصنيف (اختياري)</label>
                <input
                  type="text"
                  placeholder="e.g. CAT-FURNITURE"
                  value={catCode}
                  onChange={(e) => setCatCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-left focus:border-indigo-500 focus:outline-hidden"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">اسم التصنيف بالعربية *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أثاث ومفروشات مكتبية"
                  value={catNameAr}
                  onChange={(e) => setCatNameAr(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">اسم التصنيف بالإنجليزية</label>
                <input
                  type="text"
                  placeholder="e.g. Office Furniture"
                  value={catNameEn}
                  onChange={(e) => setCatNameEn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-hidden text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">وصف التصنيف</label>
                <textarea
                  rows={2}
                  placeholder="وصف مختصر لمجموعة السلع تحت هذا التصنيف"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'جارِ الحفظ...' : 'حفظ التصنيف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PRODUCT */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-600">
                <Edit2 className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">تعديل المنتج ({editingProduct.sku})</h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">اسم المنتج بالعربية *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.nameAr}
                  onChange={(e) => setEditingProduct({ ...editingProduct, nameAr: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">اسم المنتج بالإنجليزية</label>
                <input
                  type="text"
                  value={editingProduct.nameEn || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-left focus:border-teal-500 focus:outline-hidden"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">التصنيف</label>
                  <select
                    value={editingProduct.categoryId || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:border-teal-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="">بدون تصنيف</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">المورد / المصنع</label>
                  <select
                    value={editingProduct.supplierId || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, supplierId: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:border-teal-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="">بدون مورد محدد</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.supplierCode ? `[${s.supplierCode}] ` : ''}{s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">الحالة</label>
                  <select
                    value={editingProduct.status}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:border-teal-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">معطل</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">سعر التكلفة</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.costPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:border-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">سعر البيع</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.sellingPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sellingPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:border-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">الوصف</label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'جارِ التحديث...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
