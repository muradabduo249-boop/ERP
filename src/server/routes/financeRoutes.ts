import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';
import { requirePermission } from '../middleware/rbac.ts';
import { FinanceService } from '../services/financeService.ts';

export const financeRouter = Router();

// Apply auth to all finance routes
financeRouter.use(requireAuth);

const getActor = (req: AuthenticatedRequest) => ({
  id: req.user!.id,
  name: req.user!.name,
  role: req.user!.role?.code,
});

// =========================================================================
// 1. TREASURY ACCOUNTS
// =========================================================================

financeRouter.get(
  '/treasury/accounts',
  requirePermission('finance:view', 'finance:treasury'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const accounts = await FinanceService.listTreasuryAccounts();
      res.json({ success: true, data: accounts });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

financeRouter.get(
  '/treasury/accounts/:id',
  requirePermission('finance:view', 'finance:treasury'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const account = await FinanceService.getTreasuryAccountById(req.params.id);
      res.json({ success: true, data: account });
    } catch (error: any) {
      res.status(404).json({ success: false, error: { message: error.message } });
    }
  }
);

financeRouter.post(
  '/treasury/accounts',
  requirePermission('finance:treasury'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const account = await FinanceService.createTreasuryAccount(req.body, getActor(req));
      res.status(201).json({ success: true, data: account });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

financeRouter.patch(
  '/treasury/accounts/:id',
  requirePermission('finance:treasury'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const account = await FinanceService.updateTreasuryAccount(req.params.id, req.body, getActor(req));
      res.json({ success: true, data: account });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

// =========================================================================
// 2. TREASURY TRANSACTIONS (LEDGER)
// =========================================================================

financeRouter.get(
  '/treasury/transactions',
  requirePermission('finance:view', 'finance:treasury'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const accountId = req.query.accountId as string | undefined;
      const transactionType = req.query.transactionType as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

      const transactions = await FinanceService.listTreasuryTransactions({
        accountId,
        transactionType,
        limit,
        offset,
      });
      res.json({ success: true, data: transactions });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

// =========================================================================
// 3. TREASURY TRANSFERS
// =========================================================================

financeRouter.post(
  '/treasury/transfers',
  requirePermission('finance:transfer', 'finance:treasury'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const transfer = await FinanceService.transferFunds(req.body, getActor(req));
      res.status(201).json({ success: true, data: transfer });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

// =========================================================================
// 4. TREASURY RECONCILIATIONS
// =========================================================================

financeRouter.get(
  '/treasury/reconciliations',
  requirePermission('finance:view', 'finance:treasury'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const accountId = req.query.accountId as string | undefined;
      const reconciliations = await FinanceService.listReconciliations(accountId);
      res.json({ success: true, data: reconciliations });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

financeRouter.post(
  '/treasury/reconciliations',
  requirePermission('finance:reconcile', 'finance:treasury'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const recon = await FinanceService.createReconciliation(req.body, getActor(req));
      res.status(201).json({ success: true, data: recon });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

financeRouter.post(
  '/treasury/reconciliations/:id/approve',
  requirePermission('finance:approve_payment', 'finance:treasury'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { approved, notes } = req.body;
      const recon = await FinanceService.approveReconciliation(
        req.params.id,
        approved !== false,
        notes,
        getActor(req)
      );
      res.json({ success: true, data: recon });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

// =========================================================================
// 5. SUPPLIER INVOICES
// =========================================================================

financeRouter.get(
  '/supplier-invoices',
  requirePermission('finance:view', 'finance:payables'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const supplierId = req.query.supplierId as string | undefined;
      const purchaseOrderId = req.query.purchaseOrderId as string | undefined;
      const status = req.query.status as string | undefined;

      const invoices = await FinanceService.listSupplierInvoices({
        supplierId,
        purchaseOrderId,
        status,
      });
      res.json({ success: true, data: invoices });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

financeRouter.get(
  '/supplier-invoices/:id',
  requirePermission('finance:view', 'finance:payables'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const invoice = await FinanceService.getSupplierInvoiceById(req.params.id);
      res.json({ success: true, data: invoice });
    } catch (error: any) {
      res.status(404).json({ success: false, error: { message: error.message } });
    }
  }
);

financeRouter.post(
  '/supplier-invoices',
  requirePermission('finance:invoicing', 'finance:payables'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const invoice = await FinanceService.createSupplierInvoice(req.body, getActor(req));
      res.status(201).json({ success: true, data: invoice });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

// =========================================================================
// 6. PAYMENT VOUCHERS (سندات الصرف)
// =========================================================================

financeRouter.get(
  '/payment-vouchers',
  requirePermission('finance:view', 'finance:payables'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const supplierId = req.query.supplierId as string | undefined;
      const treasuryAccountId = req.query.treasuryAccountId as string | undefined;

      const vouchers = await FinanceService.listPaymentVouchers({
        status,
        supplierId,
        treasuryAccountId,
      });
      res.json({ success: true, data: vouchers });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

financeRouter.get(
  '/payment-vouchers/:id',
  requirePermission('finance:view', 'finance:payables'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const voucher = await FinanceService.getPaymentVoucherById(req.params.id);
      res.json({ success: true, data: voucher });
    } catch (error: any) {
      res.status(404).json({ success: false, error: { message: error.message } });
    }
  }
);

financeRouter.post(
  '/payment-vouchers',
  requirePermission('finance:create_voucher', 'finance:payables'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const voucher = await FinanceService.createPaymentVoucher(req.body, getActor(req));
      res.status(201).json({ success: true, data: voucher });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

/**
 * APPROVE PAYMENT VOUCHER
 * Strict dual-control: prevents self-approval on server-side
 */
financeRouter.post(
  '/payment-vouchers/:id/approve',
  requirePermission('finance:approve_voucher', 'finance:approve_payment'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const voucher = await FinanceService.approvePaymentVoucher(req.params.id, getActor(req));
      res.json({ success: true, data: voucher });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

/**
 * POST PAYMENT VOUCHER (خصم من الخزينة وترحيل القيد)
 */
financeRouter.post(
  '/payment-vouchers/:id/post',
  requirePermission('finance:post_voucher', 'finance:payables'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const voucher = await FinanceService.postPaymentVoucher(req.params.id, getActor(req));
      res.json({ success: true, data: voucher });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

// =========================================================================
// 7. CUSTOMER INVOICES
// =========================================================================

financeRouter.get(
  '/customer-invoices',
  requirePermission('finance:view', 'finance:invoicing'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = req.query.customerId as string | undefined;
      const requestId = req.query.requestId as string | undefined;
      const status = req.query.status as string | undefined;

      const invoices = await FinanceService.listCustomerInvoices({
        customerId,
        requestId,
        status,
      });
      res.json({ success: true, data: invoices });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

financeRouter.get(
  '/customer-invoices/:id',
  requirePermission('finance:view', 'finance:invoicing'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const invoice = await FinanceService.getCustomerInvoiceById(req.params.id);
      res.json({ success: true, data: invoice });
    } catch (error: any) {
      res.status(404).json({ success: false, error: { message: error.message } });
    }
  }
);

financeRouter.post(
  '/customer-invoices',
  requirePermission('finance:invoicing'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const invoice = await FinanceService.createCustomerInvoice(req.body, getActor(req));
      res.status(201).json({ success: true, data: invoice });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

// =========================================================================
// 8. RECEIPT VOUCHERS (سندات القبض)
// =========================================================================

financeRouter.get(
  '/receipt-vouchers',
  requirePermission('finance:view', 'finance:receipts'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = req.query.customerId as string | undefined;
      const treasuryAccountId = req.query.treasuryAccountId as string | undefined;
      const customerInvoiceId = req.query.customerInvoiceId as string | undefined;

      const vouchers = await FinanceService.listReceiptVouchers({
        customerId,
        treasuryAccountId,
        customerInvoiceId,
      });
      res.json({ success: true, data: vouchers });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

financeRouter.get(
  '/receipt-vouchers/:id',
  requirePermission('finance:view', 'finance:receipts'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const voucher = await FinanceService.getReceiptVoucherById(req.params.id);
      res.json({ success: true, data: voucher });
    } catch (error: any) {
      res.status(404).json({ success: false, error: { message: error.message } });
    }
  }
);

financeRouter.post(
  '/receipt-vouchers',
  requirePermission('finance:receipts', 'finance:create_voucher'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const voucher = await FinanceService.createReceiptVoucher(req.body, getActor(req));
      res.status(201).json({ success: true, data: voucher });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

// =========================================================================
// 9. EXCHANGE RATES
// =========================================================================

financeRouter.get(
  '/exchange-rates',
  requirePermission('finance:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const rates = await FinanceService.listExchangeRates();
      res.json({ success: true, data: rates });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

financeRouter.post(
  '/exchange-rates',
  requirePermission('finance:rates', 'finance:treasury'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const rate = await FinanceService.setExchangeRate(req.body, getActor(req));
      res.status(201).json({ success: true, data: rate });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

// =========================================================================
// 10. PRODUCT CATALOG ROUTES
// =========================================================================

export const productRouter = Router();
productRouter.use(requireAuth);

productRouter.get(
  '/categories',
  requirePermission('products:view', 'procurement:view', 'finance:view', 'requests:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const categories = await FinanceService.listProductCategories();
      res.json({ success: true, data: categories });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

productRouter.post(
  '/categories',
  requirePermission('products:manage', 'procurement:create_po', 'procurement:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const category = await FinanceService.createProductCategory(req.body, getActor(req));
      res.status(201).json({ success: true, data: category });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

productRouter.get(
  '/',
  requirePermission('products:view', 'procurement:view', 'finance:view', 'requests:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const categoryId = req.query.categoryId as string | undefined;
      const supplierId = req.query.supplierId as string | undefined;
      const status = req.query.status as string | undefined;

      const productsList = await FinanceService.listProducts({
        categoryId,
        supplierId,
        status,
      });
      res.json({ success: true, data: productsList });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

productRouter.get(
  '/:id',
  requirePermission('products:view', 'procurement:view', 'finance:view', 'requests:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const product = await FinanceService.getProductById(req.params.id);
      res.json({ success: true, data: product });
    } catch (error: any) {
      res.status(404).json({ success: false, error: { message: error.message } });
    }
  }
);

productRouter.post(
  '/',
  requirePermission('products:manage', 'procurement:create_po', 'procurement:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const product = await FinanceService.createProduct(req.body, getActor(req));
      res.status(201).json({ success: true, data: product });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

productRouter.patch(
  '/:id',
  requirePermission('products:manage', 'procurement:create_po', 'procurement:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const product = await FinanceService.updateProduct(req.params.id, req.body, getActor(req));
      res.json({ success: true, data: product });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);
