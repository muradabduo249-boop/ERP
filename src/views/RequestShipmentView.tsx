import React, { useState } from 'react';
import {
  Package,
  MapPin,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  User,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { SUDAN_CITIES } from '../lib/constants';
import { getWhatsAppLink } from '../lib/whatsapp';
import { erpEngine } from '../erp/engine/erpEngine';

interface RequestShipmentViewProps {
  initialOrigin?: string;
  onNavigateHome: () => void;
  onTrack: (code?: string) => void;
  whatsappNumber?: string;
}

export const RequestShipmentView: React.FC<RequestShipmentViewProps> = ({
  initialOrigin,
  onNavigateHome,
  onTrack,
  whatsappNumber,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [origin, setOrigin] = useState(initialOrigin || 'الصين');
  const [destinationCity, setDestinationCity] = useState('بورتسودان (المقر والميناء الرئيسي)');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdOrderCode, setCreatedOrderCode] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('يرجى إدخال اسم العميل أو اسم الشركة.');
      return;
    }
    if (!whatsapp.trim()) {
      setErrorMessage('يرجى إدخال رقم الواتساب للتواصل ومتابعة التسعيرة.');
      return;
    }
    if (!productName.trim()) {
      setErrorMessage('يرجى إدخال نوع البضاعة المراد شحنها.');
      return;
    }

    setLoading(true);
    try {
      // 1. Check or create customer in Customer Master via erpEngine
      const systemUser = erpEngine.getUsers()[0];
      const dupCheck = erpEngine.checkCustomerDuplicates(whatsapp, customerName);
      let customer = dupCheck.matches[0];

      if (!customer) {
        customer = erpEngine.createCustomer(
          {
            companyName: customerName,
            contactName: customerName,
            businessType: 'commercial',
            primaryPhone: whatsapp,
            whatsapp,
            country: 'السودان',
            city: destinationCity.split(' ')[0] || 'بورتسودان',
            status: 'active',
            notes: `مسجل تلقائياً عبر نموذج طلب الشحن بالموقع الإلكتروني - مسار: ${origin}`,
          },
          systemUser
        );
      }

      // 2. Create the Request Header in ERP
      const newRequest = erpEngine.createRequest(
        {
          customerId: customer.id,
          requestTypeCode: origin.includes('الصين') ? 'PURCHASE_AND_SHIP' : 'SHIPPING_LCL',
          title: `طلب شحن: ${productName} من [${origin}] إلى [${destinationCity}] - كمية: ${quantity || 'غير محددة'}`,
          priority: 'normal',
          notes: description ? `وصف البضاعة والملاحظات: ${description}` : undefined,
        },
        systemUser
      );

      setCreatedOrderCode(newRequest.requestCode);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ الطلب.');
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS STATE
  if (createdOrderCode) {
    const waText = `مرحباً سهلا، لقد سجلت طلب شحن برقم: ${createdOrderCode}. الاسم: ${customerName}، البضاعة: ${productName}، المسار: من ${origin} إلى ${destinationCity}.`;
    const waOrderLink = getWhatsAppLink(waText, whatsappNumber);

    return (
      <div className="py-20 bg-[#F8FAFC] min-h-[80vh] flex items-center justify-center text-right">
        <div className="max-w-xl mx-auto px-4 w-full">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-[#F5B800]/20 text-slate-950 flex items-center justify-center mx-auto border border-[#F5B800]/40">
              <CheckCircle2 className="w-10 h-10 text-slate-900" />
            </div>

            <div>
              <h2 className="text-3xl font-black text-slate-900">
                تم استلام طلبكم بنجاح!
              </h2>
              <p className="text-slate-600 text-sm mt-2">
                تم تسجيل الطلب في نظام سهلا للعمليات وتخصيص كود الطلب المعتمد التالي:
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 space-y-2 text-right">
              <div className="flex justify-between items-center text-xs text-slate-500 pb-2 border-b border-slate-200">
                <span>كود الطلب المعتمد:</span>
                <span className="font-mono font-bold text-slate-900 text-base text-[#D99B00]">{createdOrderCode}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">اسم العميل:</span>
                <span className="font-bold text-slate-900">{customerName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">مسار الشحن:</span>
                <span className="font-bold text-slate-900">{origin} ➔ {destinationCity}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">نوع البضاعة:</span>
                <span className="font-bold text-slate-900">{productName}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <a
                href={waOrderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 rounded-xl font-black text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] flex items-center justify-center gap-2 text-sm transition-all shadow-md shadow-[#F5B800]/25"
              >
                <PhoneCall className="w-4 h-4 text-slate-950" />
                <span>تأكيد الطلب عبر الواتساب مع الفريق</span>
              </a>
              <button
                onClick={onNavigateHome}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-2 text-sm transition-all"
              >
                <span>العودة للصفحة الرئيسية</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16 bg-[#F8FAFC] min-h-screen text-right">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5B800]/15 text-xs font-bold text-slate-900 border border-[#F5B800]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#D99B00]" />
            <span>طلب تسعيرة شحن وتوريد</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            احصل على أفضل تسعيرة لشحنتك
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
            أدخل تفاصيل شحنتك وسيقوم فريق التسعير بحساب التكلفة الدقيقة وتزويدكم بعرض شامل للجمارك والشحن.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-8 p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex-1">
              <div className="font-bold">تنبيه</div>
              <div>{errorMessage}</div>
            </div>
          </div>
        )}

        {/* Main Request Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-right"
        >
          {/* Section 1: Customer Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-5 h-5 text-[#D99B00]" />
              <h2 className="text-lg font-bold text-slate-900">بيانات العميل</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الاسم الكامل أو اسم الشركة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة النيل الأزرق / عمر صديق"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20 text-sm text-slate-900 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رقم الهاتف أو WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="مثال: +249 912 345 678"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20 text-sm text-slate-900 transition-all text-right"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Origin & Destination */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <MapPin className="w-5 h-5 text-[#D99B00]" />
              <h2 className="text-lg font-bold text-slate-900">مسار الشحن</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  بلد المغادرة / المصدر <span className="text-rose-500">*</span>
                </label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20 text-sm text-slate-900 bg-white transition-all"
                >
                  <option value="الصين">الصين (مستودع قوانغتشو وإيوو وفوشان)</option>
                  <option value="الإمارات">الإمارات (دبي - جبل علي)</option>
                  <option value="السعودية">المملكة العربية السعودية (ميناء جدة)</option>
                  <option value="الأسواق العالمية">الأسواق العالمية (مواقع إلكترونية)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  المدينة الوجهة في السودان <span className="text-rose-500">*</span>
                </label>
                <select
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20 text-sm text-slate-900 bg-white transition-all"
                >
                  {SUDAN_CITIES.map((city, idx) => (
                    <option key={idx} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Goods Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Package className="w-5 h-5 text-[#D99B00]" />
              <h2 className="text-lg font-bold text-slate-900">تفاصيل البضاعة</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نوع المنتج / البضاعة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ألواح طاقة شمسية، أقمشة، قطع غيار"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20 text-sm text-slate-900 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الكمية أو الحجم التقديري (CBM)
                </label>
                <input
                  type="text"
                  placeholder="مثال: 3 CBM أو 50 كرتونة أو حاوية 20 قدم"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20 text-sm text-slate-900 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ملاحظات إضافية أو روابط المنتج
              </label>
              <textarea
                rows={3}
                placeholder="أدخل أي مواصفات فنية أو تفاصيل ترغب في توضيحها..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20 text-sm text-slate-900 transition-all"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-black text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] shadow-md shadow-[#F5B800]/25 transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 active:scale-95"
            >
              <span>{loading ? 'جارٍ المعالجة...' : 'إرسال طلب التسعيرة'}</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onNavigateHome}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              إلغاء والعودة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
