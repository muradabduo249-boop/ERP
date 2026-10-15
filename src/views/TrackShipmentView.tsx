import React, { useState, useEffect } from 'react';
import {
  Search,
  Clock,
  Ship,
  AlertCircle,
  PhoneCall,
  FileText,
  Printer,
  Download,
  Building2,
  CheckCircle2,
  Box,
  Layers,
  FileCheck2,
  ExternalLink
} from 'lucide-react';
import { PublicTrackingData, ShipmentStatusKey } from '../types';
import { STATUS_LIST, SAMPLE_SHIPMENTS } from '../lib/constants';
import { getWhatsAppLink } from '../lib/whatsapp';
import { erpEngine } from '../erp/engine/erpEngine';
import { ErpDocumentPrintModal } from '../erp/components/ErpDocumentPrintModal';

interface TrackShipmentViewProps {
  initialCode?: string;
  onNavigateRequest?: () => void;
  whatsappNumber?: string;
}

export const TrackShipmentView: React.FC<TrackShipmentViewProps> = ({
  initialCode,
  whatsappNumber,
}) => {
  const [trackingNumber, setTrackingNumber] = useState(initialCode || '');
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<PublicTrackingData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Available live ERP shipments & requests for quick testing
  const erpShipments = erpEngine.getShipments();
  const erpRequests = erpEngine.getRequests();

  const fetchTracking = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setErrorMessage('يرجى إدخال رقم التتبع أو بوليصة الشحن أو كود الطلب.');
      return;
    }
    setLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      // 1. Check in SAHLA ERP Shipments
      const matchedShipment = erpShipments.find(
        (s) =>
          s.shipmentCode.toUpperCase() === clean ||
          s.blNumber?.toUpperCase() === clean ||
          s.containerNumber?.toUpperCase() === clean
      );

      if (matchedShipment) {
        const linkedReq = erpRequests.find((r) => r.id === matchedShipment.requestId);
        const inspections = erpEngine.getInspections().filter((i) => i.requestId === matchedShipment.requestId);
        const customs = erpEngine.getCustomsDeclarations().find((c) => c.requestId === matchedShipment.requestId);
        const pod = erpEngine.getProofsOfDelivery().find((p) => p.requestId === matchedShipment.requestId);

        // Fetch public attachments
        const rawAtts = [
          ...erpEngine.getAttachmentsByEntity('shipment', matchedShipment.id),
          ...erpEngine.getAttachmentsByEntity('request', matchedShipment.requestId),
        ].filter((a) => a.visibility === 'public_tracking');

        const publicDocs = rawAtts.map((att) => ({
          id: att.id,
          name: att.fileName,
          type: att.fileType,
          date: att.uploadedAt.split('T')[0],
          url: att.fileUrl,
          category: att.category,
        }));

        // Map status to ShipmentStatusKey
        let mappedStatus: ShipmentStatusKey = 'Order Received';
        let statusAr = 'تم حجز وتجهيز مسار الشحن';

        if (matchedShipment.transitStatus === 'delivered' || pod) {
          mappedStatus = 'Delivered';
          statusAr = 'تم التسليم النهائي للعميل واستلام السند';
        } else if (customs && customs.status === 'customs_released') {
          mappedStatus = 'Customs';
          statusAr = 'تم الإفراج الجمركي بميناء بورتسودان';
        } else if (matchedShipment.transitStatus === 'under_customs' || (customs && customs.status !== 'customs_released')) {
          mappedStatus = 'Customs';
          statusAr = 'تحت إجراءات التخليص الجمركي بميناء بورتسودان';
        } else if (matchedShipment.transitStatus === 'arrived_port_sudan') {
          mappedStatus = 'Sudan';
          statusAr = 'وصلت السفينة إلى ميناء بورتسودان';
        } else if (matchedShipment.transitStatus === 'in_transit_red_sea') {
          mappedStatus = 'In Transit';
          statusAr = 'في المسار الملاحي للبحر الأحمر متجهة لبورتسودان';
        } else if (matchedShipment.transitStatus === 'vessel_departed') {
          mappedStatus = 'Shipped';
          statusAr = 'أبحرت السفينة من ميناء التحميل بالصين';
        } else if (inspections.some((i) => i.result === 'passed')) {
          mappedStatus = 'Preparing';
          statusAr = 'تم فحص الجودة وتجهيز الحاوية للإبحار';
        }

        // Build milestones
        const milestones = [
          {
            date: matchedShipment.createdAt.split('T')[0],
            location: matchedShipment.originPort || 'ميناء التحميل (الصين)',
            title: 'تسجيل الشحنة وحجز المساحة الملاحية',
            description: `تم ربط الشحنة بالطلب المركزي ${matchedShipment.requestCode} وتأكيد الحجز لدى خط الشحن ${matchedShipment.shippingLineOrCarrier}.`,
          },
        ];

        if (inspections.length > 0) {
          milestones.push({
            date: inspections[0].inspectionDate || matchedShipment.createdAt.split('T')[0],
            location: 'فوشان / كوانزو - الصين',
            title: 'فحص الجودة والمطابقة الفنية',
            description: `قام المفتش ${inspections[0].inspectorName} بإجراء الفحص الفني. نتيجة الفحص: معتمد بنجاح.`,
          });
        }

        if (
          matchedShipment.transitStatus === 'vessel_departed' ||
          matchedShipment.transitStatus === 'in_transit_red_sea' ||
          matchedShipment.transitStatus === 'arrived_port_sudan' ||
          matchedShipment.transitStatus === 'under_customs' ||
          matchedShipment.transitStatus === 'delivered'
        ) {
          milestones.push({
            date: matchedShipment.etd || 'مكتمل',
            location: matchedShipment.originPort || 'ميناء كوانزو / نينغبو',
            title: 'إبحار السفينة وبدء المسار البحري',
            description: `خط الشحن: ${matchedShipment.shippingLineOrCarrier} | الحاوية: ${matchedShipment.containerNumber || 'غير محددة'} | بوليصة الشحن: ${matchedShipment.blNumber || 'قيد الإصدار'}.`,
          });
        }

        if (
          matchedShipment.transitStatus === 'arrived_port_sudan' ||
          matchedShipment.transitStatus === 'under_customs' ||
          matchedShipment.transitStatus === 'delivered'
        ) {
          milestones.push({
            date: matchedShipment.eta || 'مكتمل',
            location: 'ميناء بورتسودان (الميناء الجنوبي)',
            title: 'وصول السفينة وبدء التفريغ الجمركي',
            description: 'وصلت السفينة إلى الرصيف الملاحي بميناء بورتسودان وبدأت عمليات المناولة والتخليص.',
          });
        }

        if (pod || matchedShipment.transitStatus === 'delivered') {
          milestones.push({
            date: pod?.deliveryDate || new Date().toISOString().split('T')[0],
            location: pod?.deliveryCity || 'موقع العميل بالسودان',
            title: 'التسليم النهائي وإغلاق المعاملة (POD)',
            description: `تم تسليم البضاعة كاملة للعميل المستلم: ${pod?.recipientName || matchedShipment.customerName}.`,
          });
        }

        setTrackingData({
          trackingNumber: matchedShipment.shipmentCode,
          origin: matchedShipment.originPort || 'الصين',
          destination: matchedShipment.destinationPort || 'ميناء بورتسودان',
          shipmentType: matchedShipment.shippingMode === 'sea_fcl' ? 'شحن بحري حاوية كاملة (FCL)' : 'شحن بحري مجزأ (LCL)',
          currentStatus: mappedStatus,
          currentStatusArabic: statusAr,
          lastUpdate: new Date().toLocaleDateString('ar-SD'),
          estimatedDelivery: matchedShipment.eta || 'حسب المانيفست',
          cbm: matchedShipment.volumeCbm ? `${matchedShipment.volumeCbm} CBM` : undefined,
          events: [],
          milestones,
          publicDocuments: publicDocs,
          vesselName: matchedShipment.shippingLineOrCarrier,
          containerNumber: matchedShipment.containerNumber,
          blNumber: matchedShipment.blNumber,
          requestCode: matchedShipment.requestCode,
          customerName: matchedShipment.customerName,
          erpSource: true,
          rawErpData: matchedShipment,
        });
        setLoading(false);
        return;
      }

      // 2. Check in SAHLA ERP Requests Backbone (if tracked by REQ code)
      const matchedRequest = erpRequests.find(
        (r) => r.requestCode.toUpperCase() === clean || r.id.toUpperCase() === clean
      );

      if (matchedRequest) {
        const linked = erpEngine.getLinkedEntitiesForRequest(matchedRequest.id);
        const ship = linked.shipments[0];

        if (ship) {
          // Redirect to shipment display
          fetchTracking(ship.shipmentCode);
          return;
        }

        // Request without a dispatched shipment yet
        const rawAtts = erpEngine
          .getAttachmentsByEntity('request', matchedRequest.id)
          .filter((a) => a.visibility === 'public_tracking');

        const publicDocs = rawAtts.map((att) => ({
          id: att.id,
          name: att.fileName,
          type: att.fileType,
          date: att.uploadedAt.split('T')[0],
          url: att.fileUrl,
          category: att.category,
        }));

        let mappedStatus: ShipmentStatusKey = 'Order Received';
        let statusAr = 'تم استلام وتوثيق الطلب بالمنظومة';

        if (linked.purchaseOrders.length > 0) {
          mappedStatus = 'Purchasing';
          statusAr = 'تم إصدار أمر الشراء للمصنع وجارٍ التجهيز والتوريد';
        } else if (matchedRequest.status === 'in_progress') {
          mappedStatus = 'Purchasing';
          statusAr = 'قيد الدراسة الفنية والتسعير اللوجستي';
        }

        const milestones = [
          {
            date: matchedRequest.createdAt.split('T')[0],
            location: 'إدارة العمليات المركزية - سهلا',
            title: 'إنشاء وتوثيق الطلب بالمنظومة',
            description: `تم تسجيل الطلب ${matchedRequest.requestCode} لحساب: ${matchedRequest.customerName}.`,
          },
        ];

        if (linked.purchaseOrders.length > 0) {
          milestones.push({
            date: linked.purchaseOrders[0].createdAt.split('T')[0],
            location: 'المصنع المعتمد بالصين',
            title: 'إصدار أمر الشراء (PO) وبدء التصنيع',
            description: `تم توجيه أمر الشراء ${linked.purchaseOrders[0].poCode} للمورد: ${linked.purchaseOrders[0].supplierName}.`,
          });
        }

        setTrackingData({
          trackingNumber: matchedRequest.requestCode,
          origin: 'الصين',
          destination: 'بورتسودان (السودان)',
          shipmentType: 'طلب توريد وشحن دولي',
          currentStatus: mappedStatus,
          currentStatusArabic: statusAr,
          lastUpdate: new Date().toLocaleDateString('ar-SD'),
          estimatedDelivery: 'قيد الجدولة البحرية',
          events: [],
          milestones,
          publicDocuments: publicDocs,
          requestCode: matchedRequest.requestCode,
          customerName: matchedRequest.customerName,
          erpSource: true,
          rawErpData: matchedRequest,
        });
        setLoading(false);
        return;
      }

      // 3. Fallback to Demo Sample Shipments
      if (SAMPLE_SHIPMENTS[clean]) {
        const item = SAMPLE_SHIPMENTS[clean];
        setTrackingData({
          trackingNumber: clean,
          origin: item.origin,
          destination: item.destination,
          shipmentType: item.shippingType,
          currentStatus: item.currentStatus,
          currentStatusArabic: item.currentStatusArabic,
          lastUpdate: '2026-09-20 14:30',
          estimatedDelivery: item.estimatedArrival,
          cbm: item.cbm,
          events: [],
          milestones: item.milestones,
        });
        setLoading(false);
      } else {
        setTrackingData(null);
        setErrorMessage(
          'لم يتم العثور على شحنة أو طلب بهذا الرقم. تأكد من إدخال كود الطلب (مثل REQ-2026-000101) أو كود الشحنة (مثل SHL-2026-000101 أو SHL-DEMO-001) أو راجع خدمة العملاء.'
        );
        setLoading(false);
      }
    }, 250);
  };

  useEffect(() => {
    if (initialCode) {
      fetchTracking(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(trackingNumber);
  };

  const getCurrentStepIndex = (statusKey: ShipmentStatusKey) => {
    const found = STATUS_LIST.find((s) => s.key === statusKey);
    return found ? found.step : 1;
  };

  const currentStep = trackingData ? getCurrentStepIndex(trackingData.currentStatus) : 1;

  const waTrackLink = trackingData
    ? getWhatsAppLink(
        `مرحباً سهلا، أستفسر عن شحنتي برقم التتبع: ${trackingData.trackingNumber}.`,
        whatsappNumber
      )
    : getWhatsAppLink('مرحباً سهلا، أود الاستفسار عن تتبع شحنة.', whatsappNumber);

  return (
    <div className="py-12 sm:py-16 bg-[#F8FAFC] min-h-screen text-right">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5B800]/15 text-xs font-bold text-slate-900 border border-[#F5B800]/30">
            <Search className="w-3.5 h-3.5 text-[#D99B00]" />
            <span>نظام التتبع المباشر لعمليات سهلا (Live Logistics Tracking)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            تتبع مسار شحنتك المباشرة
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
            أدخل كود الشحنة المعتمد (مثل SHL-2026-000101) أو كود الطلب (مثل REQ-2026-000101) لمتابعة خط سير البضاعة والشهادات المرفقة.
          </p>
        </div>

        {/* Tracking Search Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="أدخل رقم الشحنة أو الطلب (مثال: SHL-2026-000101 أو REQ-2026-000101)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                dir="ltr"
                className="w-full px-5 py-4 rounded-xl border border-slate-300 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20 text-base font-mono font-bold text-slate-900 placeholder:text-slate-400 text-center sm:text-left transition-all uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 rounded-xl font-bold text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] shadow-md shadow-[#F5B800]/25 transition-all whitespace-nowrap disabled:opacity-50 active:scale-95 text-base"
            >
              {loading ? 'جارٍ البحث بالمنظومة...' : 'بحث وتتبع'}
            </button>
          </form>

          {/* Quick Demo and ERP shortcuts */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-4 mt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>نماذج سريعة للتجربة:</span>
            {erpShipments.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setTrackingNumber(erpShipments[0].shipmentCode);
                  fetchTracking(erpShipments[0].shipmentCode);
                }}
                className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-mono font-bold border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                {erpShipments[0].shipmentCode} (شحنة نشطة بالنظام)
              </button>
            )}
            {erpRequests.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setTrackingNumber(erpRequests[0].requestCode);
                  fetchTracking(erpRequests[0].requestCode);
                }}
                className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-mono font-bold border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                {erpRequests[0].requestCode} (طلب بالعمود الفقري)
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setTrackingNumber('SHL-DEMO-001');
                fetchTracking('SHL-DEMO-001');
              }}
              className="px-2.5 py-1 rounded-md bg-[#F5B800]/15 text-slate-900 font-mono font-bold border border-[#F5B800]/30 hover:bg-[#F5B800]/25 transition-colors"
            >
              SHL-DEMO-001 (شحنة تجريبية بالبحر الأحمر)
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-8 p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3 text-right">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex-1">
              <div className="font-bold">تنبيه</div>
              <div>{errorMessage}</div>
            </div>
          </div>
        )}

        {/* Tracking Result View */}
        {trackingData && (
          <div className="space-y-8 animate-in fade-in-50 duration-300">
            {/* Header Result Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-right space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-1">
                    {trackingData.erpSource ? 'كود العملية المعتمد بمنظومة سهلا' : 'رقم التتبع الملاحي'}
                  </div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                      #{trackingData.trackingNumber}
                    </h2>
                    {trackingData.erpSource && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        سجل مباشر من المنظومة ERP
                      </span>
                    )}
                  </div>
                  {trackingData.customerName && (
                    <div className="text-xs text-slate-500 mt-1">
                      العميل المسجل: <span className="font-bold text-slate-800">{trackingData.customerName}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-4 py-2 rounded-xl bg-[#F5B800]/20 border border-[#F5B800]/40 text-slate-950 font-bold text-sm flex items-center gap-2">
                    <Ship className="w-4 h-4 text-slate-900" />
                    <span>{trackingData.currentStatusArabic}</span>
                  </div>

                  {/* Print Official Tracking Waybill Sheet */}
                  <button
                    onClick={() => setShowPrintModal(true)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                    title="طباعة بوليصة التتبع الرسمية"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#F5B800]" />
                    <span>طباعة وثيقة الشحن</span>
                  </button>
                </div>
              </div>

              {/* Route & Timing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">مسار الشحن:</span>
                  <div className="text-base font-bold text-slate-900">
                    {trackingData.origin} ➔ {trackingData.destination}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-1">نوع الشحن والحجم:</span>
                  <div className="text-base font-bold text-slate-900">
                    {trackingData.shipmentType || 'شحن بحري'} {trackingData.cbm ? `(${trackingData.cbm})` : ''}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-1">الوصول المتوقع:</span>
                  <div className="text-base font-bold text-slate-900 font-mono">
                    {trackingData.estimatedDelivery || 'مجدول'}
                  </div>
                </div>
              </div>

              {/* Maritime Metadata (Vessel, Container, BL) */}
              {(trackingData.vesselName || trackingData.containerNumber || trackingData.blNumber) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-100/70 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">اسم الباخرة / الناقل:</span>
                    <strong className="text-slate-900">{trackingData.vesselName || 'قيد الجدولة'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">رقم الحاوية (Container):</span>
                    <strong className="text-slate-900 font-mono">{trackingData.containerNumber || 'مجزأ LCL'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">بوليصة الشحن (B/L):</span>
                    <strong className="text-slate-900 font-mono">{trackingData.blNumber || 'قيد الإصدار'}</strong>
                  </div>
                </div>
              )}

              {/* Step Progress Bar */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>المرحلة الحالية: {trackingData.currentStatusArabic}</span>
                  <span>التقدم التشغيلي: {Math.round((currentStep / 10) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                  <div
                    className="bg-[#F5B800] h-full transition-all duration-500 rounded-full"
                    style={{ width: `${(currentStep / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Public Documents & Certificates Section */}
            {trackingData.publicDocuments && trackingData.publicDocuments.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-right space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-emerald-600" />
                    <span>المستندات وشهادات الفحص المرفقة (Public Documents)</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {trackingData.publicDocuments.length} مستند معتمد
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {trackingData.publicDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-slate-900 truncate">{doc.name}</div>
                          <div className="text-[11px] text-slate-500">{doc.category || doc.type} • {doc.date}</div>
                        </div>
                      </div>

                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold text-[11px] flex items-center gap-1 hover:border-[#F5B800] transition-colors shrink-0"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                          <span>تحميل</span>
                        </a>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                          معتمد رسمياً
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones Detailed Timeline */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-right space-y-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#D99B00]" />
                <span>المعالم والخطوات التشغيلية للشحنة</span>
              </h3>
              <div className="relative pr-6 border-r-2 border-slate-200 space-y-8">
                {trackingData.milestones && trackingData.milestones.length > 0 ? (
                  trackingData.milestones.map((m: any, idx: number) => {
                    const isLatest = idx === trackingData.milestones!.length - 1;
                    return (
                      <div key={idx} className="relative group">
                        <div
                          className={`absolute -right-[31px] top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                            isLatest
                              ? 'border-[#F5B800] ring-4 ring-[#F5B800]/20'
                              : 'border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isLatest ? 'bg-[#F5B800]' : 'bg-slate-300'
                            }`}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-mono">{m.date}</span>
                            <span className="text-xs font-bold text-[#D99B00] bg-[#F5B800]/10 px-2 py-0.5 rounded">
                              {m.location || 'نقطة المسار'}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900">{m.title}</h4>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            {m.description}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-slate-500 py-4">
                    لا توجد محطات إضافية مسجلة حتى الآن.
                  </div>
                )}
              </div>
            </div>

            {/* Need Assistance WhatsApp Strip */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-right">
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">هل تحتاج مساعدة بخصوص هذه الشحنة؟</h4>
                <p className="text-xs text-slate-400">
                  فريق عمليات سهلا جاهز لتزويدكم بالمستندات وشهادات الفحص وتحديثات الإفراج الجمركي.
                </p>
              </div>
              <a
                href={waTrackLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl font-bold text-slate-950 bg-[#F5B800] hover:bg-[#E0A600] flex items-center gap-2 text-xs transition-colors shrink-0 shadow-md shadow-[#F5B800]/20"
              >
                <PhoneCall className="w-4 h-4 text-slate-950" />
                <span>محادثة مسؤول الشحنة</span>
              </a>
            </div>
          </div>
        )}

        {/* Printable Waybill Modal */}
        {showPrintModal && trackingData && (
          <ErpDocumentPrintModal
            docType="shipping_waybill"
            data={{
              shipmentCode: trackingData.trackingNumber,
              requestCode: trackingData.requestCode || 'REQ-CENTRAL',
              customerName: trackingData.customerName || 'العميل المعتمد',
              originPort: trackingData.origin,
              destinationPort: trackingData.destination,
              shippingLineOrCarrier: trackingData.rawErpData?.shippingLineOrCarrier || 'خط الشحن المعتمد',
              vesselName: trackingData.vesselName || 'مجدولة',
              containerNumber: trackingData.containerNumber || 'مجزأ LCL',
              billOfLading: trackingData.blNumber || 'BL-PENDING',
              cargoDescription: trackingData.shipmentType || 'بضائع تجارية عامة',
              transitStatus: trackingData.currentStatusArabic,
              eta: trackingData.estimatedDelivery,
              createdAt: trackingData.lastUpdate,
            }}
            onClose={() => setShowPrintModal(false)}
          />
        )}
      </div>
    </div>
  );
};

