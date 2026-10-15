import { DEFAULT_WHATSAPP_NUMBER } from './constants';

export function getWhatsAppLink(customMessage?: string, number?: string): string {
  const targetNumber =
    number && number !== 'WHATSAPP_NUMBER'
      ? number.replace(/[^0-9]/g, '')
      : DEFAULT_WHATSAPP_NUMBER.replace(/[^0-9]/g, '');

  const defaultMsg = 'مرحباً شركة سهلا للخدمات اللوجستية، أود الاستفسار عن الشحن والاستيراد.';
  const text = encodeURIComponent(customMessage || defaultMsg);

  return `https://wa.me/${targetNumber}?text=${text}`;
}

export type WhatsAppMilestoneType =
  | 'order_received'
  | 'inspection_passed'
  | 'shipped_sailing'
  | 'arrived_port_sudan'
  | 'customs_cleared'
  | 'trucking_dispatched'
  | 'delivered_pod'
  | 'payment_receipt';

export interface WhatsAppMilestoneData {
  customerName: string;
  requestCode: string;
  shipmentCode?: string;
  blNumber?: string;
  containerNumber?: string;
  portOfOrigin?: string;
  carrier?: string;
  destinationCity?: string;
  truckNumber?: string;
  driverPhone?: string;
  amount?: number;
  currency?: string;
  receiptCode?: string;
  eta?: string;
}

export function generateMilestoneWhatsAppMessage(
  type: WhatsAppMilestoneType,
  data: WhatsAppMilestoneData
): string {
  const greeting = `السيد / السيدة: *${data.customerName}* المحترم 🌸\nتحية طيبة من *شركة سهلا للتجارة الدولية والخدمات اللوجستية*.`;

  switch (type) {
    case 'order_received':
      return (
        `${greeting}\n\n` +
        `✅ تم تأكيد استلام طلبكم المركزي رقم: *[${data.requestCode}]* بنجاح.\n` +
        `فريق العمليات والمشتريات باشر بالتنسيق مع المصانع بالصين، وسيصلكم تحديث فور اكتمال التجهيز الفني.`
      );

    case 'inspection_passed':
      return (
        `${greeting}\n\n` +
        `🔍 *تحديث فحص الجودة بالصين (QC Inspection)*:\n` +
        `يسرنا إبلاغكم بنجاح الفحص الفني والمطابقة للبضاعة الخاصة بطلبكم *[${data.requestCode}]* لدى المصنع.\n` +
        `النتيجة: *مطابق 100% وجاهز للشحن والتعبئة للحاوية*.`
      );

    case 'shipped_sailing':
      return (
        `${greeting}\n\n` +
        `🚢 *إبحار الشحنة رسمياً (Shipment Sailed)*:\n` +
        `طلبكم: *[${data.requestCode}]*\n` +
        `رقم التتبع: *[${data.shipmentCode || 'SHL-CENTRAL'}]*\n` +
        `بوليصة الشحن (B/L): *${data.blNumber || 'صدرت'}*\n` +
        `رقم الحاوية: *${data.containerNumber || '40ft HQ'}*\n` +
        `الخط الملاحي: *${data.carrier || 'COSCO Lines'}*\n` +
        `الميناء: من *${data.portOfOrigin || 'قوانغتشو / نينغبو'}* إلى *ميناء بورتسودان الجنوبي*.\n` +
        `الوصول التقديري (ETA): *${data.eta || 'خلال 18-22 يوماً'}* بإذن الله.`
      );

    case 'arrived_port_sudan':
      return (
        `${greeting}\n\n` +
        `⚓ *وصول الباخرة لميناء بورتسودان الجنوبي*:\n` +
        `وصلت الباخرة الحاملة لحاويتكم بالسلامة لميناء بورتسودان الجنوبي (شحنة: *${data.shipmentCode}*).\n` +
        `باشر فريق التخليص الجمركي لشركة سهلا إجراءات الكشف والمناولة والتثبت من المواصفات SSMO.`
      );

    case 'customs_cleared':
      return (
        `${greeting}\n\n` +
        `🛃 *الإفراج الجمركي الرسمي بميناء بورتسودان*:\n` +
        `يسرنا إخطاركم بصدور الإفراج الجمركي ودفع الرسوم والمناولة للشحنة *[${data.requestCode}]* بنجاح.\n` +
        `يجري الآن تجهيز الشاحنة للنقل والتفويج الداخلي إلى *${data.destinationCity || 'وجهتكم'}*.`
      );

    case 'trucking_dispatched':
      return (
        `${greeting}\n\n` +
        `🚚 *تفويج الشاحنة للنقل الداخلي (Inland Trucking)*:\n` +
        `تحركت الشاحنة الناقلة لبضاعتكم من ميناء بورتسودان باتجاه: *${data.destinationCity || 'المخازن'}*.\n` +
        `رقم الشاحنة: *${data.truckNumber || 'شاحنة سهلا'}*\n` +
        `هاتف السائق للتنسيق: *${data.driverPhone || 'فريق سهلا'}*.\n` +
        `المتوقع الوصول والتفريغ خلال 48-72 ساعة بإذن الله.`
      );

    case 'delivered_pod':
      return (
        `${greeting}\n\n` +
        `🎉 *تم تسليم البضاعة بنجاح (Proof of Delivery)*:\n` +
        `تم بحمد الله تسليم الشحنة كاملة ومطابقة للمواصفات وسند الاستلام *[POD]* لطلبكم *[${data.requestCode}]*.\n` +
        `سعدنا جداً بخدمتكم في شركة سهلا، ونتطلع لشراكة تجارية مستمرة وناجحة!`
      );

    case 'payment_receipt':
      return (
        `${greeting}\n\n` +
        `💳 *سند قبض وتحصيل مالي رسمي*:\n` +
        `تم بنجاح قيد وتأكيد استلام دفعتكم المالية بمبلغ: *${Number(data.amount || 0).toLocaleString()} ${data.currency || 'USD'}*.\n` +
        `رقم السند: *${data.receiptCode || 'REC-OFFICIAL'}* عن الطلب: *${data.requestCode}*.\n` +
        `شاكرين لكم حسن تعاملكم والتزامكم المالي.`
      );
  }
}
