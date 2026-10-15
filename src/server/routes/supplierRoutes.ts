import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { requirePermission } from '../middleware/rbac.ts';
import { SupplierService } from '../services/supplierService.ts';

export const supplierRouter = Router();

const createSupplierSchema = z.object({
  name: z.string().min(2, 'اسم المورد أو المصنع مطلوب'),
  tradeNameEn: z.string().optional(),
  supplierType: z.enum([
    'manufacturer',
    'trading_company',
    'shipping_line',
    'customs_broker',
    'inland_transporter',
    'warehouse',
    'inspection_agency',
    'packaging',
    'other',
  ]).optional(),
  status: z.enum(['active', 'pending_approval', 'verified', 'suspended', 'blacklisted', 'inactive']).optional(),
  country: z.string().optional(),
  city: z.string().min(2, 'المدينة مطلوبة'),
  address: z.string().optional(),
  phone: z.string().min(6, 'رقم الهاتف مطلوب'),
  secondaryPhone: z.string().optional(),
  whatsapp: z.string().optional(),
  wechat: z.string().optional(),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  website: z.string().optional(),
  taxNumber: z.string().optional(),
  businessLicense: z.string().optional(),
  categories: z.array(z.string()).optional(),
  paymentTerms: z.string().optional(),
  defaultCurrency: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIbanSwift: z.string().optional(),
  bankBranch: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  tier: z.enum(['A', 'B', 'C', 'D']).optional(),
  leadTimeDays: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
  complianceNotes: z.string().optional(),
  primaryContactName: z.string().optional(),
  primaryContactJobTitle: z.string().optional(),
  primaryContactPhone: z.string().optional(),
  primaryContactEmail: z.string().optional(),
  primaryContactWechat: z.string().optional(),
});

const updateSupplierSchema = createSupplierSchema.partial();

// GET /api/suppliers - List suppliers (fast, paginated, scalable for 200+ and thousands)
supplierRouter.get(
  '/',
  authenticate,
  requirePermission('suppliers:view', 'procurement:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        page = '1',
        limit = '25',
        search = '',
        country = 'all',
        city = 'all',
        supplierType = 'all',
        status = 'all',
        tier = 'all',
        rating = '0',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query as Record<string, string>;

      const result = await SupplierService.listSuppliers({
        page: Number(page),
        limit: Number(limit),
        search,
        country,
        city,
        supplierType,
        status,
        tier,
        rating: Number(rating),
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      return res.json({ success: true, data: result.suppliers, pagination: result.pagination });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

// GET /api/suppliers/check-duplicate - Check duplicate
supplierRouter.get(
  '/check-duplicate',
  authenticate,
  requirePermission('suppliers:view', 'procurement:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { phone, name, businessLicense, excludeId } = req.query as Record<string, string>;
      const check = await SupplierService.checkDuplicate({
        phone,
        name,
        businessLicense,
        excludeId,
      });
      return res.json({ success: true, data: check });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

// GET /api/suppliers/export - Export suppliers to CSV/Excel
supplierRouter.get(
  '/export',
  authenticate,
  requirePermission('suppliers:export', 'export:data', 'suppliers:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allSuppliers = await SupplierService.exportSuppliers();
      return res.json({ success: true, data: allSuppliers });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

// GET /api/suppliers/:id - Single supplier profile
supplierRouter.get(
  '/:id',
  authenticate,
  requirePermission('suppliers:view', 'procurement:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const supplier = await SupplierService.getSupplierById(req.params.id);
      if (!supplier) {
        return res.status(404).json({ success: false, error: { message: 'المورد غير موجود' } });
      }
      return res.json({ success: true, data: supplier });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

// POST /api/suppliers - Create new supplier
supplierRouter.post(
  '/',
  authenticate,
  requirePermission('suppliers:create', 'procurement:create_po'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parse = createSupplierSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'بيانات المورد غير صحيحة' },
        });
      }

      const input = {
        ...parse.data,
        email: parse.data.email || undefined,
      };

      const created = await SupplierService.createSupplier(
        input as any,
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role?.code || 'user',
        },
        req.ip,
        req.headers['user-agent']
      );

      return res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

// POST /api/suppliers/bulk-import - Scalable batch import for 200+ suppliers
supplierRouter.post(
  '/bulk-import',
  authenticate,
  requirePermission('suppliers:import', 'settings:manage', 'super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'يجب إرسال مصفوفة items تحتوي على سجلات الموردين' },
        });
      }

      const result = await SupplierService.bulkImportSuppliers(
        items,
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role?.code || 'user',
        },
        req.ip,
        req.headers['user-agent']
      );

      return res.json({ success: true, data: result });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

// PUT /api/suppliers/:id - Update supplier
supplierRouter.put(
  '/:id',
  authenticate,
  requirePermission('suppliers:edit', 'procurement:create_po'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parse = updateSupplierSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'بيانات المورد غير صحيحة' },
        });
      }

      const updated = await SupplierService.updateSupplier(
        req.params.id,
        parse.data as any,
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role?.code || 'user',
        },
        req.ip,
        req.headers['user-agent']
      );

      return res.json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

// DELETE /api/suppliers/:id - Deactivate supplier
supplierRouter.delete(
  '/:id',
  authenticate,
  requirePermission('suppliers:delete', 'super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const archived = await SupplierService.deleteSupplier(
        req.params.id,
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role?.code || 'user',
        },
        req.ip,
        req.headers['user-agent']
      );

      return res.json({ success: true, data: archived, message: 'تم تعطيل حساب المورد بنجاح' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);
