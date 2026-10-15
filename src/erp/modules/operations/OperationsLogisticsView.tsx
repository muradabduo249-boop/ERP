import React, { useState } from 'react';
import {
  Ship,
  FileCheck2,
  Scale,
  PackageCheck,
  Plus,
  Anchor,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Calendar,
  Layers,
  Printer,
  Truck,
  MessageSquare,
  Download,
  Phone,
  X,
  Search,
} from 'lucide-react';
import { erpEngine } from '../../engine/erpEngine';
import { useErpAuth } from '../../context/ErpAuthContext';
import {
  ErpCustomsClearance,
  ErpInlandTrucking,
  ErpInspectionRecord,
  ErpProofOfDelivery,
  ErpShipmentOperation,
} from '../../../types';
import { ErpDocumentPrintModal, PrintableDocType } from '../../components/ErpDocumentPrintModal';
import { ErpWhatsAppModal } from '../../components/ErpWhatsAppModal';
import { exportToCsv } from '../../../lib/exportUtils';

type OperationsSubTab = 'shipments' | 'inspection' | 'customs' | 'trucking' | 'pod';

export const OperationsLogisticsView: React.FC = () => {
  const { currentUser, refreshData } = useErpAuth();
  const [activeSubTab, setActiveSubTab] = useState<OperationsSubTab>('shipments');

  // Modals
  const [showNewShipmentModal, setShowNewShipmentModal] = useState(false);
  const [showNewInspectionModal, setShowNewInspectionModal] = useState(false);
  const [showNewCustomsModal, setShowNewCustomsModal] = useState(false);
  const [showNewTruckingModal, setShowNewTruckingModal] = useState(false);
  const [showNewPodModal, setShowNewPodModal] = useState(false);

  // Print & WhatsApp Modals
  const [printableDoc, setPrintableDoc] = useState<{ type: PrintableDocType; data: any } | null>(null);
  const [whatsappModalData, setWhatsappModalData] = useState<{
    type: any;
    data: any;
    phone: string;
  } | null>(null);

  // Engine Data
  const shipments = erpEngine.getShipments();
  const inspections = erpEngine.getInspections();
  const customs = erpEngine.getCustomsDeclarations();
  const inlandTrucking = erpEngine.getInlandTrucking();
  const pods = erpEngine.getProofsOfDelivery();
  const requests = erpEngine.getRequests();

  // Shipment Form
  const [shpRequestId, setShpRequestId] = useState(requests[0]?.id || '');
  const [shpMode, setShpMode] = useState<ErpShipmentOperation['shippingMode']>('sea_fcl');
  const [shpOrigin, setShpOrigin] = useState('ميناء نينغبو / قوانغتشو');
  const [shpDest, setShpDest] = useState('ميناء بورتسودان الجنوبي');
  const [shpCarrier, setShpCarrier] = useState('COSCO Shipping Lines');
  const [shpContainer, setShpContainer] = useState('');
  const [shpBl, setShpBl] = useState('');
  const [shpEtd, setShpEtd] = useState('2026-03-01');
  const [shpEta, setShpEta] = useState('2026-03-22');
  const [shpCargo, setShpCargo] = useState('بضائع ومعدات تجارية');

  // Inspection Form
  const [insRequestId, setInsRequestId] = useState(requests[0]?.id || '');
  const [insSupplier, setInsSupplier] = useState('شركة فوشان للمعدات الكهربائية');
  const [insInspector, setInsInspector] = useState('م. ليو شياو بينغ (فاحص سهلا بالصين)');
  const [insLocation, setInsLocation] = useState('فوشان / قوانغتشو');
  const [insQuantity, setInsQuantity] = useState<number>(100);
  const [insResult, setInsResult] = useState<ErpInspectionRecord['result']>('passed');
  const [insNotes, setInsNotes] = useState('فحص سليم ومطابق للمواصفات الفنية المعتمدة');

  // Customs Form
  const [cusRequestId, setCusRequestId] = useState(requests[0]?.id || '');
  const [cusDecNum, setCusDecNum] = useState('');
  const [cusHsCode, setCusHsCode] = useState('8541.40');
  const [cusValue, setCusValue] = useState<number>(15000);
  const [cusDuty, setCusDuty] = useState<number>(4500000);
  const [cusBroker, setCusBroker] = useState('مخلص سهلا المعتمد - بورتسودان');

  // Inland Trucking Form
  const [trkRequestId, setTrkRequestId] = useState(requests[0]?.id || '');
  const [trkDestCity, setTrkDestCity] = useState('الخرطوم - المنطقة الصناعية بحري');
  const [trkAddress, setTrkAddress] = useState('مخازن العميل، شارع الإنقاذ');
  const [trkNumber, setTrkNumber] = useState('خ 6 - 8921');
  const [trkDriverName, setTrkDriverName] = useState('الهادي محمد نور');
  const [trkDriverPhone, setTrkDriverPhone] = useState('+249 91 234 5678');
  const [trkCostSDG, setTrkCostSDG] = useState<number>(3800000);
  const [trkAdvanceSDG, setTrkAdvanceSDG] = useState<number>(2000000);
  const [trkDispatchDate, setTrkDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [trkEstimatedArrival, setTrkEstimatedArrival] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [trkCargoWeight, setTrkCargoWeight] = useState<number>(14.2);
  const [trkCargoDesc, setTrkCargoDesc] = useState('منظومات طاقة شمسية ومحولات صناعية');
  const [trkNotes, setTrkNotes] = useState('البضاعة مشمعة ومربوطة بأحزمة أمان مشددة');

  // POD Form
  const [podRequestId, setPodRequestId] = useState(requests[0]?.id || '');
  const [podConsignee, setPodConsignee] = useState('');
  const [podPhone, setPodPhone] = useState('');
  const [podCity, setPodCity] = useState('الخرطوم - المنطقة الصناعية بحري');
  const [podAddress, setPodAddress] = useState('مستودع العميل');
  const [podNotes, setPodNotes] = useState('تم فحص الطرود واستلام البضاعة بحالة ممتازة والتوقيع على POD');
  const [podCondition, setPodCondition] = useState<ErpProofOfDelivery['cargoCondition']>('excellent');

  // Handlers
  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    const req = requests.find((r) => r.id === shpRequestId) || {
      id: 'req-general',
      requestCode: 'REQ-GENERAL',
      customerName: 'عميل عام',
    };

    erpEngine.createShipment(
      {
        requestId: req.id,
        requestCode: req.requestCode,
        customerName: req.customerName,
        shippingMode: shpMode,
        originPort: shpOrigin,
        destinationPort: shpDest,
        containerNumber: shpContainer || 'TGHU-782190-2',
        blNumber: shpBl || `BL-${Date.now().toString().slice(-6)}`,
        shippingLineOrCarrier: shpCarrier,
        etd: shpEtd,
        eta: shpEta,
        transitStatus: 'in_transit_red_sea',
        cargoDescription: shpCargo,
        weightKg: 12000,
        volumeCbm: 65,
      },
      currentUser
    );

    setShowNewShipmentModal(false);
    refreshData();
  };

  const handleCreateInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const req = requests.find((r) => r.id === insRequestId) || requests[0] || {
      id: 'req-general',
      requestCode: 'REQ-GENERAL',
    };

    erpEngine.createInspection(
      {
        requestId: req.id,
        requestCode: req.requestCode,
        supplierName: insSupplier || 'المصنع المعتمد بالصين',
        factoryLocation: insLocation,
        inspectorName: insInspector,
        inspectionDate: new Date().toISOString().split('T')[0],
        itemsQuantity: Number(insQuantity) || 100,
        defectRatePercentage: insResult === 'passed' ? 0 : 5,
        result: insResult,
        checklist: {
          packagingOk: true,
          specificationsMatch: true,
          labelingAndBarcodeOk: true,
          electricalOrFunctionalTestOk: true,
        },
        notes: insNotes,
        photosCount: 6,
      },
      currentUser
    );

    setShowNewInspectionModal(false);
    refreshData();
  };

  const handleCreateCustoms = (e: React.FormEvent) => {
    e.preventDefault();
    const req = requests.find((r) => r.id === cusRequestId) || requests[0] || {
      id: 'req-general',
      requestCode: 'REQ-GENERAL',
      customerName: 'عميل عام',
    };

    erpEngine.createCustomsDeclaration(
      {
        requestId: req.id,
        requestCode: req.requestCode,
        customerName: req.customerName,
        declarationNumber: cusDecNum || `DEC-PS-${Date.now().toString().slice(-5)}`,
        hsCodes: [cusHsCode],
        assessedValueCustoms: Number(cusValue),
        dutyAmountSDG: Number(cusDuty),
        customsBrokerName: cusBroker,
        portLocation: 'Port Sudan South Port',
        status: 'duty_assessed',
      },
      currentUser
    );

    setShowNewCustomsModal(false);
    refreshData();
  };

  const handleCreateTrucking = (e: React.FormEvent) => {
    e.preventDefault();
    const req = requests.find((r) => r.id === trkRequestId) || {
      id: 'req-general',
      requestCode: 'REQ-GENERAL',
      customerName: 'عميل عام',
    };

    erpEngine.createInlandTrucking(
      {
        requestId: req.id,
        requestCode: req.requestCode,
        customerName: req.customerName,
        originPort: 'ميناء بورتسودان الجنوبي',
        destinationCity: trkDestCity,
        deliveryAddress: trkAddress,
        truckNumber: trkNumber,
        driverName: trkDriverName,
        driverPhone: trkDriverPhone,
        cargoDescription: trkCargoDesc,
        cargoWeightTon: Number(trkCargoWeight),
        freightCostSDG: Number(trkCostSDG),
        advancePaidSDG: Number(trkAdvanceSDG),
        remainingPaidSDG: Math.max(0, Number(trkCostSDG) - Number(trkAdvanceSDG)),
        dispatchDate: trkDispatchDate,
        estimatedArrivalDate: trkEstimatedArrival,
        status: 'in_transit',
        notes: trkNotes,
      },
      currentUser
    );

    setShowNewTruckingModal(false);
    refreshData();
  };

  const handleUpdateTruckingStatus = (id: string, status: ErpInlandTrucking['status']) => {
    erpEngine.updateInlandTrucking(id, { status }, currentUser);
    refreshData();
  };

  const handleCreatePod = (e: React.FormEvent) => {
    e.preventDefault();
    const req = requests.find((r) => r.id === podRequestId) || requests[0] || {
      id: 'req-general',
      requestCode: 'REQ-GENERAL',
      customerName: 'عميل عام',
      customerPhone: '+249912000000',
    };

    erpEngine.recordProofOfDelivery(
      {
        requestId: req.id,
        requestCode: req.requestCode,
        customerName: podConsignee || req.customerName,
        customerPhone: podPhone || '+249 91 000 0000',
        deliveryCity: podCity,
        deliveryAddress: podAddress,
        recipientName: podConsignee || 'العميل المستلم',
        recipientIdNumber: 'NAT-ID-88402',
        deliveryDate: new Date().toISOString().split('T')[0],
        cargoCondition: podCondition,
        signatureProofTaken: true,
        notes: podNotes,
        isClosed: true,
      },
      currentUser
    );

    setShowNewPodModal(false);
    refreshData();
  };

  // Export Manifests
  const handleExportShipments = () => {
    const headers = [
      'كود الشحنة',
      'الطلب المرتبط',
      'العميل',
      'نمط الشحن',
      'ميناء الشحن',
      'ميناء الوصول',
      'رقم الحاوية',
      'بوليصة الشحن B/L',
      'الخط الملاحي',
      'تاريخ الإبحار ETD',
      'تاريخ الوصول ETA',
    ];
    const rows = shipments.map((s) => [
      s.shipmentCode,
      s.requestCode,
      s.customerName,
      s.shippingMode,
      s.originPort,
      s.destinationPort,
      s.containerNumber,
      s.blNumber,
      s.shippingLineOrCarrier,
      s.etd,
      s.eta,
    ]);
    exportToCsv('SAHLA_Shipments_Manifest', headers, rows);
  };

  const handleExportTrucking = () => {
    const headers = [
      'رقم البوليصة',
      'الطلب المرتبط',
      'العميل',
      'مدينة الوصول',
      'العنوان',
      'رقم الشاحنة',
      'اسم السائق',
      'هاتف السائق',
      'الوزن بالطن',
      'أجرة النقل SDG',
      'المسدد مقدماً',
      'المتبقي',
      'تاريخ التفويج',
      'تاريخ الوصول المتوقع',
      'الحالة',
    ];
    const rows = inlandTrucking.map((t) => [
      t.dispatchCode,
      t.requestCode,
      t.customerName,
      t.destinationCity,
      t.deliveryAddress,
      t.truckNumber,
      t.driverName,
      t.driverPhone,
      t.cargoWeightTon,
      t.freightCostSDG,
      t.advancePaidSDG,
      t.remainingPaidSDG,
      t.dispatchDate,
      t.estimatedArrivalDate,
      t.status,
    ]);
    exportToCsv('SAHLA_Inland_Trucking_Dispatch', headers, rows);
  };

  return (
    <div className="space-y-6 text-right font-['IBM_Plex_Sans_Arabic',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <Ship className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              العمليات واللوجستيات والتخليص والنقل الداخلي
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            فحص المصانع بالصين، الشحن الدولي، التخليص بميناء بورتسودان، تفويج الشاحنات للمدن، والتسليم النهائي (POD).
          </p>
        </div>

        {/* Dynamic Action Buttons for All 5 Operations */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {activeSubTab === 'inspection' && (
            <button
              onClick={() => setShowNewInspectionModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ تسجيل فحص جودة (QC)</span>
            </button>
          )}

          {activeSubTab === 'shipments' && (
            <button
              onClick={() => setShowNewShipmentModal(true)}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-[#F5B800]" />
              <span>+ تدشين شحنة دولية (SHL)</span>
            </button>
          )}

          {activeSubTab === 'customs' && (
            <button
              onClick={() => setShowNewCustomsModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ تسجيل بيان جمركي (بورتسودان)</span>
            </button>
          )}

          {activeSubTab === 'trucking' && (
            <button
              onClick={() => setShowNewTruckingModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Truck className="w-4 h-4" />
              <span>+ تفويج شاحنة برية (TRK)</span>
            </button>
          )}

          {activeSubTab === 'pod' && (
            <button
              onClick={() => setShowNewPodModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ تسجيل إثبات تسليم (POD)</span>
            </button>
          )}

          {/* Quick Menu to Jump & Add any operation immediately */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] font-bold text-slate-500 px-1.5">إجراء سريع:</span>
            <button
              onClick={() => { setActiveSubTab('inspection'); setShowNewInspectionModal(true); }}
              title="تسجيل فحص جودة للمصنع"
              className="p-1.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-700 font-bold border border-slate-200 text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">فحص</span>
            </button>
            <button
              onClick={() => { setActiveSubTab('shipments'); setShowNewShipmentModal(true); }}
              title="تدشين شحنة دولية"
              className="p-1.5 rounded-lg bg-white hover:bg-sky-50 text-sky-700 font-bold border border-slate-200 text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Ship className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">شحنة</span>
            </button>
            <button
              onClick={() => { setActiveSubTab('customs'); setShowNewCustomsModal(true); }}
              title="تسجيل إقرار جمركي"
              className="p-1.5 rounded-lg bg-white hover:bg-amber-50 text-amber-700 font-bold border border-slate-200 text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Anchor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">جمارك</span>
            </button>
            <button
              onClick={() => { setActiveSubTab('trucking'); setShowNewTruckingModal(true); }}
              title="تفويج شاحنة"
              className="p-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-700 font-bold border border-slate-200 text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تفويج</span>
            </button>
            <button
              onClick={() => { setActiveSubTab('pod'); setShowNewPodModal(true); }}
              title="إثبات تسليم"
              className="p-1.5 rounded-lg bg-white hover:bg-purple-50 text-purple-700 font-bold border border-slate-200 text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">POD</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5-Step Operational Pipeline Banner (مراحل دورة العمليات اللوجستية الخمسة) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* Step 1: QC Inspection */}
        <button
          onClick={() => setActiveSubTab('inspection')}
          className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
            activeSubTab === 'inspection'
              ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
              1
            </span>
            <FileCheck2 className={`w-4 h-4 ${activeSubTab === 'inspection' ? 'text-emerald-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900">فحص الجودة بالصين</div>
            <div className="text-[10px] text-emerald-700 font-bold mt-0.5 font-mono">
              QC Inspection ({inspections.length})
            </div>
          </div>
        </button>

        {/* Step 2: Shipping */}
        <button
          onClick={() => setActiveSubTab('shipments')}
          className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
            activeSubTab === 'shipments'
              ? 'bg-sky-50/90 border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-800 font-black text-xs flex items-center justify-center">
              2
            </span>
            <Ship className={`w-4 h-4 ${activeSubTab === 'shipments' ? 'text-sky-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900">الشحن الدولي والحاويات</div>
            <div className="text-[10px] text-sky-700 font-bold mt-0.5 font-mono">
              Freight B/L ({shipments.length})
            </div>
          </div>
        </button>

        {/* Step 3: Customs Clearance */}
        <button
          onClick={() => setActiveSubTab('customs')}
          className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
            activeSubTab === 'customs'
              ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center">
              3
            </span>
            <Anchor className={`w-4 h-4 ${activeSubTab === 'customs' ? 'text-amber-700' : 'text-slate-400'}`} />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900">تخليص ميناء بورتسودان</div>
            <div className="text-[10px] text-amber-800 font-bold mt-0.5 font-mono">
              Customs Asycuda ({customs.length})
            </div>
          </div>
        </button>

        {/* Step 4: Inland Trucking */}
        <button
          onClick={() => setActiveSubTab('trucking')}
          className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
            activeSubTab === 'trucking'
              ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center">
              4
            </span>
            <Truck className={`w-4 h-4 ${activeSubTab === 'trucking' ? 'text-blue-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900">التفويج والنقل الداخلي</div>
            <div className="text-[10px] text-blue-700 font-bold mt-0.5 font-mono">
              Truck Dispatch ({inlandTrucking.length})
            </div>
          </div>
        </button>

        {/* Step 5: Proof of Delivery */}
        <button
          onClick={() => setActiveSubTab('pod')}
          className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
            activeSubTab === 'pod'
              ? 'bg-purple-50/90 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 font-black text-xs flex items-center justify-center">
              5
            </span>
            <PackageCheck className={`w-4 h-4 ${activeSubTab === 'pod' ? 'text-purple-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900">إثبات التسليم النهائي</div>
            <div className="text-[10px] text-purple-700 font-bold mt-0.5 font-mono">
              POD & Close ({pods.length})
            </div>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: SHIPMENTS */}
      {/* ========================================================================= */}
      {activeSubTab === 'shipments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3.5 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-800 text-sm">سجل الشحنات البحرية والجوية وتتبع الحاويات</span>
              <p className="text-[11px] text-slate-500">متابعة خطوط الملاحة وبوالص الشحن (B/L) ومواعيد الوصول لميناء بورتسودان</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewShipmentModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#F5B800]" />
                <span>+ تدشين شحنة دولية (SHL)</span>
              </button>
              <button
                onClick={handleExportShipments}
                className="px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5 text-[#F5B800]" />
                <span>تصدير المانيفست</span>
              </button>
            </div>
          </div>

          {shipments.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
              <Ship className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-800 text-sm">لا توجد شحنات دولية مسجلة بعد</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                يمكن تسجيل بيانات التتبع الملاحي وتعيين رقم الحاوية وبوليصة الشحن (B/L) لمتابعة خط سير السفينة حتى ميناء بورتسودان.
              </p>
              <button
                onClick={() => setShowNewShipmentModal(true)}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition-colors shadow-xs cursor-pointer"
              >
                + تدشين أول شحنة دولية (SHL)
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shipments.map((shp) => (
                <div
                  key={shp.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 bg-sky-50 text-sky-800 px-2.5 py-0.5 rounded-lg border border-sky-200 text-xs">
                        {shp.shipmentCode}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900">
                        في المسار الملاحي (البحر الأحمر)
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">{shp.cargoDescription}</h4>
                      <div className="text-xs text-slate-500">العميل: {shp.customerName}</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">المسار:</span>
                        <span className="font-bold text-slate-800">{shp.originPort} ➔ {shp.destinationPort}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">رقم الحاوية:</span>
                        <span className="font-mono font-bold text-slate-900">{shp.containerNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">بوليصة الشحن (B/L):</span>
                        <span className="font-mono font-bold text-sky-700">{shp.blNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">الناقل / خط الملاحة:</span>
                        <span className="font-bold text-slate-700">{shp.shippingLineOrCarrier}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400">وصول تقديري (ETA): </span>
                      <span className="font-mono font-bold text-emerald-600">{shp.eta}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* WhatsApp */}
                      <button
                        onClick={() =>
                          setWhatsappModalData({
                            type: 'shipped_sailing',
                            data: {
                              customerName: shp.customerName,
                              requestCode: shp.requestCode,
                              shipmentCode: shp.shipmentCode,
                              blNumber: shp.blNumber,
                              containerNumber: shp.containerNumber,
                              portOfOrigin: shp.originPort,
                              carrier: shp.shippingLineOrCarrier,
                              eta: shp.eta,
                            },
                            phone: '',
                          })
                        }
                        className="p-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        title="إرسال تحديث الإبحار والبوليصة للعميل عبر الواتساب"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>واتساب</span>
                      </button>

                      {/* Print */}
                      <button
                        onClick={() => setPrintableDoc({ type: 'shipping_waybill', data: shp })}
                        className="p-1.5 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>مانيفست</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: QUALITY INSPECTION (فحص المصانع بالصين) */}
      {/* ========================================================================= */}
      {activeSubTab === 'inspection' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3.5 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-800 text-sm">سجلات فحص جودة المصانع (QC) بالصين</span>
              <p className="text-[11px] text-slate-500">فحص البضائع ومطابقتها للمواصفات القياسية (SSMO) قبل الشحن</p>
            </div>
            <button
              onClick={() => setShowNewInspectionModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ تسجيل فحص جودة جديد (QC)</span>
            </button>
          </div>

          {inspections.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
              <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-800 text-sm">لا توجد سجلات فحص جودة مسجلة بعد</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                يمكن لفريق العمل بالصين تسجيل تقرير فحص المصنع واعتماد مطابقة البضاعة للمواصفات الفنية قبل إبحار الحاوية.
              </p>
              <button
                onClick={() => setShowNewInspectionModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
              >
                + تسجيل أول تقرير فحص جودة (QC)
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inspections.map((ins) => (
                <div key={ins.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                      {ins.inspectionCode}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      مطابق ومجاز رسمي ✓
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">المورد: {ins.supplierName}</h4>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>الموقع: {ins.factoryLocation}</div>
                    <div>المفتش: {ins.inspectorName}</div>
                    <div>عدد العينات المفحوصة: {ins.itemsQuantity} قطعة</div>
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-700 mt-2">{ins.notes}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => setPrintableDoc({ type: 'inspection_report', data: ins })}
                      className="p-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة تقرير الفحص المعتمد</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: CUSTOMS CLEARANCE (تخليص ميناء بورتسودان) */}
      {/* ========================================================================= */}
      {activeSubTab === 'customs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3.5 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-800 text-sm">إقرارات وبيانات التخليص الجمركي - ميناء بورتسودان</span>
              <p className="text-[11px] text-slate-500">متابعة شهادات الإجراء الجمركي (Asycuda)، بنود التعريفة (HS Codes)، وسداد الرسوم والإفراج</p>
            </div>
            <button
              onClick={() => setShowNewCustomsModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ تسجيل بيان جمركي جديد</span>
            </button>
          </div>

          {customs.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
              <Anchor className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-800 text-sm">لا توجد إقرارات تخليص جمركي مسجلة بعد</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                يمكن لمخلص بورتسودان المعتمد إدخال رقم الشهادة الجمركية وبنود التعريفة والرسوم المستحقة وإصدار الإفراج الجمركي.
              </p>
              <button
                onClick={() => setShowNewCustomsModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors shadow-xs cursor-pointer"
              >
                + تسجيل أول بيان جمركي لبورتسودان
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customs.map((cus) => (
                <div key={cus.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                      {cus.customsCode}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      تم تقدير ودفع الرسوم الجمركية
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">العميل: {cus.customerName}</h4>
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">رقم الشهادة الجمركية:</span>
                      <span className="font-mono font-bold text-slate-900">{cus.declarationNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">بند التعريفة (HS Code):</span>
                      <span className="font-mono font-bold text-sky-700">{cus.hsCodes.join(', ')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">الرسوم الجمركية:</span>
                      <span className="font-mono font-bold text-slate-900">{cus.dutyAmountSDG.toLocaleString()} SDG</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">المخلص الجمركي:</span>
                      <span className="font-bold text-slate-800">{cus.customsBrokerName}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() =>
                        setWhatsappModalData({
                          type: 'customs_cleared',
                          data: {
                            customerName: cus.customerName,
                            requestCode: cus.requestCode,
                            destinationCity: 'بورتسودان / مدن السودان',
                          },
                          phone: '',
                        })
                      }
                      className="p-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>إرسال إشعار الإفراج للعميل</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: INLAND TRUCKING (التفويج والنقل الداخلي من بورتسودان) */}
      {/* ========================================================================= */}
      {activeSubTab === 'trucking' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3.5 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-800 text-sm">بوالص وتفويج الشاحنات البرية من ميناء بورتسودان إلى مدن السودان</span>
              <p className="text-[11px] text-slate-500">إدارة حركة الشاحنات التريلا، أرقام اللوحات، وهواتف السائقين وأجرة النولون البري</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewTruckingModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>+ تفويج شاحنة جديدة</span>
              </button>
              <button
                onClick={handleExportTrucking}
                className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5 text-[#F5B800]" />
                <span>تصدير بوالص النقل</span>
              </button>
            </div>
          </div>

          {inlandTrucking.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
              <Truck className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-800 text-sm">لا توجد شاحنات تفويج مسجلة بعد</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                يمكن تفويج أول شاحنة تريلا من بوابة ميناء بورتسودان وتعيين رقم اللوحة واسم السائق والتكلفة بالجنيه.
              </p>
              <button
                onClick={() => setShowNewTruckingModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
              >
                + تفويج أول شاحنة برية
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inlandTrucking.map((trk) => {
                const isDelivered = trk.status === 'delivered';
                const isArrived = trk.status === 'arrived';
                return (
                  <div
                    key={trk.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 text-xs">
                          {trk.dispatchCode}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isDelivered
                              ? 'bg-emerald-100 text-emerald-800'
                              : isArrived
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isDelivered ? 'تم التسليم والتفريغ ✓' : isArrived ? 'وصلت المخازن' : 'في الطريق للشحن'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{trk.cargoDescription}</h4>
                        <div className="text-xs text-slate-500">العميل: {trk.customerName}</div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">المسار:</span>
                          <span className="font-bold text-slate-800">{trk.originPort} ➔ {trk.destinationCity}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">رقم الشاحنة:</span>
                          <span className="font-mono font-bold text-slate-900">{trk.truckNumber}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">السائق والهاتف:</span>
                          <span className="font-bold text-slate-700">{trk.driverName} ({trk.driverPhone})</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">أجرة النقل:</span>
                          <span className="font-mono font-bold text-slate-900">{trk.freightCostSDG.toLocaleString()} SDG</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="text-[11px] text-slate-500">
                        تاريخ التفويج: <b>{trk.dispatchDate}</b>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* WhatsApp to customer */}
                        <button
                          onClick={() =>
                            setWhatsappModalData({
                              type: 'trucking_dispatched',
                              data: {
                                customerName: trk.customerName,
                                requestCode: trk.requestCode,
                                destinationCity: trk.destinationCity,
                                truckNumber: trk.truckNumber,
                                driverPhone: trk.driverPhone,
                              },
                              phone: '',
                            })
                          }
                          className="p-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          title="إرسال بيانات الشاحنة والسائق للعميل عبر واتساب"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>واتساب للعميل</span>
                        </button>

                        {/* Advance status */}
                        {!isDelivered && (
                          <button
                            onClick={() => handleUpdateTruckingStatus(trk.id, isArrived ? 'delivered' : 'arrived')}
                            className="p-1.5 px-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[11px] cursor-pointer transition-all shadow-xs"
                          >
                            {isArrived ? 'تأكيد التسليم' : 'تحديث: وصلت'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: POD (إثبات التسليم النهائي) */}
      {/* ========================================================================= */}
      {activeSubTab === 'pod' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3.5 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-800 text-sm">سندات إثبات التسليم النهائي (Proof of Delivery - POD)</span>
              <p className="text-[11px] text-slate-500">توثيق تسليم البضاعة في مستودع العميل بسلامة وتوقيع براءة الذمة وإغلاق الطلب</p>
            </div>
            <button
              onClick={() => setShowNewPodModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ تسجيل إثبات تسليم (POD)</span>
            </button>
          </div>

          {pods.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
              <PackageCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-800 text-sm">لا توجد مستندات إثبات تسليم مسجلة بعد</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                عند وصول الشاحنة لمخازن العميل، يتم توثيق التوقيع على إثبات التسليم (POD) وإغلاق الدورة التشغيلية للطلب رسمياً بنسبة 100%.
              </p>
              <button
                onClick={() => setShowNewPodModal(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors shadow-xs cursor-pointer"
              >
                + تسجيل أول إثبات تسليم (POD)
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pods.map((pod) => (
                <div key={pod.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                      {pod.podCode}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      تم التسليم وإغلاق المعاملة ✓
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">المستلم: {pod.recipientName}</h4>
                  <div className="text-xs text-slate-500 mb-2">
                    العنوان: {pod.deliveryAddress} - {pod.deliveryCity}
                  </div>
                  <p className="text-[11px] text-slate-600 mb-2">{pod.notes}</p>
                  <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between font-mono">
                    <span>تاريخ التسليم: {pod.deliveryDate}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          setWhatsappModalData({
                            type: 'delivered_pod',
                            data: {
                              customerName: pod.customerName,
                              requestCode: pod.requestCode,
                            },
                            phone: pod.customerPhone,
                          })
                        }
                        className="p-1 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>واتساب</span>
                      </button>
                      <button
                        onClick={() => setPrintableDoc({ type: 'delivery_pod', data: pod })}
                        className="p-1 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>طباعة POD</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW INLAND TRUCKING */}
      {/* ========================================================================= */}
      {showNewTruckingModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-right border border-slate-200 shadow-2xl animate-in fade-in-50">
            <h3 className="text-base font-black text-slate-900 mb-1">
              تفويج شاحنة نقل بري داخلي من ميناء بورتسودان
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              إصدار بوليصة النقل الداخلي وتعيين بيانات السائق والشاحنة والتكلفة بالجنيه السوداني.
            </p>

            <form onSubmit={handleCreateTrucking} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الطلب التشغيلي المرتبط:</label>
                <select
                  value={trkRequestId}
                  onChange={(e) => setTrkRequestId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                >
                  {requests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.requestCode} - {r.customerName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">مدينة الوصول المستهدفة:</label>
                  <input
                    type="text"
                    required
                    value={trkDestCity}
                    onChange={(e) => setTrkDestCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الشاحنة (اللوحة):</label>
                  <input
                    type="text"
                    required
                    value={trkNumber}
                    onChange={(e) => setTrkNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم السائق:</label>
                  <input
                    type="text"
                    required
                    value={trkDriverName}
                    onChange={(e) => setTrkDriverName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">هاتف السائق:</label>
                  <input
                    type="text"
                    required
                    value={trkDriverPhone}
                    onChange={(e) => setTrkDriverPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">أجرة النقل الإجمالية (SDG):</label>
                  <input
                    type="number"
                    required
                    value={trkCostSDG}
                    onChange={(e) => setTrkCostSDG(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الدفعة المقدمة للسائق (SDG):</label>
                  <input
                    type="number"
                    value={trkAdvanceSDG}
                    onChange={(e) => setTrkAdvanceSDG(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان وتفاصيل التسليم بالمخازن:</label>
                <input
                  type="text"
                  required
                  value={trkAddress}
                  onChange={(e) => setTrkAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewTruckingModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-sm"
                >
                  إصدار البوليصة وتفويج الشاحنة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW SHIPMENT */}
      {/* ========================================================================= */}
      {showNewShipmentModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-right border border-slate-200 shadow-2xl animate-in fade-in-50">
            <h3 className="text-base font-black text-slate-900 mb-1">
              تدشين شحنة دولية جديدة (New Shipment)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              تسجيل بيانات التتبع الملاحي، الحاوية، وبوليصة الشحن المتجهة لبورتسودان.
            </p>

            <form onSubmit={handleCreateShipment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الطلب التشغيلي المرتبط:</label>
                <select
                  value={shpRequestId}
                  onChange={(e) => setShpRequestId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {requests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.requestCode} - {r.title} ({r.customerName})
                    </option>
                  ))}
                  {requests.length === 0 && <option value="">شحنة عامة</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع الشحن:</label>
                  <select
                    value={shpMode}
                    onChange={(e) => setShpMode(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="sea_fcl">بحري - حاوية كاملة (FCL)</option>
                    <option value="sea_lcl">بحري - شحن جزئي مجمع (LCL)</option>
                    <option value="air_freight">شحن جوي سريع (Air Cargo)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">خط الملاحة / الناقل:</label>
                  <input
                    type="text"
                    value={shpCarrier}
                    onChange={(e) => setShpCarrier(e.target.value)}
                    required
                    placeholder="مثال: COSCO / Maersk / تاركو"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الحاوية (Container No):</label>
                  <input
                    type="text"
                    value={shpContainer}
                    onChange={(e) => setShpContainer(e.target.value)}
                    placeholder="مثال: TGHU-782190-2"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-left"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم بوليصة الشحن (B/L No):</label>
                  <input
                    type="text"
                    value={shpBl}
                    onChange={(e) => setShpBl(e.target.value)}
                    placeholder="مثال: COSCO-NB-PS-9821"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ميناء الشحن (Origin):</label>
                  <input
                    type="text"
                    value={shpOrigin}
                    onChange={(e) => setShpOrigin(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ميناء الوصول (Port Sudan):</label>
                  <input
                    type="text"
                    value={shpDest}
                    onChange={(e) => setShpDest(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الإبحار (ETD):</label>
                  <input
                    type="date"
                    value={shpEtd}
                    onChange={(e) => setShpEtd(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الوصول المتوقع (ETA):</label>
                  <input
                    type="date"
                    value={shpEta}
                    onChange={(e) => setShpEta(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">وصف البضاعة المشحونة:</label>
                <textarea
                  value={shpCargo}
                  onChange={(e) => setShpCargo(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewShipmentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold"
                >
                  تدشين الشحنة وتثبيت التتبع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW INSPECTION (فحص المصانع بالصين) */}
      {/* ========================================================================= */}
      {showNewInspectionModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-right border border-slate-200 shadow-2xl animate-in fade-in-50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <FileCheck2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    تقرير فحص جودة المصنع (QC Inspection)
                  </h3>
                  <p className="text-[11px] text-slate-500">فحص البضائع بالصين ومطابقتها للمواصفات الفنية المعتمدة</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewInspectionModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInspection} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الطلب التشغيلي المرتبط:</label>
                <select
                  value={insRequestId}
                  onChange={(e) => setInsRequestId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {requests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.requestCode} - {r.customerName} ({r.title})
                    </option>
                  ))}
                  {requests.length === 0 && <option value="">طلب عام</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المصنع / المورد:</label>
                  <input
                    type="text"
                    required
                    value={insSupplier}
                    onChange={(e) => setInsSupplier(e.target.value)}
                    placeholder="مثال: شركة فوشان للمعدات"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">موقع المصنع في الصين:</label>
                  <input
                    type="text"
                    required
                    value={insLocation}
                    onChange={(e) => setInsLocation(e.target.value)}
                    placeholder="مثال: فوشان / قوانغتشو"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم الفاحص المعتمد:</label>
                  <input
                    type="text"
                    required
                    value={insInspector}
                    onChange={(e) => setInsInspector(e.target.value)}
                    placeholder="مثال: م. ليو شياو بينغ"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">عدد العينات المفحوصة:</label>
                  <input
                    type="number"
                    required
                    value={insQuantity}
                    onChange={(e) => setInsQuantity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نتيجة فحص الجودة:</label>
                <select
                  value={insResult}
                  onChange={(e) => setInsResult(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-emerald-700"
                >
                  <option value="passed">مطابق ومجاز رسمياً للمواصفات (Passed 100%)</option>
                  <option value="needs_rework">يحتاج تعديل وإعادة فحص (Needs Rework)</option>
                  <option value="failed">مرفوض وغير مطابق (Failed)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات الفحص والتقرير الفني:</label>
                <textarea
                  value={insNotes}
                  onChange={(e) => setInsNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewInspectionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-sm"
                >
                  اعتماد تقرير الفحص
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW CUSTOMS */}
      {/* ========================================================================= */}
      {showNewCustomsModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-right border border-slate-200 shadow-2xl animate-in fade-in-50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Anchor className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    إقرار تخليص جمركي - ميناء بورتسودان
                  </h3>
                  <p className="text-[11px] text-slate-500">تسجيل بيانات الشهادة الجمركية والتعريفة وسداد الرسوم</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewCustomsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustoms} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الطلب التشغيلي المرتبط:</label>
                <select
                  value={cusRequestId}
                  onChange={(e) => setCusRequestId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {requests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.requestCode} - {r.customerName} ({r.title})
                    </option>
                  ))}
                  {requests.length === 0 && <option value="">طلب عام</option>}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الشهادة الجمركية (Asycuda / IM4):</label>
                <input
                  type="text"
                  value={cusDecNum}
                  onChange={(e) => setCusDecNum(e.target.value)}
                  required
                  placeholder="مثال: DEC-PS-90210"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-left"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">بند التعريفة الجمركية (HS Code):</label>
                  <input
                    type="text"
                    value={cusHsCode}
                    onChange={(e) => setCusHsCode(e.target.value)}
                    required
                    placeholder="8541.40"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-left"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الرسوم الجمركية المقدرة (SDG):</label>
                  <input
                    type="number"
                    value={cusDuty}
                    onChange={(e) => setCusDuty(Number(e.target.value))}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المخلص الجمركي المعتمد:</label>
                <input
                  type="text"
                  value={cusBroker}
                  onChange={(e) => setCusBroker(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewCustomsModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-sm"
                >
                  تسجيل الإقرار الجمركي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW PROOF OF DELIVERY (POD) */}
      {/* ========================================================================= */}
      {showNewPodModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-right border border-slate-200 shadow-2xl animate-in fade-in-50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <PackageCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    إثبات التسليم النهائي (Proof of Delivery - POD)
                  </h3>
                  <p className="text-[11px] text-slate-500">توثيق تسليم البضاعة لمخزن العميل وإغلاق دورة الطلب رسمياً</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewPodModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePod} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الطلب التشغيلي المراد تسليمه وإغلاقه:</label>
                <select
                  value={podRequestId}
                  onChange={(e) => setPodRequestId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {requests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.requestCode} - {r.customerName} ({r.title})
                    </option>
                  ))}
                  {requests.length === 0 && <option value="">طلب عام</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم الشخص المستلم:</label>
                  <input
                    type="text"
                    required
                    value={podConsignee}
                    onChange={(e) => setPodConsignee(e.target.value)}
                    placeholder="مثال: البشير عثمان (مدير المخازن)"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم هاتف المستلم:</label>
                  <input
                    type="text"
                    required
                    value={podPhone}
                    onChange={(e) => setPodPhone(e.target.value)}
                    placeholder="+249 91 234 5678"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">مدينة التسليم:</label>
                  <input
                    type="text"
                    required
                    value={podCity}
                    onChange={(e) => setPodCity(e.target.value)}
                    placeholder="مثال: الخرطوم - بحري"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">حالة البضاعة عند الاستلام:</label>
                  <select
                    value={podCondition}
                    onChange={(e) => setPodCondition(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-emerald-700"
                  >
                    <option value="excellent">سليمة 100% وممتازة (Excellent)</option>
                    <option value="good">بحالة جيدة جداً (Good)</option>
                    <option value="minor_damage">ملاحظات طفيفة على الكراتين الخارجية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان المخزن بالتفصيل:</label>
                <input
                  type="text"
                  required
                  value={podAddress}
                  onChange={(e) => setPodAddress(e.target.value)}
                  placeholder="مثال: مخازن النيل الأزرق، شارع الإنقاذ، المنطقة الصناعية"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات التسليم وبراءة الذمة:</label>
                <textarea
                  value={podNotes}
                  onChange={(e) => setPodNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewPodModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer shadow-sm"
                >
                  تأكيد التسليم وإغلاق الطلب رسمياً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHATSAPP & PRINT MODALS */}
      {whatsappModalData && (
        <ErpWhatsAppModal
          initialType={whatsappModalData.type}
          data={whatsappModalData.data}
          recipientPhone={whatsappModalData.phone}
          onClose={() => setWhatsappModalData(null)}
        />
      )}

      {printableDoc && (
        <ErpDocumentPrintModal
          docType={printableDoc.type}
          data={printableDoc.data}
          onClose={() => setPrintableDoc(null)}
        />
      )}
    </div>
  );
};
