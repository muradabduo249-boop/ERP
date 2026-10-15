import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { requirePermission } from '../middleware/rbac.ts';
import { CustomerService } from '../services/customerService.ts';

export const customerRouter = Router();

const createCustomerSchema = z.object({
  companyName: z.string().min(2, 'اسم الشركة أو العميل مطلوب ولا يقل عن حرفين'),
  tradeName: z.string().optional(),
  customerType: z.enum(['commercial', 'industrial', 'startup', 'individual', 'government']).optional(),
  status: z.enum(['active', 'lead', 'suspended', 'blacklisted', 'inactive']).optional(),
  phone: z.string().min(6, 'رقم الهاتف مطلوب ولا يقل عن 6 أرقام'),
  secondaryPhone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة').optional().or(z.literal('')),
  website: z.string().optional(),
  taxNumber: z.string().optional(),
  commercialRegister: z.string().optional(),
  nationalIdOrPassport: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  deliveryAddress: z.string().optional(),
  paymentTerms: z.string().optional(),
  creditLimit: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  assignedSalesRepId: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().optional(),
  primaryContactName: z.string().optional(),
  primaryContactJobTitle: z.string().optional(),
  primaryContactPhone: z.string().optional(),
  primaryContactEmail: z.string().optional(),
  primaryContactWechat: z.string().optional(),
});

const updateCustomerSchema = createCustomerSchema.partial();

// GET /api/customers - List customers with search, filter, pagination
customerRouter.get(
  '/',
  authenticate,
  requirePermission('customers:view', 'crm:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        page = '1',
        limit = '25',
        search = '',
        status = 'all',
        customerType = 'all',
        city = 'all',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query as Record<string, string>;

      const result = await CustomerService.listCustomers({
        page: Number(page),
        limit: Number(limit),
        search,
        status,
        customerType,
        city,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      return res.json({ success: true, data: result.customers, pagination: result.pagination });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

// GET /api/customers/check-duplicate - Check duplicate before submit
customerRouter.get(
  '/check-duplicate',
  authenticate,
  requirePermission('customers:view', 'crm:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { phone, companyName, taxNumber, commercialRegister, excludeId } = req.query as Record<string, string>;
      const check = await CustomerService.checkDuplicate({
        phone,
        companyName,
        taxNumber,
        commercialRegister,
        excludeId,
      });
      return res.json({ success: true, data: check });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

// GET /api/customers/export - Export customers to CSV/Excel format
customerRouter.get(
  '/export',
  authenticate,
  requirePermission('customers:export', 'export:data', 'customers:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allCustomers = await CustomerService.exportCustomers();
      return res.json({ success: true, data: allCustomers });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

// GET /api/customers/:id - Single customer with contacts and documents
customerRouter.get(
  '/:id',
  authenticate,
  requirePermission('customers:view', 'crm:view'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customer = await CustomerService.getCustomerById(req.params.id);
      if (!customer) {
        return res.status(404).json({ success: false, error: { message: 'العميل غير موجود' } });
      }
      return res.json({ success: true, data: customer });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

// POST /api/customers - Create new customer
customerRouter.post(
  '/',
  authenticate,
  requirePermission('customers:create', 'crm:create'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parse = createCustomerSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'بيانات العميل غير مكتملة' },
        });
      }

      const input = {
        ...parse.data,
        assignedSalesRepId: parse.data.assignedSalesRepId || undefined,
        email: parse.data.email || undefined,
      };

      const created = await CustomerService.createCustomer(
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

// PUT /api/customers/:id - Update customer
customerRouter.put(
  '/:id',
  authenticate,
  requirePermission('customers:edit', 'crm:edit'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parse = updateCustomerSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'بيانات العميل غير صالحة' },
        });
      }

      const updated = await CustomerService.updateCustomer(
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

// DELETE /api/customers/:id - Deactivate customer
customerRouter.delete(
  '/:id',
  authenticate,
  requirePermission('customers:delete', 'super_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const archived = await CustomerService.deleteCustomer(
        req.params.id,
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role?.code || 'user',
        },
        req.ip,
        req.headers['user-agent']
      );

      return res.json({ success: true, data: archived, message: 'تم تعطيل حساب العميل بنجاح' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);
