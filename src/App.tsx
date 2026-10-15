import React from 'react';
import { ErpLayout } from './erp/components/ErpLayout';
import { ErpAuthProvider } from './erp/context/ErpAuthContext';

/**
 * منصة سهلا لإدارة العمليات والتجارة الدولية (SAHLA Standalone ERP)
 * نظام مستقل بذاته بنسبة 100% لإدارة سلاسل الإمداد، المشتريات، الشحن، المالية، والتخليص الجمركي
 */
export default function App() {
  return (
    <ErpAuthProvider>
      <ErpLayout />
    </ErpAuthProvider>
  );
}
