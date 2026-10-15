import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { requirePermission } from '../middleware/rbac.ts';
import { ContactService } from '../services/contactService.ts';
import { DocumentService } from '../services/documentService.ts';

export const contactRouter = Router();

const createContactSchema = z.object({
  entityType: z.enum(['customer', 'supplier']),
  customerId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  name: z.string().min(2, 'الاسم مطلوب'),
  nameEn: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().min(5, 'رقم الهاتف مطلوب'),
  mobile: z.string().optional(),
  whatsapp: z.string().optional(),
  wechat: z.string().optional(),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  isPrimary: z.boolean().optional(),
  notes: z.string().optional(),
});

const updateContactSchema = createContactSchema.partial();

// GET /api/contacts - List contacts for entity
contactRouter.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { entityType, entityId } = req.query as { entityType: 'customer' | 'supplier'; entityId: string };
      if (!entityType || !entityId) {
        return res.status(400).json({ success: false, error: { message: 'entityType و entityId مطلوبان' } });
      }

      const list = await ContactService.listContacts(entityType, entityId);
      return res.json({ success: true, data: list });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

// GET /api/contacts/:id - Single contact
contactRouter.get(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const contact = await ContactService.getContactById(req.params.id);
      if (!contact) {
        return res.status(404).json({ success: false, error: { message: 'جهة الاتصال غير موجودة' } });
      }
      return res.json({ success: true, data: contact });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

// POST /api/contacts - Create contact
contactRouter.post(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parse = createContactSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'بيانات غير صالحة' },
        });
      }

      const created = await ContactService.createContact(
        parse.data as any,
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

// PUT /api/contacts/:id - Update contact
contactRouter.put(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parse = updateContactSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'بيانات غير صالحة' },
        });
      }

      const updated = await ContactService.updateContact(
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

// PATCH /api/contacts/:id/primary - Set as primary contact
contactRouter.patch(
  '/:id/primary',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updated = await ContactService.setPrimaryContact(
        req.params.id,
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role?.code || 'user',
        },
        req.ip,
        req.headers['user-agent']
      );

      return res.json({ success: true, data: updated, message: 'تم تعيين جهة الاتصال الرئيسية' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

// DELETE /api/contacts/:id - Delete contact
contactRouter.delete(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await ContactService.deleteContact(
        req.params.id,
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role?.code || 'user',
        },
        req.ip,
        req.headers['user-agent']
      );

      return res.json({ success: true, message: 'تم حذف جهة الاتصال' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);

// =========================================================================
// PARTY DOCUMENTS ROUTES
// =========================================================================
export const partyDocumentRouter = Router();

const createDocSchema = z.object({
  entityType: z.enum(['customer', 'supplier', 'request']),
  customerId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  requestId: z.string().uuid().optional(),
  title: z.string().min(2, 'عنوان الوثيقة مطلوب'),
  documentType: z.string().min(2, 'نوع الوثيقة مطلوب'),
  documentNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  notes: z.string().optional(),
});

// GET /api/party-documents - List docs
partyDocumentRouter.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { entityType, entityId } = req.query as { entityType: 'customer' | 'supplier' | 'request'; entityId: string };
      if (!entityType || !entityId) {
        return res.status(400).json({ success: false, error: { message: 'entityType و entityId مطلوبان' } });
      }

      const docs = await DocumentService.listDocuments(entityType, entityId);
      return res.json({ success: true, data: docs });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
);

// POST /api/party-documents - Add doc
partyDocumentRouter.post(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parse = createDocSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'بيانات غير صالحة' },
        });
      }

      const created = await DocumentService.addDocument(
        {
          ...parse.data,
          expiryDate: parse.data.expiryDate ? new Date(parse.data.expiryDate) : undefined,
        },
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

// DELETE /api/party-documents/:id - Delete doc
partyDocumentRouter.delete(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await DocumentService.deleteDocument(
        req.params.id,
        {
          id: req.user!.id,
          name: req.user!.name,
          role: req.user!.role?.code || 'user',
        },
        req.ip,
        req.headers['user-agent']
      );

      return res.json({ success: true, message: 'تم حذف الوثيقة' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
);
